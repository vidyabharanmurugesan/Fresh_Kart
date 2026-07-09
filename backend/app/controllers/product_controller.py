from flask import jsonify, request
from app.models.product_model import ProductModel
import os
import uuid
from werkzeug.utils import secure_filename
import firebase_admin
from firebase_admin import storage


def create_product(seller_id):
    data = request.get_json()
    
    # Validation
    required_fields = ['name', 'price', 'category', 'stock_count']
    if not all(field in data for field in required_fields):
        return jsonify({'error': f'Missing required fields: {required_fields}'}), 400
        
    try:
        from app.models.user_model import User
        seller = User.query.get(int(seller_id))
        if not seller:
            return jsonify({'error': 'Seller not found'}), 404
            
        # Enforce seller shop type domain constraint
        shop_type = (seller.shop_type or 'food').lower()
        domain = data.get('domain', 'food').lower()
        
        if domain != shop_type:
            return jsonify({'error': f'Unauthorized: As a {shop_type} seller, you cannot upload {domain} products.'}), 403

        # Collect extra fields dynamically
        extra_fields = {k: v for k, v in data.items() if k not in ['seller_id', 'name', 'price', 'category', 'stock_count', 'image_url', 'domain']}

        product = ProductModel.create_product(
            seller_id=seller_id,
            name=data['name'],
            price=data['price'],
            category=data['category'],
            stock_count=data['stock_count'],
            image_url=data.get('image_url'),
            domain=domain,
            **extra_fields
        )
        return jsonify({'message': 'Product created successfully', 'product': product}), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

def get_seller_products(seller_id):
    try:
        from app.models.user_model import User
        seller = User.query.get(int(seller_id))
        
        # Enforce filtering by seller's shop_type if it is set
        domain = request.args.get('domain')
        if seller and seller.shop_type:
            domain = seller.shop_type
            
        products = ProductModel.get_products_by_seller(seller_id, domain=domain)
        return jsonify({'products': products}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


def get_all_products():
    try:
        domain = request.args.get('domain')
        products = ProductModel.get_all_products(domain=domain)
        return jsonify({'products': products}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

def update_product(product_id, seller_id):
    data = request.get_json()
    
    try:
        # Verify ownership
        product = ProductModel.get_product_by_id(product_id)
        if not product:
            return jsonify({'error': 'Product not found'}), 404
        if product['seller_id'] != seller_id:
            return jsonify({'error': 'Unauthorized to update this product'}), 403
            
        updated_product = ProductModel.update_product(product_id, data)
        return jsonify({'message': 'Product updated successfully', 'product': updated_product}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

def delete_product(product_id, seller_id):
    try:
        # Verify ownership
        product = ProductModel.get_product_by_id(product_id)
        if not product:
            return jsonify({'error': 'Product not found'}), 404
        if product['seller_id'] != seller_id:
            return jsonify({'error': 'Unauthorized to delete this product'}), 403
            
        ProductModel.delete_product(product_id)
        return jsonify({'message': 'Product deleted successfully'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


def upload_file():
    """Upload a file to Firebase Storage (if configured) or fallback to local storage."""
    if 'file' not in request.files:
        return jsonify({'error': 'No file part in the request'}), 400
        
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
        
    if file:
        filename = secure_filename(file.filename)
        # Prepend a UUID to avoid collisions
        unique_filename = f"{uuid.uuid4()}_{filename}"
        
        # Check if Firebase Storage is initialized
        if firebase_admin._apps:
            try:
                # Get the storage bucket
                bucket = storage.bucket()
                blob = bucket.blob(f"uploads/{unique_filename}")
                
                # Upload the file
                # Reset file pointer to start
                file.seek(0)
                blob.upload_from_file(file.stream, content_type=file.content_type)
                
                # Make the blob public
                blob.make_public()
                
                # Return the public URL
                public_url = blob.public_url
                print(f"[Upload] File uploaded successfully to Firebase Storage: {public_url}")
                return jsonify({'url': public_url}), 200
            except Exception as e:
                print(f"[ERROR] Failed to upload to Firebase Storage: {e}. Falling back to local.")
                
        # Fallback: Local uploads directory
        from flask import current_app
        upload_folder = current_app.config.get('UPLOAD_FOLDER', 'uploads')
        os.makedirs(upload_folder, exist_ok=True)
        file_path = os.path.join(upload_folder, unique_filename)
        file.seek(0)
        file.save(file_path)
        
        # Build local URL
        # We can construct the URL from the request host
        base_url = request.host_url.rstrip('/')
        local_url = f"{base_url}/uploads/{unique_filename}"
        print(f"[Upload] File saved locally: {local_url}")
        return jsonify({'url': local_url}), 200
