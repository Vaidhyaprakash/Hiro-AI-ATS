from sqlalchemy import Boolean, Column, ForeignKey, Integer, String, Float, Text, DateTime, JSON, Interval, Enum, UniqueConstraint, ARRAY
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from datetime import datetime
from database.database import Base
import enum

class CandidateStatus(str, enum.Enum):
    SOURCED = "Sourced"
    SCREENING = "Screening"
    INTERVIEW_1 = "Interview 1"
    INTERVIEW_2 = "Interview 2"
    HIRED = "Hired"
    ASSESSMENT = "Assessment"
    OFFER_EXTENDED = "Offer Extended"
    REJECTED = "Rejected"
    INTERVIEW = "Interview"
    TECHNICAL_ROUND = "Technical Round"
    HR_ROUND = "HR Round"

class SourceType(str, enum.Enum):
    COLLEGE = "College"
    JOB_PORTAL = "Job Portal"
    REFERRAL = "Referral"
    INTERNAL = "Internal"
    EXTERNAL = "External"

class Company(Base):
    __tablename__ = "companies"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    departments = Column(ARRAY(String), nullable=True)
    locations = Column(ARRAY(String), nullable=True)
    company_size = Column(Integer, nullable=True)
    website = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    jobs = relationship("Job", back_populates="company")
    candidates = relationship("Candidate", back_populates="company")

class Job(Base):
    __tablename__ = "jobs"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    job_description = Column(Text, nullable=True)
    requirements = Column(Text, nullable=True)
    company_id = Column(Integer, ForeignKey("companies.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    properties = Column(JSON, nullable=True)
    smart_hire_enabled = Column(Boolean, default=False)  # Flag to track if smart hire has been triggered

    company = relationship("Company", back_populates="jobs")
    candidates = relationship("Candidate", back_populates="job")
    assessments = relationship("Assessment", back_populates="job")
    questions = relationship("Question", back_populates="job")
    attitude_analysis = relationship("AttitudeAnalysis", back_populates="job")
    leads = relationship("Lead", back_populates="job")

class Candidate(Base):
    __tablename__ = "candidates"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, nullable=False)
    phone = Column(String(20))
    location = Column(String(255))
    college = Column(String(255))
    skills = Column(Text)
    job_id = Column(Integer, ForeignKey("jobs.id"))
    company_id = Column(Integer, ForeignKey("companies.id"))
    resume_s3_url = Column(String(512))
    assessment_score = Column(Float, nullable=True)
    resume_score = Column(Float, nullable=True)
    resume_summary = Column(Text, nullable=True)
    test_summary = Column(Text, nullable=True)
    status = Column(Enum(CandidateStatus), default=CandidateStatus.SOURCED)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    job = relationship("Job", back_populates="candidates")
    company = relationship("Company", back_populates="candidates")
    performance_reviews = relationship("PerformanceReview", back_populates="candidate")
    exit_predictions = relationship("ExitPrediction", back_populates="candidate")
    assessments = relationship("CandidateAssessment", back_populates="candidate")
    answers = relationship("Answer", back_populates="candidate")
    attitude_analysis = relationship("AttitudeAnalysis", back_populates="candidate")
    interviews = relationship("Interview", back_populates="candidate")

class Interview(Base):
    __tablename__ = "interviews"

    id = Column(Integer, primary_key=True, index=True)
    candidate_id = Column(Integer, ForeignKey("candidates.id", ondelete="CASCADE"))
    interviewer_id = Column(Integer, ForeignKey("interviewers.id"))
    interview_date = Column(DateTime, default=datetime.utcnow)
    feedback = Column(Text)
    culture_fit_score = Column(Float)
    attitude_score = Column(Float)
    contribution_score = Column(Float)

    candidate = relationship("Candidate", back_populates="interviews")
    interviewer = relationship("Interviewer", back_populates="interviews")

class PerformanceReview(Base):
    __tablename__ = "performance_reviews"

    id = Column(Integer, primary_key=True, index=True)
    candidate_id = Column(Integer, ForeignKey("candidates.id", ondelete="CASCADE"))
    review_date = Column(DateTime, default=datetime.utcnow)
    performance_score = Column(Float)
    expectation_delivery_timeline = Column(Interval)

    candidate = relationship("Candidate", back_populates="performance_reviews")

class Interviewer(Base):
    __tablename__ = "interviewers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, nullable=False)

    interviews = relationship("Interview", back_populates="interviewer")

class Source(Base):
    __tablename__ = "sources"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    type = Column(Enum(SourceType), nullable=False)
    location = Column(String(255))

class ExitPrediction(Base):
    __tablename__ = "exit_predictions"

    id = Column(Integer, primary_key=True, index=True)
    candidate_id = Column(Integer, ForeignKey("candidates.id", ondelete="CASCADE"))
    prediction_date = Column(DateTime, default=datetime.utcnow)
    churn_risk = Column(Float)
    warning_signs = Column(Text)

    candidate = relationship("Candidate", back_populates="exit_predictions")

class Assessment(Base):
    __tablename__ = "assessments"

    id = Column(Integer, primary_key=True, index=True)
    difficulty = Column(Integer, nullable=False)
    properties = Column(JSON, nullable=True)
    type = Column(String(255), nullable=False)
    title = Column(String(255), nullable=False)
    assessment_link = Column(String(512), nullable=True)  # Link to the assessment
    job_id = Column(Integer, ForeignKey("jobs.id", ondelete="CASCADE"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    job = relationship("Job", back_populates="assessments")
    candidate_assessments = relationship("CandidateAssessment", back_populates="assessment")
    questions = relationship("Question", back_populates="assessment")

class AssessmentStatus(str, enum.Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    FAILED = "failed"

class QuestionType(str, enum.Enum):
    CODING = "coding"
    MCQ = "mcq"
    OPEN_ENDED = "openended"
    ESSAY = "essay"

class CandidateAssessment(Base):
    __tablename__ = "candidate_assessments"

    id = Column(Integer, primary_key=True, index=True)
    candidate_id = Column(Integer, ForeignKey("candidates.id"))
    assessment_id = Column(Integer, ForeignKey("assessments.id"))
    status = Column(Enum(AssessmentStatus), default=AssessmentStatus.PENDING)
    honesty_score = Column(Float, default=100.0)
    overall_score = Column(Float, default=0.0)
    properties = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    candidate = relationship("Candidate", back_populates="assessments")
    assessment = relationship("Assessment", back_populates="candidate_assessments")
    answers = relationship("Answer", back_populates="candidate_assessment")

class Question(Base):
    __tablename__ = "questions"

    id = Column(Integer, primary_key=True, index=True)
    type = Column(Enum(QuestionType))
    txt = Column(Text, nullable=False)  # Question text content
    job_id = Column(Integer, ForeignKey("jobs.id"))
    assessment_id = Column(Integer, ForeignKey("assessments.id"))
    properties = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    job = relationship("Job", back_populates="questions")
    assessment = relationship("Assessment", back_populates="questions")
    answers = relationship("Answer", back_populates="question")

class Answer(Base):
    __tablename__ = "answers"

    id = Column(Integer, primary_key=True, index=True)
    question_id = Column(Integer, ForeignKey("questions.id"))
    candidate_id = Column(Integer, ForeignKey("candidates.id"))
    candidate_assessment_id = Column(Integer, ForeignKey("candidate_assessments.id"))
    score = Column(Float, default=0.0)
    answer = Column(String)
    properties = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    question = relationship("Question", back_populates="answers")
    candidate = relationship("Candidate", back_populates="answers")
    candidate_assessment = relationship("CandidateAssessment", back_populates="answers")

class AttitudeAnalysis(Base):
    __tablename__ = "attitude_analysis"

    id = Column(Integer, primary_key=True, index=True)
    candidate_id = Column(Integer, ForeignKey("candidates.id"))
    job_id = Column(Integer, ForeignKey("jobs.id"))
    culture_fit_score = Column(Float)
    confidence_score = Column(Float)
    positivity_score = Column(Float)
    enthusiasm_score = Column(Float)
    calmness_score = Column(Float)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    candidate = relationship("Candidate", back_populates="attitude_analysis")
    job = relationship("Job", back_populates="attitude_analysis")
class Lead(Base):
    __tablename__ = "leads"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String)
    platform = Column(String)  # e.g. "Reddit"
    profile_url = Column(String)
    summary = Column(Text)
    relevance_score = Column(Integer)
    job_title = Column(String)
    job_id = Column(Integer, ForeignKey("jobs.id"))  # Reference to the job
    skills = Column(ARRAY(String))  # Array of skills
    location = Column(String)  # Location of the candidate
    email = Column(String, nullable=True)  # Email address if found
    contact_info = Column(Text, nullable=True)  # Other contact methods
    subreddit = Column(String)
    status = Column(String, default="NEW")  # NEW, CONTACTED, RESPONDED, REJECTED
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationship to Job
    job = relationship("Job", back_populates="leads") 
