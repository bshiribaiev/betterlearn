from flask import Blueprint, render_template, redirect, url_for
from flask_login import login_required, current_user

main_bp = Blueprint('main', __name__)

@main_bp.route('/')
def index():
    """Home page."""
    return render_template('index.html')

@main_bp.route('/dashboard')
@login_required
def dashboard():
    """Dashboard page - main entry point after login."""
    return render_template('dashboard.html')

@main_bp.route('/create_tables')
def create_tables():
    """Development endpoint to create tables."""
    from app import db
    db.create_all()
    return "Tables created!"