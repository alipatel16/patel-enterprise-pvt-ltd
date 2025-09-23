import { ref, push, set, get, update, remove } from 'firebase/database';
import { database } from '../firebase/config';
import { getCustomersPath } from '../../utils/helpers/firebasePathHelper';
import { CUSTOMER_TYPES, CUSTOMER_CATEGORIES } from '../../utils/constants/appConstants';

class CustomerService {
  /**
   * Get all customers for a specific user type
   * @param {string} userType - 'electronics' or 'furniture'
   * @param {Object} options - Query options (limit, offset, search, etc.)
   * @returns {Promise<Object>}
   */
  async getCustomers(userType, options = {}) {
    try {
      const { 
        limit = null, // ← Changed: No default limit
        offset = 0, 
        search = '', 
        sortBy = 'name', 
        sortOrder = 'asc',
        customerType = '',
        category = ''
      } = options;

      const customersPath = getCustomersPath(userType);
      const customersRef = ref(database, customersPath);

      const snapshot = await get(customersRef);
      
      if (!snapshot.exists()) {
        return {
          customers: [],
          total: 0,
          hasMore: false,
          currentPage: 1,
          totalPages: 0
        };
      }

      let customers = [];
      snapshot.forEach((childSnapshot) => {
        const customerData = childSnapshot.val();
        // ALWAYS use Firebase key as the customer ID
        customers.push({
          id: childSnapshot.key, // ← This is the ONLY ID we use
          ...customerData,
          // Remove any internal ID fields to avoid confusion
          internalId: undefined
        });
      });

      // Apply filters (client-side)
      if (search && search.trim()) {
        const searchTerm = search.toLowerCase().trim();
        customers = customers.filter(customer => {
          return (
            customer.name?.toLowerCase().includes(searchTerm) ||
            customer.phone?.includes(searchTerm) ||
            customer.email?.toLowerCase().includes(searchTerm) ||
            customer.address?.toLowerCase().includes(searchTerm) ||
            customer.gstNumber?.toLowerCase().includes(searchTerm)
          );
        });
      }

      if (customerType) {
        customers = customers.filter(customer => customer.customerType === customerType);
      }

      if (category) {
        customers = customers.filter(customer => customer.category === category);
      }

      // Apply sorting
      customers.sort((a, b) => {
        let aValue = a[sortBy] || '';
        let bValue = b[sortBy] || '';
        
        if (typeof aValue === 'string') {
          aValue = aValue.toLowerCase();
          bValue = bValue.toLowerCase();
        }
        
        if (sortBy === 'createdAt' || sortBy === 'updatedAt') {
          aValue = new Date(aValue).getTime() || 0;
          bValue = new Date(bValue).getTime() || 0;
        }
        
        if (aValue < bValue) {
          return sortOrder === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortOrder === 'asc' ? 1 : -1;
        }
        return 0;
      });

      // ✅ NEW: Only apply pagination if limit is specified
      if (limit && limit > 0) {
        const total = customers.length;
        const startIndex = offset;
        const endIndex = startIndex + limit;
        const paginatedCustomers = customers.slice(startIndex, endIndex);

        return {
          customers: paginatedCustomers,
          total,
          hasMore: endIndex < total,
          currentPage: Math.floor(offset / limit) + 1,
          totalPages: Math.ceil(total / limit)
        };
      } else {
        // ✅ NEW: Return ALL customers when no limit specified
        return {
          customers: customers, // Return ALL customers
          total: customers.length,
          hasMore: false,
          currentPage: 1,
          totalPages: 1
        };
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
      throw new Error('Failed to fetch customers');
    }
  }

  /**
   * Get customer by Firebase key
   * @param {string} userType 
   * @param {string} firebaseKey - Firebase document key (e.g., "OZJ_EVl0yo5kKM7rAc6")
   * @returns {Promise<Object|null>}
   */
  async getCustomerById(userType, firebaseKey) {
    try {
      console.log('=== GET CUSTOMER BY ID ===');
      console.log('Firebase Key:', firebaseKey);
      console.log('User Type:', userType);
      
      const customerPath = getCustomersPath(userType, firebaseKey);
      console.log('Full Path:', customerPath);
      
      const customerRef = ref(database, customerPath);
      const snapshot = await get(customerRef);
      
      if (!snapshot.exists()) {
        console.log('❌ Customer not found at path:', customerPath);
        
        // Fallback: Search by internal ID if someone is using old URLs
        console.log('🔍 Searching for customer by internal ID...');
        const allCustomersPath = getCustomersPath(userType);
        const allCustomersRef = ref(database, allCustomersPath);
        const allSnapshot = await get(allCustomersRef);
        
        if (allSnapshot.exists()) {
          let foundCustomer = null;
          allSnapshot.forEach((childSnapshot) => {
            const customerData = childSnapshot.val();
            // Check if internal ID matches (legacy support)
            if (customerData.id === firebaseKey || customerData.internalId === firebaseKey) {
              foundCustomer = {
                id: childSnapshot.key, // Use Firebase key as ID
                ...customerData,
                internalId: undefined // Remove internal ID
              };
              console.log('✅ Found via internal ID search. Firebase key:', childSnapshot.key);
            }
          });
          
          if (foundCustomer) {
            return foundCustomer;
          }
        }
        
        console.log('❌ Customer not found anywhere');
        return null;
      }
      
      const customerData = snapshot.val();
      const customer = {
        id: firebaseKey, // Use Firebase key as ID
        ...customerData,
        internalId: undefined // Remove any internal ID confusion
      };
      
      console.log('✅ Customer found:', customer.name);
      console.log('Customer ID (Firebase key):', customer.id);
      return customer;
    } catch (error) {
      console.error('Error fetching customer:', error);
      throw new Error('Failed to fetch customer');
    }
  }

  /**
   * Create new customer (without internal ID)
   * @param {string} userType 
   * @param {Object} customerData 
   * @returns {Promise<Object>}
   */
  async createCustomer(userType, customerData) {
    try {
      console.log('=== CREATE CUSTOMER ===');
      console.log('Input data:', customerData);
      
      this.validateCustomerData(customerData);

      const customersPath = getCustomersPath(userType);
      const customersRef = ref(database, customersPath);
      
      // Clean data - remove any ID fields
      const { id, internalId, ...cleanData } = customerData;
      
      const customerWithMeta = {
        ...cleanData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      console.log('Data to store:', customerWithMeta);
      
      const newCustomerRef = push(customersRef);
      await set(newCustomerRef, customerWithMeta);
      
      const firebaseKey = newCustomerRef.key;
      console.log('✅ Customer created with Firebase key:', firebaseKey);
      
      return {
        id: firebaseKey, // Firebase key as ID
        ...customerWithMeta
      };
    } catch (error) {
      console.error('Error creating customer:', error);
      throw new Error(`Failed to create customer: ${error.message}`);
    }
  }

  /**
   * Update customer using Firebase key
   * @param {string} userType 
   * @param {string} firebaseKey - Firebase document key
   * @param {Object} updates 
   * @returns {Promise<Object>}
   */
  async updateCustomer(userType, firebaseKey, updates) {
    try {
      console.log('=== UPDATE CUSTOMER ===');
      console.log('Firebase Key:', firebaseKey);
      console.log('Updates:', updates);
      
      const customerPath = getCustomersPath(userType, firebaseKey);
      console.log('Update path:', customerPath);
      
      const customerRef = ref(database, customerPath);
      
      // Check if customer exists
      const existingSnapshot = await get(customerRef);
      if (!existingSnapshot.exists()) {
        console.log('❌ Customer not found for update at:', customerPath);
        throw new Error('Customer not found');
      }
      
      // Clean updates - remove any ID fields
      const { id, internalId, ...cleanUpdates } = updates;
      
      const updateData = {
        ...cleanUpdates,
        updatedAt: new Date().toISOString()
      };
      
      console.log('Clean update data:', updateData);
      
      await update(customerRef, updateData);
      console.log('✅ Customer updated successfully');
      
      // Return updated customer
      const snapshot = await get(customerRef);
      return {
        id: firebaseKey, // Firebase key as ID
        ...snapshot.val(),
        internalId: undefined // Remove any internal ID
      };
    } catch (error) {
      console.error('Error updating customer:', error);
      throw new Error(`Failed to update customer: ${error.message}`);
    }
  }

  /**
   * Delete customer using Firebase key
   * @param {string} userType 
   * @param {string} firebaseKey - Firebase document key
   * @returns {Promise<void>}
   */
  async deleteCustomer(userType, firebaseKey) {
    try {
      console.log('=== DELETE CUSTOMER ===');
      console.log('Firebase Key:', firebaseKey);
      
      const customerPath = getCustomersPath(userType, firebaseKey);
      console.log('Delete path:', customerPath);
      
      const customerRef = ref(database, customerPath);
      await remove(customerRef);
      
      console.log('✅ Customer deleted successfully');
    } catch (error) {
      console.error('Error deleting customer:', error);
      throw new Error('Failed to delete customer');
    }
  }

  /**
   * Search customers with simple filtering
   * @param {string} userType 
   * @param {string} searchTerm 
   * @param {number} limit 
   * @returns {Promise<Array>}
   */
  async searchCustomers(userType, searchTerm, limit = null) {
    try {
      if (!searchTerm || searchTerm.length < 1) {
        return [];
      }

      const customersPath = getCustomersPath(userType);
      const customersRef = ref(database, customersPath);
      const snapshot = await get(customersRef);
      
      if (!snapshot.exists()) {
        return [];
      }

      let customers = [];
      snapshot.forEach((childSnapshot) => {
        const customerData = childSnapshot.val();
        const customer = {
          id: childSnapshot.key, // Firebase key as ID
          ...customerData,
          internalId: undefined // Remove internal ID
        };
        
        const searchLower = searchTerm.toLowerCase();
        if (
          customer.name?.toLowerCase().includes(searchLower) ||
          customer.phone?.includes(searchTerm) ||
          customer.email?.toLowerCase().includes(searchLower) ||
          customer.address?.toLowerCase().includes(searchLower)
        ) {
          customers.push(customer);
        }
      });

      customers.sort((a, b) => {
        const aExact = a.name?.toLowerCase().startsWith(searchTerm.toLowerCase()) ? 1 : 0;
        const bExact = b.name?.toLowerCase().startsWith(searchTerm.toLowerCase()) ? 1 : 0;
        return bExact - aExact;
      });

      // Only apply limit if specified
      return limit ? customers.slice(0, limit) : customers;
    } catch (error) {
      console.error('Error searching customers:', error);
      throw new Error('Failed to search customers');
    }
  }

  /**
   * Get customer suggestions for autocomplete
   * @param {string} userType 
   * @param {string} searchTerm 
   * @param {number} limit 
   * @returns {Promise<Array>}
   */
  async getCustomerSuggestions(userType, searchTerm, limit = 5) {
    try {
      const customers = await this.searchCustomers(userType, searchTerm, limit);
      
      return customers.map(customer => ({
        id: customer.id, // Firebase key
        label: `${customer.name} (${customer.phone})`,
        value: customer.id, // Firebase key
        name: customer.name,
        phone: customer.phone,
        address: customer.address,
        customerType: customer.customerType,
        category: customer.category,
        state: customer.state,
        gstNumber: customer.gstNumber || "",
      }));
    } catch (error) {
      console.error('Error fetching customer suggestions:', error);
      return [];
    }
  }

  /**
   * Get customers by type
   * @param {string} userType 
   * @param {string} customerType 
   * @returns {Promise<Array>}
   */
  async getCustomersByType(userType, customerType) {
    try {
      const allCustomers = await this.getCustomers(userType, { 
        customerType
        // No limit - get all customers of this type
      });
      return allCustomers.customers;
    } catch (error) {
      console.error('Error fetching customers by type:', error);
      throw new Error('Failed to fetch customers by type');
    }
  }

  /**
   * Get customer statistics
   * @param {string} userType 
   * @returns {Promise<Object>}
   */
  async getCustomerStats(userType) {
    try {
      const customersPath = getCustomersPath(userType);
      const customersRef = ref(database, customersPath);
      const snapshot = await get(customersRef);
      
      if (!snapshot.exists()) {
        return {
          total: 0,
          wholesalers: 0,
          retailers: 0,
          individuals: 0,
          firms: 0,
          schools: 0
        };
      }

      const stats = {
        total: 0,
        wholesalers: 0,
        retailers: 0,
        individuals: 0,
        firms: 0,
        schools: 0
      };

      snapshot.forEach((childSnapshot) => {
        const customer = childSnapshot.val();
        stats.total++;

        if (customer.customerType === CUSTOMER_TYPES.WHOLESALER) {
          stats.wholesalers++;
        } else if (customer.customerType === CUSTOMER_TYPES.RETAILER) {
          stats.retailers++;
        }

        if (customer.category === CUSTOMER_CATEGORIES.INDIVIDUAL) {
          stats.individuals++;
        } else if (customer.category === CUSTOMER_CATEGORIES.FIRM) {
          stats.firms++;
        } else if (customer.category === CUSTOMER_CATEGORIES.SCHOOL) {
          stats.schools++;
        }
      });

      return stats;
    } catch (error) {
      console.error('Error fetching customer stats:', error);
      return {
        total: 0,
        wholesalers: 0,
        retailers: 0,
        individuals: 0,
        firms: 0,
        schools: 0
      };
    }
  }

  /**
   * Validate customer data
   * @param {Object} customerData 
   * @param {boolean} isCreate 
   */
  validateCustomerData(customerData, isCreate = true) {
    const requiredFields = ['name', 'phone', 'customerType', 'category'];

    if (isCreate) {
      for (const field of requiredFields) {
        if (!customerData[field] || customerData[field].toString().trim() === '') {
          throw new Error(`${field} is required`);
        }
      }
    }

    if (customerData.email && customerData.email.trim() !== '') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(customerData.email)) {
        throw new Error('Invalid email format');
      }
    }

    if (customerData.phone) {
      const phoneRegex = /^[6-9]\d{9}$/;
      const cleanPhone = customerData.phone.replace(/\D/g, '');
      if (cleanPhone.length === 10 && !phoneRegex.test(cleanPhone)) {
        throw new Error('Invalid phone number format');
      }
    }

    if (customerData.customerType && !Object.values(CUSTOMER_TYPES).includes(customerData.customerType)) {
      throw new Error('Invalid customer type');
    }

    if (customerData.category && !Object.values(CUSTOMER_CATEGORIES).includes(customerData.category)) {
      throw new Error('Invalid customer category');
    }
  }

  /**
   * Clean up data inconsistencies (run once to fix existing data)
   * @param {string} userType 
   * @returns {Promise<Object>}
   */
  async cleanupCustomerData(userType) {
    try {
      console.log('=== CLEANUP CUSTOMER DATA ===');
      const customersPath = getCustomersPath(userType);
      const customersRef = ref(database, customersPath);
      const snapshot = await get(customersRef);
      
      if (!snapshot.exists()) {
        return { cleaned: 0, errors: 0 };
      }

      let cleaned = 0;
      let errors = 0;

      const updates = {};
      
      snapshot.forEach((childSnapshot) => {
        const customerData = childSnapshot.val();
        const firebaseKey = childSnapshot.key;
        
        // If customer has internal ID fields, remove them
        if (customerData.id || customerData.internalId) {
          const { id, internalId, ...cleanData } = customerData;
          updates[firebaseKey] = cleanData;
          cleaned++;
          console.log(`Cleaning customer ${firebaseKey}: removed internal IDs`);
        }
      });

      if (Object.keys(updates).length > 0) {
        await update(customersRef, updates);
        console.log(`✅ Cleaned ${cleaned} customers`);
      }

      return { cleaned, errors };
    } catch (error) {
      console.error('Error cleaning up customer data:', error);
      throw error;
    }
  }
}

export default new CustomerService();