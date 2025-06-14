import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Plus, 
  ShoppingBag, 
  Eye,
  Loader2,
  Printer,
  Trash2
} from 'lucide-react';
import api from '@/lib/api';
import InvoicePrint from './InvoicePrint';

const PurchaseManagement = () => {
  const [invoices, setInvoices] = useState([]);
  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [isViewMode, setIsViewMode] = useState(false);
  const [isPrintMode, setIsPrintMode] = useState(false);
  
  const [formData, setFormData] = useState({
    supplier_id: '',
    payment_type: 'cash',
    notes: '',
    discount: 0,
    tax: 0,
    items: []
  });

  const [newItem, setNewItem] = useState({
    product_id: '',
    quantity: 1,
    unit_price: 0
  });

  // Load data on component mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [invoicesRes, productsRes, suppliersRes] = await Promise.all([
        api.get('/purchases/invoices'),
        api.get('/products'),
        api.get('/suppliers')
      ]);
      
      setInvoices(invoicesRes.data.invoices || []);
      setProducts(productsRes.data.products || []);
      setSuppliers(suppliersRes.data.suppliers || []);
    } catch (err) {
      setError(err.response?.data?.error || 'حدث خطأ في تحميل البيانات');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.items.length === 0) {
      setError('يجب إضافة منتج واحد على الأقل');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await api.post('/purchases/invoices', formData);
      await loadData();
      resetForm();
      setIsDialogOpen(false);
    } catch (err) {
      setError(err.response?.data?.error || 'حدث خطأ في حفظ الفاتورة');
    } finally {
      setLoading(false);
    }
  };

  const printInvoice = async (invoiceId) => {
    try {
      const response = await api.get(`/purchases/invoices/${invoiceId}`);
      setSelectedInvoice(response.data);
      setIsPrintMode(true);
      setIsDialogOpen(true);
    } catch (err) {
      setError('حدث خطأ في تحميل الفاتورة للطباعة');
    }
  };

  const resetForm = () => {
    setFormData({
      supplier_id: '',
      payment_type: 'cash',
      notes: '',
      discount: 0,
      tax: 0,
      items: []
    });
    setNewItem({
      product_id: '',
      quantity: 1,
      unit_price: 0
    });
    setSelectedInvoice(null);
    setIsViewMode(false);
    setIsPrintMode(false);
  };

  const addItem = () => {
    if (!newItem.product_id) {
      setError('يجب اختيار منتج');
      return;
    }

    const product = products.find(p => p.id === parseInt(newItem.product_id));
    if (!product) return;

    const item = {
      product_id: parseInt(newItem.product_id),
      product_name: product.name,
      quantity: parseInt(newItem.quantity),
      unit_price: parseFloat(newItem.unit_price || product.purchase_price),
      total_price: parseInt(newItem.quantity) * parseFloat(newItem.unit_price || product.purchase_price)
    };

    setFormData(prev => ({
      ...prev,
      items: [...prev.items, item]
    }));

    setNewItem({
      product_id: '',
      quantity: 1,
      unit_price: 0
    });
    setError('');
  };

  const removeItem = (index) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const calculateTotal = () => {
    const subtotal = formData.items.reduce((sum, item) => sum + item.total_price, 0);
    return subtotal - formData.discount + formData.tax;
  };

  const openCreateDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const viewInvoice = async (invoiceId) => {
    try {
      const response = await api.get(`/purchases/invoices/${invoiceId}`);
      setSelectedInvoice(response.data);
      setIsViewMode(true);
      setIsDialogOpen(true);
    } catch (err) {
      setError('حدث خطأ في تحميل الفاتورة');
    }
  };

  if (loading && invoices.length === 0) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">جاري تحميل فواتير المشتريات...</p>
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
          <h1 className="text-3xl font-bold text-gray-900">إدارة المشتريات</h1>
          <p className="text-gray-600 mt-2">إنشاء وإدارة فواتير المشتريات</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog} className="bg-purple-600 hover:bg-purple-700">
              <Plus className="mr-2 h-4 w-4" />
              فاتورة مشتريات جديدة
            </Button>
          </DialogTrigger>
          
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {isPrintMode ? 'طباعة فاتورة المشتريات' : 
                 isViewMode ? 'عرض فاتورة المشتريات' : 'إنشاء فاتورة مشتريات جديدة'}
              </DialogTitle>
              <DialogDescription>
                {isPrintMode ? 'معاينة الفاتورة قبل الطباعة' :
                 isViewMode ? 'تفاصيل الفاتورة' : 'أدخل بيانات فاتورة المشتريات'}
              </DialogDescription>
            </DialogHeader>
            
            {isPrintMode && selectedInvoice ? (
              // Print Mode
              <InvoicePrint invoice={selectedInvoice} type="purchase" />
            ) : isViewMode && selectedInvoice ? (
              // View Mode - Similar to sales but for purchases
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>رقم الفاتورة</Label>
                    <p className="font-bold text-lg">{selectedInvoice.invoice_number}</p>
                  </div>
                  <div>
                    <Label>التاريخ</Label>
                    <p>{new Date(selectedInvoice.created_at).toLocaleDateString('ar-EG')}</p>
                  </div>
                  <div>
                    <Label>المورد</Label>
                    <p>{selectedInvoice.supplier?.name || 'مورد نقدي'}</p>
                  </div>
                  <div>
                    <Label>نوع الدفع</Label>
                    <Badge variant={selectedInvoice.payment_type === 'cash' ? 'default' : 'secondary'}>
                      {selectedInvoice.payment_type === 'cash' ? 'نقدي' : 'آجل'}
                    </Badge>
                  </div>
                </div>
                
                <div>
                  <Label>المنتجات</Label>
                  <div className="mt-2 border rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="p-3 text-right">المنتج</th>
                          <th className="p-3 text-right">الكمية</th>
                          <th className="p-3 text-right">السعر</th>
                          <th className="p-3 text-right">المجموع</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedInvoice.items?.map((item, index) => (
                          <tr key={index} className="border-t">
                            <td className="p-3">{item.product?.name}</td>
                            <td className="p-3">{item.quantity}</td>
                            <td className="p-3">{item.unit_price} د.ع</td>
                            <td className="p-3">{item.total_price} د.ع</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                  <div>
                    <Label>المجموع الكلي</Label>
                    <p className="font-bold text-lg text-purple-600">{selectedInvoice.total_amount} د.ع</p>
                  </div>
                </div>
              </div>
            ) : (
              // Create Mode - Similar form structure as sales
              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>المورد</Label>
                    <Select value={formData.supplier_id} onValueChange={(value) => setFormData(prev => ({...prev, supplier_id: value}))}>
                      <SelectTrigger>
                        <SelectValue placeholder="اختر المورد" />
                      </SelectTrigger>
                      <SelectContent>
                        {suppliers.map(supplier => (
                          <SelectItem key={supplier.id} value={supplier.id.toString()}>
                            {supplier.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label>نوع الدفع</Label>
                    <Select value={formData.payment_type} onValueChange={(value) => setFormData(prev => ({...prev, payment_type: value}))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash">نقدي</SelectItem>
                        <SelectItem value="credit">آجل</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                {/* Add Item Section */}
                <div className="border rounded-lg p-4 bg-gray-50">
                  <h3 className="font-semibold mb-4">إضافة منتج</h3>
                  <div className="grid grid-cols-4 gap-4">
                    <div>
                      <Label>المنتج</Label>
                      <Select value={newItem.product_id} onValueChange={(value) => {
                        const product = products.find(p => p.id === parseInt(value));
                        setNewItem(prev => ({
                          ...prev, 
                          product_id: value,
                          unit_price: product ? product.purchase_price : 0
                        }));
                      }}>
                        <SelectTrigger>
                          <SelectValue placeholder="اختر المنتج" />
                        </SelectTrigger>
                        <SelectContent>
                          {products.map(product => (
                            <SelectItem key={product.id} value={product.id.toString()}>
                              {product.name} - {product.purchase_price} د.ع
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label>الكمية</Label>
                      <Input
                        type="number"
                        min="1"
                        value={newItem.quantity}
                        onChange={(e) => setNewItem(prev => ({...prev, quantity: e.target.value}))}
                      />
                    </div>
                    
                    <div>
                      <Label>السعر</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={newItem.unit_price}
                        onChange={(e) => setNewItem(prev => ({...prev, unit_price: e.target.value}))}
                      />
                    </div>
                    
                    <div className="flex items-end">
                      <Button type="button" onClick={addItem} className="w-full">
                        <Plus className="mr-2 h-4 w-4" />
                        إضافة
                      </Button>
                    </div>
                  </div>
                </div>
                
                {/* Items List */}
                {formData.items.length > 0 && (
                  <div>
                    <Label>المنتجات المضافة</Label>
                    <div className="mt-2 border rounded-lg overflow-hidden">
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="p-3 text-right">المنتج</th>
                            <th className="p-3 text-right">الكمية</th>
                            <th className="p-3 text-right">السعر</th>
                            <th className="p-3 text-right">المجموع</th>
                            <th className="p-3 text-right">إجراءات</th>
                          </tr>
                        </thead>
                        <tbody>
                          {formData.items.map((item, index) => (
                            <tr key={index} className="border-t">
                              <td className="p-3">{item.product_name}</td>
                              <td className="p-3">{item.quantity}</td>
                              <td className="p-3">{item.unit_price} د.ع</td>
                              <td className="p-3">{item.total_price} د.ع</td>
                              <td className="p-3">
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => removeItem(index)}
                                  className="text-red-600"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>الخصم</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.discount}
                      onChange={(e) => setFormData(prev => ({...prev, discount: parseFloat(e.target.value) || 0}))}
                    />
                  </div>
                  
                  <div>
                    <Label>المجموع الكلي</Label>
                    <p className="text-2xl font-bold text-purple-600 mt-2">
                      {calculateTotal().toFixed(2)} د.ع
                    </p>
                  </div>
                </div>
                
                <div>
                  <Label>ملاحظات</Label>
                  <Input
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({...prev, notes: e.target.value}))}
                    placeholder="ملاحظات إضافية"
                  />
                </div>
                
                <div className="flex justify-end space-x-2 space-x-reverse pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                  >
                    إلغاء
                  </Button>
                  <Button type="submit" disabled={loading || formData.items.length === 0}>
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        جاري الحفظ...
                      </>
                    ) : (
                      <>
                        <ShoppingBag className="mr-2 h-4 w-4" />
                        إنشاء الفاتورة
                      </>
                    )}
                  </Button>
                </div>
              </form>
            )}
          </DialogContent>
        </Dialog>
      </div>

      {/* Invoices List */}
      <div className="grid gap-4">
        {invoices.map((invoice) => (
          <Card key={invoice.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4 space-x-reverse">
                  <div className="p-3 bg-purple-50 rounded-full">
                    <ShoppingBag className="h-6 w-6 text-purple-600" />
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      فاتورة رقم {invoice.invoice_number}
                    </h3>
                    <p className="text-gray-600">{invoice.supplier_name}</p>
                    <div className="flex items-center space-x-4 space-x-reverse mt-2">
                      <Badge variant={invoice.payment_type === 'cash' ? 'default' : 'secondary'}>
                        {invoice.payment_type === 'cash' ? 'نقدي' : 'آجل'}
                      </Badge>
                      <span className="text-sm text-gray-500">
                        {new Date(invoice.created_at).toLocaleDateString('ar-EG')}
                      </span>
                      <span className="text-sm text-gray-500">
                        {invoice.items_count} منتج
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="text-left">
                  <p className="text-2xl font-bold text-purple-600">
                    {invoice.total_amount} د.ع
                  </p>
                  <div className="flex items-center space-x-2 space-x-reverse mt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => viewInvoice(invoice.id)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => printInvoice(invoice.id)}
                      className="text-blue-600"
                    >
                      <Printer className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {invoices.length === 0 && !loading && (
        <Card>
          <CardContent className="p-12 text-center">
            <ShoppingBag className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              لا توجد فواتير مشتريات
            </h3>
            <p className="text-gray-600 mb-4">
              ابدأ بإنشاء فاتورة مشتريات جديدة
            </p>
            <Button onClick={openCreateDialog}>
              <Plus className="mr-2 h-4 w-4" />
              فاتورة مشتريات جديدة
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PurchaseManagement;

