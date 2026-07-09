from flask import Blueprint
from flask_jwt_extended import jwt_required
from app.controllers.auth_controller import (
    signup, login, get_current_user, logout, get_sellers, google_auth,
    send_otp, verify_otp, get_users_by_role, update_profile, download_license,
    download_system_report_pdf, upload_system_logo
)
from app.controllers.product_controller import upload_file

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')

# Public routes
auth_bp.route('/signup', methods=['POST'])(signup)
auth_bp.route('/login', methods=['POST'])(login)
auth_bp.route('/google', methods=['POST'])(google_auth)
auth_bp.route('/send-otp', methods=['POST'])(send_otp)
auth_bp.route('/verify-otp', methods=['POST'])(verify_otp)
auth_bp.route('/upload', methods=['POST'])(upload_file)

# Protected routes
auth_bp.route('/me', methods=['GET'])(jwt_required()(get_current_user))
auth_bp.route('/me', methods=['PUT'])(jwt_required()(update_profile))
auth_bp.route('/license', methods=['GET'])(download_license)
auth_bp.route('/logout', methods=['POST'])(jwt_required()(logout))
auth_bp.route('/sellers', methods=['GET'])(jwt_required()(get_sellers))
auth_bp.route('/users', methods=['GET'])(jwt_required()(get_users_by_role))
auth_bp.route('/system-report/pdf', methods=['GET'])(jwt_required()(download_system_report_pdf))
auth_bp.route('/system-logo', methods=['POST'])(jwt_required()(upload_system_logo))
