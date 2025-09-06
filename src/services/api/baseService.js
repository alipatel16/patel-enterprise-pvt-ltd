import { database } from '../firebase/database';
import { dataPathHelper } from '../utils/dataPathHelper';

/**
 * Base service class providing common CRUD operations
 */
class BaseService {
  constructor(collectionName) {
    this.collectionName = collectionName;
  }

  /**
   * Get collection path for user type
   * @param {string} userType - User type (electronics/furniture)
   * @returns {string} Collection path
   */
  getCollectionPath(userType) {
    return dataPathHelper.getCollectionPath(userType, this.collectionName);
  }

  /**
   * Get all documents with optional filters
   * @param {string} userType - User type
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Documents array
   */
  async getAll(userType, options = {}) {
    try {
      const collectionPath = this.getCollectionPath(userType);
      const {
        limit = 50,
        offset = 0,
        orderBy = 'createdAt',
        orderDirection = 'desc',
        where = [],
        ...filters
      } = options;

      // Build where clauses from filters
      const whereClause = [...where];
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          whereClause.push([key, '==', value]);
        }
      });

      const queryOptions = {
        limit,
        offset,
        orderBy,
        orderDirection,
        where: whereClause
      };

      return await database.get(collectionPath, queryOptions);
    } catch (error) {
      console.error(`Error getting all ${this.collectionName}:`, error);
      throw new Error(`Failed to fetch ${this.collectionName}`);
    }
  }

  /**
   * Get document by ID
   * @param {string} userType - User type
   * @param {string} id - Document ID
   * @returns {Promise<Object>} Document
   */
  async getById(userType, id) {
    try {
      const collectionPath = this.getCollectionPath(userType);
      return await database.getById(collectionPath, id);
    } catch (error) {
      console.error(`Error getting ${this.collectionName} by ID:`, error);
      throw new Error(`Failed to fetch ${this.collectionName}`);
    }
  }

  /**
   * Create new document
   * @param {string} userType - User type
   * @param {Object} data - Document data
   * @returns {Promise<Object>} Created document
   */
  async create(userType, data) {
    try {
      const collectionPath = this.getCollectionPath(userType);
      const documentData = {
        ...data,
        userType,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      return await database.create(collectionPath, documentData);
    } catch (error) {
      console.error(`Error creating ${this.collectionName}:`, error);
      throw new Error(`Failed to create ${this.collectionName}`);
    }
  }

  /**
   * Update document
   * @param {string} userType - User type
   * @param {string} id - Document ID
   * @param {Object} updates - Update data
   * @returns {Promise<Object>} Updated document
   */
  async update(userType, id, updates) {
    try {
      const collectionPath = this.getCollectionPath(userType);
      const updateData = {
        ...updates,
        updatedAt: new Date().toISOString()
      };

      return await database.update(collectionPath, id, updateData);
    } catch (error) {
      console.error(`Error updating ${this.collectionName}:`, error);
      throw new Error(`Failed to update ${this.collectionName}`);
    }
  }

  /**
   * Delete document
   * @param {string} userType - User type
   * @param {string} id - Document ID
   * @returns {Promise<void>}
   */
  async delete(userType, id) {
    try {
      const collectionPath = this.getCollectionPath(userType);
      await database.delete(collectionPath, id);
    } catch (error) {
      console.error(`Error deleting ${this.collectionName}:`, error);
      throw new Error(`Failed to delete ${this.collectionName}`);
    }
  }

  /**
   * Search documents
   * @param {string} userType - User type
   * @param {string} searchTerm - Search term
   * @param {Array} searchFields - Fields to search in
   * @param {Object} options - Additional options
   * @returns {Promise<Array>} Filtered documents
   */
  async search(userType, searchTerm, searchFields = ['name'], options = {}) {
    try {
      // Get all documents first (Firebase doesn't support text search natively)
      const allDocs = await this.getAll(userType, options);
      
      if (!searchTerm || !searchTerm.trim()) {
        return allDocs;
      }

      const searchTermLower = searchTerm.toLowerCase().trim();
      
      return allDocs.filter(doc => {
        return searchFields.some(field => {
          const value = field.split('.').reduce((obj, key) => obj?.[key], doc);
          return value && String(value).toLowerCase().includes(searchTermLower);
        });
      });
    } catch (error) {
      console.error(`Error searching ${this.collectionName}:`, error);
      throw new Error(`Failed to search ${this.collectionName}`);
    }
  }

  /**
   * Get documents count
   * @param {string} userType - User type
   * @param {Object} filters - Filter options
   * @returns {Promise<number>} Count
   */
  async getCount(userType, filters = {}) {
    try {
      const collectionPath = this.getCollectionPath(userType);
      return await database.getCount(collectionPath, filters);
    } catch (error) {
      console.error(`Error getting ${this.collectionName} count:`, error);
      throw new Error(`Failed to get ${this.collectionName} count`);
    }
  }

  /**
   * Set up real-time listener
   * @param {string} userType - User type
   * @param {function} callback - Callback function
   * @param {Object} options - Query options
   * @returns {function} Unsubscribe function
   */
  onSnapshot(userType, callback, options = {}) {
    try {
      const collectionPath = this.getCollectionPath(userType);
      return database.onSnapshot(collectionPath, options, callback);
    } catch (error) {
      console.error(`Error setting up ${this.collectionName} listener:`, error);
      throw new Error(`Failed to set up ${this.collectionName} listener`);
    }
  }

  /**
   * Batch operations
   * @param {string} userType - User type
   * @param {Array} operations - Array of operations
   * @returns {Promise<void>}
   */
  async batch(userType, operations) {
    try {
      const collectionPath = this.getCollectionPath(userType);
      return await database.batch(collectionPath, operations);
    } catch (error) {
      console.error(`Error performing batch ${this.collectionName} operations:`, error);
      throw new Error(`Failed to perform batch ${this.collectionName} operations`);
    }
  }
}

export default BaseService;