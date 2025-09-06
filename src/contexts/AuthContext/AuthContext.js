import React, { createContext, useContext, useReducer, useEffect } from 'react';
import authService from '../../services/auth/authService';
import { USER_ROLES } from '../../utils/constants/appConstants';

// Initial state
const initialState = {
  user: null,
  loading: true,
  error: null,
  isAuthenticated: false
};

// Action types
const AUTH_ACTIONS = {
  SET_LOADING: 'SET_LOADING',
  SET_USER: 'SET_USER',
  SET_ERROR: 'SET_ERROR',
  LOGOUT: 'LOGOUT',
  CLEAR_ERROR: 'CLEAR_ERROR'
};

// Reducer
const authReducer = (state, action) => {
  switch (action.type) {
    case AUTH_ACTIONS.SET_LOADING:
      return {
        ...state,
        loading: action.payload,
        error: null
      };
    
    case AUTH_ACTIONS.SET_USER:
      return {
        ...state,
        user: action.payload,
        isAuthenticated: !!action.payload,
        loading: false,
        error: null
      };
    
    case AUTH_ACTIONS.SET_ERROR:
      return {
        ...state,
        error: action.payload,
        loading: false
      };
    
    case AUTH_ACTIONS.LOGOUT:
      return {
        ...initialState,
        loading: false
      };
    
    case AUTH_ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        error: null
      };
    
    default:
      return state;
  }
};

// Create context
const AuthContext = createContext();

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Auth Provider component
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Auth state listener
  useEffect(() => {
    const unsubscribe = authService.onAuthStateChanged((user) => {
      dispatch({ type: AUTH_ACTIONS.SET_USER, payload: user });
    });

    return () => unsubscribe();
  }, []);

  // Sign in
  const signIn = async (email, password) => {
    try {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });
      const user = await authService.signIn(email, password);
      dispatch({ type: AUTH_ACTIONS.SET_USER, payload: user });
      return user;
    } catch (error) {
      dispatch({ type: AUTH_ACTIONS.SET_ERROR, payload: error.message });
      throw error;
    }
  };

  // Sign up
  const signUp = async (userData) => {
    try {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });
      const user = await authService.signUp(userData);
      dispatch({ type: AUTH_ACTIONS.SET_USER, payload: user });
      return user;
    } catch (error) {
      dispatch({ type: AUTH_ACTIONS.SET_ERROR, payload: error.message });
      throw error;
    }
  };

  // Sign out
  const signOut = async () => {
    try {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });
      await authService.signOut();
      dispatch({ type: AUTH_ACTIONS.LOGOUT });
    } catch (error) {
      dispatch({ type: AUTH_ACTIONS.SET_ERROR, payload: error.message });
      throw error;
    }
  };

  // Update profile
  const updateProfile = async (updates) => {
    try {
      if (!state.user) {
        throw new Error('No user logged in');
      }
      
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });
      await authService.updateUserProfile(state.user.uid, updates);
      
      // Update local state
      const updatedUser = { ...state.user, ...updates };
      dispatch({ type: AUTH_ACTIONS.SET_USER, payload: updatedUser });
      
      return updatedUser;
    } catch (error) {
      dispatch({ type: AUTH_ACTIONS.SET_ERROR, payload: error.message });
      throw error;
    }
  };

  // Clear error
  const clearError = () => {
    dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });
  };

  // Helper functions
  const isAdmin = () => {
    return state.user?.role === USER_ROLES.ADMIN;
  };

  const isEmployee = () => {
    return state.user?.role === USER_ROLES.EMPLOYEE;
  };

  const getUserType = () => {
    return state.user?.userType;
  };

  const canAccess = (requiredRole) => {
    if (!state.user) return false;
    
    if (requiredRole === USER_ROLES.ADMIN) {
      return state.user.role === USER_ROLES.ADMIN;
    }
    
    if (requiredRole === USER_ROLES.EMPLOYEE) {
      return [USER_ROLES.ADMIN, USER_ROLES.EMPLOYEE].includes(state.user.role);
    }
    
    return true;
  };

  const canDelete = () => {
    return state.user?.role === USER_ROLES.ADMIN;
  };

  const canManageEmployees = () => {
    return state.user?.role === USER_ROLES.ADMIN;
  };

  // Context value
  const value = {
    // State
    user: state.user,
    loading: state.loading,
    error: state.error,
    isAuthenticated: state.isAuthenticated,
    
    // Actions
    signIn,
    signUp,
    signOut,
    updateProfile,
    clearError,
    
    // Helper functions
    isAdmin,
    isEmployee,
    getUserType,
    canAccess,
    canDelete,
    canManageEmployees
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;