# Importing necessary modules, functions, classes
from flask import Flask, jsonify, render_template, redirect, url_for, flash, request, session
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager, UserMixin, login_user, logout_user, login_required, current_user
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime, timedelta, timezone
from flask_migrate import Migrate
from flask import session

# Creating and instance of Flask application
app = Flask(__name__)

# Secret key used by Flask to secure session data and prevent tampering
app.config['SECRET_KEY'] = 'bek'  

# Configure the app to use SQLite for storing data (the database file is 'users.db')
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///users.db'  # Database file

# Initialize SQLAlchemy and pass the Flask app to it (this is the 'db' object for database operations)
db = SQLAlchemy(app)

# Initialize Flask-Login
login_manager = LoginManager()

# Setting up Flask-Login with the app
login_manager.init_app(app)

# The default login view when users try to access protected routes without logging in
login_manager.login_view = 'login'

# User loader function
@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

# The home route
@app.route('/')
def index():
    return render_template('index.html')

migrate = Migrate(app, db)

# User model that represents the 'users' table in the database
class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(150), unique=True, nullable=False)
    email = db.Column(db.String(150), unique=True, nullable=False)
    password = db.Column(db.String(150), nullable=False)

    def set_password(self, password):
        self.password = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password, password)

# Register page    
@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':  # If the user submits the registration form
        username = request.form['username']  # Get the username from the form
        email = request.form['email']  # Get the email from the form
        password = request.form['password']  # Get the password from the form

        # Hash the password using pbkdf2:sha256
        hashed_password = generate_password_hash(password, method='pbkdf2:sha256')

        # Create a new user and add it to the database
        new_user = User(username=username, email=email, password=hashed_password)
        db.session.add(new_user)
        db.session.commit()

        flash('Account created successfully!')
        return redirect(url_for('login'))  # Redirect to login page after successful registration

    return render_template('register.html')  # Render the registration form (GET request)

# Login page
@app.route('/login', methods=['GET', 'POST'])
def login():
    if current_user.is_authenticated:  # Check if the user is already logged in
        return redirect(url_for('dashboard'))  # Redirect them to the dashboard

    if request.method == 'POST':
        email = request.form['email']
        password = request.form['password']
        user = User.query.filter_by(email=email).first()  # Find the user by email

        if user and user.check_password(password):  # If user exists and password matches
            login_user(user)  # Log the user in
            flash('Logged in successfully!')
            return redirect(url_for('dashboard'))  # Redirect to the dashboard
        else:
            flash('Login failed. Please check your credentials.')

    return render_template('login.html')  # Show the login page if not logged in

# Logout route
@app.route('/logout')
@login_required
def logout():
    logout_user()
    flash("You have been logget out.")
    return redirect(url_for("login"))

class Subject(db.Model):
    __tablename__ = 'subjects'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)

    # Relationship to link subjects with topics
    topics = db.relationship('StudyTopic', backref='subject', lazy=True)

# Class for separating topics
class StudyTopic(db.Model):
    __tablename__ = 'study_topics'
    id = db.Column(db.Integer, primary_key=True)  # Primary key
    name = db.Column(db.String(150), nullable=False)  # Name of the topic or day
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'))  # Link the topic to the user

    # New foreign key linking StudyTopic to Subject
    subject_id = db.Column(db.Integer, db.ForeignKey('subjects.id'), nullable=False)
    status = db.Column(db.String(50), default="need to study")
    items = db.relationship('LearningItem', backref='topic', lazy=True)  # Relationship with learning items
    last_reviewed = db.Column(db.DateTime, nullable=True, default=None)
    next_review = db.Column(db.DateTime, nullable=True, default=None)
    review_count = db.Column(db.Integer, nullable=True, default=0)

# Learning Item model to store flashcards or learning content for users
class LearningItem(db.Model):
    __tablename__ = 'learning_items'  # Optional: specify table name explicitly
    id = db.Column(db.Integer, primary_key=True)
    question = db.Column(db.String(500), nullable=False)
    answer = db.Column(db.String(500), nullable=False)
    last_reviewed = db.Column(db.DateTime, nullable=True)
    next_review = db.Column(db.DateTime, nullable=True)
    review_count = db.Column(db.Integer, default=0)  # Ensure default is 0
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    
    # Correct the foreign key to reference the correct table name
    topic_id = db.Column(db.Integer, db.ForeignKey('study_topics.id'))

    # Format item display
    def __repr__(self):
        return f'<LearningItem {self.question}>'

# Redirect users to profile page
@app.route('/dashboard')
@login_required
def dashboard():
    # Redirect users to the subjects management from the dashboard
    return render_template('dashboard.html')


 # Creating the database tables
@app.route('/create_tables')
def create_tables():
    db.create_all()  # This creates the LearningItem table and others
    return "Tables created!"   

@app.route('/subjects')
def subjects():
    all_subjects = Subject.query.all()
    return render_template('subjects.html', subjects=all_subjects)

@app.route('/add_subject', methods=['POST'])
def add_subject():
    subject_name = request.form.get('subject_name')
    if subject_name:
        new_subject = Subject(name=subject_name)
        db.session.add(new_subject)
        db.session.commit()
        flash('Subject added successfully!', 'success')
    return redirect(url_for('subjects'))

@app.route('/delete_subject', methods=['POST'])
@login_required
def delete_subject():
    # Get the list of selected subject IDs from the form
    selected_subject_ids = request.form.getlist('selected_subjects')
    
    if selected_subject_ids:
        # Delete each selected subject
        Subject.query.filter(Subject.id.in_(selected_subject_ids)).delete(synchronize_session='fetch')
        db.session.commit()
        flash(f'{len(selected_subject_ids)} subject(s) deleted successfully!', 'success')
    else:
        flash('No subjects selected for deletion.', 'danger')
    
    return redirect(url_for('subjects'))

@app.route('/add_topic/<int:subject_id>', methods=['POST'])
@login_required
def add_topic(subject_id):
    topic_name = request.form.get('topic_name')
    if topic_name:
        # Create a new topic with the default status set to "need to study"
        new_topic = StudyTopic(name=topic_name, user_id=current_user.id, subject_id=subject_id, status="need to study")
        db.session.add(new_topic)
        db.session.commit()
        flash('Topic added successfully!', 'success')
    else:
        flash('Topic name is required.', 'danger')
    
    return redirect(url_for('topics', subject_id=subject_id))

@app.route('/subjects/<int:subject_id>/topics')
@login_required
def topics(subject_id):
    # Fetch the subject by ID
    subject = Subject.query.get_or_404(subject_id)
    
    # Fetch all topics for the logged-in user that belong to this subject
    topics = StudyTopic.query.filter_by(user_id=current_user.id, subject_id=subject_id).all()

    # Ensure the topics and items have correct date values
    for topic in topics:
        for item in topic.items:
            # Log current values for debugging
            print(f"Item ID: {item.id}, Last Reviewed: {item.last_reviewed}, Next Review: {item.next_review}")

    # Pass the subject and topics to the template
    return render_template('topics.html', subject=subject, topics=topics)

@app.route('/view_topic/<int:topic_id>', methods=['GET', 'POST'])
@login_required
def view_topic(topic_id):
    topic = StudyTopic.query.get_or_404(topic_id)

    # Ensure the topic belongs to the current user
    if topic.user_id != current_user.id:
        flash('You are not authorized to view this topic.')
        return redirect(url_for('topics'))

    # Convert last_reviewed and next_review to timezone-aware if not already
    if topic.last_reviewed:
        topic.last_reviewed = topic.last_reviewed.replace(tzinfo=timezone.utc)
    if topic.next_review:
        topic.next_review = topic.next_review.replace(tzinfo=timezone.utc)

    # Fetch all learning items for this topic
    items = LearningItem.query.filter_by(topic_id=topic.id).all()

    # Standardize datetime for items
    for item in items:
        if item.last_reviewed:
            item.last_reviewed = item.last_reviewed.replace(tzinfo=timezone.utc)
        if item.next_review:
            item.next_review = item.next_review.replace(tzinfo=timezone.utc)

    return render_template('view_topic.html', topic=topic, items=items)

@app.route('/submit_answer', methods=['POST'])
@login_required
def submit_answer():
    try:
        data = request.get_json()
        if not data or 'user_answer' not in data or 'item_id' not in data:
            return jsonify({"error": "Invalid input"}), 400

        user_answer = data.get('user_answer').strip().lower()
        item_id = data.get('item_id')

        # Fetch the learning item
        item = LearningItem.query.get_or_404(item_id)
        correct_answer = item.answer.strip().lower()

        # Check the answer and update review dates
        if user_answer == correct_answer:
            calculate_next_review(item, success=True)

            # Add logging here
            print(f"Item ID: {item.id}, Last Reviewed: {item.last_reviewed}, Next Review: {item.next_review}")

            return jsonify({
                "correct": True,
                "message": "Correct answer!",
                "last_reviewed": item.last_reviewed.strftime('%Y-%m-%d %H:%M:%S') if item.last_reviewed else None,
                "next_review": item.next_review.strftime('%Y-%m-%d %H:%M:%S') if item.next_review else None
            })
        else:
            calculate_next_review(item, success=False)

            # Add logging here for incorrect answers
            print(f"Item ID: {item.id}, Last Reviewed: {item.last_reviewed}, Next Review: {item.next_review}")

            return jsonify({"correct": False, "message": "Incorrect answer. Try again."})

    except Exception as e:
        print(f"Error in submit_answer: {e}")
        return jsonify({"error": "Internal server error", "details": str(e)}), 500



@app.route('/update_review_date/<int:topic_id>', methods=['POST'])
@login_required
def update_review_date(topic_id):
    topic = StudyTopic.query.get_or_404(topic_id)
    
    # Ensure the topic belongs to the current user
    if topic.user_id != current_user.id:
        return jsonify({"success": False, "error": "Unauthorized"}), 403

    # Update the last_reviewed date to the current date and time
    topic.last_reviewed = datetime.now(timezone.utc)
    db.session.commit()
    
    return jsonify({"success": True})

    
@app.route('/delete_topics/<int:subject_id>', methods=['POST'])
@login_required
def delete_topics(subject_id):
    selected_topic_ids = request.form.getlist('selected_topics')  # Get a list of selected topic IDs

    # Delete each selected topic that belongs to the current user
    for topic_id in selected_topic_ids:
        topic = StudyTopic.query.get(topic_id)
        if topic and topic.user_id == current_user.id:
            db.session.delete(topic)

    db.session.commit()  # Commit the deletions to the database
    flash('Selected topics deleted successfully!')

    # Redirect to the topics page for the specified subject
    return redirect(url_for('topics', subject_id=subject_id))


# Adding learning items within a topic
@app.route('/add_item/<int:topic_id>', methods=['POST'])
@login_required
def add_item(topic_id):
    topic = StudyTopic.query.get_or_404(topic_id) 
    topic = StudyTopic.query.get_or_404(topic_id)
  daa;salkf;lkasjassjl;asfaf
    # Ensure the topic belongs to the current user
    if topic.user_id != current_user.id:
        flash('You are not authorized to add questions to this topic.')
        return redirect(url_for('view_topic', topic_id=topic_id))
    
    # Get question and answer from the form
    question_text = request.form.get('new_question')  # Matches the name attribute in HTML
    answer_text = request.form.get('new_answer')      # Matches the name attribute in HTML

    if question_text and answer_text:
        new_item = LearningItem(question=question_text, answer=answer_text, topic_id=topic_id, user_id=current_user.id)
        db.session.add(new_item)
        db.session.commit()
        flash('Question added successfully!', 'success')
    else:
        flash('Both question and answer are required.', 'danger')

    return redirect(url_for('view_topic', topic_id=topic_id))


# Editing Learning Items
@app.route('/edit_item/<int:item_id>', methods=['GET', 'POST'])
@login_required  # Ensure the user is logged in
def edit_item(item_id):
    # Fetch the item by ID, or return a 404 if not found
    item = LearningItem.query.get_or_404(item_id)
    
    # Check if the item belongs to the logged-in user
    if item.user_id != current_user.id:
        flash('You are not authorized to edit this item.')
        return redirect(url_for('dashboard'))
    
    if request.method == 'POST':  # If the user submits the edit form
        item.question = request.form['question']  # Update the question
        item.answer = request.form['answer']  # Update the answer
        db.session.commit()  # Save the changes to the database
        flash('Item updated successfully!')
        return redirect(url_for('dashboard'))

    # If the request is GET, render the form with the existing data
    return render_template('edit_item.html', item=item)

# Deleting Learning Items
@app.route('/delete_selected_items/<int:topic_id>', methods=['POST'])
@login_required
def delete_selected_items(topic_id):
    selected_items = request.form.getlist('selected_items')  # Get list of selected item IDs
    
    # Delete each selected item if it exists and belongs to the current user
    for item_id in selected_items:
        item = LearningItem.query.get(item_id)
        if item and item.user_id == current_user.id and item.topic_id == topic_id:
            db.session.delete(item)

    db.session.commit()  # Commit all deletions to the database
    flash('Selected questions have been deleted.')
    return redirect(url_for('view_topic', topic_id=topic_id))

sp_intervals = [1, 3, 7, 14, 30, 60, 90]
def calculate_next_review(item, success=True):
    now = datetime.now(timezone.utc)  # Ensure timezone-aware datetime

    # Ensure `next_review` is timezone-aware
    if item.next_review and item.next_review.tzinfo is None:
        item.next_review = item.next_review.replace(tzinfo=timezone.utc)

    # If the review is attempted before the scheduled next review date, do not update
    if item.next_review and now < item.next_review:
        print(f"Review attempt too early. Next review remains scheduled for: {item.next_review}")
        return  # Exit without making changes

    # Proceed with updating the review dates only if the review is successful
    if success:
        review_count = item.review_count if item.review_count else 0

        # Get the appropriate interval for the next review
        if review_count < len(sp_intervals):
            days_to_next_review = sp_intervals[review_count]
        else:
            days_to_next_review = sp_intervals[-1]  # Use the longest interval if count exceeds

        # Update next_review to the new scheduled date
        item.next_review = now + timedelta(days=days_to_next_review)
        item.review_count = review_count + 1
    else:
        # Reset to the shortest interval if the review was unsuccessful
        item.next_review = now + timedelta(days=1)
        item.review_count = 0

    # Always update the last_reviewed date to the current date
    item.last_reviewed = now

    # Commit the changes to the database
    try:
        db.session.commit()
        print(f"Successfully updated item: {item.id} | Last Reviewed: {item.last_reviewed} | Next Review: {item.next_review}")
    except Exception as e:
        print(f"Error committing to database: {e}")
        db.session.rollback()


@app.route('/reset_attempts/<int:item_id>', methods=['POST'])
@login_required
def reset_attempts(item_id):
    session['attempts'] = 0
    return redirect(url_for('review_items', item_id=item_id))

@app.route('/process_review/<int:item_id>', methods=['POST'])
@login_required
def process_review(item_id):
    item = LearningItem.query.get_or_404(item_id)

    if item.user_id != current_user.id:
        flash('Unauthorized access to this item.')
        return redirect(url_for('dashboard'))

    success = request.form['success'] == 'true'
    calculate_next_review(item, success)
    
    flash('Review recorded! Your next review is scheduled.')
    return redirect(url_for('review_next', topic_id=item.topic_id))

@app.route('/update_status/<int:topic_id>', methods=['POST'])
def update_status(topic_id):
    # Parse JSON data
    data = request.get_json()
    new_status = data.get('status')

    # Fetch the topic and update its status
    topic = StudyTopic.query.get(topic_id)
    if topic:
        topic.status = new_status
        db.session.commit()
        return jsonify({"success": True}), 200

    return jsonify({"error": "Topic not found"}), 404

# Tracking progress
@app.route('/track_progress')
@login_required
def track_progress():
    total_items = LearningItem.query.filter_by(user_id=current_user.id).count()
    reviewed_items = LearningItem.query.filter(LearningItem.user_id == current_user.id, LearningItem.last_reviewed != None).count()

    # Calculate progress as a percentage
    if total_items > 0:
        progress_percentage = (reviewed_items / total_items) * 100
    else:
        progress_percentage = 0  # Default to 0% if there are no items

    # Pass the progress percentage to the template
    return render_template('track_progress.html', total_items=total_items, reviewed_items=reviewed_items, progress_percentage=progress_percentage)

# Run the app in debug mode to automatically restart the server on code changes
if __name__ == "__main__":
    app.run(debug=True)