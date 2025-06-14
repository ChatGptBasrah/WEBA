from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from src.models.user import db
from src.models.operations import Expense
from src.models.invoices import SalesInvoice, PurchaseInvoice, SalesInvoiceItem, PurchaseInvoiceItem
from src.models.inventory import Product
from datetime import datetime, timedelta
from sqlalchemy import func, and_, extract

reports_bp = Blueprint('reports', __name__)

@reports_bp.route('/expenses', methods=['GET'])
@jwt_required()
def get_expenses():
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 10, type=int)
        
        expenses = Expense.query.order_by(Expense.created_at.desc()).paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        return jsonify({
            'expenses': [{
                'id': expense.id,
                'description': expense.description,
                'amount': float(expense.amount),
                'category': expense.category,
                'created_at': expense.created_at.isoformat(),
                'user_name': expense.user.full_name if expense.user else None
            } for expense in expenses.items],
            'total': expenses.total,
            'pages': expenses.pages,
            'current_page': page
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@reports_bp.route('/expenses', methods=['POST'])
@jwt_required()
def create_expense():
    try:
        data = request.get_json()
        user_id = get_jwt_identity()
        
        expense = Expense(
            description=data.get('description'),
            amount=data.get('amount'),
            category=data.get('category', 'عام'),
            user_id=user_id
        )
        
        db.session.add(expense)
        db.session.commit()
        
        return jsonify({
            'message': 'تم إضافة المصروف بنجاح',
            'expense_id': expense.id
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@reports_bp.route('/expenses/<int:expense_id>', methods=['DELETE'])
@jwt_required()
def delete_expense(expense_id):
    try:
        expense = Expense.query.get_or_404(expense_id)
        db.session.delete(expense)
        db.session.commit()
        
        return jsonify({'message': 'تم حذف المصروف بنجاح'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@reports_bp.route('/reports/dashboard', methods=['GET'])
@jwt_required()
def get_dashboard_stats():
    try:
        today = datetime.now().date()
        week_start = today - timedelta(days=today.weekday())
        month_start = today.replace(day=1)
        year_start = today.replace(month=1, day=1)
        
        # Sales stats
        today_sales = db.session.query(func.sum(SalesInvoice.total_amount)).filter(
            func.date(SalesInvoice.created_at) == today
        ).scalar() or 0
        
        week_sales = db.session.query(func.sum(SalesInvoice.total_amount)).filter(
            func.date(SalesInvoice.created_at) >= week_start
        ).scalar() or 0
        
        month_sales = db.session.query(func.sum(SalesInvoice.total_amount)).filter(
            func.date(SalesInvoice.created_at) >= month_start
        ).scalar() or 0
        
        year_sales = db.session.query(func.sum(SalesInvoice.total_amount)).filter(
            func.date(SalesInvoice.created_at) >= year_start
        ).scalar() or 0
        
        # Purchase stats
        today_purchases = db.session.query(func.sum(PurchaseInvoice.total_amount)).filter(
            func.date(PurchaseInvoice.created_at) == today
        ).scalar() or 0
        
        week_purchases = db.session.query(func.sum(PurchaseInvoice.total_amount)).filter(
            func.date(PurchaseInvoice.created_at) >= week_start
        ).scalar() or 0
        
        month_purchases = db.session.query(func.sum(PurchaseInvoice.total_amount)).filter(
            func.date(PurchaseInvoice.created_at) >= month_start
        ).scalar() or 0
        
        year_purchases = db.session.query(func.sum(PurchaseInvoice.total_amount)).filter(
            func.date(PurchaseInvoice.created_at) >= year_start
        ).scalar() or 0
        
        # Expense stats
        today_expenses = db.session.query(func.sum(Expense.amount)).filter(
            func.date(Expense.created_at) == today
        ).scalar() or 0
        
        week_expenses = db.session.query(func.sum(Expense.amount)).filter(
            func.date(Expense.created_at) >= week_start
        ).scalar() or 0
        
        month_expenses = db.session.query(func.sum(Expense.amount)).filter(
            func.date(Expense.created_at) >= month_start
        ).scalar() or 0
        
        year_expenses = db.session.query(func.sum(Expense.amount)).filter(
            func.date(Expense.created_at) >= year_start
        ).scalar() or 0
        
        # Profit calculations
        today_profit = today_sales - today_purchases - today_expenses
        week_profit = week_sales - week_purchases - week_expenses
        month_profit = month_sales - month_purchases - month_expenses
        year_profit = year_sales - year_purchases - year_expenses
        
        # Invoice counts
        total_sales_invoices = SalesInvoice.query.count()
        total_purchase_invoices = PurchaseInvoice.query.count()
        
        # Low stock products
        low_stock_products = Product.query.filter(
            Product.stock_quantity <= Product.min_stock
        ).count()
        
        return jsonify({
            'sales': {
                'today': float(today_sales),
                'week': float(week_sales),
                'month': float(month_sales),
                'year': float(year_sales)
            },
            'purchases': {
                'today': float(today_purchases),
                'week': float(week_purchases),
                'month': float(month_purchases),
                'year': float(year_purchases)
            },
            'expenses': {
                'today': float(today_expenses),
                'week': float(week_expenses),
                'month': float(month_expenses),
                'year': float(year_expenses)
            },
            'profit': {
                'today': float(today_profit),
                'week': float(week_profit),
                'month': float(month_profit),
                'year': float(year_profit)
            },
            'counts': {
                'sales_invoices': total_sales_invoices,
                'purchase_invoices': total_purchase_invoices,
                'low_stock_products': low_stock_products
            }
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@reports_bp.route('/reports/sales-chart', methods=['GET'])
@jwt_required()
def get_sales_chart():
    try:
        period = request.args.get('period', 'week')  # week, month, year
        
        if period == 'week':
            # Last 7 days
            start_date = datetime.now().date() - timedelta(days=6)
            sales_data = db.session.query(
                func.date(SalesInvoice.created_at).label('date'),
                func.sum(SalesInvoice.total_amount).label('total')
            ).filter(
                func.date(SalesInvoice.created_at) >= start_date
            ).group_by(func.date(SalesInvoice.created_at)).all()
            
        elif period == 'month':
            # Last 30 days
            start_date = datetime.now().date() - timedelta(days=29)
            sales_data = db.session.query(
                func.date(SalesInvoice.created_at).label('date'),
                func.sum(SalesInvoice.total_amount).label('total')
            ).filter(
                func.date(SalesInvoice.created_at) >= start_date
            ).group_by(func.date(SalesInvoice.created_at)).all()
            
        else:  # year
            # Last 12 months
            start_date = datetime.now().replace(day=1) - timedelta(days=365)
            sales_data = db.session.query(
                extract('year', SalesInvoice.created_at).label('year'),
                extract('month', SalesInvoice.created_at).label('month'),
                func.sum(SalesInvoice.total_amount).label('total')
            ).filter(
                SalesInvoice.created_at >= start_date
            ).group_by(
                extract('year', SalesInvoice.created_at),
                extract('month', SalesInvoice.created_at)
            ).all()
        
        chart_data = []
        if period in ['week', 'month']:
            for data in sales_data:
                chart_data.append({
                    'date': data.date.isoformat(),
                    'total': float(data.total or 0)
                })
        else:
            for data in sales_data:
                chart_data.append({
                    'date': f"{int(data.year)}-{int(data.month):02d}",
                    'total': float(data.total or 0)
                })
        
        return jsonify({'data': chart_data})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@reports_bp.route('/reports/top-products', methods=['GET'])
@jwt_required()
def get_top_products():
    try:
        period = request.args.get('period', 'month')  # week, month, year
        
        if period == 'week':
            start_date = datetime.now().date() - timedelta(days=6)
        elif period == 'month':
            start_date = datetime.now().date() - timedelta(days=29)
        else:  # year
            start_date = datetime.now().date() - timedelta(days=365)
        
        top_products = db.session.query(
            Product.name,
            func.sum(SalesInvoiceItem.quantity).label('total_quantity'),
            func.sum(SalesInvoiceItem.total_price).label('total_revenue')
        ).join(
            SalesInvoiceItem, Product.id == SalesInvoiceItem.product_id
        ).join(
            SalesInvoice, SalesInvoiceItem.invoice_id == SalesInvoice.id
        ).filter(
            func.date(SalesInvoice.created_at) >= start_date
        ).group_by(
            Product.id, Product.name
        ).order_by(
            func.sum(SalesInvoiceItem.total_price).desc()
        ).limit(10).all()
        
        return jsonify({
            'products': [{
                'name': product.name,
                'quantity': int(product.total_quantity or 0),
                'revenue': float(product.total_revenue or 0)
            } for product in top_products]
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@reports_bp.route('/reports/cash-flow', methods=['GET'])
@jwt_required()
def get_cash_flow():
    try:
        # Calculate cash flow for the current month
        today = datetime.now().date()
        month_start = today.replace(day=1)
        
        # Daily cash flow for current month
        cash_flow_data = []
        current_date = month_start
        
        while current_date <= today:
            daily_sales = db.session.query(func.sum(SalesInvoice.total_amount)).filter(
                and_(
                    func.date(SalesInvoice.created_at) == current_date,
                    SalesInvoice.payment_type == 'cash'
                )
            ).scalar() or 0
            
            daily_purchases = db.session.query(func.sum(PurchaseInvoice.total_amount)).filter(
                and_(
                    func.date(PurchaseInvoice.created_at) == current_date,
                    PurchaseInvoice.payment_type == 'cash'
                )
            ).scalar() or 0
            
            daily_expenses = db.session.query(func.sum(Expense.amount)).filter(
                func.date(Expense.created_at) == current_date
            ).scalar() or 0
            
            net_cash_flow = daily_sales - daily_purchases - daily_expenses
            
            cash_flow_data.append({
                'date': current_date.isoformat(),
                'inflow': float(daily_sales),
                'outflow': float(daily_purchases + daily_expenses),
                'net': float(net_cash_flow)
            })
            
            current_date += timedelta(days=1)
        
        return jsonify({'data': cash_flow_data})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

