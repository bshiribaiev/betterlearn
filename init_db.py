import os
from dotenv import load_dotenv
from app import create_app, db
from app.models.user import User
from app.models.learning import Subject

# Load environment variables
load_dotenv()

def init_db():
    """Initialize the database with tables and initial data."""
    app = create_app()
    
    with app.app_context():
        # Create all tables
        db.create_all()
        
        # Add some initial subjects if none exist
        if Subject.query.count() == 0:
            initial_subjects = [
                'Mathematics',
                'Science',
                'Languages',
                'History',
                'Computer Science'
            ]
            
            for subject_name in initial_subjects:
                subject = Subject(name=subject_name)
                db.session.add(subject)
            
            db.session.commit()
            print(f"Added {len(initial_subjects)} initial subjects")
        
        print("Database initialized successfully!")

if __name__ == '__main__':
    init_db()