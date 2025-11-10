from python:3.11-slim

WORKDIR /app

COPY . .
RUN python -m venv venv
RUN source venv/bin/activate
RUN pip install --no-cache-dir -r requirements.txt

EXPOSE 5000

CMD [ "python", "app.py" ]