import { USER_TYPES, COLLECTIONS } from '../../utils/constants/appConstants';

/**
 * Data path helper for managing Firebase collection paths
 */
class DataPathHelper {
  /**
   * Get collection path for user type
   * @param {string} userType - User type
   * @param {string} collection - Collection name
   * @returns {string} Collection path
   */
  getCollectionPath(userType, collection) {
    if (!userType || !Object.values(USER_TYPES).includes(userType)) {
      throw new Error(`Invalid user type: ${userType}`);
    }

    if (!collection) {
      throw new Error('Collection name is required');
    }

    // Structure: userType/collection
    // e.g., "electronics/customers", "furniture/sales"
    return `${userType}/${collection}`;
  }

  /**
   * Get document path for user type
   * @param {string} userType - User type
   * @param {string} collection - Collection name
   * @param {string} documentId - Document ID
   * @returns {string} Document path
   */
  getDocumentPath(userType, collection, documentId) {
    const collectionPath = this.getCollectionPath(userType, collection);
    return `${collectionPath}/${documentId}`;
  }

  /**
   * Get customers collection path
   * @param {string} userType - User type
   * @returns {string} Customers collection path
   */
  getCustomersPath(userType) {
    return this.getCollectionPath(userType, COLLECTIONS.CUSTOMERS);
  }

  /**
   * Get employees collection path
   * @param {string} userType - User type
   * @returns {string} Employees collection path
   */
  getEmployeesPath(userType) {
    return this.getCollectionPath(userType, COLLECTIONS.EMPLOYEES);
  }

  /**
   * Get sales collection path
   * @param {string} userType - User type
   * @returns {string} Sales collection path
   */
  getSalesPath(userType) {
    return this.getCollectionPath(userType, COLLECTIONS.SALES);
  }

  /**
   * Get invoices collection path
   * @param {string} userType - User type
   * @returns {string} Invoices collection path
   */
  getInvoicesPath(userType) {
    return this.getCollectionPath(userType, COLLECTIONS.INVOICES);
  }

  /**
   * Get notifications collection path
   * @param {string} userType - User type
   * @returns {string} Notifications collection path
   */
  getNotificationsPath(userType) {
    return this.getCollectionPath(userType, 'notifications');
  }

  /**
   * Get all collection paths for user type
   * @param {string} userType - User type
   * @returns {Object} All collection paths
   */
  getAllPaths(userType) {
    return {
      customers: this.getCustomersPath(userType),
      employees: this.getEmployeesPath(userType),
      sales: this.getSalesPath(userType),
      invoices: this.getInvoicesPath(userType),
      notifications: this.getNotificationsPath(userType)
    };
  }

  /**
   * Parse collection path to extract user type and collection
   * @param {string} path - Collection path
   * @returns {Object} Parsed path components
   */
  parsePath(path) {
    const parts = path.split('/');
    
    if (parts.length < 2) {
      throw new Error(`Invalid path format: ${path}`);
    }

    const [userType, collection] = parts;
    
    if (!Object.values(USER_TYPES).includes(userType)) {
      throw new Error(`Invalid user type in path: ${userType}`);
    }

    return {
      userType,
      collection,
      isValid: true
    };
  }

  /**
   * Validate collection path
   * @param {string} path - Collection path
   * @returns {boolean} Whether path is valid
   */
  isValidPath(path) {
    try {
      this.parsePath(path);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get subcollection path
   * @param {string} userType - User type
   * @param {string} parentCollection - Parent collection
   * @param {string} parentDocId - Parent document ID
   * @param {string} subCollection - Subcollection name
   * @returns {string} Subcollection path
   */
  getSubcollectionPath(userType, parentCollection, parentDocId, subCollection) {
    const parentPath = this.getDocumentPath(userType, parentCollection, parentDocId);
    return `${parentPath}/${subCollection}`;
  }

  /**
   * Get EMI details subcollection path
   * @param {string} userType - User type
   * @param {string} saleId - Sale ID
   * @returns {string} EMI details subcollection path
   */
  getEMIDetailsPath(userType, saleId) {
    return this.getSubcollectionPath(userType, COLLECTIONS.SALES, saleId, 'emiDetails');
  }

  /**
   * Get delivery updates subcollection path
   * @param {string} userType - User type
   * @param {string} saleId - Sale ID
   * @returns {string} Delivery updates subcollection path
   */
  getDeliveryUpdatesPath(userType, saleId) {
    return this.getSubcollectionPath(userType, COLLECTIONS.SALES, saleId, 'deliveryUpdates');
  }

  /**
   * Get audit log subcollection path
   * @param {string} userType - User type
   * @param {string} parentCollection - Parent collection
   * @param {string} parentDocId - Parent document ID
   * @returns {string} Audit log subcollection path
   */
  getAuditLogPath(userType, parentCollection, parentDocId) {
    return this.getSubcollectionPath(userType, parentCollection, parentDocId, 'auditLog');
  }

  /**
   * Generate unique path for user type and collection
   * @param {string} userType - User type
   * @param {string} collection - Collection name
   * @param {string} suffix - Optional suffix
   * @returns {string} Unique path
   */
  generateUniquePath(userType, collection, suffix = '') {
    const timestamp = Date.now();
    const basePath = this.getCollectionPath(userType, collection);
    return suffix ? `${basePath}_${suffix}_${timestamp}` : `${basePath}_${timestamp}`;
  }

  /**
   * Get backup path for collection
   * @param {string} userType - User type
   * @param {string} collection - Collection name
   * @param {string} backupId - Backup identifier
   * @returns {string} Backup path
   */
  getBackupPath(userType, collection, backupId = null) {
    const id = backupId || new Date().toISOString().split('T')[0]; // Use date as backup ID
    return `backups/${userType}/${collection}/${id}`;
  }

  /**
   * Get shared resources path
   * @param {string} resource - Resource name
   * @returns {string} Shared resource path
   */
  getSharedResourcePath(resource) {
    return `shared/${resource}`;
  }

  /**
   * Get user-specific settings path
   * @param {string} userId - User ID
   * @returns {string} User settings path
   */
  getUserSettingsPath(userId) {
    return `users/${userId}/settings`;
  }

  /**
   * Get system configuration path
   * @param {string} configType - Configuration type
   * @returns {string} System config path
   */
  getSystemConfigPath(configType = 'general') {
    return `system/config/${configType}`;
  }
}

// Create and export singleton instance
export const dataPathHelper = new DataPathHelper();
export default dataPathHelper;