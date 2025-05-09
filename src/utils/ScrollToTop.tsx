import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * مكون يقوم بإعادة تعيين موضع التمرير إلى أعلى الصفحة عند تغيير المسار
 */
export const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    // عند تغيير المسار، قم بالتمرير إلى أعلى الصفحة
    window.scrollTo({
      top: 0,
      behavior: 'instant' // استخدام 'instant' بدلاً من 'smooth' لتجنب التأخير
    });
  }, [pathname]);

  return null;
};

export default ScrollToTop;