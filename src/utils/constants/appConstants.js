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
  EMI: 'emi',
  FINANCE: 'finance',           // For finance payments
  BANK_TRANSFER: 'bank_transfer', // For bank transfer payments
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
  CREDIT_CARD: 'credit_card',        // NEW - Added credit card
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
  [PAYMENT_METHODS.CREDIT_CARD]: 'Credit Card',    // NEW
  [PAYMENT_METHODS.UPI]: 'UPI',
  [PAYMENT_METHODS.NET_BANKING]: 'Net Banking',
  [PAYMENT_METHODS.CHEQUE]: 'Cheque',
  [PAYMENT_METHODS.FINANCE]: 'Finance',
  [PAYMENT_METHODS.BANK_TRANSFER]: 'Bank Transfer'
};

// NEW - Original Payment Categories for tracking
export const PAYMENT_CATEGORIES = {
  CASH_PAYMENT: 'cash_payment',
  CARD_PAYMENT: 'card_payment',
  CREDIT_CARD_PAYMENT: 'credit_card_payment',
  FINANCE_PAYMENT: 'finance_payment',
  BANK_TRANSFER_PAYMENT: 'bank_transfer_payment',
  EMI_PAYMENT: 'emi_payment',
  PENDING_PAYMENT: 'pending_payment'
};

// NEW - Payment Category Display Names
export const PAYMENT_CATEGORY_DISPLAY = {
  [PAYMENT_CATEGORIES.CASH_PAYMENT]: 'Cash Payment',
  [PAYMENT_CATEGORIES.CARD_PAYMENT]: 'Card Payment', 
  [PAYMENT_CATEGORIES.CREDIT_CARD_PAYMENT]: 'Credit Card Payment',
  [PAYMENT_CATEGORIES.FINANCE_PAYMENT]: 'Finance Payment',
  [PAYMENT_CATEGORIES.BANK_TRANSFER_PAYMENT]: 'Bank Transfer Payment',
  [PAYMENT_CATEGORIES.EMI_PAYMENT]: 'EMI Payment',
  [PAYMENT_CATEGORIES.PENDING_PAYMENT]: 'Pending Payment'
};

// NEW - Helper function to get payment category from status and method
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