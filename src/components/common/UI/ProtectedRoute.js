import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Box, Alert, AlertTitle } from '@mui/material';
import { useAuth } from '../../../contexts/AuthContext/AuthContext';
import LoadingSpinner from './LoadingSpinner';

/**
 * ProtectedRoute component that handles authentication and authorization
 * @param {Object} props
 * @param {React.ReactNode} props.children - Child components to render if authorized
 * @param {string} props.requiredRole - Required role to access the route (optional)
 * @param {boolean} props.adminOnly - Whether route is admin only (optional)
 * @returns {React.ReactElement}
 */
const ProtectedRoute = ({ children, requiredRole, adminOnly = false }) => {
  const { isAuthenticated, loading, user, canAccess } = useAuth();
  const location = useLocation();

  // Show loading spinner while authentication is being determined
  if (loading) {
    return <LoadingSpinner />;
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return (
      <Navigate 
        to="/login" 
        state={{ from: location }} 
        replace 
      />
    );
  }

  // Check if user has required role
  if (requiredRole && !canAccess(requiredRole)) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
        p={3}
      >
        <Alert severity="error" sx={{ maxWidth: 400 }}>
          <AlertTitle>Access Denied</AlertTitle>
          You don't have permission to access this page. Please contact your administrator.
        </Alert>
      </Box>
    );
  }

  // Check admin only access
  if (adminOnly && user?.role !== 'admin') {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
        p={3}
      >
        <Alert severity="error" sx={{ maxWidth: 400 }}>
          <AlertTitle>Admin Access Required</AlertTitle>
          This page is only accessible to administrators.
        </Alert>
      </Box>
    );
  }

  // Check if user has a valid business type
  if (!user?.userType) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
        p={3}
      >
        <Alert severity="warning" sx={{ maxWidth: 400 }}>
          <AlertTitle>Setup Required</AlertTitle>
          Your account needs to be configured with a business type. Please contact your administrator.
        </Alert>
      </Box>
    );
  }

  // Render protected content
  return <>{children}</>;
};

export default ProtectedRoute;