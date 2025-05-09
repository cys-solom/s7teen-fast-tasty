import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, AlertCircle, Lock, Mail, XCircle, Settings } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import CircleLogo from '../../components/ui/CircleLogo';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [lockTimer, setLockTimer] = useState(0);
  const [localError, setLocalError] = useState<string | null>(null);
  const { login, error, loading, clearError } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const from = location.state?.from?.pathname || "/admin/dashboard";

  // تحقق من وجود حظر مؤقت مخزن
  useEffect(() => {
    const lockedUntil = localStorage.getItem('adminLoginLockedUntil');
    if (lockedUntil && Number(lockedUntil) > Date.now()) {
      setIsLocked(true);
      setLockTimer(Math.ceil((Number(lockedUntil) - Date.now()) / 1000));
    }
    
    // استرداد بريد المستخدم المحفوظ إذا كان متاحاً
    const savedEmail = localStorage.getItem('adminEmail');
    if (savedEmail) {
      setEmail(savedEmail);
    }
  }, []);

  // عداد تنازلي للحظر المؤقت
  useEffect(() => {
    if (isLocked && lockTimer > 0) {
      const timer = setTimeout(() => {
        setLockTimer(lockTimer - 1);
      }, 1000);
      
      return () => clearTimeout(timer);
    } else if (isLocked && lockTimer <= 0) {
      setIsLocked(false);
      localStorage.removeItem('adminLoginLockedUntil');
    }
  }, [isLocked, lockTimer]);

  // مسح الخطأ عند تغيير البيانات المدخلة
  useEffect(() => {
    if (localError) setLocalError(null);
    if (error) clearError();
  }, [email, password]); // تم تغيير الاعتماديات هنا

  // تأكد من أن الأخطاء تظهر في الواجهة
  useEffect(() => {
    // تسجيل حالة الأخطاء في وحدة التحكم للتشخيص
    // console.log("Errors state:", { localError, contextError: error }); // Kept for debugging if needed
  }, [localError, error]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // التحقق من الحظر المؤقت
    if (isLocked) return;
    
    // إعادة تعيين رسائل الخطأ
    clearError();
    setLocalError(null);
    
    // التحقق الأساسي من المدخلات
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setLocalError("يرجى إدخال بريد إلكتروني صالح");
      return;
    }
    
    try {
        console.log("Attempting to login with:", email, "password:", password ? "[PROVIDED]" : "[EMPTY]");
        await login(email, password);
        
        localStorage.removeItem('adminEmail'); // Always remove adminEmail on new login attempt if it was previously stored by old logic
        
        // إعادة تعيين محاولات تسجيل الدخول
        setLoginAttempts(0);
        localStorage.removeItem('adminLoginAttempts');
        
        // الانتقال إلى لوحة التحكم أو المسار الذي كان المستخدم يحاول الوصول إليه
        navigate(from, { replace: true });
    } catch (err: any) {
      console.error("Login error object:", err); // Enhanced logging for the entire error object

      let determinedErrorMessage: string;

      if (err && err.code) { // Check for Firebase/backend-specific error codes
        switch (err.code) {
          case 'auth/user-not-found':
          case 'auth/wrong-password':
          case 'auth/invalid-credential':
          case 'auth/invalid-email':
          case 'auth/user-disabled':
            determinedErrorMessage = "البريد الإلكتروني أو كلمة المرور التي أدخلتها غير صحيحة. يرجى التحقق والمحاولة مرة أخرى.";
            break;
          case 'auth/too-many-requests':
            determinedErrorMessage = "تم حظر محاولات تسجيل الدخول مؤقتًا بسبب كثرة المحاولات الفاشلة. يرجى المحاولة مرة أخرى لاحقًا.";
            break;
          default:
            // For other known codes, use its message if available, else a generic code message
            if (err.message && typeof err.message === 'string' && err.message.trim() !== '') {
              determinedErrorMessage = err.message;
            } else {
              determinedErrorMessage = `حدث خطأ غير متوقع (رمز: ${err.code}). يرجى المحاولة مرة أخرى.`;
            }
            break;
        }
      } else if (err && err.message && typeof err.message === 'string' && err.message.trim() !== '') {
        // Fallback to err.message if no code but message exists and is non-empty
        const lowerCaseMessage = err.message.toLowerCase();
        if (lowerCaseMessage.includes('invalid credential') ||
            lowerCaseMessage.includes('user not found') ||
            lowerCaseMessage.includes('wrong password')) {
            determinedErrorMessage = "البريد الإلكتروني أو كلمة المرور التي أدخلتها غير صحيحة. يرجى التحقق والمحاولة مرة أخرى.";
        } else {
            determinedErrorMessage = err.message; // Use the message as is
        }
      } else {
        // Generic fallback if no specific error information is available
        determinedErrorMessage = "حدث خطأ أثناء محاولة تسجيل الدخول. يرجى التحقق والمحاولة مرة أخرى.";
      }
      
      setLocalError(determinedErrorMessage);
      
      // زيادة عداد المحاولات الفاشلة
      const newAttempts = loginAttempts + 1;
      setLoginAttempts(newAttempts);
      localStorage.setItem('adminLoginAttempts', String(newAttempts));
      
      // تطبيق الحظر المؤقت بعد 5 محاولات فاشلة
      if (newAttempts >= 5) {
        // حساب مدة الحظر - تزداد مع كل محاولة فاشلة إضافية
        const lockDuration = Math.min(30, Math.pow(2, newAttempts - 5)) * 1000; // بالمللي ثانية
        const lockedUntil = Date.now() + lockDuration;
        
        localStorage.setItem('adminLoginLockedUntil', String(lockedUntil));
        setIsLocked(true);
        setLockTimer(Math.ceil(lockDuration / 1000));
      }
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  // Variants for page elements
  const pageVariants = {
    initial: { opacity: 0 },
    animate: { opacity: 1, transition: { duration: 0.5 } },
    exit: { opacity: 0, transition: { duration: 0.3 } }
  };

  const cardVariants = {
    initial: { opacity: 0, y: 50, scale: 0.95 },
    animate: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 100, damping: 20, delay: 0.2 } },
    exit: { opacity: 0, y: 30, scale: 0.95, transition: { duration: 0.2 } }
  };
  
  const formElementVariants = {
    initial: { opacity: 0, x: -20 },
    animate: { opacity: 1, x: 0, transition: { type: "spring", stiffness: 120, damping: 15 } },
  };

  // Gear properties for background animation
  const gears = [
    { id: 1, size: "120px", opacity: 0.1, duration: 10, top: "10%", left: "5%", delay: 0 },
    { id: 2, size: "80px", opacity: 0.08, duration: 15, top: "20%", left: "80%", delay: 0.5 },
    { id: 3, size: "150px", opacity: 0.12, duration: 12, top: "70%", left: "15%", delay: 0.2 },
    { id: 4, size: "60px", opacity: 0.07, duration: 18, top: "80%", left: "70%", delay: 0.8 },
    { id: 5, size: "100px", opacity: 0.09, duration: 9, top: "40%", left: "45%", delay: 0.3 },
    { id: 6, size: "70px", opacity: 0.06, duration: 20, top: "5%", left: "30%", delay: 1 },
    { id: 7, size: "90px", opacity: 0.08, duration: 13, top: "60%", left: "90%", delay: 0.6 },
  ];

  return (
    <motion.div 
      className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-800 flex items-center justify-center p-4 font-sans overflow-hidden relative"
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      {/* Animated Gears Background */}
      {gears.map(gear => (
        <motion.div
          key={gear.id}
          className="absolute text-slate-700"
          style={{
            width: gear.size,
            height: gear.size,
            top: gear.top,
            left: gear.left,
            opacity: gear.opacity,
          }}
          animate={{ rotate: 360 }}
          transition={{
            duration: gear.duration,
            repeat: Infinity,
            ease: "linear",
            delay: gear.delay,
          }}
        >
          <Settings className="w-full h-full" />
        </motion.div>
      ))}

      <motion.div
        className="w-full max-w-md relative z-10" // Ensure card is above gears
        variants={cardVariants}
        // initial, animate, exit are inherited from parent if not specified, but good to be explicit for card
      >
        <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-2xl overflow-hidden">
          <div className="p-8 md:p-10">
            <motion.div 
              className="text-center mb-8"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0, transition: { delay: 0.3, type: "spring", stiffness:100 } }}
            >
              <div className="inline-block mb-3"> {/* Adjusted margin */}
                <CircleLogo size="60px" className="mx-auto" /> {/* Slightly smaller logo */}
              </div>
              <h1 className="text-xl md:text-2xl font-bold text-slate-700"> {/* Adjusted text and styling */}
                تسجيل الدخول إلى لوحة التحكم
              </h1>
              <p className="text-sm text-slate-500 mt-1.5"> {/* Adjusted margin and text */}
                أهلاً بك! يرجى إدخال بيانات الاعتماد الخاصة بك
              </p>
            </motion.div>
            
            <AnimatePresence>
              {(error || localError) && (
                <motion.div 
                  className="mb-5 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg flex items-center text-sm"
                  initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                  animate={{ opacity: 1, height: 'auto', marginBottom: '1.25rem' }}
                  exit={{ opacity: 0, height: 0, marginBottom: 0, transition: { duration: 0.2 } }}
                  key="error-message"
                >
                  <AlertCircle size={18} className="ml-2 flex-shrink-0 text-red-500" />
                  <div className="flex-grow text-right">
                    <p>{localError || error || "البريد الإلكتروني أو كلمة المرور التي أدخلتها غير صحيحة. يرجى التحقق والمحاولة مرة أخرى."}</p>
                  </div>
                  <button 
                    onClick={() => { clearError(); setLocalError(null); }} 
                    className="text-red-500 hover:text-red-700 mr-2 p-1 rounded-full hover:bg-red-100 transition-colors"
                  >
                    <XCircle size={16} />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
            
            <AnimatePresence>
              {isLocked && (
                <motion.div 
                  className="mb-5 p-3 bg-yellow-50 border border-yellow-300 text-yellow-600 rounded-lg text-sm text-right"
                  initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                  animate={{ opacity: 1, height: 'auto', marginBottom: '1.25rem' }}
                  exit={{ opacity: 0, height: 0, marginBottom: 0, transition: { duration: 0.2 } }}
                >
                  تم تعليق تسجيل الدخول مؤقتًا لأسباب أمنية.
                  <p className="font-semibold">
                    يرجى المحاولة مرة أخرى بعد {lockTimer} ثانية.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleSubmit} className="space-y-5">
              <motion.div variants={formElementVariants} initial="initial" animate="animate" custom={0}>
                <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1 text-right">
                  البريد الإلكتروني
                </label>
                <div className="relative">
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                    <Mail size={18} />
                  </span>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full px-3 py-2.5 pr-10 rounded-md border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors duration-150 text-right placeholder-slate-400 bg-white/80"
                    placeholder="example@company.com"
                    disabled={loading || isLocked}
                    dir="rtl"
                  />
                </div>
              </motion.div>

              <AnimatePresence mode="wait">
                  <motion.div
                    key="password-input"
                    variants={formElementVariants}
                    initial="initial"
                    animate="animate"
                    exit={{ opacity: 0, x: 20, transition: { duration: 0.2 } }}
                    custom={1}
                  >
                    <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1 text-right">
                      كلمة المرور
                    </label>
                    <div className="relative">
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                        <Lock size={18} />
                      </span>
                      <input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="w-full px-3 py-2.5 pr-10 rounded-md border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors duration-150 text-right placeholder-slate-400 bg-white/80"
                        placeholder="••••••••"
                        disabled={loading || isLocked}
                        dir="rtl"
                      />
                      <button
                        type="button"
                        onClick={togglePasswordVisibility}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-blue-600 p-1 transition-colors duration-150 rounded-full hover:bg-slate-100"
                        disabled={loading}
                        aria-label={showPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </motion.div>
              </AnimatePresence>

              <motion.div variants={formElementVariants} initial="initial" animate="animate" custom={3} className="pt-2">
                <button
                  type="submit"
                  disabled={loading || isLocked}
                  className={`w-full py-3 px-4 rounded-lg text-white font-semibold transition-all duration-150 flex items-center justify-center 
                    ${loading || isLocked ? 'bg-slate-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'}`}
                >
                  {loading ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="ml-2 h-5 w-5 border-2 border-transparent border-t-white rounded-full"
                      />
                      <span>جاري التحميل...</span>
                    </>
                  ) : 'تسجيل الدخول'}
                </button>
              </motion.div>
            </form>
          </div>
        </div>
      </motion.div>
      
      <footer className="absolute bottom-4 text-center text-xs text-slate-400/70 w-full z-0">
        &copy; {new Date().getFullYear()} صحتين | جميع الحقوق محفوظة
      </footer>

    </motion.div>
  );
};

export default LoginPage;