FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code and templates
COPY app ./app
COPY templates ./templates

# Set default port (Cloud Run will override with $PORT)
ENV PORT=8080

# Run the application (uses $PORT environment variable)
CMD uvicorn app.main:app --host 0.0.0.0 --port $PORT

