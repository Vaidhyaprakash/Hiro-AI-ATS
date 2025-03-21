from models.models import Question, CandidateAssessment, Answer
from sqlalchemy.orm import Session
from paperCorrection import paper_correction
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy import cast, String
from pydantic import BaseModel



def handleWorkflow(answers: dict, db: Session, candidate_assessment_id: int):
    assessment_id = ""
    for key, value in answers.items():
        candidate_assessment = db.query(CandidateAssessment).filter(CandidateAssessment.id == candidate_assessment_id).first()
        answer = Answer(
            question_id=key,
            candidate_id=candidate_assessment.candidate_id,
            candidate_assessment_id=candidate_assessment.id,
            answer=value
        )
        db.add(answer)
        db.commit()
    callPaperCorrection(db, candidate_assessment)

def callPaperCorrection(db: Session, candidate_assessment: CandidateAssessment):
    questions = db.query(Question).filter(Question.assessment_id == candidate_assessment.assessment_id).all()
    
    answers_to_correct = []
    for question in questions:
        answer_record = db.query(Answer).filter(Answer.question_id == question.id, Answer.candidate_assessment_id == candidate_assessment.id).first()
        answer = {
            "question_id": question.properties['question_id'],
            "answer": answer_record.answer,
            "question_type": question.type,
            "question": question.txt,
            "candidate_assessment_id": candidate_assessment.id,
            "id": answer_record.id
        }
        answers_to_correct.append(answer)
    result = paper_correction(answers_to_correct, db)
    print("Result: ", result)
    db.query(CandidateAssessment).filter(CandidateAssessment.id == candidate_assessment.id).update({"overall_score": result["summary_scores"]["total"], "properties": result})
    db.commit()