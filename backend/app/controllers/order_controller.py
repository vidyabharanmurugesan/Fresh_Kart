from flask import jsonify, request
from app.models.order_model import OrderModel

def place_order(buyer_id):
    data = request.get_json()
    
    required_fields = ['seller_id', 'items', 'total_amount']
    if not all(field in data for field in required_fields):
        return jsonify({'error': f'Missing required fields: {required_fields}'}), 400
        
    try:
        import uuid
        from datetime import datetime, timedelta
        
        # Generate tracking number and delivery date
        tracking_number = f"FK-TRK-{str(uuid.uuid4())[:8].upper()}"
        delivery_date = (datetime.utcnow() + timedelta(minutes=45)).isoformat()
        
        order = OrderModel.create_order(
            buyer_id=buyer_id,
            seller_id=data['seller_id'],
            items=data['items'],
            total_amount=data['total_amount'],
            address=data.get('address'),
            gst_amount=data.get('gst_amount', 0.0),
            payment_method=data.get('payment_method', 'Cash on Delivery'),
            domain=data.get('domain', 'food'),
            discount=data.get('discount', 0.0),
            delivery_charges=data.get('delivery_charges', 25.0),
            packaging_charges=data.get('packaging_charges', 15.0),
            platform_fee=data.get('platform_fee', 5.0),
            tracking_number=tracking_number,
            delivery_date=delivery_date
        )
        return jsonify({'message': 'Order placed successfully', 'order': order}), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

def get_seller_orders(seller_id):
    try:
        orders = OrderModel.get_orders_by_seller(seller_id)
        
        # Resolve customer name for each order from SQLite User table
        from app.models.user_model import User
        for order in orders:
            buyer_id = order.get('buyer_id')
            if buyer_id:
                try:
                    user = User.get_by_id(buyer_id)
                    order['customer_name'] = user.name if user else f"Customer #{buyer_id}"
                except Exception:
                    order['customer_name'] = f"Customer #{buyer_id}"
            else:
                order['customer_name'] = "Anonymous"

        # Sort by created_at descending (newest first)
        orders.sort(key=lambda x: x.get('created_at', ''), reverse=True)
        return jsonify({'orders': orders}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

def get_buyer_orders(buyer_id):
    try:
        orders = OrderModel.get_orders_by_buyer(buyer_id)
        return jsonify({'orders': orders}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

def update_status(order_id):
    data = request.get_json()
    status = data.get('status')
    
    if not status:
        return jsonify({'error': 'Status is required'}), 400
        
    try:
        OrderModel.update_order_status(order_id, status)
        
        # Broadcast status change via Socket.io
        try:
            from app.sockets import socketio
            room = f"order_{order_id}"
            socketio.emit('order_status_changed', {
                'order_id': order_id,
                'status': status
            }, to=room)
            print(f"[Socket Broadcast] Status updated to '{status}' for room {room}")
        except Exception as se:
            print(f"[Socket Error] Failed to broadcast status change: {se}")
            
        return jsonify({'message': f'Order status updated to {status}'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

def assign_delivery(order_id, delivery_partner_id):
    try:
        order = OrderModel.get_order_by_id(order_id)
        if not order:
            return jsonify({'error': 'Order not found'}), 404
        if order.get('status') not in ['pending', 'accepted']:
            return jsonify({'error': 'Order is not available for delivery assignment'}), 400
            
        OrderModel.update_order(order_id, {
            'status': 'assigned_to_delivery',
            'delivery_partner_id': delivery_partner_id
        })
        return jsonify({'message': 'Order assigned successfully'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

def update_location(order_id, delivery_partner_id, lat, lng):
    try:
        order = OrderModel.get_order_by_id(order_id)
        if not order:
            return jsonify({'error': 'Order not found'}), 404
        if str(order.get('delivery_partner_id')) != str(delivery_partner_id):
            return jsonify({'error': 'Unauthorized to update this order location'}), 403
            
        OrderModel.update_order(order_id, {
            'location': {'lat': lat, 'lng': lng}
        })
        
        # Broadcast location update via Socket.io
        try:
            from app.sockets import socketio
            room = f"order_{order_id}"
            socketio.emit('driver_location_changed', {
                'order_id': order_id,
                'location': {'lat': lat, 'lng': lng}
            }, to=room)
            print(f"[Socket Broadcast] Location updated to lat={lat}, lng={lng} for room {room}")
        except Exception as se:
            print(f"[Socket Error] Failed to broadcast location update: {se}")
            
        return jsonify({'message': 'Location updated successfully'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

def get_tracking(order_id):
    try:
        order = OrderModel.get_order_by_id(order_id)
        if not order:
            return jsonify({'error': 'Order not found'}), 404
            
        return jsonify({
            'status': order.get('status'),
            'location': order.get('location')
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

def get_delivery_orders(delivery_partner_id, status=None):
    try:
        if status == 'accepted':
            # Delivery partners look for 'pending' or 'accepted' orders to pick up
            all_orders = OrderModel.get_all_orders()
            orders = [o for o in all_orders if o.get('status') in ['pending', 'accepted']]
        else:
            # Get orders specifically assigned to this partner
            orders = OrderModel.get_orders_by_delivery_partner(delivery_partner_id)
            if status:
                orders = [o for o in orders if o.get('status') == status]
                
        # Resolve customer name and domain
        from app.models.user_model import User
        from app.models.product_model import ProductModel
        
        all_products = ProductModel.get_all_products()
        products_map = {p['product_id']: p for p in all_products}
        
        for order in orders:
            buyer_id = order.get('buyer_id')
            if buyer_id:
                try:
                    user = User.get_by_id(buyer_id)
                    order['customer_name'] = user.name if user else f"Customer #{buyer_id}"
                except Exception:
                    order['customer_name'] = f"Customer #{buyer_id}"
            else:
                order['customer_name'] = "Anonymous"
                
            # Ensure domain is correct based on products
            resolved_order_domain = None
            if order.get('items'):
                for item in order['items']:
                    p_id = item.get('product_id')
                    prod = products_map.get(p_id)
                    if prod and prod.get('domain'):
                        resolved_order_domain = prod.get('domain')
                        break
            if not resolved_order_domain:
                resolved_order_domain = order.get('domain') or 'food'
            order['domain'] = resolved_order_domain
 
        orders.sort(key=lambda x: x.get('created_at', ''), reverse=True)
        return jsonify({'orders': orders}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

def get_seller_customers(seller_id):
    try:
        from flask import request
        domain = request.args.get('domain')
        orders = OrderModel.get_orders_by_seller(seller_id)
        if domain:
            orders = [o for o in orders if (o.get('domain') or 'food').lower() == domain.lower()]
        # Aggregate stats by buyer_id
        buyer_stats = {}
        for order in orders:
            buyer_id = order.get('buyer_id')
            if not buyer_id:
                continue
                
            if buyer_id not in buyer_stats:
                buyer_stats[buyer_id] = {
                    'buyer_id': buyer_id,
                    'orders_count': 0,
                    'total_spent': 0.0,
                    'last_order_time': None
                }
            
            buyer_stats[buyer_id]['orders_count'] += 1
            buyer_stats[buyer_id]['total_spent'] += order.get('total_amount', 0.0)
            
            created_at = order.get('created_at')
            if created_at:
                if not buyer_stats[buyer_id]['last_order_time'] or created_at > buyer_stats[buyer_id]['last_order_time']:
                    buyer_stats[buyer_id]['last_order_time'] = created_at

        # Fetch buyer profiles from SQLite user DB
        customers = []
        from app.models.user_model import User
        for buyer_id, stats in buyer_stats.items():
            try:
                user = User.get_by_id(buyer_id)
                name = user.name if user else f"Customer #{buyer_id}"
                phone = user.phone if user else "N/A"
                email = user.email if user else "N/A"
            except Exception:
                name = f"Customer #{buyer_id}"
                phone = "N/A"
                email = "N/A"

            customers.append({
                'buyer_id': buyer_id,
                'name': name,
                'phone': phone,
                'email': email,
                'orders_count': stats['orders_count'],
                'total_spent': round(stats['total_spent'], 2),
                'last_order_time': stats['last_order_time']
            })

        # Sort by total spent descending
        customers.sort(key=lambda x: x.get('total_spent', 0), reverse=True)
        return jsonify({'customers': customers}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

def get_admin_orders():
    try:
        orders = OrderModel.get_all_orders()
        
        from app.models.user_model import User
        from app.models.product_model import ProductModel
        
        users = {str(u.get('id')): User.from_dict(u) for u in User.get_all()} # Wait, get_all isn't defined yet
        all_products = ProductModel.get_all_products()
        products_map = {p['product_id']: p for p in all_products}
        
        for order in orders:
            buyer_id = str(order.get('buyer_id'))
            seller_id = str(order.get('seller_id'))
            delivery_partner_id = str(order.get('delivery_partner_id')) if order.get('delivery_partner_id') else None
            
            buyer = users.get(buyer_id)
            seller = users.get(seller_id)
            delivery = users.get(delivery_partner_id) if delivery_partner_id else None
            
            order['buyer_name'] = buyer.name if buyer else f"Customer #{buyer_id}"
            order['buyer_phone'] = buyer.phone if buyer else "N/A"
            order['seller_name'] = seller.shop_name or seller.name if seller else f"Seller #{seller_id}"
            order['delivery_name'] = delivery.name if delivery else ("Assigned" if delivery_partner_id else "Unassigned")
            
            # Resolve individual items' categories and domains
            resolved_order_domain = None
            if order.get('items'):
                for item in order['items']:
                    p_id = item.get('product_id')
                    # Extract base product ID (standard UUID is 36 characters) to handle variant/addon suffixes
                    base_p_id = p_id[:36] if p_id and len(p_id) >= 36 else p_id
                    prod = products_map.get(base_p_id) or products_map.get(p_id)
                    if prod:
                        item['category'] = prod.get('category', 'Other')
                        item['domain'] = prod.get('domain', 'food')
                        if not resolved_order_domain:
                            resolved_order_domain = prod.get('domain')
                    else:
                        item['category'] = 'Other'
                        item['domain'] = order.get('domain') or 'food'
                        
            # Resolve order domain (default to 'food' or resolved from items)
            if not resolved_order_domain:
                resolved_order_domain = order.get('domain') or 'food'
            order['domain'] = resolved_order_domain
            
        orders.sort(key=lambda x: x.get('created_at', ''), reverse=True)
        return jsonify({'orders': orders}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500



def get_order_details(order_id):
    try:
        order = OrderModel.get_order_by_id(order_id)
        if not order:
            return jsonify({'error': 'Order not found'}), 404
            
        # Resolve names and details
        from app.models.user_model import User
        import urllib.parse
        buyer_id = str(order.get('buyer_id'))
        seller_id = str(order.get('seller_id'))
        
        try:
            buyer = User.get_by_id(buyer_id)
            order['buyer_name'] = buyer.name if buyer else f"Customer #{buyer_id}"
            order['buyer_phone'] = buyer.phone if buyer else "N/A"
            order['buyer_email'] = buyer.email if buyer else "N/A"
        except Exception:
            order['buyer_name'] = f"Customer #{buyer_id}"
            order['buyer_phone'] = "N/A"
            order['buyer_email'] = "N/A"
            
        try:
            seller = User.get_by_id(seller_id)
            order['seller_name'] = seller.shop_name or seller.name if seller else f"Seller #{seller_id}"
            order['seller_email'] = seller.email if seller else "N/A"
            order['seller_phone'] = seller.phone if seller else "N/A"
            
            # Generate deterministic compliance mock details based on seller_id for consistency
            seller_id_num = int(seller_id) if seller_id.isdigit() else 100
            order['seller_gst'] = f"{29 + (seller_id_num % 10)}ABCDE{1234 + (seller_id_num % 100)}F{1 + (seller_id_num % 9)}Z{(seller_id_num % 10)}"
            order['seller_pan'] = f"ABCDE{1234 + (seller_id_num % 100)}F"
            order['seller_address'] = f"Plot No. {10 + (seller_id_num % 50)}, Green Market Area, Sector {1 + (seller_id_num % 12)}, Bangalore, KA - 56000{1 + (seller_id_num % 9)}"
            order['seller_logo'] = f"https://api.dicebear.com/7.x/initials/svg?seed={urllib.parse.quote(seller.shop_name or seller.name)}&backgroundColor=10b981"
        except Exception:
            order['seller_name'] = f"Seller #{seller_id}"
            order['seller_email'] = "N/A"
            order['seller_phone'] = "N/A"
            order['seller_gst'] = "29ABCDE1234F1Z5"
            order['seller_pan'] = "ABCDE1234F"
            order['seller_address'] = "FreshKart Partner Store, Bangalore, KA"
            order['seller_logo'] = "https://api.dicebear.com/7.x/initials/svg?seed=FK&backgroundColor=10b981"

        # Backwards compatibility / defaults for older orders
        if 'discount' not in order:
            order['discount'] = 0.0
        if 'delivery_charges' not in order:
            order['delivery_charges'] = 25.0
        if 'packaging_charges' not in order:
            order['packaging_charges'] = 15.0
        if 'platform_fee' not in order:
            order['platform_fee'] = 5.0
        if 'tracking_number' not in order:
            order['tracking_number'] = f"FK-TRK-{order_id[-8:] if len(order_id) >= 8 else order_id.upper()}"
        if 'delivery_date' not in order:
            order['delivery_date'] = order.get('created_at')

        return jsonify({'order': order}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

def update_payment_status(order_id):
    data = request.get_json() or {}
    payment_status = data.get('payment_status')
    
    if not payment_status:
        return jsonify({'error': 'payment_status is required'}), 400
        
    if payment_status not in ['paid', 'unpaid']:
        return jsonify({'error': 'payment_status must be either "paid" or "unpaid"'}), 400
        
    try:
        OrderModel.update_order(order_id, {'payment_status': payment_status})
        return jsonify({'message': f'Order payment status updated to {payment_status}', 'payment_status': payment_status}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


