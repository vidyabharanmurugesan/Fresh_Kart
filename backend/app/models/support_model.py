from app.config.firebase_config import get_firestore_db
from datetime import datetime
import os
import json

class SupportModel:
    COLLECTION_NAME = 'support_chats'
    _local_path = os.path.join(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')), 'database', 'support.json')

    @staticmethod
    def _firestore_available():
        db = get_firestore_db()
        return db is not None

    @staticmethod
    def _ensure_local_store():
        os.makedirs(os.path.dirname(SupportModel._local_path), exist_ok=True)
        if not os.path.exists(SupportModel._local_path):
            with open(SupportModel._local_path, 'w', encoding='utf-8') as f:
                json.dump({}, f)

    @staticmethod
    def _read_local():
        SupportModel._ensure_local_store()
        with open(SupportModel._local_path, 'r', encoding='utf-8') as f:
            try:
                return json.load(f)
            except Exception:
                return {}

    @staticmethod
    def _write_local(data):
        SupportModel._ensure_local_store()
        with open(SupportModel._local_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, default=str, ensure_ascii=False, indent=2)

    @staticmethod
    def _get_collection():
        db = get_firestore_db()
        return db.collection(SupportModel.COLLECTION_NAME)

    @staticmethod
    def create_or_get_support_chat(buyer_id, domain='food'):
        buyer_id_str = str(buyer_id)
        if SupportModel._firestore_available():
            doc_ref = SupportModel._get_collection().document(buyer_id_str)
            doc = doc_ref.get()
            if doc.exists:
                return doc.to_dict()
            
            chat_data = {
                'buyer_id': buyer_id_str,
                'domain': domain,
                'chat_messages': [],
                'status': 'open',
                'created_at': datetime.utcnow().isoformat(),
                'updated_at': datetime.utcnow().isoformat()
            }
            doc_ref.set(chat_data)
            return chat_data

        # Fallback local store
        data = SupportModel._read_local()
        if buyer_id_str in data:
            return data[buyer_id_str]

        chat_data = {
            'buyer_id': buyer_id_str,
            'domain': domain,
            'chat_messages': [],
            'status': 'open',
            'created_at': datetime.utcnow().isoformat(),
            'updated_at': datetime.utcnow().isoformat()
        }
        data[buyer_id_str] = chat_data
        SupportModel._write_local(data)
        return chat_data

    @staticmethod
    def get_support_chat_by_buyer(buyer_id):
        buyer_id_str = str(buyer_id)
        if SupportModel._firestore_available():
            doc = SupportModel._get_collection().document(buyer_id_str).get()
            return doc.to_dict() if doc.exists else None

        data = SupportModel._read_local()
        return data.get(buyer_id_str)

    @staticmethod
    def get_all_support_chats():
        if SupportModel._firestore_available():
            docs = SupportModel._get_collection().stream()
            return [doc.to_dict() for doc in docs]

        data = SupportModel._read_local()
        return list(data.values())

    @staticmethod
    def add_support_message(buyer_id, message_payload):
        buyer_id_str = str(buyer_id)
        now = datetime.utcnow().isoformat()
        
        if SupportModel._firestore_available():
            from google.cloud.firestore_v1 import ArrayUnion
            SupportModel._get_collection().document(buyer_id_str).update({
                'chat_messages': ArrayUnion([message_payload]),
                'updated_at': now
            })
            return True

        data = SupportModel._read_local()
        if buyer_id_str not in data:
            # Create a support ticket if it doesn't exist
            SupportModel.create_or_get_support_chat(buyer_id)
            data = SupportModel._read_local()
            
        if 'chat_messages' not in data[buyer_id_str]:
            data[buyer_id_str]['chat_messages'] = []
            
        data[buyer_id_str]['chat_messages'].append(message_payload)
        data[buyer_id_str]['updated_at'] = now
        SupportModel._write_local(data)
        return True
