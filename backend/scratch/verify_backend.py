import urllib.request
import json

def verify():
    url_base = "http://127.0.0.1:8000"
    
    # 1. Test GET /
    print("Testing GET / ...")
    with urllib.request.urlopen(f"{url_base}/") as res:
        data = json.loads(res.read().decode())
        print("Root response:", data)
        assert data["status"] == "online"
        
    # 2. Test GET /api/stats
    print("\nTesting GET /api/stats ...")
    with urllib.request.urlopen(f"{url_base}/api/stats") as res:
        data = json.loads(res.read().decode())
        print("Total passengers:", data["total"])
        print("Average CLV:", data["avg_clv"])
        print("High risk count:", data["high_risk"])
        assert data["total"] > 0
        assert "card_tier_dist" in data
        
    # 3. Test GET /api/members (paginated)
    print("\nTesting GET /api/members (page=1, limit=5) ...")
    with urllib.request.urlopen(f"{url_base}/api/members?page=1&limit=5") as res:
        data = json.loads(res.read().decode())
        print("Filtered count:", data["total"])
        print("Members returned:", len(data["members"]))
        assert len(data["members"]) == 5
        member = data["members"][0]
        print("First member:", member["loyaltyNumber"], "-", member["city"], "-", member["segment"])
        
    # 4. Test GET /api/members/search
    print("\nTesting GET /api/members/search?q=1005 ...")
    with urllib.request.urlopen(f"{url_base}/api/members/search?q=1005") as res:
        data = json.loads(res.read().decode())
        print(f"Found {len(data)} search matches.")
        for m in data[:3]:
            print(f"Match: #{m['loyaltyNumber']} - {m['card']}")
        assert len(data) > 0

    # 5. Test POST /api/predict
    print("\nTesting POST /api/predict ...")
    req_data = {
        "loyaltyNumber": 100504,
        "province": "Ontario",
        "gender": "Female",
        "education": "Bachelor",
        "salary": 83236.0,
        "maritalStatus": "Married",
        "card": "Star",
        "clv": 3839.14,
        "totalFlights": 37,
        "totalDistance": 54525.0,
        "pointsAccumulated": 54525,
        "pointsRedeemed": 1418,
        "dollarCostRedeemed": 256.0,
        "redemptionRatio": 0.026
    }
    req_bytes = json.dumps(req_data).encode('utf-8')
    req = urllib.request.Request(
        f"{url_base}/api/predict", 
        data=req_bytes, 
        headers={'Content-Type': 'application/json'}
    )
    with urllib.request.urlopen(req) as res:
        data = json.loads(res.read().decode())
        print("Predict response:", data)
        assert "churn_probability" in data
        assert "churn_risk" in data
        assert "recommended_action" in data
        
    print("\nAll backend endpoints verified successfully!")

if __name__ == "__main__":
    verify()
