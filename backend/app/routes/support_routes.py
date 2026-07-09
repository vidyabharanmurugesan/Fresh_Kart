from flask import Blueprint
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.controllers.support_controller import get_buyer_support_chat, get_admin_support_chats

support_bp = Blueprint('support', __name__, url_prefix='/api/support')

@support_bp.route('/buyer', methods=['GET'])
@jwt_required()
def get_buyer_support_chat_route():
    current_user_id = get_jwt_identity()
    return get_buyer_support_chat(buyer_id=current_user_id)

@support_bp.route('/admin/chats', methods=['GET'])
@jwt_required()
def get_admin_support_chats_route():
    return get_admin_support_chats()
