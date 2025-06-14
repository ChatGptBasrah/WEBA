import { useState, useEffect } from 'react';
import LoginForm from './components/LoginForm';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import UserManagement from './components/UserManagement';
import SalesManagement from './components/SalesManagement';
import PurchaseManagement from './components/PurchaseManagement';
import ExpenseManagement from './components/ExpenseManagement';
import ReportsManagement from './components/ReportsManagement';
import InventoryManagement from './components/InventoryManagement';
import PreparationManagement from './components/PreparationManagement';
import PriceInquiry from './components/PriceInquiry';
import PaymentVouchersManagement from './components/PaymentVouchersManagement';
import './App.css';
import './mobile.css';

function App() {
  const [user, setUser] = useState(null);
  const [activeSection, setActiveSection] = useState('dashboard');
  const [loading, setLoading] = useState(true);

  // Check for existing login on app start
  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      try {
        setUser(JSON.parse(userData));
      } catch (error) {
        console.error('Error parsing user data:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
    setActiveSection('dashboard');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setActiveSection('dashboard');
  };

  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return <Dashboard user={user} />;
      case 'users':
        return <UserManagement />;
      case 'sales':
        return <SalesManagement />;
      case 'purchases':
        return <PurchaseManagement />;
      case 'inventory':
        return <InventoryManagement />;
      case 'customers':
        return (
          <div className="p-6">
            <h1 className="text-2xl font-bold mb-4">العملاء</h1>
            <p className="text-gray-600">قريباً...</p>
          </div>
        );
      case 'expenses':
        return <ExpenseManagement />;
      case 'preparation':
        return <PreparationManagement />;
      case 'price-inquiry':
        return <PriceInquiry />;
      case 'reports':
        return <ReportsManagement />;
      case 'payment-vouchers':
        return <PaymentVouchersManagement />;
      case 'invoices':
        return (
          <div className="p-6">
            <h1 className="text-2xl font-bold mb-4">الفواتير</h1>
            <p className="text-gray-600">قريباً...</p>
          </div>
        );
      default:
        return <Dashboard user={user} />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginForm onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar 
        user={user} 
        onLogout={handleLogout}
        activeSection={activeSection}
        onSectionChange={setActiveSection}
      />
      
      {/* Main Content */}
      <div className="md:mr-64">
        <main className="min-h-screen">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}

export default App;
