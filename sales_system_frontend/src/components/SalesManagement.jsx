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
  Edit, 
  Trash2, 
  ShoppingCart, 
  Eye,
  Search,
  Calendar,
  DollarSign,
  Package,
  User,
  Loader2,
  Printer
} from 'lucide-react';
import api from '@/lib/api';
import InvoicePrint from './InvoicePrint';

const SalesManagement = () => {
  const [invoices, setInvoices] = useState([]);
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [isViewMode, setIsViewMode] = useState(false);
  const [isPrintMode, setIsPrintMode] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [formData, setFormData] = useState({
    customer_id: '',
    customer_name: '', // حقل جديد لاسم الزبون للمبيعات النقدية
    payment_type: 'cash',
    notes: '',
    discount_percentage: 0, // تغيير من discount إلى discount_percentage
    items: []
  });

  const [newItem, setNewItem] = useState({
    product_id: '',
    color: '', // حقل جديد للون
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
      const [invoicesRes, productsRes, customersRes] = await Promise.all([
        api.get('/sales/invoices', { params: { search: searchTerm } }),
        api.get('/products'),
        api.get('/customers')
      ]);
      
      setInvoices(invoicesRes.data.invoices || []);
      setProducts(productsRes.data.products || []);
      setCustomers(customersRes.data.customers || []);
    } catch (err) {
      setError(err.response?.data?.error || 'حدث خطأ في تحميل البيانات');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    loadData();
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
      await api.post('/sales/invoices', formData);
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
      const response = await api.get(`/sales/invoices/${invoiceId}`);
      setSelectedInvoice(response.data);
      setIsPrintMode(true);
      setIsDialogOpen(true);
    } catch (err) {
      setError('حدث خطأ في تحميل الفاتورة للطباعة');
    }
  };

  const resetForm = () => {
    setFormData({
      customer_id: '',
      customer_name: '',
      payment_type: 'cash',
      notes: '',
      discount_percentage: 0,
      items: []
    });
    setNewItem({
      product_id: '',
      color: '',
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
      color: newItem.color, // إضافة اللون
      quantity: parseInt(newItem.quantity),
      unit_price: parseFloat(newItem.unit_price || product.selling_price),
      total_price: parseInt(newItem.quantity) * parseFloat(newItem.unit_price || product.selling_price)
    };

    setFormData(prev => ({
      ...prev,
      items: [...prev.items, item]
    }));

    setNewItem({
      product_id: '',
      color: '',
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
    const discount = subtotal * (formData.discount_percentage / 100);
    return subtotal - discount;
  };

  const openCreateDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const viewInvoice = async (invoiceId) => {
    try {
      const response = await api.get(`/sales/invoices/${invoiceId}`);
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
            <p className="text-gray-600">جاري تحميل فواتير المبيعات...</p>
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
          <h1 className="text-3xl font-bold text-gray-900">إدارة المبيعات</h1>
          <p className="text-gray-600 mt-2">إنشاء وإدارة فواتير المبيعات</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog} className="bg-green-600 hover:bg-green-700">
              <Plus className="mr-2 h-4 w-4" />
              فاتورة مبيعات جديدة
            </Button>
          </DialogTrigger>
          
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {isPrintMode ? 'طباعة فاتورة المبيعات' : 
                 isViewMode ? 'عرض فاتورة المبيعات' : 'إنشاء فاتورة مبيعات جديدة'}
              </DialogTitle>
              <DialogDescription>
                {isPrintMode ? 'معاينة الفاتورة قبل الطباعة' :
                 isViewMode ? 'تفاصيل الفاتورة' : 'أدخل بيانات فاتورة المبيعات'}
              </DialogDescription>
            </DialogHeader>
            
            {isPrintMode && selectedInvoice ? (
              // Print Mode
              <InvoicePrint invoice={selectedInvoice} type="sales" />
            ) : isViewMode && selectedInvoice ? (
              // View Mode
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
                    <Label>العميل</Label>
                    <p>{selectedInvoice.customer.name}</p>
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
                          <th className="p-3 text-right">اللون</th>
                          <th className="p-3 text-right">الكمية</th>
                          <th className="p-3 text-right">السعر</th>
                          <th className="p-3 text-right">المجموع</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedInvoice.items.map((item, index) => (
                          <tr key={index} className="border-t">
                            <td className="p-3">{item.product.name}</td>
                            <td className="p-3">{item.color || '-'}</td>
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
                    <Label>المجموع الفرعي</Label>
                    <p className="font-bold">{selectedInvoice.total_amount} د.ع</p>
                  </div>
                  <div>
                    <Label>نسبة الخصم</Label>
                    <p>{selectedInvoice.discount_percentage}%</p>
                  </div>
                  <div>
                    <Label>قيمة الخصم</Label>
                    <p>{selectedInvoice.discount} د.ع</p>
                  </div>
                  <div>
                    <Label>المجموع الكلي</Label>
                    <p className="font-bold text-lg text-green-600">{selectedInvoice.final_amount} د.ع</p>
                  </div>
                </div>
                
                {selectedInvoice.notes && (
                  <div>
                    <Label>ملاحظات</Label>
                    <p className="mt-1 p-3 bg-gray-50 rounded">{selectedInvoice.notes}</p>
                  </div>
                )}
              </div>
            ) : (
              // Create Mode
              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>نوع الدفع</Label>
                    <Select 
                      value={formData.payment_type} 
                      onValueChange={(value) => setFormData(prev => ({...prev, payment_type: value}))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash">نقدي</SelectItem>
                        <SelectItem value="credit">آجل</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {formData.payment_type === 'cash' ? (
                    <div>
                      <Label>اسم الزبون (اختياري)</Label>
                      <Input
                        value={formData.customer_name}
                        onChange={(e) => setFormData(prev => ({...prev, customer_name: e.target.value}))}
                        placeholder="أدخل اسم الزبون"
                      />
                    </div>
                  ) : (
                    <div>
                      <Label>العميل</Label>
                      <Select 
                        value={formData.customer_id} 
                        onValueChange={(value) => setFormData(prev => ({...prev, customer_id: value}))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="اختر العميل" />
                        </SelectTrigger>
                        <SelectContent>
                          {customers.map(customer => (
                            <SelectItem key={customer.id} value={customer.id.toString()}>
                              {customer.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
                
                {/* Add Item Section */}
                <div className="border rounded-lg p-4 bg-gray-50">
                  <h3 className="font-semibold mb-4">إضافة منتج</h3>
                  <div className="grid grid-cols-5 gap-4">
                    <div>
                      <Label>المنتج</Label>
                      <Select value={newItem.product_id} onValueChange={(value) => {
                        const product = products.find(p => p.id === parseInt(value));
                        setNewItem(prev => ({
                          ...prev, 
                          product_id: value,
                          unit_price: product ? product.selling_price : 0
                        }));
                      }}>
                        <SelectTrigger>
                          <SelectValue placeholder="اختر المنتج" />
                        </SelectTrigger>
                        <SelectContent>
                          {products.map(product => (
                            <SelectItem key={product.id} value={product.id.toString()}>
                              {product.name} - {product.selling_price} د.ع
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label>اللون</Label>
                      <Input
                        value={newItem.color}
                        onChange={(e) => setNewItem(prev => ({...prev, color: e.target.value}))}
                        placeholder="أدخل اللون"
                      />
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
                            <th className="p-3 text-right">اللون</th>
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
                              <td className="p-3">{item.color || '-'}</td>
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
                
                {/* Discount and Total */}
                <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                  <div>
                    <Label>نسبة الخصم (%)</Label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={formData.discount_percentage}
                      onChange={(e) => setFormData(prev => ({...prev, discount_percentage: parseFloat(e.target.value) || 0}))}
                    />
                  </div>
                  <div>
                    <Label>المجموع الكلي</Label>
                    <p className="font-bold text-lg text-green-600">{calculateTotal()} د.ع</p>
                  </div>
                </div>
                
                <div>
                  <Label>ملاحظات</Label>
                  <Input
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({...prev, notes: e.target.value}))}
                    placeholder="أدخل أي ملاحظات إضافية"
                  />
                </div>
                
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    إلغاء
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    حفظ الفاتورة
                  </Button>
                </div>
              </form>
            )}
          </DialogContent>
        </Dialog>
      </div>
      
      {/* Search */}
      <div className="flex gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="بحث عن فاتورة بالرقم أو اسم العميل..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>
        </div>
        <Button onClick={handleSearch}>بحث</Button>
      </div>
      
      {/* Invoices List */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">فواتير المبيعات</h2>
        
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {invoices.length === 0 ? (
          <div className="text-center p-8 border rounded-lg bg-gray-50">
            <Package className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900">لا توجد فواتير</h3>
            <p className="text-gray-600 mt-1">قم بإنشاء فاتورة مبيعات جديدة للبدء</p>
          </div>
        ) : (
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-3 text-right">رقم الفاتورة</th>
                  <th className="p-3 text-right">العميل</th>
                  <th className="p-3 text-right">نوع الدفع</th>
                  <th className="p-3 text-right">المبلغ</th>
                  <th className="p-3 text-right">التاريخ</th>
                  <th className="p-3 text-right">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map(invoice => (
                  <tr key={invoice.id} className="border-t">
                    <td className="p-3">{invoice.invoice_number}</td>
                    <td className="p-3">{invoice.customer_name}</td>
                    <td className="p-3">
                      <Badge variant={invoice.payment_type === 'cash' ? 'default' : 'secondary'}>
                        {invoice.payment_type === 'cash' ? 'نقدي' : 'آجل'}
                      </Badge>
                    </td>
                    <td className="p-3">{invoice.total_amount} د.ع</td>
                    <td className="p-3">{new Date(invoice.created_at).toLocaleDateString('ar-EG')}</td>
                    <td className="p-3">
                      <div className="flex space-x-2">
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
                        >
                          <Printer className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default SalesManagement;
