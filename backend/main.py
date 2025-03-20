from fastapi import FastAPI, UploadFile, File, HTTPException, BackgroundTasks, WebSocket, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
from typing import List, Optional
from models.models import CandidateAssessment, Assessment, AssessmentStatus
from sqlalchemy.orm import Session
from database.database import get_db
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
from schemas.schemas import ApplicationFeedbackPayload, JobResponse, ApplicationFeedbackRequest
import io
import sys
from models.models import Candidate, CandidateStatus, Job
from questionGenerator import generate_questions
from paperCorrection import correct_answer, paper_correction

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
    allow_origins=["*"],  # For development only, update in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"]
)

# Models
class QuestionGenerationRequest(BaseModel):
    topic: str
    question_type: str
    num_questions: int
    difficulty: str
    additional_requirements: Optional[str] = None

class QuestionSetGenerationRequest(BaseModel):
    num_mcq: int
    num_openended: int
    num_coding: int
    difficulty: str
    job_role: str
    skills: List[str]

class Answer(BaseModel):
    question_type: str
    question: str
    answer: str

class PaperCorrectionRequest(BaseModel):
    questions: List[Answer]

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

class CodeSubmission(BaseModel):
    code: str
    testCases: List[dict]
    examId: int

class ScoreSubmission(BaseModel):
    assessmentId: int
    candidateId: int
    score: float
    honestyScore: float
class CandidateResponse(BaseModel):
    id: Optional[int] = None
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    location: Optional[str] = None
    college: Optional[str] = None
    skills: Optional[str] = None
    resume_s3_url: Optional[str] = None
    assessment_score: Optional[float] = None
    resume_score: Optional[float] = None
    resume_summary: Optional[str] = None
    test_summary: Optional[str] = None
    status: Optional[str] = None
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

    class Config:
        from_attributes = True

@app.websocket("/ws/{candidate_id}")
async def websocket_handler(websocket: WebSocket, candidate_id: int, db: Session = Depends(get_db)):
    return await websocket_endpoint(websocket, candidate_id, db)

@app.get("/logs/{candidate_id}")
async def get_candidate_logs(candidate_id: int):
    return await get_logs(candidate_id)

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

# @app.post("/api/questions/generate", response_model=List[Question])
# async def generate_questions(request: QuestionGenerationRequest):
#     try:
#         # TODO: Implement question generation logic
#         # This is a mock response
#         questions = [
#             Question(
#                 question=f"Sample question for {request.topic}",
#                 options=["Option A", "Option B", "Option C", "Option D"],
#                 answer="Option A"
#             )
#         ]
#         return questions
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=str(e))
    
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

@app.post("/api/questions/generate")
async def question_set_generation(request: QuestionSetGenerationRequest):
    try:
        #TODO: Implement job description generation logic
        question_set = generate_questions(request.num_mcq, request.num_openended, request.num_coding, request.difficulty, request.job_role, request.skills)
        return question_set
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/correct-answer")
async def correct_question(request: Answer):
    try:
        #TODO: Implement job description generation logic
        mark = correct_answer(request.question, request.answer, request.question_type)
        return mark
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
@app.post("/api/paper/correction")
async def correct_paper(request: PaperCorrectionRequest):
    try:
        #TODO: Implement job description generation logic
        mark = paper_correction(request.questions)
        return mark
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

@app.post("/api/submit-code")
async def submit_code(submission: CodeSubmission):
    results = []
    
    for test_case in submission.testCases:
        # Create a string buffer to capture output
        output_buffer = io.StringIO()
        sys.stdout = output_buffer
        
        try:
            # Create a safe execution environment
            local_vars = {}
            exec(submission.code, {"__builtins__": {"print": print, "int": int}}, local_vars)
            
            # Get the last defined function
            user_function = None
            for var in local_vars.values():
                if callable(var):
                    user_function = var
                    break
            
            if user_function:
                result = str(user_function(int(test_case["input"])))
                passed = result.strip() == test_case["expectedOutput"].strip()
                results.append({"passed": passed, "output": result})
            else:
                results.append({"passed": False, "output": "No function defined"})
                
        except Exception as e:
            results.append({"passed": False, "output": str(e)})
        finally:
            sys.stdout = sys.__stdout__
    
    return {"results": results}

@app.post("/api/submit-score")
async def submit_score(submission: ScoreSubmission, db: Session = Depends(get_db)):
    try:
        # Find or create candidate assessment
        candidate_assessment = db.query(CandidateAssessment).filter(
            CandidateAssessment.candidate_id == submission.candidateId
        ).first()
        
        if not candidate_assessment:
            # Create new assessment if it doesn't exist
            candidate_assessment = CandidateAssessment(
                candidate_id=submission.candidateId,
                assessment_id=submission.assessmentId,
                honesty_score=submission.honestyScore,
                overall_score=submission.score,
                status="IN_PROGRESS"
            )
            db.add(candidate_assessment)
        else:
            # Update existing assessment
            candidate_assessment.honesty_score = submission.honestyScore
            candidate_assessment.overall_score = submission.score
            
        db.commit()
        
        return {
            "message": "Score submitted successfully",
            "assessmentId": submission.assessmentId,
            "candidateId": submission.candidateId,
            "score": submission.score,
            "honestyScore": submission.honestyScore
        }
            
    except Exception as e:
        print(f"Error in submit_score: {str(e)}")  # Add logging
        raise HTTPException(status_code=500, detail=str(e))

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

@app.get("/api/jobs/{job_id}/candidates", response_model=List[CandidateResponse])
async def get_job_candidates(
    job_id: int,
    db: Session = Depends(get_db)
):
    """
    Get all candidates who have applied for a specific job.
    """
    # First verify the job exists
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    # Get all candidates for this job
    candidates = db.query(Candidate).filter(Candidate.job_id == job_id).all()
    
    # Convert SQLAlchemy models to dictionaries
    return [
        {
            "id": c.id,
            "name": c.name,
            "email": c.email,
            "phone": c.phone,
            "location": c.location,
            "college": c.college,
            "skills": c.skills,
            "resume_s3_url": c.resume_s3_url,
            "assessment_score": c.assessment_score,
            "resume_score": c.resume_score,
            "resume_summary": c.resume_summary,
            "test_summary": c.test_summary,
            "status": c.status.value if c.status else None,
            "created_at": c.created_at.isoformat() if c.created_at else None,
            "updated_at": c.updated_at.isoformat() if c.updated_at else None
        }
        for c in candidates
    ]

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True) 