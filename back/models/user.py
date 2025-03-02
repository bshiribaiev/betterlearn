from flask_login import UserMixin
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime, timezone
from .. import db

class User(UserMixin, db.Model):
    __tablename__ = 'users'
    __table_args__ = {'extend_existing': True}
    
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(150), unique=True, nullable=False)
    email = db.Column(db.String(150), unique=True, nullable=False)
    password = db.Column(db.String(150), nullable=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    last_login = db.Column(db.DateTime, nullable=True)
    
    # Relationships
    topics = db.relationship('StudyTopic', backref='user', lazy=True, cascade='all, delete-orphan')
    learning_items = db.relationship('LearningItem', backref='user', lazy=True, cascade='all, delete-orphan')
    
    def set_password(self, password):
        """Create hashed password."""
        self.password = generate_password_hash(password, method='pbkdf2:sha256')
    
    def check_password(self, password):
        """Check hashed password."""
        return check_password_hash(self.password, password)
    
    def update_last_login(self):
        """Update last login timestamp."""
        self.last_login = datetime.now(timezone.utc)
        db.session.commit()
    
    def __repr__(self):
        return f'<User {self.username}>'
