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
  Trash2, 
  Eye,
  Search,
  Calendar,
  DollarSign,
  User,
  Loader2,
  Printer,
  CreditCard,
  Receipt
} from 'lucide-react';
import api from '@/lib/api';

const PaymentVouchersManagement = () => {
  const [activeTab, setActiveTab] = useState('receipts');
  const [receipts, setReceipts] = useState([]);
  const [vouchers, setVouchers] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isReceiptDialogOpen, setIsReceiptDialogOpen] = useState(false);
  const [isVoucherDialogOpen, setIsVoucherDialogOpen] = useState(false);
  const [isPrintMode, setIsPrintMode] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  
  const [receiptFormData, setReceiptFormData] = useState({
    customer_id: '',
    amount: '',
    notes: ''
  });
  
  const [voucherFormData, setVoucherFormData] = useState({
    supplier_id: '',
    amount: '',
    notes: ''
  });

  // Load data on component mount
  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load common data
      const [customersRes, suppliersRes] = await Promise.all([
        api.get('/customers'),
        api.get('/suppliers')
      ]);
      
      setCustomers(customersRes.data.customers || []);
      setSuppliers(suppliersRes.data.suppliers || []);
      
      // Load tab-specific data
      if (activeTab === 'receipts') {
        const receiptsRes = await api.get('/payment-receipts');
        setReceipts(receiptsRes.data.receipts || []);
      } else {
        const vouchersRes = await api.get('/payment-vouchers');
        setVouchers(vouchersRes.data.vouchers || []);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'حدث خطأ في تحميل البيانات');
    } finally {
      setLoading(false);
    }
  };

  const handleReceiptSubmit = async (e) => {
    e.preventDefault();
    if (!receiptFormData.customer_id) {
      setError('يجب اختيار العميل');
      return;
    }
    
    if (!receiptFormData.amount || parseFloat(receiptFormData.amount) <= 0) {
      setError('يجب إدخال مبلغ صحيح');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await api.post('/payment-receipts', receiptFormData);
      await loadData();
      resetReceiptForm();
      setIsReceiptDialogOpen(false);
    } catch (err) {
      setError(err.response?.data?.error || 'حدث خطأ في حفظ سند القبض');
    } finally {
      setLoading(false);
    }
  };
  
  const handleVoucherSubmit = async (e) => {
    e.preventDefault();
    if (!voucherFormData.supplier_id) {
      setError('يجب اختيار المورد');
      return;
    }
    
    if (!voucherFormData.amount || parseFloat(voucherFormData.amount) <= 0) {
      setError('يجب إدخال مبلغ صحيح');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await api.post('/payment-vouchers', voucherFormData);
      await loadData();
      resetVoucherForm();
      setIsVoucherDialogOpen(false);
    } catch (err) {
      setError(err.response?.data?.error || 'حدث خطأ في حفظ سند الدفع');
    } finally {
      setLoading(false);
    }
  };

  const viewReceipt = async (receiptId) => {
    try {
      const response = await api.get(`/payment-receipts/${receiptId}`);
      setSelectedItem(response.data);
      setIsPrintMode(true);
      setIsReceiptDialogOpen(true);
    } catch (err) {
      setError('حدث خطأ في تحميل سند القبض');
    }
  };
  
  const viewVoucher = async (voucherId) => {
    try {
      const response = await api.get(`/payment-vouchers/${voucherId}`);
      setSelectedItem(response.data);
      setIsPrintMode(true);
      setIsVoucherDialogOpen(true);
    } catch (err) {
      setError('حدث خطأ في تحميل سند الدفع');
    }
  };

  const resetReceiptForm = () => {
    setReceiptFormData({
      customer_id: '',
      amount: '',
      notes: ''
    });
    setSelectedItem(null);
    setIsPrintMode(false);
  };
  
  const resetVoucherForm = () => {
    setVoucherFormData({
      supplier_id: '',
      amount: '',
      notes: ''
    });
    setSelectedItem(null);
    setIsPrintMode(false);
  };

  const openCreateReceiptDialog = () => {
    resetReceiptForm();
    setIsReceiptDialogOpen(true);
  };
  
  const openCreateVoucherDialog = () => {
    resetVoucherForm();
    setIsVoucherDialogOpen(true);
  };

  if (loading && receipts.length === 0 && vouchers.length === 0) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">جاري تحميل البيانات...</p>
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
          <h1 className="text-3xl font-bold text-gray-900">إدارة السندات</h1>
          <p className="text-gray-600 mt-2">إنشاء وإدارة سندات القبض والدفع</p>
        </div>
      </div>
      
      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="receipts" className="text-base">
            <Receipt className="h-4 w-4 mr-2" />
            سندات القبض
          </TabsTrigger>
          <TabsTrigger value="vouchers" className="text-base">
            <CreditCard className="h-4 w-4 mr-2" />
            سندات الدفع
          </TabsTrigger>
        </TabsList>
        
        {/* سندات القبض */}
        <TabsContent value="receipts" className="space-y-4 mt-4">
          <div className="flex justify-between items-center">
            <div className="flex gap-4 flex-1">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="بحث عن سند قبض..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Button onClick={loadData}>بحث</Button>
            </div>
            
            <Dialog open={isReceiptDialogOpen} onOpenChange={setIsReceiptDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={openCreateReceiptDialog} className="bg-green-600 hover:bg-green-700">
                  <Plus className="mr-2 h-4 w-4" />
                  سند قبض جديد
                </Button>
              </DialogTrigger>
              
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>
                    {isPrintMode ? 'طباعة سند القبض' : 'إنشاء سند قبض جديد'}
                  </DialogTitle>
                  <DialogDescription>
                    {isPrintMode ? 'معاينة سند القبض قبل الطباعة' : 'أدخل بيانات سند القبض'}
                  </DialogDescription>
                </DialogHeader>
                
                {isPrintMode && selectedItem ? (
                  // Print Mode
                  <div className="space-y-6 p-4 border rounded-lg">
                    <div className="text-center border-b pb-4">
                      <h2 className="text-xl font-bold">سند قبض</h2>
                      <p className="text-sm text-gray-500">رقم: {selectedItem.receipt_number}</p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>التاريخ</Label>
                        <p>{new Date(selectedItem.receipt_date).toLocaleDateString('ar-EG')}</p>
                      </div>
                      <div>
                        <Label>المبلغ</Label>
                        <p className="font-bold">{selectedItem.amount} د.ع</p>
                      </div>
                      <div className="col-span-2">
                        <Label>استلمنا من السيد/ة</Label>
                        <p>{selectedItem.customer.name}</p>
                      </div>
                      <div className="col-span-2">
                        <Label>ملاحظات</Label>
                        <p>{selectedItem.notes || '-'}</p>
                      </div>
                    </div>
                    
                    <div className="flex justify-between pt-6 border-t mt-6">
                      <div>
                        <Label>المستلم</Label>
                        <p>{selectedItem.user_name}</p>
                      </div>
                      <div>
                        <Label>التوقيع</Label>
                        <p>____________</p>
                      </div>
                    </div>
                    
                    <div className="flex justify-center mt-4">
                      <Button onClick={() => window.print()}>
                        <Printer className="mr-2 h-4 w-4" />
                        طباعة
                      </Button>
                    </div>
                  </div>
                ) : (
                  // Create Mode
                  <form onSubmit={handleReceiptSubmit} className="space-y-6">
                    {error && (
                      <Alert variant="destructive">
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    )}
                    
                    <div>
                      <Label>العميل</Label>
                      <Select 
                        value={receiptFormData.customer_id} 
                        onValueChange={(value) => setReceiptFormData(prev => ({...prev, customer_id: value}))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="اختر العميل" />
                        </SelectTrigger>
                        <SelectContent>
                          {customers.map(customer => (
                            <SelectItem key={customer.id} value={customer.id.toString()}>
                              {customer.name} - الرصيد: {customer.balance} د.ع
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label>المبلغ</Label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={receiptFormData.amount}
                        onChange={(e) => setReceiptFormData(prev => ({...prev, amount: e.target.value}))}
                        placeholder="أدخل المبلغ"
                      />
                    </div>
                    
                    <div>
                      <Label>ملاحظات</Label>
                      <Input
                        value={receiptFormData.notes}
                        onChange={(e) => setReceiptFormData(prev => ({...prev, notes: e.target.value}))}
                        placeholder="أدخل أي ملاحظات إضافية"
                      />
                    </div>
                    
                    <div className="flex justify-end space-x-2">
                      <Button type="button" variant="outline" onClick={() => setIsReceiptDialogOpen(false)}>
                        إلغاء
                      </Button>
                      <Button type="submit" disabled={loading}>
                        {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                        حفظ السند
                      </Button>
                    </div>
                  </form>
                )}
              </DialogContent>
            </Dialog>
          </div>
          
          {/* Receipts List */}
          <div className="space-y-4">
            {receipts.length === 0 ? (
              <div className="text-center p-8 border rounded-lg bg-gray-50">
                <Receipt className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900">لا توجد سندات قبض</h3>
                <p className="text-gray-600 mt-1">قم بإنشاء سند قبض جديد للبدء</p>
              </div>
            ) : (
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="p-3 text-right">رقم السند</th>
                      <th className="p-3 text-right">العميل</th>
                      <th className="p-3 text-right">المبلغ</th>
                      <th className="p-3 text-right">التاريخ</th>
                      <th className="p-3 text-right">إجراءات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {receipts.map(receipt => (
                      <tr key={receipt.id} className="border-t">
                        <td className="p-3">{receipt.receipt_number}</td>
                        <td className="p-3">{receipt.customer_name}</td>
                        <td className="p-3">{receipt.amount} د.ع</td>
                        <td className="p-3">{new Date(receipt.receipt_date).toLocaleDateString('ar-EG')}</td>
                        <td className="p-3">
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => viewReceipt(receipt.id)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => viewReceipt(receipt.id)}
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
        </TabsContent>
        
        {/* سندات الدفع */}
        <TabsContent value="vouchers" className="space-y-4 mt-4">
          <div className="flex justify-between items-center">
            <div className="flex gap-4 flex-1">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="بحث عن سند دفع..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Button onClick={loadData}>بحث</Button>
            </div>
            
            <Dialog open={isVoucherDialogOpen} onOpenChange={setIsVoucherDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={openCreateVoucherDialog} className="bg-purple-600 hover:bg-purple-700">
                  <Plus className="mr-2 h-4 w-4" />
                  سند دفع جديد
                </Button>
              </DialogTrigger>
              
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>
                    {isPrintMode ? 'طباعة سند الدفع' : 'إنشاء سند دفع جديد'}
                  </DialogTitle>
                  <DialogDescription>
                    {isPrintMode ? 'معاينة سند الدفع قبل الطباعة' : 'أدخل بيانات سند الدفع'}
                  </DialogDescription>
                </DialogHeader>
                
                {isPrintMode && selectedItem ? (
                  // Print Mode
                  <div className="space-y-6 p-4 border rounded-lg">
                    <div className="text-center border-b pb-4">
                      <h2 className="text-xl font-bold">سند دفع</h2>
                      <p className="text-sm text-gray-500">رقم: {selectedItem.voucher_number}</p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>التاريخ</Label>
                        <p>{new Date(selectedItem.voucher_date).toLocaleDateString('ar-EG')}</p>
                      </div>
                      <div>
                        <Label>المبلغ</Label>
                        <p className="font-bold">{selectedItem.amount} د.ع</p>
                      </div>
                      <div className="col-span-2">
                        <Label>دفعنا إلى السيد/ة</Label>
                        <p>{selectedItem.supplier.name}</p>
                      </div>
                      <div className="col-span-2">
                        <Label>ملاحظات</Label>
                        <p>{selectedItem.notes || '-'}</p>
                      </div>
                    </div>
                    
                    <div className="flex justify-between pt-6 border-t mt-6">
                      <div>
                        <Label>الدافع</Label>
                        <p>{selectedItem.user_name}</p>
                      </div>
                      <div>
                        <Label>التوقيع</Label>
                        <p>____________</p>
                      </div>
                    </div>
                    
                    <div className="flex justify-center mt-4">
                      <Button onClick={() => window.print()}>
                        <Printer className="mr-2 h-4 w-4" />
                        طباعة
                      </Button>
                    </div>
                  </div>
                ) : (
                  // Create Mode
                  <form onSubmit={handleVoucherSubmit} className="space-y-6">
                    {error && (
                      <Alert variant="destructive">
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    )}
                    
                    <div>
                      <Label>المورد</Label>
                      <Select 
                        value={voucherFormData.supplier_id} 
                        onValueChange={(value) => setVoucherFormData(prev => ({...prev, supplier_id: value}))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="اختر المورد" />
                        </SelectTrigger>
                        <SelectContent>
                          {suppliers.map(supplier => (
                            <SelectItem key={supplier.id} value={supplier.id.toString()}>
                              {supplier.name} - الرصيد: {supplier.balance} د.ع
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label>المبلغ</Label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={voucherFormData.amount}
                        onChange={(e) => setVoucherFormData(prev => ({...prev, amount: e.target.value}))}
                        placeholder="أدخل المبلغ"
                      />
                    </div>
                    
                    <div>
                      <Label>ملاحظات</Label>
                      <Input
                        value={voucherFormData.notes}
                        onChange={(e) => setVoucherFormData(prev => ({...prev, notes: e.target.value}))}
                        placeholder="أدخل أي ملاحظات إضافية"
                      />
                    </div>
                    
                    <div className="flex justify-end space-x-2">
                      <Button type="button" variant="outline" onClick={() => setIsVoucherDialogOpen(false)}>
                        إلغاء
                      </Button>
                      <Button type="submit" disabled={loading}>
                        {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                        حفظ السند
                      </Button>
                    </div>
                  </form>
                )}
              </DialogContent>
            </Dialog>
          </div>
          
          {/* Vouchers List */}
          <div className="space-y-4">
            {vouchers.length === 0 ? (
              <div className="text-center p-8 border rounded-lg bg-gray-50">
                <CreditCard className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900">لا توجد سندات دفع</h3>
                <p className="text-gray-600 mt-1">قم بإنشاء سند دفع جديد للبدء</p>
              </div>
            ) : (
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="p-3 text-right">رقم السند</th>
                      <th className="p-3 text-right">المورد</th>
                      <th className="p-3 text-right">المبلغ</th>
                      <th className="p-3 text-right">التاريخ</th>
                      <th className="p-3 text-right">إجراءات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vouchers.map(voucher => (
                      <tr key={voucher.id} className="border-t">
                        <td className="p-3">{voucher.voucher_number}</td>
                        <td className="p-3">{voucher.supplier_name}</td>
                        <td className="p-3">{voucher.amount} د.ع</td>
                        <td className="p-3">{new Date(voucher.voucher_date).toLocaleDateString('ar-EG')}</td>
                        <td className="p-3">
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => viewVoucher(voucher.id)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => viewVoucher(voucher.id)}
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
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PaymentVouchersManagement;
