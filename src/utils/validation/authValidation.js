/**
 * Authentication Validation
 * Validation functions specific to authentication and user management
 */

import {
  validateRequired,
  validateEmail,
  validatePassword,
  validateConfirmPassword,
  validateFormData
} from '../helpers/validationHelpers';

import { 
  USER_ROLES, 
  SECURITY_SETTINGS, 
} from '../constants';

/**
 * Validate login form data
 * @param {Object} formData - Login form data
 * @returns {Object} Validation result
 */
export const validateLoginForm = (formData) => {
  const validationRules = {
    email: {
      required: true,
      type: 'email',
      label: 'Email'
    },
    password: {
      required: true,
      type: 'password',
      requirements: SECURITY_SETTINGS.PASSWORD_REQUIREMENTS,
      label: 'Password'
    }
  };

  return validateFormData(formData, validationRules);
};

/**
 * Validate registration form data
 * @param {Object} formData - Registration form data
 * @returns {Object} Validation result
 */
export const validateRegistrationForm = (formData) => {
  const validationRules = {
    name: {
      required: true,
      type: 'stringLength',
      minLength: 2,
      maxLength: 50,
      label: 'Full Name'
    },
    email: {
      required: true,
      type: 'email',
      label: 'Email Address'
    },
    phone: {
      required: true,
      type: 'phone',
      label: 'Phone Number'
    },
    password: {
      required: true,
      type: 'password',
      requirements: SECURITY_SETTINGS.PASSWORD_REQUIREMENTS,
      label: 'Password'
    },
    role: {
      required: true,
      type: 'role',
      label: 'Role'
    }
  };

  const validation = validateFormData(formData, validationRules);

  // Additional validation for confirm password
  if (formData.confirmPassword !== undefined) {
    const confirmPasswordValidation = validateConfirmPassword(
      formData.password, 
      formData.confirmPassword
    );
    
    if (!confirmPasswordValidation.isValid) {
      validation.isValid = false;
      validation.errors.confirmPassword = confirmPasswordValidation.error;
    }
  }

  // Validate role
  if (formData.role && !Object.values(USER_ROLES).includes(formData.role)) {
    validation.isValid = false;
    validation.errors.role = 'Invalid role selected';
  }

  return validation;
};

/**
 * Validate user profile data
 * @param {Object} profileData - User profile data
 * @returns {Object} Validation result
 */
export const validateUserProfile = (profileData) => {
  const validationRules = {
    name: {
      required: true,
      type: 'stringLength',
      minLength: 2,
      maxLength: 50,
      label: 'Full Name'
    },
    email: {
      required: true,
      type: 'email',
      label: 'Email Address'
    },
    phone: {
      required: false,
      type: 'phone',
      label: 'Phone Number'
    },
    designation: {
      required: false,
      type: 'stringLength',
      minLength: 2,
      maxLength: 50,
      label: 'Designation'
    },
    department: {
      required: false,
      type: 'stringLength',
      minLength: 2,
      maxLength: 30,
      label: 'Department'
    }
  };

  return validateFormData(profileData, validationRules);
};

/**
 * Validate password change form
 * @param {Object} passwordData - Password change data
 * @returns {Object} Validation result
 */
export const validatePasswordChange = (passwordData) => {
  const { currentPassword, newPassword, confirmPassword } = passwordData;

  const errors = {};
  let isValid = true;

  // Validate current password
  const currentPasswordValidation = validateRequired(currentPassword, 'Current Password');
  if (!currentPasswordValidation.isValid) {
    errors.currentPassword = currentPasswordValidation.error;
    isValid = false;
  }

  // Validate new password
  const newPasswordValidation = validatePassword(newPassword, SECURITY_SETTINGS.PASSWORD_REQUIREMENTS);
  if (!newPasswordValidation.isValid) {
    errors.newPassword = newPasswordValidation.error;
    isValid = false;
  }

  // Validate confirm password
  const confirmPasswordValidation = validateConfirmPassword(newPassword, confirmPassword);
  if (!confirmPasswordValidation.isValid) {
    errors.confirmPassword = confirmPasswordValidation.error;
    isValid = false;
  }

  // Check if new password is different from current
  if (currentPassword && newPassword && currentPassword === newPassword) {
    errors.newPassword = 'New password must be different from current password';
    isValid = false;
  }

  return { isValid, errors };
};

/**
 * Validate forgot password form
 * @param {string} email - Email address
 * @returns {Object} Validation result
 */
export const validateForgotPasswordForm = (email) => {
  return validateEmail(email);
};

/**
 * Validate reset password form
 * @param {Object} resetData - Reset password data
 * @returns {Object} Validation result
 */
export const validateResetPasswordForm = (resetData) => {
  const { password, confirmPassword, resetCode } = resetData;

  const errors = {};
  let isValid = true;

  // Validate reset code
  if (!resetCode || !resetCode.trim()) {
    errors.resetCode = 'Reset code is required';
    isValid = false;
  }

  // Validate new password
  const passwordValidation = validatePassword(password, SECURITY_SETTINGS.PASSWORD_REQUIREMENTS);
  if (!passwordValidation.isValid) {
    errors.password = passwordValidation.error;
    isValid = false;
  }

  // Validate confirm password
  const confirmPasswordValidation = validateConfirmPassword(password, confirmPassword);
  if (!confirmPasswordValidation.isValid) {
    errors.confirmPassword = confirmPasswordValidation.error;
    isValid = false;
  }

  return { isValid, errors };
};

/**
 * Validate role assignment
 * @param {string} assignerRole - Role of user making assignment
 * @param {string} targetRole - Role being assigned
 * @returns {Object} Validation result
 */
export const validateRoleAssignment = (assignerRole, targetRole) => {
  if (!assignerRole || !targetRole) {
    return { isValid: false, error: 'Both assigner and target roles are required' };
  }

  // Only admin can assign admin role
  if (targetRole === USER_ROLES.ADMIN && assignerRole !== USER_ROLES.ADMIN) {
    return { isValid: false, error: 'Only administrators can assign admin role' };
  }

  // Manager can assign employee and intern roles
  if (assignerRole === USER_ROLES.MANAGER) {
    const allowedRoles = [USER_ROLES.EMPLOYEE, USER_ROLES.INTERN];
    if (!allowedRoles.includes(targetRole)) {
      return { isValid: false, error: 'Managers can only assign Employee or Intern roles' };
    }
  }

  // Employee cannot assign any roles
  if (assignerRole === USER_ROLES.EMPLOYEE || assignerRole === USER_ROLES.INTERN) {
    return { isValid: false, error: 'Insufficient permissions to assign roles' };
  }

  return { isValid: true, error: '' };
};

/**
 * Validate user permissions update
 * @param {Object} permissionUpdates - Permission updates
 * @param {string} userRole - User's role
 * @returns {Object} Validation result
 */
export const validatePermissionUpdates = (permissionUpdates, userRole) => {
  if (userRole !== USER_ROLES.ADMIN) {
    return { isValid: false, error: 'Only administrators can modify permissions' };
  }

  // Validate that all permissions are boolean values
  const errors = {};
  let isValid = true;

  for (const [permission, value] of Object.entries(permissionUpdates)) {
    if (typeof value !== 'boolean') {
      errors[permission] = 'Permission value must be boolean';
      isValid = false;
    }
  }

  return { isValid, errors };
};

/**
 * Validate session token
 * @param {string} token - Session token
 * @param {number} maxAge - Maximum token age in milliseconds
 * @returns {Object} Validation result
 */
export const validateSessionToken = (token, maxAge = 24 * 60 * 60 * 1000) => {
  if (!token) {
    return { isValid: false, error: 'Session token is required' };
  }

  try {
    // In a real implementation, you would decode and validate the JWT token
    // For now, we'll do basic validation
    const tokenParts = token.split('.');
    if (tokenParts.length !== 3) {
      return { isValid: false, error: 'Invalid token format' };
    }

    // Check token expiry (this is simplified - real implementation would decode JWT)
    // For demo purposes, assume token contains timestamp
    return { isValid: true, error: '' };
  } catch (error) {
    return { isValid: false, error: 'Invalid session token' };
  }
};

/**
 * Validate user registration eligibility
 * @param {string} email - Email address
 * @param {Array} existingUsers - Array of existing users
 * @returns {Object} Validation result
 */
export const validateRegistrationEligibility = (email, existingUsers = []) => {
  // Check if email already exists
  const emailExists = existingUsers.some(user => 
    user.email.toLowerCase() === email.toLowerCase()
  );

  if (emailExists) {
    return { 
      isValid: false, 
      error: 'An account with this email address already exists' 
    };
  }

  return { isValid: true, error: '' };
};

/**
 * Validate two-factor authentication code
 * @param {string} code - 2FA code
 * @returns {Object} Validation result
 */
export const validate2FACode = (code) => {
  if (!code || !code.trim()) {
    return { isValid: false, error: 'Verification code is required' };
  }

  const cleanCode = code.replace(/\D/g, '');
  if (cleanCode.length !== 6) {
    return { isValid: false, error: 'Verification code must be 6 digits' };
  }

  return { isValid: true, error: '' };
};

/**
 * Complete auth form validation (for multi-step forms)
 * @param {Object} formData - Complete form data
 * @param {string} formType - Type of form ('login', 'register', 'profile')
 * @returns {Object} Complete validation result
 */
export const validateAuthForm = (formData, formType) => {
  switch (formType) {
    case 'login':
      return validateLoginForm(formData);
    case 'register':
      return validateRegistrationForm(formData);
    case 'profile':
      return validateUserProfile(formData);
    case 'passwordChange':
      return validatePasswordChange(formData);
    case 'forgotPassword':
      return validateForgotPasswordForm(formData.email);
    case 'resetPassword':
      return validateResetPasswordForm(formData);
    default:
      return { isValid: false, errors: { form: 'Unknown form type' } };
  }
};

export default {
  validateLoginForm,
  validateRegistrationForm,
  validateUserProfile,
  validatePasswordChange,
  validateForgotPasswordForm,
  validateResetPasswordForm,
  validateRoleAssignment,
  validatePermissionUpdates,
  validateSessionToken,
  validateRegistrationEligibility,
  validate2FACode,
  validateAuthForm
};