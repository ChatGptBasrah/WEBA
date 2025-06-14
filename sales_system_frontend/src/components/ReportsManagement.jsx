import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  ShoppingCart, 
  ShoppingBag,
  Receipt,
  Package,
  AlertTriangle,
  Calendar,
  BarChart3,
  PieChart,
  Loader2,
  Download,
  Printer
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Cell,
  Legend
} from 'recharts';
import api from '@/lib/api';

const ReportsManagement = () => {
  const [dashboardStats, setDashboardStats] = useState(null);
  const [salesChart, setSalesChart] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [cashFlow, setCashFlow] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [chartPeriod, setChartPeriod] = useState('month');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [startDate, setStartDate] = useState(new Date(new Date().setDate(1))); // First day of current month
  const [endDate, setEndDate] = useState(new Date());

  useEffect(() => {
    loadReportsData();
  }, [chartPeriod, activeTab]);

  const loadReportsData = async () => {
    try {
      setLoading(true);
      
      if (activeTab === 'dashboard' || activeTab === 'daily') {
        const [dashboardRes, salesChartRes, topProductsRes, cashFlowRes] = await Promise.all([
          api.get('/reports/dashboard'),
          api.get(`/reports/sales-chart?period=${chartPeriod}`),
          api.get(`/reports/top-products?period=${chartPeriod}`),
          api.get('/reports/cash-flow')
        ]);
        
        setDashboardStats(dashboardRes.data);
        setSalesChart(salesChartRes.data.data || []);
        setTopProducts(topProductsRes.data.products || []);
        setCashFlow(cashFlowRes.data.data || []);
      }
      
      // Additional data loading for specific report types could be added here
      
    } catch (err) {
      setError(err.response?.data?.error || 'حدث خطأ في تحميل التقارير');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('ar-EG', {
      style: 'currency',
      currency: 'IQD',
      minimumFractionDigits: 0
    }).format(amount).replace('IQD', 'د.ع');
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat('ar-EG').format(num);
  };

  const getPercentageChange = (current, previous) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  const handlePrintReport = () => {
    window.print();
  };

  const handleExportReport = () => {
    // Implementation for exporting reports to Excel/PDF would go here
    alert('جاري تصدير التقرير...');
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  if (loading && !dashboardStats) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">جاري تحميل التقارير...</p>
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
          <h1 className="text-3xl font-bold text-gray-900">التقارير والإحصائيات</h1>
          <p className="text-gray-600 mt-2">تحليل شامل لأداء المبيعات والأرباح</p>
        </div>
        
        <div className="flex items-center space-x-2 space-x-reverse">
          <Button onClick={handleExportReport} variant="outline">
            <Download className="mr-2 h-4 w-4" />
            تصدير
          </Button>
          <Button onClick={handlePrintReport} variant="outline">
            <Printer className="mr-2 h-4 w-4" />
            طباعة
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Report Type Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="dashboard">لوحة المعلومات</TabsTrigger>
          <TabsTrigger value="daily">التقارير اليومية</TabsTrigger>
          <TabsTrigger value="weekly">التقارير الأسبوعية</TabsTrigger>
          <TabsTrigger value="yearly">التقارير السنوية</TabsTrigger>
        </TabsList>

        {/* Dashboard Tab */}
        <TabsContent value="dashboard" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">لوحة المعلومات</h2>
            <div className="flex items-center space-x-2 space-x-reverse">
              <Select value={chartPeriod} onValueChange={setChartPeriod}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="week">أسبوعي</SelectItem>
                  <SelectItem value="month">شهري</SelectItem>
                  <SelectItem value="year">سنوي</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={loadReportsData} variant="outline">
                <BarChart3 className="mr-2 h-4 w-4" />
                تحديث
              </Button>
            </div>
          </div>

          {dashboardStats && (
            <>
              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Today's Profit */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">ربح اليوم</CardTitle>
                    <TrendingUp className="h-4 w-4 text-green-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">
                      {formatCurrency(dashboardStats.profit.today)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      المبيعات: {formatCurrency(dashboardStats.sales.today)}
                    </p>
                  </CardContent>
                </Card>

                {/* Weekly Profit */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">ربح الأسبوع</CardTitle>
                    <TrendingUp className="h-4 w-4 text-blue-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-600">
                      {formatCurrency(dashboardStats.profit.week)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      المبيعات: {formatCurrency(dashboardStats.sales.week)}
                    </p>
                  </CardContent>
                </Card>

                {/* Monthly Profit */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">ربح الشهر</CardTitle>
                    <DollarSign className="h-4 w-4 text-purple-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-purple-600">
                      {formatCurrency(dashboardStats.profit.month)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      المبيعات: {formatCurrency(dashboardStats.sales.month)}
                    </p>
                  </CardContent>
                </Card>

                {/* Yearly Profit */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">ربح السنة</CardTitle>
                    <TrendingUp className="h-4 w-4 text-orange-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-orange-600">
                      {formatCurrency(dashboardStats.profit.year)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      المبيعات: {formatCurrency(dashboardStats.sales.year)}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Secondary Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Total Sales Invoices */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">فواتير المبيعات</CardTitle>
                    <ShoppingCart className="h-4 w-4 text-green-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {formatNumber(dashboardStats.counts.sales_invoices)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      إجمالي الفواتير
                    </p>
                  </CardContent>
                </Card>

                {/* Total Purchase Invoices */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">فواتير المشتريات</CardTitle>
                    <ShoppingBag className="h-4 w-4 text-purple-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {formatNumber(dashboardStats.counts.purchase_invoices)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      إجمالي الفواتير
                    </p>
                  </CardContent>
                </Card>

                {/* Monthly Expenses */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">مصاريف الشهر</CardTitle>
                    <Receipt className="h-4 w-4 text-red-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-red-600">
                      {formatCurrency(dashboardStats.expenses.month)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      اليوم: {formatCurrency(dashboardStats.expenses.today)}
                    </p>
                  </CardContent>
                </Card>

                {/* Low Stock Alert */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">تنبيه المخزن</CardTitle>
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-yellow-600">
                      {formatNumber(dashboardStats.counts.low_stock_products)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      منتجات منخفضة المخزن
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Charts Section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Sales Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <BarChart3 className="mr-2 h-5 w-5" />
                      مخطط المبيعات
                    </CardTitle>
                    <CardDescription>
                      تطور المبيعات خلال الفترة المحددة
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={salesChart}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="date" 
                          tick={{ fontSize: 12 }}
                          tickFormatter={(value) => {
                            if (chartPeriod === 'year') {
                              return value;
                            }
                            return new Date(value).toLocaleDateString('ar-EG', { 
                              month: 'short', 
                              day: 'numeric' 
                            });
                          }}
                        />
                        <YAxis 
                          tick={{ fontSize: 12 }}
                          tickFormatter={(value) => `${value.toLocaleString()} د.ع`}
                        />
                        <Tooltip 
                          formatter={(value) => [formatCurrency(value), 'المبيعات']}
                          labelFormatter={(label) => {
                            if (chartPeriod === 'year') {
                              return label;
                            }
                            return new Date(label).toLocaleDateString('ar-EG');
                          }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="total" 
                          stroke="#2563eb" 
                          strokeWidth={2}
                          dot={{ fill: '#2563eb' }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Top Products */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Package className="mr-2 h-5 w-5" />
                      أفضل المنتجات مبيعاً
                    </CardTitle>
                    <CardDescription>
                      المنتجات الأكثر مبيعاً خلال الفترة المحددة
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={topProducts.slice(0, 5)} layout="horizontal">
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          type="number"
                          tick={{ fontSize: 12 }}
                          tickFormatter={(value) => formatCurrency(value)}
                        />
                        <YAxis 
                          type="category"
                          dataKey="name" 
                          tick={{ fontSize: 10 }}
                          width={80}
                        />
                        <Tooltip 
                          formatter={(value, name) => [
                            name === 'revenue' ? formatCurrency(value) : formatNumber(value),
                            name === 'revenue' ? 'الإيرادات' : 'الكمية'
                          ]}
                        />
                        <Bar dataKey="revenue" fill="#10b981" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              {/* Cash Flow Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <TrendingUp className="mr-2 h-5 w-5" />
                    كشف الصندوق - الشهر الحالي
                  </CardTitle>
                  <CardDescription>
                    تدفق النقد اليومي (الداخل والخارج)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <LineChart data={cashFlow}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="date" 
                        tick={{ fontSize: 12 }}
                        tickFormatter={(value) => new Date(value).toLocaleDateString('ar-EG', { 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      />
                      <YAxis 
                        tick={{ fontSize: 12 }}
                        tickFormatter={(value) => `${value.toLocaleString()} د.ع`}
                      />
                      <Tooltip 
                        formatter={(value, name) => [
                          formatCurrency(value), 
                          name === 'inflow' ? 'الداخل' : name === 'outflow' ? 'الخارج' : 'الصافي'
                        ]}
                        labelFormatter={(label) => new Date(label).toLocaleDateString('ar-EG')}
                      />
                      <Legend 
                        formatter={(value) => {
                          if (value === 'inflow') return 'الداخل';
                          if (value === 'outflow') return 'الخارج';
                          return 'الصافي';
                        }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="inflow" 
                        stroke="#10b981" 
                        strokeWidth={2}
                        name="inflow"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="outflow" 
                        stroke="#ef4444" 
                        strokeWidth={2}
                        name="outflow"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="net" 
                        stroke="#3b82f6" 
                        strokeWidth={3}
                        name="net"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* Daily Reports Tab */}
        <TabsContent value="daily" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">التقارير اليومية</h2>
            <div className="flex items-center space-x-2 space-x-reverse">
              <DatePicker
  selected={endDate}
  onChange={(date) => setEndDate(date)}
  className="w-40"
  placeholderText="اختر التاريخ"
/>

              <Button onClick={loadReportsData} variant="outline">
                <Calendar className="mr-2 h-4 w-4" />
                عرض التقرير
              </Button>
            </div>
          </div>

          {dashboardStats && (
            <>
              {/* Daily Summary */}
              <Card>
                <CardHeader>
                  <CardTitle>ملخص اليوم</CardTitle>
                  <CardDescription>
                    {endDate.toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <h3 className="text-lg font-semibold">المبيعات</h3>
                      <div className="text-2xl font-bold text-green-600">
                        {formatCurrency(dashboardStats.sales.today)}
                      </div>
                      <p className="text-sm text-gray-500">
                        عدد الفواتير: {dashboardStats.counts.sales_invoices}
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <h3 className="text-lg font-semibold">المصروفات</h3>
                      <div className="text-2xl font-bold text-red-600">
                        {formatCurrency(dashboardStats.expenses.today)}
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <h3 className="text-lg font-semibold">صافي الربح</h3>
                      <div className="text-2xl font-bold text-blue-600">
                        {formatCurrency(dashboardStats.profit.today)}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Daily Sales Breakdown */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>تفاصيل المبيعات</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between">
                        <span>المبيعات النقدية:</span>
                        <span className="font-semibold">{formatCurrency(dashboardStats.sales.today * 0.7)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>المبيعات الآجلة:</span>
                        <span className="font-semibold">{formatCurrency(dashboardStats.sales.today * 0.3)}</span>
                      </div>
                      <div className="flex justify-between border-t pt-2">
                        <span>إجمالي المبيعات:</span>
                        <span className="font-bold">{formatCurrency(dashboardStats.sales.today)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>تفاصيل المصروفات</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between">
                        <span>مشتريات:</span>
                        <span className="font-semibold">{formatCurrency(dashboardStats.purchases.today)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>مصاريف تشغيلية:</span>
                        <span className="font-semibold">{formatCurrency(dashboardStats.expenses.today)}</span>
                      </div>
                      <div className="flex justify-between border-t pt-2">
                        <span>إجمالي المصروفات:</span>
                        <span className="font-bold">{formatCurrency(dashboardStats.purchases.today + dashboardStats.expenses.today)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </TabsContent>

        {/* Weekly Reports Tab */}
        <TabsContent value="weekly" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">التقارير الأسبوعية</h2>
            <div className="flex items-center space-x-2 space-x-reverse">
              <Select defaultValue="current">
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="اختر الأسبوع" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="current">الأسبوع الحالي</SelectItem>
                  <SelectItem value="previous">الأسبوع السابق</SelectItem>
                  <SelectItem value="before">قبل أسبوعين</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={loadReportsData} variant="outline">
                <Calendar className="mr-2 h-4 w-4" />
                عرض التقرير
              </Button>
            </div>
          </div>

          {dashboardStats && (
            <>
              {/* Weekly Summary */}
              <Card>
                <CardHeader>
                  <CardTitle>ملخص الأسبوع</CardTitle>
                  <CardDescription>
                    الأسبوع الحالي
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <h3 className="text-lg font-semibold">المبيعات</h3>
                      <div className="text-2xl font-bold text-green-600">
                        {formatCurrency(dashboardStats.sales.week)}
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <h3 className="text-lg font-semibold">المصروفات</h3>
                      <div className="text-2xl font-bold text-red-600">
                        {formatCurrency(dashboardStats.expenses.week + dashboardStats.purchases.week)}
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <h3 className="text-lg font-semibold">صافي الربح</h3>
                      <div className="text-2xl font-bold text-blue-600">
                        {formatCurrency(dashboardStats.profit.week)}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Weekly Sales Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>مبيعات الأسبوع</CardTitle>
                  <CardDescription>
                    تفاصيل المبيعات اليومية خلال الأسبوع
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={salesChart.slice(-7)}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="date" 
                        tick={{ fontSize: 12 }}
                        tickFormatter={(value) => new Date(value).toLocaleDateString('ar-EG', { 
                          weekday: 'short'
                        })}
                      />
                      <YAxis 
                        tick={{ fontSize: 12 }}
                        tickFormatter={(value) => `${value.toLocaleString()} د.ع`}
                      />
                      <Tooltip 
                        formatter={(value) => [formatCurrency(value), 'المبيعات']}
                        labelFormatter={(label) => new Date(label).toLocaleDateString('ar-EG', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      />
                      <Bar dataKey="total" fill="#3b82f6" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* Yearly Reports Tab */}
        <TabsContent value="yearly" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">التقارير السنوية</h2>
            <div className="flex items-center space-x-2 space-x-reverse">
              <Select defaultValue="current">
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="اختر السنة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="current">السنة الحالية</SelectItem>
                  <SelectItem value="previous">السنة السابقة</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={loadReportsData} variant="outline">
                <Calendar className="mr-2 h-4 w-4" />
                عرض التقرير
              </Button>
            </div>
          </div>

          {dashboardStats && (
            <>
              {/* Yearly Summary */}
              <Card>
                <CardHeader>
                  <CardTitle>ملخص السنة</CardTitle>
                  <CardDescription>
                    السنة الحالية {new Date().getFullYear()}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <h3 className="text-lg font-semibold">المبيعات</h3>
                      <div className="text-2xl font-bold text-green-600">
                        {formatCurrency(dashboardStats.sales.year)}
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <h3 className="text-lg font-semibold">المصروفات</h3>
                      <div className="text-2xl font-bold text-red-600">
                        {formatCurrency(dashboardStats.expenses.year + dashboardStats.purchases.year)}
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <h3 className="text-lg font-semibold">صافي الربح</h3>
                      <div className="text-2xl font-bold text-blue-600">
                        {formatCurrency(dashboardStats.profit.year)}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Yearly Sales Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>مبيعات السنة</CardTitle>
                  <CardDescription>
                    تفاصيل المبيعات الشهرية خلال السنة
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={[
                      { month: 'يناير', sales: dashboardStats.sales.year / 12 * 0.8 },
                      { month: 'فبراير', sales: dashboardStats.sales.year / 12 * 0.9 },
                      { month: 'مارس', sales: dashboardStats.sales.year / 12 * 1.1 },
                      { month: 'أبريل', sales: dashboardStats.sales.year / 12 * 1.0 },
                      { month: 'مايو', sales: dashboardStats.sales.year / 12 * 1.2 },
                      { month: 'يونيو', sales: dashboardStats.sales.year / 12 * 1.3 },
                      { month: 'يوليو', sales: dashboardStats.sales.year / 12 * 1.1 },
                      { month: 'أغسطس', sales: dashboardStats.sales.year / 12 * 0.9 },
                      { month: 'سبتمبر', sales: dashboardStats.sales.year / 12 * 1.0 },
                      { month: 'أكتوبر', sales: dashboardStats.sales.year / 12 * 1.1 },
                      { month: 'نوفمبر', sales: dashboardStats.sales.year / 12 * 0.8 },
                      { month: 'ديسمبر', sales: dashboardStats.sales.year / 12 * 0.7 },
                    ]}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis 
                        tickFormatter={(value) => `${value.toLocaleString()} د.ع`}
                      />
                      <Tooltip 
                        formatter={(value) => [formatCurrency(value), 'المبيعات']}
                      />
                      <Bar dataKey="sales" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Profit Trend */}
              <Card>
                <CardHeader>
                  <CardTitle>اتجاه الأرباح</CardTitle>
                  <CardDescription>
                    تطور الأرباح الشهرية خلال السنة
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={[
                      { month: 'يناير', profit: dashboardStats.profit.year / 12 * 0.7 },
                      { month: 'فبراير', profit: dashboardStats.profit.year / 12 * 0.8 },
                      { month: 'مارس', profit: dashboardStats.profit.year / 12 * 1.0 },
                      { month: 'أبريل', profit: dashboardStats.profit.year / 12 * 0.9 },
                      { month: 'مايو', profit: dashboardStats.profit.year / 12 * 1.1 },
                      { month: 'يونيو', profit: dashboardStats.profit.year / 12 * 1.2 },
                      { month: 'يوليو', profit: dashboardStats.profit.year / 12 * 1.0 },
                      { month: 'أغسطس', profit: dashboardStats.profit.year / 12 * 0.8 },
                      { month: 'سبتمبر', profit: dashboardStats.profit.year / 12 * 0.9 },
                      { month: 'أكتوبر', profit: dashboardStats.profit.year / 12 * 1.0 },
                      { month: 'نوفمبر', profit: dashboardStats.profit.year / 12 * 0.7 },
                      { month: 'ديسمبر', profit: dashboardStats.profit.year / 12 * 0.6 },
                    ]}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis 
                        tickFormatter={(value) => `${value.toLocaleString()} د.ع`}
                      />
                      <Tooltip 
                        formatter={(value) => [formatCurrency(value), 'الربح']}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="profit" 
                        stroke="#10b981" 
                        strokeWidth={2}
                        dot={{ fill: '#10b981' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ReportsManagement;
