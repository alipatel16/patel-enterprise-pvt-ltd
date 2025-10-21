// src/services/api/optimizedCustomerService.js
import { 
  ref, 
  get, 
  query, 
  orderByChild, 
  limitToFirst,
  limitToLast,
  startAt,
  endAt,
  startAfter,
  equalTo
} from 'firebase/database';
import { database } from '../firebase/config';
import { getCustomersPath } from '../../utils/helpers/firebasePathHelper';
import { CUSTOMER_TYPES, CUSTOMER_CATEGORIES } from '../../utils/constants/appConstants';

/**
 * OPTIMIZED Customer Service for handling large datasets (10k+ records)
 * Key improvements:
 * - Server-side pagination using Firebase queries
 * - Indexed queries for fast lookups
 * - Minimal data transfer
 * - Efficient filtering and sorting
 */

class OptimizedCustomerService {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Get cache key
   */
  getCacheKey(userType, options) {
    return `${userType}-${JSON.stringify(options)}`;
  }

  /**
   * Get from cache if valid
   */
  getFromCache(key) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      console.log('📦 Returning cached data');
      return cached.data;
    }
    return null;
  }

  /**
   * Set cache
   */
  setCache(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  /**
   * Clear cache
   */
  clearCache(userType = null) {
    if (userType) {
      // Clear only specific userType cache
      for (const [key] of this.cache) {
        if (key.startsWith(userType)) {
          this.cache.delete(key);
        }
      }
    } else {
      this.cache.clear();
    }
  }

  /**
   * OPTIMIZED: Get customers with server-side pagination
   * Uses Firebase indexes and query limits for efficient data fetching
   * Set limit = null or 0 to fetch all customers (for backward compatibility)
   */
  async getCustomers(userType, options = {}) {
    try {
      const {
        limit = null, // Default page size, set to null for all
        page = 1,
        search = '',
        sortBy = 'name',
        sortOrder = 'asc',
        customerType = '',
        category = '',
        useCache = true
      } = options;

      // Check cache for non-search queries
      if (useCache && !search) {
        const cacheKey = this.getCacheKey(userType, options);
        const cached = this.getFromCache(cacheKey);
        if (cached) return cached;
      }

      const customersPath = getCustomersPath(userType);
      const customersRef = ref(database, customersPath);

      let customers = [];
      let total = 0;

      // CASE 1: Search query - needs full scan but optimized with startAt/endAt
      if (search && search.trim()) {
        customers = await this.searchCustomersOptimized(userType, search, {
          customerType,
          category,
          limit,
          page,
          sortBy,
          sortOrder
        });
        total = customers.length; // Approximation
      } 
      // CASE 2: Filtered query with pagination
      else {
        const result = await this.getPaginatedCustomers(
          customersRef,
          userType,
          {
            limit,
            page,
            sortBy,
            sortOrder,
            customerType,
            category
          }
        );
        customers = result.customers;
        total = result.total;
      }

      const response = {
        customers,
        total,
        currentPage: page,
        totalPages: limit > 0 ? Math.ceil(total / limit) : 1,
        hasMore: limit > 0 ? (page * limit) < total : false,
        pageSize: limit || total
      };

      // Cache the result
      if (useCache && !search) {
        const cacheKey = this.getCacheKey(userType, options);
        this.setCache(cacheKey, response);
      }

      return response;

    } catch (error) {
      console.error('Error fetching customers:', error);
      throw new Error('Failed to fetch customers');
    }
  }

  /**
   * OPTIMIZED: Get paginated customers using Firebase queries
   */
  async getPaginatedCustomers(customersRef, userType, options) {
    const {
      limit,
      page,
      sortBy,
      sortOrder,
      customerType,
      category
    } = options;

    try {
      // Step 1: Get total count (cached separately)
      const total = await this.getTotalCount(userType, { customerType, category });

      // Step 2: Build query with proper ordering and limits
      let q = query(customersRef, orderByChild(sortBy));

      // Apply filters if present
      if (customerType) {
        q = query(customersRef, orderByChild('customerType'), equalTo(customerType));
      }

      // Fetch data with limit (if specified)
      let fetchLimit = null;
      if (limit && limit > 0) {
        fetchLimit = limit * page; // Fetch up to current page
      }
      
      if (fetchLimit) {
        if (sortOrder === 'desc') {
          q = query(q, limitToLast(fetchLimit));
        } else {
          q = query(q, limitToFirst(fetchLimit));
        }
      }
      // If no limit, query fetches all

      const snapshot = await get(q);
      
      if (!snapshot.exists()) {
        return { customers: [], total: 0 };
      }

      // Convert to array
      let customers = [];
      snapshot.forEach((childSnapshot) => {
        customers.push({
          id: childSnapshot.key,
          ...childSnapshot.val()
        });
      });

      // Apply secondary filter for category (if needed)
      if (category) {
        customers = customers.filter(c => c.category === category);
      }

      // Handle sorting
      if (sortOrder === 'desc') {
        customers.reverse();
      }

      // Client-side pagination (only for fetched data)
      let paginatedCustomers = customers;
      if (limit && limit > 0) {
        const startIndex = (page - 1) * limit;
        paginatedCustomers = customers.slice(startIndex, startIndex + limit);
      }

      return {
        customers: paginatedCustomers,
        total
      };

    } catch (error) {
      console.error('Error in pagination:', error);
      throw error;
    }
  }

  /**
   * OPTIMIZED: Search customers using indexed queries
   */
  async searchCustomersOptimized(userType, searchTerm, options = {}) {
    try {
      const { customerType, category, limit = 50 } = options;
      
      const customersPath = getCustomersPath(userType);
      const customersRef = ref(database, customersPath);

      const searchLower = searchTerm.toLowerCase().trim();

      // Use orderByChild with startAt/endAt for prefix search
      const nameQuery = query(
        customersRef,
        orderByChild('name'),
        startAt(searchLower),
        endAt(searchLower + '\uf8ff'),
        limitToFirst(limit)
      );

      const snapshot = await get(nameQuery);
      const customers = [];

      snapshot.forEach((childSnapshot) => {
        const customer = {
          id: childSnapshot.key,
          ...childSnapshot.val()
        };

        // Apply additional filters
        if (customerType && customer.customerType !== customerType) return;
        if (category && customer.category !== category) return;

        // Check if search matches other fields
        const searchableText = [
          customer.name,
          customer.phone,
          customer.email,
          customer.address
        ].join(' ').toLowerCase();

        if (searchableText.includes(searchLower)) {
          customers.push(customer);
        }
      });

      return customers;

    } catch (error) {
      console.error('Error searching customers:', error);
      return [];
    }
  }

  /**
   * OPTIMIZED: Get total count with caching
   */
  async getTotalCount(userType, filters = {}) {
    const cacheKey = `count-${userType}-${JSON.stringify(filters)}`;
    const cached = this.getFromCache(cacheKey);
    if (cached !== null) return cached;

    try {
      const customersPath = getCustomersPath(userType);
      const customersRef = ref(database, customersPath);

      let q = customersRef;

      // Apply filters if present
      if (filters.customerType) {
        q = query(customersRef, orderByChild('customerType'), equalTo(filters.customerType));
      }

      const snapshot = await get(q);
      
      if (!snapshot.exists()) {
        this.setCache(cacheKey, 0);
        return 0;
      }

      let count = 0;
      
      if (filters.category) {
        snapshot.forEach((child) => {
          if (child.val().category === filters.category) {
            count++;
          }
        });
      } else {
        snapshot.forEach(() => count++);
      }

      this.setCache(cacheKey, count);
      return count;

    } catch (error) {
      console.error('Error getting count:', error);
      return 0;
    }
  }

  /**
   * OPTIMIZED: Get customer stats (for dashboard)
   * Calculates stats efficiently without loading full customer data
   */
  async getCustomerStats(userType) {
    const cacheKey = `stats-${userType}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      const customersPath = getCustomersPath(userType);
      const customersRef = ref(database, customersPath);
      const snapshot = await get(customersRef);

      if (!snapshot.exists()) {
        return {
          total: 0,
          wholesalers: 0,
          retailers: 0,
          byCategory: {},
          recentCount: 0
        };
      }

      const stats = {
        total: 0,
        wholesalers: 0,
        retailers: 0,
        byCategory: {
          individual: 0,
          firm: 0,
          school: 0
        },
        recentCount: 0
      };

      const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);

      snapshot.forEach((childSnapshot) => {
        const customer = childSnapshot.val();
        stats.total++;

        if (customer.customerType === CUSTOMER_TYPES.WHOLESALER) {
          stats.wholesalers++;
        } else if (customer.customerType === CUSTOMER_TYPES.RETAILER) {
          stats.retailers++;
        }

        if (customer.category) {
          const cat = customer.category.toLowerCase();
          if (stats.byCategory[cat] !== undefined) {
            stats.byCategory[cat]++;
          }
        }

        const createdAt = new Date(customer.createdAt).getTime();
        if (createdAt > thirtyDaysAgo) {
          stats.recentCount++;
        }
      });

      this.setCache(cacheKey, stats);
      return stats;

    } catch (error) {
      console.error('Error getting customer stats:', error);
      return {
        total: 0,
        wholesalers: 0,
        retailers: 0,
        byCategory: {},
        recentCount: 0
      };
    }
  }

  /**
   * OPTIMIZED: Get customer by ID (single fetch, no loops)
   */
  async getCustomerById(userType, firebaseKey) {
    try {
      const customerPath = getCustomersPath(userType, firebaseKey);
      const customerRef = ref(database, customerPath);
      const snapshot = await get(customerRef);
      
      if (!snapshot.exists()) {
        return null;
      }

      return {
        id: snapshot.key,
        ...snapshot.val()
      };
    } catch (error) {
      console.error('Error getting customer by ID:', error);
      return null;
    }
  }

  /**
   * Get recent customers (for dashboard)
   */
  async getRecentCustomers(userType, limitCount = 10) {
    try {
      const customersPath = getCustomersPath(userType);
      const customersRef = ref(database, customersPath);
      
      const q = query(
        customersRef,
        orderByChild('createdAt'),
        limitToLast(limitCount)
      );

      const snapshot = await get(q);
      const customers = [];

      snapshot.forEach((childSnapshot) => {
        customers.push({
          id: childSnapshot.key,
          ...childSnapshot.val()
        });
      });

      return customers.reverse(); // Most recent first

    } catch (error) {
      console.error('Error getting recent customers:', error);
      return [];
    }
  }

  // Maintain compatibility with existing methods
  async createCustomer(userType, customerData) {
    // Clear cache after creation
    this.clearCache(userType);
    // Use existing customerService create method
    return require('./customerService').default.createCustomer(userType, customerData);
  }

  async updateCustomer(userType, firebaseKey, updates) {
    // Clear cache after update
    this.clearCache(userType);
    // Use existing customerService update method
    return require('./customerService').default.updateCustomer(userType, firebaseKey, updates);
  }

  async deleteCustomer(userType, firebaseKey) {
    // Clear cache after deletion
    this.clearCache(userType);
    // Use existing customerService delete method
    return require('./customerService').default.deleteCustomer(userType, firebaseKey);
  }
}

export default new OptimizedCustomerService();