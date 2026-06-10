# Build runtime container for LaunchOps local backend
FROM python:3.11-slim

WORKDIR /app

# Copy requirements first
COPY server/requirements.txt requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy all source files
COPY . .

# Expose port required by AgentBase (8080)
EXPOSE 8080

ENV HOST=0.0.0.0
ENV PORT=8080
ENV PYTHONUNBUFFERED=1

# Command to run server
CMD ["python", "server/app.py"]
