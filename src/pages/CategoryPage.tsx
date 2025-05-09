import * as React from 'react';
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getCategoriesFromFirestore, getProductsFromFirestore } from '../data/products';
import ProductCard from '../components/products/ProductCard';
import { ArrowRight, SlidersHorizontal } from 'lucide-react';
import { Product, Category } from '../types/product';
import BackButton from '../components/ui/BackButton';

const CategoryPage: React.FC = () => {
  const { category } = useParams<{ category: string }>();
  const navigate = useNavigate();
  
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 5000]);
  const [filterDiscounted, setFilterDiscounted] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<string>('featured');
  const [isFilterOpen, setIsFilterOpen] = useState<boolean>(false);
  
  // تحميل الفئات والمنتجات عند تحميل الصفحة
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // جلب الفئات من Firestore
        const categoriesData = await getCategoriesFromFirestore();
        setCategories(categoriesData);
        
        // جلب جميع المنتجات من Firestore
        const productsData = await getProductsFromFirestore();
        
        // تصفية المنتجات حسب الفئة المحددة
        if (category) {
          const filteredProducts = productsData.filter(product => product.category === category);
          setProducts(filteredProducts);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [category]);
  
  // متغير محلي لحفظ اسم الفئة
  const categoryName = getCategoryName(category || '');
  
  // استرجاع الاسم العربي للفئة من قائمة الفئات الفعلية
  function getCategoryName(catId: string): string {
    const foundCategory = categories.find(cat => cat.id === catId);
    return foundCategory ? foundCategory.name : 'منتجات متنوعة';
  }
  
  // العودة للصفحة الرئيسية
  const goToHomePage = () => {
    navigate('/');
  };
  
  // تصفية المنتجات حسب المعايير المختارة
  const filterProducts = () => {
    let filtered = [...products];
    
    // تصفية حسب نطاق السعر
    filtered = filtered.filter(product => {
      const price = product.discountPrice || product.price;
      return price >= priceRange[0] && price <= priceRange[1];
    });
    
    // تصفية المنتجات المخفضة فقط
    if (filterDiscounted) {
      filtered = filtered.filter(product => product.discountPrice && product.discountPrice < product.price);
    }
    
    // ترتيب المنتجات
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'price-asc':
          return (a.discountPrice || a.price) - (b.discountPrice || b.price);
        case 'price-desc':
          return (b.discountPrice || b.price) - (a.discountPrice || a.price);
        case 'rating':
          return b.rating - a.rating;
        default:
          return 0; // الافتراضي هو "الأكثر شيوعاً"
      }
    });
    
    return filtered;
  };
  
  // إعادة ضبط عوامل التصفية
  const resetFilters = () => {
    setPriceRange([0, 5000]);
    setFilterDiscounted(false);
    setSortBy('featured');
  };
  
  // الحصول على المنتجات المعروضة بعد تطبيق التصفية والترتيب
  const displayedProducts = filterProducts();

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-pulse text-gray-500">جاري تحميل المنتجات...</div>
      </div>
    );
  }

  return (
    <div>
      {/* زر الرجوع */}
      <div className="mb-4">
        <BackButton />
      </div>

      <div className="mb-8 flex items-center text-sm text-gray-500">
        <button onClick={goToHomePage} className="text-primary hover:underline">
          الرئيسية
        </button>
        <span className="mx-2">/</span>
        <span className="text-gray-800 font-medium">{categoryName}</span>
      </div>

      <div className="mb-6">
        {/* عنوان الفئة */}
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-800 relative after:content-[''] after:block after:h-1 after:w-12 after:bg-primary after:mt-1">{categoryName}</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Filters - Desktop */}
        <div className="hidden md:block bg-white rounded-lg shadow-sm p-6">
          <h3 className="font-semibold mb-4">التصفية حسب</h3>

          {/* Price Range */}
          <div className="mb-6">
            <h4 className="text-sm font-medium mb-2">نطاق السعر</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">{priceRange[0]} جنيه</span>
                <span className="text-sm text-gray-500">{priceRange[1]} جنيه</span>
              </div>
              <input
                type="range"
                min="0"
                max="5000"
                step="100"
                value={priceRange[1]}
                onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
                className="w-full"
              />
            </div>
          </div>

          {/* Discount Filter */}
          <div className="mb-6">
            <h4 className="text-sm font-medium mb-2">العروض</h4>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  className="ml-2"
                  checked={filterDiscounted}
                  onChange={(e) => setFilterDiscounted(e.target.checked)}
                />
                <span className="text-sm">عرض المنتجات المخفضة فقط</span>
              </label>
            </div>
          </div>

          {/* Availability */}
          <div className="mb-6">
            <h4 className="text-sm font-medium mb-2">التوفر</h4>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  className="ml-2"
                  defaultChecked
                />
                <span className="text-sm">متوفر في المخزون</span>
              </label>
            </div>
          </div>

          {/* Reset Filters */}
          <button
            onClick={resetFilters}
            className="text-primary text-sm hover:underline"
          >
            إعادة ضبط التصفية
          </button>
        </div>

        <div className="md:col-span-3">
          {/* Sort and Filter Controls */}
          <div className="flex items-center justify-between mb-6 bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center">
              <span className="text-sm text-gray-500 ml-2">ترتيب حسب:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="border-none bg-transparent focus:outline-none text-sm"
              >
                <option value="featured">الأكثر شيوعاً</option>
                <option value="price-asc">السعر: من الأقل للأعلى</option>
                <option value="price-desc">السعر: من الأعلى للأقل</option>
                <option value="rating">التقييم</option>
              </select>
            </div>

            {/* Mobile Filter Button */}
            <button
              className="md:hidden flex items-center gap-1 text-sm"
              onClick={() => setIsFilterOpen(!isFilterOpen)}
            >
              <SlidersHorizontal size={16} />
              <span>تصفية</span>
            </button>
          </div>

          {/* Mobile Filters */}
          {isFilterOpen && (
            <div className="md:hidden bg-white rounded-lg shadow-sm p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">التصفية حسب</h3>
                <button
                  className="text-gray-500"
                  onClick={() => setIsFilterOpen(false)}
                >
                  إغلاق
                </button>
              </div>

              {/* Price Range */}
              <div className="mb-6">
                <h4 className="text-sm font-medium mb-2">نطاق السعر</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">{priceRange[0]} جنيه</span>
                    <span className="text-sm text-gray-500">{priceRange[1]} جنيه</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="5000"
                    step="100"
                    value={priceRange[1]}
                    onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
                    className="w-full"
                  />
                </div>
              </div>

              {/* Discount Filter */}
              <div className="mb-6">
                <h4 className="text-sm font-medium mb-2">العروض</h4>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      className="ml-2"
                      checked={filterDiscounted}
                      onChange={(e) => setFilterDiscounted(e.target.checked)}
                    />
                    <span className="text-sm">عرض المنتجات المخفضة فقط</span>
                  </label>
                </div>
              </div>

              {/* Availability */}
              <div className="mb-6">
                <h4 className="text-sm font-medium mb-2">التوفر</h4>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      className="ml-2"
                      defaultChecked
                    />
                    <span className="text-sm">متوفر في المخزون</span>
                  </label>
                </div>
              </div>

              {/* Apply Filters */}
              <div className="flex gap-2">
                <button
                  className="btn btn-primary flex-1"
                  onClick={() => setIsFilterOpen(false)} // Close modal on apply
                >
                  تطبيق
                </button>
                <button
                  onClick={() => {
                    resetFilters();
                    setIsFilterOpen(false); // Close modal on reset
                  }}
                  className="text-primary text-sm flex items-center"
                >
                  إعادة ضبط
                </button>
              </div>
            </div>
          )}

          {/* Products Grid */}
          {displayedProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {displayedProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm p-8 text-center">
              <p className="text-gray-500 mb-4">لا توجد منتجات متاحة حالياً في هذه الفئة.</p>
              <button
                className="btn btn-primary flex items-center gap-2 mx-auto"
                onClick={() => navigate('/')}
              >
                <ArrowRight size={16} />
                <span>العودة للتسوق</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CategoryPage;