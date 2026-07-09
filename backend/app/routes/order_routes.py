from flask import Blueprint
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.controllers.order_controller import (
    place_order,
    get_seller_orders,
    get_buyer_orders,
    update_status,
    get_seller_customers,
    get_delivery_orders,
    assign_delivery,
    update_location,
    get_tracking,
    get_admin_orders,
    get_order_details,
    update_payment_status
)

order_bp = Blueprint('orders', __name__, url_prefix='/api/orders')

@order_bp.route('/', methods=['POST'])
@jwt_required()
def place_order_route():
    current_user_id = get_jwt_identity()
    return place_order(buyer_id=current_user_id)

@order_bp.route('/seller/customers', methods=['GET'])
@jwt_required()
def seller_customers_route():
    current_user_id = get_jwt_identity()
    return get_seller_customers(seller_id=current_user_id)

@order_bp.route('/seller', methods=['GET'])
@jwt_required()
def seller_orders_route():
    current_user_id = get_jwt_identity()
    return get_seller_orders(seller_id=current_user_id)

@order_bp.route('/buyer', methods=['GET'])
@jwt_required()
def buyer_orders_route():
    current_user_id = get_jwt_identity()
    return get_buyer_orders(buyer_id=current_user_id)

@order_bp.route('/<order_id>/status', methods=['PUT'])
@jwt_required()
def update_status_route(order_id):
    return update_status(order_id)

@order_bp.route('/delivery', methods=['GET'])
@jwt_required()
def delivery_orders_route():
    current_user_id = get_jwt_identity()
    from flask import request
    status = request.args.get('status')
    return get_delivery_orders(delivery_partner_id=current_user_id, status=status)

@order_bp.route('/<order_id>/assign', methods=['PUT'])
@jwt_required()
def assign_delivery_route(order_id):
    current_user_id = get_jwt_identity()
    return assign_delivery(order_id, delivery_partner_id=current_user_id)

@order_bp.route('/<order_id>/location', methods=['PUT'])
@jwt_required()
def update_location_route(order_id):
    current_user_id = get_jwt_identity()
    from flask import request
    data = request.get_json()
    return update_location(order_id, delivery_partner_id=current_user_id, lat=data.get('lat'), lng=data.get('lng'))

@order_bp.route('/<order_id>/tracking', methods=['GET'])
@jwt_required()
def get_tracking_route(order_id):
    return get_tracking(order_id)

@order_bp.route('/admin/all', methods=['GET'])
@jwt_required()
def admin_all_orders_route():
    return get_admin_orders()

@order_bp.route('/<order_id>', methods=['GET'])
@jwt_required()
def get_order_details_route(order_id):
    return get_order_details(order_id)

@order_bp.route('/<order_id>/payment', methods=['PUT'])
@jwt_required()
def update_payment_status_route(order_id):
    return update_payment_status(order_id)


