import psycopg2
from psycopg2.extras import RealDictCursor
import os
from dotenv import load_dotenv

load_dotenv()

def get_db_connection():
    return psycopg2.connect(
        host="localhost",
        database="betterlearn",
        user="shiribaiev",  
        password="",  
        cursor_factory=RealDictCursor
    )

def create_topic(name):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute(
        "INSERT INTO topics (name) VALUES (%s) RETURNING id",
        (name,)
    )
    topic_id = cursor.fetchone()['id']
    
    conn.commit()
    cursor.close()
    conn.close()
    
    return topic_id

# Store flashcards
def save_flashcards(topic_name, flashcards_data):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Create the topic first
    topic_id = create_topic(topic_name)
    
    # Save each flashcard
    for flashcard in flashcards_data:
        cursor.execute(
            """INSERT INTO flashcards (topic_id, question, options, correct_answer) 
               VALUES (%s, %s, %s, %s)""",
            (topic_id, flashcard['question'], 
             psycopg2.extras.Json(flashcard['options']), 
             flashcard['correctAnswer'])
        )
    
    conn.commit()
    cursor.close()
    conn.close()
    
    return topic_id