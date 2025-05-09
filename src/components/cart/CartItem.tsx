import React from 'react';
import { Trash, Plus, Minus } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { Product } from '../../types/product';

interface CartItemProps {
  item: Product & { quantity: number };
}

const CartItem: React.FC<CartItemProps> = ({ item }) => {
  const { updateQuantity, removeFromCart } = useCart();
  
  const handleIncrement = () => {
    updateQuantity(item.id, item.quantity + 1);
  };
  
  const handleDecrement = () => {
    if (item.quantity > 1) {
      updateQuantity(item.id, item.quantity - 1);
    } else {
      removeFromCart(item.id);
    }
  };

  return (
    <div className="flex py-4 border-b border-gray-200">
      {/* Product Image */}
      <img 
        src={item.imageUrl} 
        alt={item.name} 
        className="w-20 h-20 object-cover rounded"
      />
      
      <div className="mr-4 flex-1">
        {/* Product Name */}
        <h3 className="font-medium text-gray-800 mb-1 line-clamp-1">{item.name}</h3>
        
        <div className="flex items-center justify-between mt-2">
          {/* Price */}
          <div className="flex flex-col items-end">
          <span className="font-medium text-gray-800">
            {(item.discountPrice || item.price) * item.quantity} جنيه
          </span>
          {item.discountPrice && (
            <span className="text-sm text-gray-500 line-through">
              {item.price * item.quantity} جنيه
            </span>
          )}
        </div>
          
          {/* Quantity Controls */}
          <div className="flex items-center">
            <button
              onClick={handleDecrement}
              className="w-7 h-7 flex items-center justify-center border border-gray-300 rounded-l"
            >
              {item.quantity === 1 ? <Trash size={14} /> : <Minus size={14} />}
            </button>
            
            <span className="w-8 h-7 flex items-center justify-center border-t border-b border-gray-300">
              {item.quantity}
            </span>
            
            <button
              onClick={handleIncrement}
              className="w-7 h-7 flex items-center justify-center border border-gray-300 rounded-r"
            >
              <Plus size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartItem;