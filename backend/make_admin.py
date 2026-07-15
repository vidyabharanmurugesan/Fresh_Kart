from app import create_app
from app.models.user_model import User
from app.config.db import db
app = create_app()
with app.app_context():
    users = User.query.all()
    for u in users:
        u.role = 'admin'
    db.session.commit()
    print('Done')