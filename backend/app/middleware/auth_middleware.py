from functools import wraps
from flask import jsonify
from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity
from app.models.user_model import User


def jwt_required_custom(fn):
    """Custom JWT authentication decorator with better error messages."""
    @wraps(fn)
    def wrapper(*args, **kwargs):
        try:
            verify_jwt_in_request()
            current_user_id = get_jwt_identity()
            user = User.query.get(current_user_id)
            if not user:
                return jsonify({'error': 'User not found'}), 404
            if not user.is_active:
                return jsonify({'error': 'Account is deactivated'}), 403
        except Exception as e:
            return jsonify({'error': 'Authentication required', 'message': str(e)}), 401
        return fn(*args, **kwargs)
    return wrapper
