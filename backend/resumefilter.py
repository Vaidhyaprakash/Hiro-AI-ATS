import os
import pdfplumber
import docx
import json
import ollama
import httpx
from typing import List, Dict
import re
from sqlalchemy.orm import Session
from models.models import Job, Candidate

# Load Ollama model
MODEL_NAME = "llama3"

async def download_file(url: str, local_filename: str) -> str:
    """Download file from URL and save it locally"""
    async with httpx.AsyncClient() as client:
        response = await client.get(url)
        response.raise_for_status()
        with open(local_filename, "wb") as f:
            f.write(response.content)
        return local_filename

def extract_text_from_pdf(pdf_path: str) -> str:
    with pdfplumber.open(pdf_path) as pdf:
        return "\n".join([page.extract_text() for page in pdf.pages if page.extract_text()])

def extract_text_from_docx(docx_path: str) -> str:
    doc = docx.Document(docx_path)
    return "\n".join([para.text for para in doc.paragraphs])

async def extract_text(file_path: str) -> str:
    try:
        if file_path.startswith(('http://', 'https://')):
            # Create a temporary file with the correct extension
            ext = os.path.splitext(file_path)[1].lower()
            temp_file = f"temp_{os.urandom(8).hex()}{ext}"
            try:
                await download_file(file_path, temp_file)
                if ext == '.pdf':
                    text = extract_text_from_pdf(temp_file)
                elif ext == '.docx':
                    text = extract_text_from_docx(temp_file)
                else:
                    raise ValueError("Unsupported file format")
                return text
            finally:
                # Clean up temporary file
                if os.path.exists(temp_file):
                    os.remove(temp_file)
        else:
            # Local file processing
            if file_path.endswith('.pdf'):
                return extract_text_from_pdf(file_path)
            elif file_path.endswith('.docx'):
                return extract_text_from_docx(file_path)
            else:
                raise ValueError("Unsupported file format")
    except Exception as e:
        print(f"Error processing file {file_path}: {str(e)}")
        raise

def generate_job_description(job_title: str,job_description: str,job_requirements: str, resume_texts: List[str]) -> str:
    resumes_text = "\n\n".join(resume_texts)
    prompt = (
        "Given the following resumes, generate a job description that best fits the skills and experience mentioned.\n"
        f"Job Title: {job_title}\n"
        f"Job Description: {job_description}\n"
        f"Job Requirements: {job_requirements}\n"
        f"Resumes:\n{resumes_text}"
    )

    response = ollama.chat(model=MODEL_NAME, messages=[{"role": "user", "content": prompt}])
    return response['message']['content'].strip()

def score_resumes(job_description: str, resume: str):
    example = '{"score": 0.85, "summary": "Strong experience in Python and Flask, matches JD well."}'
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
            return result
        else:
            return {"score": 0, "summary": "Could not process the response."}
    except json.JSONDecodeError as e:
        print(f"JSON decode error: {str(e)}")
        return {"score": 0, "summary": "Could not process the response."}


async def process_resumes(job_id: int, db: Session):
    job = db.query(Job).filter(Job.id == job_id).first()
    candidates = db.query(Candidate).filter(Candidate.job_id == job_id, Candidate.status == "SOURCED").all()
    
    
    for candidate in candidates:
        try:
            text = await extract_text(candidate.resume_s3_url)
            job_desc = generate_job_description(job.title,job.job_description,job.requirements, text)
            scores = score_resumes(job_desc, text)
            newCandidate = Candidate(
                name=candidate.name,
                email=candidate.email,
                phone=candidate.phone,
                location=candidate.location,
                college=candidate.college,
                skills=text,
                job_id=job_id,
                company_id=job.company_id,
                resume_s3_url=candidate.resume_s3_url,
                assessment_score=scores['score'],
                resume_summary=scores['summary']
            )
            db.query(Candidate).filter(
                Candidate.id == candidate.id
            ).update({
                'name': newCandidate.name,
                'email': newCandidate.email,
                'phone': newCandidate.phone,
                'location': newCandidate.location,
                'college': newCandidate.college,
                'skills': newCandidate.skills,
                'job_id': newCandidate.job_id,
                'status': "SCREENING",
                'company_id': newCandidate.company_id,
                'resume_s3_url': newCandidate.resume_s3_url,
                'resume_score': newCandidate.assessment_score,
                'resume_summary': newCandidate.resume_summary
            })
            db.commit()
        except Exception as e:
            print(f"Error processing resume from {candidate.resume_s3_url}: {str(e)}")
    