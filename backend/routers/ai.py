import os
import json
import httpx
from fastapi import APIRouter, Request, HTTPException
from fastapi.responses import StreamingResponse
from typing import Optional
from models.schemas import ChatRequest, EmailRequest, NarrateRequest, StrategyRequest

router = APIRouter()

def is_mock_key(key: Optional[str]) -> bool:
    if not key or key.strip() == "" or key.startswith("sk-ant-test") or key == "undefined" or key == "null":
        return True
    return False

def get_ai_strategy(request: Request, payload_key: Optional[str] = None, payload_provider: Optional[str] = None):
    # Resolve the key
    key = payload_key
    if not key:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            key = auth_header[7:].strip()
            
    if not key:
        key = request.headers.get("X-API-Key")
        
    # Auto-detect provider if key is a Gemini key
    if key and key.startswith("AIzaSy"):
        return "gemini", key
        
    # Auto-detect provider if key is an OpenAI key (starts with sk- and not sk-ant-)
    if key and key.startswith("sk-") and not key.startswith("sk-ant-"):
        return "openai", key
        
    # Auto-detect provider if key is a Claude key
    if key and key.startswith("sk-ant-"):
        return "claude", key

    # Explicit provider check
    if payload_provider == "gemini":
        if key and not is_mock_key(key):
            return "gemini", key
        gemini_env = os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")
        if gemini_env:
            return "gemini", gemini_env
        return "mock", None
        
    if payload_provider == "claude":
        if key and not is_mock_key(key):
            return "claude", key
        anthropic_env = os.environ.get("ANTHROPIC_API_KEY")
        if anthropic_env:
            return "claude", anthropic_env
        return "mock", None

    if payload_provider == "openai":
        if key and not is_mock_key(key):
            return "openai", key
        openai_env = os.environ.get("OPENAI_API_KEY")
        if openai_env:
            return "openai", openai_env
        return "mock", None

    # Implicit provider resolution chain:
    # 1. Custom override API key
    if key and not is_mock_key(key):
        # Auto-resolve if custom key is provided
        if key.startswith("sk-") and not key.startswith("sk-ant-"):
            return "openai", key
        return "claude", key

    # 2. Env Anthropic key
    anthropic_env = os.environ.get("ANTHROPIC_API_KEY")
    if anthropic_env:
        return "claude", anthropic_env

    # 3. Env OpenAI key
    openai_env = os.environ.get("OPENAI_API_KEY")
    if openai_env:
        return "openai", openai_env

    # 4. Env Gemini/Google key
    gemini_env = os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")
    if gemini_env:
        return "gemini", gemini_env

    return "mock", None


def stream_gemini(system_prompt: str, messages: list, gemini_key: str):
    gemini_messages = []
    for msg in messages:
        role = "model" if msg.get("role") in ["ai", "assistant", "model"] else "user"
        content = msg.get("content") or msg.get("text") or ""
        if content:
            gemini_messages.append({
                "role": role,
                "parts": [{"text": content}]
            })
            
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:streamGenerateContent?alt=sse&key={gemini_key}"
    headers = {"Content-Type": "application/json"}
    payload = {
        "contents": gemini_messages,
        "generationConfig": {
            "maxOutputTokens": 2048
        }
    }
    if system_prompt:
        payload["systemInstruction"] = {
            "parts": [{"text": system_prompt}]
        }
        
    with httpx.stream("POST", url, headers=headers, json=payload, timeout=60.0) as r:
        if r.status_code != 200:
            error_detail = r.read().decode()
            raise Exception(f"Gemini API returned status {r.status_code}: {error_detail}")
            
        for line in r.iter_lines():
            if line.startswith("data:"):
                data_str = line[5:].strip()
                if not data_str:
                    continue
                try:
                    data_json = json.loads(data_str)
                    candidates = data_json.get("candidates", [])
                    if candidates:
                        text_chunk = candidates[0].get("content", {}).get("parts", [])[0].get("text", "")
                        if text_chunk:
                            yield text_chunk
                except Exception:
                    pass

def call_gemini(system_prompt: str, messages: list, gemini_key: str) -> str:
    gemini_messages = []
    for msg in messages:
        role = "model" if msg.get("role") in ["ai", "assistant", "model"] else "user"
        content = msg.get("content") or msg.get("text") or ""
        if content:
            gemini_messages.append({
                "role": role,
                "parts": [{"text": content}]
            })
            
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={gemini_key}"
    headers = {"Content-Type": "application/json"}
    payload = {
        "contents": gemini_messages,
        "generationConfig": {
            "maxOutputTokens": 1500
        }
    }
    if system_prompt:
        payload["systemInstruction"] = {
            "parts": [{"text": system_prompt}]
        }
        
    r = httpx.post(url, headers=headers, json=payload, timeout=60.0)
    if r.status_code != 200:
        raise Exception(f"Gemini API returned status {r.status_code}: {r.text}")
        
    data = r.json()
    candidates = data.get("candidates", [])
    if not candidates:
        raise Exception("Gemini API returned no candidates.")
    parts = candidates[0].get("content", {}).get("parts", [])
    if not parts:
        raise Exception("Gemini API candidate has no content parts.")
    return parts[0].get("text", "")


def stream_openai(system_prompt: str, messages: list, openai_key: str):
    openai_messages = []
    if system_prompt:
        openai_messages.append({"role": "system", "content": system_prompt})
    for msg in messages:
        role = "assistant" if msg.get("role") in ["ai", "assistant", "model"] else "user"
        content = msg.get("content") or msg.get("text") or ""
        if content:
            openai_messages.append({"role": role, "content": content})

    url = "https://api.openai.com/v1/chat/completions"
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {openai_key}"
    }
    payload = {
        "model": "gpt-4o-mini",
        "messages": openai_messages,
        "stream": True
    }
    with httpx.stream("POST", url, headers=headers, json=payload, timeout=60.0) as r:
        if r.status_code != 200:
            error_detail = r.read().decode()
            raise Exception(f"OpenAI API returned status {r.status_code}: {error_detail}")
        for line in r.iter_lines():
            if line.startswith("data:"):
                data_str = line[5:].strip()
                if data_str == "[DONE]":
                    break
                if not data_str:
                    continue
                try:
                    data_json = json.loads(data_str)
                    choices = data_json.get("choices", [])
                    if choices:
                        content_chunk = choices[0].get("delta", {}).get("content", "")
                        if content_chunk:
                            yield content_chunk
                except Exception:
                    pass


def call_openai(system_prompt: str, messages: list, openai_key: str) -> str:
    openai_messages = []
    if system_prompt:
        openai_messages.append({"role": "system", "content": system_prompt})
    for msg in messages:
        role = "assistant" if msg.get("role") in ["ai", "assistant", "model"] else "user"
        content = msg.get("content") or msg.get("text") or ""
        if content:
            openai_messages.append({"role": role, "content": content})

    url = "https://api.openai.com/v1/chat/completions"
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {openai_key}"
    }
    payload = {
        "model": "gpt-4o-mini",
        "messages": openai_messages,
        "max_tokens": 1500
    }
    r = httpx.post(url, headers=headers, json=payload, timeout=60.0)
    if r.status_code != 200:
        raise Exception(f"OpenAI API returned status {r.status_code}: {r.text}")
    data = r.json()
    choices = data.get("choices", [])
    if not choices:
        raise Exception("OpenAI API returned no choices.")
    return choices[0].get("message", {}).get("content", "")



@router.post("/api/ai/chat")
@router.post("/chat")
def stream_chat(req: ChatRequest, request: Request):
    # 1. Compile state summaries for system prompt
    members = getattr(request.app.state, "members", [])
    segment_summary = getattr(request.app.state, "segment_summary", [])
    
    total_passengers = len(members)
    avg_clv = sum(m.get("clv", 0) for m in members) / total_passengers if total_passengers > 0 else 0
    high_risk = sum(1 for m in members if m.get("cancellationYear") is None and m.get("churnRisk", 0) > 0.7)
    
    segments_str = "\n".join([
        f"- {s.get('segment')}: {s.get('count')} members ({round(s.get('percentage', 0)*100, 1)}%), Avg CLV: ${round(s.get('avgClv', 0), 2)}, Avg Risk: {round(s.get('avgRisk', 0)*100, 1)}%."
        for s in segment_summary
    ])
    
    # 2. Add active member context if ID is provided
    member_context = ""
    active_member = None
    if req.activeMemberId:
        active_member = next((m for m in members if m.get("loyaltyNumber") == req.activeMemberId), None)
        if active_member:
            member_context = f"""
TARGET ACTIVE PASSSENGER PROFILE CONTEXT:
- Loyalty Number: {active_member.get('loyaltyNumber')}
- Card Tier: {active_member.get('card')}
- City/Province: {active_member.get('city')}, {active_member.get('province')}
- Customer Lifetime Value (CLV): ${active_member.get('clv')}
- Flights Count: {active_member.get('totalFlights')}
- Churn Risk Probability: {round(active_member.get('churnRisk', 0)*100, 1)}%
- Segment Category: {active_member.get('segment')}
"""

    # 3. Compile mock text responses for fallback
    query = req.message.lower()
    if "member" in query or "context" in query:
        if active_member:
            mock_text = f"""### Strategic Profile Analysis: Member #{active_member.get('loyaltyNumber')}
- **Tier**: {active_member.get('card')} Status
- **Risk Level**: {round(active_member.get('churnRisk', 0)*100, 1)}% Probability
- **CLV Valuation**: ${active_member.get('clv', 0):,.2f}
- **Campaign Recommendation**: Execute **{active_member.get('segment')}** outreach program. Surprise milestone flight vouchers and priority lounge access should be dispatched via email."""
        else:
            mock_text = "Please select or search a passenger profile in the CRM Lookup page to inspect custom risk factors and points balance contexts."
    elif "lounge" in query or "roi" in query:
        mock_text = """### Incentive Strategy ROI Projection
- **Incentive**: Complimentary Hub Lounge Pass ($50 unit cost).
- **Target Audience**: Moderate Risk (30-70% probability) Aurora and Nova card members.
- **Expected Outcome**: 8% churn risk reduction. Campaign yield shows 3.2x ROI by recovering high-CLV travelers before cancellations."""
    elif "at-risk" in query or "priority" in query:
        mock_text = """### At-Risk Flyer Recovery Plan
- **Primary Segment**: Flyers with standard Star tier cards showing 90-day inactivity.
- **Trigger**: Falling point redemption ratios.
- **Incentive**: 15% fare discount + double point miles voucher. 
- **Outreach**: Direct email offer coupled with app push notifications."""
    else:
        mock_text = f"""Hello! I'm your LoyaltyIQ Strategy Assistant. Based on our airline loyalty metrics:
- **Demographics**: Ontario holds the highest density (5,404 members), followed closely by British Columbia (4,409 members).
- **Churn Analysis**: The average churn risk is heavily tied to card tiers; Star card members exhibit the highest risk, while Aurora tier members are highly stable.
- **CLV Distribution**: The average CLV is CAD $7,988.90, but we have 376 extreme outliers with CLVs exceeding CAD $25,000 who require dedicated concierge care.

How else can I assist you with passenger behavioral insights today?"""

    def chat_generator():
        import time
        # Resolve provider and key
        provider, key = get_ai_strategy(request, req.apiKey, req.provider)
        
        fallback_gemini_key = os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")
        if req.apiKey and req.apiKey.startswith("AIzaSy"):
            fallback_gemini_key = req.apiKey

        system_prompt = f"""You are the LoyaltyIQ Strategy Assistant. You analyze airline passenger loyalty demographics, churn risks, and behavioral metrics to formulate retention campaigns.

LOYALTYIQ EXECUTIVE METRICS SUMMARY:
- Total Passengers: {total_passengers}
- Average CLV: ${round(avg_clv, 2)}
- Active Passengers at Critical Risk (>70%): {high_risk}

COHORT SEGMENTS DISTRIBUTIONS:
{segments_str}
{member_context}
Respond to the user's questions professionally, concisely, and strictly based on the provided metrics. Do not fabricate any arbitrary statistics.
"""
        formatted_messages = []
        for msg in req.history:
            role = "assistant" if msg.get("role") in ["ai", "assistant"] else "user"
            content = msg.get("content") or msg.get("text") or ""
            if content:
                formatted_messages.append({"role": role, "content": content})
                
        if not formatted_messages or formatted_messages[-1]["content"] != req.message:
            formatted_messages.append({"role": "user", "content": req.message})

        # Try Gemini if explicitly selected
        if provider == "gemini" and key:
            try:
                for chunk in stream_gemini(system_prompt, formatted_messages, key):
                    yield f"data: {json.dumps(chunk)}\n\n"
                yield "data: [DONE]\n\n"
                return
            except Exception as e:
                print(f"Gemini API Error: {str(e)}. Offline mode active")

        # Try OpenAI if selected
        elif provider == "openai" and key:
            try:
                for chunk in stream_openai(system_prompt, formatted_messages, key):
                    yield f"data: {json.dumps(chunk)}\n\n"
                yield "data: [DONE]\n\n"
                return
            except Exception as e:
                print(f"OpenAI API Error: {str(e)}")
                if fallback_gemini_key:
                    print("Switching to Gemini fallback...")
                    try:
                        for chunk in stream_gemini(system_prompt, formatted_messages, fallback_gemini_key):
                            yield f"data: {json.dumps(chunk)}\n\n"
                        yield "data: [DONE]\n\n"
                        return
                    except Exception as ge:
                        print(f"Gemini Fallback Error: {str(ge)}. Offline mode active")
                else:
                    print("No Gemini fallback key. Offline mode active")

        # Try Claude if selected
        elif provider == "claude" and key:
            try:
                import anthropic
                client = anthropic.Anthropic(api_key=key)
                with client.messages.stream(
                    model="claude-3-5-sonnet-20241022",
                    max_tokens=2048,
                    system=system_prompt,
                    messages=formatted_messages
                ) as stream:
                    for text in stream.text_stream:
                        yield f"data: {json.dumps(text)}\n\n"
                yield "data: [DONE]\n\n"
                return
            except Exception as e:
                print(f"Claude API Error: {str(e)}")
                if fallback_gemini_key:
                    print("Switching to Gemini fallback...")
                    try:
                        for chunk in stream_gemini(system_prompt, formatted_messages, fallback_gemini_key):
                            yield f"data: {json.dumps(chunk)}\n\n"
                        yield "data: [DONE]\n\n"
                        return
                    except Exception as ge:
                        print(f"Gemini Fallback Error: {str(ge)}. Offline mode active")
                else:
                    print("No Gemini fallback key. Offline mode active")

        # Mock fallback if key is mock or API failed
        tokens = mock_text.split(" ")
        for i, t in enumerate(tokens):
            chunk = t + " " if i < len(tokens) - 1 else t
            yield f"data: {json.dumps(chunk)}\n\n"
            time.sleep(0.015)
        yield "data: [DONE]\n\n"

    return StreamingResponse(chat_generator(), media_type="text/event-stream")


@router.post("/api/ai/email")
@router.post("/generate-email")
def generate_email(req: EmailRequest, request: Request):
    member = req.member
    tone = req.tone or "Friendly"
    
    mock_email = f"""Subject: Exclusive Loyalty Offers & Bonus Flights for LoyaltyIQ Member #{member.get('loyaltyNumber')}

Dear Member,

We noticed that you have been a valuable member of our loyalty program since {member.get('enrollmentYear')} in {member.get('province')}. Currently, you hold a **{member.get('card')}** card tier and have achieved a Customer Lifetime Value of ${member.get('clv', 0):,.2f}.

To show our appreciation for your loyalty, we want to help you maximize your benefits:
1. **Redemption Bonus**: Enjoy a 15% points redemption discount on all domestic flights booked in the next 30 days.
2. **Double Points**: Earn double points on all international segments flown between now and the end of the quarter.
3. **Upgrade Opportunities**: As an esteemed {member.get('card')} cardholder, you will receive priority upgrade consideration.

If you have any questions or need assistance booking your next flight, please reply directly.

Best regards,

LoyaltyIQ Engagement Team"""

    def email_generator():
        import time
        # Resolve provider and key
        provider, key = get_ai_strategy(request, req.apiKey, req.provider)
        
        fallback_gemini_key = os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")
        if req.apiKey and req.apiKey.startswith("AIzaSy"):
            fallback_gemini_key = req.apiKey

        system_prompt = "You are an expert retention copywriter for an elite airline loyalty program. Make the email tailored, engaging, and clear."
        prompt = f"""Write a personalized retention outreach email for a passenger in our airline loyalty program.
Passenger Profile:
- Loyalty Number: {member.get('loyaltyNumber')}
- Card Tier: {member.get('card')}
- Location: {member.get('province')}
- Customer Lifetime Value (CLV): ${member.get('clv')}
- Total Flights: {member.get('totalFlights')}
- Churn Risk Probability: {round(member.get('churnRisk', 0)*100, 1)}%
- Segment: {member.get('segment')}

Campaign requirements:
- Tone of communication: {tone}
- Incentive Offer: Pitch a specific loyalty offer (e.g. 15% discount for high risk or double miles voucher).
- Recommended outreach channel: Email.

Instructions:
- Write a professional email structure including a Subject Line and greeting.
- Directly emphasize benefits corresponding to their specific card tier ({member.get('card')}).
- Address their value to our airline and provide a warm, actionable incentive.
- Avoid placeholders; compile the email fully ready to copy.
"""
        messages = [{"role": "user", "content": prompt}]

        if provider == "gemini" and key:
            try:
                for chunk in stream_gemini(system_prompt, messages, key):
                    yield f"data: {json.dumps(chunk)}\n\n"
                yield "data: [DONE]\n\n"
                return
            except Exception as e:
                print(f"Gemini API Error: {str(e)}. Offline mode active")

        elif provider == "openai" and key:
            try:
                for chunk in stream_openai(system_prompt, messages, key):
                    yield f"data: {json.dumps(chunk)}\n\n"
                yield "data: [DONE]\n\n"
                return
            except Exception as e:
                print(f"OpenAI API Error: {str(e)}")
                if fallback_gemini_key:
                    print("Switching to Gemini fallback...")
                    try:
                        for chunk in stream_gemini(system_prompt, messages, fallback_gemini_key):
                            yield f"data: {json.dumps(chunk)}\n\n"
                        yield "data: [DONE]\n\n"
                        return
                    except Exception as ge:
                        print(f"Gemini Fallback Error: {str(ge)}. Offline mode active")
                else:
                    print("No Gemini fallback key. Offline mode active")
                
        elif provider == "claude" and key:
            try:
                import anthropic
                client = anthropic.Anthropic(api_key=key)
                with client.messages.stream(
                    model="claude-3-5-sonnet-20241022",
                    max_tokens=2048,
                    system=system_prompt,
                    messages=messages
                ) as stream:
                    for text in stream.text_stream:
                        yield f"data: {json.dumps(text)}\n\n"
                yield "data: [DONE]\n\n"
                return
            except Exception as e:
                print(f"Claude API Error: {str(e)}")
                if fallback_gemini_key:
                    print("Switching to Gemini fallback...")
                    try:
                        for chunk in stream_gemini(system_prompt, messages, fallback_gemini_key):
                            yield f"data: {json.dumps(chunk)}\n\n"
                        yield "data: [DONE]\n\n"
                        return
                    except Exception as ge:
                        print(f"Gemini Fallback Error: {str(ge)}. Offline mode active")
                else:
                    print("No Gemini fallback key. Offline mode active")

        # Mock fallback
        tokens = mock_email.split(" ")
        for i, t in enumerate(tokens):
            chunk = t + " " if i < len(tokens) - 1 else t
            yield f"data: {json.dumps(chunk)}\n\n"
            time.sleep(0.015)
        yield "data: [DONE]\n\n"

    return StreamingResponse(email_generator(), media_type="text/event-stream")


def get_mock_narration(chart_type: str, chart_data: Optional[list] = None) -> str:
    if not chart_data:
        if chart_type == 'Churn Risk Distribution' or 'Churn' in chart_type:
            return """<think>
- Analyzing user-requested Churn Risk Distribution chart query.
- No active filter payload provided; falling back to global model metrics cache.
- Examining bimodal distribution patterns in global data (N = 16,734).
- Isolating peak high-risk cohort (N = 2,067, 100% risk) vs. stable low-risk cohort (0-20% risk).
- Formulating risk mitigation strategy targeting the transitionary segment (40-70% risk).
</think>
- **Key Observation**: The loyalty database exhibits a distinct bimodal churn profile. A large, stable customer core resides in the 0-20% low-risk range, while a subset of 2,067 members is classified at 100% risk (already deactivated or churned).
- **Risk Assessment**: The high concentration of inactive members indicates substantial historical disengagement, while the moderate-risk cohort represents the primary threat surface for upcoming churn.
- **Strategy Recommendation**: Focus proactive win-back and retention campaigns on the 40-70% moderate-risk flyers, who show early warning signs of disengagement but remain salvageable with targeted, high-value incentives."""
        elif 'Province' in chart_type:
            return """<think>
- Processing Province Distribution query.
- No active member filter present; pulling cached regional demographics summary.
- Evaluating geographic distribution across all provinces.
- Ontario (ON), British Columbia (BC), and Quebec (QC) identified as dominant hubs.
- Formulating localized route promotions based on regional passenger hubs.
</think>
- **Key Observation**: Geographic distribution is highly concentrated, with Ontario (ON), British Columbia (BC), and Quebec (QC) collectively representing over 75% of the overall passenger base.
- **Market Dynamics**: Secondary regions represent a fragmented footprint, meaning marketing efficiency is maximized by focusing on the primary hub networks.
- **Strategy Recommendation**: Launch route-specific loyalty campaigns tailored to departures from major hubs (YYZ in Toronto, YVR in Vancouver, and YUL in Montreal) to capture high-density regional passenger volumes."""
        else:
            return f"""<think>
- Querying default dynamic narration model for chart type: "{chart_type}".
- No custom data payload provided. Utilizing baseline loyalty behavior models.
- Correlating loyalty points accumulation behaviors with member redemptions.
- Evaluating point-multiplier strategy for low-travel cycles.
</think>
- **Key Observation**: Active loyalty members demonstrate a high correlation between points accumulation frequency and flight redemption actions, proving program utility.
- **Engagement Profile**: Standard and Casual tiers exhibit lower point velocity, showing a higher risk of disengagement during off-peak travel seasons.
- **Strategy Recommendation**: Implement targeted point-multiplier promotions during seasonal travel troughs to maintain active booking velocities among entry-level cardholders."""

    try:
        # 1. Province Distribution (composed / bar)
        if 'Province' in chart_type:
            provinces = {}
            for m in chart_data:
                prov = m.get("province", "Unknown")
                risk = m.get("churnRisk") or m.get("churn_risk") or 0.0
                if prov not in provinces:
                    provinces[prov] = {"count": 0, "total_risk": 0.0}
                provinces[prov]["count"] += 1
                provinces[prov]["total_risk"] += risk
            
            if provinces:
                sorted_provs = sorted(provinces.items(), key=lambda x: x[1]["count"], reverse=True)
                top_prov, top_data = sorted_provs[0]
                top_pct = (top_data["count"] / len(chart_data)) * 100
                
                highest_risk_prov = None
                highest_risk_val = -1.0
                for prov, pdata in provinces.items():
                    if pdata["count"] >= 5:
                        avg_r = pdata["total_risk"] / pdata["count"]
                        if avg_r > highest_risk_val:
                            highest_risk_val = avg_r
                            highest_risk_prov = prov
                
                if not highest_risk_prov:
                    highest_risk_prov = max(provinces.keys(), key=lambda k: provinces[k]["total_risk"]/provinces[k]["count"])
                    highest_risk_val = provinces[highest_risk_prov]["total_risk"] / provinces[highest_risk_prov]["count"]
                
                return f"""<think>
- Received {chart_type} dataset containing {len(chart_data):,} records.
- Identified primary regional hub: {top_prov} represents {top_data['count']:,} records ({top_pct:.1f}%).
- Calculated localized churn risk across all regions with at least 5 members.
- Identified highest risk region: {highest_risk_prov} with an average churn risk of {highest_risk_val*100:.1f}%.
- Formulating geographical target matrix and regional retention recommendations.
</think>
- **Key Observation**: The active filtered cohort consists of **{len(chart_data):,}** members, with **{top_prov}** representing the largest passenger hub, accounting for **{top_data['count']:,}** flyers (**{top_pct:.1f}%**).
- **Regional Risk Assessment**: Members residing in **{highest_risk_prov}** exhibit the highest propensity to churn, showing an elevated average churn probability of **{highest_risk_val * 100:.1f}%**.
- **Strategy Recommendation**: Focus immediate localized marketing and retention initiatives in **{top_prov}** to protect our core customer volume, while deploying high-incentive travel offers in **{highest_risk_prov}** to mitigate regional churn risks."""

        # 2. Card Distribution (donut / pie)
        elif 'Card' in chart_type:
            cards = {}
            for m in chart_data:
                c = m.get("card", "Unknown")
                risk = m.get("churnRisk") or m.get("churn_risk") or 0.0
                if c not in cards:
                    cards[c] = {"count": 0, "total_risk": 0.0}
                cards[c]["count"] += 1
                cards[c]["total_risk"] += risk
                
            if cards:
                card_stats = []
                for c, cdata in cards.items():
                    card_stats.append({
                        "card": c,
                        "count": cdata["count"],
                        "avg_risk": (cdata["total_risk"] / cdata["count"]) * 100
                    })
                card_stats = sorted(card_stats, key=lambda x: x["count"], reverse=True)
                top_card = card_stats[0]['card']
                top_card_pct = (card_stats[0]['count'] / len(chart_data)) * 100
                
                highest_risk_card = max(card_stats, key=lambda x: x["avg_risk"])
                lowest_risk_card = min(card_stats, key=lambda x: x["avg_risk"])
                
                return f"""<think>
- Analyzing loyalty tier representation within active cohort of {len(chart_data):,} members.
- Identified dominant loyalty tier: {top_card} represents {card_stats[0]['count']:,} members ({top_card_pct:.1f}%).
- Calculated tier risk dynamics: {highest_risk_card['card']} is high-risk ({highest_risk_card['avg_risk']:.1f}% avg risk) vs. {lowest_risk_card['card']} is lowest-risk ({lowest_risk_card['avg_risk']:.1f}% avg risk).
- Formulating status preservation and tier upgrade pathways.
</think>
- **Key Observation**: The **{top_card}** card tier constitutes the largest membership segment, representing **{card_stats[0]['count']:,}** members (**{top_card_pct:.1f}%** of active flyers).
- **Stability Analysis**: A significant variance in engagement is observed: **{lowest_risk_card['card']}** tier members are highly stable with a low average churn risk of **{lowest_risk_card['avg_risk']:.1f}%**, while **{highest_risk_card['card']}** members display the highest disengagement with **{highest_risk_card['avg_risk']:.1f}%** average risk.
- **Strategy Recommendation**: Launch targeted retention campaigns and exclusive benefits for **{highest_risk_card['card']}** tier members to prevent them from dropping off, and reward **{lowest_risk_card['card']}** members with premium tier benefits to sustain loyalty."""

        # 3. Churn Risk Histogram / Density / Buckets
        elif 'Histogram' in chart_type or 'Density' in chart_type or 'Churn' in chart_type:
            low_risk = len([m for m in chart_data if (m.get("churnRisk") or m.get("churn_risk") or 0.0) < 0.3])
            med_risk = len([m for m in chart_data if 0.3 <= (m.get("churnRisk") or m.get("churn_risk") or 0.0) < 0.7])
            high_risk = len([m for m in chart_data if (m.get("churnRisk") or m.get("churn_risk") or 0.0) >= 0.7])
            total = len(chart_data)
            
            low_pct = (low_risk / total) * 100 if total else 0
            med_pct = (med_risk / total) * 100 if total else 0
            high_pct = (high_risk / total) * 100 if total else 0
            
            return f"""<think>
- Inspecting churn probability distributions for {total:,} members.
- Segmenting into risk cohorts: Low (<30%), Med (30-70%), High (>=70%).
- Found {low_risk:,} low-risk ({low_pct:.1f}%), {med_risk:,} moderate-risk ({med_pct:.1f}%), and {high_risk:,} high-risk ({high_pct:.1f}%).
- Formulating campaign strategies: retention focus for moderate-risk vs. recovery for high-risk.
</think>
- **Key Observation**: The cohort's risk profile shows **{low_pct:.1f}%** ({low_risk:,}) of flyers are stable in the low-risk zone, while **{high_pct:.1f}%** ({high_risk:,}) present an imminent threat of churn with risk ratings at or above 70%.
- **Retention Opportunity**: A crucial transition group of **{med_risk:,}** members (**{med_pct:.1f}%**) falls into the moderate-risk bracket (30% to 70%), representing the high-yield category.
- **Strategy Recommendation**: Allocate defensive marketing spend to the **{med_risk:,}** moderate-risk members. They exhibit early markers of inactivity but remain highly responsive to status extensions or bonus mile offers, compared to the hard-churned cohort."""

        # 4. CLV vs Risk Correlation Scatter / Forward CLV status scatter plot
        elif 'Scatter' in chart_type or 'Correlation' in chart_type or 'scatter' in chart_type:
            high_clv_flyers = [m for m in chart_data if m.get("clv", 0.0) >= 15000]
            total_clv = sum(m.get("clv", 0.0) for m in chart_data)
            avg_clv = total_clv / len(chart_data) if chart_data else 0
            
            if high_clv_flyers:
                avg_high_clv_risk = sum(m.get("churnRisk") or m.get("churn_risk") or 0.0 for m in high_clv_flyers) / len(high_clv_flyers)
            else:
                avg_high_clv_risk = 0.0
                
            return f"""<think>
- Examining scatter distribution correlation between Customer Lifetime Value (CLV) and churn probability.
- Calculated average CLV of cohort: CAD ${avg_clv:,.2f}.
- Isolated high-value outlier cluster: {len(high_clv_flyers):,} members with CLV >= $15,000.
- Measured average risk of high-value outliers: {avg_high_clv_risk*100:.1f}%.
- Formulating concierge defense strategy to shield high-value passengers.
</think>
- **Key Observation**: Across this active cohort, the average Customer Lifetime Value (CLV) is **CAD ${avg_clv:,.2f}**, showing a strong concentration of revenue in premium accounts.
- **High-Value Exposure**: We have identified **{len(high_clv_flyers):,}** high-value members with CLV exceeding $15,000. Their average churn probability is currently **{avg_high_clv_risk * 100:.1f}%**, representing significant revenue risk.
- **Strategy Recommendation**: Automatically route high-value members with >30% churn risk to VIP concierge support and schedule targeted high-tier upgrade offers (e.g. status-match buffers) to lock in loyalty."""

        # 5. Flight Trend Over Time
        elif 'Flight' in chart_type:
            total_bookings = sum(item.get("flights", 0) for item in chart_data)
            avg_monthly = total_bookings / len(chart_data) if chart_data else 0
            
            if chart_data:
                peak = max(chart_data, key=lambda x: x.get("flights", 0))
                trough = min(chart_data, key=lambda x: x.get("flights", 0))
                peak_label = peak.get("label") or f"{peak.get('year')}-{peak.get('month')}"
                trough_label = trough.get("label") or f"{trough.get('year')}-{trough.get('month')}"
                peak_val = peak.get("flights", 0)
                trough_val = trough.get("flights", 0)
            else:
                peak_label, peak_val = "Unknown", 0
                trough_label, trough_val = "Unknown", 0
                
            return f"""<think>
- Reviewing flight frequency time-series trend of {len(chart_data)} data points.
- Summed total bookings: {total_bookings:,} flights; monthly mean booking rate: {avg_monthly:,.1f}.
- Identified seasonal extremes: peak in {peak_label} ({peak_val:,} flights) and trough in {trough_label} ({trough_val:,} flights).
- Formulating demand-smoothing promotions and capacity management recommendations.
</think>
- **Key Observation**: The timeline tracks a total of **{total_bookings:,}** bookings, maintaining an average of **{avg_monthly:,.1f}** flights per period.
- **Seasonal Analysis**: Booking velocity reaches its peak in **{peak_label}** at **{peak_val:,}** flights, while dropping to a seasonal low in **{trough_label}** at **{trough_val:,}** flights.
- **Strategy Recommendation**: Launch seasonal companion-ticket offers and double-points promotions specifically targeting off-peak periods like **{trough_label}** to optimize seat load factors and smooth capacity utilization."""

        # 6. Logistic Feature Weights / Coefficients
        elif 'Feature' in chart_type or 'Weights' in chart_type:
            sorted_features = sorted(chart_data, key=lambda x: abs(x.get("importance", 0.0)), reverse=True)
            if sorted_features:
                top_feature = sorted_features[0]["feature"]
                top_weight = sorted_features[0]["importance"]
                second_feature = sorted_features[1]["feature"] if len(sorted_features) > 1 else "Unknown"
                second_weight = sorted_features[1]["importance"] if len(sorted_features) > 1 else 0.0
                
                return f"""<think>
- Reviewing logistic regression feature weights for model explainability.
- Found top model feature: "{top_feature}" with weight {top_weight:.3f}.
- Found secondary model feature: "{second_feature}" with weight {second_weight:.3f}.
- Formulating engineering metric targets and data-driven customer triggers.
</think>
- **Key Observation**: The machine learning model ranks **{top_feature}** as the primary driver of member churn decisions, with an importance weight of **{top_weight:.3f}**.
- **Model Insight**: The second most influential predictor is **{second_feature}** at **{second_weight:.3f}**, indicating that behavioral and demographic changes are compound predictors.
- **Strategy Recommendation**: Configure automated CRM alerts triggered immediately when a member's **{top_feature}** or **{second_feature}** drops below the target threshold, ensuring rapid intervention."""

        # 7. Confusion Matrix
        elif 'Confusion' in chart_type or 'Matrix' in chart_type:
            return f"""<think>
- Evaluating model confusion matrix (XGBoost Classifier).
- Total records: 16,734; Correctly classified: 15,750 (Accuracy: 94.1%).
- Verified high-precision recall benchmarks on key cohorts (Elite Loyalists & At-Risk Flyers).
- Formulating actionability and automation risk profile.
</think>
- **Key Observation**: The XGBoost loyalty classification model registers an overall accuracy of **94.1%**, correctly classifying 15,750 records out of 16,734 test cases.
- **Precision Metrics**: True positive rates are exceptionally high on core segments (91.1% on Elite Loyalists, 93.8% on At-Risk), indicating highly stable performance.
- **Strategy Recommendation**: Given the exceptionally low false-positive rate, you can safely deploy automated marketing workflows triggered directly by this model with high confidence and minimal risk of misallocating loyalty budgets."""

        # 8. Cohort Radar Ratings
        elif 'Radar' in chart_type or 'Cohort' in chart_type:
            high_risk_seg = max(chart_data, key=lambda x: x.get("avgRisk", 0.0))
            highest_clv_seg = max(chart_data, key=lambda x: x.get("avgClv", 0.0))
            
            return f"""<think>
- Examining multi-dimensional cohort radar chart data.
- Located segment with highest risk: {high_risk_seg.get('segment', 'Unknown')} ({high_risk_seg.get('avgRisk', 0.0)*100:.1f}% avg risk).
- Located segment with highest lifetime value: {highest_clv_seg.get('segment', 'Unknown')} (CAD ${highest_clv_seg.get('avgClv', 0.0):,.2f} avg CLV).
- Formulating strategic resource allocation across segments.
</think>
- **Key Observation**: Radar evaluation indicates that **{high_risk_seg.get('segment', 'Unknown')}** represents the highest churn risk profile in the database, with an average churn risk of **{high_risk_seg.get('avgRisk', 0.0)*100:.1f}%**.
- **Value Concentration**: The **{highest_clv_seg.get('segment', 'Unknown')}** cohort represents the primary wealth concentration, with an average Customer Lifetime Value of **CAD ${highest_clv_seg.get('avgClv', 0.0):,.2f}**.
- **Strategy Recommendation**: Focus high-touch premium retention incentives on **{highest_clv_seg.get('segment', 'Unknown')}** to protect the loyalty core, while executing programmatic engagement campaigns for **{high_risk_seg.get('segment', 'Unknown')}**."""

        # 9. Gantt / Timeline Gantt
        elif 'Gantt' in chart_type:
            high_priority_count = sum(1 for s in chart_data if s.get("avgRisk", 0.0) >= 0.5)
            return f"""<think>
- Analyzing campaign scheduling Gantt chart data.
- Counted high-priority cohorts requiring scheduling priority (risk >= 50%): {high_priority_count}.
- Formulating sequencing and cadence schedule for campaign execution.
</think>
- **Key Observation**: The campaign roadmap indicates that **{high_priority_count}** segments exhibit critical risk indicators, necessitating sequence prioritization within the next 30 to 60 days.
- **Project Cadence**: Dynamic scheduling of these campaigns ensures outreach is executed precisely when customer booking activity begins to decline.
- **Strategy Recommendation**: Deploy automated email triggers to At-Risk cohorts during their peak churn window to capture attention before brand disengagement becomes permanent."""

    except Exception as e:
        print(f"Error calculating dynamic stats for {chart_type}: {str(e)}")

    return f"""<think>
- Querying default dynamic narration model for chart type: "{chart_type}".
- Correlating loyalty points accumulation behaviors with member redemptions.
- Evaluating point-multiplier strategy for low-travel cycles.
</think>
- **Key Observation**: Active loyalty members demonstrate a high correlation between points accumulation frequency and flight redemption actions, proving program utility.
- **Engagement Profile**: Standard and Casual tiers exhibit lower point velocity, showing a higher risk of disengagement during off-peak travel seasons.
- **Strategy Recommendation**: Implement targeted point-multiplier promotions during seasonal travel troughs to maintain active booking velocities among entry-level cardholders."""


@router.post("/api/ai/narrate")
def narrate_chart_json(req: NarrateRequest, request: Request):
    provider, key = get_ai_strategy(request, req.apiKey, req.provider)
    mock_text = get_mock_narration(req.chartType, req.chartData)
    
    fallback_gemini_key = os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")
    if req.apiKey and req.apiKey.startswith("AIzaSy"):
        fallback_gemini_key = req.apiKey

    system_prompt = (
        "You are an expert airline loyalty data analyst. First, perform step-by-step analytical reasoning "
        "and summarize your thought process in detail. Wrap this thought process inside `<think>` and `</think>` tags. "
        "After the closing `</think>` tag, write your final structured executive analysis for the chart. "
        "The final analysis should have bullet points with clear, bolded section headers (e.g. **Key Observation**, "
        "**Risk Assessment**, **Strategy Recommendation**), write concisely (3-5 sentences for the final analysis), and lead with business takeaways."
    )
    prompt = f"""Explain this chart analytics snapshot.
Chart Type: {req.chartType}
Chart Data Content: {req.chartData}

Instructions:
- First, write a `<think>` block containing your internal step-by-step analysis of the chart type, data trends, outliers, and calculations.
- Then, write your final response under the `</think>` tag.
- In the final response, lead with the business takeaway in the very first sentence.
- Format the final response using 3 distinct bullet points: **Key Observation**, **Risk/Value Analysis**, and **Strategy Recommendation**.
- Explain concisely in 3 to 5 sentences for the final response.
- Avoid technical jargon, write for executive stakeholders.
"""

    if provider == "gemini" and key:
        try:
            narration = call_gemini(system_prompt, [{"role": "user", "content": prompt}], key)
            return {"narration": narration}
        except Exception as e:
            print(f"Gemini API Error: {str(e)}")
            return {"narration": mock_text}

    if provider == "openai" and key:
        try:
            narration = call_openai(system_prompt, [{"role": "user", "content": prompt}], key)
            return {"narration": narration}
        except Exception as e:
            print(f"OpenAI API Error: {str(e)}")
            return {"narration": mock_text}

    if provider == "claude" and key:
        try:
            import anthropic
            client = anthropic.Anthropic(api_key=key)
            response = client.messages.create(
                model="claude-3-5-sonnet-20241022",
                max_tokens=500,
                system=system_prompt,
                messages=[{"role": "user", "content": prompt}]
            )
            return {"narration": response.content[0].text}
        except Exception as e:
            print(f"Claude API Error: {str(e)}")
            if fallback_gemini_key:
                try:
                    print("Switching to Gemini fallback...")
                    narration = call_gemini(system_prompt, [{"role": "user", "content": prompt}], fallback_gemini_key)
                    return {"narration": narration}
                except Exception as ge:
                    print(f"Gemini Fallback Error: {str(ge)}")
                    return {"narration": mock_text}
            return {"narration": mock_text}

    return {"narration": mock_text}


@router.post("/narrate-chart")
def narrate_chart_stream(req: NarrateRequest, request: Request):
    mock_text = get_mock_narration(req.chartType, req.chartData)
    
    def stream_generator():
        import time
        provider, key = get_ai_strategy(request, req.apiKey, req.provider)
        
        fallback_gemini_key = os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")
        if req.apiKey and req.apiKey.startswith("AIzaSy"):
            fallback_gemini_key = req.apiKey

        system_prompt = (
            "You are an expert airline loyalty data analyst. First, perform step-by-step analytical reasoning "
            "and summarize your thought process in detail. Wrap this thought process inside `<think>` and `</think>` tags. "
            "After the closing `</think>` tag, write your final structured executive analysis for the chart. "
            "The final analysis should have bullet points with clear, bolded section headers (e.g. **Key Observation**, "
            "**Risk Assessment**, **Strategy Recommendation**), write concisely (3-5 sentences for the final analysis), and lead with business takeaways."
        )
        prompt = f"""Explain this chart analytics snapshot.
Chart Type: {req.chartType}
Chart Data Content: {req.chartData}

Instructions:
- First, write a `<think>` block containing your internal step-by-step analysis of the chart type, data trends, outliers, and calculations.
- Then, write your final response under the `</think>` tag.
- In the final response, lead with the business takeaway in the very first sentence.
- Format the final response using 3 distinct bullet points: **Key Observation**, **Risk/Value Analysis**, and **Strategy Recommendation**.
- Explain concisely in 3 to 5 sentences for the final response.
- Avoid technical jargon, write for executive stakeholders.
"""
        messages = [{"role": "user", "content": prompt}]

        if provider == "gemini" and key:
            try:
                for chunk in stream_gemini(system_prompt, messages, key):
                    yield f"data: {json.dumps(chunk)}\n\n"
                yield "data: [DONE]\n\n"
                return
            except Exception as e:
                print(f"Gemini API Error: {str(e)}. Offline mode active")

        elif provider == "openai" and key:
            try:
                for chunk in stream_openai(system_prompt, messages, key):
                    yield f"data: {json.dumps(chunk)}\n\n"
                yield "data: [DONE]\n\n"
                return
            except Exception as e:
                print(f"OpenAI API Error: {str(e)}")
                if fallback_gemini_key:
                    print("Switching to Gemini fallback...")
                    try:
                        for chunk in stream_gemini(system_prompt, messages, fallback_gemini_key):
                            yield f"data: {json.dumps(chunk)}\n\n"
                        yield "data: [DONE]\n\n"
                        return
                    except Exception as ge:
                        print(f"Gemini Fallback Error: {str(ge)}. Offline mode active")
                else:
                    print("No Gemini fallback key. Offline mode active")
                
        elif provider == "claude" and key:
            try:
                import anthropic
                client = anthropic.Anthropic(api_key=key)
                with client.messages.stream(
                    model="claude-3-5-sonnet-20241022",
                    max_tokens=500,
                    system=system_prompt,
                    messages=messages
                ) as stream:
                    for text in stream.text_stream:
                        yield f"data: {json.dumps(text)}\n\n"
                yield "data: [DONE]\n\n"
                return
            except Exception as e:
                print(f"Claude API Error: {str(e)}")
                if fallback_gemini_key:
                    print("Switching to Gemini fallback...")
                    try:
                        for chunk in stream_gemini(system_prompt, messages, fallback_gemini_key):
                            yield f"data: {json.dumps(chunk)}\n\n"
                        yield "data: [DONE]\n\n"
                        return
                    except Exception as ge:
                        print(f"Gemini Fallback Error: {str(ge)}. Offline mode active")
                else:
                    print("No Gemini fallback key. Offline mode active")

        # Mock fallback
        tokens = mock_text.split(" ")
        for i, t in enumerate(tokens):
            chunk = t + " " if i < len(tokens) - 1 else t
            yield f"data: {json.dumps(chunk)}\n\n"
            time.sleep(0.015)
        yield "data: [DONE]\n\n"
            
    return StreamingResponse(stream_generator(), media_type="text/event-stream")


def get_mock_strategy(segment_name: str) -> str:
    if segment_name == 'Elite Loyalists':
        return """### Summary
Keep our top tier flyers highly active. Elite Loyalists represent 18% of members but drive over 45% of total airline flight invoice revenue. Keep satisfaction high.
### Signals
High flight counts, high CLV (avg CAD $15K+), low risk score. Mostly Aurora card holders with anniversary signup patterns.
### Hidden Risk
Competitor matches. Top tier competitors may target them with status-match promotions to siphon high-value accounts.
### 90-Day Plan
- **Week 1**: Launch direct VIP helpdesk priority line access.
- **Week 4**: Schedule surprise upgrades on milestones.
- **Week 8**: Invite to exclusive premium events in Vancouver and Toronto.
- **Week 12**: Evaluate engagement and active miles balances.
### Metrics
Target <5% churn risk maintenance, high partner lounge check-in volumes, and stable YoY flight schedules.
### Don't Do
Do not reduce point accumulation multipliers or add blackout dates to their flight bookings."""
    elif segment_name == 'At-Risk Flyers':
        return """### Summary
Re-engage disengaged flyers quickly to prevent opt-outs. These members show declining flight counts and point redemptions.
### Signals
90-day inactive flight status, falling redemption ratios, and Star card tier balances.
### Hidden Risk
Inactive points balance. Unused points represent a liability and signal disengagement.
### 90-Day Plan
- **Week 1**: Email double-points upgrade offers for next booked trip.
- **Week 4**: Send a personalized email matching their top province routes.
- **Week 8**: Execute direct phone outreach for Star tier members with high CLV.
- **Week 12**: Conduct follow-up points balance validation checks.
### Metrics
Target 28% churn risk reduction and recovery of an estimated $1.2M in CLV.
### Don't Do
Do not ignore inactive accounts; avoid generic non-customized generic emails."""
    else:
        return """### Summary
Build brand preference among infrequent flyers. Standard and Casual travelers have low flight frequency but high lifetime growth potential.
### Signals
1-2 flights annually, standard card tiers, and low point redemption rates.
### Hidden Risk
Complete disengagement. If not targeted, they will transition to competitor options for cheaper single flights.
### 90-Day Plan
- **Week 1**: Target with low-cost flight alerts and promotional fare sales.
- **Week 4**: Offer entry-level partner benefits to spark program interest.
- **Week 8**: Schedule weekend companion travel bonus point events.
- **Week 12**: Audit cohort flight invoice progression.
### Metrics
Target 12% churn reduction rate, increasing lifetime point redeems.
### Don't Do
Do not spam with daily non-discounted emails or offer complex tier requirements."""


@router.post("/api/ai/segment-strategy")
def generate_strategy_json(req: StrategyRequest, request: Request):
    provider, key = get_ai_strategy(request, req.apiKey, req.provider)
    mock_text = get_mock_strategy(req.segmentName)
    
    fallback_gemini_key = os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")
    if req.apiKey and req.apiKey.startswith("AIzaSy"):
        fallback_gemini_key = req.apiKey

    system_prompt = "You are a senior airline loyalty program strategist."
    prompt = f"""Generate a comprehensive strategic brief for the airline loyalty segment: '{req.segmentName}'.

The brief MUST contain these exact sections:
1. SUMMARY: Executive summary of this customer cohort and their business impact.
2. SIGNALS: Key behaviors, enrollment trends, or flight patterns identifying them.
3. HIDDEN RISK: Less obvious vulnerabilities (e.g. competitor matching, point liability, churn signals).
4. 90-DAY PLAN: Week-by-week action items divided into Week 1 (Immediate outreach), Week 4 (Campaign review), Week 8 (Fulfillment checks), and Week 12 (ROI assessment).
5. METRICS: Core KPIs to evaluate this cohort's performance and retention rate.
6. DONT DO: Crucial warnings and practices to avoid for this customer segment.

Format using clean Markdown headers. Keep it brief, professional, and directly actionable.
"""

    if provider == "gemini" and key:
        try:
            strategy = call_gemini(system_prompt, [{"role": "user", "content": prompt}], key)
            return {"strategy": strategy}
        except Exception as e:
            print(f"Gemini API Error: {str(e)}")
            return {"strategy": mock_text}

    if provider == "openai" and key:
        try:
            strategy = call_openai(system_prompt, [{"role": "user", "content": prompt}], key)
            return {"strategy": strategy}
        except Exception as e:
            print(f"OpenAI API Error: {str(e)}")
            return {"strategy": mock_text}

    if provider == "claude" and key:
        try:
            import anthropic
            client = anthropic.Anthropic(api_key=key)
            response = client.messages.create(
                model="claude-3-5-sonnet-20241022",
                max_tokens=1500,
                system=system_prompt,
                messages=[{"role": "user", "content": prompt}]
            )
            return {"strategy": response.content[0].text}
        except Exception as e:
            print(f"Claude API Error: {str(e)}")
            if fallback_gemini_key:
                try:
                    print("Switching to Gemini fallback...")
                    strategy = call_gemini(system_prompt, [{"role": "user", "content": prompt}], fallback_gemini_key)
                    return {"strategy": strategy}
                except Exception as ge:
                    print(f"Gemini Fallback Error: {str(ge)}")
                    return {"strategy": mock_text}
            return {"strategy": mock_text}

    return {"strategy": mock_text}


@router.post("/generate-strategy")
def generate_strategy_stream(req: StrategyRequest, request: Request):
    mock_text = get_mock_strategy(req.segmentName)
    
    def strategy_generator():
        import time
        provider, key = get_ai_strategy(request, req.apiKey, req.provider)
        
        fallback_gemini_key = os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")
        if req.apiKey and req.apiKey.startswith("AIzaSy"):
            fallback_gemini_key = req.apiKey

        system_prompt = "You are a senior airline loyalty program strategist."
        prompt = f"""Generate a comprehensive strategic brief for the airline loyalty segment: '{req.segmentName}'.

The brief MUST contain these exact sections:
1. SUMMARY: Executive summary of this customer cohort and their business impact.
2. SIGNALS: Key behaviors, enrollment trends, or flight patterns identifying them.
3. HIDDEN RISK: Less obvious vulnerabilities (e.g. competitor matching, point liability, churn signals).
4. 90-DAY PLAN: Week-by-week action items divided into Week 1 (Immediate outreach), Week 4 (Campaign review), Week 8 (Fulfillment checks), and Week 12 (ROI assessment).
5. METRICS: Core KPIs to evaluate this cohort's performance and retention rate.
6. DONT DO: Crucial warnings and practices to avoid for this customer segment.

Format using clean Markdown headers. Keep it brief, professional, and directly actionable.
"""
        messages = [{"role": "user", "content": prompt}]

        if provider == "gemini" and key:
            try:
                for chunk in stream_gemini(system_prompt, messages, key):
                    yield f"data: {json.dumps(chunk)}\n\n"
                yield "data: [DONE]\n\n"
                return
            except Exception as e:
                print(f"Gemini API Error: {str(e)}. Offline mode active")

        elif provider == "openai" and key:
            try:
                for chunk in stream_openai(system_prompt, messages, key):
                    yield f"data: {json.dumps(chunk)}\n\n"
                yield "data: [DONE]\n\n"
                return
            except Exception as e:
                print(f"OpenAI API Error: {str(e)}")
                if fallback_gemini_key:
                    print("Switching to Gemini fallback...")
                    try:
                        for chunk in stream_gemini(system_prompt, messages, fallback_gemini_key):
                            yield f"data: {json.dumps(chunk)}\n\n"
                        yield "data: [DONE]\n\n"
                        return
                    except Exception as ge:
                        print(f"Gemini Fallback Error: {str(ge)}. Offline mode active")
                else:
                    print("No Gemini fallback key. Offline mode active")
                
        elif provider == "claude" and key:
            try:
                import anthropic
                client = anthropic.Anthropic(api_key=key)
                with client.messages.stream(
                    model="claude-3-5-sonnet-20241022",
                    max_tokens=1500,
                    system=system_prompt,
                    messages=messages
                ) as stream:
                    for text in stream.text_stream:
                        yield f"data: {json.dumps(text)}\n\n"
                yield "data: [DONE]\n\n"
                return
            except Exception as e:
                print(f"Claude API Error: {str(e)}")
                if fallback_gemini_key:
                    print("Switching to Gemini fallback...")
                    try:
                        for chunk in stream_gemini(system_prompt, messages, fallback_gemini_key):
                            yield f"data: {json.dumps(chunk)}\n\n"
                        yield "data: [DONE]\n\n"
                        return
                    except Exception as ge:
                        print(f"Gemini Fallback Error: {str(ge)}. Offline mode active")
                else:
                    print("No Gemini fallback key. Offline mode active")

        # Mock fallback
        tokens = mock_text.split(" ")
        for i, t in enumerate(tokens):
            chunk = t + " " if i < len(tokens) - 1 else t
            yield f"data: {json.dumps(chunk)}\n\n"
            time.sleep(0.015)
        yield "data: [DONE]\n\n"

    return StreamingResponse(strategy_generator(), media_type="text/event-stream")
