import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score
import joblib

# 1. Load Data
print("Loading data...")
try:
    df = pd.read_csv('Crop_recommendation.csv')
except FileNotFoundError:
    print("Error: Crop_recommendation.csv not found.")
    exit()

X = df.drop('label', axis=1)
y = df['label']

# 2. Split Data
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# 3. Train Model (Random Forest is usually best)
print("Training Random Forest model...")
pipeline = Pipeline([
    ('scaler', StandardScaler()),
    ('classifier', RandomForestClassifier(n_estimators=100, random_state=42))
])

pipeline.fit(X_train, y_train)

# 4. Evaluate
y_pred = pipeline.predict(X_test)
acc = accuracy_score(y_test, y_pred)
print(f"Model Accuracy: {acc:.4f}")

# 5. Save Model
print("Saving model...")
joblib.dump(pipeline, 'best_model.pkl')
print("Model saved to best_model.pkl")
