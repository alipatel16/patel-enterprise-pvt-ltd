import {
  getDatabase,
  ref,
  set,
  get,
  update,
  remove,
  query,
  orderByChild,
  equalTo,
  limitToFirst,
  limitToLast,
  startAt,
  endAt,
  onValue,
  push,
  serverTimestamp
} from "firebase/database";
import firebaseApp from "./config";

// Initialize Realtime Database
export const db = getDatabase(firebaseApp);

/**
 * Firebase Realtime Database service
 */
class DatabaseService {
  constructor() {
    this.db = db;
  }

  /**
   * Create a new document
   * @param {string} collectionPath - Collection path
   * @param {Object} data - Document data
   * @param {string} customId - Custom document ID (optional)
   * @returns {Promise<Object>} Created document with ID
   */
  async create(collectionPath, data, customId = null) {
    try {
      const createdAt = Date.now();
      const updatedAt = Date.now();

      let docRef;
      if (customId) {
        docRef = ref(this.db, `${collectionPath}/${customId}`);
        await set(docRef, { ...data, createdAt, updatedAt });
      } else {
        docRef = push(ref(this.db, collectionPath));
        await set(docRef, { ...data, createdAt, updatedAt });
      }

      return {
        id: docRef.key,
        ...data,
        createdAt: new Date(createdAt).toISOString(),
        updatedAt: new Date(updatedAt).toISOString(),
      };
    } catch (error) {
      console.error("Error creating document:", error);
      throw new Error(`Failed to create document: ${error.message}`);
    }
  }

  /**
   * Get document by ID
   * @param {string} collectionPath - Collection path
   * @param {string} id - Document ID
   * @returns {Promise<Object>} Document data
   */
  async getById(collectionPath, id) {
    try {
      const docRef = ref(this.db, `${collectionPath}/${id}`);
      const snapshot = await get(docRef);

      if (!snapshot.exists()) {
        throw new Error("Document not found");
      }

      const data = snapshot.val();
      return {
        id,
        ...data,
        createdAt: this.timestampToISO(data.createdAt),
        updatedAt: this.timestampToISO(data.updatedAt),
      };
    } catch (error) {
      console.error("Error getting document:", error);
      throw new Error(`Failed to get document: ${error.message}`);
    }
  }

  /**
   * Get documents with query options
   * @param {string} collectionPath - Collection path
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Array of documents
   */
  async get(collectionPath, options = {}) {
    try {
      const {
        where: whereClause = [],
        orderBy: orderByField = "createdAt",
        orderDirection = "desc",
        limit: limitCount = null,
      } = options;

      let q = ref(this.db, collectionPath);

      // Apply basic where clause (Realtime DB only supports orderByChild + equalTo)
      if (whereClause.length > 0) {
        const [field, operator, value] = whereClause[0];
        if (operator === "==") {
          q = query(q, orderByChild(field), equalTo(value));
        } else {
          console.warn(`Operator ${operator} not fully supported in RTDB`);
        }
      } else {
        q = query(q, orderByChild(orderByField));
      }

      // Apply limit
      if (limitCount) {
        q =
          orderDirection === "desc"
            ? query(q, limitToLast(limitCount))
            : query(q, limitToFirst(limitCount));
      }

      const snapshot = await get(q);
      const documents = [];
      snapshot.forEach((child) => {
        const data = child.val();
        documents.push({
          id: child.key,
          ...data,
          createdAt: this.timestampToISO(data.createdAt),
          updatedAt: this.timestampToISO(data.updatedAt),
        });
      });

      // Manual sort for desc
      if (orderDirection === "desc") {
        documents.sort((a, b) => (b[orderByField] || 0) - (a[orderByField] || 0));
      }

      return documents;
    } catch (error) {
      console.error("Error getting documents:", error);
      throw new Error(`Failed to get documents: ${error.message}`);
    }
  }

  /**
   * Update document
   * @param {string} collectionPath - Collection path
   * @param {string} id - Document ID
   * @param {Object} updates - Update data
   * @returns {Promise<Object>} Updated document
   */
  async update(collectionPath, id, updates) {
    try {
      const docRef = ref(this.db, `${collectionPath}/${id}`);
      const updateData = { ...updates, updatedAt: Date.now() };
      await update(docRef, updateData);

      return await this.getById(collectionPath, id);
    } catch (error) {
      console.error("Error updating document:", error);
      throw new Error(`Failed to update document: ${error.message}`);
    }
  }

  /**
   * Delete document
   * @param {string} collectionPath - Collection path
   * @param {string} id - Document ID
   * @returns {Promise<void>}
   */
  async delete(collectionPath, id) {
    try {
      const docRef = ref(this.db, `${collectionPath}/${id}`);
      await remove(docRef);
    } catch (error) {
      console.error("Error deleting document:", error);
      throw new Error(`Failed to delete document: ${error.message}`);
    }
  }

  /**
   * Set up real-time listener
   * @param {string} collectionPath - Collection path
   * @param {Object} options - Query options
   * @param {function} callback - Callback function
   * @param {function} errorCallback - Error callback function
   * @returns {function} Unsubscribe function
   */
  onSnapshot(collectionPath, options = {}, callback, errorCallback = null) {
    try {
      let q = ref(this.db, collectionPath);

      const unsubscribe = onValue(
        q,
        (snapshot) => {
          const documents = [];
          snapshot.forEach((child) => {
            const data = child.val();
            documents.push({
              id: child.key,
              ...data,
              createdAt: this.timestampToISO(data.createdAt),
              updatedAt: this.timestampToISO(data.updatedAt),
            });
          });
          callback(documents);
        },
        (error) => {
          if (errorCallback) errorCallback(error);
          else console.error("Snapshot error:", error);
        }
      );

      return unsubscribe;
    } catch (error) {
      console.error("Error setting up snapshot listener:", error);
      throw new Error(`Failed to set up listener: ${error.message}`);
    }
  }

  /**
   * Get document count
   * @param {string} collectionPath - Collection path
   * @param {Object} filters - Filter options
   * @returns {Promise<number>} Document count
   */
  async getCount(collectionPath, filters = {}) {
    try {
      const documents = await this.get(collectionPath, {
        where: Object.entries(filters).map(([key, value]) => [key, "==", value]),
      });
      return documents.length;
    } catch (error) {
      console.error("Error getting document count:", error);
      throw new Error(`Failed to get document count: ${error.message}`);
    }
  }

  /**
   * Batch operations (simulate sequential execution)
   * @param {string} collectionPath - Collection path
   * @param {Array} operations - Array of operations
   * @returns {Promise<void>}
   */
  async batch(collectionPath, operations) {
    try {
      for (const operation of operations) {
        const { type, id, data } = operation;
        switch (type) {
          case "create":
            await this.create(collectionPath, data, id || null);
            break;
          case "update":
            await this.update(collectionPath, id, data);
            break;
          case "delete":
            await this.delete(collectionPath, id);
            break;
          default:
            console.warn(`Unknown batch operation type: ${type}`);
        }
      }
    } catch (error) {
      console.error("Error performing batch operations:", error);
      throw new Error(`Failed to perform batch operations: ${error.message}`);
    }
  }

  /**
   * Check if document exists
   * @param {string} collectionPath - Collection path
   * @param {string} id - Document ID
   * @returns {Promise<boolean>} Whether document exists
   */
  async exists(collectionPath, id) {
    try {
      const docRef = ref(this.db, `${collectionPath}/${id}`);
      const snapshot = await get(docRef);
      return snapshot.exists();
    } catch (error) {
      console.error("Error checking document existence:", error);
      return false;
    }
  }

  /**
   * Convert timestamp (number or serverTimestamp) to ISO string
   * @param {number|Object} timestamp
   * @returns {string|null}
   */
  timestampToISO(timestamp) {
    if (!timestamp) return null;
    if (typeof timestamp === "number") {
      return new Date(timestamp).toISOString();
    }
    return timestamp;
  }

  /**
   * Convert ISO string to timestamp (ms since epoch)
   * @param {string} isoString
   * @returns {number|null}
   */
  isoToTimestamp(isoString) {
    if (!isoString) return null;
    return new Date(isoString).getTime();
  }
}

// Create and export singleton instance
export const database = new DatabaseService();
export default database;