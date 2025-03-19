from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import uvicorn

app = FastAPI(title="HR AI Tool API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Models
class QuestionGenerationRequest(BaseModel):
    topic: str
    question_type: str
    num_questions: int
    difficulty: str
    additional_requirements: Optional[str] = None

class Question(BaseModel):
    question: str
    options: Optional[List[str]] = None
    answer: Optional[str] = None

# Routes
@app.get("/")
async def root():
    return {"message": "HR AI Tool API"}

@app.post("/api/resume/analyze")
async def analyze_resume(file: UploadFile = File(...)):
    try:
        # TODO: Implement resume analysis logic
        return {
            "message": "Resume analysis completed",
            "filename": file.filename,
            "status": "success"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/questions/generate", response_model=List[Question])
async def generate_questions(request: QuestionGenerationRequest):
    try:
        # TODO: Implement question generation logic
        # This is a mock response
        questions = [
            Question(
                question=f"Sample question for {request.topic}",
                options=["Option A", "Option B", "Option C", "Option D"],
                answer="Option A"
            )
        ]
        return questions
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/video/analyze")
async def analyze_video(file: UploadFile = File(...)):
    try:
        # TODO: Implement video analysis logic
        return {
            "message": "Video analysis started",
            "filename": file.filename,
            "status": "processing"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True) 