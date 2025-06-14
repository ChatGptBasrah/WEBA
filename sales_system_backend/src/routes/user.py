from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from src.models.user import db, User

user_bp = Blueprint('users', __name__)

def require_admin():
    """Decorator to check if current user is admin"""
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if not user or user.role != 'admin':
        return jsonify({'error': 'صلاحية الأدمن مطلوبة'}), 403
    return None

@user_bp.route('/users', methods=['GET'])
@jwt_required()
def get_users():
    try:
        # Check admin permission
        admin_check = require_admin()
        if admin_check:
            return admin_check
        
        users = User.query.all()
        return jsonify({
            'users': [user.to_dict() for user in users]
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@user_bp.route('/users', methods=['POST'])
@jwt_required()
def create_user():
    try:
        # Check admin permission
        admin_check = require_admin()
        if admin_check:
            return admin_check
        
        data = request.get_json()
        username = data.get('username')
        password = data.get('password')
        full_name = data.get('full_name')
        role = data.get('role', 'user')
        mobile_access = data.get('mobile_access', False)
        
        # Validation
        if not username or not password or not full_name:
            return jsonify({'error': 'اسم المستخدم وكلمة المرور والاسم الكامل مطلوبة'}), 400
        
        if len(password) < 6:
            return jsonify({'error': 'كلمة المرور يجب أن تكون 6 أحرف على الأقل'}), 400
        
        if role not in ['admin', 'user']:
            return jsonify({'error': 'نوع المستخدم يجب أن يكون admin أو user'}), 400
        
        # Check if username already exists
        existing_user = User.query.filter_by(username=username).first()
        if existing_user:
            return jsonify({'error': 'اسم المستخدم موجود مسبقاً'}), 400
        
        # Create new user
        new_user = User(
            username=username,
            full_name=full_name,
            role=role,
            mobile_access=mobile_access
        )
        new_user.set_password(password)
        
        db.session.add(new_user)
        db.session.commit()
        
        return jsonify({
            'message': 'تم إنشاء المستخدم بنجاح',
            'user': new_user.to_dict()
        }), 201
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@user_bp.route('/users/<int:user_id>', methods=['PUT'])
@jwt_required()
def update_user(user_id):
    try:
        # Check admin permission
        admin_check = require_admin()
        if admin_check:
            return admin_check
        
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'المستخدم غير موجود'}), 404
        
        data = request.get_json()
        
        # Update fields if provided
        if 'username' in data:
            # Check if new username already exists
            existing_user = User.query.filter_by(username=data['username']).first()
            if existing_user and existing_user.id != user_id:
                return jsonify({'error': 'اسم المستخدم موجود مسبقاً'}), 400
            user.username = data['username']
        
        if 'full_name' in data:
            user.full_name = data['full_name']
        
        if 'role' in data:
            if data['role'] not in ['admin', 'user']:
                return jsonify({'error': 'نوع المستخدم يجب أن يكون admin أو user'}), 400
            user.role = data['role']
        
        if 'mobile_access' in data:
            user.mobile_access = data['mobile_access']
        
        if 'password' in data:
            if len(data['password']) < 6:
                return jsonify({'error': 'كلمة المرور يجب أن تكون 6 أحرف على الأقل'}), 400
            user.set_password(data['password'])
        
        db.session.commit()
        
        return jsonify({
            'message': 'تم تحديث المستخدم بنجاح',
            'user': user.to_dict()
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@user_bp.route('/users/<int:user_id>', methods=['DELETE'])
@jwt_required()
def delete_user(user_id):
    try:
        # Check admin permission
        admin_check = require_admin()
        if admin_check:
            return admin_check
        
        current_user_id = get_jwt_identity()
        if current_user_id == user_id:
            return jsonify({'error': 'لا يمكن حذف حسابك الخاص'}), 400
        
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'المستخدم غير موجود'}), 404
        
        db.session.delete(user)
        db.session.commit()
        
        return jsonify({'message': 'تم حذف المستخدم بنجاح'}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@user_bp.route('/users/<int:user_id>', methods=['GET'])
@jwt_required()
def get_user(user_id):
    try:
        # Check admin permission
        admin_check = require_admin()
        if admin_check:
            return admin_check
        
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'المستخدم غير موجود'}), 404
        
        return jsonify({'user': user.to_dict()}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500