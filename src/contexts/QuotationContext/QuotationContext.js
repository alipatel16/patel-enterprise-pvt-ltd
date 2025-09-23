import React, {
  createContext,
  useContext,
  useReducer,
  useCallback,
} from "react";
import quotationService from "../../services/api/quotationService";
import { useUserType } from "../UserTypeContext/UserTypeContext";
import { useAuth } from "../AuthContext/AuthContext";

// Initial state
const initialState = {
  quotations: [],
  currentQuotation: null,
  loading: false,
  error: null,
  stats: {
    totalQuotations: 0,
    totalAmount: 0,
    todaysQuotations: 0,
    todaysAmount: 0,
    activeQuotations: 0,
    convertedQuotations: 0,
    expiredQuotations: 0,
    conversionRate: 0,
  },
};

// Action types
const QUOTATION_ACTIONS = {
  SET_LOADING: "SET_LOADING",
  SET_QUOTATIONS: "SET_QUOTATIONS",
  SET_CURRENT_QUOTATION: "SET_CURRENT_QUOTATION",
  ADD_QUOTATION: "ADD_QUOTATION",
  UPDATE_QUOTATION: "UPDATE_QUOTATION",
  DELETE_QUOTATION: "DELETE_QUOTATION",
  SET_ERROR: "SET_ERROR",
  CLEAR_ERROR: "CLEAR_ERROR",
  SET_STATS: "SET_STATS",
  RESET_STATE: "RESET_STATE",
};

// Reducer
const quotationReducer = (state, action) => {
  switch (action.type) {
    case QUOTATION_ACTIONS.SET_LOADING:
      return {
        ...state,
        loading: action.payload,
        error: action.payload ? null : state.error,
      };

    case QUOTATION_ACTIONS.SET_QUOTATIONS:
      return {
        ...state,
        quotations: action.payload || [],
        loading: false,
        error: null,
      };

    case QUOTATION_ACTIONS.SET_CURRENT_QUOTATION:
      return {
        ...state,
        currentQuotation: action.payload,
        loading: false,
        error: null,
      };

    case QUOTATION_ACTIONS.ADD_QUOTATION:
      return {
        ...state,
        quotations: [action.payload, ...state.quotations],
        loading: false,
        error: null,
      };

    case QUOTATION_ACTIONS.UPDATE_QUOTATION:
      return {
        ...state,
        quotations: state.quotations.map((quotation) =>
          quotation.id === action.payload.id ? action.payload : quotation
        ),
        currentQuotation:
          state.currentQuotation?.id === action.payload.id
            ? action.payload
            : state.currentQuotation,
        loading: false,
        error: null,
      };

    case QUOTATION_ACTIONS.DELETE_QUOTATION:
      return {
        ...state,
        quotations: state.quotations.filter((quotation) => quotation.id !== action.payload),
        currentQuotation:
          state.currentQuotation?.id === action.payload
            ? null
            : state.currentQuotation,
        loading: false,
        error: null,
      };

    case QUOTATION_ACTIONS.SET_ERROR:
      return {
        ...state,
        error: action.payload,
        loading: false,
      };

    case QUOTATION_ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        error: null,
      };

    case QUOTATION_ACTIONS.SET_STATS:
      return {
        ...state,
        stats: action.payload,
      };

    case QUOTATION_ACTIONS.RESET_STATE:
      return initialState;

    default:
      return state;
  }
};

// Create context
const QuotationContext = createContext();

// Custom hook to use quotation context
export const useQuotation = () => {
  const context = useContext(QuotationContext);
  if (!context) {
    throw new Error("useQuotation must be used within a QuotationProvider");
  }
  return context;
};

// Quotation Provider component
export const QuotationProvider = ({ children }) => {
  const [state, dispatch] = useReducer(quotationReducer, initialState);
  const { userType } = useUserType();
  const { user } = useAuth();

  // Load all quotations
  const loadQuotations = useCallback(async () => {
    if (!userType) {
      dispatch({
        type: QUOTATION_ACTIONS.SET_ERROR,
        payload: "User type not available",
      });
      return;
    }

    try {
      dispatch({ type: QUOTATION_ACTIONS.SET_LOADING, payload: true });
      const quotations = await quotationService.getQuotations(userType);
      dispatch({ type: QUOTATION_ACTIONS.SET_QUOTATIONS, payload: quotations });
    } catch (error) {
      dispatch({ type: QUOTATION_ACTIONS.SET_ERROR, payload: error.message });
    }
  }, [userType]);

  // Get quotation by ID
  const getQuotationById = useCallback(
    async (quotationId) => {
      if (!userType || !quotationId) {
        dispatch({
          type: QUOTATION_ACTIONS.SET_ERROR,
          payload: "Invalid parameters",
        });
        return null;
      }

      try {
        dispatch({ type: QUOTATION_ACTIONS.SET_LOADING, payload: true });

        const quotation = await quotationService.getQuotationById(userType, quotationId);
        if (quotation) {
          dispatch({
            type: QUOTATION_ACTIONS.SET_CURRENT_QUOTATION,
            payload: quotation,
          });
        } else {
          dispatch({
            type: QUOTATION_ACTIONS.SET_ERROR,
            payload: "Quotation not found",
          });
        }

        return quotation;
      } catch (error) {
        dispatch({ type: QUOTATION_ACTIONS.SET_ERROR, payload: error.message });
        return null;
      }
    },
    [userType]
  );

  // Create quotation
  const createQuotation = useCallback(
    async (quotationData) => {
      if (!userType) {
        dispatch({
          type: QUOTATION_ACTIONS.SET_ERROR,
          payload: "User type not available",
        });
        return null;
      }

      try {
        dispatch({ type: QUOTATION_ACTIONS.SET_LOADING, payload: true });

        // Add created by info
        const quotationWithMeta = {
          ...quotationData,
          createdBy: user?.uid,
          createdByName: user?.name,
        };

        const newQuotation = await quotationService.createQuotation(
          userType,
          quotationWithMeta
        );

        if (newQuotation) {
          console.log('Quotation created successfully:', {
            quotationNumber: newQuotation.quotationNumber,
            includeGST: newQuotation.includeGST,
            company: newQuotation.company?.name
          });
          
          dispatch({ type: QUOTATION_ACTIONS.ADD_QUOTATION, payload: newQuotation });
        }

        return newQuotation;
      } catch (error) {
        console.error('Error creating quotation in context:', error);
        dispatch({ type: QUOTATION_ACTIONS.SET_ERROR, payload: error.message });
        return null;
      }
    },
    [userType, user]
  );

  // Update quotation
  const updateQuotation = useCallback(
    async (quotationId, updates) => {
      if (!userType || !quotationId) {
        dispatch({
          type: QUOTATION_ACTIONS.SET_ERROR,
          payload: "Invalid parameters",
        });
        return null;
      }

      try {
        dispatch({ type: QUOTATION_ACTIONS.SET_LOADING, payload: true });

        // Add updated by info
        const updatesWithMeta = {
          ...updates,
          updatedBy: user?.uid,
          updatedByName: user?.name,
        };

        const updatedQuotation = await quotationService.updateQuotation(
          userType,
          quotationId,
          updatesWithMeta
        );

        if (updatedQuotation) {
          dispatch({ type: QUOTATION_ACTIONS.UPDATE_QUOTATION, payload: updatedQuotation });
        }

        return updatedQuotation;
      } catch (error) {
        dispatch({ type: QUOTATION_ACTIONS.SET_ERROR, payload: error.message });
        return null;
      }
    },
    [userType, user]
  );

  // Delete quotation
  const deleteQuotation = useCallback(
    async (quotationId) => {
      if (!userType || !quotationId) {
        dispatch({
          type: QUOTATION_ACTIONS.SET_ERROR,
          payload: "Invalid parameters",
        });
        return false;
      }

      try {
        dispatch({ type: QUOTATION_ACTIONS.SET_LOADING, payload: true });

        await quotationService.deleteQuotation(userType, quotationId);
        dispatch({ type: QUOTATION_ACTIONS.DELETE_QUOTATION, payload: quotationId });

        return true;
      } catch (error) {
        dispatch({ type: QUOTATION_ACTIONS.SET_ERROR, payload: error.message });
        return false;
      }
    },
    [userType]
  );

  // Load quotation statistics
  const loadQuotationStats = useCallback(async () => {
    if (!userType) {
      return;
    }

    try {
      const stats = await quotationService.getQuotationStats(userType);
      dispatch({ type: QUOTATION_ACTIONS.SET_STATS, payload: stats });
    } catch (error) {
      console.error("Error loading quotation stats:", error);
    }
  }, [userType]);

  // Search quotations
  const searchQuotations = useCallback(
    async (searchTerm) => {
      if (!userType) {
        return [];
      }

      try {
        return await quotationService.searchQuotations(userType, searchTerm);
      } catch (error) {
        dispatch({ type: QUOTATION_ACTIONS.SET_ERROR, payload: error.message });
        return [];
      }
    },
    [userType]
  );

  // Get customer quotation history
  const getCustomerQuotationHistory = useCallback(
    async (customerId) => {
      if (!userType || !customerId) {
        return [];
      }

      try {
        return await quotationService.getCustomerQuotationHistory(
          userType,
          customerId
        );
      } catch (error) {
        dispatch({ type: QUOTATION_ACTIONS.SET_ERROR, payload: error.message });
        return [];
      }
    },
    [userType]
  );

  // Convert quotation to invoice
  const convertQuotationToInvoice = useCallback(
    async (quotationId, invoiceId) => {
      if (!userType || !quotationId || !invoiceId) {
        dispatch({
          type: QUOTATION_ACTIONS.SET_ERROR,
          payload: "Invalid parameters",
        });
        return null;
      }

      try {
        dispatch({ type: QUOTATION_ACTIONS.SET_LOADING, payload: true });

        const updatedQuotation = await quotationService.convertQuotationToInvoice(
          userType,
          quotationId,
          invoiceId
        );

        if (updatedQuotation) {
          dispatch({ type: QUOTATION_ACTIONS.UPDATE_QUOTATION, payload: updatedQuotation });
        }

        return updatedQuotation;
      } catch (error) {
        dispatch({ type: QUOTATION_ACTIONS.SET_ERROR, payload: error.message });
        return null;
      }
    },
    [userType]
  );

  // Clear error
  const clearError = useCallback(() => {
    dispatch({ type: QUOTATION_ACTIONS.CLEAR_ERROR });
  }, []);

  // Reset state
  const resetState = useCallback(() => {
    dispatch({ type: QUOTATION_ACTIONS.RESET_STATE });
  }, []);

  // Set current quotation
  const setCurrentQuotation = useCallback((quotation) => {
    dispatch({ type: QUOTATION_ACTIONS.SET_CURRENT_QUOTATION, payload: quotation });
  }, []);

  // Context value
  const value = {
    // State
    quotations: state.quotations,
    currentQuotation: state.currentQuotation,
    loading: state.loading,
    error: state.error,
    stats: state.stats,

    // Actions
    loadQuotations,
    getQuotationById,
    createQuotation,
    updateQuotation,
    deleteQuotation,
    loadQuotationStats,
    searchQuotations,
    getCustomerQuotationHistory,
    convertQuotationToInvoice,

    // Utilities
    clearError,
    resetState,
    setCurrentQuotation,
  };

  return (
    <QuotationContext.Provider value={value}>{children}</QuotationContext.Provider>
  );
};

export default QuotationContext;