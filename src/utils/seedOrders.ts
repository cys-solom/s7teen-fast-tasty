import { db } from './firebase';
import { collection, addDoc, Timestamp } from 'firebase/firestore';

// بيانات طلب تجريبية (يمكنك تعديلها أو تكرارها)
const sampleOrder = {
  customerName: 'عميل تجريبي',
  customerPhone: '01000000000',
  customerAddress: 'القاهرة - مدينة نصر - شارع مثال',
  products: [
    { id: '1', name: 'بانيه جاهز', quantity: 2, price: 120 },
    { id: '3', name: 'ورق كرنب', quantity: 1, price: 45 }
  ],
  createdAt: Timestamp.now(),
};

async function seedOrders() {
  await addDoc(collection(db, 'orders'), sampleOrder);
  console.log('تم رفع طلب تجريبي إلى قاعدة البيانات.');
}

seedOrders().catch(console.error);
