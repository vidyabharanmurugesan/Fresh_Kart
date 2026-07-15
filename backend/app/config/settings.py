import os
from datetime import timedelta
from dotenv import load_dotenv, find_dotenv

load_dotenv(find_dotenv(usecwd=True))

BASE_DIR = os.path.abspath(os.path.dirname(__file__))


class Config:
    """Application configuration — loads from .env file."""

    # ── Flask Core ──
    SECRET_KEY = os.getenv("SECRET_KEY", "freshkart-dev-secret-key-change-in-production")
    FLASK_ENV = os.getenv("FLASK_ENV", "development")
    DEBUG = os.getenv("FLASK_DEBUG", "1") == "1"

    # ── Database (SQLite — Local Auth) ──
    PROJECT_ROOT = os.path.abspath(os.path.join(BASE_DIR, '..', '..'))
    DB_DIR = os.path.join(PROJECT_ROOT, 'database')
    os.makedirs(DB_DIR, exist_ok=True)
    _default_db = f"sqlite:///{os.path.join(DB_DIR, 'local_auth.db')}"
    SQLALCHEMY_DATABASE_URI = os.getenv("DATABASE_URL", _default_db)
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # ── JWT Authentication ──
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "freshkart-jwt-secret-change-in-production")
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(
        hours=int(os.getenv("JWT_ACCESS_TOKEN_EXPIRES_HOURS", "24"))
    )
    JWT_TOKEN_LOCATION = ["headers"]
    JWT_HEADER_NAME = "Authorization"
    JWT_HEADER_TYPE = "Bearer"

    # ── CORS ──
    CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",")

    # ── Server ──
    HOST = os.getenv("HOST", "0.0.0.0")
    PORT = int(os.getenv("PORT", "5000"))

    # ── File Uploads ──
    MAX_CONTENT_LENGTH = int(os.getenv("MAX_CONTENT_LENGTH", "16777216"))  # 16 MB
    UPLOAD_FOLDER = os.getenv(
        "UPLOAD_FOLDER", os.path.join(BASE_DIR, '..', 'uploads')
    )

    # ── MongoDB (Phase 2) ──
    MONGO_URI = os.getenv("MONGO_URI", None)
    MONGO_DB_NAME = os.getenv("MONGO_DB_NAME", "freshkart")

    # ── Razorpay (Phase 2) ──
    RAZORPAY_KEY_ID = os.getenv("RAZORPAY_KEY_ID", None)
    RAZORPAY_KEY_SECRET = os.getenv("RAZORPAY_KEY_SECRET", None)

    # ── Google Maps (Phase 2) ──
    GOOGLE_MAPS_API_KEY = os.getenv("GOOGLE_MAPS_API_KEY", None)

    # ── Twilio SMS/OTP (Phase 2) ──
    TWILIO_ACCOUNT_SID = os.getenv("TWILIO_ACCOUNT_SID", None)
    TWILIO_AUTH_TOKEN = os.getenv("TWILIO_AUTH_TOKEN", None)
    TWILIO_PHONE_NUMBER = os.getenv("TWILIO_PHONE_NUMBER", None)

    # ── Email / SMTP (Phase 2) ──
    MAIL_SERVER = os.getenv("MAIL_SERVER", "smtp.gmail.com")
    MAIL_PORT = int(os.getenv("MAIL_PORT", "587"))
    MAIL_USE_TLS = os.getenv("MAIL_USE_TLS", "true").lower() == "true"
    MAIL_USERNAME = os.getenv("MAIL_USERNAME", None)
    MAIL_PASSWORD = os.getenv("MAIL_PASSWORD", None)

    # ── Firebase (Phase 2) ──
    FIREBASE_CREDENTIALS_PATH = os.getenv("FIREBASE_CREDENTIALS_PATH", None)

    # ── Redis (Phase 2) ──
    REDIS_URL = os.getenv("REDIS_URL", None)

    # ── Cloudinary (Phase 2) ──
    CLOUDINARY_CLOUD_NAME = os.getenv("CLOUDINARY_CLOUD_NAME", None)
    CLOUDINARY_API_KEY = os.getenv("CLOUDINARY_API_KEY", None)
    CLOUDINARY_API_SECRET = os.getenv("CLOUDINARY_API_SECRET", None)

