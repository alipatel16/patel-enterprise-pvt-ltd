/**
 * Export Helpers
 * Utility functions for exporting data to various formats (Excel, CSV, PDF)
 */

import { formatCurrency, formatDate } from './formatHelpers';
import { EXPORT_FORMATS } from '../constants';

/**
 * Export data to CSV format
 * @param {Array} data - Array of objects to export
 * @param {string} filename - Name of the file
 * @param {Array} columns - Column configurations
 * @returns {void}
 */
export const exportToCSV = (data, filename, columns = []) => {
  try {
    if (!data || data.length === 0) {
      throw new Error('No data to export');
    }

    // Generate CSV headers
    const headers = columns.length > 0 
      ? columns.map(col => col.header || col.key)
      : Object.keys(data[0]);

    // Generate CSV rows
    const csvRows = [
      headers.join(','), // Header row
      ...data.map(row => {
        const values = columns.length > 0
          ? columns.map(col => {
              const value = getNestedValue(row, col.key);
              return formatValueForCSV(value, col.type);
            })
          : Object.values(row).map(value => formatValueForCSV(value));
        
        return values.join(',');
      })
    ];

    // Create and download CSV
    const csvContent = csvRows.join('\n');
    downloadFile(csvContent, `${filename}.csv`, 'text/csv');
    
    return { success: true, message: 'CSV exported successfully' };
  } catch (error) {
    console.error('Error exporting to CSV:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Export customer data to Excel
 * @param {Array} customers - Customer data array
 * @param {string} filename - Filename without extension
 * @returns {Object} Export result
 */
export const exportCustomersToExcel = (customers, filename = 'customers') => {
  const columns = [
    { key: 'name', header: 'Customer Name', type: 'string' },
    { key: 'phone', header: 'Phone Number', type: 'string' },
    { key: 'email', header: 'Email Address', type: 'string' },
    { key: 'customerType', header: 'Customer Type', type: 'string' },
    { key: 'customerCategory', header: 'Category', type: 'string' },
    { key: 'address.city', header: 'City', type: 'string' },
    { key: 'address.state', header: 'State', type: 'string' },
    { key: 'totalPurchases', header: 'Total Purchases', type: 'currency' },
    { key: 'lastPurchaseDate', header: 'Last Purchase', type: 'date' },
    { key: 'status', header: 'Status', type: 'string' },
    { key: 'createdAt', header: 'Created Date', type: 'date' }
  ];

  return exportToExcel(customers, filename, columns, 'Customers');
};

/**
 * Export sales data to Excel
 * @param {Array} sales - Sales data array
 * @param {string} filename - Filename without extension
 * @returns {Object} Export result
 */
export const exportSalesToExcel = (sales, filename = 'sales') => {
  const columns = [
    { key: 'invoiceNumber', header: 'Invoice Number', type: 'string' },
    { key: 'customer.name', header: 'Customer Name', type: 'string' },
    { key: 'customer.phone', header: 'Customer Phone', type: 'string' },
    { key: 'date', header: 'Sale Date', type: 'date' },
    { key: 'items.length', header: 'Items Count', type: 'number' },
    { key: 'subTotal', header: 'Subtotal', type: 'currency' },
    { key: 'totalGST', header: 'GST Amount', type: 'currency' },
    { key: 'totalAmount', header: 'Total Amount', type: 'currency' },
    { key: 'paymentStatus', header: 'Payment Status', type: 'string' },
    { key: 'deliveryStatus', header: 'Delivery Status', type: 'string' },
    { key: 'salesPerson.name', header: 'Sales Person', type: 'string' }
  ];

  return exportToExcel(sales, filename, columns, 'Sales');
};

/**
 * Export employee data to Excel
 * @param {Array} employees - Employee data array
 * @param {string} filename - Filename without extension
 * @returns {Object} Export result
 */
export const exportEmployeesToExcel = (employees, filename = 'employees') => {
  const columns = [
    { key: 'name', header: 'Employee Name', type: 'string' },
    { key: 'email', header: 'Email Address', type: 'string' },
    { key: 'phone', header: 'Phone Number', type: 'string' },
    { key: 'designation', header: 'Designation', type: 'string' },
    { key: 'department', header: 'Department', type: 'string' },
    { key: 'role', header: 'Role', type: 'string' },
    { key: 'salary', header: 'Salary', type: 'currency' },
    { key: 'joinedDate', header: 'Joined Date', type: 'date' },
    { key: 'address', header: 'Address', type: 'string' },
    { key: 'isActive', header: 'Status', type: 'boolean' }
  ];

  return exportToExcel(employees, filename, columns, 'Employees');
};

/**
 * Export data to Excel format (simulated - would use a library like SheetJS)
 * @param {Array} data - Data to export
 * @param {string} filename - Filename without extension
 * @param {Array} columns - Column configurations
 * @param {string} sheetName - Excel sheet name
 * @returns {Object} Export result
 */
export const exportToExcel = (data, filename, columns = [], sheetName = 'Sheet1') => {
  try {
    if (!data || data.length === 0) {
      throw new Error('No data to export');
    }

    // In a real implementation, you would use SheetJS (xlsx library)
    // For now, we'll create a CSV as fallback
    console.warn('Excel export not implemented. Falling back to CSV.');
    return exportToCSV(data, filename, columns);
    
    // Real Excel implementation would look like:
    /*
    import * as XLSX from 'xlsx';
    
    const worksheet = XLSX.utils.json_to_sheet(
      data.map(row => {
        const processedRow = {};
        columns.forEach(col => {
          const value = getNestedValue(row, col.key);
          processedRow[col.header] = formatValueForExcel(value, col.type);
        });
        return processedRow;
      })
    );
    
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    
    XLSX.writeFile(workbook, `${filename}.xlsx`);
    */
    
  } catch (error) {
    console.error('Error exporting to Excel:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Export invoice to PDF
 * @param {Object} invoice - Invoice data
 * @param {string} filename - PDF filename
 * @returns {Object} Export result
 */
export const exportInvoiceToPDF = (invoice, filename) => {
  try {
    // In a real implementation, you would use a PDF library like jsPDF or html2pdf
    console.warn('PDF export not implemented. Using browser print dialog.');
    
    // For now, use browser's print functionality
    window.print();
    
    return { success: true, message: 'PDF generation initiated' };
    
    // Real PDF implementation would look like:
    /*
    import html2pdf from 'html2pdf.js';
    
    const element = document.getElementById('invoice-preview');
    const options = {
      margin: 0.5,
      filename: `${filename}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
    };
    
    return html2pdf().set(options).from(element).save();
    */
    
  } catch (error) {
    console.error('Error exporting to PDF:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Generate sales report
 * @param {Array} sales - Sales data
 * @param {Object} filters - Report filters
 * @param {string} format - Export format
 * @returns {Object} Export result
 */
export const generateSalesReport = (sales, filters = {}, format = EXPORT_FORMATS.EXCEL) => {
  try {
    // Filter data based on criteria
    let filteredSales = [...sales];

    if (filters.startDate) {
      filteredSales = filteredSales.filter(sale => 
        new Date(sale.date) >= new Date(filters.startDate)
      );
    }

    if (filters.endDate) {
      filteredSales = filteredSales.filter(sale => 
        new Date(sale.date) <= new Date(filters.endDate)
      );
    }

    if (filters.paymentStatus) {
      filteredSales = filteredSales.filter(sale => 
        sale.paymentStatus === filters.paymentStatus
      );
    }

    if (filters.minAmount) {
      filteredSales = filteredSales.filter(sale => 
        sale.totalAmount >= filters.minAmount
      );
    }

    // Generate report with summary
    const report = {
      data: filteredSales,
      summary: {
        totalSales: filteredSales.length,
        totalRevenue: filteredSales.reduce((sum, sale) => sum + sale.totalAmount, 0),
        averageOrderValue: filteredSales.length > 0 
          ? filteredSales.reduce((sum, sale) => sum + sale.totalAmount, 0) / filteredSales.length 
          : 0,
        gstCollected: filteredSales.reduce((sum, sale) => sum + (sale.totalGST || 0), 0),
        pendingPayments: filteredSales.filter(sale => sale.paymentStatus === 'pending').length
      },
      filters,
      generatedAt: new Date()
    };

    // Export based on format
    const filename = `sales-report-${formatDate(new Date(), 'YYYY-MM-DD')}`;
    
    switch (format) {
      case EXPORT_FORMATS.CSV:
        return exportSalesToCSV(report.data, filename);
      case EXPORT_FORMATS.EXCEL:
        return exportSalesToExcel(report.data, filename);
      case EXPORT_FORMATS.JSON:
        return exportToJSON(report, filename);
      default:
        throw new Error('Unsupported export format');
    }
  } catch (error) {
    console.error('Error generating sales report:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Export data to JSON format
 * @param {Object} data - Data to export
 * @param {string} filename - Filename without extension
 * @returns {Object} Export result
 */
export const exportToJSON = (data, filename) => {
  try {
    const jsonContent = JSON.stringify(data, null, 2);
    downloadFile(jsonContent, `${filename}.json`, 'application/json');
    
    return { success: true, message: 'JSON exported successfully' };
  } catch (error) {
    console.error('Error exporting to JSON:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get nested object value using dot notation
 * @param {Object} obj - Object to get value from
 * @param {string} path - Dot notation path (e.g., 'customer.address.city')
 * @returns {any} Nested value
 */
export const getNestedValue = (obj, path) => {
  if (!obj || !path) return '';
  
  return path.split('.').reduce((current, key) => {
    return current && current[key] !== undefined ? current[key] : '';
  }, obj);
};

/**
 * Format value for CSV export
 * @param {any} value - Value to format
 * @param {string} type - Data type
 * @returns {string} Formatted value
 */
export const formatValueForCSV = (value, type = 'string') => {
  if (value === null || value === undefined) return '';
  
  switch (type) {
    case 'currency':
      return formatCurrency(value, false);
    case 'date':
      return formatDate(value);
    case 'boolean':
      return value ? 'Yes' : 'No';
    case 'array':
      return Array.isArray(value) ? value.join('; ') : String(value);
    default:
      // Escape commas and quotes for CSV
      let stringValue = String(value);
      if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
        stringValue = `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
  }
};

/**
 * Download file to user's device
 * @param {string} content - File content
 * @param {string} filename - File name with extension
 * @param {string} mimeType - MIME type
 * @returns {void}
 */
export const downloadFile = (content, filename, mimeType) => {
  try {
    const blob = new Blob([content], { type: mimeType });
    const url = window.URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error downloading file:', error);
    throw new Error('Failed to download file');
  }
};

/**
 * Generate GST report data
 * @param {Array} sales - Sales data
 * @param {string} month - Month (MM format)
 * @param {string} year - Year (YYYY format)
 * @returns {Object} GST report data
 */
export const generateGSTReport = (sales, month, year) => {
  try {
    const filteredSales = sales.filter(sale => {
      const saleDate = new Date(sale.date);
      return saleDate.getMonth() + 1 === parseInt(month) && 
             saleDate.getFullYear() === parseInt(year);
    });

    const gstSummary = {
      period: `${month}/${year}`,
      totalSales: filteredSales.length,
      totalTaxableValue: 0,
      totalCGST: 0,
      totalSGST: 0,
      totalIGST: 0,
      totalGST: 0,
      details: []
    };

    filteredSales.forEach(sale => {
      gstSummary.totalTaxableValue += sale.subTotal || 0;
      gstSummary.totalCGST += sale.cgst || 0;
      gstSummary.totalSGST += sale.sgst || 0;
      gstSummary.totalIGST += sale.igst || 0;
      gstSummary.totalGST += sale.totalGST || 0;

      gstSummary.details.push({
        invoiceNumber: sale.invoiceNumber,
        date: sale.date,
        customerName: sale.customer?.name || '',
        customerGST: sale.customer?.gstNumber || '',
        taxableValue: sale.subTotal || 0,
        cgst: sale.cgst || 0,
        sgst: sale.sgst || 0,
        igst: sale.igst || 0,
        totalGST: sale.totalGST || 0,
        totalAmount: sale.totalAmount || 0
      });
    });

    return gstSummary;
  } catch (error) {
    console.error('Error generating GST report:', error);
    throw error;
  }
};

/**
 * Export GST report
 * @param {Array} sales - Sales data
 * @param {string} month - Month
 * @param {string} year - Year
 * @param {string} format - Export format
 * @returns {Object} Export result
 */
export const exportGSTReport = (sales, month, year, format = EXPORT_FORMATS.EXCEL) => {
  try {
    const gstData = generateGSTReport(sales, month, year);
    const filename = `gst-report-${month}-${year}`;

    const columns = [
      { key: 'invoiceNumber', header: 'Invoice Number', type: 'string' },
      { key: 'date', header: 'Date', type: 'date' },
      { key: 'customerName', header: 'Customer Name', type: 'string' },
      { key: 'customerGST', header: 'Customer GST', type: 'string' },
      { key: 'taxableValue', header: 'Taxable Value', type: 'currency' },
      { key: 'cgst', header: 'CGST', type: 'currency' },
      { key: 'sgst', header: 'SGST', type: 'currency' },
      { key: 'igst', header: 'IGST', type: 'currency' },
      { key: 'totalGST', header: 'Total GST', type: 'currency' },
      { key: 'totalAmount', header: 'Total Amount', type: 'currency' }
    ];

    switch (format) {
      case EXPORT_FORMATS.CSV:
        return exportToCSV(gstData.details, filename, columns);
      case EXPORT_FORMATS.EXCEL:
        return exportToExcel(gstData.details, filename, columns, 'GST Report');
      default:
        throw new Error('Unsupported format for GST report');
    }
  } catch (error) {
    console.error('Error exporting GST report:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Generate customer statement
 * @param {Object} customer - Customer data
 * @param {Array} sales - Customer's sales data
 * @param {Object} filters - Date filters
 * @returns {Object} Customer statement data
 */
export const generateCustomerStatement = (customer, sales, filters = {}) => {
  try {
    let filteredSales = [...sales];

    if (filters.startDate) {
      filteredSales = filteredSales.filter(sale => 
        new Date(sale.date) >= new Date(filters.startDate)
      );
    }

    if (filters.endDate) {
      filteredSales = filteredSales.filter(sale => 
        new Date(sale.date) <= new Date(filters.endDate)
      );
    }

    const statement = {
      customer,
      period: {
        startDate: filters.startDate,
        endDate: filters.endDate
      },
      summary: {
        totalTransactions: filteredSales.length,
        totalAmount: filteredSales.reduce((sum, sale) => sum + sale.totalAmount, 0),
        totalPaid: filteredSales
          .filter(sale => sale.paymentStatus === 'paid')
          .reduce((sum, sale) => sum + sale.totalAmount, 0),
        totalPending: filteredSales
          .filter(sale => sale.paymentStatus === 'pending')
          .reduce((sum, sale) => sum + sale.totalAmount, 0)
      },
      transactions: filteredSales.map(sale => ({
        date: sale.date,
        invoiceNumber: sale.invoiceNumber,
        description: `${sale.items?.length || 0} items`,
        amount: sale.totalAmount,
        status: sale.paymentStatus,
        balance: sale.paymentStatus === 'pending' ? sale.totalAmount : 0
      })),
      generatedAt: new Date()
    };

    return statement;
  } catch (error) {
    console.error('Error generating customer statement:', error);
    throw error;
  }
};

/**
 * Export customer statement
 * @param {Object} customer - Customer data
 * @param {Array} sales - Customer's sales data
 * @param {Object} filters - Date filters
 * @param {string} format - Export format
 * @returns {Object} Export result
 */
export const exportCustomerStatement = (customer, sales, filters = {}, format = EXPORT_FORMATS.PDF) => {
  try {
    const statement = generateCustomerStatement(customer, sales, filters);
    const filename = `statement-${customer.name?.replace(/\s+/g, '-')}-${formatDate(new Date(), 'YYYY-MM-DD')}`;

    switch (format) {
      case EXPORT_FORMATS.PDF:
        return exportInvoiceToPDF(statement, filename);
      case EXPORT_FORMATS.CSV:
        const columns = [
          { key: 'date', header: 'Date', type: 'date' },
          { key: 'invoiceNumber', header: 'Invoice Number', type: 'string' },
          { key: 'description', header: 'Description', type: 'string' },
          { key: 'amount', header: 'Amount', type: 'currency' },
          { key: 'status', header: 'Status', type: 'string' },
          { key: 'balance', header: 'Balance', type: 'currency' }
        ];
        return exportToCSV(statement.transactions, filename, columns);
      default:
        throw new Error('Unsupported format for customer statement');
    }
  } catch (error) {
    console.error('Error exporting customer statement:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Bulk export utility
 * @param {Object} exportConfig - Export configuration
 * @returns {Promise<Object>} Export result
 */
export const bulkExport = async (exportConfig) => {
  const {
    type,        // 'customers', 'sales', 'employees'
    data,        // Data to export
    format = EXPORT_FORMATS.EXCEL,
    filters = {},
    filename
  } = exportConfig;

  try {
    const timestamp = formatDate(new Date(), 'YYYY-MM-DD');
    const defaultFilename = `${type}-export-${timestamp}`;

    switch (type) {
      case 'customers':
        return exportCustomersToExcel(data, filename || defaultFilename);
      case 'sales':
        return exportSalesToExcel(data, filename || defaultFilename);
      case 'employees':
        return exportEmployeesToExcel(data, filename || defaultFilename);
      case 'gst':
        return exportGSTReport(data, filters.month, filters.year, format);
      default:
        throw new Error('Unsupported export type');
    }
  } catch (error) {
    console.error('Error in bulk export:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Validate export data
 * @param {Array} data - Data to validate
 * @param {string} type - Data type
 * @returns {Object} Validation result
 */
export const validateExportData = (data, type) => {
  if (!data || !Array.isArray(data)) {
    return { isValid: false, error: 'Invalid data format' };
  }

  if (data.length === 0) {
    return { isValid: false, error: 'No data available for export' };
  }

  // Type-specific validation
  switch (type) {
    case 'customers':
      if (!data[0].name) {
        return { isValid: false, error: 'Customer data missing required fields' };
      }
      break;
    case 'sales':
      if (!data[0].invoiceNumber) {
        return { isValid: false, error: 'Sales data missing required fields' };
      }
      break;
    default:
      break;
  }

  return { isValid: true, error: '' };
};

export default {
  exportToCSV,
  exportToExcel,
  exportInvoiceToPDF,
  exportCustomersToExcel,
  exportSalesToExcel,
  exportEmployeesToExcel,
  generateSalesReport,
  exportGSTReport,
  generateCustomerStatement,
  exportCustomerStatement,
  bulkExport,
  validateExportData,
  getNestedValue,
  formatValueForCSV,
  downloadFile
};