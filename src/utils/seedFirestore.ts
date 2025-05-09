// سكريبت نقل وتعديل معرفات التصنيفات وتحديث المنتجات المرتبطة بها
import { db } from './firebase';
import { collection, getDocs, setDoc, doc, deleteDoc, updateDoc } from 'firebase/firestore';

const categoryIdMap = {
  'fast-food': 'لحوم',
  'fresh-meat': 'دجاج',
  'vegetables': 'خضراوات',
  'fresh-kfc': 'دجاج',
};
const categoryNameMap = {
  'لحوم': 'مصنعات اللحوم',
  'دجاج': 'مصنعات الدواجن',
  'خضراوات': 'الخضراوات',
};

async function migrateCategoriesAndProducts() {
  // جلب جميع التصنيفات
  const categoriesCol = collection(db, 'categories');
  const categoriesSnapshot = await getDocs(categoriesCol);
  for (const catSnap of categoriesSnapshot.docs) {
    const oldId = catSnap.id;
    const newId = categoryIdMap[oldId];
    if (newId) {
      const data = catSnap.data();
      // أنشئ التصنيف الجديد بالمعرف الجديد
      await setDoc(doc(categoriesCol, newId), {
        name: categoryNameMap[newId],
        imageUrl: data.imageUrl,
      });
      // احذف التصنيف القديم
      await deleteDoc(doc(categoriesCol, oldId));
      console.log(`تم نقل التصنيف ${oldId} → ${newId}`);
    }
  }

  // جلب جميع المنتجات وتحديث category
  const productsCol = collection(db, 'products');
  const productsSnapshot = await getDocs(productsCol);
  for (const prodSnap of productsSnapshot.docs) {
    const data = prodSnap.data();
    const oldCat = data.category;
    const newCat = categoryIdMap[oldCat];
    if (newCat) {
      await updateDoc(doc(productsCol, prodSnap.id), { category: newCat });
      console.log(`تم تحديث منتج ${prodSnap.id}: category → ${newCat}`);
    }
  }
}

async function seedPromotions() {
  // العروض هي المنتجات التي لها discountPrice
  const productsCol = collection(db, 'products');
  const productsSnapshot = await getDocs(productsCol);
  for (const prodSnap of productsSnapshot.docs) {
    const data = prodSnap.data();
    if (data.discountPrice !== undefined && data.discountPrice !== null) {
      // أضف العرض إلى مجموعة جديدة اسمها 'promotions'
      await setDoc(doc(collection(db, 'promotions'), prodSnap.id), {
        productId: prodSnap.id,
        name: data.name,
        description: data.description,
        price: data.price,
        discountPrice: data.discountPrice,
        imageUrl: data.imageUrl,
        category: data.category,
        inStock: data.inStock,
        features: data.features,
        rating: data.rating,
      });
      console.log(`تمت إضافة العرض للمنتج: ${data.name}`);
    }
  }
}

async function main() {
  await migrateCategoriesAndProducts();
  await seedPromotions();
  console.log('تم نقل وتعديل معرفات التصنيفات وتحديث المنتجات وإدراج العروض بنجاح!');
}

main().catch(console.error);
