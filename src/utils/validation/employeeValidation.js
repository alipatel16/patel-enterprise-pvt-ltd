import { VALIDATION_MESSAGES } from '../constants/appConstants';

// Common employee roles
export const EMPLOYEE_ROLES = {
  SALES_EXECUTIVE: 'sales_executive',
  SALES_MANAGER: 'sales_manager',
  STORE_MANAGER: 'store_manager',
  CASHIER: 'cashier',
  TECHNICIAN: 'technician',
  ACCOUNTANT: 'accountant',
  ADMIN: 'admin'
};

// Common departments
export const EMPLOYEE_DEPARTMENTS = {
  SALES: 'sales',
  OPERATIONS: 'operations',
  TECHNICAL: 'technical',
  ACCOUNTS: 'accounts',
  ADMINISTRATION: 'administration'
};

/**
 * Validate employee form data
 * @param {Object} employeeData - Employee data to validate
 * @param {boolean} isEdit - Whether this is an edit operation
 * @returns {Object} - Validation result with errors and isValid flag
 */
export const validateEmployeeData = (employeeData, isEdit = false) => {
  const errors = {};
  let isValid = true;

  // Required fields for creation
  const requiredFields = isEdit 
    ? [] // For edit, only validate provided fields
    : ['name', 'employeeId', 'phone', 'role', 'department', 'dateOfJoining'];

  // Name validation
  if (!isEdit || employeeData.name !== undefined) {
    if (!employeeData.name || employeeData.name.trim() === '') {
      errors.name = VALIDATION_MESSAGES.REQUIRED;
      isValid = false;
    } else if (employeeData.name.trim().length < 2) {
      errors.name = VALIDATION_MESSAGES.MIN_LENGTH(2);
      isValid = false;
    } else if (employeeData.name.trim().length > 100) {
      errors.name = VALIDATION_MESSAGES.MAX_LENGTH(100);
      isValid = false;
    }
  }

  // Employee ID validation
  if (!isEdit || employeeData.employeeId !== undefined) {
    if (!employeeData.employeeId || employeeData.employeeId.trim() === '') {
      errors.employeeId = VALIDATION_MESSAGES.REQUIRED;
      isValid = false;
    } else if (employeeData.employeeId.trim().length < 3) {
      errors.employeeId = VALIDATION_MESSAGES.MIN_LENGTH(3);
      isValid = false;
    } else if (employeeData.employeeId.trim().length > 20) {
      errors.employeeId = VALIDATION_MESSAGES.MAX_LENGTH(20);
      isValid = false;
    }
  }

  // Phone validation
  if (!isEdit || employeeData.phone !== undefined) {
    if (!employeeData.phone || employeeData.phone.trim() === '') {
      errors.phone = VALIDATION_MESSAGES.REQUIRED;
      isValid = false;
    } else {
      const phoneRegex = /^[\d\s\-\+\(\)]{10,15}$/;
      const cleanPhone = employeeData.phone.replace(/\s/g, '');
      if (!phoneRegex.test(cleanPhone)) {
        errors.phone = VALIDATION_MESSAGES.INVALID_PHONE;
        isValid = false;
      }
    }
  }

  // Email validation (optional but must be valid if provided)
  if (employeeData.email && employeeData.email.trim() !== '') {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(employeeData.email.trim())) {
      errors.email = VALIDATION_MESSAGES.INVALID_EMAIL;
      isValid = false;
    }
  }

  // Role validation
  if (!isEdit || employeeData.role !== undefined) {
    if (!employeeData.role || employeeData.role.trim() === '') {
      errors.role = VALIDATION_MESSAGES.REQUIRED;
      isValid = false;
    }
  }

  // Department validation
  if (!isEdit || employeeData.department !== undefined) {
    if (!employeeData.department || employeeData.department.trim() === '') {
      errors.department = VALIDATION_MESSAGES.REQUIRED;
      isValid = false;
    }
  }

  // Date of joining validation
  if (!isEdit || employeeData.dateOfJoining !== undefined) {
    if (!employeeData.dateOfJoining) {
      errors.dateOfJoining = VALIDATION_MESSAGES.REQUIRED;
      isValid = false;
    } else {
      const joiningDate = new Date(employeeData.dateOfJoining);
      const today = new Date();
      const minDate = new Date('1950-01-01');
      
      if (isNaN(joiningDate.getTime())) {
        errors.dateOfJoining = 'Invalid date format';
        isValid = false;
      } else if (joiningDate > today) {
        errors.dateOfJoining = 'Date of joining cannot be in the future';
        isValid = false;
      } else if (joiningDate < minDate) {
        errors.dateOfJoining = 'Invalid date of joining';
        isValid = false;
      }
    }
  }

  // Address validation (optional)
  if (employeeData.address && employeeData.address.trim() !== '') {
    if (employeeData.address.trim().length > 500) {
      errors.address = VALIDATION_MESSAGES.MAX_LENGTH(500);
      isValid = false;
    }
  }

  // Salary validation (optional)
  if (employeeData.salary !== undefined && employeeData.salary !== null && employeeData.salary !== '') {
    const salary = parseFloat(employeeData.salary);
    if (isNaN(salary) || salary < 0) {
      errors.salary = VALIDATION_MESSAGES.INVALID_NUMBER;
      isValid = false;
    } else if (salary > 10000000) { // 1 crore limit
      errors.salary = 'Salary amount seems too high';
      isValid = false;
    }
  }

  // Emergency contact validation (optional)
  if (employeeData.emergencyContact && employeeData.emergencyContact.trim() !== '') {
    const phoneRegex = /^[\d\s\-\+\(\)]{10,15}$/;
    const cleanPhone = employeeData.emergencyContact.replace(/\s/g, '');
    if (!phoneRegex.test(cleanPhone)) {
      errors.emergencyContact = 'Invalid emergency contact number';
      isValid = false;
    }
  }

  // Date of birth validation (optional)
  if (employeeData.dateOfBirth && employeeData.dateOfBirth.trim() !== '') {
    const birthDate = new Date(employeeData.dateOfBirth);
    const today = new Date();
    const minAge = new Date(today.getFullYear() - 100, today.getMonth(), today.getDate());
    const maxAge = new Date(today.getFullYear() - 16, today.getMonth(), today.getDate());
    
    if (isNaN(birthDate.getTime())) {
      errors.dateOfBirth = 'Invalid date format';
      isValid = false;
    } else if (birthDate > maxAge) {
      errors.dateOfBirth = 'Employee must be at least 16 years old';
      isValid = false;
    } else if (birthDate < minAge) {
      errors.dateOfBirth = 'Invalid date of birth';
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
  const employeeData = { ...allData, [fieldName]: value };
  const { errors } = validateEmployeeData(employeeData, true);
  return errors[fieldName] || null;
};

/**
 * Clean and format employee data before submission
 * @param {Object} employeeData - Raw employee data
 * @returns {Object} - Cleaned employee data
 */
export const cleanEmployeeData = (employeeData) => {
  const cleaned = { ...employeeData };

  // Trim string fields
  const stringFields = ['name', 'employeeId', 'email', 'phone', 'address', 'role', 'department', 'emergencyContact'];
  stringFields.forEach(field => {
    if (cleaned[field] && typeof cleaned[field] === 'string') {
      cleaned[field] = cleaned[field].trim();
    }
  });

  // Normalize phone number
  if (cleaned.phone) {
    cleaned.phone = cleaned.phone.replace(/\s+/g, ' ');
  }

  // Normalize emergency contact
  if (cleaned.emergencyContact) {
    cleaned.emergencyContact = cleaned.emergencyContact.replace(/\s+/g, ' ');
  }

  // Normalize email to lowercase
  if (cleaned.email) {
    cleaned.email = cleaned.email.toLowerCase();
  }

  // Convert salary to number
  if (cleaned.salary !== undefined && cleaned.salary !== null && cleaned.salary !== '') {
    cleaned.salary = parseFloat(cleaned.salary);
  }

  // Remove empty optional fields
  const optionalFields = ['email', 'address', 'emergencyContact', 'dateOfBirth'];
  optionalFields.forEach(field => {
    if (cleaned[field] === '') {
      delete cleaned[field];
    }
  });

  return cleaned;
};

/**
 * Check if employee ID is already in use
 * @param {string} employeeId - Employee ID to check
 * @param {Array} existingEmployees - List of existing employees
 * @param {string} excludeId - Employee ID to exclude from check (for edits)
 * @returns {boolean} - Whether employee ID is already in use
 */
export const isEmployeeIdInUse = (employeeId, existingEmployees = [], excludeId = null) => {
  const cleanEmployeeId = employeeId.trim().toLowerCase();
  return existingEmployees.some(employee => 
    employee.id !== excludeId && 
    employee.employeeId && 
    employee.employeeId.toLowerCase() === cleanEmployeeId
  );
};

/**
 * Check if phone number is already in use
 * @param {string} phone - Phone number to check
 * @param {Array} existingEmployees - List of existing employees
 * @param {string} excludeId - Employee ID to exclude from check (for edits)
 * @returns {boolean} - Whether phone is already in use
 */
export const isPhoneNumberInUse = (phone, existingEmployees = [], excludeId = null) => {
  const cleanPhone = phone.replace(/\s+/g, ' ').trim();
  return existingEmployees.some(employee => 
    employee.id !== excludeId && 
    employee.phone && 
    employee.phone.replace(/\s+/g, ' ').trim() === cleanPhone
  );
};

/**
 * Check if email is already in use
 * @param {string} email - Email to check
 * @param {Array} existingEmployees - List of existing employees
 * @param {string} excludeId - Employee ID to exclude from check (for edits)
 * @returns {boolean} - Whether email is already in use
 */
export const isEmailInUse = (email, existingEmployees = [], excludeId = null) => {
  if (!email || email.trim() === '') return false;
  
  const cleanEmail = email.trim().toLowerCase();
  return existingEmployees.some(employee => 
    employee.id !== excludeId && 
    employee.email && 
    employee.email.toLowerCase() === cleanEmail
  );
};

/**
 * Get role display name
 * @param {string} role 
 * @returns {string}
 */
export const getRoleDisplayName = (role) => {
  const displayNames = {
    [EMPLOYEE_ROLES.SALES_EXECUTIVE]: 'Sales Executive',
    [EMPLOYEE_ROLES.SALES_MANAGER]: 'Sales Manager',
    [EMPLOYEE_ROLES.STORE_MANAGER]: 'Store Manager',
    [EMPLOYEE_ROLES.CASHIER]: 'Cashier',
    [EMPLOYEE_ROLES.TECHNICIAN]: 'Technician',
    [EMPLOYEE_ROLES.ACCOUNTANT]: 'Accountant',
    [EMPLOYEE_ROLES.ADMIN]: 'Administrator'
  };
  return displayNames[role] || role.split('_').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
  ).join(' ');
};

/**
 * Get department display name
 * @param {string} department 
 * @returns {string}
 */
export const getDepartmentDisplayName = (department) => {
  const displayNames = {
    [EMPLOYEE_DEPARTMENTS.SALES]: 'Sales',
    [EMPLOYEE_DEPARTMENTS.OPERATIONS]: 'Operations',
    [EMPLOYEE_DEPARTMENTS.TECHNICAL]: 'Technical',
    [EMPLOYEE_DEPARTMENTS.ACCOUNTS]: 'Accounts',
    [EMPLOYEE_DEPARTMENTS.ADMINISTRATION]: 'Administration'
  };
  return displayNames[department] || department.charAt(0).toUpperCase() + department.slice(1).toLowerCase();
};

/**
 * Format employee data for display
 * @param {Object} employee 
 * @returns {Object}
 */
export const formatEmployeeForDisplay = (employee) => {
  return {
    ...employee,
    roleDisplay: getRoleDisplayName(employee.role),
    departmentDisplay: getDepartmentDisplayName(employee.department),
    formattedSalary: employee.salary ? `₹${employee.salary.toLocaleString()}` : 'Not specified',
    yearsOfService: employee.dateOfJoining ? 
      Math.floor((new Date() - new Date(employee.dateOfJoining)) / (365.25 * 24 * 60 * 60 * 1000)) : 0
  };
};

/**
 * Generate employee ID
 * @param {string} name - Employee name
 * @param {string} department - Department
 * @param {number} sequence - Sequence number
 * @returns {string}
 */
export const generateEmployeeId = (name, department, sequence = 1) => {
  const namePrefix = name.split(' ').map(part => part.charAt(0).toUpperCase()).join('');
  const deptPrefix = department.substring(0, 3).toUpperCase();
  const sequenceStr = sequence.toString().padStart(3, '0');
  
  return `${deptPrefix}${namePrefix}${sequenceStr}`;
};

export default {
  validateEmployeeData,
  validateField,
  cleanEmployeeData,
  isEmployeeIdInUse,
  isPhoneNumberInUse,
  isEmailInUse,
  getRoleDisplayName,
  getDepartmentDisplayName,
  formatEmployeeForDisplay,
  generateEmployeeId,
  EMPLOYEE_ROLES,
  EMPLOYEE_DEPARTMENTS
};