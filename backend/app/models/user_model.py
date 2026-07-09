from datetime import datetime
from app.config.db import db


class User(db.Model):
    """User model for authentication — stored in local persistent SQLite DB."""
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    email = db.Column(db.String(255), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(20), nullable=False)  # buyer, seller, admin, delivery
    name = db.Column(db.String(100), nullable=False)
    phone = db.Column(db.String(20), nullable=True)
    firebase_uid = db.Column(db.String(255), nullable=True, unique=True)
    shop_name = db.Column(db.String(150), nullable=True)  # For sellers
    vehicle_number = db.Column(db.String(20), nullable=True)  # For delivery
    shop_license = db.Column(db.String(255), nullable=True)  # For sellers
    shop_license_image = db.Column(db.String(500), nullable=True)  # For sellers
    shop_location = db.Column(db.String(255), nullable=True)  # For sellers
    shop_type = db.Column(db.String(50), nullable=True)  # For sellers (food or grocery)
    
    # Extended seller fields
    shop_owner_name = db.Column(db.String(150), nullable=True)
    shop_address = db.Column(db.String(500), nullable=True)
    gps_location = db.Column(db.String(255), nullable=True)
    aadhaar_card = db.Column(db.String(50), nullable=True)
    pan_card = db.Column(db.String(50), nullable=True)
    bank_account_details = db.Column(db.String(500), nullable=True)
    shop_logo = db.Column(db.String(500), nullable=True)
    shop_front_image = db.Column(db.String(500), nullable=True)
    veg_nonveg = db.Column(db.String(50), nullable=True)  # veg, non-veg, both
    
    # Food Onboarding Fields
    cuisine_type = db.Column(db.String(150), nullable=True)
    operating_hours = db.Column(db.String(150), nullable=True)
    shop_interior_image = db.Column(db.String(500), nullable=True)
    shop_kitchen_image = db.Column(db.String(500), nullable=True)
    
    # Grocery Onboarding Fields
    gstin = db.Column(db.String(50), nullable=True)
    cancelled_cheque_image = db.Column(db.String(500), nullable=True)
    trademark_certificate = db.Column(db.String(500), nullable=True)
    category_manager_approval = db.Column(db.Boolean, default=False)
    
    # Extended delivery partner fields
    profile_photo = db.Column(db.String(500), nullable=True)
    aadhaar_front_image = db.Column(db.String(500), nullable=True)
    aadhaar_back_image = db.Column(db.String(500), nullable=True)
    pan_card_image = db.Column(db.String(500), nullable=True)
    live_selfie_image = db.Column(db.String(500), nullable=True)
    driving_license_number = db.Column(db.String(100), nullable=True)
    driving_license_image = db.Column(db.String(500), nullable=True)
    vehicle_type = db.Column(db.String(50), nullable=True)
    rc_book_image = db.Column(db.String(500), nullable=True)
    vehicle_insurance_image = db.Column(db.String(500), nullable=True)
    current_address = db.Column(db.String(500), nullable=True)
    city = db.Column(db.String(100), nullable=True)
    state = db.Column(db.String(100), nullable=True)
    pin_code = db.Column(db.String(20), nullable=True)
    bank_account_holder_name = db.Column(db.String(150), nullable=True)
    bank_name = db.Column(db.String(150), nullable=True)
    bank_account_number = db.Column(db.String(100), nullable=True)
    bank_ifsc_code = db.Column(db.String(50), nullable=True)
    preferred_delivery_area = db.Column(db.String(255), nullable=True)
    languages_known = db.Column(db.String(255), nullable=True)
    work_type = db.Column(db.String(50), nullable=True)
    emergency_contact_name = db.Column(db.String(150), nullable=True)
    emergency_contact_phone = db.Column(db.String(20), nullable=True)
    emergency_contact_relationship = db.Column(db.String(100), nullable=True)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    is_active = db.Column(db.Boolean, default=True)
    
    VALID_ROLES = ['buyer', 'seller', 'admin', 'delivery']
    
    def __init__(self, email=None, password_hash=None, role=None, name=None,
                 phone=None, firebase_uid=None, shop_name=None, vehicle_number=None,
                 shop_license=None, shop_license_image=None, shop_location=None, shop_type=None,
                 shop_owner_name=None, shop_address=None, gps_location=None, aadhaar_card=None,
                 pan_card=None, bank_account_details=None, shop_logo=None, shop_front_image=None,
                 veg_nonveg=None, cuisine_type=None, operating_hours=None, shop_interior_image=None,
                 shop_kitchen_image=None, gstin=None, cancelled_cheque_image=None, trademark_certificate=None,
                 category_manager_approval=False, profile_photo=None, aadhaar_front_image=None,
                 aadhaar_back_image=None, pan_card_image=None, live_selfie_image=None, driving_license_number=None,
                 driving_license_image=None, vehicle_type=None, rc_book_image=None, vehicle_insurance_image=None,
                 current_address=None, city=None, state=None, pin_code=None, bank_account_holder_name=None,
                 bank_name=None, bank_account_number=None, bank_ifsc_code=None, preferred_delivery_area=None,
                 languages_known=None, work_type=None, emergency_contact_name=None, emergency_contact_phone=None,
                 emergency_contact_relationship=None, **kwargs):
        super().__init__(**kwargs)
        self.email = email
        self.password_hash = password_hash
        self.role = role
        self.name = name
        self.phone = phone
        self.firebase_uid = firebase_uid
        self.shop_name = shop_name
        self.vehicle_number = vehicle_number
        self.shop_license = shop_license
        self.shop_license_image = shop_license_image
        self.shop_location = shop_location
        self.shop_type = shop_type
        
        # Extended fields
        self.shop_owner_name = shop_owner_name
        self.shop_address = shop_address
        self.gps_location = gps_location
        self.aadhaar_card = aadhaar_card
        self.pan_card = pan_card
        self.bank_account_details = bank_account_details
        self.shop_logo = shop_logo
        self.shop_front_image = shop_front_image
        self.veg_nonveg = veg_nonveg
        self.cuisine_type = cuisine_type
        self.operating_hours = operating_hours
        self.shop_interior_image = shop_interior_image
        self.shop_kitchen_image = shop_kitchen_image
        self.gstin = gstin
        self.cancelled_cheque_image = cancelled_cheque_image
        self.trademark_certificate = trademark_certificate
        self.category_manager_approval = category_manager_approval
        
        # Delivery partner fields
        self.profile_photo = profile_photo
        self.aadhaar_front_image = aadhaar_front_image
        self.aadhaar_back_image = aadhaar_back_image
        self.pan_card_image = pan_card_image
        self.live_selfie_image = live_selfie_image
        self.driving_license_number = driving_license_number
        self.driving_license_image = driving_license_image
        self.vehicle_type = vehicle_type
        self.rc_book_image = rc_book_image
        self.vehicle_insurance_image = vehicle_insurance_image
        self.current_address = current_address
        self.city = city
        self.state = state
        self.pin_code = pin_code
        self.bank_account_holder_name = bank_account_holder_name
        self.bank_name = bank_name
        self.bank_account_number = bank_account_number
        self.bank_ifsc_code = bank_ifsc_code
        self.preferred_delivery_area = preferred_delivery_area
        self.languages_known = languages_known
        self.work_type = work_type
        self.emergency_contact_name = emergency_contact_name
        self.emergency_contact_phone = emergency_contact_phone
        self.emergency_contact_relationship = emergency_contact_relationship
    
    def to_dict(self):
        """Serialize user to dictionary (excludes password)."""
        data = {
            'id': self.id,
            'email': self.email,
            'role': self.role,
            'name': self.name,
            'phone': self.phone,
            'firebase_uid': self.firebase_uid,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'is_active': self.is_active
        }
        if self.role == 'seller':
            data['shop_name'] = self.shop_name
            data['shop_license'] = self.shop_license
            data['shop_license_image'] = self.shop_license_image
            data['shop_location'] = self.shop_location
            data['shop_type'] = self.shop_type
            
            # Extended fields
            data['shop_owner_name'] = self.shop_owner_name
            data['shop_address'] = self.shop_address
            data['gps_location'] = self.gps_location
            data['aadhaar_card'] = self.aadhaar_card
            data['pan_card'] = self.pan_card
            data['bank_account_details'] = self.bank_account_details
            data['shop_logo'] = self.shop_logo
            data['shop_front_image'] = self.shop_front_image
            data['veg_nonveg'] = self.veg_nonveg
            
            # Food fields
            data['cuisine_type'] = self.cuisine_type
            data['operating_hours'] = self.operating_hours
            data['shop_interior_image'] = self.shop_interior_image
            data['shop_kitchen_image'] = self.shop_kitchen_image
            
            # Grocery fields
            data['gstin'] = self.gstin
            data['cancelled_cheque_image'] = self.cancelled_cheque_image
            data['trademark_certificate'] = self.trademark_certificate
            data['category_manager_approval'] = self.category_manager_approval
            
        if self.role == 'delivery':
            data['vehicle_number'] = self.vehicle_number
            data['profile_photo'] = self.profile_photo
            data['aadhaar_card'] = self.aadhaar_card
            data['aadhaar_front_image'] = self.aadhaar_front_image
            data['aadhaar_back_image'] = self.aadhaar_back_image
            data['pan_card'] = self.pan_card
            data['pan_card_image'] = self.pan_card_image
            data['live_selfie_image'] = self.live_selfie_image
            data['driving_license_number'] = self.driving_license_number
            data['driving_license_image'] = self.driving_license_image
            data['vehicle_type'] = self.vehicle_type
            data['rc_book_image'] = self.rc_book_image
            data['vehicle_insurance_image'] = self.vehicle_insurance_image
            data['current_address'] = self.current_address
            data['city'] = self.city
            data['state'] = self.state
            data['pin_code'] = self.pin_code
            data['bank_account_holder_name'] = self.bank_account_holder_name
            data['bank_name'] = self.bank_name
            data['bank_account_number'] = self.bank_account_number
            data['bank_ifsc_code'] = self.bank_ifsc_code
            data['preferred_delivery_area'] = self.preferred_delivery_area
            data['languages_known'] = self.languages_known
            data['work_type'] = self.work_type
            data['emergency_contact_name'] = self.emergency_contact_name
            data['emergency_contact_phone'] = self.emergency_contact_phone
            data['emergency_contact_relationship'] = self.emergency_contact_relationship
            data['category_manager_approval'] = self.category_manager_approval
        return data
    
    def __repr__(self):
        return f'<User {self.email} ({self.role})>'
