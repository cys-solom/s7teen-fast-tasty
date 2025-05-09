import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

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
        className="w-full py-4 px-4 flex items-center justify-between focus:outline-none hover:bg-orange-50 transition-colors"
      >
        <h3 className="font-bold text-base text-right">{question}</h3>
        {isOpen ? (
          <ChevronUp size={16} className="text-primary flex-shrink-0 mr-2" />
        ) : (
          <ChevronDown size={16} className="text-primary flex-shrink-0 mr-2" />
        )}
      </button>
      {isOpen && (
        <div className="p-4 pt-0 text-gray-600 text-right bg-orange-50/30">
          {answer}
        </div>
      )}
    </div>
  );
};

const FAQSection: React.FC = () => {
  const [isSectionOpen, setIsSectionOpen] = useState(false);
  
  const faqItems = [
    {
      question: "ما هي مناطق التوصيل؟",
      answer: "الشرقية و6 أكتوبر والمناطق المجاورة"
    },
    {
      question: "كم يستغرق وقت التوصيل؟",
      answer: "متوسط 40-60 دقيقة حسب المنطقة"
    },
    {
      question: "كيف يمكنني الطلب؟",
      answer: "يمكنك الطلب مباشرة عبر الواتساب أو من خلال التطبيق"
    }
  ];

  return (
    <section id="faq" className="py-16 bg-orange-50">
      <div className="container mx-auto px-4">
        <button 
          onClick={() => setIsSectionOpen(!isSectionOpen)}
          className="flex items-center justify-center gap-2 mx-auto bg-white rounded-full shadow-md px-6 py-3 mb-8 hover:shadow-lg transition-shadow"
        >
          <h2 className="text-2xl font-bold">الأسئلة الشائعة</h2>
          {isSectionOpen ? (
            <ChevronUp size={20} className="text-primary" />
          ) : (
            <ChevronDown size={20} className="text-primary" />
          )}
        </button>
        
        {isSectionOpen && (
          <>
            <p className="text-center text-gray-600 mb-8">اضغط على السؤال لمشاهدة الإجابة</p>
            
            <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-md overflow-hidden animate-fade-in">
              {faqItems.map((faq, index) => (
                <FAQItem
                  key={index}
                  question={faq.question}
                  answer={faq.answer}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
};

export default FAQSection;