import { USER_TYPES, COLLECTIONS } from '../constants/appConstants';

/**
 * Generate Firebase path based on user type and collection
 * @param {string} userType - 'electronics' or 'furniture'
 * @param {string} collection - collection name like 'customers', 'employees', etc.
 * @param {string} documentId - optional document ID
 * @returns {string} Firebase path
 */
export const getCollectionPath = (userType, collection, documentId = null) => {
  if (!userType || !collection) {
    throw new Error('UserType and collection are required');
  }

  if (!Object.values(USER_TYPES).includes(userType)) {
    throw new Error(`Invalid user type: ${userType}`);
  }

  if (!Object.values(COLLECTIONS).includes(collection)) {
    throw new Error(`Invalid collection: ${collection}`);
  }

  const basePath = `${userType}/${collection}`;
  return documentId ? `${basePath}/${documentId}` : basePath;
};

/**
 * Get customers path for a specific user type
 * @param {string} userType 
 * @param {string} customerId 
 * @returns {string}
 */
export const getCustomersPath = (userType, customerId = null) => {
  return getCollectionPath(userType, COLLECTIONS.CUSTOMERS, customerId);
};

/**
 * Get employees path for a specific user type
 * @param {string} userType 
 * @param {string} employeeId 
 * @returns {string}
 */
export const getEmployeesPath = (userType, employeeId = null) => {
  return getCollectionPath(userType, COLLECTIONS.EMPLOYEES, employeeId);
};

/**
 * Get sales path for a specific user type
 * @param {string} userType 
 * @param {string} saleId 
 * @returns {string}
 */
export const getSalesPath = (userType, saleId = null) => {
  return getCollectionPath(userType, COLLECTIONS.SALES, saleId);
};

/**
 * Get invoices path for a specific user type
 * @param {string} userType 
 * @param {string} invoiceId 
 * @returns {string}
 */
export const getInvoicesPath = (userType, invoiceId = null) => {
  return getCollectionPath(userType, COLLECTIONS.INVOICES, invoiceId);
};

/**
 * Get users path (not user-type specific)
 * @param {string} userId 
 * @returns {string}
 */
export const getUsersPath = (userId = null) => {
  return userId ? `${COLLECTIONS.USERS}/${userId}` : COLLECTIONS.USERS;
};

/**
 * Generate search path for queries
 * @param {string} userType 
 * @param {string} collection 
 * @param {string} field 
 * @param {string} value 
 * @returns {string}
 */
export const getSearchPath = (userType, collection, field, value) => {
  const basePath = getCollectionPath(userType, collection);
  return `${basePath}?orderBy="${field}"&equalTo="${value}"`;
};

/**
 * Validate user type
 * @param {string} userType 
 * @returns {boolean}
 */
export const isValidUserType = (userType) => {
  return Object.values(USER_TYPES).includes(userType);
};

/**
 * Get display name for user type
 * @param {string} userType 
 * @returns {string}
 */
export const getUserTypeDisplayName = (userType) => {
  const displayNames = {
    [USER_TYPES.ELECTRONICS]: 'Electronics',
    [USER_TYPES.FURNITURE]: 'Furniture'
  };
  return displayNames[userType] || userType;
};

/**
 * Get complaints collection path
 * @param {string} userType - User type
 * @param {string} complaintId - Optional complaint ID for specific document
 * @returns {string} Complaints collection path
 */
export const getComplaintsPath = (userType, complaintId = null) => {
  if (!userType || !Object.values(USER_TYPES).includes(userType)) {
    throw new Error(`Invalid user type: ${userType}`);
  }

  const basePath = `${userType}/${COLLECTIONS.COMPLAINTS}`;
  return complaintId ? `${basePath}/${complaintId}` : basePath;
};

export const getUpaadPath = (userType, upaadId = null) => {
  return getCollectionPath(userType, COLLECTIONS.UPAAD, upaadId);
};