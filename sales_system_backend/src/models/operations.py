from src.models.user import db
from datetime import datetime
import json

class Expense(db.Model):
    __tablename__ = 'expenses'
    
    id = db.Column(db.Integer, primary_key=True)
    description = db.Column(db.String(500), nullable=False)
    amount = db.Column(db.Float, nullable=False)
    category = db.Column(db.String(100), nullable=False)
    expense_date = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    user = db.relationship('User', backref='expenses')

    def to_dict(self):
        return {
            'id': self.id,
            'description': self.description,
            'amount': self.amount,
            'category': self.category,
            'expense_date': self.expense_date.isoformat() if self.expense_date else None,
            'user_id': self.user_id,
            'user_name': self.user.full_name if self.user else None,
            'notes': self.notes,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class InventoryMovement(db.Model):
    __tablename__ = 'inventory_movements'
    
    id = db.Column(db.Integer, primary_key=True)
    product_id = db.Column(db.Integer, db.ForeignKey('products.id'), nullable=False)
    movement_type = db.Column(db.String(20), nullable=False)  # in, out, adjustment
    quantity = db.Column(db.Float, nullable=False)
    reference_type = db.Column(db.String(50))  # sale, purchase, adjustment
    reference_id = db.Column(db.Integer)  # ID of the related invoice or adjustment
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    product = db.relationship('Product', backref='movements')
    user = db.relationship('User', backref='inventory_movements')

    def to_dict(self):
        return {
            'id': self.id,
            'product_id': self.product_id,
            'product_name': self.product.name if self.product else None,
            'movement_type': self.movement_type,
            'quantity': self.quantity,
            'reference_type': self.reference_type,
            'reference_id': self.reference_id,
            'user_id': self.user_id,
            'user_name': self.user.full_name if self.user else None,
            'notes': self.notes,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class PreparationList(db.Model):
    __tablename__ = 'preparation_lists'
    
    id = db.Column(db.Integer, primary_key=True)
    list_number = db.Column(db.String(50), unique=True, nullable=False)
    customer_name = db.Column(db.String(200), nullable=False)
    items_json = db.Column(db.Text, nullable=False)  # JSON string of items
    status = db.Column(db.String(20), nullable=False, default='pending')  # pending, in_progress, completed
    created_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    completed_at = db.Column(db.DateTime)
    
    # Relationships
    user = db.relationship('User', backref='preparation_lists')

    @property
    def items(self):
        """Get items as Python list"""
        try:
            return json.loads(self.items_json) if self.items_json else []
        except:
            return []

    @items.setter
    def items(self, value):
        """Set items from Python list"""
        self.items_json = json.dumps(value, ensure_ascii=False)

    def to_dict(self):
        return {
            'id': self.id,
            'list_number': self.list_number,
            'customer_name': self.customer_name,
            'items': self.items,
            'status': self.status,
            'created_by': self.created_by,
            'created_by_name': self.user.full_name if self.user else None,
            'notes': self.notes,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'completed_at': self.completed_at.isoformat() if self.completed_at else None
        }

