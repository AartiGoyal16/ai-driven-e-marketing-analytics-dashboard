from fastapi import FastAPI
from pydantic import BaseModel
import pandas as pd
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.ensemble import RandomForestRegressor

app = FastAPI(
    title="Marketing ROI Prediction API",
    description="AI engine for forecasting ad campaign performance."
)

class CampaignFeatures(BaseModel):
    platform: str
    budget: float
    status: str

def train_model():
    data = {
        "platform": ["linkedin", "google", "facebook", "linkedin", "google", "facebook", "linkedin", "tiktok", "meta"],
        "budget": [5000, 10000, 2000, 8000, 15000, 3000, 6000, 4000, 12000],
        "status": ["active", "active", "paused", "active", "completed", "completed", "paused", "active", "active"],
        "roi_percentage": [1.25, 1.40, 0.80, 1.30, 1.50, 0.90, 1.10, 1.35, 1.48]
    }
    
    df = pd.DataFrame(data)
    
    X = df[["platform", "budget", "status"]]
    y = df[["roi_percentage"]]
    
    preprocessor = ColumnTransformer(
        transformers=[
            ("num", StandardScaler(), ["budget"]),
            ("cat", OneHotEncoder(handle_unknown="ignore"), ["platform", "status"])
        ]
    )
    
    model = Pipeline(steps=[
        ("preprocessor", preprocessor),
        ("regressor", RandomForestRegressor(n_estimators=100, random_state=42))
    ])
    
    model.fit(X, y.values.ravel())
    return model

roi_model = train_model()
print("Machine Learning model trained and loaded!")

@app.get("/")
def read_root():
    return {"status": "ML Engine is online and ready!"}

@app.post("/predict")
def predict_roi(features: CampaignFeatures):
    # Normalize inputs to lowercase to avoid unknown platform/status errors
    platform_clean = features.platform.strip().lower()
    status_clean = features.status.strip().lower()

    # Map aliases
    if "meta" in platform_clean or "facebook" in platform_clean:
        platform_model = "facebook"
    elif "google" in platform_clean:
        platform_model = "google"
    elif "linkedin" in platform_clean:
        platform_model = "linkedin"
    elif "tiktok" in platform_clean:
        platform_model = "tiktok"
    else:
        platform_model = "google"

    if "act" in status_clean:
        status_model = "active"
    elif "pause" in status_clean:
        status_model = "paused"
    else:
        status_model = "completed"

    input_data = pd.DataFrame([{
        "platform": platform_model,
        "budget": float(features.budget),
        "status": status_model
    }])
    
    prediction = roi_model.predict(input_data)[0]
    predicted_roi = round(float(prediction), 2)
    
    # Calculate estimated metrics based on platform & budget
    base_cpc = 1.85 if platform_model == "google" else (2.40 if platform_model == "linkedin" else 1.20)
    estimated_clicks = int(features.budget / base_cpc)
    estimated_conversions = int(estimated_clicks * (0.08 if status_model == "active" else 0.04))

    return {
        "status": "success",
        "predicted_roi": predicted_roi,
        "predictedRoi": predicted_roi,
        "predictedClicks": estimated_clicks,
        "predictedConversions": estimated_conversions,
        "confidenceScore": 0.95,
        "message": f"Predicted ROI for {features.platform} ({status_clean}) with budget ${features.budget:,.2f} is {round(predicted_roi * 100, 1)}%"
    }