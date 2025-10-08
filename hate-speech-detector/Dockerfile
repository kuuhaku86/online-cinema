FROM python:3.9-slim-buster

WORKDIR /app

# Update sources.list for Debian Buster to use the archive
RUN sed -i 's/deb.debian.org/archive.debian.org/g' /etc/apt/sources.list && \
  sed -i 's|security.debian.org/debian-security|archive.debian.org/debian-security|g' /etc/apt/sources.list && \
  sed -i '/buster-updates/d' /etc/apt/sources.list

RUN apt-get update && apt-get install -y git

# Clone the repository
RUN git clone https://github.com/nkkb/hate-speech-detector.git

WORKDIR /app/hate-speech-detector/server

# Install dependencies
# COPY requirements.txt .
RUN pip install --no-cache-dir flask

# Expose the port
EXPOSE 5000

# Set environment variables for Flask
ENV FLASK_APP=app.py
ENV FLASK_RUN_HOST=0.0.0.0

# Run the Flask application
CMD ["flask", "run"]
