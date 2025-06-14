from src.models.user import db
from datetime import datetime

class SalesInvoice(db.Model):
    __tablename__ = 'sales_invoices'
    
    id = db.Column(db.Integer, primary_key=True)
    invoice_number = db.Column(db.String(50), unique=True, nullable=False)
    customer_id = db.Column(db.Integer, db.ForeignKey('customers.id'), nullable=True)
    # إضافة حقل اسم الزبون للمبيعات النقدية
    customer_name = db.Column(db.String(200), nullable=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    invoice_date = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    payment_type = db.Column(db.String(20), nullable=False, default='cash')  # cash or credit
    total_amount = db.Column(db.Float, nullable=False, default=0.0)
    # تغيير الخصم ليكون نسبة مئوية
    discount_percentage = db.Column(db.Float, nullable=False, default=0.0)
    discount = db.Column(db.Float, nullable=False, default=0.0)
    final_amount = db.Column(db.Float, nullable=False, default=0.0)
    status = db.Column(db.String(20), nullable=False, default='completed')
    notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    items = db.relationship('SalesInvoiceItem', backref='invoice', lazy=True, cascade='all, delete-orphan')
    user = db.relationship('User', backref='sales_invoices')

    def to_dict(self):
        return {
            'id': self.id,
            'invoice_number': self.invoice_number,
            'customer_id': self.customer_id,
            'customer_name': self.customer.name if self.customer else self.customer_name or 'عميل نقدي',
            'user_id': self.user_id,
            'user_name': self.user.full_name if self.user else None,
            'invoice_date': self.invoice_date.isoformat() if self.invoice_date else None,
            'payment_type': self.payment_type,
            'total_amount': self.total_amount,
            'discount_percentage': self.discount_percentage,
            'discount': self.discount,
            'final_amount': self.final_amount,
            'status': self.status,
            'notes': self.notes,
            'items': [item.to_dict() for item in self.items],
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class SalesInvoiceItem(db.Model):
    __tablename__ = 'sales_invoice_items'
    
    id = db.Column(db.Integer, primary_key=True)
    invoice_id = db.Column(db.Integer, db.ForeignKey('sales_invoices.id'), nullable=False)
    product_id = db.Column(db.Integer, db.ForeignKey('products.id'), nullable=False)
    # إضافة حقل اللون
    color = db.Column(db.String(100), nullable=True)
    quantity = db.Column(db.Float, nullable=False)
    unit_price = db.Column(db.Float, nullable=False)
    total_price = db.Column(db.Float, nullable=False)
    
    # Relationships
    product = db.relationship('Product', backref='sales_items')

    def to_dict(self):
        return {
            'id': self.id,
            'invoice_id': self.invoice_id,
            'product_id': self.product_id,
            'product_name': self.product.name if self.product else None,
            'color': self.color,
            'quantity': self.quantity,
            'unit_price': self.unit_price,
            'total_price': self.total_price
        }

class PurchaseInvoice(db.Model):
    __tablename__ = 'purchase_invoices'
    
    id = db.Column(db.Integer, primary_key=True)
    invoice_number = db.Column(db.String(50), unique=True, nullable=False)
    supplier_id = db.Column(db.Integer, db.ForeignKey('suppliers.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    invoice_date = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    payment_type = db.Column(db.String(20), nullable=False, default='cash')  # cash or credit
    total_amount = db.Column(db.Float, nullable=False, default=0.0)
    # تغيير الخصم ليكون نسبة مئوية
    discount_percentage = db.Column(db.Float, nullable=False, default=0.0)
    discount = db.Column(db.Float, nullable=False, default=0.0)
    final_amount = db.Column(db.Float, nullable=False, default=0.0)
    status = db.Column(db.String(20), nullable=False, default='completed')
    notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    items = db.relationship('PurchaseInvoiceItem', backref='invoice', lazy=True, cascade='all, delete-orphan')
    user = db.relationship('User', backref='purchase_invoices')

    def to_dict(self):
        return {
            'id': self.id,
            'invoice_number': self.invoice_number,
            'supplier_id': self.supplier_id,
            'supplier_name': self.supplier.name if self.supplier else None,
            'user_id': self.user_id,
            'user_name': self.user.full_name if self.user else None,
            'invoice_date': self.invoice_date.isoformat() if self.invoice_date else None,
            'payment_type': self.payment_type,
            'total_amount': self.total_amount,
            'discount_percentage': self.discount_percentage,
            'discount': self.discount,
            'final_amount': self.final_amount,
            'status': self.status,
            'notes': self.notes,
            'items': [item.to_dict() for item in self.items],
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class PurchaseInvoiceItem(db.Model):
    __tablename__ = 'purchase_invoice_items'
    
    id = db.Column(db.Integer, primary_key=True)
    invoice_id = db.Column(db.Integer, db.ForeignKey('purchase_invoices.id'), nullable=False)
    product_id = db.Column(db.Integer, db.ForeignKey('products.id'), nullable=False)
    # إضافة حقل اللون
    color = db.Column(db.String(100), nullable=True)
    quantity = db.Column(db.Float, nullable=False)
    unit_price = db.Column(db.Float, nullable=False)
    total_price = db.Column(db.Float, nullable=False)
    
    # Relationships
    product = db.relationship('Product', backref='purchase_items')

    def to_dict(self):
        return {
            'id': self.id,
            'invoice_id': self.invoice_id,
            'product_id': self.product_id,
            'product_name': self.product.name if self.product else None,
            'color': self.color,
            'quantity': self.quantity,
            'unit_price': self.unit_price,
            'total_price': self.total_price
        }

# إضافة نموذج سندات القبض
class PaymentReceipt(db.Model):
    __tablename__ = 'payment_receipts'
    
    id = db.Column(db.Integer, primary_key=True)
    receipt_number = db.Column(db.String(50), unique=True, nullable=False)
    customer_id = db.Column(db.Integer, db.ForeignKey('customers.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    amount = db.Column(db.Float, nullable=False, default=0.0)
    receipt_date = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    user = db.relationship('User', backref='payment_receipts')
    
    def to_dict(self):
        return {
            'id': self.id,
            'receipt_number': self.receipt_number,
            'customer_id': self.customer_id,
            'customer_name': self.customer.name if self.customer else None,
            'user_id': self.user_id,
            'user_name': self.user.full_name if self.user else None,
            'amount': self.amount,
            'receipt_date': self.receipt_date.isoformat() if self.receipt_date else None,
            'notes': self.notes,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

# إضافة نموذج سندات الدفع
class PaymentVoucher(db.Model):
    __tablename__ = 'payment_vouchers'
    
    id = db.Column(db.Integer, primary_key=True)
    voucher_number = db.Column(db.String(50), unique=True, nullable=False)
    supplier_id = db.Column(db.Integer, db.ForeignKey('suppliers.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    amount = db.Column(db.Float, nullable=False, default=0.0)
    voucher_date = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    user = db.relationship('User', backref='payment_vouchers')
    
    def to_dict(self):
        return {
            'id': self.id,
            'voucher_number': self.voucher_number,
            'supplier_id': self.supplier_id,
            'supplier_name': self.supplier.name if self.supplier else None,
            'user_id': self.user_id,
            'user_name': self.user.full_name if self.user else None,
            'amount': self.amount,
            'voucher_date': self.voucher_date.isoformat() if self.voucher_date else None,
            'notes': self.notes,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
