import React, { useState, useEffect } from 'react';
import ProductCard from './ProductCard';
import { getProductsFromFirestore } from '../../data/products';
import { Product } from '../../types/product';

const FeaturedProducts: React.FC = () => {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchFeaturedProducts = async () => {
      try {
        const productsData = await getProductsFromFirestore();
        const featured = productsData.filter(
          product => 
            product.discountPrice !== undefined && 
            product.discountPrice !== null && 
            product.discountPrice < product.price
        );
        setFeaturedProducts(featured);
      } catch (error) {
        console.error("Error fetching featured products:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchFeaturedProducts();
  }, []);

  if (loading) {
    return (
      <section className="my-12 lg:my-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl lg:text-4xl font-bold mb-8 lg:mb-10">عروض مميزة</h2>
          <div className="flex justify-center items-center h-64 lg:h-80">
            <div className="animate-pulse text-gray-500 text-lg lg:text-xl">جاري تحميل المنتجات المميزة...</div>
          </div>
        </div>
      </section>
    );
  }

  if (featuredProducts.length === 0) {
    return (
      <section className="my-12 lg:my-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl lg:text-4xl font-bold mb-8 lg:mb-10">عروض مميزة</h2>
          <div className="text-center py-12 lg:py-16">
            <p className="text-gray-500 text-lg lg:text-xl">لا توجد عروض مميزة حاليًا</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="my-12 lg:my-20">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl lg:text-4xl font-bold mb-8 lg:mb-10">عروض مميزة</h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 lg:gap-8">
          {featuredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturedProducts;