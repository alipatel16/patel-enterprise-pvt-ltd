// src/utils/constants/checklistConstants.js

/**
 * Checklist Constants and Enums
 */

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

// Priority Levels
export const PRIORITY_LEVELS = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical'
};

// Priority Display Names and Colors
export const PRIORITY_CONFIG = {
  [PRIORITY_LEVELS.LOW]: {
    label: 'Low',
    color: 'success',
    weight: 1
  },
  [PRIORITY_LEVELS.MEDIUM]: {
    label: 'Medium', 
    color: 'info',
    weight: 2
  },
  [PRIORITY_LEVELS.HIGH]: {
    label: 'High',
    color: 'warning',
    weight: 3
  },
  [PRIORITY_LEVELS.CRITICAL]: {
    label: 'Critical',
    color: 'error',
    weight: 4
  }
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

// Checklist Categories (optional categorization)
export const CHECKLIST_CATEGORIES = {
  SAFETY: 'safety',
  MAINTENANCE: 'maintenance',
  CUSTOMER_SERVICE: 'customer_service',
  INVENTORY: 'inventory',
  CLEANING: 'cleaning',
  SECURITY: 'security',
  TRAINING: 'training',
  COMPLIANCE: 'compliance',
  OTHER: 'other'
};

// Category Display Names and Icons
export const CATEGORY_CONFIG = {
  [CHECKLIST_CATEGORIES.SAFETY]: {
    label: 'Safety & Security',
    icon: 'Security',
    color: '#f44336'
  },
  [CHECKLIST_CATEGORIES.MAINTENANCE]: {
    label: 'Maintenance',
    icon: 'Build',
    color: '#ff9800'
  },
  [CHECKLIST_CATEGORIES.CUSTOMER_SERVICE]: {
    label: 'Customer Service',
    icon: 'People',
    color: '#2196f3'
  },
  [CHECKLIST_CATEGORIES.INVENTORY]: {
    label: 'Inventory Management',
    icon: 'Inventory',
    color: '#9c27b0'
  },
  [CHECKLIST_CATEGORIES.CLEANING]: {
    label: 'Cleaning & Hygiene',
    icon: 'CleaningServices',
    color: '#4caf50'
  },
  [CHECKLIST_CATEGORIES.SECURITY]: {
    label: 'Security Protocols',
    icon: 'Shield',
    color: '#795548'
  },
  [CHECKLIST_CATEGORIES.TRAINING]: {
    label: 'Training & Development',
    icon: 'School',
    color: '#607d8b'
  },
  [CHECKLIST_CATEGORIES.COMPLIANCE]: {
    label: 'Compliance & Audit',
    icon: 'Assignment',
    color: '#e91e63'
  },
  [CHECKLIST_CATEGORIES.OTHER]: {
    label: 'Other',
    icon: 'Category',
    color: '#9e9e9e'
  }
};

// Notification Types for Checklist System
export const CHECKLIST_NOTIFICATION_TYPES = {
  CHECKLIST_ASSIGNED: 'checklist_assigned',
  CHECKLIST_OVERDUE: 'checklist_overdue',
  CHECKLIST_COMPLETED: 'checklist_completed',
  CHECKLIST_NOT_COMPLETED: 'checklist_not_completed',
  WEEKLY_SUMMARY: 'weekly_summary',
  MONTHLY_SUMMARY: 'monthly_summary'
};

// Completion Reasons (predefined common reasons for not completing)
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
  },
  RESPONSE_TIME: {
    FAST: 1, // hours
    AVERAGE: 4,
    SLOW: 8
  }
};

// Report Time Periods
export const REPORT_PERIODS = {
  TODAY: 'today',
  YESTERDAY: 'yesterday',
  THIS_WEEK: 'this_week',
  LAST_WEEK: 'last_week',
  THIS_MONTH: 'this_month',
  LAST_MONTH: 'last_month',
  THIS_QUARTER: 'this_quarter',
  LAST_QUARTER: 'last_quarter',
  THIS_YEAR: 'this_year',
  CUSTOM: 'custom'
};

// Report Period Display Names
export const REPORT_PERIOD_NAMES = {
  [REPORT_PERIODS.TODAY]: 'Today',
  [REPORT_PERIODS.YESTERDAY]: 'Yesterday',
  [REPORT_PERIODS.THIS_WEEK]: 'This Week',
  [REPORT_PERIODS.LAST_WEEK]: 'Last Week',
  [REPORT_PERIODS.THIS_MONTH]: 'This Month',
  [REPORT_PERIODS.LAST_MONTH]: 'Last Month',
  [REPORT_PERIODS.THIS_QUARTER]: 'This Quarter',
  [REPORT_PERIODS.LAST_QUARTER]: 'Last Quarter',
  [REPORT_PERIODS.THIS_YEAR]: 'This Year',
  [REPORT_PERIODS.CUSTOM]: 'Custom Range'
};

// Export Configuration
export const EXPORT_FORMATS = {
  CSV: 'csv',
  PDF: 'pdf',
  EXCEL: 'xlsx'
};

// Validation Rules
export const VALIDATION_RULES = {
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

// Default Values
export const DEFAULT_VALUES = {
  RECURRENCE_TYPE: RECURRENCE_TYPES.DAILY,
  PRIORITY: PRIORITY_LEVELS.MEDIUM,
  CATEGORY: CHECKLIST_CATEGORIES.OTHER,
  DAY_OF_WEEK: DAYS_OF_WEEK.MONDAY,
  DAY_OF_MONTH: 1,
  IS_ACTIVE: true
};

// Database Collections/Paths
export const DB_COLLECTIONS = {
  CHECKLISTS: 'checklists',
  CHECKLIST_COMPLETIONS: 'checklist_completions',
  CHECKLIST_TEMPLATES: 'checklist_templates', // for future use
  CHECKLIST_CATEGORIES_CUSTOM: 'checklist_categories' // for custom categories
};

// Permissions for Checklist Features
export const CHECKLIST_PERMISSIONS = {
  CREATE_CHECKLIST: 'create_checklist',
  EDIT_CHECKLIST: 'edit_checklist',
  DELETE_CHECKLIST: 'delete_checklist',
  VIEW_ALL_CHECKLISTS: 'view_all_checklists',
  VIEW_OWN_CHECKLISTS: 'view_own_checklists',
  COMPLETE_CHECKLIST: 'complete_checklist',
  VIEW_REPORTS: 'view_checklist_reports',
  EXPORT_REPORTS: 'export_checklist_reports',
  MANAGE_ASSIGNMENTS: 'manage_checklist_assignments'
};

// Role-based Default Permissions
export const ROLE_CHECKLIST_PERMISSIONS = {
  ADMIN: [
    CHECKLIST_PERMISSIONS.CREATE_CHECKLIST,
    CHECKLIST_PERMISSIONS.EDIT_CHECKLIST,
    CHECKLIST_PERMISSIONS.DELETE_CHECKLIST,
    CHECKLIST_PERMISSIONS.VIEW_ALL_CHECKLISTS,
    CHECKLIST_PERMISSIONS.VIEW_REPORTS,
    CHECKLIST_PERMISSIONS.EXPORT_REPORTS,
    CHECKLIST_PERMISSIONS.MANAGE_ASSIGNMENTS
  ],
  MANAGER: [
    CHECKLIST_PERMISSIONS.CREATE_CHECKLIST,
    CHECKLIST_PERMISSIONS.EDIT_CHECKLIST,
    CHECKLIST_PERMISSIONS.VIEW_ALL_CHECKLISTS,
    CHECKLIST_PERMISSIONS.VIEW_REPORTS,
    CHECKLIST_PERMISSIONS.MANAGE_ASSIGNMENTS
  ],
  EMPLOYEE: [
    CHECKLIST_PERMISSIONS.VIEW_OWN_CHECKLISTS,
    CHECKLIST_PERMISSIONS.COMPLETE_CHECKLIST
  ]
};

// Error Messages
export const ERROR_MESSAGES = {
  CHECKLIST_NOT_FOUND: 'Checklist not found',
  UNAUTHORIZED_ACCESS: 'You are not authorized to perform this action',
  INVALID_RECURRENCE: 'Invalid recurrence configuration',
  NO_EMPLOYEES_ASSIGNED: 'At least one employee must be assigned',
  TITLE_REQUIRED: 'Checklist title is required',
  REASON_REQUIRED: 'Please provide a reason for not completing this checklist',
  DATE_REQUIRED: 'Date is required for one-time checklists',
  INVALID_DATE: 'Invalid date provided',
  EMPLOYEE_NOT_FOUND: 'Employee not found',
  COMPLETION_ALREADY_EXISTS: 'Completion record already exists for this date'
};

// Success Messages
export const SUCCESS_MESSAGES = {
  CHECKLIST_CREATED: 'Checklist created successfully',
  CHECKLIST_UPDATED: 'Checklist updated successfully', 
  CHECKLIST_DELETED: 'Checklist deleted successfully',
  COMPLETION_SAVED: 'Checklist completion saved successfully',
  ASSIGNMENT_GENERATED: 'Checklist assignments generated successfully',
  REPORT_EXPORTED: 'Report exported successfully'
};

// Helper Functions
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

export const getCompletionRateLabel = (rate) => {
  if (rate >= PERFORMANCE_THRESHOLDS.COMPLETION_RATE.EXCELLENT) return 'Excellent';
  if (rate >= PERFORMANCE_THRESHOLDS.COMPLETION_RATE.GOOD) return 'Good';
  if (rate >= PERFORMANCE_THRESHOLDS.COMPLETION_RATE.AVERAGE) return 'Average';
  return 'Needs Improvement';
};