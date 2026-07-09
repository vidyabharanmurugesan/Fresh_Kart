from flask import Blueprint
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.controllers.coupon_controller import (
    get_active_coupons,
    get_all_coupons,
    create_coupon,
    delete_coupon
)

coupon_bp = Blueprint('coupons', __name__, url_prefix='/api/coupons')


@coupon_bp.route('/', methods=['GET'])
@jwt_required()
def get_active_coupons_route():
    return get_active_coupons()


@coupon_bp.route('/admin', methods=['GET'])
@jwt_required()
def get_all_coupons_route():
    current_user_id = get_jwt_identity()
    return get_all_coupons(user_id=current_user_id)


@coupon_bp.route('/', methods=['POST'])
@jwt_required()
def create_coupon_route():
    current_user_id = get_jwt_identity()
    return create_coupon(user_id=current_user_id)


@coupon_bp.route('/<coupon_id>', methods=['DELETE'])
@jwt_required()
def delete_coupon_route(coupon_id):
    current_user_id = get_jwt_identity()
    return delete_coupon(coupon_id=coupon_id, user_id=current_user_id)
