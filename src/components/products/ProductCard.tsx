import * as React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, Heart, Check } from 'lucide-react';
import { Product } from '../../types/product';
import { useCart } from '../../context/CartContext';
import LazyImage from '../ui/LazyImage';

interface ProductCardProps {
  product: Product;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }: ProductCardProps) => {
  const { addToCart } = useCart();
  const [isWishlisted, setIsWishlisted] = React.useState(false);
  const [isAddingToCart, setIsAddingToCart] = React.useState(false);
  const buttonRef = React.useRef<HTMLButtonElement>(null);

  const toggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsWishlisted(!isWishlisted);
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation(); // Prevent any parent element events from triggering
    
    if (!product.inStock || isAddingToCart) return;
    
    // Add ripple effect
    if (buttonRef.current) {
      const button = buttonRef.current;
      const circle = document.createElement('span');
      const diameter = Math.max(button.clientWidth, button.clientHeight);
      const radius = diameter / 2;

      circle.style.width = circle.style.height = `${diameter}px`;
      circle.style.left = `${e.clientX - button.getBoundingClientRect().left - radius}px`;
      circle.style.top = `${e.clientY - button.getBoundingClientRect().top - radius}px`;
      circle.classList.add('ripple');

      const ripple = button.getElementsByClassName('ripple')[0];
      if (ripple) {
        ripple.remove();
      }

      button.appendChild(circle);
    }
    
    setIsAddingToCart(true);
    addToCart(product);
    
    // عرض تأثير بصري عند إضافة المنتج للسلة
    setTimeout(() => {
      setIsAddingToCart(false);
    }, 800);
  };

  // Calculate the discount percentage correctly
  const calculateDiscountPercentage = () => {
    if (product.discountPrice && product.price) {
      // Ensure discount is always a positive number between 0 and 100
      if (product.discountPrice >= product.price) {
        return 0; // No discount or incorrect price data
      }
      const discount = ((product.price - product.discountPrice) / product.price) * 100;
      // Make sure we don't exceed 100%
      return Math.min(Math.round(discount), 99);
    }
    return 0;
  };
  
  // Get the discount percentage
  const discountPercentage = calculateDiscountPercentage();

  return (
    <div className="card group relative bg-white rounded-lg shadow-sm hover:shadow-lg transition-shadow duration-300">
      <Link to={`/product/${product.id}`} className="block">
        <div className="relative">
          <div className="aspect-w-4 aspect-h-3 md:aspect-w-16 md:aspect-h-12 lg:aspect-w-16 lg:aspect-h-10">
            <LazyImage 
              src={product.imageUrl} 
              alt={product.name} 
              className="w-full h-full object-cover rounded-t-lg"
              placeholderSrc="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 300 300' width='300' height='300'%3E%3Crect width='300' height='300' fill='%23f3f4f6'/%3E%3C/svg%3E"
            />
          </div>
          
          {/* Discount Badge - Only show if discount percentage is greater than 0 */}
          {product.discountPrice && product.discountPrice < product.price && discountPercentage > 0 && (
            <span className="absolute top-3 right-3 bg-secondary text-white text-xs md:text-sm px-2 py-1 rounded font-medium" dir="rtl">
              خصم {discountPercentage}%
            </span>
          )}
          
          {/* Action Buttons */}
          <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <button
              onClick={toggleWishlist}
              className="bg-white p-2 rounded-full shadow-md hover:bg-primary hover:text-white transition-colors"
            >
              <Heart size={20} fill={isWishlisted ? 'currentColor' : 'none'} className={isWishlisted ? 'text-error' : ''} />
            </button>
          </div>
        </div>
        
        <div className="p-4 md:p-5 pb-16 md:pb-20"> {/* Added extra padding at bottom for the Add to Cart button */}
          <h3 className="font-medium text-gray-800 mb-2 text-base md:text-lg lg:text-xl line-clamp-1">{product.name}</h3>
          
          <div className="flex items-center justify-between mt-2">
            <div className="flex flex-col">
              {product.discountPrice ? (
                <>
                  <span className="font-bold text-primary text-lg md:text-xl">{Math.round(product.discountPrice)} جنيه</span>
                  <span className="text-sm md:text-base text-gray-500 line-through mt-1">{product.price} جنيه</span>
                </>
              ) : (
                <span className="font-bold text-primary text-lg md:text-xl">{product.price} جنيه</span>
              )}
            </div>
            
            {!product.inStock && (
              <span className="text-xs md:text-sm text-error font-medium">نفذت الكمية</span>
            )}
          </div>
        </div>
      </Link>
      
      {/* Add to Cart Button - Fixed at bottom with animation */}
      <button
        ref={buttonRef}
        onClick={handleAddToCart}
        disabled={!product.inStock || isAddingToCart}
        className={`add-to-cart-btn absolute bottom-4 md:bottom-5 right-4 md:right-5 left-4 md:left-5 py-2 md:py-3 rounded-md flex items-center justify-center gap-2 text-sm md:text-base font-medium transition-colors overflow-hidden ${
          isAddingToCart 
            ? 'bg-green-500 text-white scale-105' 
            : !product.inStock 
              ? 'bg-gray-200 text-gray-500 cursor-not-allowed' 
              : 'bg-primary text-white hover:bg-primary-dark active:scale-95'
        }`}
        style={{ touchAction: 'manipulation' }}
      >
        {isAddingToCart ? (
          <Check size={16} className="md:w-5 md:h-5 animate-slide-in" />
        ) : (
          <ShoppingCart size={16} className="md:w-5 md:h-5" />
        )}
        <span className={isAddingToCart ? "animate-fade-in" : ""}>
          {isAddingToCart ? 'تمت الإضافة!' : !product.inStock ? 'نفذت الكمية' : 'إضافة للسلة'}
        </span>
      </button>
    </div>
  );
};

export default ProductCard;