import React, { useReducer, useCallback, useContext, createContext } from 'react';
import customerService from '../../services/api/customerService';
import { useUserType } from '../UserTypeContext/UserTypeContext';
import { useAuth } from '../AuthContext/AuthContext';

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
    type: '',
    category: '',
    sortBy: 'name',
    sortOrder: 'asc'
  }
};

// Action types
const CUSTOMER_ACTIONS = {
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  CLEAR_ERROR: 'CLEAR_ERROR',
  SET_CUSTOMERS: 'SET_CUSTOMERS',
  ADD_CUSTOMER: 'ADD_CUSTOMER',
  UPDATE_CUSTOMER: 'UPDATE_CUSTOMER',
  DELETE_CUSTOMER: 'DELETE_CUSTOMER',
  SET_CURRENT_CUSTOMER: 'SET_CURRENT_CUSTOMER',
  SET_PAGINATION: 'SET_PAGINATION',
  SET_FILTERS: 'SET_FILTERS',
  RESET_STATE: 'RESET_STATE'
};

// Reducer
const customerReducer = (state, action) => {
  switch (action.type) {
    case CUSTOMER_ACTIONS.SET_LOADING:
      return {
        ...state,
        loading: action.payload,
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

    case CUSTOMER_ACTIONS.SET_CUSTOMERS:
      return {
        ...state,
        customers: action.payload,
        loading: false,
        error: null
      };

    case CUSTOMER_ACTIONS.ADD_CUSTOMER:
      return {
        ...state,
        customers: [action.payload, ...state.customers],
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
        error: null
      };

    case CUSTOMER_ACTIONS.DELETE_CUSTOMER:
      return {
        ...state,
        customers: state.customers.filter(customer => customer.id !== action.payload),
        currentCustomer: state.currentCustomer?.id === action.payload 
          ? null 
          : state.currentCustomer,
        error: null
      };

    case CUSTOMER_ACTIONS.SET_CURRENT_CUSTOMER:
      return {
        ...state,
        currentCustomer: action.payload,
        error: null
      };

    case CUSTOMER_ACTIONS.SET_PAGINATION:
      return {
        ...state,
        pagination: { ...state.pagination, ...action.payload }
      };

    case CUSTOMER_ACTIONS.SET_FILTERS:
      return {
        ...state,
        filters: { ...state.filters, ...action.payload }
      };

    case CUSTOMER_ACTIONS.RESET_STATE:
      return initialState;

    default:
      return state;
  }
};

/**
 * CustomerProvider component that manages customer state
 * @param {Object} props
 * @param {React.ReactNode} props.children - Child components
 */
const CustomerProvider = ({ children }) => {
  const [state, dispatch] = useReducer(customerReducer, initialState);
  const { userType } = useUserType();
  const { user } = useAuth();

  // Clear error
  const clearError = useCallback(() => {
    dispatch({ type: CUSTOMER_ACTIONS.CLEAR_ERROR });
  }, []);

  // Set loading
  const setLoading = useCallback((loading) => {
    dispatch({ type: CUSTOMER_ACTIONS.SET_LOADING, payload: loading });
  }, []);

  // Set filters
  const setFilters = useCallback((filters) => {
    dispatch({ type: CUSTOMER_ACTIONS.SET_FILTERS, payload: filters });
  }, []);

  // Get customers
  const getCustomers = useCallback(async (options = {}) => {
    if (!userType) {
      dispatch({ type: CUSTOMER_ACTIONS.SET_ERROR, payload: 'User type not available' });
      return [];
    }

    try {
      dispatch({ type: CUSTOMER_ACTIONS.SET_LOADING, payload: true });
      
      const result = await customerService.getCustomers(userType, {
        ...state.filters,
        ...options
      });

      dispatch({ type: CUSTOMER_ACTIONS.SET_CUSTOMERS, payload: result.customers });
      dispatch({ 
        type: CUSTOMER_ACTIONS.SET_PAGINATION, 
        payload: {
          currentPage: result.currentPage,
          totalPages: result.totalPages,
          total: result.total,
          hasMore: result.hasMore
        }
      });

      return result.customers;
    } catch (error) {
      dispatch({ 
        type: CUSTOMER_ACTIONS.SET_ERROR, 
        payload: error.message || 'Failed to fetch customers' 
      });
      return [];
    }
  }, [userType, state.filters]);

  // Get customer by ID
  const getCustomerById = useCallback(async (customerId) => {
    if (!userType || !customerId) {
      return null;
    }

    try {
      const customer = await customerService.getCustomerById(userType, customerId);
      
      if (customer) {
        dispatch({ type: CUSTOMER_ACTIONS.SET_CURRENT_CUSTOMER, payload: customer });
      }
      
      return customer;
    } catch (error) {
      dispatch({ 
        type: CUSTOMER_ACTIONS.SET_ERROR, 
        payload: error.message || 'Failed to fetch customer' 
      });
      return null;
    }
  }, [userType]);

  // Create customer
  const createCustomer = useCallback(async (customerData) => {
    if (!userType) {
      throw new Error('User type not available');
    }

    try {
      dispatch({ type: CUSTOMER_ACTIONS.SET_LOADING, payload: true });
      
      const newCustomer = await customerService.createCustomer(userType, {
        ...customerData,
        createdBy: user?.uid,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      dispatch({ type: CUSTOMER_ACTIONS.ADD_CUSTOMER, payload: newCustomer });
      dispatch({ type: CUSTOMER_ACTIONS.SET_LOADING, payload: false });
      
      return newCustomer;
    } catch (error) {
      dispatch({ 
        type: CUSTOMER_ACTIONS.SET_ERROR, 
        payload: error.message || 'Failed to create customer' 
      });
      throw error;
    }
  }, [userType, user]);

  // Update customer
  const updateCustomer = useCallback(async (customerId, updates) => {
    if (!userType || !customerId) {
      throw new Error('User type and customer ID are required');
    }

    try {
      dispatch({ type: CUSTOMER_ACTIONS.SET_LOADING, payload: true });
      
      const updatedCustomer = await customerService.updateCustomer(userType, customerId, {
        ...updates,
        updatedBy: user?.uid,
        updatedAt: new Date().toISOString()
      });

      dispatch({ type: CUSTOMER_ACTIONS.UPDATE_CUSTOMER, payload: updatedCustomer });
      dispatch({ type: CUSTOMER_ACTIONS.SET_LOADING, payload: false });
      
      return updatedCustomer;
    } catch (error) {
      dispatch({ 
        type: CUSTOMER_ACTIONS.SET_ERROR, 
        payload: error.message || 'Failed to update customer' 
      });
      throw error;
    }
  }, [userType, user]);

  // Delete customer
  const deleteCustomer = useCallback(async (customerId) => {
    if (!userType || !customerId) {
      throw new Error('User type and customer ID are required');
    }

    try {
      dispatch({ type: CUSTOMER_ACTIONS.SET_LOADING, payload: true });
      
      await customerService.deleteCustomer(userType, customerId);
      
      dispatch({ type: CUSTOMER_ACTIONS.DELETE_CUSTOMER, payload: customerId });
      dispatch({ type: CUSTOMER_ACTIONS.SET_LOADING, payload: false });
      
      return true;
    } catch (error) {
      dispatch({ 
        type: CUSTOMER_ACTIONS.SET_ERROR, 
        payload: error.message || 'Failed to delete customer' 
      });
      throw error;
    }
  }, [userType]);

  // Search customers
  const searchCustomers = useCallback(async (searchTerm, options = {}) => {
    if (!userType) {
      return [];
    }

    try {
      const result = await customerService.searchCustomers(userType, searchTerm, options);
      return result.customers || [];
    } catch (error) {
      console.error('Search customers error:', error);
      return [];
    }
  }, [userType]);

  // Get customer statistics
  const getCustomerStats = useCallback(async (customerId) => {
    if (!userType || !customerId) {
      return null;
    }

    try {
      const stats = await customerService.getCustomerStats(userType, customerId);
      return stats;
    } catch (error) {
      console.error('Get customer stats error:', error);
      return null;
    }
  }, [userType]);

  // Reset state (useful for logout)
  const resetState = useCallback(() => {
    dispatch({ type: CUSTOMER_ACTIONS.RESET_STATE });
  }, []);

  // Context value
  const contextValue = {
    // State
    ...state,
    
    // Actions
    getCustomers,
    getCustomerById,
    createCustomer,
    updateCustomer,
    deleteCustomer,
    searchCustomers,
    getCustomerStats,
    setFilters,
    clearError,
    setLoading,
    resetState
  };

  return (
    <CustomerContext.Provider value={contextValue}>
      {children}
    </CustomerContext.Provider>
  );
};

export default CustomerProvider;