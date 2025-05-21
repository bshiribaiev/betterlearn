from fastapi import FastAPI, Body
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
import google.generativeai as genai
from dotenv import load_dotenv
import os
import json

load_dotenv()
genai.configure(api_key=os.environ["GEMINI_API_KEY"])
model = genai.GenerativeModel('gemini-pro')

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
    prompt_text = f"""
    Generate 3 questions about the topic: {prompt.topic}.
    Each flashcard should have a question and an answer formatted in JSON:
    [
        {{"question": f"What is {prompt.topic}?", "answer": "Fake answer"}}, ...
    ]
    Respond ONLY with valid JSON
    """
    response = client.models.generate_content(
        model="gemini-2.0-flash",
        contents=prompt_text,
    )

    return response

# Load the Gemini response to the flashcard
@app.post("/generate")
async def flashcards(prompt: Prompt = Body(...)):
    response = promptGemini(prompt)

    try:
        print("Gemini raw response:", response)

        print("Response.text (if exists):", getattr(response, 'text', 'No .text'))

        flashcards = json.loads(response.text)
    except Exception as e:
        print('error: ', e)
        flashcards = [{"question": "Parsing failed", "answer": "response.text"}]
    return flashcards

    '''
    except json.JSONDecodeError:
        flashcards = [{"question": "Parsing failed", "answer": "response.text"}]
    return flashcards

'''