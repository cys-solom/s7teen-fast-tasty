import { Product, Category } from '../types/product';

// جلب التصنيفات من Firestore فقط
import { db } from '../utils/firebase';
import { collection, getDocs } from 'firebase/firestore';

export async function getCategoriesFromFirestore(): Promise<Category[]> {
  const categoriesCol = collection(db, 'categories');
  const categoriesSnapshot = await getDocs(categoriesCol);
  return categoriesSnapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() })) as Category[];
}

// جلب المنتجات من Firestore
export async function getProductsFromFirestore(): Promise<Product[]> {
  const productsCol = collection(db, 'products');
  const productsSnapshot = await getDocs(productsCol);
  return productsSnapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() })) as Product[];
}

// لا تستخدم التصنيفات الافتراضية في الواجهة
export const categories: Category[] = [];

// المنتجات الافتراضية (تستخدم فقط كنسخة احتياطية إذا فشل جلب المنتجات من Firestore)
const defaultProducts: Product[] = [
  // مصنعات الدواجن
  {
    id: 1,
    name: 'بانيه جاهز',
    description: 'بانيه دجاج جاهز ومقرمش، مثالي للقلي السريع',
    price: 120,
    imageUrl: 'https://images.unsplash.com/photo-1585325701956-60dd9c8553bc?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&h=600',
    category: 'fresh-meat',
    rating: 4.8,
    inStock: true,
    features: ['جاهز للطهي', 'متبل', 'مقرمش بعد القلي'],
  },
  {
    id: 4,
    name: 'كفتة فراخ',
    description: 'كفتة فراخ مفرومة متبلة وجاهزة للطهي',
    price: 95,
    imageUrl: 'https://images.unsplash.com/photo-1585325701956-60dd9c8553bc?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&h=600',
    category: 'fresh-meat',
    rating: 4.7,
    inStock: true,
    features: ['مفرومة', 'متبلة', 'سهلة التحضير'],
  },
  {
    id: 5,
    name: 'شيش فراخ',
    description: 'قطع دجاج متبلة ومجهزة للشوي على الفحم',
    price: 110,
    imageUrl: 'https://images.unsplash.com/photo-1585325701956-60dd9c8553bc?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&h=600',
    category: 'fresh-meat',
    rating: 4.9,
    inStock: true,
    features: ['متبل جاهز', 'مذاق رائع', 'سهل التحضير'],
  },
  {
    id: 6,
    name: 'برجر فراخ',
    description: 'برجر دجاج محضر من لحم الدجاج الطازج، جاهز للشوي',
    price: 80,
    imageUrl: 'https://images.unsplash.com/photo-1585325701956-60dd9c8553bc?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&h=600',
    category: 'fresh-meat',
    rating: 4.5,
    inStock: true,
    features: ['طازج', 'متبل', 'غني بالبروتين'],
  },
  {
    id: 7,
    name: 'كفتة سيخ فراخ',
    description: 'كفتة فراخ على أسياخ جاهزة للشوي',
    price: 90,
    imageUrl: 'https://images.unsplash.com/photo-1585325701956-60dd9c8553bc?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&h=600',
    category: 'fresh-meat',
    rating: 4.6,
    inStock: true,
    features: ['متبلة', 'جاهزة للشوي', 'مذاق رائع'],
  },
  {
    id: 8,
    name: 'حمام كذاب محشي',
    description: 'دجاج على شكل حمام محشي بالأرز والخلطة السرية',
    price: 130,
    imageUrl: 'https://images.unsplash.com/photo-1518492104633-130d0cc84637?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&h=600',
    category: 'fresh-meat',
    rating: 4.8,
    inStock: true,
    features: ['محشي', 'متبل', 'جاهز للطهي'],
  },
  {
    id: 9,
    name: 'حمام كداب متبل فقط',
    description: 'دجاج على شكل حمام متبل فقط بدون حشو',
    price: 110,
    imageUrl: 'https://images.unsplash.com/photo-1501200291289-c5a76c232e5f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&h=600',
    category: 'fresh-meat',
    rating: 4.3,
    inStock: true,
    features: ['متبل', 'جاهز للشوي', 'مذاق مميز'],
  },
  {
    id: 10,
    name: 'استربس',
    description: 'شرائح فيليه الدجاج المتبل الجاهزة للقلي',
    price: 100,
    imageUrl: 'https://images.unsplash.com/photo-1585325701956-60dd9c8553bc?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&h=600',
    category: 'fresh-meat',
    rating: 4.7,
    inStock: true,
    features: ['متبل', 'شرائح رفيعة', 'مقرمش'],
  },
  {
    id: 11,
    name: 'شاورما فراخ',
    description: 'شاورما دجاج متبلة وجاهزة للطهي',
    price: 100,
    imageUrl: 'https://images.unsplash.com/photo-1585325701956-60dd9c8553bc?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&h=600',
    category: 'fresh-meat',
    rating: 4.8,
    inStock: true,
    features: ['متبلة', 'سهلة التحضير', 'مذاق شرقي'],
  },
  {
    id: 12,
    name: 'حمام محشي',
    description: 'حمام كامل محشي بالأرز والمكسرات',
    price: 180,
    imageUrl: 'https://images.unsplash.com/photo-1585325701956-60dd9c8553bc?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&h=600',
    category: 'fresh-meat',
    rating: 4.9,
    inStock: true,
    features: ['محشي', 'طازج', 'وجبة فاخرة'],
  },
  {
    id: 101,
    name: 'بط متبل',
    description: 'بط طازج متبل بالتوابل الشرقية والبهارات',
    price: 190,
    imageUrl: 'https://images.unsplash.com/photo-1585325701956-60dd9c8553bc?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&h=600',
    category: 'fresh-meat',
    rating: 4.7,
    inStock: true,
    features: ['متبل', 'طازج', 'مذاق غني'],
  },
  // مصنعات اللحوم
  {
    id: 2,
    name: 'ممبار جاهز',
    description: 'ممبار مُحضر ومتبل جاهز للطهي',
    price: 110,
    imageUrl: 'https://images.unsplash.com/photo-1585325701956-60dd9c8553bc?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&h=600',
    category: 'fast-food',
    rating: 4.6,
    inStock: true,
    features: ['جاهز للطهي', 'متبل', 'طعم شهي'],
  },
  {
    id: 13,
    name: 'ممبار منظف',
    description: 'ممبار منظف وجاهز للتتبيل والحشو',
    price: 85,
    imageUrl: 'https://images.unsplash.com/photo-1585325701956-60dd9c8553bc?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&h=600',
    category: 'fast-food',
    rating: 4.5,
    inStock: true,
    features: ['منظف', 'جاهز للحشو', 'طازج'],
  },
  {
    id: 14,
    name: 'كرشه منظفه',
    description: 'كرشة منظفة وجاهزة للطهي',
    price: 90,
    imageUrl: 'https://images.unsplash.com/photo-1585325701956-60dd9c8553bc?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&h=600',
    category: 'fast-food',
    rating: 4.4,
    inStock: true,
    features: ['منظفة', 'جاهزة للطهي', 'طازجة'],
  },
  {
    id: 15,
    name: 'كفتة سيخ لحم',
    description: 'كفتة لحم بقري على أسياخ جاهزة للشوي',
    price: 120,
    imageUrl: 'https://images.unsplash.com/photo-1585325701956-60dd9c8553bc?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&h=600',
    category: 'fast-food',
    rating: 4.7,
    inStock: true,
    features: ['متبلة', 'جاهزة للشوي', 'طازجة'],
  },
  {
    id: 16,
    name: 'برجر لحم',
    description: 'برجر لحم بقري طازج جاهز للشوي',
    price: 95,
    imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&h=600',
    category: 'fast-food',
    rating: 4.8,
    inStock: true,
    features: ['طازج', 'متبل', 'جاهز للشوي'],
  },
  {
    id: 17,
    name: 'استيك',
    description: 'شرائح استيك لحم بقري طازجة',
    price: 160,
    imageUrl: 'https://images.unsplash.com/photo-1600891964092-4316c288032e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&h=600',
    category: 'fast-food',
    rating: 4.9,
    inStock: true,
    features: ['طازج', 'عالي الجودة', 'فاخر'],
  },
  {
    id: 18,
    name: 'لحم متبل للشوي',
    description: 'قطع لحم بقري متبلة جاهزة للشوي',
    price: 140,
    imageUrl: 'https://images.unsplash.com/photo-1585325701956-60dd9c8553bc?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&h=600',
    category: 'fast-food',
    rating: 4.7,
    inStock: true,
    features: ['متبل', 'جاهز للشوي', 'طازج'],
  },
  {
    id: 19,
    name: 'سمبوسك لحم',
    description: 'سمبوسك مجمد محشو باللحم البقري المفروم',
    price: 75,
    imageUrl: 'https://images.unsplash.com/photo-1585325701956-60dd9c8553bc?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&h=600',
    category: 'fast-food',
    rating: 4.5,
    inStock: true,
    features: ['مجمد', 'جاهز للقلي', 'لذيذ'],
  },
  {
    id: 20,
    name: 'سمبوسك فراخ',
    description: 'سمبوسك مجمد محشو بالدجاج المفروم والخضار',
    price: 70,
    imageUrl: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&h=600',
    category: 'fast-food',
    rating: 4.4,
    inStock: true,
    features: ['مجمد', 'جاهز للقلي', 'طعم مميز'],
  },
  {
    id: 21,
    name: 'سمبوسك جبنة وزعتر',
    description: 'سمبوسك مجمد محشو بالجبنة والزعتر',
    price: 65,
    imageUrl: 'https://images.unsplash.com/photo-1574894709920-11b28e7367e3?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&h=600',
    category: 'fast-food',
    rating: 4.3,
    inStock: true,
    features: ['مجمد', 'جاهز للقلي', 'نكهة شامية'],
  },
  // الخضراوات
  {
    id: 3,
    name: 'ورق كرنب',
    description: 'ورق كرنب طازج جاهز للحشي',
    price: 45,
    imageUrl: 'https://images.unsplash.com/photo-1585325701956-60dd9c8553bc?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&h=600',
    category: 'vegetables',
    rating: 4.7,
    inStock: true,
    features: ['طازج', 'جاهز للحشي', 'منتقى بعناية'],
  },
  {
    id: 22,
    name: 'ورق عنب',
    description: 'ورق عنب طازج جاهز للحشي',
    price: 50,
    imageUrl: 'https://images.unsplash.com/photo-1585325701956-60dd9c8553bc?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&h=600',
    category: 'vegetables',
    rating: 4.8,
    inStock: true,
    features: ['طازج', 'جاهز للحشي', 'نوعية ممتازة'],
  },
  {
    id: 23,
    name: 'محشي كرنب',
    description: 'محشي كرنب جاهز بالأرز والتوابل المميزة',
    price: 65,
    imageUrl: 'https://images.unsplash.com/photo-1585325701956-60dd9c8553bc?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&h=600',
    category: 'vegetables',
    rating: 4.6,
    inStock: true,
    features: ['جاهز للطهي', 'وصفة خاصة', 'طعم مميز'],
  },
  {
    id: 24,
    name: 'محشي ورق عنب',
    description: 'محشي ورق عنب جاهز بالأرز والتوابل الشرقية',
    price: 70,
    imageUrl: 'https://images.unsplash.com/photo-1585325701956-60dd9c8553bc?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&h=600',
    category: 'vegetables',
    rating: 4.9,
    inStock: true,
    features: ['جاهز للطهي', 'وصفة تقليدية', 'طعم أصيل'],
  },
  
  {
    id: 31,
    name: 'عرض عائلي: 2 دجاجة + بطاطس + مشروب',
    description: 'وجبة عائلية مميزة تشمل 2 دجاجة مشوية، بطاطس مقلية، ومشروب عائلي كبير بسعر خاص.',
    price: 320,
    discountPrice: 260,
    imageUrl: 'https://images.pexels.com/photos/461382/pexels-photo-461382.jpeg?auto=compress&cs=tinysrgb&w=800',
    category: 'fresh-meat',
    rating: 4.9,
    inStock: true,
    features: ['وجبة عائلية', 'سعر خاص', 'دجاج مشوي', 'بطاطس', 'مشروب'],
  },
  {
    id: 32,
    name: 'عرض توفير: 5 برجر + 5 مشروب',
    description: 'استمتع مع أصدقائك بـ 5 برجر لحم مع 5 مشروبات غازية بسعر اقتصادي.',
    price: 350,
    discountPrice: 275,
    imageUrl: 'https://images.pexels.com/photos/2983101/pexels-photo-2983101.jpeg?auto=compress&cs=tinysrgb&w=800',
    category: 'fast-food',
    rating: 4.8,
    inStock: true,
    features: ['برجر لحم', 'مشروبات', 'سعر اقتصادي', 'وجبة جماعية'],
  },
  {
    id: 33,
    name: 'عرض مشاوي فاخر: كباب + كفتة + شيش طاووق + مشروب',
    description: 'تشكيلة مشاوي فاخرة (كباب، كفتة، شيش طاووق) مع مشروب عائلي بسعر خاص.',
    price: 420,
    discountPrice: 340,
    imageUrl: 'https://images.pexels.com/photos/410648/pexels-photo-410648.jpeg?auto=compress&cs=tinysrgb&w=800',
    category: 'vegetables',
    rating: 4.9,
    inStock: true,
    features: ['كباب', 'كفتة', 'شيش طاووق', 'مشروب', 'سعر خاص'],
  },
];

// الحصول على التصنيفات من التخزين المحلي أو استخدام الافتراضية
let productsData: Product[];
if (typeof window === 'undefined') {
  // بيئة Node (تشغيل سكريبت seed)
  productsData = defaultProducts;
} else {
  // استخدم المنتجات الافتراضية كقيمة مبدئية قبل جلب البيانات من Firestore
  productsData = defaultProducts;
}

// تصدير المتغيرات لتكون متاحة للاستيراد في ملفات أخرى
export const products = productsData;

// Update WhatsApp number with country code
export const whatsappNumber = '+201030557250';

export function generateWhatsAppMessage(items: Array<{ name: string; quantity: number }>) {
  const itemsList = items.map(item => `${item.quantity}x ${item.name}`).join('\n');
  return `مرحباً، أود طلب:\n${itemsList}`;
}

export function getProductsByCategory(categoryId: string): Product[] {
  return products.filter(product => product.category === categoryId);
}

export function getProductById(id: number): Product | undefined {
  return products.find(product => product.id === id);
}

export function getFeaturedProducts(): Product[] {
  return products.filter(
    product =>
      product.discountPrice !== undefined &&
      product.discountPrice !== null &&
      product.discountPrice < product.price
  );
}

// Improved search functionality with better indexing
export function searchProducts(query: string): Product[] {
  const searchTerm = query.toLowerCase().trim();
  
  // If search term is empty, return all products
  if (!searchTerm) return products;
  
  // Search in multiple fields with weighted relevance
  return products
    .map(product => {
      let score = 0;
      
      // Exact name match gets highest score
      if (product.name.toLowerCase() === searchTerm) score += 10;
      
      // Name contains search term
      if (product.name.toLowerCase().includes(searchTerm)) score += 5;
      
      // Description contains search term
      if (product.description.toLowerCase().includes(searchTerm)) score += 3;
      
      // Category match
      if (product.category.toLowerCase().includes(searchTerm)) score += 2;
      
      // Features match
      if (product.features?.some(feature => 
        feature.toLowerCase().includes(searchTerm)
      )) score += 1;
      
      return { product, score };
    })
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .map(item => item.product);
}