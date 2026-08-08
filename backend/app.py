import json
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


def _parse_json_response(text):
    """Gemini's JSON mode is reliable but occasionally still wraps output in
    markdown fences — strip those before parsing."""
    text = text.strip()
    if text.startswith("```"):
        text = text.split("```")[1]
        if text.lower().startswith("json"):
            text = text[4:]
        text = text.strip()
    return json.loads(text)


QUIZ_DIFFICULTY_GUIDANCE = {
    "easy": "well-known, basic facts a beginner would know",
    "medium": "more specific facts: numbers, causes of pollution, and regional situations",
    "hard": "detailed global water-crisis statistics, conservation technologies, and virtual water concepts",
    "expert": "nuanced, lesser-known facts: water policy, cross-country comparisons, and technical processes",
}

TIP_CATEGORIES = [
    "Bathroom", "Kitchen", "Laundry", "Outdoor & Gardening",
    "Leaks & Plumbing", "Appliances & Technology", "Community & Policy", "Water Pollution",
]


@app.route('/', methods=['GET'])
def health_check():
    return jsonify({"status": "ok", "chat_ready": model is not None})


@app.route('/quiz-session', methods=['POST'])
def quiz_session():
    if model is None:
        return jsonify({"error": "Quiz generator is not configured: GEMINI_API_KEY is missing on the server."}), 503

    data = request.json or {}
    difficulty = data.get("difficulty", "easy")
    guidance = QUIZ_DIFFICULTY_GUIDANCE.get(difficulty, QUIZ_DIFFICULTY_GUIDANCE["easy"])

    prompt = (
        "Generate 5 multiple-choice trivia questions about water: water pollution, water "
        "conservation, water scarcity, and the water situation in different countries/regions "
        f"around the world. Difficulty level: {difficulty} — {guidance}. Cover a mix of these "
        "topics across the 5 questions; don't repeat the same fact twice within the set. "
        "Respond with ONLY a JSON array (no markdown fences, no extra text) in exactly this shape: "
        '[{"question": "...", "options": ["...", "...", "...", "..."], "correctIndex": 0, '
        '"explanation": "one sentence explaining the correct answer"}]'
    )

    try:
        response = model.generate_content(
            prompt,
            generation_config=genai.types.GenerationConfig(
                response_mime_type="application/json",
                max_output_tokens=2048,
                temperature=0.9,
            ),
        )
        questions = _parse_json_response(response.text)
        if not isinstance(questions, list) or not questions:
            raise ValueError("Model did not return a question list")
        return jsonify({"questions": questions, "difficulty": difficulty})

    except ResourceExhausted:
        return jsonify({
            "error": "The AI is getting rate-limited (free-tier Gemini quota). Wait about a minute and try again."
        }), 429

    except Exception:
        print("Error in /quiz-session:")
        traceback.print_exc()
        return jsonify({"error": "Could not generate quiz questions right now. Please try again."}), 500


@app.route('/tips', methods=['GET'])
def tips():
    if model is None:
        return jsonify({"error": "Tip generator is not configured: GEMINI_API_KEY is missing on the server."}), 503

    category = request.args.get("category", "").strip()
    topic = (
        f'specifically about "{category}"' if category
        else "covering a mix of categories (bathroom, kitchen, laundry, outdoor, leaks, "
             "appliances, community, pollution)"
    )

    prompt = (
        f"Generate 8 concise, practical water conservation tips, {topic}. Each tip should be one "
        "short sentence, specific and actionable, not generic filler. Respond with ONLY a JSON "
        'array of 8 strings (no markdown fences, no extra text): ["tip 1", "tip 2", ...]'
    )

    try:
        response = model.generate_content(
            prompt,
            generation_config=genai.types.GenerationConfig(
                response_mime_type="application/json",
                max_output_tokens=1024,
                temperature=1.0,
            ),
        )
        tip_list = _parse_json_response(response.text)
        if not isinstance(tip_list, list) or not tip_list:
            raise ValueError("Model did not return a tip list")
        return jsonify({"tips": tip_list, "category": category or "General"})

    except ResourceExhausted:
        return jsonify({
            "error": "The AI is getting rate-limited (free-tier Gemini quota). Wait about a minute and try again."
        }), 429

    except Exception:
        print("Error in /tips:")
        traceback.print_exc()
        return jsonify({"error": "Could not generate tips right now. Please try again."}), 500


@app.route('/tip-categories', methods=['GET'])
def tip_categories():
    return jsonify({"categories": TIP_CATEGORIES})


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
