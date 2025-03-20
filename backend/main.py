from fastapi import FastAPI, UploadFile, File, HTTPException, BackgroundTasks, WebSocket, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
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
from ultralytics.nn.tasks import DetectionModel
from resumefilter import process_resumes
from jobdescgen import generate_job_requirements 
from exam import websocket_endpoint, get_logs
from applications import create_application_feedback, register_company, CompanyResponse, get_application_feedback, get_company_jobs, get_job_by_id
from database.database import get_db
from sqlalchemy.orm import Session
from schemas.schemas import ApplicationFeedbackPayload, JobResponse, ApplicationFeedbackRequest

# Set environment variable to disable the new security behavior
os.environ['TORCH_FORCE_WEIGHTS_ONLY'] = '0'

app = FastAPI(title="HR AI Tool API")

# # Load YOLOv8 model with weights_only=False
# model = YOLO("yolov8n.pt", task="detect")

# # MediaPipe Face Mesh
# mp_face_mesh = mp.solutions.face_mesh
# face_mesh = mp_face_mesh.FaceMesh(static_image_mode=False, max_num_faces=5)

# # Detection log and honesty score tracking
# detection_log = []
# total_frames = 0
# penalty_frames = 0

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

class AssessmentRequest(BaseModel):
    difficulty: int
    properties: dict
    type: str
    title: str

class ApplicationFeedbackRequest(BaseModel):
    company_id: int
    job_title: str
    job_description: Optional[str] = None
    requirements: Optional[str] = None
    properties: Optional[dict] = None
    assessments: List[AssessmentRequest]

class CompanyRegistrationRequest(BaseModel):
    name: str
    departments: Optional[List[str]] = None
    locations: Optional[List[str]] = None
    company_size: Optional[int] = None
    website: Optional[str] = None

class CandidateApplicationRequest(BaseModel):
    company_id: int
    job_id: int
    name: str
    email: EmailStr
    phone: Optional[str] = None
    resume_url: Optional[str] = None
    additional_info: Optional[str] = None

# Routes
class JobDescriptionRequest(BaseModel):
    job_title: str
    job_description: str
    job_requirements: str
    job_responsibilities: str
    job_qualifications: str
    job_salary: str

app.websocket("/ws")(websocket_endpoint)
app.get("/logs")(get_logs)

@app.get("/")
async def root():
    return {"message": "HR AI Tool API"}

@app.post("/api/application/feedback")
async def submit_application_feedback(
    request: ApplicationFeedbackRequest,
    db: Session = Depends(get_db)
):
    """
    Submit job application feedback and create company/job records in the database.
    """
    return await create_application_feedback(
        db=db,
        job_data=request
    )

@app.post("/api/resume/analyze")
async def analyze_resume(background_tasks: BackgroundTasks):
    try:
        background_tasks.add_task(process_resumes)
        return {
            "message": "Resume analysis started",
            "status": "processing"
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
    
@app.post("/job_description/generate")
async def generate_job_description(request: JobDescriptionRequest):
    try:
        #TODO: Implement job description generation logic
        job_description = generate_job_requirements(request.job_title, request.job_description, request.job_requirements, request.job_responsibilities, request.job_qualifications, request.job_salary)
        return {
            "job_description": job_description,
            "message": "Job description generation started",
            "status": "processing"
        }
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

@app.post("/api/companies/register", response_model=CompanyResponse)
async def register_new_company(
    request: CompanyRegistrationRequest,
    db: Session = Depends(get_db)
):
    """
    Register a new company in the system.
    """
    print(f"Received request to register company: {request.name}")
    return await register_company(
        db=db,
        name=request.name,
        departments=request.departments,
        locations=request.locations,
        company_size=request.company_size,
        website=request.website
    )

@app.post("/api/candidates/apply")
async def submit_candidate_application(
    request: ApplicationFeedbackPayload,
    db: Session = Depends(get_db)
):
    """
    Submit a new candidate application and get feedback URL.
    
    Args:
        request: ApplicationFeedbackPayload containing candidate and application details
        db: Database session
    
    Returns:
        dict: Response containing the application feedback and candidate details
    """
    return await get_application_feedback(
        db=db,
        payload=request
    )

@app.get("/api/companies/{company_id}/jobs", response_model=List[JobResponse])
async def get_jobs_for_company(
    company_id: int,
    db: Session = Depends(get_db)
):
    """
    Get all jobs for a specific company.
    
    Args:
        company_id: ID of the company
        db: Database session
    
    Returns:
        List[JobResponse]: List of jobs with company details
    """
    return await get_company_jobs(db=db, company_id=company_id)

@app.get("/api/jobs/{job_id}", response_model=JobResponse)
async def get_job(
    job_id: int,
    db: Session = Depends(get_db)
):
    """
    Get a specific job by ID.
    
    Args:
        job_id: ID of the job
        db: Database session
    
    Returns:
        JobResponse: Job details with company details and candidate count
    """
    return await get_job_by_id(db=db, job_id=job_id)

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True) 