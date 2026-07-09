from flask import request, jsonify, send_file
from flask_jwt_extended import create_access_token, get_jwt_identity
from app.config.db import db
from app.models.user_model import User
from app.utils.password_hash import hash_password, verify_password
import os
import urllib.request
import urllib.parse
import json
import base64
import random
from datetime import datetime, timedelta


def signup():
    """Register a new user with role selection."""
    data = request.get_json()
    
    # Validate required fields
    required_fields = ['email', 'password', 'name', 'role']
    for field in required_fields:
        if not data.get(field):
            return jsonify({'error': f'"{field}" is required'}), 400
    
    email = data['email'].strip().lower()
    password = data['password']
    name = data['name'].strip()
    role = data['role'].strip().lower()
    phone = data.get('phone', '').strip()
    
    # Validate role
    if role not in User.VALID_ROLES:
        return jsonify({
            'error': f'Invalid role. Must be one of: {", ".join(User.VALID_ROLES)}'
        }), 400
        
    # Validate seller specific fields
    if role == 'seller':
        seller_fields = [
            'shop_name', 'shop_license', 'shop_license_image', 'shop_location', 'shop_type',
            'shop_owner_name', 'shop_address', 'gps_location', 'aadhaar_card', 'pan_card',
            'bank_account_details', 'shop_logo', 'shop_front_image'
        ]
        for field in seller_fields:
            if not data.get(field):
                return jsonify({'error': f'"{field}" is required for seller registration'}), 400
        
        shop_type_val = data['shop_type'].strip().lower()
        if shop_type_val not in ['food', 'grocery']:
            return jsonify({'error': 'shop_type must be either "Food" or "Grocery"'}), 400
            
        if shop_type_val == 'food':
            if not data.get('veg_nonveg'):
                return jsonify({'error': '"veg_nonveg" preference is required for food shop type'}), 400
            veg_nonveg_val = data['veg_nonveg'].strip().lower()
            if veg_nonveg_val not in ['veg', 'non-veg', 'both']:
                return jsonify({'error': 'veg_nonveg must be either "veg", "non-veg", or "both"'}), 400

    # Validate delivery partner specific fields
    if role == 'delivery':
        delivery_fields = [
            'profile_photo', 'aadhaar_card', 'aadhaar_front_image', 'aadhaar_back_image',
            'pan_card', 'pan_card_image', 'live_selfie_image', 'driving_license_number',
            'driving_license_image', 'vehicle_type', 'vehicle_number', 'rc_book_image',
            'vehicle_insurance_image', 'current_address', 'city', 'state', 'pin_code',
            'bank_account_holder_name', 'bank_name', 'bank_account_number', 'bank_ifsc_code',
            'preferred_delivery_area', 'work_type', 'emergency_contact_name',
            'emergency_contact_phone', 'emergency_contact_relationship'
        ]
        for field in delivery_fields:
            if not data.get(field):
                return jsonify({'error': f'"{field}" is required for delivery partner registration'}), 400
        
        vehicle_type_val = data['vehicle_type'].strip().lower()
        if vehicle_type_val not in ['bike', 'scooter']:
            return jsonify({'error': 'vehicle_type must be either "bike" or "scooter"'}), 400
    
    # Validate password length
    if len(password) < 6:
        return jsonify({'error': 'Password must be at least 6 characters'}), 400
    
    # Check if user already exists
    existing_user = User.query.filter_by(email=email).first()
    if existing_user:
        return jsonify({'error': 'An account with this email already exists'}), 409
    
    # Create new user
    new_user = User(
        email=email,
        password_hash=hash_password(password),
        name=name,
        role=role,
        phone=phone,
        firebase_uid=data.get('firebase_uid'),
        shop_name=data.get('shop_name', '').strip() if role == 'seller' else None,
        vehicle_number=data.get('vehicle_number', '').strip() if role in ['delivery', 'seller'] else None,
        shop_license=data.get('shop_license', '').strip() if role == 'seller' else None,
        shop_license_image=data.get('shop_license_image', '').strip() if role == 'seller' else None,
        shop_location=data.get('shop_location', '').strip() if role == 'seller' else None,
        shop_type=data.get('shop_type', '').strip().lower() if role == 'seller' else None,
        shop_owner_name=data.get('shop_owner_name', '').strip() if role == 'seller' else None,
        shop_address=data.get('shop_address', '').strip() if role == 'seller' else None,
        gps_location=data.get('gps_location', '').strip() if role == 'seller' else None,
        aadhaar_card=data.get('aadhaar_card', '').strip() if role in ['seller', 'delivery'] else None,
        pan_card=data.get('pan_card', '').strip() if role in ['seller', 'delivery'] else None,
        bank_account_details=data.get('bank_account_details', '').strip() if role == 'seller' else None,
        shop_logo=data.get('shop_logo', '').strip() if role == 'seller' else None,
        shop_front_image=data.get('shop_front_image', '').strip() if role == 'seller' else None,
        veg_nonveg=data.get('veg_nonveg', '').strip().lower() if (role == 'seller' and data.get('shop_type') == 'food') else None,
        
        # Delivery fields
        profile_photo=data.get('profile_photo', '').strip() if role == 'delivery' else None,
        aadhaar_front_image=data.get('aadhaar_front_image', '').strip() if role == 'delivery' else None,
        aadhaar_back_image=data.get('aadhaar_back_image', '').strip() if role == 'delivery' else None,
        pan_card_image=data.get('pan_card_image', '').strip() if role == 'delivery' else None,
        live_selfie_image=data.get('live_selfie_image', '').strip() if role == 'delivery' else None,
        driving_license_number=data.get('driving_license_number', '').strip() if role == 'delivery' else None,
        driving_license_image=data.get('driving_license_image', '').strip() if role == 'delivery' else None,
        vehicle_type=data.get('vehicle_type', '').strip().lower() if role == 'delivery' else None,
        rc_book_image=data.get('rc_book_image', '').strip() if role == 'delivery' else None,
        vehicle_insurance_image=data.get('vehicle_insurance_image', '').strip() if role == 'delivery' else None,
        current_address=data.get('current_address', '').strip() if role == 'delivery' else None,
        city=data.get('city', '').strip() if role == 'delivery' else None,
        state=data.get('state', '').strip() if role == 'delivery' else None,
        pin_code=data.get('pin_code', '').strip() if role == 'delivery' else None,
        bank_account_holder_name=data.get('bank_account_holder_name', '').strip() if role == 'delivery' else None,
        bank_name=data.get('bank_name', '').strip() if role == 'delivery' else None,
        bank_account_number=data.get('bank_account_number', '').strip() if role == 'delivery' else None,
        bank_ifsc_code=data.get('bank_ifsc_code', '').strip() if role == 'delivery' else None,
        preferred_delivery_area=data.get('preferred_delivery_area', '').strip() if role == 'delivery' else None,
        languages_known=data.get('languages_known', '').strip() if role == 'delivery' else None,
        work_type=data.get('work_type', '').strip() if role == 'delivery' else None,
        emergency_contact_name=data.get('emergency_contact_name', '').strip() if role == 'delivery' else None,
        emergency_contact_phone=data.get('emergency_contact_phone', '').strip() if role == 'delivery' else None,
        emergency_contact_relationship=data.get('emergency_contact_relationship', '').strip() if role == 'delivery' else None,
    )
    
    db.session.add(new_user)
    db.session.commit()
    
    # Sync with Firestore users collection if initialized
    from app.config.firebase_config import get_firestore_db
    db_firestore = get_firestore_db()
    if db_firestore:
        try:
            user_data = new_user.to_dict()
            user_data['password_hash'] = new_user.password_hash
            db_firestore.collection('users').document(str(new_user.id)).set(user_data)
            print(f"[Firestore] User {new_user.email} successfully written to Firestore.")
        except Exception as fe:
            print(f"[ERROR] Failed to save user to Firestore: {fe}")
            
    # Generate JWT token
    access_token = create_access_token(identity=str(new_user.id))
    
    # Send seller onboarding license email if the role is seller
    if role == 'seller':
        try:
            from app.utils.email_service import send_seller_license_email
            send_seller_license_email(new_user)
        except Exception as mail_err:
            print(f"[ERROR] Failed to initiate seller license email sending: {mail_err}")
            
    return jsonify({
        'message': 'Account created successfully',
        'token': access_token,
        'user': new_user.to_dict()
    }), 201


def login():
    """Authenticate user and return JWT token."""
    data = request.get_json()
    
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')
    
    if not email or not password:
        return jsonify({'error': 'Email and password are required'}), 400
    
    # Find user
    user = User.query.filter_by(email=email).first()
    if not user:
        return jsonify({'error': 'Invalid email or password'}), 401
    
    # Verify password
    if not verify_password(password, user.password_hash):
        return jsonify({'error': 'Invalid email or password'}), 401
    
    # Check if active
    if not user.is_active:
        return jsonify({'error': 'Your account has been deactivated. Contact support.'}), 403
    
    # Generate JWT token
    access_token = create_access_token(identity=str(user.id))
    
    return jsonify({
        'message': 'Login successful',
        'token': access_token,
        'user': user.to_dict()
    }), 200


def get_current_user():
    """Get the currently authenticated user's profile."""
    current_user_id = get_jwt_identity()
    user = User.query.get(int(current_user_id))
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    return jsonify({'user': user.to_dict()}), 200


def get_sellers():
    """Get all sellers."""
    sellers = User.query.filter_by(role='seller').all()
    return jsonify({'sellers': [s.to_dict() for s in sellers]}), 200


def logout():
    """Logout the current user (client-side token removal)."""
    return jsonify({'message': 'Logged out successfully'}), 200


def google_auth():
    """Authenticate or register user using Google/Firebase token."""
    import uuid
    import firebase_admin
    from firebase_admin import auth as firebase_auth
    
    data = request.get_json()
    token = data.get('token')
    role = data.get('role', 'buyer').strip().lower()
    name = data.get('name', '').strip()
    email = data.get('email', '').strip().lower()
    phone = data.get('phone', '').strip()
    shop_name = data.get('shop_name', '').strip()
    vehicle_number = data.get('vehicle_number', '').strip()
    
    # Validate role
    if role not in User.VALID_ROLES:
        role = 'buyer'
        
    # Attempt Firebase token verification if firebase is initialized
    # If the token is a mock/simulation, we will gracefully use email/name directly from request
    firebase_verified = False
    if firebase_admin._apps and token and not token.startswith("mock-google-token-"):
        try:
            decoded_token = firebase_auth.verify_id_token(token)
            email = decoded_token.get('email', email).lower()
            name = decoded_token.get('name', name)
            firebase_verified = True
            print(f"[Firebase] Firebase token verified successfully for: {email}")
        except Exception as e:
            print(f"[Firebase Warning] Firebase ID token verification failed: {e}. Attempting fallback.")
            
    # Fallback to using request payload directly (useful for local development without firebase admin key)
    if not email:
        return jsonify({'error': 'Email is required for Google login'}), 400
        
    # Check if user already exists
    user = User.query.filter_by(email=email).first()
    
    if not user:
        # User doesn't exist, register them
        dummy_password = str(uuid.uuid4())
        user = User(
            email=email,
            password_hash=hash_password(dummy_password),
            name=name or email.split('@')[0],
            role=role,
            phone=phone,
            shop_name=shop_name if role == 'seller' else None,
            vehicle_number=vehicle_number if role == 'delivery' else None,
        )
        db.session.add(user)
        db.session.commit()
        status_code = 201
    else:
        status_code = 200
        # If user exists but is inactive
        if not user.is_active:
            return jsonify({'error': 'Your account has been deactivated. Contact support.'}), 403
            
    # Generate JWT token
    access_token = create_access_token(identity=str(user.id))
    
    return jsonify({
        'message': 'Google authentication successful',
        'token': access_token,
        'user': user.to_dict()
    }), status_code


# In-memory store for phone OTPs
# Structure: { phone_number: { "code": "123456", "expires_at": datetime } }
otp_store = {}


def send_sms_via_twilio(to_number, body):
    account_sid = os.getenv("TWILIO_ACCOUNT_SID")
    auth_token = os.getenv("TWILIO_AUTH_TOKEN")
    from_number = os.getenv("TWILIO_PHONE_NUMBER")
    
    if not account_sid or not auth_token or not from_number:
        print("[TWILIO WARNING] Twilio credentials not fully set in .env. Falling back to console logging.")
        return False

    try:
        url = f"https://api.twilio.com/2010-04-01/Accounts/{account_sid}/Messages.json"
        data = {
            'From': from_number,
            'To': to_number,
            'Body': body
        }
        encoded_data = urllib.parse.urlencode(data).encode('utf-8')
        req = urllib.request.Request(url, data=encoded_data, method='POST')
        
        # Add Basic Auth Header
        auth_str = f"{account_sid}:{auth_token}"
        auth_b64 = base64.b64encode(auth_str.encode('utf-8')).decode('utf-8')
        req.add_header("Authorization", f"Basic {auth_b64}")
        req.add_header("Content-Type", "application/x-www-form-urlencoded")
        
        with urllib.request.urlopen(req, timeout=10) as response:
            res_data = json.loads(response.read().decode('utf-8'))
            print(f"[TWILIO SUCCESS] SMS sent via Twilio to {to_number}: SID={res_data.get('sid')}")
            return True
    except Exception as e:
        print(f"[TWILIO ERROR] Failed to send SMS to {to_number}: {e}")
        return False


def send_otp():
    """Generate and send OTP via Twilio SMS or fallback to console simulation."""
    data = request.get_json()
    phone = data.get('phone', '').strip().replace(' ', '')
    
    if not phone:
        return jsonify({'error': 'Phone number is required'}), 400
        
    # Format to E.164 if it's 10 digits and has no country code (default to +91)
    if not phone.startswith('+'):
        if len(phone) == 10 and phone.isdigit():
            phone = '+91' + phone
        else:
            return jsonify({'error': 'Phone number must include country code (e.g. +91XXXXXXXXXX)'}), 400

    # Generate 6-digit random code
    otp_code = f"{random.randint(100000, 999999)}"
    expires_at = datetime.utcnow() + timedelta(minutes=5)
    
    # Store in memory
    otp_store[phone] = {
        'code': otp_code,
        'expires_at': expires_at
    }
    
    message_body = f"Your FreshKart verification code is: {otp_code}. Valid for 5 minutes."
    
    # Send SMS
    success = send_sms_via_twilio(phone, message_body)
    
    if success:
        return jsonify({
            'message': 'OTP sent successfully via Twilio SMS',
            'mode': 'real'
        }), 200
    else:
        # Fallback simulation
        print(f"\n[SMS OTP SIMULATION] SMS to {phone}: '{message_body}'\n")
        return jsonify({
            'message': 'Twilio credentials not configured. OTP generated in console simulation mode.',
            'mode': 'simulation',
            'simulated_otp': otp_code  # For ease of frontend developers/tests
        }), 200


def verify_otp():
    """Verify the phone OTP code."""
    data = request.get_json()
    phone = data.get('phone', '').strip().replace(' ', '')
    code = data.get('code', '').strip()
    
    if not phone or not code:
        return jsonify({'error': 'Phone number and verification code are required'}), 400
        
    if not phone.startswith('+'):
        if len(phone) == 10 and phone.isdigit():
            phone = '+91' + phone
            
    otp_data = otp_store.get(phone)
    if not otp_data:
        return jsonify({'error': 'No OTP requested for this phone number. Please request a new one.'}), 400
        
    # Check expiry
    if datetime.utcnow() > otp_data['expires_at']:
        # Clean up expired entry
        otp_store.pop(phone, None)
        return jsonify({'error': 'OTP code has expired. Please click Resend.'}), 400
        
    # Check code match
    if otp_data['code'] == code:
        # Success, clear it from memory so it can't be reused
        otp_store.pop(phone, None)
        return jsonify({'message': 'Phone number verified successfully!'}), 200
    else:
        return jsonify({'error': 'Invalid verification code. Please check your SMS and try again.'}), 400

def get_users_by_role():
    """Retrieve all users filtered by role query parameter."""
    role = request.args.get('role')
    if not role:
        return jsonify({'error': 'role parameter is required'}), 400
        
    if role not in User.VALID_ROLES:
        return jsonify({'error': f'Invalid role. Must be one of: {", ".join(User.VALID_ROLES)}'}), 400
        
    try:
        users = User.query.filter_by(role=role).all()
        return jsonify({'users': [u.to_dict() for u in users]}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


def update_profile():
    """Update the current user's profile details."""
    current_user_id = get_jwt_identity()
    user = User.query.get(int(current_user_id))
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
        
    data = request.get_json()
    
    if 'name' in data:
        user.name = data['name'].strip()
    if 'phone' in data:
        user.phone = data['phone'].strip()
        
    if user.role == 'seller':
        if 'shop_name' in data:
            user.shop_name = data['shop_name'].strip()
        if 'shop_license' in data:
            user.shop_license = data['shop_license'].strip()
        if 'shop_license_image' in data:
            user.shop_license_image = data['shop_license_image'].strip()
        if 'shop_location' in data:
            user.shop_location = data['shop_location'].strip()
        if 'shop_type' in data:
            shop_type = data['shop_type'].strip().lower()
            if shop_type in ['food', 'grocery']:
                user.shop_type = shop_type
        if 'shop_owner_name' in data:
            user.shop_owner_name = data['shop_owner_name'].strip()
        if 'shop_address' in data:
            user.shop_address = data['shop_address'].strip()
        if 'gps_location' in data:
            user.gps_location = data['gps_location'].strip()
        if 'aadhaar_card' in data:
            user.aadhaar_card = data['aadhaar_card'].strip()
        if 'pan_card' in data:
            user.pan_card = data['pan_card'].strip()
        if 'bank_account_details' in data:
            user.bank_account_details = data['bank_account_details'].strip()
        if 'shop_logo' in data:
            user.shop_logo = data['shop_logo'].strip()
        if 'shop_front_image' in data:
            user.shop_front_image = data['shop_front_image'].strip()
        if 'veg_nonveg' in data:
            veg_nonveg = data['veg_nonveg'].strip().lower()
            if veg_nonveg in ['veg', 'non-veg', 'both']:
                user.veg_nonveg = veg_nonveg
        if 'cuisine_type' in data:
            user.cuisine_type = data['cuisine_type'].strip() if data['cuisine_type'] else None
        if 'operating_hours' in data:
            user.operating_hours = data['operating_hours'].strip() if data['operating_hours'] else None
        if 'shop_interior_image' in data:
            user.shop_interior_image = data['shop_interior_image'].strip() if data['shop_interior_image'] else None
        if 'shop_kitchen_image' in data:
            user.shop_kitchen_image = data['shop_kitchen_image'].strip() if data['shop_kitchen_image'] else None
        if 'gstin' in data:
            user.gstin = data['gstin'].strip() if data['gstin'] else None
        if 'cancelled_cheque_image' in data:
            user.cancelled_cheque_image = data['cancelled_cheque_image'].strip() if data['cancelled_cheque_image'] else None
        if 'trademark_certificate' in data:
            user.trademark_certificate = data['trademark_certificate'].strip() if data['trademark_certificate'] else None
        if 'category_manager_approval' in data:
            user.category_manager_approval = bool(data['category_manager_approval'])
            
    if user.role == 'delivery':
        for field in [
            'vehicle_number', 'profile_photo', 'aadhaar_front_image', 'aadhaar_back_image',
            'pan_card_image', 'live_selfie_image', 'driving_license_number', 'driving_license_image',
            'vehicle_type', 'rc_book_image', 'vehicle_insurance_image', 'current_address',
            'city', 'state', 'pin_code', 'bank_account_holder_name', 'bank_name',
            'bank_account_number', 'bank_ifsc_code', 'preferred_delivery_area', 'languages_known',
            'work_type', 'emergency_contact_name', 'emergency_contact_phone', 'emergency_contact_relationship',
            'category_manager_approval', 'aadhaar_card', 'pan_card'
        ]:
            if field in data:
                val = data[field]
                if isinstance(val, str):
                    val = val.strip()
                setattr(user, field, val)
                
    db.session.commit()
    
    # Sync with Firestore users collection if initialized
    from app.config.firebase_config import get_firestore_db
    db_firestore = get_firestore_db()
    if db_firestore:
        try:
            user_data = user.to_dict()
            user_data['password_hash'] = user.password_hash
            db_firestore.collection('users').document(str(user.id)).set(user_data)
            print(f"[Firestore] User {user.email} profile successfully updated in Firestore.")
        except Exception as fe:
            print(f"[ERROR] Failed to update user in Firestore: {fe}")
            
    return jsonify({
        'message': 'Profile updated successfully',
        'user': user.to_dict()
    }), 200

def download_license():
    """Generates and downloads the current seller's license as a PDF."""
    # Try getting token from authorization header first, then fallback to query param
    token = None
    auth_header = request.headers.get('Authorization')
    if auth_header and auth_header.startswith('Bearer '):
        token = auth_header.split(' ')[1]
    else:
        token = request.args.get('token')
        
    if not token:
        return jsonify({'error': 'Authorization token is required'}), 401
        
    try:
        from flask_jwt_extended import decode_token
        decoded = decode_token(token)
        current_user_id = decoded['sub']
    except Exception as jwt_err:
        print(f"[ERROR] JWT decode failed for license download: {jwt_err}")
        return jsonify({'error': 'Invalid or expired token'}), 401
        
    user = User.query.get(int(current_user_id))
    if not user:
        return jsonify({'error': 'User not found'}), 404
        
    if user.role != 'seller':
        return jsonify({'error': 'Only sellers have a business license certificate'}), 403
        
    try:
        from app.utils.license_generator import generate_license_pdf
        pdf_buffer = generate_license_pdf(user)
        
        # Send PDF file as response attachment
        filename = f"freshkart_license_{user.shop_name.replace(' ', '_').lower()}.pdf"
        return send_file(
            pdf_buffer,
            mimetype='application/pdf',
            as_attachment=True,
            download_name=filename,
            max_age=0
        )
    except Exception as e:
        print(f"[ERROR] Dynamic license PDF generation failed: {e}")
        return jsonify({'error': 'Could not generate license PDF'}), 500


def download_system_report_pdf():
    """Generates and downloads a comprehensive system PDF report of users and sales."""
    current_user_id = get_jwt_identity()
    user = User.query.get(int(current_user_id))
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
        
    if user.role != 'admin':
        return jsonify({'error': 'Unauthorized. Admin access required.'}), 403
        
    report_type = request.args.get('type', 'all')
    
    try:
        # 1. Fetch users from SQLite database
        buyers = [u.to_dict() for u in User.query.filter_by(role='buyer').all()]
        sellers = [u.to_dict() for u in User.query.filter_by(role='seller').all()]
        delivery_partners = [u.to_dict() for u in User.query.filter_by(role='delivery').all()]
        
        # 2. Fetch orders from local JSON database
        from app.models.order_model import OrderModel
        orders = OrderModel._read_local()
        
        # 3. Generate PDF
        from app.utils.report_generator import generate_system_report_pdf
        pdf_buffer = generate_system_report_pdf(buyers, sellers, delivery_partners, orders, report_type)
        
        # Format filename based on report_type
        prefix = f"freshkart_{report_type}_report" if report_type != 'all' else "freshkart_system_report"
        filename = f"{prefix}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"
        
        return send_file(
            pdf_buffer,
            mimetype='application/pdf',
            as_attachment=True,
            download_name=filename,
            max_age=0
        )
    except Exception as e:
        print(f"[ERROR] Admin system report generation failed: {e}")
        return jsonify({'error': f'Failed to generate system report: {str(e)}'}), 500


def upload_system_logo():
    """Uploads a new system logo and updates the active logo config."""
    current_user_id = get_jwt_identity()
    user = User.query.get(int(current_user_id))
    if not user or user.role != 'admin':
        return jsonify({'error': 'Unauthorized. Admin access required.'}), 403
        
    if 'file' not in request.files:
        return jsonify({'error': 'No file part in the request'}), 400
        
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
        
    try:
        import uuid
        from werkzeug.utils import secure_filename
        filename = secure_filename(file.filename)
        unique_filename = f"system_logo_{uuid.uuid4().hex[:8]}_{filename}"
        
        # Save to uploads folder
        base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
        uploads_dir = os.path.join(base_dir, 'uploads')
        os.makedirs(uploads_dir, exist_ok=True)
        file_path = os.path.join(uploads_dir, unique_filename)
        file.save(file_path)
        
        # Update config file
        config_path = os.path.join(base_dir, 'database', 'system_config.json')
        os.makedirs(os.path.dirname(config_path), exist_ok=True)
        
        config_data = {}
        if os.path.exists(config_path):
            with open(config_path, 'r', encoding='utf-8') as f:
                try:
                    config_data = json.load(f)
                except Exception:
                    pass
                    
        config_data['active_logo'] = unique_filename
        with open(config_path, 'w', encoding='utf-8') as f:
            json.dump(config_data, f, indent=2)
            
        return jsonify({'message': 'System logo uploaded successfully', 'active_logo': unique_filename}), 200
    except Exception as e:
        print(f"[ERROR] Failed to upload system logo: {e}")
        return jsonify({'error': str(e)}), 500




