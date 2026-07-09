from app.config.firebase_config import get_firestore_db
from datetime import datetime
import uuid
import os
import json
from flask import current_app


class ProductModel:
    """Product access wrapper.

    Uses Firestore when available; otherwise falls back to a local JSON file
    at `backend/database/products.json` so the UI works without Firebase.
    """
    COLLECTION_NAME = 'products'
    _local_path = os.path.join(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')), 'database', 'products.json')

    @staticmethod
    def _firestore_available():
        db = get_firestore_db()
        return db is not None

    @staticmethod
    def _ensure_local_store():
        os.makedirs(os.path.dirname(ProductModel._local_path), exist_ok=True)
        if not os.path.exists(ProductModel._local_path):
            with open(ProductModel._local_path, 'w', encoding='utf-8') as f:
                json.dump({}, f)

    @staticmethod
    def _read_local():
        ProductModel._ensure_local_store()
        with open(ProductModel._local_path, 'r', encoding='utf-8') as f:
            try:
                return json.load(f)
            except Exception:
                return {}

    @staticmethod
    def _write_local(data):
        ProductModel._ensure_local_store()
        with open(ProductModel._local_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, default=str, ensure_ascii=False, indent=2)

    @staticmethod
    def _get_collection():
        db = get_firestore_db()
        return db.collection(ProductModel.COLLECTION_NAME)

    @staticmethod
    def create_product(seller_id, name, price, category, stock_count, image_url=None, domain='food', **kwargs):
        product_id = str(uuid.uuid4())
        product_data = {
            'product_id': product_id,
            'seller_id': seller_id,
            'name': name,
            'price': float(price),
            'category': category,
            'stock_count': int(stock_count),
            'image_url': image_url,
            'domain': domain,
            'created_at': datetime.utcnow().isoformat(),
            **kwargs
        }

        if ProductModel._firestore_available():
            ProductModel._get_collection().document(product_id).set(product_data)
            return product_data

        # Fallback: local JSON store
        data = ProductModel._read_local()
        data[product_id] = product_data
        ProductModel._write_local(data)
        return product_data

    @staticmethod
    def get_products_by_seller(seller_id, domain=None):
        if ProductModel._firestore_available():
            query = ProductModel._get_collection().where('seller_id', '==', seller_id)
            if domain:
                query = query.where('domain', '==', domain)
            docs = query.stream()
            return [doc.to_dict() for doc in docs]

        data = ProductModel._read_local()
        results = [v for v in data.values() if str(v.get('seller_id')) == str(seller_id)]
        if domain:
            results = [r for r in results if r.get('domain') == domain]
        return results

    @staticmethod
    def get_all_products(domain=None):
        if ProductModel._firestore_available():
            query = ProductModel._get_collection()
            if domain:
                query = query.where('domain', '==', domain)
            docs = query.stream()
            return [doc.to_dict() for doc in docs]

        data = ProductModel._read_local()
        results = list(data.values())
        if domain:
            results = [r for r in results if r.get('domain') == domain]
        return results

    @staticmethod
    def get_product_by_id(product_id):
        if ProductModel._firestore_available():
            doc = ProductModel._get_collection().document(product_id).get()
            if doc.exists:
                return doc.to_dict()
            return None

        data = ProductModel._read_local()
        return data.get(product_id)

    @staticmethod
    def update_product(product_id, update_data):
        update_data['updated_at'] = datetime.utcnow().isoformat()
        if ProductModel._firestore_available():
            ProductModel._get_collection().document(product_id).update(update_data)
            return ProductModel.get_product_by_id(product_id)

        data = ProductModel._read_local()
        if product_id not in data:
            raise Exception('Product not found')
        data[product_id].update(update_data)
        ProductModel._write_local(data)
        return data[product_id]

    @staticmethod
    def delete_product(product_id):
        if ProductModel._firestore_available():
            ProductModel._get_collection().document(product_id).delete()
            return True

        data = ProductModel._read_local()
        if product_id in data:
            del data[product_id]
            ProductModel._write_local(data)
        return True
