import os
import urllib.request
import urllib.parse
import json
import base64
from flask import jsonify, request
from app.models.order_model import OrderModel
from app.models.user_model import User

def initiate_call(delivery_partner_id):
    data = request.get_json() or {}
    order_id = data.get('order_id')
    role_to_call = data.get('role') # 'buyer' or 'seller'
    
    if not order_id or not role_to_call:
        return jsonify({'error': 'order_id and role are required'}), 400
        
    order = OrderModel.get_order_by_id(order_id)
    if not order:
        return jsonify({'error': 'Order not found'}), 404
        
    # Verify caller exists and is either a delivery partner or the assigned delivery partner for this order
    delivery = User.query.get(int(delivery_partner_id))
    if not delivery:
        return jsonify({'error': 'Caller user not found'}), 404
        
    is_assigned_driver = str(order.get('delivery_partner_id')) == str(delivery_partner_id)
    if delivery.role != 'delivery' and not is_assigned_driver:
        return jsonify({'error': 'Only delivery partners can initiate masked calls'}), 403
        
    # Get target user (buyer or seller)
    target_user_id = order.get('buyer_id') if role_to_call == 'buyer' else order.get('seller_id')
    if not target_user_id:
        return jsonify({'error': f'No {role_to_call} associated with this order'}), 400
        
    target_user = User.query.get(int(target_user_id))
    if not target_user:
        return jsonify({'error': f'{role_to_call.capitalize()} user not found'}), 404
        
    driver_phone = delivery.phone
    target_phone = target_user.phone
    
    if not driver_phone or not target_phone:
        return jsonify({'error': 'Phone numbers missing for one of the parties'}), 400
        
    # Format to E.164 if they don't have country code
    def format_phone(p):
        p = p.strip().replace(' ', '')
        if not p.startswith('+'):
            if len(p) == 10 and p.isdigit():
                p = '+91' + p
        return p
        
    driver_phone = format_phone(driver_phone)
    target_phone = format_phone(target_phone)
    
    account_sid = os.getenv("TWILIO_ACCOUNT_SID")
    auth_token = os.getenv("TWILIO_AUTH_TOKEN")
    from_number = os.getenv("TWILIO_PHONE_NUMBER")
    
    # Twilio callback URL
    base_url = request.host_url.rstrip('/')
    callback_url = f"{base_url}/api/voice/forward?to={urllib.parse.quote(target_phone)}"
    
    if not account_sid or not auth_token or not from_number:
        # Console simulation mode
        msg = f"[TWILIO VOICE SIMULATION] Bridging Call for Order #{order_id}: Delivery Partner ({driver_phone}) -> ({from_number or '+1234567890'}) -> {role_to_call.capitalize()} ({target_phone})"
        print(f"\n[Twilio Voice] {msg}\n")
        return jsonify({
            'message': 'Twilio credentials not configured. Voice call simulated in console.',
            'mode': 'simulation',
            'driver_phone': driver_phone,
            'target_phone': target_phone,
            'proxy_number': from_number or '+1234567890'
        }), 200
        
    try:
        # Call Twilio Calls API to dial the driver's phone
        url = f"https://api.twilio.com/2010-04-01/Accounts/{account_sid}/Calls.json"
        payload = {
            'From': from_number,
            'To': driver_phone,
            'Url': callback_url
        }
        encoded_data = urllib.parse.urlencode(payload).encode('utf-8')
        req = urllib.request.Request(url, data=encoded_data, method='POST')
        
        # Add authorization header
        auth_str = f"{account_sid}:{auth_token}"
        auth_b64 = base64.b64encode(auth_str.encode('utf-8')).decode('utf-8')
        req.add_header("Authorization", f"Basic {auth_b64}")
        req.add_header("Content-Type", "application/x-www-form-urlencoded")
        
        with urllib.request.urlopen(req, timeout=10) as response:
            res_data = json.loads(response.read().decode('utf-8'))
            print(f"[TWILIO CALL SUCCESS] Call initiated: SID={res_data.get('sid')}")
            return jsonify({
                'message': 'Call initiated successfully via Twilio.',
                'mode': 'real',
                'sid': res_data.get('sid')
            }), 200
            
    except Exception as e:
        print(f"[TWILIO CALL ERROR] Failed to initiate call: {e}")
        return jsonify({'error': f'Failed to connect call: {str(e)}'}), 500

def forward_call():
    """TwiML callback. Returns instruction to Twilio to dial the destination number."""
    to_number = request.args.get('to')
    if not to_number:
        return '<?xml version="1.0" encoding="UTF-8"?><Response><Say>Error. Destination number missing.</Say></Response>', 200, {'Content-Type': 'application/xml'}
        
    twiml = f'''<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say>Connecting your call to the customer. Please wait.</Say>
    <Dial>{to_number}</Dial>
</Response>
'''
    return twiml, 200, {'Content-Type': 'application/xml'}
