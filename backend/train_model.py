import os
import pickle
import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import RandomForestClassifier

def train_model():
    base_path = r"d:\Unlocking Behavioral Intelligence in Airline Loyalty Programs"
    csv_dir = os.path.join(base_path, "Data Set")
    
    # Load CSV files
    history_df = pd.read_csv(os.path.join(csv_dir, "Customer Loyalty History.csv"))
    activity_df = pd.read_csv(os.path.join(csv_dir, "Customer Flight Activity.csv"))
    
    # Clean columns
    history_df.columns = [c.strip() for c in history_df.columns]
    activity_df.columns = [c.strip() for c in activity_df.columns]
    
    # Aggregate flight activity
    flight_agg = activity_df.groupby("Loyalty Number").agg(
        total_flights=("Total Flights", "sum"),
        total_distance=("Distance", "sum"),
        points_accumulated=("Points Accumulated", "sum"),
        points_redeemed=("Points Redeemed", "sum"),
        dollar_cost_redeemed=("Dollar Cost Points Redeemed", "sum")
    ).reset_index()
    
    # Merge datasets
    df = pd.merge(history_df, flight_agg, on="Loyalty Number", how="left")
    
    # Fill flight stats with 0
    fill_cols = ["total_flights", "total_distance", "points_accumulated", "points_redeemed", "dollar_cost_redeemed"]
    for col in fill_cols:
        df[col] = df[col].fillna(0)
        
    # Redemption ratio
    df["redemption_ratio"] = np.where(
        df["points_accumulated"] > 0,
        df["points_redeemed"] / df["points_accumulated"],
        0.0
    )
    
    # Fill salary with median
    median_salary = df["Salary"].median()
    df["Salary"] = df["Salary"].fillna(median_salary)
    
    # Categorical mapping
    CARD_MAP = {"Star": 0, "Nova": 1, "Aurora": 2}
    GENDER_MAP = {"Female": 0, "Male": 1}
    MARITAL_MAP = {"Married": 0, "Single": 1, "Divorced": 2}
    EDUCATION_MAP = {
        "High School or Below": 0,
        "College": 1,
        "Bachelor": 2,
        "Master": 3,
        "Doctor": 4
    }
    PROVINCE_MAP = {
        "Ontario": 0, "British Columbia": 1, "Quebec": 2, "Alberta": 3,
        "Manitoba": 4, "Saskatchewan": 5, "Nova Scotia": 6, "New Brunswick": 7,
        "Newfoundland": 8, "Prince Edward Island": 9
    }
    
    # Apply maps with fallback (default to 0)
    df["card_code"] = df["Loyalty Card"].map(CARD_MAP).fillna(0).astype(int)
    df["gender_code"] = df["Gender"].map(GENDER_MAP).fillna(0).astype(int)
    df["marital_code"] = df["Marital Status"].map(MARITAL_MAP).fillna(0).astype(int)
    df["education_code"] = df["Education"].map(EDUCATION_MAP).fillna(0).astype(int)
    df["province_code"] = df["Province"].map(PROVINCE_MAP).fillna(0).astype(int)
    
    # Features
    numeric_features = [
        "CLV", "Salary", "total_flights", "total_distance", 
        "points_accumulated", "points_redeemed", "dollar_cost_redeemed", 
        "redemption_ratio"
    ]
    categorical_features = [
        "card_code", "gender_code", "marital_code", "education_code", "province_code"
    ]
    
    X_numeric = df[numeric_features].values
    X_categorical = df[categorical_features].values
    
    # Fit scaler on numeric features
    scaler = StandardScaler()
    X_numeric_scaled = scaler.fit_transform(X_numeric)
    
    # Combine features
    X = np.hstack((X_numeric_scaled, X_categorical))
    
    # Target (1 if churned/cancelled, 0 if active)
    y = df["Cancellation Year"].notnull().astype(int).values
    
    # Train classifier
    print("Training RandomForest model on", len(X), "samples...")
    clf = RandomForestClassifier(n_estimators=100, random_state=42, n_jobs=-1)
    clf.fit(X, y)
    
    # Create ml folder
    os.makedirs(os.path.join(base_path, "backend", "ml"), exist_ok=True)
    
    # Save scaler and model
    with open(os.path.join(base_path, "backend", "ml", "scaler.pkl"), "wb") as f:
        pickle.dump(scaler, f)
    with open(os.path.join(base_path, "backend", "ml", "churn_model.pkl"), "wb") as f:
        pickle.dump(clf, f)
        
    print("Model and scaler saved successfully to backend/ml!")

if __name__ == "__main__":
    train_model()
