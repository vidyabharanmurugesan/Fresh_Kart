from flask import Blueprint
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.controllers.voice_controller import initiate_call, forward_call

voice_bp = Blueprint('voice', __name__, url_prefix='/api/voice')

@voice_bp.route('/call', methods=['POST'])
@jwt_required()
def initiate_call_route():
    current_user_id = get_jwt_identity()
    return initiate_call(delivery_partner_id=current_user_id)

@voice_bp.route('/forward', methods=['GET', 'POST'])
def forward_call_route():
    return forward_call()
