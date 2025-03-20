from fastapi import WebSocket, WebSocketDisconnect, Depends
from datetime import datetime
import cv2
import numpy as np
import base64
import asyncio
import mediapipe as mp
from ultralytics import YOLO
import torch
from ultralytics.nn.tasks import DetectionModel
from sqlalchemy.orm import Session
from database.database import get_db
from models.models import CandidateAssessment

# Override torch.load default behavior
original_torch_load = torch.load
torch.load = lambda *args, **kwargs: original_torch_load(*args, weights_only=False, **kwargs)

# Load YOLOv8 model
model = YOLO("yolov8n.pt", task="detect")

# MediaPipe Face Mesh
mp_face_mesh = mp.solutions.face_mesh
face_mesh = mp_face_mesh.FaceMesh(static_image_mode=False, max_num_faces=5)

# Detection log and honesty score tracking
class CandidateSession:
    def __init__(self):
        self.detection_log = []
        self.total_frames = 0
        self.penalty_frames = 0
        self.last_honesty_score = 100.0

# Store sessions by candidate ID
candidate_sessions = {}

async def websocket_endpoint(websocket: WebSocket, candidate_id: int, db: Session = Depends(get_db)):
    await websocket.accept()
    
    # Initialize or get candidate session
    if candidate_id not in candidate_sessions:
        candidate_sessions[candidate_id] = CandidateSession()
    session = candidate_sessions[candidate_id]

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
            session.total_frames += 1
            dishonesty_detected = phone_detected or face_away_detected or no_face_detected or multiple_faces_detected
            if dishonesty_detected:
                session.penalty_frames += 1
                session.detection_log.append({
                    "timestamp": datetime.now().isoformat(),
                    "frame": session.total_frames,
                    "event": f"{'Phone' if phone_detected else ''} {'Face Away' if face_away_detected else ''} {'No Face' if no_face_detected else ''} {'Multiple Faces' if multiple_faces_detected else ''}".strip()
                })

            honesty_score = round(100 * (1 - session.penalty_frames / session.total_frames), 2)
            session.last_honesty_score = honesty_score

            # Log frame with timestamp
            print(f"Candidate {candidate_id} | Frame {session.total_frames} | Honesty Score: {honesty_score}% | Time: {datetime.now().isoformat()}")

            # Encode frame with annotations to base64 (optional)
            _, buffer = cv2.imencode('.jpg', frame)
            frame_base64 = base64.b64encode(buffer).decode('utf-8')

            await websocket.send_json({
                "frame": session.total_frames,
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
        print(f"Client disconnected for candidate {candidate_id}")
        # Update candidate assessment with final honesty score
        try:
            candidate_assessment = db.query(CandidateAssessment).filter(
                CandidateAssessment.candidate_id == candidate_id
            ).first()
            
            if candidate_assessment:
                candidate_assessment.honesty_score = session.last_honesty_score
                db.commit()
                print(f"Updated honesty score for candidate {candidate_id}: {session.last_honesty_score}%")
        except Exception as e:
            print(f"Error updating honesty score: {e}")
        finally:
            # Clean up session
            if candidate_id in candidate_sessions:
                del candidate_sessions[candidate_id]

async def get_logs(candidate_id: int):
    if candidate_id not in candidate_sessions:
        return {
            "detection_log": [],
            "honesty_score": 100
        }
    
    session = candidate_sessions[candidate_id]
    return {
        "detection_log": session.detection_log,
        "honesty_score": session.last_honesty_score
    } 