// src/App.js - Updated with Exchange Routes
import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { ThemeProvider, CssBaseline } from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";

// Contexts
import { AuthProvider } from "./contexts/AuthContext/AuthContext";
import { UserTypeProvider } from "./contexts/UserTypeContext/UserTypeContext";

// Theme
import { createAppTheme } from "./styles/theme/theme";

// Components
import ProtectedRoute from "./components/common/UI/ProtectedRoute";
import LoadingSpinner from "./components/common/UI/LoadingSpinner";

// Pages - Authentication
import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";

// Pages - Dashboard
import DashboardPage from "./pages/dashboard/DashboardPage";
import NotificationsPage from "./pages/dashboard/Notifications/NotificationsPage";
import SalesStatisticsPage from "./pages/admin/SalesStatisticsPage";

// Pages - Customers
import CustomersPage from "./pages/customers/CustomersPage";
import AddCustomerPage from "./pages/customers/AddCustomerPage";
import EditCustomerPage from "./pages/customers/EditCustomerPage";
import ViewCustomerPage from "./pages/customers/ViewCustomerPage";

// Pages - Employees
import EmployeesPage from "./pages/employees/EmployeesPage";
import AddEmployeePage from "./pages/employees/AddEmployeePage";
import EditEmployeePage from "./pages/employees/EditEmployeePage";
import ViewEmployeePage from "./pages/employees/ViewEmployeePage";

// Pages - Attendance
import EmployeeAttendancePage from "./pages/attendance/EmployeeAttendancePage";

// Pages - Sales
import SalesPage from "./pages/sales/SalesPage";
import CreateInvoicePage from "./pages/sales/CreateInvoicePage";
import EditInvoicePage from "./pages/sales/EditInvoicePage";
import ViewInvoicePage from "./pages/sales/ViewInvoicePage";
import SalesHistoryPage from "./pages/sales/SalesHistoryPage";

// Pages - Quotations
import QuotationsPage from "./pages/quotations/QuotationsPage";
import CreateQuotationPage from "./pages/quotations/CreateQuotationPage";
import EditQuotationPage from "./pages/quotations/EditQuotationPage";
import ViewQuotationPage from "./pages/quotations/ViewQuotationPage";

// Pages - Reports
import EmployeeReportsPage from "./pages/reports/EmployeeReportsPage";

// Pages - Analytics
import EmployeeSalesAnalyticsPage from "./pages/admin/EmployeeSalesAnalyticsPage";

// Pages - Checklists
import CreateChecklistPage from "./pages/checklists/CreateChecklistPage";
import EditChecklistPage from "./pages/checklists/EditChecklistPage";
import ChecklistsManagementPage from "./pages/checklists/ChecklistsManagementPage";
import EmployeeChecklistDashboard from "./pages/checklists/EmployeeChecklistDashboard";

// Complaints
import ComplaintsPage from "./pages/complaints/ComplaintsPage";
import ViewComplaintPage from "./pages/complaints/ViewComplaintPage";
import ComplaintSettingsPage from "./pages/complaints/ComplaintSettingsPage";

// Pages - Deliveries
import DeliveriesPage from "./pages/deliveries/DeliveriesPage";

// NEW: Pages - Exchanges
import ExchangesPage from "./pages/exchanges/ExchangesPage";

// Add these imports to your src/App.js file
import GiftInvoicesPage from "./pages/gifts/GiftInvoicesPage";
import CreateGiftInvoicePage from "./pages/gifts/CreateGiftInvoicePage";
import EditGiftInvoicePage from "./pages/gifts/EditGiftInvoicePage";
import ViewGiftInvoicePage from "./pages/gifts/ViewGiftInvoicePage";
import GiftSettingsPage from "./pages/gifts/GiftSettingsPage";

// Pages - Error
import NotFoundPage from "./pages/NotFoundPage";

// Custom hook
import { useAuth } from "./contexts/AuthContext/AuthContext";
import { useUserType } from "./contexts/UserTypeContext/UserTypeContext";
import { USER_ROLES } from "./utils/constants/appConstants";

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
              isAuthenticated ? (
                <Navigate to="/dashboard" replace />
              ) : (
                <LoginPage />
              )
            }
          />
          <Route
            path="/register"
            element={
              isAuthenticated ? (
                <Navigate to="/dashboard" replace />
              ) : (
                <RegisterPage />
              )
            }
          />

          {/* Protected routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/notifications"
            element={
              <ProtectedRoute>
                <NotificationsPage />
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

          {/* Attendance routes - Employee only */}
          <Route
            path="/attendance"
            element={
              <ProtectedRoute requiredRole={USER_ROLES.EMPLOYEE}>
                <EmployeeAttendancePage />
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
          <Route
            path="/sales/statistics"
            element={
              <ProtectedRoute requiredRole={USER_ROLES.ADMIN}>
                <SalesStatisticsPage />
              </ProtectedRoute>
            }
          />

          {/* Gift Invoice Routes */}
          <Route
            path="/gifts"
            element={
              <ProtectedRoute>
                <GiftInvoicesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/gifts/create"
            element={
              <ProtectedRoute>
                <CreateGiftInvoicePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/gifts/view/:id"
            element={
              <ProtectedRoute>
                <ViewGiftInvoicePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/gifts/edit/:id"
            element={
              <ProtectedRoute>
                <EditGiftInvoicePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/gifts/settings"
            element={
              <ProtectedRoute requiredRole="admin">
                <GiftSettingsPage />
              </ProtectedRoute>
            }
          />

          {/* Quotation routes */}
          <Route
            path="/quotations"
            element={
              <ProtectedRoute>
                <QuotationsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/quotations/create"
            element={
              <ProtectedRoute>
                <CreateQuotationPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/quotations/edit/:id"
            element={
              <ProtectedRoute>
                <EditQuotationPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/quotations/view/:id"
            element={
              <ProtectedRoute>
                <ViewQuotationPage />
              </ProtectedRoute>
            }
          />

          {/* Reports routes - Admin only */}
          <Route
            path="/reports/employees"
            element={
              <ProtectedRoute requiredRole={USER_ROLES.ADMIN}>
                <EmployeeReportsPage />
              </ProtectedRoute>
            }
          />

          {/* Analytics routes - Admin only */}
          <Route
            path="/analytics/employee-sales"
            element={
              <ProtectedRoute requiredRole={USER_ROLES.ADMIN}>
                <EmployeeSalesAnalyticsPage />
              </ProtectedRoute>
            }
          />

          {/* Checklist routes */}
          <Route
            path="/checklists"
            element={
              <ProtectedRoute requiredRole="admin">
                <ChecklistsManagementPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/checklists/create"
            element={
              <ProtectedRoute requiredRole="admin">
                <CreateChecklistPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/checklists/edit/:id"
            element={
              <ProtectedRoute requiredRole="admin">
                <EditChecklistPage />
              </ProtectedRoute>
            }
          />

          {/* Complaint routes */}
          <Route
            path="/complaints"
            element={
              <ProtectedRoute>
                <ComplaintsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/complaints/view/:id"
            element={
              <ProtectedRoute>
                <ViewComplaintPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/complaints/settings"
            element={
              <ProtectedRoute>
                <ComplaintSettingsPage />
              </ProtectedRoute>
            }
          />

          {/* Employee Checklist Dashboard */}
          <Route
            path="/my-checklists"
            element={
              <ProtectedRoute requiredRole="employee">
                <EmployeeChecklistDashboard />
              </ProtectedRoute>
            }
          />

          {/* Deliveries routes */}
          <Route
            path="/deliveries"
            element={
              <ProtectedRoute>
                <DeliveriesPage />
              </ProtectedRoute>
            }
          />

          {/* NEW: Exchanges routes */}
          <Route
            path="/exchanges"
            element={
              <ProtectedRoute>
                <ExchangesPage />
              </ProtectedRoute>
            }
          />

          {/* Redirect routes */}
          <Route
            path="/"
            element={
              <Navigate
                to={isAuthenticated ? "/dashboard" : "/login"}
                replace
              />
            }
          />

          {/* 404 route */}
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
