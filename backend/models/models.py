from sqlalchemy import Boolean, Column, ForeignKey, Integer, String, Float, Text, DateTime, JSON, Interval, Enum, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from datetime import datetime
from database.database import Base
import enum

class ApplicationStatus(str, enum.Enum):
    APPLIED = "Applied"
    SCREENING = "Screening"
    INTERVIEW = "Interview"
    OFFER_EXTENDED = "Offer Extended"
    HIRED = "Hired"
    REJECTED = "Rejected"

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
    description = Column(Text)
    website = Column(String, nullable=True)
    location = Column(String, nullable=True)
    industry = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    jobs = relationship("Job", back_populates="company")
    candidates = relationship("Candidate", back_populates="company")

class Job(Base):
    __tablename__ = "jobs"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    description = Column(Text)
    company_id = Column(Integer, ForeignKey("companies.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    company = relationship("Company", back_populates="jobs")
    candidates = relationship("Candidate", back_populates="job")

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
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    job = relationship("Job", back_populates="candidates")
    company = relationship("Company", back_populates="candidates")
    applications = relationship("Application", back_populates="candidate")
    performance_reviews = relationship("PerformanceReview", back_populates="candidate")
    exit_predictions = relationship("ExitPrediction", back_populates="candidate")

class Application(Base):
    __tablename__ = "applications"

    id = Column(Integer, primary_key=True, index=True)
    candidate_id = Column(Integer, ForeignKey("candidates.id", ondelete="CASCADE"))
    job_role = Column(String(255), nullable=False, default="Engineering")
    applied_date = Column(DateTime, default=datetime.utcnow)
    status = Column(Enum(ApplicationStatus), nullable=False)
    time_to_fill = Column(Interval)
    source_id = Column(Integer, ForeignKey("sources.id"))

    candidate = relationship("Candidate", back_populates="applications")
    source = relationship("Source", back_populates="applications")
    interviews = relationship("Interview", back_populates="application")
    offers = relationship("Offer", back_populates="application")

    __table_args__ = (
        UniqueConstraint('candidate_id', 'job_role', name='unique_application'),
    )

class Interview(Base):
    __tablename__ = "interviews"

    id = Column(Integer, primary_key=True, index=True)
    application_id = Column(Integer, ForeignKey("applications.id", ondelete="CASCADE"))
    interviewer_id = Column(Integer, ForeignKey("interviewers.id"))
    interview_date = Column(DateTime, default=datetime.utcnow)
    feedback = Column(Text)
    culture_fit_score = Column(Float)
    attitude_score = Column(Float)
    contribution_score = Column(Float)

    application = relationship("Application", back_populates="interviews")
    interviewer = relationship("Interviewer", back_populates="interviews")

class Offer(Base):
    __tablename__ = "offers"

    id = Column(Integer, primary_key=True, index=True)
    application_id = Column(Integer, ForeignKey("applications.id", ondelete="CASCADE"))
    offer_date = Column(DateTime, default=datetime.utcnow)
    accepted = Column(Boolean, default=False)

    application = relationship("Application", back_populates="offers")

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

    applications = relationship("Application", back_populates="source")

class ExitPrediction(Base):
    __tablename__ = "exit_predictions"

    id = Column(Integer, primary_key=True, index=True)
    candidate_id = Column(Integer, ForeignKey("candidates.id", ondelete="CASCADE"))
    prediction_date = Column(DateTime, default=datetime.utcnow)
    churn_risk = Column(Float)
    warning_signs = Column(Text)

    candidate = relationship("Candidate", back_populates="exit_predictions") 