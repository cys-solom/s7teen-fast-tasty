import ExcelJS from 'exceljs';
import { format, parseISO } from 'date-fns';
import { arSA } from 'date-fns/locale';

/**
 * مستوى رأس العنوان في الاكسل (لتمييز العنوان الرئيسي عن الثانوي)
 */
export enum HeaderLevel {
  MAIN = 'main',
  SUB = 'sub',
  NORMAL = 'normal',
  DASHBOARD = 'dashboard' // إضافة مستوى خاص للوحة القيادة
}

/**
 * أنواع الأعمدة في الإكسل
 */
export enum ColumnType {
  TEXT = 'text',
  NUMBER = 'number',
  MONEY = 'money',
  DATE = 'date',
  PERCENTAGE = 'percentage',
  STATUS = 'status',
  METRIC = 'metric' // نوع جديد للمقاييس في لوحة القيادة
}

/**
 * تعريف الألوان المستخدمة في التقارير
 */
export const COLORS = {
  PRIMARY: '4472C4', // أزرق داكن
  SECONDARY: '5B9BD5', // أزرق فاتح
  SUCCESS: '70AD47', // أخضر
  WARNING: 'ED7D31', // برتقالي
  DANGER: 'FF0000', // أحمر
  INFO: '4BACC6', // أزرق فاتح
  GRAY_LIGHT: 'F2F2F2', // رمادي فاتح
  GRAY_MEDIUM: 'D9D9D9', // رمادي متوسط
  GRAY_DARK: 'A6A6A6', // رمادي داكن
  WHITE: 'FFFFFF', // أبيض
  BLACK: '000000', // أسود
  DASHBOARD_HEADER: '305496', // أزرق داكن للعناوين في لوحة القيادة
  DASHBOARD_SUBHEADER: 'D6DCE4', // رمادي فاتح مائل للأزرق للعناوين الفرعية
  DASHBOARD_METRIC_BG: 'EBF1DE', // خلفية خفيفة للمقاييس
  TABLE_HEADER: '8EA9DB' // أزرق فاتح لعناوين الجداول
};

/**
 * تعريف عمود في الاكسل
 */
interface ExcelColumn {
  header: string;
  key: string;
  width: number;
  type?: ColumnType;
  format?: string;
}

/**
 * وظيفة لإنشاء مصنف اكسل جديد
 */
export const createWorkbook = () => {
  const workbook = new ExcelJS.Workbook();
  
  // إعداد البيانات الوصفية للمصنف
  workbook.creator = 'S7teen Food App';
  workbook.lastModifiedBy = 'S7teen Reports';
  workbook.created = new Date();
  workbook.modified = new Date();
  
  return workbook;
};

/**
 * إضافة ورقة عمل جديدة للمصنف
 */
export const addWorksheet = (workbook: ExcelJS.Workbook, name: string) => {
  const worksheet = workbook.addWorksheet(name, {
    views: [{ rightToLeft: true }], // تفعيل دعم الاتجاه من اليمين لليسار للغة العربية
    properties: {
      tabColor: { argb: COLORS.PRIMARY } // تلوين تبويب الورقة
    }
  });
  
  return worksheet;
};

/**
 * إضافة عنوان للورقة بتنسيق محسن
 */
export const addHeader = (
  worksheet: ExcelJS.Worksheet,
  text: string,
  startCell: string = 'A1',
  endCell: string = 'E1',
  level: HeaderLevel = HeaderLevel.MAIN
) => {
  worksheet.mergeCells(`${startCell}:${endCell}`);
  const cell = worksheet.getCell(startCell);
  cell.value = text;
  
  switch(level) {
    case HeaderLevel.DASHBOARD:
      cell.font = {
        name: 'Arial',
        size: 18,
        bold: true,
        color: { argb: COLORS.WHITE }
      };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: COLORS.DASHBOARD_HEADER }
      };
      cell.border = {
        top: { style: 'thin', color: { argb: COLORS.WHITE } },
        left: { style: 'thin', color: { argb: COLORS.WHITE } },
        bottom: { style: 'thin', color: { argb: COLORS.WHITE } },
        right: { style: 'thin', color: { argb: COLORS.WHITE } }
      };
      break;
      
    case HeaderLevel.MAIN:
      cell.font = {
        name: 'Arial',
        size: 16,
        bold: true,
        color: { argb: COLORS.WHITE }
      };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: COLORS.PRIMARY }
      };
      cell.border = {
        bottom: { style: 'medium', color: { argb: COLORS.SECONDARY } }
      };
      break;
      
    case HeaderLevel.SUB:
      cell.font = {
        name: 'Arial',
        size: 14,
        bold: true,
        color: { argb: COLORS.PRIMARY }
      };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: COLORS.DASHBOARD_SUBHEADER }
      };
      break;
      
    case HeaderLevel.NORMAL:
    default:
      cell.font = {
        name: 'Arial',
        size: 12,
        bold: true,
        color: { argb: COLORS.BLACK }
      };
      break;
  }
  
  cell.alignment = {
    horizontal: 'center',
    vertical: 'middle'
  };
  
  return cell;
};

/**
 * تعيين أعمدة الورقة بتصميم محسن
 */
export const setColumns = (worksheet: ExcelJS.Worksheet, columns: ExcelColumn[]) => {
  const excelColumns = columns.map(col => ({
    header: col.header,
    key: col.key,
    width: col.width
  }));
  
  worksheet.columns = excelColumns;
  
  // تنسيق رؤوس الأعمدة
  const headerRow = worksheet.getRow(1);
  headerRow.height = 30;
  headerRow.eachCell((cell) => {
    cell.font = { 
      bold: true, 
      color: { argb: COLORS.WHITE },
      name: 'Arial',
      size: 12
    };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: COLORS.TABLE_HEADER }
    };
    cell.alignment = { 
      horizontal: 'center', 
      vertical: 'middle' 
    };
    cell.border = {
      top: { style: 'thin', color: { argb: COLORS.PRIMARY } },
      left: { style: 'thin', color: { argb: COLORS.PRIMARY } },
      bottom: { style: 'thin', color: { argb: COLORS.PRIMARY } },
      right: { style: 'thin', color: { argb: COLORS.PRIMARY } }
    };
  });
  
  return headerRow;
};

/**
 * إضافة صف بيانات
 */
export const addRow = (
  worksheet: ExcelJS.Worksheet,
  rowData: any,
  columns: ExcelColumn[]
) => {
  // تحويل البيانات حسب نوع العمود
  const formattedData: any = {};
  
  for (const col of columns) {
    const value = rowData[col.key];
    
    if (value === undefined || value === null) {
      formattedData[col.key] = '';
      continue;
    }
    
    switch(col.type) {
      case ColumnType.MONEY:
        formattedData[col.key] = typeof value === 'number' 
          ? value.toLocaleString('en-US') + ' ج.م' 
          : value;
        break;
        
      case ColumnType.DATE:
        try {
          formattedData[col.key] = typeof value === 'string' 
            ? format(parseISO(value), col.format || 'yyyy/MM/dd', { locale: arSA }) 
            : value;
        } catch {
          formattedData[col.key] = value;
        }
        break;
        
      case ColumnType.PERCENTAGE:
        formattedData[col.key] = typeof value === 'number' 
          ? value.toLocaleString('en-US') + '%' 
          : value;
        break;
        
      case ColumnType.NUMBER:
        formattedData[col.key] = typeof value === 'number' 
          ? value.toLocaleString('en-US') 
          : value;
        break;
      
      case ColumnType.METRIC:
        formattedData[col.key] = value;
        break;
        
      case ColumnType.TEXT:
      default:
        formattedData[col.key] = value;
        break;
    }
  }
  
  return worksheet.addRow(formattedData);
};

/**
 * تنسيق الصفوف بألوان متناوبة
 */
export const formatRowsWithAlternatingColors = (
  worksheet: ExcelJS.Worksheet, 
  startRow: number, 
  rowCount: number,
  evenColor: string = 'D9E1F2', // أزرق فاتح جداً
  oddColor: string = 'F9FAFC',  // أبيض مائل للرمادي
  columns: ExcelColumn[] = []
) => {
  worksheet.getRows(startRow, rowCount)?.forEach((row, index) => {
    const isEvenRow = index % 2 === 0;
    const bgColor = isEvenRow ? evenColor : oddColor;
    
    row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      // تنسيق الخلية
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: bgColor }
      };
      
      cell.border = {
        top: { style: 'thin', color: { argb: 'E5E8EB' } },
        left: { style: 'thin', color: { argb: 'E5E8EB' } },
        bottom: { style: 'thin', color: { argb: 'E5E8EB' } },
        right: { style: 'thin', color: { argb: 'E5E8EB' } }
      };
      
      // توسيط محتوى جميع الخلايا بغض النظر عن نوع البيانات
      cell.alignment = { 
        horizontal: 'center', 
        vertical: 'middle' 
      };
      
      // تنسيق خاص للمقاييس إذا كانت متاحة
      if (columns[colNumber - 1]?.type === ColumnType.METRIC) {
        cell.font = {
          bold: true,
          size: 12,
          color: { argb: COLORS.PRIMARY }
        };
      }
    });
  });

  return worksheet;
};

/**
 * إضافة حدود وتنسيق لمنطقة في الورقة
 */
export const addTableBorder = (
  worksheet: ExcelJS.Worksheet,
  startCell: string,
  endCell: string,
  borderColor: string = COLORS.PRIMARY
) => {
  try {
    // تحقق من وجود الخلايا قبل محاولة الوصول إليها
    if (!worksheet.getCell(startCell) || !worksheet.getCell(endCell)) {
      console.warn('Cannot add border: start or end cell does not exist');
      return;
    }

    // استخراج أرقام الصفوف وأعمدة البداية والنهاية
    // نستخدم الآن العنوان المجزأ بدلاً من خصائص غير موجودة
    const startCellCoords = worksheet.getCell(startCell).address.split(/([0-9]+)/);
    const endCellCoords = worksheet.getCell(endCell).address.split(/([0-9]+)/);
    
    if (!startCellCoords || !endCellCoords) {
      console.warn('Cannot add border: invalid cell references');
      return;
    }
    
    // استخراج الأعمدة (الأحرف) والصفوف (الأرقام)
    const startColNum = Number(worksheet.getCell(startCell).col);
    const startRowNum = Number(worksheet.getCell(startCell).row);
    const endColNum = Number(worksheet.getCell(endCell).col);
    const endRowNum = Number(worksheet.getCell(endCell).row);
    
    if (isNaN(startRowNum) || isNaN(startColNum) || isNaN(endRowNum) || isNaN(endColNum)) {
      console.warn('Cannot add border: cannot determine cell boundaries or invalid number');
      return;
    }
    
    // تطبيق نمط الحدود
    const borderStyle = { style: 'medium', color: { argb: borderColor } };
    
    // إضافة الحدود لكل خلية في النطاق المحدد
    for (let row = startRowNum; row <= endRowNum; row++) {
      // التحقق من وجود الصف قبل محاولة الوصول إليه
      if (!worksheet.getRow(row)) continue;
      
      for (let col = startColNum; col <= endColNum; col++) {
        try {
          // محاولة الحصول على الخلية بأمان
          const cell = worksheet.getRow(row).getCell(col);
          
          if (!cell) continue;
          
          // تحديد موقع الخلية (أعلى، أسفل، يسار، يمين النطاق)
          const border: any = {};
          
          if (row === startRowNum) border.top = borderStyle;
          if (row === endRowNum) border.bottom = borderStyle;
          if (col === startColNum) border.left = borderStyle;
          if (col === endColNum) border.right = borderStyle;
          
          // تطبيق الحدود مع الاحتفاظ بأي حدود موجودة
          cell.border = { ...cell.border, ...border };
        } catch (cellError) {
          console.warn(`Cannot access cell at row ${row}, col ${col}:`, cellError);
          continue;
        }
      }
    }
  } catch (error) {
    console.error('Error adding table border:', error);
  }
};

/**
 * إضافة مقياس (KPI) في لوحة القيادة
 */
export const addMetricToSheet = (
  worksheet: ExcelJS.Worksheet, 
  title: string,
  value: number | string,
  row: number,
  col: string,
  options: {
    color?: string,
    subtext?: string,
    width?: number,
    icon?: string
  } = {}
) => {
  try {
    const { color = COLORS.PRIMARY, subtext, width = 3, icon } = options;
    const endCol = String.fromCharCode(col.charCodeAt(0) + width - 1);
    
    // دمج خلايا العنوان - التحقق أولاً من أنها غير مدمجة بالفعل
    const titleRange = `${col}${row}:${endCol}${row}`;
    
    // استخدام طريقة آمنة للتحقق من الدمج
    let isMerged = false;
    try {
      for (let c = col.charCodeAt(0); c <= endCol.charCodeAt(0); c++) {
        const cellAddress = `${String.fromCharCode(c)}${row}`;
        worksheet.getCell(cellAddress);
      }
    } catch (e) {
      isMerged = true;
    }
    
    if (!isMerged) {
      worksheet.mergeCells(titleRange);
    }
    
    // ضبط خلية العنوان مع تصميم محسن
    const titleCell = worksheet.getCell(`${col}${row}`);
    titleCell.value = title;
    titleCell.font = {
      name: 'Arial',
      size: 12,
      bold: true,
      color: { argb: COLORS.BLACK }
    };
    titleCell.alignment = {
      horizontal: 'center',
      vertical: 'middle'
    };
    titleCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: COLORS.DASHBOARD_SUBHEADER }
    };
    worksheet.getRow(row).height = 24; // زيادة ارتفاع صف العنوان
    
    // دمج خلايا القيمة - التحقق أولاً من أنها غير مدمجة بالفعل
    const valueRange = `${col}${row+1}:${endCol}${row+1}`;
    
    let valueIsMerged = false;
    try {
      for (let c = col.charCodeAt(0); c <= endCol.charCodeAt(0); c++) {
        const cellAddress = `${String.fromCharCode(c)}${row+1}`;
        worksheet.getCell(cellAddress);
      }
    } catch (e) {
      valueIsMerged = true;
    }
    
    if (!valueIsMerged) {
      worksheet.mergeCells(valueRange);
    }
    
    // ضبط خلية القيمة مع تصميم محسن
    const valueCell = worksheet.getCell(`${col}${row+1}`);
    valueCell.value = value;
    valueCell.font = {
      name: 'Arial',
      size: 18,
      bold: true,
      color: { argb: color }
    };
    valueCell.alignment = {
      horizontal: 'center',
      vertical: 'middle'
    };
    valueCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: COLORS.DASHBOARD_METRIC_BG }
    };
    worksheet.getRow(row+1).height = 36; // زيادة ارتفاع صف القيمة
    
    // إضافة النص الثانوي إذا كان موجودًا
    let subtextRowNum = row + 2;
    if (subtext) {
      const subtextRange = `${col}${subtextRowNum}:${endCol}${subtextRowNum}`;
      
      let subtextIsMerged = false;
      try {
        for (let c = col.charCodeAt(0); c <= endCol.charCodeAt(0); c++) {
          const cellAddress = `${String.fromCharCode(c)}${subtextRowNum}`;
          worksheet.getCell(cellAddress);
        }
      } catch (e) {
        subtextIsMerged = true;
      }
      
      if (!subtextIsMerged) {
        worksheet.mergeCells(subtextRange);
      }
      
      const subtextCell = worksheet.getCell(`${col}${subtextRowNum}`);
      subtextCell.value = subtext;
      subtextCell.font = {
        name: 'Arial',
        size: 10,
        color: { argb: COLORS.GRAY_DARK }
      };
      subtextCell.alignment = {
        horizontal: 'center',
        vertical: 'middle'
      };
      subtextCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: COLORS.DASHBOARD_METRIC_BG }
      };
      subtextRowNum++;
    }
    
    // إضافة حدود للمقياس بشكل آمن مع تصميم محسن
    try {
      // حدود خارجية للمقياس
      addTableBorder(worksheet, `${col}${row}`, `${endCol}${subtextRowNum-1}`, color);
      
      // حدود داخلية بين العنوان والقيمة
      for (let c = col.charCodeAt(0); c <= endCol.charCodeAt(0); c++) {
        const cellAddress = `${String.fromCharCode(c)}${row+1}`;
        const cell = worksheet.getCell(cellAddress);
        if (cell.border) {
          cell.border.top = { style: 'thin', color: { argb: COLORS.GRAY_MEDIUM } };
        } else {
          cell.border = { top: { style: 'thin', color: { argb: COLORS.GRAY_MEDIUM } } };
        }
      }
    } catch (borderError) {
      console.warn('Could not add border to metric:', borderError);
    }
    
    // إضافة مسافة بين المؤشرات
    return subtextRowNum + 1;
  } catch (error) {
    console.error('Error adding metric to sheet:', error);
    return row + 4; // إعادة رقم صف افتراضي في حالة الخطأ
  }
};

/**
 * إنشاء قسم في لوحة القيادة
 */
export const addDashboardSection = (
  worksheet: ExcelJS.Worksheet,
  title: string,
  startRow: number,
  endCol: string = 'L',
  color: string = COLORS.PRIMARY
) => {
  // دمج الخلايا للعنوان
  worksheet.mergeCells(`A${startRow}:${endCol}${startRow}`);
  
  // ضبط خلية العنوان
  const titleCell = worksheet.getCell(`A${startRow}`);
  titleCell.value = title;
  titleCell.font = {
    name: 'Arial',
    size: 14,
    bold: true,
    color: { argb: COLORS.WHITE }
  };
  titleCell.alignment = {
    horizontal: 'center',
    vertical: 'middle'
  };
  titleCell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: color }
  };
  
  // ضبط ارتفاع صف العنوان
  worksheet.getRow(startRow).height = 25;
  
  return startRow + 1; // إعادة رقم الصف التالي
};

/**
 * تصدير المصنف كملف
 */
export const exportWorkbook = async (workbook: ExcelJS.Workbook, fileName: string = 'exported_data.xlsx') => {
  try {
    // تحويل المصنف إلى تنسيق ثنائي
    const buffer = await workbook.xlsx.writeBuffer();
    
    // تحويل البيانات الثنائية إلى رابط تنزيل
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    
    // إنشاء رابط تنزيل وتفعيله
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    // تنظيف
    URL.revokeObjectURL(url);
    
    return true;
  } catch (error) {
    console.error('Error exporting Excel file:', error);
    return false;
  }
};

/**
 * إنشاء لوحة القيادة (Dashboard) في تنسيق أكثر تنظيماً (جميع المربعات بجانب بعضها أفقياً)
 */
export const createDashboard = (
  worksheet: ExcelJS.Worksheet, 
  title: string, 
  metrics: {
    title: string;
    value: number | string;
    options?: {
      color?: string;
      subtext?: string;
      width?: number;
    }
  }[],
  endCol: string = 'L'
) => {
  let currentRow = 1;
  
  // إضافة عنوان لوحة القيادة مع تصميم محسن
  addHeader(worksheet, title, 'A1', `${endCol}1`, HeaderLevel.DASHBOARD);
  
  currentRow += 2;
  
  // إضافة قسم "ملخص الأداء"
  const perfTitle = `A${currentRow}:${endCol}${currentRow}`;
  worksheet.mergeCells(perfTitle);
  const perfTitleCell = worksheet.getCell(`A${currentRow}`);
  perfTitleCell.value = 'ملخص الأداء';
  perfTitleCell.font = {
    name: 'Arial',
    size: 14,
    bold: true,
    color: { argb: COLORS.WHITE }
  };
  perfTitleCell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: COLORS.SECONDARY }
  };
  perfTitleCell.alignment = {
    horizontal: 'center',
    vertical: 'middle'
  };
  
  currentRow += 1;
  
  // تنظيم المقاييس في صف واحد متناسق
  if (metrics.length > 0) {
    const totalMetrics = metrics.length;
    const metricWidth = Math.floor((endCol.charCodeAt(0) - 'A'.charCodeAt(0) + 1) / totalMetrics);
    
    // إنشاء صف العناوين
    for (let i = 0; i < totalMetrics; i++) {
      const startCol = String.fromCharCode('A'.charCodeAt(0) + i * metricWidth);
      const endMetricCol = String.fromCharCode('A'.charCodeAt(0) + (i + 1) * metricWidth - 1);
      
      // دمج خلايا العنوان
      worksheet.mergeCells(`${startCol}${currentRow}:${endMetricCol}${currentRow}`);
      const headerCell = worksheet.getCell(`${startCol}${currentRow}`);
      headerCell.value = metrics[i].title;
      headerCell.font = {
        name: 'Arial',
        size: 12,
        bold: true,
        color: { argb: COLORS.BLACK }
      };
      headerCell.alignment = {
        horizontal: 'center',
        vertical: 'middle'
      };
      headerCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: COLORS.DASHBOARD_SUBHEADER }
      };
    }
    
    // إنشاء صف القيم
    currentRow += 1;
    for (let i = 0; i < totalMetrics; i++) {
      const startCol = String.fromCharCode('A'.charCodeAt(0) + i * metricWidth);
      const endMetricCol = String.fromCharCode('A'.charCodeAt(0) + (i + 1) * metricWidth - 1);
      const color = metrics[i].options?.color || COLORS.PRIMARY;
      
      // دمج خلايا القيمة
      worksheet.mergeCells(`${startCol}${currentRow}:${endMetricCol}${currentRow}`);
      const valueCell = worksheet.getCell(`${startCol}${currentRow}`);
      valueCell.value = metrics[i].value;
      valueCell.font = {
        name: 'Arial',
        size: 18,
        bold: true,
        color: { argb: color }
      };
      valueCell.alignment = {
        horizontal: 'center',
        vertical: 'middle'
      };
      valueCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: COLORS.DASHBOARD_METRIC_BG }
      };
      
      // إضافة حدود للمقياس
      addTableBorder(worksheet, `${startCol}${currentRow-1}`, `${endMetricCol}${currentRow}`, color);
    }
    
    // إضافة النص الفرعي إذا وجد
    const hasSubtext = metrics.some(m => m.options?.subtext);
    if (hasSubtext) {
      currentRow += 1;
      for (let i = 0; i < totalMetrics; i++) {
        if (metrics[i].options?.subtext) {
          const startCol = String.fromCharCode('A'.charCodeAt(0) + i * metricWidth);
          const endMetricCol = String.fromCharCode('A'.charCodeAt(0) + (i + 1) * metricWidth - 1);
          
          // دمج خلايا النص الفرعي
          worksheet.mergeCells(`${startCol}${currentRow}:${endMetricCol}${currentRow}`);
          const subtextCell = worksheet.getCell(`${startCol}${currentRow}`);
          subtextCell.value = metrics[i].options?.subtext;
          subtextCell.font = {
            name: 'Arial',
            size: 10,
            color: { argb: COLORS.GRAY_DARK }
          };
          subtextCell.alignment = {
            horizontal: 'center',
            vertical: 'middle'
          };
          subtextCell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: COLORS.DASHBOARD_METRIC_BG }
          };
        }
      }
    }
  }
  
  // ضبط ارتفاعات الصفوف
  worksheet.getRow(currentRow-1).height = 36; // صف القيم
  worksheet.getRow(currentRow-2).height = 24; // صف العناوين
  
  return currentRow + 3; // إعادة رقم الصف التالي مع ترك مساحة
}

/**
 * تصدير البيانات إلى ملف اكسل بتنسيق جميل ولوحة قيادة
 */
export const exportDataToExcel = async (
  data: {
    title: string;
    fileName: string;
    sheets: Array<{
      name: string;
      columns: ExcelColumn[];
      rows: Array<any>;
      headers?: Array<{ text: string; level?: HeaderLevel }>;
      dashboard?: {
        includeInDashboard: boolean;
        metrics?: {
          title: string;
          value: number | string;
          options?: {
            color?: string;
            subtext?: string;
            width?: number;
          }
        }[];
      };
    }>;
    dashboardMetrics?: {
      title: string;
      value: number | string;
      options?: {
        color?: string;
        subtext?: string;
        width?: number;
      }
    }[];
    hideReportInfo?: boolean;
  }
) => {
  try {
    // إنشاء مصنف جديد
    const workbook = createWorkbook();
    
    // إنشاء لوحة القيادة الرئيسية إذا كانت موجودة
    if (data.dashboardMetrics && data.dashboardMetrics.length > 0) {
      const dashboardSheet = addWorksheet(workbook, 'ملخص التقرير - الملخص');
      
      // تعديل الهوامش للورقة لضمان مناسبة المحتوى
      dashboardSheet.pageSetup.margins = {
        left: 0.25,
        right: 0.25,
        top: 0.25,
        bottom: 0.25,
        header: 0,
        footer: 0
      };
      
      // تعديل طريقة إنشاء لوحة القيادة لجعل الحدود مناسبة تماماً
      createDashboard(dashboardSheet, data.title, data.dashboardMetrics);
      
      // إضافة معلومات إضافية في لوحة القيادة - فقط إذا لم يتم طلب إخفاء معلومات التقرير
      if (!data.hideReportInfo) {
        const additionalInfoRow = dashboardSheet.lastRow?.number ? dashboardSheet.lastRow.number + 2 : 20;
        
        // إضافة قسم معلومات التقرير
        const infoSectionRow = addDashboardSection(
          dashboardSheet, 
          'معلومات التقرير', 
          additionalInfoRow, 
          'L', 
          COLORS.INFO
        );
        
        // مصفوفة من معلومات التقرير (العنوان والقيمة)
        const reportInfo = [
          { label: 'مولد بواسطة', value: 'S7teen Food App' },
          { label: 'تاريخ الإنشاء', value: format(new Date(), 'yyyy/MM/dd HH:mm:ss', { locale: arSA }) },
          { label: 'الفترة الزمنية', value: data.sheets[0]?.headers?.[0]?.text || 'تقرير كامل' }
        ];
        
        // إضافة معلومات التقرير في جدول
        const infoTableRow = infoSectionRow + 1;
        dashboardSheet.getCell(`A${infoTableRow}`).value = 'معلومات';
        dashboardSheet.getCell(`B${infoTableRow}`).value = 'القيمة';
        
        // تنسيق رؤوس الجدول
        [dashboardSheet.getCell(`A${infoTableRow}`), dashboardSheet.getCell(`B${infoTableRow}`)].forEach(cell => {
          cell.font = { bold: true, color: { argb: COLORS.WHITE } };
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.TABLE_HEADER } };
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
          cell.border = {
            top: { style: 'thin', color: { argb: COLORS.PRIMARY } },
            left: { style: 'thin', color: { argb: COLORS.PRIMARY } },
            bottom: { style: 'thin', color: { argb: COLORS.PRIMARY } },
            right: { style: 'thin', color: { argb: COLORS.PRIMARY } }
          };
        });
        
        // إضافة البيانات وتنسيقها
        reportInfo.forEach((info, index) => {
          const rowNum = infoTableRow + index + 1;
          dashboardSheet.getCell(`A${rowNum}`).value = info.label;
          dashboardSheet.getCell(`B${rowNum}`).value = info.value;
          
          // تنسيق الخلايا
          [dashboardSheet.getCell(`A${rowNum}`), dashboardSheet.getCell(`B${rowNum}`)].forEach((cell, cellIndex) => {
            cell.font = { 
              bold: cellIndex === 0,
              color: { argb: cellIndex === 0 ? COLORS.PRIMARY : COLORS.BLACK } 
            };
            cell.alignment = { horizontal: 'center', vertical: 'middle' };
            cell.fill = { 
              type: 'pattern', 
              pattern: 'solid', 
              fgColor: { argb: index % 2 === 0 ? 'F9FAFC' : 'D9E1F2' } 
            };
            cell.border = {
              top: { style: 'thin', color: { argb: 'E5E8EB' } },
              left: { style: 'thin', color: { argb: 'E5E8EB' } },
              bottom: { style: 'thin', color: { argb: 'E5E8EB' } },
              right: { style: 'thin', color: { argb: 'E5E8EB' } }
            };
          });
        });
        
        // إضافة حدود خارجية للجدول
        addTableBorder(
          dashboardSheet, 
          `A${infoTableRow}`, 
          `B${infoTableRow + reportInfo.length}`, 
          COLORS.PRIMARY
        );
      }
    }
    
    // إنشاء أوراق العمل
    for (const sheet of data.sheets) {
      // إنشاء ورقة عمل جديدة
      const worksheet = addWorksheet(workbook, sheet.name);
      
      // تعديل الهوامش للورقة لضمان مناسبة المحتوى
      worksheet.pageSetup.margins = {
        left: 0.25,
        right: 0.25,
        top: 0.25,
        bottom: 0.25,
        header: 0,
        footer: 0
      };
      
      // إضافة لوحة قيادة مصغرة إذا كانت مطلوبة لهذه الورقة
      let currentRow = 1;
      if (sheet.dashboard?.includeInDashboard && sheet.dashboard.metrics && sheet.dashboard.metrics.length > 0) {
        currentRow = createDashboard(
          worksheet, 
          `${sheet.name} - الملخص`, 
          sheet.dashboard.metrics, 
          String.fromCharCode(65 + Math.min(sheet.columns.length, 12))
        );
      }
      
      // إضافة عناوين إذا وجدت
      if (sheet.headers && sheet.headers.length > 0) {
        for (const header of sheet.headers) {
          const headerCell = addHeader(
            worksheet,
            header.text,
            `A${currentRow}`,
            `${String.fromCharCode(65 + Math.min(sheet.columns.length - 1, 25))}${currentRow}`,
            header.level || HeaderLevel.NORMAL
          );
          
          // تعديل حواف الخلية للتأكد من مناسبة الحدود
          if (headerCell && headerCell.border) {
            headerCell.border = {
              top: { style: 'thin', color: { argb: COLORS.PRIMARY } },
              left: { style: 'thin', color: { argb: COLORS.PRIMARY } },
              bottom: { style: 'thin', color: { argb: COLORS.PRIMARY } },
              right: { style: 'thin', color: { argb: COLORS.PRIMARY } }
            };
          }
          
          currentRow++;
          
          // إضافة مزيد من المساحة بعد العناوين الرئيسية
          if (header.level === HeaderLevel.DASHBOARD || header.level === HeaderLevel.MAIN) {
            currentRow++;
          }
        }
        
        // إضافة سطر فارغ بعد العناوين
        currentRow++;
      }
      
      // إنشاء الأعمدة في السطر الحالي
      worksheet.getRow(currentRow).values = sheet.columns.map(col => col.header);
      
      // تنسيق رؤوس الأعمدة بشكل محسن - تعديل الحدود لتكون أكثر مناسبة
      const headerRow = worksheet.getRow(currentRow);
      headerRow.height = 30;
      headerRow.eachCell((cell) => {
        cell.font = { 
          bold: true, 
          color: { argb: COLORS.WHITE },
          name: 'Arial',
          size: 12
        };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: COLORS.TABLE_HEADER }
        };
        cell.alignment = { 
          horizontal: 'center', 
          vertical: 'middle',
          wrapText: true
        };
        cell.border = {
          top: { style: 'thin', color: { argb: COLORS.PRIMARY } },
          left: { style: 'thin', color: { argb: COLORS.PRIMARY } },
          bottom: { style: 'thin', color: { argb: COLORS.PRIMARY } },
          right: { style: 'thin', color: { argb: COLORS.PRIMARY } }
        };
      });
      
      // تعيين عرض الأعمدة - تحسين لتناسب المحتوى بشكل أفضل
      worksheet.columns = sheet.columns.map(col => ({
        key: col.key,
        width: col.width,
        style: { alignment: { wrapText: true } }
      }));
      
      // إضافة الصفوف مع تنسيق محسن
      const startDataRow = currentRow + 1;
      for (const rowData of sheet.rows) {
        const formattedData: any = {};
        
        for (const col of sheet.columns) {
          const value = rowData[col.key];
          
          if (value === undefined || value === null) {
            formattedData[col.key] = '';
            continue;
          }
          
          switch(col.type) {
            case ColumnType.MONEY:
              formattedData[col.key] = typeof value === 'number' 
                ? value.toLocaleString('en-US') + ' ج.م' 
                : value;
              break;
              
            case ColumnType.DATE:
              try {
                formattedData[col.key] = typeof value === 'string' 
                  ? format(parseISO(value), col.format || 'yyyy/MM/dd', { locale: arSA }) 
                  : value;
              } catch {
                formattedData[col.key] = value;
              }
              break;
              
            case ColumnType.PERCENTAGE:
              formattedData[col.key] = typeof value === 'number' 
                ? value.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + '%' 
                : value;
              break;
              
            case ColumnType.NUMBER:
              formattedData[col.key] = typeof value === 'number' 
                ? value.toLocaleString('en-US') 
                : value;
              break;
              
            case ColumnType.STATUS:
              // مع اختيار لون مختلف حسب الحالة
              formattedData[col.key] = value;
              break;
              
            case ColumnType.TEXT:
            default:
              formattedData[col.key] = value;
              break;
          }
        }
        
        worksheet.addRow(formattedData);
      }
      
      // تنسيق الصفوف بألوان متناوبة وتحسين القراءة - تعديل لجعل الحدود أكثر انسجاماً
      formatRowsWithAlternatingColors(
        worksheet, 
        startDataRow, 
        sheet.rows.length,
        'E6EFF7', // أزرق فاتح أكثر وضوحًا
        'FFFFFF', // أبيض للصفوف الفردية
        sheet.columns
      );
      
      // تنسيق خاص للخلايا بناءً على نوعها
      for (let rowIndex = 0; rowIndex < sheet.rows.length; rowIndex++) {
        const row = worksheet.getRow(startDataRow + rowIndex);
        
        row.eachCell((cell, colIndex) => {
          const column = sheet.columns[colIndex - 1];
          if (!column) return;
          
          // تنسيق خاص حسب نوع العمود
          if (column.type === ColumnType.STATUS) {
            const status = cell.value?.toString().toLowerCase();
            let color = COLORS.INFO;
            
            // تحديد اللون حسب الحالة
            if (status?.includes('مكتمل') || status?.includes('ناجح')) {
              color = COLORS.SUCCESS;
            } else if (status?.includes('ملغي') || status?.includes('مرفوض') || status?.includes('فشل')) {
              color = COLORS.DANGER;
            } else if (status?.includes('قيد') || status?.includes('معلق') || status?.includes('جار')) {
              color = COLORS.WARNING;
            }
            
            cell.font = { 
              bold: true,
              color: { argb: color }
            };
          }
          
          // توسيط جميع الخلايا للحصول على مظهر أنظف
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
        });
        
        // تعيين ارتفاع مناسب للصف لتحسين القراءة
        row.height = 22;
      }
      
      // إضافة حدود خارجية للجدول - تعديل نمط الحدود لتكون أكثر دقة
      if (sheet.rows.length > 0) {
        addTableBorder(
          worksheet,
          `A${currentRow}`,
          `${String.fromCharCode(65 + Math.min(sheet.columns.length - 1, 25))}${startDataRow + sheet.rows.length - 1}`,
          COLORS.PRIMARY,
          'thin' // تغيير سمك الحدود من medium إلى thin
        );
      }
      
      // إضافة تذييل محسن
      const footerRow = startDataRow + sheet.rows.length + 1;
      worksheet.mergeCells(`A${footerRow}:${String.fromCharCode(65 + Math.min(sheet.columns.length - 1, 25))}${footerRow}`);
      const footerCell = worksheet.getCell(`A${footerRow}`);
      footerCell.value = `تم إنشاء التقرير بتاريخ ${format(new Date(), "yyyy/MM/dd HH:mm", { locale: arSA })}`;
      footerCell.font = {
        name: 'Arial',
        size: 10,
        italic: true,
        color: { argb: COLORS.GRAY_DARK }
      };
      footerCell.alignment = { horizontal: 'center' };
      
      // إضافة شعار أو اسم التطبيق في نهاية الورقة
      const brandRow = footerRow + 2;
      worksheet.mergeCells(`A${brandRow}:${String.fromCharCode(65 + Math.min(sheet.columns.length - 1, 25))}${brandRow}`);
      const brandCell = worksheet.getCell(`A${brandRow}`);
      brandCell.value = 'S7teen Food App - تقرير تم إنشاؤه تلقائياً';
      brandCell.font = {
        name: 'Arial',
        size: 12,
        bold: true,
        color: { argb: COLORS.PRIMARY }
      };
      brandCell.alignment = { horizontal: 'center' };
    }
    
    // تصدير المصنف
    await exportWorkbook(workbook, data.fileName);
    
    return true;
  } catch (error) {
    console.error('Error exporting data to Excel:', error);
    return false;
  }
};