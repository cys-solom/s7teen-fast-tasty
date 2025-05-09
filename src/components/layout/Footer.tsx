import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, Mail, Phone, MapPin, Facebook, Instagram } from 'lucide-react';
import { db } from '../../utils/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { whatsappNumber } from '../../data/products';

const Footer: React.FC = () => {
  const [categories, setCategories] = useState<{id: string, name: string}[]>([]);

  useEffect(() => {
    const fetchCategories = async () => {
      const categoriesCol = collection(db, 'categories');
      const categoriesSnapshot = await getDocs(categoriesCol);
      const categoriesList = categoriesSnapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));
      setCategories(categoriesList);
    };
    fetchCategories();
  }, []);

  return (
    <footer className="bg-neutral-900 text-white font-tajawal">
      <div className="container mx-auto px-3 py-5 md:px-4 md:py-10">
        {/* تحسين تنظيم الشبكة للموبايل */}
        <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-5 md:gap-8 text-center xs:text-right">
          {/* شعار المتجر - تحسين التباعدات للموبايل */}
          <div className="xs:col-span-2 md:col-span-1 lg:col-span-1">
            <Link to="/" className="text-xl font-extrabold text-white flex items-center gap-2 mb-3 md:mb-5 justify-center xs:justify-start">
              <span className="bg-neutral-800 rounded-full p-1.5"><ShoppingCart size={20} className="text-orange-400" /></span>
              <span className="tracking-wide">صحتين ماركت</span>
            </Link>
            <p className="text-neutral-300 mb-3 md:mb-5 text-xs xs:text-sm leading-relaxed">
              مطعم ومطبخ يقدم أشهى المأكولات الطازجة والمشويات مع خدمة توصيل سريعة.
            </p>
            <div className="flex items-center gap-3 justify-center xs:justify-start">
              <a href="https://www.instagram.com/al_iaa756?igsh=aDVvd3U3MzdlcW56" target="_blank" rel="noopener noreferrer" className="bg-neutral-800 rounded-full p-1.5 hover:bg-orange-400/20 transition-colors">
                <Instagram size={16} className="text-white" />
              </a>
              <a href="https://www.facebook.com/share/18ic6r1QGd/?mibextid=wwXIfr" target="_blank" rel="noopener noreferrer" className="bg-neutral-800 rounded-full p-1.5 hover:bg-orange-400/20 transition-colors">
                <Facebook size={16} className="text-white" />
              </a>
            </div>
          </div>
          
          {/* روابط سريعة */}
          <div>
            <h3 className="text-sm md:text-base font-bold mb-2 md:mb-4 text-white/90">روابط سريعة</h3>
            <ul className="space-y-1.5 md:space-y-3">
              <li><Link to="/" className="hover:text-orange-400 transition-colors font-medium text-xs md:text-sm">الرئيسية</Link></li>
              <li><Link to="/faq" className="hover:text-orange-400 transition-colors font-medium text-xs md:text-sm">أسئلة شائعة</Link></li>
            </ul>
          </div>
          
          {/* فئات المتجر */}
          <div>
            <h3 className="text-sm md:text-base font-bold mb-2 md:mb-4 text-white/90">فئات المتجر</h3>
            <ul className="space-y-1.5 md:space-y-3">
              {categories.slice(0, 5).map((category) => (
                <li key={category.id}>
                  <Link to={`/category/${category.id}`} className="hover:text-orange-400 transition-colors font-medium text-xs md:text-sm">{category.name}</Link>
                </li>
              ))}
            </ul>
          </div>
          
          {/* فروع الماركت - قسم منفصل للعناوين */}
          <div>
            <h3 className="text-sm md:text-base font-bold mb-2 md:mb-4 text-white/90">فروعنا</h3>
            <ul className="space-y-1.5 md:space-y-3">
              {/* العنوان الأول */}
              <li className="flex items-start gap-1.5 justify-center xs:justify-start">
                <span className="bg-neutral-800 rounded-full p-0.5 mt-0.5"><MapPin size={14} className="text-orange-400" /></span>
                <span className="text-neutral-300 text-xs md:text-sm">6 أكتوبر - المحور المركزي - مول سيتي ستارز</span>
              </li>
              
              {/* العنوان الثاني */}
              <li className="flex items-start gap-1.5 justify-center xs:justify-start">
                <span className="bg-neutral-800 rounded-full p-0.5 mt-0.5"><MapPin size={14} className="text-orange-400" /></span>
                <span className="text-neutral-300 text-xs md:text-sm">الشرقية - الزقازيق - شارع الجلاء</span>
              </li>
            </ul>
          </div>
          
          {/* اتصل بنا - فقط مع أزرار الاتصال */}
          <div>
            <h3 className="text-sm md:text-base font-bold mb-2 md:mb-4 text-white/90">تواصل معنا</h3>
            <ul className="space-y-2 md:space-y-3">
              {/* زر اتصل بنا */}
              <li className="justify-center xs:justify-start flex">
                <a 
                  href={`tel:+201030557250`} 
                  className="bg-orange-500/20 hover:bg-orange-400/30 transition-colors py-1 px-3 rounded-md flex items-center justify-center gap-1.5 mt-1 text-xs"
                >
                  <Phone size={14} className="text-orange-400" />
                  <span> اتصل بنا</span>
                </a>
              </li>
              
              {/* زر واتساب */}
              <li className="justify-center xs:justify-start flex">
                <a 
                  href={`https://wa.me/${whatsappNumber}`} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="bg-green-600 hover:bg-green-700 transition-colors py-1 px-3 rounded-md flex items-center justify-center gap-1.5 mt-1 text-xs"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M13.601 2.326A7.854 7.854 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.933 7.933 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.898 7.898 0 0 0 13.6 2.326zM7.994 14.521a6.573 6.573 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.557 6.557 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592zm3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.729.729 0 0 0-.529.247c-.182.198-.691.677-.691 1.654 0 .977.71 1.916.81 2.049.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232z"/>
                  </svg>
                  <span>تواصل عبر واتساب</span>
                </a>
              </li>
            </ul>
          </div>
        </div>
        
        {/* تصغير هامش وحجم النص في حقوق النشر */}
        <div className="border-t border-neutral-700 mt-5 md:mt-8 pt-4 md:pt-6 text-center text-neutral-400 text-[10px] md:text-xs">
          <p>© 2025 صحتين ماركت. جميع الحقوق محفوظة ل علياء شوقي.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;