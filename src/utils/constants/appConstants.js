// User Types
export const USER_TYPES = {
  ELECTRONICS: 'electronics',
  FURNITURE: 'furniture'
};

// User Roles
export const USER_ROLES = {
  ADMIN: 'admin',
  EMPLOYEE: 'employee'
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
  EMI: 'emi'
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

// Firebase Collections
export const COLLECTIONS = {
  CUSTOMERS: 'customers',
  EMPLOYEES: 'employees',
  SALES: 'sales',
  INVOICES: 'invoices',
  USERS: 'users'
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

// App Theme Colors
export const APP_COLORS = {
  ELECTRONICS: {
    primary: '#1976d2',
    secondary: '#dc004e'
  },
  FURNITURE: {
    primary: '#8b4513',
    secondary: '#ff6f00'
  }
};

export const GST_TAX_SLABS = [
  { rate: 0, description: 'Nil rated' },
  { rate: 5, description: 'Essential goods' },
  { rate: 12, description: 'Standard goods' },
  { rate: 18, description: 'Most goods and services' },
  { rate: 28, description: 'Luxury and sin goods' }
];