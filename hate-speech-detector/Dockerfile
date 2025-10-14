FROM python:3.9-slim-bookworm

WORKDIR /app

RUN sed -i 's/ main/ main contrib non-free/g' /etc/apt/sources.list.d/debian.sources && \
  apt-get update && \
  apt-get install -y --no-install-recommends git unrar && \
  apt-get clean && \
  rm -rf /var/lib/apt/lists/*

# Install dependencies
COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

RUN git clone https://github.com/jah-117/hate_speech_detector.git

RUN unrar e hate_speech_detector/hate_speech_detector/assets/svm_text_classifier.rar

# Create the assets directory and copy the model into the installed package location
RUN mkdir -p /usr/local/lib/python3.9/site-packages/hate_speech_detector/assets/ && \
  cp svm_text_classifier.pkl /usr/local/lib/python3.9/site-packages/hate_speech_detector/assets/svm_text_classifier.pkl

# Copy the application code
COPY app.py .

EXPOSE 5000

# Run the application with Gunicorn
CMD ["gunicorn", "--bind", "0.0.0.0:5000", "app:app"]
