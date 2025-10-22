/**
 * Constants Index
 * Central export file for all application constants
 */

// Import all constants
import {
  USER_TYPES,
  USER_TYPE_DISPLAY_NAMES,
  APP_COLORS,
  USER_TYPE_CONFIG,
  USER_TYPE_NAVIGATION,
  DASHBOARD_WIDGETS,
  USER_TYPE_VALIDATION,
  DOCUMENT_TEMPLATES,
  DEFAULT_USER_TYPE_SETTINGS
} from './userTypeConstants';

import {
  USER_ROLES,
  PERMISSIONS,
  ROLE_CONFIG,
  DEPARTMENTS,
  DEPARTMENT_CONFIG,
  ACCESS_LEVELS,
  FEATURE_PERMISSIONS,
  DEFAULT_ROLE_ASSIGNMENTS,
  ROLE_HIERARCHY,
  SECURITY_SETTINGS
} from './roleConstants';

import {
  CUSTOMER_TYPES,
  CUSTOMER_CATEGORIES,
  CUSTOMER_TYPE_DISPLAY_NAMES,
  CUSTOMER_CATEGORY_DISPLAY_NAMES,
  CUSTOMER_TYPE_CONFIG,
  CUSTOMER_CATEGORY_CONFIG,
  CUSTOMER_PRIORITY,
  CUSTOMER_STATUS,
  LEAD_SOURCES,
  DISCOUNT_TYPES,
  CUSTOMER_PREFERENCES,
  DEFAULT_CREDIT_LIMITS,
  CUSTOMER_VALIDATION_RULES
} from './customerTypes';

import {
  GST_TYPES,
  GST_RATES,
  PRODUCT_GST_RATES,
  GST_DISPLAY_NAMES,
  INDIAN_STATES,
  GST_STATE_CODES,
  GST_EXEMPTIONS,
  GST_CALCULATION_METHODS,
  GST_FILING_FREQUENCIES,
  COMMON_HSN_CODES,
  GST_VALIDATION,
  GST_ERROR_MESSAGES,
  GST_TAX_SLABS,
  DEFAULT_GST_SETTINGS,
  GST_REGISTRATION_TYPES
} from './gstConstants';

import getConstants from './getConstants';

// Application-wide constants
export const APP_INFO = {
  NAME: 'Showroom Management System',
  VERSION: '1.0.0',
  AUTHOR: 'Your Company',
  DESCRIPTION: 'Complete showroom management solution for electronics and furniture stores'
};

// Collections (Firebase)
export const COLLECTIONS = {
  CUSTOMERS: 'customers',
  EMPLOYEES: 'employees',
  SALES: 'sales',
  INVOICES: 'invoices',
  SETTINGS: 'settings',
  NOTIFICATIONS: 'notifications',
  AUDIT_LOGS: 'audit_logs',
  GIFT_INVOICES: 'gift_invoices',
  GIFT_SETS: 'gift_sets'
};

// Gift Invoice Status (overall invoice status)
export const GIFT_INVOICE_STATUS = {
  ACTIVE: 'active',
  COMPLETED: 'completed', // When all items delivered
  CANCELLED: 'cancelled'
};

export const GIFT_INVOICE_STATUS_DISPLAY = {
  active: 'Active',
  completed: 'Completed',
  cancelled: 'Cancelled'
};

export const GIFT_INVOICE_STATUS_COLORS = {
  active: 'info',
  completed: 'success',
  cancelled: 'error'
};

// NEW: Item Delivery Status (per-item status)
export const ITEM_DELIVERY_STATUS = {
  PENDING: 'pending',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled'
};

export const ITEM_DELIVERY_STATUS_DISPLAY = {
  pending: 'Pending',
  delivered: 'Delivered',
  cancelled: 'Cancelled'
};

export const ITEM_DELIVERY_STATUS_COLORS = {
  pending: 'warning',
  delivered: 'success',
  cancelled: 'error'
};

// Payment Status
export const PAYMENT_STATUS = {
  PENDING: 'pending',
  PAID: 'paid',
  PARTIAL: 'partial',
  OVERDUE: 'overdue',
  EMI: 'emi',
  CANCELLED: 'cancelled'
};

// Delivery Status
export const DELIVERY_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  SHIPPED: 'shipped',
  OUT_FOR_DELIVERY: 'out_for_delivery',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
  RETURNED: 'returned'
};

// Payment Methods
export const PAYMENT_METHODS = {
  CASH: 'cash',
  CARD: 'card',
  UPI: 'upi',
  NET_BANKING: 'net_banking',
  CHEQUE: 'cheque',
  EMI: 'emi'
};

// Invoice Status
export const INVOICE_STATUS = {
  DRAFT: 'draft',
  SENT: 'sent',
  PAID: 'paid',
  OVERDUE: 'overdue',
  CANCELLED: 'cancelled'
};

// File Upload Limits
export const UPLOAD_LIMITS = {
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_TYPES: ['image/jpeg', 'image/png', 'application/pdf'],
  MAX_FILES: 10
};

// Date Formats
export const DATE_FORMATS = {
  DISPLAY: 'DD/MM/YYYY',
  DISPLAY_WITH_TIME: 'DD/MM/YYYY HH:mm',
  API: 'YYYY-MM-DD',
  TIMESTAMP: 'YYYY-MM-DD HH:mm:ss'
};

// Currency Settings
export const CURRENCY_SETTINGS = {
  SYMBOL: '₹',
  CODE: 'INR',
  DECIMAL_PLACES: 2,
  THOUSANDS_SEPARATOR: ',',
  DECIMAL_SEPARATOR: '.'
};

// Validation Messages
export const VALIDATION_MESSAGES = {
  REQUIRED: 'This field is required',
  INVALID_EMAIL: 'Please enter a valid email address',
  INVALID_PHONE: 'Please enter a valid 10-digit phone number',
  INVALID_GST: 'Please enter a valid GST number',
  PASSWORD_TOO_SHORT: 'Password must be at least 6 characters',
  PASSWORDS_DONT_MATCH: 'Passwords do not match',
  MIN_LENGTH: (length) => `Minimum ${length} characters required`,
  MAX_LENGTH: (length) => `Maximum ${length} characters allowed`,
  INVALID_FORMAT: 'Invalid format',
  FUTURE_DATE_NOT_ALLOWED: 'Future date is not allowed',
  PAST_DATE_NOT_ALLOWED: 'Past date is not allowed'
};

// API Endpoints (if using external APIs)
export const API_ENDPOINTS = {
  BASE_URL: process.env.REACT_APP_API_URL || '',
  CUSTOMERS: '/customers',
  EMPLOYEES: '/employees',
  SALES: '/sales',
  INVOICES: '/invoices',
  REPORTS: '/reports',
  NOTIFICATIONS: '/notifications'
};

// Local Storage Keys
export const STORAGE_KEYS = {
  USER_TYPE: 'userType',
  THEME_MODE: 'themeMode',
  LANGUAGE: 'language',
  USER_PREFERENCES: 'userPreferences',
  LAST_LOGIN: 'lastLogin',
  REMEMBER_ME: 'rememberMe'
};

// Notification Types
export const NOTIFICATION_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info'
};

// EMI Configuration
export const EMI_CONFIG = {
  MIN_AMOUNT: 10000,        // Minimum amount for EMI (₹10,000)
  MAX_INSTALLMENTS: 24,     // Maximum installments
  MIN_INSTALLMENTS: 3,      // Minimum installments
  INTEREST_RATES: {
    [CUSTOMER_TYPES.WHOLESALER]: 12, // 12% annual
    [CUSTOMER_TYPES.RETAILER]: 15    // 15% annual
  },
  PROCESSING_FEE: 200       // Processing fee in rupees
};

// Report Types
export const REPORT_TYPES = {
  SALES: 'sales',
  CUSTOMER: 'customer',
  EMPLOYEE: 'employee',
  FINANCIAL: 'financial',
  GST: 'gst',
  EMI: 'emi',
  DELIVERY: 'delivery'
};

// Export Formats
export const EXPORT_FORMATS = {
  PDF: 'pdf',
  EXCEL: 'excel',
  CSV: 'csv',
  JSON: 'json'
};

// Theme Modes
export const THEME_MODES = {
  LIGHT: 'light',
  DARK: 'dark',
  AUTO: 'auto'
};

// Breakpoints (Material-UI)
export const BREAKPOINTS = {
  XS: 0,      // Extra small: 0px and up
  SM: 600,    // Small: 600px and up
  MD: 960,    // Medium: 960px and up
  LG: 1280,   // Large: 1280px and up
  XL: 1920    // Extra large: 1920px and up
};

// Z-Index levels
export const Z_INDEX = {
  DRAWER: 1200,
  MODAL: 1300,
  SNACKBAR: 1400,
  TOOLTIP: 1500,
  LOADING: 9999
};

// Re-export all constants
export {
  // User Type Constants
  USER_TYPES,
  USER_TYPE_DISPLAY_NAMES,
  APP_COLORS,
  USER_TYPE_CONFIG,
  USER_TYPE_NAVIGATION,
  DASHBOARD_WIDGETS,
  USER_TYPE_VALIDATION,
  DOCUMENT_TEMPLATES,
  DEFAULT_USER_TYPE_SETTINGS,

  // Role Constants
  USER_ROLES,
  PERMISSIONS,
  ROLE_CONFIG,
  DEPARTMENTS,
  DEPARTMENT_CONFIG,
  ACCESS_LEVELS,
  FEATURE_PERMISSIONS,
  DEFAULT_ROLE_ASSIGNMENTS,
  ROLE_HIERARCHY,
  SECURITY_SETTINGS,

  // Customer Constants
  CUSTOMER_TYPES,
  CUSTOMER_CATEGORIES,
  CUSTOMER_TYPE_DISPLAY_NAMES,
  CUSTOMER_CATEGORY_DISPLAY_NAMES,
  CUSTOMER_TYPE_CONFIG,
  CUSTOMER_CATEGORY_CONFIG,
  CUSTOMER_PRIORITY,
  CUSTOMER_STATUS,
  LEAD_SOURCES,
  DISCOUNT_TYPES,
  CUSTOMER_PREFERENCES,
  DEFAULT_CREDIT_LIMITS,
  CUSTOMER_VALIDATION_RULES,

  // GST Constants
  GST_TYPES,
  GST_RATES,
  PRODUCT_GST_RATES,
  GST_DISPLAY_NAMES,
  INDIAN_STATES,
  GST_STATE_CODES,
  GST_EXEMPTIONS,
  GST_CALCULATION_METHODS,
  GST_FILING_FREQUENCIES,
  COMMON_HSN_CODES,
  GST_VALIDATION,
  GST_ERROR_MESSAGES,
  GST_TAX_SLABS,
  DEFAULT_GST_SETTINGS,
  GST_REGISTRATION_TYPES,

  // Utility functions
  getConstants
};

export default {
  APP_INFO,
  COLLECTIONS,
  PAYMENT_STATUS,
  DELIVERY_STATUS,
  PAYMENT_METHODS,
  INVOICE_STATUS,
  UPLOAD_LIMITS,
  DATE_FORMATS,
  CURRENCY_SETTINGS,
  VALIDATION_MESSAGES,
  API_ENDPOINTS,
  STORAGE_KEYS,
  NOTIFICATION_TYPES,
  EMI_CONFIG,
  REPORT_TYPES,
  EXPORT_FORMATS,
  THEME_MODES,
  BREAKPOINTS,
  Z_INDEX,
  
  // Re-exported constants
  USER_TYPES,
  USER_ROLES,
  CUSTOMER_TYPES,
  CUSTOMER_CATEGORIES,
  GST_TYPES,
  GST_RATES,
  PERMISSIONS,
  getConstants
};