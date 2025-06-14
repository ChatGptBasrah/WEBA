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
  DollarSign, 
  Trash2,
  Calendar,
  User,
  Loader2,
  Receipt
} from 'lucide-react';
import api from '@/lib/api';

const ExpenseManagement = () => {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    category: 'عام'
  });

  const categories = [
    'عام',
    'مصاريف إدارية',
    'مصاريف تشغيلية',
    'صيانة',
    'نقل ومواصلات',
    'كهرباء وماء',
    'إيجار',
    'رواتب',
    'مواد استهلاكية',
    'أخرى'
  ];

  // Load expenses on component mount
  useEffect(() => {
    loadExpenses();
  }, []);

  const loadExpenses = async () => {
    try {
      setLoading(true);
      const response = await api.get('/expenses');
      setExpenses(response.data.expenses || []);
    } catch (err) {
      setError(err.response?.data?.error || 'حدث خطأ في تحميل المصاريف');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.description || !formData.amount) {
      setError('يجب ملء جميع الحقول المطلوبة');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await api.post('/expenses', {
        ...formData,
        amount: parseFloat(formData.amount)
      });
      await loadExpenses();
      resetForm();
      setIsDialogOpen(false);
    } catch (err) {
      setError(err.response?.data?.error || 'حدث خطأ في حفظ المصروف');
    } finally {
      setLoading(false);
    }
  };

  const deleteExpense = async (expenseId) => {
    if (!confirm('هل أنت متأكد من حذف هذا المصروف؟')) {
      return;
    }

    try {
      await api.delete(`/expenses/${expenseId}`);
      await loadExpenses();
    } catch (err) {
      setError(err.response?.data?.error || 'حدث خطأ في حذف المصروف');
    }
  };

  const resetForm = () => {
    setFormData({
      description: '',
      amount: '',
      category: 'عام'
    });
    setError('');
  };

  const openCreateDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const getCategoryColor = (category) => {
    const colors = {
      'عام': 'bg-gray-100 text-gray-800',
      'مصاريف إدارية': 'bg-blue-100 text-blue-800',
      'مصاريف تشغيلية': 'bg-green-100 text-green-800',
      'صيانة': 'bg-yellow-100 text-yellow-800',
      'نقل ومواصلات': 'bg-purple-100 text-purple-800',
      'كهرباء وماء': 'bg-cyan-100 text-cyan-800',
      'إيجار': 'bg-red-100 text-red-800',
      'رواتب': 'bg-indigo-100 text-indigo-800',
      'مواد استهلاكية': 'bg-pink-100 text-pink-800',
      'أخرى': 'bg-orange-100 text-orange-800'
    };
    return colors[category] || colors['عام'];
  };

  if (loading && expenses.length === 0) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">جاري تحميل المصاريف...</p>
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
          <h1 className="text-3xl font-bold text-gray-900">إدارة المصاريف</h1>
          <p className="text-gray-600 mt-2">تسجيل ومتابعة المصاريف اليومية</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog} className="bg-red-600 hover:bg-red-700">
              <Plus className="mr-2 h-4 w-4" />
              مصروف جديد
            </Button>
          </DialogTrigger>
          
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>إضافة مصروف جديد</DialogTitle>
              <DialogDescription>
                أدخل تفاصيل المصروف الجديد
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              <div>
                <Label>وصف المصروف *</Label>
                <Input
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({...prev, description: e.target.value}))}
                  placeholder="مثال: فاتورة كهرباء"
                  required
                />
              </div>
              
              <div>
                <Label>المبلغ (د.ع) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.amount}
                  onChange={(e) => setFormData(prev => ({...prev, amount: e.target.value}))}
                  placeholder="0.00"
                  required
                />
              </div>
              
              <div>
                <Label>الفئة</Label>
                <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({...prev, category: value}))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(category => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex justify-end space-x-2 space-x-reverse pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  إلغاء
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      جاري الحفظ...
                    </>
                  ) : (
                    <>
                      <DollarSign className="mr-2 h-4 w-4" />
                      حفظ المصروف
                    </>
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Expenses List */}
      <div className="grid gap-4">
        {expenses.map((expense) => (
          <Card key={expense.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4 space-x-reverse">
                  <div className="p-3 bg-red-50 rounded-full">
                    <Receipt className="h-6 w-6 text-red-600" />
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {expense.description}
                    </h3>
                    <div className="flex items-center space-x-4 space-x-reverse mt-2">
                      <Badge className={getCategoryColor(expense.category)}>
                        {expense.category}
                      </Badge>
                      <div className="flex items-center text-sm text-gray-500">
                        <Calendar className="h-4 w-4 mr-1" />
                        {new Date(expense.created_at).toLocaleDateString('ar-EG')}
                      </div>
                      {expense.user_name && (
                        <div className="flex items-center text-sm text-gray-500">
                          <User className="h-4 w-4 mr-1" />
                          {expense.user_name}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="text-left">
                  <p className="text-2xl font-bold text-red-600">
                    {parseFloat(expense.amount).toFixed(2)} د.ع
                  </p>
                  <div className="flex items-center space-x-2 space-x-reverse mt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteExpense(expense.id)}
                      className="text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {expenses.length === 0 && !loading && (
        <Card>
          <CardContent className="p-12 text-center">
            <Receipt className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              لا توجد مصاريف مسجلة
            </h3>
            <p className="text-gray-600 mb-4">
              ابدأ بإضافة مصروف جديد لتتبع النفقات
            </p>
            <Button onClick={openCreateDialog}>
              <Plus className="mr-2 h-4 w-4" />
              مصروف جديد
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ExpenseManagement;

