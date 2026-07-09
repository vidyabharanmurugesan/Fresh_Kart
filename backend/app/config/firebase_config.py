import os
import firebase_admin
from firebase_admin import credentials, firestore
from flask import current_app

def init_firebase(app):
    """Initialize Firebase Admin SDK and attach the Firestore DB to the Flask app."""
    # Get the credentials path from app config
    cred_path = app.config.get('FIREBASE_CREDENTIALS_PATH')
    
    if not cred_path:
        print("⚠️ Firebase credentials path not found in config. Firebase will not be initialized.")
        return
        
    # Resolve the absolute path (relative to the backend directory or project root)
    if not os.path.isabs(cred_path):
        # We assume the config path is relative to the `backend` directory
        base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
        cred_path = os.path.join(base_dir, cred_path)
        
    if not os.path.exists(cred_path):
        print(f"⚠️ Firebase service account file not found at {cred_path}. Firebase will not be initialized.")
        return
        
    try:
        # Prevent re-initialization if already initialized
        if not firebase_admin._apps:
            cred = credentials.Certificate(cred_path)
            bucket_name = os.getenv("VITE_FIREBASE_STORAGE_BUCKET") or "freshkart-35c62.firebasestorage.app"
            firebase_admin.initialize_app(cred, {
                'storageBucket': bucket_name
            })
            print(f"[Firebase] Firebase Admin SDK initialized successfully (Bucket: {bucket_name}).")
        
        # Attach Firestore client to the app for easy access later
        app.db = firestore.client()
        
    except Exception as e:
        print(f"[ERROR] Failed to initialize Firebase: {e}")

def get_firestore_db():
    """Helper to get the Firestore DB instance from the current app."""
    # Return None if Firebase wasn't initialized or `db` wasn't attached to app
    return getattr(current_app, 'db', None)
