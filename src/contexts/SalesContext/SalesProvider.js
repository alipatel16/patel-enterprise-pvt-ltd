import React, { useReducer, useCallback, useContext, createContext } from 'react';
import salesService from '../../services/api/salesService';
import { useUserType } from '../UserTypeContext/UserTypeContext';
import { useAuth } from '../AuthContext/AuthContext';
import { calculateGST } from '../../utils/helpers/gstCalculator';

// Create context
const SalesContext = createContext();

// Custom hook
export const useSales = () => {
  const context = useContext(SalesContext);
  if (!context) {
    throw new Error('useSales must be used within a SalesProvider');
  }
  return context;
};

// Initial state
const initialState = {
  sales: [],
  invoices: [],
  currentSale: null,
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
    customer: '',
    paymentStatus: '',
    deliveryStatus: '',
    dateFrom: null,
    dateTo: null,
    amountMin: '',
    amountMax: '',
    sortBy: 'date',
    sortOrder: 'desc'
  },
  statistics: {
    totalSales: 0,
    totalRevenue: 0,
    pendingPayments: 0,
    pendingDeliveries: 0
  }
};

// Actions
const SALES_ACTIONS = {
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  CLEAR_ERROR: 'CLEAR_ERROR',
  SET_SALES: 'SET_SALES',
  SET_INVOICES: 'SET_INVOICES',
  ADD_SALE: 'ADD_SALE',
  UPDATE_SALE: 'UPDATE_SALE',
  DELETE_SALE: 'DELETE_SALE',
  SET_CURRENT_SALE: 'SET_CURRENT_SALE',
  SET_CURRENT_INVOICE: 'SET_CURRENT_INVOICE',
  SET_PAGINATION: 'SET_PAGINATION',
  SET_FILTERS: 'SET_FILTERS',
  SET_STATISTICS: 'SET_STATISTICS',
  RESET_STATE: 'RESET_STATE'
};

// Reducer
const salesReducer = (state, action) => {
  switch (action.type) {
    case SALES_ACTIONS.SET_LOADING:
      return { ...state, loading: action.payload, error: null };

    case SALES_ACTIONS.SET_ERROR:
      return { ...state, error: action.payload, loading: false };

    case SALES_ACTIONS.CLEAR_ERROR:
      return { ...state, error: null };

    case SALES_ACTIONS.SET_SALES:
      return { ...state, sales: action.payload, loading: false, error: null };

    case SALES_ACTIONS.SET_INVOICES:
      return { ...state, invoices: action.payload, loading: false, error: null };

    case SALES_ACTIONS.ADD_SALE:
      return { ...state, sales: [action.payload, ...state.sales], error: null };

    case SALES_ACTIONS.UPDATE_SALE:
      return {
        ...state,
        sales: state.sales.map(sale =>
          sale.id === action.payload.id ? action.payload : sale
        ),
        invoices: state.invoices.map(invoice =>
          invoice.id === action.payload.id ? action.payload : invoice
        ),
        currentSale: state.currentSale?.id === action.payload.id 
          ? action.payload : state.currentSale,
        currentInvoice: state.currentInvoice?.id === action.payload.id 
          ? action.payload : state.currentInvoice,
        error: null
      };

    case SALES_ACTIONS.DELETE_SALE:
      return {
        ...state,
        sales: state.sales.filter(sale => sale.id !== action.payload),
        invoices: state.invoices.filter(invoice => invoice.id !== action.payload),
        currentSale: state.currentSale?.id === action.payload ? null : state.currentSale,
        currentInvoice: state.currentInvoice?.id === action.payload ? null : state.currentInvoice,
        error: null
      };

    case SALES_ACTIONS.SET_CURRENT_SALE:
      return { ...state, currentSale: action.payload, error: null };

    case SALES_ACTIONS.SET_CURRENT_INVOICE:
      return { ...state, currentInvoice: action.payload, error: null };

    case SALES_ACTIONS.SET_PAGINATION:
      return { ...state, pagination: { ...state.pagination, ...action.payload } };

    case SALES_ACTIONS.SET_FILTERS:
      return { ...state, filters: { ...state.filters, ...action.payload } };

    case SALES_ACTIONS.SET_STATISTICS:
      return { ...state, statistics: { ...state.statistics, ...action.payload } };

    case SALES_ACTIONS.RESET_STATE:
      return initialState;

    default:
      return state;
  }
};

const SalesProvider = ({ children }) => {
  const [state, dispatch] = useReducer(salesReducer, initialState);
  const { userType } = useUserType();
  const { user } = useAuth();

  const clearError = useCallback(() => {
    dispatch({ type: SALES_ACTIONS.CLEAR_ERROR });
  }, []);

  const setLoading = useCallback((loading) => {
    dispatch({ type: SALES_ACTIONS.SET_LOADING, payload: loading });
  }, []);

  const setFilters = useCallback((filters) => {
    dispatch({ type: SALES_ACTIONS.SET_FILTERS, payload: filters });
  }, []);

  // Get sales/invoices
  const getSales = useCallback(async (options = {}) => {
    if (!userType) {
      dispatch({ type: SALES_ACTIONS.SET_ERROR, payload: 'User type not available' });
      return [];
    }

    try {
      dispatch({ type: SALES_ACTIONS.SET_LOADING, payload: true });
      
      const result = await salesService.getSales(userType, {
        ...state.filters,
        ...options
      });

      dispatch({ type: SALES_ACTIONS.SET_SALES, payload: result.sales });
      dispatch({ type: SALES_ACTIONS.SET_INVOICES, payload: result.sales }); // Same data, different view
      dispatch({ 
        type: SALES_ACTIONS.SET_PAGINATION, 
        payload: {
          currentPage: result.currentPage,
          totalPages: result.totalPages,
          total: result.total,
          hasMore: result.hasMore
        }
      });

      return result.sales;
    } catch (error) {
      dispatch({ 
        type: SALES_ACTIONS.SET_ERROR, 
        payload: error.message || 'Failed to fetch sales' 
      });
      return [];
    }
  }, [userType, state.filters]);

  // Get sale by ID
  const getSaleById = useCallback(async (saleId) => {
    if (!userType || !saleId) return null;

    try {
      const sale = await salesService.getSaleById(userType, saleId);
      
      if (sale) {
        dispatch({ type: SALES_ACTIONS.SET_CURRENT_SALE, payload: sale });
        dispatch({ type: SALES_ACTIONS.SET_CURRENT_INVOICE, payload: sale });
      }
      
      return sale;
    } catch (error) {
      dispatch({ 
        type: SALES_ACTIONS.SET_ERROR, 
        payload: error.message || 'Failed to fetch sale' 
      });
      return null;
    }
  }, [userType]);

  // Create invoice/sale
  const createInvoice = useCallback(async (invoiceData) => {
    if (!userType) throw new Error('User type not available');

    try {
      dispatch({ type: SALES_ACTIONS.SET_LOADING, payload: true });
      
      // Calculate totals and GST
      const itemTotal = invoiceData.items.reduce((sum, item) => 
        sum + (item.quantity * item.price), 0
      );
      
      let gstCalculation = { totalGST: 0, gstType: 'no_gst' };
      if (invoiceData.customer.state && itemTotal > 0) {
        gstCalculation = calculateGST(itemTotal, invoiceData.customer.state);
      }

      const totalAmount = itemTotal + gstCalculation.totalGST + (invoiceData.deliveryCharges || 0);

      const completeInvoiceData = {
        ...invoiceData,
        invoiceNumber: await generateInvoiceNumber(),
        subTotal: itemTotal,
        gstAmount: gstCalculation.totalGST,
        totalAmount,
        gstDetails: gstCalculation,
        createdBy: user?.uid,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const newInvoice = await salesService.createSale(userType, completeInvoiceData);

      dispatch({ type: SALES_ACTIONS.ADD_SALE, payload: newInvoice });
      dispatch({ type: SALES_ACTIONS.SET_LOADING, payload: false });
      
      return newInvoice;
    } catch (error) {
      dispatch({ 
        type: SALES_ACTIONS.SET_ERROR, 
        payload: error.message || 'Failed to create invoice' 
      });
      throw error;
    }
  }, [userType, user]);

  // Update invoice/sale
  const updateInvoice = useCallback(async (invoiceId, updates) => {
    if (!userType || !invoiceId) throw new Error('User type and invoice ID required');

    try {
      dispatch({ type: SALES_ACTIONS.SET_LOADING, payload: true });
      
      // Recalculate totals if items changed
      let calculatedUpdates = { ...updates };
      if (updates.items) {
        const itemTotal = updates.items.reduce((sum, item) => 
          sum + (item.quantity * item.price), 0
        );
        
        let gstCalculation = { totalGST: 0, gstType: 'no_gst' };
        if (updates.customer?.state && itemTotal > 0) {
          gstCalculation = calculateGST(itemTotal, updates.customer.state);
        }

        const totalAmount = itemTotal + gstCalculation.totalGST + (updates.deliveryCharges || 0);

        calculatedUpdates = {
          ...updates,
          subTotal: itemTotal,
          gstAmount: gstCalculation.totalGST,
          totalAmount,
          gstDetails: gstCalculation
        };
      }

      const updatedInvoice = await salesService.updateSale(userType, invoiceId, {
        ...calculatedUpdates,
        updatedBy: user?.uid,
        updatedAt: new Date().toISOString()
      });

      dispatch({ type: SALES_ACTIONS.UPDATE_SALE, payload: updatedInvoice });
      dispatch({ type: SALES_ACTIONS.SET_LOADING, payload: false });
      
      return updatedInvoice;
    } catch (error) {
      dispatch({ 
        type: SALES_ACTIONS.SET_ERROR, 
        payload: error.message || 'Failed to update invoice' 
      });
      throw error;
    }
  }, [userType, user]);

  // Delete invoice/sale
  const deleteInvoice = useCallback(async (invoiceId) => {
    if (!userType || !invoiceId) throw new Error('User type and invoice ID required');

    try {
      dispatch({ type: SALES_ACTIONS.SET_LOADING, payload: true });
      
      await salesService.deleteSale(userType, invoiceId);
      
      dispatch({ type: SALES_ACTIONS.DELETE_SALE, payload: invoiceId });
      dispatch({ type: SALES_ACTIONS.SET_LOADING, payload: false });
      
      return true;
    } catch (error) {
      dispatch({ 
        type: SALES_ACTIONS.SET_ERROR, 
        payload: error.message || 'Failed to delete invoice' 
      });
      throw error;
    }
  }, [userType]);

  // Get sales statistics
  const getSalesStatistics = useCallback(async (options = {}) => {
    if (!userType) return null;

    try {
      const stats = await salesService.getSalesStatistics(userType, options);
      dispatch({ type: SALES_ACTIONS.SET_STATISTICS, payload: stats });
      return stats;
    } catch (error) {
      console.error('Get sales statistics error:', error);
      return null;
    }
  }, [userType]);

  // Generate invoice number
  const generateInvoiceNumber = useCallback(async () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const timestamp = now.getTime().toString().slice(-6);
    
    return `INV-${year}${month}-${timestamp}`;
  }, []);

  // Update payment status
  const updatePaymentStatus = useCallback(async (invoiceId, paymentStatus, paymentData = {}) => {
    return updateInvoice(invoiceId, { 
      paymentStatus, 
      ...paymentData,
      paymentUpdatedAt: new Date().toISOString()
    });
  }, [updateInvoice]);

  // Update delivery status
  const updateDeliveryStatus = useCallback(async (invoiceId, deliveryStatus, deliveryData = {}) => {
    return updateInvoice(invoiceId, { 
      deliveryStatus, 
      ...deliveryData,
      deliveryUpdatedAt: new Date().toISOString()
    });
  }, [updateInvoice]);

  const resetState = useCallback(() => {
    dispatch({ type: SALES_ACTIONS.RESET_STATE });
  }, []);

  const contextValue = {
    ...state,
    getSales,
    getSaleById,
    createInvoice,
    updateInvoice,
    deleteInvoice,
    getSalesStatistics,
    updatePaymentStatus,
    updateDeliveryStatus,
    generateInvoiceNumber,
    setFilters,
    clearError,
    setLoading,
    resetState
  };

  return (
    <SalesContext.Provider value={contextValue}>
      {children}
    </SalesContext.Provider>
  );
};

export default SalesProvider;