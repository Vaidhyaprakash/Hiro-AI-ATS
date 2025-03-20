from fastapi import HTTPException
from sqlalchemy.orm import Session
from models.models import Company, Job, Candidate, Application, ApplicationStatus, Assessment
from schemas.schemas import CompanyCreate, JobCreate, ApplicationFeedbackPayload, JobResponse, ApplicationFeedbackRequest
import httpx
from typing import Optional, List
import urllib.parse
from pydantic import BaseModel
from datetime import datetime
from sqlalchemy import func

class CompanyResponse(BaseModel):
    id: int
    name: str
    departments: Optional[List[str]] = None
    locations: Optional[List[str]] = None
    company_size: Optional[int] = None
    website: Optional[str] = None
    created_at: Optional[str] = None

async def register_company(
    db: Session,
    name: str,
    departments: Optional[List[str]] = None,
    locations: Optional[List[str]] = None,
    company_size: Optional[int] = None,
    website: Optional[str] = None
) -> CompanyResponse:
    """
    Register a new company in the database.
    
    Args:
        db: Database session
        name: Name of the company
        departments: List of departments (optional)
        locations: List of locations (optional)
        company_size: Number of employees (optional)
        website: Company website URL (optional)
    
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
            departments=departments,
            locations=locations,
            company_size=company_size,
            website=website
        )
        db.add(company)
        db.commit()
        db.refresh(company)

        return CompanyResponse(
            id=company.id,
            name=company.name,
            departments=company.departments,
            locations=company.locations,
            company_size=company.company_size,
            website=company.website,
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
    job_data: ApplicationFeedbackRequest,
    feedback_url: str = "https://krish-test.salesparrow.com/s/Job-Application-Feedback-Survey/tt-TDNyY"
) -> dict:
    """
    Create a job in the database and generate feedback URL.
    
    Args:
        db: Database session
        job_data: JobCreateWithAssessments containing job and assessment details
        feedback_url: URL to send feedback to (optional)
    
    Returns:
        dict: Response containing the created job ID and feedback URL
    """
    try:
        # Get company from database
        company = db.query(Company).filter(Company.id == job_data.company_id).first()
        if not company:
            raise HTTPException(
                status_code=404,
                detail=f"Company with ID {job_data.company_id} not found"
            )

        # Create job in database
        job = Job(
            title=job_data.job_title,
            job_description=job_data.job_description or f"Position for {job_data.job_title} at {company.name}",
            requirements=job_data.requirements,
            company_id=job_data.company_id,
            properties=job_data.properties
        )
        db.add(job)
        db.commit()
        db.refresh(job)

        # Create assessments
        created_assessments = []
        for assessment_data in job_data.assessments:
            assessment = Assessment(
                job_id=job.id,
                difficulty=assessment_data.difficulty,
                properties=assessment_data.properties,
                type=assessment_data.type,
                title=assessment_data.title
            )
            db.add(assessment)
            created_assessments.append(assessment)
        db.commit()

        # Prepare query parameters
        params = {
            "company": company.name,
            "job_titile": job.title,  # Note: Using 'job_titile' as per the URL format
            "job_id": job.id,
            "company_id": company.id
        }
        
        # Construct URL with proper query parameters
        encoded_params = urllib.parse.urlencode(params)
        feedback_url_with_params = f"{feedback_url}?{encoded_params}"

        return {
            "company_id": company.id,
            "company_name": company.name,
            "job_id": job.id,
            "job_title": job.title,
            "job_description": job.job_description,
            "requirements": job.requirements,
            "properties": job.properties,
            "assessments": [
                {
                    "id": assessment.id,
                    "difficulty": assessment.difficulty,
                    "properties": assessment.properties,
                    "type": assessment.type,
                    "title": assessment.title
                }
                for assessment in created_assessments
            ],
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

async def get_company_jobs(
    db: Session,
    company_id: int
) -> List[JobResponse]:
    """
    Get all jobs for a specific company with candidate counts.
    
    Args:
        db: Database session
        company_id: ID of the company
    
    Returns:
        List[JobResponse]: List of jobs with company details and candidate counts
    """
    try:
        # Get company from database
        company = db.query(Company).filter(Company.id == company_id).first()
        if not company:
            raise HTTPException(
                status_code=404,
                detail=f"Company with ID {company_id} not found"
            )

        # Get all jobs for the company with candidate counts
        jobs = db.query(
            Job,
            func.count(Candidate.id).label('candidate_count')
        ).outerjoin(
            Candidate,
            Job.id == Candidate.job_id
        ).filter(
            Job.company_id == company_id
        ).group_by(
            Job.id
        ).all()
        
        # Convert to response model
        return [
            JobResponse(
                id=job.id,
                title=job.title,
                job_description=job.job_description,
                requirements=job.requirements,
                properties=job.properties,
                company_id=job.company_id,
                created_at=job.created_at,
                updated_at=job.updated_at,
                company_name=company.name,
                candidate_count=candidate_count
            )
            for job, candidate_count in jobs
        ]

    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get company jobs: {str(e)}"
        ) 

async def get_job_by_id(
    db: Session,
    job_id: int
) -> JobResponse:
    """
    Get a specific job by ID with candidate count.
    
    Args:
        db: Database session
        job_id: ID of the job
    
    Returns:
        JobResponse: Job details with company details and candidate count
    """
    try:
        # Get job with candidate count
        job_result = db.query(
            Job,
            func.count(Candidate.id).label('candidate_count')
        ).outerjoin(
            Candidate,
            Job.id == Candidate.job_id
        ).filter(
            Job.id == job_id
        ).group_by(
            Job.id
        ).first()

        if not job_result:
            raise HTTPException(
                status_code=404,
                detail=f"Job with ID {job_id} not found"
            )

        job, candidate_count = job_result

        # Get company details
        company = db.query(Company).filter(Company.id == job.company_id).first()
        if not company:
            raise HTTPException(
                status_code=404,
                detail=f"Company for job ID {job_id} not found"
            )

        return JobResponse(
            id=job.id,
            title=job.title,
            job_description=job.job_description,
            requirements=job.requirements,
            properties=job.properties,
            company_id=job.company_id,
            created_at=job.created_at,
            updated_at=job.updated_at,
            company_name=company.name,
            candidate_count=candidate_count
        )

    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get job: {str(e)}"
        ) 
        