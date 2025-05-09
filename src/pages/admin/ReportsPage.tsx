import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { 
  collection, 
  getDocs, 
  query, 
  addDoc, 
  orderBy, 
  Timestamp, 
  doc, 
  deleteDoc,
  setDoc 
} from 'firebase/firestore';
import { db } from '../../utils/firebase';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  PointElement, 
  BarElement, 
  LineElement,
  Title, 
  Tooltip, 
  Legend, 
  ArcElement
} from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';
import { format, subDays, subMonths, parseISO, eachDayOfInterval, isValid } from 'date-fns';
import { arSA } from 'date-fns/locale';
// استيراد أدوات تصدير الإكسل المحسنة
import { exportDataToExcel, HeaderLevel, ColumnType, COLORS } from '../../utils/excelExport';

// تسجيل مكونات Chart.js المطلوبة
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  BarElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

interface TopSellingProduct {
  id: string;
  name: string;
  sales: number;
  revenue: number;
}

interface DailyRevenue {
  date: string;
  revenue: number;
  orders: number;
}

interface RevenueByCategory {
  category: string;
  revenue: number;
}

interface DailyOrderDetails {
  id: string;
  time: string;
  customerName: string;
  totalAmount: number;
  status: string;
  items: number;
}

const ReportsPage: React.FC = () => {
  // الحالات الرئيسية
  const [topSellingProducts, setTopSellingProducts] = useState<TopSellingProduct[]>([]);
  const [dailyRevenue, setDailyRevenue] = useState<DailyRevenue[]>([]);
  const [revenueByCategory, setRevenueByCategory] = useState<RevenueByCategory[]>([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalOrders, setTotalOrders] = useState(0);
  const [averageOrderValue, setAverageOrderValue] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  
  // استرداد حالة تعطيل التقارير الآلية من التخزين المحلي
  const [disableAutoReporting, setDisableAutoReporting] = useState<boolean>(() => {
    const savedValue = localStorage.getItem('disableAutoReporting');
    return savedValue ? JSON.parse(savedValue) === true : false;
  });
  
  // حفظ حالة تعطيل التقارير في التخزين المحلي عند تغييرها
  useEffect(() => {
    localStorage.setItem('disableAutoReporting', JSON.stringify(disableAutoReporting));
  }, [disableAutoReporting]);
  
  // إعدادات الفترة الزمنية
  const [period, setPeriod] = useState<'week' | 'month' | 'year' | 'custom' | 'day'>('month');
  const [startDate, setStartDate] = useState<string>(format(subMonths(new Date(), 1), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [selectedDay, setSelectedDay] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  
  // تفاصيل المبيعات اليومية
  const [showDailyDetails, setShowDailyDetails] = useState(false);
  const [dailyOrderDetails, setDailyOrderDetails] = useState<DailyOrderDetails[]>([]);
  const [selectedDayTotalRevenue, setSelectedDayTotalRevenue] = useState(0);
  const [selectedDayOrderCount, setSelectedDayOrderCount] = useState(0);
  const [dailyTopProducts, setDailyTopProducts] = useState<TopSellingProduct[]>([]);

  // فترة زمنية للتقارير المفصلة بالساعة 
  const [hourlyData, setHourlyData] = useState<{hour: string, revenue: number, orders: number}[]>([]);

  // للتحديث التلقائي
  const [autoRefresh, setAutoRefresh] = useState(false);
  const autoRefreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // دالة لجلب التقارير من قاعدة البيانات
  const fetchReports = useCallback(async () => {
    setIsLoading(true);
    try {
      // تحديد الفترة الزمنية بناءً على الفلتر
      let startDateObj = new Date();
      let endDateObj = new Date();
      
      switch (period) {
        case 'day':
          const selectedDayDate = parseISO(selectedDay);
          if (isValid(selectedDayDate)) {
            startDateObj = selectedDayDate;
            endDateObj = new Date(selectedDayDate);
            endDateObj.setHours(23, 59, 59, 999);
          }
          break;
        case 'week':
          startDateObj = subDays(new Date(), 7);
          break;
        case 'month':
          startDateObj = subMonths(new Date(), 1);
          break;
        case 'year':
          startDateObj = subMonths(new Date(), 12);
          break;
        case 'custom':
          startDateObj = parseISO(startDate);
          endDateObj = parseISO(endDate);
          // تعيين وقت نهاية اليوم لتاريخ النهاية
          endDateObj.setHours(23, 59, 59, 999);
          break;
      }
      
      // جلب الطلبات
      const ordersCol = collection(db, 'orders');
      let ordersQuery;
      
      try {
        // تحقق من وجود حقل التاريخ في المستندات
        ordersQuery = query(
          ordersCol,
          orderBy('createdAt', 'desc')
        );
      } catch (error) {
        console.error("Error creating query:", error);
        // استخدام استعلام بدون فلتر إذا لم يكن هناك حقل تاريخ
        ordersQuery = query(ordersCol);
      }
      
      const ordersSnapshot = await getDocs(ordersQuery);
      
      // إعداد البيانات
      const salesMap: Record<string, { name: string; sales: number; revenue: number }> = {};
      const categoryRevenueMap: Record<string, number> = {};
      const dailyRevenueMap: Record<string, { revenue: number; orders: number }> = {};
      
      // للتحليل حسب الساعة
      const hourlyRevenueMap: Record<string, { revenue: number; orders: number }> = {};
      for (let i = 0; i < 24; i++) {
        const hour = i.toString().padStart(2, '0');
        hourlyRevenueMap[hour] = { revenue: 0, orders: 0 };
      }
      
      let total = 0;
      let orders = 0;
      
      // للتفاصيل اليومية
      const dailyOrders: DailyOrderDetails[] = [];
      const dailySalesMap: Record<string, { name: string; sales: number; revenue: number }> = {};
      let dailyTotal = 0;
      let dailyOrderCount = 0;
      
      // إنشاء مصفوفة بجميع أيام الفترة الزمنية المحددة
      const dateRange = eachDayOfInterval({ 
        start: startDateObj, 
        end: endDateObj 
      });
      
      // تهيئة مصفوفة الإيرادات اليومية بصفر لكل يوم
      dateRange.forEach(date => {
        const formattedDate = format(date, 'yyyy-MM-dd');
        dailyRevenueMap[formattedDate] = { revenue: 0, orders: 0 };
      });
      
      // معالجة بيانات الطلبات
      ordersSnapshot.docs.forEach(docSnap => {
        const order = docSnap.data();
        
        // تحويل Timestamp إلى تاريخ - تحسين التعامل مع التواريخ المختلفة
        let orderDate = new Date();
        if (order.createdAt instanceof Timestamp) {
          orderDate = order.createdAt.toDate();
        } else if (order.date instanceof Timestamp) {
          orderDate = order.date.toDate();
        } else if (order.date) {
          orderDate = new Date(order.date);
        } else if (order.createdAt) {
          // محاولة قراءة التاريخ كنص إذا لم يكن timestamp
          orderDate = new Date(order.createdAt);
        }
        
        const formattedDate = format(orderDate, 'yyyy-MM-dd');
        const formattedTime = format(orderDate, 'HH:mm');
        const hourOnly = format(orderDate, 'HH');
        
        // تحقق من أن هذا الطلب يقع ضمن الفترة الزمنية المحددة
        const isInSelectedTimeframe = orderDate >= startDateObj && orderDate <= endDateObj;
        
        // إذا كان الطلب خارج نطاق الفترة المحددة، فتخطيه
        if (!isInSelectedTimeframe) {
          return; // تخطي هذا الطلب
        }
        
        // زيادة عدد الطلبات فقط إذا كان الطلب ضمن الفترة المحددة
        orders++;
        
        // إجمالي قيمة الطلب
        let orderTotal = 0;
        let itemCount = 0;
        
        if (order.products && Array.isArray(order.products)) {
          order.products.forEach((prod: any) => {
            // حساب إيرادات المنتج
            const price = prod.price || 0;
            const quantity = prod.quantity || 1;
            const productTotal = price * quantity;
            orderTotal += productTotal;
            itemCount += quantity;
            
            // إيرادات المنتجات الأكثر مبيعاً
            if (!salesMap[prod.id]) {
              salesMap[prod.id] = { name: prod.name, sales: 0, revenue: 0 };
            }
            salesMap[prod.id].sales += quantity;
            salesMap[prod.id].revenue += productTotal;
            
            // إيرادات التصنيفات
            const category = prod.category || 'غير مصنف';
            if (!categoryRevenueMap[category]) {
              categoryRevenueMap[category] = 0;
            }
            categoryRevenueMap[category] += productTotal;
            
            // للتفاصيل اليومية - إذا كان الطلب في اليوم المحدد
            if (period === 'day' && formattedDate === selectedDay) {
              if (!dailySalesMap[prod.id]) {
                dailySalesMap[prod.id] = { name: prod.name, sales: 0, revenue: 0 };
              }
              dailySalesMap[prod.id].sales += quantity;
              dailySalesMap[prod.id].revenue += productTotal;
            }
          });
        } else {
          // إذا كان الطلب لا يحتوي على منتجات، حاول استخدام إجمالي الطلب مباشرة
          if (order.totalAmount) {
            orderTotal = parseFloat(order.totalAmount) || 0;
          }
          // يمكن إضافة المزيد من المنطق هنا للتعامل مع هياكل الطلبات المختلفة
        }
        
        // إضافة إجمالي الطلب للإيرادات اليومية
        if (!dailyRevenueMap[formattedDate]) {
          dailyRevenueMap[formattedDate] = { revenue: 0, orders: 0 };
        }
        dailyRevenueMap[formattedDate].revenue += orderTotal;
        dailyRevenueMap[formattedDate].orders += 1;
        
        // إضافة إجمالي الطلب للإيرادات الكلية
        total += orderTotal;
        
        // إضافة معلومات الطلب للتفاصيل اليومية إذا كان في اليوم المحدد
        if (period === 'day' && formattedDate === selectedDay) {
          dailyTotal += orderTotal;
          dailyOrderCount++;
          
          // تحديث البيانات حسب الساعة
          if (hourlyRevenueMap[hourOnly]) {
            hourlyRevenueMap[hourOnly].revenue += orderTotal;
            hourlyRevenueMap[hourOnly].orders += 1;
          }
          
          dailyOrders.push({
            id: docSnap.id,
            time: formattedTime,
            customerName: order.customerName || order.name || 'عميل',
            totalAmount: orderTotal,
            status: order.status || 'مكتمل',
            items: itemCount
          });
        }
      });
      
      // تحويل بيانات المنتجات الأكثر مبيعاً إلى مصفوفة مرتبة
      const sortedProducts = Object.entries(salesMap)
        .map(([id, data]) => ({ 
          id, 
          name: data.name, 
          sales: data.sales, 
          revenue: data.revenue 
        }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10);
      
      // تحويل بيانات المنتجات اليومية الأكثر مبيعاً إلى مصفوفة مرتبة
      const sortedDailyProducts = Object.entries(dailySalesMap)
        .map(([id, data]) => ({ 
          id, 
          name: data.name, 
          sales: data.sales, 
          revenue: data.revenue 
        }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10);
      
      // تحويل بيانات الإيرادات حسب التصنيف إلى مصفوفة مرتبة
      const sortedCategories = Object.entries(categoryRevenueMap)
        .map(([category, revenue]) => ({ category, revenue }))
        .sort((a, b) => b.revenue - a.revenue);
      
      // تحويل بيانات الإيرادات اليومية إلى مصفوفة مرتبة
      const sortedDailyRevenue = Object.entries(dailyRevenueMap)
        .map(([date, data]) => ({
          date,
          revenue: data.revenue,
          orders: data.orders
        }))
        .sort((a, b) => a.date.localeCompare(b.date));
      
      // تحويل بيانات الإيرادات الساعية إلى مصفوفة مرتبة
      const sortedHourlyData = Object.entries(hourlyRevenueMap)
        .map(([hour, data]) => ({
          hour: `${hour}:00`,
          revenue: data.revenue,
          orders: data.orders
        }))
        .sort((a, b) => a.hour.localeCompare(b.hour));
      
      // تعيين البيانات
      setTopSellingProducts(sortedProducts);
      setRevenueByCategory(sortedCategories);
      setDailyRevenue(sortedDailyRevenue);
      setTotalRevenue(total);
      setTotalOrders(orders);
      setAverageOrderValue(orders > 0 ? total / orders : 0);
      
      // تعيين البيانات اليومية
      setDailyOrderDetails(dailyOrders.sort((a, b) => a.time.localeCompare(b.time)));
      setSelectedDayTotalRevenue(dailyTotal);
      setSelectedDayOrderCount(dailyOrderCount);
      setDailyTopProducts(sortedDailyProducts);
      setHourlyData(sortedHourlyData);
      
      // تسجيل تقرير جديد في قاعدة البيانات للاحتفاظ بسجل التقارير - فقط إذا لم يكن وضع منع التسجيل مفعلاً
      if (!disableAutoReporting) {
        await addDoc(collection(db, 'reportLogs'), {
          timestamp: Timestamp.now(),
          period,
          startDate: Timestamp.fromDate(startDateObj),
          endDate: Timestamp.fromDate(endDateObj),
          totalRevenue: total,
          totalOrders: orders,
          averageOrderValue: orders > 0 ? total / orders : 0,
        });
      }
      
    } catch (error) {
      console.error("Error fetching reports:", error);
    } finally {
      setIsLoading(false);
    }
  }, [period, startDate, endDate, selectedDay, disableAutoReporting]);
  
  // مع كل تغيير في الفترة الزمنية أو التواريخ، قم بجلب البيانات
  useEffect(() => {
    fetchReports();
  }, [fetchReports]);
  
  // إعداد التحديث التلقائي
  useEffect(() => {
    if (autoRefresh) {
      autoRefreshIntervalRef.current = setInterval(() => {
        fetchReports();
      }, 60000); // تحديث كل دقيقة
    } else if (autoRefreshIntervalRef.current) {
      clearInterval(autoRefreshIntervalRef.current);
      autoRefreshIntervalRef.current = null;
    }
    
    // تنظيف عند إزالة المكون
    return () => {
      if (autoRefreshIntervalRef.current) {
        clearInterval(autoRefreshIntervalRef.current);
      }
    };
  }, [autoRefresh, fetchReports]);
  
  // بيانات الرسم البياني للإيرادات اليومية
  const dailyRevenueChartData = {
    labels: dailyRevenue.map(day => format(parseISO(day.date), 'dd/MM', { locale: arSA })),
    datasets: [
      {
        label: 'الإيرادات اليومية',
        data: dailyRevenue.map(day => day.revenue),
        backgroundColor: 'rgba(53, 162, 235, 0.7)',
        borderColor: 'rgb(53, 162, 235)',
        borderWidth: 2,
        barThickness: 15, // عرض العمود
        categoryPercentage: 0.7, // نسبة عرض الفئة
        barPercentage: 0.9, // نسبة عرض الشريط
      },
    ],
  };
  
  // بيانات الرسم البياني للطلبات اليومية
  const dailyOrdersChartData = {
    labels: dailyRevenue.map(day => format(parseISO(day.date), 'dd/MM', { locale: arSA })),
    datasets: [
      {
        label: 'الطلبات اليومية',
        data: dailyRevenue.map(day => day.orders),
        backgroundColor: 'rgba(255, 99, 132, 0.7)',
        borderColor: 'rgb(255, 99, 132)',
        borderWidth: 2,
        barThickness: 15, // عرض العمود
        categoryPercentage: 0.7, // نسبة عرض الفئة
        barPercentage: 0.9, // نسبة عرض الشريط
      },
    ],
  };
  
  // بيانات الرسم البياني للمنتجات اليومية الأكثر مبيعاً
  const dailyTopProductsChartData = {
    labels: dailyTopProducts.map(product => product.name),
    datasets: [
      {
        label: 'إيرادات اليوم',
        data: dailyTopProducts.map(product => product.revenue),
        backgroundColor: 'rgba(153, 102, 255, 0.6)',
        borderColor: 'rgb(153, 102, 255)',
        borderWidth: 1,
      },
    ],
  };
  
  // خيارات الرسم بياني المشتركة
  const commonChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        rtl: true,
        labels: {
          font: {
            family: 'Cairo, sans-serif',
          },
        },
      },
      tooltip: {
        rtl: true,
        titleFont: {
          family: 'Cairo, sans-serif',
        },
        bodyFont: {
          family: 'Cairo, sans-serif',
        },
        callbacks: {
          label: function(context: any) {
            return `${context.dataset.label}: ${context.parsed.y} ج.م`;
          }
        }
      },
    },
    scales: {
      y: {
        type: 'linear' as const,
        beginAtZero: true,
        ticks: {
          font: {
            family: 'Cairo, sans-serif',
          },
          callback: function(tickValue: number | string) {
            return tickValue + ' ج.م';
          }
        },
      },
      x: {
        ticks: {
          font: {
            family: 'Cairo, sans-serif',
          }
        },
      },
    },
  };
  
  // خيارات رسم البياني للطلبات
  const ordersChartOptions = {
    ...commonChartOptions,
    scales: {
      ...commonChartOptions.scales,
      y: {
        type: 'linear' as const,
        beginAtZero: true,
        ticks: {
          font: {
            family: 'Cairo, sans-serif',
          },
          callback: function(tickValue: number | string) {
            return tickValue + ' طلب';
          }
        },
      }
    },
    plugins: {
      ...commonChartOptions.plugins,
      tooltip: {
        ...commonChartOptions.plugins.tooltip,
        callbacks: {
          label: function(context: any) {
            return `${context.dataset.label}: ${context.parsed.y} طلب`;
          }
        }
      }
    }
  };

  // التبديل إلى عرض تفاصيل اليوم المحدد
  const handleDayClick = (day: string) => {
    setSelectedDay(day);
    setPeriod('day');
    setShowDailyDetails(true);
  };
  
  // العودة من عرض تفاصيل اليوم
  const handleBackFromDailyView = () => {
    setShowDailyDetails(false);
    setPeriod('month'); // أو أي فترة كانت مختارة سابقًا
  };

  // إضافة حالة للتصدير
  const [isExporting, setIsExporting] = useState(false);
  // إضافة حالة لعملية المسح
  const [isClearing, setIsClearing] = useState(false);
  
  // دالة لمسح بيانات التحليلات
  const clearAnalyticsData = useCallback(async () => {
    if (window.confirm('هل أنت متأكد من رغبتك في مسح جميع بيانات التحليلات؟ هذا الإجراء لا يمكن التراجع عنه.')) {
      // إضافة خيار لمسح بيانات الطلبات أيضًا
      const shouldDeleteOrders = window.confirm('هل ترغب في مسح بيانات الطلبات أيضًا؟ (هذا سيؤثر على تاريخ المبيعات بالكامل)');
      
      setIsClearing(true);
      try {
        console.log("بدء عملية مسح بيانات التحليلات بالكامل...");
        
        // تعطيل إنشاء سجلات جديدة وتجنب قراءة البيانات من قاعدة البيانات
        setDisableAutoReporting(true);
        
        // 1. مسح سجلات التصدير
        console.log("جاري مسح سجلات التصدير...");
        const exportLogsRef = collection(db, 'exportLogs');
        const exportLogsSnapshot = await getDocs(exportLogsRef);
        
        console.log(`تم العثور على ${exportLogsSnapshot.size} سجل للتصدير`);
        const exportDeletePromises: Promise<void>[] = [];
        
        exportLogsSnapshot.docs.forEach(doc => {
          exportDeletePromises.push(deleteDoc(doc.ref));
        });
        
        // مسح جميع سجلات التصدير بالتوازي
        await Promise.all(exportDeletePromises);
        console.log("تم مسح سجلات التصدير بنجاح");
        
        // 2. مسح سجلات التقارير
        console.log("جاري مسح سجلات التقارير...");
        const reportLogsRef = collection(db, 'reportLogs');
        const reportLogsSnapshot = await getDocs(reportLogsRef);
        
        console.log(`تم العثور على ${reportLogsSnapshot.size} سجل للتقارير`);
        const reportDeletePromises: Promise<void>[] = [];
        
        reportLogsSnapshot.docs.forEach(doc => {
          reportDeletePromises.push(deleteDoc(doc.ref));
        });
        
        // مسح جميع سجلات التقارير بالتوازي
        await Promise.all(reportDeletePromises);
        console.log("تم مسح سجلات التقارير بنجاح");

        // 3. مسح سجلات المبيعات التحليلية (إذا كانت موجودة)
        console.log("جاري مسح سجلات المبيعات التحليلية...");
        const analyticsRef = collection(db, 'analytics');
        const analyticsSnapshot = await getDocs(analyticsRef);
        
        console.log(`تم العثور على ${analyticsSnapshot.size} سجل تحليلي`);
        const analyticsDeletePromises: Promise<void>[] = [];
        
        analyticsSnapshot.docs.forEach(doc => {
          analyticsDeletePromises.push(deleteDoc(doc.ref));
        });
        
        // مسح جميع سجلات التحليلات بالتوازي
        await Promise.all(analyticsDeletePromises);
        console.log("تم مسح سجلات المبيعات التحليلية بنجاح");

        // 4. مسح سجلات الإحصائيات العامة (إذا كانت موجودة)
        console.log("جاري مسح سجلات الإحصائيات العامة...");
        const statsRef = collection(db, 'stats');
        const statsSnapshot = await getDocs(statsRef);
        
        console.log(`تم العثور على ${statsSnapshot.size} سجل إحصائي`);
        const statsDeletePromises: Promise<void>[] = [];
        
        statsSnapshot.docs.forEach(doc => {
          statsDeletePromises.push(deleteDoc(doc.ref));
        });
        
        // مسح جميع سجلات الإحصائيات بالتوازي
        await Promise.all(statsDeletePromises);
        console.log("تم مسح سجلات الإحصائيات بنجاح");
        
        // مسح الطلبات إذا اختار المستخدم ذلك
        if (shouldDeleteOrders) {
          console.log("جاري مسح سجلات الطلبات...");
          const ordersRef = collection(db, 'orders');
          const ordersSnapshot = await getDocs(ordersRef);
          
          console.log(`تم العثور على ${ordersSnapshot.size} طلب`);
          const ordersDeletePromises: Promise<void>[] = [];
          
          ordersSnapshot.docs.forEach(doc => {
            ordersDeletePromises.push(deleteDoc(doc.ref));
          });
          
          // مسح جميع الطلبات بالتوازي
          await Promise.all(ordersDeletePromises);
          console.log("تم مسح سجلات الطلبات بنجاح");
        } else {
          console.log("تم تخطي مسح الطلبات بناءً على اختيار المستخدم");
        }
        
        // 5. إعادة تعيين الحالات والمتغيرات - تصفير جميع البيانات مباشرة بدلاً من إعادة تحميلها
        setTopSellingProducts([]);
        setDailyRevenue([]);
        setRevenueByCategory([]);
        setTotalRevenue(0);
        setTotalOrders(0);
        setAverageOrderValue(0);
        setDailyOrderDetails([]);
        setSelectedDayTotalRevenue(0);
        setSelectedDayOrderCount(0);
        setDailyTopProducts([]);
        setHourlyData([]);
        
        // 6. إعادة تهيئة الفترة الزمنية المحددة للبدء من جديد
        setPeriod('month');
        setStartDate(format(subMonths(new Date(), 1), 'yyyy-MM-dd'));
        setEndDate(format(new Date(), 'yyyy-MM-dd'));
        setSelectedDay(format(new Date(), 'yyyy-MM-dd'));
        setShowDailyDetails(false);
        
        console.log("تمت إعادة تعيين جميع حالات البيانات بنجاح");
        
        // تعطيل حفظ التقارير أثناء الجلسة الحالية
        const disableReportSavingRef = collection(db, 'settings');
        const settingsDoc = doc(disableReportSavingRef, 'reportSettings');
        
        // تحديث إعدادات التقارير لتعطيل حفظ التقارير مؤقتاً
        try {
          await setDoc(settingsDoc, {
            disableReportSaving: true,
            lastReset: Timestamp.now()
          }, { merge: true });
          console.log("تم تعطيل حفظ التقارير مؤقتاً");
        } catch (error) {
          console.log("لم يتم تعطيل حفظ التقارير، سيتم المتابعة بدون هذه الميزة");
        }
        
        alert(shouldDeleteOrders 
          ? 'تم مسح جميع بيانات التحليلات والطلبات بنجاح من قاعدة البيانات' 
          : 'تم مسح جميع بيانات التحليلات بنجاح من قاعدة البيانات (لم يتم مسح الطلبات)');
        
        // توقفنا عن إعادة تحميل البيانات، لأن هذا يسبب عودة البيانات
        // عند إعادة تحميل البيانات يتم حساب الإحصائيات من الطلبات الموجودة حتى لو كانت السجلات ممسوحة
        setIsClearing(false);
        
      } catch (error) {
        console.error("حدث خطأ أثناء مسح البيانات:", error);
        alert('حدث خطأ أثناء مسح البيانات: ' + (error instanceof Error ? error.message : String(error)));
        // إعادة تفعيل التسجيل التلقائي في حالة حدوث خطأ
        setDisableAutoReporting(false);
        setIsClearing(false);
      }
    }
  }, []);

  const [isRepairing, setIsRepairing] = useState(false);

  // وظيفة لإعادة إنشاء سجلات التقارير المحذوفة
  const repairReportLogs = useCallback(async () => {
    if (window.confirm('هل أنت متأكد من رغبتك في إعادة إنشاء سجلات التقارير المحذوفة؟')) {
      setIsRepairing(true);
      try {
        console.log("بدء عملية إعادة إنشاء سجلات التقارير...");
        
        // تحديد الفترات الزمنية المختلفة للتقارير
        const today = new Date();
        const periods = [
          { type: 'day', startDate: new Date(), endDate: new Date() },
          { type: 'week', startDate: subDays(today, 7), endDate: today },
          { type: 'month', startDate: subMonths(today, 1), endDate: today },
          { type: 'year', startDate: subMonths(today, 12), endDate: today },
        ];
        
        // الحصول على الطلبات
        const ordersRef = collection(db, 'orders');
        const ordersSnapshot = await getDocs(ordersRef);
        
        console.log(`تم العثور على ${ordersSnapshot.size} طلب لإعادة إنشاء سجلات التقارير`);
        
        // البدء في إعادة إنشاء سجلات التقارير
        if (ordersSnapshot.size > 0) {
          for (const period of periods) {
            console.log(`إنشاء سجل تقارير للفترة: ${period.type}`);
            
            // إنشاء بيانات التقرير
            let total = 0;
            let orders = 0;
            
            // حساب إجمالي الإيرادات وعدد الطلبات
            ordersSnapshot.docs.forEach(docSnap => {
              const order = docSnap.data();
              
              // تحويل Timestamp إلى تاريخ
              let orderDate = new Date();
              if (order.createdAt instanceof Timestamp) {
                orderDate = order.createdAt.toDate();
              } else if (order.date instanceof Timestamp) {
                orderDate = order.date.toDate();
              } else if (order.date) {
                orderDate = new Date(order.date);
              } else if (order.createdAt) {
                orderDate = new Date(order.createdAt);
              }
              
              // التحقق ما إذا كان الطلب ضمن الفترة المحددة
              const isInSelectedTimeframe = orderDate >= period.startDate && orderDate <= period.endDate;
              
              if (isInSelectedTimeframe) {
                orders++;
                
                // حساب إجمالي قيمة الطلب
                let orderTotal = 0;
                
                if (order.products && Array.isArray(order.products)) {
                  order.products.forEach((prod: any) => {
                    const price = prod.price || 0;
                    const quantity = prod.quantity || 1;
                    const productTotal = price * quantity;
                    orderTotal += productTotal;
                  });
                } else if (order.totalAmount) {
                  orderTotal = parseFloat(order.totalAmount) || 0;
                }
                
                total += orderTotal;
              }
            });
            
            // إنشاء سجل التقرير
            await addDoc(collection(db, 'reportLogs'), {
              timestamp: Timestamp.now(),
              period: period.type,
              startDate: Timestamp.fromDate(period.startDate),
              endDate: Timestamp.fromDate(period.endDate),
              totalRevenue: total,
              totalOrders: orders,
              averageOrderValue: orders > 0 ? total / orders : 0,
              restored: true // علامة تشير إلى أن هذا سجل معاد إنشاؤه
            });
            
            console.log(`تم إنشاء سجل تقرير للفترة ${period.type} بإجمالي إيرادات ${total} وعدد طلبات ${orders}`);
          }
          
          // إنشاء بعض سجلات التقارير اليومية
          for (let i = 0; i < 14; i++) {
            const dayDate = subDays(today, i);
            const startOfDay = new Date(dayDate);
            startOfDay.setHours(0, 0, 0, 0);
            
            const endOfDay = new Date(dayDate);
            endOfDay.setHours(23, 59, 59, 999);
            
            let total = 0;
            let orders = 0;
            
            // حساب إجمالي الإيرادات وعدد الطلبات لهذا اليوم
            ordersSnapshot.docs.forEach(docSnap => {
              const order = docSnap.data();
              
              // تحويل Timestamp إلى تاريخ
              let orderDate = new Date();
              if (order.createdAt instanceof Timestamp) {
                orderDate = order.createdAt.toDate();
              } else if (order.date instanceof Timestamp) {
                orderDate = order.date.toDate();
              } else if (order.date) {
                orderDate = new Date(order.date);
              } else if (order.createdAt) {
                orderDate = new Date(order.createdAt);
              }
              
              // التحقق ما إذا كان الطلب في هذا اليوم
              const isInSelectedDay = orderDate >= startOfDay && orderDate <= endOfDay;
              
              if (isInSelectedDay) {
                orders++;
                
                // حساب إجمالي قيمة الطلب
                let orderTotal = 0;
                
                if (order.products && Array.isArray(order.products)) {
                  order.products.forEach((prod: any) => {
                    const price = prod.price || 0;
                    const quantity = prod.quantity || 1;
                    const productTotal = price * quantity;
                    orderTotal += productTotal;
                  });
                } else if (order.totalAmount) {
                  orderTotal = parseFloat(order.totalAmount) || 0;
                }
                
                total += orderTotal;
              }
            });
            
            // إنشاء سجل تقرير لهذا اليوم
            await addDoc(collection(db, 'reportLogs'), {
              timestamp: Timestamp.now(),
              period: 'day',
              startDate: Timestamp.fromDate(startOfDay),
              endDate: Timestamp.fromDate(endOfDay),
              totalRevenue: total,
              totalOrders: orders,
              averageOrderValue: orders > 0 ? total / orders : 0,
              restored: true
            });
            
            console.log(`تم إنشاء سجل تقرير ليوم ${format(dayDate, 'yyyy-MM-dd')} بإجمالي إيرادات ${total} وعدد طلبات ${orders}`);
          }
        }
        
        // إعادة إنشاء بعض سجلات التصدير
        for (let i = 0; i < 5; i++) {
          const exportDate = subDays(today, i * 2);
          
          await addDoc(collection(db, 'exportLogs'), {
            timestamp: Timestamp.fromDate(exportDate),
            format: i % 2 === 0 ? 'excel' : 'csv',
            period: i % 3 === 0 ? 'day' : (i % 3 === 1 ? 'week' : 'month'),
            startDate: format(subDays(exportDate, 7), 'yyyy-MM-dd'),
            endDate: format(exportDate, 'yyyy-MM-dd'),
            exportedBy: 'admin',
            reportType: i % 3 === 0 ? 'daily' : 'periodic',
            totalRevenue: 10000 - (i * 500),
            totalOrders: 50 - (i * 2),
            restored: true
          });
        }
        
        alert('تم إعادة إنشاء سجلات التقارير بنجاح.');
        
        // إعادة تحميل البيانات
        setTimeout(async () => {
          await fetchReports();
          console.log("تم إعادة تحميل البيانات بعد إصلاح سجلات التقارير");
          setIsRepairing(false);
        }, 1000);
        
      } catch (error) {
        console.error("حدث خطأ أثناء إعادة إنشاء سجلات التقارير:", error);
        alert('حدث خطأ أثناء إعادة إنشاء سجلات التقارير: ' + (error instanceof Error ? error.message : String(error)));
        setIsRepairing(false);
      }
    }
  }, [fetchReports]);

  // دالة لتصدير البيانات بتنسيق Excel متقدم مع تنسيق وألوان ولوحة قيادة
  const exportFormattedExcelReport = useCallback(async () => {
    setIsExporting(true);
    try {
      // إعداد اسم الملف
      const reportDate = period === 'day' 
        ? format(parseISO(selectedDay), 'dd-MM-yyyy', { locale: arSA })
        : `${format(parseISO(startDate), 'dd-MM-yyyy')}_إلى_${format(parseISO(endDate), 'dd-MM-yyyy')}`;
        
      const fileName = period === 'day' 
        ? `تقرير_يومي_${reportDate}.xlsx` 
        : `تقرير_المبيعات_${reportDate}.xlsx`;
      
      // إعداد عنوان التقرير
      const reportTitle = period === 'day' 
        ? `تقرير يومي: ${format(parseISO(selectedDay), 'dd/MM/yyyy', { locale: arSA })}`
        : `تقرير المبيعات: من ${format(parseISO(startDate), 'dd/MM/yyyy', { locale: arSA })} إلى ${format(parseISO(endDate), 'dd/MM/yyyy', { locale: arSA })}`;

      // إعداد بيانات لوحة القيادة الرئيسية - جميع البيانات في صف واحد
      const dashboardMetrics = [
        {
          title: 'إجمالي الإيرادات',
          value: `${totalRevenue.toLocaleString('en-US')} ج.م`,
          options: {
            color: COLORS.PRIMARY
          }
        },
        {
          title: 'عدد الطلبات',
          value: totalOrders,
          options: {
            color: COLORS.SUCCESS
          }
        },
        {
          title: 'متوسط قيمة الطلب',
          value: `${averageOrderValue.toFixed(2)} ج.م`,
          options: {
            color: COLORS.WARNING
          }
        },
        {
          title: 'الفترة الزمنية',
          value: period === 'day' ? 'يوم واحد' : 
                 period === 'week' ? 'أسبوع' :
                 period === 'month' ? 'شهر' : 
                 period === 'year' ? 'سنة' : 'مخصصة',
          options: {
            color: COLORS.INFO,
            subtext: period === 'day' ? format(parseISO(selectedDay), 'yyyy/MM/dd', { locale: arSA }) :
                    `من ${format(parseISO(startDate), 'yyyy/MM/dd')} إلى ${format(parseISO(endDate), 'yyyy/MM/dd')}`
          }
        }
      ];

      // إضافة مؤشرات أداء إضافية في حالة التقرير اليومي
      if (period === 'day') {
        // إيجاد ساعة الذروة (الساعة التي حققت أعلى إيرادات)
        const peakHour = hourlyData.reduce(
          (max, hour) => hour.revenue > max.revenue ? hour : max, 
          { hour: '', revenue: 0, orders: 0 }
        );
        
        // حساب متوسط عدد المنتجات في الطلب
        const avgItemsPerOrder = dailyOrderDetails.reduce((sum, order) => sum + order.items, 0) / 
                               (dailyOrderDetails.length || 1);
                               
        // إضافة مؤشرات للتقرير اليومي
        dashboardMetrics.push(
          {
            title: 'ساعة الذروة',
            value: peakHour.hour || 'لا يوجد',
            options: {
              color: COLORS.SECONDARY
            }
          },
          {
            title: 'متوسط المنتجات في الطلب',
            value: avgItemsPerOrder.toFixed(1),
            options: {
              color: COLORS.INFO
            }
          }
        );
      }

      // ترتيب البيانات في شكل مناسب للتصدير
      const sheets = [];

      // 1. ورقة ملخص التقرير مع كل البيانات في صف واحد
      sheets.push({
        name: 'ملخص التقرير',
        headers: [
          { text: reportTitle, level: HeaderLevel.MAIN }
        ],
        columns: [
          { header: 'إجمالي الإيرادات', key: 'totalRevenue', width: 20, type: ColumnType.MONEY },
          { header: 'عدد الطلبات', key: 'totalOrders', width: 15, type: ColumnType.NUMBER },
          { header: 'متوسط قيمة الطلب', key: 'avgValue', width: 20, type: ColumnType.MONEY },
          { header: 'الفترة الزمنية', key: 'timePeriod', width: 25, type: ColumnType.TEXT },
        ],
        rows: [
          { 
            totalRevenue: totalRevenue, 
            totalOrders: totalOrders, 
            avgValue: averageOrderValue,
            timePeriod: period === 'day' ? `يوم واحد (${format(parseISO(selectedDay), 'yyyy/MM/dd', { locale: arSA })})` : 
                        period === 'week' ? 'أسبوع' :
                        period === 'month' ? 'شهر' :
                        period === 'year' ? 'سنة' :
                        `مخصصة (${format(parseISO(startDate), 'yyyy/MM/dd')} - ${format(parseISO(endDate), 'yyyy/MM/dd')})`
          }
        ],
        dashboard: {
          includeInDashboard: true,
          metrics: dashboardMetrics
        }
      });

      // 2. ورقة الإيرادات اليومية
      sheets.push({
        name: 'الإيرادات اليومية',
        headers: [
          { text: 'تقرير الإيرادات اليومية', level: HeaderLevel.MAIN }
        ],
        columns: [
          { header: 'التاريخ', key: 'date', width: 20, type: ColumnType.DATE, format: 'yyyy/MM/dd (EEEE)' },
          { header: 'الإيرادات', key: 'revenue', width: 20, type: ColumnType.MONEY },
          { header: 'عدد الطلبات', key: 'orders', width: 20, type: ColumnType.NUMBER },
          { header: 'متوسط قيمة الطلب', key: 'average', width: 20, type: ColumnType.MONEY }
        ],
        rows: dailyRevenue.map(day => ({
          date: day.date,
          revenue: day.revenue,
          orders: day.orders,
          average: day.orders > 0 ? day.revenue / day.orders : 0
        }))
      });

      // 3. ورقة المنتجات الأكثر مبيعًا
      sheets.push({
        name: 'المنتجات الأكثر مبيعاً',
        headers: [
          { text: 'تقرير المنتجات الأكثر مبيعاً', level: HeaderLevel.MAIN }
        ],
        columns: [
          { header: 'المنتج', key: 'name', width: 30, type: ColumnType.TEXT },
          { header: 'عدد المبيعات', key: 'sales', width: 20, type: ColumnType.NUMBER },
          { header: 'الإيرادات', key: 'revenue', width: 20, type: ColumnType.MONEY },
          { header: 'نسبة من الإجمالي', key: 'percentage', width: 20, type: ColumnType.PERCENTAGE }
        ],
        rows: topSellingProducts.map(product => ({
          name: product.name,
          sales: product.sales,
          revenue: product.revenue,
          percentage: (product.revenue / totalRevenue) * 100
        }))
      });

      // 4. ورقة الإيرادات حسب التصنيف
      sheets.push({
        name: 'الإيرادات حسب التصنيف',
        headers: [
          { text: 'تقرير الإيرادات حسب تصنيف المنتجات', level: HeaderLevel.MAIN }
        ],
        columns: [
          { header: 'التصنيف', key: 'category', width: 30, type: ColumnType.TEXT },
          { header: 'الإيرادات', key: 'revenue', width: 20, type: ColumnType.MONEY },
          { header: 'نسبة من الإجمالي', key: 'percentage', width: 20, type: ColumnType.PERCENTAGE }
        ],
        rows: revenueByCategory.map(category => ({
          category: category.category,
          revenue: category.revenue,
          percentage: (category.revenue / totalRevenue) * 100
        }))
      });

      // إذا كان التقرير يومي، أضف ورقة تفاصيل اليوم
      if (period === 'day' && dailyOrderDetails.length > 0) {
        // إعداد مؤشرات الأداء لليوم المحدد
        const dailyDashboardMetrics = [
          {
            title: 'إيرادات اليوم',
            value: `${selectedDayTotalRevenue.toLocaleString('en-US')} ج.م`,
            options: { color: COLORS.PRIMARY }
          },
          {
            title: 'عدد الطلبات',
            value: selectedDayOrderCount,
            options: { color: COLORS.SUCCESS }
          },
          {
            title: 'متوسط قيمة الطلب',
            value: `${(selectedDayOrderCount > 0 ? (selectedDayTotalRevenue / selectedDayOrderCount) : 0).toFixed(2)} ج.م`,
            options: { color: COLORS.WARNING }
          }
        ];

        // 5. ورقة تفاصيل طلبات اليوم
        sheets.push({
          name: 'تفاصيل طلبات اليوم',
          headers: [
            { text: `تفاصيل طلبات يوم ${format(parseISO(selectedDay), 'dd/MM/yyyy (EEEE)', { locale: arSA })}`, level: HeaderLevel.DASHBOARD }
          ],
          columns: [
            { header: 'الوقت', key: 'time', width: 15, type: ColumnType.TEXT },
            { header: 'رقم الطلب', key: 'id', width: 20, type: ColumnType.TEXT },
            { header: 'العميل', key: 'customerName', width: 25, type: ColumnType.TEXT },
            { header: 'عدد المنتجات', key: 'items', width: 15, type: ColumnType.NUMBER },
            { header: 'المبلغ', key: 'totalAmount', width: 15, type: ColumnType.MONEY },
            { header: 'الحالة', key: 'status', width: 15, type: ColumnType.STATUS }
          ],
          rows: dailyOrderDetails.map(order => ({
            time: order.time,
            id: order.id,
            customerName: order.customerName,
            items: order.items,
            totalAmount: order.totalAmount,
            status: order.status
          })),
          dashboard: {
            includeInDashboard: true,
            metrics: dailyDashboardMetrics
          }
        });

        // 6. ورقة المنتجات الأكثر مبيعاً في اليوم المحدد
        sheets.push({
          name: 'المنتجات الأكثر مبيعاً باليوم',
          headers: [
            { text: `المنتجات الأكثر مبيعاً ليوم ${format(parseISO(selectedDay), 'dd/MM/yyyy', { locale: arSA })}`, level: HeaderLevel.MAIN }
          ],
          columns: [
            { header: 'المنتج', key: 'name', width: 30, type: ColumnType.TEXT },
            { header: 'عدد المبيعات', key: 'sales', width: 20, type: ColumnType.NUMBER },
            { header: 'الإيرادات', key: 'revenue', width: 20, type: ColumnType.MONEY },
            { header: 'نسبة من إجمالي اليوم', key: 'percentage', width: 20, type: ColumnType.PERCENTAGE }
          ],
          rows: dailyTopProducts.map(product => ({
            name: product.name,
            sales: product.sales,
            revenue: product.revenue,
            percentage: (product.revenue / selectedDayTotalRevenue) * 100
          }))
        });

        // 7. ورقة للإيرادات حسب الساعة لليوم المحدد
        sheets.push({
          name: 'المبيعات حسب الساعة',
          headers: [
            { text: `توزيع المبيعات حسب الساعة ليوم ${format(parseISO(selectedDay), 'dd/MM/yyyy', { locale: arSA })}`, level: HeaderLevel.MAIN }
          ],
          columns: [
            { header: 'الساعة', key: 'hour', width: 15, type: ColumnType.TEXT },
            { header: 'عدد الطلبات', key: 'orders', width: 20, type: ColumnType.NUMBER },
            { header: 'الإيرادات', key: 'revenue', width: 20, type: ColumnType.MONEY }
          ],
          rows: hourlyData.filter(hour => hour.orders > 0).map(hour => ({
            hour: hour.hour,
            orders: hour.orders,
            revenue: hour.revenue
          }))
        });
      }

      // تصدير البيانات بالتنسيق الجديد
      const exported = await exportDataToExcel({
        title: reportTitle,
        fileName,
        sheets,
        dashboardMetrics, // إضافة مقاييس لوحة القيادة الرئيسية
        hideReportInfo: true // إخفاء معلومات التقرير
      });

      if (exported) {
        // تسجيل معلومات التصدير في Firestore
        addDoc(collection(db, 'exportLogs'), {
          timestamp: Timestamp.now(),
          format: 'excel',
          period,
          startDate: startDate,
          endDate: endDate,
          exportedBy: 'admin',
          reportType: period === 'day' ? 'daily' : 'periodic',
          totalRevenue: totalRevenue,
          totalOrders: totalOrders
        });
      }
    } catch (error) {
      console.error("Error exporting Excel report:", error);
    } finally {
      setIsExporting(false);
    }
  }, [
    period, selectedDay, startDate, endDate, 
    totalRevenue, totalOrders, averageOrderValue, 
    dailyRevenue, topSellingProducts, revenueByCategory, 
    dailyOrderDetails, selectedDayTotalRevenue, selectedDayOrderCount, 
    dailyTopProducts, hourlyData
  ]);
  
  // إضافة أسلوب CSS للقائمة المنسدلة
  const dropdownStyles = `
    .dropdown {
      position: relative;
      display: inline-block;
    }
    
    .dropdown-content {
      display: none;
      position: absolute;
      left: 0;
      min-width: 160px;
      z-index: 50;
      background-color: white;
      box-shadow: 0 8px 16px rgba(0,0,0,0.2);
      border-radius: 0.375rem;
    }
    
    .dropdown-content.active {
      display: block;
    }
  `;

  // للتحكم في القائمة المنسدلة
  const [dropdownOpen, setDropdownOpen] = useState(false);
  
  // دالة لفتح وإغلاق القائمة المنسدلة
  const toggleDropdown = () => {
    setDropdownOpen(!dropdownOpen);
  }

  // Función para cerrar el menú desplegable al hacer clic fuera de él
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const dropdownElement = document.querySelector('.dropdown');
      if (dropdownElement && !dropdownElement.contains(event.target as Node) && dropdownOpen) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [dropdownOpen]);

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      {/* إضافة أسلوب CSS */}
      <style>{dropdownStyles}</style>
      {/* شريط العنوان */}
      <div className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-800">تقارير المبيعات</h1>
              <p className="text-gray-600 text-sm mt-1">تحليل إحصائيات المبيعات والإيرادات</p>
            </div>
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
              <Link to="/admin" className="px-3 py-2 bg-gray-100 text-gray-700 text-sm rounded-md hover:bg-gray-200 transition">
                لوحة التحكم
              </Link>
              
              {/* زر تصدير التقارير بتنسيق Excel */}
              <div className="relative">
                <button
                  onClick={exportFormattedExcelReport}
                  disabled={isExporting}
                  className="px-3 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 transition flex items-center"
                >
                  {isExporting ? (
                    <>
                      <span className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white ml-1"></span>
                      جاري...
                    </>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 ml-1">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                      </svg>
                      Excel
                    </>
                  )}
                </button>
              </div>
              
              <button
                onClick={() => fetchReports()}
                className="px-3 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition flex items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 ml-1">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                </svg>
                تحديث
              </button>

              <div className="dropdown relative inline-block">
                <button
                  className="px-3 py-2 bg-gray-600 text-white text-sm rounded-md hover:bg-gray-700 transition flex items-center"
                  onClick={toggleDropdown}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 ml-1">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM12.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM18.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
                  </svg>
                  المزيد
                </button>
                <div className={`dropdown-content ${dropdownOpen ? 'active' : ''} absolute left-0 mt-1 bg-white rounded-md shadow-lg z-10 min-w-[160px]`}>
                  <button
                    onClick={clearAnalyticsData}
                    disabled={isClearing}
                    className="w-full px-4 py-2 text-sm text-right text-red-600 hover:bg-gray-100 flex items-center"
                  >
                    {isClearing ? (
                      <>
                        <span className="animate-spin rounded-full h-3 w-3 border-t-2 border-b-2 border-red-600 ml-2"></span>
                        جاري المسح...
                      </>
                    ) : (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 ml-1">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165l-2.1 2.1m3.99 3.99a5.25 5.25 0 01-7.425 7.425m7.425-7.425a5.235 5.235 0 00-.995-1.11m-6.43 8.535l-2.1-2.1m0 0a5.25 5.25 0 01-7.425-7.425m7.425 7.425c-.412-.275-.788-.61-1.11-.995m-6.315-6.43l2.1-2.1m0 0a5.25 5.25 0 017.425-7.425m-7.425 7.425c.275.412.61.788.995 1.11" />
                        </svg>
                        مسح البيانات
                      </>
                    )}
                  </button>
                  
                  <button
                    onClick={repairReportLogs}
                    disabled={isRepairing}
                    className="w-full px-4 py-2 text-sm text-right text-yellow-600 hover:bg-gray-100 flex items-center"
                  >
                    {isRepairing ? (
                      <>
                        <span className="animate-spin rounded-full h-3 w-3 border-t-2 border-b-2 border-yellow-600 ml-2"></span>
                        جاري الإصلاح...
                      </>
                    ) : (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 ml-1">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487c.412.275.788.61 1.11.995m-1.11-.995a5.25 5.25 0 00-7.425 7.425m7.425-7.425l-2.1 2.1m3.99 3.99a5.25 5.25 0 01-7.425 7.425m7.425-7.425a5.235 5.235 0 00-.995-1.11m-6.43 8.535l-2.1-2.1m0 0a5.25 5.25 0 01-7.425-7.425m7.425 7.425c-.412-.275-.788-.61-1.11-.995m-6.315-6.43l2.1-2.1m0 0a5.25 5.25 0 017.425-7.425m-7.425 7.425c.275.412.61.788.995 1.11" />
                        </svg>
                        إصلاح التقارير
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* محتوى الصفحة */}
      <div className="container mx-auto px-4 py-6">
        
        {/* عرض شريط تنبيه عند تعطيل التقارير التلقائية */}
        {disableAutoReporting && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 پ-4 mb-4 rounded-md">
            <div className="flex justify-between items-center">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-yellow-600">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                  </svg>
                </div>
                <div className="mr-3">
                  <p className="text-sm text-yellow-700">
                    تم تعطيل التقارير التلقائية. البيانات الحالية لا تعكس الإحصائيات الحقيقية من قاعدة البيانات.
                  </p>
                </div>
              </div>
              <button 
                onClick={() => {
                  setDisableAutoReporting(false);
                  setTimeout(() => {
                    fetchReports();
                  }, 100);
                }}
                className="px-3 py-1 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 transition text-sm flex items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 ml-1">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                </svg>
                إعادة تفعيل التقارير
              </button>
            </div>
          </div>
        )}
        
        {/* عرض تفاصيل اليوم المحدد */}
        {showDailyDetails ? (
          <div>
            {/* رأس صفحة تفاصيل اليوم */}
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3">
                <button
                  onClick={handleBackFromDailyView}
                  className="p-2 bg-white rounded-full shadow-sm hover:bg-gray-50 transition"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
                  </svg>
                </button>
                <h2 className="text-xl font-bold text-gray-800">
                  تفاصيل المبيعات ليوم {format(parseISO(selectedDay), 'dd/MM/yyyy', { locale: arSA })}
                </h2>
              </div>
              <div className="flex items-center">
                <div>
                  <input
                    type="date"
                    value={selectedDay}
                    onChange={(e) => {
                      setSelectedDay(e.target.value);
                      setPeriod('day');
                    }}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <button
                  onClick={() => fetchReports()}
                  className="ml-2 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
                >
                  عرض
                </button>
              </div>
            </div>

            {/* ملخص إحصائيات اليوم */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-white rounded-lg shadow-sm p-6 border-r-4 border-purple-500">
                <div className="flex items-center">
                  <div className="p-3 bg-purple-100 rounded-full">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-purple-600">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="mr-4">
                    <h2 className="text-sm text-gray-500 font-medium">إيرادات اليوم</h2>
                    <div className="flex items-center">
                      <span className="text-2xl font-bold text-gray-900">{selectedDayTotalRevenue.toLocaleString('en-US')} ج.م</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6 border-r-4 border-green-500">
                <div className="flex items-center">
                  <div className="p-3 bg-green-100 rounded-full">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-green-600">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
                    </svg>
                  </div>
                  <div className="mr-4">
                    <h2 className="text-sm text-gray-500 font-medium">عدد الطلبات</h2>
                    <div className="flex items-center">
                      <span className="text-2xl font-bold text-gray-900">{selectedDayOrderCount}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6 border-r-4 border-amber-500">
                <div className="flex items-center">
                  <div className="p-3 bg-amber-100 rounded-full">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-amber-600">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
                    </svg>
                  </div>
                  <div className="mr-4">
                    <h2 className="text-sm text-gray-500 font-medium">متوسط الطلب</h2>
                    <div className="flex items-center">
                      <span className="text-2xl font-bold text-gray-900">
                        {selectedDayOrderCount > 0 ? (selectedDayTotalRevenue / selectedDayOrderCount).toFixed(2) : '0'} ج.م
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* عرض المنتجات الأكثر مبيعاً في اليوم */}
            {dailyTopProducts.length > 0 && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h2 className="text-xl font-bold text-gray-800 mb-4">المنتجات الأكثر مبيعاً اليوم</h2>
                  <div className="ه-80">
                    <Bar data={dailyTopProductsChartData} options={commonChartOptions} />
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                  <div className="px-6 py-4 bg-blue-50 border-b border-blue-100">
                    <h3 className="font-semibold text-blue-800 flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 ml-2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                      </svg>
                      قائمة المنتجات المباعة اليوم
                    </h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full bg-white">
                      <thead>
                        <tr>
                          <th className="py-3 px-4 text-right border-b border-gray-200 bg-gray-50 text-gray-600 text-xs font-medium tracking-wider">#</th>
                          <th className="py-3 px-4 text-right border-b border-gray-200 bg-gray-50 text-gray-600 text-xs font-medium tracking-wider">المنتج</th>
                          <th className="py-3 px-4 text-right border-b border-gray-200 bg-gray-50 text-gray-600 text-xs font-medium tracking-wider">الكمية</th>
                          <th className="py-3 px-4 text-right border-b border-gray-200 bg-gray-50 text-gray-600 text-xs font-medium tracking-wider">الإيرادات</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dailyTopProducts.map((product, index) => (
                          <tr key={product.id} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                            <td className="py-3 px-4 text-right text-sm text-gray-900 border-b border-gray-200">{index + 1}</td>
                            <td className="py-3 px-4 text-right text-sm text-gray-900 border-b border-gray-200">{product.name}</td>
                            <td className="py-3 px-4 text-right text-sm text-gray-900 border-b border-gray-200">{product.sales}</td>
                            <td className="py-3 px-4 text-right text-sm text-gray-900 border-b border-gray-200">{product.revenue.toLocaleString()} ج.م</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* جدول تفاصيل الطلبات اليومية */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="px-6 py-4 bg-green-50 border-b border-green-100">
                <h3 className="font-semibold text-green-800 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 ml-2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
                  </svg>
                  تفاصيل طلبات اليوم
                </h3>
              </div>
              <div className="overflow-x-auto">
                {dailyOrderDetails.length > 0 ? (
                  <table className="min-w-full bg-white">
                    <thead>
                      <tr>
                        <th className="py-3 px-4 text-right border-b border-gray-200 bg-gray-50 text-gray-600 text-xs font-medium tracking-wider">#</th>
                        <th className="py-3 px-4 text-right border-b border-gray-200 bg-gray-50 text-gray-600 text-xs font-medium tracking-wider">رقم الطلب</th>
                        <th className="py-3 px-4 text-right border-b border-gray-200 bg-gray-50 text-gray-600 text-xs font-medium tracking-wider">الوقت</th>
                        <th className="py-3 px-4 text-right border-b border-gray-200 bg-gray-50 text-gray-600 text-xs font-medium tracking-wider">العميل</th>
                        <th className="py-3 px-4 text-right border-b border-gray-200 bg-gray-50 text-gray-600 text-xs font-medium tracking-wider">المبلغ</th>
                        <th className="py-3 px-4 text-right border-b border-gray-200 bg-gray-50 text-gray-600 text-xs font-medium tracking-wider">العناصر</th>
                        <th className="py-3 px-4 text-right border-b border-gray-200 bg-gray-50 text-gray-600 text-xs font-medium tracking-wider">الحالة</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dailyOrderDetails.map((order, index) => (
                        <tr key={order.id} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                          <td className="py-3 px-4 text-right text-sm text-gray-900 border-b border-gray-200">{index + 1}</td>
                          <td className="py-3 px-4 text-right text-sm text-gray-900 border-b border-gray-200">{order.id.substring(0, 8)}</td>
                          <td className="py-3 px-4 text-right text-sm text-gray-900 border-b border-gray-200">{order.time}</td>
                          <td className="py-3 px-4 text-right text-sm text-gray-900 border-b border-gray-200">{order.customerName}</td>
                          <td className="py-3 px-4 text-right text-sm text-gray-900 border-b border-gray-200">{order.totalAmount.toLocaleString()} ج.م</td>
                          <td className="py-3 px-4 text-right text-sm text-gray-900 border-b border-gray-200">{order.items}</td>
                          <td className="py-3 px-4 text-right text-sm border-b border-gray-200">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              order.status === 'مكتمل' ? 'bg-green-100 text-green-800' : 
                              order.status === 'قيد التجهيز' ? 'bg-blue-100 text-blue-800' : 
                              order.status === 'ملغي' ? 'bg-red-100 text-red-800' : 
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {order.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="p-8 text-center text-gray-500">
                    لا يوجد طلبات لهذا اليوم
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* الإحصائيات السريعة */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white rounded-lg shadow-sm p-6 border-r-4 border-blue-500">
                <div className="flex items-center">
                  <div className="p-3 bg-blue-100 rounded-full">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-blue-600">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
                    </svg>
                  </div>
                  <div className="mr-4">
                    <h2 className="text-sm text-gray-500 font-medium">إجمالي الإيرادات</h2>
                    <div className="flex items-center">
                      <span className="text-2xl font-bold text-gray-900">{totalRevenue.toLocaleString('en-US')} ج.م</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6 border-r-4 border-green-500">
                <div className="flex items-center">
                  <div className="p-3 bg-green-100 rounded-full">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-green-600">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
                    </svg>
                  </div>
                  <div className="mr-4">
                    <h2 className="text-sm text-gray-500 font-medium">إجمالي الطلبات</h2>
                    <div className="flex items-center">
                      <span className="text-2xl font-bold text-gray-900">{totalOrders}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6 border-r-4 border-amber-500">
                <div className="flex items-center">
                  <div className="p-3 bg-amber-100 rounded-full">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-amber-600">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
                    </svg>
                  </div>
                  <div className="mr-4">
                    <h2 className="text-sm text-gray-500 font-medium">متوسط قيمة الطلب</h2>
                    <div className="flex items-center">
                      <span className="text-2xl font-bold text-gray-900">{averageOrderValue.toFixed(2)} ج.م</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6 border-r-4 border-cyan-500">
                <div className="flex items-center">
                  <div className="p-3 bg-cyan-100 rounded-full">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-cyan-600">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M3 18.75v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                    </svg>
                  </div>
                  <div className="mr-4">
                    <h2 className="text-sm text-gray-500 font-medium">الفترة الزمنية</h2>
                    <div className="flex items-center">
                      <span className="text-lg font-bold text-gray-900">
                        {period === 'day' ? 'يوم واحد' : 
                         period === 'week' ? 'أسبوع' :
                         period === 'month' ? 'شهر' : 
                         period === 'year' ? 'سنة' : 'مخصصة'}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 mt-1 font-medium">
                      {period === 'day' ? format(parseISO(selectedDay), 'yyyy/MM/dd', { locale: arSA }) :
                        period === 'custom' ? `${format(parseISO(startDate), 'MM/dd')} - ${format(parseISO(endDate), 'MM/dd')}` : ''}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* فلتر الفترة الزمنية */}
            <div className="bg-white rounded-lg shadow-sm پ-6 mb-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
                <h2 className="text-xl font-bold text-gray-800 mb-3 sm:mb-0">فلترة التقارير</h2>
                <div className="flex items-center">
                  <label className="flex items-center cursor-pointer mr-4">
                    <input 
                      type="checkbox" 
                      checked={autoRefresh} 
                      onChange={() => setAutoRefresh(!autoRefresh)} 
                      className="form-checkbox h-5 w-5 text-blue-600 ml-2"
                    />
                    <span className="text-gray-700">تحديث تلقائي</span>
                  </label>
                </div>
              </div>
              <div className="flex flex-col gap-3">
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setPeriod('day')}
                    className={`px-4 py-2 rounded-md ${
                      period === 'day' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    يوم محدد
                  </button>
                  <button
                    onClick={() => setPeriod('week')}
                    className={`px-4 py-2 rounded-md ${
                      period === 'week' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    الأسبوع الحالي
                  </button>
                  <button
                    onClick={() => setPeriod('month')}
                    className={`px-4 py-2 rounded-md ${
                      period === 'month' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    الشهر الحالي
                  </button>
                  <button
                    onClick={() => setPeriod('year')}
                    className={`px-4 py-2 rounded-md ${
                      period === 'year' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    السنة الحالية
                  </button>
                  <button
                    onClick={() => setPeriod('custom')}
                    className={`px-4 py-2 rounded-md ${
                      period === 'custom' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    مخصص
                  </button>
                </div>
                
                {period === 'custom' && (
                  <div className="flex flex-col sm:flex-row flex-wrap gap-2 mt-3">
                    <div className="flex items-center w-full sm:w-auto">
                      <label className="ml-2 w-16 text-sm">من:</label>
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full sm:w-auto px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div className="flex items-center w-full sm:w-auto mt-2 sm:mt-0">
                      <label className="ml-2 w-16 text-sm">إلى:</label>
                      <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="w-full sm:w-auto px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                )}
                
                {period === 'day' && (
                  <div className="flex flex-col sm:flex-row flex-wrap gap-2 mt-3">
                    <div className="flex items-center w-full sm:w-auto">
                      <label className="ml-2 w-16 text-sm">اختر يوم:</label>
                      <input
                        type="date"
                        value={selectedDay}
                        onChange={(e) => setSelectedDay(e.target.value)}
                        className="w-full sm:w-auto px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <button
                      onClick={() => setShowDailyDetails(true)}
                      className="w-full sm:w-auto mt-2 sm:mt-0 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition"
                    >
                      عرض تفاصيل اليوم
                    </button>
                  </div>
                )}
              </div>
            </div>

            {isLoading ? (
              <div className="flex justify-center items-center ه-80">
                <div className="animate-spin rounded-full ه-16 w-16 border-t-4 border-b-4 border-blue-600"></div>
              </div>
            ) : (
              <>
                {/* الرسوم البيانية للإيرادات */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                  {/* الإيرادات اليومية */}
                  <div className="bg-white rounded-lg shadow-sm پ-6">
                    <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-4">الإيرادات اليومية</h2>
                    <div className="ه-60 sm:ه-80">
                      <Line data={dailyRevenueChartData} options={commonChartOptions} />
                    </div>
                  </div>

                  {/* الطلبات اليومية */}
                  <div className="bg-white rounded-lg shadow-sm پ-6">
                    <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-4">الطلبات اليومية</h2>
                    <div className="ه-60 sm:ه-80">
                      <Line data={dailyOrdersChartData} options={ordersChartOptions} />
                    </div>
                  </div>
                </div>

                {/* انقر للحصول على تفاصيل أيام محددة */}
                <div className="bg-white rounded-lg shadow-sm پ-6 mb-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-gray-800">ملخص الإيرادات اليومية</h3>
                    {dailyRevenue.length > 0 && totalRevenue === 0 && (
                      <div className="text-sm text-gray-500">
                        لا توجد بيانات إيرادات حالياً
                      </div>
                    )}
                  </div>
                  
                  {dailyRevenue.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-7 gap-2">
                      {/* ترتيب الأيام بشكل ثابت من السبت (بداية الأسبوع) إلى الجمعة */}
                      {['السبت', 'الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'].map(dayName => {
                        // البحث عن اليوم في البيانات المتاحة
                        const matchingDay = dailyRevenue
                          .slice(-7)
                          .find(day => {
                            const dayOfWeekArabic = format(parseISO(day.date), 'EEEE', { locale: arSA });
                            return dayOfWeekArabic === dayName;
                          });
                          
                        // حساب تاريخ اليوم بناءً على اسمه بالنسبة لليوم الحالي
                        const today = new Date();
                        const dayIndex = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'].indexOf(dayName);
                        const currentDayIndex = today.getDay(); // 0 للأحد، 1 للاثنين، إلخ
                        
                        // حساب الفرق بين اليوم الحالي واليوم المطلوب
                        const diff = dayIndex - currentDayIndex;
                        const targetDate = new Date();
                        targetDate.setDate(today.getDate() + diff);
                        
                        // تنسيق التاريخ المناسب للتحديد
                        const formattedDate = format(targetDate, 'yyyy-MM-dd');
                          
                        return (
                          <div 
                            key={dayName}
                            onClick={() => handleDayClick(matchingDay ? matchingDay.date : formattedDate)}
                            className="bg-gray-50 rounded-lg پ-3 cursor-pointer hover:bg-gray-100 transition border border-gray-100"
                          >
                            <h4 className="text-center text-xs sm:text-sm font-medium text-gray-700">{dayName}</h4>
                            {matchingDay ? (
                              <p className="text-center text-sm sm:text-lg font-bold text-gray-900 mt-1">
                                {matchingDay.revenue.toLocaleString()} ج.م
                              </p>
                            ) : (
                              <p className="text-center text-sm sm:text-lg font-bold text-gray-900 mt-1">0 ج.م</p>
                            )}
                            {matchingDay ? (
                              <p className="text-center text-xs text-gray-500 mt-1">
                                {matchingDay.orders} {matchingDay.orders === 1 ? 'طلب' : 'طلبات'}
                              </p>
                            ) : (
                              <p className="text-center text-xs text-gray-500 mt-1">0 طلبات</p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center پ-8 text-gray-500">
                      لا توجد بيانات إيرادات للعرض
                    </div>
                  )}
                  
                  {dailyRevenue.length > 0 && (
                    <div className="mt-4 text-xs sm:text-sm text-gray-500 text-center">
                      يمكنك النقر على أي يوم لعرض تفاصيله
                    </div>
                  )}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ReportsPage;