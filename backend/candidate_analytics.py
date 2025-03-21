from typing import Dict, List, Optional
from sqlalchemy.orm import Session
from models.models import (
    Candidate, Interview, PerformanceReview, CandidateAssessment,
    Answer, AttitudeAnalysis
)
from sqlalchemy import func
from datetime import datetime

def get_candidate_performance_metrics(db: Session, candidate_id: int) -> Dict:
    """
    Analyze candidate performance across multiple dimensions:
    1. Technical Skills (from assessments and answers)
    2. Behavioral Analysis (from interviews and attitude analysis)
    3. Performance Metrics (from reviews)
    4. Status Progress
    """
    metrics = {
        "technical_skills": {},
        "behavioral_analysis": {},
        "performance_metrics": {},
        "status_progress": {},
        "radar_chart_data": {},
        "timeline_data": [],
        "strengths_weaknesses": {"strengths": [], "weaknesses": []}
    }

    # Get candidate basic info
    candidate = db.query(Candidate).filter(Candidate.id == candidate_id).first()
    if not candidate:
        return {"error": "Candidate not found"}

    # 1. Technical Skills Analysis
    assessment_data = db.query(CandidateAssessment).filter(
        CandidateAssessment.candidate_id == candidate_id
    ).first()

    if assessment_data:
        metrics["technical_skills"] = {
            "overall_score": assessment_data.overall_score,
            "honesty_score": assessment_data.honesty_score
        }

    # Add answer scores
    answers = db.query(Answer).filter(
        Answer.candidate_id == candidate_id
    ).all()
    
    if answers:
        avg_answer_score = sum(a.score for a in answers) / len(answers)
        metrics["technical_skills"]["average_answer_score"] = avg_answer_score
        
        # Analyze performance by question type
        question_type_scores = {}
        for answer in answers:
            question = answer.question
            if question.type.value not in question_type_scores:
                question_type_scores[question.type.value] = []
            question_type_scores[question.type.value].append(answer.score)
        
        metrics["technical_skills"]["question_type_analysis"] = {
            qtype: sum(scores) / len(scores)
            for qtype, scores in question_type_scores.items()
        }

    # 2. Behavioral Analysis
    attitude = db.query(AttitudeAnalysis).filter(
        AttitudeAnalysis.candidate_id == candidate_id
    ).first()

    if attitude:
        metrics["behavioral_analysis"] = {
            "culture_fit": attitude.culture_fit_score,
            "confidence": attitude.confidence_score,
            "positivity": attitude.positivity_score,
            "enthusiasm": attitude.enthusiasm_score,
            "calmness": attitude.calmness_score
        }

    # Add interview scores
    interviews = db.query(Interview).filter(
        Interview.candidate_id == candidate_id
    ).all()

    if interviews:
        avg_interview_scores = {
            "culture_fit": sum(i.culture_fit_score for i in interviews) / len(interviews),
            "attitude": sum(i.attitude_score for i in interviews) / len(interviews),
            "contribution": sum(i.contribution_score for i in interviews) / len(interviews)
        }
        metrics["behavioral_analysis"]["interview_scores"] = avg_interview_scores

    # 3. Performance Metrics
    performance = db.query(PerformanceReview).filter(
        PerformanceReview.candidate_id == candidate_id
    ).first()

    if performance:
        metrics["performance_metrics"] = {
            "performance_score": performance.performance_score,
            "delivery_timeline": performance.expectation_delivery_timeline.days
        }

    # 4. Status Progress
    if candidate:
        metrics["status_progress"] = {
            "current_status": candidate.status.value,
            "assessment_score": candidate.assessment_score,
            "resume_score": candidate.resume_score
        }

    # 5. Radar Chart Data (normalized scores for visualization)
    metrics["radar_chart_data"] = {
        "Technical Competency": candidate.assessment_score,
        "Cultural Fit": attitude.culture_fit_score if attitude else 0,
        "Performance": performance.performance_score if performance else 0,
        "Communication": attitude.confidence_score if attitude else 0,
        "Problem Solving": avg_answer_score if answers else 0
    }

    # 6. Timeline Data
    timeline_events = []
    if candidate:
        timeline_events.append({
            "date": candidate.created_at.isoformat(),
            "event": "Candidate Registered",
            "status": candidate.status.value
        })
    
    for interview in interviews:
        timeline_events.append({
            "date": interview.interview_date.isoformat(),
            "event": "Interview Conducted",
            "score": (interview.culture_fit_score + interview.attitude_score + interview.contribution_score) / 3
        })

    metrics["timeline_data"] = sorted(timeline_events, key=lambda x: x["date"])

    # 7. Strengths and Weaknesses Analysis
    threshold = 0.7  # Threshold for determining strengths/weaknesses
    all_scores = []
    
    if attitude:
        all_scores.extend([
            ("Culture Fit", attitude.culture_fit_score),
            ("Confidence", attitude.confidence_score),
            ("Positivity", attitude.positivity_score),
            ("Enthusiasm", attitude.enthusiasm_score),
            ("Calmness", attitude.calmness_score)
        ])

    if assessment_data:
        all_scores.extend([
            ("Technical Assessment", assessment_data.overall_score),
            ("Honesty", assessment_data.honesty_score)
        ])

    for metric, score in all_scores:
        if score >= threshold:
            metrics["strengths_weaknesses"]["strengths"].append(metric)
        else:
            metrics["strengths_weaknesses"]["weaknesses"].append(metric)

    return metrics 