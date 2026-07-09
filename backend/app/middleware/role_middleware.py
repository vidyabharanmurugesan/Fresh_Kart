from functools import wraps
from flask import jsonify
from flask_jwt_extended import get_jwt_identity
from app.models.user_model import User


def role_required(*roles):
    """Decorator to restrict access to specific user roles.
    
    Usage:
        @role_required('admin')
        @role_required('seller', 'admin')
    """
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            current_user_id = get_jwt_identity()
            user = User.query.get(current_user_id)
            if not user:
                return jsonify({'error': 'User not found'}), 404
            if user.role not in roles:
                return jsonify({
                    'error': 'Access denied',
                    'message': f'This resource requires one of the following roles: {", ".join(roles)}'
                }), 403
            return fn(*args, **kwargs)
        return wrapper
    return decorator
