import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  ShoppingCart, 
  Truck, 
  Package, 
  DollarSign, 
  TrendingUp, 
  Users,
  FileText,
  AlertCircle
} from 'lucide-react';

const Dashboard = ({ user }) => {
  // Mock data - في التطبيق الحقيقي سيتم جلب هذه البيانات من API
  const stats = [
    {
      title: 'إجمالي المبيعات اليوم',
      value: '2,450,000',
      unit: 'د.ع',
      icon: ShoppingCart,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      change: '+12%',
      changeType: 'positive'
    },
    {
      title: 'المشتريات اليوم',
      value: '1,200,000',
      unit: 'د.ع',
      icon: Truck,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      change: '+8%',
      changeType: 'positive'
    },
    {
      title: 'المنتجات في المخزن',
      value: '1,247',
      unit: 'منتج',
      icon: Package,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      change: '-3%',
      changeType: 'negative'
    },
    {
      title: 'صافي الربح اليوم',
      value: '1,250,000',
      unit: 'د.ع',
      icon: TrendingUp,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      change: '+15%',
      changeType: 'positive'
    }
  ];

  const recentActivities = [
    { id: 1, type: 'sale', description: 'فاتورة مبيعات #21163', amount: '150,000', time: '10:30 ص' },
    { id: 2, type: 'purchase', description: 'فاتورة مشتريات #P1001', amount: '500,000', time: '09:45 ص' },
    { id: 3, type: 'expense', description: 'مصروف كهرباء', amount: '75,000', time: '09:15 ص' },
    { id: 4, type: 'sale', description: 'فاتورة مبيعات #21162', amount: '100,000', time: '08:30 ص' },
  ];

  const lowStockItems = [
    { name: 'شاشة كمبيوتر 24 بوصة', stock: 3, minStock: 10 },
    { name: 'لوحة مفاتيح لاسلكية', stock: 1, minStock: 5 },
    { name: 'ماوس ضوئي', stock: 2, minStock: 8 },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Welcome Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          مرحباً، {user?.full_name}
        </h1>
        <p className="text-gray-600 mt-2">
          إليك نظرة عامة على أداء متجرك اليوم
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      {stat.title}
                    </p>
                    <div className="flex items-baseline mt-2">
                      <p className="text-2xl font-bold text-gray-900">
                        {stat.value}
                      </p>
                      <span className="text-sm text-gray-500 mr-2">
                        {stat.unit}
                      </span>
                    </div>
                    <div className="flex items-center mt-2">
                      <span className={`text-sm font-medium ${
                        stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {stat.change}
                      </span>
                      <span className="text-sm text-gray-500 mr-2">
                        من الأمس
                      </span>
                    </div>
                  </div>
                  <div className={`p-3 rounded-full ${stat.bgColor}`}>
                    <Icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activities */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="mr-2 h-5 w-5" />
              النشاطات الأخيرة
            </CardTitle>
            <CardDescription>
              آخر العمليات التي تمت في النظام
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <div className={`p-2 rounded-full mr-3 ${
                      activity.type === 'sale' ? 'bg-green-100 text-green-600' :
                      activity.type === 'purchase' ? 'bg-blue-100 text-blue-600' :
                      'bg-orange-100 text-orange-600'
                    }`}>
                      {activity.type === 'sale' ? <ShoppingCart className="h-4 w-4" /> :
                       activity.type === 'purchase' ? <Truck className="h-4 w-4" /> :
                       <DollarSign className="h-4 w-4" />}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{activity.description}</p>
                      <p className="text-sm text-gray-500">{activity.time}</p>
                    </div>
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-gray-900">{activity.amount}</p>
                    <p className="text-sm text-gray-500">د.ع</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Low Stock Alert */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-orange-600">
              <AlertCircle className="mr-2 h-5 w-5" />
              تنبيه المخزن المنخفض
            </CardTitle>
            <CardDescription>
              منتجات تحتاج إلى إعادة تموين
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {lowStockItems.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-200">
                  <div>
                    <p className="font-medium text-gray-900">{item.name}</p>
                    <p className="text-sm text-gray-600">
                      الحد الأدنى: {item.minStock} قطعة
                    </p>
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-orange-600">{item.stock}</p>
                    <p className="text-sm text-gray-500">متبقي</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>إجراءات سريعة</CardTitle>
          <CardDescription>
            الوظائف الأكثر استخداماً
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button className="p-4 bg-green-50 hover:bg-green-100 rounded-lg text-center transition-colors">
              <ShoppingCart className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-green-700">فاتورة مبيعات</p>
            </button>
            <button className="p-4 bg-blue-50 hover:bg-blue-100 rounded-lg text-center transition-colors">
              <Truck className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-blue-700">فاتورة مشتريات</p>
            </button>
            <button className="p-4 bg-purple-50 hover:bg-purple-100 rounded-lg text-center transition-colors">
              <Package className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-purple-700">إدارة المخزن</p>
            </button>
            <button className="p-4 bg-orange-50 hover:bg-orange-100 rounded-lg text-center transition-colors">
              <Users className="h-8 w-8 text-orange-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-orange-700">إدارة العملاء</p>
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;

