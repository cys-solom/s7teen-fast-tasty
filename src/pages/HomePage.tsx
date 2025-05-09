import React, { useRef, useState, useEffect } from 'react';
import HeroSection from '../components/home/HeroSection';
import CategorySection from '../components/home/CategorySection';
import FeaturedProducts from '../components/products/FeaturedProducts';
import DeliverySection from '../components/home/DeliverySection';
// إزالة استيراد PromoBanner لأنه لن يستخدم بعد الآن
import SpecialPromoBanner from '../components/home/SpecialPromoBanner';

const HomePage: React.FC = () => {
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(true);

  // إنشاء مراجع لجميع الأقسام المستهدفة
  const offersSectionRef = useRef<HTMLDivElement>(null);
  const categoriesSectionRef = useRef<HTMLDivElement>(null);
  const featuredSectionRef = useRef<HTMLDivElement>(null);
  const deliverySectionRef = useRef<HTMLDivElement>(null);

  // تحميل البيانات والتأكد من حالة التطبيق
  useEffect(() => {
    try {
      // محاكاة تحميل البيانات
      setTimeout(() => {
        setLoading(false);
      }, 500);
    } catch (err) {
      console.error("Error loading HomePage:", err);
      setError(err instanceof Error ? err : new Error("خطأ غير معروف"));
      setLoading(false);
    }
  }, []);

  // دوال التمرير لكل قسم
  const scrollToOffers = () => {
    if (offersSectionRef.current) {
      const yOffset = -80;
      const y = offersSectionRef.current.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  const scrollToCategories = () => {
    if (categoriesSectionRef.current) {
      const yOffset = -80;
      const y = categoriesSectionRef.current.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  const scrollToFeatured = () => {
    if (featuredSectionRef.current) {
      const yOffset = -80;
      const y = featuredSectionRef.current.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  const scrollToDelivery = () => {
    if (deliverySectionRef.current) {
      const yOffset = -80;
      const y = deliverySectionRef.current.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  // حزمة الدوال لتمريرها إلى البانر الرئيسي
  const scrollFunctions = {
    offers: scrollToOffers,
    categories: scrollToCategories,
    featured: scrollToFeatured,
    delivery: scrollToDelivery
  };

  // عرض رسالة التحميل
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" role="status">
            <span className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]">جاري التحميل...</span>
          </div>
          <p className="mt-2 text-gray-600">جاري تحميل المتجر...</p>
        </div>
      </div>
    );
  }

  // عرض رسالة الخطأ
  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg م-4 text-right">
        <h3 className="text-red-600 font-bold mb-2">حدث خطأ أثناء تحميل الصفحة الرئيسية</h3>
        <p className="text-gray-700 mb-2">{error.message}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="px-4 py-2 bg-primary text-white rounded hover:bg-primary/90"
        >
          إعادة تحميل
        </button>
      </div>
    );
  }

  // العرض الطبيعي عند عدم وجود أخطاء
  return (
    <div>
      <HeroSection onOrderNowClick={scrollToOffers} scrollFunctions={scrollFunctions} />
      <div ref={categoriesSectionRef}>
        <CategorySection />
      </div>
      {/* الإعلان الخاص الذي يتم إضافته من لوحة التحكم فقط */}
      <div ref={offersSectionRef}>
        <SpecialPromoBanner onOrderNowClick={scrollToOffers} scrollFunctions={scrollFunctions} />
      </div>
      <div ref={featuredSectionRef}>
        <FeaturedProducts />
      </div>
      <div ref={deliverySectionRef}>
        <DeliverySection />
      </div>
    </div>
  );
};

export default HomePage;