import requests
import os
from typing import List
from questionGenerator import generate_questions
from models.models import Assessment
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
    return response.json()

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
    return response.json()

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
    return response.json()

def create_question_record(assessment_id: int, question: str, question_type: str, job_id: int, choices: dict = None, answer: str = None):
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
            "answer": answer if answer else None
        }

        # Create question in database
        question_record = Question(
            assessment_id=assessment_id,
            question_text=question,
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

def generateQuestionsAndStore(num_mcq: int, num_openended: int, num_coding: int, difficulty: str, job_role: str, skills: List[str], assessment_id: int, job_id: int):
    questions = generate_questions(num_mcq, num_openended, num_coding, difficulty, job_role, skills)
    survey = create_survey(job_role)
    channel = create_channel(job_role, survey_id)
    survey_id = survey["id"]
    # Create assessment properties
    assessment_properties = {
        "survey_id": survey_id,
        "num_mcq": num_mcq,
        "num_openended": num_openended,
        "num_coding": num_coding,
        "skills": skills,
    }
    
    with Session() as db:
        db.query(Assessment).filter(Assessment.id == assessment_id).update({
            "properties": assessment_properties,
            "assessment_link": channel.data.url,
            "updated_at": datetime.utcnow()
        })
        db.commit()

    for question_type in questions.questions:
        for question in question_type:
            if question_type == "mcq":
                if "choices" in question and question["choices"]:
                    newChoices = []
                    if isinstance(question["choices"], dict):
                        for key, choice in question["choices"].items():
                            newChoices.append({"text": question["choices"][key]})     
                create_question(survey_id, question["question"], question_type, newChoices)
                create_question_record(assessment_id, question["question"], question_type, job_id, newChoices)
            elif question_type == "openended":
                create_question(survey_id, question["question"], question_type)

