# app.py
from flask import Flask, jsonify
from flask_swagger_ui import get_swaggerui_blueprint
from flask_migrate import Migrate
from models import Template, TemplateVersion
from config import Config
from database import db
from routes.templates import template_bp
from utils.templater import render_template


def create_app():
    app = Flask(__name__)

    # Load config
    app.config.from_object(Config)

    # Initialize database
    db.init_app(app)
    migrate = Migrate(app, db)


    # Swagger UI setup
    SWAGGER_URL = '/api/docs'
    API_URL = '/static/swagger.json'
    swaggerui_blueprint = get_swaggerui_blueprint(
        SWAGGER_URL,
        API_URL,
        config={'app_name': "Template Service"}
    )
    app.register_blueprint(swaggerui_blueprint, url_prefix=SWAGGER_URL)

    app.register_blueprint(template_bp, url_prefix='/api/v1/templates')


    # Health check endpoint
    @app.route('/health')
    def health_check():
        return jsonify({"status": "ok", "service": "template_service"}), 200
    
    # Test template endpoint
    @app.route('/test-template')
    def test_template():
        template_body = "Hello {{ name }}, verify your account here: {{ link }}"
        variables = {
            "name": "John Doe",
            "link": "https://example.com/verify"
        }
        rendered_template = render_template(template_body, variables)
        return {
            "success": True,
            "rendered": rendered_template,
            "message": "Template rendered successfully"
        }


    # Root
    @app.route('/')
    def index():
        return 'Hello, World! This is Template Service at your service'

    return app


if __name__ == '__main__':
    app = create_app()
    with app.app_context():
        db.create_all()  # TEMP: auto-create tables (we’ll replace with migrations)
    app.run(host='0.0.0.0', port=5000, debug=True)
