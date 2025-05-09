import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail, 
  createUserWithEmailAndPassword,
  updatePassword,
  User,
  AuthErrorCodes
} from "firebase/auth";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDaBAVvrkWEJZrdqiLrsJM5cLx1Amf62wE",
  authDomain: "s7teen-68a7e.firebaseapp.com",
  projectId: "s7teen-68a7e",
  storageBucket: "s7teen-68a7e.appspot.com",
  messagingSenderId: "651526692574",
  appId: "1:651526692574:web:25e7316d6b52ce77c42c4f",
  measurementId: "G-FCVGDMM0N2"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

// تسجيل محاولات تسجيل الدخول لأغراض الأمان والمراقبة
export const logLoginAttempt = async (email: string, success: boolean, ipAddress?: string, userAgent?: string) => {
  try {
    await addDoc(collection(db, "login_logs"), {
      email,
      success,
      timestamp: serverTimestamp(),
      ipAddress: ipAddress || "unknown",
      userAgent: userAgent || "unknown"
    });
  } catch (error) {
    console.error("Error logging login attempt:", error);
  }
};

// دالة تسجيل الدخول مع تعزيزات أمنية
export const loginWithEmail = async (email: string, password: string) => {
  try {
    // التحقق من صحة البريد الإلكتروني باستخدام تعبير منتظم بسيط
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error("البريد الإلكتروني غير صالح");
    }
    
    // التحقق من طول كلمة المرور
    if (password.length < 6) {
      throw new Error("كلمة المرور قصيرة جدًا");
    }

    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    
    // تسجيل محاولة تسجيل الدخول الناجحة
    await logLoginAttempt(email, true, 
      typeof window !== 'undefined' ? (window.navigator.userAgent || "") : "");
    
    return userCredential.user;
  } catch (error: any) {
    // تسجيل محاولة تسجيل الدخول الفاشلة
    await logLoginAttempt(email, false, 
      typeof window !== 'undefined' ? (window.navigator.userAgent || "") : "");
    
    // تحليل نوع الخطأ وإرجاع رسالة خطأ محددة بناءً على ذلك
    console.error("Login error:", error.code, error.message);
    
    // تخصيص رسائل الخطأ بناءً على رمز الخطأ من Firebase
    switch (error.code) {
      case 'auth/user-not-found':
        throw new Error("البريد الإلكتروني غير مسجل في النظام");
      case 'auth/wrong-password':
        throw new Error("كلمة المرور غير صحيحة");
      case 'auth/invalid-email':
        throw new Error("البريد الإلكتروني غير صالح");
      case 'auth/user-disabled':
        throw new Error("تم تعطيل هذا الحساب");
      case 'auth/too-many-requests':
        throw new Error("تم تجاوز عدد محاولات تسجيل الدخول المسموح بها. الرجاء المحاولة لاحقًا");
      case 'auth/invalid-credential':
        throw new Error("بيانات الدخول غير صحيحة. تأكد من البريد الإلكتروني وكلمة المرور");
      case 'auth/network-request-failed':
        throw new Error("حدث خطأ في الاتصال بالشبكة. تأكد من اتصالك بالإنترنت");
      default:
        throw new Error("فشل تسجيل الدخول. يرجى التحقق من بيانات الاعتماد الخاصة بك");
    }
  }
};

// وظائف أمان إضافية
export const resetPassword = (email: string) => {
  return sendPasswordResetEmail(auth, email);
};

export const logoutUser = () => {
  return signOut(auth);
};

// وظيفة للاستماع لتغييرات حالة المصادقة
export const subscribeToAuthChanges = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};

// وظيفة لإنشاء مستخدم مسؤول جديد (يجب استخدامها فقط من قبل المسؤولين الحاليين)
export const createAdmin = async (email: string, password: string) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    // يمكن إضافة المستخدم إلى مجموعة المسؤولين في Firestore
    await addDoc(collection(db, "admins"), {
      uid: userCredential.user.uid,
      email: email,
      createdAt: serverTimestamp()
    });
    return userCredential.user;
  } catch (error) {
    console.error("Error creating admin:", error);
    throw error;
  }
};

// وظيفة لتغيير كلمة المرور
export const changePassword = async (user: User, newPassword: string) => {
  try {
    await updatePassword(user, newPassword);
    return true;
  } catch (error) {
    console.error("Error updating password:", error);
    throw error;
  }
};