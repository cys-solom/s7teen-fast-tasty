import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Timer, Star } from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../utils/firebase';
import LazyImage from '../ui/LazyImage';

interface SpecialPromoBannerProps {
  onOrderNowClick: () => void;
  scrollFunctions?: {
    offers: () => void;
    categories: () => void;
    featured: () => void;
    delivery: () => void;
  };
}

interface PromoData {
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
  scrollTarget?: 'offers' | 'categories' | 'featured' | 'delivery';
}

const SpecialPromoBanner: React.FC<SpecialPromoBannerProps> = ({ onOrderNowClick, scrollFunctions }) => {
  const [promoData, setPromoData] = useState<PromoData | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPromoData = async () => {
      try {
        setLoading(true);
        const promoDocRef = doc(db, 'settings', 'specialPromo');
        const promoSnapshot = await getDoc(promoDocRef);
        
        if (promoSnapshot.exists()) {
          const data = promoSnapshot.data() as PromoData;
          
          // التحقق من تاريخ انتهاء الإعلان إذا كان موجودًا
          if (data.expireDate) {
            const expireDate = new Date(data.expireDate);
            const now = new Date();
            
            // إذا كان الإعلان منتهي الصلاحية، نعطله
            if (expireDate < now) {
              data.enabled = false;
            }
          }
          
          // نضيف البيانات فقط إذا كان الإعلان مفعّل
          if (data.enabled === true) {
            setPromoData(data);
          } else {
            setPromoData(null);
          }
        } else {
          // إذا لم يتم العثور على البيانات، نضع القيمة كـ null
          setPromoData(null);
        }
      } catch (error) {
        console.error("Error fetching promo data:", error);
        setPromoData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchPromoData();
  }, []);

  // لا تعرض أي شيء إذا كان الإعلان غير مفعل أو جاري التحميل أو لم يتم العثور على بيانات
  if (loading || !promoData || promoData.enabled !== true) {
    return null;
  }

  // التعامل مع النقر على الزر حسب نوع الرابط
  const handleButtonClick = () => {
    if (!promoData) return;
    
    switch (promoData.linkType) {
      case 'internal':
        if (promoData.internalLink) {
          navigate(promoData.internalLink);
        }
        break;
      case 'external':
        if (promoData.externalLink) {
          window.open(promoData.externalLink, '_blank', 'noopener,noreferrer');
        }
        break;
      case 'scroll':
        // استخدام القسم المستهدف إذا تم تحديده، وإلا استخدم السلوك الافتراضي (قسم العروض)
        const target = promoData.scrollTarget || 'offers';
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

  // إذا لم تكن هناك بيانات للإعلان، لا تعرض شيئًا
  if (!promoData) {
    return null;
  }

  // استخراج لون الخلفية من البروبس
  const bgColor = promoData.backgroundColor || "#a15623";

  // استخراج التدرج اللوني من اللون الأساسي
  const getGradient = (color: string) => {
    // إذا كان اللون هو هيكس، نحوله إلى RGB
    const hexToRgb = (hex: string) => {
      // تنظيف اللون من # إذا وجد
      const cleanHex = hex.replace('#', '');
      
      // إذا كان صيغة مختصرة مثل #FFF
      if (cleanHex.length === 3) {
        return {
          r: parseInt(cleanHex[0] + cleanHex[0], 16),
          g: parseInt(cleanHex[1] + cleanHex[1], 16),
          b: parseInt(cleanHex[2] + cleanHex[2], 16)
        };
      }
      
      // الصيغة العادية مثل #FFFFFF
      return {
        r: parseInt(cleanHex.substring(0, 2), 16),
        g: parseInt(cleanHex.substring(2, 4), 16),
        b: parseInt(cleanHex.substring(4, 6), 16)
      };
    };

    try {
      // تحويل اللون إلى RGB
      const rgb = hexToRgb(color);
      
      // أضف 20% لكل قناة للون الثاني في التدرج (مع التأكد من أنها لا تتجاوز 255)
      const lighterColor = `rgb(${Math.min(rgb.r + 50, 255)}, ${Math.min(rgb.g + 50, 255)}, ${Math.min(rgb.b + 50, 255)})`;
      
      // قلل 20% من كل قناة للون الثالث في التدرج
      const darkerColor = `rgb(${Math.max(rgb.r - 30, 0)}, ${Math.max(rgb.g - 30, 0)}, ${Math.max(rgb.b - 30, 0)})`;
      
      return `linear-gradient(135deg, ${darkerColor}, ${color}, ${lighterColor})`;
    } catch (e) {
      // إذا حدث خطأ، ارجع التدرج الافتراضي
      return `linear-gradient(135deg, #8a4a1f, ${color}, #c27a43)`;
    }
  };

  return (
    <div className="my-6 sm:my-8">
      <div className="flex flex-col sm:flex-row rounded-xl shadow-xl overflow-hidden" style={{ background: getGradient(bgColor) }}>
        {/* الجزء الأيسر - الصورة */}
        <div className="sm:w-2/5 md:w-1/2 relative">
          {/* زخرفة النجوم للإشارة إلى العرض المميز */}
          <div className="absolute top-3 right-3 z-10">
            <div className="bg-white text-amber-600 text-xs font-bold px-3 py-1.5 rounded-full shadow-md flex items-center gap-1.5 rotate-3 transform" style={{ color: bgColor }}>
              <Star size={14} fill="currentColor" strokeWidth={0} />
              <span>عرض خاص</span>
              <Star size={14} fill="currentColor" strokeWidth={0} />
            </div>
          </div>
          
          {/* مؤثر الظل فوق الصورة */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/70 z-10" />
          
          {/* الصورة الأساسية */}
          <LazyImage
            src={promoData.imageUrl}
            alt={promoData.title}
            className="w-full h-64 sm:h-full object-cover object-center brightness-[1.02]"
            placeholderSrc="#f8f8f8"
            priority={true}
          />

          {/* نص العرض على الصورة (للشاشات الصغيرة فقط) */}
          <div className="absolute bottom-0 right-0 w-full p-4 z-20 sm:hidden">
            <h2 className="text-white text-3xl font-bold text-shadow-lg mb-1">
              {promoData.title}
            </h2>
          </div>
        </div>

        {/* الجزء الأيمن - المحتوى */}
        <div className="sm:w-3/5 md:w-1/2 p-5 sm:p-6 md:p-8 flex flex-col justify-center relative">
          {/* زخرفة هندسية في الخلفية */}
          <div className="absolute -left-24 top-1/2 -translate-y-1/2 w-48 h-48 bg-white/10 rounded-full blur-2xl"></div>
          <div className="absolute -right-16 -bottom-16 w-56 h-56 bg-white/10 rounded-full blur-3xl"></div>
          
          {/* المحتوى */}
          <div className="relative z-10">
            {/* عنوان مخفي على الشاشات الصغيرة، ظاهر على الشاشات المتوسطة والكبيرة */}
            <h2 className="hidden sm:block text-white text-3xl sm:text-4xl font-bold mb-3 md:mb-4 text-shadow-sm">
              {promoData.title}
            </h2>
            
            {/* وصف العرض الرئيسي */}
            <div className="bg-white/90 backdrop-blur-sm px-5 py-3 sm:py-4 rounded-lg mb-5 transform rotate-[358deg] shadow-lg border-b-4" style={{ borderColor: bgColor }}>
              <p className="text-xl sm:text-2xl md:text-3xl font-extrabold leading-tight drop-shadow-sm" style={{ color: bgColor }}>
                {promoData.description}
              </p>
            </div>
            
            {/* وقت انتهاء العرض */}
            <div className="flex items-center gap-2 mb-6">
              <span className="bg-black/20 backdrop-blur-sm p-1 rounded-full">
                <Timer size={16} className="text-white" />
              </span>
              <p className="text-white text-sm md:text-base font-medium">{promoData.subtext}</p>
            </div>
            
            {/* زر الطلب */}
            <div className="flex justify-center sm:justify-start">
              <button
                onClick={handleButtonClick}
                className="bg-white hover:bg-gray-50 active:bg-gray-100 font-bold py-3 px-6 md:px-8 rounded-full flex items-center gap-2 transition-all duration-300 text-base shadow-lg hover:shadow-xl transform hover:-translate-y-1 active:translate-y-0"
                style={{ color: bgColor }}
                aria-label={promoData.buttonText}
              >
                <span>{promoData.buttonText}</span>
                <ArrowLeft size={18} className="animate-pulse" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SpecialPromoBanner;