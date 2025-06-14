# تحليل متطلبات برنامج المبيعات المتكامل

## المتطلبات الوظيفية:

### 1. إدارة المستخدمين:
- نوعين من المستخدمين: أدمن ومستخدم عادي
- الأدمن يمكنه استخدام البرنامج من الهاتف والحاسوب
- المستخدم العادي يستخدم الحاسوب فقط
- إضافة وتعديل وحذف المستخدمين

### 2. واجهة المبيعات:
- مبيعات نقدية
- مبيعات آجلة
- إدخال تفاصيل المنتجات والكميات والأسعار

### 3. واجهة المشتريات:
- مشتريات نقدية
- مشتريات آجلة
- إدخال تفاصيل المشتريات من الموردين

### 4. طباعة الفواتير:
- طباعة فواتير A5 للمبيعات والمشتريات
- تصميم احترافي مع هيدر مخصص

### 5. إدارة المصاريف:
- تسجيل المصاريف المختلفة
- تصنيف المصاريف

### 6. التقارير:
- تقارير الربح (يومي، أسبوعي، سنوي)
- كشف الصندوق
- تقارير المبيعات والمشتريات

### 7. إدارة المخزن:
- عرض محتويات المخزن
- تتبع الكميات المتوفرة
- تحديث المخزن تلقائياً مع المبيعات والمشتريات

### 8. قائمة التجهيز:
- إنشاء قوائم تجهيز للعمال
- طباعة قوائم التجهيز

### 9. الاستعلام عن الأسعار:
- البحث عن المنتجات
- عرض أسعار البيع

## تصميم قاعدة البيانات:

### جدول المستخدمين (users):
- id (Primary Key)
- username (Unique)
- password (Hashed)
- full_name
- role (admin/user)
- mobile_access (Boolean)
- created_at
- updated_at

### جدول المنتجات (products):
- id (Primary Key)
- name
- description
- purchase_price
- selling_price
- stock_quantity
- unit
- category_id (Foreign Key)
- created_at
- updated_at

### جدول الفئات (categories):
- id (Primary Key)
- name
- description

### جدول العملاء (customers):
- id (Primary Key)
- name
- phone
- address
- email
- created_at

### جدول الموردين (suppliers):
- id (Primary Key)
- name
- phone
- address
- email
- created_at

### جدول فواتير المبيعات (sales_invoices):
- id (Primary Key)
- invoice_number (Unique)
- customer_id (Foreign Key)
- user_id (Foreign Key)
- invoice_date
- payment_type (cash/credit)
- total_amount
- discount
- final_amount
- status
- created_at

### جدول تفاصيل فواتير المبيعات (sales_invoice_items):
- id (Primary Key)
- invoice_id (Foreign Key)
- product_id (Foreign Key)
- quantity
- unit_price
- total_price

### جدول فواتير المشتريات (purchase_invoices):
- id (Primary Key)
- invoice_number (Unique)
- supplier_id (Foreign Key)
- user_id (Foreign Key)
- invoice_date
- payment_type (cash/credit)
- total_amount
- discount
- final_amount
- status
- created_at

### جدول تفاصيل فواتير المشتريات (purchase_invoice_items):
- id (Primary Key)
- invoice_id (Foreign Key)
- product_id (Foreign Key)
- quantity
- unit_price
- total_price

### جدول المصاريف (expenses):
- id (Primary Key)
- description
- amount
- category
- expense_date
- user_id (Foreign Key)
- created_at

### جدول حركة المخزن (inventory_movements):
- id (Primary Key)
- product_id (Foreign Key)
- movement_type (in/out)
- quantity
- reference_type (sale/purchase/adjustment)
- reference_id
- user_id (Foreign Key)
- created_at

### جدول قوائم التجهيز (preparation_lists):
- id (Primary Key)
- list_number
- customer_name
- items (JSON)
- status
- created_by (Foreign Key)
- created_at

## المتطلبات التقنية:

### Backend:
- Flask (Python)
- SQLAlchemy (ORM)
- Flask-JWT-Extended (Authentication)
- Flask-CORS (Cross-Origin Resource Sharing)

### Frontend:
- React.js
- Material-UI أو Bootstrap للتصميم
- Axios للتواصل مع API
- React Router للتنقل

### قاعدة البيانات:
- SQLite للتطوير
- PostgreSQL للإنتاج

### الأمان:
- تشفير كلمات المرور
- JWT للمصادقة
- HTTPS للاتصال الآمن

### التصميم المتجاوب:
- دعم الهواتف المحمولة للأدمن
- واجهة سهلة الاستخدام على الحاسوب

