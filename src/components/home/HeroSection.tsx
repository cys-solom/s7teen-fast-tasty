import React, { useState, useEffect } from 'react';
import LazyImage from '../ui/LazyImage';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../utils/firebase';
import { useNavigate } from 'react-router-dom';

interface ScrollFunctions {
  offers: () => void;
  categories: () => void;
  featured: () => void;
  delivery: () => void;
}

interface HeroSectionProps {
  onOrderNowClick: () => void;
  scrollFunctions: ScrollFunctions;
}

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
  scrollTarget?: 'offers' | 'categories' | 'featured' | 'delivery';
}

const defaultHeroBanner: HeroBannerData = {
  enabled: true,
  title: "أشهى المأكولات البيتي توصل لباب بيتك",
  description: "اطلب ألذ الأطباق الطازجة والخضراوات الفريش مع خدمة توصيل سريعة",
  imageUrl: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=900&q=80",
  buttonText: "اطلب الآن",
  backgroundColor: "#a15623",
  linkType: 'scroll',
  scrollTarget: 'offers'
};

const HeroSection: React.FC<HeroSectionProps> = ({ onOrderNowClick, scrollFunctions }) => {
  const [heroBanner, setHeroBanner] = useState<HeroBannerData>(defaultHeroBanner);
  const [loading, setLoading] = useState<boolean>(true);
  const navigate = useNavigate();

  // جلب إعدادات البانر من قاعدة البيانات
  useEffect(() => {
    const fetchHeroBanner = async () => {
      try {
        const heroBannerRef = doc(db, 'settings', 'heroBanner');
        const heroBannerSnapshot = await getDoc(heroBannerRef);
        
        if (heroBannerSnapshot.exists()) {
          const data = heroBannerSnapshot.data() as HeroBannerData;
          // استخدام البيانات فقط إذا كان البانر مفعل
          if (data.enabled) {
            setHeroBanner(data);
          }
        }
      } catch (error) {
        console.error("Error fetching hero banner data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchHeroBanner();
  }, []);

  // إذا كان البانر غير مفعل، استخدم البيانات الافتراضية
  if (!heroBanner.enabled) {
    return null;
  }

  // استخدم متغير loading للإشارة إلى حالة التحميل
  if (loading) {
    return (
      <div className="relative overflow-hidden mb-6 sm:mb-8 bg-[#f9f6f1] rounded-lg sm:rounded-xl shadow-md">
        <div className="animate-pulse flex flex-col items-center justify-center h-60 sm:h-80">
          <div className="w-3/4 h-6 bg-gray-200 rounded mb-4"></div>
          <div className="w-1/2 h-4 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  // التعامل مع النقر على الزر حسب نوع الرابط
  const handleButtonClick = () => {
    switch (heroBanner.linkType) {
      case 'internal':
        if (heroBanner.internalLink) {
          navigate(heroBanner.internalLink);
        }
        break;
      case 'external':
        if (heroBanner.externalLink) {
          window.open(heroBanner.externalLink, '_blank', 'noopener,noreferrer');
        }
        break;
      case 'scroll':
        // استخدام القسم المستهدف إذا تم تحديده، وإلا استخدم القسم الافتراضي (العروض)
        const target = heroBanner.scrollTarget || 'offers';
        if (scrollFunctions && scrollFunctions[target]) {
          scrollFunctions[target]();
        } else {
          // استخدام السلوك الافتراضي إذا لم يتم العثور على الدالة المناسبة
          onOrderNowClick();
        }
        break;
      default:
        onOrderNowClick();
        break;
    }
  };

  return (
    <div className="relative overflow-hidden mb-6 sm:mb-8 bg-[#f9f6f1] rounded-lg sm:rounded-xl shadow-md">
      <div className="flex flex-col md:flex-row-reverse items-stretch rounded-lg sm:rounded-xl overflow-hidden">
        {/* صورة البرجر - محسنة للعرض على جميع الشاشات */}
        <div className="w-full md:w-3/5 h-60 xs:h-72 sm:h-80 md:h-[450px] lg:h-[500px] relative overflow-hidden rounded-t-lg sm:rounded-t-xl md:rounded-none md:rounded-l-xl">
          <LazyImage
            src={heroBanner.imageUrl}
            alt="برغر شهي"
            className="w-full h-full object-cover object-center scale-[1.05] transform transition-transform duration-700 hover:scale-110"
            placeholderSrc="#eee"
          />
        </div>
        {/* النص - محسن للقراءة على جميع الشاشات */}
        <div className="w-full md:w-2/5 py-6 xs:py-8 md:py-0 flex flex-col items-center md:items-end justify-center text-center md:text-right px-4 xs:px-6 sm:px-8 md:px-8 lg:px-12 rounded-b-lg sm:rounded-b-xl md:rounded-none md:rounded-r-xl"
          style={{ backgroundColor: heroBanner.backgroundColor }}
        >
          <div className="md:max-w-md lg:max-w-lg mx-auto md:mx-0 md:mr-auto">
            <h1 className="text-2xl xs:text-3xl sm:text-4xl md:text-4xl lg:text-5xl font-bold text-white mb-3 sm:mb-4 leading-tight">
              {heroBanner.title}
            </h1>
            <p className="text-sm xs:text-base md:text-lg text-white/90 mb-5 sm:mb-6 leading-relaxed font-tajawal max-w-lg mx-auto md:mx-0 md:ml-auto">
              {heroBanner.description}
            </p>
            <button
              onClick={handleButtonClick}
              className="bg-orange-400 hover:bg-orange-500 text-white py-2.5 xs:py-3 px-7 xs:px-9 rounded-lg text-base xs:text-lg font-bold transition-all duration-300 shadow-md hover:shadow-lg mt-2 transform hover:scale-105 active:scale-95"
              aria-label={heroBanner.buttonText}
            >
              {heroBanner.buttonText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;