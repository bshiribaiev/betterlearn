from flask import Blueprint, render_template, redirect, url_for, flash, request, jsonify, session
from flask_login import login_required, current_user
from ..models.learning import Subject, StudyTopic, LearningItem
from ..models.user import User
from .. import db
from datetime import datetime, timedelta, timezone

# Create the blueprint first
learning_bp = Blueprint('learning', __name__)

# Then define your routes
@learning_bp.route('/process_review/<int:item_id>', methods=['POST'])
@login_required
def process_review(item_id):
    """Process a review result for a learning item."""
    item = LearningItem.query.get_or_404(item_id)

    if item.user_id != current_user.id:
        flash('Unauthorized access to this item.')
        return redirect(url_for('main.dashboard'))

    success = request.form['success'] == 'true'
    item.calculate_next_review(success)
    
    flash('Review recorded! Your next review is scheduled.')
    return redirect(url_for('learning.review_next', topic_id=item.topic_id))

@learning_bp.route('/track_progress')
@login_required
def track_progress():
    """Track learning progress across all subjects and topics."""
    # Get all items for the current user
    total_items = LearningItem.query.filter_by(user_id=current_user.id).count()
    reviewed_items = LearningItem.query.filter(
        LearningItem.user_id == current_user.id, 
        LearningItem.last_reviewed != None
    ).count()

    # Calculate progress percentage
    progress_percentage = (reviewed_items / total_items * 100) if total_items > 0 else 0

    # Get items due today
    today = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0)