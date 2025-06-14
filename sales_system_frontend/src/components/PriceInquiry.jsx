import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Package, 
  DollarSign,
  Barcode,
  Tag,
  TrendingUp,
  Info,
  Loader2
} from 'lucide-react';
import api from '@/lib/api';

const PriceInquiry = () => {
  const [products, setProducts] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const response = await api.get('/products');
      setProducts(response.data.products || []);
    } catch (err) {
      setError(err.response?.data?.error || 'حدث خطأ في تحميل المنتجات');
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchTerm.trim()) {
      setError('يجب إدخال اسم المنتج أو الباركود للبحث');
      return;
    }

    setLoading(true);
    setError('');
    setHasSearched(true);

    try {
      // البحث في المنتجات المحملة محلياً
      const results = products.filter(product => 
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (product.barcode && product.barcode.includes(searchTerm)) ||
        (product.description && product.description.toLowerCase().includes(searchTerm.toLowerCase()))
      );

      setSearchResults(results);
    } catch (err) {
      setError(err.response?.data?.error || 'حدث خطأ في البحث');
    } finally {
      setLoading(false);
    }
  };

  const clearSearch = () => {
    setSearchTerm('');
    setSearchResults([]);
    setHasSearched(false);
    setError('');
  };

  const getStockStatus = (product) => {
    if (product.stock_quantity <= 0) {
      return { label: 'نفد المخزن', color: 'bg-red-100 text-red-800', available: false };
    } else if (product.stock_quantity <= product.min_stock) {
      return { label: 'مخزن منخفض', color: 'bg-yellow-100 text-yellow-800', available: true };
    } else {
      return { label: 'متوفر', color: 'bg-green-100 text-green-800', available: true };
    }
  };

  const calculateProfit = (salePrice, purchasePrice) => {
    const profit = salePrice - purchasePrice;
    const profitPercentage = purchasePrice > 0 ? (profit / purchasePrice) * 100 : 0;
    return { profit, profitPercentage };
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900">الاستعلام عن الأسعار</h1>
        <p className="text-gray-600 mt-2">ابحث عن المنتجات واستعلم عن أسعارها وتوفرها</p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Search Form */}
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 space-x-reverse">
            <Search className="h-5 w-5" />
            <span>البحث عن منتج</span>
          </CardTitle>
          <CardDescription>
            أدخل اسم المنتج أو الباركود للاستعلام عن السعر
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="space-y-4">
            <div>
              <Label>اسم المنتج أو الباركود</Label>
              <div className="flex space-x-2 space-x-reverse">
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="مثال: لابتوب أو 123456789"
                  className="flex-1"
                />
                <Button type="submit" disabled={loading}>
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4" />
                  )}
                </Button>
                {hasSearched && (
                  <Button type="button" variant="outline" onClick={clearSearch}>
                    مسح
                  </Button>
                )}
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Search Results */}
      {hasSearched && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">
              نتائج البحث ({searchResults.length})
            </h2>
            {searchResults.length > 0 && (
              <Badge variant="outline">
                تم العثور على {searchResults.length} منتج
              </Badge>
            )}
          </div>

          {searchResults.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  لم يتم العثور على نتائج
                </h3>
                <p className="text-gray-600 mb-4">
                  لم يتم العثور على منتجات تطابق البحث "{searchTerm}"
                </p>
                <Button variant="outline" onClick={clearSearch}>
                  بحث جديد
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {searchResults.map((product) => {
                const stockStatus = getStockStatus(product);
                const { profit, profitPercentage } = calculateProfit(
                  product.sale_price, 
                  product.purchase_price
                );

                return (
                  <Card key={product.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-4 space-x-reverse flex-1">
                          <div className="p-3 bg-blue-50 rounded-full">
                            <Package className="h-6 w-6 text-blue-600" />
                          </div>
                          
                          <div className="flex-1">
                            <h3 className="text-xl font-bold text-gray-900 mb-2">
                              {product.name}
                            </h3>
                            
                            {product.description && (
                              <p className="text-gray-600 mb-3">{product.description}</p>
                            )}
                            
                            <div className="flex flex-wrap items-center gap-3 mb-4">
                              <Badge className={stockStatus.color}>
                                {stockStatus.label}
                              </Badge>
                              
                              {product.category_name && (
                                <Badge variant="outline">
                                  <Tag className="h-3 w-3 mr-1" />
                                  {product.category_name}
                                </Badge>
                              )}
                              
                              {product.barcode && (
                                <Badge variant="outline">
                                  <Barcode className="h-3 w-3 mr-1" />
                                  {product.barcode}
                                </Badge>
                              )}
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              <div>
                                <span className="text-gray-500">المخزن المتاح:</span>
                                <p className="font-medium">
                                  {product.stock_quantity} {product.unit}
                                </p>
                              </div>
                              
                              <div>
                                <span className="text-gray-500">الحد الأدنى:</span>
                                <p className="font-medium">
                                  {product.min_stock} {product.unit}
                                </p>
                              </div>
                              
                              <div>
                                <span className="text-gray-500">سعر الشراء:</span>
                                <p className="font-medium text-orange-600">
                                  {parseFloat(product.purchase_price).toFixed(2)} د.ع
                                </p>
                              </div>
                              
                              <div>
                                <span className="text-gray-500">الربح:</span>
                                <p className="font-medium text-green-600">
                                  {profit.toFixed(2)} د.ع ({profitPercentage.toFixed(1)}%)
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="text-left">
                          <div className="mb-4">
                            <div className="flex items-center space-x-2 space-x-reverse mb-2">
                              <DollarSign className="h-5 w-5 text-green-600" />
                              <span className="text-sm text-gray-500">سعر البيع</span>
                            </div>
                            <p className="text-3xl font-bold text-green-600">
                              {parseFloat(product.sale_price).toFixed(2)}
                            </p>
                            <p className="text-sm text-gray-500">دينار عراقي</p>
                          </div>
                          
                          {stockStatus.available ? (
                            <Badge className="bg-green-100 text-green-800">
                              <TrendingUp className="h-3 w-3 mr-1" />
                              متاح للبيع
                            </Badge>
                          ) : (
                            <Badge className="bg-red-100 text-red-800">
                              <Info className="h-3 w-3 mr-1" />
                              غير متاح
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Quick Access - Popular Products */}
      {!hasSearched && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">منتجات مميزة</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {products.slice(0, 6).map((product) => {
              const stockStatus = getStockStatus(product);
              
              return (
                <Card key={product.id} className="hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => {
                        setSearchTerm(product.name);
                        setSearchResults([product]);
                        setHasSearched(true);
                      }}>
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-3 space-x-reverse">
                      <div className="p-2 bg-blue-50 rounded-full">
                        <Package className="h-5 w-5 text-blue-600" />
                      </div>
                      
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{product.name}</h4>
                        <div className="flex items-center justify-between mt-2">
                          <Badge className={stockStatus.color} variant="outline">
                            {stockStatus.label}
                          </Badge>
                          <span className="text-lg font-bold text-green-600">
                            {parseFloat(product.sale_price).toFixed(2)} د.ع
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Instructions */}
      {!hasSearched && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-start space-x-3 space-x-reverse">
              <Info className="h-6 w-6 text-blue-600 mt-1" />
              <div>
                <h3 className="font-semibold text-blue-900 mb-2">كيفية الاستعلام عن الأسعار</h3>
                <ul className="text-blue-800 space-y-1 text-sm">
                  <li>• أدخل اسم المنتج أو جزء منه في مربع البحث</li>
                  <li>• يمكنك البحث باستخدام الباركود إذا كان متوفراً</li>
                  <li>• اضغط على زر البحث أو اضغط Enter</li>
                  <li>• ستظهر لك جميع المنتجات المطابقة مع أسعارها وتوفرها</li>
                  <li>• يمكنك الضغط على المنتجات المميزة أدناه للاستعلام السريع</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PriceInquiry;

