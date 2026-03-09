import os
import requests

url = "https://lobghkggwkygogzmfnlk.supabase.co/rest/v1/feedback?select=*&limit=1"
with open('.env') as f:
    env_vars = dict(line.strip().split('=', 1) for line in f if '=' in line)

key = env_vars.get('VITE_SUPABASE_ANON_KEY')

headers = {
    "apikey": key,
    "Authorization": f"Bearer {key}"
}

try:
    response = requests.get(url, headers=headers)
    print("GET Status:", response.status_code)
    print("GET Response:", response.text)

    # Try inserting
    post_url = "https://lobghkggwkygogzmfnlk.supabase.co/rest/v1/feedback"
    data = {"user_name": "Test", "user_email": "test@upl", "rating": 5, "message": "Test message", "type": "Test"}
    post_res = requests.post(post_url, headers={**headers, "Content-Type": "application/json", "Prefer": "return=representation"}, json=data)
    print("POST Status:", post_res.status_code)
    print("POST Response:", post_res.text)

except Exception as e:
    print("Error:", e)
