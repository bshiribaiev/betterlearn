from fastapi import FastAPI, Body, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
import google.generativeai as genai
from dotenv import load_dotenv
import os
import json
import re

load_dotenv()
api_key = os.getenv("GEMINI_API_KEY")
genai.configure(api_key=api_key)
model = genai.GenerativeModel('models/gemini-2.0-flash')

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
    Do not include any explanations, markdown formatting, or additional text.
    Respond ONLY with valid JSON
    """
    response = model.generate_content([prompt_text])

    return response

# Extract JSON from a response that might contain extra text
def extract_json(text):
    # Try to find JSON array using regex
    json_match = re.search(r'\[\s*{.*}\s*\]', text, re.DOTALL)
    if json_match:
        return json_match.group(0)
    return text

# Load the Gemini response to the flashcard
@app.post("/generate")
async def flashcards(prompt: Prompt = Body(...)):
    try:
        response = promptGemini(prompt)
        print("Gemini raw response:", response)

        response_text = response.text

        try:
            flashcards = json.loads(response.text)
        except json.JSONDecodeError:
            extracted_json = extract_json(response_text)
            try:
                flashcards = json.loads(extracted_json)
            except json.JSONDecodeError as e:
                raise HTTPException(status_code=422, detail={
                    "error": str(e),
                    "raw_response": response_text
                })
        return flashcards    
    
    except Exception as e:
        print('error: ', e)
        flashcards = [{"question": "Parsing failed", "answer": "response.text"}]

''' 
available_models = genai.list_models()
for model_info in available_models:
    print(f"Model name: {model_info.name}")
    print(f"Supported generation methods: {model_info.supported_generation_methods}")
    print("-" * 50)
'''