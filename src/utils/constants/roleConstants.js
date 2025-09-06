/**
 * Role Constants
 * Defines user roles, permissions, and access control configurations
 */

// User Roles
export const USER_ROLES = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  EMPLOYEE: 'employee',
  INTERN: 'intern'
};

// Permission Actions
export const PERMISSIONS = {
  // Customer Management
  CREATE_CUSTOMER: 'create_customer',
  VIEW_CUSTOMER: 'view_customer',
  EDIT_CUSTOMER: 'edit_customer',
  DELETE_CUSTOMER: 'delete_customer',
  EXPORT_CUSTOMERS: 'export_customers',

  // Employee Management
  CREATE_EMPLOYEE: 'create_employee',
  VIEW_EMPLOYEE: 'view_employee',
  EDIT_EMPLOYEE: 'edit_employee',
  DELETE_EMPLOYEE: 'delete_employee',
  MANAGE_EMPLOYEE_PERMISSIONS: 'manage_employee_permissions',

  // Sales & Invoices
  CREATE_INVOICE: 'create_invoice',
  VIEW_INVOICE: 'view_invoice',
  EDIT_INVOICE: 'edit_invoice',
  DELETE_INVOICE: 'delete_invoice',
  CANCEL_INVOICE: 'cancel_invoice',
  GENERATE_INVOICE_PDF: 'generate_invoice_pdf',

  // Payments & EMI
  MANAGE_PAYMENTS: 'manage_payments',
  CREATE_EMI: 'create_emi',
  MODIFY_EMI: 'modify_emi',
  PROCESS_REFUNDS: 'process_refunds',

  // Delivery Management
  MANAGE_DELIVERY: 'manage_delivery',
  UPDATE_DELIVERY_STATUS: 'update_delivery_status',
  ASSIGN_DELIVERY_AGENT: 'assign_delivery_agent',

  // Reports & Analytics
  VIEW_SALES_REPORTS: 'view_sales_reports',
  VIEW_CUSTOMER_REPORTS: 'view_customer_reports',
  VIEW_EMPLOYEE_REPORTS: 'view_employee_reports',
  VIEW_FINANCIAL_REPORTS: 'view_financial_reports',
  EXPORT_REPORTS: 'export_reports',

  // System Administration
  MANAGE_SETTINGS: 'manage_settings',
  MANAGE_COMPANY_INFO: 'manage_company_info',
  MANAGE_TAX_SETTINGS: 'manage_tax_settings',
  VIEW_AUDIT_LOGS: 'view_audit_logs',
  MANAGE_BACKUPS: 'manage_backups'
};

// Role Configurations with Permissions
export const ROLE_CONFIG = {
  [USER_ROLES.ADMIN]: {
    label: 'Administrator',
    description: 'Full system access and management capabilities',
    level: 4,
    color: '#d32f2f',
    permissions: [
      // Full access to all permissions
      ...Object.values(PERMISSIONS)
    ],
    restrictions: [],
    canManageRoles: [USER_ROLES.MANAGER, USER_ROLES.EMPLOYEE, USER_ROLES.INTERN]
  },

  [USER_ROLES.MANAGER]: {
    label: 'Manager',
    description: 'Management access with operational control',
    level: 3,
    color: '#1976d2',
    permissions: [
      // Customer Management
      PERMISSIONS.CREATE_CUSTOMER,
      PERMISSIONS.VIEW_CUSTOMER,
      PERMISSIONS.EDIT_CUSTOMER,
      PERMISSIONS.EXPORT_CUSTOMERS,

      // Employee Management (limited)
      PERMISSIONS.VIEW_EMPLOYEE,
      PERMISSIONS.EDIT_EMPLOYEE,

      // Sales & Invoices
      PERMISSIONS.CREATE_INVOICE,
      PERMISSIONS.VIEW_INVOICE,
      PERMISSIONS.EDIT_INVOICE,
      PERMISSIONS.CANCEL_INVOICE,
      PERMISSIONS.GENERATE_INVOICE_PDF,

      // Payments & EMI
      PERMISSIONS.MANAGE_PAYMENTS,
      PERMISSIONS.CREATE_EMI,
      PERMISSIONS.MODIFY_EMI,

      // Delivery Management
      PERMISSIONS.MANAGE_DELIVERY,
      PERMISSIONS.UPDATE_DELIVERY_STATUS,
      PERMISSIONS.ASSIGN_DELIVERY_AGENT,

      // Reports
      PERMISSIONS.VIEW_SALES_REPORTS,
      PERMISSIONS.VIEW_CUSTOMER_REPORTS,
      PERMISSIONS.VIEW_EMPLOYEE_REPORTS,
      PERMISSIONS.EXPORT_REPORTS
    ],
    restrictions: [
      'Cannot delete employees',
      'Cannot manage system settings',
      'Cannot access financial reports'
    ],
    canManageRoles: [USER_ROLES.EMPLOYEE, USER_ROLES.INTERN]
  },

  [USER_ROLES.EMPLOYEE]: {
    label: 'Employee',
    description: 'Standard employee with operational access',
    level: 2,
    color: '#388e3c',
    permissions: [
      // Customer Management (limited)
      PERMISSIONS.CREATE_CUSTOMER,
      PERMISSIONS.VIEW_CUSTOMER,
      PERMISSIONS.EDIT_CUSTOMER,

      // Sales & Invoices
      PERMISSIONS.CREATE_INVOICE,
      PERMISSIONS.VIEW_INVOICE,
      PERMISSIONS.EDIT_INVOICE,
      PERMISSIONS.GENERATE_INVOICE_PDF,

      // Payments
      PERMISSIONS.MANAGE_PAYMENTS,

      // Delivery (limited)
      PERMISSIONS.UPDATE_DELIVERY_STATUS,

      // Reports (limited)
      PERMISSIONS.VIEW_SALES_REPORTS
    ],
    restrictions: [
      'Cannot delete customers',
      'Cannot manage employees',
      'Cannot cancel invoices',
      'Cannot modify EMI terms',
      'Limited report access'
    ],
    canManageRoles: []
  },

  [USER_ROLES.INTERN]: {
    label: 'Intern',
    description: 'Limited access for training and support',
    level: 1,
    color: '#f57c00',
    permissions: [
      // Read-only access mostly
      PERMISSIONS.VIEW_CUSTOMER,
      PERMISSIONS.VIEW_INVOICE,
      PERMISSIONS.VIEW_SALES_REPORTS
    ],
    restrictions: [
      'Read-only access to most features',
      'Cannot create or edit records',
      'Cannot access sensitive information',
      'Cannot process payments'
    ],
    canManageRoles: []
  }
};

// Department Roles
export const DEPARTMENTS = {
  SALES: 'sales',
  CUSTOMER_SERVICE: 'customer_service',
  DELIVERY: 'delivery',
  ACCOUNTS: 'accounts',
  ADMINISTRATION: 'administration',
  TECHNICAL: 'technical'
};

// Department Configurations
export const DEPARTMENT_CONFIG = {
  [DEPARTMENTS.SALES]: {
    label: 'Sales',
    description: 'Sales team and business development',
    color: '#2196f3',
    defaultPermissions: [
      PERMISSIONS.CREATE_CUSTOMER,
      PERMISSIONS.VIEW_CUSTOMER,
      PERMISSIONS.CREATE_INVOICE,
      PERMISSIONS.VIEW_SALES_REPORTS
    ]
  },
  [DEPARTMENTS.CUSTOMER_SERVICE]: {
    label: 'Customer Service',
    description: 'Customer support and relationship management',
    color: '#4caf50',
    defaultPermissions: [
      PERMISSIONS.VIEW_CUSTOMER,
      PERMISSIONS.EDIT_CUSTOMER,
      PERMISSIONS.VIEW_INVOICE,
      PERMISSIONS.MANAGE_DELIVERY
    ]
  },
  [DEPARTMENTS.DELIVERY]: {
    label: 'Delivery',
    description: 'Order fulfillment and delivery operations',
    color: '#ff9800',
    defaultPermissions: [
      PERMISSIONS.VIEW_INVOICE,
      PERMISSIONS.MANAGE_DELIVERY,
      PERMISSIONS.UPDATE_DELIVERY_STATUS
    ]
  },
  [DEPARTMENTS.ACCOUNTS]: {
    label: 'Accounts',
    description: 'Financial management and accounting',
    color: '#9c27b0',
    defaultPermissions: [
      PERMISSIONS.VIEW_INVOICE,
      PERMISSIONS.MANAGE_PAYMENTS,
      PERMISSIONS.VIEW_FINANCIAL_REPORTS,
      PERMISSIONS.PROCESS_REFUNDS
    ]
  },
  [DEPARTMENTS.ADMINISTRATION]: {
    label: 'Administration',
    description: 'System administration and management',
    color: '#f44336',
    defaultPermissions: [
      PERMISSIONS.MANAGE_SETTINGS,
      PERMISSIONS.MANAGE_EMPLOYEE_PERMISSIONS,
      PERMISSIONS.VIEW_AUDIT_LOGS
    ]
  },
  [DEPARTMENTS.TECHNICAL]: {
    label: 'Technical',
    description: 'Technical support and maintenance',
    color: '#607d8b',
    defaultPermissions: [
      PERMISSIONS.VIEW_CUSTOMER,
      PERMISSIONS.VIEW_INVOICE,
      PERMISSIONS.MANAGE_DELIVERY
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

// Feature Permissions Map
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
    [USER_ROLES.ADMIN]: 8 * 60 * 60 * 1000,      // 8 hours
    [USER_ROLES.MANAGER]: 6 * 60 * 60 * 1000,    // 6 hours  
    [USER_ROLES.EMPLOYEE]: 4 * 60 * 60 * 1000,   // 4 hours
    [USER_ROLES.INTERN]: 2 * 60 * 60 * 1000      // 2 hours
  },
  PASSWORD_REQUIREMENTS: {
    minLength: 6,
    requireUppercase: false,
    requireNumbers: true,
    requireSpecialChars: false
  }
};

export default {
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
};