from fastapi import FastAPI
from pydantic import BaseModel
import pandas as pd
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.ensemble import RandomForestRegressor

app=FastAPI(
    title="Marketing ROI Prediction API",
    description="AI engine for forecasting ad campaign performance."
) 

class CampaignFeatures(BaseModel):
    platform: str
    budget: float
    status: str
    
def train_model():
    data={
        "platform": ["linkedin","google","facebook","linkedin","google","facebook","linkedin"],
        "budget": [5000,10000,2000,8000,15000,3000,6000],
        "status": ["active","active","paused","active","completed","completed","paused"],
        "roi_percentage": [1.25,1.40,0.80,1.30,1.50,0.90,1.10]
    }
    
    df=pd.DataFrame(data)
    
    X=df[["platform","budget","status"]]
    y=df[["roi_percentage"]]
    
    preprocessor=ColumnTransformer(
        transformers=[
            ("num",StandardScaler(),["budget"]),
            ("cat",OneHotEncoder(handle_unknown="ignore"),["platform","status"])
        ]
    )
    
    model=Pipeline(steps=[
        ("preprocessor",preprocessor),
        ("regressor",RandomForestRegressor(n_estimators=100,random_state=42))
    ])
    
    model.fit(X,y)
    return model

roi_model=train_model()
print("Machine Learning model trained and loaded!")
    
@app.get("/")
def read_root():
    return {"status":"ML Engine is online and ready!"}

@app.post("/predict")
def predict_roi(features: CampaignFeatures):
    input_data=pd.DataFrame([{
        "platform": features.platform,
        "budget": features.budget,
        "status": features.status
    }])
    
    prediction=roi_model.predict(input_data)[0]
    
    return {
        "status": "success",
        "predicted_roi": round(float(prediction),2),
        "message": f"Predicted ROI for this {features.platform} campaign is {round(float(prediction)*100,1)}%"
    }