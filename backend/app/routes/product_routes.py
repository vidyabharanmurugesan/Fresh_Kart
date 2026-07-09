from flask import Blueprint
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.controllers.product_controller import (
    create_product,
    get_seller_products,
    get_all_products,
    update_product,
    delete_product,
    upload_file
)

product_bp = Blueprint('products', __name__, url_prefix='/api/products')

# Note: get_jwt_identity() returns the user_id (which is the seller_id)

@product_bp.route('/', methods=['POST'])
@jwt_required()
def add_product_route():
    current_user_id = get_jwt_identity()
    return create_product(seller_id=current_user_id)

@product_bp.route('/seller', methods=['GET'])
@jwt_required()
def get_products_route():
    current_user_id = get_jwt_identity()
    return get_seller_products(seller_id=current_user_id)


# Public: get all products (used by buyer listing when no sellerId specified)
@product_bp.route('/all', methods=['GET'])
def get_all_products_route():
    return get_all_products()

@product_bp.route('/shop/<seller_id>', methods=['GET'])
@jwt_required()
def get_shop_products_route(seller_id):
    return get_seller_products(seller_id=seller_id)

@product_bp.route('/<product_id>', methods=['PUT'])
@jwt_required()
def update_product_route(product_id):
    current_user_id = get_jwt_identity()
    return update_product(product_id, seller_id=current_user_id)

@product_bp.route('/<product_id>', methods=['DELETE'])
@jwt_required()
def delete_product_route(product_id):
    current_user_id = get_jwt_identity()
    return delete_product(product_id, seller_id=current_user_id)

@product_bp.route('/upload', methods=['POST'])
@jwt_required()
def upload_product_image_route():
    return upload_file()
