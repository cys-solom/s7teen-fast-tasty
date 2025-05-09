import React from 'react';
import { MapPin, Clock, Truck } from 'lucide-react';

const DeliverySection: React.FC = () => {
  return (
    <section className="py-16 bg-orange-50"> {/* Changed background */}
      <div className="container mx-auto">
        <h2 className="section-title">فروعنا وخدمة التوصيل</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* فرع الشرقية */}
          <div className="card p-6 bg-white"> {/* Ensured white background */}
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                <MapPin size={24} className="text-primary" />
              </div>
              <h3 className="text-xl font-semibold">فرع الشرقية</h3>
            </div>
            <p className="text-gray-600 mb-4">شارع الزقازيق الرئيسي بجوار مسجد التوحيد</p>
            <a 
              href="https://maps.google.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary hover:underline inline-flex items-center gap-1"
            >
              الاتجاهات على الخريطة
              <MapPin size={16} />
            </a>
          </div>

          {/* فرع 6 أكتوبر */}
          <div className="card p-6 bg-white"> {/* Ensured white background */}
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                <MapPin size={24} className="text-primary" />
              </div>
              <h3 className="text-xl font-semibold">فرع 6 أكتوبر</h3>
            </div>
            <p className="text-gray-600 mb-4">المحور المركزي - مول سيتي ستارز</p>
            <a 
              href="https://maps.google.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary hover:underline inline-flex items-center gap-1"
            >
              الاتجاهات على الخريطة
              <MapPin size={16} />
            </a>
          </div>

          {/* خدمة التوصيل - Enhanced Styling */}
          <div className="card p-6 bg-gradient-to-br from-secondary to-primary text-white border-2 border-white shadow-xl transform scale-105">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <Truck size={24} className="text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white">خدمة التوصيل</h3>
            </div>
            <div className="space-y-3">
              <p className="text-orange-100"> {/* Adjusted text color for contrast */}
                نوصل طلباتكم إلى جميع مناطق الشرقية و6 أكتوبر والمناطق المجاورة
              </p>
              <div className="flex items-center gap-2 text-orange-100"> {/* Adjusted text color */}
                <Clock size={16} className="text-white" />
                <span>متوسط وقت التوصيل: 40-60 دقيقة</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default DeliverySection;