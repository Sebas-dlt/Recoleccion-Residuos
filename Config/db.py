from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_marshmallow import Marshmallow
import os

app = Flask(__name__)

# Use DATABASE_URL environment variable if provided, otherwise default to SQLite file
DATABASE_URL = os.environ.get('DATABASE_URL', 'sqlite:///app.db')
app.config['SQLALCHEMY_DATABASE_URI'] = DATABASE_URL
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Secret key configurable via env for production
app.secret_key = os.environ.get('FLASK_SECRET_KEY', 'web')

# Create DB and Marshmallow instances
db = SQLAlchemy(app)
ma = Marshmallow(app)

def init_db():
	"""Create database tables (call from setup or first run)."""
	# Must run inside the Flask application context so SQLAlchemy has access to app
	with app.app_context():
		# Create all tables, including any missing ones
		db.create_all()
		print("Database tables created/verified.")