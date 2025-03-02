from .. import db
from datetime import datetime, timezone, timedelta

class Subject(db.Model):
    """Subject model for grouping study topics."""
    __tablename__ = 'subjects'
    __table_args__ = {'extend_existing': True}
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    
    # Relationships
    topics = db.relationship('StudyTopic', backref='subject', lazy=True, cascade='all, delete-orphan')
    
    def __repr__(self):
        return f'<Subject {self.name}>'


class StudyTopic(db.Model):
    """Study topic model for organizing learning items."""
    __tablename__ = 'study_topics'
    __table_args__ = {'extend_existing': True}
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(150), nullable=False)
    status = db.Column(db.String(50), default="need to study")
    last_reviewed = db.Column(db.DateTime, nullable=True)
    next_review = db.Column(db.DateTime, nullable=True)
    review_count = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    
    # Foreign keys
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    subject_id = db.Column(db.Integer, db.ForeignKey('subjects.id'), nullable=False)
    
    # Relationships
    items = db.relationship('LearningItem', backref='topic', lazy=True, cascade='all, delete-orphan')
    
    def __repr__(self):
        return f'<StudyTopic {self.name}>'
    
    def update_review_status(self, success=True):
        """Update the review status and schedule next review."""
        now = datetime.now(timezone.utc)
        self.last_reviewed = now
        
        if success:
            intervals = [1, 3, 7, 14, 30, 60, 90]
            review_count = self.review_count or 0
            
            if review_count < len(intervals):
                days = intervals[review_count]
            else:
                days = intervals[-1]
                
            self.next_review = now + timedelta(days=days)
            self.review_count = review_count + 1
        else:
            # Reset to beginning of schedule if unsuccessful
            self.next_review = now + timedelta(days=1)
            self.review_count = 0
            
        db.session.commit()


class LearningItem(db.Model):
    """Learning item model for individual flashcards or questions."""
    __tablename__ = 'learning_items'
    __table_args__ = {'extend_existing': True}
    
    id = db.Column(db.Integer, primary_key=True)
    question = db.Column(db.String(500), nullable=False)
    answer = db.Column(db.String(500), nullable=False)
    last_reviewed = db.Column(db.DateTime, nullable=True)
    next_review = db.Column(db.DateTime, nullable=True)
    review_count = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    
    # Foreign keys
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    topic_id = db.Column(db.Integer, db.ForeignKey('study_topics.id'), nullable=False)
    
    def __repr__(self):
        return f'<LearningItem {self.question[:20]}...>'
    
    def calculate_next_review(self, success=True):
        """Calculate when this item should be reviewed next based on spaced repetition."""
        now = datetime.now(timezone.utc)
        
        # Ensure next_review is timezone-aware
        if self.next_review and self.next_review.tzinfo is None:
            self.next_review = self.next_review.replace(tzinfo=timezone.utc)
        
        # If reviewing too early, don't update
        if self.next_review and now < self.next_review:
            return False
            
        # Update based on success
        self.last_reviewed = now
        
        if success:
            # Spaced repetition intervals (in days)
            intervals = [1, 3, 7, 14, 30, 60, 90]
            
            review_count = self.review_count or 0
            
            # Get appropriate interval
            if review_count < len(intervals):
                days = intervals[review_count]
            else:
                days = intervals[-1]  # Use max interval
                
            self.next_review = now + timedelta(days=days)
            self.review_count = review_count + 1
        else:
            # Failed review, reset to start
            self.next_review = now + timedelta(days=1)
            self.review_count = 0
            
        db.session.commit()
        return True