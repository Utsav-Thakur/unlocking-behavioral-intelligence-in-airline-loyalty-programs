# LoyaltyIQ - Airline Loyalty Analytics API Backend

This is the backend API for **LoyaltyIQ**, a behavioral intelligence and churn prediction platform for airline loyalty programs. Built using **FastAPI**, this server manages the passenger registry database, runs predictive machine learning inferences, and streams context-aware strategic prompts using Claude AI.

## Project Features

- **Members Analytics Queries**: Server-side filtration, page limit pagination, and multi-field sorting over thousands of records in memory.
- **Auto-Imputing Churn Classifier**: Serves real-time risk predictions using a trained Random Forest classification model and scaler weights.
- **Claude AI Streaming (SSE)**: SSE streaming endpoints integrating Claude 3.5 Sonnet to draft tailored retention emails, analyze charts, and compose 90-day strategy roadmaps.
- **CORS Support**: Configured to serve requests from any frontend origin.
- **Vercel Serverless Integration**: Prepared for Vercel deployment with ASGI request rewriting and Python execution rules.

## Installation & Setup

1. **Clone the repository and go to the directory**:
   ```bash
   cd backend
   ```

2. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

3. **Set your Anthropic API Key**:
   On Windows (PowerShell):
   ```powershell
   $env:ANTHROPIC_API_KEY="your-key-here"
   ```
   On Linux/macOS:
   ```bash
   export ANTHROPIC_API_KEY="your-key-here"
   ```

4. **Start the development server**:
   ```bash
   python -m backend.main
   ```
   The API will be available at `http://localhost:8000`. You can inspect the interactive OpenAPI documentation at `http://localhost:8000/docs`.

## Deployment Configs

This API is configured to run on Vercel as a Python serverless function via `vercel.json` routing configuration.

---

## Author Credits

- **Built by**: Utsav Kumar Thakur
- **GitHub**: [Utsav-Thakur](https://github.com/Utsav-Thakur)
- **LinkedIn**: [linkedin.com/in/utsav-thakur-2b01871b7](https://linkedin.com/in/utsav-thakur-2b01871b7)
