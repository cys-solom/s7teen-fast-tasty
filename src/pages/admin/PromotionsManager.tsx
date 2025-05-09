import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Product } from '../../types/product';
import { db } from '../../utils/firebase';
import {
  collection,
  getDocs,
  updateDoc,
  doc,
  getDoc,
  setDoc
} from 'firebase/firestore';

// إضافة واجهة للبيانات اللازمة للإعلان الخاص
interface SpecialPromoData {
  enabled: boolean;
  title: string;
  description: string;
  subtext: string;
  backgroundColor: string;
  buttonText: string;
  imageUrl: string;
  expireDate?: string;
  linkType: 'internal' | 'external' | 'scroll';
  internalLink?: string;
  externalLink?: string;
  scrollTarget?: 'offers' | 'categories' | 'featured' | 'delivery'; // القسم المستهدف للتمرير
}

// إضافة واجهة للبيانات اللازمة للبانر الرئيسي (Hero Banner)
interface HeroBannerData {
  enabled: boolean;
  title: string;
  description: string;
  imageUrl: string;
  buttonText: string;
  backgroundColor: string;
  linkType: 'internal' | 'external' | 'scroll';
  internalLink?: string;
  externalLink?: string;
  scrollTarget?: 'offers' | 'categories' | 'featured' | 'delivery'; // القسم المستهدف للتمرير
}

const PromotionsManager = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [discountedProducts, setDiscountedProducts] = useState<Product[]>([]);
  const [regularProducts, setRegularProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<number | null>(null);
  const [discountPrice, setDiscountPrice] = useState<number>(0);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'all' | 'discounted' | 'special' | 'hero'>('all');
  
  // حالات للإعلان الخاص
  const [specialPromo, setSpecialPromo] = useState<SpecialPromoData>({
    enabled: false,
    title: "عروض اليوم!",
    description: "خصم 20% على جميع المنتجات",
    subtext: "العرض ساري حتى نهاية الأسبوع",
    backgroundColor: "#a15623",
    buttonText: "اطلب الآن",
    imageUrl: "https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=1600&auto=format&fit=crop",
    linkType: 'scroll'
  });
  
  // حالات للبانر الرئيسي
  const [heroBanner, setHeroBanner] = useState<HeroBannerData>({
    enabled: true,
    title: "أشهى المأكولات البيتي توصل لباب بيتك",
    description: "اطلب ألذ الأطباق الطازجة والخضراوات الفريش مع خدمة توصيل سريعة",
    imageUrl: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=900&q=80",
    buttonText: "اطلب الآن",
    backgroundColor: "#a15623",
    linkType: 'scroll'
  });
  
  const [isSaving, setIsSaving] = useState(false);
  const [isSpecialPromoLoading, setIsSpecialPromoLoading] = useState(true);
  const [isHeroBannerLoading, setIsHeroBannerLoading] = useState(true);

  // التحميل الأولي للمنتجات
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        // جلب المنتجات من Firestore بدلاً من التخزين المحلي
        const productsCol = collection(db, 'products');
        const productsSnapshot = await getDocs(productsCol);
        const productsList = productsSnapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() })) as Product[];
        setProducts(productsList);

        // جلب بيانات الإعلان الخاص
        await fetchSpecialPromo();
        // جلب بيانات البانر الرئيسي
        await fetchHeroBanner();
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };
    
    fetchProducts();
  }, []);

  // جلب بيانات الإعلان الخاص
  const fetchSpecialPromo = async () => {
    try {
      setIsSpecialPromoLoading(true);
      const specialPromoRef = doc(db, 'settings', 'specialPromo');
      const specialPromoSnapshot = await getDoc(specialPromoRef);
      
      if (specialPromoSnapshot.exists()) {
        setSpecialPromo(specialPromoSnapshot.data() as SpecialPromoData);
      }
    } catch (error) {
      console.error("Error fetching special promo:", error);
    } finally {
      setIsSpecialPromoLoading(false);
    }
  };

  // جلب بيانات البانر الرئيسي
  const fetchHeroBanner = async () => {
    try {
      setIsHeroBannerLoading(true);
      const heroBannerRef = doc(db, 'settings', 'heroBanner');
      const heroBannerSnapshot = await getDoc(heroBannerRef);
      
      if (heroBannerSnapshot.exists()) {
        setHeroBanner(heroBannerSnapshot.data() as HeroBannerData);
      }
    } catch (error) {
      console.error("Error fetching hero banner:", error);
    } finally {
      setIsHeroBannerLoading(false);
    }
  };

  // حفظ بيانات الإعلان الخاص
  const saveSpecialPromo = async () => {
    try {
      setIsSaving(true);
      const specialPromoRef = doc(db, 'settings', 'specialPromo');
      await setDoc(specialPromoRef, specialPromo);
      alert('تم حفظ الإعلان الخاص بنجاح');
    } catch (error) {
      console.error("Error saving special promo:", error);
      alert('حدث خطأ أثناء حفظ الإعلان الخاص');
    } finally {
      setIsSaving(false);
    }
  };

  // حفظ بيانات البانر الرئيسي
  const saveHeroBanner = async () => {
    try {
      setIsSaving(true);
      const heroBannerRef = doc(db, 'settings', 'heroBanner');
      await setDoc(heroBannerRef, heroBanner);
      alert('تم حفظ البانر الرئيسي بنجاح');
    } catch (error) {
      console.error("Error saving hero banner:", error);
      alert('حدث خطأ أثناء حفظ البانر الرئيسي');
    } finally {
      setIsSaving(false);
    }
  };

  // تصنيف المنتجات عند تغييرها
  useEffect(() => {
    if (products.length > 0) {
      setDiscountedProducts(products.filter(product => product.discountPrice !== undefined && product.discountPrice !== null));
      setRegularProducts(products.filter(product => product.discountPrice === undefined || product.discountPrice === null));
    }
  }, [products]);

  // تصفية المنتجات بناءً على البحث
  const filteredProducts = activeTab === 'all' 
    ? regularProducts.filter(product => 
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description.toLowerCase().includes(searchTerm.toLowerCase()))
    : discountedProducts.filter(product => 
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description.toLowerCase().includes(searchTerm.toLowerCase()));

  // إضافة عرض لمنتج
  const handleAddPromotion = async () => {
    if (selectedProduct === null) {
      alert('يرجى اختيار منتج أولاً');
      return;
    }

    if (discountPrice <= 0) {
      alert('يرجى إدخال سعر عرض صالح');
      return;
    }

    const selectedProductData = products.find(product => product.id === selectedProduct);
    if (selectedProductData && discountPrice >= selectedProductData.price) {
      alert('سعر العرض يجب أن يكون أقل من السعر الأصلي');
      return;
    }

    // تحديث المنتج في Firestore
    const productRef = doc(db, 'products', String(selectedProduct));
    await updateDoc(productRef, { discountPrice });

    // إعادة تحميل المنتجات
    const productsCol = collection(db, 'products');
    const productsSnapshot = await getDocs(productsCol);
    const productsList = productsSnapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() })) as Product[];
    setProducts(productsList);

    // إعادة ضبط حقول الإدخال
    setSelectedProduct(null);
    setDiscountPrice(0);
  };

  // إزالة عرض من منتج
  const handleRemovePromotion = async (productId: string | number) => {
    if (window.confirm('هل أنت متأكد من رغبتك في إزالة هذا العرض؟')) {
      const productRef = doc(db, 'products', String(productId));
      await updateDoc(productRef, { discountPrice: null });

      // إعادة تحميل المنتجات
      const productsCol = collection(db, 'products');
      const productsSnapshot = await getDocs(productsCol);
      const productsList = productsSnapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() })) as Product[];
      setProducts(productsList);
    }
  };

  // حساب نسبة الخصم
  const calculateDiscountPercentage = (originalPrice: number, discountPrice: number): number => {
    if (!originalPrice || !discountPrice) return 0;
    const percentage = ((originalPrice - discountPrice) / originalPrice) * 100;
    return Math.round(percentage);
  };

  // تنسيق التاريخ
  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toISOString().split('T')[0]; // تنسيق YYYY-MM-DD
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* شريط العنوان */}
      <div className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">إدارة العروض</h1>
          <div className="flex space-x-2">
            <Link 
              to="/admin" 
              className="flex items-center text-blue-600 hover:text-blue-800 transition px-3 py-1 border border-blue-200 rounded-md bg-blue-50 hover:bg-blue-100">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 ml-1">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 15.75L3 12m0 0l3.75-3.75M3 12h18" />
              </svg>
              الرجوع للوحة التحكم
            </Link>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {/* إحصائيات سريعة */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-6 border-r-4 border-amber-500">
            <div className="flex items-center">
              <div className="p-3 bg-amber-100 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-amber-600">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" />
                </svg>
              </div>
              <div className="mr-4">
                <h2 className="text-sm text-gray-500 font-medium">العروض النشطة</h2>
                <div className="flex items-center">
                  <span className="text-2xl font-bold text-gray-900">{discountedProducts.length}</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6 border-r-4 border-blue-500">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-blue-600">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" />
                </svg>
              </div>
              <div className="mr-4">
                <h2 className="text-sm text-gray-500 font-medium">المنتجات بدون عروض</h2>
                <div className="flex items-center">
                  <span className="text-2xl font-bold text-gray-900">{regularProducts.length}</span>
                </div>
              </div>
            </div>
          </div>
          
          <div 
            className={`bg-white rounded-lg shadow-sm p-6 border-r-4 ${
              specialPromo.enabled ? 'border-green-500' : 'border-gray-500'
            }`}
          >
            <div className="flex items-center">
              <div className={`p-3 rounded-full ${
                specialPromo.enabled ? 'bg-green-100' : 'bg-gray-100'
              }`}>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" 
                className={`w-6 h-6 ${
                  specialPromo.enabled ? 'text-green-600' : 'text-gray-600'
                }`}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.34 15.84c-.688-.06-1.386-.09-2.09-.09H7.5a4.5 4.5 0 110-9h.75c.704 0 1.402-.03 2.09-.09m0 9.18c.253.962.584 1.892.985 2.783.247.55.06 1.21-.463 1.511l-.657.38c-.551.318-1.26.117-1.527-.461a20.845 20.845 0 01-1.44-4.282m3.102.069a18.03 18.03 0 01-.59-4.59c0-1.586.205-3.124.59-4.59m0 9.18a23.848 23.848 0 018.835 2.535M10.34 6.66a23.847 23.847 0 008.835-2.535m0 0A23.74 23.74 0 0018.795 3m.38 1.125a23.91 23.91 0 011.014 5.395m-1.014 8.855c-.118.38-.245.754-.38 1.125m.38-1.125a23.91 23.91 0 001.014-5.395m0-3.46c.495.413.811 1.035.811 1.73 0 .695-.316 1.317-.811 1.73m0-3.46a24.347 24.347 0 010 3.46" />
                </svg>
              </div>
              <div className="mr-4">
                <h2 className="text-sm text-gray-500 font-medium">الإعلان الخاص</h2>
                <div className="flex items-center">
                  <span className={`text-xl font-bold ${
                    specialPromo.enabled ? 'text-green-600' : 'text-gray-600'
                  }`}>
                    {specialPromo.enabled ? 'مفعّل' : 'غير مفعّل'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* تبويبات لعرض المنتجات */}
        <div className="mb-4">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex" aria-label="Tabs">
              <button
                onClick={() => setActiveTab('discounted')}
                className={`${
                  activeTab === 'discounted'
                    ? 'border-amber-500 text-amber-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } w-1/4 py-4 px-1 text-center border-b-2 font-medium`}
              >
                العروض النشطة ({discountedProducts.length})
              </button>
              <button
                onClick={() => setActiveTab('all')}
                className={`${
                  activeTab === 'all'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } w-1/4 py-4 px-1 text-center border-b-2 font-medium`}
              >
                المنتجات المتاحة ({regularProducts.length})
              </button>
              <button
                onClick={() => setActiveTab('special')}
                className={`${
                  activeTab === 'special'
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } w-1/4 py-4 px-1 text-center border-b-2 font-medium`}
              >
                الإعلان الخاص
              </button>
              <button
                onClick={() => setActiveTab('hero')}
                className={`${
                  activeTab === 'hero'
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } w-1/4 py-4 px-1 text-center border-b-2 font-medium`}
              >
                البانر الرئيسي
              </button>
            </nav>
          </div>
        </div>
        
        {/* نموذج إضافة عرض جديد */}
        {activeTab !== 'special' && activeTab !== 'hero' && (
          <div className="bg-white shadow-sm rounded-lg p-6 mb-6 border-r-4 border-amber-500">
            <h3 className="text-lg font-semibold mb-4 flex items-center text-amber-800">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 ml-2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" />
              </svg>
              إضافة عرض جديد
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="block text-gray-700 mb-1 text-sm font-medium">اختر المنتج</label>
                <select 
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  value={selectedProduct || ''}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setSelectedProduct(val);
                    
                    // عند اختيار منتج، احضر سعره الحالي لاقتراح خصم مناسب
                    const product = products.find(p => p.id === val);
                    if (product) {
                      // اقتراح سعر خصم بنسبة 10% أقل من السعر الأصلي
                      setDiscountPrice(Math.round(product.price * 0.9));
                    }
                  }}
                >
                  <option value="">-- اختر منتجًا --</option>
                  {regularProducts.map(product => (
                    <option key={product.id} value={product.id}>
                      {product.name} - {product.price} جنيه
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-gray-700 mb-1 text-sm font-medium">سعر العرض</label>
                <div className="relative">
                  <input
                    type="number"
                    className="w-full p-2 pl-12 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                    value={discountPrice}
                    onChange={(e) => setDiscountPrice(Number(e.target.value))}
                  />
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500">جنيه</span>
                  </div>
                </div>
              </div>
              
              {selectedProduct && (
                <div className="md:col-span-3 bg-amber-50 پ-4 rounded-md border border-amber-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      {(() => {
                        const product = products.find(p => p.id === selectedProduct);
                        if (product) {
                          const percentage = calculateDiscountPercentage(product.price, discountPrice);
                          return (
                            <div>
                              <p className="font-medium text-gray-800">{product.name}</p>
                              <div className="flex items-center mt-1">
                                <span className="text-lg font-semibold line-through text-gray-500 ml-2">
                                  {product.price} جنيه
                                </span>
                                <span className="text-lg font-bold text-red-600">
                                  {discountPrice} جنيه
                                </span>
                                {percentage > 0 && (
                                  <span className="mr-2 px-2 py-0.5 bg-red-100 text-red-600 rounded-full text-xs font-semibold">
                                    خصم {percentage}%
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        }
                        return null;
                      })()}
                    </div>
                    <button
                      className="flex items-center px-3 py-1.5 bg-amber-500 text-white rounded-md hover:bg-amber-600 transition-colors"
                      onClick={handleAddPromotion}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 ml-1">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                      </svg>
                      تطبيق العرض
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* واجهة إدارة الإعلان الخاص */}
        {activeTab === 'special' && (
          <div className="bg-white shadow-sm rounded-lg پ-6 mb-6 border-r-4 border-green-500">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold flex items-center text-green-800">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 ml-2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.34 15.84c-.688-.06-1.386-.09-2.09-.09H7.5a4.5 4.5 0 110-9h.75c.704 0 1.402-.03 2.09-.09m0 9.18c.253.962.584 1.892.985 2.783.247.55.06 1.21-.463 1.511l-.657.38c-.551.318-1.26.117-1.527-.461a20.845 20.845 0 01-1.44-4.282m3.102.069a18.03 18.03 0 01-.59-4.59c0-1.586.205-3.124.59-4.59m0 9.18a23.848 23.848 0 018.835 2.535M10.34 6.66a23.847 23.847 0 008.835-2.535m0 0A23.74 23.74 0 0018.795 3m.38 1.125a23.91 23.91 0 011.014 5.395m-1.014 8.855c-.118.38-.245.754-.38 1.125m.38-1.125a23.91 23.91 0 001.014-5.395m0-3.46c.495.413.811 1.035.811 1.73 0 .695-.316 1.317-.811 1.73m0-3.46a24.347 24.347 0 010 3.46" />
                </svg>
                إعدادات الإعلان الخاص
              </h3>
              
              <div className="flex items-center">
                <span className="text-sm ml-2">تفعيل الإعلان</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer" 
                    checked={specialPromo.enabled}
                    onChange={(e) => setSpecialPromo({...specialPromo, enabled: e.target.checked})}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:translate-x-[-100%] peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                </label>
              </div>
            </div>
            
            {isSpecialPromoLoading ? (
              <div className="flex justify-center items-center h-40">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600"></div>
              </div>
            ) : (
              <div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-gray-700 mb-2 text-sm font-medium">عنوان الإعلان</label>
                      <input
                        type="text"
                        className="w-full پ-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        value={specialPromo.title}
                        onChange={(e) => setSpecialPromo({...specialPromo, title: e.target.value})}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-gray-700 mb-2 text-sm font-medium">وصف الإعلان (نص رئيسي)</label>
                      <input
                        type="text"
                        className="w-full پ-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        value={specialPromo.description}
                        onChange={(e) => setSpecialPromo({...specialPromo, description: e.target.value})}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-gray-700 mb-2 text-sm font-medium">نص إضافي (تفاصيل)</label>
                      <input
                        type="text"
                        className="w-full پ-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        value={specialPromo.subtext}
                        onChange={(e) => setSpecialPromo({...specialPromo, subtext: e.target.value})}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-gray-700 mb-2 text-sm font-medium">نص الزر</label>
                      <input
                        type="text"
                        className="w-full پ-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        value={specialPromo.buttonText}
                        onChange={(e) => setSpecialPromo({...specialPromo, buttonText: e.target.value})}
                      />
                    </div>

                    {/* إضافة خيارات الرابط */}
                    <div>
                      <label className="block text-gray-700 mb-2 text-sm font-medium">نوع الرابط</label>
                      <div className="grid grid-cols-3 gap-2">
                        <button
                          type="button"
                          onClick={() => setSpecialPromo({...specialPromo, linkType: 'scroll'})}
                          className={`پ-2 text-sm rounded-md flex flex-col items-center justify-center ${
                            specialPromo.linkType === 'scroll' 
                              ? 'bg-green-100 text-green-700 border border-green-300' 
                              : 'bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200'
                          }`}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mb-1">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 5.25l-7.5 7.5-7.5-7.5m15 6l-7.5 7.5-7.5-7.5" />
                          </svg>
                          تمرير للأسفل
                        </button>
                        <button
                          type="button"
                          onClick={() => setSpecialPromo({...specialPromo, linkType: 'internal'})}
                          className={`پ-2 text-sm rounded-md flex flex-col items-center justify-center ${
                            specialPromo.linkType === 'internal' 
                              ? 'bg-green-100 text-green-700 border border-green-300' 
                              : 'bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200'
                          }`}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mb-1">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                          </svg>
                          صفحة داخلية
                        </button>
                        <button
                          type="button"
                          onClick={() => setSpecialPromo({...specialPromo, linkType: 'external'})}
                          className={`پ-2 text-sm rounded-md flex flex-col items-center justify-center ${
                            specialPromo.linkType === 'external' 
                              ? 'bg-green-100 text-green-700 border border-green-300' 
                              : 'bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200'
                          }`}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mb-1">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 21c4.97 0 9-4.03 9-9s-4.03-9-9-9-9 4.03-9 9 4.03 9 9 9z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 7.5v5l3.5 3.5" />
                          </svg>
                          موقع خارجي
                        </button>
                      </div>
                    </div>

                    {/* عرض حقول إضافية حسب نوع الرابط المختار */}
                    {specialPromo.linkType === 'internal' && (
                      <div>
                        <label className="block text-gray-700 mb-2 text-sm font-medium">الرابط الداخلي</label>
                        <div className="flex">
                          <span className="inline-flex items-center px-3 text-gray-500 bg-gray-100 border border-l-0 border-gray-300 rounded-r-md">
                            /
                          </span>
                          <input
                            type="text"
                            className="flex-1 پ-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                            value={specialPromo.internalLink?.replace(/^\//,'')}
                            onChange={(e) => setSpecialPromo({...specialPromo, internalLink: `/${e.target.value.replace(/^\//,'')}`})}
                            placeholder="مثال: category/1"
                          />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          حدد صفحة داخلية مثل: category/1 أو product/5
                        </p>
                      </div>
                    )}

                    {specialPromo.linkType === 'external' && (
                      <div>
                        <label className="block text-gray-700 mb-2 text-sm font-medium">الرابط الخارجي</label>
                        <input
                          type="text"
                          className="w-full پ-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                          value={specialPromo.externalLink}
                          onChange={(e) => setSpecialPromo({...specialPromo, externalLink: e.target.value})}
                          placeholder="https://example.com"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          أدخل عنوان URL كامل يبدأ بـ https://
                        </p>
                      </div>
                    )}

                    {specialPromo.linkType === 'scroll' && (
                      <div>
                        <label className="block text-gray-700 mb-2 text-sm font-medium">القسم المستهدف للتمرير</label>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                          <button
                            type="button"
                            onClick={() => setSpecialPromo({...specialPromo, scrollTarget: 'offers'})}
                            className={`پ-2 text-sm rounded-md flex flex-col items-center justify-center ${
                              specialPromo.scrollTarget === 'offers' || !specialPromo.scrollTarget
                                ? 'bg-green-100 text-green-700 border border-green-300' 
                                : 'bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200'
                            }`}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mb-1">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
                            </svg>
                            قسم العروض
                          </button>
                          <button
                            type="button"
                            onClick={() => setSpecialPromo({...specialPromo, scrollTarget: 'categories'})}
                            className={`پ-2 text-sm rounded-md flex flex-col items-center justify-center ${
                              specialPromo.scrollTarget === 'categories' 
                                ? 'bg-green-100 text-green-700 border border-green-300' 
                                : 'bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200'
                            }`}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mb-1">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
                            </svg>
                            قسم الفئات
                          </button>
                          <button
                            type="button"
                            onClick={() => setSpecialPromo({...specialPromo, scrollTarget: 'featured'})}
                            className={`پ-2 text-sm rounded-md flex flex-col items-center justify-center ${
                              specialPromo.scrollTarget === 'featured' 
                                ? 'bg-green-100 text-green-700 border border-green-300' 
                                : 'bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200'
                            }`}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mb-1">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                            </svg>
                            العروض المميزة
                          </button>
                          <button
                            type="button"
                            onClick={() => setSpecialPromo({...specialPromo, scrollTarget: 'delivery'})}
                            className={`پ-2 text-sm rounded-md flex flex-col items-center justify-center ${
                              specialPromo.scrollTarget === 'delivery' 
                                ? 'bg-green-100 text-green-700 border border-green-300' 
                                : 'bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200'
                            }`}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mb-1">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
                            </svg>
                            قسم التوصيل
                          </button>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                          اختر القسم الذي يتم الانتقال إليه عند النقر على زر الإعلان
                        </p>
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-gray-700 mb-2 text-sm font-medium">لون الخلفية</label>
                      <div className="flex items-center">
                        <input
                          type="color"
                          className="h-10 w-10 border-0 rounded-md cursor-pointer"
                          value={specialPromo.backgroundColor}
                          onChange={(e) => setSpecialPromo({...specialPromo, backgroundColor: e.target.value})}
                        />
                        <input
                          type="text"
                          className="w-full پ-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 mr-2"
                          value={specialPromo.backgroundColor}
                          onChange={(e) => setSpecialPromo({...specialPromo, backgroundColor: e.target.value})}
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-gray-700 mb-2 text-sm font-medium">رابط الصورة</label>
                      <input
                        type="text"
                        className="w-full پ-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        value={specialPromo.imageUrl}
                        onChange={(e) => setSpecialPromo({...specialPromo, imageUrl: e.target.value})}
                        placeholder="https://example.com/image.jpg"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        استخدم صورة عالية الدقة (1600×800 بيكسل أو أكبر) للحصول على أفضل نتيجة.
                      </p>
                    </div>
                    
                    <div>
                      <label className="block text-gray-700 mb-2 text-sm font-medium">تاريخ انتهاء الإعلان (اختياري)</label>
                      <input
                        type="date"
                        className="w-full پ-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        value={formatDate(specialPromo.expireDate || '')}
                        onChange={(e) => setSpecialPromo({
                          ...specialPromo, 
                          expireDate: e.target.value ? new Date(e.target.value).toISOString() : undefined
                        })}
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        سيتوقف عرض الإعلان تلقائيًا بعد هذا التاريخ. اتركه فارغًا للإعلانات غير المحددة بوقت.
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* معاينة الإعلان */}
                <div className="mt-8 border border-gray-200 rounded-lg پ-4 bg-gray-50">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">معاينة الإعلان</h4>
                  
                  <div className="relative overflow-hidden rounded-lg h-48 md:h-64">
                    {/* خلفية الإعلان */}
                    <div className="absolute inset-0">
                      <img 
                        src={specialPromo.imageUrl} 
                        alt={specialPromo.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).onerror = null;
                          (e.target as HTMLImageElement).src = 'https://via.placeholder.com/1600x800?text=صورة+غير+متاحة';
                        }}
                      />
                      {/* طبقة اللون */}
                      <div 
                        className="absolute inset-0 opacity-80"
                        style={{ backgroundColor: specialPromo.backgroundColor }}
                      />
                    </div>
                    
                    {/* محتوى الإعلان */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center px-4">
                        <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">{specialPromo.title}</h2>
                        
                        <div className="bg-black/30 backdrop-blur-sm پ-2 md:p-3 rounded-lg mb-3 inline-block">
                          <p className="text-base md:text-lg text-white font-bold">{specialPromo.description}</p>
                          <p className="text-white opacity-90 text-xs md:text-sm">{specialPromo.subtext}</p>
                        </div>
                        
                        <button className="bg-white py-1 px-3 rounded-md text-sm font-medium mx-auto mt-2"
                          style={{ color: specialPromo.backgroundColor }}
                        >
                          {specialPromo.buttonText}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-end mt-6">
                  <button
                    className={`flex items-center px-5 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors ${
                      isSaving ? 'opacity-70 cursor-not-allowed' : ''
                    }`}
                    onClick={saveSpecialPromo}
                    disabled={isSaving}
                  >
                    {isSaving ? (
                      <>
                        <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full ml-2"></div>
                        جاري الحفظ...
                      </>
                    ) : (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 ml-2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        حفظ التغييرات
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* واجهة إدارة البانر الرئيسي */}
        {activeTab === 'hero' && (
          <div className="bg-white shadow-sm rounded-lg پ-6 mb-6 border-r-4 border-purple-500">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold flex items-center text-purple-800">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 ml-2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.34 15.84c-.688-.06-1.386-.09-2.09-.09H7.5a4.5 4.5 0 110-9h.75c.704 0 1.402-.03 2.09-.09m0 9.18c.253.962.584 1.892.985 2.783.247.55.06 1.21-.463 1.511l-.657.38c-.551.318-1.26.117-1.527-.461a20.845 20.845 0 01-1.44-4.282m3.102.069a18.03 18.03 0 01-.59-4.59c0-1.586.205-3.124.59-4.59m0 9.18a23.848 23.848 0 018.835 2.535M10.34 6.66a23.847 23.847 0 008.835-2.535m0 0A23.74 23.74 0 0018.795 3m.38 1.125a23.91 23.91 0 011.014 5.395m-1.014 8.855c-.118.38-.245.754-.38 1.125m.38-1.125a23.91 23.91 0 001.014-5.395m0-3.46c.495.413.811 1.035.811 1.73 0 .695-.316 1.317-.811 1.73m0-3.46a24.347 24.347 0 010 3.46" />
                </svg>
                إعدادات البانر الرئيسي
              </h3>
              
              <div className="flex items-center">
                <span className="text-sm ml-2">تفعيل البانر</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer" 
                    checked={heroBanner.enabled}
                    onChange={(e) => setHeroBanner({...heroBanner, enabled: e.target.checked})}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:translate-x-[-100%] peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                </label>
              </div>
            </div>
            
            {isHeroBannerLoading ? (
              <div className="flex justify-center items-center h-40">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600"></div>
              </div>
            ) : (
              <div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-gray-700 mb-2 text-sm font-medium">عنوان البانر</label>
                      <input
                        type="text"
                        className="w-full پ-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        value={heroBanner.title}
                        onChange={(e) => setHeroBanner({...heroBanner, title: e.target.value})}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-gray-700 mb-2 text-sm font-medium">وصف البانر (نص رئيسي)</label>
                      <input
                        type="text"
                        className="w-full پ-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        value={heroBanner.description}
                        onChange={(e) => setHeroBanner({...heroBanner, description: e.target.value})}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-gray-700 mb-2 text-sm font-medium">نص الزر</label>
                      <input
                        type="text"
                        className="w-full پ-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        value={heroBanner.buttonText}
                        onChange={(e) => setHeroBanner({...heroBanner, buttonText: e.target.value})}
                      />
                    </div>

                    {/* إضافة خيارات الرابط */}
                    <div>
                      <label className="block text-gray-700 mb-2 text-sm font-medium">نوع الرابط</label>
                      <div className="grid grid-cols-3 gap-2">
                        <button
                          type="button"
                          onClick={() => setHeroBanner({...heroBanner, linkType: 'scroll'})}
                          className={`پ-2 text-sm rounded-md flex flex-col items-center justify-center ${
                            heroBanner.linkType === 'scroll' 
                              ? 'bg-purple-100 text-purple-700 border border-purple-300' 
                              : 'bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200'
                          }`}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mb-1">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 5.25l-7.5 7.5-7.5-7.5m15 6l-7.5 7.5-7.5-7.5" />
                          </svg>
                          تمرير للأسفل
                        </button>
                        <button
                          type="button"
                          onClick={() => setHeroBanner({...heroBanner, linkType: 'internal'})}
                          className={`پ-2 text-sm rounded-md flex flex-col items-center justify-center ${
                            heroBanner.linkType === 'internal' 
                              ? 'bg-purple-100 text-purple-700 border border-purple-300' 
                              : 'bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200'
                          }`}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mb-1">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                          </svg>
                          صفحة داخلية
                        </button>
                        <button
                          type="button"
                          onClick={() => setHeroBanner({...heroBanner, linkType: 'external'})}
                          className={`پ-2 text-sm rounded-md flex flex-col items-center justify-center ${
                            heroBanner.linkType === 'external' 
                              ? 'bg-purple-100 text-purple-700 border border-purple-300' 
                              : 'bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200'
                          }`}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mb-1">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
                          </svg>
                          موقع خارجي
                        </button>
                      </div>
                    </div>

                    {/* عرض حقول إضافية حسب نوع الرابط المختار */}
                    {heroBanner.linkType === 'internal' && (
                      <div>
                        <label className="block text-gray-700 mb-2 text-sm font-medium">الرابط الداخلي</label>
                        <div className="flex">
                          <span className="inline-flex items-center px-3 text-gray-500 bg-gray-100 border border-l-0 border-gray-300 rounded-r-md">
                            /
                          </span>
                          <input
                            type="text"
                            className="flex-1 پ-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                            value={heroBanner.internalLink?.replace(/^\//,'')}
                            onChange={(e) => setHeroBanner({...heroBanner, internalLink: `/${e.target.value.replace(/^\//,'')}`})}
                            placeholder="مثال: category/1"
                          />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          حدد صفحة داخلية مثل: category/1 أو product/5
                        </p>
                      </div>
                    )}

                    {heroBanner.linkType === 'external' && (
                      <div>
                        <label className="block text-gray-700 mb-2 text-sm font-medium">الرابط الخارجي</label>
                        <input
                          type="text"
                          className="w-full پ-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                          value={heroBanner.externalLink}
                          onChange={(e) => setHeroBanner({...heroBanner, externalLink: e.target.value})}
                          placeholder="https://example.com"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          أدخل عنوان URL كامل يبدأ بـ https://
                        </p>
                      </div>
                    )}

                    {heroBanner.linkType === 'scroll' && (
                      <div>
                        <label className="block text-gray-700 mb-2 text-sm font-medium">القسم المستهدف للتمرير</label>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                          <button
                            type="button"
                            onClick={() => setHeroBanner({...heroBanner, scrollTarget: 'offers'})}
                            className={`پ-2 text-sm rounded-md flex flex-col items-center justify-center ${
                              heroBanner.scrollTarget === 'offers' || !heroBanner.scrollTarget
                                ? 'bg-purple-100 text-purple-700 border border-purple-300' 
                                : 'bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200'
                            }`}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mb-1">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
                            </svg>
                            قسم العروض
                          </button>
                          <button
                            type="button"
                            onClick={() => setHeroBanner({...heroBanner, scrollTarget: 'categories'})}
                            className={`پ-2 text-sm rounded-md flex flex-col items-center justify-center ${
                              heroBanner.scrollTarget === 'categories' 
                                ? 'bg-purple-100 text-purple-700 border border-purple-300' 
                                : 'bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200'
                            }`}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mb-1">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
                            </svg>
                            قسم الفئات
                          </button>
                          <button
                            type="button"
                            onClick={() => setHeroBanner({...heroBanner, scrollTarget: 'featured'})}
                            className={`پ-2 text-sm rounded-md flex flex-col items-center justify-center ${
                              heroBanner.scrollTarget === 'featured' 
                                ? 'bg-purple-100 text-purple-700 border border-purple-300' 
                                : 'bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200'
                            }`}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mb-1">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                            </svg>
                            العروض المميزة
                          </button>
                          <button
                            type="button"
                            onClick={() => setHeroBanner({...heroBanner, scrollTarget: 'delivery'})}
                            className={`پ-2 text-sm rounded-md flex flex-col items-center justify-center ${
                              heroBanner.scrollTarget === 'delivery' 
                                ? 'bg-purple-100 text-purple-700 border border-purple-300' 
                                : 'bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200'
                            }`}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mb-1">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
                            </svg>
                            قسم التوصيل
                          </button>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                          اختر القسم الذي يتم الانتقال إليه عند النقر على زر البانر
                        </p>
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-gray-700 mb-2 text-sm font-medium">لون الخلفية</label>
                      <div className="flex items-center">
                        <input
                          type="color"
                          className="h-10 w-10 border-0 rounded-md cursor-pointer"
                          value={heroBanner.backgroundColor}
                          onChange={(e) => setHeroBanner({...heroBanner, backgroundColor: e.target.value})}
                        />
                        <input
                          type="text"
                          className="w-full پ-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 mr-2"
                          value={heroBanner.backgroundColor}
                          onChange={(e) => setHeroBanner({...heroBanner, backgroundColor: e.target.value})}
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-gray-700 mb-2 text-sm font-medium">رابط الصورة</label>
                      <input
                        type="text"
                        className="w-full پ-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        value={heroBanner.imageUrl}
                        onChange={(e) => setHeroBanner({...heroBanner, imageUrl: e.target.value})}
                        placeholder="https://example.com/image.jpg"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        استخدم صورة عالية الدقة (1600×800 بيكسل أو أكبر) للحصول على أفضل نتيجة.
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* معاينة البانر */}
                <div className="mt-8 border border-gray-200 rounded-lg پ-4 bg-gray-50">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">معاينة البانر</h4>
                  
                  <div className="relative overflow-hidden rounded-lg h-48 md:h-64">
                    {/* خلفية البانر */}
                    <div className="absolute inset-0">
                      <img 
                        src={heroBanner.imageUrl} 
                        alt={heroBanner.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).onerror = null;
                          (e.target as HTMLImageElement).src = 'https://via.placeholder.com/1600x800?text=صورة+غير+متاحة';
                        }}
                      />
                      {/* طبقة اللون */}
                      <div 
                        className="absolute inset-0 opacity-80"
                        style={{ backgroundColor: heroBanner.backgroundColor }}
                      />
                    </div>
                    
                    {/* محتوى البانر */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center px-4">
                        <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">{heroBanner.title}</h2>
                        
                        <div className="bg-black/30 backdrop-blur-sm پ-2 md:p-3 rounded-lg mb-3 inline-block">
                          <p className="text-base md:text-lg text-white font-bold">{heroBanner.description}</p>
                        </div>
                        
                        <button className="bg-white py-1 px-3 rounded-md text-sm font-medium mx-auto mt-2"
                          style={{ color: heroBanner.backgroundColor }}
                        >
                          {heroBanner.buttonText}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-end mt-6">
                  <button
                    className={`flex items-center px-5 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors ${
                      isSaving ? 'opacity-70 cursor-not-allowed' : ''
                    }`}
                    onClick={saveHeroBanner}
                    disabled={isSaving}
                  >
                    {isSaving ? (
                      <>
                        <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full ml-2"></div>
                        جاري الحفظ...
                      </>
                    ) : (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 ml-2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        حفظ التغييرات
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* بحث - للتبويبات المتعلقة بالمنتجات فقط */}
        {activeTab !== 'special' && activeTab !== 'hero' && (
          <div className="mb-6">
            <div className="relative">
              <span className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-gray-400">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                </svg>
              </span>
              <input
                type="text"
                placeholder="ابحث عن منتج..."
                className="w-full pl-3 pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        )}

        {/* عرض المنتجات حسب التبويب المحدد */}
        {activeTab !== 'special' && activeTab !== 'hero' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeTab === 'discounted' ? (
              <>
                {filteredProducts.length > 0 ? (
                  filteredProducts.map((product) => (
                    <div key={product.id} className="bg-white rounded-lg shadow-sm overflow-hidden border border-amber-100 hover:shadow-md transition-shadow">
                      <div className="relative">
                        <img 
                          src={product.imageUrl} 
                          alt={product.name} 
                          className="w-full h-48 object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).onerror = null;
                            (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300x200?text=صورة+غير+متاحة';
                          }}
                        />
                        <div className="absolute top-2 left-2 px-2 py-1 bg-red-600 text-white text-sm font-semibold rounded-md">
                          خصم {calculateDiscountPercentage(product.price, product.discountPrice || 0)}%
                        </div>
                      </div>
                      <div className="پ-4">
                        <h3 className="text-lg font-semibold text-gray-800">{product.name}</h3>
                        <p className="text-sm text-gray-500 line-clamp-2 h-10">{product.description}</p>
                        
                        <div className="flex justify-between items-center mt-3">
                          <div>
                            <span className="block text-sm line-through text-gray-500">{product.price} جنيه</span>
                            <span className="text-lg font-bold text-red-600">{product.discountPrice} جنيه</span>
                          </div>
                          
                          <button
                            className="پ-2 bg-red-100 text-red-600 rounded-md hover:bg-red-200 transition-colors"
                            onClick={() => handleRemovePromotion(product.id)}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="md:col-span-3 text-center py-8">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 mx-auto text-gray-300 mb-3">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" />
                    </svg>
                    <h2 className="text-xl font-semibold text-gray-600 mb-1">لا توجد عروض نشطة حاليًا</h2>
                    <p className="text-gray-500">
                      أضف عروضًا لمنتجاتك لجذب المزيد من الزبائن
                    </p>
                  </div>
                )}
              </>
            ) : (
              <>
                {filteredProducts.length > 0 ? (
                  filteredProducts.map((product) => (
                    <div key={product.id} className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                      <div className="relative">
                        <img 
                          src={product.imageUrl} 
                          alt={product.name} 
                          className="w-full h-48 object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).onerror = null;
                            (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300x200?text=صورة+غير+متاحة';
                          }}
                        />
                        {!product.inStock && (
                          <div className="absolute inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center">
                            <span className="px-3 py-1 bg-gray-800 text-white text-sm font-semibold rounded-md">
                              غير متوفر
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="پ-4">
                        <h3 className="text-lg font-semibold text-gray-800">{product.name}</h3>
                        <p className="text-sm text-gray-500 line-clamp-2 h-10">{product.description}</p>
                        
                        <div className="flex justify-between items-center mt-3">
                          <div>
                            <span className="text-lg font-semibold text-gray-800">{product.price} جنيه</span>
                          </div>
                          
                          <button
                            className="پ-1.5 px-3 bg-amber-100 text-amber-600 rounded-md hover:bg-amber-200 transition-colors flex items-center text-sm"
                            onClick={() => {
                              setSelectedProduct(Number(product.id));
                              setDiscountPrice(Math.round(product.price * 0.9));
                              window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                            disabled={!product.inStock}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 ml-1">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                            </svg>
                            إضافة عرض
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="md:col-span-3 text-center py-8">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 mx-auto text-gray-300 mb-3">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" />
                    </svg>
                    <h2 className="text-xl font-semibold text-gray-600 mb-1">لا توجد منتجات مطابقة للبحث</h2>
                    <p className="text-gray-500">
                      حاول البحث بكلمات أخرى أو أضف منتجات جديدة
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PromotionsManager;