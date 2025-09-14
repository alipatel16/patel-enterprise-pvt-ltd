// User Types
export const USER_TYPES = {
  ELECTRONICS: 'electronics',
  FURNITURE: 'furniture'
};

// User Roles
export const USER_ROLES = {
  ADMIN: 'admin',
  EMPLOYEE: 'employee',
  MANAGER: 'manager',
  INTERN: 'intern'
};

// Customer Types
export const CUSTOMER_TYPES = {
  WHOLESALER: 'wholesaler',
  RETAILER: 'retailer'
};

// Customer Categories
export const CUSTOMER_CATEGORIES = {
  INDIVIDUAL: 'individual',
  FIRM: 'firm',
  SCHOOL: 'school'
};

// Payment Status
export const PAYMENT_STATUS = {
  PAID: 'paid',
  PENDING: 'pending',
  EMI: 'emi',
  FINANCE: 'finance',
  BANK_TRANSFER: 'bank_transfer',
  CREDIT_CARD: 'credit_card'
};

// Payment Status Display Names
export const PAYMENT_STATUS_DISPLAY = {
  [PAYMENT_STATUS.PAID]: 'Paid in Full',
  [PAYMENT_STATUS.PENDING]: 'Payment Pending',
  [PAYMENT_STATUS.EMI]: 'EMI Payment',
  [PAYMENT_STATUS.FINANCE]: 'Finance Payment',
  [PAYMENT_STATUS.BANK_TRANSFER]: 'Bank Transfer',
  [PAYMENT_STATUS.CREDIT_CARD]: 'Credit Card'
};

// Payment Method Options
export const PAYMENT_METHODS = {
  CASH: 'cash',
  CARD: 'card',
  CREDIT_CARD: 'credit_card',
  UPI: 'upi',
  NET_BANKING: 'net_banking',
  CHEQUE: 'cheque',
  FINANCE: 'finance',
  BANK_TRANSFER: 'bank_transfer'
};

// Payment Method Display Names
export const PAYMENT_METHOD_DISPLAY = {
  [PAYMENT_METHODS.CASH]: 'Cash',
  [PAYMENT_METHODS.CARD]: 'Debit Card',
  [PAYMENT_METHODS.CREDIT_CARD]: 'Credit Card',
  [PAYMENT_METHODS.UPI]: 'UPI',
  [PAYMENT_METHODS.NET_BANKING]: 'Net Banking',
  [PAYMENT_METHODS.CHEQUE]: 'Cheque',
  [PAYMENT_METHODS.FINANCE]: 'Finance',
  [PAYMENT_METHODS.BANK_TRANSFER]: 'Bank Transfer'
};

// Payment Categories for tracking
export const PAYMENT_CATEGORIES = {
  CASH_PAYMENT: 'cash_payment',
  CARD_PAYMENT: 'card_payment',
  CREDIT_CARD_PAYMENT: 'credit_card_payment',
  FINANCE_PAYMENT: 'finance_payment',
  BANK_TRANSFER_PAYMENT: 'bank_transfer_payment',
  EMI_PAYMENT: 'emi_payment',
  PENDING_PAYMENT: 'pending_payment'
};

// Payment Category Display Names
export const PAYMENT_CATEGORY_DISPLAY = {
  [PAYMENT_CATEGORIES.CASH_PAYMENT]: 'Cash Payment',
  [PAYMENT_CATEGORIES.CARD_PAYMENT]: 'Card Payment', 
  [PAYMENT_CATEGORIES.CREDIT_CARD_PAYMENT]: 'Credit Card Payment',
  [PAYMENT_CATEGORIES.FINANCE_PAYMENT]: 'Finance Payment',
  [PAYMENT_CATEGORIES.BANK_TRANSFER_PAYMENT]: 'Bank Transfer Payment',
  [PAYMENT_CATEGORIES.EMI_PAYMENT]: 'EMI Payment',
  [PAYMENT_CATEGORIES.PENDING_PAYMENT]: 'Pending Payment'
};

// Helper function to get payment category from status and method
export const getPaymentCategory = (paymentStatus, paymentMethod = null) => {
  switch (paymentStatus) {
    case PAYMENT_STATUS.FINANCE:
      return PAYMENT_CATEGORIES.FINANCE_PAYMENT;
    case PAYMENT_STATUS.BANK_TRANSFER:
      return PAYMENT_CATEGORIES.BANK_TRANSFER_PAYMENT;
    case PAYMENT_STATUS.EMI:
      return PAYMENT_CATEGORIES.EMI_PAYMENT;
    case PAYMENT_STATUS.PENDING:
      return PAYMENT_CATEGORIES.PENDING_PAYMENT;
    case PAYMENT_STATUS.CREDIT_CARD:
      return PAYMENT_CATEGORIES.CREDIT_CARD_PAYMENT;
    case PAYMENT_STATUS.PAID:
      if (paymentMethod === PAYMENT_METHODS.CARD) {
        return PAYMENT_CATEGORIES.CARD_PAYMENT;
      } else {
        return PAYMENT_CATEGORIES.CASH_PAYMENT;
      }
    default:
      return PAYMENT_CATEGORIES.CASH_PAYMENT;
  }
};

// Delivery Status
export const DELIVERY_STATUS = {
  DELIVERED: 'delivered',
  PENDING: 'pending',
  SCHEDULED: 'scheduled'
};

// GST Types
export const GST_TYPES = {
  IGST: 'igst',
  CGST_SGST: 'cgst_sgst',
  NO_GST: 'no_gst'
};

// GST Rates
export const GST_RATES = {
  CGST: 9,
  SGST: 9,
  IGST: 18
};

// States for GST calculation
export const GUJARAT_STATE = 'gujarat';

// Pagination
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 10,
  PAGE_SIZE_OPTIONS: [5, 10, 25, 50]
};

// Firebase Collections - UPDATED with checklist collections
export const COLLECTIONS = {
  CUSTOMERS: 'customers',
  EMPLOYEES: 'employees',
  SALES: 'sales',
  INVOICES: 'invoices',
  USERS: 'users',
  ATTENDANCE: 'attendance',
  PENALTIES: 'penalties',
  PENALTY_SETTINGS: 'penalty_settings',
  SETTINGS: 'settings',
  NOTIFICATIONS: 'notifications',
  AUDIT_LOGS: 'audit_logs',
  // NEW: Checklist collections
  CHECKLISTS: 'checklists',
  CHECKLIST_COMPLETIONS: 'checklist_completions'
};

// UPDATED permissions with checklist permissions
export const PERMISSIONS = {
  // Customer permissions
  VIEW_CUSTOMER: 'view_customer',
  CREATE_CUSTOMER: 'create_customer',
  EDIT_CUSTOMER: 'edit_customer',
  DELETE_CUSTOMER: 'delete_customer',
  
  // Employee permissions
  VIEW_EMPLOYEE: 'view_employee',
  CREATE_EMPLOYEE: 'create_employee',
  EDIT_EMPLOYEE: 'edit_employee',
  DELETE_EMPLOYEE: 'delete_employee',
  
  // Sales permissions
  VIEW_INVOICE: 'view_invoice',
  CREATE_INVOICE: 'create_invoice',
  EDIT_INVOICE: 'edit_invoice',
  DELETE_INVOICE: 'delete_invoice',
  
  // Attendance permissions
  VIEW_OWN_ATTENDANCE: 'view_own_attendance',
  MANAGE_OWN_ATTENDANCE: 'manage_own_attendance',
  VIEW_ALL_ATTENDANCE: 'view_all_attendance',
  MANAGE_ALL_ATTENDANCE: 'manage_all_attendance',
  EXPORT_ATTENDANCE_REPORTS: 'export_attendance_reports',
  
  // NEW: Checklist permissions
  VIEW_OWN_CHECKLISTS: 'view_own_checklists',
  COMPLETE_CHECKLIST: 'complete_checklist',
  CREATE_CHECKLIST: 'create_checklist',
  EDIT_CHECKLIST: 'edit_checklist',
  DELETE_CHECKLIST: 'delete_checklist',
  VIEW_ALL_CHECKLISTS: 'view_all_checklists',
  VIEW_CHECKLIST_REPORTS: 'view_checklist_reports',
  EXPORT_CHECKLIST_REPORTS: 'export_checklist_reports',
  MANAGE_CHECKLIST_ASSIGNMENTS: 'manage_checklist_assignments',
  
  // Reports permissions
  VIEW_SALES_REPORTS: 'view_sales_reports',
  VIEW_CUSTOMER_REPORTS: 'view_customer_reports',
  VIEW_EMPLOYEE_REPORTS: 'view_employee_reports',
  VIEW_ATTENDANCE_REPORTS: 'view_attendance_reports',
  
  // System permissions
  MANAGE_SETTINGS: 'manage_settings',
  MANAGE_NOTIFICATIONS: 'manage_notifications',
  MANAGE_EMPLOYEE_PERMISSIONS: 'manage_employee_permissions',
  VIEW_AUDIT_LOGS: 'view_audit_logs'
};

// Form Validation Messages
export const VALIDATION_MESSAGES = {
  REQUIRED: 'This field is required',
  INVALID_EMAIL: 'Please enter a valid email address',
  INVALID_PHONE: 'Please enter a valid phone number',
  INVALID_NUMBER: 'Please enter a valid number',
  MIN_LENGTH: (length) => `Minimum ${length} characters required`,
  MAX_LENGTH: (length) => `Maximum ${length} characters allowed`
};

// Date Formats
export const DATE_FORMATS = {
  DISPLAY: 'dd/MM/yyyy',
  STORAGE: 'yyyy-MM-dd',
  DATETIME: 'dd/MM/yyyy HH:mm'
};

// App Colors based on business type
export const APP_COLORS = {
  ELECTRONICS: {
    primary: '#1976d2',
    secondary: '#dc004e',
    accent: '#00bcd4',
    success: '#4caf50',
    warning: '#ff9800',
    error: '#f44336',
    background: '#f5f5f5'
  },
  FURNITURE: {
    primary: '#8d6e63',
    secondary: '#ff8a65',
    accent: '#81c784',
    success: '#4caf50',
    warning: '#ff9800',
    error: '#f44336',
    background: '#fafafa'
  }
};

export const GST_TAX_SLABS = [
  { rate: 0, description: 'Nil rated' },
  { rate: 5, description: 'Essential goods' },
  { rate: 12, description: 'Standard goods' },
  { rate: 18, description: 'Most goods and services' },
  { rate: 28, description: 'Luxury and sin goods' }
];

// NEW: Checklist Constants

// Recurrence Types
export const RECURRENCE_TYPES = {
  DAILY: 'daily',
  WEEKLY: 'weekly',
  MONTHLY: 'monthly',
  ONCE: 'once'
};

// Recurrence Type Display Names
export const RECURRENCE_TYPE_DISPLAY_NAMES = {
  [RECURRENCE_TYPES.DAILY]: 'Daily',
  [RECURRENCE_TYPES.WEEKLY]: 'Weekly',
  [RECURRENCE_TYPES.MONTHLY]: 'Monthly',
  [RECURRENCE_TYPES.ONCE]: 'One Time'
};

// Checklist Status
export const CHECKLIST_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  DRAFT: 'draft',
  ARCHIVED: 'archived'
};

// Completion Status
export const COMPLETION_STATUS = {
  PENDING: 'pending',
  COMPLETED: 'completed',
  NOT_COMPLETED: 'not_completed',
  OVERDUE: 'overdue'
};

// Days of Week
export const DAYS_OF_WEEK = {
  SUNDAY: 0,
  MONDAY: 1,
  TUESDAY: 2,
  WEDNESDAY: 3,
  THURSDAY: 4,
  FRIDAY: 5,
  SATURDAY: 6
};

// Days of Week Display Names
export const DAYS_OF_WEEK_NAMES = {
  [DAYS_OF_WEEK.SUNDAY]: 'Sunday',
  [DAYS_OF_WEEK.MONDAY]: 'Monday',
  [DAYS_OF_WEEK.TUESDAY]: 'Tuesday',
  [DAYS_OF_WEEK.WEDNESDAY]: 'Wednesday',
  [DAYS_OF_WEEK.THURSDAY]: 'Thursday',
  [DAYS_OF_WEEK.FRIDAY]: 'Friday',
  [DAYS_OF_WEEK.SATURDAY]: 'Saturday'
};

// Common reasons for not completing checklists
export const COMMON_NOT_COMPLETION_REASONS = {
  EQUIPMENT_UNAVAILABLE: 'Equipment not available',
  SYSTEM_DOWN: 'System maintenance/downtime',
  CUSTOMER_UNAVAILABLE: 'Customer not available',
  STAFF_SHORTAGE: 'Insufficient staff',
  HOLIDAY_CLOSURE: 'Holiday/Store closure',
  TECHNICAL_ISSUES: 'Technical difficulties',
  SUPPLY_SHORTAGE: 'Required supplies not available',
  WEATHER_CONDITIONS: 'Adverse weather conditions',
  EMERGENCY_SITUATION: 'Emergency situation',
  OTHER: 'Other (please specify)'
};

// Performance Thresholds
export const PERFORMANCE_THRESHOLDS = {
  COMPLETION_RATE: {
    EXCELLENT: 95,
    GOOD: 85,
    AVERAGE: 70,
    POOR: 50
  }
};

// Checklist Validation Rules
export const CHECKLIST_VALIDATION_RULES = {
  TITLE: {
    MIN_LENGTH: 3,
    MAX_LENGTH: 100,
    REQUIRED: true
  },
  DESCRIPTION: {
    MIN_LENGTH: 0,
    MAX_LENGTH: 500,
    REQUIRED: false
  },
  ASSIGNED_EMPLOYEES: {
    MIN_COUNT: 1,
    MAX_COUNT: 50,
    REQUIRED: true
  },
  REASON: {
    MIN_LENGTH: 10,
    MAX_LENGTH: 200,
    REQUIRED: true // when not completing
  }
};

// Helper functions for checklists
export const getRecurrenceDisplayText = (recurrence) => {
  switch (recurrence.type) {
    case RECURRENCE_TYPES.DAILY:
      return 'Daily';
    case RECURRENCE_TYPES.WEEKLY:
      return `Weekly (${DAYS_OF_WEEK_NAMES[recurrence.dayOfWeek]})`;
    case RECURRENCE_TYPES.MONTHLY:
      return `Monthly (${recurrence.dayOfMonth}${getOrdinalSuffix(recurrence.dayOfMonth)})`;
    case RECURRENCE_TYPES.ONCE:
      return `Once (${new Date(recurrence.specificDate).toLocaleDateString()})`;
    default:
      return 'Unknown';
  }
};

export const getOrdinalSuffix = (day) => {
  if (day >= 11 && day <= 13) {
    return 'th';
  }
  switch (day % 10) {
    case 1: return 'st';
    case 2: return 'nd';
    case 3: return 'rd';
    default: return 'th';
  }
};

export const getCompletionRateColor = (rate) => {
  if (rate >= PERFORMANCE_THRESHOLDS.COMPLETION_RATE.EXCELLENT) return 'success';
  if (rate >= PERFORMANCE_THRESHOLDS.COMPLETION_RATE.GOOD) return 'info';
  if (rate >= PERFORMANCE_THRESHOLDS.COMPLETION_RATE.AVERAGE) return 'warning';
  return 'error';
};

// UPDATED Role Configuration with checklist permissions
export const ROLE_CONFIG = {
  [USER_ROLES.ADMIN]: {
    label: 'Administrator',
    description: 'Full system access',
    color: '#f44336',
    permissions: Object.values(PERMISSIONS) // All permissions including checklists
  },
  [USER_ROLES.MANAGER]: {
    label: 'Manager',
    description: 'Team management and reports',
    color: '#ff9800',
    permissions: [
      PERMISSIONS.VIEW_CUSTOMER,
      PERMISSIONS.CREATE_CUSTOMER,
      PERMISSIONS.EDIT_CUSTOMER,
      PERMISSIONS.VIEW_EMPLOYEE,
      PERMISSIONS.VIEW_INVOICE,
      PERMISSIONS.CREATE_INVOICE,
      PERMISSIONS.EDIT_INVOICE,
      PERMISSIONS.VIEW_OWN_ATTENDANCE,
      PERMISSIONS.MANAGE_OWN_ATTENDANCE,
      PERMISSIONS.VIEW_ALL_ATTENDANCE,
      // NEW: Checklist permissions for managers
      PERMISSIONS.CREATE_CHECKLIST,
      PERMISSIONS.EDIT_CHECKLIST,
      PERMISSIONS.VIEW_ALL_CHECKLISTS,
      PERMISSIONS.VIEW_CHECKLIST_REPORTS,
      PERMISSIONS.MANAGE_CHECKLIST_ASSIGNMENTS,
      // Reports
      PERMISSIONS.VIEW_SALES_REPORTS,
      PERMISSIONS.VIEW_CUSTOMER_REPORTS,
      PERMISSIONS.VIEW_EMPLOYEE_REPORTS,
      PERMISSIONS.VIEW_ATTENDANCE_REPORTS
    ]
  },
  [USER_ROLES.EMPLOYEE]: {
    label: 'Employee',
    description: 'Basic operations and own checklists',
    color: '#4caf50',
    permissions: [
      PERMISSIONS.VIEW_CUSTOMER,
      PERMISSIONS.CREATE_CUSTOMER,
      PERMISSIONS.EDIT_CUSTOMER,
      PERMISSIONS.VIEW_INVOICE,
      PERMISSIONS.CREATE_INVOICE,
      PERMISSIONS.EDIT_INVOICE,
      PERMISSIONS.VIEW_OWN_ATTENDANCE,
      PERMISSIONS.MANAGE_OWN_ATTENDANCE,
      // NEW: Employee checklist permissions
      PERMISSIONS.VIEW_OWN_CHECKLISTS,
      PERMISSIONS.COMPLETE_CHECKLIST
    ]
  },
  [USER_ROLES.INTERN]: {
    label: 'Intern',
    description: 'Limited access and own checklists',
    color: '#9c27b0',
    permissions: [
      PERMISSIONS.VIEW_CUSTOMER,
      PERMISSIONS.VIEW_INVOICE,
      PERMISSIONS.VIEW_OWN_ATTENDANCE,
      PERMISSIONS.MANAGE_OWN_ATTENDANCE,
      // NEW: Intern checklist permissions
      PERMISSIONS.VIEW_OWN_CHECKLISTS,
      PERMISSIONS.COMPLETE_CHECKLIST
    ]
  }
};

// Attendance Status Constants
export const ATTENDANCE_STATUS = {
  NOT_CHECKED_IN: 'not_checked_in',
  CHECKED_IN: 'checked_in',
  ON_BREAK: 'on_break',
  CHECKED_OUT: 'checked_out'
};

// Break Types
export const BREAK_TYPES = {
  LUNCH: 'lunch',
  TEA: 'tea',
  PERSONAL: 'personal',
  MEETING: 'meeting',
  OTHER: 'other'
};

// Time Constants
export const TIME_CONSTANTS = {
  WORK_HOURS_PER_DAY: 8,
  MINUTES_PER_HOUR: 60,
  MILLISECONDS_PER_MINUTE: 60000,
  DEFAULT_WORK_START_TIME: '09:00',
  DEFAULT_WORK_END_TIME: '18:00',
  MAX_DAILY_WORK_HOURS: 12,
  MIN_BREAK_DURATION: 5,
  MAX_BREAK_DURATION: 120
};

// Attendance Report Types
export const ATTENDANCE_REPORT_TYPES = {
  DAILY: 'daily',
  WEEKLY: 'weekly',
  MONTHLY: 'monthly',
  CUSTOM: 'custom'
};

// Departments
export const DEPARTMENTS = {
  SALES: 'sales',
  MARKETING: 'marketing',
  TECHNICAL: 'technical',
  ADMINISTRATION: 'administration',
  FINANCE: 'finance'
};

// Department Configuration - UPDATED with checklist permissions
export const DEPARTMENT_CONFIG = {
  [DEPARTMENTS.SALES]: {
    label: 'Sales',
    description: 'Sales and customer relations',
    color: '#2196f3',
    defaultPermissions: [
      PERMISSIONS.VIEW_CUSTOMER,
      PERMISSIONS.CREATE_CUSTOMER,
      PERMISSIONS.EDIT_CUSTOMER,
      PERMISSIONS.VIEW_INVOICE,
      PERMISSIONS.CREATE_INVOICE,
      PERMISSIONS.EDIT_INVOICE,
      PERMISSIONS.VIEW_OWN_ATTENDANCE,
      PERMISSIONS.MANAGE_OWN_ATTENDANCE,
      // NEW: Checklist permissions for sales
      PERMISSIONS.VIEW_OWN_CHECKLISTS,
      PERMISSIONS.COMPLETE_CHECKLIST
    ]
  },
  [DEPARTMENTS.MARKETING]: {
    label: 'Marketing',
    description: 'Marketing and promotions',
    color: '#e91e63',
    defaultPermissions: [
      PERMISSIONS.VIEW_CUSTOMER,
      PERMISSIONS.VIEW_INVOICE,
      PERMISSIONS.VIEW_SALES_REPORTS,
      PERMISSIONS.VIEW_OWN_ATTENDANCE,
      PERMISSIONS.MANAGE_OWN_ATTENDANCE,
      PERMISSIONS.VIEW_OWN_CHECKLISTS,
      PERMISSIONS.COMPLETE_CHECKLIST
    ]
  },
  [DEPARTMENTS.ADMINISTRATION]: {
    label: 'Administration',
    description: 'Administrative tasks and HR',
    color: '#9c27b0',
    defaultPermissions: [
      PERMISSIONS.VIEW_EMPLOYEE,
      PERMISSIONS.CREATE_EMPLOYEE,
      PERMISSIONS.EDIT_EMPLOYEE,
      PERMISSIONS.VIEW_ALL_ATTENDANCE,
      PERMISSIONS.VIEW_ATTENDANCE_REPORTS,
      PERMISSIONS.VIEW_OWN_ATTENDANCE,
      PERMISSIONS.MANAGE_OWN_ATTENDANCE,
      // NEW: Admin can manage checklists
      PERMISSIONS.CREATE_CHECKLIST,
      PERMISSIONS.EDIT_CHECKLIST,
      PERMISSIONS.VIEW_ALL_CHECKLISTS,
      PERMISSIONS.VIEW_CHECKLIST_REPORTS
    ]
  },
  [DEPARTMENTS.FINANCE]: {
    label: 'Finance',
    description: 'Financial operations and reporting',
    color: '#ff5722',
    defaultPermissions: [
      PERMISSIONS.VIEW_INVOICE,
      PERMISSIONS.VIEW_SALES_REPORTS,
      PERMISSIONS.VIEW_CUSTOMER_REPORTS,
      PERMISSIONS.VIEW_EMPLOYEE_REPORTS,
      PERMISSIONS.VIEW_ATTENDANCE_REPORTS,
      PERMISSIONS.VIEW_OWN_ATTENDANCE,
      PERMISSIONS.MANAGE_OWN_ATTENDANCE,
      PERMISSIONS.VIEW_OWN_CHECKLISTS,
      PERMISSIONS.COMPLETE_CHECKLIST
    ]
  },
  [DEPARTMENTS.TECHNICAL]: {
    label: 'Technical',
    description: 'Technical support and maintenance',
    color: '#607d8b',
    defaultPermissions: [
      PERMISSIONS.VIEW_CUSTOMER,
      PERMISSIONS.VIEW_INVOICE,
      PERMISSIONS.VIEW_OWN_ATTENDANCE,
      PERMISSIONS.MANAGE_OWN_ATTENDANCE,
      PERMISSIONS.VIEW_OWN_CHECKLISTS,
      PERMISSIONS.COMPLETE_CHECKLIST
    ]
  }
};

// Access Levels
export const ACCESS_LEVELS = {
  NONE: 0,
  READ: 1,
  WRITE: 2,
  DELETE: 3,
  ADMIN: 4
};

// UPDATED Feature Permissions Map with checklists
export const FEATURE_PERMISSIONS = {
  customers: {
    route: '/customers',
    requiredPermission: PERMISSIONS.VIEW_CUSTOMER,
    adminOnly: false
  },
  employees: {
    route: '/employees',
    requiredPermission: PERMISSIONS.VIEW_EMPLOYEE,
    adminOnly: false,
    managerAccess: true
  },
  attendance: {
    route: '/attendance',
    requiredPermission: PERMISSIONS.VIEW_OWN_ATTENDANCE,
    adminOnly: false,
    employeeOnly: true
  },
  // NEW: Checklist features
  checklists: {
    route: '/checklists',
    requiredPermission: PERMISSIONS.VIEW_ALL_CHECKLISTS,
    adminOnly: true
  },
  myChecklists: {
    route: '/my-checklists',
    requiredPermission: PERMISSIONS.VIEW_OWN_CHECKLISTS,
    employeeOnly: true
  },
  checklistReports: {
    route: '/checklists/reports',
    requiredPermission: PERMISSIONS.VIEW_CHECKLIST_REPORTS,
    adminOnly: true
  },
  sales: {
    route: '/sales',
    requiredPermission: PERMISSIONS.VIEW_INVOICE,
    adminOnly: false
  },
  reports: {
    route: '/reports',
    requiredPermission: PERMISSIONS.VIEW_SALES_REPORTS,
    adminOnly: false
  },
  employeeReports: {
    route: '/reports/employees',
    requiredPermission: PERMISSIONS.VIEW_ATTENDANCE_REPORTS,
    adminOnly: true
  },
  settings: {
    route: '/settings',
    requiredPermission: PERMISSIONS.MANAGE_SETTINGS,
    adminOnly: true
  }
};

// Default Role Assignment Rules
export const DEFAULT_ROLE_ASSIGNMENTS = {
  FIRST_USER: USER_ROLES.ADMIN,
  NEW_EMPLOYEE: USER_ROLES.EMPLOYEE,
  SELF_REGISTRATION: USER_ROLES.EMPLOYEE
};

// Role Hierarchy (higher number = more authority)
export const ROLE_HIERARCHY = {
  [USER_ROLES.INTERN]: 1,
  [USER_ROLES.EMPLOYEE]: 2,
  [USER_ROLES.MANAGER]: 3,
  [USER_ROLES.ADMIN]: 4
};

// Session and Security Settings
export const SECURITY_SETTINGS = {
  SESSION_TIMEOUT: {
    [USER_ROLES.ADMIN]: 8 * 60 * 60 * 1000,
    [USER_ROLES.MANAGER]: 6 * 60 * 60 * 1000,
    [USER_ROLES.EMPLOYEE]: 4 * 60 * 60 * 1000,
    [USER_ROLES.INTERN]: 2 * 60 * 60 * 1000
  },
  PASSWORD_REQUIREMENTS: {
    minLength: 6,
    requireUppercase: false,
    requireNumbers: true,
    requireSpecialChars: false
  }
};

// Photo/Camera Settings
export const PHOTO_SETTINGS = {
  MAX_FILE_SIZE: 5 * 1024 * 1024,
  COMPRESSION_QUALITY: 0.7,
  MAX_WIDTH: 800,
  MAX_HEIGHT: 600,
  SUPPORTED_FORMATS: ['image/jpeg', 'image/png', 'image/webp']
};

// UPDATED Notification Types with checklists
export const NOTIFICATION_TYPES = {
  CUSTOMER_ADDED: 'customer_added',
  INVOICE_CREATED: 'invoice_created',
  PAYMENT_RECEIVED: 'payment_received',
  EMPLOYEE_ADDED: 'employee_added',
  ATTENDANCE_LATE: 'attendance_late',
  ATTENDANCE_MISSED: 'attendance_missed',
  ATTENDANCE_OVERTIME: 'attendance_overtime',
  BREAK_EXCEEDED: 'break_exceeded',
  // NEW: Checklist notifications
  CHECKLIST_ASSIGNED: 'checklist_assigned',
  CHECKLIST_OVERDUE: 'checklist_overdue',
  CHECKLIST_COMPLETED: 'checklist_completed',
  CHECKLIST_NOT_COMPLETED: 'checklist_not_completed',
  WEEKLY_SUMMARY: 'weekly_summary',
  MONTHLY_SUMMARY: 'monthly_summary',
  SYSTEM_MAINTENANCE: 'system_maintenance',
  BACKUP_COMPLETE: 'backup_complete'
};

export default {
  USER_TYPES,
  USER_ROLES,
  COLLECTIONS,
  APP_COLORS,
  PERMISSIONS,
  ROLE_CONFIG,
  ATTENDANCE_STATUS,
  BREAK_TYPES,
  TIME_CONSTANTS,
  ATTENDANCE_REPORT_TYPES,
  DEPARTMENTS,
  DEPARTMENT_CONFIG,
  ACCESS_LEVELS,
  FEATURE_PERMISSIONS,
  DEFAULT_ROLE_ASSIGNMENTS,
  ROLE_HIERARCHY,
  SECURITY_SETTINGS,
  PHOTO_SETTINGS,
  NOTIFICATION_TYPES,
  // NEW: Checklist constants
  RECURRENCE_TYPES,
  RECURRENCE_TYPE_DISPLAY_NAMES,
  CHECKLIST_STATUS,
  COMPLETION_STATUS,
  DAYS_OF_WEEK,
  DAYS_OF_WEEK_NAMES,
  COMMON_NOT_COMPLETION_REASONS,
  PERFORMANCE_THRESHOLDS,
  CHECKLIST_VALIDATION_RULES,
  getRecurrenceDisplayText,
  getOrdinalSuffix,
  getCompletionRateColor
};