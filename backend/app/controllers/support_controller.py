from flask import jsonify, request
from app.models.support_model import SupportModel

def get_buyer_support_chat(buyer_id):
    try:
        domain = request.args.get('domain', 'food')
        chat = SupportModel.create_or_get_support_chat(buyer_id, domain)
        return jsonify({'chat': chat}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

def get_admin_support_chats():
    try:
        chats = SupportModel.get_all_support_chats()
        
        # Resolve buyer profiles from SQLite User table
        from app.models.user_model import User
        try:
            users = {str(u.id): u for u in User.query.filter_by(role='buyer').all()}
        except Exception:
            users = {}
            
        for chat in chats:
            buyer_id = str(chat.get('buyer_id'))
            buyer = users.get(buyer_id)
            if buyer:
                chat['buyer_name'] = buyer.name
                chat['buyer_email'] = buyer.email
                chat['buyer_phone'] = buyer.phone or 'N/A'
            else:
                chat['buyer_name'] = f"Customer #{buyer_id}"
                chat['buyer_email'] = 'N/A'
                chat['buyer_phone'] = 'N/A'
                
        # Sort by updated_at descending (most recently updated support tickets first)
        chats.sort(key=lambda x: x.get('updated_at', ''), reverse=True)
        return jsonify({'chats': chats}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
