from flask import jsonify, request
from app.models.coupon_model import CouponModel
from app.models.user_model import User


def get_active_coupons():
    """Get active coupons, optionally filtered by domain."""
    try:
        domain = request.args.get('domain')
        coupons = CouponModel.get_all_coupons(domain=domain, active_only=True)
        return jsonify({'coupons': coupons}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


def get_all_coupons(user_id):
    """Admin only: get all coupons (both active and inactive)."""
    try:
        user = User.query.get(int(user_id))
        if not user or user.role != 'admin':
            return jsonify({'error': 'Unauthorized: Admin privileges required'}), 403

        coupons = CouponModel.get_all_coupons()
        return jsonify({'coupons': coupons}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


def create_coupon(user_id):
    """Admin only: Create a new coupon."""
    data = request.get_json()
    
    # Validation
    required_fields = ['code', 'discount_type', 'discount_value']
    if not all(field in data for field in required_fields):
        return jsonify({'error': f'Missing required fields: {required_fields}'}), 400
        
    try:
        user = User.query.get(int(user_id))
        if not user or user.role != 'admin':
            return jsonify({'error': 'Unauthorized: Admin privileges required'}), 403

        # Prevent duplicate codes
        existing = CouponModel.get_coupon_by_code(data['code'])
        if existing:
            return jsonify({'error': f"Coupon with code '{data['code'].upper()}' already exists."}), 400

        coupon = CouponModel.create_coupon(
            code=data['code'],
            discount_type=data['discount_type'],
            discount_value=data['discount_value'],
            min_order_amount=data.get('min_order_amount', 0.0),
            max_discount=data.get('max_discount', 0.0),
            description=data.get('description', ''),
            domain=data.get('domain', 'all'),
            active=data.get('active', True)
        )
        return jsonify({'message': 'Coupon created successfully', 'coupon': coupon}), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500


def delete_coupon(coupon_id, user_id):
    """Admin only: Delete a coupon."""
    try:
        user = User.query.get(int(user_id))
        if not user or user.role != 'admin':
            return jsonify({'error': 'Unauthorized: Admin privileges required'}), 403

        deleted = CouponModel.delete_coupon(coupon_id)
        if not deleted:
            return jsonify({'error': 'Coupon not found'}), 404
            
        return jsonify({'message': 'Coupon deleted successfully'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
