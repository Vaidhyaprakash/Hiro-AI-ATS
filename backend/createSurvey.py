import requests
import os
from typing import List
from questionGenerator import generate_questions
from models.models import Assessment, Question, CandidateAssessment
from sqlalchemy.orm import Session
from fastapi import HTTPException
from models.models import Question
from datetime import datetime

def create_survey(survey_name: str):
    url = "https://api.salesparrow.com/v3/surveys"
    headers = {
        "Authorization": f"Bearer {os.getenv('SURVEYSPARROW_API_KEY')}",
        "Content-Type": "application/json"
    }
    data = {
        "name": survey_name,
        "survey_type": "ClassicForm"
    }

    response = requests.post(url, headers=headers, json=data)
    print(f"Survey created: {response.json()}")
    return response.json()["data"]

def create_question(survey_id: int, question: str, question_type: str, choices: List[str] = None):
    url = "https://api.salesparrow.com/v3/questions"
    headers = {
        "Authorization": f"Bearer {os.getenv('SURVEYSPARROW_API_KEY')}",
        "Content-Type": "application/json"
    }
    data = {
        "survey_id": survey_id,
        "question": {
            "text": question,
        }
    }
    if question_type == "mcq":
        data["question"]["type"] = "MultiChoice"
        data["question"]["choices"] = choices
    else:
        data["question"]["type"] = "TextInput"
    

    response = requests.post(url, headers=headers, json=data)
    print(f"Question created: {response.json()}")
    return response.json()["data"]

def create_channel(name: str, survey_id: int):
    url = "https://api.salesparrow.com/v3/channels"
    headers = {
        "Authorization": f"Bearer {os.getenv('SURVEYSPARROW_API_KEY')}",
        "Content-Type": "application/json"
    }
    data = {
        "name": name,
        "survey_id": survey_id,
        "type": "LINK"
    }
    response = requests.post(url, headers=headers, json=data)
    print(f"Channel created: {response.json()}")
    return response.json()["data"]

def create_workflow(survey_id: int, assessment_id: int, db: Session, candidate_assessment: CandidateAssessment):
    url = "https://api.salesparrow.com/v3/webhooks"
    headers = {
        "Authorization": f"Bearer {os.getenv('SURVEYSPARROW_API_KEY')}",
        "Content-Type": "application/json"
    }
    data = {
        "url": os.getenv('NGROK_URL') + "/api/answer/submit",
        "survey_id": survey_id,
        "http_method": "POST",
        "payload": {
            "answers": {},
            "candidate_assessment_id": candidate_assessment.id
        }
    } 
    questions = db.query(Question).filter(
        Question.assessment_id == assessment_id,
        Question.type != 'CODING'
    ).all()
    for question in questions:
        data["payload"]["answers"][question.id] = f"{{question_{question.properties['question_id']}}}"
    response = requests.post(url, headers=headers, json=data)
    print(f"Workflow created -> {response.json()}")
    return response.json()["data"]

        

def create_question_record(db: Session, assessment_id: int, question: str, question_type: str, job_id: int, question_id: int = None, choices: List[dict] = None, answer: str = None):
    """
    Create a question record in the database.
    
    Args:
        db: Database session
        assessment_id: ID of the assessment this question belongs to
        question: The question text
        question_type: Type of question (mcq, openended, coding)
        choices: Dictionary of choices for MCQ questions (optional)
    
    Returns:
        Question: Created question record
    """
    try:
        # Create question properties
        question_properties = {
            "type": question_type,
            "choices": choices if choices else None,
            "answer": answer if answer else None,
            "question_id": question_id if question_id else None
        }

        # Create question in database
        question_record = Question(
            assessment_id=assessment_id,
            txt=question,
            type=question_type,
            properties=question_properties,
            job_id=job_id
        )
        
        db.add(question_record)
        db.commit()
        db.refresh(question_record)
        print(question_record)
        return question_record

    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to create question record: {str(e)}"
        )

def generateQuestionsAndStore(num_mcq: int, num_openended: int, num_coding: int, difficulty: str, job_role: str, skills: List[str], assessment_id: int, job_id: int, db: Session):
    questions = generate_questions(num_mcq, num_openended, num_coding, difficulty, job_role, skills)
    survey = create_survey(job_role)
    survey_id = survey["id"]
    # Create assessment properties
    assessment_properties = {
        "survey_id": survey_id,
        "num_mcq": num_mcq,
        "num_openended": num_openended,
        "num_coding": num_coding,
        "skills": skills,
    }
    print(f"Questions-> {questions}")
    for question_type, questions_list in questions["questions"].items():
        for question in questions_list:
            print(f"Question-> {question}")
            params = {
                "db": db,
                "assessment_id": assessment_id,
                "question": question["question"],
                "question_type": question_type,
                "job_id": job_id
            }
            if question_type == "mcq":
                if "choices" in question and question["choices"]:
                    newChoices = []
                    if isinstance(question["choices"], dict):
                        for key, choice in question["choices"].items():
                            print(f"Choice-> {choice}")
                            newChoices.append({"text": choice})  
                params["choices"] = newChoices
                created_question = create_question(survey_id, question["question"], question_type, newChoices)
                params["question_id"] = created_question["id"]
                if "answer" in question:
                    params["answer"] = question["choices"][question["answer"]]
                create_question_record(**params)
            elif question_type == "openended":
                created_question = create_question(survey_id, question["question"], question_type)
                params["question_id"] = created_question["id"]
                create_question_record(**params)
            elif question_type == "coding":
                create_question_record(**params)

    channel = create_channel(job_role, survey["id"])
    db.query(Assessment).filter(Assessment.id == assessment_id).update({
            "properties": assessment_properties,
            "assessment_link": channel["url"]
        })
    db.commit()
    candidate_assessment = db.query(CandidateAssessment).filter(CandidateAssessment.assessment_id == assessment_id).first()
    db.commit()
    create_workflow(survey["id"], assessment_id, db, candidate_assessment)
    return {"success": True}

