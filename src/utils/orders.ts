import { db } from './firebase';
import { collection, addDoc, Timestamp } from 'firebase/firestore';

export interface OrderProduct {
  id: string;
  name: string;
  quantity: number;
  price: number;
}

export interface OrderData {
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  products: OrderProduct[];
  createdAt?: any;
}

export async function createOrder(order: OrderData) {
  const ordersCol = collection(db, 'orders');
  await addDoc(ordersCol, {
    ...order,
    createdAt: Timestamp.now(),
  });
}
