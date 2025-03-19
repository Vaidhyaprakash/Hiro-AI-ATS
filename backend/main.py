from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import uvicorn
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime
import cv2
import numpy as np
from ultralytics import YOLO
import base64
import asyncio
import mediapipe as mp
import torch
import os

# Set environment variable to disable the new security behavior
os.environ['TORCH_FORCE_WEIGHTS_ONLY'] = '0'

app = FastAPI(title="HR AI Tool API")

# Load YOLOv8 model with weights_only=False
model = YOLO("yolov8n.pt", task="detect")

# MediaPipe Face Mesh
mp_face_mesh = mp.solutions.face_mesh
face_mesh = mp_face_mesh.FaceMesh(static_image_mode=False, max_num_faces=5)

# Detection log and honesty score tracking
detection_log = []
total_frames = 0
penalty_frames = 0

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Models
class QuestionGenerationRequest(BaseModel):
    topic: str
    question_type: str
    num_questions: int
    difficulty: str
    additional_requirements: Optional[str] = None

class Question(BaseModel):
    question: str
    options: Optional[List[str]] = None
    answer: Optional[str] = None

# Routes

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    global total_frames, penalty_frames

    try:
        while True:
            data = await websocket.receive_text()
            image_data = base64.b64decode(data)
            np_data = np.frombuffer(image_data, np.uint8)
            frame = cv2.imdecode(np_data, cv2.IMREAD_COLOR)

            # YOLO - Detect phones (class 67)
            results = model.predict(frame, conf=0.5, classes=[67])
            detections = results[0].boxes.data.cpu().numpy()
            phone_detected = len(detections) > 0

            # Draw YOLO detections
            for det in detections:
                x1, y1, x2, y2, conf, cls = det
                cv2.rectangle(frame, (int(x1), int(y1)), (int(x2), int(y2)), (0, 0, 255), 2)
                cv2.putText(frame, "Phone", (int(x1), int(y1) - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 0, 255), 2)

            # MediaPipe Face Mesh
            face_away_detected = False
            no_face_detected = False
            multiple_faces_detected = False

            rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            face_results = face_mesh.process(rgb_frame)

            if face_results.multi_face_landmarks:
                face_count = len(face_results.multi_face_landmarks)

                if face_count > 1:
                    multiple_faces_detected = True

                # Draw face landmarks
                for face_landmarks in face_results.multi_face_landmarks:
                    for lm in face_landmarks.landmark:
                        x, y = int(lm.x * frame.shape[1]), int(lm.y * frame.shape[0])
                        cv2.circle(frame, (x, y), 1, (0, 255, 0), -1)

                # Head pose estimation
                landmarks = face_results.multi_face_landmarks[0].landmark
                h, w, _ = frame.shape
                image_points = np.array([
                    [landmarks[1].x * w, landmarks[1].y * h],    # Nose tip
                    [landmarks[33].x * w, landmarks[33].y * h],  # Left eye
                    [landmarks[263].x * w, landmarks[263].y * h], # Right eye
                    [landmarks[61].x * w, landmarks[61].y * h],   # Left mouth corner
                    [landmarks[291].x * w, landmarks[291].y * h], # Right mouth corner
                    [landmarks[199].x * w, landmarks[199].y * h], # Left eyebrow
                    [landmarks[419].x * w, landmarks[419].y * h], # Right eyebrow
                    [landmarks[4].x * w, landmarks[4].y * h],     # Nose bridge
                    [landmarks[152].x * w, landmarks[152].y * h]  # Chin
                ], dtype="double")

                model_points = np.array([
                    [0.0, 0.0, 0.0], [ -30.0, -30.0, -30.0], [30.0, -30.0, -30.0],
                    [-30.0, 30.0, -30.0], [30.0, 30.0, -30.0], [-30.0, -40.0, -30.0],
                    [30.0, -40.0, -30.0], [0.0, -10.0, -30.0], [0.0, 40.0, -30.0]
                ])

                focal_length = w
                center = (w / 2, h / 2)
                camera_matrix = np.array([
                    [focal_length, 0, center[0]],
                    [0, focal_length, center[1]],
                    [0, 0, 1]
                ], dtype="double")

                try:
                    success, rotation_vector, _ = cv2.solvePnP(model_points, image_points, camera_matrix, None)
                    if success:
                        rmat, _ = cv2.Rodrigues(rotation_vector)
                        proj_matrix = np.hstack((rmat, np.zeros((3, 1))))
                        euler_angles, _, _, _, _, _, _ = cv2.decomposeProjectionMatrix(proj_matrix)
                        yaw = abs(euler_angles[1, 0])
                        if yaw > 20:
                            face_away_detected = True
                            cv2.putText(frame, "Face Away", (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 255), 2)
                except cv2.error as e:
                    print(f"Pose estimation error: {e}")
                    face_away_detected = True
            else:
                no_face_detected = True
                cv2.putText(frame, "No Face", (10, 60), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 255), 2)

            # Honesty score update
            total_frames += 1
            dishonesty_detected = phone_detected or face_away_detected or no_face_detected or multiple_faces_detected
            if dishonesty_detected:
                penalty_frames += 1
                detection_log.append({
                    "timestamp": datetime.now().isoformat(),
                    "frame": total_frames,
                    "event": f"{'Phone' if phone_detected else ''} {'Face Away' if face_away_detected else ''} {'No Face' if no_face_detected else ''} {'Multiple Faces' if multiple_faces_detected else ''}".strip()
                })

            honesty_score = round(100 * (1 - penalty_frames / total_frames), 2)

            # Log frame with timestamp
            print(f"Frame {total_frames} | Honesty Score: {honesty_score}% | Time: {datetime.now().isoformat()}")

            # Encode frame with annotations to base64 (optional)
            _, buffer = cv2.imencode('.jpg', frame)
            frame_base64 = base64.b64encode(buffer).decode('utf-8')

            await websocket.send_json({
                "frame": total_frames,
                "phone_detected": phone_detected,
                "face_away_detected": face_away_detected,
                "no_face_detected": no_face_detected,
                "multiple_faces_detected": multiple_faces_detected,
                "honesty_score": honesty_score,
                "timestamp": datetime.now().isoformat(),
                "annotated_frame": frame_base64  # optional: to display in frontend
            })

            await asyncio.sleep(0.1)

    except WebSocketDisconnect:
        print("Client disconnected")

@app.get("/logs")
async def get_logs():
    score = round(100 * (1 - penalty_frames / total_frames), 2) if total_frames > 0 else 100
    return {
        "detection_log": detection_log,
        "honesty_score": score
    }


@app.get("/")
async def root():
    return {"message": "HR AI Tool API"}

@app.post("/api/resume/analyze")
async def analyze_resume(file: UploadFile = File(...)):
    try:
        # TODO: Implement resume analysis logic
        return {
            "message": "Resume analysis completed",
            "filename": file.filename,
            "status": "success"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/questions/generate", response_model=List[Question])
async def generate_questions(request: QuestionGenerationRequest):
    try:
        # TODO: Implement question generation logic
        # This is a mock response
        questions = [
            Question(
                question=f"Sample question for {request.topic}",
                options=["Option A", "Option B", "Option C", "Option D"],
                answer="Option A"
            )
        ]
        return questions
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/video/analyze")
async def analyze_video(file: UploadFile = File(...)):
    try:
        # TODO: Implement video analysis logic
        return {
            "message": "Video analysis started",
            "filename": file.filename,
            "status": "processing"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True) 