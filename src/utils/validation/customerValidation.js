import { CUSTOMER_TYPES, CUSTOMER_CATEGORIES } from '../constants/appConstants';

// Validation messages
export const VALIDATION_MESSAGES = {
  REQUIRED: 'This field is required',
  INVALID_EMAIL: 'Please enter a valid email address',
  INVALID_PHONE: 'Please enter a valid phone number',
  INVALID_GST: 'Please enter a valid GST number',
  MIN_LENGTH: (length) => `Must be at least ${length} characters`,
  MAX_LENGTH: (length) => `Must not exceed ${length} characters`,
  INVALID_PINCODE: 'Please enter a valid PIN code'
};

/**
 * Validate customer form data
 * @param {Object} customerData - Customer data to validate
 * @param {boolean} isEdit - Whether this is an edit operation
 * @returns {Object} - Validation result with errors and isValid flag
 */
export const validateCustomerData = (customerData, isEdit = false) => {
  const errors = {};
  let isValid = true;

  // Required fields for creation
  const requiredFields = isEdit 
    ? [] // For edit, only validate provided fields
    : ['name', 'phone', 'customerType', 'category'];

  // Name validation
  if (!isEdit || customerData.name !== undefined) {
    if (!customerData.name || customerData.name.trim() === '') {
      errors.name = VALIDATION_MESSAGES.REQUIRED;
      isValid = false;
    } else if (customerData.name.trim().length < 2) {
      errors.name = VALIDATION_MESSAGES.MIN_LENGTH(2);
      isValid = false;
    } else if (customerData.name.trim().length > 100) {
      errors.name = VALIDATION_MESSAGES.MAX_LENGTH(100);
      isValid = false;
    }
  }

  // Phone validation
  if (!isEdit || customerData.phone !== undefined) {
    if (!customerData.phone || customerData.phone.trim() === '') {
      errors.phone = VALIDATION_MESSAGES.REQUIRED;
      isValid = false;
    } else {
      const phoneRegex = /^[\d\s\-\+\(\)]{10,15}$/;
      const cleanPhone = customerData.phone.replace(/\s/g, '');
      if (cleanPhone.length < 10 || !phoneRegex.test(cleanPhone)) {
        errors.phone = VALIDATION_MESSAGES.INVALID_PHONE;
        isValid = false;
      }
    }
  }

  // Email validation (optional but must be valid if provided)
  if (customerData.email && customerData.email.trim() !== '') {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(customerData.email.trim())) {
      errors.email = VALIDATION_MESSAGES.INVALID_EMAIL;
      isValid = false;
    }
  }

  // Address validation (not required but validate if provided)
  if (customerData.address && customerData.address.trim() !== '') {
    if (customerData.address.trim().length > 500) {
      errors.address = VALIDATION_MESSAGES.MAX_LENGTH(500);
      isValid = false;
    }
  }

  // Customer Type validation
  if (!isEdit || customerData.customerType !== undefined) {
    if (!customerData.customerType) {
      errors.customerType = VALIDATION_MESSAGES.REQUIRED;
      isValid = false;
    } else if (!Object.values(CUSTOMER_TYPES).includes(customerData.customerType)) {
      errors.customerType = 'Invalid customer type';
      isValid = false;
    }
  }

  // Category validation
  if (!isEdit || customerData.category !== undefined) {
    if (!customerData.category) {
      errors.category = VALIDATION_MESSAGES.REQUIRED;
      isValid = false;
    } else if (!Object.values(CUSTOMER_CATEGORIES).includes(customerData.category)) {
      errors.category = 'Invalid customer category';
      isValid = false;
    }
  }

  // GST Number validation (optional)
  if (customerData.gstNumber && customerData.gstNumber.trim() !== '') {
    const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    if (!gstRegex.test(customerData.gstNumber.trim().toUpperCase())) {
      errors.gstNumber = VALIDATION_MESSAGES.INVALID_GST;
      isValid = false;
    }
  }

  // State validation
  if (customerData.state && customerData.state.trim() !== '') {
    if (customerData.state.trim().length > 50) {
      errors.state = VALIDATION_MESSAGES.MAX_LENGTH(50);
      isValid = false;
    }
  }

  // City validation
  if (customerData.city && customerData.city.trim() !== '') {
    if (customerData.city.trim().length > 50) {
      errors.city = VALIDATION_MESSAGES.MAX_LENGTH(50);
      isValid = false;
    }
  }

  // PIN Code validation
  if (customerData.pincode && customerData.pincode.trim() !== '') {
    const pincodeRegex = /^[1-9][0-9]{5}$/;
    if (!pincodeRegex.test(customerData.pincode.trim())) {
      errors.pincode = VALIDATION_MESSAGES.INVALID_PINCODE;
      isValid = false;
    }
  }

  return { errors, isValid };
};

/**
 * Validate individual field
 * @param {string} fieldName - Name of the field
 * @param {any} value - Value to validate
 * @param {Object} allData - All form data for context
 * @returns {string|null} - Error message or null if valid
 */
export const validateField = (fieldName, value, allData = {}) => {
  const customerData = { ...allData, [fieldName]: value };
  const { errors } = validateCustomerData(customerData, true);
  return errors[fieldName] || null;
};

/**
 * Clean and format customer data before submission
 * @param {Object} customerData - Raw customer data
 * @returns {Object} - Cleaned customer data
 */
export const cleanCustomerData = (customerData) => {
  const cleaned = { ...customerData };

  // Trim string fields
  const stringFields = ['name', 'email', 'phone', 'address', 'city', 'state', 'gstNumber', 'pincode'];
  stringFields.forEach(field => {
    if (cleaned[field] && typeof cleaned[field] === 'string') {
      cleaned[field] = cleaned[field].trim();
    }
  });

  // Remove empty fields
  Object.keys(cleaned).forEach(key => {
    if (cleaned[key] === '' || cleaned[key] === null || cleaned[key] === undefined) {
      delete cleaned[key];
    }
  });

  // Format GST number to uppercase
  if (cleaned.gstNumber) {
    cleaned.gstNumber = cleaned.gstNumber.toUpperCase();
  }

  // Format phone number (remove extra spaces and characters)
  if (cleaned.phone) {
    cleaned.phone = cleaned.phone.replace(/\s+/g, ' ').trim();
  }

  // Ensure required fields are present
  if (!cleaned.name) throw new Error('Customer name is required');
  if (!cleaned.phone) throw new Error('Phone number is required');
  if (!cleaned.customerType) throw new Error('Customer type is required');
  if (!cleaned.category) throw new Error('Customer category is required');

  return cleaned;
};

/**
 * Check if phone number is already in use
 * @param {string} phone - Phone number to check
 * @param {Array} existingCustomers - Array of existing customers
 * @param {string} excludeId - Customer ID to exclude from check
 * @returns {boolean} - Whether phone is in use
 */
export const isPhoneNumberInUse = (phone, existingCustomers = [], excludeId = null) => {
  if (!phone || phone.trim() === '') return false;
  
  const cleanPhone = phone.trim().replace(/\s/g, '');
  return existingCustomers.some(customer => 
    customer.id !== excludeId && 
    customer.phone && 
    customer.phone.replace(/\s/g, '') === cleanPhone
  );
};

/**
 * Check if email is already in use
 * @param {string} email - Email to check
 * @param {Array} existingCustomers - Array of existing customers
 * @param {string} excludeId - Customer ID to exclude from check
 * @returns {boolean} - Whether email is in use
 */
export const isEmailInUse = (email, existingCustomers = [], excludeId = null) => {
  if (!email || email.trim() === '') return false;
  
  const cleanEmail = email.trim().toLowerCase();
  return existingCustomers.some(customer => 
    customer.id !== excludeId && 
    customer.email && 
    customer.email.toLowerCase() === cleanEmail
  );
};

/**
 * Get customer type display name
 * @param {string} customerType 
 * @returns {string}
 */
export const getCustomerTypeDisplayName = (customerType) => {
  const displayNames = {
    [CUSTOMER_TYPES.WHOLESALER]: 'Wholesaler',
    [CUSTOMER_TYPES.RETAILER]: 'Retailer'
  };
  return displayNames[customerType] || customerType;
};

/**
 * Get customer category display name
 * @param {string} category 
 * @returns {string}
 */
export const getCategoryDisplayName = (category) => {
  const displayNames = {
    [CUSTOMER_CATEGORIES.INDIVIDUAL]: 'Individual',
    [CUSTOMER_CATEGORIES.FIRM]: 'Firm',
    [CUSTOMER_CATEGORIES.SCHOOL]: 'School'
  };
  return displayNames[category] || category;
};

/**
 * Format customer data for display
 * @param {Object} customer 
 * @returns {Object}
 */
export const formatCustomerForDisplay = (customer) => {
  return {
    ...customer,
    customerTypeDisplay: getCustomerTypeDisplayName(customer.customerType),
    categoryDisplay: getCategoryDisplayName(customer.category),
    fullAddress: [customer.address, customer.city, customer.state, customer.pincode]
      .filter(Boolean)
      .join(', ')
  };
};

export default {
  validateCustomerData,
  validateField,
  cleanCustomerData,
  isPhoneNumberInUse,
  isEmailInUse,
  getCustomerTypeDisplayName,
  getCategoryDisplayName,
  formatCustomerForDisplay,
  VALIDATION_MESSAGES
};