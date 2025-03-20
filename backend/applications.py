from fastapi import HTTPException
from sqlalchemy.orm import Session
from models.models import Company, Job, Candidate, Application, ApplicationStatus
from schemas.schemas import CompanyCreate, JobCreate, ApplicationFeedbackPayload
import httpx
from typing import Optional
import urllib.parse
from pydantic import BaseModel
from datetime import datetime
from sqlalchemy import func

class CompanyResponse(BaseModel):
    id: int
    name: str
    description: str
    created_at: Optional[str] = None

async def register_company(
    db: Session,
    name: str,
    description: Optional[str] = None,
    website: Optional[str] = None,
    location: Optional[str] = None,
    industry: Optional[str] = None
) -> CompanyResponse:
    """
    Register a new company in the database.
    
    Args:
        db: Database session
        name: Name of the company
        description: Company description (optional)
        website: Company website URL (optional)
        location: Company location (optional)
        industry: Company industry (optional)
    
    Returns:
        CompanyResponse: Details of the created company
    """
    try:
        # Check if company already exists (case-insensitive)
        existing_company = db.query(Company).filter(func.lower(Company.name) == func.lower(name)).first()
        if existing_company:
            raise HTTPException(
                status_code=400,
                detail=f"Company with name '{name}' already exists"
            )

        print(f"Creating new company record with name: {name}")
        # Create company in database
        company = Company(
            name=name,
            description=description or f"Company {name}",
            website=website,
            location=location,
            industry=industry
        )
        db.add(company)
        db.commit()
        db.refresh(company)

        return CompanyResponse(
            id=company.id,
            name=company.name,
            description=company.description,
            created_at=str(company.created_at) if hasattr(company, 'created_at') else None
        )

    except HTTPException as he:
        # Re-raise HTTP exceptions
        raise he
    except Exception as e:
        # Rollback database changes if something goes wrong
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to register company: {str(e)}"
        )

async def create_application_feedback(
    db: Session,
    company_id: int,
    job_title: str,
    feedback_url: str = "https://krish-test.salesparrow.com/s/Job-Application-Feedback-Survey/tt-TDNyY"
) -> dict:
    """
    Create a job in the database and generate feedback URL.
    
    Args:
        db: Database session
        company_id: ID of the company
        job_title: Title of the job
        feedback_url: URL to send feedback to (optional)
    
    Returns:
        dict: Response containing the created job ID and feedback URL
    """
    try:
        # Get company from database
        company = db.query(Company).filter(Company.id == company_id).first()
        if not company:
            raise HTTPException(
                status_code=404,
                detail=f"Company with ID {company_id} not found"
            )

        # Create job in database
        job = Job(
            title=job_title,
            company_id=company_id,
            description=f"Position for {job_title} at {company.name}"
        )
        db.add(job)
        db.commit()
        db.refresh(job)

        # Prepare query parameters
        params = {
            "company": company.name,
            "job_titile": job_title,  # Note: Using 'job_titile' as per the URL format
            "job_id": job.id,
            "company_id": company_id
        }
        
        # Construct URL with proper query parameters
        encoded_params = urllib.parse.urlencode(params)
        feedback_url_with_params = f"{feedback_url}?{encoded_params}"

        return {
            "company_id": company_id,
            "company_name": company.name,
            "job_id": job.id,
            "feedback_url": feedback_url_with_params
        }

    except HTTPException as he:
        # Re-raise HTTP exceptions
        raise he
    except Exception as e:
        # Rollback database changes if something goes wrong
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to create application feedback: {str(e)}"
        ) 


async def get_application_feedback(
    db: Session,
    payload: ApplicationFeedbackPayload
) -> dict:
    """
    Get application feedback from the database and create candidate entry.
    
    Args:
        db: Database session
        payload: ApplicationFeedbackPayload containing:
            - company_name: Name of the company
            - job_titile: Title of the job
            - email: Candidate's email
            - name: Candidate's name
            - number: Candidate's phone number (optional)
            - resume: URL to candidate's resume (optional)
            - job_id: ID of the job
            - company_id: ID of the company
    
    Returns:
        dict: Response containing the application feedback and candidate details
    """
    try:
        # Get company from database
        company = db.query(Company).filter(Company.id == payload.company_id).first()
        if not company:
            raise HTTPException(
                status_code=404,
                detail=f"Company with ID {payload.company_id} not found"
            )

        # Get job from database
        job = db.query(Job).filter(Job.id == payload.job_id).first()
        if not job:
            raise HTTPException(
                status_code=404,
                detail=f"Job with ID {payload.job_id} not found"
            )

        # Create candidate in database
        candidate = Candidate(
            name=payload.name,
            email=payload.email,
            phone=payload.number,  # Optional field
            resume_s3_url=payload.resume,  # Optional field
            company_id=company.id,
            job_id=job.id
        )
        db.add(candidate)
        db.commit()
        db.refresh(candidate)

        # Create application record
        application = Application(
            candidate_id=candidate.id,
            job_role=payload.job_titile,
            status=ApplicationStatus.APPLIED,
            applied_date=datetime.utcnow()
        )
        db.add(application)
        db.commit()
        db.refresh(application)

        return {
            "candidate_id": candidate.id,
            "application_id": application.id,
            "status": application.status,
            "message": "Application submitted successfully"
        }

    except HTTPException as he:
        raise he
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to process application feedback: {str(e)}"
        ) 
        