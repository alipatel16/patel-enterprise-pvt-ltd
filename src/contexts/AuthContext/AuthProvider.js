import React, { useReducer, useEffect, useCallback } from 'react';
import AuthContext from './AuthContext';
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
  CLEAR_ERROR: 'CLEAR_ERROR',
  UPDATE_USER: 'UPDATE_USER'
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
    
    case AUTH_ACTIONS.UPDATE_USER:
      return {
        ...state,
        user: action.payload ? { ...state.user, ...action.payload } : state.user,
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

/**
 * AuthProvider component that manages authentication state
 * @param {Object} props
 * @param {React.ReactNode} props.children - Child components
 */
const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Clear error
  const clearError = useCallback(() => {
    dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });
  }, []);

  // Set loading state
  const setLoading = useCallback((loading) => {
    dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: loading });
  }, []);

  // Auth state listener
  useEffect(() => {
    const unsubscribe = authService.onAuthStateChanged((user) => {
      dispatch({ type: AUTH_ACTIONS.SET_USER, payload: user });
    });

    return () => unsubscribe();
  }, []);

  // Sign in
  const signIn = useCallback(async (email, password) => {
    try {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });
      const user = await authService.signIn(email, password);
      dispatch({ type: AUTH_ACTIONS.SET_USER, payload: user });
      return user;
    } catch (error) {
      dispatch({
        type: AUTH_ACTIONS.SET_ERROR,
        payload: error.message || 'Failed to sign in'
      });
      throw error;
    }
  }, []);

  // Sign up
  const signUp = useCallback(async (userData) => {
    try {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });
      const user = await authService.signUp(userData);
      dispatch({ type: AUTH_ACTIONS.SET_USER, payload: user });
      return user;
    } catch (error) {
      dispatch({
        type: AUTH_ACTIONS.SET_ERROR,
        payload: error.message || 'Failed to create account'
      });
      throw error;
    }
  }, []);

  // Sign out
  const signOut = useCallback(async () => {
    try {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });
      await authService.signOut();
      dispatch({ type: AUTH_ACTIONS.LOGOUT });
    } catch (error) {
      dispatch({
        type: AUTH_ACTIONS.SET_ERROR,
        payload: error.message || 'Failed to sign out'
      });
      throw error;
    }
  }, []);

  // Update user profile
  const updateUser = useCallback(async (updates) => {
    try {
      if (!state.user) throw new Error('No authenticated user');
      
      const updatedUser = await authService.updateUser(state.user.uid, updates);
      dispatch({ type: AUTH_ACTIONS.UPDATE_USER, payload: updatedUser });
      return updatedUser;
    } catch (error) {
      dispatch({
        type: AUTH_ACTIONS.SET_ERROR,
        payload: error.message || 'Failed to update profile'
      });
      throw error;
    }
  }, [state.user]);

  // Change password
  const changePassword = useCallback(async (currentPassword, newPassword) => {
    try {
      if (!state.user) throw new Error('No authenticated user');
      
      await authService.changePassword(currentPassword, newPassword);
      return true;
    } catch (error) {
      dispatch({
        type: AUTH_ACTIONS.SET_ERROR,
        payload: error.message || 'Failed to change password'
      });
      throw error;
    }
  }, [state.user]);

  // Reset password
  const resetPassword = useCallback(async (email) => {
    try {
      await authService.resetPassword(email);
      return true;
    } catch (error) {
      dispatch({
        type: AUTH_ACTIONS.SET_ERROR,
        payload: error.message || 'Failed to reset password'
      });
      throw error;
    }
  }, []);

  // Permission checks
  const canAccess = useCallback((requiredRole) => {
    if (!state.user || !requiredRole) return false;
    
    // Admin can access everything
    if (state.user.role === USER_ROLES.ADMIN) return true;
    
    // Check specific role
    return state.user.role === requiredRole;
  }, [state.user]);

  const canEdit = useCallback(() => {
    return state.user?.role === USER_ROLES.ADMIN;
  }, [state.user]);

  const canDelete = useCallback(() => {
    return state.user?.role === USER_ROLES.ADMIN;
  }, [state.user]);

  const canViewReports = useCallback(() => {
    if (!state.user) return false;
    return state.user.role === USER_ROLES.ADMIN || state.user.canViewReports;
  }, [state.user]);

  const canManageCustomers = useCallback(() => {
    if (!state.user) return false;
    return state.user.role === USER_ROLES.ADMIN || state.user.canManageCustomers;
  }, [state.user]);

  const canCreateInvoices = useCallback(() => {
    if (!state.user) return false;
    return state.user.role === USER_ROLES.ADMIN || state.user.canCreateInvoices;
  }, [state.user]);

  // Context value
  const contextValue = {
    // State
    ...state,
    
    // Actions
    signIn,
    signUp,
    signOut,
    updateUser,
    changePassword,
    resetPassword,
    clearError,
    setLoading,
    
    // Permission checks
    canAccess,
    canEdit,
    canDelete,
    canViewReports,
    canManageCustomers,
    canCreateInvoices
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;