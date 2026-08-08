import os
import traceback

from dotenv import load_dotenv
from flask import Flask, request, jsonify
from flask_cors import CORS
import google.generativeai as genai
from google.api_core.exceptions import ResourceExhausted
from deep_translator import GoogleTranslator
from langdetect import detect_langs, DetectorFactory, LangDetectException

# langdetect is unreliable on short text, and can be confidently wrong (not
# just uncertain) on short phrases — e.g. "ok great" scores high confidence
# for Norwegian. A fixed seed makes results reproducible; combining a length
# floor with a confidence floor is needed because either check alone still
# lets short English phrases get mistranslated into the wrong language.
DetectorFactory.seed = 0
MIN_CHARS_FOR_DETECTION = 15
MIN_DETECTION_CONFIDENCE = 0.90

load_dotenv()

app = Flask(__name__)

ALLOWED_ORIGINS = os.environ.get("ALLOWED_ORIGINS", "*")
CORS(app, origins=ALLOWED_ORIGINS.split(",") if ALLOWED_ORIGINS != "*" else "*")

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")
model = None

SYSTEM_INSTRUCTION = (
    "You are AquaGuard, a water conservation assistant. You only discuss topics "
    "related to water: saving water, water usage and bills, leaks and plumbing, "
    "irrigation and gardening, drought, water-efficient appliances, water quality, "
    "and similar. If the user asks about anything unrelated to water, politely "
    "decline and steer the conversation back to water conservation — do not answer "
    "the unrelated question.\n\n"
    "Reply like a helpful chat message, not an essay: 2-5 short sentences by default, "
    "plain prose or a short bullet list only when it genuinely helps. No headers, "
    "no long structured reports, unless the user explicitly asks for a detailed guide."
)

if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)
    model = genai.GenerativeModel(
        "models/gemini-flash-latest",
        system_instruction=SYSTEM_INSTRUCTION,
        generation_config=genai.types.GenerationConfig(
            # This model reserves part of the token budget for internal
            # "thinking" before the visible reply, so this needs real headroom
            # or responses get cut off mid-sentence.
            max_output_tokens=1024,
            temperature=0.8,
        ),
    )
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

        # Detect and translate input to English — only trust the detector on
        # messages long enough to give it a fair shot, and only when it's
        # confident; default to English otherwise.
        if len(user_message) < MIN_CHARS_FOR_DETECTION:
            detected_lang = 'en'
        else:
            try:
                top_candidate = detect_langs(user_message)[0]
                detected_lang = top_candidate.lang if top_candidate.prob >= MIN_DETECTION_CONFIDENCE else 'en'
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

    except ResourceExhausted:
        return jsonify({
            "error": "The AI is getting rate-limited (free-tier Gemini quota). Wait about a minute and try again."
        }), 429

    except Exception:
        print("Error in /chat:")
        traceback.print_exc()
        return jsonify({"error": "Internal server error. Please try again later."}), 500


if __name__ == '__main__':
    debug_mode = os.environ.get("FLASK_DEBUG", "true").lower() == "true"
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=debug_mode)
