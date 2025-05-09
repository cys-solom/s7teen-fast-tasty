import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../../utils/firebase';
import { useAuth } from '../../context/AuthContext';

interface TopSellingProduct {
  id: string;
  name: string;
  sales: number;
}

interface Product {
  id: string;
  name: string;
  price: number;
  discountPrice?: number;
  imageUrl: string;
  category: string;
  inStock: boolean;
  description: string;
  rating: number;
  features: string[];
  // إضافة حقل تاريخ الإنشاء لترتيب المنتجات
  createdAt?: any;
}

const AdminDashboard = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalCategories: 0,
    outOfStockProducts: 0,
    productsWithPromotion: 0,
  });
  const [topSellingProducts, setTopSellingProducts] = useState<TopSellingProduct[]>([]);
  // إضافة حالة لتخزين أحدث المنتجات
  const [latestProducts, setLatestProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<{id: string, name: string}[]>([]);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // معالج تسجيل الخروج
  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await logout();
      navigate('/admin/login');
    } catch (error) {
      console.error("Error logging out:", error);
      alert("حدث خطأ أثناء تسجيل الخروج");
    } finally {
      setIsLoggingOut(false);
    }
  };

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // جلب المنتجات من Firestore بدلاً من التخزين المحلي
        const productsCol = collection(db, 'products');
        const productsSnapshot = await getDocs(productsCol);
        const productsList = productsSnapshot.docs.map(docSnap => ({ 
          id: docSnap.id, 
          ...docSnap.data(),
          createdAt: docSnap.data().createdAt?.toDate() || new Date() // تحويل Timestamp إلى Date
        })) as Product[];
        
        // جلب التصنيفات من Firestore
        const categoriesCol = collection(db, 'categories');
        const categoriesSnapshot = await getDocs(categoriesCol);
        const categoriesList = categoriesSnapshot.docs.map(docSnap => ({ 
          id: docSnap.id, 
          ...docSnap.data() 
        }));
        
        setCategories(categoriesList);
        
        // عدد المنتجات غير المتوفرة
        const outOfStock = productsList.filter(product => !product.inStock).length;
        
        // عدد المنتجات التي لديها خصم
        const withPromotion = productsList.filter(product => product.discountPrice !== undefined && product.discountPrice > 0).length;
        
        // حفظ الإحصائيات
        setStats({
          totalProducts: productsList.length,
          totalCategories: categoriesList.length,
          outOfStockProducts: outOfStock,
          productsWithPromotion: withPromotion, // استخدام القيمة الفعلية بدلاً من القيمة الثابتة
        });
        
        // ترتيب المنتجات حسب الأحدث وأخذ آخر 5
        const sortedProducts = [...productsList].sort((a, b) => {
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return dateB - dateA;
        }).slice(0, 5);
        
        setLatestProducts(sortedProducts);
      } catch (error) {
        console.error("Error fetching stats:", error);
      }
    };
    
    fetchStats();
  }, []);

  useEffect(() => {
    // جلب المنتجات الأكثر مبيعًا من الطلبات
    const fetchTopSelling = async () => {
      const ordersCol = collection(db, 'orders');
      const ordersSnapshot = await getDocs(ordersCol);
      const salesMap: Record<string, { name: string; sales: number }> = {};
      ordersSnapshot.docs.forEach(docSnap => {
        const order = docSnap.data();
        if (order.products && Array.isArray(order.products)) {
          order.products.forEach((prod: any) => {
            if (!salesMap[prod.id]) {
              salesMap[prod.id] = { name: prod.name, sales: 0 };
            }
            salesMap[prod.id].sales += prod.quantity || 1;
          });
        }
      });
      // تحويل النتائج لمصفوفة وترتيبها تنازليًا
      const sorted = Object.entries(salesMap)
        .map(([id, v]) => ({ id, name: v.name, sales: v.sales }))
        .sort((a, b) => b.sales - a.sales)
        .slice(0, 5);
      setTopSellingProducts(sorted);
    };
    fetchTopSelling();
  }, []);

  const menuItems = [
    {
      title: 'إدارة المنتجات',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-7 h-7">
          <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" />
        </svg>
      ),
      description: 'إضافة، تعديل وإدارة المنتجات',
      link: '/admin/products',
      color: 'bg-blue-100 text-blue-800',
      borderColor: 'border-blue-600',
    },
    {
      title: 'إدارة التصنيفات',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-7 h-7">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z" />
        </svg>
      ),
      description: 'إدارة تصنيفات المنتجات',
      link: '/admin/categories',
      color: 'bg-purple-100 text-purple-800',
      borderColor: 'border-purple-600',
    },
    {
      title: 'إدارة العروض',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-7 h-7">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" />
        </svg>
      ),
      description: 'إدارة الخصومات والعروض الخاصة',
      link: '/admin/promotions',
      color: 'bg-amber-100 text-amber-800',
      borderColor: 'border-amber-600',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* شريط العنوان */}
      <div className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">لوحة التحكم</h1>
              <p className="text-gray-600 text-sm mt-1">مرحبًا بك في لوحة تحكم تطبيق S7teen Food!</p>
            </div>
            <div className="flex items-center gap-2">
              <Link to="/" className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 ml-1">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
                </svg>
                الرئيسية
              </Link>
              <button 
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition flex items-center disabled:opacity-75 disabled:cursor-not-allowed"
              >
                {isLoggingOut ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    جاري تسجيل الخروج...
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 ml-1">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
                    </svg>
                    تسجيل الخروج
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {/* إحصائيات سريعة */}
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8">
          <div className="bg-white rounded-lg shadow-sm p-4 md:p-6 border-r-4 border-blue-500">
            <div className="flex items-center">
              <div className="p-2 md:p-3 bg-blue-100 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 md:w-6 md:h-6 text-blue-600">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" />
                </svg>
              </div>
              <div className="mr-2 md:mr-4">
                <h2 className="text-xs md:text-sm text-gray-500 font-medium">إجمالي المنتجات</h2>
                <div className="flex items-center">
                  <span className="text-lg md:text-2xl font-bold text-gray-900">{stats.totalProducts}</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-4 md:p-6 border-r-4 border-purple-500">
            <div className="flex items-center">
              <div className="p-2 md:p-3 bg-purple-100 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 md:w-6 md:h-6 text-purple-600">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z" />
                </svg>
              </div>
              <div className="mr-2 md:mr-4">
                <h2 className="text-xs md:text-sm text-gray-500 font-medium">التصنيفات</h2>
                <div className="flex items-center">
                  <span className="text-lg md:text-2xl font-bold text-gray-900">{stats.totalCategories}</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-4 md:p-6 border-r-4 border-amber-500">
            <div className="flex items-center">
              <div className="p-2 md:p-3 bg-amber-100 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 md:w-6 md:h-6 text-amber-600">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" />
                </svg>
              </div>
              <div className="mr-2 md:mr-4">
                <h2 className="text-xs md:text-sm text-gray-500 font-medium">العروض النشطة</h2>
                <div className="flex items-center">
                  <span className="text-lg md:text-2xl font-bold text-gray-900">{stats.productsWithPromotion}</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-4 md:p-6 border-r-4 border-red-500">
            <div className="flex items-center">
              <div className="p-2 md:p-3 bg-red-100 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 md:w-6 md:h-6 text-red-600">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                </svg>
              </div>
              <div className="mr-2 md:mr-4">
                <h2 className="text-xs md:text-sm text-gray-500 font-medium">منتجات غير متوفرة</h2>
                <div className="flex items-center">
                  <span className="text-lg md:text-2xl font-bold text-gray-900">{stats.outOfStockProducts}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* روابط سريعة للوصول إلى الصفحات الإدارية */}
        <h2 className="text-xl font-bold text-gray-800 mb-4">إدارة المتجر</h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-8">
          {menuItems.map((item, index) => (
            <Link 
              key={index} 
              to={item.link} 
              className={`bg-white rounded-lg shadow-sm p-4 md:p-6 transition-all hover:shadow-md flex flex-col border-r-4 ${item.borderColor}`}
            >
              <div className="flex items-center mb-2 md:mb-4">
                <div className={`p-2 md:p-3 rounded-full ${item.color}`}>
                  {React.cloneElement(item.icon as React.ReactElement, {
                    className: "w-5 h-5 md:w-7 md:h-7"
                  })}
                </div>
                <h3 className="text-base md:text-lg font-semibold text-gray-800 mr-2 md:mr-3">{item.title}</h3>
              </div>
              <p className="text-xs md:text-sm text-gray-600 mb-3 md:mb-4">{item.description}</p>
              <div className="mt-auto flex justify-end">
                <div className="text-xs md:text-sm font-medium text-blue-600 hover:text-blue-800 flex items-center">
                  <span>انتقل للصفحة</span>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3 h-3 md:w-4 md:h-4 mr-1">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                  </svg>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* قسم المعلومات والتقارير السريعة */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* أحدث المنتجات المضافة */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-6 lg:mb-0">
            <div className="px-4 md:px-6 py-3 md:py-4 bg-blue-50 border-b border-blue-100">
              <div className="flex justify-between items-center">
                <h3 className="text-sm md:text-base font-semibold text-blue-800 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 md:w-5 md:h-5 ml-1 md:ml-2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  آخر المنتجات المضافة
                </h3>
                <Link to="/admin/products" className="text-xs md:text-sm text-blue-600 hover:underline">عرض الكل</Link>
              </div>
            </div>
            <div className="p-0 overflow-x-auto">
              <ul className="divide-y divide-gray-100">
                {latestProducts.map((product) => (
                  <li key={product.id} className="p-3 md:p-4 hover:bg-gray-50 transition-colors flex justify-between items-center">
                    <div className="flex items-center">
                      <img 
                        src={product.imageUrl} 
                        alt={product.name}
                        className="w-10 h-10 md:w-12 md:h-12 rounded-md object-cover ml-2 md:ml-3"
                        onError={(e) => {
                          (e.target as HTMLImageElement).onerror = null;
                          (e.target as HTMLImageElement).src = 'https://via.placeholder.com/48?text=صورة';
                        }}
                      />
                      <div>
                        <h4 className="text-sm md:text-base font-medium text-gray-800">{product.name}</h4>
                        <p className="text-xs md:text-sm text-gray-500">
                          {product.inStock ? 
                            <span className="text-green-600">متوفر</span> : 
                            <span className="text-red-600">غير متوفر</span>}
                          <span className="mx-1 md:mx-2">•</span>
                          {product.category}
                        </p>
                      </div>
                    </div>
                    <div className="text-left">
                      <div className="text-sm md:text-md font-semibold text-gray-800">
                        {product.discountPrice ? (
                          <div className="flex flex-col">
                            <span className="text-xs md:text-sm line-through text-gray-500">{product.price} جنيه</span>
                            <span className="font-bold text-red-600">{product.discountPrice} جنيه</span>
                          </div>
                        ) : (
                          <span>{product.price} جنيه</span>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* المنتجات الأكثر مبيعاً */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="px-4 md:px-6 py-3 md:py-4 bg-green-50 border-b border-green-100">
              <div className="flex justify-between items-center">
                <h3 className="text-sm md:text-base font-semibold text-green-800 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 md:w-5 md:h-5 ml-1 md:ml-2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
                  </svg>
                  المنتجات الأكثر مبيعاً
                </h3>
                <Link to="/admin/reports" className="text-xs md:text-sm text-green-600 hover:underline">عرض التقارير</Link>
              </div>
            </div>
            <div className="p-0 overflow-x-auto">
              <ul className="divide-y divide-gray-100">
                {topSellingProducts.map((product, index) => (
                  <li key={product.id} className="p-3 md:p-4 hover:bg-gray-50 transition-colors flex justify-between items-center">
                    <div className="flex items-center">
                      <div className={`w-6 h-6 md:w-7 md:h-7 flex items-center justify-center rounded-full ml-2 md:ml-3 text-xs md:text-sm font-semibold ${
                        index === 0 ? 'bg-amber-100 text-amber-800' :
                        index === 1 ? 'bg-gray-100 text-gray-800' :
                        index === 2 ? 'bg-amber-50 text-amber-700' :
                        'bg-blue-50 text-blue-800'
                      }`}>
                        {index + 1}
                      </div>
                      <span className="text-sm md:text-base font-medium text-gray-800">{product.name}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="inline-block px-2 md:px-3 py-1 text-xs md:text-sm bg-green-100 text-green-800 rounded-full">
                        {product.sales} طلب
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;