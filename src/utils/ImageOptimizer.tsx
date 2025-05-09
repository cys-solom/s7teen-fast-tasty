/**
 * أداة مساعدة بسيطة للصور
 */

import { useEffect } from 'react';

/**
 * إنشاء placeholder للصورة
 * @param width عرض الصورة البديلة
 * @param height ارتفاع الصورة البديلة
 * @param color لون الخلفية (كود hex)
 * @returns صورة بديلة كـ data URL
 */
export const createSimplePlaceholder = (width: number, height: number, color: string = '#f3f4f6'): string => {
  return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 ${width} ${height}' width='${width}' height='${height}'%3E%3Crect width='${width}' height='${height}' fill='${color.replace('#', '%23')}'/%3E%3C/svg%3E`;
};

/**
 * Hook لتحميل الموارد (الصور) بشكل مسبق
 * @param urls مصفوفة من روابط الصور المراد تحميلها مسبقًا
 */
export const usePrefetchResources = (urls: string[]): void => {
  useEffect(() => {
    if (!urls || urls.length === 0) return;

    // تحميل الصور مسبقًا
    urls.forEach(url => {
      if (url) {
        const img = new Image();
        img.src = url;
      }
    });
  }, [urls]);
};