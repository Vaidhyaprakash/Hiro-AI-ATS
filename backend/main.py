from fastapi import FastAPI, UploadFile, File, HTTPException, BackgroundTasks, WebSocket, Depends, Request, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
from typing import List, Optional
from models.models import CandidateAssessment, Assessment, AssessmentStatus, Question as DBQuestion, QuestionType, Answer as DBAnswer
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
from database.database import get_db
from sqlalchemy.orm import Session
from attitudedetector import extract_audio_from_video, process_video_and_audio, save_file_locally
from pathlib import Path
from applications import create_application_feedback, register_company, CompanyResponse, get_application_feedback, get_company_jobs, get_job_by_id
from schemas.schemas import ApplicationFeedbackPayload, JobResponse, ApplicationFeedbackRequest
import io
import sys
from models.models import Candidate, CandidateStatus, Job, AttitudeAnalysis, Lead
from candidate_analytics import get_candidate_performance_metrics

from models.models import Candidate, CandidateStatus, Job, Interviewer, Interview
from questionGenerator import generate_questions
from paperCorrection import correct_answer, paper_correction
from createSurvey import generateQuestionsAndStore
import time
from dotenv import load_dotenv
from ngrok import update_ngrok_url
from handleWorkflow import handleWorkflow, callPaperCorrection
from leads import find_candidates, get_job_leads
from sqlalchemy import func
from datetime import datetime, timedelta
import uuid

# Set environment variable to disable the new security behavior
os.environ['TORCH_FORCE_WEIGHTS_ONLY'] = '0'

app = FastAPI(title="HR AI Tool API")
UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

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
    question_id: int

class PaperCorrectionRequest(BaseModel):
    questions: List[Answer]

class Question(BaseModel):
    question: str
    options: Optional[List[str]] = None
    answer: Optional[str] = None

class QuestionResponse(BaseModel):
    id: int
    txt: str
    properties: dict

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
    assessmentId: int

class ScoreSubmission(BaseModel):
    assessmentId: int
    candidateId: int
    score: float
    honestyScore: float

class SurveyRequest(BaseModel):
    num_mcq: int
    num_openended: int
    num_coding: int
    difficulty: str
    job_role: str
    skills: List[str]
    assessment_id: int
    job_id: int
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

class AssessmentResponse(BaseModel):
    id: int
    title: str
    type: str
    difficulty: int
    assessment_link: Optional[str]
    questions: List[dict]

class GenerateQuestions(BaseModel):
   assessment_id: int
   job_id: int 

class AnswerSubmission(BaseModel):
    questionId: int
    candidateId: int
    assessmentId: int
    answer: str
    score: float

class InterviewerRequest(BaseModel):
    name: str
    email: EmailStr
    job_id: int
    candidate_id: int
    feedback: str

class WebhookRequest(BaseModel):
    answers: dict
    candidate_assessment_id: int
class LeadGenerationRequest(BaseModel):
    job_id: int
    skills: List[str]
    location: str

class RecruitmentAnalytics(BaseModel):
    hiring_funnel: dict
    time_to_hire: dict
    offer_acceptance_rate: float
    cost_per_hire: float
    source_effectiveness: dict

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

@app.post("/api/resume/analyze/{job_id}")
async def analyze_resume(job_id: int, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    try:
        # Call process_resumes directly since it's now an async function
        background_tasks.add_task(process_resumes, job_id, db)
        return {
            "message": "Resume analysis completed",
            "status": "success"
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

@app.post("/upload-video/{job_id}/{candidate_id}/{interview_id}")
async def upload_video(job_id: int, candidate_id: int, interview_id: int, video: UploadFile = File(...), background_tasks: BackgroundTasks = BackgroundTasks(), db: Session = Depends(get_db)):
    video_path = save_file_locally(video, "video")
    audio_file_path = UPLOAD_DIR / f"audio_{uuid.uuid4()}_{video.filename.split('.')[0]}.aac"
    audio_path = extract_audio_from_video(video_path, audio_file_path)
    background_tasks.add_task(process_video_and_audio, db, job_id, candidate_id,interview_id, video_path, audio_path)
    return {
        "success": True
    }


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

@app.post("/api/answer/submit")
def submit_answer(request: WebhookRequest, db: Session = Depends(get_db)):
    print(f"Received request to submit answer: {request.answers}")
    handleWorkflow(request.answers, db, request.candidate_assessment_id)
    return {"message": "Answer submitted successfully"}

@app.post("/api/create-survey")
async def create1_survey(request: SurveyRequest, db: Session = Depends(get_db)):
    return generateQuestionsAndStore(request.num_mcq, request.num_openended, request.num_coding, request.difficulty, request.job_role, request.skills, request.assessment_id, request.job_id, db)

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

@app.get("/api/candidates/{job_id}")
async def get_candidates_by_job_id(
    job_id: int,
    status: CandidateStatus,
    db: Session = Depends(get_db)
):
    """
    Get all candidates for a specific job.
    """
    candidates = db.query(Candidate).filter(Candidate.job_id == job_id, Candidate.status == status).all()
    return candidates

@app.post("/api/candidates/{candidate_id}/update-status")
async def update_candidate_status(
    candidate_id: int,
    status: CandidateStatus,
    db: Session = Depends(get_db)
):
    """
    Update the status of a candidate.
    """
    candidate = db.query(Candidate).filter(Candidate.id == candidate_id).first()
    candidate.status = status
    db.commit()
    return {
        "message": "Candidate status updated successfully",
        "status": status
    }

@app.post("/api/attitude/analyze")
async def analyze_attitude(db: Session = Depends(get_db)):
    attitude_analysis = AttitudeAnalysis(
        candidate_id=1,
        job_id=1,
        culture_fit_score=0.5,
        confidence_score=0.5,
        positivity_score=0.5,
    )
    db.add(attitude_analysis)
    db.commit()
    return {
        "message": "Attitude analysis completed successfully",
        "attitude_analysis": attitude_analysis
    }

@app.post("/api/question-set-generator")
def generate_question_set(request: GenerateQuestions, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    # Validate assessment exists first
    assessment = db.query(Assessment).filter(Assessment.id == request.assessment_id).first()
    if not assessment:
        return {"success": False, "message": "Assessment not found"}
    
    job = db.query(Job).filter(Job.id == request.job_id).first()
    if not job:
        return {"success": False, "message": "Job not found"}
    
    # Process difficulty if needed
    if hasattr(assessment, "properties") and assessment.properties and "difficulty" in assessment.properties:
        difficulty_string = convert_difficulty(assessment)
        assessment.properties["difficulty"] = difficulty_string
    
    # Add task to background
    background_tasks.add_task(
        process_question_generation,
        assessment.properties.get("num_mcq", 5),
        assessment.properties.get("num_openended", 3),
        assessment.properties.get("num_coding", 2),
        assessment.properties.get("difficulty", "medium"),
        job.title,
        assessment.properties.get("skills", []),
        assessment.id,
        job.id,
        db
    )
    
    # Update assessment status to IN_PROGRESS
    assessment.status = AssessmentStatus.IN_PROGRESS
    db.commit()
    
    return {
        "success": True, 
        "message": "Question generation started", 
        "assessment_id": assessment.id,
        "job_id": job.id
    }

# Add this function to handle the background task
def process_question_generation(num_mcq, num_openended, num_coding, difficulty, job_title, skills, assessment_id, job_id, db):
    try:
        with db:  # Create a new session
            generateQuestionsAndStore(
                num_mcq, num_openended, num_coding, 
                difficulty, job_title, skills, 
                assessment_id, job_id, db
            )
            
            # Update assessment status when complete
            assessment = db.query(Assessment).filter(Assessment.id == assessment_id).first()
            if assessment:
                assessment.status = AssessmentStatus.COMPLETED
                db.commit()
    except Exception as e:
        print(f"Error in question generation: {str(e)}")
        # Update assessment status on error
        with db:
            assessment = db.query(Assessment).filter(Assessment.id == assessment_id).first()
            if assessment:
                assessment.status = AssessmentStatus.FAILED
                assessment.properties["error"] = str(e)
                db.commit()

@app.get("/api/candidates/{candidate_id}/analytics")
async def get_candidate_analytics(
    candidate_id: int,
    db: Session = Depends(get_db)
):
    """
    Get comprehensive analytics for a candidate including:
    - Technical skills assessment
    - Behavioral analysis
    - Performance metrics
    - Application progress
    - Timeline of events
    - Strengths and weaknesses
    
    Returns data formatted for various visualizations including:
    - Radar charts
    - Timeline views
    - Score distributions
    - Progress indicators
    """
    try:
        metrics = get_candidate_performance_metrics(db, candidate_id)
        if "error" in metrics:
            raise HTTPException(status_code=404, detail=metrics["error"])
        return metrics
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
@app.get("/api/assessments/{assessment_id}", response_model=AssessmentResponse)
async def get_assessment(assessment_id: int, db: Session = Depends(get_db)):
    """
    Get assessment details including coding questions
    """
    try:
        assessment = db.query(Assessment).filter(Assessment.id == assessment_id).first()
        if not assessment:
            raise HTTPException(status_code=404, detail="Assessment not found")

        # Get coding questions for this assessment
        questions = db.query(DBQuestion).filter(
            DBQuestion.assessment_id == assessment_id,
            DBQuestion.type == QuestionType.CODING
        ).all()

        return {
            "id": assessment.id,
            "title": assessment.title,
            "type": assessment.type,
            "difficulty": assessment.difficulty,
            "assessment_link": assessment.assessment_link,
            "questions": [{
                "id": q.id,
                "txt": q.txt,
                "properties": q.properties
            } for q in questions]
        }
    except Exception as e:
        print(f"Error in get_assessment: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/submit-answer")
async def submit_answer(submission: AnswerSubmission, db: Session = Depends(get_db)):
    """
    Submit an answer for a coding question
    """
    try:
        # First verify or create candidate assessment
        candidate_assessment = db.query(CandidateAssessment).filter(
            CandidateAssessment.candidate_id == submission.candidateId,
            CandidateAssessment.assessment_id == submission.assessmentId
        ).first()
        print(candidate_assessment)
        if not candidate_assessment:
            # Create new assessment if it doesn't exist
            candidate_assessment = CandidateAssessment(
                candidate_id=submission.candidateId,
                assessment_id=submission.assessmentId,
                honesty_score=100,  # Default value
                overall_score=0,    # Will be updated later
                status= AssessmentStatus.COMPLETED
            )
            db.add(candidate_assessment)
        else:
            # Update existing assessment status to completed
            candidate_assessment.status = AssessmentStatus.COMPLETED
            candidate_assessment.overall_score = submission.score
            
        db.commit()
        db.refresh(candidate_assessment)
        print("CREATED CANDIDATE ASSESSMENT")
        # Create new answer
        answer = DBAnswer(
            question_id=submission.questionId,
            candidate_id=submission.candidateId,
            candidate_assessment_id=candidate_assessment.id,  # Use the actual ID
            score=submission.score,
            answer=submission.answer
        )
        db.add(answer)
        db.commit()
        callPaperCorrection(db, candidate_assessment)
        return {
            "message": "Answer submitted successfully",
            "answerId": answer.id
        }
    except Exception as e:
        print(f"Error in submit_answer: {str(e)}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@app.on_event("startup")
async def startup_event():
    # Wait for ngrok to start
    time.sleep(5)
    ngrok_url = update_ngrok_url()
    if ngrok_url:
        print(f"Server accessible at: {ngrok_url}")
@app.get("/api/assessment-status/{candidate_id}/{assessment_id}")
async def get_assessment_status(
    candidate_id: int,
    assessment_id: int,
    db: Session = Depends(get_db)
):
    """
    Check if a candidate has completed an assessment
    """
    try:
        candidate_assessment = db.query(CandidateAssessment).filter(
            CandidateAssessment.candidate_id == candidate_id,
            CandidateAssessment.assessment_id == assessment_id
        ).first()

        if not candidate_assessment:
            return {
                "status": AssessmentStatus.PENDING,
                "score": 0,
                "honesty_score": 0
            }

        return {
            "status": candidate_assessment.status,
            "score": candidate_assessment.overall_score,
            "honesty_score": candidate_assessment.honesty_score
        }
    except Exception as e:
        print(f"Error in get_assessment_status: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/leads/generate")
async def generate_candidate_leads(
    request: LeadGenerationRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """
    Generate candidate leads from Reddit based on job ID, required skills, and location.
    The lead generation process runs in the background and is limited to evaluating 30 candidates.
    """
    return await find_candidates(
        job_id=request.job_id,
        skills=request.skills,
        location=request.location,
        db=db,
        background_tasks=background_tasks
    )

@app.get("/api/jobs/{job_id}/leads")
async def get_leads_for_job(
    job_id: int,
    db: Session = Depends(get_db)
):
    """
    Get all leads for a specific job if smart hire is enabled.
    """
    return await get_job_leads(job_id=job_id, db=db)

def convert_difficulty(assessment):
    difficulty = assessment["properties"]["difficulty"]
    
    # Check if it's already a string difficulty
    if isinstance(difficulty, str):
        if difficulty.lower() in ["easy", "medium", "intermediate", "hard"]:
            return difficulty.lower()
    
    # Try to convert to number if it's a string containing a number
    try:
        if isinstance(difficulty, str):
            difficulty = int(difficulty)
        
        # Now handle as a number
        if isinstance(difficulty, (int, float)):
            if 0 <= difficulty <= 3:
                return "easy"
            elif 4 <= difficulty <= 6:
                return "medium"
            elif 7 <= difficulty <= 8:
                return "intermediate"
            elif difficulty > 8:
                return "hard"
    except (ValueError, TypeError):
        # If conversion fails, return default
        return "medium"
    
    # Default case
    return "medium"

@app.get("/api/analytics/recruitment", response_model=RecruitmentAnalytics)
async def get_recruitment_analytics(db: Session = Depends(get_db)):
    """
    Get comprehensive recruitment analytics including:
    - Hiring funnel stats
    - Time to hire metrics
    - Offer acceptance rate
    - Cost per hire
    - Source effectiveness
    """
    try:
        # Get hiring funnel data
        funnel_data = {}
        for status in CandidateStatus:
            count = db.query(func.count(Candidate.id)).filter(
                Candidate.status == status
            ).scalar()
            funnel_data[status.value] = count

        # Calculate time to hire (average days between SOURCED and HIRED)
        hired_candidates = db.query(Candidate).filter(
            Candidate.status == CandidateStatus.HIRED
        ).all()
        
        total_days = 0
        for candidate in hired_candidates:
            hire_time = candidate.updated_at - candidate.created_at
            total_days += hire_time.days
        
        avg_time_to_hire = total_days / len(hired_candidates) if hired_candidates else 0

        # Calculate time to hire trend (last 6 months)
        time_to_hire_trend = []
        for i in range(6):
            start_date = datetime.now() - timedelta(days=(i+1)*30)
            end_date = datetime.now() - timedelta(days=i*30)
            
            month_hires = db.query(Candidate).filter(
                Candidate.status == CandidateStatus.HIRED,
                Candidate.updated_at.between(start_date, end_date)
            ).all()
            
            if month_hires:
                month_avg_days = sum(
                    (c.updated_at - c.created_at).days 
                    for c in month_hires
                ) / len(month_hires)
            else:
                month_avg_days = 0
                
            time_to_hire_trend.append({
                "month": end_date.strftime("%b"),
                "days": round(month_avg_days, 1)
            })

        # Calculate offer acceptance rate
        total_offers = db.query(func.count(Candidate.id)).filter(
            Candidate.status.in_([CandidateStatus.OFFER_EXTENDED, CandidateStatus.HIRED])
        ).scalar()
        
        accepted_offers = db.query(func.count(Candidate.id)).filter(
            Candidate.status == CandidateStatus.HIRED
        ).scalar()
        
        offer_acceptance_rate = (accepted_offers / total_offers * 100) if total_offers > 0 else 0

        # Get source effectiveness data from leads table
        source_counts = db.query(
            Lead.platform,
            func.count(Lead.id).label('count')
        ).group_by(
            Lead.platform
        ).all()

        total_leads = sum(count for _, count in source_counts)
        source_effectiveness = {
            platform: round((count / total_leads * 100), 1) if total_leads > 0 else 0
            for platform, count in source_counts
        }

        # If no leads data yet, provide some default platforms with 0%
        if not source_effectiveness:
            source_effectiveness = {
                "LinkedIn": 0,
                "Referrals": 0,
                "Job Boards": 0,
                "Company Website": 0,
                "Agencies": 0
            }

        return {
            "hiring_funnel": funnel_data,
            "time_to_hire": {
                "average_days": round(avg_time_to_hire, 1),
                "trend": time_to_hire_trend
            },
            "offer_acceptance_rate": round(offer_acceptance_rate, 1),
            "cost_per_hire": 4250,  # Mock data, can be calculated based on actual costs
            "source_effectiveness": source_effectiveness
        }

    except Exception as e:
        print(f"Error in get_recruitment_analytics: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/assessments/{assessment_id}/candidates/count")
async def get_assessment_candidates_count(
    assessment_id: int,
    db: Session = Depends(get_db)
):
    """
    Get the number of candidates who have taken a specific assessment.
    Also returns a breakdown of their completion status.
    
    Args:
        assessment_id: ID of the assessment
        db: Database session
    
    Returns:
        dict: Contains total count and breakdown by status
    """
    try:
        # Get total count and status breakdown using joins
        status_counts = (
            db.query(
                CandidateAssessment.status,
                func.count(CandidateAssessment.id).label('count')
            )
            .join(Candidate, Candidate.id == CandidateAssessment.candidate_id)
            .filter(CandidateAssessment.assessment_id == assessment_id)
            .group_by(CandidateAssessment.status)
            .all()
        )
        
        # Calculate total and create status breakdown
        total_candidates = sum(count for _, count in status_counts)
        status_breakdown = {
            status: count for status, count in status_counts
        }
        
        # If no data found, return zeros
        if not status_breakdown:
            status_breakdown = {
                "NOT_STARTED": 0,
                "IN_PROGRESS": 0,
                "COMPLETED": 0
            }
            
        return {
            "total_candidates": total_candidates,
            "status_breakdown": status_breakdown,
            "assessment_id": assessment_id
        }

    except Exception as e:
        print(f"Error in get_assessment_candidates_count: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/assessments/{assessment_id}/candidates")
async def get_assessment_candidates(
    assessment_id: int,
    db: Session = Depends(get_db)
):
    """
    Get detailed information about all candidates who have taken a specific assessment.
    Includes candidate personal details, assessment status, and scores.
    """
    try:
        # Query candidates with their assessment details using joins
        candidates_with_assessments = (
            db.query(
                Candidate,
                CandidateAssessment.id.label('candidate_assessment_id'),
                CandidateAssessment.status.label('assessment_status'),
                CandidateAssessment.overall_score,
                CandidateAssessment.honesty_score,
                CandidateAssessment.created_at.label('assessment_start_date'),
                CandidateAssessment.updated_at.label('assessment_completion_date')
            )
            .join(
                CandidateAssessment,
                Candidate.id == CandidateAssessment.candidate_id
            )
            .filter(CandidateAssessment.assessment_id == assessment_id)
            .all()
        )
        
        # Format the response
        candidates_list = []
        for (
            candidate, 
            ca_id, 
            status, 
            score, 
            honesty_score, 
            start_date, 
            completion_date
        ) in candidates_with_assessments:
            candidates_list.append({
                "candidate_details": {
                    "id": candidate.id,
                    "name": candidate.name,
                    "email": candidate.email,
                    "phone": candidate.phone,
                    "location": candidate.location,
                    "college": candidate.college,
                    "skills": candidate.skills,
                    "resume_s3_url": candidate.resume_s3_url,
                    "resume_score": candidate.resume_score,
                    "resume_summary": candidate.resume_summary,
                    "status": candidate.status.value if candidate.status else None,
                    "candidate_assessment_id": ca_id
                },
                "assessment_details": {
                    "status": status,
                    "overall_score": score,
                    "honesty_score": honesty_score,
                    "started_at": start_date.isoformat() if start_date else None,
                    "completed_at": completion_date.isoformat() if completion_date else None,
                }
            })
            
        return {
            "assessment_id": assessment_id,
            "total_candidates": len(candidates_list),
            "candidates": candidates_list
        }

    except Exception as e:
        print(f"Error in get_assessment_candidates: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True) 

@app.post("/api/update/candidate-assessment/{candidate_id}/job/{job_id}")
async def map_candidate_to_first_assessment(candidate_id: int, job_id: int, db: Session = Depends(get_db)):
    # Get first assessment for this job
    first_assessment = db.query(Assessment)\
        .filter(Assessment.job_id == job_id,Assessment.type !="initial_screening")\
        .order_by(Assessment.id)\
        .first()
    
    candidate = db.query(Candidate).filter(Candidate.id == candidate_id).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")
    
    candidate.status = CandidateStatus.ASSESSMENT
    db.commit()

    if not first_assessment:
        raise HTTPException(status_code=404, detail="No assessments found for this job")

    # Create new candidate assessment for first assessment
    new_candidate_assessment = CandidateAssessment(
        candidate_id=candidate_id,
        assessment_id=first_assessment.id,
        status=AssessmentStatus.PENDING
    )
    
    db.add(new_candidate_assessment)
    db.commit()
    
    return {
        "message": "Candidate mapped to first assessment successfully",
        "assessment_id": first_assessment.id,
        "candidate_assessment_id": new_candidate_assessment.id
    }

@app.post("/api/update/candidate-assessment/{candidate_assessment_id}/{candidate_id}/job/{job_id}")
async def update_candidate_assessment(
    candidate_assessment_id: int, 
    candidate_id: int, 
    job_id: int, 
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    try:
        # Get current candidate assessment
        candidate_assessment = db.query(CandidateAssessment).filter(
            CandidateAssessment.id == candidate_assessment_id,
            CandidateAssessment.candidate_id == candidate_id
        ).first()
        
        if not candidate_assessment:
            raise HTTPException(status_code=404, detail="Candidate assessment not found")

        # Mark current assessment as completed
        candidate_assessment.status = AssessmentStatus.COMPLETED
        candidate_assessment.completed_at = datetime.utcnow()
        
        # Get all assessments for this job ordered by ID
        assessments = db.query(Assessment)\
            .filter(Assessment.job_id == job_id, Assessment.type != "initial_screening")\
            .order_by(Assessment.id)\
            .all()

        # Find current assessment index
        current_index = next((i for i, a in enumerate(assessments) if a.id == candidate_assessment.assessment_id), -1)
        
        # Get next assessment if available
        next_assessment = None
        if current_index < len(assessments) - 1:
            next_assessment = assessments[current_index + 1]
            
            # Create new candidate assessment for next assessment
            new_candidate_assessment = CandidateAssessment(
                candidate_id=candidate_id,
                assessment_id=next_assessment.id,
                status=AssessmentStatus.PENDING
            )
            db.add(new_candidate_assessment)
            
            # Update candidate status to INTERVIEW for next assessment
            candidate = db.query(Candidate).filter(Candidate.id == candidate_id).first()
            if candidate:
                candidate.status = CandidateStatus.INTERVIEW

            # If next assessment is not an interview, generate questions
            if next_assessment.type != "interview":
                # Call question generator API
                await generate_question_set(
                    GenerateQuestions(
                        assessment_id=next_assessment.id,
                        job_id=job_id
                    ),
                    background_tasks=background_tasks,
                    db=db
                )
        else:
            # No more assessments - update candidate status to HIRED
            candidate = db.query(Candidate).filter(Candidate.id == candidate_id).first()
            if candidate:
                candidate.status = CandidateStatus.HIRED
        
        db.commit()
        
        if next_assessment:
            db.refresh(new_candidate_assessment)
        if candidate:
            db.refresh(candidate)
            
        return {
            "message": "Candidate assessment updated successfully",
            "next_assessment_id": next_assessment.id if next_assessment else None,
            "candidate_status": candidate.status.value if candidate else None
        }
            
    except Exception as e:
        db.rollback()
        print(f"Error updating candidate assessment: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/asssementa/{assessment_id}/candidates")
async def get_candiates_based_on_assessment_id(assessment_id: int, db: Session = Depends(get_db)):
    """
    Get all candidates who have taken a specific assessment.
    """
    candidates = (
        db.query(Candidate)
        .join(CandidateAssessment)
        .filter(CandidateAssessment.assessment_id == assessment_id)
        .all()
    )
    return candidates

@app.post("/api/interviewer")
async def create_interviewer(
    request: InterviewerRequest,
    db: Session = Depends(get_db)
):
    """
    Create a new interviewer record
    """
    # Check if interviewer with email already exists
    existing_interviewer = db.query(Interviewer).filter(Interviewer.email == request.email).first()
    if existing_interviewer:
        interviewer = existing_interviewer
    else:
        interviewer = Interviewer(
            name=request.name,
            email=request.email
        )
        db.add(interviewer)
        db.commit()
        db.refresh(interviewer)
    interview = Interview(
        interviewer_id=interviewer.id,
        feedback=request.feedback,
        candidate_id=request.candidate_id,
    )
    db.add(interview)
    db.commit()
    db.refresh(interview)
    return {
        "message": "Interviewer created successfully",
        "id": interviewer.id,
        "name": interviewer.name,
        "email": interviewer.email,
        "interview_id": interview.id
    }


