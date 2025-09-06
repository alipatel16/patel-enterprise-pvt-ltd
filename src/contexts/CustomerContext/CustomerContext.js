import React, { createContext, useContext, useReducer, useCallback } from 'react';
import customerService from '../../services/api/customerService';
import { useUserType } from '../UserTypeContext/UserTypeContext';
import { useAuth } from '../AuthContext/AuthContext';

// Initial state
const initialState = {
  customers: [],
  currentCustomer: null,
  loading: false,
  error: null,
  pagination: {
    currentPage: 1,
    totalPages: 1,
    total: 0,
    hasMore: false
  },
  filters: {
    search: '',
    customerType: '',
    category: '',
    sortBy: 'name',
    sortOrder: 'asc'
  },
  stats: {
    total: 0,
    wholesalers: 0,
    retailers: 0,
    individuals: 0,
    firms: 0,
    schools: 0
  }
};

// Action types
const CUSTOMER_ACTIONS = {
  SET_LOADING: 'SET_LOADING',
  SET_CUSTOMERS: 'SET_CUSTOMERS',
  SET_CURRENT_CUSTOMER: 'SET_CURRENT_CUSTOMER',
  ADD_CUSTOMER: 'ADD_CUSTOMER',
  UPDATE_CUSTOMER: 'UPDATE_CUSTOMER',
  DELETE_CUSTOMER: 'DELETE_CUSTOMER',
  SET_ERROR: 'SET_ERROR',
  CLEAR_ERROR: 'CLEAR_ERROR',
  SET_FILTERS: 'SET_FILTERS',
  SET_PAGINATION: 'SET_PAGINATION',
  SET_STATS: 'SET_STATS',
  RESET_STATE: 'RESET_STATE'
};

// Reducer
const customerReducer = (state, action) => {
  switch (action.type) {
    case CUSTOMER_ACTIONS.SET_LOADING:
      return {
        ...state,
        loading: action.payload,
        error: action.payload ? null : state.error
      };

    case CUSTOMER_ACTIONS.SET_CUSTOMERS:
      return {
        ...state,
        customers: action.payload.customers || [],
        pagination: {
          currentPage: action.payload.currentPage || 1,
          totalPages: action.payload.totalPages || 1,
          total: action.payload.total || 0,
          hasMore: action.payload.hasMore || false
        },
        loading: false,
        error: null
      };

    case CUSTOMER_ACTIONS.SET_CURRENT_CUSTOMER:
      return {
        ...state,
        currentCustomer: action.payload,
        loading: false,
        error: null
      };

    case CUSTOMER_ACTIONS.ADD_CUSTOMER:
      return {
        ...state,
        customers: [action.payload, ...state.customers],
        pagination: {
          ...state.pagination,
          total: state.pagination.total + 1
        },
        loading: false,
        error: null
      };

    case CUSTOMER_ACTIONS.UPDATE_CUSTOMER:
      return {
        ...state,
        customers: state.customers.map(customer =>
          customer.id === action.payload.id ? action.payload : customer
        ),
        currentCustomer: state.currentCustomer?.id === action.payload.id 
          ? action.payload 
          : state.currentCustomer,
        loading: false,
        error: null
      };

    case CUSTOMER_ACTIONS.DELETE_CUSTOMER:
      return {
        ...state,
        customers: state.customers.filter(customer => customer.id !== action.payload),
        currentCustomer: state.currentCustomer?.id === action.payload 
          ? null 
          : state.currentCustomer,
        pagination: {
          ...state.pagination,
          total: Math.max(0, state.pagination.total - 1)
        },
        loading: false,
        error: null
      };

    case CUSTOMER_ACTIONS.SET_ERROR:
      return {
        ...state,
        error: action.payload,
        loading: false
      };

    case CUSTOMER_ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        error: null
      };

    case CUSTOMER_ACTIONS.SET_FILTERS:
      return {
        ...state,
        filters: {
          ...state.filters,
          ...action.payload
        }
      };

    case CUSTOMER_ACTIONS.SET_STATS:
      return {
        ...state,
        stats: action.payload
      };

    case CUSTOMER_ACTIONS.RESET_STATE:
      return initialState;

    default:
      return state;
  }
};

// Create context
const CustomerContext = createContext();

// Custom hook to use customer context
export const useCustomer = () => {
  const context = useContext(CustomerContext);
  if (!context) {
    throw new Error('useCustomer must be used within a CustomerProvider');
  }
  return context;
};

// Customer Provider component
export const CustomerProvider = ({ children }) => {
  const [state, dispatch] = useReducer(customerReducer, initialState);
  const { userType } = useUserType();
  const { user } = useAuth();

  // Load customers - NO LIMITS, load all customers
  const loadCustomers = useCallback(async (options = {}) => {
    if (!userType) {
      dispatch({ type: CUSTOMER_ACTIONS.SET_ERROR, payload: 'User type not available' });
      return;
    }

    try {
      dispatch({ type: CUSTOMER_ACTIONS.SET_LOADING, payload: true });

      // Remove any limits - load ALL customers
      const queryOptions = {
        // No limit or offset - load everything
        ...state.filters,
        ...options
      };

      const response = await customerService.getCustomers(userType, queryOptions);
      dispatch({ type: CUSTOMER_ACTIONS.SET_CUSTOMERS, payload: response });
    } catch (error) {
      dispatch({ type: CUSTOMER_ACTIONS.SET_ERROR, payload: error.message });
    }
  }, [userType, state.filters]);

  // Search customers - NO LIMITS, search all customers
  const searchCustomers = useCallback(async (searchTerm) => {
    if (!userType) {
      dispatch({ type: CUSTOMER_ACTIONS.SET_ERROR, payload: 'User type not available' });
      return;
    }

    try {
      dispatch({ type: CUSTOMER_ACTIONS.SET_LOADING, payload: true });
      
      if (!searchTerm.trim()) {
        // If empty search, load all customers
        await loadCustomers();
        return;
      }

      // Use the search functionality in service with NO LIMITS
      const queryOptions = {
        search: searchTerm.trim(),
        // No limit - show ALL search results
        ...state.filters
      };

      const response = await customerService.getCustomers(userType, queryOptions);
      dispatch({ type: CUSTOMER_ACTIONS.SET_CUSTOMERS, payload: response });
    } catch (error) {
      dispatch({ type: CUSTOMER_ACTIONS.SET_ERROR, payload: error.message });
    }
  }, [userType, state.filters, loadCustomers]);

  // Get customer by ID
  const getCustomerById = useCallback(async (customerId) => {
    if (!userType || !customerId) {
      dispatch({ type: CUSTOMER_ACTIONS.SET_ERROR, payload: 'Invalid parameters' });
      return null;
    }

    try {
      dispatch({ type: CUSTOMER_ACTIONS.SET_LOADING, payload: true });
      
      const customer = await customerService.getCustomerById(userType, customerId);
      if (customer) {
        dispatch({ type: CUSTOMER_ACTIONS.SET_CURRENT_CUSTOMER, payload: customer });
      } else {
        dispatch({ type: CUSTOMER_ACTIONS.SET_ERROR, payload: 'Customer not found' });
      }
      
      return customer;
    } catch (error) {
      dispatch({ type: CUSTOMER_ACTIONS.SET_ERROR, payload: error.message });
      return null;
    }
  }, [userType]);

  // Create customer
  const createCustomer = useCallback(async (customerData) => {
    if (!userType) {
      dispatch({ type: CUSTOMER_ACTIONS.SET_ERROR, payload: 'User type not available' });
      return null;
    }

    try {
      dispatch({ type: CUSTOMER_ACTIONS.SET_LOADING, payload: true });
      
      // Add created by info
      const customerWithMeta = {
        ...customerData,
        createdBy: user?.uid,
        createdByName: user?.name
      };

      const newCustomer = await customerService.createCustomer(userType, customerWithMeta);
      dispatch({ type: CUSTOMER_ACTIONS.ADD_CUSTOMER, payload: newCustomer });
      
      return newCustomer;
    } catch (error) {
      dispatch({ type: CUSTOMER_ACTIONS.SET_ERROR, payload: error.message });
      return null;
    }
  }, [userType, user]);

  // Update customer
  const updateCustomer = useCallback(async (customerId, updates) => {
    if (!userType || !customerId) {
      dispatch({ type: CUSTOMER_ACTIONS.SET_ERROR, payload: 'Invalid parameters' });
      return null;
    }

    try {
      dispatch({ type: CUSTOMER_ACTIONS.SET_LOADING, payload: true });
      
      // Add updated by info
      const updatesWithMeta = {
        ...updates,
        updatedBy: user?.uid,
        updatedByName: user?.name
      };

      const updatedCustomer = await customerService.updateCustomer(userType, customerId, updatesWithMeta);
      dispatch({ type: CUSTOMER_ACTIONS.UPDATE_CUSTOMER, payload: updatedCustomer });
      
      return updatedCustomer;
    } catch (error) {
      dispatch({ type: CUSTOMER_ACTIONS.SET_ERROR, payload: error.message });
      return null;
    }
  }, [userType, user]);

  // Delete customer
  const deleteCustomer = useCallback(async (customerId) => {
    if (!userType || !customerId) {
      dispatch({ type: CUSTOMER_ACTIONS.SET_ERROR, payload: 'Invalid parameters' });
      return false;
    }

    try {
      dispatch({ type: CUSTOMER_ACTIONS.SET_LOADING, payload: true });
      
      await customerService.deleteCustomer(userType, customerId);
      dispatch({ type: CUSTOMER_ACTIONS.DELETE_CUSTOMER, payload: customerId });
      
      return true;
    } catch (error) {
      dispatch({ type: CUSTOMER_ACTIONS.SET_ERROR, payload: error.message });
      return false;
    }
  }, [userType]);

  // Get customer suggestions for autocomplete - keep small limit for performance
  const getCustomerSuggestions = useCallback(async (searchTerm, limit = 5) => {
    if (!userType || !searchTerm.trim()) {
      return [];
    }

    try {
      return await customerService.getCustomerSuggestions(userType, searchTerm, limit);
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      return [];
    }
  }, [userType]);

  // Get customers by type - NO LIMITS
  const getCustomersByType = useCallback(async (customerType) => {
    if (!userType) {
      return [];
    }

    try {
      return await customerService.getCustomersByType(userType, customerType);
    } catch (error) {
      dispatch({ type: CUSTOMER_ACTIONS.SET_ERROR, payload: error.message });
      return [];
    }
  }, [userType]);

  // Load customer statistics
  const loadCustomerStats = useCallback(async () => {
    if (!userType) {
      return;
    }

    try {
      const stats = await customerService.getCustomerStats(userType);
      dispatch({ type: CUSTOMER_ACTIONS.SET_STATS, payload: stats });
    } catch (error) {
      console.error('Error loading customer stats:', error);
    }
  }, [userType]);

  // Set filters and reload customers
  const setFilters = useCallback((newFilters) => {
    dispatch({ type: CUSTOMER_ACTIONS.SET_FILTERS, payload: newFilters });
    
    // Reload customers with new filters after a short delay
    setTimeout(() => {
      loadCustomers();
    }, 100);
  }, [loadCustomers]);

  // Clear error
  const clearError = useCallback(() => {
    dispatch({ type: CUSTOMER_ACTIONS.CLEAR_ERROR });
  }, []);

  // Reset state
  const resetState = useCallback(() => {
    dispatch({ type: CUSTOMER_ACTIONS.RESET_STATE });
  }, []);

  // Set current customer
  const setCurrentCustomer = useCallback((customer) => {
    dispatch({ type: CUSTOMER_ACTIONS.SET_CURRENT_CUSTOMER, payload: customer });
  }, []);

  // Pagination helpers (now work with loaded data, not server pagination)
  const nextPage = useCallback(() => {
    if (state.pagination.hasMore) {
      loadCustomers();
    }
  }, [state.pagination, loadCustomers]);

  const prevPage = useCallback(() => {
    if (state.pagination.currentPage > 1) {
      loadCustomers();
    }
  }, [state.pagination, loadCustomers]);

  const goToPage = useCallback((page) => {
    if (page >= 1 && page <= state.pagination.totalPages) {
      loadCustomers();
    }
  }, [state.pagination, loadCustomers]);

  // Handle search from search bar
  const handleSearch = useCallback((searchTerm) => {
    if (searchTerm.trim()) {
      searchCustomers(searchTerm);
    } else {
      // Clear search and reload all customers
      dispatch({ type: CUSTOMER_ACTIONS.SET_FILTERS, payload: { search: '' } });
      loadCustomers();
    }
  }, [searchCustomers, loadCustomers]);

  // Handle search clear
  const handleSearchClear = useCallback(() => {
    dispatch({ type: CUSTOMER_ACTIONS.SET_FILTERS, payload: { search: '' } });
    loadCustomers();
  }, [loadCustomers]);

  // Context value
  const value = {
    // State
    customers: state.customers,
    currentCustomer: state.currentCustomer,
    loading: state.loading,
    error: state.error,
    pagination: state.pagination,
    filters: state.filters,
    stats: state.stats,

    // Actions
    loadCustomers,
    searchCustomers,
    getCustomerById,
    createCustomer,
    updateCustomer,
    deleteCustomer,
    getCustomerSuggestions,
    getCustomersByType,
    loadCustomerStats,
    
    // Filters and pagination
    setFilters,
    nextPage,
    prevPage,
    goToPage,
    handleSearch,
    handleSearchClear,
    
    // Utilities
    clearError,
    resetState,
    setCurrentCustomer
  };

  return (
    <CustomerContext.Provider value={value}>
      {children}
    </CustomerContext.Provider>
  );
};

export default CustomerContext;