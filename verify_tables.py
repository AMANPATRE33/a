import urllib.request
import urllib.error
import json
import time

url_base = "https://lobghkggwkygogzmfnlk.supabase.co/rest/v1"

with open('.env') as f:
    env_vars = dict(line.strip().split('=', 1) for line in f if '=' in line)

key = env_vars.get('VITE_SUPABASE_ANON_KEY')

headers = {
    "apikey": key,
    "Authorization": f"Bearer {key}",
    "Content-Type": "application/json",
    "Prefer": "return=representation"
}

output_file = open("results.txt", "w", encoding="utf-8")

def print_result(table, action, success, extra=""):
    status = "✅ PASS" if success else "❌ FAIL"
    msg = f"[{status}] Table: {table} | Action: {action} {extra}\n"
    print(msg, end="")
    output_file.write(msg)

def make_request(url, method="GET", payload=None):
    data = json.dumps(payload).encode('utf-8') if payload else None
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as response:
            res_data = response.read().decode('utf-8')
            return response.status, json.loads(res_data) if res_data else None
    except urllib.error.HTTPError as e:
        error_msg = e.read().decode('utf-8')
        return e.code, error_msg

def test_menu_items():
    output_file.write("--- Testing menu_items ---\n")
    try:
        status, data = make_request(f"{url_base}/menu_items?select=*&limit=5")
        if status == 200:
            print_result("menu_items", "SELECT", True, f"({len(data)} items found)")
        else:
            print_result("menu_items", "SELECT", False, f"(Status: {status}, {data})")
    except Exception as e:
        print_result("menu_items", "SELECT", False, f"(Error: {e})")

def test_orders():
    output_file.write("\n--- Testing orders ---\n")
    try:
        # Test Insert
        test_email = f"test_{int(time.time())}@upl"
        payload = {
            "user_email": test_email,
            "items": json.dumps([{"id": "1", "name": "Test Item", "price": 10, "quantity": 1}]),
            "total": 10,
            "payment_method": "TEST_METHOD",
            "status": "completed"
        }
        status, data = make_request(f"{url_base}/orders", method="POST", payload=payload)
        
        if status in (200, 201):
            print_result("orders", "INSERT", True)
            
            # Test Select
            sel_status, sel_data = make_request(f"{url_base}/orders?user_email=eq.{test_email}&select=*")
            if sel_status == 200 and len(sel_data) > 0:
                print_result("orders", "SELECT", True, f"(Successfully fetched the inserted row)")
            else:
                print_result("orders", "SELECT", False, f"(Status: {sel_status}, {sel_data})")
        else:
            print_result("orders", "INSERT", False, f"(Status: {status}, {data})")
    except Exception as e:
         print_result("orders", "INSERT/SELECT", False, f"(Error: {e})")

def test_feedback():
    output_file.write("\n--- Testing feedback ---\n")
    try:
        # Test Insert
        test_email = f"test_{int(time.time())}@upl"
        payload = {
            "user_name": "Test User",
            "user_email": test_email,
            "rating": 5,
            "message": "This is an automated test message.",
            "type": "Automated Test"
        }
        status, data = make_request(f"{url_base}/feedback", method="POST", payload=payload)
        
        if status in (200, 201):
            print_result("feedback", "INSERT", True)
            
            # Test Select
            sel_status, sel_data = make_request(f"{url_base}/feedback?user_email=eq.{test_email}&select=*")
            if sel_status == 200 and len(sel_data) > 0:
                print_result("feedback", "SELECT", True, f"(Successfully fetched the inserted row)")
            else:
                print_result("feedback", "SELECT", False, f"(Status: {sel_status}, {sel_data})")
        else:
            print_result("feedback", "INSERT", False, f"(Status: {status}, {data})")
            
    except Exception as e:
         print_result("feedback", "INSERT/SELECT", False, f"(Error: {e})")

if __name__ == "__main__":
    output_file.write("Starting Supabase Table Verification...\n")
    test_menu_items()
    test_orders()
    test_feedback()
    output_file.write("\nVerification Complete.\n")
    output_file.close()
