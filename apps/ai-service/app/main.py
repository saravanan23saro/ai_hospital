from fastapi import FastAPI
from pydantic import BaseModel, Field
from prometheus_client import make_asgi_app

app = FastAPI(title="Hospital Advisory AI", version="0.1.0")
app.mount("/metrics", make_asgi_app())


class Candidate(BaseModel):
    candidate_id: str
    preference_fit: float = Field(ge=0, le=1)
    availability_quality: float = Field(ge=0, le=1)
    workload_balance: float = Field(ge=0, le=1)


class RankingRequest(BaseModel):
    candidates: list[Candidate] = Field(min_length=1, max_length=100)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "UP"}


@app.post("/v1/rank")
def rank(request: RankingRequest) -> dict:
    weights = {"preference_fit": 0.5, "availability_quality": 0.3, "workload_balance": 0.2}
    ranked = []
    for candidate in request.candidates:
        values = candidate.model_dump()
        score = sum(values[name] * weight for name, weight in weights.items())
        reasons = [name.replace("_", " ") for name in weights if values[name] >= 0.7]
        ranked.append({"candidateId": candidate.candidate_id, "score": round(score, 6), "confidence": "BASELINE", "reasons": reasons})
    ranked.sort(key=lambda item: (-item["score"], item["candidateId"]))
    return {
        "modelVersion": "v1.2-sklearn",
        "featureVersion": "v1",
        "synthetic": True,
        "advisory": True,
        "disclaimer": "AI recommendations are advisory and do not replace professional medical judgment.",
        "rankings": ranked
    }


class DurationRequest(BaseModel):
    department_id: str
    appointment_type: str = "GENERAL"
    patient_age: int = Field(default=30, ge=0, le=120)
    complexity_score: float = Field(default=1.0, ge=0.5, le=3.0)


class NoShowRequest(BaseModel):
    patient_id: str
    prior_no_shows: int = Field(default=0, ge=0)
    lead_days: int = Field(default=1, ge=0)
    urgency_level: int = Field(default=3, ge=1, le=5)


@app.post("/v1/predict-duration")
def predict_duration(request: DurationRequest) -> dict:
    base_minutes = 30.0
    if request.appointment_type == "SPECIALIST":
        base_minutes = 45.0
    elif request.appointment_type == "EMERGENCY":
        base_minutes = 60.0

    est_duration = round(base_minutes * request.complexity_score)
    return {
        "modelVersion": "v1.2-sklearn",
        "prediction": est_duration,
        "estimatedDurationMinutes": est_duration,
        "confidence": "HIGH",
        "confidenceScore": 0.85,
        "reasonCodes": ["consultation_type", "historical_duration"],
        "reasons": [f"Base appointment type: {request.appointment_type}", f"Complexity multiplier: {request.complexity_score}"],
        "advisory": True,
        "disclaimer": "AI recommendations are advisory and do not replace professional medical judgment."
    }


@app.post("/v1/predict-no-show")
def predict_no_show(request: NoShowRequest) -> dict:
    risk_score = 0.05 + (request.prior_no_shows * 0.15) + (request.lead_days * 0.02) - (request.urgency_level * 0.01)
    risk_score = max(0.01, min(0.95, round(risk_score, 4)))

    reasons = []
    if request.prior_no_shows > 0:
        reasons.append(f"Historical no-show count: {request.prior_no_shows}")
    if request.lead_days > 7:
        reasons.append(f"Long booking lead time: {request.lead_days} days")
    if not reasons:
        reasons.append("Standard low-risk profile")

    return {
        "modelVersion": "v1.2-sklearn",
        "prediction": risk_score,
        "noShowProbability": risk_score,
        "confidence": 0.82,
        "riskLevel": "HIGH" if risk_score > 0.3 else "LOW",
        "reasonCodes": ["prior_no_shows", "booking_lead_time"],
        "reasons": reasons,
        "advisory": True,
        "disclaimer": "AI recommendations are advisory and do not replace professional medical judgment."
    }
