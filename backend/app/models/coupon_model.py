from app.config.firebase_config import get_firestore_db
from datetime import datetime
import uuid
import os
import json


class CouponModel:
    """Coupon access wrapper.
    
    Uses Firestore when available; otherwise falls back to a local JSON file
    at `backend/database/coupons.json` for local development.
    """
    COLLECTION_NAME = 'coupons'
    _local_path = os.path.join(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')), 'database', 'coupons.json')

    @staticmethod
    def _firestore_available():
        db = get_firestore_db()
        return db is not None

    @staticmethod
    def _ensure_local_store():
        os.makedirs(os.path.dirname(CouponModel._local_path), exist_ok=True)
        if not os.path.exists(CouponModel._local_path):
            with open(CouponModel._local_path, 'w', encoding='utf-8') as f:
                json.dump({}, f)

    @staticmethod
    def _read_local():
        CouponModel._ensure_local_store()
        with open(CouponModel._local_path, 'r', encoding='utf-8') as f:
            try:
                return json.load(f)
            except Exception:
                return {}

    @staticmethod
    def _write_local(data):
        CouponModel._ensure_local_store()
        with open(CouponModel._local_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, default=str, ensure_ascii=False, indent=2)

    @staticmethod
    def _get_collection():
        db = get_firestore_db()
        return db.collection(CouponModel.COLLECTION_NAME)

    @staticmethod
    def create_coupon(code, discount_type, discount_value, min_order_amount=0.0, max_discount=0.0, description="", domain="all", active=True):
        coupon_id = str(uuid.uuid4())
        coupon_data = {
            'coupon_id': coupon_id,
            'code': code.strip().upper(),
            'discount_type': discount_type,  # 'percentage' or 'flat'
            'discount_value': float(discount_value),
            'min_order_amount': float(min_order_amount),
            'max_discount': float(max_discount),
            'description': description.strip(),
            'domain': domain,  # 'food', 'grocery', or 'all'
            'active': bool(active),
            'created_at': datetime.utcnow().isoformat()
        }

        if CouponModel._firestore_available():
            CouponModel._get_collection().document(coupon_id).set(coupon_data)
            return coupon_data

        data = CouponModel._read_local()
        data[coupon_id] = coupon_data
        CouponModel._write_local(data)
        return coupon_data

    @staticmethod
    def get_all_coupons(domain=None, active_only=False):
        if CouponModel._firestore_available():
            query = CouponModel._get_collection()
            if active_only:
                query = query.where('active', '==', True)
            docs = query.stream()
            coupons = [doc.to_dict() for doc in docs]
        else:
            data = CouponModel._read_local()
            coupons = list(data.values())
            if active_only:
                coupons = [c for c in coupons if c.get('active') is True]
        
        # Filter by domain if specified
        if domain:
            coupons = [c for c in coupons if c.get('domain') in [domain, 'all']]
            
        return coupons

    @staticmethod
    def get_coupon_by_code(code):
        code_upper = code.strip().upper()
        if CouponModel._firestore_available():
            docs = CouponModel._get_collection().where('code', '==', code_upper).limit(1).stream()
            for doc in docs:
                return doc.to_dict()
            return None
            
        data = CouponModel._read_local()
        for c in data.values():
            if c.get('code') == code_upper:
                return c
        return None

    @staticmethod
    def delete_coupon(coupon_id):
        if CouponModel._firestore_available():
            CouponModel._get_collection().document(coupon_id).delete()
            return True
            
        data = CouponModel._read_local()
        if coupon_id in data:
            del data[coupon_id]
            CouponModel._write_local(data)
            return True
        return False
