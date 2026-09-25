from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_health():
    assert client.get("/health").json() == {"status": "UP"}


def test_ranking_is_deterministic_and_explained():
    payload = {"candidates": [
        {"candidate_id": "b", "preference_fit": .5, "availability_quality": .5, "workload_balance": .5},
        {"candidate_id": "a", "preference_fit": .9, "availability_quality": .8, "workload_balance": .7},
    ]}
    result = client.post("/v1/rank", json=payload).json()
    assert result["rankings"][0]["candidateId"] == "a"
    assert "preference fit" in result["rankings"][0]["reasons"]
    assert "disclaimer" in result


def test_predict_duration():
    payload = {"department_id": "dept-1", "appointment_type": "SPECIALIST", "complexity_score": 1.5}
    res = client.post("/v1/predict-duration", json=payload).json()
    assert res["estimatedDurationMinutes"] == 68
    assert res["confidence"] == "HIGH"
    assert "disclaimer" in res


def test_predict_no_show():
    payload = {"patient_id": "p-1", "prior_no_shows": 2, "lead_days": 10, "urgency_level": 2}
    res = client.post("/v1/predict-no-show", json=payload).json()
    assert res["noShowProbability"] > 0.3
    assert res["riskLevel"] == "HIGH"
    assert "disclaimer" in res

