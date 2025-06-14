import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { 
  Menu, 
  Home, 
  ShoppingCart, 
  Package, 
  Users, 
  FileText, 
  BarChart3, 
  Settings, 
  LogOut,
  DollarSign,
  Clipboard,
  Search,
  Truck,
  Receipt
} from 'lucide-react';

const Sidebar = ({ user, onLogout, activeSection, onSectionChange }) => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const menuItems = [
    { id: 'dashboard', label: 'الرئيسية', icon: Home },
    { id: 'sales', label: 'المبيعات', icon: ShoppingCart },
    { id: 'purchases', label: 'المشتريات', icon: Truck },
    { id: 'payment-vouchers', label: 'السندات', icon: Receipt },
    { id: 'inventory', label: 'المخزن', icon: Package },
    { id: 'customers', label: 'العملاء', icon: Users },
    { id: 'expenses', label: 'المصاريف', icon: DollarSign },
    { id: 'preparation', label: 'قوائم التجهيز', icon: Clipboard },
    { id: 'price-inquiry', label: 'الاستعلام عن الأسعار', icon: Search },
    { id: 'reports', label: 'التقارير', icon: BarChart3 },
    { id: 'invoices', label: 'الفواتير', icon: FileText },
  ];

  // Add admin-only items
  if (user?.role === 'admin') {
    menuItems.push({ id: 'users', label: 'إدارة المستخدمين', icon: Settings });
  }

  const handleItemClick = (sectionId) => {
    onSectionChange(sectionId);
    setIsMobileOpen(false);
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-6 border-b">
        <h2 className="text-xl font-bold text-gray-900">نظام المبيعات</h2>
        <p className="text-sm text-gray-600 mt-1">مرحباً، {user?.full_name}</p>
        <p className="text-xs text-gray-500">{user?.role === 'admin' ? 'مدير' : 'مستخدم'}</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            
            return (
              <li key={item.id}>
                <Button
                  variant={isActive ? "default" : "ghost"}
                  className={`w-full justify-start ${
                    isActive 
                      ? 'bg-blue-600 text-white hover:bg-blue-700' 
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                  onClick={() => handleItemClick(item.id)}
                >
                  <Icon className="mr-3 h-4 w-4" />
                  {item.label}
                </Button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t">
        <Button
          variant="ghost"
          className="w-full justify-start text-red-600 hover:bg-red-50 hover:text-red-700"
          onClick={onLogout}
        >
          <LogOut className="mr-3 h-4 w-4" />
          تسجيل الخروج
        </Button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 bg-white border-r border-gray-200">
        <SidebarContent />
      </div>

      {/* Mobile Sidebar */}
      <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden fixed top-4 right-4 z-50 bg-white shadow-md"
          >
            <Menu className="h-6 w-6" />
          </Button>
        </SheetTrigger>
        <SheetContent side="right" className="w-64 p-0">
          <SidebarContent />
        </SheetContent>
      </Sheet>
    </>
  );
};

export default Sidebar;
