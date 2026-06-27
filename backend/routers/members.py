from fastapi import APIRouter, Request, Query, HTTPException
from typing import Optional, List

router = APIRouter(prefix="/api")

@router.get("/members")
def get_members(
    request: Request,
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1),
    segment: str = "all",
    churn_risk: str = "all",
    province: str = "all",
    key: str = "churnRisk",
    dir: str = "desc"
):
    members = getattr(request.app.state, "members", [])
    
    # 1. Filter segment
    filtered = members
    if segment != "all" and segment:
        filtered = [m for m in filtered if m.get("segment") == segment]
        
    # 2. Filter churn risk
    if churn_risk != "all" and churn_risk:
        if churn_risk.lower() == "high":
            filtered = [m for m in filtered if m.get("churnRisk", 0) >= 0.7]
        elif churn_risk.lower() == "medium":
            filtered = [m for m in filtered if 0.3 <= m.get("churnRisk", 0) < 0.7]
        elif churn_risk.lower() == "low":
            filtered = [m for m in filtered if m.get("churnRisk", 0) < 0.3]
            
    # 3. Filter province
    if province != "all" and province:
        filtered = [m for m in filtered if m.get("province") == province]
        
    # Translate sort key
    actual_key = key
    if key == "churn_probability" or key == "churn_risk":
        actual_key = "churnRisk"
    elif key == "loyaltyNumber" or key == "id":
        actual_key = "loyaltyNumber"
        
    # 4. Sort
    reverse = (dir == "desc")
    try:
        filtered = sorted(
            filtered, 
            key=lambda x: (x.get(actual_key) is not None, x.get(actual_key) if x.get(actual_key) is not None else 0), 
            reverse=reverse
        )
    except Exception:
        # Fallback if key sorting fails
        pass

    # 5. Paginate
    start = (page - 1) * limit
    end = start + limit
    paginated = filtered[start:end]
    
    return {
        "total": len(filtered),
        "page": page,
        "limit": limit,
        "members": paginated
    }

@router.get("/members/search")
def search_members(request: Request, q: str = ""):
    members = getattr(request.app.state, "members", [])
    if not q:
        return []
    
    # Prefix match on loyalty number
    results = [m for m in members if str(m.get("loyaltyNumber")).startswith(q)]
    # Limit to top 20 search results for performance
    return results[:20]

@router.get("/members/{id}")
def get_member(request: Request, id: int):
    members = getattr(request.app.state, "members", [])
    for m in members:
        if m.get("loyaltyNumber") == id:
            return m
    raise HTTPException(status_code=404, detail="Member not found")

@router.get("/stats")
def get_stats(request: Request):
    members = getattr(request.app.state, "members", [])
    if not members:
        return {
            "total": 0,
            "high_risk": 0,
            "avg_clv": 0,
            "seg_breakdown": {},
            "prov_breakdown": [],
            "clv_status": {"High": 0, "Medium": 0, "Low": 0},
            "churn_dist": [],
            "card_tier_dist": {"Star": 0, "Nova": 0, "Aurora": 0},
            "model_perf": {"auc": 0.941, "f1": 0.799, "prec": 0.982, "rec": 0.674}
        }
        
    total = len(members)
    
    # High churn risk: active members (no cancellationYear) with churnRisk > 0.7
    active_members = [m for m in members if m.get("cancellationYear") is None]
    high_risk = sum(1 for m in active_members if m.get("churnRisk", 0) > 0.7)
    
    # Average CLV
    total_clv = sum(m.get("clv", 0) for m in members)
    avg_clv = total_clv / total if total > 0 else 0
    
    # Segment breakdown
    seg_breakdown = {}
    for m in members:
        seg = m.get("segment", "Unknown")
        seg_breakdown[seg] = seg_breakdown.get(seg, 0) + 1
        
    # Province breakdown
    prov_counts = {}
    for m in members:
        prov = m.get("province", "Unknown")
        prov_counts[prov] = prov_counts.get(prov, 0) + 1
    
    prov_breakdown = [
        {"province": p, "count": c} for p, c in prov_counts.items()
    ]
    prov_breakdown = sorted(prov_breakdown, key=lambda x: x["count"], reverse=True)[:8]
    
    # CLV status
    clv_status = {"High": 0, "Medium": 0, "Low": 0}
    for m in members:
        clv_val = m.get("clv", 0)
        if clv_val >= 10000:
            clv_status["High"] += 1
        elif clv_val >= 5000:
            clv_status["Medium"] += 1
        else:
            clv_status["Low"] += 1
            
    # Churn Risk Distribution (10 Buckets: 0-10%, 10-20%, etc.)
    churn_dist_counts = [0] * 10
    for m in members:
        risk = m.get("churnRisk", 0.0)
        idx = int(risk * 10)
        if idx > 9:
            idx = 9
        if idx < 0:
            idx = 0
        churn_dist_counts[idx] += 1
        
    churn_dist = [
        {"bucket": f"{i * 10}-{(i + 1) * 10}%", "count": count}
        for i, count in enumerate(churn_dist_counts)
    ]
    
    # Card tier distribution
    card_tier_dist = {"Star": 0, "Nova": 0, "Aurora": 0}
    for m in members:
        card = m.get("card")
        if card in card_tier_dist:
            card_tier_dist[card] += 1
            
    return {
        "total": total,
        "high_risk": high_risk,
        "avg_clv": avg_clv,
        "seg_breakdown": seg_breakdown,
        "prov_breakdown": prov_breakdown,
        "clv_status": clv_status,
        "churn_dist": churn_dist,
        "card_tier_dist": card_tier_dist,
        "model_perf": {
            "auc": 0.941,
            "f1": 0.799,
            "prec": 0.982,
            "rec": 0.674
        }
    }

@router.get("/feature-importance")
def get_feature_importance(request: Request):
    return getattr(request.app.state, "feature_importance", [])

@router.get("/anomalies")
def get_anomalies(request: Request):
    return getattr(request.app.state, "anomalies", [])
