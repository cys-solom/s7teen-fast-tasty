import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { Search, Menu, X, Phone, ShoppingCart } from 'lucide-react';
import { whatsappNumber, getCategoriesFromFirestore } from '../../data/products';

interface HeaderProps {
  toggleCart: () => void;
}

interface Category {
  id: string;
  name: string;
  image?: string;
  order?: number;
}

const Header: React.FC<HeaderProps> = ({ toggleCart }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { totalItems } = useCart();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isScrolled, setIsScrolled] = useState(false);

  // جلب التصنيفات من Firestore عند تحميل المكون وترتيبها
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const categoriesData = await getCategoriesFromFirestore();
        // ترتيب الفئات حسب خاصية الترتيب إن وجدت أو حسب الاسم
        const sortedCategories = [...categoriesData].sort((a, b) => {
          // إذا كان لديهما ترتيب، قارن بينهما
          if (a.order !== undefined && b.order !== undefined) {
            return a.order - b.order;
          }
          // إذا كان لـ a ترتيب فقط، ضعه في البداية
          if (a.order !== undefined) {
            return -1;
          }
          // إذا كان لـ b ترتيب فقط، ضعه في البداية
          if (b.order !== undefined) {
            return 1;
          }
          // إذا لم يكن لديهما ترتيب، قارن حسب الاسم
          return a.name.localeCompare(b.name, 'ar');
        });
        
        setCategories(sortedCategories);
      } catch (error) {
        console.error('Error fetching categories:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchCategories();
  }, []);

  // تغيير مظهر الهيدر عند التمرير
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
    if (!isMenuOpen) {
      setIsSearchVisible(false);
    }
  };

  const toggleSearch = () => {
    setIsSearchVisible(!isSearchVisible);
    if (!isSearchVisible) {
      setIsMenuOpen(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
      setIsSearchVisible(false);
      setIsMenuOpen(false);
    }
  };

  const handleCallUs = () => {
    window.location.href = `tel:+${whatsappNumber.replace(/\+/g, '')}`;
  };

  const handleWhatsApp = () => {
    window.open(`https://wa.me/${whatsappNumber}`, '_blank');
  };

  // معرفة إذا كانت الفئة نشطة حاليًا
  const isActiveCategory = (categoryId: string) => {
    return location.pathname === `/category/${categoryId}`;
  };

  return (
    <header className={`bg-white sticky top-0 z-50 transition-all duration-300 ${isScrolled ? 'shadow-md' : 'shadow-sm'}`}>
      <div className="container mx-auto px-3 xs:px-4">
        <div className="flex items-center justify-between h-16 md:h-18">
          {/* الشعار */}
          <Link to="/" className="flex items-center py-1.5">
            <div className="flex flex-col items-center">
              <span className="text-xl xs:text-2xl font-bold text-primary font-cairo leading-tight">صحتين</span>
              <span className="text-[10px] xs:text-xs font-semibold text-gray-500 -mt-0.5">Fast & Tasty</span>
            </div>
          </Link>

          {/* حقل البحث - مخفي على الموبايل، مرئي على الكمبيوتر */}
          <div className="hidden md:block flex-1 mx-4 lg:mx-8 max-w-md lg:max-w-xl">
            <form onSubmit={handleSearch} className="relative">
              <input
                type="text"
                placeholder="ابحث عن الأطباق..."
                className="w-full py-2 px-4 pr-10 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm transition-all duration-200"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button
                type="submit"
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-primary transition-colors"
                aria-label="بحث"
              >
                <Search size={18} />
              </button>
            </form>
          </div>

          {/* أزرار - ظاهرة فقط على الشاشات الكبيرة */}
          <div className="hidden md:flex items-center gap-4 lg:gap-5">
            {/* زر الاتصال المباشر */}
            <button
              onClick={handleCallUs}
              className="text-gray-700 hover:text-primary flex items-center gap-1.5 text-sm transition-colors px-3 py-1.5 hover:bg-gray-100 rounded-full"
            >
              <Phone size={16} className="text-orange-500" />
              <span>اتصل بنا</span>
            </button>

            {/* زر واتساب */}
            <button
              onClick={handleWhatsApp}
              className="text-gray-700 hover:text-green-600 flex items-center gap-1.5 text-sm transition-colors px-3 py-1.5 hover:bg-gray-100 rounded-full"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16" className="text-[#25D366]">
                <path d="M13.601 2.326A7.854 7.854 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.933 7.933 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.898 7.898 0 0 0 13.6 2.326zM7.994 14.521a6.573 6.573 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.557 6.557 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592zm3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.729.729 0 0 0-.529.247c-.182.198-.691.677-.691 1.654 0 .977.71 1.916.81 2.049.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232z"/>
              </svg>
              <span>واتساب</span>
            </button>

            <button
              className="bg-secondary text-white py-2 px-4 rounded-full text-sm font-medium flex items-center gap-2 relative hover:bg-opacity-90 transition-all"
              onClick={toggleCart}
            >
              <ShoppingCart size={18} />
              <span>السلة</span>
              {totalItems > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {totalItems}
                </span>
              )}
            </button>
          </div>

          {/* أزرار الموبايل - إعادة ترتيب الأيقونات */}
          <div className="md:hidden flex items-center gap-2">
            {/* أيقونة السلة */}
            <button
              className="relative rounded-full p-2 text-white bg-secondary hover:bg-opacity-90 active:bg-opacity-100 transition-colors"
              onClick={toggleCart}
              aria-label="السلة"
            >
              <ShoppingCart size={18} />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-4 h-4 flex items-center justify-center">
                  {totalItems}
                </span>
              )}
            </button>

            {/* أيقونة الاتصال */}
            <button
              onClick={handleCallUs}
              className="rounded-full p-2 bg-orange-50 border border-orange-200 active:bg-orange-100 transition-colors"
              aria-label="اتصل بنا"
            >
              <Phone size={18} className="text-orange-500" />
            </button>
            
            {/* أيقونة واتساب */}
            <button
              onClick={handleWhatsApp}
              className="rounded-full p-2 bg-[#e8f6e8] border border-[#c9e9c9] active:bg-[#d8f0d8] transition-colors"
              aria-label="واتساب"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16" className="text-[#25D366]">
                <path d="M13.601 2.326A7.854 7.854 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.933 7.933 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.898 7.898 0 0 0 13.6 2.326zM7.994 14.521a6.573 6.573 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.557 6.557 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592zm3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.729.729 0 0 0-.529.247c-.182.198-.691.677-.691 1.654 0 .977.71 1.916.81 2.049.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232z"/>
              </svg>
            </button>
            
            {/* أيقونة البحث */}
            <button
              className={`rounded-full p-2 bg-gray-50 border border-gray-200 active:bg-gray-100 transition-colors ${isSearchVisible ? 'bg-gray-100 text-primary' : 'text-gray-600'}`}
              onClick={toggleSearch}
              aria-label="بحث"
            >
              <Search size={18} />
            </button>
            
            {/* أيقونة القائمة */}
            <button
              className={`rounded-full p-2 bg-gray-50 border border-gray-200 active:bg-gray-100 transition-colors ${isMenuOpen ? 'bg-gray-100 text-primary' : 'text-gray-600'}`}
              onClick={toggleMenu}
              aria-label="القائمة"
            >
              {isMenuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>

        {/* قائمة الفئات - تظهر كأزرار واضحة */}
        <nav className="hidden md:block border-t border-gray-200 pt-2 pb-2">
          <div className="flex items-center justify-center px-2">
            <div className="flex items-center gap-2 flex-wrap justify-center">
              {isLoading ? (
                <div className="text-gray-400 text-sm py-2">جاري تحميل التصنيفات...</div>
              ) : categories.length > 0 ? (
                categories.map((category) => (
                  <Link 
                    key={category.id}
                    to={`/category/${category.id}`}
                    className={`
                      py-1.5 px-4 rounded-full text-sm whitespace-nowrap transition-all
                      ${isActiveCategory(category.id) ? 
                        'bg-primary text-white font-medium shadow-sm' : 
                        'bg-gray-100 text-gray-700 hover:bg-gray-200 font-normal'
                      }
                    `}
                  >
                    {category.name}
                  </Link>
                ))
              ) : (
                <div className="text-gray-500 text-sm py-2">لا توجد تصنيفات متاحة</div>
              )}
            </div>
          </div>
        </nav>
      </div>

      {/* Mobile Search Bar - محسن */}
      {isSearchVisible && !isMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 py-2.5 shadow-md animate-fadeIn">
          <div className="container px-3 mx-auto">
            <form onSubmit={handleSearch} className="relative">
              <input
                type="text"
                placeholder="ابحث عن الأطباق..."
                className="w-full py-2.5 px-3 pr-9 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm transition-all duration-200"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
              />
              <button
                type="submit"
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-primary transition-colors"
                aria-label="بحث"
              >
                <Search size={16} />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* القائمة المنسدلة على الشاشات الصغيرة - محسنة لعرض الفئات كأزرار */}
      {isMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 py-4 shadow-md animate-fadeIn">
          <div className="container px-3 mx-auto">
            {/* حقل البحث داخل القائمة */}
            <form onSubmit={handleSearch} className="relative mb-4">
              <input
                type="text"
                placeholder="ابحث عن الأطباق..."
                className="w-full py-2.5 px-3 pr-9 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button
                type="submit"
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-primary transition-colors"
                aria-label="بحث"
              >
                <Search size={16} />
              </button>
            </form>

            <div className="mb-4">
              <h3 className="font-bold text-gray-800 text-base mb-3">الأقسام</h3>
              
              {isLoading ? (
                <div className="text-center py-3 text-gray-400 text-sm">جاري تحميل التصنيفات...</div>
              ) : categories.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {categories.map((category) => (
                    <Link 
                      key={category.id}
                      to={`/category/${category.id}`}
                      className={`
                        py-1.5 px-3 rounded-full text-sm whitespace-nowrap transition-all
                        ${isActiveCategory(category.id) ? 
                          'bg-primary text-white font-medium' : 
                          'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }
                      `}
                      onClick={() => setIsMenuOpen(false)}
                    >
                      {category.name}
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-3 text-gray-500 text-sm">لا توجد تصنيفات متاحة</div>
              )}
            </div>

            {/* أزرار الاتصال */}
            <div className="grid grid-cols-2 gap-3">
              {/* زر اتصل بنا */}
              <button
                onClick={() => {
                  handleCallUs();
                  setIsMenuOpen(false);
                }}
                className="bg-orange-500 text-white py-2.5 px-4 rounded-lg text-sm font-medium w-full hover:bg-opacity-90 transition-all flex items-center justify-center gap-2 shadow-sm"
              >
                <Phone size={16} />
                <span>اتصل بنا</span>
              </button>

              {/* زر واتساب */}
              <button
                onClick={() => {
                  handleWhatsApp();
                  setIsMenuOpen(false);
                }}
                className="bg-[#25D366] text-white py-2.5 px-4 rounded-lg text-sm font-medium w-full hover:bg-opacity-90 transition-all flex items-center justify-center gap-2 shadow-sm"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16" className="text-white">
                  <path d="M13.601 2.326A7.854 7.854 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.933 7.933 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.898 7.898 0 0 0 13.6 2.326zM7.994 14.521a6.573 6.573 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.557 6.557 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592zm3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.729.729 0 0 0-.529.247c-.182.198-.691.677-.691 1.654 0 .977.71 1.916.81 2.049.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232z"/>
                </svg>
                <span>واتساب</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;