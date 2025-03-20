from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime

# Company schemas
class CompanyBase(BaseModel):
    name: str
    departments: Optional[List[str]] = None
    locations: Optional[List[str]] = None
    company_size: Optional[int] = None
    website: Optional[str] = None

class CompanyCreate(CompanyBase):
    pass

class Company(CompanyBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Job schemas
class JobBase(BaseModel):
    title: str
    job_description: Optional[str] = None
    requirements: Optional[str] = None
    properties: Optional[dict] = None

class JobCreate(JobBase):
    company_id: int

class Job(JobBase):
    id: int
    company_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class JobResponse(JobBase):
    id: int
    company_id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    company_name: str
    candidate_count: int = 0

    class Config:
        from_attributes = True

# Candidate schemas
class CandidateBase(BaseModel):
    name: str
    email: EmailStr
    status: str
    resume_s3_link: str

class CandidateCreate(CandidateBase):
    job_id: int

class Candidate(CandidateBase):
    id: int
    job_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Test schemas
class TestBase(BaseModel):
    type: str
    score: float
    cheated: bool = False

class TestCreate(TestBase):
    candidate_id: int

class Test(TestBase):
    id: int
    candidate_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Question schemas
class QuestionBase(BaseModel):
    type: str
    question: str
    choices: Optional[str] = None
    correct_answer: str
    candidate_answer: Optional[str] = None

class QuestionCreate(QuestionBase):
    test_id: int

class Question(QuestionBase):
    id: int
    test_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class ApplicationFeedbackPayload(BaseModel):
    company_name: str
    job_titile: str
    email: EmailStr
    name: str
    number: Optional[str] = None
    resume: Optional[str] = None
    job_id: int
    company_id: int

    class Config:
        from_attributes = True

# Assessment schemas
class AssessmentBase(BaseModel):
    difficulty: int
    properties: dict
    type: str
    title: str

class AssessmentCreate(AssessmentBase):
    pass

class Assessment(AssessmentBase):
    id: int
    job_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class AssessmentRequest(BaseModel):
    difficulty: int
    properties: dict
    type: str
    title: str

class ApplicationFeedbackRequest(JobBase):
    company_id: int
    title: str
    job_description: Optional[str] = None
    requirements: Optional[str] = None
    properties: Optional[dict] = None
    assessments: List[AssessmentRequest]

# Candidate Assessment schemas
class CandidateAssessmentBase(BaseModel):
    candidate_id: int
    assessment_id: int
    status: str  # e.g., 'pending', 'in_progress', 'completed'
    honesty_score: float
    overall_score: float
    properties: dict  # For storing additional assessment-specific data

class CandidateAssessmentCreate(CandidateAssessmentBase):
    pass

class CandidateAssessment(CandidateAssessmentBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Question schemas for assessments
class QuestionBase(BaseModel):
    type: str  # e.g., 'coding', 'mcq', 'essay'
    job_id: int
    properties: dict  # Store question content, options, etc.
    assessment_id: int

class QuestionCreate(QuestionBase):
    pass

class Question(QuestionBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Answer schemas
class AnswerBase(BaseModel):
    question_id: int
    candidate_id: int
    score: float
    answer: str  # Store the actual answer content
    properties: dict  # For any additional answer metadata

class AnswerCreate(AnswerBase):
    pass

class Answer(AnswerBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True 


class AttitudeAnalysisBase(BaseModel):
    candidate_id: int
    job_id: int
    culture_fit_score: float
    confidence_score: float
    positivity_score: float
    enthusiasm_score: float
    calmness_score: float

class AttitudeAnalysisCreate(AttitudeAnalysisBase):
    pass

class AttitudeAnalysis(AttitudeAnalysisBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class InterviewBase(BaseModel):
    id: int
    created_at: datetime
    updated_at: datetime

class InterviewCreate(InterviewBase):
    pass

class Interview(InterviewBase):
    id: int
    candidate_id: int
    job_id: int

    class Config:
        from_attributes = True

