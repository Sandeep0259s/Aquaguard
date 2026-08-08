import os
import traceback

from dotenv import load_dotenv
from flask import Flask, request, jsonify
from flask_cors import CORS
import google.generativeai as genai
from deep_translator import GoogleTranslator
from langdetect import detect, LangDetectException

load_dotenv()

app = Flask(__name__)
CORS(app)

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")
model = None

if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)
    model = genai.GenerativeModel("models/gemini-flash-latest")
else:
    print("WARNING: GEMINI_API_KEY is not set. Copy backend/.env.example to backend/.env "
          "and add your key, or the /chat endpoint will return an error.")


@app.route('/', methods=['GET'])
def health_check():
    return jsonify({"status": "ok", "chat_ready": model is not None})


@app.route('/chat', methods=['POST'])
def chatbot():
    if model is None:
        return jsonify({"error": "Chatbot is not configured: GEMINI_API_KEY is missing on the server."}), 503

    try:
        data = request.json
        user_message = data.get("message", "").strip()

        if not user_message:
            return jsonify({"error": "Message is required"}), 400

        # Detect and translate input to English
        try:
            detected_lang = detect(user_message)
        except LangDetectException:
            detected_lang = 'en'

        translated_input = (
            GoogleTranslator(source=detected_lang, target='en').translate(user_message)
            if detected_lang != 'en' else user_message
        )

        # Get response from Gemini
        response = model.generate_content(translated_input)
        response_text = response.text.strip()

        # Translate back to original language if needed
        if detected_lang != 'en':
            response_text = GoogleTranslator(source='en', target=detected_lang).translate(response_text)

        return jsonify({"response": response_text})

    except Exception:
        print("Error in /chat:")
        traceback.print_exc()
        return jsonify({"error": "Internal server error. Please try again later."}), 500


if __name__ == '__main__':
    app.run(debug=True)
