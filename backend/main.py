from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI()

# FastAPI uses pydantic models to shape the data that it expects
class Prompt(BaseModel):
    topic: str

@app.post("/generate")    
def flashcards(prompt: Prompt):
    quests = [
        {"question": f"What is {prompt.topic}?", "answer": "Fake answer"}
            ]
    return quests