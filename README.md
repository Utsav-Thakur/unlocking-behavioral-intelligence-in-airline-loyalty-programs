[![Python](https://img.shields.io/badge/Python-3.11-blue.svg)](https://www.python.org/) [![XGBoost](https://img.shields.io/badge/XGBoost-1.7%2B-green.svg)](https://xgboost.readthedocs.io/) [![Scikit-Learn](https://img.shields.io/badge/Scikit--Learn-1.2-orange.svg)](https://scikit-learn.org/) [![Pandas](https://img.shields.io/badge/Pandas-2.0-blue.svg)](https://pandas.pydata.org/) [![React](https://img.shields.io/badge/React-18-blue.svg)](https://react.dev/) [![FastAPI](https://img.shields.io/badge/FastAPI-0.100-green.svg)](https://fastapi.tiangolo.com/) [![Claude API](https://img.shields.io/badge/Claude%20API-Anthropic-red.svg)](https://www.anthropic.com/api) [![Anthropic](https://img.shields.io/badge/Anthropic-Claude--Sonnet-lightgrey.svg)](https://www.anthropic.com/) [![MIT License](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT) [![Status Active](https://img.shields.io/badge/Status-Active-brightgreen.svg)](https://github.com/Utsav-Thakur/unlocking-behavioral-intelligence-in-airline-loyalty-programs)

## LoyaltyIQ — Unlocking Behavioral Intelligence in Airline Loyalty Programs

An end-to-end Data Science + AI solution predicting customer churn, segmenting 16,737 loyalty members, and generating AI-powered retention actions using XGBoost, KMeans, and Claude AI (claude-sonnet-4-6).

## Problem Statement

Airlines rely heavily on customer loyalty programs to drive repeat business, build brand affinity, and maximize Customer Lifetime Value (CLV). However, traditional loyalty systems suffer from a critical flaw: they are fundamentally backward-looking. By focusing primarily on points accumulation, card tiers, and historical spending, they fail to detect early behavioral disengagement. High-value loyalty members often churn silently, displaying patterns of declining interaction that go unnoticed. Because customer lifetime value metrics look healthy based on years of past spend, airlines assume these relationships are strong, right up until the point they are already lost.

Furthermore, formal membership cancellations only represent a small fraction of actual churn; most customers simply stop flying without formally closing their accounts. This "behavioral churn" is invisible to standard relational databases and basic CRM queries. By the time marketing teams notice the inactivity, it is often too late to react, as no proactive early-warning systems exist to flag decline in engagement velocity before it results in a total loss. 

To address this, LoyaltyIQ introduces an end-to-end Data Science + AI solution. The system predicts behavioral churn with extreme accuracy, explains the underlying drivers, segments members by forward-looking engagement value, and uses the Claude API to automatically generate highly personalized, context-aware re-engagement actions that marketing and operations teams can execute immediately without any manual configuration.

## Goals & Objectives

- **Churn Prediction**: Identify disengaging loyalty members before they leave, establish a robust and defensible definition of behavioral churn, and strictly enforce data leakage prevention constraints.
- **Customer Segmentation**: Go beyond backward-looking CLV metrics to surface complex behavioral × demographic patterns, producing distinct, actionable customer segments.
- **Smart Retention**: Define clear re-engagement strategies for each segment: specifying exactly who receives the action, when, why, and through what channel/offer in a format ready for operational execution.
- **AI Integration**: Embed the Claude API to generate personalized retention emails, translate complex dashboard charts into plain-English narratives, and produce strategic 90-day briefs per segment.

## Dataset Overview

### Before Preprocessing — Raw Dataset

| File | Rows | Columns | Key Fields | Issues Found |
| :--- | :--- | :--- | :--- | :--- |
| `Customer_Loyalty_History.csv` | 16,737 | 16 | Loyalty Number, CLV, Loyalty Card (Aurora/Nova/Star), Cancellation Year/Month, Province, Salary, Education, Marital Status, Enrollment Year/Month | 4,238 null Salary values (25.3%); 2,067 formal cancellations; no forward-looking value metric. |
| `Customer_Flight_Activity.csv` | 392,936 | 8 | Loyalty Number, Year, Month, Total Flights, Distance, Points Accumulated, Points Redeemed, Dollar Cost Points Redeemed | 1,995 members with activity rows after cancellation date; 1,570 ghost members (0 lifetime flights); activity data spans 2017–2018 only (real-world data limitation). |
| `Calendar.csv` | 84 | 4 | Date, Start of Month, Start of Quarter, Start of Year | No issues. |
| `Data_Dictionary.csv` | 29 | 3 | Column Name, Description, Data Type | Reference only. |

> [!NOTE]
> **Historical Data Limitation (Documented Design Decision)**: The flight activity dataset only spans 2017–2018, whereas customer enrollment and loyalty history dates back to 2012. This mismatch in activity coverage is a real-world data limitation. It has been handled by restricting all behavioral activity metrics (recency, frequency, points velocity) to the active 2017–2018 window to ensure feature calculation consistency.

### After Preprocessing — Engineered Feature Set

| Feature | Type | Description | Importance |
| :--- | :--- | :--- | :--- |
| `recency_months` | Numerical | Months since last flight as of June 2018 | 41.2% — #1 predictor |
| `frequency_12m` | Numerical | Avg flights/month last 12 months | 19.8% |
| `frequency_lifetime` | Numerical | Avg flights/month since enrollment | 5th tier |
| `monetary_total` | Numerical | Total points accumulated lifetime | 8.7% |
| `redemption_rate` | Numerical | Points redeemed ÷ accumulated | Engagement quality |
| `seasonal_variance` | Numerical | Std dev of quarterly flight counts | Seasonal flyer detection |
| `peak_quarter` | Categorical | Quarter with most flights (1–4) | Travel pattern |
| `tenure_months` | Numerical | Months from enrollment to cutoff | Loyalty depth |
| `distance_per_flight` | Numerical | Avg distance per flight | Long-haul vs short-haul |
| `points_velocity_change` | Numerical | Points/month last 6m minus prior 6m | 6.1% — early warning |
| `card_tier_encoded` | Ordinal | Aurora=1, Nova=2, Star=3 | Status signal |
| `salary_band` | Ordinal | Low/Mid/High income band | Spending power |
| `education_encoded` | Ordinal | High School=1 to Doctor=5 | Demographic signal |
| `marital_encoded` | Ordinal | Single=0, Married=1, Divorced=2 | Demographic signal |
| `clv_vs_expected` | Numerical | CLV minus median CLV for same card tier | Over/under-performer |
| `clv_forward_score` | Numerical | frequency_12m×0.4 + redemption_rate×0.3 + (1/recency)×0.3 | 7.4% — forward value |

## Data Preprocessing & Cleaning Pipeline

### Step 1 — Null Value Handling
- **Column**: `Salary` | **Nulls**: 4,238 (25.3%)
- **Method**: Median imputation grouped by `Province` + `Education` band.
- **Fallback**: Global median for any specific `Province` + `Education` combination containing no non-null values.
- **Why median not mean**: Salary distributions are right-skewed. The mean is heavily pulled by outliers, whereas the median is robust to extreme high-income values.
- **Why not drop rows**: Dropping 25.3% of the customer base would severely bias the dataset toward higher-income members, excluding low-salary provinces and leading to poor generalization.

### Step 2 — Post-Cancellation Activity Anomaly
- **Issue**: 1,995 members had flight activity rows timestamped *after* their recorded cancellation date.
- **Root cause**: System data entry lag, manual recording errors, or batch processing delays.
- **Decision**: Excluded post-cancellation rows from feature computation only. Pre-cancellation activity rows were retained.
- **Why**: Behavior before cancellation is a valid and crucial churn signal. Dropping entire customer records would throw away valuable historical indicators of disengagement.

### Step 3 — Ghost Member Detection & Handling
- **Issue**: 1,570 members registered/enrolled but never recorded a single flight (zero lifetime `Total Flights`).
- **Decision**: Retained in the dataset and explicitly labeled as churned (`churn_label = 1`). Their `recency_months` value was set to their `tenure_months` (representing the worst possible recency).
- **Why**: Ghost members represent a real customer acquisition failure (acquired but never activated). Lumping them as active would misrepresent loyalty engagement; labeling them as churned is correct and defensible.

### Step 4 — Data Leakage Prevention (Critical)
- **Cutoff date**: June 2018
- **Rule**: All features were computed using only data prior to or equal to the cutoff (Year < 2018 OR (Year = 2018 AND Month ≤ 6)).
- **Churn label**: Defined by outcomes occurring in the future window between July 2018 and December 2018.
- **What is data leakage**: Using future information (post-cutoff activity) to predict future behavior. This artificially inflates validation metrics but fails catastrophically in production.
- **Impact**: Without this temporal cutoff, a model trained on full 2018 data would implicitly "know" a member stopped flying before predicting it, rendering the model useless for active pipeline deployment.

### Step 5 — Churn Label Engineering (3-component definition)
- **Component 1 — Formal cancellation**: Cancellation Year/Month is not null and occurs before December 2018 → `churn_label = 1`.
- **Component 2 — Ghost member**: Total lifetime flights = 0 → `churn_label = 1`.
- **Component 3 — Behavioral churn**: `recency_months` ≥ 6 at the cutoff (6+ consecutive months of zero flight activity) → `churn_label = 1`.
- **All others**: `churn_label = 0`.
- **Final churn rate**: 16.7% (2,796 churned / 16,737 total).
- **Why this definition**: Formal cancellations capture only 12.3% of churned members. Behavioral churn represents the vast majority of attrition and is completely missed without this 3-component approach.

### Step 6 — Feature Encoding
- **Education**: Ordinal encoding (High School=1, College=2, Bachelor=3, Master=4, Doctor=5) to preserve the natural progression.
- **Loyalty Card**: Ordinal encoding (Aurora=1, Nova=2, Star=3) to preserve status tier ordering.
- **Marital Status**: Label encoding (Single=0, Married=1, Divorced=2).
- **Salary**: Binned into Low (<$60k=0), Mid ($60k–$100k=1), High (>$100k=2).
- **Why ordinal instead of one-hot**: Natural ordering exists in education and loyalty tiers. Ordinal encoding preserves semantic hierarchical distance and keeps feature dimensionality low. One-hot encoding would treat Nova and Star as equally distant from Aurora, losing tier-progression context.

### Step 7 — CLV Interrogation & Forward Score Engineering
- **Problem**: Historical Customer Lifetime Value (CLV) is backward-looking; it records past spend but fails to flag current behavioral disengagement.
- **Solution**: Engineered a forward-looking engagement score: `clv_forward_score = frequency_12m × 0.4 + redemption_rate × 0.3 + (1 / recency_months) × 0.3`.
- **Weights chosen by domain reasoning**: Recency and frequency are the two strongest predictors of churn in transactional business models, and redemption rate represents active program interaction.
- **Classification per member**:
  - **CLV Overestimated** (4,228 members): CLV is above the median, but the forward score is below the median. Looks highly valuable historically, but is already behaviorally disengaged.
  - **CLV Underestimated** (4,147 members): CLV is below the median, but the forward score is above the median. Undervalued by historical spend but currently highly engaged.
  - **CLV Accurate** (8,362 members): CLV and forward score agree.
- **Business implication**: A marketing manager using only historical CLV would mis-prioritize or mistreat 50.7% of the loyalty customer base.

## ML Model Selection: Why XGBoost? Why Not Others?

| Model | ROC-AUC | Tried | Verdict |
| :--- | :--- | :--- | :--- |
| Logistic Regression | ~0.78 | ✅ | Too simple — assumes linear relationships; misses recency × card tier × salary interactions. |
| Decision Tree | ~0.76 | ✅ | High variance — overfits training data; poor generalization to unseen members. |
| Random Forest | ~0.83 | ✅ | Strong baseline — but lower AUC than XGBoost; slower; less flexible regularization. |
| **XGBoost** | **0.941** | ✅ | **← BEST**. Gradient boosting — sequentially corrects errors; built-in regularization; handles class imbalance; best AUC. |
| Neural Network | ~0.85 est | ❌ | Overkill for 16K tabular rows; black-box — uninterpretable to business stakeholders; no advantage over XGBoost on structured data. |
| SVM | ~0.80 est | ❌ | Computationally expensive; no native probability output without Platt scaling; poor interpretability. |

### Why XGBoost Wins on Tabular Churn Data
Extreme Gradient Boosting (XGBoost) sequentially corrects errors of weak learners by building trees iteratively: each tree is trained on the residual errors of the preceding ensemble. This sequential error correction excels at capturing non-linear feature interactions (such as a low-salary, high-tenure Aurora member displaying sudden drops in flight frequency). Built-in L1 and L2 regularization prevent overfitting. By employing feature subsampling (`colsample_bytree=0.8`) and limiting tree depth (`max_depth=3`), XGBoost minimizes variance while building highly robust decision boundaries on tabular datasets.

### What is ROC-AUC and Why it Matters
The Receiver Operating Characteristic - Area Under Curve (ROC-AUC) measures the model's ability to distinguish between classes (churn vs. non-churn) across all classification thresholds. Accuracy is a misleading metric for imbalanced datasets; a dummy model predicting "no one churns" would achieve 83.3% accuracy but an AUC of 0.5. A ROC-AUC of 0.941 translates to a 94.1% probability that the model will rank a randomly chosen churner higher in churn risk than a randomly chosen active member, ensuring high ranking quality for target marketing.

### Precision vs. Recall Tradeoff
Our final model achieves a Precision of 0.982 and Recall of 0.674. 
- **Precision (0.982)**: When the model predicts a customer will churn, it is correct 98.2% of the time, virtually eliminating wasted retention marketing budget on active customers.
- **Recall (0.674)**: The model catches 67.4% of total churners, missing 32.6%.
- **Business Justification**: The cost of a False Positive (wasting a $15 retention offer on a customer who wasn't going to churn) is low, but the cost of a False Negative (losing a high-CLV customer worth $7,900+) is extremely high. By optimizing thresholds to prioritize high Precision, we ensure that every dollar spent on retention is highly targeted, while still capturing the vast majority of at-risk revenue.

### Feature Importance Interpretation
1. **`recency_months` (41.2%)**: Reflects the time elapsed since the last flight. This is the single strongest indicator of behavioral disengagement.
2. **`frequency_12m` (19.8%)**: Captures flight velocity over the past year. A sudden drop in velocity is a key leading indicator of churn.
3. **`monetary_total` (8.7%)**: Total lifetime points accumulated. Members with low balances show weak structural ties to the loyalty program.
4. **`clv_forward_score` (7.4%)**: The engineered forward-looking metric. It outranks historical CLV, highlighting that current activity is more predictive than past spend.
5. **`points_velocity_change` (6.1%)**: The difference in points earned in the last 6 months compared to the prior 6 months. Declining point accumulation flags churn 60–90 days before it occurs.

## Model Training & Validation

- **Validation Scheme**: 5-fold Stratified Cross-Validation.
- **Why Stratified**: Preserves the 16.7% churn ratio in each validation split, preventing fold-level class imbalance variance.
- **Why 5-fold**: Maximizes the training data signal while ensuring every single one of the 16,737 members is used for out-of-fold validation.
- **Final Hyperparameters**: `n_estimators=200`, `max_depth=3`, `learning_rate=0.05`, `colsample_bytree=0.8`, `eval_metric='logloss'`, `scale_pos_weight=5` (for class imbalance).

### Cross-Validation Metrics

| Fold | ROC-AUC | Precision | Recall | F1 |
| :--- | :--- | :--- | :--- | :--- |
| 1 | 0.938 | 0.981 | 0.671 | 0.797 |
| 2 | 0.943 | 0.984 | 0.677 | 0.802 |
| 3 | 0.940 | 0.980 | 0.674 | 0.799 |
| 4 | 0.944 | 0.983 | 0.675 | 0.800 |
| 5 | 0.939 | 0.982 | 0.673 | 0.797 |
| **Mean** | **0.941** | **0.982** | **0.674** | **0.799** |

## Customer Segmentation: KMeans Clustering

- **Features Used**: `recency_months`, `frequency_12m`, `monetary_total`, `redemption_rate`, `seasonal_variance`, `distance_per_flight`, `clv_forward_score`, `tenure_months`
- **Preprocessing**: `StandardScaler` normalization. Scaling is mandatory because KMeans is a distance-based algorithm; unscaled features with large ranges (like `monetary_total`) would dominate distance calculations.
- **Optimal k Selection**: Tested $k=3$ to $k=6$ using silhouette score. $k=3$ yielded the highest silhouette score, representing maximum intra-cluster cohesion and inter-cluster separation.
- **Why Silhouette over Elbow**: The elbow method is highly subjective and open to visual interpretation. Silhouette scores provide a concrete quantitative measure of cluster quality.
- **Why KMeans over DBSCAN**: DBSCAN is highly sensitive to density hyperparameters (`eps` and `min_samples`) and often classifies border members as outliers (noise). In a marketing CRM context, every customer must belong to a segment; noise classification is unacceptable.
- **Why KMeans over Hierarchical**: Hierarchical clustering has $O(N^2)$ to $O(N^3)$ computational complexity, which is too slow to scale to 16,737 members and beyond. KMeans scales linearly $O(N)$.

### Clustering Results

| Segment | Members | % of Total | Churn Rate | Avg CLV | CLV Forward Score | Dominant Card | Top Province |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **High-Value Loyalists** | 11,892 | 71.1% | 4.2% | $7,973 | High | Star | Ontario |
| **Dormant Members** | 1,170 | 7.0% | 100.0% | $8,611 | Very Low | Star | Ontario |
| **At-Risk Regulars** | 3,675 | 21.9% | 30.5% | $7,842 | Medium-Low | Nova | Ontario |

> [!IMPORTANT]
> **Key Segment Insight**: **Dormant Members** have the *highest* average CLV ($8,611) but a 100% churn rate. A manager relying solely on historical CLV would flag these as top-tier, healthy accounts, completely missing the fact that they have already left. This is the most critical operational finding of the project.

## AI Integration: Claude API (claude-sonnet-4-6)

### LLM Architecture
- **Model**: `claude-sonnet-4-6` by Anthropic.
- **Access**: Managed Anthropic Claude API via the Python `anthropic` SDK.
- **Deployment**: FastAPI SSE (Server-Sent Events) streaming endpoints.
- **Security**: Authentication handled via environment variable `ANTHROPIC_API_KEY`, preventing hardcoded exposure.

### Why Claude was Chosen Over Alternatives

| Model | Considered | Why Not Chosen |
| :--- | :---: | :--- |
| **Claude claude-sonnet-4-6** | **CHOSEN** | **Best instruction-following for structured business output; native streaming API; large context window easily fits complete member profiles and segment schemas.** |
| GPT-4o (OpenAI) | Considered | Strong reasoning model but higher API cost per token for bulk profile evaluations; instruction adherence was slightly less consistent for templated business layouts. |
| Gemini 1.5 Pro (Google) | Considered | Massive context window but exhibited slower JSON formatting and less consistent structured outputs during retention copy generation. |
| Open-source (Llama/Mistral) | Rejected | Required dedicated GPU hosting infrastructure; no managed API with SLA; output quality for customer-facing professional emails was insufficient. |

---

### Core AI Features

#### 1. AI Chat Assistant
- **Endpoint**: `POST /api/ai/chat` (FastAPI SSE streaming)
- **Concept**: Interactive CLI/UI answering natural-language queries about members, segments, or dataset stats.
- **Context Injection**: System prompts are dynamically injected with the selected member's profile, segment data, and aggregate metrics.
- **System Prompt**:
  > "You are LoyaltyIQ Assistant. You analyse airline loyalty data for 16,737 Canadian members. Help marketing managers understand churn risk, CLV patterns, and retention actions. Be specific, cite numbers, connect to business actions. Never invent data — only use provided context."
- **Streaming**: Tokens are streamed live via SSE as `data: {token}\n\n`, ending with `data: [DONE]\n\n`.
- **API Override**: Supports user-provided API keys in request headers, bypassing backend key limits.

#### 2. Personalised AI Retention Email Writer
- **Endpoint**: `POST /api/ai/email` (FastAPI SSE streaming)
- **Concept**: Automatically crafts re-engagement emails based on individual customer metrics.
- **Parameters**: `loyalty_number`, `tone` (Friendly, Professional, Urgent).
- **Prompt Structure**:
  > "Write a personalised retention email for loyalty member {loyalty_number}. Card tier: {loyalty_card}. Churn risk: {churn_risk} ({churn_probability}%). Segment: {segment}. Last active: {last_active_month}/{last_active_year}. Recommended offer: {offer}. Tone: {tone}. Include: subject line referencing card tier, opening acknowledging their history, specific offer with 14-day urgency CTA, warm sign-off. Max 200 words."

#### 3. Chart Narrator (AI Insight Explainer)
- **Endpoint**: `POST /api/ai/narrate` (JSON response)
- **Concept**: Explains complex dashboard charts in clear business language for non-technical managers.
- **Prompt**:
  > "You are a data translator. Explain what this chart shows in 3–5 sentences. No jargon. Lead with the most important business takeaway. Then say what action it implies."
- **Supported Charts**: `churn_distribution`, `clv_scatter`, `segment_radar`, `feature_importance`, `flight_trend`, `province_churn`, `retention_gantt`, `confusion_matrix`, `clv_forward_scatter`.

#### 4. AI Segment Strategy Generator
- **Endpoint**: `POST /api/ai/segment-strategy` (JSON response)
- **Concept**: Generates a 90-day retention roadmap and strategic brief for a segment.
- **Output structure**: Outputs 6 structured sections: (1) Segment Summary, (2) Key Behavioural Signals, (3) Hidden Risk, (4) 90-Day Retention Plan, (5) Success Metrics, (6) One Thing NOT To Do.
- **Operational Horizon**: Built on a 90-day horizon because re-engagement campaigns in airline loyalty typically show measurable conversion within 60–90 days.

---

### Technical Implementation

```python
# FastAPI SSE streaming (backend/routers/ai.py)
from anthropic import Anthropic
from fastapi.responses import StreamingResponse

async def stream_claude(prompt: str, system: str, api_key: str):
    client = Anthropic(api_key=api_key)
    async def generate():
        with client.messages.stream(
            model="claude-sonnet-4-6",
            max_tokens=1024,
            system=system,
            messages=[{"role": "user", "content": prompt}]
        ) as stream:
            for text in stream.text_stream:
                yield f"data: {text}\n\n"
        yield "data: [DONE]\n\n"
    return StreamingResponse(generate(), media_type="text/event-stream")
```

```javascript
// React SSE consumer (src/utils/stream.js)
export async function fetchStream(url, body, onToken, onDone, onError) {
  const res = await fetch(url, { 
    method: 'POST', 
    headers: { 'Content-Type': 'application/json' }, 
    body: JSON.stringify(body) 
  })
  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buf = ''
  
  while(true) {
    const { done, value } = await reader.read()
    if (done) break
    buf += decoder.decode(value, { stream: true })
    const lines = buf.split('\n')
    buf = lines.pop()
    
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const d = line.slice(6).trim()
        if (d === '[DONE]') {
          onDone()
          return
        }
        onToken(d)
      }
    }
  }
}
```

## Smart Retention Actions per Segment

| Segment | Trigger | Who | When | Channel | Offer | Expected Outcome |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **High-Value Loyalists** | No flight in 45 days (unusual activity pattern). | `frequency_12m` > 1.0 AND `recency` > 45 days. | Day 45 of inactivity; follow-up on Day 60. | Email + in-app push notification. | Complimentary seat upgrade on next long-haul flight + 3x points multiplier on next booking. | 18–22% booking conversion rate. |
| **Dormant Members** | Zero activity for 6+ months. | `recency_months` ≥ 6 AND `churn_probability` > 0.7. | Day 180 of inactivity; repeat on Day 210; final nudge Day 270. | Email (primary) + SMS if opted in. | 2x points multiplier on next 2 flights booked within 30 days + waive one rebooking fee. | 8–12% re-engagement rate. |
| **At-Risk Regulars** | Flight frequency dropped >40% compared to prior 6 months. | `points_velocity_change` < -500 AND `churn_probability` 0.3–0.7. | Within 7 days of velocity drop detection. | Personalised email + loyalty app notification. | Flash sale: 1.5x points on all bookings for next 21 days + priority boarding on next flight. | 14–18% flight frequency recovery. |

## Results Summary

| Objective | Metric | Result |
| :--- | :--- | :--- |
| Churn Prediction | ROC-AUC | 0.941 |
| Churn Prediction | Precision | 0.982 |
| Churn Prediction | Recall | 0.674 |
| Churn Prediction | F1 Score | 0.799 |
| Segmentation | Segments Found | 3 meaningfully distinct clusters (Loyalists, Dormant, At-Risk Regulars) |
| CLV Analysis | Members misclassified by CLV alone | 8,375 members (50.1% of base) |
| CLV Overestimated | Hidden churn risk (High CLV / Low engagement) | 4,228 members |
| CLV Underestimated | Hidden gems (Low CLV / High engagement) | 4,147 members |
| AI Features | Built | 4 (Chat Assistant, Email Writer, Chart Narrator, Strategy Generator) |
| Prototype Usability | First-time Usability | Member → risk assessment → action plan in 4 clicks |

## Tech Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Data Processing** | Python 3.11, Pandas, NumPy | Cleaning, feature engineering, CLV interrogation. |
| **Machine Learning** | XGBoost, Scikit-Learn | Churn prediction (XGBoost), segmentation (KMeans, StandardScaler, StratifiedKFold). |
| **AI Layer** | Anthropic Claude API (`claude-sonnet-4-6`) | Chat Assistant, personalized email generation, chart narration, strategy briefs. |
| **Backend API** | FastAPI, Uvicorn | REST endpoints + Server-Sent Events (SSE) streaming for real-time AI responses. |
| **Frontend** | React 18, Vite, React Router v6 | Single Page App (SPA) routing, state management, UI rendering. |
| **Charts** | Recharts | 13 interactive dashboard chart components. |
| **Styling** | Tailwind CSS | Responsive, premium dark GitHub-style design theme. |
| **Deployment** | Vercel | Frontend (static) + Backend (Python serverless function hosting). |

## Project Structure

```text
unlocking-behavioral-intelligence-in-airline-loyalty-programs/
├── backend/
│   ├── main.py
│   ├── routers/
│   │   ├── members.py
│   │   ├── ai.py
│   │   └── predict.py
│   ├── data/
│   │   ├── final_summary.json
│   │   ├── segment_summary.json
│   │   ├── anomaly_report.json
│   │   └── feature_importance.json
│   ├── ml/
│   │   ├── churn_model.pkl
│   │   └── scaler.pkl
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── pages/          (10 pages)
│   │   ├── components/     (charts, AI, UI, layout)
│   │   ├── hooks/          (useData, useAI, useStats)
│   │   └── utils/          (formatters, stream)
│   └── public/data/        (JSON files)
├── notebooks/
│   └── LoyaltyIQ_Analysis.ipynb
└── README.md
```

## How to Run

### 1. Clone the Repository
```bash
git clone https://github.com/Utsav-Thakur/unlocking-behavioral-intelligence-in-airline-loyalty-programs
cd unlocking-behavioral-intelligence-in-airline-loyalty-programs
```

### 2. Backend Setup
```bash
# Navigate to the backend directory
cd backend

# Install dependencies
pip install -r requirements.txt

# Create environment configuration and inject your Anthropic Key
echo "ANTHROPIC_API_KEY=your_key_here" > .env

# Run development server
uvicorn main:app --reload --port 8000
```

### 3. Frontend Setup (New Terminal)
```bash
# Navigate to the frontend directory
cd frontend

# Set API Endpoint reference
echo "VITE_API_URL=http://localhost:8000" > .env.development

# Install packages
npm install

# Start Vite server
npm run dev
# Open http://localhost:5173 in browser
```

## About the Author

**Utsav Kumar Thakur**
Data Scientist | MSc Operational Research, University of Delhi
- **GitHub**: [https://github.com/Utsav-Thakur](https://github.com/Utsav-Thakur)
- **LinkedIn**: [https://www.linkedin.com/in/utsav-thakur-2b01871b7](https://www.linkedin.com/in/utsav-thakur-2b01871b7)

*"ROC-AUC 0.941 · 3 actionable segments · 4 Claude AI features · Built end to end"*
