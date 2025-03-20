import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from datetime import datetime, timedelta
import random
from database.database import SessionLocal, engine
from models.models import (
    Company, Job, Candidate, Application, Interview, Offer,
    PerformanceReview, Interviewer, Source, ExitPrediction,
    ApplicationStatus, SourceType, Assessment, CandidateStatus,
    AssessmentStatus, QuestionType, CandidateAssessment, Question,
    Answer, AttitudeAnalysis
)
from sqlalchemy import text

def clear_data():
    db = SessionLocal()
    try:
        # Delete data in reverse order of dependencies
        db.execute(text("DELETE FROM attitude_analysis"))
        db.execute(text("DELETE FROM answers"))
        db.execute(text("DELETE FROM questions"))
        db.execute(text("DELETE FROM candidate_assessments"))
        db.execute(text("DELETE FROM exit_predictions"))
        db.execute(text("DELETE FROM performance_reviews"))
        db.execute(text("DELETE FROM offers"))
        db.execute(text("DELETE FROM interviews"))
        db.execute(text("DELETE FROM applications"))
        db.execute(text("DELETE FROM candidates"))
        db.execute(text("DELETE FROM interviewers"))
        db.execute(text("DELETE FROM sources"))
        db.execute(text("DELETE FROM assessments"))
        db.execute(text("DELETE FROM jobs"))
        db.execute(text("DELETE FROM companies"))
        db.commit()
    except Exception as e:
        print(f"Error clearing data: {e}")
        db.rollback()
    finally:
        db.close()

def seed_data():
    db = SessionLocal()
    
    # Clear existing data first
    clear_data()
    
    try:
        # Seed Companies
        companies = []
        company_names = ["TechCorp", "InnovateSoft", "DataDynamics", "CloudTech", "AIVision",
                        "CyberSec", "QuantumTech", "BlockchainCo", "RoboTech", "SmartSys"]
        
        for i in range(10):
            company = Company(
                name=company_names[i],
                departments=["Engineering", "Product", "Sales", "Marketing"],
                locations=["San Francisco", "New York", "Austin"],
                company_size=random.randint(100, 1000),
                website=f"https://www.{company_names[i].lower()}.com"
            )
            db.add(company)
            companies.append(company)
        db.commit()

        # Seed Jobs
        jobs = []
        roles = ["Software Engineer", "Data Scientist", "Product Manager", "DevOps Engineer",
                "ML Engineer", "Security Engineer", "Full Stack Developer", "Backend Developer",
                "Frontend Developer", "Cloud Architect"]
        
        for i in range(10):
            job = Job(
                title=roles[i],
                job_description=f"We are looking for an experienced {roles[i]}",
                requirements="Bachelor's degree in Computer Science or related field",
                company_id=companies[i].id,
                properties={"flow": {"1": "sourced", "2": "screening", "3": "interview_1", "4": "interview_2", "5": "hired"}}
            )
            db.add(job)
            jobs.append(job)
        db.commit()

        # Seed Assessments
        assessments = []
        assessment_types = ["Technical", "Coding", "System Design", "Problem Solving", "Behavioral"]
        for i in range(10):
            assessment = Assessment(
                job_id=jobs[i].id,
                difficulty=random.randint(1, 5),
                properties={
                    "time_limit": random.randint(30, 120),
                    "questions_count": random.randint(5, 20),
                    "passing_score": random.randint(60, 80)
                },
                type=random.choice(assessment_types),
                title=f"{roles[i]} Assessment"
            )
            db.add(assessment)
            assessments.append(assessment)
        db.commit()

        # Seed Sources
        sources = []
        source_names = ["Stanford", "MIT", "LinkedIn", "Indeed", "Internal Database",
                       "Berkeley", "Referral Program", "Career Fair", "GitHub", "Stack Overflow"]
        source_types = [SourceType.COLLEGE, SourceType.COLLEGE, SourceType.JOB_PORTAL,
                       SourceType.JOB_PORTAL, SourceType.INTERNAL, SourceType.COLLEGE,
                       SourceType.REFERRAL, SourceType.EXTERNAL, SourceType.JOB_PORTAL,
                       SourceType.JOB_PORTAL]
        
        for i in range(10):
            source = Source(
                name=source_names[i],
                type=source_types[i],
                location="United States"
            )
            db.add(source)
            sources.append(source)
        db.commit()

        # Seed Interviewers
        interviewers = []
        for i in range(10):
            interviewer = Interviewer(
                name=f"Interviewer {i+1}",
                email=f"interviewer{i+1}@company.com"
            )
            db.add(interviewer)
            interviewers.append(interviewer)
        db.commit()

        # Seed Candidates
        candidates = []
        for i in range(10):
            candidate = Candidate(
                name=f"Candidate {i+1}",
                email=f"candidate{i+1}@email.com",
                phone=f"+1-555-{100+i:03d}-{2000+i:04d}",
                location="San Francisco, CA",
                college="Stanford University",
                skills="Python, Java, SQL",
                job_id=jobs[i].id,
                company_id=companies[i].id,
                resume_s3_url=f"https://s3.amazonaws.com/resumes/candidate{i+1}.pdf",
                assessment_score=random.uniform(0.6, 1.0),
                resume_score=random.uniform(0.7, 1.0),
                resume_summary=f"Experienced {roles[i]} with strong technical skills and proven track record in software development.",
                test_summary=f"Completed technical assessment with {random.randint(70, 100)}% accuracy. Strong problem-solving skills demonstrated.",
                status=random.choice(list(CandidateStatus))
            )
            db.add(candidate)
            candidates.append(candidate)
        db.commit()

        # Seed Applications
        applications = []
        for i in range(10):
            application = Application(
                candidate_id=candidates[i].id,
                job_id=jobs[i].id,
                job_role=jobs[i].title,
                status=random.choice(list(ApplicationStatus)),
                source_id=sources[i].id,
                time_to_fill=timedelta(days=random.randint(10, 30))
            )
            db.add(application)
            applications.append(application)
        db.commit()

        # Seed Interviews
        interviews = []
        for i in range(10):
            interview = Interview(
                candidate_id=candidates[i].id,
                interviewer_id=interviewers[i].id,
                interview_date=datetime.utcnow() - timedelta(days=random.randint(1, 30)),
                feedback="Good technical skills and cultural fit",
                culture_fit_score=random.uniform(0.7, 1.0),
                attitude_score=random.uniform(0.7, 1.0),
                contribution_score=random.uniform(0.7, 1.0)
            )
            db.add(interview)
            interviews.append(interview)
        db.commit()

        # Seed Offers
        offers = []
        for i in range(10):
            offer = Offer(
                application_id=applications[i].id,
                offer_date=datetime.utcnow() - timedelta(days=random.randint(1, 15)),
                accepted=random.choice([True, False])
            )
            db.add(offer)
            offers.append(offer)
        db.commit()

        # Seed Performance Reviews
        performance_reviews = []
        for i in range(10):
            review = PerformanceReview(
                candidate_id=candidates[i].id,
                review_date=datetime.utcnow() - timedelta(days=random.randint(30, 90)),
                performance_score=random.uniform(0.6, 1.0),
                expectation_delivery_timeline=timedelta(days=random.randint(30, 90))
            )
            db.add(review)
            performance_reviews.append(review)
        db.commit()

        # Seed Exit Predictions
        exit_predictions = []
        for i in range(10):
            prediction = ExitPrediction(
                candidate_id=candidates[i].id,
                prediction_date=datetime.utcnow() - timedelta(days=random.randint(1, 30)),
                churn_risk=random.uniform(0.1, 0.9),
                warning_signs="High workload, Limited growth opportunities"
            )
            db.add(prediction)
            exit_predictions.append(prediction)
        db.commit()

        # Seed CandidateAssessments
        candidate_assessments = []
        for i in range(10):
            candidate_assessment = CandidateAssessment(
                candidate_id=candidates[i].id,
                assessment_id=assessments[i].id,
                status=random.choice(list(AssessmentStatus)),
                honesty_score=random.uniform(0.8, 1.0),
                overall_score=random.uniform(0.6, 1.0),
                properties={
                    "time_taken": random.randint(20, 90),
                    "attempts": random.randint(1, 3)
                }
            )
            db.add(candidate_assessment)
            candidate_assessments.append(candidate_assessment)
        db.commit()

        # Seed Questions
        questions = []
        question_prompts = [
            "Implement a binary search algorithm",
            "Design a scalable microservices architecture",
            "Explain SOLID principles",
            "Write a function to detect palindromes",
            "Describe your experience with agile methodologies"
        ]
        for i in range(10):
            for j in range(5):  # 5 questions per assessment
                question = Question(
                    type=random.choice(list(QuestionType)),
                    job_id=jobs[i].id,
                    assessment_id=assessments[i].id,
                    properties={
                        "prompt": random.choice(question_prompts),
                        "time_limit": random.randint(5, 30),
                        "points": random.randint(10, 20)
                    }
                )
                db.add(question)
                questions.append(question)
        db.commit()

        # Seed Answers
        for i in range(10):
            for j in range(5):  # 5 answers per candidate
                question_idx = i * 5 + j
                answer = Answer(
                    question_id=questions[question_idx].id,
                    candidate_id=candidates[i].id,
                    candidate_assessment_id=candidate_assessments[i].id,
                    score=random.uniform(0.6, 1.0),
                    answer="Sample answer to the technical question...",
                    properties={
                        "time_taken": random.randint(2, 25),
                        "language": random.choice(["Python", "Java", "JavaScript"])
                    }
                )
                db.add(answer)
        db.commit()

        # Seed AttitudeAnalysis
        for i in range(10):
            attitude_analysis = AttitudeAnalysis(
                candidate_id=candidates[i].id,
                job_id=jobs[i].id,
                culture_fit_score=random.uniform(0.6, 1.0),
                confidence_score=random.uniform(0.6, 1.0),
                positivity_score=random.uniform(0.6, 1.0),
                enthusiasm_score=random.uniform(0.6, 1.0),
                calmness_score=random.uniform(0.6, 1.0)
            )
            db.add(attitude_analysis)
        db.commit()

    finally:
        db.close()

if __name__ == "__main__":
    seed_data()
    print("Successfully seeded the database with dummy data!") 