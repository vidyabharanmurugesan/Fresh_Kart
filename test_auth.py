import requests
import json

base_url = 'http://localhost:5000/api/auth'

def test():
    print("Testing signup...")
    signup_data = {
        'email': 'test@example.com',
        'password': 'password123',
        'name': 'Test User',
        'role': 'buyer'
    }
    r = requests.post(f"{base_url}/signup", json=signup_data)
    print("Signup response:", r.status_code, r.text)
    
    print("\nTesting login...")
    login_data = {
        'email': 'test@example.com',
        'password': 'password123'
    }
    r = requests.post(f"{base_url}/login", json=login_data)
    print("Login response:", r.status_code, r.text)

if __name__ == '__main__':
    test()
