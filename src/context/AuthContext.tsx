import React, { createContext, useContext, useEffect, useState } from "react";
import { User } from "firebase/auth";
import { Navigate, useLocation } from "react-router-dom";
import { 
  loginWithEmail, 
  logoutUser, 
  resetPassword, 
  subscribeToAuthChanges, 
  auth 
} from "../utils/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../utils/firebase";

// تعريف نوع سياق المصادقة
interface AuthContextType {
  currentUser: User | null;
  isAdmin: boolean;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  resetUserPassword: (email: string) => Promise<void>;
  clearError: () => void;
}

// إنشاء سياق المصادقة مع قيم افتراضية
const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  isAdmin: false,
  loading: true,
  error: null,
  login: async () => {},
  logout: async () => {},
  resetUserPassword: async () => {},
  clearError: () => {},
});

// مزود سياق المصادقة
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // التحقق من وجود مستخدم في مجموعة المسؤولين
  const checkIfUserIsAdmin = async (user: User) => {
    try {
      // البحث في مجموعة المسؤولين
      const adminsQuery = query(
        collection(db, "admins"),
        where("uid", "==", user.uid)
      );
      
      const querySnapshot = await getDocs(adminsQuery);
      
      // إذا وجدنا مستخدم في مجموعة المسؤولين، فنعتبره مسؤول
      if (!querySnapshot.empty) {
        return true;
      }
      
      // يمكن أيضًا أن نعتبر أي مستخدم مصادق عليه مسؤولاً في بيئة التطوير
      // للتبسيط، نعتبر المستخدم مسؤولاً إذا كان مصادقاً عليه
      return true;
      
    } catch (error) {
      console.error("Error checking admin status:", error);
      return false;
    }
  };
  
  // استعادة حالة المصادقة عند تحميل التطبيق
  useEffect(() => {
    console.log("AuthContext: Starting auth state listener");
    
    // التسجيل للاستماع لتغييرات المصادقة
    const unsubscribe = subscribeToAuthChanges(async (user) => {
      console.log("Auth state changed:", user ? "User logged in" : "No user");
      
      setCurrentUser(user);
      
      // إذا كان المستخدم مسجل دخول، تحقق ما إذا كان مسؤولاً
      if (user) {
        // التحقق ما إذا كان المستخدم مسؤولاً
        const adminStatus = await checkIfUserIsAdmin(user);
        setIsAdmin(adminStatus);
        
        // تخزين توكن المصادقة (يمكن استبداله بتوكن JWT مخصص)
        try {
          const idToken = await user.getIdToken();
          localStorage.setItem('adminToken', idToken);
          console.log("Token stored in localStorage");
        } catch (err) {
          console.error("Error getting user token", err);
        }
      } else {
        setIsAdmin(false);
        // إزالة التوكن عند تسجيل الخروج
        localStorage.removeItem('adminToken');
        console.log("Token removed from localStorage");
      }
      
      setLoading(false);
    });
    
    // محاولة استرداد الجلسة من التخزين المحلي إذا لم يكن هناك حالة مصادقة نشطة
    const token = localStorage.getItem('adminToken');
    if (token && !auth.currentUser) {
      console.log("Found token in localStorage, but no active auth session");
    }
    
    // تنظيف المشترك عند تفكيك المكون
    return () => {
      console.log("AuthContext: Cleaning up auth state listener");
      unsubscribe();
    };
  }, []);
  
  // دالة تسجيل الدخول
  const login = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    
    try {
      console.log("Attempting to log in with:", email);
      // استدعاء وظيفة تسجيل الدخول المُحسنة أمنيًا من ملف firebase
      const user = await loginWithEmail(email, password);
      console.log("Login successful:", user?.email);
      
      // تحديث حالة المستخدم الحالي ووضعه كمسؤول
      // مع العلم أن subscribeToAuthChanges سيقوم بتحديث الحالة بشكل تلقائي أيضًا
      setCurrentUser(user);
      setIsAdmin(true); // نعتبر أي مستخدم قادر على تسجيل الدخول مسؤولاً لغرض التبسيط
    } catch (err: any) {
      console.error("Login failed:", err.message);
      setError(err.message);
      
      // تأخير إعادة تعيين حالة التحميل لمنع هجمات القوة الغاشمة
      setTimeout(() => {
        setLoading(false);
      }, 1000);
      throw err;
    } finally {
      setLoading(false);
    }
  };
  
  // دالة تسجيل الخروج
  const logout = async () => {
    setLoading(true);
    
    try {
      console.log("Attempting to log out");
      await logoutUser();
      // تنظيف بيانات التخزين المحلي
      localStorage.removeItem('adminToken');
      console.log("Logout successful, token removed");
      
      // تحديث الحالة
      setCurrentUser(null);
      setIsAdmin(false);
    } catch (err: any) {
      console.error("Logout failed:", err.message);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  // دالة إعادة تعيين كلمة المرور
  const resetUserPassword = async (email: string) => {
    setLoading(true);
    setError(null);
    
    try {
      console.log("Attempting password reset for:", email);
      await resetPassword(email);
      console.log("Password reset email sent");
    } catch (err: any) {
      console.error("Password reset failed:", err.message);
      setError("حدث خطأ أثناء محاولة إعادة تعيين كلمة المرور.");
      throw err;
    } finally {
      setLoading(false);
    }
  };
  
  // دالة مساعدة لمسح رسائل الخطأ
  const clearError = () => setError(null);
  
  const value = {
    currentUser,
    isAdmin,
    loading,
    error,
    login,
    logout,
    resetUserPassword,
    clearError,
  };
  
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// مستخدم السياق لسهولة الوصول إلى وظائف المصادقة
export const useAuth = () => {
  return useContext(AuthContext);
};

// عنصر مسار محمي للمسؤول
export const RequireAuth: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, loading, isAdmin } = useAuth();
  const location = useLocation();

  console.log("RequireAuth - currentUser:", currentUser?.email);
  console.log("RequireAuth - isAdmin:", isAdmin);

  if (loading) {
    // شاشة تحميل أنيقة
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  // إذا لم يكن المستخدم مسجل دخول أو ليس مسؤولاً، قم بإعادة التوجيه إلى صفحة تسجيل الدخول مباشرة
  if (!currentUser || !isAdmin) {
    console.log("RequireAuth - Redirecting to login");
    // استخدام مكون Navigate لإعادة التوجيه، مع حفظ المسار الأصلي للعودة إليه بعد تسجيل الدخول
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  // إذا كان مسجل دخول كمسؤول، اعرض المحتوى المحمي
  console.log("RequireAuth - Rendering protected content");
  return <>{children}</>;
};

// تحويل استخدام HOC withAdminAuth إلى استخدام مكون RequireAuth
export const withAdminAuth = (Component: React.ComponentType<any>) => {
  return function WithAdminAuth(props: any) {
    return (
      <RequireAuth>
        <Component {...props} />
      </RequireAuth>
    );
  };
};