from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()


def init_db(app):
    """Initialize the database with the Flask app."""
    db.init_app(app)
    with app.app_context():
        # Import models so they are registered with SQLAlchemy
        from app.models.user_model import User  # noqa: F401
        db.create_all()
        # Auto-migration fallback: add firebase_uid column if it doesn't exist in the SQLite users table
        try:
            db.session.execute(db.text("SELECT firebase_uid FROM users LIMIT 1"))
        except Exception:
            db.session.rollback()
            try:
                db.session.execute(db.text("ALTER TABLE users ADD COLUMN firebase_uid VARCHAR(255)"))
                db.session.commit()
                print("[OK] Auto-migrated: Added firebase_uid column to users table")
            except Exception as e:
                print(f"[ERROR] Failed to auto-migrate firebase_uid column: {e}")
                
        # Auto-migration fallback for seller specific details
        for col, col_type in [
            ('shop_license', 'VARCHAR(255)'),
            ('shop_license_image', 'VARCHAR(500)'),
            ('shop_location', 'VARCHAR(255)'),
            ('shop_type', 'VARCHAR(50)'),
            ('shop_owner_name', 'VARCHAR(150)'),
            ('shop_address', 'VARCHAR(500)'),
            ('gps_location', 'VARCHAR(255)'),
            ('aadhaar_card', 'VARCHAR(50)'),
            ('pan_card', 'VARCHAR(50)'),
            ('bank_account_details', 'VARCHAR(500)'),
            ('shop_logo', 'VARCHAR(500)'),
            ('shop_front_image', 'VARCHAR(500)'),
            ('veg_nonveg', 'VARCHAR(50)'),
            ('cuisine_type', 'VARCHAR(150)'),
            ('operating_hours', 'VARCHAR(150)'),
            ('shop_interior_image', 'VARCHAR(500)'),
            ('shop_kitchen_image', 'VARCHAR(500)'),
            ('gstin', 'VARCHAR(50)'),
            ('cancelled_cheque_image', 'VARCHAR(500)'),
            ('trademark_certificate', 'VARCHAR(500)'),
            ('category_manager_approval', 'BOOLEAN DEFAULT 0'),
            ('profile_photo', 'VARCHAR(500)'),
            ('aadhaar_front_image', 'VARCHAR(500)'),
            ('aadhaar_back_image', 'VARCHAR(500)'),
            ('pan_card_image', 'VARCHAR(500)'),
            ('live_selfie_image', 'VARCHAR(500)'),
            ('driving_license_number', 'VARCHAR(100)'),
            ('driving_license_image', 'VARCHAR(500)'),
            ('vehicle_type', 'VARCHAR(50)'),
            ('rc_book_image', 'VARCHAR(500)'),
            ('vehicle_insurance_image', 'VARCHAR(500)'),
            ('current_address', 'VARCHAR(500)'),
            ('city', 'VARCHAR(100)'),
            ('state', 'VARCHAR(100)'),
            ('pin_code', 'VARCHAR(20)'),
            ('bank_account_holder_name', 'VARCHAR(150)'),
            ('bank_name', 'VARCHAR(150)'),
            ('bank_account_number', 'VARCHAR(100)'),
            ('bank_ifsc_code', 'VARCHAR(50)'),
            ('preferred_delivery_area', 'VARCHAR(255)'),
            ('languages_known', 'VARCHAR(255)'),
            ('work_type', 'VARCHAR(50)'),
            ('emergency_contact_name', 'VARCHAR(150)'),
            ('emergency_contact_phone', 'VARCHAR(20)'),
            ('emergency_contact_relationship', 'VARCHAR(100)')
        ]:
            try:
                db.session.execute(db.text(f"SELECT {col} FROM users LIMIT 1"))
            except Exception:
                db.session.rollback()
                try:
                    db.session.execute(db.text(f"ALTER TABLE users ADD COLUMN {col} {col_type}"))
                    db.session.commit()
                    print(f"[OK] Auto-migrated: Added {col} column to users table")
                except Exception as e:
                    print(f"[ERROR] Failed to auto-migrate {col} column: {e}")
                    
        print("[OK] Local Auth Database initialized (SQLite)")
