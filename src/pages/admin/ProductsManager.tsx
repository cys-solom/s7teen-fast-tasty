import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Product } from '../../types/product';
import { db } from '../../utils/firebase';
import {
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  updateDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  query,
  orderBy
} from 'firebase/firestore';

const ProductsManager = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [newProduct, setNewProduct] = useState<Partial<Product>>({
    name: '',
    description: '',
    price: 0,
    imageUrl: '',
    category: '',
    rating: 5,
    inStock: true,
    features: [],
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [categories, setCategories] = useState<{id: string, name: string}[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error' | null}>({
    message: '',
    type: null
  });
  
  // مرجع للنموذج لاستخدامه في التمرير
  const formRef = useRef<HTMLDivElement>(null);
  const newFormRef = useRef<HTMLDivElement>(null);

  // التحميل الأولي للمنتجات مع الاستماع للتغييرات
  useEffect(() => {
    setLoading(true);
    
    // استخدام مستمع للتغييرات بدون ترتيب لتجنب الأخطاء
    const unsubscribe = onSnapshot(collection(db, 'products'), (querySnapshot) => {
      const productsList = querySnapshot.docs.map(docSnap => ({ 
        id: docSnap.id, 
        ...docSnap.data() 
      })) as Product[];
      
      // نقوم بترتيب المنتجات بعد استلامها إذا كان لديها حقل createdAt
      const sortedProducts = [...productsList].sort((a, b) => {
        // التحقق من وجود حقل createdAt قبل استخدامه
        if (a.createdAt && b.createdAt) {
          return (b.createdAt.seconds || 0) - (a.createdAt.seconds || 0);
        } 
        // إذا كان أحدهما فقط لديه حقل createdAt، ضع المنتج الذي لديه الحقل في الأعلى
        else if (a.createdAt) {
          return -1;
        } 
        else if (b.createdAt) {
          return 1;
        }
        // في حال لم يكن لدى أي منهما حقل createdAt، لا تغير الترتيب
        return 0;
      });
      
      setProducts(sortedProducts);
      setLoading(false);
      
      // عرض إشعار عند تحديث البيانات (فقط بعد التحميل الأولي)
      if (!loading) {
        setNotification({
          message: 'تم تحديث قائمة المنتجات',
          type: 'success'
        });
        
        // إخفاء الإشعار بعد 3 ثواني
        setTimeout(() => {
          setNotification({
            message: '',
            type: null
          });
        }, 3000);
      }
    }, (error) => {
      console.error("خطأ في جلب المنتجات:", error);
      setLoading(false);
      setNotification({
        message: 'حدث خطأ أثناء جلب البيانات',
        type: 'error'
      });
    });
    
    // تنظيف المستمع عند إلغاء تحميل المكون
    return () => unsubscribe();
  }, []);

  // جلب التصنيفات من Firestore مع الاستماع للتغييرات
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'categories'), (querySnapshot) => {
      const categoriesList = querySnapshot.docs.map(docSnap => ({ 
        id: docSnap.id, 
        ...docSnap.data() 
      }));
      setCategories(categoriesList);
    });
    
    return () => unsubscribe();
  }, []);

  // حفظ المنتجات في التخزين المحلي عند تغييرها
  useEffect(() => {
    if (products.length > 0) {
      localStorage.setItem('admin_products', JSON.stringify(products));
    }
  }, [products]);

  // التمرير إلى نموذج التعديل عندما يتغير المنتج المراد تعديله
  useEffect(() => {
    if (editingProduct && formRef.current) {
      // التمرير إلى النموذج مع تأخير صغير للتأكد من تحديث DOM
      setTimeout(() => {
        formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }, [editingProduct]);

  // التمرير إلى نموذج الإضافة عند فتحه
  useEffect(() => {
    if (showForm && newFormRef.current) {
      setTimeout(() => {
        newFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }, [showForm]);

  // تصفية المنتجات بناءً على البحث
  const filteredProducts = products.filter(product => 
    product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // إضافة منتج جديد
  const handleAddProduct = async () => {
    if (!newProduct.name || !newProduct.description || !newProduct.price || !newProduct.imageUrl || !newProduct.category) {
      alert('يرجى تعبئة جميع الحقول المطلوبة');
      return;
    }
    
    setLoading(true);
    
    try {
      // إضافة حقل تاريخ الإنشاء للمنتج الجديد
      const productToAdd = {
        name: newProduct.name,
        description: newProduct.description,
        price: Number(newProduct.price),
        imageUrl: newProduct.imageUrl,
        category: newProduct.category,
        rating: Number(newProduct.rating) || 5,
        inStock: Boolean(newProduct.inStock),
        features: newProduct.features || [],
        discountPrice: newProduct.discountPrice ? Number(newProduct.discountPrice) : null,
        createdAt: serverTimestamp(), // إضافة طابع زمني للإنشاء
      };
      
      await addDoc(collection(db, 'products'), productToAdd);
      
      // إعادة تعيين نموذج المنتج الجديد
      setNewProduct({
        name: '',
        description: '',
        price: 0,
        imageUrl: '',
        category: '',
        rating: 5,
        inStock: true,
        features: [],
      });
      
      setShowForm(false);
      setNotification({
        message: 'تم إضافة المنتج بنجاح',
        type: 'success'
      });
      
      // إخفاء الإشعار بعد 3 ثواني
      setTimeout(() => {
        setNotification({
          message: '',
          type: null
        });
      }, 3000);
    } catch (error) {
      console.error("خطأ في إضافة المنتج:", error);
      setNotification({
        message: 'حدث خطأ أثناء إضافة المنتج',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // تعديل منتج
  const handleUpdateProduct = async () => {
    if (!editingProduct) return;
    
    setLoading(true);
    
    try {
      const productRef = doc(db, 'products', editingProduct.id);
      const { id, ...productData } = editingProduct;
      
      // تحديث تاريخ التعديل
      await updateDoc(productRef, {
        ...productData,
        updatedAt: serverTimestamp()
      });
      
      setEditingProduct(null);
      setNotification({
        message: 'تم تحديث المنتج بنجاح',
        type: 'success'
      });
      
      // إخفاء الإشعار بعد 3 ثواني
      setTimeout(() => {
        setNotification({
          message: '',
          type: null
        });
      }, 3000);
    } catch (error) {
      console.error("خطأ في تحديث المنتج:", error);
      setNotification({
        message: 'حدث خطأ أثناء تحديث المنتج',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // حذف منتج
  const handleDeleteProduct = async (id: string) => {
    if (window.confirm('هل أنت متأكد من رغبتك في حذف هذا المنتج؟')) {
      setLoading(true);
      
      try {
        await deleteDoc(doc(db, 'products', id));
        setNotification({
          message: 'تم حذف المنتج بنجاح',
          type: 'success'
        });
        
        // إخفاء الإشعار بعد 3 ثواني
        setTimeout(() => {
          setNotification({
            message: '',
            type: null
          });
        }, 3000);
      } catch (error) {
        console.error("خطأ في حذف المنتج:", error);
        setNotification({
          message: 'حدث خطأ أثناء حذف المنتج',
          type: 'error'
        });
      } finally {
        setLoading(false);
      }
    }
  };

  // إضافة خاصية جديدة
  const handleAddFeature = (productState: 'new' | 'edit') => {
    if (productState === 'new') {
      setNewProduct({
        ...newProduct,
        features: [...(newProduct.features || []), '']
      });
    } else if (editingProduct) {
      setEditingProduct({
        ...editingProduct,
        features: [...(editingProduct.features || []), '']
      });
    }
  };

  // تعديل خاصية
  const handleFeatureChange = (index: number, value: string, productState: 'new' | 'edit') => {
    if (productState === 'new' && newProduct.features) {
      const updatedFeatures = [...newProduct.features];
      updatedFeatures[index] = value;
      setNewProduct({
        ...newProduct,
        features: updatedFeatures
      });
    } else if (productState === 'edit' && editingProduct && editingProduct.features) {
      const updatedFeatures = [...editingProduct.features];
      updatedFeatures[index] = value;
      setEditingProduct({
        ...editingProduct,
        features: updatedFeatures
      });
    }
  };

  // حذف خاصية
  const handleRemoveFeature = (index: number, productState: 'new' | 'edit') => {
    if (productState === 'new' && newProduct.features) {
      const updatedFeatures = [...newProduct.features];
      updatedFeatures.splice(index, 1);
      setNewProduct({
        ...newProduct,
        features: updatedFeatures
      });
    } else if (productState === 'edit' && editingProduct && editingProduct.features) {
      const updatedFeatures = [...editingProduct.features];
      updatedFeatures.splice(index, 1);
      setEditingProduct({
        ...editingProduct,
        features: updatedFeatures
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* شريط العنوان */}
      <div className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">إدارة المنتجات</h1>
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
        {/* إشعارات النظام */}
        {notification.type && (
          <div className={`mb-6 rounded-md shadow-sm p-3 flex items-center justify-between ${
            notification.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 
            'bg-red-50 text-red-800 border border-red-200'
          }`}>
            <div className="flex items-center">
              {notification.type === 'success' ? (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-green-600 ml-2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-red-600 ml-2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                </svg>
              )}
              <span>{notification.message}</span>
            </div>
            <button 
              onClick={() => setNotification({ message: '', type: null })}
              className="text-gray-500 hover:text-gray-700"
              aria-label="إغلاق الإشعار"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {/* مؤشر التحميل */}
        {loading && (
          <div className="flex items-center justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span className="mr-2 text-gray-600">جاري التحميل...</span>
          </div>
        )}

        <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6">
          <div className="flex-grow ml-0 md:ml-4">
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
          <div className="mt-4 md:mt-0">
            <button 
              onClick={() => setShowForm(!showForm)} 
              className={`px-4 py-2 rounded-md flex items-center transition-colors ${showForm ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
            >
              {showForm ? (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 ml-1">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  إلغاء
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 ml-1">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                  إضافة منتج جديد
                </>
              )}
            </button>
          </div>
        </div>

        {/* إحصائيات سريعة */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-4 border-r-4 border-blue-500">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-blue-600">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 6.878V6a2.25 2.25 0 012.25-2.25h7.5A2.25 2.25 0 0118 6v.878m-12 0c.235-.083.487-.128.75-.128h10.5c.263 0 .515.045.75.128m-12 0A2.25 2.25 0 004.5 9v.878m13.5-3A2.25 2.25 0 0119.5 9v.878m0 0a2.246 2.246 0 00-.75-.128H5.25c-.263 0-.515.045-.75.128m15 0A2.25 2.25 0 0121 12v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6c0-.98.626-1.813 1.5-2.122" />
                </svg>
              </div>
              <div className="mr-3">
                <h2 className="text-xs text-gray-500 font-medium">إجمالي المنتجات</h2>
                <div className="flex items-center">
                  <span className="text-xl font-bold text-gray-900">{products.length}</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-4 border-r-4 border-green-500">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-green-600">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="mr-3">
                <h2 className="text-xs text-gray-500 font-medium">متوفر في المخزون</h2>
                <div className="flex items-center">
                  <span className="text-xl font-bold text-gray-900">
                    {products.filter(product => product.inStock).length}
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-4 border-r-4 border-amber-500">
            <div className="flex items-center">
              <div className="p-2 bg-amber-100 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-amber-600">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" />
                </svg>
              </div>
              <div className="mr-3">
                <h2 className="text-xs text-gray-500 font-medium">عروض خاصة</h2>
                <div className="flex items-center">
                  <span className="text-xl font-bold text-gray-900">
                    {products.filter(product => product.discountPrice !== undefined && product.discountPrice > 0).length}
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-4 border-r-4 border-red-500">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-red-600">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <div className="mr-3">
                <h2 className="text-xs text-gray-500 font-medium">غير متوفر</h2>
                <div className="flex items-center">
                  <span className="text-xl font-bold text-gray-900">
                    {products.filter(product => !product.inStock).length}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* نموذج إضافة منتج جديد */}
        {showForm && (
          <div ref={newFormRef} className="bg-white shadow-sm rounded-lg p-6 mb-6 border-r-4 border-blue-500">
            <h2 className="text-xl font-semibold mb-4 flex items-center text-blue-800">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 ml-2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              إضافة منتج جديد
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-gray-700 mb-1 text-sm font-medium">اسم المنتج</label>
                <input
                  type="text"
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={newProduct.name}
                  onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-gray-700 mb-1 text-sm font-medium">التصنيف</label>
                <select
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={newProduct.category}
                  onChange={(e) => setNewProduct({...newProduct, category: e.target.value})}
                >
                  <option value="">اختر تصنيف</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>{category.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-gray-700 mb-1 text-sm font-medium">السعر</label>
                <div className="relative">
                  <input
                    type="number"
                    className="w-full p-2 pl-12 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={newProduct.price}
                    onChange={(e) => setNewProduct({...newProduct, price: Number(e.target.value)})}
                  />
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500">جنيه</span>
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-gray-700 mb-1 text-sm font-medium">سعر العرض (اختياري)</label>
                <div className="relative">
                  <input
                    type="number"
                    className="w-full p-2 pl-12 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={newProduct.discountPrice || ''}
                    onChange={(e) => setNewProduct({...newProduct, discountPrice: e.target.value ? Number(e.target.value) : undefined})}
                  />
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500">جنيه</span>
                  </div>
                </div>
              </div>
              <div className="md:col-span-2">
                <label className="block text-gray-700 mb-1 text-sm font-medium">الوصف</label>
                <textarea
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                  value={newProduct.description}
                  onChange={(e) => setNewProduct({...newProduct, description: e.target.value})}
                ></textarea>
              </div>
              <div className="md:col-span-2">
                <label className="block text-gray-700 mb-1 text-sm font-medium">رابط الصورة</label>
                <input
                  type="text"
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={newProduct.imageUrl}
                  onChange={(e) => setNewProduct({...newProduct, imageUrl: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-gray-700 mb-1 text-sm font-medium">التقييم</label>
                <div className="flex items-center">
                  <input
                    type="range"
                    min="0"
                    max="5"
                    step="0.1"
                    className="w-full mr-2"
                    value={newProduct.rating}
                    onChange={(e) => setNewProduct({...newProduct, rating: Number(e.target.value)})}
                  />
                  <span className="text-lg font-semibold text-blue-600 min-w-[40px] text-center">{newProduct.rating}</span>
                </div>
              </div>
              <div className="flex items-center">
                <label className="flex items-center cursor-pointer">
                  <div className={`w-11 h-6 flex items-center rounded-full p-1 ${newProduct.inStock ? 'bg-green-500' : 'bg-gray-300'}`}>
                    <div className={`bg-white w-4 h-4 rounded-full shadow-md transform duration-300 ease-in-out ${newProduct.inStock ? 'translate-x-5' : 'translate-x-0'}`}></div>
                  </div>
                  <input type="checkbox" className="hidden" checked={newProduct.inStock} onChange={(e) => setNewProduct({...newProduct, inStock: e.target.checked})} />
                  <span className="mr-3 text-sm font-medium text-gray-700">متوفر في المخزون</span>
                </label>
              </div>
              <div className="md:col-span-2">
                <label className="block text-gray-700 mb-1 text-sm font-medium">مميزات المنتج</label>
                {newProduct.features && newProduct.features.map((feature, index) => (
                  <div key={index} className="flex mb-2">
                    <input
                      type="text"
                      className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={feature}
                      onChange={(e) => handleFeatureChange(index, e.target.value, 'new')}
                    />
                    <button
                      className="mr-2 px-2 bg-red-500 text-white rounded-md hover:bg-red-600"
                      onClick={() => handleRemoveFeature(index, 'new')}
                      aria-label="إزالة الميزة"
                    >
                      ×
                    </button>
                  </div>
                ))}
                <button
                  className="px-3 py-1 bg-blue-100 text-blue-600 rounded-md hover:bg-blue-200 transition-colors flex items-center text-sm mt-1"
                  onClick={() => handleAddFeature('new')}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 ml-1">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m6-6H6" />
                  </svg>
                  إضافة ميزة
                </button>
              </div>
            </div>
            <div className="flex justify-end">
              <button
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors shadow-sm"
                onClick={handleAddProduct}
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 ml-1">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                حفظ المنتج
              </button>
            </div>
          </div>
        )}

        {/* نموذج تعديل منتج */}
        {editingProduct && (
          <div ref={formRef} className="bg-white shadow-sm rounded-lg p-6 mb-6 border-r-4 border-amber-500">
            <h2 className="text-xl font-semibold mb-4 flex items-center text-amber-800">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 ml-2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
              </svg>
              تعديل المنتج: {editingProduct.name}
            </h2>
            
            {/* محتويات نموذج التعديل - مشابهة لنموذج الإضافة مع تغيير البيانات */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-gray-700 mb-1 text-sm font-medium">اسم المنتج</label>
                <input
                  type="text"
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={editingProduct.name}
                  onChange={(e) => setEditingProduct({...editingProduct, name: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-gray-700 mb-1 text-sm font-medium">التصنيف</label>
                <select
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={editingProduct.category}
                  onChange={(e) => setEditingProduct({...editingProduct, category: e.target.value})}
                >
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>{category.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-gray-700 mb-1 text-sm font-medium">السعر</label>
                <div className="relative">
                  <input
                    type="number"
                    className="w-full p-2 pl-12 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={editingProduct.price}
                    onChange={(e) => setEditingProduct({...editingProduct, price: Number(e.target.value)})}
                  />
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500">جنيه</span>
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-gray-700 mb-1 text-sm font-medium">سعر العرض (اختياري)</label>
                <div className="relative">
                  <input
                    type="number"
                    className="w-full p-2 pl-12 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={editingProduct.discountPrice || ''}
                    onChange={(e) => setEditingProduct({...editingProduct, discountPrice: e.target.value ? Number(e.target.value) : undefined})}
                  />
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500">جنيه</span>
                  </div>
                </div>
              </div>
              <div className="md:col-span-2">
                <label className="block text-gray-700 mb-1 text-sm font-medium">الوصف</label>
                <textarea
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                  value={editingProduct.description}
                  onChange={(e) => setEditingProduct({...editingProduct, description: e.target.value})}
                ></textarea>
              </div>
              <div className="md:col-span-2">
                <label className="block text-gray-700 mb-1 text-sm font-medium">رابط الصورة</label>
                <input
                  type="text"
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={editingProduct.imageUrl}
                  onChange={(e) => setEditingProduct({...editingProduct, imageUrl: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-gray-700 mb-1 text-sm font-medium">التقييم</label>
                <div className="flex items-center">
                  <input
                    type="range"
                    min="0"
                    max="5"
                    step="0.1"
                    className="w-full mr-2"
                    value={editingProduct.rating}
                    onChange={(e) => setEditingProduct({...editingProduct, rating: Number(e.target.value)})}
                  />
                  <span className="text-lg font-semibold text-blue-600 min-w-[40px] text-center">{editingProduct.rating}</span>
                </div>
              </div>
              <div className="flex items-center">
                <label className="flex items-center cursor-pointer">
                  <div className={`w-11 h-6 flex items-center rounded-full p-1 ${editingProduct.inStock ? 'bg-green-500' : 'bg-gray-300'}`}>
                    <div className={`bg-white w-4 h-4 rounded-full shadow-md transform duration-300 ease-in-out ${editingProduct.inStock ? 'translate-x-5' : 'translate-x-0'}`}></div>
                  </div>
                  <input type="checkbox" className="hidden" checked={editingProduct.inStock} onChange={(e) => setEditingProduct({...editingProduct, inStock: e.target.checked})} />
                  <span className="mr-3 text-sm font-medium text-gray-700">متوفر في المخزون</span>
                </label>
              </div>
              <div className="md:col-span-2">
                <label className="block text-gray-700 mb-1 text-sm font-medium">مميزات المنتج</label>
                {editingProduct.features && editingProduct.features.map((feature, index) => (
                  <div key={index} className="flex mb-2">
                    <input
                      type="text"
                      className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={feature}
                      onChange={(e) => handleFeatureChange(index, e.target.value, 'edit')}
                    />
                    <button
                      className="mr-2 px-2 bg-red-500 text-white rounded-md hover:bg-red-600"
                      onClick={() => handleRemoveFeature(index, 'edit')}
                      aria-label="إزالة الميزة"
                    >
                      ×
                    </button>
                  </div>
                ))}
                <button
                  className="px-3 py-1 bg-blue-100 text-blue-600 rounded-md hover:bg-blue-200 transition-colors flex items-center text-sm mt-1"
                  onClick={() => handleAddFeature('edit')}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 ml-1">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m6-6H6" />
                  </svg>
                  إضافة ميزة
                </button>
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <button
                className="flex items-center px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors shadow-sm"
                onClick={() => setEditingProduct(null)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 ml-1">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
                إلغاء
              </button>
              <button
                className="flex items-center px-4 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700 transition-colors shadow-sm"
                onClick={handleUpdateProduct}
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 ml-1">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
                حفظ التغييرات
              </button>
            </div>
          </div>
        )}

        {/* قائمة المنتجات */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800">قائمة المنتجات</h2>
            <p className="text-sm text-gray-500">{filteredProducts.length} منتج</p>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">صورة</th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الاسم</th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">السعر</th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">التصنيف</th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الحالة</th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">إجراءات</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <img src={product.imageUrl} alt={product.name} className="w-12 h-12 object-cover rounded-md" />
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{product.name}</div>
                      <div className="text-xs text-gray-500 max-w-xs truncate">{product.description}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {product.discountPrice ? (
                        <div>
                          <span className="text-xs line-through text-gray-500">{product.price} جنيه</span>
                          <span className="block text-sm font-semibold text-red-600">{product.discountPrice} جنيه</span>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-900">{product.price} جنيه</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                        {categories.find(c => c.id === product.category)?.name || product.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {product.inStock ? (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">متوفر</span>
                      ) : (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">غير متوفر</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-1">
                        <button 
                          className="p-1 bg-amber-500 text-white rounded hover:bg-amber-600 transition-colors"
                          onClick={() => setEditingProduct(product)}
                          aria-label="تعديل"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
                          </svg>
                        </button>
                        <button 
                          className="p-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                          onClick={() => handleDeleteProduct(product.id)}
                          aria-label="حذف"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredProducts.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 mx-auto text-gray-300 mb-3">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.182 16.318A4.486 4.486 0 0012.016 15a4.486 4.486 0 00-3.198 1.318M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75zm-.375 0h.008v.015h-.008V9.75zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75zm-.375 0h.008v.015h-.008V9.75z" />
                </svg>
                <p>لا توجد منتجات مطابقة للبحث</p>
              </div>
            )}
          </div>
          
          {filteredProducts.length > 10 && (
            <div className="px-4 py-3 flex items-center justify-between border-t border-gray-200 bg-gray-50 sm:px-6">
              <div className="text-sm text-gray-700">
                عرض <span className="font-medium">1</span> إلى <span className="font-medium">{filteredProducts.length}</span> من أصل <span className="font-medium">{filteredProducts.length}</span> منتج
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductsManager;