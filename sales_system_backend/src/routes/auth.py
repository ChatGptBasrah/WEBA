from flask import Blueprint, request, jsonify
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from src.models.user import db, User
from datetime import timedelta

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        username = data.get('username')
        password = data.get('password')
        
        if not username or not password:
            return jsonify({'error': 'اسم المستخدم وكلمة المرور مطلوبان'}), 400
        
        user = User.query.filter_by(username=username).first()
        
        if user and user.check_password(password):
            # Create access token with 24 hours expiry
            access_token = create_access_token(
                identity=user.id,
                expires_delta=timedelta(hours=24)
            )
            
            return jsonify({
                'access_token': access_token,
                'user': user.to_dict()
            }), 200
        else:
            return jsonify({'error': 'اسم المستخدم أو كلمة المرور غير صحيحة'}), 401
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@auth_bp.route('/profile', methods=['GET'])
@jwt_required()
def get_profile():
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({'error': 'المستخدم غير موجود'}), 404
            
        return jsonify({'user': user.to_dict()}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@auth_bp.route('/change-password', methods=['POST'])
@jwt_required()
def change_password():
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({'error': 'المستخدم غير موجود'}), 404
        
        data = request.get_json()
        current_password = data.get('current_password')
        new_password = data.get('new_password')
        
        if not current_password or not new_password:
            return jsonify({'error': 'كلمة المرور الحالية والجديدة مطلوبتان'}), 400
        
        if not user.check_password(current_password):
            return jsonify({'error': 'كلمة المرور الحالية غير صحيحة'}), 400
        
        if len(new_password) < 6:
            return jsonify({'error': 'كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل'}), 400
        
        user.set_password(new_password)
        db.session.commit()
        
        return jsonify({'message': 'تم تغيير كلمة المرور بنجاح'}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

