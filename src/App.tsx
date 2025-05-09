import { Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import HomePage from './pages/HomePage';
import ProductPage from './pages/ProductPage';
import CartPage from './pages/CartPage';
import CategoryPage from './pages/CategoryPage';
import SearchPage from './pages/SearchPage';
import FAQPage from './pages/FAQPage';
import { CartProvider } from './context/CartContext';
import { AuthProvider, withAdminAuth } from './context/AuthContext';
import ScrollToTop from './utils/ScrollToTop';

// صفحات لوحة تحكم الأدمن
import AdminDashboard from './pages/admin/AdminDashboard';
import ProductsManager from './pages/admin/ProductsManager';
import CategoriesManager from './pages/admin/CategoriesManager';
import PromotionsManager from './pages/admin/PromotionsManager';
import ReportsPage from './pages/admin/ReportsPage';
import LoginPage from './pages/admin/LoginPage';

// تطبيق حماية الوصول للصفحات الإدارية
const ProtectedAdminDashboard = withAdminAuth(AdminDashboard);
const ProtectedProductsManager = withAdminAuth(ProductsManager);
const ProtectedCategoriesManager = withAdminAuth(CategoriesManager);
const ProtectedPromotionsManager = withAdminAuth(PromotionsManager);
const ProtectedReportsPage = withAdminAuth(ReportsPage);

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <ScrollToTop />
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<HomePage />} />
            <Route path="product/:id" element={<ProductPage />} />
            <Route path="category/:category" element={<CategoryPage />} />
            <Route path="cart" element={<CartPage />} />
            <Route path="search" element={<SearchPage />} />
            <Route path="faq" element={<FAQPage />} />
          </Route>
          {/* صفحة تسجيل الدخول للمسؤولين */}
          <Route path="/admin/login" element={<LoginPage />} />
          {/* صفحات المسؤول المحمية */}
          <Route path="/admin" element={<ProtectedAdminDashboard />} />
          <Route path="/admin/dashboard" element={<ProtectedAdminDashboard />} />
          <Route path="/admin/products" element={<ProtectedProductsManager />} />
          <Route path="/admin/categories" element={<ProtectedCategoriesManager />} />
          <Route path="/admin/promotions" element={<ProtectedPromotionsManager />} />
          <Route path="/admin/reports" element={<ProtectedReportsPage />} />
        </Routes>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;