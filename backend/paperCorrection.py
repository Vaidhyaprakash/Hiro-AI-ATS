import ollama
from stringToJSON import getJSON
from typing import List
from pydantic import BaseModel

class Answer(BaseModel):
    question: str
    answer: str
    question_type: str
    question_id: int


json_format = {
    "score": 0.34
}

def correct_answer(question: str, answer: str, question_type: str):
    prompt = f"Check if the answer is correct for the question: {question} and the question type is: {question_type}. The answer is: {answer}"
    if question_type == "coding":   
        prompt += (
            "Evaluate this coding solution:\n"
            "The coding syntax need not be 100 percent correct\n"
            "Evaluate the logic of the code\n"
            "Evaluate the time and space complexity in the logic of the code\n"
            "Evaluate the performance of the code logic\n"
            "After evaluating all the points, give a score out of 0 to 1 with decimals fixed to 2 points\n"
            "Return the score in the following format: {\"score\": 0.00}"
        )
        response = ollama.chat(model="gemma3:4b", messages=[{"role": "user", "content": prompt}])
        return getJSON(response["message"]["content"], json_format)
    elif question_type == "openended":
        prompt += (
            "Evaluate the answer for the question: {question} and the question type is: {question_type}. The answer is: {answer}"
            "Give a score out of 0 to 1 with decimals fixed to 2 points based on the correctness of the answer"
            "Return the score in the following format: {\"score\": 0.00}"
        )
        response = ollama.chat(model="llama3.2:3b", messages=[{"role": "user", "content": prompt}])
        return getJSON(response["message"]["content"], json_format)
    elif question_type == "mcq":
        prompt += (
            "Evaluate the answer for the question: {question} and the question type is: {question_type}. The answer is: {answer}"
            "Give a score either 0 or 1 based on the correctness of the answer"
            "Return the score in the following format: {\"score\": 1}"
        )
        response = ollama.chat(model="llama3", messages=[{"role": "user", "content": prompt}])
        return getJSON(response["message"]["content"], json_format)


def paper_correction(questions: List[Answer]):
    # Initialize result structures
    detailed_scores = {
        "coding": [],
        "openended": [],
        "mcq": []
    }
    summary_scores = {
        "coding": 0,
        "openended": 0,
        "mcq": 0,
        "total": 0
    }
    
    # Process each answer
    for answer in questions:
        retries = 0
        max_retries = 3
        result = None
        
        # Try to get score with retries
        while retries <= max_retries:
            result = correct_answer(answer["question"], answer["answer"], answer["question_type"])
            if result and "score" in result:
                break
            retries += 1
        
        score = result.get("score", 0) if result and "score" in result else 0
        
        # Add to detailed scores
        question_score = {
            "question": answer["question"],
            "score": score,
            "question_id": answer["question_id"]
        }
        detailed_scores[answer["question_type"]].append(question_score)
        
        # Convert score to integer before adding
        summary_scores[answer["question_type"]] += int(float(score))
    
    # Calculate total score
    summary_scores["total"] = (
        summary_scores["coding"] + 
        summary_scores["openended"] + 
        summary_scores["mcq"]
    )
    
    return {
        "detailed_scores": detailed_scores,
        "summary_scores": summary_scores
    }
    