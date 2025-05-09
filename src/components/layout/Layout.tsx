import * as React from 'react';
import { useState, useEffect, ErrorInfo } from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import CartDrawer from '../cart/CartDrawer';
import PersistentCart from '../cart/PersistentCart';
import { usePreconnect, reportWebVitals } from '../../utils/PerformanceOptimizer';

// Simple error boundary component
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Layout Error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg m-4 text-right">
          <h3 className="text-red-600 font-bold mb-2">حدث خطأ في تحميل الصفحة</h3>
          <p className="text-gray-700 mb-2">
            {this.state.error?.message || 'خطأ غير معروف'}
          </p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-primary text-white rounded hover:bg-primary/90"
          >
            إعادة تحميل
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

const Layout: React.FC = () => {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [layoutError, setLayoutError] = useState<Error | null>(null);

  // تطبيق تحسينات الأداء للمواقع الخارجية
  try {
    usePreconnect([
      'https://fonts.googleapis.com',
      'https://fonts.gstatic.com',
      'https://images.pexels.com'
    ]);
  } catch (error) {
    console.warn('Preconnect failed, but continuing to render:', error);
  }

  // استخدام وظيفة مراقبة الأداء المحسنة
  useEffect(() => {
    reportWebVitals();
  }, []);
  
  const toggleCart = () => {
    try {
      setIsCartOpen(!isCartOpen);
    } catch (error) {
      console.error('Error toggling cart:', error);
      setLayoutError(error instanceof Error ? error : new Error('Unknown cart toggle error'));
    }
  };

  // Handle layout errors
  if (layoutError) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg m-4 text-right">
        <h3 className="text-red-600 font-bold mb-2">خطأ في تخطيط الصفحة</h3>
        <p className="text-gray-700 mb-2">{layoutError.message}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="px-4 py-2 bg-primary text-white rounded hover:bg-primary/90"
        >
          إعادة تحميل
        </button>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="flex flex-col min-h-screen overflow-x-hidden">
        <Header toggleCart={toggleCart} />
        
        {/* إضافة السلة الدائمة مع تمرير وظيفة فتح السلة الرئيسية */}
        <ErrorBoundary>
          <PersistentCart toggleMainCart={toggleCart} />
        </ErrorBoundary>
        
        {/* تعديل الهوامش لتستخدم كامل مساحة الشاشة */}
        <main className="flex-grow container mx-auto px-3 py-3 sm:px-4 sm:py-6 md:py-8 overflow-x-hidden">
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </main>
        
        <Footer />
        
        {/* السلة الرئيسية */}
        <ErrorBoundary>
          <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
        </ErrorBoundary>
      </div>
    </ErrorBoundary>
  );
};

export default Layout;