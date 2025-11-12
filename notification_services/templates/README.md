# Template Service

This service is a Flask application responsible for managing templates. It provides a RESTful API for creating, reading, updating, and deleting templates and their versions.

## Features

*   **Template Management:** Create, retrieve, update, and delete templates.
*   **Versioning:** Manage different versions of templates.
*   **Database Migrations:** Uses Flask-Migrate and Alembic to manage database schema changes.
*   **API Documentation:** Provides a Swagger UI for easy API exploration and testing.

## Getting Started

### Prerequisites

*   Docker and Docker Compose
*   Python 3.11+

### Installation with Docker

1.  **Build and run the containers:**

    ```bash
    docker-compose up --build
    ```

2.  The service will be available at `http://localhost:5000`.

### Local Development

1.  **Create and activate a virtual environment:**

    ```bash
    python3 -m venv venv
    source venv/bin/activate
    ```

2.  **Install the dependencies:**

    ```bash
    pip install -r requirements.txt
    ```

3.  **Set up the environment variables:**

    Create a `.env` file in the `templates` directory and add the following variables:

    ```
    TEMPLATE_DB_USER=postgres
    TEMPLATE_DB_PASS=password
    TEMPLATE_DB_NAME=template_service
    TEMPLATE_DB_HOST=localhost
    TEMPLATE_DB_PORT=5432
    ```

4.  **Run the application:**

    ```bash
    flask run
    ```

## API Documentation

The API documentation is available at `http://localhost:5000/swagger-ui`.

## Database Migrations

### Creating a New Migration

To create a new database migration, run the following command:

```bash
flask db migrate -m "Your migration message"
```

### Applying Migrations

To apply the migrations to the database, run the following command:

```bash
flask db upgrade
```

## Running Tests

To run the test suite, run the following command:

```bash
pytest
```

## Environment Variables

| Variable           | Description                             | Default     |
| ------------------ | --------------------------------------- | ----------- |
| `TEMPLATE_DB_USER` | The username for the database.          | `postgres`  |
| `TEMPLATE_DB_PASS` | The password for the database.          | `password`  |
| `TEMPLATE_DB_NAME` | The name of the database.               | `template_service` |
| `TEMPLATE_DB_HOST` | The host of the database.               | `localhost` |
| `TEMPLATE_DB_PORT` | The port of the database.               | `5432`      |

## Project Structure

```
templates/
├── app.py              # Main application file
├── config.py           # Configuration settings
├── database.py         # Database setup
├── models.py           # Database models
├── requirements.txt    # Python dependencies
├── Dockerfile          # Dockerfile for the service
├── entrypoint.sh       # Entrypoint script for the Docker container
├── migrations/         # Database migrations
├── routes/             # API routes
├── static/             # Static files (e.g., Swagger UI)
└── tests/              # Test suite
```
