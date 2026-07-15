import requests
import json

base_url = 'http://localhost:5000/api/auth'

def test():
    print("Testing seller signup...")
    signup_data = {
        'email': 'seller@example.com',
        'password': 'password123',
        'name': 'Seller User',
        'role': 'seller',
        'shop_name': 'My Shop',
        'shop_license': 'LIC123',
        'shop_license_image': 'img.jpg',
        'shop_location': 'Bangalore',
        'shop_type': 'food',
        'veg_nonveg': 'both',
        'shop_owner_name': 'Owner',
        'shop_address': 'Address 1',
        'gps_location': '12,77',
        'aadhaar_card': '1234',
        'pan_card': 'ABCD',
        'bank_account_details': '123456',
        'shop_logo': 'logo.jpg',
        'shop_front_image': 'front.jpg'
    }
    r = requests.post(f"{base_url}/signup", json=signup_data)
    print("Signup response:", r.status_code, r.text)

if __name__ == '__main__':
    test()
