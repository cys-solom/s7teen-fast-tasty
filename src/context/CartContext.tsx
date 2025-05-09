import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product } from '../types/product';

interface CartItem extends Product {
  quantity: number;
}

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (product: Product) => void;
  removeFromCart: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
}

const defaultCartContext: CartContextType = {
  cartItems: [],
  addToCart: () => {},
  removeFromCart: () => {},
  updateQuantity: () => {},
  clearCart: () => {},
  totalItems: 0,
  totalPrice: 0,
};

const CartContext = createContext<CartContextType>(defaultCartContext);

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPrice, setTotalPrice] = useState(0);
  const [error, setError] = useState<Error | null>(null);

  // Add error boundary within the context
  if (error) {
    console.error('CartContext Error:', error);
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg m-4 text-right dir-rtl">
        <h3 className="text-red-600 font-bold mb-2">خطأ في إعداد سلة التسوق</h3>
        <p className="text-gray-700">يرجى إعادة تحميل الصفحة أو المحاولة مرة أخرى</p>
        <button 
          onClick={() => window.location.reload()} 
          className="mt-2 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
        >
          إعادة تحميل
        </button>
      </div>
    );
  }

  useEffect(() => {
    try {
      // Calculate totals whenever cart changes
      const itemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
      // Use discountPrice when available instead of the original price
      const price = cartItems.reduce((sum, item) => {
        const itemPrice = item.discountPrice || item.price;
        return sum + itemPrice * item.quantity;
      }, 0);
      
      setTotalItems(itemCount);
      setTotalPrice(price);
    } catch (err) {
      console.error('Error calculating cart totals:', err);
      setError(err instanceof Error ? err : new Error('Unknown error in cart calculations'));
    }
  }, [cartItems]);

  const addToCart = (product: Product) => {
    try {
      setCartItems(prevItems => {
        const existingItem = prevItems.find(item => item.id === product.id);
        
        if (existingItem) {
          // Item exists, increase quantity
          return prevItems.map(item => 
            item.id === product.id 
              ? { ...item, quantity: item.quantity + 1 } 
              : item
          );
        } else {
          // Item doesn't exist, add new item with quantity 1
          return [...prevItems, { ...product, quantity: 1 }];
        }
      });
    } catch (err) {
      console.error('Error adding item to cart:', err);
      setError(err instanceof Error ? err : new Error('Unknown error adding to cart'));
    }
  };

  const removeFromCart = (productId: number) => {
    try {
      setCartItems(prevItems => prevItems.filter(item => item.id !== productId));
    } catch (err) {
      console.error('Error removing item from cart:', err);
      setError(err instanceof Error ? err : new Error('Unknown error removing from cart'));
    }
  };

  const updateQuantity = (productId: number, quantity: number) => {
    try {
      if (quantity <= 0) {
        removeFromCart(productId);
        return;
      }
      
      setCartItems(prevItems => 
        prevItems.map(item => 
          item.id === productId 
            ? { ...item, quantity } 
            : item
        )
      );
    } catch (err) {
      console.error('Error updating cart quantity:', err);
      setError(err instanceof Error ? err : new Error('Unknown error updating cart quantity'));
    }
  };

  const clearCart = () => {
    try {
      setCartItems([]);
    } catch (err) {
      console.error('Error clearing cart:', err);
      setError(err instanceof Error ? err : new Error('Unknown error clearing cart'));
    }
  };

  const contextValue = {
    cartItems,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    totalItems,
    totalPrice,
  };

  return (
    <CartContext.Provider value={contextValue}>
      {children}
    </CartContext.Provider>
  );
};

export { CartContext };