import ollama


def generate_job_requirements(  job_title: str,job_description: str,job_requirements: str,job_responsibilities: str,job_qualifications: str,job_salary: str):
    prompt = f"""
    Generate a job description for the following job title: {job_title}
    Job Description: {job_description}
    Job Requirements: {job_requirements}
    Job Responsibilities: {job_responsibilities}
    Job Qualifications: {job_qualifications}
    Job Salary: {job_salary}
    """
    response = ollama.chat(
        model="llama3",
        messages=[{"role": "user", "content": prompt}]
    )
    return response["message"]["content"]
