// src/contexts/SalesContext/SalesProvider.js
// COMPLETE VERSION - ALL existing methods preserved + new pagination
import React, { createContext, useReducer, useCallback, useContext } from 'react';
import salesService from '../../services/api/salesService';
import optimizedSalesService from '../../services/api/optimizedSalesService';
import { useUserType } from '../UserTypeContext/UserTypeContext';
import { useAuth } from '../AuthContext/AuthContext';
import { calculateGST } from '../../utils/helpers/gstCalculator';

// Action types
export const SALES_ACTIONS = {
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
  SET_STATS: 'SET_STATS',
  SET_NOTIFICATIONS: 'SET_NOTIFICATIONS',
  RESET_STATE: 'RESET_STATE',
};

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
    hasMore: false,
  },
  filters: {
    paymentStatus: '',
    deliveryStatus: '',
    dateFrom: null,
    dateTo: null,
    customerId: '',
    searchTerm: '',
  },
  statistics: null,
  stats: null,
  notifications: {
    pendingEMIs: [],
    pendingDeliveries: [],
  },
};

const salesReducer = (state, action) => {
  switch (action.type) {
    case SALES_ACTIONS.SET_LOADING:
      return { ...state, loading: action.payload };

    case SALES_ACTIONS.SET_ERROR:
      return { ...state, error: action.payload, loading: false };

    case SALES_ACTIONS.CLEAR_ERROR:
      return { ...state, error: null };

    case SALES_ACTIONS.SET_SALES:
      return { ...state, sales: action.payload, loading: false, error: null };

    case SALES_ACTIONS.SET_INVOICES:
      return { ...state, invoices: action.payload, loading: false, error: null };

    case SALES_ACTIONS.ADD_SALE:
      return {
        ...state,
        sales: [action.payload, ...state.sales],
        invoices: [action.payload, ...state.invoices],
        error: null,
      };

    case SALES_ACTIONS.UPDATE_SALE:
      return {
        ...state,
        sales: state.sales.map((sale) => (sale.id === action.payload.id ? action.payload : sale)),
        invoices: state.invoices.map((invoice) =>
          invoice.id === action.payload.id ? action.payload : invoice
        ),
        currentSale:
          state.currentSale?.id === action.payload.id ? action.payload : state.currentSale,
        currentInvoice:
          state.currentInvoice?.id === action.payload.id ? action.payload : state.currentInvoice,
        error: null,
      };

    case SALES_ACTIONS.DELETE_SALE:
      return {
        ...state,
        sales: state.sales.filter((sale) => sale.id !== action.payload),
        invoices: state.invoices.filter((invoice) => invoice.id !== action.payload),
        currentSale: state.currentSale?.id === action.payload ? null : state.currentSale,
        currentInvoice: state.currentInvoice?.id === action.payload ? null : state.currentInvoice,
        error: null,
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
      return { ...state, statistics: action.payload };

    case SALES_ACTIONS.SET_STATS:
      return { ...state, stats: action.payload };

    case SALES_ACTIONS.SET_NOTIFICATIONS:
      return { ...state, notifications: action.payload };

    case SALES_ACTIONS.RESET_STATE:
      return initialState;

    default:
      return state;
  }
};

const SalesContext = createContext();

export const useSales = () => {
  const context = useContext(SalesContext);
  if (!context) {
    throw new Error('useSales must be used within a SalesProvider');
  }
  return context;
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

  const setCurrentInvoice = useCallback((invoice) => {
    dispatch({ type: SALES_ACTIONS.SET_CURRENT_INVOICE, payload: invoice });
  }, []);

  // EXISTING METHOD - Get sales/invoices
  const loadSales = useCallback(
    async (options = {}) => {
      if (!userType) {
        dispatch({ type: SALES_ACTIONS.SET_ERROR, payload: 'User type not available' });
        return [];
      }

      try {
        dispatch({ type: SALES_ACTIONS.SET_LOADING, payload: true });

        const result = await optimizedSalesService.getSales(userType, {
          ...state.filters,
          ...options,
        });

        dispatch({ type: SALES_ACTIONS.SET_SALES, payload: result.sales });
        dispatch({ type: SALES_ACTIONS.SET_INVOICES, payload: result.sales });
        dispatch({
          type: SALES_ACTIONS.SET_PAGINATION,
          payload: {
            currentPage: result.currentPage,
            totalPages: result.totalPages,
            total: result.total,
            hasMore: result.hasMore,
          },
        });

        return result.sales;
      } catch (error) {
        dispatch({ type: SALES_ACTIONS.SET_ERROR, payload: error.message });
        return [];
      }
    },
    [userType, state.filters]
  );

  // NEW METHOD - Get sales with pagination (for listing views)
  const getSalesPaginated = useCallback(
    async (options = {}) => {
      if (!userType) {
        dispatch({ type: SALES_ACTIONS.SET_ERROR, payload: 'User type not available' });
        return { sales: [], total: 0 };
      }

      try {
        dispatch({ type: SALES_ACTIONS.SET_LOADING, payload: true });

        const result = await optimizedSalesService.getSalesPaginated(userType, {
          ...state.filters,
          ...options,
        });

        dispatch({ type: SALES_ACTIONS.SET_SALES, payload: result.sales });
        dispatch({ type: SALES_ACTIONS.SET_INVOICES, payload: result.sales });
        dispatch({
          type: SALES_ACTIONS.SET_PAGINATION,
          payload: {
            currentPage: result.currentPage,
            totalPages: result.totalPages,
            total: result.total,
            hasMore: result.hasMore,
          },
        });

        return result;
      } catch (error) {
        dispatch({ type: SALES_ACTIONS.SET_ERROR, payload: error.message });
        return { sales: [], total: 0 };
      }
    },
    [userType, state.filters]
  );

  // NEW METHOD - Get all sales (for stats/analytics)
  const getSalesAll = useCallback(
    async (options = {}) => {
      if (!userType) return [];

      try {
        const result = await optimizedSalesService.getSales(userType, {
          ...options,
          limit: null,
        });
        return result.sales;
      } catch (error) {
        console.error('Error getting all sales:', error);
        return [];
      }
    },
    [userType]
  );

  // EXISTING METHOD - Get sale by ID
  const getSaleById = useCallback(
    async (saleId) => {
      if (!userType || !saleId) return null;

      try {
        const sale = await salesService.getById(userType, saleId);
        dispatch({ type: SALES_ACTIONS.SET_CURRENT_SALE, payload: sale });
        dispatch({ type: SALES_ACTIONS.SET_CURRENT_INVOICE, payload: sale });
        return sale;
      } catch (error) {
        dispatch({ type: SALES_ACTIONS.SET_ERROR, payload: error.message });
        return null;
      }
    },
    [userType]
  );

  // EXISTING METHOD - Get invoice by ID
  const getInvoiceById = useCallback(
    async (invoiceId) => {
      return getSaleById(invoiceId);
    },
    [getSaleById]
  );

  // EXISTING METHOD - Create invoice
  const createInvoice = useCallback(
    async (invoiceData) => {
      if (!userType || !user) throw new Error('User type and user required');

      try {
        dispatch({ type: SALES_ACTIONS.SET_LOADING, payload: true });

        const newInvoice = await salesService.create(userType, {
          ...invoiceData,
          createdBy: user.uid,
          createdByName: user.displayName || user.email,
          createdAt: new Date().toISOString(),
        });

        dispatch({ type: SALES_ACTIONS.ADD_SALE, payload: newInvoice });
        optimizedSalesService.clearCache(userType);

        return newInvoice;
      } catch (error) {
        dispatch({
          type: SALES_ACTIONS.SET_ERROR,
          payload: error.message || 'Failed to create invoice',
        });
        throw error;
      }
    },
    [userType, user]
  );

  // EXISTING METHOD - Update invoice
  const updateInvoice = useCallback(
    async (invoiceId, updates) => {
      if (!userType || !invoiceId) throw new Error('User type and invoice ID required');

      try {
        dispatch({ type: SALES_ACTIONS.SET_LOADING, payload: true });

        let calculatedUpdates = { ...updates };
        if (updates.items) {
          const itemTotal = updates.items.reduce(
            (sum, item) => sum + item.quantity * item.price,
            0
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
            gstDetails: gstCalculation,
          };
        }

        const updatedInvoice = await salesService.update(userType, invoiceId, {
          ...calculatedUpdates,
          updatedBy: user?.uid,
          updatedAt: new Date().toISOString(),
        });

        dispatch({ type: SALES_ACTIONS.UPDATE_SALE, payload: updatedInvoice });
        optimizedSalesService.clearCache(userType);

        return updatedInvoice;
      } catch (error) {
        dispatch({
          type: SALES_ACTIONS.SET_ERROR,
          payload: error.message || 'Failed to update invoice',
        });
        throw error;
      }
    },
    [userType, user]
  );

  // EXISTING METHOD - Delete invoice
  const deleteInvoice = useCallback(
    async (invoiceId) => {
      if (!userType || !invoiceId) throw new Error('User type and invoice ID required');

      try {
        dispatch({ type: SALES_ACTIONS.SET_LOADING, payload: true });

        await salesService.delete(userType, invoiceId);

        dispatch({ type: SALES_ACTIONS.DELETE_SALE, payload: invoiceId });
        optimizedSalesService.clearCache(userType);

        return true;
      } catch (error) {
        dispatch({
          type: SALES_ACTIONS.SET_ERROR,
          payload: error.message || 'Failed to delete invoice',
        });
        throw error;
      }
    },
    [userType]
  );

  // EXISTING METHOD - Get sales statistics
  const getSalesStatistics = useCallback(
    async (options = {}) => {
      if (!userType) return null;

      try {
        const stats = await salesService.getSalesStatistics(userType, options);
        dispatch({ type: SALES_ACTIONS.SET_STATISTICS, payload: stats });
        return stats;
      } catch (error) {
        console.error('Get sales statistics error:', error);
        return null;
      }
    },
    [userType]
  );

  // EXISTING METHOD - Load sales stats
  const loadSalesStats = useCallback(async () => {
    if (!userType) return;

    try {
      const stats = await optimizedSalesService.getSalesStats(userType);
      dispatch({ type: SALES_ACTIONS.SET_STATS, payload: stats });
      return stats;
    } catch (error) {
      console.error('Error loading sales stats:', error);
      return null;
    }
  }, [userType]);

  // NEW METHOD - Get sales stats (non-loading version)
  const getSalesStats = useCallback(async () => {
    if (!userType) return null;

    try {
      const stats = await optimizedSalesService.getSalesStats(userType);
      return stats;
    } catch (error) {
      console.error('Error getting sales stats:', error);
      return null;
    }
  }, [userType]);

  // EXISTING METHOD - Generate invoice number
  const generateInvoiceNumber = useCallback(async () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const timestamp = now.getTime().toString().slice(-6);

    return `INV-${year}${month}-${timestamp}`;
  }, []);

  // EXISTING METHOD - Preview invoice number
  const previewInvoiceNumber = useCallback(
    async (includeGST) => {
      if (!userType) return null;

      try {
        const prefix =
          userType === 'electronics'
            ? includeGST
              ? 'EL_GST_'
              : 'EL_NGST_'
            : includeGST
            ? 'FN_GST_'
            : 'FN_NGST_';

        const allInvoices = await salesService.getSales(userType);
        let maxSequence = 0;

        if (allInvoices && allInvoices.length > 0) {
          allInvoices.forEach((invoice) => {
            if (invoice.invoiceNumber?.startsWith(prefix)) {
              const match = invoice.invoiceNumber.match(/(\d{3})$/);
              if (match) {
                const sequence = parseInt(match[1]);
                if (sequence > maxSequence) {
                  maxSequence = sequence;
                }
              }
            }
          });
        }

        const nextSequence = maxSequence + 1;
        const sequenceStr = String(nextSequence).padStart(3, '0');

        return `${prefix}${sequenceStr}`;
      } catch (error) {
        console.error('Error previewing invoice number:', error);
        return null;
      }
    },
    [userType]
  );

  // EXISTING METHOD - Update payment status
  const updatePaymentStatus = useCallback(
    async (invoiceId, paymentStatus, paymentData = {}) => {
      return updateInvoice(invoiceId, {
        paymentStatus,
        ...paymentData,
        paymentUpdatedAt: new Date().toISOString(),
      });
    },
    [updateInvoice]
  );

  // EXISTING METHOD - Update delivery status
  const updateDeliveryStatus = useCallback(
    async (invoiceId, deliveryStatus, deliveryDetails = {}) => {
      if (!userType || !invoiceId) return null;

      try {
        dispatch({ type: SALES_ACTIONS.SET_LOADING, payload: true });

        const updatedInvoice = await salesService.updateDeliveryStatus(
          userType,
          invoiceId,
          deliveryStatus,
          deliveryDetails
        );

        if (updatedInvoice) {
          dispatch({ type: SALES_ACTIONS.UPDATE_SALE, payload: updatedInvoice });
        }

        return updatedInvoice;
      } catch (error) {
        dispatch({ type: SALES_ACTIONS.SET_ERROR, payload: error.message });
        return null;
      }
    },
    [userType]
  );

  // EXISTING METHOD - Update EMI payment
  const updateEMIPayment = useCallback(
    async (invoiceId, emiIndex, paymentDetails) => {
      if (!userType || !invoiceId) return null;

      try {
        dispatch({ type: SALES_ACTIONS.SET_LOADING, payload: true });

        const updatedInvoice = await salesService.updateEMIPayment(
          userType,
          invoiceId,
          emiIndex,
          paymentDetails
        );

        if (updatedInvoice) {
          dispatch({ type: SALES_ACTIONS.UPDATE_SALE, payload: updatedInvoice });
        }

        return updatedInvoice;
      } catch (error) {
        dispatch({ type: SALES_ACTIONS.SET_ERROR, payload: error.message });
        return null;
      }
    },
    [userType]
  );

  // EXISTING METHOD - Load notifications
  const loadNotifications = useCallback(async () => {
    if (!userType) return;

    try {
      const [pendingEMIs, pendingDeliveries] = await Promise.all([
        salesService.getPendingEMIPayments(userType),
        optimizedSalesService.getPendingDeliveries(userType),
      ]);

      dispatch({
        type: SALES_ACTIONS.SET_NOTIFICATIONS,
        payload: {
          pendingEMIs,
          pendingDeliveries,
        },
      });
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  }, [userType]);

  // EXISTING METHOD - Get customer purchase history
  const getCustomerPurchaseHistory = useCallback(
    async (customerId) => {
      if (!userType || !customerId) return [];

      try {
        return await salesService.getCustomerPurchaseHistory(userType, customerId);
      } catch (error) {
        dispatch({ type: SALES_ACTIONS.SET_ERROR, payload: error.message });
        return [];
      }
    },
    [userType]
  );

  // EXISTING METHOD - Get sales by date range
  const getSalesByDateRange = useCallback(
    async (startDate, endDate) => {
      if (!userType) return [];

      try {
        return await salesService.getSalesByDateRange(userType, startDate, endDate);
      } catch (error) {
        dispatch({ type: SALES_ACTIONS.SET_ERROR, payload: error.message });
        return [];
      }
    },
    [userType]
  );

  // EXISTING METHOD - Record installment payment
  const recordInstallmentPayment = useCallback(
    async (invoiceId, installmentData) => {
      if (!userType || !invoiceId) return null;

      try {
        const updatedInvoice = await salesService.recordInstallmentPayment(
          userType,
          invoiceId,
          installmentData
        );

        if (updatedInvoice) {
          dispatch({ type: SALES_ACTIONS.UPDATE_SALE, payload: updatedInvoice });
        }

        return updatedInvoice;
      } catch (error) {
        dispatch({ type: SALES_ACTIONS.SET_ERROR, payload: error.message });
        return null;
      }
    },
    [userType]
  );

  // EXISTING METHOD - Get installment payment history
  const getInstallmentPaymentHistory = useCallback(
    async (invoiceId) => {
      if (!userType || !invoiceId) return [];

      try {
        return await salesService.getInstallmentPaymentHistory(userType, invoiceId);
      } catch (error) {
        console.error('Error getting installment history:', error);
        return [];
      }
    },
    [userType]
  );

  // EXISTING METHOD - Get pending installments
  const getPendingInstallments = useCallback(async () => {
    if (!userType) return [];

    try {
      return await salesService.getPendingInstallments(userType);
    } catch (error) {
      console.error('Error getting pending installments:', error);
      return [];
    }
  }, [userType]);

  // EXISTING METHOD - Update installment due date
  const updateInstallmentDueDate = useCallback(
    async (invoiceId, installmentIndex, newDueDate) => {
      if (!userType || !invoiceId) return null;

      try {
        const updatedInvoice = await salesService.updateInstallmentDueDate(
          userType,
          invoiceId,
          installmentIndex,
          newDueDate
        );

        if (updatedInvoice) {
          dispatch({ type: SALES_ACTIONS.UPDATE_SALE, payload: updatedInvoice });
        }

        return updatedInvoice;
      } catch (error) {
        dispatch({ type: SALES_ACTIONS.SET_ERROR, payload: error.message });
        return null;
      }
    },
    [userType]
  );

  // EXISTING METHOD - Get EMI summary
  const getEMISummary = useCallback(
    async (invoiceId) => {
      if (!userType || !invoiceId) return null;

      try {
        return await salesService.getEMISummary(userType, invoiceId);
      } catch (error) {
        console.error('Error getting EMI summary:', error);
        return null;
      }
    },
    [userType]
  );

  // EXISTING METHOD - Get all pending EMIs
  const getAllPendingEMIs = useCallback(async () => {
    if (!userType) return [];

    try {
      return await salesService.getAllPendingEMIs(userType);
    } catch (error) {
      console.error('Error getting pending EMIs:', error);
      return [];
    }
  }, [userType]);

  // EXISTING METHOD - Update exchange item status
  const updateExchangeItemStatus = useCallback(
    async (invoiceId, exchangeData) => {
      if (!userType || !invoiceId) return null;

      try {
        const updatedInvoice = await salesService.updateExchangeItemStatus(
          userType,
          invoiceId,
          exchangeData
        );

        if (updatedInvoice) {
          dispatch({ type: SALES_ACTIONS.UPDATE_SALE, payload: updatedInvoice });
        }

        return updatedInvoice;
      } catch (error) {
        dispatch({ type: SALES_ACTIONS.SET_ERROR, payload: error.message });
        return null;
      }
    },
    [userType]
  );

  // EXISTING METHOD - Get pending exchanges
  const getPendingExchanges = useCallback(async () => {
    if (!userType) return [];

    try {
      return await salesService.getPendingExchanges(userType);
    } catch (error) {
      console.error('Error getting pending exchanges:', error);
      return [];
    }
  }, [userType]);

  // EXISTING METHOD - Reset state
  const resetState = useCallback(() => {
    dispatch({ type: SALES_ACTIONS.RESET_STATE });
  }, []);

  const value = {
    // State
    ...state,

    // Existing methods
    loadSales,
    getSaleById,
    getInvoiceById,
    createInvoice,
    updateInvoice,
    deleteInvoice,
    getSalesStatistics,
    loadSalesStats,
    updatePaymentStatus,
    updateDeliveryStatus,
    updateEMIPayment,
    loadNotifications,
    getCustomerPurchaseHistory,
    getSalesByDateRange,
    previewInvoiceNumber,
    recordInstallmentPayment,
    getInstallmentPaymentHistory,
    getPendingInstallments,
    updateInstallmentDueDate,
    getEMISummary,
    getAllPendingEMIs,
    updateExchangeItemStatus,
    getPendingExchanges,
    generateInvoiceNumber,
    setFilters,
    clearError,
    setLoading,
    resetState,
    setCurrentInvoice,

    // NEW methods for pagination
    getSalesPaginated, // Use for listing views
    getSalesAll, // Use for stats/analytics
    getSalesStats, // Get stats without loading
  };

  return <SalesContext.Provider value={value}>{children}</SalesContext.Provider>;
};

export { SalesContext, SalesProvider };
export default SalesProvider;
