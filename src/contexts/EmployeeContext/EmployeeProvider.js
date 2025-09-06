import React, { useReducer, useCallback, useContext, createContext } from 'react';
import employeeService from '../../services/api/employeeService';
import { useUserType } from '../UserTypeContext/UserTypeContext';
import { useAuth } from '../AuthContext/AuthContext';

// Create context
const EmployeeContext = createContext();

// Custom hook
export const useEmployee = () => {
  const context = useContext(EmployeeContext);
  if (!context) {
    throw new Error('useEmployee must be used within an EmployeeProvider');
  }
  return context;
};

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
    isActive: null,
    sortBy: 'name',
    sortOrder: 'asc'
  }
};

// Actions
const EMPLOYEE_ACTIONS = {
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  CLEAR_ERROR: 'CLEAR_ERROR',
  SET_EMPLOYEES: 'SET_EMPLOYEES',
  ADD_EMPLOYEE: 'ADD_EMPLOYEE',
  UPDATE_EMPLOYEE: 'UPDATE_EMPLOYEE',
  DELETE_EMPLOYEE: 'DELETE_EMPLOYEE',
  SET_CURRENT_EMPLOYEE: 'SET_CURRENT_EMPLOYEE',
  SET_PAGINATION: 'SET_PAGINATION',
  SET_FILTERS: 'SET_FILTERS',
  RESET_STATE: 'RESET_STATE'
};

// Reducer
const employeeReducer = (state, action) => {
  switch (action.type) {
    case EMPLOYEE_ACTIONS.SET_LOADING:
      return { ...state, loading: action.payload, error: null };

    case EMPLOYEE_ACTIONS.SET_ERROR:
      return { ...state, error: action.payload, loading: false };

    case EMPLOYEE_ACTIONS.CLEAR_ERROR:
      return { ...state, error: null };

    case EMPLOYEE_ACTIONS.SET_EMPLOYEES:
      return { ...state, employees: action.payload, loading: false, error: null };

    case EMPLOYEE_ACTIONS.ADD_EMPLOYEE:
      return { ...state, employees: [action.payload, ...state.employees], error: null };

    case EMPLOYEE_ACTIONS.UPDATE_EMPLOYEE:
      return {
        ...state,
        employees: state.employees.map(emp =>
          emp.id === action.payload.id ? action.payload : emp
        ),
        currentEmployee: state.currentEmployee?.id === action.payload.id 
          ? action.payload : state.currentEmployee,
        error: null
      };

    case EMPLOYEE_ACTIONS.DELETE_EMPLOYEE:
      return {
        ...state,
        employees: state.employees.filter(emp => emp.id !== action.payload),
        currentEmployee: state.currentEmployee?.id === action.payload ? null : state.currentEmployee,
        error: null
      };

    case EMPLOYEE_ACTIONS.SET_CURRENT_EMPLOYEE:
      return { ...state, currentEmployee: action.payload, error: null };

    case EMPLOYEE_ACTIONS.SET_PAGINATION:
      return { ...state, pagination: { ...state.pagination, ...action.payload } };

    case EMPLOYEE_ACTIONS.SET_FILTERS:
      return { ...state, filters: { ...state.filters, ...action.payload } };

    case EMPLOYEE_ACTIONS.RESET_STATE:
      return initialState;

    default:
      return state;
  }
};

const EmployeeProvider = ({ children }) => {
  const [state, dispatch] = useReducer(employeeReducer, initialState);
  const { userType } = useUserType();
  const { user } = useAuth();

  const clearError = useCallback(() => {
    dispatch({ type: EMPLOYEE_ACTIONS.CLEAR_ERROR });
  }, []);

  const setLoading = useCallback((loading) => {
    dispatch({ type: EMPLOYEE_ACTIONS.SET_LOADING, payload: loading });
  }, []);

  const setFilters = useCallback((filters) => {
    dispatch({ type: EMPLOYEE_ACTIONS.SET_FILTERS, payload: filters });
  }, []);

  const getEmployees = useCallback(async (options = {}) => {
    if (!userType) {
      dispatch({ type: EMPLOYEE_ACTIONS.SET_ERROR, payload: 'User type not available' });
      return [];
    }

    try {
      dispatch({ type: EMPLOYEE_ACTIONS.SET_LOADING, payload: true });
      
      const result = await employeeService.getEmployees(userType, {
        ...state.filters,
        ...options
      });

      dispatch({ type: EMPLOYEE_ACTIONS.SET_EMPLOYEES, payload: result.employees });
      dispatch({ 
        type: EMPLOYEE_ACTIONS.SET_PAGINATION, 
        payload: {
          currentPage: result.currentPage,
          totalPages: result.totalPages,
          total: result.total,
          hasMore: result.hasMore
        }
      });

      return result.employees;
    } catch (error) {
      dispatch({ 
        type: EMPLOYEE_ACTIONS.SET_ERROR, 
        payload: error.message || 'Failed to fetch employees' 
      });
      return [];
    }
  }, [userType, state.filters]);

  const getEmployeeById = useCallback(async (employeeId) => {
    if (!userType || !employeeId) return null;

    try {
      const employee = await employeeService.getEmployeeById(userType, employeeId);
      
      if (employee) {
        dispatch({ type: EMPLOYEE_ACTIONS.SET_CURRENT_EMPLOYEE, payload: employee });
      }
      
      return employee;
    } catch (error) {
      dispatch({ 
        type: EMPLOYEE_ACTIONS.SET_ERROR, 
        payload: error.message || 'Failed to fetch employee' 
      });
      return null;
    }
  }, [userType]);

  const createEmployee = useCallback(async (employeeData) => {
    if (!userType) throw new Error('User type not available');

    try {
      dispatch({ type: EMPLOYEE_ACTIONS.SET_LOADING, payload: true });
      
      const newEmployee = await employeeService.createEmployee(userType, {
        ...employeeData,
        createdBy: user?.uid,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      dispatch({ type: EMPLOYEE_ACTIONS.ADD_EMPLOYEE, payload: newEmployee });
      dispatch({ type: EMPLOYEE_ACTIONS.SET_LOADING, payload: false });
      
      return newEmployee;
    } catch (error) {
      dispatch({ 
        type: EMPLOYEE_ACTIONS.SET_ERROR, 
        payload: error.message || 'Failed to create employee' 
      });
      throw error;
    }
  }, [userType, user]);

  const updateEmployee = useCallback(async (employeeId, updates) => {
    if (!userType || !employeeId) throw new Error('User type and employee ID required');

    try {
      dispatch({ type: EMPLOYEE_ACTIONS.SET_LOADING, payload: true });
      
      const updatedEmployee = await employeeService.updateEmployee(userType, employeeId, {
        ...updates,
        updatedBy: user?.uid,
        updatedAt: new Date().toISOString()
      });

      dispatch({ type: EMPLOYEE_ACTIONS.UPDATE_EMPLOYEE, payload: updatedEmployee });
      dispatch({ type: EMPLOYEE_ACTIONS.SET_LOADING, payload: false });
      
      return updatedEmployee;
    } catch (error) {
      dispatch({ 
        type: EMPLOYEE_ACTIONS.SET_ERROR, 
        payload: error.message || 'Failed to update employee' 
      });
      throw error;
    }
  }, [userType, user]);

  const deleteEmployee = useCallback(async (employeeId) => {
    if (!userType || !employeeId) throw new Error('User type and employee ID required');

    try {
      dispatch({ type: EMPLOYEE_ACTIONS.SET_LOADING, payload: true });
      
      await employeeService.deleteEmployee(userType, employeeId);
      
      dispatch({ type: EMPLOYEE_ACTIONS.DELETE_EMPLOYEE, payload: employeeId });
      dispatch({ type: EMPLOYEE_ACTIONS.SET_LOADING, payload: false });
      
      return true;
    } catch (error) {
      dispatch({ 
        type: EMPLOYEE_ACTIONS.SET_ERROR, 
        payload: error.message || 'Failed to delete employee' 
      });
      throw error;
    }
  }, [userType]);

  const toggleEmployeeStatus = useCallback(async (employeeId) => {
    if (!userType || !employeeId) throw new Error('User type and employee ID required');

    const employee = state.employees.find(emp => emp.id === employeeId);
    if (!employee) throw new Error('Employee not found');

    try {
      const updatedEmployee = await updateEmployee(employeeId, { 
        isActive: !employee.isActive 
      });
      return updatedEmployee;
    } catch (error) {
      throw error;
    }
  }, [userType, state.employees, updateEmployee]);

  const resetState = useCallback(() => {
    dispatch({ type: EMPLOYEE_ACTIONS.RESET_STATE });
  }, []);

  const contextValue = {
    ...state,
    getEmployees,
    getEmployeeById,
    createEmployee,
    updateEmployee,
    deleteEmployee,
    toggleEmployeeStatus,
    setFilters,
    clearError,
    setLoading,
    resetState
  };

  return (
    <EmployeeContext.Provider value={contextValue}>
      {children}
    </EmployeeContext.Provider>
  );
};

export default EmployeeProvider;