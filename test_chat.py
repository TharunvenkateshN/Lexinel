import requests
import json

def test_chat():
    url = "http://127.0.0.1:7860/api/chat"
    payload = {
        "message": "Hello, Lexinel. What are the rules for AML?",
        "history": []
    }
    headers = {"Content-Type": "application/json"}
    
    try:
        response = requests.post(url, data=json.dumps(payload), headers=headers)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_chat()
