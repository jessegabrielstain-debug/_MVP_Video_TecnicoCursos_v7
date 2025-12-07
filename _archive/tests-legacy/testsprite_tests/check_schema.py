import requests
import json
from auth_utils import get_authenticated_headers, BASE_URL

def check_schema():
    headers = get_authenticated_headers()
    
    # Try to list projects to see what we get
    # This uses the GET endpoint which might also be broken if it selects columns that don't exist?
    # But the GET endpoint in route.ts does .select('*').
    # If the columns don't exist in DB, select * returns what exists.
    # The Zod schema validation is on POST, not GET response (usually).
    
    print("Checking GET /api/projects...")
    try:
        resp = requests.get(f"{BASE_URL}/api/projects", headers=headers)
        print(f"Status: {resp.status_code}")
        if resp.status_code == 200:
            data = resp.json()
            print("Projects data sample:")
            if data.get('data') and len(data['data']) > 0:
                print(json.dumps(data['data'][0], indent=2))
            else:
                print("No projects found.")
        else:
            print(resp.text)
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_schema()