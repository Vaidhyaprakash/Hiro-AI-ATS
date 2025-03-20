from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime
from models.models import ApplicationStatus

# Company schemas
class CompanyBase(BaseModel):
    name: str
    industry: str
    description: Optional[str] = None

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
    role: str
    job_description: str
    requirements: Optional[str] = None

class JobCreate(JobBase):
    company_id: int

class Job(JobBase):
    id: int
    company_id: int
    created_at: datetime
    updated_at: datetime

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