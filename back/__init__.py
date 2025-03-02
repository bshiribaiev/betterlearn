from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager
from flask_migrate import Migrate

import os

# Initialize extensions
db = SQLAlchemy()
login_manager = LoginManager()
migrate = Migrate()

def create_app(config_object="config.DevelopmentConfig"):
   
    # Get the path to the front directory
    front_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'front')
    
    # Create Flask app with custom template and static folders
    app = Flask(__name__,
                template_folder=os.path.join(front_dir, 'templates'),
                static_folder=os.path.join(front_dir, 'static'))
    
    # Load the configuration
    if isinstance(config_object, str):
        app.config.from_object(config_object)
    elif isinstance(config_object, type):
        app.config.from_object(config_object)
    else:
        app.config.from_mapping(config_object)
    
    # Initialize extensions with app
    db.init_app(app)
    login_manager.init_app(app)
    migrate.init_app(app, db)
    
    # Setup login
    login_manager.login_view = 'auth.login'
    
    # Import models AFTER db is initialized
    from .models import user, learning
    
    # Setup user loader
    @login_manager.user_loader
    def load_user(user_id):
        from .models.user import User
        return User.query.get(int(user_id))
    
    # Register blueprints
    from .routes.auth import auth_bp
    from .routes.subjects import subject_bp
    from .routes.learning import learning_bp
    from .routes.main import main_bp
    
    app.register_blueprint(auth_bp)
    app.register_blueprint(subject_bp)
    app.register_blueprint(learning_bp)
    app.register_blueprint(main_bp)
    
    with app.app_context():
        # Create all database tables
        db.create_all()
    
    return app