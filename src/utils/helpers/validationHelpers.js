/**
 * Validation Helpers
 * Utility functions for form validation, data validation, and input sanitization
 */

import { 
  VALIDATION_MESSAGES, 
  GST_VALIDATION, 
  CUSTOMER_VALIDATION_RULES,
  INDIAN_STATES,
  GST_STATE_CODES
} from '../constants';

/**
 * Validate required field
 * @param {any} value - Value to validate
 * @param {string} fieldName - Field name for error message
 * @returns {Object} Validation result
 */
export const validateRequired = (value, fieldName = 'Field') => {
  const isValid = value !== null && value !== undefined && String(value).trim() !== '';
  
  return {
    isValid,
    error: isValid ? '' : `${fieldName} ${VALIDATION_MESSAGES.REQUIRED.toLowerCase()}`
  };
};

/**
 * Validate email address
 * @param {string} email - Email to validate
 * @returns {Object} Validation result
 */
export const validateEmail = (email) => {
  if (!email || !email.trim()) {
    return { isValid: false, error: VALIDATION_MESSAGES.REQUIRED };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const isValid = emailRegex.test(email.trim());
  
  return {
    isValid,
    error: isValid ? '' : VALIDATION_MESSAGES.INVALID_EMAIL
  };
};

/**
 * Validate phone number (Indian format)
 * @param {string} phone - Phone number to validate
 * @returns {Object} Validation result
 */
export const validatePhone = (phone) => {
  if (!phone || !phone.trim()) {
    return { isValid: false, error: VALIDATION_MESSAGES.REQUIRED };
  }

  // Remove all non-digits and check if it's exactly 10 digits
  const digits = phone.replace(/\D/g, '');
  const isValid = digits.length === 10 && /^[6-9]/.test(digits); // Indian mobile numbers start with 6-9
  
  return {
    isValid,
    error: isValid ? '' : VALIDATION_MESSAGES.INVALID_PHONE
  };
};

/**
 * Validate GST number
 * @param {string} gstNumber - GST number to validate
 * @param {boolean} required - Whether GST number is required
 * @returns {Object} Validation result
 */
export const validateGSTNumber = (gstNumber, required = false) => {
  if (!gstNumber || !gstNumber.trim()) {
    return {
      isValid: !required,
      error: required ? VALIDATION_MESSAGES.REQUIRED : ''
    };
  }

  const cleanGST = gstNumber.trim().toUpperCase();
  const isValidFormat = GST_VALIDATION.GST_NUMBER_PATTERN.test(cleanGST);
  
  if (!isValidFormat) {
    return {
      isValid: false,
      error: VALIDATION_MESSAGES.INVALID_GST
    };
  }

  // Validate state code (first 2 digits)
  const stateCode = cleanGST.substring(0, 2);
  const validStateCodes = Object.values(GST_STATE_CODES);
  
  if (!validStateCodes.includes(stateCode)) {
    return {
      isValid: false,
      error: 'Invalid state code in GST number'
    };
  }

  return { isValid: true, error: '' };
};

/**
 * Validate PAN number
 * @param {string} pan - PAN number to validate
 * @param {boolean} required - Whether PAN is required
 * @returns {Object} Validation result
 */
export const validatePAN = (pan, required = false) => {
  if (!pan || !pan.trim()) {
    return {
      isValid: !required,
      error: required ? VALIDATION_MESSAGES.REQUIRED : ''
    };
  }

  const cleanPAN = pan.trim().toUpperCase();
  const isValid = GST_VALIDATION.PAN_PATTERN.test(cleanPAN);
  
  return {
    isValid,
    error: isValid ? '' : 'Invalid PAN format (e.g., ABCDE1234F)'
  };
};

/**
 * Validate password
 * @param {string} password - Password to validate
 * @param {Object} requirements - Password requirements
 * @returns {Object} Validation result
 */
export const validatePassword = (password, requirements = {}) => {
  const {
    minLength = 6,
    requireUppercase = false,
    requireNumbers = true,
    requireSpecialChars = false
  } = requirements;

  if (!password) {
    return { isValid: false, error: VALIDATION_MESSAGES.REQUIRED };
  }

  const errors = [];

  if (password.length < minLength) {
    errors.push(`Password must be at least ${minLength} characters`);
  }

  if (requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (requireNumbers && !/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  if (requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }

  return {
    isValid: errors.length === 0,
    error: errors.join('. ')
  };
};

/**
 * Validate confirm password
 * @param {string} password - Original password
 * @param {string} confirmPassword - Confirm password
 * @returns {Object} Validation result
 */
export const validateConfirmPassword = (password, confirmPassword) => {
  if (!confirmPassword) {
    return { isValid: false, error: VALIDATION_MESSAGES.REQUIRED };
  }

  const isValid = password === confirmPassword;
  
  return {
    isValid,
    error: isValid ? '' : VALIDATION_MESSAGES.PASSWORDS_DONT_MATCH
  };
};

/**
 * Validate string length
 * @param {string} value - Value to validate
 * @param {number} minLength - Minimum length
 * @param {number} maxLength - Maximum length
 * @param {string} fieldName - Field name
 * @returns {Object} Validation result
 */
export const validateStringLength = (value, minLength, maxLength, fieldName = 'Field') => {
  if (!value) {
    return { isValid: false, error: `${fieldName} ${VALIDATION_MESSAGES.REQUIRED.toLowerCase()}` };
  }

  const trimmedValue = value.trim();
  
  if (trimmedValue.length < minLength) {
    return {
      isValid: false,
      error: `${fieldName} must be at least ${minLength} characters`
    };
  }

  if (maxLength && trimmedValue.length > maxLength) {
    return {
      isValid: false,
      error: `${fieldName} must not exceed ${maxLength} characters`
    };
  }

  return { isValid: true, error: '' };
};

/**
 * Validate numeric value
 * @param {any} value - Value to validate
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @param {string} fieldName - Field name
 * @returns {Object} Validation result
 */
export const validateNumeric = (value, min = null, max = null, fieldName = 'Value') => {
  if (value === null || value === undefined || value === '') {
    return { isValid: false, error: `${fieldName} ${VALIDATION_MESSAGES.REQUIRED.toLowerCase()}` };
  }

  const numericValue = Number(value);
  
  if (isNaN(numericValue)) {
    return { isValid: false, error: `${fieldName} must be a valid number` };
  }

  if (min !== null && numericValue < min) {
    return { isValid: false, error: `${fieldName} must be at least ${min}` };
  }

  if (max !== null && numericValue > max) {
    return { isValid: false, error: `${fieldName} must not exceed ${max}` };
  }

  return { isValid: true, error: '' };
};

/**
 * Validate date
 * @param {Date|string} date - Date to validate
 * @param {boolean} allowFuture - Whether to allow future dates
 * @param {boolean} allowPast - Whether to allow past dates
 * @returns {Object} Validation result
 */
export const validateDate = (date, allowFuture = true, allowPast = true) => {
  if (!date) {
    return { isValid: false, error: VALIDATION_MESSAGES.REQUIRED };
  }

  const dateObj = new Date(date);
  if (isNaN(dateObj.getTime())) {
    return { isValid: false, error: 'Invalid date format' };
  }

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const inputDate = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate());

  if (!allowFuture && inputDate > today) {
    return { isValid: false, error: VALIDATION_MESSAGES.FUTURE_DATE_NOT_ALLOWED };
  }

  if (!allowPast && inputDate < today) {
    return { isValid: false, error: VALIDATION_MESSAGES.PAST_DATE_NOT_ALLOWED };
  }

  return { isValid: true, error: '' };
};

/**
 * Validate Indian state
 * @param {string} state - State name
 * @returns {Object} Validation result
 */
export const validateState = (state) => {
  if (!state || !state.trim()) {
    return { isValid: false, error: VALIDATION_MESSAGES.REQUIRED };
  }

  const normalizedState = state.toLowerCase().trim();
  const isValid = Object.keys(INDIAN_STATES).includes(normalizedState);
  
  return {
    isValid,
    error: isValid ? '' : 'Please select a valid Indian state'
  };
};

/**
 * Validate pincode (Indian postal code)
 * @param {string} pincode - Pincode to validate
 * @returns {Object} Validation result
 */
export const validatePincode = (pincode) => {
  if (!pincode || !pincode.trim()) {
    return { isValid: false, error: VALIDATION_MESSAGES.REQUIRED };
  }

  const cleanPincode = pincode.replace(/\D/g, '');
  const isValid = cleanPincode.length === 6;
  
  return {
    isValid,
    error: isValid ? '' : 'Pincode must be 6 digits'
  };
};

/**
 * Validate customer name
 * @param {string} name - Customer name
 * @returns {Object} Validation result
 */
export const validateCustomerName = (name) => {
  return validateStringLength(
    name,
    CUSTOMER_VALIDATION_RULES.NAME_MIN_LENGTH,
    CUSTOMER_VALIDATION_RULES.NAME_MAX_LENGTH,
    'Name'
  );
};

/**
 * Validate amount (currency)
 * @param {any} amount - Amount to validate
 * @param {number} minAmount - Minimum amount
 * @returns {Object} Validation result
 */
export const validateAmount = (amount, minAmount = 0) => {
  const validation = validateNumeric(amount, minAmount, null, 'Amount');
  
  if (!validation.isValid) {
    return validation;
  }

  // Additional currency validation
  const numAmount = Number(amount);
  if (numAmount < 0) {
    return { isValid: false, error: 'Amount cannot be negative' };
  }

  // Check for reasonable maximum (1 crore)
  if (numAmount > 100000000) {
    return { isValid: false, error: 'Amount seems too large. Please verify.' };
  }

  return { isValid: true, error: '' };
};

/**
 * Validate business hours
 * @param {string} startTime - Start time (HH:MM format)
 * @param {string} endTime - End time (HH:MM format)
 * @returns {Object} Validation result
 */
export const validateBusinessHours = (startTime, endTime) => {
  const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
  
  if (!startTime || !endTime) {
    return { isValid: false, error: 'Both start and end times are required' };
  }

  if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) {
    return { isValid: false, error: 'Time format must be HH:MM' };
  }

  const start = new Date(`2000-01-01T${startTime}:00`);
  const end = new Date(`2000-01-01T${endTime}:00`);

  if (start >= end) {
    return { isValid: false, error: 'End time must be after start time' };
  }

  return { isValid: true, error: '' };
};

/**
 * Validate file upload
 * @param {File} file - File to validate
 * @param {Object} options - Validation options
 * @returns {Object} Validation result
 */
export const validateFileUpload = (file, options = {}) => {
  const {
    maxSize = 5 * 1024 * 1024, // 5MB default
    allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'],
    required = false
  } = options;

  if (!file) {
    return { 
      isValid: !required, 
      error: required ? 'File is required' : '' 
    };
  }

  // Check file size
  if (file.size > maxSize) {
    const maxMB = (maxSize / (1024 * 1024)).toFixed(1);
    return { 
      isValid: false, 
      error: `File size must not exceed ${maxMB}MB` 
    };
  }

  // Check file type
  if (!allowedTypes.includes(file.type)) {
    const typesList = allowedTypes.map(type => 
      type.split('/')[1].toUpperCase()
    ).join(', ');
    return { 
      isValid: false, 
      error: `Only ${typesList} files are allowed` 
    };
  }

  return { isValid: true, error: '' };
};

/**
 * Validate URL
 * @param {string} url - URL to validate
 * @param {boolean} required - Whether URL is required
 * @returns {Object} Validation result
 */
export const validateURL = (url, required = false) => {
  if (!url || !url.trim()) {
    return { 
      isValid: !required, 
      error: required ? VALIDATION_MESSAGES.REQUIRED : '' 
    };
  }

  try {
    new URL(url);
    return { isValid: true, error: '' };
  } catch {
    return { isValid: false, error: 'Please enter a valid URL' };
  }
};

/**
 * Validate age
 * @param {number|string} age - Age to validate
 * @param {number} minAge - Minimum age
 * @param {number} maxAge - Maximum age
 * @returns {Object} Validation result
 */
export const validateAge = (age, minAge = 18, maxAge = 100) => {
  const validation = validateNumeric(age, minAge, maxAge, 'Age');
  
  if (!validation.isValid) {
    return validation;
  }

  const numAge = Number(age);
  if (numAge < 0) {
    return { isValid: false, error: 'Age cannot be negative' };
  }

  return { isValid: true, error: '' };
};

/**
 * Validate salary
 * @param {number|string} salary - Salary to validate
 * @returns {Object} Validation result
 */
export const validateSalary = (salary) => {
  const validation = validateNumeric(salary, 5000, 10000000, 'Salary');
  
  if (!validation.isValid) {
    return validation;
  }

  return { isValid: true, error: '' };
};

/**
 * Validate item quantity
 * @param {number|string} quantity - Quantity to validate
 * @returns {Object} Validation result
 */
export const validateQuantity = (quantity) => {
  const validation = validateNumeric(quantity, 1, 10000, 'Quantity');
  
  if (!validation.isValid) {
    return validation;
  }

  const numQuantity = Number(quantity);
  if (numQuantity % 1 !== 0) {
    return { isValid: false, error: 'Quantity must be a whole number' };
  }

  return { isValid: true, error: '' };
};

/**
 * Validate form object
 * @param {Object} formData - Form data object
 * @param {Object} validationRules - Validation rules object
 * @returns {Object} Validation result with errors object
 */
export const validateFormData = (formData, validationRules) => {
  const errors = {};
  let isValid = true;

  for (const [field, rules] of Object.entries(validationRules)) {
    const value = formData[field];
    let fieldValidation = { isValid: true, error: '' };

    // Required validation
    if (rules.required) {
      fieldValidation = validateRequired(value, rules.label || field);
      if (!fieldValidation.isValid) {
        errors[field] = fieldValidation.error;
        isValid = false;
        continue;
      }
    }

    // Skip other validations if field is empty and not required
    if (!value && !rules.required) continue;

    // Type-specific validation
    switch (rules.type) {
      case 'email':
        fieldValidation = validateEmail(value);
        break;
      case 'phone':
        fieldValidation = validatePhone(value);
        break;
      case 'gst':
        fieldValidation = validateGSTNumber(value, rules.required);
        break;
      case 'pan':
        fieldValidation = validatePAN(value, rules.required);
        break;
      case 'password':
        fieldValidation = validatePassword(value, rules.requirements);
        break;
      case 'numeric':
        fieldValidation = validateNumeric(value, rules.min, rules.max, rules.label);
        break;
      case 'amount':
        fieldValidation = validateAmount(value, rules.min);
        break;
      case 'date':
        fieldValidation = validateDate(value, rules.allowFuture, rules.allowPast);
        break;
      case 'url':
        fieldValidation = validateURL(value, rules.required);
        break;
      case 'stringLength':
        fieldValidation = validateStringLength(value, rules.minLength, rules.maxLength, rules.label);
        break;
      default:
        break;
    }

    if (!fieldValidation.isValid) {
      errors[field] = fieldValidation.error;
      isValid = false;
    }
  }

  return { isValid, errors };
};

/**
 * Sanitize string input
 * @param {string} input - Input to sanitize
 * @returns {string} Sanitized input
 */
export const sanitizeString = (input) => {
  if (!input || typeof input !== 'string') return '';
  
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML characters
    .replace(/\s+/g, ' '); // Replace multiple spaces with single space
};

/**
 * Validate and sanitize form input
 * @param {string} value - Value to validate and sanitize
 * @param {string} type - Input type
 * @returns {Object} Result with sanitized value and validation
 */
export const validateAndSanitizeInput = (value, type = 'text') => {
  let sanitizedValue = value;
  let validation = { isValid: true, error: '' };

  switch (type) {
    case 'email':
      sanitizedValue = value ? value.toLowerCase().trim() : '';
      validation = validateEmail(sanitizedValue);
      break;
    case 'phone':
      sanitizedValue = value ? value.replace(/\D/g, '') : '';
      validation = validatePhone(sanitizedValue);
      break;
    case 'gst':
      sanitizedValue = value ? value.toUpperCase().trim() : '';
      validation = validateGSTNumber(sanitizedValue);
      break;
    case 'name':
      sanitizedValue = sanitizeString(value);
      validation = validateCustomerName(sanitizedValue);
      break;
    default:
      sanitizedValue = sanitizeString(value);
      break;
  }

  return {
    value: sanitizedValue,
    ...validation
  };
};

/**
 * Check if all validation results are valid
 * @param {Array} validationResults - Array of validation results
 * @returns {boolean} Whether all validations passed
 */
export const allValidationsPass = (validationResults) => {
  return validationResults.every(result => result.isValid);
};

export default {
  validateRequired,
  validateEmail,
  validatePhone,
  validateGSTNumber,
  validatePAN,
  validatePassword,
  validateConfirmPassword,
  validateStringLength,
  validateNumeric,
  validateDate,
  validateState,
  validatePincode,
  validateCustomerName,
  validateAmount,
  validateBusinessHours,
  validateFileUpload,
  validateURL,
  validateAge,
  validateSalary,
  validateQuantity,
  validateFormData,
  sanitizeString,
  validateAndSanitizeInput,
  allValidationsPass
};