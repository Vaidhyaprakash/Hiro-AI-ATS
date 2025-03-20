import os
import pdfplumber
import docx
import json
import ollama
from typing import List, Dict
import re  

# Load Ollama model
MODEL_NAME = "llama3"

def extract_text_from_pdf(pdf_path: str) -> str:
    with pdfplumber.open(pdf_path) as pdf:
        return "\n".join([page.extract_text() for page in pdf.pages if page.extract_text()])

def extract_text_from_docx(docx_path: str) -> str:
    doc = docx.Document(docx_path)
    return "\n".join([para.text for para in doc.paragraphs])

def extract_text(file_path: str) -> str:
    if file_path.endswith(".pdf"):
        return extract_text_from_pdf(file_path)
    elif file_path.endswith(".docx"):
        return extract_text_from_docx(file_path)
    else:
        raise ValueError("Unsupported file format")

def generate_job_description(resume_texts: List[str]) -> str:
    resumes_text = "\n\n".join(resume_texts)
    prompt = (
        "Given the following resumes, generate a job description that best fits the skills and experience mentioned.\n"
        f"Resumes:\n{resumes_text}"
    )

    response = ollama.chat(model=MODEL_NAME, messages=[{"role": "user", "content": prompt}])
    return response['message']['content'].strip()

def score_resumes(job_description: str, resumes: List[str]) -> List[Dict[str, str | float]]:
    results = []
    example = '{"score": 0.85, "summary": "Strong experience in Python and Flask, matches JD well."}'

    for resume in resumes:
        prompt = (
            f"Job Description:\n{job_description}\n\n"
            f"Resume:\n{resume}\n\n"
            "Evaluate how well this resume matches the job description on a scale of 0 to 1.\n"
            "Also, provide a short summary explaining why this score was given.\n"
            f"Return the result in JSON format like this:\n{example}"
        )

        response = ollama.chat(model=MODEL_NAME, messages=[{"role": "user", "content": prompt}])
        
        try:
            match = re.search(r"\{.*\}", response['message']['content'], re.DOTALL)
            result = json.loads(match.group(0))
            if isinstance(result, dict) and "score" in result and "summary" in result:
                results.append(result)
            else:
                results.append({"score": 0, "summary": "Invalid response format."})
        except json.JSONDecodeError as e:
            print(f"JSON decode error: {str(e)}")
            results.append({"score": 0, "summary": "Could not process the response."})

    return results


def process_resumes():
    resume_files = ["resume1.pdf", "resume2.pdf"]
    resume_texts = [extract_text(resume) for resume in resume_files]

    job_desc = generate_job_description(resume_texts)
    scores = score_resumes(job_desc, resume_texts)

    output = {"resumes": scores}
    print(json.dumps(output, indent=4))