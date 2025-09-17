from fastapi import FastAPI, Body, HTTPException, Form, Request
from fastapi.responses import RedirectResponse
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
import google.generativeai as genai
from dotenv import load_dotenv
from database import save_flashcards
from database import record_review_session, get_db_connection
from database import get_all_topics_with_status, get_flashcards_by_topic_name
from database import save_waitlist_email
from urllib.parse import urlparse, urlunparse, urlencode, parse_qsl
from typing import Optional
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
        flashcards = [
            {"question": "Parsing failed", "answer": "response.text"}]


class ReviewResult(BaseModel):
    topic_name: str
    total_questions: int
    correct_answers: int


@app.post("/submit-review")
async def submit_review(result: ReviewResult = Body(...)):
    try:
        # Find the topic by name
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute(
            "SELECT id FROM topics WHERE name = %s ORDER BY created_at DESC LIMIT 1", (result.topic_name,))
        topic = cursor.fetchone()
        cursor.close()
        conn.close()

        if topic:
            record_review_session(
                topic['id'], result.total_questions, result.correct_answers)
            return {"message": "Review recorded successfully"}
        else:
            return {"error": "Topic not found"}

    except Exception as e:
        print('Error recording review:', e)
        return {"error": str(e)}


@app.get("/topics")
async def get_topics():
    try:
        topics = get_all_topics_with_status()
        return topics
    except Exception as e:
        print('Error fetching topics:', e)
        return {"error": str(e)}


@app.get("/review/{topic_name}")
async def get_topic_flashcards(topic_name: str):
    try:
        flashcards = get_flashcards_by_topic_name(topic_name)
        if not flashcards:
            return {"error": "No flashcards found for this topic"}
        return flashcards
    except Exception as e:
        print('Error fetching flashcards:', e)
        return {"error": str(e)}


@app.post("/waitlist")
async def join_waitlist(email: str = Form(...), redirect: Optional[str] = Form(None), request: Request = None):
    try:
        save_waitlist_email(email, request.headers.get("origin"))
    except Exception as e:
        print("waitlist save error:", e) 

    def _clean(v: Optional[str]) -> Optional[str]:
        if not v:
            return None
        v = v.strip()
        if v.lower() in {"null", "undefined", "about:blank"}:
            return None
        return v

    cand_redirect = _clean(redirect)
    cand_referer = _clean(request.headers.get("referer"))
    cand_env = _clean(os.getenv("LANDING_URL"))
    cand_origin = _clean(request.headers.get("origin"))

    target = cand_redirect or cand_referer or cand_env
    if not target:
        if cand_origin and cand_origin.startswith("http"):
            target = cand_origin.rstrip("/") + "/landing/index.html"
        else:
            # final local fallback for dev
            target = "http://127.0.0.1:5500/landing/index.html"

    # Append thanks=1 and #waitlist
    parts = urlparse(target)
    query = dict(parse_qsl(parts.query))
    query["thanks"] = "1"
    new_query = urlencode(query)
    new_parts = parts._replace(query=new_query, fragment="waitlist")
    final_url = urlunparse(new_parts)
    return RedirectResponse(url=final_url, status_code=303)

''' 
available_models = genai.list_models()
for model_info in available_models:
    print(f"Model name: {model_info.name}")
    print(f"Supported generation methods: {model_info.supported_generation_methods}")
    print("-" * 50)
'''
