import React, {
  createContext,
  useContext,
  useReducer,
  useCallback,
} from "react";
import salesService from "../../services/api/salesService";
import { useUserType } from "../UserTypeContext/UserTypeContext";
import { useAuth } from "../AuthContext/AuthContext";

import {
  PAYMENT_STATUS,
} from '../../utils/constants/appConstants';

// Initial state - simplified for client-side filtering
const initialState = {
  sales: [],
  currentInvoice: null,
  loading: false,
  error: null,
  stats: {
    totalSales: 0,
    totalAmount: 0,
    todaysSales: 0,
    todaysAmount: 0,
    pendingPayments: 0,
    pendingDeliveries: 0,
    paidInvoices: 0,
    emiInvoices: 0,
  },
  notifications: {
    pendingEMIs: [],
    pendingDeliveries: [],
  },
};

// Action types
const SALES_ACTIONS = {
  SET_LOADING: "SET_LOADING",
  SET_SALES: "SET_SALES",
  SET_CURRENT_INVOICE: "SET_CURRENT_INVOICE",
  ADD_SALE: "ADD_SALE",
  UPDATE_SALE: "UPDATE_SALE",
  DELETE_SALE: "DELETE_SALE",
  SET_ERROR: "SET_ERROR",
  CLEAR_ERROR: "CLEAR_ERROR",
  SET_STATS: "SET_STATS",
  SET_NOTIFICATIONS: "SET_NOTIFICATIONS",
  RESET_STATE: "RESET_STATE",
};

// Reducer
const salesReducer = (state, action) => {
  switch (action.type) {
    case SALES_ACTIONS.SET_LOADING:
      return {
        ...state,
        loading: action.payload,
        error: action.payload ? null : state.error,
      };

    case SALES_ACTIONS.SET_SALES:
      return {
        ...state,
        sales: action.payload || [],
        loading: false,
        error: null,
      };

    case SALES_ACTIONS.SET_CURRENT_INVOICE:
      return {
        ...state,
        currentInvoice: action.payload,
        loading: false,
        error: null,
      };

    case SALES_ACTIONS.ADD_SALE:
      return {
        ...state,
        sales: [action.payload, ...state.sales],
        loading: false,
        error: null,
      };

    case SALES_ACTIONS.UPDATE_SALE:
      return {
        ...state,
        sales: state.sales.map((sale) =>
          sale.id === action.payload.id ? action.payload : sale
        ),
        currentInvoice:
          state.currentInvoice?.id === action.payload.id
            ? action.payload
            : state.currentInvoice,
        loading: false,
        error: null,
      };

    case SALES_ACTIONS.DELETE_SALE:
      return {
        ...state,
        sales: state.sales.filter((sale) => sale.id !== action.payload),
        currentInvoice:
          state.currentInvoice?.id === action.payload
            ? null
            : state.currentInvoice,
        loading: false,
        error: null,
      };

    case SALES_ACTIONS.SET_ERROR:
      return {
        ...state,
        error: action.payload,
        loading: false,
      };

    case SALES_ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        error: null,
      };

    case SALES_ACTIONS.SET_STATS:
      return {
        ...state,
        stats: action.payload,
      };

    case SALES_ACTIONS.SET_NOTIFICATIONS:
      return {
        ...state,
        notifications: action.payload,
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
    throw new Error("useSales must be used within a SalesProvider");
  }
  return context;
};

// Sales Provider component
export const SalesProvider = ({ children }) => {
  const [state, dispatch] = useReducer(salesReducer, initialState);
  const { userType } = useUserType();
  const { user } = useAuth();

  // Load all sales - simplified for client-side filtering
  const loadSales = useCallback(async () => {
    if (!userType) {
      dispatch({
        type: SALES_ACTIONS.SET_ERROR,
        payload: "User type not available",
      });
      return;
    }

    try {
      dispatch({ type: SALES_ACTIONS.SET_LOADING, payload: true });
      const sales = await salesService.getSales(userType);
      dispatch({ type: SALES_ACTIONS.SET_SALES, payload: sales });
    } catch (error) {
      dispatch({ type: SALES_ACTIONS.SET_ERROR, payload: error.message });
    }
  }, [userType]);

  // Get invoice by ID
  const getInvoiceById = useCallback(
    async (invoiceId) => {
      if (!userType || !invoiceId) {
        dispatch({
          type: SALES_ACTIONS.SET_ERROR,
          payload: "Invalid parameters",
        });
        return null;
      }

      try {
        dispatch({ type: SALES_ACTIONS.SET_LOADING, payload: true });

        const invoice = await salesService.getInvoiceById(userType, invoiceId);
        if (invoice) {
          dispatch({
            type: SALES_ACTIONS.SET_CURRENT_INVOICE,
            payload: invoice,
          });
        } else {
          dispatch({
            type: SALES_ACTIONS.SET_ERROR,
            payload: "Invoice not found",
          });
        }

        return invoice;
      } catch (error) {
        dispatch({ type: SALES_ACTIONS.SET_ERROR, payload: error.message });
        return null;
      }
    },
    [userType]
  );

  // Create invoice
  const createInvoice = useCallback(
    async (invoiceData) => {
      if (!userType) {
        dispatch({
          type: SALES_ACTIONS.SET_ERROR,
          payload: "User type not available",
        });
        return null;
      }

      try {
        dispatch({ type: SALES_ACTIONS.SET_LOADING, payload: true });

        // Add created by info
        const invoiceWithMeta = {
          ...invoiceData,
          createdBy: user?.uid,
          createdByName: user?.name,
        };

        const newInvoice = await salesService.createInvoice(
          userType,
          invoiceWithMeta
        );
        dispatch({ type: SALES_ACTIONS.ADD_SALE, payload: newInvoice });

        return newInvoice;
      } catch (error) {
        dispatch({ type: SALES_ACTIONS.SET_ERROR, payload: error.message });
        return null;
      }
    },
    [userType, user]
  );

  // Update invoice
  const updateInvoice = useCallback(
    async (invoiceId, updates) => {
      if (!userType || !invoiceId) {
        dispatch({
          type: SALES_ACTIONS.SET_ERROR,
          payload: "Invalid parameters",
        });
        return null;
      }

      try {
        dispatch({ type: SALES_ACTIONS.SET_LOADING, payload: true });

        // Add updated by info
        const updatesWithMeta = {
          ...updates,
          updatedBy: user?.uid,
          updatedByName: user?.name,
        };

        const updatedInvoice = await salesService.updateInvoice(
          userType,
          invoiceId,
          updatesWithMeta
        );
        dispatch({ type: SALES_ACTIONS.UPDATE_SALE, payload: updatedInvoice });

        return updatedInvoice;
      } catch (error) {
        dispatch({ type: SALES_ACTIONS.SET_ERROR, payload: error.message });
        return null;
      }
    },
    [userType, user]
  );

  // Delete invoice
  const deleteInvoice = useCallback(
    async (invoiceId) => {
      if (!userType || !invoiceId) {
        dispatch({
          type: SALES_ACTIONS.SET_ERROR,
          payload: "Invalid parameters",
        });
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
    },
    [userType]
  );

  // Update payment status
  const updatePaymentStatus = useCallback(
    async (invoiceId, paymentStatus, paymentDetails = {}) => {
      if (!userType || !invoiceId) {
        return null;
      }

      try {
        dispatch({ type: SALES_ACTIONS.SET_LOADING, payload: true });

        const updatedInvoice = await salesService.updatePaymentStatus(
          userType,
          invoiceId,
          paymentStatus,
          paymentDetails
        );
        dispatch({ type: SALES_ACTIONS.UPDATE_SALE, payload: updatedInvoice });

        return updatedInvoice;
      } catch (error) {
        dispatch({ type: SALES_ACTIONS.SET_ERROR, payload: error.message });
        return null;
      }
    },
    [userType]
  );

  // Update delivery status
  const updateDeliveryStatus = useCallback(
    async (invoiceId, deliveryStatus, deliveryDetails = {}) => {
      if (!userType || !invoiceId) {
        return null;
      }

      try {
        dispatch({ type: SALES_ACTIONS.SET_LOADING, payload: true });

        const updatedInvoice = await salesService.updateDeliveryStatus(
          userType,
          invoiceId,
          deliveryStatus,
          deliveryDetails
        );
        dispatch({ type: SALES_ACTIONS.UPDATE_SALE, payload: updatedInvoice });

        return updatedInvoice;
      } catch (error) {
        dispatch({ type: SALES_ACTIONS.SET_ERROR, payload: error.message });
        return null;
      }
    },
    [userType]
  );

  // Update EMI payment
  const updateEMIPayment = useCallback(
    async (invoiceId, emiIndex, paymentDetails) => {
      if (!userType || !invoiceId) {
        return null;
      }

      try {
        dispatch({ type: SALES_ACTIONS.SET_LOADING, payload: true });

        const updatedInvoice = await salesService.updateEMIPayment(
          userType,
          invoiceId,
          emiIndex,
          paymentDetails
        );
        dispatch({ type: SALES_ACTIONS.UPDATE_SALE, payload: updatedInvoice });

        return updatedInvoice;
      } catch (error) {
        dispatch({ type: SALES_ACTIONS.SET_ERROR, payload: error.message });
        return null;
      }
    },
    [userType]
  );

  // Load sales statistics
  const loadSalesStats = useCallback(async () => {
    if (!userType) {
      return;
    }

    try {
      const stats = await salesService.getSalesStats(userType);
      dispatch({ type: SALES_ACTIONS.SET_STATS, payload: stats });
    } catch (error) {
      console.error("Error loading sales stats:", error);
    }
  }, [userType]);

  // Load notifications (pending EMIs and deliveries)
  const loadNotifications = useCallback(async () => {
    if (!userType) {
      return;
    }

    try {
      const [pendingEMIs, pendingDeliveries] = await Promise.all([
        salesService.getPendingEMIPayments(userType),
        salesService.getPendingDeliveries(userType),
      ]);

      dispatch({
        type: SALES_ACTIONS.SET_NOTIFICATIONS,
        payload: {
          pendingEMIs,
          pendingDeliveries,
        },
      });
    } catch (error) {
      console.error("Error loading notifications:", error);
    }
  }, [userType]);

  // Get customer purchase history
  const getCustomerPurchaseHistory = useCallback(
    async (customerId) => {
      if (!userType || !customerId) {
        return [];
      }

      try {
        return await salesService.getCustomerPurchaseHistory(
          userType,
          customerId
        );
      } catch (error) {
        dispatch({ type: SALES_ACTIONS.SET_ERROR, payload: error.message });
        return [];
      }
    },
    [userType]
  );

  // Get sales by date range
  const getSalesByDateRange = useCallback(
    async (startDate, endDate) => {
      if (!userType) {
        return [];
      }

      try {
        return await salesService.getSalesByDateRange(
          userType,
          startDate,
          endDate
        );
      } catch (error) {
        dispatch({ type: SALES_ACTIONS.SET_ERROR, payload: error.message });
        return [];
      }
    },
    [userType]
  );

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

 const recordInstallmentPayment = useCallback(
    async (
      invoiceId,
      installmentNumber,
      paymentAmount,
      paymentDetails = {}
    ) => {
      if (!userType || !invoiceId) {
        dispatch({
          type: SALES_ACTIONS.SET_ERROR,
          payload: "Invalid parameters",
        });
        return null;
      }

      try {
        dispatch({ type: SALES_ACTIONS.SET_LOADING, payload: true });

        // Add recorded by info
        const paymentDetailsWithMeta = {
          ...paymentDetails,
          recordedBy: user?.uid,
          recordedByName: user?.name,
        };

        const updatedInvoice = await salesService.recordInstallmentPayment(
          userType,
          invoiceId,
          installmentNumber,
          paymentAmount,
          paymentDetailsWithMeta
        );

        dispatch({ type: SALES_ACTIONS.UPDATE_SALE, payload: updatedInvoice });

        // IMPORTANT: Auto-cleanup notifications for this paid installment
        try {
          // Import the notification generator dynamically to avoid circular imports
          const { default: emiNotificationGenerator } = await import('../services/emiNotificationGenerator');
          
          // Clean up any notifications for this specific paid installment
          await emiNotificationGenerator.cleanupPaidInstallmentNotifications(userType, user?.uid);
          
          console.log('Auto-cleaned up notifications for paid installment');
        } catch (notificationError) {
          console.warn('Could not cleanup notifications automatically:', notificationError);
          // Don't fail the payment recording if notification cleanup fails
        }

        return updatedInvoice;
      } catch (error) {
        dispatch({ type: SALES_ACTIONS.SET_ERROR, payload: error.message });
        return null;
      }
    },
    [userType, user]
  );

  // Get installment payment history
  const getInstallmentPaymentHistory = useCallback(
    async (invoiceId) => {
      if (!userType || !invoiceId) {
        return [];
      }

      try {
        return await salesService.getInstallmentPaymentHistory(
          userType,
          invoiceId
        );
      } catch (error) {
        dispatch({ type: SALES_ACTIONS.SET_ERROR, payload: error.message });
        return [];
      }
    },
    [userType]
  );

  // Get pending installments
  const getPendingInstallments = useCallback(
    async (invoiceId) => {
      if (!userType || !invoiceId) {
        return [];
      }

      try {
        return await salesService.getPendingInstallments(userType, invoiceId);
      } catch (error) {
        dispatch({ type: SALES_ACTIONS.SET_ERROR, payload: error.message });
        return [];
      }
    },
    [userType]
  );

  // Update installment due date
  const updateInstallmentDueDate = useCallback(
    async (invoiceId, installmentNumber, newDueDate) => {
      if (!userType || !invoiceId) {
        return null;
      }

      try {
        dispatch({ type: SALES_ACTIONS.SET_LOADING, payload: true });

        const updatedInvoice = await salesService.updateInstallmentDueDate(
          userType,
          invoiceId,
          installmentNumber,
          newDueDate
        );

        dispatch({ type: SALES_ACTIONS.UPDATE_SALE, payload: updatedInvoice });

        return updatedInvoice;
      } catch (error) {
        dispatch({ type: SALES_ACTIONS.SET_ERROR, payload: error.message });
        return null;
      }
    },
    [userType]
  );

  // Get EMI summary
  const getEMISummary = useCallback(
    async (invoiceId) => {
      if (!userType || !invoiceId) {
        return null;
      }

      try {
        return await salesService.getEMISummary(userType, invoiceId);
      } catch (error) {
        dispatch({ type: SALES_ACTIONS.SET_ERROR, payload: error.message });
        return null;
      }
    },
    [userType]
  );

  // Get all pending EMIs across all invoices (for notifications)
  const getAllPendingEMIs = useCallback(async () => {
    if (!userType) {
      return [];
    }

    try {
      const emiInvoices = state.sales.filter(
        (sale) => sale.paymentStatus === PAYMENT_STATUS.EMI
      );

      const allPendingEMIs = [];

      for (const invoice of emiInvoices) {
        if (invoice.emiDetails && invoice.emiDetails.schedule) {
          const today = new Date();

          const pendingInstallments = invoice.emiDetails.schedule
            .filter((installment) => !installment.paid)
            .map((installment) => {
              const dueDate = new Date(installment.dueDate);
              const daysDiff = Math.ceil(
                (dueDate - today) / (1000 * 60 * 60 * 24)
              );

              return {
                ...installment,
                invoiceId: invoice.id,
                invoiceNumber: invoice.invoiceNumber,
                customerId: invoice.customerId,
                customerName: invoice.customerName,
                customerPhone: invoice.customerPhone,
                daysDiff,
                isOverdue: daysDiff < 0,
                isDueToday: daysDiff === 0,
                isDueSoon: daysDiff > 0 && daysDiff <= 7,
              };
            });

          allPendingEMIs.push(...pendingInstallments);
        }
      }

      // Sort by due date
      return allPendingEMIs.sort(
        (a, b) => new Date(a.dueDate) - new Date(b.dueDate)
      );
    } catch (error) {
      console.error("Error getting all pending EMIs:", error);
      return [];
    }
  }, [userType, state.sales]);
  // Context value
  const value = {
    // State
    sales: state.sales,
    currentInvoice: state.currentInvoice,
    loading: state.loading,
    error: state.error,
    stats: state.stats,
    notifications: state.notifications,

    // Actions
    loadSales,
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

    // Utilities
    clearError,
    resetState,
    setCurrentInvoice,

    // New installment payment methods
    recordInstallmentPayment,
    getInstallmentPaymentHistory,
    getPendingInstallments,
    updateInstallmentDueDate,
    getEMISummary,
    getAllPendingEMIs,
  };

  return (
    <SalesContext.Provider value={value}>{children}</SalesContext.Provider>
  );
};

export default SalesContext;
