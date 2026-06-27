import os
import sys
import json
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Inject current directory into sys.path to allow root-level imports on Vercel and locally
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from routers import members, predict, ai

app = FastAPI(title="LoyaltyIQ API Gateway", version="1.0.0")

# Enable CORS for all origins, credentials, methods, and headers
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Startup event to load JSON datasets into memory
@app.on_event("startup")
def load_datasets():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    data_dir = os.path.join(base_dir, "data")
    
    # Paths to the preprocessed JSON files
    members_path = os.path.join(data_dir, "final_summary.json")
    segment_path = os.path.join(data_dir, "segment_summary.json")
    feature_path = os.path.join(data_dir, "feature_importance.json")
    anomaly_path = os.path.join(data_dir, "anomaly_report.json")
    
    # Load members list
    if os.path.exists(members_path):
        with open(members_path, "r") as f:
            app.state.members = json.load(f)
        print(f"Successfully cached {len(app.state.members)} loyalty members.")
    else:
        app.state.members = []
        print(f"WARNING: final_summary.json not found at {members_path}.")
        
    # Load segment summaries
    if os.path.exists(segment_path):
        with open(segment_path, "r") as f:
            app.state.segment_summary = json.load(f)
        print("Successfully cached segment summaries.")
    else:
        app.state.segment_summary = []
        print(f"WARNING: segment_summary.json not found at {segment_path}.")
        
    # Load feature importance
    if os.path.exists(feature_path):
        with open(feature_path, "r") as f:
            app.state.feature_importance = json.load(f)
        print("Successfully cached feature importance metrics.")
    else:
        app.state.feature_importance = []
        print(f"WARNING: feature_importance.json not found at {feature_path}.")
        
    # Load anomaly report
    if os.path.exists(anomaly_path):
        with open(anomaly_path, "r") as f:
            app.state.anomalies = json.load(f)
        print(f"Successfully cached {len(app.state.anomalies)} anomaly reports.")
    else:
        app.state.anomalies = []
        print(f"WARNING: anomaly_report.json not found at {anomaly_path}.")

# Register routers
app.include_router(members.router)
app.include_router(predict.router)
app.include_router(ai.router)

@app.get("/")
def read_root():
    return {
        "status": "online",
        "service": "LoyaltyIQ API Gateway",
        "version": "1.0.0"
    }

if __name__ == "__main__":
    import uvicorn
    try:
        import backend
        app_module = "backend.main:app"
    except ImportError:
        app_module = "main:app"
    uvicorn.run(app_module, host="0.0.0.0", port=8000, reload=True)
