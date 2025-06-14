import os
import sys
# DON'T CHANGE THIS !!!
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from flask import Flask, send_from_directory
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from src.models.user import db
from src.models.inventory import Category, Product, Customer, Supplier
from src.models.invoices import SalesInvoice, SalesInvoiceItem, PurchaseInvoice, PurchaseInvoiceItem, PaymentReceipt, PaymentVoucher
from src.models.operations import Expense, InventoryMovement, PreparationList
from src.routes.user import user_bp
from src.routes.auth import auth_bp
from src.routes.sales import sales_bp
from src.routes.reports import reports_bp
from src.routes.inventory import inventory_bp

app = Flask(__name__, static_folder=os.path.join(os.path.dirname(__file__), 'static'))
app.config['SECRET_KEY'] = 'asdf#FGSgvasgf$5$WGT'
app.config['JWT_SECRET_KEY'] = 'jwt-secret-string-change-in-production'

# بيانات الشركة
app.config["COMPANY_NAME"] = "لوجيا LOGGIA"
app.config["COMPANY_ADDRESS"] = "البصرة - التحسينية مقابل بصرة سنتر التحسينية"
app.config["COMPANY_PHONE_1"] = "+964 786 089 5798"
app.config["DEVELOPER_NAME"] = "احمد صفاء شعبان"
app.config["DEVELOPER_PHONE_1"] = "07717555198"
app.config["DEVELOPER_PHONE_2"] = "07838037021"

# Enable CORS for all routes
CORS(app, origins="*")

# Initialize JWT
jwt = JWTManager(app)

# Register blueprints
app.register_blueprint(auth_bp, url_prefix='/api/auth')
app.register_blueprint(user_bp, url_prefix='/api')
app.register_blueprint(sales_bp, url_prefix='/api')
app.register_blueprint(reports_bp, url_prefix='/api')
app.register_blueprint(inventory_bp, url_prefix='/api')

# Database configuration
app.config['SQLALCHEMY_DATABASE_URI'] = f"sqlite:///{os.path.join(os.path.dirname(__file__), 'database', 'app.db')}"
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db.init_app(app)

with app.app_context():
    db.create_all()
    
    # Create default admin user if not exists
    from src.models.user import User
    admin_user = User.query.filter_by(username='admin').first()
    if not admin_user:
        admin_user = User(
            username='admin',
            full_name='مدير النظام',
            role='admin',
            mobile_access=True
        )
        admin_user.set_password('admin123')
        db.session.add(admin_user)
        db.session.commit()
        print("تم إنشاء مستخدم الأدمن الافتراضي: admin / admin123")

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    static_folder_path = app.static_folder
    if static_folder_path is None:
            return "Static folder not configured", 404

    if path != "" and os.path.exists(os.path.join(static_folder_path, path)):
        return send_from_directory(static_folder_path, path)
    else:
        index_path = os.path.join(static_folder_path, 'index.html')
        if os.path.exists(index_path):
            return send_from_directory(static_folder_path, 'index.html')
        else:
            return "index.html not found", 404


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
