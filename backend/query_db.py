import sqlite3
import os
import json

db_path = os.path.join(os.path.dirname(__file__), 'database', 'local_auth.db')
orders_path = os.path.join(os.path.dirname(__file__), 'database', 'orders.json')

def query():
    print("--- 1. SQLite Users with role = 'delivery' ---")
    if os.path.exists(db_path):
        conn = sqlite3.connect(db_path)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        cursor.execute("SELECT id, email, role, name, phone, vehicle_number FROM users WHERE role='delivery';")
        drivers = cursor.fetchall()
        for d in drivers:
            print(dict(d))
        conn.close()
    else:
        print("Database not found")
        
    print("\n--- 2. Orders from orders.json ---")
    if os.path.exists(orders_path):
        with open(orders_path, 'r', encoding='utf-8') as f:
            orders = json.load(f)
        for order_id, o in orders.items():
            print(f"OrderID: {order_id}, BuyerID: {o.get('buyer_id')}, SellerID: {o.get('seller_id')}, DeliveryPartnerID: {o.get('delivery_partner_id')}, Status: {o.get('status')}, Domain: {o.get('domain')}")
    else:
        print("Orders file not found")

if __name__ == '__main__':
    query()
