import os
from dotenv import load_dotenv
from config import config  # Import the config dictionary from config.py

# Load environment variables
load_dotenv()

# Import app factory
from back import create_app

# Determine which configuration to use
env = os.environ.get('FLASK_ENV', 'development')

# Get the appropriate config class
config_class = config[env]  # Now this variable is defined

# Create the app with the appropriate configuration
app = create_app(config_class)  # Use config_class here

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)