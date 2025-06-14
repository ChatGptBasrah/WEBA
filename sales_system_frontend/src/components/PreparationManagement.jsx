import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Plus, 
  ClipboardList, 
  Package,
  Check,
  X,
  Eye,
  Trash2,
  Loader2,
  CheckCircle,
  Clock,
  User
} from 'lucide-react';
import api from '@/lib/api';

const PreparationManagement = () => {
  const [preparationLists, setPreparationLists] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [viewingList, setViewingList] = useState(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    items: []
  });

  const [newItem, setNewItem] = useState({
    product_id: '',
    quantity: '',
    notes: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [listsRes, productsRes] = await Promise.all([
        api.get('/preparation-lists'),
        api.get('/products')
      ]);
      
      setPreparationLists(listsRes.data.lists || []);
      setProducts(productsRes.data.products || []);
    } catch (err) {
      setError(err.response?.data?.error || 'حدث خطأ في تحميل البيانات');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || formData.items.length === 0) {
      setError('يجب إدخال عنوان القائمة وإضافة عنصر واحد على الأقل');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await api.post('/preparation-lists', formData);
      await loadData();
      resetForm();
      setIsDialogOpen(false);
    } catch (err) {
      setError(err.response?.data?.error || 'حدث خطأ في حفظ قائمة التجهيز');
    } finally {
      setLoading(false);
    }
  };

  const addItem = () => {
    if (!newItem.product_id || !newItem.quantity) {
      setError('يجب اختيار المنتج وإدخال الكمية');
      return;
    }

    const product = products.find(p => p.id.toString() === newItem.product_id);
    if (!product) return;

    const item = {
      product_id: parseInt(newItem.product_id),
      product_name: product.name,
      quantity: parseInt(newItem.quantity),
      notes: newItem.notes,
      unit: product.unit
    };

    setFormData(prev => ({
      ...prev,
      items: [...prev.items, item]
    }));

    setNewItem({
      product_id: '',
      quantity: '',
      notes: ''
    });
    setError('');
  };

  const removeItem = (index) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const viewList = async (listId) => {
    try {
      const response = await api.get(`/preparation-lists/${listId}`);
      setViewingList(response.data);
      setIsViewDialogOpen(true);
    } catch (err) {
      setError(err.response?.data?.error || 'حدث خطأ في تحميل تفاصيل القائمة');
    }
  };

  const toggleItemStatus = async (listId, itemId) => {
    try {
      await api.put(`/preparation-lists/${listId}/items/${itemId}/toggle`);
      // Refresh the viewing list
      await viewList(listId);
      await loadData();
    } catch (err) {
      setError(err.response?.data?.error || 'حدث خطأ في تحديث حالة العنصر');
    }
  };

  const updateListStatus = async (listId, status) => {
    try {
      await api.put(`/preparation-lists/${listId}/status`, { status });
      await loadData();
      if (viewingList && viewingList.id === listId) {
        await viewList(listId);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'حدث خطأ في تحديث حالة القائمة');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      items: []
    });
    setNewItem({
      product_id: '',
      quantity: '',
      notes: ''
    });
    setError('');
  };

  const openCreateDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const getStatusColor = (status) => {
    const colors = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'in_progress': 'bg-blue-100 text-blue-800',
      'completed': 'bg-green-100 text-green-800'
    };
    return colors[status] || colors['pending'];
  };

  const getStatusText = (status) => {
    const texts = {
      'pending': 'في الانتظار',
      'in_progress': 'قيد التجهيز',
      'completed': 'مكتملة'
    };
    return texts[status] || 'في الانتظار';
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4" />;
      case 'in_progress':
        return <Clock className="h-4 w-4" />;
      default:
        return <ClipboardList className="h-4 w-4" />;
    }
  };

  if (loading && preparationLists.length === 0) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">جاري تحميل قوائم التجهيز...</p>
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
          <h1 className="text-3xl font-bold text-gray-900">قوائم التجهيز</h1>
          <p className="text-gray-600 mt-2">إنشاء ومتابعة قوائم تجهيز المواد للعمال</p>
        </div>
        
        <Button onClick={openCreateDialog} className="bg-indigo-600 hover:bg-indigo-700">
          <Plus className="mr-2 h-4 w-4" />
          قائمة جديدة
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Preparation Lists */}
      <div className="grid gap-4">
        {preparationLists.map((list) => (
          <Card key={list.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4 space-x-reverse">
                  <div className="p-3 bg-indigo-50 rounded-full">
                    {getStatusIcon(list.status)}
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {list.title}
                    </h3>
                    <div className="flex items-center space-x-4 space-x-reverse mt-2">
                      <Badge className={getStatusColor(list.status)}>
                        {getStatusText(list.status)}
                      </Badge>
                      <span className="text-sm text-gray-500">
                        {list.items_count} عنصر
                      </span>
                      <span className="text-sm text-gray-500">
                        {new Date(list.created_at).toLocaleDateString('ar-EG')}
                      </span>
                      {list.user_name && (
                        <div className="flex items-center text-sm text-gray-500">
                          <User className="h-4 w-4 mr-1" />
                          {list.user_name}
                        </div>
                      )}
                    </div>
                    {list.description && (
                      <p className="text-sm text-gray-600 mt-1">{list.description}</p>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 space-x-reverse">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => viewList(list.id)}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    عرض
                  </Button>
                  
                  {list.status === 'pending' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateListStatus(list.id, 'in_progress')}
                      className="text-blue-600 hover:bg-blue-50"
                    >
                      بدء التجهيز
                    </Button>
                  )}
                  
                  {list.status === 'in_progress' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateListStatus(list.id, 'completed')}
                      className="text-green-600 hover:bg-green-50"
                    >
                      إكمال
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {preparationLists.length === 0 && !loading && (
        <Card>
          <CardContent className="p-12 text-center">
            <ClipboardList className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              لا توجد قوائم تجهيز
            </h3>
            <p className="text-gray-600 mb-4">
              ابدأ بإنشاء قائمة تجهيز جديدة للعمال
            </p>
            <Button onClick={openCreateDialog}>
              <Plus className="mr-2 h-4 w-4" />
              قائمة جديدة
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Create Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>إنشاء قائمة تجهيز جديدة</DialogTitle>
            <DialogDescription>
              أدخل تفاصيل قائمة التجهيز والمواد المطلوبة
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label>عنوان القائمة *</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData(prev => ({...prev, title: e.target.value}))}
                placeholder="مثال: تجهيز طلبية العميل أحمد"
                required
              />
            </div>
            
            <div>
              <Label>الوصف</Label>
              <Input
                value={formData.description}
                onChange={(e) => setFormData(prev => ({...prev, description: e.target.value}))}
                placeholder="وصف إضافي للقائمة"
              />
            </div>

            {/* Add Item Section */}
            <div className="border rounded-lg p-4 space-y-4">
              <h4 className="font-medium">إضافة عنصر جديد</h4>
              
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>المنتج *</Label>
                  <Select value={newItem.product_id} onValueChange={(value) => setNewItem(prev => ({...prev, product_id: value}))}>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر المنتج" />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map(product => (
                        <SelectItem key={product.id} value={product.id.toString()}>
                          {product.name} ({product.stock_quantity} {product.unit})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>الكمية *</Label>
                  <Input
                    type="number"
                    min="1"
                    value={newItem.quantity}
                    onChange={(e) => setNewItem(prev => ({...prev, quantity: e.target.value}))}
                    placeholder="0"
                  />
                </div>

                <div>
                  <Label>ملاحظات</Label>
                  <Input
                    value={newItem.notes}
                    onChange={(e) => setNewItem(prev => ({...prev, notes: e.target.value}))}
                    placeholder="ملاحظات إضافية"
                  />
                </div>
              </div>

              <Button type="button" onClick={addItem} variant="outline" className="w-full">
                <Plus className="mr-2 h-4 w-4" />
                إضافة العنصر
              </Button>
            </div>

            {/* Items List */}
            {formData.items.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium">العناصر المضافة ({formData.items.length})</h4>
                {formData.items.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <span className="font-medium">{item.product_name}</span>
                      <span className="text-gray-600 ml-2">
                        {item.quantity} {item.unit}
                      </span>
                      {item.notes && (
                        <span className="text-sm text-gray-500 block">{item.notes}</span>
                      )}
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeItem(index)}
                      className="text-red-600 hover:bg-red-50"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
            
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
                    <ClipboardList className="mr-2 h-4 w-4" />
                    إنشاء القائمة
                  </>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2 space-x-reverse">
              {viewingList && getStatusIcon(viewingList.status)}
              <span>{viewingList?.title}</span>
            </DialogTitle>
            <DialogDescription>
              تفاصيل قائمة التجهيز والعناصر المطلوبة
            </DialogDescription>
          </DialogHeader>
          
          {viewingList && (
            <div className="space-y-6">
              <div className="flex items-center space-x-4 space-x-reverse">
                <Badge className={getStatusColor(viewingList.status)}>
                  {getStatusText(viewingList.status)}
                </Badge>
                <span className="text-sm text-gray-500">
                  {new Date(viewingList.created_at).toLocaleDateString('ar-EG')}
                </span>
                {viewingList.user_name && (
                  <div className="flex items-center text-sm text-gray-500">
                    <User className="h-4 w-4 mr-1" />
                    {viewingList.user_name}
                  </div>
                )}
              </div>

              {viewingList.description && (
                <p className="text-gray-600">{viewingList.description}</p>
              )}

              <div className="space-y-3">
                <h4 className="font-medium">العناصر المطلوبة ({viewingList.items.length})</h4>
                {viewingList.items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3 space-x-reverse">
                      <Checkbox
                        checked={item.is_prepared}
                        onCheckedChange={() => toggleItemStatus(viewingList.id, item.id)}
                        disabled={viewingList.status === 'completed'}
                      />
                      <div>
                        <span className={`font-medium ${item.is_prepared ? 'line-through text-gray-500' : ''}`}>
                          {item.product_name}
                        </span>
                        <span className="text-gray-600 ml-2">
                          {item.quantity} قطعة
                        </span>
                        {item.notes && (
                          <span className="text-sm text-gray-500 block">{item.notes}</span>
                        )}
                      </div>
                    </div>
                    {item.is_prepared && (
                      <Badge className="bg-green-100 text-green-800">
                        <Check className="h-3 w-3 mr-1" />
                        جاهز
                      </Badge>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex justify-end space-x-2 space-x-reverse pt-4">
                <Button
                  variant="outline"
                  onClick={() => setIsViewDialogOpen(false)}
                >
                  إغلاق
                </Button>
                
                {viewingList.status === 'pending' && (
                  <Button
                    onClick={() => updateListStatus(viewingList.id, 'in_progress')}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    بدء التجهيز
                  </Button>
                )}
                
                {viewingList.status === 'in_progress' && (
                  <Button
                    onClick={() => updateListStatus(viewingList.id, 'completed')}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    إكمال القائمة
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PreparationManagement;

