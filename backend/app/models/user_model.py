from datetime import datetime
from app.config.firebase_config import get_firestore_db
import os
import json

class User:
    """User model for authentication — stored in Firebase Firestore with local JSON fallback."""
    
    VALID_ROLES = ['buyer', 'seller', 'admin', 'delivery']
    _local_path = os.path.join(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')), 'database', 'users.json')
    
    @staticmethod
    def _firestore_available():
        db = get_firestore_db()
        return db is not None
        
    @staticmethod
    def _ensure_local_store():
        os.makedirs(os.path.dirname(User._local_path), exist_ok=True)
        if not os.path.exists(User._local_path):
            with open(User._local_path, 'w', encoding='utf-8') as f:
                json.dump({}, f)

    @staticmethod
    def _read_local():
        User._ensure_local_store()
        with open(User._local_path, 'r', encoding='utf-8') as f:
            try:
                return json.load(f)
            except Exception:
                return {}

    @staticmethod
    def _write_local(data):
        User._ensure_local_store()
        with open(User._local_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, default=str, ensure_ascii=False, indent=2)
            
    def __init__(self, id=None, email=None, password_hash=None, role=None, name=None,
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
                 emergency_contact_relationship=None, created_at=None, is_active=True, **kwargs):
        self.id = str(id) if id else None
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
        
        if isinstance(created_at, str):
            try:
                self.created_at = datetime.fromisoformat(created_at)
            except ValueError:
                self.created_at = datetime.utcnow()
        else:
            self.created_at = created_at if created_at else datetime.utcnow()
            
        self.is_active = is_active
    
    @classmethod
    def get_by_id(cls, user_id):
        if cls._firestore_available():
            db_firestore = get_firestore_db()
            doc = db_firestore.collection('users').document(str(user_id)).get()
            if doc.exists:
                data = doc.to_dict()
                data['id'] = doc.id
                return cls.from_dict(data)
            return None
        else:
            data = cls._read_local()
            user_data = data.get(str(user_id))
            if user_data:
                user_data['id'] = str(user_id)
                return cls.from_dict(user_data)
            return None

    @classmethod
    def get_by_email(cls, email):
        if cls._firestore_available():
            db_firestore = get_firestore_db()
            docs = db_firestore.collection('users').where('email', '==', email).limit(1).stream()
            doc = next(docs, None)
            if doc:
                data = doc.to_dict()
                data['id'] = doc.id
                return cls.from_dict(data)
            return None
        else:
            data = cls._read_local()
            for uid, udata in data.items():
                if udata.get('email') == email:
                    udata['id'] = uid
                    return cls.from_dict(udata)
            return None

    @classmethod
    def get_all(cls):
        if cls._firestore_available():
            db_firestore = get_firestore_db()
            docs = db_firestore.collection('users').stream()
            return [doc.to_dict() | {'id': doc.id} for doc in docs]
        else:
            data = cls._read_local()
            results = []
            for uid, udata in data.items():
                udata['id'] = uid
                results.append(udata)
            return results

    @classmethod
    def from_dict(cls, data):
        """Deserialize from Firestore dictionary."""
        if not data:
            return None
        return cls(**data)
        
    def to_dict(self):
        """Serialize user to dictionary (excludes password)."""
        data = {
            'id': self.id,
            'email': self.email,
            'role': self.role,
            'name': self.name,
            'phone': self.phone,
            'firebase_uid': self.firebase_uid,
            'created_at': self.created_at.isoformat() if isinstance(self.created_at, datetime) else self.created_at,
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
        
    def to_db_dict(self):
        """Serialize user to dictionary including password for saving to DB."""
        data = self.to_dict()
        data['password_hash'] = self.password_hash
        return data
        
    def save(self):
        if self._firestore_available():
            db_firestore = get_firestore_db()
            db_firestore.collection('users').document(self.id).set(self.to_db_dict())
        else:
            data = self._read_local()
            data[self.id] = self.to_db_dict()
            self._write_local(data)
            
    def update(self, update_data=None):
        if update_data:
            for k, v in update_data.items():
                if hasattr(self, k):
                    setattr(self, k, v)
        self.save()
    
    def __repr__(self):
        return f'<User {self.email} ({self.role})>'
