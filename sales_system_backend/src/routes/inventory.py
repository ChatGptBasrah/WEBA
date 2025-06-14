from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from src.models.user import db
from src.models.inventory import Product, Category, Customer, Supplier
from src.models.operations import InventoryMovement, PreparationList
from datetime import datetime

inventory_bp = Blueprint('inventory', __name__)

@inventory_bp.route('/products', methods=['GET'])
@jwt_required()
def get_products():
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        search = request.args.get('search', '')
        category_id = request.args.get('category_id', type=int)
        
        query = Product.query
        
        if search:
            query = query.filter(Product.name.contains(search))
        
        if category_id:
            query = query.filter(Product.category_id == category_id)
        
        products = query.order_by(Product.name).paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        return jsonify({
            'products': [{
                'id': product.id,
                'name': product.name,
                'description': product.description,
                'barcode': product.barcode,
                'category_id': product.category_id,
                'category_name': product.category.name if product.category else None,
                'sale_price': float(product.sale_price),
                'purchase_price': float(product.purchase_price),
                'stock_quantity': product.stock_quantity,
                'min_stock': product.min_stock,
                'unit': product.unit,
                'is_low_stock': product.stock_quantity <= product.min_stock,
                'created_at': product.created_at.isoformat()
            } for product in products.items],
            'total': products.total,
            'pages': products.pages,
            'current_page': page
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@inventory_bp.route('/products', methods=['POST'])
@jwt_required()
def create_product():
    try:
        data = request.get_json()
        
        product = Product(
            name=data.get('name'),
            description=data.get('description', ''),
            barcode=data.get('barcode'),
            category_id=data.get('category_id'),
            sale_price=data.get('sale_price'),
            purchase_price=data.get('purchase_price'),
            stock_quantity=data.get('stock_quantity', 0),
            min_stock=data.get('min_stock', 0),
            unit=data.get('unit', 'قطعة')
        )
        
        db.session.add(product)
        db.session.commit()
        
        return jsonify({
            'message': 'تم إضافة المنتج بنجاح',
            'product_id': product.id
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@inventory_bp.route('/products/<int:product_id>', methods=['PUT'])
@jwt_required()
def update_product(product_id):
    try:
        product = Product.query.get_or_404(product_id)
        data = request.get_json()
        
        product.name = data.get('name', product.name)
        product.description = data.get('description', product.description)
        product.barcode = data.get('barcode', product.barcode)
        product.category_id = data.get('category_id', product.category_id)
        product.sale_price = data.get('sale_price', product.sale_price)
        product.purchase_price = data.get('purchase_price', product.purchase_price)
        product.stock_quantity = data.get('stock_quantity', product.stock_quantity)
        product.min_stock = data.get('min_stock', product.min_stock)
        product.unit = data.get('unit', product.unit)
        
        db.session.commit()
        
        return jsonify({'message': 'تم تحديث المنتج بنجاح'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@inventory_bp.route('/products/<int:product_id>', methods=['DELETE'])
@jwt_required()
def delete_product(product_id):
    try:
        product = Product.query.get_or_404(product_id)
        db.session.delete(product)
        db.session.commit()
        
        return jsonify({'message': 'تم حذف المنتج بنجاح'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@inventory_bp.route('/categories', methods=['GET'])
@jwt_required()
def get_categories():
    try:
        categories = Category.query.order_by(Category.name).all()
        return jsonify({
            'categories': [{
                'id': category.id,
                'name': category.name,
                'description': category.description,
                'products_count': len(category.products)
            } for category in categories]
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@inventory_bp.route('/categories', methods=['POST'])
@jwt_required()
def create_category():
    try:
        data = request.get_json()
        
        category = Category(
            name=data.get('name'),
            description=data.get('description', '')
        )
        
        db.session.add(category)
        db.session.commit()
        
        return jsonify({
            'message': 'تم إضافة الفئة بنجاح',
            'category_id': category.id
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@inventory_bp.route('/inventory-movements', methods=['GET'])
@jwt_required()
def get_inventory_movements():
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        product_id = request.args.get('product_id', type=int)
        
        query = InventoryMovement.query
        
        if product_id:
            query = query.filter(InventoryMovement.product_id == product_id)
        
        movements = query.order_by(InventoryMovement.created_at.desc()).paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        return jsonify({
            'movements': [{
                'id': movement.id,
                'product_id': movement.product_id,
                'product_name': movement.product.name if movement.product else None,
                'movement_type': movement.movement_type,
                'quantity': movement.quantity,
                'reference_type': movement.reference_type,
                'reference_id': movement.reference_id,
                'notes': movement.notes,
                'created_at': movement.created_at.isoformat(),
                'user_name': movement.user.full_name if movement.user else None
            } for movement in movements.items],
            'total': movements.total,
            'pages': movements.pages,
            'current_page': page
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@inventory_bp.route('/preparation-lists', methods=['GET'])
@jwt_required()
def get_preparation_lists():
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 10, type=int)
        
        lists = PreparationList.query.order_by(PreparationList.created_at.desc()).paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        return jsonify({
            'lists': [{
                'id': prep_list.id,
                'title': prep_list.title,
                'description': prep_list.description,
                'status': prep_list.status,
                'items_count': len(prep_list.items),
                'created_at': prep_list.created_at.isoformat(),
                'user_name': prep_list.user.full_name if prep_list.user else None
            } for prep_list in lists.items],
            'total': lists.total,
            'pages': lists.pages,
            'current_page': page
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@inventory_bp.route('/preparation-lists', methods=['POST'])
@jwt_required()
def create_preparation_list():
    try:
        data = request.get_json()
        user_id = get_jwt_identity()
        
        prep_list = PreparationList(
            title=data.get('title'),
            description=data.get('description', ''),
            user_id=user_id
        )
        
        db.session.add(prep_list)
        db.session.flush()  # Get the ID
        
        # Add items
        for item_data in data.get('items', []):
            item = PreparationListItem(
                preparation_list_id=prep_list.id,
                product_id=item_data.get('product_id'),
                quantity=item_data.get('quantity'),
                notes=item_data.get('notes', '')
            )
            db.session.add(item)
        
        db.session.commit()
        
        return jsonify({
            'message': 'تم إنشاء قائمة التجهيز بنجاح',
            'list_id': prep_list.id
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@inventory_bp.route('/preparation-lists/<int:list_id>', methods=['GET'])
@jwt_required()
def get_preparation_list(list_id):
    try:
        prep_list = PreparationList.query.get_or_404(list_id)
        
        return jsonify({
            'id': prep_list.id,
            'title': prep_list.title,
            'description': prep_list.description,
            'status': prep_list.status,
            'created_at': prep_list.created_at.isoformat(),
            'user_name': prep_list.user.full_name if prep_list.user else None,
            'items': [{
                'id': item.id,
                'product_id': item.product_id,
                'product_name': item.product.name if item.product else None,
                'quantity': item.quantity,
                'notes': item.notes,
                'is_prepared': item.is_prepared
            } for item in prep_list.items]
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@inventory_bp.route('/preparation-lists/<int:list_id>/status', methods=['PUT'])
@jwt_required()
def update_preparation_list_status(list_id):
    try:
        prep_list = PreparationList.query.get_or_404(list_id)
        data = request.get_json()
        
        prep_list.status = data.get('status', prep_list.status)
        db.session.commit()
        
        return jsonify({'message': 'تم تحديث حالة القائمة بنجاح'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@inventory_bp.route('/preparation-lists/<int:list_id>/items/<int:item_id>/toggle', methods=['PUT'])
@jwt_required()
def toggle_preparation_item(list_id, item_id):
    try:
        item = PreparationListItem.query.filter_by(
            id=item_id, 
            preparation_list_id=list_id
        ).first_or_404()
        
        item.is_prepared = not item.is_prepared
        db.session.commit()
        
        return jsonify({
            'message': 'تم تحديث حالة العنصر بنجاح',
            'is_prepared': item.is_prepared
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@inventory_bp.route('/low-stock', methods=['GET'])
@jwt_required()
def get_low_stock_products():
    try:
        products = Product.query.filter(
            Product.stock_quantity <= Product.min_stock
        ).order_by(Product.stock_quantity).all()
        
        return jsonify({
            'products': [{
                'id': product.id,
                'name': product.name,
                'stock_quantity': product.stock_quantity,
                'min_stock': product.min_stock,
                'unit': product.unit,
                'category_name': product.category.name if product.category else None
            } for product in products]
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

