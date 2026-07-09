from app.config.firebase_config import get_firestore_db
from datetime import datetime
import uuid
import os
import json

class OrderModel:
    COLLECTION_NAME = 'orders'
    _local_path = os.path.join(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')), 'database', 'orders.json')

    @staticmethod
    def _firestore_available():
        db = get_firestore_db()
        return db is not None

    @staticmethod
    def _ensure_local_store():
        os.makedirs(os.path.dirname(OrderModel._local_path), exist_ok=True)
        if not os.path.exists(OrderModel._local_path):
            with open(OrderModel._local_path, 'w', encoding='utf-8') as f:
                json.dump({}, f)

    @staticmethod
    def _read_local():
        OrderModel._ensure_local_store()
        with open(OrderModel._local_path, 'r', encoding='utf-8') as f:
            try:
                return json.load(f)
            except Exception:
                return {}

    @staticmethod
    def _write_local(data):
        OrderModel._ensure_local_store()
        with open(OrderModel._local_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, default=str, ensure_ascii=False, indent=2)

    @staticmethod
    def _get_collection():
        db = get_firestore_db()
        return db.collection(OrderModel.COLLECTION_NAME)

    @staticmethod
    def create_order(buyer_id, seller_id, items, total_amount, address=None, gst_amount=0.0, payment_method='Cash on Delivery', domain='food', discount=0.0, delivery_charges=25.0, packaging_charges=15.0, platform_fee=5.0, tracking_number=None, delivery_date=None):
        order_id = f"FK-{str(uuid.uuid4())[:8].upper()}"
        order_data = {
            'order_id': order_id,
            'buyer_id': buyer_id,
            'seller_id': seller_id,
            'items': items,
            'total_amount': float(total_amount),
            'address': address,
            'gst_amount': float(gst_amount) if gst_amount else 0.0,
            'payment_method': payment_method,
            'status': 'pending', # pending, accepted, assigned_to_delivery, picked_up, delivered, cancelled
            'payment_status': 'unpaid',
            'delivery_partner_id': None,
            'location': None, # {lat: ..., lng: ...}
            'chat_messages': [], # Array of message objects
            'domain': domain,
            'discount': float(discount) if discount else 0.0,
            'delivery_charges': float(delivery_charges) if delivery_charges else 0.0,
            'packaging_charges': float(packaging_charges) if packaging_charges else 0.0,
            'platform_fee': float(platform_fee) if platform_fee else 0.0,
            'tracking_number': tracking_number,
            'delivery_date': delivery_date,
            'created_at': datetime.utcnow().isoformat()
        }
        
        if OrderModel._firestore_available():
            OrderModel._get_collection().document(order_id).set(order_data)
            return order_data

        # Fallback: local JSON store
        data = OrderModel._read_local()
        data[order_id] = order_data
        OrderModel._write_local(data)
        return order_data

    @staticmethod
    def _fill_defaults(order):
        if order:
            if 'payment_status' not in order:
                order['payment_status'] = 'unpaid'
        return order

    @staticmethod
    def get_orders_by_seller(seller_id):
        if OrderModel._firestore_available():
            docs = OrderModel._get_collection().where('seller_id', '==', seller_id).stream()
            return [OrderModel._fill_defaults(doc.to_dict()) for doc in docs]

        data = OrderModel._read_local()
        return [OrderModel._fill_defaults(v) for v in data.values() if str(v.get('seller_id')) == str(seller_id)]
        
    @staticmethod
    def get_orders_by_buyer(buyer_id):
        if OrderModel._firestore_available():
            docs = OrderModel._get_collection().where('buyer_id', '==', buyer_id).stream()
            return [OrderModel._fill_defaults(doc.to_dict()) for doc in docs]

        data = OrderModel._read_local()
        return [OrderModel._fill_defaults(v) for v in data.values() if str(v.get('buyer_id')) == str(buyer_id)]

    @staticmethod
    def get_orders_by_delivery_partner(delivery_partner_id):
        if OrderModel._firestore_available():
            docs = OrderModel._get_collection().where('delivery_partner_id', '==', delivery_partner_id).stream()
            return [OrderModel._fill_defaults(doc.to_dict()) for doc in docs]

        data = OrderModel._read_local()
        return [OrderModel._fill_defaults(v) for v in data.values() if str(v.get('delivery_partner_id')) == str(delivery_partner_id)]

    @staticmethod
    def get_orders_by_status(status):
        if OrderModel._firestore_available():
            docs = OrderModel._get_collection().where('status', '==', status).stream()
            return [OrderModel._fill_defaults(doc.to_dict()) for doc in docs]

        data = OrderModel._read_local()
        return [OrderModel._fill_defaults(v) for v in data.values() if v.get('status') == status]

    @staticmethod
    def get_all_orders():
        if OrderModel._firestore_available():
            docs = OrderModel._get_collection().stream()
            return [OrderModel._fill_defaults(doc.to_dict()) for doc in docs]

        data = OrderModel._read_local()
        return [OrderModel._fill_defaults(v) for v in data.values()]

    @staticmethod
    def get_order_by_id(order_id):
        if OrderModel._firestore_available():
            doc = OrderModel._get_collection().document(order_id).get()
            return OrderModel._fill_defaults(doc.to_dict()) if doc.exists else None

        data = OrderModel._read_local()
        return OrderModel._fill_defaults(data.get(order_id))

    @staticmethod
    def update_order(order_id, updates):
        updates['updated_at'] = datetime.utcnow().isoformat()
        if OrderModel._firestore_available():
            OrderModel._get_collection().document(order_id).update(updates)
            return True

        data = OrderModel._read_local()
        if order_id not in data:
            raise Exception('Order not found')
        data[order_id].update(updates)
        OrderModel._write_local(data)
        return True

    @staticmethod
    def update_order_status(order_id, status):
        return OrderModel.update_order(order_id, {'status': status})

    @staticmethod
    def add_chat_message(order_id, message_payload):
        if OrderModel._firestore_available():
            from google.cloud.firestore_v1 import ArrayUnion
            OrderModel._get_collection().document(order_id).update({
                'chat_messages': ArrayUnion([message_payload])
            })
            return True

        data = OrderModel._read_local()
        if order_id not in data:
            raise Exception('Order not found')
        
        if 'chat_messages' not in data[order_id]:
            data[order_id]['chat_messages'] = []
            
        data[order_id]['chat_messages'].append(message_payload)
        OrderModel._write_local(data)
        return True

