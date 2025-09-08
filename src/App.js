import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

// Contexts
import { AuthProvider } from './contexts/AuthContext/AuthContext';
import { UserTypeProvider } from './contexts/UserTypeContext/UserTypeContext';

// Theme
import { createAppTheme } from './styles/theme/theme';

// Components
import ProtectedRoute from './components/common/UI/ProtectedRoute';
import LoadingSpinner from './components/common/UI/LoadingSpinner';

// Pages
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import DashboardPage from './pages/dashboard/DashboardPage';
import NotificationsPage from './pages/dashboard/Notifications/NotificationsPage';
import CustomersPage from './pages/customers/CustomersPage';
import AddCustomerPage from './pages/customers/AddCustomerPage';
import EditCustomerPage from './pages/customers/EditCustomerPage';
import ViewCustomerPage from './pages/customers/ViewCustomerPage';
import EmployeesPage from './pages/employees/EmployeesPage';
import AddEmployeePage from './pages/employees/AddEmployeePage';
import EditEmployeePage from './pages/employees/EditEmployeePage';
import ViewEmployeePage from './pages/employees/ViewEmployeePage';
import SalesPage from './pages/sales/SalesPage';
import CreateInvoicePage from './pages/sales/CreateInvoicePage';
import EditInvoicePage from './pages/sales/EditInvoicePage';
import ViewInvoicePage from './pages/sales/ViewInvoicePage';
import SalesHistoryPage from './pages/sales/SalesHistoryPage';
import NotFoundPage from './pages/NotFoundPage';

// Custom hook
import { useAuth } from './contexts/AuthContext/AuthContext';
import { useUserType } from './contexts/UserTypeContext/UserTypeContext';
import { USER_ROLES } from './utils/constants/appConstants';

// App content component that uses the contexts
const AppContent = () => {
  const { loading, isAuthenticated } = useAuth();
  const { userType } = useUserType();

  // Create theme based on user type
  const theme = createAppTheme(userType);

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <Routes>
          {/* Public routes */}
          <Route 
            path="/login" 
            element={
              isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />
            } 
          />
          <Route 
            path="/register" 
            element={
              isAuthenticated ? <Navigate to="/dashboard" replace /> : <RegisterPage />
            } 
          />

          <Route path="/notifications" element={<NotificationsPage />} />

          {/* Protected routes */}
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            } 
          />

          {/* Customer routes */}
          <Route 
            path="/customers" 
            element={
              <ProtectedRoute>
                <CustomersPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/customers/add" 
            element={
              <ProtectedRoute>
                <AddCustomerPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/customers/edit/:id" 
            element={
              <ProtectedRoute>
                <EditCustomerPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/customers/view/:id" 
            element={
              <ProtectedRoute>
                <ViewCustomerPage />
              </ProtectedRoute>
            } 
          />

          {/* Employee routes (Admin only) */}
          <Route 
            path="/employees" 
            element={
              <ProtectedRoute requiredRole={USER_ROLES.ADMIN}>
                <EmployeesPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/employees/add" 
            element={
              <ProtectedRoute requiredRole={USER_ROLES.ADMIN}>
                <AddEmployeePage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/employees/edit/:id" 
            element={
              <ProtectedRoute requiredRole={USER_ROLES.ADMIN}>
                <EditEmployeePage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/employees/view/:id" 
            element={
              <ProtectedRoute requiredRole={USER_ROLES.ADMIN}>
                <ViewEmployeePage />
              </ProtectedRoute>
            } 
          />

          {/* Sales routes */}
          <Route 
            path="/sales" 
            element={
              <ProtectedRoute>
                <SalesPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/sales/create" 
            element={
              <ProtectedRoute>
                <CreateInvoicePage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/sales/edit/:id" 
            element={
              <ProtectedRoute>
                <EditInvoicePage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/sales/view/:id" 
            element={
              <ProtectedRoute>
                <ViewInvoicePage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/sales/history" 
            element={
              <ProtectedRoute>
                <SalesHistoryPage />
              </ProtectedRoute>
            } 
          />

          {/* Default redirects */}
          <Route 
            path="/" 
            element={
              <Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />
            } 
          />

          {/* 404 page */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </LocalizationProvider>
    </ThemeProvider>
  );
};

// Main App component
const App = () => {
  return (
    <Router>
      <AuthProvider>
        <UserTypeProvider>
          <AppContent />
        </UserTypeProvider>
      </AuthProvider>
    </Router>
  );
};

export default App;