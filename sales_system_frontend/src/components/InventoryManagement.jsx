import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Plus, 
  Package, 
  Search,
  Edit,
  Trash2,
  AlertTriangle,
  Loader2,
  BarChart3,
  Tag,
  History,
  TrendingDown,
  ShieldCheck,
  ShieldAlert
} from 'lucide-react';
import api from '@/lib/api';

const InventoryManagement = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [movements, setMovements] = useState([]);
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [isProductDialogOpen, setIsProductDialogOpen] = useState(false);
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  
  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    barcode: '',
    category_id: '',
    selling_price: '',
    purchase_price: '',
    stock_quantity: '',
    min_stock: '',
    unit: 'قطعة'
  });

  const [categoryForm, setCategoryForm] = useState({
    name: '',
    description: ''
  });

  const units = ['قطعة', 'كيلو', 'متر', 'لتر', 'علبة', 'كرتون', 'دزينة'];

  useEffect(() => {
    loadData();
    // تحميل بيانات المستخدم الحالي
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        setCurrentUser(JSON.parse(userData));
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    }
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [productsRes, categoriesRes, movementsRes, lowStockRes] = await Promise.all([
        api.get('/products'),
        api.get('/categories'),
        api.get('/inventory-movements'),
        api.get('/low-stock')
      ]);
      
      setProducts(productsRes.data.products || []);
      setCategories(categoriesRes.data.categories || []);
      setMovements(movementsRes.data.movements || []);
      setLowStockProducts(lowStockRes.data.products || []);
    } catch (err) {
      setError(err.response?.data?.error || 'حدث خطأ في تحميل البيانات');
    } finally {
      setLoading(false);
    }
  };

  const handleProductSubmit = async (e) => {
    e.preventDefault();
    if (!productForm.name || !productForm.selling_price || !productForm.purchase_price) {
      setError('يجب ملء جميع الحقول المطلوبة');
      return;
    }

    // التحقق من صلاحيات المستخدم
    if (currentUser?.role !== 'admin') {
      setError('لا تملك الصلاحيات الكافية لإضافة أو تعديل المنتجات');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const data = {
        ...productForm,
        selling_price: parseFloat(productForm.selling_price),
        purchase_price: parseFloat(productForm.purchase_price),
        stock_quantity: parseInt(productForm.stock_quantity) || 0,
        min_stock: parseInt(productForm.min_stock) || 0,
        category_id: productForm.category_id || null
      };

      if (editingProduct) {
        await api.put(`/products/${editingProduct.id}`, data);
      } else {
        await api.post('/products', data);
      }
      
      await loadData();
      resetProductForm();
      setIsProductDialogOpen(false);
    } catch (err) {
      setError(err.response?.data?.error || 'حدث خطأ في حفظ المنتج');
    } finally {
      setLoading(false);
    }
  };

  const handleCategorySubmit = async (e) => {
    e.preventDefault();
    if (!categoryForm.name) {
      setError('يجب إدخال اسم الفئة');
      return;
    }

    // التحقق من صلاحيات المستخدم
    if (currentUser?.role !== 'admin') {
      setError('لا تملك الصلاحيات الكافية لإضافة الفئات');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await api.post('/categories', categoryForm);
      await loadData();
      resetCategoryForm();
      setIsCategoryDialogOpen(false);
    } catch (err) {
      setError(err.response?.data?.error || 'حدث خطأ في حفظ الفئة');
    } finally {
      setLoading(false);
    }
  };

  const deleteProduct = async (productId) => {
    // التحقق من صلاحيات المستخدم
    if (currentUser?.role !== 'admin') {
      setError('لا تملك الصلاحيات الكافية لحذف المنتجات');
      return;
    }

    if (!confirm('هل أنت متأكد من حذف هذا المنتج؟')) {
      return;
    }

    try {
      await api.delete(`/products/${productId}`);
      await loadData();
    } catch (err) {
      setError(err.response?.data?.error || 'حدث خطأ في حذف المنتج');
    }
  };

  const resetProductForm = () => {
    setProductForm({
      name: '',
      description: '',
      barcode: '',
      category_id: '',
      selling_price: '',
      purchase_price: '',
      stock_quantity: '',
      min_stock: '',
      unit: 'قطعة'
    });
    setEditingProduct(null);
    setError('');
  };

  const resetCategoryForm = () => {
    setCategoryForm({
      name: '',
      description: ''
    });
    setError('');
  };

  const openProductDialog = (product = null) => {
    // التحقق من صلاحيات المستخدم
    if (currentUser?.role !== 'admin') {
      setError('لا تملك الصلاحيات الكافية لإضافة أو تعديل المنتجات');
      return;
    }

    if (product) {
      setProductForm({
        name: product.name,
        description: product.description || '',
        barcode: product.barcode || '',
        category_id: product.category_id ? product.category_id.toString() : '',
        selling_price: product.selling_price.toString(),
        purchase_price: product.purchase_price.toString(),
        stock_quantity: product.stock_quantity.toString(),
        min_stock: product.min_stock.toString(),
        unit: product.unit
      });
      setEditingProduct(product);
    } else {
      resetProductForm();
    }
    setIsProductDialogOpen(true);
  };

  const openCategoryDialog = () => {
    // التحقق من صلاحيات المستخدم
    if (currentUser?.role !== 'admin') {
      setError('لا تملك الصلاحيات الكافية لإضافة الفئات');
      return;
    }

    resetCategoryForm();
    setIsCategoryDialogOpen(true);
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (product.barcode && product.barcode.includes(searchTerm));
    const matchesCategory = !selectedCategory || product.category_id?.toString() === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getStockStatus = (product) => {
    if (product.stock_quantity <= 0) {
      return { label: 'نفد المخزن', color: 'bg-red-100 text-red-800' };
    } else if (product.stock_quantity <= product.min_stock) {
      return { label: 'مخزن منخفض', color: 'bg-yellow-100 text-yellow-800' };
    } else {
      return { label: 'متوفر', color: 'bg-green-100 text-green-800' };
    }
  };

  if (loading && products.length === 0) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">جاري تحميل المخزن...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">إدارة المخزن</h1>
          <p className="text-gray-600 mt-2">إدارة المنتجات والفئات ومتابعة المخزن</p>
        </div>
        
        {/* إظهار حالة الصلاحيات */}
        <div className="flex items-center">
          {currentUser?.role === 'admin' ? (
            <Badge className="bg-green-100 text-green-800 flex items-center">
              <ShieldCheck className="h-4 w-4 mr-1" />
              صلاحيات المدير
            </Badge>
          ) : (
            <Badge className="bg-yellow-100 text-yellow-800 flex items-center">
              <ShieldAlert className="h-4 w-4 mr-1" />
              وضع العرض فقط
            </Badge>
          )}
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="products" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="products">المنتجات</TabsTrigger>
          <TabsTrigger value="categories">الفئات</TabsTrigger>
          <TabsTrigger value="movements">حركة المخزن</TabsTrigger>
          <TabsTrigger value="alerts">تنبيهات المخزن</TabsTrigger>
        </TabsList>

        {/* Products Tab */}
        <TabsContent value="products" className="space-y-6">
          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="البحث في المنتجات..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="جميع الفئات" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">جميع الفئات</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category.id} value={category.id.toString()}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {currentUser?.role === 'admin' && (
              <Button onClick={() => openProductDialog()} className="bg-blue-600 hover:bg-blue-700">
                <Plus className="mr-2 h-4 w-4" />
                منتج جديد
              </Button>
            )}
          </div>

          {/* Products Grid */}
          <div className="grid gap-4">
            {filteredProducts.map((product) => {
              const stockStatus = getStockStatus(product);
              return (
                <Card key={product.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 space-x-reverse">
                        <div className="p-3 bg-blue-50 rounded-full">
                          <Package className="h-6 w-6 text-blue-600" />
                        </div>
                        
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            {product.name}
                          </h3>
                          <div className="flex items-center space-x-4 space-x-reverse mt-2">
                            <Badge className={stockStatus.color}>
                              {stockStatus.label}
                            </Badge>
                            {product.category_name && (
                              <Badge variant="outline">
                                {product.category_name}
                              </Badge>
                            )}
                            {product.barcode && (
                              <span className="text-sm text-gray-500">
                                الباركود: {product.barcode}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center space-x-4 space-x-reverse mt-2 text-sm text-gray-600">
                            <span>المخزن: {product.stock_quantity} {product.unit}</span>
                            <span>الحد الأدنى: {product.min_stock} {product.unit}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-left">
                        <p className="text-lg font-bold text-green-600">
                          بيع: {parseFloat(product.selling_price).toFixed(2)} د.ع
                        </p>
                        <p className="text-sm text-gray-600">
                          شراء: {parseFloat(product.purchase_price).toFixed(2)} د.ع
                        </p>
                        {currentUser?.role === 'admin' && (
                          <div className="flex items-center space-x-2 space-x-reverse mt-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openProductDialog(product)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => deleteProduct(product.id)}
                              className="text-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {filteredProducts.length === 0 && !loading && (
            <Card>
              <CardContent className="p-12 text-center">
                <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  لا توجد منتجات
                </h3>
                <p className="text-gray-600 mb-4">
                  {currentUser?.role === 'admin' ? 'ابدأ بإضافة منتج جديد إلى المخزن' : 'لا توجد منتجات متاحة حالياً'}
                </p>
                {currentUser?.role === 'admin' && (
                  <Button onClick={() => openProductDialog()}>
                    <Plus className="mr-2 h-4 w-4" />
                    منتج جديد
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Categories Tab */}
        <TabsContent value="categories" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">فئات المنتجات</h2>
            {currentUser?.role === 'admin' && (
              <Button onClick={openCategoryDialog} className="bg-purple-600 hover:bg-purple-700">
                <Plus className="mr-2 h-4 w-4" />
                فئة جديدة
              </Button>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {categories.map((category) => (
              <Card key={category.id}>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-3 space-x-reverse">
                    <div className="p-2 bg-purple-50 rounded-full">
                      <Tag className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{category.name}</h3>
                      <p className="text-sm text-gray-600">{category.products_count || 0} منتج</p>
                      {category.description && (
                        <p className="text-sm text-gray-500 mt-1">{category.description}</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {categories.length === 0 && !loading && (
              <Card className="col-span-full">
                <CardContent className="p-12 text-center">
                  <Tag className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    لا توجد فئات
                  </h3>
                  <p className="text-gray-600 mb-4">
                    {currentUser?.role === 'admin' ? 'ابدأ بإضافة فئة جديدة' : 'لا توجد فئات متاحة حالياً'}
                  </p>
                  {currentUser?.role === 'admin' && (
                    <Button onClick={openCategoryDialog}>
                      <Plus className="mr-2 h-4 w-4" />
                      فئة جديدة
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Movements Tab */}
        <TabsContent value="movements" className="space-y-6">
          <h2 className="text-xl font-semibold">حركة المخزن</h2>
          
          <div className="space-y-4">
            {movements.length > 0 ? (
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="p-3 text-right">المنتج</th>
                      <th className="p-3 text-right">النوع</th>
                      <th className="p-3 text-right">الكمية</th>
                      <th className="p-3 text-right">المصدر</th>
                      <th className="p-3 text-right">التاريخ</th>
                      <th className="p-3 text-right">ملاحظات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {movements.map((movement) => (
                      <tr key={movement.id} className="border-t">
                        <td className="p-3">{movement.product_name}</td>
                        <td className="p-3">
                          <Badge className={movement.movement_type === 'in' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                            {movement.movement_type === 'in' ? 'إدخال' : 'إخراج'}
                          </Badge>
                        </td>
                        <td className="p-3">{movement.quantity}</td>
                        <td className="p-3">{movement.source}</td>
                        <td className="p-3">{new Date(movement.created_at).toLocaleDateString('ar-EG')}</td>
                        <td className="p-3">{movement.notes || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <Card>
                <CardContent className="p-12 text-center">
                  <History className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    لا توجد حركات مخزنية
                  </h3>
                  <p className="text-gray-600">
                    ستظهر هنا حركات المخزن عند إجراء عمليات البيع والشراء
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Alerts Tab */}
        <TabsContent value="alerts" className="space-y-6">
          <h2 className="text-xl font-semibold">تنبيهات المخزن</h2>
          
          <div className="space-y-4">
            {lowStockProducts.length > 0 ? (
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="p-3 text-right">المنتج</th>
                      <th className="p-3 text-right">الكمية الحالية</th>
                      <th className="p-3 text-right">الحد الأدنى</th>
                      <th className="p-3 text-right">الحالة</th>
                      <th className="p-3 text-right">الإجراء</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lowStockProducts.map((product) => (
                      <tr key={product.id} className="border-t">
                        <td className="p-3">{product.name}</td>
                        <td className="p-3">{product.stock_quantity} {product.unit}</td>
                        <td className="p-3">{product.min_stock} {product.unit}</td>
                        <td className="p-3">
                          <Badge className={product.stock_quantity <= 0 ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}>
                            {product.stock_quantity <= 0 ? 'نفد المخزن' : 'مخزن منخفض'}
                          </Badge>
                        </td>
                        <td className="p-3">
                          <Button size="sm" variant="outline">
                            طلب شراء
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <Card>
                <CardContent className="p-12 text-center">
                  <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    لا توجد تنبيهات
                  </h3>
                  <p className="text-gray-600">
                    جميع المنتجات متوفرة بكميات كافية في المخزن
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Product Dialog */}
      <Dialog open={isProductDialogOpen} onOpenChange={setIsProductDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingProduct ? 'تعديل منتج' : 'إضافة منتج جديد'}
            </DialogTitle>
            <DialogDescription>
              {editingProduct ? 'قم بتعديل بيانات المنتج' : 'أدخل بيانات المنتج الجديد'}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleProductSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <div>
              <Label htmlFor="name">اسم المنتج</Label>
              <Input
                id="name"
                value={productForm.name}
                onChange={(e) => setProductForm(prev => ({...prev, name: e.target.value}))}
                placeholder="أدخل اسم المنتج"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="description">الوصف</Label>
              <Input
                id="description"
                value={productForm.description}
                onChange={(e) => setProductForm(prev => ({...prev, description: e.target.value}))}
                placeholder="أدخل وصف المنتج"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="purchase_price">سعر الشراء</Label>
                <Input
                  id="purchase_price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={productForm.purchase_price}
                  onChange={(e) => setProductForm(prev => ({...prev, purchase_price: e.target.value}))}
                  placeholder="0.00"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="selling_price">سعر البيع</Label>
                <Input
                  id="selling_price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={productForm.selling_price}
                  onChange={(e) => setProductForm(prev => ({...prev, selling_price: e.target.value}))}
                  placeholder="0.00"
                  required
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="stock_quantity">الكمية الحالية</Label>
                <Input
                  id="stock_quantity"
                  type="number"
                  min="0"
                  value={productForm.stock_quantity}
                  onChange={(e) => setProductForm(prev => ({...prev, stock_quantity: e.target.value}))}
                  placeholder="0"
                />
              </div>
              
              <div>
                <Label htmlFor="min_stock">الحد الأدنى</Label>
                <Input
                  id="min_stock"
                  type="number"
                  min="0"
                  value={productForm.min_stock}
                  onChange={(e) => setProductForm(prev => ({...prev, min_stock: e.target.value}))}
                  placeholder="0"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="unit">وحدة القياس</Label>
                <Select
                  value={productForm.unit}
                  onValueChange={(value) => setProductForm(prev => ({...prev, unit: value}))}
                >
                  <SelectTrigger id="unit">
                    <SelectValue placeholder="اختر وحدة القياس" />
                  </SelectTrigger>
                  <SelectContent>
                    {units.map(unit => (
                      <SelectItem key={unit} value={unit}>
                        {unit}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="category_id">الفئة</Label>
                <Select
                  value={productForm.category_id}
                  onValueChange={(value) => setProductForm(prev => ({...prev, category_id: value}))}
                >
                  <SelectTrigger id="category_id">
                    <SelectValue placeholder="اختر الفئة" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">بدون فئة</SelectItem>
                    {categories.map(category => (
                      <SelectItem key={category.id} value={category.id.toString()}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div>
              <Label htmlFor="barcode">الباركود</Label>
              <Input
                id="barcode"
                value={productForm.barcode}
                onChange={(e) => setProductForm(prev => ({...prev, barcode: e.target.value}))}
                placeholder="أدخل الباركود (اختياري)"
              />
            </div>
            
            <div className="flex justify-end space-x-2 space-x-reverse pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsProductDialogOpen(false)}
              >
                إلغاء
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                {editingProduct ? 'تحديث المنتج' : 'إضافة المنتج'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Category Dialog */}
      <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>إضافة فئة جديدة</DialogTitle>
            <DialogDescription>أدخل بيانات الفئة الجديدة</DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleCategorySubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <div>
              <Label htmlFor="category_name">اسم الفئة</Label>
              <Input
                id="category_name"
                value={categoryForm.name}
                onChange={(e) => setCategoryForm(prev => ({...prev, name: e.target.value}))}
                placeholder="أدخل اسم الفئة"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="category_description">الوصف</Label>
              <Input
                id="category_description"
                value={categoryForm.description}
                onChange={(e) => setCategoryForm(prev => ({...prev, description: e.target.value}))}
                placeholder="أدخل وصف الفئة (اختياري)"
              />
            </div>
            
            <div className="flex justify-end space-x-2 space-x-reverse pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCategoryDialogOpen(false)}
              >
                إلغاء
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                إضافة الفئة
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default InventoryManagement;
