from fastapi import FastAPI, Body, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
import google.generativeai as genai
from dotenv import load_dotenv
from database import save_flashcards
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
    You are an AI that generates study flashcards in JSON format.

    Generate 3 flashcards on the topic: "{prompt.topic}".

    Each flashcard should be a JSON object with:
    - "question": a concise question string

    - "options": an array of 4 possible answers (strings)
    - "correctAnswer": integer index (0-3) of the correct option

    Return the flashcards as a JSON array — and only return the array. 
    No commentary, no explanations.
    
    The correct answer should be randomly positioned among the options, 
    not always first.

    Example format 1:
    [
    {{  "question": "What is photosynthesis?", 
        "options": [
        "A process used by plants to convert light into energy.",
        "A method plants use to absorb water through their roots.",
        "The process by which animals convert food into energy.",
        "The technique used by fungi to decompose organic material."
        ],
        "correctAnswer": 0
    }},
    ...
    ]

    Example format 2:
    [
    {{  "question": "What is photosynthesis?", 
        "options": [
        "A method plants use to absorb water through their roots.",
        "The process by which animals convert food into energy.",
        "A process used by plants to convert light into energy.",
        "The technique used by fungi to decompose organic material."
        ],
        "correctAnswer": 2
    }},
    ...
    ]
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

# Validating gemini's output
def flashcard_validation(text):
    valid_cards = []
    try:
        parsed = json.loads(text)
        if not isinstance(parsed, list):
            return None
        
    except json.JSONDecodeError as e:
        print("Failed to parse JSON: ", e)
        return None
    
    for item in parsed:
        if not isinstance(item, dict):
            continue
        if "question" not in item or "options" not in item or "correctAnswer" not in item:
            continue
        if not isinstance(item["question"], str) or not item["question"].strip():
            continue
        validOption = True
        if not isinstance(item["options"], list) or len(item["options"]) != 4:
            continue
        for option in item["options"]:
            if not isinstance(option, str) or not option.strip():
                validOption = False
                break
        if not validOption:
            continue
        if not isinstance(item["correctAnswer"], int) or item["correctAnswer"] < 0 or item["correctAnswer"] > 3:
            continue

        valid_cards.append(item)
    
    return valid_cards if valid_cards else None

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
            
        topic_id = save_flashcards(prompt.topic, flashcards)
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