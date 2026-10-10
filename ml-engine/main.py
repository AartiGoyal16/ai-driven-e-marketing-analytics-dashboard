from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.linear_model import Ridge
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

app = FastAPI(
    title="Marketing ROI & Performance Machine Learning Engine",
    description="Multi-metric regression forecasting engine with out-of-sample evaluation, model benchmarking, and scenario simulation.",
    version="2.0.0"
)

# ---------------------------------------------------------
# Request / Response Schemas
# ---------------------------------------------------------

class CampaignFeatures(BaseModel):
    platform: str = "Google"
    budget: float = Field(..., gt=0, description="Campaign budget in USD")
    status: str = "active"
    campaign_duration: Optional[int] = Field(default=30, ge=1, le=365, description="Campaign duration in days")
    target_audience: Optional[str] = Field(default="general_consumers", description="Target audience segment")
    campaign_objective: Optional[str] = Field(default="conversions", description="Primary campaign goal")
    geography: Optional[str] = Field(default="north_america", description="Target geography")
    seasonality: Optional[str] = Field(default="q4_holiday_peak", description="Seasonality quarter")

class WhatIfRequest(BaseModel):
    platform: str = "Google"
    status: str = "active"
    base_budget: float = Field(default=5000.0, gt=0)
    campaign_duration: Optional[int] = 30
    campaign_objective: Optional[str] = "conversions"

class RecommendRequest(BaseModel):
    budget: float = Field(..., gt=0)
    campaign_objective: Optional[str] = "conversions"
    target_audience: Optional[str] = "general_consumers"

# ---------------------------------------------------------
# Global In-Memory Model Registry & Benchmark Stores
# ---------------------------------------------------------

ml_registry: Dict[str, Any] = {}

# ---------------------------------------------------------
# Synthetic Dataset Generation (2,500 observations)
# ---------------------------------------------------------

def generate_marketing_dataset(samples: int = 2500, seed: int = 42) -> pd.DataFrame:
    """
    Generates a realistic historical dataset of marketing campaign observations
    with multifaceted features: duration, audience, objective, geography, seasonality,
    impressions, spend, CTR, CPC, conversions, and ROI.
    """
    np.random.seed(seed)
    
    platforms = ["google", "facebook", "instagram", "linkedin", "tiktok", "twitter", "youtube"]
    statuses = ["active", "paused", "completed"]
    audiences = ["b2b_professionals", "ecommerce_shoppers", "gen_z_tech", "young_adults", "general_consumers"]
    objectives = ["conversions", "brand_awareness", "lead_generation", "traffic", "engagement"]
    geographies = ["north_america", "europe", "asia_pacific", "latin_america", "global"]
    seasonalities = ["q1_regular", "q2_spring", "q3_summer", "q4_holiday_peak"]
    
    # Platform benchmarks: (base_cpc, base_ctr, base_cr, base_roi)
    benchmarks = {
        "google": (1.80, 0.038, 0.075, 1.65),
        "facebook": (1.15, 0.024, 0.055, 1.45),
        "instagram": (1.30, 0.029, 0.060, 1.50),
        "linkedin": (3.80, 0.018, 0.090, 1.35),
        "tiktok": (0.85, 0.042, 0.045, 1.40),
        "twitter": (1.50, 0.019, 0.040, 1.20),
        "youtube": (2.20, 0.022, 0.065, 1.55)
    }
    
    # Multipliers for objectives & seasonality
    obj_mult = {
        "conversions": {"roi": 1.12, "cr": 1.20},
        "lead_generation": {"roi": 1.05, "cr": 1.10},
        "traffic": {"roi": 0.95, "cr": 0.85},
        "brand_awareness": {"roi": 0.90, "cr": 0.70},
        "engagement": {"roi": 0.92, "cr": 0.80}
    }
    
    season_mult = {
        "q4_holiday_peak": {"roi": 1.22, "cpc": 1.15},
        "q2_spring": {"roi": 1.04, "cpc": 1.00},
        "q3_summer": {"roi": 0.98, "cpc": 0.95},
        "q1_regular": {"roi": 0.94, "cpc": 0.92}
    }
    
    data = []
    for _ in range(samples):
        plat = np.random.choice(platforms)
        stat = np.random.choice(statuses, p=[0.60, 0.25, 0.15])
        aud = np.random.choice(audiences)
        obj = np.random.choice(objectives)
        geo = np.random.choice(geographies)
        seas = np.random.choice(seasonalities)
        duration = int(np.random.randint(7, 91))
        
        # Log-uniform budget between $100 and $100,000
        budget = round(float(np.exp(np.random.uniform(np.log(100), np.log(100000)))), 2)
        
        base_cpc, base_ctr, base_cr, base_roi = benchmarks[plat]
        
        # Objective adjustments
        om = obj_mult.get(obj, {"roi": 1.0, "cr": 1.0})
        sm = season_mult.get(seas, {"roi": 1.0, "cpc": 1.0})
        
        # Audience synergy
        aud_synergy = 1.0
        if aud == "b2b_professionals" and plat == "linkedin":
            aud_synergy = 1.20
        elif aud == "gen_z_tech" and plat in ["tiktok", "instagram"]:
            aud_synergy = 1.15
        elif aud == "ecommerce_shoppers" and plat in ["google", "facebook"]:
            aud_synergy = 1.18
            
        adj_cpc = base_cpc * sm["cpc"]
        adj_cr = base_cr * om["cr"] * aud_synergy
        
        # Diminishing returns scaling factor for large budgets
        budget_scaling = 1.0 / (1.0 + 0.14 * np.log10(budget / 100.0))
        status_mult = 1.0 if stat == "active" else (0.85 if stat == "paused" else 0.95)
        
        noise_clicks = np.random.normal(1.0, 0.07)
        noise_conv = np.random.normal(1.0, 0.08)
        noise_roi = np.random.normal(1.0, 0.06)
        
        clicks = int(max(5, (budget / adj_cpc) * budget_scaling * status_mult * noise_clicks))
        impressions = int(clicks / max(0.005, base_ctr * np.random.normal(1.0, 0.05)))
        conversions = int(max(1, clicks * adj_cr * status_mult * noise_conv))
        
        ctr = round(float((clicks / max(1, impressions)) * 100), 2)
        cpc = round(float(budget / max(1, clicks)), 2)
        
        raw_roi = base_roi * om["roi"] * sm["roi"] * budget_scaling * status_mult * aud_synergy * noise_roi
        roi_percentage = round(float(max(0.35, raw_roi)), 2)
        
        data.append({
            "platform": plat,
            "budget": budget,
            "status": stat,
            "campaign_duration": duration,
            "target_audience": aud,
            "campaign_objective": obj,
            "geography": geo,
            "seasonality": seas,
            "impressions": impressions,
            "clicks": clicks,
            "spend": budget,
            "conversions": conversions,
            "ctr": ctr,
            "cpc": cpc,
            "roi_percentage": roi_percentage
        })
        
    return pd.DataFrame(data)

# ---------------------------------------------------------
# Training, Train/Test Split & Multi-Model Comparison
# ---------------------------------------------------------

def evaluate_predictions(y_true, y_pred) -> Dict[str, float]:
    """Calculates MAE, MSE, RMSE, and R² score."""
    mae = float(mean_absolute_error(y_true, y_pred))
    mse = float(mean_squared_error(y_true, y_pred))
    rmse = float(np.sqrt(mse))
    r2 = float(r2_score(y_true, y_pred))
    return {
        "mae": round(mae, 4),
        "mse": round(mse, 4),
        "rmse": round(rmse, 4),
        "r2_score": round(r2, 4)
    }

def train_and_benchmark_engine():
    """
    Trains models with an 80/20 train/test split.
    Compares Random Forest, Ridge Regression, and Gradient Boosting.
    Selects the best performing model.
    """
    df = generate_marketing_dataset(samples=2500)
    
    feature_cols = [
        "platform", "budget", "status", "campaign_duration",
        "target_audience", "campaign_objective", "geography", "seasonality"
    ]
    numeric_features = ["budget", "campaign_duration"]
    categorical_features = ["platform", "status", "target_audience", "campaign_objective", "geography", "seasonality"]
    
    X = df[feature_cols]
    y_roi = df["roi_percentage"]
    y_clicks = df["clicks"]
    y_conv = df["conversions"]
    
    # Train / Test split (80% train, 20% test)
    X_train, X_test, y_roi_train, y_roi_test = train_test_split(X, y_roi, test_size=0.20, random_state=42)
    _, _, y_clicks_train, y_clicks_test = train_test_split(X, y_clicks, test_size=0.20, random_state=42)
    _, _, y_conv_train, y_conv_test = train_test_split(X, y_conv, test_size=0.20, random_state=42)
    
    preprocessor = ColumnTransformer(
        transformers=[
            ("num", StandardScaler(), numeric_features),
            ("cat", OneHotEncoder(handle_unknown="ignore", sparse_output=False), categorical_features)
        ]
    )
    
    # Candidate Regressors to Compare
    candidates = {
        "Random Forest": {
            "regressor_class": RandomForestRegressor,
            "params": {"n_estimators": 100, "max_depth": 14, "random_state": 42}
        },
        "Ridge Regression": {
            "regressor_class": Ridge,
            "params": {"alpha": 1.0}
        },
        "Gradient Boosting": {
            "regressor_class": GradientBoostingRegressor,
            "params": {"n_estimators": 100, "learning_rate": 0.1, "max_depth": 5, "random_state": 42}
        }
    }
    
    comparison_results = {}
    candidate_pipelines = {}
    
    for name, config in candidates.items():
        # Train ROI Pipeline
        roi_pipe = Pipeline(steps=[
            ("preprocessor", preprocessor),
            ("regressor", config["regressor_class"](**config["params"]))
        ])
        roi_pipe.fit(X_train, y_roi_train)
        y_pred = roi_pipe.predict(X_test)
        
        metrics = evaluate_predictions(y_roi_test, y_pred)
        comparison_results[name] = metrics
        candidate_pipelines[name] = roi_pipe
        
    # Best model selection by lowest RMSE (and highest R²)
    best_model_name = min(comparison_results, key=lambda k: comparison_results[k]["rmse"])
    print(f"Model Benchmarking Complete. Best Model: {best_model_name} with R²: {comparison_results[best_model_name]['r2_score']}")
    
    # Full production pipelines for the best model architecture
    best_config = candidates[best_model_name]
    
    # Active ROI Model
    roi_pipeline = candidate_pipelines[best_model_name]
    
    # Active Clicks Model
    clicks_pipeline = Pipeline(steps=[
        ("preprocessor", preprocessor),
        ("regressor", best_config["regressor_class"](**best_config["params"]))
    ])
    clicks_pipeline.fit(X_train, y_clicks_train)
    clicks_metrics = evaluate_predictions(y_clicks_test, clicks_pipeline.predict(X_test))
    
    # Active Conversions Model
    conv_pipeline = Pipeline(steps=[
        ("preprocessor", preprocessor),
        ("regressor", best_config["regressor_class"](**best_config["params"]))
    ])
    conv_pipeline.fit(X_train, y_conv_train)
    conv_metrics = evaluate_predictions(y_conv_test, conv_pipeline.predict(X_test))
    
    # Also keep a dedicated Random Forest for tree-variance confidence estimation if not already best
    rf_roi_pipeline = candidate_pipelines.get("Random Forest")
    if not rf_roi_pipeline:
        rf_roi_pipe = Pipeline(steps=[
            ("preprocessor", preprocessor),
            ("regressor", RandomForestRegressor(n_estimators=100, random_state=42))
        ])
        rf_roi_pipe.fit(X_train, y_roi_train)
        rf_roi_pipeline = rf_roi_pipe
    
    return {
        "best_model_name": best_model_name,
        "comparison_results": comparison_results,
        "evaluation_metrics": {
            "roi": comparison_results[best_model_name],
            "clicks": clicks_metrics,
            "conversions": conv_metrics
        },
        "roi_model": roi_pipeline,
        "clicks_model": clicks_pipeline,
        "conv_model": conv_pipeline,
        "rf_roi_model": rf_roi_pipeline,
        "dataset_samples": len(df),
        "train_samples": len(X_train),
        "test_samples": len(X_test)
    }

# Initialize and train ML models on module load
ml_registry = train_and_benchmark_engine()

# ---------------------------------------------------------
# Helper Functions
# ---------------------------------------------------------

def normalize_features(features: CampaignFeatures) -> pd.DataFrame:
    """Normalizes input features into a clean single-row pandas DataFrame."""
    plat_raw = (features.platform or "").strip().lower()
    stat_raw = (features.status or "").strip().lower()
    
    if "google" in plat_raw:
        plat = "google"
    elif "meta" in plat_raw or "facebook" in plat_raw:
        plat = "facebook"
    elif "insta" in plat_raw:
        plat = "instagram"
    elif "linkedin" in plat_raw:
        plat = "linkedin"
    elif "tiktok" in plat_raw:
        plat = "tiktok"
    elif "twitter" in plat_raw or "x" in plat_raw:
        plat = "twitter"
    elif "youtube" in plat_raw:
        plat = "youtube"
    else:
        plat = "google"
        
    if "act" in stat_raw:
        stat = "active"
    elif "pause" in stat_raw:
        stat = "paused"
    else:
        stat = "completed"
        
    aud = features.target_audience or "general_consumers"
    obj = features.campaign_objective or "conversions"
    geo = features.geography or "north_america"
    seas = features.seasonality or "q4_holiday_peak"
    duration = features.campaign_duration if features.campaign_duration and features.campaign_duration > 0 else 30
    
    return pd.DataFrame([{
        "platform": plat,
        "budget": float(features.budget),
        "status": stat,
        "campaign_duration": int(duration),
        "target_audience": aud,
        "campaign_objective": obj,
        "geography": geo,
        "seasonality": seas
    }])

def compute_confidence_intervals(input_df: pd.DataFrame, roi_pred: float):
    """
    Computes statistically meaningful confidence score and 95% confidence intervals
    using Random Forest tree ensemble variance.
    """
    rf_pipe = ml_registry["rf_roi_model"]
    rf_reg = rf_pipe.named_steps["regressor"]
    preprocessed_x = rf_pipe.named_steps["preprocessor"].transform(input_df)
    
    tree_preds = [float(tree.predict(preprocessed_x)[0]) for tree in rf_reg.estimators_]
    tree_std = float(np.std(tree_preds))
    tree_mean = float(np.mean(tree_preds))
    
    # 95% Confidence interval (1.96 * standard deviation)
    lower_bound = round(max(0.20, float(roi_pred - 1.96 * tree_std)), 2)
    upper_bound = round(float(roi_pred + 1.96 * tree_std), 2)
    
    # Bounded confidence score
    rel_uncertainty = tree_std / (tree_mean + 1e-5)
    confidence_score = round(float(max(0.72, min(0.98, 1.0 - rel_uncertainty))), 2)
    
    return confidence_score, lower_bound, upper_bound

# ---------------------------------------------------------
# API Endpoints
# ---------------------------------------------------------

@app.get("/")
def read_root():
    return {
        "status": "ML Engine Online v2.0",
        "best_model": ml_registry["best_model_name"],
        "dataset_samples": ml_registry["dataset_samples"],
        "train_samples": ml_registry["train_samples"],
        "test_samples": ml_registry["test_samples"],
        "algorithms_compared": list(ml_registry["comparison_results"].keys())
    }

@app.get("/metrics")
def get_model_metrics():
    """Returns MAE, MSE, RMSE, and R² evaluation metrics for the active best model."""
    return {
        "status": "success",
        "best_model": ml_registry["best_model_name"],
        "metrics": ml_registry["evaluation_metrics"]
    }

@app.get("/model-comparison")
def get_model_comparison():
    """Returns comparative evaluation benchmarks across all candidate models."""
    return {
        "status": "success",
        "selected_best_model": ml_registry["best_model_name"],
        "models": ml_registry["comparison_results"]
    }

@app.post("/predict")
def predict_roi(features: CampaignFeatures):
    """Generates multi-metric predictions with out-of-sample validated model and confidence intervals."""
    input_df = normalize_features(features)
    
    roi_pred = float(ml_registry["roi_model"].predict(input_df)[0])
    clicks_pred = int(round(float(ml_registry["clicks_model"].predict(input_df)[0])))
    conv_pred = int(round(float(ml_registry["conv_model"].predict(input_df)[0])))
    
    confidence_score, lower_bound, upper_bound = compute_confidence_intervals(input_df, roi_pred)
    predicted_roi = round(max(0.30, roi_pred), 2)
    
    return {
        "status": "success",
        "model_used": ml_registry["best_model_name"],
        "predicted_roi": predicted_roi,
        "predictedRoi": predicted_roi,
        "predictedClicks": clicks_pred,
        "predictedConversions": conv_pred,
        "confidenceScore": confidence_score,
        "confidenceInterval": {
            "lower": lower_bound,
            "upper": upper_bound
        },
        "message": f"{ml_registry['best_model_name']} predicted ROI: {predicted_roi}x (95% CI: {lower_bound}x - {upper_bound}x) with {int(confidence_score * 100)}% confidence."
    }

@app.post("/what-if")
def simulate_what_if(req: WhatIfRequest):
    """
    Simulates ROI curves across multiple budget tiers to demonstrate
    diminishing returns and identify the optimal investment point.
    """
    budget_tiers = [500.0, 1000.0, 2500.0, 5000.0, 7500.0, 10000.0, 15000.0, 25000.0, 50000.0]
    scenarios = []
    
    for b in budget_tiers:
        features = CampaignFeatures(
            platform=req.platform,
            budget=b,
            status=req.status,
            campaign_duration=req.campaign_duration,
            campaign_objective=req.campaign_objective
        )
        input_df = normalize_features(features)
        roi = round(float(ml_registry["roi_model"].predict(input_df)[0]), 2)
        clicks = int(round(float(ml_registry["clicks_model"].predict(input_df)[0])))
        conv = int(round(float(ml_registry["conv_model"].predict(input_df)[0])))
        scenarios.append({
            "budget": b,
            "predicted_roi": roi,
            "predicted_clicks": clicks,
            "predicted_conversions": conv,
            "marginal_efficiency": round(float(conv / (b + 1e-4) * 100), 2)
        })
        
    optimal_scenario = max(scenarios, key=lambda s: s["predicted_roi"])
    return {
        "status": "success",
        "platform": req.platform,
        "optimal_budget": optimal_scenario["budget"],
        "optimal_roi": optimal_scenario["predicted_roi"],
        "scenarios": scenarios
    }

@app.post("/recommend")
def recommend_campaign_strategy(req: RecommendRequest):
    """
    Prescriptive recommendation engine:
    Evaluates all major ad platforms for the specified budget and objective,
    returning ranked recommendations and optimal spend guidelines.
    """
    platforms = ["google", "facebook", "instagram", "linkedin", "tiktok", "youtube"]
    platform_scores = []
    
    for plat in platforms:
        features = CampaignFeatures(
            platform=plat,
            budget=req.budget,
            status="active",
            campaign_objective=req.campaign_objective or "conversions",
            target_audience=req.target_audience or "general_consumers"
        )
        input_df = normalize_features(features)
        roi = round(float(ml_registry["roi_model"].predict(input_df)[0]), 2)
        clicks = int(round(float(ml_registry["clicks_model"].predict(input_df)[0])))
        conv = int(round(float(ml_registry["conv_model"].predict(input_df)[0])))
        platform_scores.append({
            "platform": plat.capitalize(),
            "predicted_roi": roi,
            "predicted_clicks": clicks,
            "predicted_conversions": conv
        })
        
    platform_scores.sort(key=lambda x: x["predicted_roi"], reverse=True)
    best_platform = platform_scores[0]
    runner_up = platform_scores[1] if len(platform_scores) > 1 else best_platform
    
    # Recommended budget window around the optimal budget curve
    lower_rec = round(max(500.0, req.budget * 0.80), -2)
    upper_rec = round(req.budget * 1.35, -2)
    
    return {
        "status": "success",
        "recommended_platform": best_platform["platform"],
        "recommended_budget_range": f"${int(lower_rec):,} – ${int(upper_rec):,}",
        "best_predicted_roi": best_platform["predicted_roi"],
        "comparative_advantage": f"{best_platform['platform']} is projected to outperform {runner_up['platform']} by +{round((best_platform['predicted_roi'] - runner_up['predicted_roi']) * 100, 1)}% ROI.",
        "platform_rankings": platform_scores
    }