import * as React from 'react';
import { useState, useRef, useEffect } from 'react';

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  placeholderSrc?: string;
  width?: number | string;
  height?: number | string;
  onLoad?: () => void;
  quality?: 'high' | 'medium' | 'low';
  priority?: boolean;
}

const LazyImage: React.FC<LazyImageProps> = ({ 
  src, 
  alt, 
  className = '', 
  placeholderSrc, 
  width,
  height,
  onLoad,
  quality = 'high',
  priority = false
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [imageSrc, setImageSrc] = useState(placeholderSrc || '');
  const imageRef = useRef<HTMLImageElement>(null);
  
  // تحديد إذا كانت الصورة ذات أولوية عالية
  useEffect(() => {
    if (priority) {
      // إذا كانت الصورة ذات أولوية، تحميلها فوراً
      setImageSrc(src);
    }
  }, [priority, src]);

  // تحميل الصورة عند وصولها إلى نطاق العرض
  useEffect(() => {
    // تجاهل للصور ذات الأولوية التي تم تحميلها بالفعل
    if (priority) return;
    
    // تحقق ما إذا كان المتصفح يدعم Intersection Observer API
    if (!('IntersectionObserver' in window)) {
      // إذا كان المتصفح لا يدعم الـ API، قم بتحميل الصورة مباشرة
      setImageSrc(src);
      return;
    }
    
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        // عندما تكون الصورة ضمن نطاق العرض
        if (entry.isIntersecting) {
          // قم بتحميل الصورة الحقيقية
          setImageSrc(src);
          // إلغاء المراقبة بعد التحميل
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.1,
      rootMargin: '200px'
    });
    
    if (imageRef.current) {
      observer.observe(imageRef.current);
    }
    
    return () => {
      if (imageRef.current) {
        observer.unobserve(imageRef.current);
      }
    };
  }, [src, priority]);
  
  const handleLoad = () => {
    setIsLoaded(true);
    if (onLoad) {
      onLoad();
    }
  };

  // تحديد جودة الصورة بناءً على الإعداد المطلوب
  const imageQuality = () => {
    // يمكن تطبيق فلاتر أو تحسينات للصورة بناءً على إعداد الجودة
    switch (quality) {
      case 'high':
        return 'filter-none'; // عدم تطبيق أي فلتر للحفاظ على الجودة العالية
      case 'medium':
        return 'filter brightness-105 contrast-[0.95]';
      case 'low':
        return 'filter brightness-110 contrast-[0.9] saturate-[0.9]';
      default:
        return 'filter-none';
    }
  };
  
  return (
    <div className={`relative ${className}`}>
      <img 
        ref={imageRef}
        src={imageSrc || src} 
        alt={alt} 
        className={`transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0'} ${imageQuality()}`}
        style={{ width: width || '100%', height: height || 'auto', objectFit: 'cover' }}
        onLoad={handleLoad} 
        loading={priority ? 'eager' : 'lazy'} 
        decoding="async"
      />
      
      {!isLoaded && (
        <div 
          className="absolute inset-0 bg-gray-200 animate-pulse"
          style={{ width: width || '100%', height: height || 'auto' }}
        />
      )}
    </div>
  );
};

export default LazyImage;