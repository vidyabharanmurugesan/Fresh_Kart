import os
import json

def migrate():
    backend_dir = os.path.dirname(os.path.abspath(__file__))
    database_dir = os.path.join(backend_dir, 'database')
    
    orders_path = os.path.join(database_dir, 'orders.json')
    products_path = os.path.join(database_dir, 'products.json')
    
    # Migrate products
    if os.path.exists(products_path):
        print(f"Reading products from {products_path}...")
        with open(products_path, 'r', encoding='utf-8') as f:
            try:
                products = json.load(f)
            except Exception as e:
                print(f"Error reading products.json: {e}")
                products = {}
                
        migrated_products = 0
        for p_id, p in products.items():
            if str(p.get('seller_id')) == '4':
                p['seller_id'] = '2'
                migrated_products += 1
                
        with open(products_path, 'w', encoding='utf-8') as f:
            json.dump(products, f, ensure_ascii=False, indent=2)
        print(f"Migrated {migrated_products} products to seller ID '2'.")
        
    # Migrate orders
    if os.path.exists(orders_path):
        print(f"Reading orders from {orders_path}...")
        with open(orders_path, 'r', encoding='utf-8') as f:
            try:
                orders = json.load(f)
            except Exception as e:
                print(f"Error reading orders.json: {e}")
                orders = {}
                
        migrated_orders = 0
        for o_id, o in orders.items():
            # Old order has buyer_id='4' and seller_id='4'
            if str(o.get('buyer_id')) == '4':
                o['buyer_id'] = '1'
            if str(o.get('seller_id')) == '4':
                o['seller_id'] = '2'
            migrated_orders += 1
            
        with open(orders_path, 'w', encoding='utf-8') as f:
            json.dump(orders, f, ensure_ascii=False, indent=2)
        print(f"Migrated {migrated_orders} orders: buyer ID to '1', seller ID to '2'.")

if __name__ == '__main__':
    migrate()
