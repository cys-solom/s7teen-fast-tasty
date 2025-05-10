import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Timer, Star } from 'lucide-react';
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';
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

// إضافة قيم افتراضية للإعلان الخاص
const defaultPromoData: PromoData = {
  enabled: true,
  title: "عرض خاص لفترة محدودة!",
  description: "خصم 20% على جميع المنتجات",
  subtext: "العرض ساري حتى نهاية الأسبوع",
  backgroundColor: "#a15623",
  buttonText: "اطلب الآن",
  imageUrl: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&q=80&w=1887",
  linkType: 'scroll',
  scrollTarget: 'offers'
};

const SpecialPromoBanner: React.FC<SpecialPromoBannerProps> = ({ onOrderNowClick, scrollFunctions }) => {
  const [promoData, setPromoData] = useState<PromoData | null>(null);
  const [loading, setLoading] = useState(true);
  const [debugInfo, setDebugInfo] = useState<string>("");
  const navigate = useNavigate();

  // تحقق من البيانات في قاعدة البيانات وحالة الاتصال
  const checkDatabaseConnection = async () => {
    try {
      const testCollection = collection(db, 'settings');
      const snapshot = await getDocs(testCollection);
      setDebugInfo(prev => prev + `\nFirestore الاتصال ناجح! وجدت ${snapshot.size} وثائق`);
      return snapshot.size > 0;
    } catch (error) {
      console.error("خطأ في الاتصال بـ Firestore:", error);
      setDebugInfo(prev => prev + `\nFirestore خطأ في الاتصال: ${JSON.stringify(error)}`);
      return false;
    }
  };

  useEffect(() => {
    const fetchPromoData = async () => {
      try {
        setLoading(true);
        setDebugInfo("بدء تحميل بيانات الإعلان الخاص...");

        // التحقق من اتصال قاعدة البيانات
        const isConnected = await checkDatabaseConnection();
        if (!isConnected) {
          setDebugInfo(prev => prev + "\nتعذر الاتصال بقاعدة البيانات. استخدام البيانات الافتراضية.");
          setPromoData(defaultPromoData);
          return;
        }

        const promoDocRef = doc(db, 'settings', 'specialPromo');
        setDebugInfo(prev => prev + "\nجاري البحث عن وثيقة specialPromo...");
        
        const promoSnapshot = await getDoc(promoDocRef);
        
        if (promoSnapshot.exists()) {
          const data = promoSnapshot.data() as PromoData;
          setDebugInfo(prev => prev + `\nتم العثور على بيانات الإعلان: ${JSON.stringify(data)}`);
          
          // التحقق من تاريخ انتهاء الإعلان إذا كان موجودًا
          if (data.expireDate) {
            const expireDate = new Date(data.expireDate);
            const now = new Date();
            
            if (expireDate < now) {
              setDebugInfo(prev => prev + "\nالإعلان منتهي الصلاحية. تعطيل العرض.");
              data.enabled = false;
            }
          }
          
          if (data.enabled === undefined || data.enabled === null) {
            // إذا لم تكن هناك قيمة محددة لـ enabled، نفترض أنها true
            data.enabled = true;
            setDebugInfo(prev => prev + "\nلم يتم تحديد حالة التفعيل. وضع القيمة الافتراضية: مفعّل.");
          }
          
          // التحقق من وجود جميع البيانات المطلوبة
          if (!data.title || !data.description || !data.imageUrl) {
            setDebugInfo(prev => prev + "\nبعض البيانات الأساسية مفقودة. استخدام البيانات الافتراضية لإكمالها.");
            // دمج البيانات الموجودة مع البيانات الافتراضية للحقول المفقودة
            setPromoData({
              ...defaultPromoData,
              ...data,
              enabled: data.enabled // التأكد من الحفاظ على حالة التفعيل الأصلية
            });
          } else {
            // استخدام البيانات كما هي إذا كانت كاملة
            setPromoData(data);
          }
        } else {
          // إذا لم يتم العثور على البيانات، نستخدم البيانات الافتراضية
          setDebugInfo(prev => prev + "\nلم يتم العثور على وثيقة الإعلان الخاص. استخدام البيانات الافتراضية.");
          setPromoData(defaultPromoData);
        }
      } catch (error) {
        console.error("Error fetching promo data:", error);
        setDebugInfo(prev => prev + `\nخطأ أثناء جلب البيانات: ${error instanceof Error ? error.message : 'خطأ غير معروف'}`);
        // في حالة وجود خطأ نستخدم البيانات الافتراضية
        setPromoData(defaultPromoData);
      } finally {
        setLoading(false);
      }
    };

    fetchPromoData();

    // تنظيف عند إلغاء تحميل المكون
    return () => {
      console.log("SpecialPromoBanner unmounted");
    };
  }, []);

  // إعادة محاولة جلب البيانات في حالة الفشل
  const retryFetch = () => {
    setLoading(true);
    setDebugInfo("إعادة محاولة جلب البيانات...");
    
    // العودة إلى البيانات الافتراضية مؤقتًا
    setPromoData(defaultPromoData);
    
    // إضافة شفرة لإعادة محاولة الاتصال بعد تأخير قصير
    setTimeout(() => {
      const fetchPromoData = async () => {
        try {
          const promoDocRef = doc(db, 'settings', 'specialPromo');
          const promoSnapshot = await getDoc(promoDocRef);
          
          if (promoSnapshot.exists()) {
            setPromoData(promoSnapshot.data() as PromoData);
            setDebugInfo(prev => prev + "\nتم تحميل البيانات بنجاح بعد إعادة المحاولة.");
          }
        } catch (error) {
          console.error("Error in retry fetch:", error);
          setDebugInfo(prev => prev + "\nفشلت إعادة المحاولة.");
        } finally {
          setLoading(false);
        }
      };
      
      fetchPromoData();
    }, 2000);
  };

  // عرض مؤشر التحميل أثناء جلب البيانات
  if (loading) {
    return (
      <div className="my-6 sm:my-8 p-4 border-2 border-dashed border-amber-300 rounded-lg bg-amber-50">
        <div className="flex flex-col items-center justify-center p-6 text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-amber-600 border-r-transparent mb-4"></div>
          <p className="text-amber-700">جاري تحميل العرض الخاص...</p>
        </div>
      </div>
    );
  }
  
  // عرض معلومات التصحيح في وضع التطوير فقط
  const showDebug = process.env.NODE_ENV === 'development';
  
  // التحقق من البيانات: إما لا توجد بيانات أو الإعلان معطل صراحة
  if (!promoData) {
    return showDebug ? (
      <div className="my-6 sm:my-8 p-4 border-2 border-dashed border-red-300 rounded-lg bg-red-50">
        <h3 className="font-bold text-red-800">الإعلان الخاص غير متاح</h3>
        <p className="text-red-600">سبب المشكلة: لا توجد بيانات</p>
        <pre className="mt-3 p-2 bg-red-100 text-red-900 overflow-auto text-xs rounded">{debugInfo}</pre>
        <button 
          onClick={retryFetch}
          className="mt-3 px-3 py-1 bg-amber-600 text-white rounded hover:bg-amber-700"
        >
          إعادة المحاولة
        </button>
      </div>
    ) : null;
  }

  // البيانات موجودة، لكن الإعلان معطل
  if (promoData.enabled === false) {
    console.log("SpecialPromo is disabled explicitly");
    return showDebug ? (
      <div className="my-6 sm:my-8 p-4 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
        <h3 className="font-bold text-gray-700">الإعلان الخاص معطل</h3>
        <p className="text-gray-600">تم تعطيل الإعلان الخاص من لوحة التحكم</p>
        <pre className="mt-3 p-2 bg-gray-100 text-gray-700 overflow-auto text-xs rounded">{debugInfo}</pre>
      </div>
    ) : null;
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

  // تسجيل لتأكيد أن الإعلان سيظهر
  console.log("SpecialPromo will be displayed with title:", promoData.title);

  return (
    <>
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

      {/* عرض معلومات التصحيح في وضع التطوير فقط */}
      {showDebug && (
        <div className="mt-2 mb-8 p-3 border border-dashed border-amber-300 rounded-lg bg-amber-50 text-xs">
          <details>
            <summary className="font-medium text-amber-800 cursor-pointer">معلومات تصحيح الإعلان الخاص</summary>
            <pre className="mt-2 p-2 bg-white/50 text-amber-900 overflow-auto rounded">{debugInfo}</pre>
            <div className="mt-2">
              <strong>بيانات الإعلان:</strong>
              <pre className="mt-1 p-2 bg-white/50 text-amber-900 overflow-auto rounded">{JSON.stringify(promoData, null, 2)}</pre>
            </div>
          </details>
        </div>
      )}
    </>
  );
};

export default SpecialPromoBanner;