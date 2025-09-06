import React, { createContext, useContext, useReducer, useCallback } from 'react';
import employeeService from '../../services/api/employeeService';
import { useUserType } from '../UserTypeContext/UserTypeContext';
import { useAuth } from '../AuthContext/AuthContext';

// Initial state
const initialState = {
  employees: [],
  currentEmployee: null,
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
    role: '',
    department: '',
    status: 'active',
    sortBy: 'name',
    sortOrder: 'asc'
  },
  stats: {
    total: 0,
    active: 0,
    inactive: 0,
    byRole: {},
    byDepartment: {}
  }
};

// Action types
const EMPLOYEE_ACTIONS = {
  SET_LOADING: 'SET_LOADING',
  SET_EMPLOYEES: 'SET_EMPLOYEES',
  SET_CURRENT_EMPLOYEE: 'SET_CURRENT_EMPLOYEE',
  ADD_EMPLOYEE: 'ADD_EMPLOYEE',
  UPDATE_EMPLOYEE: 'UPDATE_EMPLOYEE',
  DELETE_EMPLOYEE: 'DELETE_EMPLOYEE',
  SET_ERROR: 'SET_ERROR',
  CLEAR_ERROR: 'CLEAR_ERROR',
  SET_FILTERS: 'SET_FILTERS',
  SET_PAGINATION: 'SET_PAGINATION',
  SET_STATS: 'SET_STATS',
  RESET_STATE: 'RESET_STATE'
};

// Reducer
const employeeReducer = (state, action) => {
  switch (action.type) {
    case EMPLOYEE_ACTIONS.SET_LOADING:
      return {
        ...state,
        loading: action.payload,
        error: action.payload ? null : state.error
      };

    case EMPLOYEE_ACTIONS.SET_EMPLOYEES:
      return {
        ...state,
        employees: action.payload.employees || [],
        pagination: {
          currentPage: action.payload.currentPage || 1,
          totalPages: action.payload.totalPages || 1,
          total: action.payload.total || 0,
          hasMore: action.payload.hasMore || false
        },
        loading: false,
        error: null
      };

    case EMPLOYEE_ACTIONS.SET_CURRENT_EMPLOYEE:
      return {
        ...state,
        currentEmployee: action.payload,
        loading: false,
        error: null
      };

    case EMPLOYEE_ACTIONS.ADD_EMPLOYEE:
      return {
        ...state,
        employees: [action.payload, ...state.employees],
        pagination: {
          ...state.pagination,
          total: state.pagination.total + 1
        },
        loading: false,
        error: null
      };

    case EMPLOYEE_ACTIONS.UPDATE_EMPLOYEE:
      return {
        ...state,
        employees: state.employees.map(employee =>
          employee.id === action.payload.id ? action.payload : employee
        ),
        currentEmployee: state.currentEmployee?.id === action.payload.id 
          ? action.payload 
          : state.currentEmployee,
        loading: false,
        error: null
      };

    case EMPLOYEE_ACTIONS.DELETE_EMPLOYEE:
      return {
        ...state,
        employees: state.employees.filter(employee => employee.id !== action.payload),
        currentEmployee: state.currentEmployee?.id === action.payload 
          ? null 
          : state.currentEmployee,
        pagination: {
          ...state.pagination,
          total: Math.max(0, state.pagination.total - 1)
        },
        loading: false,
        error: null
      };

    case EMPLOYEE_ACTIONS.SET_ERROR:
      return {
        ...state,
        error: action.payload,
        loading: false
      };

    case EMPLOYEE_ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        error: null
      };

    case EMPLOYEE_ACTIONS.SET_FILTERS:
      return {
        ...state,
        filters: {
          ...state.filters,
          ...action.payload
        }
      };

    case EMPLOYEE_ACTIONS.SET_STATS:
      return {
        ...state,
        stats: action.payload
      };

    case EMPLOYEE_ACTIONS.RESET_STATE:
      return initialState;

    default:
      return state;
  }
};

// Create context
const EmployeeContext = createContext();

// Custom hook to use employee context
export const useEmployee = () => {
  const context = useContext(EmployeeContext);
  if (!context) {
    throw new Error('useEmployee must be used within an EmployeeProvider');
  }
  return context;
};

// Employee Provider component
export const EmployeeProvider = ({ children }) => {
  const [state, dispatch] = useReducer(employeeReducer, initialState);
  const { userType } = useUserType();
  const { user } = useAuth();

  // Load employees
  const loadEmployees = useCallback(async (options = {}) => {
    if (!userType) {
      dispatch({ type: EMPLOYEE_ACTIONS.SET_ERROR, payload: 'User type not available' });
      return;
    }

    try {
      dispatch({ type: EMPLOYEE_ACTIONS.SET_LOADING, payload: true });

      const queryOptions = {
        limit: 10,
        offset: (state.pagination.currentPage - 1) * 10,
        ...state.filters,
        ...options
      };

      const response = await employeeService.getEmployees(userType, queryOptions);
      dispatch({ type: EMPLOYEE_ACTIONS.SET_EMPLOYEES, payload: response });
    } catch (error) {
      dispatch({ type: EMPLOYEE_ACTIONS.SET_ERROR, payload: error.message });
    }
  }, [userType, state.filters, state.pagination.currentPage]);

  // Search employees
  const searchEmployees = useCallback(async (searchTerm) => {
    if (!userType || !searchTerm.trim()) {
      await loadEmployees();
      return;
    }

    try {
      dispatch({ type: EMPLOYEE_ACTIONS.SET_LOADING, payload: true });
      
      const employees = await employeeService.searchEmployees(userType, searchTerm);
      dispatch({ 
        type: EMPLOYEE_ACTIONS.SET_EMPLOYEES, 
        payload: { 
          employees, 
          total: employees.length,
          currentPage: 1,
          totalPages: 1,
          hasMore: false 
        } 
      });
    } catch (error) {
      dispatch({ type: EMPLOYEE_ACTIONS.SET_ERROR, payload: error.message });
    }
  }, [userType, loadEmployees]);

  // Get employee by ID
  const getEmployeeById = useCallback(async (employeeId) => {
    if (!userType || !employeeId) {
      dispatch({ type: EMPLOYEE_ACTIONS.SET_ERROR, payload: 'Invalid parameters' });
      return null;
    }

    try {
      dispatch({ type: EMPLOYEE_ACTIONS.SET_LOADING, payload: true });
      
      const employee = await employeeService.getEmployeeById(userType, employeeId);
      if (employee) {
        dispatch({ type: EMPLOYEE_ACTIONS.SET_CURRENT_EMPLOYEE, payload: employee });
      } else {
        dispatch({ type: EMPLOYEE_ACTIONS.SET_ERROR, payload: 'Employee not found' });
      }
      
      return employee;
    } catch (error) {
      dispatch({ type: EMPLOYEE_ACTIONS.SET_ERROR, payload: error.message });
      return null;
    }
  }, [userType]);

  // Create employee
  const createEmployee = useCallback(async (employeeData) => {
    if (!userType) {
      dispatch({ type: EMPLOYEE_ACTIONS.SET_ERROR, payload: 'User type not available' });
      return null;
    }

    try {
      dispatch({ type: EMPLOYEE_ACTIONS.SET_LOADING, payload: true });
      
      // Add created by info
      const employeeWithMeta = {
        ...employeeData,
        createdBy: user?.uid,
        createdByName: user?.name
      };

      const newEmployee = await employeeService.createEmployee(userType, employeeWithMeta);
      dispatch({ type: EMPLOYEE_ACTIONS.ADD_EMPLOYEE, payload: newEmployee });
      
      return newEmployee;
    } catch (error) {
      dispatch({ type: EMPLOYEE_ACTIONS.SET_ERROR, payload: error.message });
      return null;
    }
  }, [userType, user]);

  // Update employee
  const updateEmployee = useCallback(async (employeeId, updates) => {
    if (!userType || !employeeId) {
      dispatch({ type: EMPLOYEE_ACTIONS.SET_ERROR, payload: 'Invalid parameters' });
      return null;
    }

    try {
      dispatch({ type: EMPLOYEE_ACTIONS.SET_LOADING, payload: true });
      
      // Add updated by info
      const updatesWithMeta = {
        ...updates,
        updatedBy: user?.uid,
        updatedByName: user?.name
      };

      const updatedEmployee = await employeeService.updateEmployee(userType, employeeId, updatesWithMeta);
      dispatch({ type: EMPLOYEE_ACTIONS.UPDATE_EMPLOYEE, payload: updatedEmployee });
      
      return updatedEmployee;
    } catch (error) {
      dispatch({ type: EMPLOYEE_ACTIONS.SET_ERROR, payload: error.message });
      return null;
    }
  }, [userType, user]);

  // Delete employee
  const deleteEmployee = useCallback(async (employeeId) => {
    if (!userType || !employeeId) {
      dispatch({ type: EMPLOYEE_ACTIONS.SET_ERROR, payload: 'Invalid parameters' });
      return false;
    }

    try {
      dispatch({ type: EMPLOYEE_ACTIONS.SET_LOADING, payload: true });
      
      await employeeService.deleteEmployee(userType, employeeId);
      dispatch({ type: EMPLOYEE_ACTIONS.DELETE_EMPLOYEE, payload: employeeId });
      
      return true;
    } catch (error) {
      dispatch({ type: EMPLOYEE_ACTIONS.SET_ERROR, payload: error.message });
      return false;
    }
  }, [userType]);

  // Get employee suggestions for autocomplete
  const getEmployeeSuggestions = useCallback(async (searchTerm, limit = 5) => {
    if (!userType || !searchTerm.trim()) {
      return [];
    }

    try {
      return await employeeService.getEmployeeSuggestions(userType, searchTerm, limit);
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      return [];
    }
  }, [userType]);

  // Get employees by role
  const getEmployeesByRole = useCallback(async (role) => {
    if (!userType) {
      return [];
    }

    try {
      return await employeeService.getEmployeesByRole(userType, role);
    } catch (error) {
      dispatch({ type: EMPLOYEE_ACTIONS.SET_ERROR, payload: error.message });
      return [];
    }
  }, [userType]);

  // Load employee statistics
  const loadEmployeeStats = useCallback(async () => {
    if (!userType) {
      return;
    }

    try {
      const stats = await employeeService.getEmployeeStats(userType);
      dispatch({ type: EMPLOYEE_ACTIONS.SET_STATS, payload: stats });
    } catch (error) {
      console.error('Error loading employee stats:', error);
    }
  }, [userType]);

  // Set filters
  const setFilters = useCallback((newFilters) => {
    dispatch({ type: EMPLOYEE_ACTIONS.SET_FILTERS, payload: newFilters });
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    dispatch({ type: EMPLOYEE_ACTIONS.CLEAR_ERROR });
  }, []);

  // Reset state
  const resetState = useCallback(() => {
    dispatch({ type: EMPLOYEE_ACTIONS.RESET_STATE });
  }, []);

  // Set current employee
  const setCurrentEmployee = useCallback((employee) => {
    dispatch({ type: EMPLOYEE_ACTIONS.SET_CURRENT_EMPLOYEE, payload: employee });
  }, []);

  // Pagination helpers
  const nextPage = useCallback(() => {
    if (state.pagination.hasMore) {
      loadEmployees({ 
        offset: state.pagination.currentPage * 10 
      });
    }
  }, [state.pagination, loadEmployees]);

  const prevPage = useCallback(() => {
    if (state.pagination.currentPage > 1) {
      loadEmployees({ 
        offset: (state.pagination.currentPage - 2) * 10 
      });
    }
  }, [state.pagination, loadEmployees]);

  const goToPage = useCallback((page) => {
    if (page >= 1 && page <= state.pagination.totalPages) {
      loadEmployees({ 
        offset: (page - 1) * 10 
      });
    }
  }, [state.pagination, loadEmployees]);

  // Context value
  const value = {
    // State
    employees: state.employees,
    currentEmployee: state.currentEmployee,
    loading: state.loading,
    error: state.error,
    pagination: state.pagination,
    filters: state.filters,
    stats: state.stats,

    // Actions
    loadEmployees,
    searchEmployees,
    getEmployeeById,
    createEmployee,
    updateEmployee,
    deleteEmployee,
    getEmployeeSuggestions,
    getEmployeesByRole,
    loadEmployeeStats,
    
    // Filters and pagination
    setFilters,
    nextPage,
    prevPage,
    goToPage,
    
    // Utilities
    clearError,
    resetState,
    setCurrentEmployee
  };

  return (
    <EmployeeContext.Provider value={value}>
      {children}
    </EmployeeContext.Provider>
  );
};

export default EmployeeContext;