# app.py
from flask import Flask, request, jsonify
from hate_speech_detector import isHate

# Initialize the Flask application
app = Flask(__name__)

# Initialize the hate speech detector.
# This is done once when the application starts to avoid reloading the model on every request.
print("Loading hate speech detection model...")
print("Model loaded successfully.")

@app.route('/analyze', methods=['POST'])
def analyze_text():
    """
    Analyzes a given text for hate speech.
    Expects a JSON payload with a "text" key.
    e.g., {"text": "This is some text to analyze."}
    """
    # Ensure the request contains JSON data
    if not request.is_json:
        return jsonify({"error": "Request must be JSON"}), 400

    data = request.get_json()

    # Validate that the 'text' key is in the request body
    if 'text' not in data:
        return jsonify({"error": "Missing 'text' key in request body"}), 400

    text_to_analyze = data['text']

    # Ensure the 'text' is a string
    if not isinstance(text_to_analyze, str):
        return jsonify({"error": "'text' must be a string"}), 400
    
    if not text_to_analyze.strip():
        return jsonify({"error": "'text' cannot be empty"}), 400

    try:
        results = isHate(text_to_analyze)

        return jsonify(results)

    except Exception as e:
        app.logger.error(f"An error occurred during prediction: {e}")
        return jsonify({"error": "An internal error occurred"}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
