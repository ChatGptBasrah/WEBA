from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from src.models.user import db, User
from src.models.invoices import SalesInvoice, PurchaseInvoice, SalesInvoiceItem, PurchaseInvoiceItem, PaymentReceipt, PaymentVoucher
from src.models.inventory import Product, Customer, Supplier
from datetime import datetime

sales_bp = Blueprint('sales', __name__)

@sales_bp.route('/sales/invoices', methods=['GET'])
@jwt_required()
def get_sales_invoices():
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 10, type=int)
        
        # إضافة خيار البحث عن طريق اسم العميل أو رقم الفاتورة
        search_term = request.args.get('search', '')
        
        query = SalesInvoice.query
        
        if search_term:
            # البحث في رقم الفاتورة
            if search_term.isdigit():
                query = query.filter(SalesInvoice.invoice_number.like(f"%{search_term}%"))
            else:
                # البحث في اسم العميل (سواء كان مخزناً أو مدخلاً يدوياً)
                customer_ids = [c.id for c in Customer.query.filter(Customer.name.like(f"%{search_term}%")).all()]
                query = query.filter(
                    (SalesInvoice.customer_id.in_(customer_ids)) | 
                    (SalesInvoice.customer_name.like(f"%{search_term}%"))
                )
        
        invoices = query.order_by(SalesInvoice.created_at.desc()).paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        return jsonify({
            'invoices': [{
                'id': invoice.id,
                'invoice_number': invoice.invoice_number,
                'customer_name': invoice.customer.name if invoice.customer else invoice.customer_name or 'عميل نقدي',
                'total_amount': float(invoice.total_amount),
                'payment_type': invoice.payment_type,
                'status': invoice.status,
                'created_at': invoice.created_at.isoformat(),
                'items_count': len(invoice.items)
            } for invoice in invoices.items],
            'total': invoices.total,
            'pages': invoices.pages,
            'current_page': page
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@sales_bp.route('/sales/invoices', methods=['POST'])
@jwt_required()
def create_sales_invoice():
    try:
        data = request.get_json()
        user_id = get_jwt_identity()
        
        # Create invoice
        invoice = SalesInvoice(
            customer_id=data.get('customer_id'),
            customer_name=data.get('customer_name', ''),  # اسم الزبون للمبيعات النقدية
            user_id=user_id,
            payment_type=data.get('payment_type', 'cash'),
            notes=data.get('notes', ''),
            discount_percentage=data.get('discount_percentage', 0),
        )
        
        db.session.add(invoice)
        db.session.flush()  # Get invoice ID
        
        # Generate invoice number
        invoice.invoice_number = f"S{invoice.id:06d}"
        
        total_amount = 0
        
        # Add items
        for item_data in data.get('items', []):
            item = SalesInvoiceItem(
                invoice_id=invoice.id,
                product_id=item_data['product_id'],
                color=item_data.get('color', ''),  # اللون المدخل يدوياً
                quantity=item_data['quantity'],
                unit_price=item_data['unit_price'],
                total_price=item_data['quantity'] * item_data['unit_price']
            )
            db.session.add(item)
            total_amount += item.total_price
            
            # Update product stock
            product = Product.query.get(item_data['product_id'])
            if product:
                product.stock_quantity -= item_data['quantity']
        
        # Calculate discount and final total
        invoice.total_amount = total_amount
        invoice.discount = total_amount * (invoice.discount_percentage / 100)
        invoice.final_amount = total_amount - invoice.discount
        
        # إذا كان الدفع آجل، أضف المبلغ إلى ديون العميل
        if invoice.payment_type == 'credit' and invoice.customer_id:
            customer = Customer.query.get(invoice.customer_id)
            if customer:
                customer.balance += invoice.final_amount
        
        db.session.commit()
        
        return jsonify({
            'message': 'تم إنشاء فاتورة المبيعات بنجاح',
            'invoice_id': invoice.id,
            'invoice_number': invoice.invoice_number
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@sales_bp.route('/sales/invoices/<int:invoice_id>', methods=['GET'])
@jwt_required()
def get_sales_invoice(invoice_id):
    try:
        invoice = SalesInvoice.query.get_or_404(invoice_id)
        
        return jsonify({
            'id': invoice.id,
            'invoice_number': invoice.invoice_number,
            'customer': {
                'id': invoice.customer.id if invoice.customer else None,
                'name': invoice.customer.name if invoice.customer else invoice.customer_name or 'عميل نقدي',
                'phone': invoice.customer.phone if invoice.customer else None
            },
            'payment_type': invoice.payment_type,
            'status': invoice.status,
            'total_amount': float(invoice.total_amount),
            'discount_percentage': float(invoice.discount_percentage),
            'discount': float(invoice.discount),
            'final_amount': float(invoice.final_amount),
            'notes': invoice.notes,
            'created_at': invoice.created_at.isoformat(),
            'items': [{
                'id': item.id,
                'product': {
                    'id': item.product.id,
                    'name': item.product.name,
                },
                'color': item.color,
                'quantity': item.quantity,
                'unit_price': float(item.unit_price),
                'total_price': float(item.total_price)
            } for item in invoice.items]
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@sales_bp.route('/purchases/invoices', methods=['GET'])
@jwt_required()
def get_purchase_invoices():
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 10, type=int)
        
        # إضافة خيار البحث عن طريق اسم المورد أو رقم الفاتورة
        search_term = request.args.get('search', '')
        
        query = PurchaseInvoice.query
        
        if search_term:
            # البحث في رقم الفاتورة
            if search_term.isdigit():
                query = query.filter(PurchaseInvoice.invoice_number.like(f"%{search_term}%"))
            else:
                # البحث في اسم المورد
                supplier_ids = [s.id for s in Supplier.query.filter(Supplier.name.like(f"%{search_term}%")).all()]
                query = query.filter(PurchaseInvoice.supplier_id.in_(supplier_ids))
        
        invoices = query.order_by(PurchaseInvoice.created_at.desc()).paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        return jsonify({
            'invoices': [{
                'id': invoice.id,
                'invoice_number': invoice.invoice_number,
                'supplier_name': invoice.supplier.name if invoice.supplier else 'مورد نقدي',
                'total_amount': float(invoice.total_amount),
                'payment_type': invoice.payment_type,
                'status': invoice.status,
                'created_at': invoice.created_at.isoformat(),
                'items_count': len(invoice.items)
            } for invoice in invoices.items],
            'total': invoices.total,
            'pages': invoices.pages,
            'current_page': page
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@sales_bp.route('/purchases/invoices', methods=['POST'])
@jwt_required()
def create_purchase_invoice():
    try:
        data = request.get_json()
        user_id = get_jwt_identity()
        
        # Create invoice
        invoice = PurchaseInvoice(
            supplier_id=data.get('supplier_id'),
            user_id=user_id,
            payment_type=data.get('payment_type', 'cash'),
            notes=data.get('notes', ''),
            discount_percentage=data.get('discount_percentage', 0),
        )
        
        db.session.add(invoice)
        db.session.flush()  # Get invoice ID
        
        # Generate invoice number
        invoice.invoice_number = f"P{invoice.id:06d}"
        
        total_amount = 0
        
        # Add items
        for item_data in data.get('items', []):
            item = PurchaseInvoiceItem(
                invoice_id=invoice.id,
                product_id=item_data['product_id'],
                color=item_data.get('color', ''),  # اللون المدخل يدوياً
                quantity=item_data['quantity'],
                unit_price=item_data['unit_price'],
                total_price=item_data['quantity'] * item_data['unit_price']
            )
            db.session.add(item)
            total_amount += item.total_price
            
            # Update product stock
            product = Product.query.get(item_data['product_id'])
            if product:
                product.stock_quantity += item_data['quantity']
        
        # Calculate discount and final total
        invoice.total_amount = total_amount
        invoice.discount = total_amount * (invoice.discount_percentage / 100)
        invoice.final_amount = total_amount - invoice.discount
        
        # إذا كان الدفع آجل، أضف المبلغ إلى ديون المورد
        if invoice.payment_type == 'credit' and invoice.supplier_id:
            supplier = Supplier.query.get(invoice.supplier_id)
            if supplier:
                supplier.balance += invoice.final_amount
        
        db.session.commit()
        
        return jsonify({
            'message': 'تم إنشاء فاتورة المشتريات بنجاح',
            'invoice_id': invoice.id,
            'invoice_number': invoice.invoice_number
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@sales_bp.route('/customers', methods=['GET'])
@jwt_required()
def get_customers():
    try:
        customers = Customer.query.all()
        return jsonify({
            'customers': [{
                'id': customer.id,
                'name': customer.name,
                'phone': customer.phone,
                'email': customer.email,
                'address': customer.address,
                'customer_type': customer.customer_type,
                'balance': float(customer.balance)
            } for customer in customers]
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@sales_bp.route('/customers', methods=['POST'])
@jwt_required()
def create_customer():
    try:
        data = request.get_json()
        
        customer = Customer(
            name=data.get('name'),
            phone=data.get('phone', ''),
            address=data.get('address', ''),
            email=data.get('email', ''),
            customer_type=data.get('customer_type', 'regular')
        )
        
        db.session.add(customer)
        db.session.commit()
        
        return jsonify({
            'message': 'تم إضافة العميل بنجاح',
            'customer': customer.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@sales_bp.route('/suppliers', methods=['GET'])
@jwt_required()
def get_suppliers():
    try:
        suppliers = Supplier.query.all()
        return jsonify({
            'suppliers': [{
                'id': supplier.id,
                'name': supplier.name,
                'phone': supplier.phone,
                'email': supplier.email,
                'address': supplier.address,
                'balance': float(supplier.balance)
            } for supplier in suppliers]
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@sales_bp.route('/products', methods=['GET'])
@jwt_required()
def get_products():
    try:
        products = Product.query.all()
        return jsonify({
            'products': [{
                'id': product.id,
                'name': product.name,
                'description': product.description,
                'purchase_price': float(product.purchase_price),
                'selling_price': float(product.selling_price),
                'stock_quantity': product.stock_quantity,
                'unit': product.unit,
                'category_id': product.category_id,
                'category_name': product.category.name if product.category else None
            } for product in products]
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# إضافة سندات القبض
@sales_bp.route('/payment-receipts', methods=['POST'])
@jwt_required()
def create_payment_receipt():
    try:
        data = request.get_json()
        user_id = get_jwt_identity()
        
        customer_id = data.get('customer_id')
        amount = float(data.get('amount', 0))
        
        if not customer_id:
            return jsonify({'error': 'يجب تحديد العميل'}), 400
            
        if amount <= 0:
            return jsonify({'error': 'يجب أن يكون المبلغ أكبر من صفر'}), 400
        
        # التحقق من وجود العميل
        customer = Customer.query.get(customer_id)
        if not customer:
            return jsonify({'error': 'العميل غير موجود'}), 404
        
        # إنشاء سند القبض
        receipt = PaymentReceipt(
            customer_id=customer_id,
            user_id=user_id,
            amount=amount,
            notes=data.get('notes', '')
        )
        
        db.session.add(receipt)
        db.session.flush()  # للحصول على معرف السند
        
        # إنشاء رقم السند
        receipt.receipt_number = f"R{receipt.id:06d}"
        
        # تحديث رصيد العميل
        customer.balance -= amount
        
        db.session.commit()
        
        return jsonify({
            'message': 'تم إنشاء سند القبض بنجاح',
            'receipt_id': receipt.id,
            'receipt_number': receipt.receipt_number
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# إضافة سندات الدفع
@sales_bp.route('/payment-vouchers', methods=['POST'])
@jwt_required()
def create_payment_voucher():
    try:
        data = request.get_json()
        user_id = get_jwt_identity()
        
        supplier_id = data.get('supplier_id')
        amount = float(data.get('amount', 0))
        
        if not supplier_id:
            return jsonify({'error': 'يجب تحديد المورد'}), 400
            
        if amount <= 0:
            return jsonify({'error': 'يجب أن يكون المبلغ أكبر من صفر'}), 400
        
        # التحقق من وجود المورد
        supplier = Supplier.query.get(supplier_id)
        if not supplier:
            return jsonify({'error': 'المورد غير موجود'}), 404
        
        # إنشاء سند الدفع
        voucher = PaymentVoucher(
            supplier_id=supplier_id,
            user_id=user_id,
            amount=amount,
            notes=data.get('notes', '')
        )
        
        db.session.add(voucher)
        db.session.flush()  # للحصول على معرف السند
        
        # إنشاء رقم السند
        voucher.voucher_number = f"V{voucher.id:06d}"
        
        # تحديث رصيد المورد
        supplier.balance -= amount
        
        db.session.commit()
        
        return jsonify({
            'message': 'تم إنشاء سند الدفع بنجاح',
            'voucher_id': voucher.id,
            'voucher_number': voucher.voucher_number
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# الحصول على سندات القبض
@sales_bp.route('/payment-receipts', methods=['GET'])
@jwt_required()
def get_payment_receipts():
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 10, type=int)
        
        receipts = PaymentReceipt.query.order_by(PaymentReceipt.created_at.desc()).paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        return jsonify({
            'receipts': [{
                'id': receipt.id,
                'receipt_number': receipt.receipt_number,
                'customer_name': receipt.customer.name if receipt.customer else None,
                'amount': float(receipt.amount),
                'receipt_date': receipt.receipt_date.isoformat(),
                'notes': receipt.notes,
                'created_at': receipt.created_at.isoformat()
            } for receipt in receipts.items],
            'total': receipts.total,
            'pages': receipts.pages,
            'current_page': page
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# الحصول على سندات الدفع
@sales_bp.route('/payment-vouchers', methods=['GET'])
@jwt_required()
def get_payment_vouchers():
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 10, type=int)
        
        vouchers = PaymentVoucher.query.order_by(PaymentVoucher.created_at.desc()).paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        return jsonify({
            'vouchers': [{
                'id': voucher.id,
                'voucher_number': voucher.voucher_number,
                'supplier_name': voucher.supplier.name if voucher.supplier else None,
                'amount': float(voucher.amount),
                'voucher_date': voucher.voucher_date.isoformat(),
                'notes': voucher.notes,
                'created_at': voucher.created_at.isoformat()
            } for voucher in vouchers.items],
            'total': vouchers.total,
            'pages': vouchers.pages,
            'current_page': page
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# الحصول على سند قبض محدد
@sales_bp.route('/payment-receipts/<int:receipt_id>', methods=['GET'])
@jwt_required()
def get_payment_receipt(receipt_id):
    try:
        receipt = PaymentReceipt.query.get_or_404(receipt_id)
        
        return jsonify({
            'id': receipt.id,
            'receipt_number': receipt.receipt_number,
            'customer': {
                'id': receipt.customer.id if receipt.customer else None,
                'name': receipt.customer.name if receipt.customer else None,
                'phone': receipt.customer.phone if receipt.customer else None
            },
            'amount': float(receipt.amount),
            'receipt_date': receipt.receipt_date.isoformat(),
            'notes': receipt.notes,
            'created_at': receipt.created_at.isoformat(),
            'user_name': receipt.user.full_name if receipt.user else None
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# الحصول على سند دفع محدد
@sales_bp.route('/payment-vouchers/<int:voucher_id>', methods=['GET'])
@jwt_required()
def get_payment_voucher(voucher_id):
    try:
        voucher = PaymentVoucher.query.get_or_404(voucher_id)
        
        return jsonify({
            'id': voucher.id,
            'voucher_number': voucher.voucher_number,
            'supplier': {
                'id': voucher.supplier.id if voucher.supplier else None,
                'name': voucher.supplier.name if voucher.supplier else None,
                'phone': voucher.supplier.phone if voucher.supplier else None
            },
            'amount': float(voucher.amount),
            'voucher_date': voucher.voucher_date.isoformat(),
            'notes': voucher.notes,
            'created_at': voucher.created_at.isoformat(),
            'user_name': voucher.user.full_name if voucher.user else None
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500
