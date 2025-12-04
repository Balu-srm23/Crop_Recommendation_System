from flask import Flask, render_template, request, jsonify
import joblib
import pandas as pd
import numpy as np
import os

app = Flask(__name__)

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
            
        return jsonify({
            'prediction': prediction,
            'confidence': confidence
        })

    except Exception as e:
        print(f"Prediction error: {e}")
        return jsonify({'error': str(e)}), 400

if __name__ == '__main__':
    app.run(debug=True)
