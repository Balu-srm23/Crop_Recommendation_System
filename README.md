# 🌾 Crop Recommendation System

A machine learning–powered system that recommends the most suitable crop based on soil nutrients and environmental conditions. Built with **Scikit-Learn** and deployed using **Flask**, this project helps farmers or enthusiasts make smart crop choices.

---

## 🚀 Features
- RandomForest-based machine learning model for accurate crop recommendation  
- Complete ML pipeline: preprocessing → training → evaluation  
- Flask API for real-time predictions  
- User-friendly web interface (HTML/CSS/JS)  
- Jupyter Notebook for data exploration and experimentation  

---

## 📁 Project Structure

```
app.py                           # Flask web server
train_model.py                   # Model training script
Crop_Recommendation_System.ipynb # Jupyter notebook for EDA
Crop_recommendation.csv          # Training dataset
static/                          # Static files (CSS, JS, images)
templates/                       # HTML templates for UI
requirements.txt                 # Python dependencies
.gitignore                       # Files/folders to ignore in git
```

---

## ⚙️ Installation

1. **Clone the repo**
   ```bash
   git clone https://github.com/venkateswara489/Crop-Recommendation-system.git
   cd Crop-Recommendation-system
   ```

2. **Install dependencies (Python ≥3.7 recommended)**
   ```bash
   pip install -r requirements.txt
   ```

   If requirements.txt doesn't exist, create it with:
   ```
   flask
   pandas
   numpy
   scikit-learn
   joblib
   ```

---

## 🧪 Train the Model

Train the RandomForest model and save it as `best_model.pkl`:
```bash
python train_model.py
```
This generates `best_model.pkl` used for predictions.

---

## 🌐 Run the Web App

Start the Flask server:
```bash
python app.py
```
Then open your browser at: [http://127.0.0.1:5000](http://127.0.0.1:5000)

---

## 🔗 API Endpoint

**POST /predict**  
Example JSON request:
```json
{
  "N": 50,
  "P": 30,
  "K": 40,
  "temperature": 25,
  "humidity": 80,
  "ph": 6.5,
  "rainfall": 200
}
```
You can use `curl` or Postman to test the API.

---

## 📌 Notes

- Ensure the dataset path (`Crop_recommendation.csv`) and model path (`best_model.pkl`) are correctly set in `train_model.py` and `app.py`.
- Add a `requirements.txt` and `.gitignore` for easier setup and cleaner repository.
- You may customize the UI in `templates/index.html` and `static/`.
- For detailed data analysis, explore `Crop_Recommendation_System.ipynb`.

---

## 🤝 Contributing

Pull requests are welcome! For major changes, please open an issue first.

---

## 📧 Contact

For questions or feedback, open an issue or contact [venkateswara489](https://github.com/venkateswara489).
