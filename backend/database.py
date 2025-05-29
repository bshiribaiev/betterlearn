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

def record_review_session(topic_id, total_questions, correct_answers):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Calculate score percentage
    score_percentage = (correct_answers / total_questions) * 100
    
    # Record the session
    cursor.execute(
        """INSERT INTO review_sessions (topic_id, total_questions, correct_answers, score_percentage) 
           VALUES (%s, %s, %s, %s)""",
        (topic_id, total_questions, correct_answers, score_percentage)
    )
    
    # Update the topic based on performance
    if score_percentage >= 65:
        # Good performance - increase interval
        cursor.execute(
            """UPDATE topics 
               SET last_reviewed_at = CURRENT_TIMESTAMP,
                   current_interval = current_interval * 2,
                   next_review_at = CURRENT_TIMESTAMP + (current_interval * 2 || ' days')::interval,
                   total_reviews = total_reviews + 1,
                   status = CASE 
                       WHEN current_interval * 2 >= 14 THEN 'great'
                       WHEN current_interval * 2 >= 3 THEN 'good'
                       ELSE 'bad'
                   END
               WHERE id = %s""",
            (topic_id,)
        )
    else:
        # Poor performance - reset to 1 day
        cursor.execute(
            """UPDATE topics 
               SET last_reviewed_at = CURRENT_TIMESTAMP,
                   current_interval = 1,
                   next_review_at = CURRENT_TIMESTAMP + '1 day'::interval,
                   total_reviews = total_reviews + 1,
                   status = 'bad'
               WHERE id = %s""",
            (topic_id,)
        )
    
    conn.commit()
    cursor.close()
    conn.close()

def get_all_topics_with_status():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute(
        """SELECT id, name, status, next_review_at, current_interval,
                  CASE 
                      WHEN next_review_at IS NULL THEN 'new'
                      WHEN next_review_at <= CURRENT_TIMESTAMP THEN 'due'
                      ELSE 'scheduled'
                  END as review_status
           FROM topics 
           ORDER BY created_at DESC"""
    )
    
    topics = cursor.fetchall()
    cursor.close()
    conn.close()
    
    return topics