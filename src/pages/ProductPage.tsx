import React, { useState, useContext, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getProductsFromFirestore } from '../data/products';
import { CartContext } from '../context/CartContext';
import { Product } from '../types/product';
import { Minus, Plus, ShoppingCart, Heart, Star, ArrowRight, Check } from 'lucide-react';
import BackButton from '../components/ui/BackButton';
import LazyImage from '../components/ui/LazyImage';
import { usePrefetchResources } from '../utils/ImageOptimizer';
import ProductCard from '../components/products/ProductCard';

const ProductPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToCart } = useContext(CartContext);

  const [product, setProduct] = useState<Product | undefined>(undefined);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState('description');
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [showNotification, setShowNotification] = useState(false); // State for notification
  const [isButtonAnimating, setIsButtonAnimating] = useState(false);
  const [isAddedToCart, setIsAddedToCart] = useState(false);

  // جلب المنتج والمنتجات ذات الصلة
  useEffect(() => {
    const fetchProductData = async () => {
      try {
        setLoading(true);
        const productsData = await getProductsFromFirestore();
        
        // البحث عن المنتج بواسطة المعرف
        const foundProduct = productsData.find(p => p.id === Number(id) || p.id === id);
        setProduct(foundProduct);
        
        if (foundProduct) {
          // جلب المنتجات ذات الصلة (من نفس الفئة)
          const related = productsData
            .filter(p => p.category === foundProduct.category && p.id !== foundProduct.id)
            .slice(0, 4);
          setRelatedProducts(related);
        }
      } catch (error) {
        console.error("Error fetching product:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchProductData();
  }, [id]);

  // استباق تحميل الصور المرتبطة بالمنتجات ذات الصلة
  usePrefetchResources(
    relatedProducts.map(p => p.imageUrl)
  );

  // If product not found, redirect to home
  useEffect(() => {
    if (!loading && !product) {
      navigate('/');
    }
  }, [product, navigate, loading]);

  // Reset quantity when product changes
  useEffect(() => {
    setQuantity(1);
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-pulse text-gray-500">جاري تحميل المنتج...</div>
      </div>
    );
  }

  if (!product) return null;

  const handleAddToCart = () => {
    // تفعيل الأنيميشن عند الضغط على الزر
    setIsButtonAnimating(true);
    
    // إضافة المنتج للسلة
    for (let i = 0; i < quantity; i++) {
      addToCart(product);
    }
    
    // إظهار حالة النجاح داخل الزر
    setIsAddedToCart(true);
    
    // إيقاف الأنيميشن بعد انتهاءه
    setTimeout(() => {
      setIsButtonAnimating(false);
    }, 500);
    
    // إعادة الزر لحالته الأصلية بعد ثانيتين
    setTimeout(() => {
      setIsAddedToCart(false);
    }, 2000);
  };

  const toggleWishlist = () => {
    setIsWishlisted(!isWishlisted);
  };

  // Calculate the discount percentage correctly
  const calculateDiscountPercentage = () => {
    if (product.discountPrice && product.price) {
      // Ensure discount is always a positive number between 0 and 100
      if (product.discountPrice >= product.price) {
        return 0; // No discount or incorrect price data
      }
      const discount = ((product.price - product.discountPrice) / product.price) * 100;
      // Make sure we don't exceed 100%
      return Math.min(Math.round(discount), 99);
    }
    return 0;
  };

  // Get the discount percentage
  const discountPercentage = calculateDiscountPercentage();

  // تحويل معرف الفئة إلى اسم عربي
  const getCategoryName = (categoryId: string): string => {
    switch(categoryId) {
      case 'fresh-meat': return 'مصنعات الدواجن';
      case 'fast-food': return 'مصنعات اللحوم';
      case 'vegetables': return 'الخضراوات';
      default: return categoryId;
    }
  };

  return (
    <div className="pb-16">
      {/* زر الرجوع */}
      <div className="mb-4">
        <BackButton />
      </div>

      <div className="mb-8 flex items-center text-sm text-gray-500">
        <button onClick={() => navigate('/')} className="hover:text-primary">
          الرئيسية
        </button>
        <span className="mx-2">/</span>
        <button onClick={() => navigate(`/category/${product.category}`)} className="hover:text-primary">
          {getCategoryName(product.category)}
        </button>
        <span className="mx-2">/</span>
        <span className="text-gray-800">{product.name}</span>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        {/* Product Image */}
        <div className="bg-white rounded-lg overflow-hidden">
          <LazyImage 
            src={product.imageUrl} 
            alt={product.name} 
            className="w-full h-auto"
          />
        </div>
        
        {/* Product Details */}
        <div>
          <h1 className="text-2xl font-bold mb-2">{product.name}</h1>
          
          <div className="mb-6">
            {product.discountPrice ? (
              <>
                <span className="text-2xl font-bold text-primary">{Math.round(product.discountPrice)} جنيه</span>
                <div className="flex items-center mt-1">
                  <span className="text-lg text-gray-500 line-through">{product.price} جنيه</span>
                  {discountPercentage > 0 && (
                    <span className="mr-3 px-2 py-1 bg-error/10 text-error text-xs font-medium rounded" dir="rtl">
                      خصم {discountPercentage}%
                    </span>
                  )}
                </div>
              </>
            ) : (
              <span className="text-2xl font-bold text-primary">{product.price} جنيه</span>
            )}
          </div>
          
          <p className="text-gray-600 mb-6">
            {product.description}
          </p>
          
          {product.colors && product.colors.length > 0 && (
            <div className="mb-6">
              <h3 className="font-medium mb-2">اللون:</h3>
              <div className="flex gap-2">
                {product.colors.map((color, index) => (
                  <button
                    key={index}
                    className={`px-3 py-1 border rounded-md ${index === 0 ? 'border-primary bg-primary/10' : 'border-gray-300'}`}
                  >
                    {color}
                  </button>
                ))}
              </div>
            </div>
          )}
          
          {product.sizes && product.sizes.length > 0 && (
            <div className="mb-6">
              <h3 className="font-medium mb-2">المقاس:</h3>
              <div className="flex gap-2">
                {product.sizes.map((size, index) => (
                  <button
                    key={index}
                    className={`w-10 h-10 flex items-center justify-center border rounded-md ${index === 0 ? 'border-primary bg-primary/10' : 'border-gray-300'}`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          )}
          
          <div className="flex items-center gap-4 mb-8 relative">
            <div className="flex border border-gray-300 rounded-md">
              <button
                className="w-10 h-10 flex items-center justify-center text-gray-600 hover:bg-gray-100"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
              >
                -
              </button>
              <span className="w-12 h-10 flex items-center justify-center border-x border-gray-300">
                {quantity}
              </span>
              <button
                className="w-10 h-10 flex items-center justify-center text-gray-600 hover:bg-gray-100"
                onClick={() => setQuantity(quantity + 1)}
              >
                +
              </button>
            </div>
            
            <button
              className={`${isAddedToCart ? 'bg-green-500' : 'bg-secondary'} text-white py-2 px-3 rounded-lg text-sm flex items-center gap-2 ${isButtonAnimating ? 'animate-pulse-button' : ''} shadow-md hover:shadow-lg transition-all duration-300`}
              onClick={handleAddToCart}
              disabled={!product.inStock || isAddedToCart}
            >
              {isAddedToCart ? (
                <Check size={16} className="animate-slide-in" />
              ) : (
                <ShoppingCart size={16} className={`${isButtonAnimating ? 'animate-click' : ''}`} />
              )}
              <span>{product.inStock ? (isAddedToCart ? 'تمت الإضافة' : 'أضف إلى السلة') : 'غير متوفر'}</span>
            </button>
            
            <button
              className={`w-12 h-12 flex items-center justify-center border rounded-md transition-colors ${isWishlisted ? 'border-error bg-error/10' : 'border-gray-300 hover:bg-gray-100'}`}
              onClick={toggleWishlist}
            >
              <Heart size={20} fill={isWishlisted ? 'currentColor' : 'none'} className={isWishlisted ? 'text-error' : ''} />
            </button>
            
            {/* Success Notification */}
            {showNotification && (
              <div className="absolute top-[-45px] left-0 right-0 bg-green-500 text-white py-2 px-4 rounded-md shadow-md flex items-center justify-center gap-2 animate-fadeIn">
                <Check size={18} />
                <span>تم إضافة المنتج إلى السلة</span>
              </div>
            )}
          </div>
          
          {product.features && product.features.length > 0 && (
            <div className="border-t border-gray-200 pt-6">
              <h3 className="font-medium mb-2">المميزات:</h3>
              <ul className="list-disc list-inside space-y-1 text-gray-600">
                {product.features.map((feature, index) => (
                  <li key={index}>{feature}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
      
      {/* Tabs */}
      <div className="mb-12">
        <div className="border-b border-gray-200 mb-6">
          <nav className="flex gap-8">
            <button
              className={`py-3 relative ${activeTab === 'description' ? 'text-primary font-medium' : 'text-gray-500 hover:text-gray-700'}`}
              onClick={() => setActiveTab('description')}
            >
              الوصف
              {activeTab === 'description' && (
                <span className="absolute bottom-0 right-0 left-0 h-0.5 bg-primary"></span>
              )}
            </button>
            <button
              className={`py-3 relative ${activeTab === 'specifications' ? 'text-primary font-medium' : 'text-gray-500 hover:text-gray-700'}`}
              onClick={() => setActiveTab('specifications')}
            >
              المواصفات
              {activeTab === 'specifications' && (
                <span className="absolute bottom-0 right-0 left-0 h-0.5 bg-primary"></span>
              )}
            </button>
          </nav>
        </div>
        
        {activeTab === 'description' && (
          <div className="prose max-w-none">
            <p className="text-gray-600">
              {product.description}
            </p>
            <p className="text-gray-600 mt-4">
              نحن في زوكا ماركت نقدم فقط المنتجات عالية الجودة للعملاء. هذا المنتج مصنوع من أفضل المواد ويأتي مع ضمان لمدة عام.
            </p>
          </div>
        )}
        
        {activeTab === 'specifications' && (
          <div className="bg-white rounded-lg p-6">
            <h3 className="font-medium mb-4">مواصفات المنتج</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 p-3 rounded">
                <span className="text-gray-500">الفئة:</span>
                <span className="font-medium mr-2">
                  {getCategoryName(product.category)}
                </span>
              </div>
              
              <div className="bg-gray-50 p-3 rounded">
                <span className="text-gray-500">التوفر:</span>
                <span className={`font-medium mr-2 ${product.inStock ? 'text-success' : 'text-error'}`}>
                  {product.inStock ? 'متوفر في المخزون' : 'غير متوفر'}
                </span>
              </div>
              
              {product.features?.map((feature, index) => (
                <div key={index} className="bg-gray-50 p-3 rounded">
                  <span className="text-gray-500">ميزة {index + 1}:</span>
                  <span className="font-medium mr-2">{feature}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* تم إزالة تبويب التقييمات بالكامل */}
      </div>
      
      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <section className="my-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold">منتجات مشابهة</h2>
            <button
              className="text-primary flex items-center gap-1 hover:underline"
              onClick={() => navigate(`/category/${product.category}`)}
            >
              عرض الكل
              <ArrowRight size={16} />
            </button>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {relatedProducts.map((relatedProduct) => (
              <ProductCard key={relatedProduct.id} product={relatedProduct} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default ProductPage;