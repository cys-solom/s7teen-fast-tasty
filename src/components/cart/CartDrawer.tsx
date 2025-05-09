import React, { useState, useEffect } from 'react';
import { X, ShoppingBag, Send } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import CartItem from './CartItem';
import { whatsappNumber } from '../../data/products';
import { createOrder } from '../../utils/orders';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

interface OrderDetails {
  name: string;
  phone: string;
  address: string;
  notes: string;
}

const CartDrawer: React.FC<CartDrawerProps> = ({ isOpen, onClose }) => {
  const [orderDetails, setOrderDetails] = useState<OrderDetails>({
    name: '',
    phone: '',
    address: '',
    notes: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const { cartItems, totalPrice, clearCart } = useCart();

  const formatPrice = (price: number) => {
    return price.toFixed(2);
  };

  // Direct WhatsApp message sending with the most compatible approach
  const handleWhatsAppOrder = () => {
    if (cartItems.length === 0) return;
    
    const orderMessage = `✨ طلب جديد ✨
👤 معلومات العميل:
▸ الاسم: ${orderDetails.name}
▸ الهاتف: ${orderDetails.phone}
▸ العنوان: ${orderDetails.address}
🛍 طلباتك:
${cartItems.map(item => `▸ ${item.name}\n   الكمية: ${item.quantity} | السعر: ${formatPrice(item.price)} ج.م | الإجمالي: ${formatPrice(item.price * item.quantity)} ج.م`).join('\n')}
💰 المجموع النهائي: ${formatPrice(totalPrice)} ج.م
📝 ملاحظاتك:
${orderDetails.notes || 'لا توجد ملاحظات'}
شكراً لثقتك بنا! ❤
سيتم التواصل معك خلال ساعة لتأكيد الطلب.`;

    const encodedMessage = encodeURIComponent(orderMessage);
    const phoneNumber = whatsappNumber.replace(/\+/g, '');
    
    // استخدام الرابط المباشر لواتساب (يعمل على جميع الأجهزة)
    const whatsappUrl = `https://api.whatsapp.com/send?phone=${phoneNumber}&text=${encodedMessage}`;

    try {
      // توجيه مباشر لرابط واتساب في نفس النافذة - يتجنب مشاكل النوافذ المنبثقة
      window.location.href = whatsappUrl;
      
      // تفريغ السلة بعد التوجيه
      setTimeout(() => {
        clearCart();
        onClose();
      }, 1500);
    } catch (e) {
      console.error("WhatsApp redirect error:", e);
      
      // في حالة حدوث أي مشكلة أخرى
      alert(`حدث خطأ أثناء فتح واتساب. يمكنك التواصل مباشرة على الرقم: ${phoneNumber}`);
    }
  };

  const handleOrderSubmit = async () => {
    if (!orderDetails.name || !orderDetails.phone || !orderDetails.address || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await createOrder({
        customerName: orderDetails.name,
        customerPhone: orderDetails.phone,
        customerAddress: orderDetails.address,
        products: cartItems.map(item => ({
          id: String(item.id),
          name: item.name,
          quantity: item.quantity,
          price: item.price
        }))
      });
      handleWhatsAppOrder();
    } catch (error) {
      console.error("Error creating order:", error);
      alert("حدث خطأ أثناء إرسال الطلب. يرجى المحاولة مرة أخرى.");
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={onClose}
      />
      
      <div className="fixed inset-y-0 left-0 w-full sm:w-96 bg-white z-50 shadow-xl transform flex flex-col">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-bold">إكمال الطلب</h2>
          <button 
            className="text-gray-500 hover:text-gray-700"
            onClick={onClose}
          >
            <X size={24} />
          </button>
        </div>
        
        <div className="flex-grow overflow-y-auto p-4">
          {cartItems.length > 0 ? (
            <>
              <div className="space-y-4 mb-6">
                {cartItems.map(item => (
                  <CartItem key={item.id} item={item} />
                ))}
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    الاسم الكامل *
                  </label>
                  <input
                    type="text"
                    placeholder="الاسم كما سيظهر على الفاتورة"
                    className="input"
                    value={orderDetails.name}
                    onChange={(e) => setOrderDetails(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    العنوان التفصيلي *
                  </label>
                  <input
                    type="text"
                    placeholder="الحي، الشارع، رقم العمارة، الشقة"
                    className="input"
                    value={orderDetails.address}
                    onChange={(e) => setOrderDetails(prev => ({ ...prev, address: e.target.value }))}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    رقم الهاتف *
                  </label>
                  <input
                    type="tel"
                    placeholder="مثال: 01234567890"
                    className="input"
                    value={orderDetails.phone}
                    onChange={(e) => setOrderDetails(prev => ({ ...prev, phone: e.target.value }))}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ملاحظات إضافية
                  </label>
                  <textarea
                    placeholder="...أي متطلبات خاصة، تعليمات توصيل، إلخ"
                    className="input min-h-[100px]"
                    value={orderDetails.notes}
                    onChange={(e) => setOrderDetails(prev => ({ ...prev, notes: e.target.value }))}
                  />
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center text-gray-500">
              <ShoppingBag size={64} className="mb-4" />
              <p className="text-lg mb-2">سلة الطعام فارغة</p>
              <p className="text-sm mb-4">أضف بعض الأطباق لتبدأ الطلب</p>
              <button 
                className="btn btn-primary"
                onClick={onClose}
              >
                تصفح القائمة
              </button>
            </div>
          )}
        </div>
        
        {cartItems.length > 0 && (
          <div className="p-4 border-t border-gray-200">
            <div className="flex justify-between mb-4">
              <span className="font-semibold">المجموع:</span>
              <span className="font-bold text-primary">{formatPrice(totalPrice)} ج.م</span>
            </div>
            <button
              onClick={handleOrderSubmit}
              disabled={!orderDetails.name || !orderDetails.phone || !orderDetails.address || isSubmitting}
              className="btn btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send size={18} />
              <span>{isSubmitting ? 'جاري الإرسال...' : 'إرسال الطلب عبر واتساب'}</span>
            </button>
            <button 
              className="text-gray-500 hover:text-error text-sm block mx-auto mt-4"
              onClick={clearCart}
            >
              إفراغ السلة
            </button>
          </div>
        )}
      </div>
    </>
  );
};

export default CartDrawer;