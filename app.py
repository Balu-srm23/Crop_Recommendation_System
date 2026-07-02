from flask import Flask, render_template, request, jsonify
import joblib
import pandas as pd
import numpy as np
import os
from dotenv import load_dotenv
import google.generativeai as genai

load_dotenv()

app = Flask(__name__)

# Gemini setup
gemini_key = os.getenv('GEMINI_API_KEY')
if gemini_key:
    genai.configure(api_key=gemini_key)
else:
    print("Warning: GEMINI_API_KEY not set in .env")
    genai.configure(api_key="")

# Load Model

MODEL_PATH = 'best_model.pkl'

def load_model(): 
    try:
        if os.path.exists(MODEL_PATH):
            return joblib.load(MODEL_PATH)
        else:
            print(f"Model file not found at {MODEL_PATH}")
            return None
    except Exception as e:
        print(f"Error loading model: {e}")
        return None

model = load_model()

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/predict', methods=['POST'])
def predict():
    if not model:
        return jsonify({'error': 'Model not loaded'}), 500

    try:
        data = request.get_json()
        
        # Extract features in the correct order
        features = [
            data.get('N'),
            data.get('P'),
            data.get('K'),
            data.get('temperature'),
            data.get('humidity'),
            data.get('ph'),
            data.get('rainfall')
        ]
        
        # Create DataFrame for prediction (matches training data structure)
        feature_cols = ['N', 'P', 'K', 'temperature', 'humidity', 'ph', 'rainfall']
        input_df = pd.DataFrame([features], columns=feature_cols)
        
        # Make prediction
        prediction = model.predict(input_df)[0]
        
        # Get confidence score if available
        confidence = 0.0
        if hasattr(model, 'predict_proba'):
            confidence = float(model.predict_proba(input_df).max())
            
        # --- NEW: Explainable AI & Fertilizer Recommendation via Gemini ---
        explanation = "Explanation could not be generated."
        fertilizer = "Fertilizer recommendation could not be generated."
        try:
            ai_prompt = f"""You are an agricultural expert. A machine learning model predicted the best crop to be '{prediction}' with {confidence*100:.1f}% confidence for the following conditions: N: {data.get('N')}, P: {data.get('P')}, K: {data.get('K')}, Temp: {data.get('temperature')}°C, Humidity: {data.get('humidity')}%, pH: {data.get('ph')}, Rainfall: {data.get('rainfall')}mm.
            
            Please provide a JSON response with exactly two keys (no markdown blocks, no code blocks, just raw JSON):
            {{"explanation": "A concise summary (2-3 sentences) of why this crop is suitable, why others might not be, and what the confidence score signifies.",
            "fertilizer": "A concise recommendation for the best fertilizer(s) for this crop under these conditions."}}"""
            
            ai_model = genai.GenerativeModel('gemini-2.5-flash')
            ai_response = ai_model.generate_content(ai_prompt)
            
            import json
            import re
            
            res_text = ai_response.text.strip()
            # Clean up markdown code blocks if any
            res_text = re.sub(r'^```json', '', res_text, flags=re.IGNORECASE)
            res_text = re.sub(r'^```', '', res_text)
            res_text = re.sub(r'```$', '', res_text).strip()
            
            ai_data = json.loads(res_text)
            explanation = ai_data.get("explanation", explanation)
            fertilizer = ai_data.get("fertilizer", fertilizer)
        except Exception as e:
            print(f"Explainable AI Error: {e}")
            
        return jsonify({
            'prediction': prediction,
            'confidence': confidence,
            'explanation': explanation,
            'fertilizer': fertilizer
        })

    except Exception as e:
        print(f"Prediction error: {e}")
        return jsonify({'error': str(e)}), 400

@app.route('/chat', methods=['POST'])
def chat():
    try:
        data = request.get_json()
        user_message = data.get('message', '').strip()
        language = data.get('language', 'English')
        history = data.get('history', [])
        
        if not user_message:
            return jsonify({'error': 'Empty message'}), 400
        
        # Format history string
        conversation_log = ""
        if history:
            for msg in history:
                role = "User" if msg.get("role") == "user" else "AgriBot"
                conversation_log += f"{role}: {msg.get('content')}\n"
        
        # System prompt for an open conversational assistant
        system_prompt = f"""You are a helpful and intelligent assistant.
You can answer ANY question the user asks. You are no longer restricted to agriculture.
You MUST respond entirely in the language the user speaks or the chosen language ({language}).

Conversation History:
{conversation_log}

User Question: {user_message}
Answer: """
        
        try:
            model_engine = genai.GenerativeModel('gemini-flash-latest')
            response = model_engine.generate_content(system_prompt)
            bot_response = response.text.strip()
        except Exception as e:
            print(f"Gemini API error: {e}")
            return jsonify({'response': 'Sorry, the AI model is currently unavailable.'}), 500
            
        return jsonify({'response': bot_response})
        
    except Exception as e:
        print(f"Chat error: {e}")
        return jsonify({'response': 'Sorry, having trouble processing your request. Try again!'}), 500

from flask import send_file
from io import BytesIO
from gtts import gTTS

@app.route('/tts', methods=['POST'])
def tts():
    try:
        data = request.get_json()
        text = data.get('text', '').strip()
        language_str = data.get('language', 'English')
        lang_map = {'English': 'en', 'Hindi': 'hi', 'Telugu': 'te', 'Tamil': 'ta', 'Marathi': 'mr', 'Kannada': 'kn'}
        lang_code = lang_map.get(language_str, 'en')
        
        if not text:
            return jsonify({'error': 'No text provided'}), 400
            
        tts_engine = gTTS(text=text, lang=lang_code)
        fp = BytesIO()
        tts_engine.write_to_fp(fp)
        fp.seek(0)
        
        return send_file(fp, mimetype='audio/mpeg')
    except Exception as e:
        print(f"TTS error: {e}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)
