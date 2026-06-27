from pydantic import BaseModel
from typing import List, Optional, Any

class PredictRequest(BaseModel):
    loyaltyNumber: int
    province: str
    gender: str
    education: str
    salary: Optional[float] = None
    maritalStatus: str
    card: str
    clv: float
    totalFlights: int
    totalDistance: float
    pointsAccumulated: int
    pointsRedeemed: int
    dollarCostRedeemed: float
    redemptionRatio: float

class PredictResponse(BaseModel):
    churn_probability: float
    churn_risk: str
    recommended_action: str
    segment_match: str
    confidence: str

class ChatRequest(BaseModel):
    apiKey: Optional[str] = None
    message: str
    history: List[dict] = []
    activeMemberId: Optional[int] = None
    provider: Optional[str] = None

class EmailRequest(BaseModel):
    apiKey: Optional[str] = None
    member: dict
    tone: Optional[str] = "Friendly"
    provider: Optional[str] = None

class NarrateRequest(BaseModel):
    apiKey: Optional[str] = None
    chartType: str
    chartData: Any
    provider: Optional[str] = None

class StrategyRequest(BaseModel):
    apiKey: Optional[str] = None
    segmentName: str
    provider: Optional[str] = None

