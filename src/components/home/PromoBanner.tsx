import * as React from 'react';
import { ArrowLeft } from 'lucide-react';
import LazyImage from '../ui/LazyImage';

interface PromoBannerProps {
  onOrderNowClick: () => void;
}

const PromoBanner: React.FC<PromoBannerProps> = ({ onOrderNowClick }: PromoBannerProps) => {
  return (
    <div className="relative overflow-hidden rounded-lg sm:rounded-xl my-6 sm:my-12">
      {/* التخطيط الأساسي - عمودي على الموبايل، أفقي على الشاشات الأكبر */}
      <div className="relative flex flex-col md:flex-row">
        {/* قسم الخلفية الملونة - يأخذ عرض كامل على الموبايل، ونصف العرض على الشاشات الكبيرة */}
        <div className="w-full md:w-1/2 bg-amber-700 py-10 md:py-0"> 
          {/* لا محتوى هنا - مجرد خلفية */}
        </div>
        
        {/* قسم الصورة - يأخذ عرض كامل على الموبايل، ونصف العرض على الشاشات الكبيرة */}
        <div className="w-full md:w-1/2 h-60 xs:h-72 md:h-[300px] lg:h-[350px] relative"> 
          <LazyImage
            src="https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&q=80&w=1887"
            alt="طعام مشوي"
            className="w-full h-full object-cover"
            quality="high"
            priority={true}
          />
        </div>

        {/* طبقة النص المطلقة الموضع - تغطي الشاشة بالكامل */}
        <div className="absolute inset-0 flex items-center">
          <div className="container mx-auto px-4">
            {/* محتوى النص - يتمركز في الوسط على الموبايل، ويتموضع على اليمين (الخلفية الملونة) في الشاشات الكبيرة */}
            <div className="w-full md:w-1/2 flex flex-col items-center md:items-center justify-center text-center z-10 px-6 py-5 md:p-6 bg-black/30 md:bg-black/10 backdrop-blur-sm rounded-lg md:backdrop-blur-none">
              <h2 className="text-2xl xs:text-3xl md:text-4xl font-bold text-white mb-3 sm:mb-4">عروض اليوم!</h2>
              
              <div className="bg-black/30 backdrop-blur-sm p-3 xs:p-4 rounded-lg mb-4 xs:mb-6 inline-block w-full xs:w-auto">
                <p className="text-lg xs:text-xl text-white font-semibold">خصم 20% على جميع المنتجات</p>
                <p className="text-white opacity-90 text-sm xs:text-base">العرض ساري حتى نهاية الأسبوع</p>
              </div>
              
              <button
                onClick={onOrderNowClick}
                className="bg-white hover:bg-gray-100 text-amber-700 py-2 xs:py-3 px-4 xs:px-6 rounded-lg flex items-center gap-2 transition-all duration-300 text-sm xs:text-lg font-medium shadow-md"
              >
                <span>اطلب الآن</span>
                <ArrowLeft size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PromoBanner;