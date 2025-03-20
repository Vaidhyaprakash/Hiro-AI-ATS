import ollama
from typing import List
import requests
from stringToJSON import getJSON

json_format = {
    "questions": {
        "mcq": [
            {
                "question": "What is the primary responsibility of an AWS Lambda function?",
                "choices": {
                    "a": "To handle database queries",
                    "b": "To process and respond to API requests",
                    "c": "To manage and orchestrate distributed computing tasks",
                    "d": "To provide authentication and authorization for a web application"
                },
                "answer": "b"
            },
            {
                "question": "What is the time complexity of a binary search algorithm?",
                "choices": {
                    "a": "O(n)",
                    "b": "O(log n)",
                    "c": "O(1)",
                    "d": "O(n log n)"
                },
                "answer": "b"
            },
            {
                "question": "What data structure is best suited for storing a collection of unique items?",
                "choices": {
                    "a": "Array",
                    "b": "Linked List",
                    "c": "Set",
                    "d": "Hash Table"
                },
                "answer": "c"
            },
            {
                "question": "What problem-solving technique involves breaking down a complex problem into smaller, more manageable parts?",
                "choices": {
                    "a": "Divide and Conquer",
                    "b": "Top-Down Approach",
                    "c": "Bottom-Up Approach",
                    "d": "Inductive Reasoning"
                },
                "answer": "a"
            },
            {
                "question": "What programming paradigm is characterized by the use of objects to represent real-world entities?",
                "choices": {
                    "a": "Functional Programming",
                    "b": "Object-Oriented Programming",
                    "c": "Event-Driven Programming",
                    "d": "Declarative Programming"
                },
                "answer": "b"
            }
        ],
        "openended": [
            {
                "question": "Can you describe a situation where you had to troubleshoot and debug a complex issue in your previous role?"
            },
            {
                "question": "How do you stay current with new technologies and advancements in the field of software development?"
            }
        ],
        "coding": [
            {
                "question": "Write a JavaScript function that takes an array of integers as input and returns the maximum value in the array. The function should iterate over the array only once."
            },
            {
                "question": "Implement a simple binary search algorithm in Python to find the index of a target element in a sorted array."
            }
        ]
    }
}

def generate_questions(  num_mcq: int, num_openended: int, num_coding: int, difficulty: str, job_role: str, skills: List[str]):
    prompt = (
        f"Generate a comprehensive set of interview questions for a {job_role} position.\n\n"
        f"Requirements:\n"
        f"- Strictly Generate {num_mcq} multiple choice questions\n"
        f"- Strictly Generate {num_openended} open-ended questions\n"
        f"- Strictly Generate {num_coding} coding questions\n"
        f"- Strictly follow the number of questions you are asked to generate\n"
        f"- Difficulty level: {difficulty}\n"
        f"- Required skills: {', '.join(skills)}\n\n"
        f"Format each question type as follows:\n\n"
        f"1. Multiple Choice Questions:\n"
        f"{{'question': 'Question text?', 'choices': {{'a': 'option1', 'b': 'option2', 'c': 'option3', 'd': 'option4'}}, 'answer': 'correct_option'}}\n\n"
        f"2. Open-ended Questions:\n"
        f"{{ 'question': 'Question text?'}}\n\n"
        f"3. Coding Questions:\n"
        f"{{'question': 'Coding problem description'}}\n\n"
        f"Ensure questions are relevant to the job role and required skills. Return all questions in a JSON array format. \n"
        "{\n"
        '  "questions": {\n'
        '    "mcq": [\n'
        '      {"question": "Question text", "choices": {"a": "option1", "b": "option2", "c": "option3", "d": "option4"}, "answer": "a"}\n'
        '    ],\n'
        '    "openended": [\n'
        '      {"question": "Question text"}\n'
        '    ],\n'
        '    "coding": [\n'
        '      {"question": "Coding problem description"}\n'
        '    ]\n'
        '  }\n'
        '}\n'
        f"Make sure all the key value pairs in the object are enclosed with double quotes"
        f"Don't add comments or text explanation inside the json object, if any question count is 0 then just leave the question type as empty array like this 'questions': {{'question_type': []}}. Just leave that question type array alone as empty, for others populate data."
    )
     
    response = ollama.chat(
        model="llama3",
        messages=[{"role": "user", "content": prompt}]
    )
    # headers = {
    #         "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0ZW5hbnRfZW1haWwiOiJ2ZW5rYXRhLnN1YnJhbWFuaWFtQHN1cnZleXNwYXJyb3cuY29tIiwiZXhwIjoxNzQ0MTI3NDM1fQ.2EmWcPgiLc3zVbonAGl_vAsFPc1sfX08_bbx6iThdF8",
    #         "Content-Type": "application/json"
    #     }
    # response = requests.post(
    #         "https://sparcade.sparrowapps.com/request",
    #         headers=headers,
    #         json={
    #             "model_type": "gpt-4o-mini",
    #             "max_tokens": 10000, 
    #             "temperature": 0.7,
    #             "prompt": prompt
    #         }
    #     )
    # print(response.status_code)
    # print(response.json())
    # data = response.json()["output"]["content"]
    data = response["message"]["content"]
    print(data)
    # Extract the JSON string between ```{}```
    return getJSON(data, json_format)
    
