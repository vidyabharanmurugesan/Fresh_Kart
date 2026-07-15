import os
from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager

from app.config.settings import Config
from app.middleware.error_handler import register_error_handlers
from app.routes.auth_routes import auth_bp
from app.sockets import socketio


def create_app():
    """Application factory for the FreshKart Flask backend."""
    app = Flask(__name__)
    app.config.from_object(Config)
    
    # Ensure uploads directory exists
    os.makedirs(app.config.get('UPLOAD_FOLDER', 'uploads'), exist_ok=True)
    
    # Initialize extensions
    CORS(app, origins=Config.CORS_ORIGINS, supports_credentials=True)
    JWTManager(app)
    
    # Initialize SocketIO
    socketio.init_app(app)
    
    # Initialize Firebase
    from app.config.firebase_config import init_firebase
    init_firebase(app)
    
    # Register error handlers
    register_error_handlers(app)
    
    # Register blueprints
    app.register_blueprint(auth_bp)
    
    from app.routes.product_routes import product_bp
    app.register_blueprint(product_bp)
    
    from app.routes.order_routes import order_bp
    app.register_blueprint(order_bp)

    from app.routes.voice_routes import voice_bp
    app.register_blueprint(voice_bp)

    from app.routes.support_routes import support_bp
    app.register_blueprint(support_bp)

    from app.routes.coupon_routes import coupon_bp
    app.register_blueprint(coupon_bp)

    # Serve local uploaded files
    from flask import send_from_directory
    @app.route('/uploads/<path:filename>')
    def serve_uploaded_file(filename):
        return send_from_directory(app.config.get('UPLOAD_FOLDER', 'uploads'), filename)
    
    # Health check endpoint
    @app.route('/api/health', methods=['GET'])
    def health_check():
        return {'status': 'ok', 'service': 'FreshKart API'}, 200
    
    return app

app = create_app()


if __name__ == '__main__':
    host = app.config.get('HOST', '0.0.0.0')
    port = app.config.get('PORT', 5000)
    print(f"\n[OK] FreshKart API Server Starting...")
    print(f"-> http://localhost:{port}")
    print(f"-> Health Check: http://localhost:{port}/api/health\n")
    socketio.run(app, debug=app.config.get('DEBUG', True), host=host, port=port, allow_unsafe_werkzeug=True)
