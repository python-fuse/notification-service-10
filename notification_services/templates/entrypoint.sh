#!/bin/sh

# It's a good practice to wait for the database to be ready.
# This is a simple example, you might want to use a more robust solution
# like `wait-for-it.sh` or `dockerize`.
echo "Waiting for postgres..."
# The values for the host and port should be managed through environment variables
# For now, we'll use a placeholder.
while ! nc -z postgres_template 5432; do
  sleep 0.1
done
echo "PostgreSQL started"

# Run database migrations
echo "Running database migrations..."
flask db upgrade

# Start the application
echo "Starting application..."
exec python app.py
