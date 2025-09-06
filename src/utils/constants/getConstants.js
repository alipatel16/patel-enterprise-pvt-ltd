/**
 * Get Constants Utility
 * Helper functions to retrieve constants and configurations dynamically
 */

import { 
  USER_TYPES, 
  USER_TYPE_CONFIG, 
  APP_COLORS,
  USER_TYPE_DISPLAY_NAMES,
  DASHBOARD_WIDGETS,
  DEFAULT_USER_TYPE_SETTINGS 
} from './userTypeConstants';

import { 
  USER_ROLES, 
  ROLE_CONFIG, 
  PERMISSIONS,
  DEPARTMENT_CONFIG 
} from './roleConstants';

import { 
  CUSTOMER_TYPES, 
  CUSTOMER_CATEGORIES,
  CUSTOMER_TYPE_CONFIG,
  CUSTOMER_CATEGORY_CONFIG 
} from './customerTypes';

import { 
  GST_TYPES, 
  GST_RATES,
  INDIAN_STATES,
  GST_STATE_CODES 
} from './gstConstants';

/**
 * Get user type configuration
 * @param {string} userType - User type value
 * @returns {Object|null} User type configuration
 */
export const getUserTypeConfig = (userType) => {
  if (!userType || !USER_TYPES[userType.toUpperCase()]) {
    return null;
  }
  return USER_TYPE_CONFIG[userType] || null;
};

/**
 * Get user type colors
 * @param {string} userType - User type value
 * @returns {Object} Color configuration
 */
export const getUserTypeColors = (userType) => {
  if (!userType) {
    return APP_COLORS.ELECTRONICS; // Default fallback
  }
  return APP_COLORS[userType.toUpperCase()] || APP_COLORS.ELECTRONICS;
};

/**
 * Get user type display name
 * @param {string} userType - User type value
 * @returns {string} Display name
 */
export const getUserTypeDisplayName = (userType) => {
  if (!userType) {
    return '';
  }
  return USER_TYPE_DISPLAY_NAMES[userType] || userType;
};

/**
 * Get role configuration
 * @param {string} role - Role value
 * @returns {Object|null} Role configuration
 */
export const getRoleConfig = (role) => {
  if (!role || !USER_ROLES[role.toUpperCase()]) {
    return null;
  }
  return ROLE_CONFIG[role] || null;
};

/**
 * Get role display name
 * @param {string} role - Role value
 * @returns {string} Display name
 */
export const getRoleDisplayName = (role) => {
  const config = getRoleConfig(role);
  return config ? config.label : role;
};

/**
 * Check if user has permission
 * @param {string} role - User role
 * @param {string} permission - Permission to check
 * @returns {boolean} Whether user has permission
 */
export const hasPermission = (role, permission) => {
  const config = getRoleConfig(role);
  return config ? config.permissions.includes(permission) : false;
};

/**
 * Get customer type configuration
 * @param {string} customerType - Customer type value
 * @returns {Object|null} Customer type configuration
 */
export const getCustomerTypeConfig = (customerType) => {
  if (!customerType) {
    return null;
  }
  return CUSTOMER_TYPE_CONFIG[customerType] || null;
};

/**
 * Get customer category configuration
 * @param {string} customerCategory - Customer category value
 * @returns {Object|null} Customer category configuration
 */
export const getCustomerCategoryConfig = (customerCategory) => {
  if (!customerCategory) {
    return null;
  }
  return CUSTOMER_CATEGORY_CONFIG[customerCategory] || null;
};

/**
 * Get GST type for state combination
 * @param {string} sellerState - Seller's state
 * @param {string} buyerState - Buyer's state
 * @returns {string} GST type
 */
export const getGSTType = (sellerState, buyerState) => {
  if (!sellerState || !buyerState) {
    return GST_TYPES.NO_GST;
  }

  const normalizedSellerState = sellerState.toLowerCase().trim();
  const normalizedBuyerState = buyerState.toLowerCase().trim();

  if (normalizedSellerState === normalizedBuyerState) {
    return GST_TYPES.CGST_SGST; // Intra-state
  } else {
    return GST_TYPES.IGST; // Inter-state
  }
};

/**
 * Get state code for GST number
 * @param {string} state - State name
 * @returns {string|null} State code
 */
export const getStateCode = (state) => {
  if (!state) {
    return null;
  }
  const normalizedState = state.toLowerCase().trim();
  return GST_STATE_CODES[normalizedState] || null;
};

/**
 * Get dashboard widgets for user type
 * @param {string} userType - User type value
 * @returns {Array} Dashboard widgets
 */
export const getDashboardWidgets = (userType) => {
  if (!userType) {
    return DASHBOARD_WIDGETS[USER_TYPES.ELECTRONICS]; // Default
  }
  return DASHBOARD_WIDGETS[userType] || [];
};

/**
 * Get business features for user type
 * @param {string} userType - User type value
 * @returns {Object} Business features
 */
export const getBusinessFeatures = (userType) => {
  const config = getUserTypeConfig(userType);
  return config ? config.features : {};
};

/**
 * Get common products for user type
 * @param {string} userType - User type value
 * @returns {Array} Common products list
 */
export const getCommonProducts = (userType) => {
  const config = getUserTypeConfig(userType);
  return config ? config.commonProducts : [];
};

/**
 * Get product fields for user type
 * @param {string} userType - User type value
 * @returns {Array} Product fields configuration
 */
export const getProductFields = (userType) => {
  const config = getUserTypeConfig(userType);
  return config ? config.productFields : [];
};

/**
 * Get invoice prefix for user type
 * @param {string} userType - User type value
 * @returns {string} Invoice prefix
 */
export const getInvoicePrefix = (userType) => {
  const config = getUserTypeConfig(userType);
  return config ? config.invoicePrefix : 'INV';
};

/**
 * Get default settings for user type
 * @param {string} userType - User type value
 * @returns {Object} Default settings
 */
export const getDefaultSettings = (userType) => {
  if (!userType) {
    return DEFAULT_USER_TYPE_SETTINGS[USER_TYPES.ELECTRONICS];
  }
  return DEFAULT_USER_TYPE_SETTINGS[userType] || {};
};

/**
 * Check if user type is valid
 * @param {string} userType - User type value
 * @returns {boolean} Whether user type is valid
 */
export const isValidUserType = (userType) => {
  return userType && Object.values(USER_TYPES).includes(userType);
};

/**
 * Check if role is valid
 * @param {string} role - Role value
 * @returns {boolean} Whether role is valid
 */
export const isValidRole = (role) => {
  return role && Object.values(USER_ROLES).includes(role);
};

/**
 * Get all valid states list
 * @returns {Array} List of Indian states
 */
export const getValidStates = () => {
  return Object.values(INDIAN_STATES);
};

/**
 * Validate state name
 * @param {string} state - State name
 * @returns {boolean} Whether state is valid
 */
export const isValidState = (state) => {
  if (!state) return false;
  const normalizedState = state.toLowerCase().trim();
  return Object.keys(INDIAN_STATES).includes(normalizedState);
};

/**
 * Get formatted state name
 * @param {string} state - State name
 * @returns {string} Formatted state name
 */
export const getFormattedStateName = (state) => {
  if (!state) return '';
  const normalizedState = state.toLowerCase().trim();
  return INDIAN_STATES[normalizedState] || state;
};

export default {
  getUserTypeConfig,
  getUserTypeColors,
  getUserTypeDisplayName,
  getRoleConfig,
  getRoleDisplayName,
  hasPermission,
  getCustomerTypeConfig,
  getCustomerCategoryConfig,
  getGSTType,
  getStateCode,
  getDashboardWidgets,
  getBusinessFeatures,
  getCommonProducts,
  getProductFields,
  getInvoicePrefix,
  getDefaultSettings,
  isValidUserType,
  isValidRole,
  getValidStates,
  isValidState,
  getFormattedStateName
};