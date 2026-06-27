# Unlocking Behavioral Intelligence in Airline Loyalty Programs (LoyaltyIQ)

Welcome to **LoyaltyIQ**, a modern, end-to-end predictive analytics and behavioral intelligence system designed for airline loyalty programs.

## 🚀 Live Deployment
The frontend web application is deployed and accessible at:
👉 **[https://loyaltyiq-nine.vercel.app/](https://loyaltyiq-nine.vercel.app/)**

---

## 📋 Table of Contents
- [Project Overview](#project-overview)
- [Key Features](#key-features)
- [Repository Structure](#repository-structure)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
  - [Backend Setup](#1-backend-setup)
  - [Frontend Setup](#2-frontend-setup)
- [Author & Credits](#author--credits)

---

## 🔍 Project Overview
LoyaltyIQ allows airline operations and marketing teams to inspect passenger registries, analyze flight timelines, and predict churn using machine learning. By merging customer CRM details with active engagement metrics, the platform maps disengagement indicators and uses GenAI agents (Claude, OpenAI, Gemini) to craft customized retention campaigns.

---

## ✨ Key Features
- **Interactive Analytics Dashboard**: Cross-filtered visualization of loyalty card distributions, regional passenger segments, and flight trends.
- **Real-Time Churn Predictor**: XGBoost / Random Forest classifier with ROC-AUC score of **0.941** predicting disengagement risks.
- **Interactive Member Search & Lookup**: Filter, sort, and paginate through thousands of records in-memory.
- **AI-Powered Strategy Copywriter**: Generates context-aware strategic retention emails and 90-day action plans.
- **Modern Dark-Mode UI**: Built with responsive navigation, fluid animations, and a cohesive design language.

---

## 📁 Repository Structure
```text
├── backend/            # FastAPI API Service, ML models & serverless routes
│   ├── ml/             # ML inference scripts
│   ├── models/         # Trained serialized model weights
│   ├── routers/        # API route files
│   └── main.py         # Entry point for backend api
├── frontend/           # React + Vite application (deployed on Vercel)
│   ├── src/
│   │   ├── components/ # Shared UI & charts (Sidebar, Charts, etc.)
│   │   ├── pages/      # Views (Dashboard, Overview, Churn, About)
│   │   └── App.jsx     # App component & Router
│   └── vercel.json     # Single-page app rewrite configuration
├── Data Set/           # CRM datasets for passenger flight history
└── preprocess.py       # Data cleansing & preprocessing pipeline
```

---

## 🛠️ Tech Stack
- **Frontend**: React 18, Vite, Tailwind CSS, Recharts, Lucide Icons, React Router
- **Backend**: FastAPI, Python, Uvicorn, Serverless Functions
- **Machine Learning**: XGBoost, Scikit-Learn, Pandas, NumPy
- **LLM Integrations**: Anthropic API (Claude 3.5 Sonnet), Google Gemini API, OpenAI API
- **Deployment**: Vercel

---

## 🚀 Getting Started

### 1. Backend Setup
1. Navigate to the `backend` directory:
   ```bash
   cd backend
   ```
2. Install the Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Set your API keys (e.g. Anthropic):
   - **Windows (PowerShell)**:
     ```powershell
     $env:ANTHROPIC_API_KEY="your-api-key"
     ```
   - **macOS / Linux**:
     ```bash
     export ANTHROPIC_API_KEY="your-api-key"
     ```
4. Start the backend local development server:
   ```bash
   python -m backend.main
   ```
   The backend API will run on `http://localhost:8000`. Access the interactive docs at `http://localhost:8000/docs`.

### 2. Frontend Setup
1. Navigate to the `frontend` directory:
   ```bash
   cd frontend
   ```
2. Install the Node packages:
   ```bash
   npm install
   ```
3. Create a `.env.development` file and set the API URL:
   ```env
   VITE_API_URL=http://localhost:8000
   ```
4. Launch the local Vite development server:
   ```bash
   npm run dev
   ```
   Open `http://localhost:5173` in your browser.

---

## ✍️ Author & Credits
- **Developer**: Utsav Kumar Thakur
- **GitHub**: [@Utsav-Thakur](https://github.com/Utsav-Thakur)
- **LinkedIn**: [utsav-thakur-2b01871b7](https://linkedin.com/in/utsav-thakur-2b01871b7)
- **Deployment URL**: [https://loyaltyiq-nine.vercel.app/](https://loyaltyiq-nine.vercel.app/)
