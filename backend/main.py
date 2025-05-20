from fastapi import FastAPI
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
import google.generativeai as genai
import os
import json

genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

app = FastAPI()

# Making app allow CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

# FastAPI uses pydantic models to shape the data that it expects
class Prompt(BaseModel):
    topic: str

# Prompt gemini to generate the questions    
def promptGemini(prompt: Prompt):
    model = genai.GenerativeModel("models/gemini-pro")
    prompt_text = f"""Generate 3 questions about the topic: {prompt.topic}.
    Each flashcard should have a question and an answer formatted in JSON:
    [
        {{"question": f"What is {prompt.topic}?", "answer": "Fake answer"}}, ...
    ]
    """
    response = model.generate_content(prompt_text)

    return response

@app.post("/generate")    
def flashcards(response):
    try:
        flashcards = json.loads(response.text)
    except json.JSONDecodeError:
        flashcards = [{"question": "Parsing failed", "answer": "response.text"}]
    return flashcards

