import React from 'react';
import { ShoppingBag } from 'lucide-react';
import { useCart } from '../../context/CartContext';

interface PersistentCartProps {
  toggleMainCart?: () => void; // إضافة خاصية للربط بالسلة الرئيسية
}

const PersistentCart: React.FC<PersistentCartProps> = ({ toggleMainCart }) => {
  const { totalItems, totalPrice } = useCart();

  // إذا لم يكن هناك عناصر في السلة
  if (!totalItems) {
    return (
      <button 
        onClick={toggleMainCart}
        className="fixed left-4 bottom-4 bg-primary text-white rounded-full w-12 h-12 flex items-center justify-center shadow-lg z-40 hover:scale-110 transition-transform"
        aria-label="عرض السلة"
      >
        <ShoppingBag size={20} />
      </button>
    );
  }

  // عند وجود عناصر، إظهار العدد والسعر الإجمالي للتحسين
  return (
    <button 
      onClick={toggleMainCart}
      className="fixed left-4 bottom-4 bg-primary text-white rounded-full shadow-xl z-40 p-3 flex items-center gap-2 hover:scale-105 transition-transform animate-pulse"
      aria-label="عرض محتويات السلة"
    >
      <div className="relative">
        <ShoppingBag size={20} />
        <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
          {totalItems}
        </span>
      </div>
      <span className="font-bold text-sm hidden sm:inline-block">{totalPrice.toFixed(2)} ج.م</span>
    </button>
  );
};

export default PersistentCart;