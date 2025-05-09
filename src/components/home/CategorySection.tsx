import * as React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import LazyImage from '../ui/LazyImage';
import { getCategoriesFromFirestore } from '../../data/products';
import { Category } from '../../types/product';

const CategorySection: React.FC = () => {
  const [categories, setCategories] = React.useState<Category[]>([]);
  const [loading, setLoading] = React.useState<boolean>(true);

  React.useEffect(() => {
    const fetchCategories = async () => {
      try {
        const categoriesData = await getCategoriesFromFirestore();
        setCategories(categoriesData);
      } catch (error) {
        console.error("Error fetching categories:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  if (loading) {
    return (
      <section id="categories" className="py-16 bg-gradient-to-b from-orange-50 to-white">
        <div className="container mx-auto">
          <h2 className="section-title">تسوق حسب الفئة</h2>
          <div className="flex justify-center items-center h-64">
            <div className="animate-pulse text-gray-500">جاري تحميل الفئات...</div>
          </div>
        </div>
      </section>
    );
  }

  if (categories.length === 0) {
    return (
      <section id="categories" className="py-16 bg-gradient-to-b from-orange-50 to-white">
        <div className="container mx-auto">
          <h2 className="section-title">تسوق حسب الفئة</h2>
          <div className="flex justify-center items-center h-64">
            <div className="text-gray-500">لا توجد فئات متاحة حاليًا</div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="categories" className="py-16 bg-gradient-to-b from-orange-50 to-white">
      <div className="container mx-auto">
        <h2 className="section-title">تسوق حسب الفئة</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {categories.map((category) => (
            <Link 
              key={category.id}
              to={`/category/${category.id}`}
              className="category-card relative overflow-hidden rounded-lg group"
            >
              <div className="h-64">
                <LazyImage 
                  src={category.imageUrl} 
                  alt={category.name} 
                  className="w-full h-full rounded-lg"
                />
              </div>
              <div className="overlay absolute inset-0 bg-gradient-to-t from-black/70 to-black/20 flex items-end p-6">
                <div className="w-full">
                  <h3 className="text-2xl font-bold text-white mb-3">
                    {category.name}
                  </h3>
                  {/* تحديث زر عرض المنتجات ليكون أصغر وبلون مختلف */}
                  <div className="bg-secondary bg-opacity-90 rounded-md py-1 px-3 inline-flex items-center hover:bg-secondary transition-colors">
                    <span className="text-white text-sm">عرض المنتجات</span>
                    <ArrowLeft size={14} className="mr-1 transition-transform group-hover:translate-x-1 text-white" />
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CategorySection;