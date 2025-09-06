/**
 * Customer Types Constants
 * Defines customer categories and types for the showroom management system
 */

// Customer Types (Business Size)
export const CUSTOMER_TYPES = {
  WHOLESALER: 'wholesaler',
  RETAILER: 'retailer'
};

// Customer Categories (Business Nature)
export const CUSTOMER_CATEGORIES = {
  INDIVIDUAL: 'individual',
  BUSINESS: 'business',
  FIRM: 'firm',
  SCHOOL: 'school',
  INSTITUTION: 'institution'
};

// Customer Type Display Names
export const CUSTOMER_TYPE_DISPLAY_NAMES = {
  [CUSTOMER_TYPES.WHOLESALER]: 'Wholesaler',
  [CUSTOMER_TYPES.RETAILER]: 'Retailer'
};

// Customer Category Display Names
export const CUSTOMER_CATEGORY_DISPLAY_NAMES = {
  [CUSTOMER_CATEGORIES.INDIVIDUAL]: 'Individual',
  [CUSTOMER_CATEGORIES.BUSINESS]: 'Business',
  [CUSTOMER_CATEGORIES.FIRM]: 'Firm',
  [CUSTOMER_CATEGORIES.SCHOOL]: 'School',
  [CUSTOMER_CATEGORIES.INSTITUTION]: 'Institution'
};

// Customer Type Configurations
export const CUSTOMER_TYPE_CONFIG = {
  [CUSTOMER_TYPES.WHOLESALER]: {
    label: 'Wholesaler',
    description: 'Bulk orders, volume discounts, special pricing',
    minOrderQuantity: 10,
    discountEligible: true,
    bulkPricing: true,
    creditTerms: 30,
    color: '#2196f3',
    icon: 'business'
  },
  [CUSTOMER_TYPES.RETAILER]: {
    label: 'Retailer',
    description: 'Regular orders, standard pricing',
    minOrderQuantity: 1,
    discountEligible: false,
    bulkPricing: false,
    creditTerms: 15,
    color: '#4caf50',
    icon: 'store'
  }
};

// Customer Category Configurations
export const CUSTOMER_CATEGORY_CONFIG = {
  [CUSTOMER_CATEGORIES.INDIVIDUAL]: {
    label: 'Individual',
    description: 'Personal purchases, simplified invoicing',
    requiresGST: false,
    documentationType: 'simple',
    defaultPaymentTerms: 0,
    color: '#ff9800',
    icon: 'person'
  },
  [CUSTOMER_CATEGORIES.BUSINESS]: {
    label: 'Business',
    description: 'Corporate purchases, detailed invoicing, GST',
    requiresGST: true,
    documentationType: 'detailed',
    defaultPaymentTerms: 30,
    color: '#9c27b0',
    icon: 'business'
  },
  [CUSTOMER_CATEGORIES.FIRM]: {
    label: 'Firm',
    description: 'Partnership/firm purchases, professional invoicing',
    requiresGST: true,
    documentationType: 'detailed',
    defaultPaymentTerms: 15,
    color: '#3f51b5',
    icon: 'corporate_fare'
  },
  [CUSTOMER_CATEGORIES.SCHOOL]: {
    label: 'School',
    description: 'Educational institutions, educational discounts',
    requiresGST: false,
    documentationType: 'institutional',
    defaultPaymentTerms: 45,
    color: '#009688',
    icon: 'school'
  },
  [CUSTOMER_CATEGORIES.INSTITUTION]: {
    label: 'Institution',
    description: 'Government/public institutions, institutional billing',
    requiresGST: false,
    documentationType: 'institutional',
    defaultPaymentTerms: 60,
    color: '#795548',
    icon: 'account_balance'
  }
};

// Priority levels for customer types
export const CUSTOMER_PRIORITY = {
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low'
};

// Customer Status
export const CUSTOMER_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  BLOCKED: 'blocked'
};

// Customer Lead Sources
export const LEAD_SOURCES = {
  WALK_IN: 'walk_in',
  REFERRAL: 'referral',
  ADVERTISEMENT: 'advertisement',
  ONLINE: 'online',
  EXHIBITION: 'exhibition',
  COLD_CALL: 'cold_call'
};

// Discount Types
export const DISCOUNT_TYPES = {
  PERCENTAGE: 'percentage',
  FIXED_AMOUNT: 'fixed_amount',
  BULK_DISCOUNT: 'bulk_discount',
  SEASONAL: 'seasonal'
};

// Customer Preferences
export const CUSTOMER_PREFERENCES = {
  COMMUNICATION: {
    EMAIL: 'email',
    SMS: 'sms',
    PHONE: 'phone',
    WHATSAPP: 'whatsapp'
  },
  BILLING: {
    EMAIL: 'email',
    PHYSICAL: 'physical',
    BOTH: 'both'
  },
  DELIVERY: {
    STANDARD: 'standard',
    EXPRESS: 'express',
    PICKUP: 'pickup'
  }
};

// Credit Limits by Customer Type
export const DEFAULT_CREDIT_LIMITS = {
  [CUSTOMER_TYPES.WHOLESALER]: 500000, // 5 Lakhs
  [CUSTOMER_TYPES.RETAILER]: 100000    // 1 Lakh
};

// Customer Validation Rules
export const CUSTOMER_VALIDATION_RULES = {
  NAME_MIN_LENGTH: 2,
  NAME_MAX_LENGTH: 100,
  PHONE_LENGTH: 10,
  EMAIL_PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  GST_PATTERN: /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}[Z]{1}[0-9A-Z]{1}$/,
  ADDRESS_MAX_LENGTH: 200
};

export default {
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
};