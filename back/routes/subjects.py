from flask import Blueprint, render_template, redirect, url_for, flash, request, jsonify
from flask_login import login_required, current_user
from .. import db
from ..models.learning import Subject, StudyTopic

subject_bp = Blueprint('subjects', __name__)

@subject_bp.route('/subjects')
@login_required
def subjects_list():
    """List all subjects."""
    all_subjects = Subject.query.all()
    return render_template('subjects.html', subjects=all_subjects)

@subject_bp.route('/add_subject', methods=['POST'])
@login_required
def add_subject():
    """Add a new subject."""
    subject_name = request.form.get('subject_name')
    if subject_name:
        new_subject = Subject(name=subject_name)
        db.session.add(new_subject)
        db.session.commit()
        flash('Subject added successfully!', 'success')
    return redirect(url_for('subjects.subjects_list'))

@subject_bp.route('/delete_subject', methods=['POST'])
@login_required
def delete_subject():
    """Delete selected subjects."""
    selected_subject_ids = request.form.getlist('selected_subjects')
    
    if selected_subject_ids:
        # Delete each selected subject
        Subject.query.filter(Subject.id.in_(selected_subject_ids)).delete(synchronize_session='fetch')
        db.session.commit()
        flash(f'{len(selected_subject_ids)} subject(s) deleted successfully!', 'success')
    else:
        flash('No subjects selected for deletion.', 'danger')
    
    return redirect(url_for('subjects.subjects_list'))

@subject_bp.route('/subjects/<int:subject_id>/topics')
@login_required
def topics_list(subject_id):
    """List all topics for a subject."""
    # Fetch the subject by ID
    subject = Subject.query.get_or_404(subject_id)
    
    # Fetch all topics for the logged-in user that belong to this subject
    topics = StudyTopic.query.filter_by(user_id=current_user.id, subject_id=subject_id).all()

    # Pass the subject and topics to the template
    return render_template('topics.html', subject=subject, topics=topics)

@subject_bp.route('/add_topic/<int:subject_id>', methods=['POST'])
@login_required
def add_topic(subject_id):
    """Add a new topic to a subject."""
    topic_name = request.form.get('topic_name')
    if topic_name:
        # Create a new topic with the default status set to "need to study"
        new_topic = StudyTopic(name=topic_name, user_id=current_user.id, subject_id=subject_id, status="need to study")
        db.session.add(new_topic)
        db.session.commit()
        flash('Topic added successfully!', 'success')
    else:
        flash('Topic name is required.', 'danger')
    
    return redirect(url_for('subjects.topics_list', subject_id=subject_id))

@subject_bp.route('/delete_topics/<int:subject_id>', methods=['POST'])
@login_required
def delete_topics(subject_id):
    """Delete selected topics."""
    selected_topic_ids = request.form.getlist('selected_topics')

    # Delete each selected topic that belongs to the current user
    for topic_id in selected_topic_ids:
        topic = StudyTopic.query.get(topic_id)
        if topic and topic.user_id == current_user.id:
            db.session.delete(topic)

    db.session.commit()
    flash('Selected topics deleted successfully!')

    # Redirect to the topics page for the specified subject
    return redirect(url_for('subjects.topics_list', subject_id=subject_id))

@subject_bp.route('/update_status/<int:topic_id>', methods=['POST'])
@login_required
def update_status(topic_id):
    """Update the status of a topic."""
    # Parse JSON data
    data = request.get_json()
    new_status = data.get('status')

    # Fetch the topic and update its status
    topic = StudyTopic.query.get(topic_id)
    if topic and topic.user_id == current_user.id:
        topic.status = new_status
        db.session.commit()
        return jsonify({"success": True}), 200

    return jsonify({"error": "Topic not found or unauthorized"}), 404