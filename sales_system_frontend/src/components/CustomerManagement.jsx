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
  Users, 
  Search,
  Edit,
  Trash2,
  Loader2,
  UserPlus,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  UserCheck
} from 'lucide-react';
import api from '@/lib/api';

const CustomerManagement = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [isCustomerDialogOpen, setIsCustomerDialogOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  
  const [customerForm, setCustomerForm] = useState({
    name: '',
    phone: '',
    address: '',
    email: '',
    customer_type: 'regular'
  });

  const customerTypes = [
    { value: 'regular', label: 'زبون دائم' },
    { value: 'agent', label: 'وكيل' }
  ];

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
      const response = await api.get('/customers');
      setCustomers(response.data.customers || []);
    } catch (err) {
      setError(err.response?.data?.error || 'حدث خطأ في تحميل البيانات');
    } finally {
      setLoading(false);
    }
  };

  const handleCustomerSubmit = async (e) => {
    e.preventDefault();
    if (!customerForm.name) {
      setError('يجب إدخال اسم العميل');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const data = {
        ...customerForm
      };

      if (editingCustomer) {
        await api.put(`/customers/${editingCustomer.id}`, data);
      } else {
        await api.post('/customers', data);
      }
      
      await loadData();
      resetCustomerForm();
      setIsCustomerDialogOpen(false);
    } catch (err) {
      setError(err.response?.data?.error || 'حدث خطأ في حفظ العميل');
    } finally {
      setLoading(false);
    }
  };

  const deleteCustomer = async (customerId) => {
    // التحقق من صلاحيات المستخدم
    if (currentUser?.role !== 'admin') {
      setError('لا تملك الصلاحيات الكافية لحذف العملاء');
      return;
    }

    if (!confirm('هل أنت متأكد من حذف هذا العميل؟')) {
      return;
    }

    try {
      await api.delete(`/customers/${customerId}`);
      await loadData();
    } catch (err) {
      setError(err.response?.data?.error || 'حدث خطأ في حذف العميل');
    }
  };

  const resetCustomerForm = () => {
    setCustomerForm({
      name: '',
      phone: '',
      address: '',
      email: '',
      customer_type: 'regular'
    });
    setEditingCustomer(null);
    setError('');
  };

  const openCustomerDialog = (customer = null) => {
    if (customer) {
      setCustomerForm({
        name: customer.name,
        phone: customer.phone || '',
        address: customer.address || '',
        email: customer.email || '',
        customer_type: customer.customer_type || 'regular'
      });
      setEditingCustomer(customer);
    } else {
      resetCustomerForm();
    }
    setIsCustomerDialogOpen(true);
  };

  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (customer.phone && customer.phone.includes(searchTerm));
    const matchesType = !selectedType || customer.customer_type === selectedType;
    return matchesSearch && matchesType;
  });

  const getCustomerTypeLabel = (type) => {
    const customerType = customerTypes.find(t => t.value === type);
    return customerType ? customerType.label : 'زبون دائم';
  };

  const getCustomerTypeColor = (type) => {
    switch (type) {
      case 'agent':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  if (loading && customers.length === 0) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">جاري تحميل بيانات العملاء...</p>
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
          <h1 className="text-3xl font-bold text-gray-900">إدارة العملاء</h1>
          <p className="text-gray-600 mt-2">إدارة العملاء والوكلاء ومتابعة الحسابات</p>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="all" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="all">جميع العملاء</TabsTrigger>
          <TabsTrigger value="regular">الزبائن الدائمين</TabsTrigger>
          <TabsTrigger value="agent">الوكلاء</TabsTrigger>
        </TabsList>

        {/* Customers Tab */}
        <TabsContent value="all" className="space-y-6">
          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="البحث في العملاء..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Button onClick={() => openCustomerDialog()} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="mr-2 h-4 w-4" />
              عميل جديد
            </Button>
          </div>

          {/* Customers Grid */}
          <div className="grid gap-4">
            {filteredCustomers.map((customer) => (
              <Card key={customer.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 space-x-reverse">
                      <div className="p-3 bg-blue-50 rounded-full">
                        {customer.customer_type === 'agent' ? (
                          <UserCheck className="h-6 w-6 text-blue-600" />
                        ) : (
                          <Users className="h-6 w-6 text-blue-600" />
                        )}
                      </div>
                      
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {customer.name}
                        </h3>
                        <div className="flex items-center space-x-4 space-x-reverse mt-2">
                          <Badge className={getCustomerTypeColor(customer.customer_type)}>
                            {getCustomerTypeLabel(customer.customer_type)}
                          </Badge>
                          {customer.balance > 0 && (
                            <Badge variant="outline" className="text-red-600">
                              دين: {customer.balance} د.ع
                            </Badge>
                          )}
                        </div>
                        <div className="flex flex-col mt-2 text-sm text-gray-600 space-y-1">
                          {customer.phone && (
                            <div className="flex items-center">
                              <Phone className="h-4 w-4 ml-2" />
                              {customer.phone}
                            </div>
                          )}
                          {customer.email && (
                            <div className="flex items-center">
                              <Mail className="h-4 w-4 ml-2" />
                              {customer.email}
                            </div>
                          )}
                          {customer.address && (
                            <div className="flex items-center">
                              <MapPin className="h-4 w-4 ml-2" />
                              {customer.address}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-left">
                      <div className="flex items-center space-x-2 space-x-reverse">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openCustomerDialog(customer)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        {currentUser?.role === 'admin' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => deleteCustomer(customer.id)}
                            className="text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      {customer.balance > 0 && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-2 w-full"
                          onClick={() => {
                            // تحويل إلى صفحة سندات القبض
                            window.location.href = '#/payment-vouchers';
                          }}
                        >
                          <CreditCard className="h-4 w-4 ml-2" />
                          تسديد الدين
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredCustomers.length === 0 && !loading && (
            <Card>
              <CardContent className="p-12 text-center">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  لا يوجد عملاء
                </h3>
                <p className="text-gray-600 mb-4">
                  ابدأ بإضافة عميل جديد
                </p>
                <Button onClick={() => openCustomerDialog()}>
                  <Plus className="mr-2 h-4 w-4" />
                  عميل جديد
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Regular Customers Tab */}
        <TabsContent value="regular" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">الزبائن الدائمين</h2>
            <Button onClick={() => {
              resetCustomerForm();
              setCustomerForm(prev => ({...prev, customer_type: 'regular'}));
              setIsCustomerDialogOpen(true);
            }} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="mr-2 h-4 w-4" />
              زبون جديد
            </Button>
          </div>

          <div className="grid gap-4">
            {customers
              .filter(customer => customer.customer_type === 'regular')
              .filter(customer => customer.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                               (customer.phone && customer.phone.includes(searchTerm)))
              .map((customer) => (
                <Card key={customer.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 space-x-reverse">
                        <div className="p-3 bg-blue-50 rounded-full">
                          <Users className="h-6 w-6 text-blue-600" />
                        </div>
                        
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            {customer.name}
                          </h3>
                          <div className="flex flex-col mt-2 text-sm text-gray-600 space-y-1">
                            {customer.phone && (
                              <div className="flex items-center">
                                <Phone className="h-4 w-4 ml-2" />
                                {customer.phone}
                              </div>
                            )}
                            {customer.balance > 0 && (
                              <Badge variant="outline" className="text-red-600 w-fit">
                                دين: {customer.balance} د.ع
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-left">
                        <div className="flex items-center space-x-2 space-x-reverse">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openCustomerDialog(customer)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          {currentUser?.role === 'admin' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => deleteCustomer(customer.id)}
                              className="text-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

            {customers.filter(customer => customer.customer_type === 'regular').length === 0 && !loading && (
              <Card>
                <CardContent className="p-12 text-center">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    لا يوجد زبائن دائمين
                  </h3>
                  <p className="text-gray-600 mb-4">
                    ابدأ بإضافة زبون دائم جديد
                  </p>
                  <Button onClick={() => {
                    resetCustomerForm();
                    setCustomerForm(prev => ({...prev, customer_type: 'regular'}));
                    setIsCustomerDialogOpen(true);
                  }}>
                    <Plus className="mr-2 h-4 w-4" />
                    زبون جديد
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Agents Tab */}
        <TabsContent value="agent" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">الوكلاء</h2>
            <Button onClick={() => {
              resetCustomerForm();
              setCustomerForm(prev => ({...prev, customer_type: 'agent'}));
              setIsCustomerDialogOpen(true);
            }} className="bg-purple-600 hover:bg-purple-700">
              <Plus className="mr-2 h-4 w-4" />
              وكيل جديد
            </Button>
          </div>

          <div className="grid gap-4">
            {customers
              .filter(customer => customer.customer_type === 'agent')
              .filter(customer => customer.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                               (customer.phone && customer.phone.includes(searchTerm)))
              .map((customer) => (
                <Card key={customer.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 space-x-reverse">
                        <div className="p-3 bg-purple-50 rounded-full">
                          <UserCheck className="h-6 w-6 text-purple-600" />
                        </div>
                        
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            {customer.name}
                          </h3>
                          <div className="flex flex-col mt-2 text-sm text-gray-600 space-y-1">
                            {customer.phone && (
                              <div className="flex items-center">
                                <Phone className="h-4 w-4 ml-2" />
                                {customer.phone}
                              </div>
                            )}
                            {customer.email && (
                              <div className="flex items-center">
                                <Mail className="h-4 w-4 ml-2" />
                                {customer.email}
                              </div>
                            )}
                            {customer.address && (
                              <div className="flex items-center">
                                <MapPin className="h-4 w-4 ml-2" />
                                {customer.address}
                              </div>
                            )}
                            {customer.balance > 0 && (
                              <Badge variant="outline" className="text-red-600 w-fit">
                                دين: {customer.balance} د.ع
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-left">
                        <div className="flex items-center space-x-2 space-x-reverse">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openCustomerDialog(customer)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          {currentUser?.role === 'admin' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => deleteCustomer(customer.id)}
                              className="text-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                        {customer.balance > 0 && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="mt-2 w-full"
                            onClick={() => {
                              // تحويل إلى صفحة سندات القبض
                              window.location.href = '#/payment-vouchers';
                            }}
                          >
                            <CreditCard className="h-4 w-4 ml-2" />
                            تسديد الدين
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

            {customers.filter(customer => customer.customer_type === 'agent').length === 0 && !loading && (
              <Card>
                <CardContent className="p-12 text-center">
                  <UserCheck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    لا يوجد وكلاء
                  </h3>
                  <p className="text-gray-600 mb-4">
                    ابدأ بإضافة وكيل جديد
                  </p>
                  <Button onClick={() => {
                    resetCustomerForm();
                    setCustomerForm(prev => ({...prev, customer_type: 'agent'}));
                    setIsCustomerDialogOpen(true);
                  }}>
                    <Plus className="mr-2 h-4 w-4" />
                    وكيل جديد
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Customer Dialog */}
      <Dialog open={isCustomerDialogOpen} onOpenChange={setIsCustomerDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingCustomer ? 'تعديل بيانات العميل' : 'إضافة عميل جديد'}
            </DialogTitle>
            <DialogDescription>
              {editingCustomer ? 'قم بتعديل بيانات العميل' : 'أدخل بيانات العميل الجديد'}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleCustomerSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <div>
              <Label htmlFor="name">اسم العميل</Label>
              <Input
                id="name"
                value={customerForm.name}
                onChange={(e) => setCustomerForm(prev => ({...prev, name: e.target.value}))}
                placeholder="أدخل اسم العميل"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="phone">رقم الهاتف</Label>
              <Input
                id="phone"
                value={customerForm.phone}
                onChange={(e) => setCustomerForm(prev => ({...prev, phone: e.target.value}))}
                placeholder="أدخل رقم الهاتف"
              />
            </div>
            
            <div>
              <Label htmlFor="email">البريد الإلكتروني</Label>
              <Input
                id="email"
                type="email"
                value={customerForm.email}
                onChange={(e) => setCustomerForm(prev => ({...prev, email: e.target.value}))}
                placeholder="أدخل البريد الإلكتروني"
              />
            </div>
            
            <div>
              <Label htmlFor="address">العنوان</Label>
              <Input
                id="address"
                value={customerForm.address}
                onChange={(e) => setCustomerForm(prev => ({...prev, address: e.target.value}))}
                placeholder="أدخل العنوان"
              />
            </div>
            
            <div>
              <Label htmlFor="customer_type">نوع العميل</Label>
              <Select
                value={customerForm.customer_type}
                onValueChange={(value) => setCustomerForm(prev => ({...prev, customer_type: value}))}
              >
                <SelectTrigger id="customer_type">
                  <SelectValue placeholder="اختر نوع العميل" />
                </SelectTrigger>
                <SelectContent>
                  {customerTypes.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex justify-end space-x-2 space-x-reverse pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCustomerDialogOpen(false)}
              >
                إلغاء
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                {editingCustomer ? 'تحديث البيانات' : 'إضافة العميل'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CustomerManagement;
