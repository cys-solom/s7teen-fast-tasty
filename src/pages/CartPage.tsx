import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { CartContext } from '../context/CartContext';
import { Trash2, ShoppingBag, ArrowLeft } from 'lucide-react';
import BackButton from '../components/ui/BackButton';
import CartItem from '../components/cart/CartItem';

const CartPage = () => {
  const { cartItems, totalItems, totalPrice, clearCart } = useContext(CartContext);
  
  if (cartItems.length === 0) {
    return (
      <div className="container mx-auto py-8">
        {/* إضافة زر الرجوع حتى في حالة السلة الفارغة */}
        <div className="mb-4">
          <BackButton />
        </div>
        
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <ShoppingBag size={64} className="text-gray-300 mb-4" />
          <h2 className="text-2xl font-bold mb-2">سلة التسوق فارغة</h2>
          <p className="text-gray-500 mb-8 max-w-md">
            لم تقم بإضافة أي منتجات إلى سلة التسوق بعد. اكتشف منتجاتنا وأضف ما يعجبك!
          </p>
          <Link to="/" className="btn btn-primary">
            ابدأ التسوق
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      {/* زر الرجوع */}
      <div className="mb-4">
        <BackButton />
      </div>
      
      <h1 className="text-2xl font-bold mb-6">سلة التسوق</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="font-medium">
                المنتجات ({totalItems})
              </h2>
              <button
                className="text-sm text-error flex items-center gap-1"
                onClick={clearCart}
              >
                <Trash2 size={14} />
                <span>إفراغ السلة</span>
              </button>
            </div>
            
            <div className="divide-y divide-gray-200">
              {cartItems.map(item => (
                <div key={item.id} className="p-4">
                  <CartItem item={item} />
                </div>
              ))}
            </div>
            
            <div className="p-4 border-t border-gray-200">
              <Link to="/" className="text-primary flex items-center gap-1 text-sm">
                <ArrowLeft size={16} />
                <span>متابعة التسوق</span>
              </Link>
            </div>
          </div>
        </div>
        
        {/* Order Summary */}
        <div>
          <div className="bg-white rounded-lg shadow-sm p-6 sticky top-24">
            <h2 className="font-medium mb-6">ملخص الطلب</h2>
            
            <div className="space-y-4 text-sm">
              <div className="flex justify-between pb-4 border-b border-gray-200">
                <span className="text-gray-600">المجموع الفرعي</span>
                <span className="font-medium">{totalPrice} ريال</span>
              </div>
              
              <div className="flex justify-between pb-4 border-b border-gray-200">
                <span className="text-gray-600">الشحن</span>
                <span className="font-medium">مجاني</span>
              </div>
              
              <div className="flex justify-between pb-4 border-b border-gray-200">
                <span className="text-gray-600">الضريبة (15%)</span>
                <span className="font-medium">{Math.round(totalPrice * 0.15)} ريال</span>
              </div>
              
              <div className="flex justify-between font-bold text-lg">
                <span>المجموع</span>
                <span className="text-primary">{Math.round(totalPrice * 1.15)} ريال</span>
              </div>
            </div>
            
            <Link
              to="/checkout"
              className="btn btn-primary w-full mt-6 mb-4"
            >
              المتابعة للدفع
            </Link>
            
            <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
              <span>نقبل الدفع بـ:</span>
              <div className="flex gap-1">
                <img src="https://via.placeholder.com/30x20" alt="Visa" className="h-5" />
                <img src="https://via.placeholder.com/30x20" alt="Mastercard" className="h-5" />
                <img src="https://via.placeholder.com/30x20" alt="Apple Pay" className="h-5" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;