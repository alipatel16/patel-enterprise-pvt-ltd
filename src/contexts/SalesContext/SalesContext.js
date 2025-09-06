import React, { createContext, useContext, useReducer, useCallback } from 'react';
import salesService from '../../services/api/salesService';
import { useUserType } from '../UserTypeContext/UserTypeContext';
import { useAuth } from '../AuthContext/AuthContext';

// Initial state
const initialState = {
  sales: [],
  currentInvoice: null,
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
    paymentStatus: '',
    deliveryStatus: '',
    customerId: '',
    fromDate: '',
    toDate: '',
    sortBy: 'createdAt',
    sortOrder: 'desc'
  },
  stats: {
    totalSales: 0,
    totalAmount: 0,
    todaysSales: 0,
    todaysAmount: 0,
    pendingPayments: 0,
    pendingDeliveries: 0,
    paidInvoices: 0,
    emiInvoices: 0
  },
  notifications: {
    pendingEMIs: [],
    pendingDeliveries: []
  }
};

// Action types
const SALES_ACTIONS = {
  SET_LOADING: 'SET_LOADING',
  SET_SALES: 'SET_SALES',
  SET_CURRENT_INVOICE: 'SET_CURRENT_INVOICE',
  ADD_SALE: 'ADD_SALE',
  UPDATE_SALE: 'UPDATE_SALE',
  DELETE_SALE: 'DELETE_SALE',
  SET_ERROR: 'SET_ERROR',
  CLEAR_ERROR: 'CLEAR_ERROR',
  SET_FILTERS: 'SET_FILTERS',
  SET_PAGINATION: 'SET_PAGINATION',
  SET_STATS: 'SET_STATS',
  SET_NOTIFICATIONS: 'SET_NOTIFICATIONS',
  RESET_STATE: 'RESET_STATE'
};

// Reducer
const salesReducer = (state, action) => {
  switch (action.type) {
    case SALES_ACTIONS.SET_LOADING:
      return {
        ...state,
        loading: action.payload,
        error: action.payload ? null : state.error
      };

    case SALES_ACTIONS.SET_SALES:
      return {
        ...state,
        sales: action.payload.sales || [],
        pagination: {
          currentPage: action.payload.currentPage || 1,
          totalPages: action.payload.totalPages || 1,
          total: action.payload.total || 0,
          hasMore: action.payload.hasMore || false
        },
        loading: false,
        error: null
      };

    case SALES_ACTIONS.SET_CURRENT_INVOICE:
      return {
        ...state,
        currentInvoice: action.payload,
        loading: false,
        error: null
      };

    case SALES_ACTIONS.ADD_SALE:
      return {
        ...state,
        sales: [action.payload, ...state.sales],
        pagination: {
          ...state.pagination,
          total: state.pagination.total + 1
        },
        loading: false,
        error: null
      };

    case SALES_ACTIONS.UPDATE_SALE:
      return {
        ...state,
        sales: state.sales.map(sale =>
          sale.id === action.payload.id ? action.payload : sale
        ),
        currentInvoice: state.currentInvoice?.id === action.payload.id 
          ? action.payload 
          : state.currentInvoice,
        loading: false,
        error: null
      };

    case SALES_ACTIONS.DELETE_SALE:
      return {
        ...state,
        sales: state.sales.filter(sale => sale.id !== action.payload),
        currentInvoice: state.currentInvoice?.id === action.payload 
          ? null 
          : state.currentInvoice,
        pagination: {
          ...state.pagination,
          total: Math.max(0, state.pagination.total - 1)
        },
        loading: false,
        error: null
      };

    case SALES_ACTIONS.SET_ERROR:
      return {
        ...state,
        error: action.payload,
        loading: false
      };

    case SALES_ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        error: null
      };

    case SALES_ACTIONS.SET_FILTERS:
      return {
        ...state,
        filters: {
          ...state.filters,
          ...action.payload
        }
      };

    case SALES_ACTIONS.SET_STATS:
      return {
        ...state,
        stats: action.payload
      };

    case SALES_ACTIONS.SET_NOTIFICATIONS:
      return {
        ...state,
        notifications: action.payload
      };

    case SALES_ACTIONS.RESET_STATE:
      return initialState;

    default:
      return state;
  }
};

// Create context
const SalesContext = createContext();

// Custom hook to use sales context
export const useSales = () => {
  const context = useContext(SalesContext);
  if (!context) {
    throw new Error('useSales must be used within a SalesProvider');
  }
  return context;
};

// Sales Provider component
export const SalesProvider = ({ children }) => {
  const [state, dispatch] = useReducer(salesReducer, initialState);
  const { userType } = useUserType();
  const { user } = useAuth();

  // Load sales
  const loadSales = useCallback(async (options = {}) => {
    if (!userType) {
      dispatch({ type: SALES_ACTIONS.SET_ERROR, payload: 'User type not available' });
      return;
    }

    try {
      dispatch({ type: SALES_ACTIONS.SET_LOADING, payload: true });

      const queryOptions = {
        limit: 10,
        offset: (state.pagination.currentPage - 1) * 10,
        ...state.filters,
        ...options
      };

      const response = await salesService.getSales(userType, queryOptions);
      dispatch({ type: SALES_ACTIONS.SET_SALES, payload: response });
    } catch (error) {
      dispatch({ type: SALES_ACTIONS.SET_ERROR, payload: error.message });
    }
  }, [userType, state.filters, state.pagination.currentPage]);

  // Search sales
  const searchSales = useCallback(async (searchTerm) => {
    if (!userType || !searchTerm.trim()) {
      await loadSales();
      return;
    }

    try {
      dispatch({ type: SALES_ACTIONS.SET_LOADING, payload: true });
      
      const sales = await salesService.searchSales(userType, searchTerm);
      dispatch({ 
        type: SALES_ACTIONS.SET_SALES, 
        payload: { 
          sales, 
          total: sales.length,
          currentPage: 1,
          totalPages: 1,
          hasMore: false 
        } 
      });
    } catch (error) {
      dispatch({ type: SALES_ACTIONS.SET_ERROR, payload: error.message });
    }
  }, [userType, loadSales]);

  // Get invoice by ID
  const getInvoiceById = useCallback(async (invoiceId) => {
    if (!userType || !invoiceId) {
      dispatch({ type: SALES_ACTIONS.SET_ERROR, payload: 'Invalid parameters' });
      return null;
    }

    try {
      dispatch({ type: SALES_ACTIONS.SET_LOADING, payload: true });
      
      const invoice = await salesService.getInvoiceById(userType, invoiceId);
      if (invoice) {
        dispatch({ type: SALES_ACTIONS.SET_CURRENT_INVOICE, payload: invoice });
      } else {
        dispatch({ type: SALES_ACTIONS.SET_ERROR, payload: 'Invoice not found' });
      }
      
      return invoice;
    } catch (error) {
      dispatch({ type: SALES_ACTIONS.SET_ERROR, payload: error.message });
      return null;
    }
  }, [userType]);

  // Create invoice
  const createInvoice = useCallback(async (invoiceData) => {
    if (!userType) {
      dispatch({ type: SALES_ACTIONS.SET_ERROR, payload: 'User type not available' });
      return null;
    }

    try {
      dispatch({ type: SALES_ACTIONS.SET_LOADING, payload: true });
      
      // Add created by info
      const invoiceWithMeta = {
        ...invoiceData,
        createdBy: user?.uid,
        createdByName: user?.name
      };

      const newInvoice = await salesService.createInvoice(userType, invoiceWithMeta);
      dispatch({ type: SALES_ACTIONS.ADD_SALE, payload: newInvoice });
      
      return newInvoice;
    } catch (error) {
      dispatch({ type: SALES_ACTIONS.SET_ERROR, payload: error.message });
      return null;
    }
  }, [userType, user]);

  // Update invoice
  const updateInvoice = useCallback(async (invoiceId, updates) => {
    if (!userType || !invoiceId) {
      dispatch({ type: SALES_ACTIONS.SET_ERROR, payload: 'Invalid parameters' });
      return null;
    }

    try {
      dispatch({ type: SALES_ACTIONS.SET_LOADING, payload: true });
      
      // Add updated by info
      const updatesWithMeta = {
        ...updates,
        updatedBy: user?.uid,
        updatedByName: user?.name
      };

      const updatedInvoice = await salesService.updateInvoice(userType, invoiceId, updatesWithMeta);
      dispatch({ type: SALES_ACTIONS.UPDATE_SALE, payload: updatedInvoice });
      
      return updatedInvoice;
    } catch (error) {
      dispatch({ type: SALES_ACTIONS.SET_ERROR, payload: error.message });
      return null;
    }
  }, [userType, user]);

  // Delete invoice
  const deleteInvoice = useCallback(async (invoiceId) => {
    if (!userType || !invoiceId) {
      dispatch({ type: SALES_ACTIONS.SET_ERROR, payload: 'Invalid parameters' });
      return false;
    }

    try {
      dispatch({ type: SALES_ACTIONS.SET_LOADING, payload: true });
      
      await salesService.deleteInvoice(userType, invoiceId);
      dispatch({ type: SALES_ACTIONS.DELETE_SALE, payload: invoiceId });
      
      return true;
    } catch (error) {
      dispatch({ type: SALES_ACTIONS.SET_ERROR, payload: error.message });
      return false;
    }
  }, [userType]);

  // Update payment status
  const updatePaymentStatus = useCallback(async (invoiceId, paymentStatus, paymentDetails = {}) => {
    if (!userType || !invoiceId) {
      return null;
    }

    try {
      dispatch({ type: SALES_ACTIONS.SET_LOADING, payload: true });
      
      const updatedInvoice = await salesService.updatePaymentStatus(userType, invoiceId, paymentStatus, paymentDetails);
      dispatch({ type: SALES_ACTIONS.UPDATE_SALE, payload: updatedInvoice });
      
      return updatedInvoice;
    } catch (error) {
      dispatch({ type: SALES_ACTIONS.SET_ERROR, payload: error.message });
      return null;
    }
  }, [userType]);

  // Update delivery status
  const updateDeliveryStatus = useCallback(async (invoiceId, deliveryStatus, deliveryDetails = {}) => {
    if (!userType || !invoiceId) {
      return null;
    }

    try {
      dispatch({ type: SALES_ACTIONS.SET_LOADING, payload: true });
      
      const updatedInvoice = await salesService.updateDeliveryStatus(userType, invoiceId, deliveryStatus, deliveryDetails);
      dispatch({ type: SALES_ACTIONS.UPDATE_SALE, payload: updatedInvoice });
      
      return updatedInvoice;
    } catch (error) {
      dispatch({ type: SALES_ACTIONS.SET_ERROR, payload: error.message });
      return null;
    }
  }, [userType]);

  // Update EMI payment
  const updateEMIPayment = useCallback(async (invoiceId, emiIndex, paymentDetails) => {
    if (!userType || !invoiceId) {
      return null;
    }

    try {
      dispatch({ type: SALES_ACTIONS.SET_LOADING, payload: true });
      
      const updatedInvoice = await salesService.updateEMIPayment(userType, invoiceId, emiIndex, paymentDetails);
      dispatch({ type: SALES_ACTIONS.UPDATE_SALE, payload: updatedInvoice });
      
      return updatedInvoice;
    } catch (error) {
      dispatch({ type: SALES_ACTIONS.SET_ERROR, payload: error.message });
      return null;
    }
  }, [userType]);

  // Load sales statistics
  const loadSalesStats = useCallback(async () => {
    if (!userType) {
      return;
    }

    try {
      const stats = await salesService.getSalesStats(userType, state.filters);
      dispatch({ type: SALES_ACTIONS.SET_STATS, payload: stats });
    } catch (error) {
      console.error('Error loading sales stats:', error);
    }
  }, [userType, state.filters]);

  // Load notifications (pending EMIs and deliveries)
  const loadNotifications = useCallback(async () => {
    if (!userType) {
      return;
    }

    try {
      const [pendingEMIs, pendingDeliveries] = await Promise.all([
        salesService.getPendingEMIPayments(userType),
        salesService.getPendingDeliveries(userType)
      ]);

      dispatch({ 
        type: SALES_ACTIONS.SET_NOTIFICATIONS, 
        payload: {
          pendingEMIs,
          pendingDeliveries
        }
      });
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  }, [userType]);

  // Get customer purchase history
  const getCustomerPurchaseHistory = useCallback(async (customerId) => {
    if (!userType || !customerId) {
      return [];
    }

    try {
      return await salesService.getCustomerPurchaseHistory(userType, customerId);
    } catch (error) {
      dispatch({ type: SALES_ACTIONS.SET_ERROR, payload: error.message });
      return [];
    }
  }, [userType]);

  // Get sales by date range
  const getSalesByDateRange = useCallback(async (startDate, endDate) => {
    if (!userType) {
      return [];
    }

    try {
      return await salesService.getSalesByDateRange(userType, startDate, endDate);
    } catch (error) {
      dispatch({ type: SALES_ACTIONS.SET_ERROR, payload: error.message });
      return [];
    }
  }, [userType]);

  // Set filters
  const setFilters = useCallback((newFilters) => {
    dispatch({ type: SALES_ACTIONS.SET_FILTERS, payload: newFilters });
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    dispatch({ type: SALES_ACTIONS.CLEAR_ERROR });
  }, []);

  // Reset state
  const resetState = useCallback(() => {
    dispatch({ type: SALES_ACTIONS.RESET_STATE });
  }, []);

  // Set current invoice
  const setCurrentInvoice = useCallback((invoice) => {
    dispatch({ type: SALES_ACTIONS.SET_CURRENT_INVOICE, payload: invoice });
  }, []);

  // Pagination helpers
  const nextPage = useCallback(() => {
    if (state.pagination.hasMore) {
      loadSales({ 
        offset: state.pagination.currentPage * 10 
      });
    }
  }, [state.pagination, loadSales]);

  const prevPage = useCallback(() => {
    if (state.pagination.currentPage > 1) {
      loadSales({ 
        offset: (state.pagination.currentPage - 2) * 10 
      });
    }
  }, [state.pagination, loadSales]);

  const goToPage = useCallback((page) => {
    if (page >= 1 && page <= state.pagination.totalPages) {
      loadSales({ 
        offset: (page - 1) * 10 
      });
    }
  }, [state.pagination, loadSales]);

  // Context value
  const value = {
    // State
    sales: state.sales,
    currentInvoice: state.currentInvoice,
    loading: state.loading,
    error: state.error,
    pagination: state.pagination,
    filters: state.filters,
    stats: state.stats,
    notifications: state.notifications,

    // Actions
    loadSales,
    searchSales,
    getInvoiceById,
    createInvoice,
    updateInvoice,
    deleteInvoice,
    updatePaymentStatus,
    updateDeliveryStatus,
    updateEMIPayment,
    loadSalesStats,
    loadNotifications,
    getCustomerPurchaseHistory,
    getSalesByDateRange,
    
    // Filters and pagination
    setFilters,
    nextPage,
    prevPage,
    goToPage,
    
    // Utilities
    clearError,
    resetState,
    setCurrentInvoice
  };

  return (
    <SalesContext.Provider value={value}>
      {children}
    </SalesContext.Provider>
  );
};

export default SalesContext;