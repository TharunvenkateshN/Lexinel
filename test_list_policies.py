import requests
import json

def test_list_policies():
    url = "http://127.0.0.1:7860/api/policies"
    try:
        response = requests.get(url)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_list_policies()
