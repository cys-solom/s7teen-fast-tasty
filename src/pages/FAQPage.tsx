import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import BackButton from '../components/ui/BackButton';

interface FAQItemProps {
  question: string;
  answer: string;
}

const FAQItem: React.FC<FAQItemProps> = ({ question, answer }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-b border-gray-100 last:border-none">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full py-5 px-6 flex items-center justify-between focus:outline-none hover:bg-orange-50/30 transition-colors"
      >
        <h3 className="font-bold text-lg text-right">{question}</h3>
        {isOpen ? (
          <ChevronUp size={20} className="text-primary flex-shrink-0 mr-3" />
        ) : (
          <ChevronDown size={20} className="text-primary flex-shrink-0 mr-3" />
        )}
      </button>
      {isOpen && (
        <div className="p-6 pt-0 text-gray-600 text-right bg-orange-50/20">
          {answer}
        </div>
      )}
    </div>
  );
};

const FAQPage: React.FC = () => {
  // مجموعة الأسئلة الشائعة
  const faqItems = [
    {
      question: "ما هي مناطق التوصيل؟",
      answer: "الشرقية و6 أكتوبر والمناطق المجاورة، ويمكننا أيضاً توصيل الطلبات إلى مناطق أخرى حسب الاتفاق والمسافة."
    },
    {
      question: "كم يستغرق وقت التوصيل؟",
      answer: "متوسط وقت التوصيل يتراوح بين 40-60 دقيقة حسب المنطقة والمسافة وحركة المرور. نحرص دائماً على تسليم الطلبات في أقل وقت ممكن مع الحفاظ على جودة المنتج."
    },
    {
      question: "كيف يمكنني الطلب؟",
      answer: "يمكنك الطلب مباشرة عبر الواتساب أو من خلال التطبيق، وذلك بإضافة المنتجات إلى السلة ثم الانتقال لإكمال الطلب. سيتم التواصل معك لتأكيد الطلب والعنوان."
    },
    {
      question: "هل يمكن تعديل الطلب بعد إرساله؟",
      answer: "نعم، يمكنك تعديل الطلب في حال لم يتم البدء في تحضيره بعد. يرجى التواصل مباشرة مع خدمة العملاء في أقرب وقت ممكن بعد إرسال الطلب."
    },
    {
      question: "ما هي طرق الدفع المتاحة؟",
      answer: "نقبل الدفع عند الاستلام نقداً، وقريباً سنوفر خيارات الدفع الإلكتروني."
    },
    {
      question: "هل المنتجات طازجة دائماً؟",
      answer: "نعم، نحرص على تقديم منتجات طازجة تم تجهيزها في نفس اليوم، ولا نستخدم مواد حافظة."
    },
    {
      question: "كيف يمكنني تقديم شكوى أو اقتراح؟",
      answer: "نرحب بملاحظاتك واقتراحاتك! يمكنك التواصل معنا عبر الواتساب أو من خلال صفحاتنا على وسائل التواصل الاجتماعي."
    }
  ];

  return (
    <div className="py-10 px-4">
      <div className="container mx-auto">
        {/* زر الرجوع */}
        <div className="mb-6">
          <BackButton className="mb-4" />
        </div>
        
        {/* عنوان الصفحة */}
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">الأسئلة الشائعة</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">تجد هنا إجابات على الأسئلة المتكررة حول خدماتنا ومنتجاتنا. إذا لم تجد ما تبحث عنه، لا تتردد في التواصل معنا مباشرة.</p>
        </div>
        
        {/* قسم الأسئلة الشائعة */}
        <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-md overflow-hidden">
          {faqItems.map((faq, index) => (
            <FAQItem
              key={index}
              question={faq.question}
              answer={faq.answer}
            />
          ))}
        </div>
        
        {/* قسم الاتصال للمزيد من المساعدة */}
        <div className="max-w-2xl mx-auto text-center mt-12 p-6 bg-orange-50 rounded-xl">
          <h3 className="text-xl font-bold mb-3">لم تجد إجابتك؟</h3>
          <p className="text-gray-600 mb-5">يمكنك التواصل معنا مباشرة للحصول على المساعدة</p>
          <a 
            href="https://wa.me/201030557250" 
            className="inline-block bg-primary text-white py-3 px-6 rounded-lg font-bold hover:opacity-90 transition-opacity"
            rel="noopener noreferrer"
            target="_blank"
          >
            تواصل معنا عبر واتساب
          </a>
        </div>
      </div>
    </div>
  );
};

export default FAQPage;