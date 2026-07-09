from flask_socketio import SocketIO, join_room, leave_room, emit

socketio = SocketIO(cors_allowed_origins="*")

@socketio.on('join_order')
def on_join(data):
    order_id = data.get('order_id')
    user_id = data.get('user_id')
    role = data.get('role')
    if order_id:
        room = f"order_{order_id}"
        join_room(room)
        print(f"[Socket] User {user_id} ({role}) joined room {room}")
        emit('user_joined', {'user_id': user_id, 'role': role, 'message': f'{role} joined the chat.'}, to=room)

@socketio.on('leave_order')
def on_leave(data):
    order_id = data.get('order_id')
    user_id = data.get('user_id')
    if order_id:
        room = f"order_{order_id}"
        leave_room(room)
        print(f"[Socket] User {user_id} left room {room}")

@socketio.on('send_message')
def on_send_message(data):
    order_id = data.get('order_id')
    if not order_id:
        return
        
    room = f"order_{order_id}"
    message_payload = {
        'id': data.get('id'), # frontend generated uuid
        'sender_id': data.get('sender_id'),
        'sender_name': data.get('sender_name'),
        'sender_role': data.get('sender_role'),
        'text': data.get('text'),
        'timestamp': data.get('timestamp')
    }
    
    # In a real app we'd save this to the database.
    # For now, let's just broadcast it. We'll add DB save later if needed.
    # We can import OrderModel here if we want to save it to DB.
    
    from app.models.order_model import OrderModel
    try:
        OrderModel.add_chat_message(order_id, message_payload)
    except Exception as e:
        print(f"[Socket Error] Failed to save message: {e}")
        
    print(f"[Socket] Message in {room}: {message_payload['text']}")
    emit('receive_message', message_payload, to=room)


@socketio.on('join_support')
def on_join_support(data):
    buyer_id = data.get('buyer_id')
    user_id = data.get('user_id')
    role = data.get('role')
    if buyer_id:
        room = f"support_{buyer_id}"
        join_room(room)
        print(f"[Socket] User {user_id} ({role}) joined support room {room}")
        emit('user_joined_support', {'user_id': user_id, 'role': role, 'message': f'{role} joined the support chat.'}, to=room)

@socketio.on('leave_support')
def on_leave_support(data):
    buyer_id = data.get('buyer_id')
    user_id = data.get('user_id')
    if buyer_id:
        room = f"support_{buyer_id}"
        leave_room(room)
        print(f"[Socket] User {user_id} left support room {room}")

@socketio.on('send_support_message')
def on_send_support_message(data):
    buyer_id = data.get('buyer_id')
    if not buyer_id:
        return
        
    room = f"support_{buyer_id}"
    message_payload = {
        'id': data.get('id'),
        'buyer_id': buyer_id,
        'sender_id': data.get('sender_id'),
        'sender_name': data.get('sender_name'),
        'sender_role': data.get('sender_role'),
        'text': data.get('text'),
        'timestamp': data.get('timestamp')
    }
    
    from app.models.support_model import SupportModel
    try:
        SupportModel.add_support_message(buyer_id, message_payload)
    except Exception as e:
        print(f"[Socket Error] Failed to save support message: {e}")
        
    print(f"[Socket] Support message in {room}: {message_payload['text']}")
    emit('receive_support_message', message_payload, to=room)

