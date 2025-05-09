import { useEffect } from 'react';

/**
 * مكون لتحسين أداء الموقع من خلال تعيين أولويات التحميل
 */
export const PerformanceOptimizer: React.FC = () => {
  useEffect(() => {
    try {
      // تحسين Cumulative Layout Shift (CLS) بضبط أبعاد العناصر
      document.documentElement.style.setProperty('scroll-behavior', 'auto');
      
      // تأجيل تحميل الموارد غير المهمة
      window.addEventListener('load', () => {
        // مهلة قصيرة للسماح للمتصفح بالتركيز على العناصر الأساسية أولاً
        setTimeout(() => {
          const nonCriticalCSS = document.querySelectorAll('link[data-non-critical="true"]');
          nonCriticalCSS.forEach(link => {
            (link as HTMLLinkElement).media = 'all';
          });
        }, 500);
      });

      // تحديد نصوص التتبع بالخاصية async
      const scriptOptimizer = () => {
        const scripts = document.getElementsByTagName('script');
        for (let i = 0; i < scripts.length; i++) {
          const script = scripts[i];
          if (script.dataset.tracking === 'true' && !script.async) {
            script.async = true;
          }
        }
      };
      
      scriptOptimizer();
    } catch (error) {
      console.error("Error in PerformanceOptimizer:", error);
      // Silent fail to prevent breaking the app
    }
    
    return () => {
      // إعادة ضبط سلوك التمرير عند إزالة المكون
      document.documentElement.style.removeProperty('scroll-behavior');
    };
  }, []);
  
  return null;
};

/**
 * تحسين Content Layout Shift (CLS) من خلال ضبط حجم العناصر مسبقًا
 */
export const usePrefetchResources = (resources: string[] = []) => {
  useEffect(() => {
    try {
      // استباق تحميل الموارد المستخدمة بشكل متكرر
      const prefetchLinks = resources.map(url => {
        const link = document.createElement('link');
        link.rel = 'prefetch';
        link.href = url;
        link.as = url.endsWith('.js') ? 'script' : 
                  url.endsWith('.css') ? 'style' : 
                  url.match(/\.(jpe?g|png|gif|webp)/i) ? 'image' : 
                  'fetch';
        return link;
      });
      
      // إضافة الروابط للصفحة
      prefetchLinks.forEach(link => document.head.appendChild(link));
      
      // تنظيف عند إزالة المكون
      return () => {
        prefetchLinks.forEach(link => {
          if (document.head.contains(link)) {
            document.head.removeChild(link);
          }
        });
      };
    } catch (error) {
      console.error("Error in usePrefetchResources:", error);
      return () => {}; // Empty cleanup function
    }
  }, [resources]);
};

/**
 * إضافة دعم preconnect للنطاقات الخارجية المستخدمة بكثرة
 */
export const usePreconnect = (domains: string[] = []) => {
  useEffect(() => {
    try {
      // إنشاء روابط preconnect لتسريع الاتصال بالنطاقات الخارجية
      const preconnectLinks = domains.map(domain => {
        const link = document.createElement('link');
        link.rel = 'preconnect';
        link.href = domain;
        link.crossOrigin = 'anonymous';
        return link;
      });
      
      // إضافة الروابط للصفحة
      preconnectLinks.forEach(link => document.head.appendChild(link));
      
      // تنظيف عند إزالة المكون
      return () => {
        preconnectLinks.forEach(link => {
          if (document.head.contains(link)) {
            document.head.removeChild(link);
          }
        });
      };
    } catch (error) {
      console.error("Error in usePreconnect:", error);
      return () => {}; // Empty cleanup function
    }
  }, [domains]);
};

/**
 * تجزئة العمليات الثقيلة إلى عمليات أصغر باستخدام requestIdleCallback
 * @param callback الدالة المراد تنفيذها
 * @param data البيانات التي يتم تمريرها للدالة
 * @param chunkSize حجم القطعة المراد معالجتها في كل دورة
 */
export const processInChunks = <T,>(
  callback: (item: T) => void,
  data: T[],
  chunkSize: number = 5
): void => {
  let index = 0;
  
  try {
    const processChunk = (deadline: IdleDeadline) => {
      while (index < data.length && deadline.timeRemaining() > 0) {
        callback(data[index]);
        index++;
        
        if (index % chunkSize === 0) {
          break;
        }
      }
      
      if (index < data.length) {
        requestIdleCallback(processChunk);
      }
    };
    
    // استخدم setTimeout كبديل في حال عدم دعم المتصفح
    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      requestIdleCallback(processChunk);
    } else {
      const processNextChunk = () => {
        const endIndex = Math.min(index + chunkSize, data.length);
        while (index < endIndex) {
          callback(data[index]);
          index++;
        }
        
        if (index < data.length) {
          setTimeout(processNextChunk, 0);
        }
      };
      
      setTimeout(processNextChunk, 0);
    }
  } catch (error) {
    console.error("Error in processInChunks:", error);
    // Process all at once in case of error
    data.forEach(item => {
      try {
        callback(item);
      } catch (e) {
        console.error("Error processing item:", e);
      }
    });
  }
};

// Add a flag to prevent duplicate logging
let hasLoggedPerformance = false;

// Improving performance metrics reporting
export const reportWebVitals = async () => {
  if (hasLoggedPerformance || typeof window === 'undefined' || !('performance' in window) || !('getEntriesByType' in window.performance)) {
    return;
  }
  
  try {
    window.addEventListener('load', () => {
      setTimeout(() => {
        if (hasLoggedPerformance) return;
        hasLoggedPerformance = true;
        
        try {
          const navigationEntries = performance.getEntriesByType('navigation');
          const paintEntries = performance.getEntriesByType('paint');
          
          // Performance metrics
          if (navigationEntries.length > 0 && navigationEntries[0] instanceof PerformanceNavigationTiming) {
            const navEntry = navigationEntries[0] as PerformanceNavigationTiming;
            console.info('Performance Metrics:', {
              ttfb: Math.round(navEntry.responseStart - navEntry.requestStart),
              loadComplete: Math.round(navEntry.loadEventEnd - navEntry.startTime)
            });
          }
          
          // Paint metrics
          const firstPaint = paintEntries.find(entry => entry.name === 'first-paint')?.startTime || 0;
          const firstContentfulPaint = paintEntries.find(entry => entry.name === 'first-contentful-paint')?.startTime || 0;
          
          console.info('Paint Metrics:', {
            firstPaint: Math.round(firstPaint),
            firstContentfulPaint: Math.round(firstContentfulPaint)
          });
        } catch (error) {
          console.error('Error collecting performance metrics:', error);
        }
      }, 1000);
    });
  } catch (error) {
    console.error("Error setting up reportWebVitals:", error);
    // Silent failure for non-browser environments
  }
};