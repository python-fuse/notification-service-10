# config.py
import os

class Config:
    """Base configuration."""

    db_user = os.getenv('TEMPLATE_DB_USER', 'postgres')
    db_pass = os.getenv('TEMPLATE_DB_PASS', 'password')
    db_name = os.getenv('TEMPLATE_DB_NAME', 'template_service')
    db_host = os.getenv('TEMPLATE_DB_HOST', 'localhost')
    db_port = os.getenv('TEMPLATE_DB_PORT', '5432')

    SQLALCHEMY_DATABASE_URI = os.getenv(
        "DATABASE_URL",
        f"postgresql+psycopg2://{db_user}:{db_pass}@{db_host}:{db_port}/{db_name}"
    )
    
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SECRET_KEY = os.getenv("SECRET_KEY", "dev_secret_key")
    DEBUG = os.getenv("FLASK_DEBUG", "1") == "1"

