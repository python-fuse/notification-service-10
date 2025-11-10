# config.py
import os

class Config:
    """Base configuration."""
    SQLALCHEMY_DATABASE_URI = os.getenv(
        "DATABASE_URL",
        "postgresql+psycopg2://user:password@localhost:5432/template_service"
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SECRET_KEY = os.getenv("SECRET_KEY", "dev_secret_key")
    DEBUG = os.getenv("FLASK_DEBUG", "1") == "1"

