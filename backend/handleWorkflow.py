from models.models import Question, CandidateAssessment
from sqlalchemy.orm import Session
from paperCorrection import paper_correction
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy import cast, String


def handleWorkflow(answers: dict, db: Session):
    assessment_id = ""
    for key, value in answers.items():
        question_id = key
        question = db.query(Question).filter(
            cast(Question.properties['question_id'], String) == str(question_id)
        ).first()
        if question:
            question.properties['answer'] = value
            db.commit()
            print(f"Question {question_id} updated with answer {value}")
        else:
            print(f"Question {question_id} not found")
        assessment_id = question.assessment_id
    callPaperCorrection(db, assessment_id)

def callPaperCorrection(db: Session, assessment_id: int):
    questions = db.query(Question).filter(Question.assessment_id == assessment_id).all()
    answers = []
    for question in questions:
        answer = {
            "question_id": question.properties['question_id'],
            "answer": question.properties['answer'],
            "question_type": question.type,
            "question": question.txt
        }
        answers.append(answer)
    result = paper_correction(answers)
    print("Result: ", result)
    candidate_assessment = db.query(CandidateAssessment).filter(CandidateAssessment.assessment_id == assessment_id).first()
    candidate_assessment.properties['result'] = result
    db.commit()
