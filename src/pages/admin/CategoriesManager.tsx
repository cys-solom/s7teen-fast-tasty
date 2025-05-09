import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Category } from '../../types/product';
import { categories as initialCategories } from '../../data/products';
import { db } from '../../utils/firebase';
import {
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  updateDoc,
  doc
} from 'firebase/firestore';

const CategoriesManager = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [newCategory, setNewCategory] = useState<Partial<Category>>({
    id: '',
    name: '',
    imageUrl: '',
  });
  
  // مراجع للنماذج لاستخدامها في التمرير
  const formRef = useRef<HTMLDivElement>(null);
  const newFormRef = useRef<HTMLDivElement>(null);

  // التحميل الأولي للتصنيفات
  useEffect(() => {
    const fetchCategories = async () => {
      const categoriesCol = collection(db, 'categories');
      const categoriesSnapshot = await getDocs(categoriesCol);
      const categoriesList = categoriesSnapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() })) as Category[];
      setCategories(categoriesList);
    };
    fetchCategories();
  }, []);

  // حفظ التصنيفات في التخزين المحلي عند تغييرها
  useEffect(() => {
    if (categories.length > 0) {
      localStorage.setItem('admin_categories', JSON.stringify(categories));
    }
  }, [categories]);
  
  // التمرير إلى نموذج التعديل عندما يتغير التصنيف المراد تعديله
  useEffect(() => {
    if (editingCategory && formRef.current) {
      // التمرير إلى النموذج مع تأخير صغير للتأكد من تحديث DOM
      setTimeout(() => {
        formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }, [editingCategory]);

  // التمرير إلى نموذج الإضافة عند فتحه
  useEffect(() => {
    if (showForm && newFormRef.current) {
      setTimeout(() => {
        newFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }, [showForm]);

  // إضافة تصنيف جديد
  const handleAddCategory = async () => {
    if (!newCategory.id || !newCategory.name || !newCategory.imageUrl) {
      alert('يرجى تعبئة جميع الحقول المطلوبة');
      return;
    }
    // التحقق من عدم تكرار المعرّف
    const categoriesCol = collection(db, 'categories');
    const categoriesSnapshot = await getDocs(categoriesCol);
    const exists = categoriesSnapshot.docs.some(docSnap => docSnap.id === newCategory.id);
    if (exists) {
      alert('معرّف التصنيف موجود بالفعل، يرجى اختيار معرّف آخر');
      return;
    }
    await addDoc(categoriesCol, {
      name: newCategory.name,
      imageUrl: newCategory.imageUrl
    });
    // إعادة تحميل التصنيفات
    const updatedSnapshot = await getDocs(categoriesCol);
    const categoriesList = updatedSnapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() })) as Category[];
    setCategories(categoriesList);
    setNewCategory({ id: '', name: '', imageUrl: '' });
    setShowForm(false);
  };

  // تعديل تصنيف
  const handleUpdateCategory = async () => {
    if (!editingCategory) return;
    const categoryRef = doc(db, 'categories', editingCategory.id);
    const { id, ...categoryData } = editingCategory;
    await updateDoc(categoryRef, categoryData);
    // إعادة تحميل التصنيفات
    const categoriesCol = collection(db, 'categories');
    const categoriesSnapshot = await getDocs(categoriesCol);
    const categoriesList = categoriesSnapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() })) as Category[];
    setCategories(categoriesList);
    setEditingCategory(null);
  };

  // حذف تصنيف
  const handleDeleteCategory = async (id: string) => {
    if (window.confirm('هل أنت متأكد من رغبتك في حذف هذا التصنيف؟')) {
      await deleteDoc(doc(db, 'categories', id));
      // إعادة تحميل التصنيفات
      const categoriesCol = collection(db, 'categories');
      const categoriesSnapshot = await getDocs(categoriesCol);
      const categoriesList = categoriesSnapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() })) as Category[];
      setCategories(categoriesList);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* شريط العنوان */}
      <div className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">إدارة التصنيفات</h1>
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
        <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-700 mb-4 md:mb-0">
            تنظيم تصنيفات المنتجات
            <span className="text-sm font-normal text-gray-500 mr-2">
              ({categories.length} تصنيف)
            </span>
          </h2>
          <div>
            <button 
              onClick={() => setShowForm(!showForm)} 
              className={`px-4 py-2 rounded-md flex items-center transition-colors ${showForm ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-green-600 hover:bg-green-700 text-white'}`}
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
                  إضافة تصنيف جديد
                </>
              )}
            </button>
          </div>
        </div>

        {/* نموذج إضافة تصنيف جديد */}
        {showForm && (
          <div ref={newFormRef} className="bg-white shadow-sm rounded-lg p-6 mb-6 border-r-4 border-green-500">
            <h3 className="text-lg font-semibold mb-4 flex items-center text-green-800">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 ml-2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              إضافة تصنيف جديد
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-gray-700 mb-1 text-sm font-medium">معرّف التصنيف (بالعربية أو الإنجليزية)</label>
                <input
                  type="text"
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  value={newCategory.id}
                  onChange={(e) => setNewCategory({...newCategory, id: e.target.value})}
                  placeholder="مثال: vegetables"
                />
                <p className="text-xs text-gray-500 mt-1">معرّف فريد يستخدم للربط بين المنتجات والتصنيفات</p>
              </div>
              
              <div>
                <label className="block text-gray-700 mb-1 text-sm font-medium">اسم التصنيف</label>
                <input
                  type="text"
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  value={newCategory.name}
                  onChange={(e) => setNewCategory({...newCategory, name: e.target.value})}
                  placeholder="مثال: الخضراوات"
                />
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-gray-700 mb-1 text-sm font-medium">رابط الصورة</label>
                <input
                  type="text"
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  value={newCategory.imageUrl}
                  onChange={(e) => setNewCategory({...newCategory, imageUrl: e.target.value})}
                  placeholder="أدخل رابط صورة التصنيف"
                />
              </div>
              
              {newCategory.imageUrl && (
                <div className="md:col-span-2">
                  <p className="text-xs text-gray-500 mb-1">معاينة الصورة:</p>
                  <div className="w-full h-40 bg-gray-100 rounded-md flex items-center justify-center overflow-hidden">
                    <img 
                      src={newCategory.imageUrl} 
                      alt="معاينة" 
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).onerror = null;
                        (e.target as HTMLImageElement).src = 'https://via.placeholder.com/200x150?text=صورة+غير+متاحة';
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex justify-end">
              <button
                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors shadow-sm"
                onClick={handleAddCategory}
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 ml-1">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                حفظ التصنيف
              </button>
            </div>
          </div>
        )}

        {/* نموذج تعديل تصنيف */}
        {editingCategory && (
          <div ref={formRef} className="bg-white shadow-sm rounded-lg p-6 mb-6 border-r-4 border-amber-500">
            <h3 className="text-lg font-semibold mb-4 flex items-center text-amber-800">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 ml-2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
              </svg>
              تعديل التصنيف: {editingCategory.name}
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-gray-700 mb-1 text-sm font-medium">معرّف التصنيف (بالعربية أو الإنجليزية)</label>
                <input
                  type="text"
                  className="w-full p-2 border border-gray-300 rounded-md bg-gray-100 text-gray-600"
                  value={editingCategory.id}
                  readOnly
                  disabled
                />
                <p className="text-xs text-gray-500 mt-1">لا يمكن تغيير المعرّف بعد الإنشاء</p>
              </div>
              
              <div>
                <label className="block text-gray-700 mb-1 text-sm font-medium">اسم التصنيف</label>
                <input
                  type="text"
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  value={editingCategory.name}
                  onChange={(e) => setEditingCategory({...editingCategory, name: e.target.value})}
                />
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-gray-700 mb-1 text-sm font-medium">رابط الصورة</label>
                <input
                  type="text"
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  value={editingCategory.imageUrl}
                  onChange={(e) => setEditingCategory({...editingCategory, imageUrl: e.target.value})}
                />
              </div>
              
              <div className="md:col-span-2">
                <p className="text-xs text-gray-500 mb-1">معاينة الصورة:</p>
                <div className="w-full h-40 bg-gray-100 rounded-md flex items-center justify-center overflow-hidden">
                  <img 
                    src={editingCategory.imageUrl} 
                    alt={editingCategory.name} 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).onerror = null;
                      (e.target as HTMLImageElement).src = 'https://via.placeholder.com/200x150?text=صورة+غير+متاحة';
                    }}
                  />
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-2">
              <button
                className="flex items-center px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors shadow-sm"
                onClick={() => setEditingCategory(null)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 ml-1">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
                إلغاء
              </button>
              <button
                className="flex items-center px-4 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700 transition-colors shadow-sm"
                onClick={handleUpdateCategory}
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 ml-1">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
                حفظ التغييرات
              </button>
            </div>
          </div>
        )}

        {/* عرض التصنيفات في بطاقات */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {categories.map((category) => (
            <div key={category.id} className="bg-white shadow-sm rounded-lg overflow-hidden hover:shadow-md transition-shadow">
              <div className="aspect-w-16 aspect-h-9 overflow-hidden">
                <img 
                  src={category.imageUrl} 
                  alt={category.name} 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).onerror = null;
                    (e.target as HTMLImageElement).src = 'https://via.placeholder.com/200x150?text=صورة+غير+متاحة';
                  }}
                />
              </div>
              <div className="p-4">
                <h3 className="text-lg font-semibold text-gray-800">{category.name}</h3>
                <p className="text-xs text-gray-500 mb-3 mt-1">معرّف: {category.id}</p>
                
                <div className="flex justify-end space-x-2">
                  <button 
                    className="p-1.5 bg-amber-100 text-amber-700 rounded hover:bg-amber-200 transition-colors flex items-center text-sm"
                    onClick={() => setEditingCategory(category)}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 ml-1">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                    </svg>
                    تعديل
                  </button>
                  <button 
                    className="p-1.5 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors flex items-center text-sm"
                    onClick={() => handleDeleteCategory(category.id)}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 ml-1">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                    </svg>
                    حذف
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {categories.length === 0 && (
          <div className="text-center py-12 bg-white rounded-lg shadow-sm">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-16 h-16 mx-auto text-gray-300 mb-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 7.125C2.25 6.504 2.754 6 3.375 6h6c.621 0 1.125.504 1.125 1.125v3.75c0 .621-.504 1.125-1.125 1.125h-6a1.125 1.125 0 01-1.125-1.125v-3.75zM14.25 8.625c0-.621.504-1.125 1.125-1.125h5.25c.621 0 1.125.504 1.125 1.125v8.25c0 .621-.504 1.125-1.125 1.125h-5.25a1.125 1.125 0 01-1.125-1.125v-8.25zM3.75 16.125c0-.621.504-1.125 1.125-1.125h5.25c.621 0 1.125.504 1.125 1.125v2.25c0 .621-.504 1.125-1.125 1.125h-5.25a1.125 1.125 0 01-1.125-1.125v-2.25z" />
            </svg>
            <p className="text-xl text-gray-500 mb-2">لا توجد تصنيفات حالياً</p>
            <p className="text-gray-400">قم بإضافة تصنيف جديد لبدء تنظيم منتجاتك</p>
            
            <button 
              onClick={() => setShowForm(true)} 
              className="mt-4 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center mx-auto"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 ml-1">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              إضافة تصنيف جديد
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CategoriesManager;