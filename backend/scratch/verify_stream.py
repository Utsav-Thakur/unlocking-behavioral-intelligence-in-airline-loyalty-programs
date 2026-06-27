import urllib.request
import json

def test():
    url = "http://127.0.0.1:8000/narrate-chart"
    body = {
        "apiKey": None,
        "chartType": "Cohort Radar Ratings",
        "chartData": [],
        "provider": "claude"
    }
    req_bytes = json.dumps(body).encode('utf-8')
    req = urllib.request.Request(
        url,
        data=req_bytes,
        headers={'Content-Type': 'application/json'}
    )
    try:
        with urllib.request.urlopen(req) as res:
            print("Status:", res.status)
            print("Headers:", dict(res.getheaders()))
            content = res.read().decode('utf-8')
            print("Body Content snippet:")
            print(content[:500])
    except Exception as e:
        print("Error:", e)

if __name__ == "__main__":
    test()
