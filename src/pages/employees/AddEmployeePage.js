import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Box, 
  Alert, 
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Typography,
  IconButton,
  InputAdornment,
  CircularProgress
} from '@mui/material';
import {
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Lock as LockIcon,
  Security as SecurityIcon
} from '@mui/icons-material';

import Layout from '../../components/common/Layout/Layout';
import EmployeeForm from '../../components/employees/EmployeeForm';
import { EmployeeProvider, useEmployee } from '../../contexts/EmployeeContext/EmployeeContext';
import { useAuth } from '../../contexts/AuthContext/AuthContext';

// Page Content Component
const AddEmployeePageContent = () => {
  const navigate = useNavigate();
  const { createEmployee, loading, error } = useEmployee();
  const { user } = useAuth(); // Get current admin user
  
  const [submitError, setSubmitError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  
  // Password confirmation dialog states
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [tempFormData, setTempFormData] = useState(null);
  const [confirmLoading, setConfirmLoading] = useState(false);

  const breadcrumbs = [
    {
      label: 'Employees',
      path: '/employees'
    },
    {
      label: 'Add Employee',
      path: '/employees/add'
    }
  ];

  // Handle initial form submission - show password dialog
  const handleSubmit = async (employeeData) => {
    try {
      setSubmitError(null);
      setSuccessMessage(null);
      
      // Store form data and show password confirmation dialog
      setTempFormData(employeeData);
      setPasswordDialogOpen(true);
      
    } catch (error) {
      console.error('Error preparing employee creation:', error);
      setSubmitError(error.message || 'Failed to prepare employee creation.');
    }
  };

  // Handle admin password confirmation and actual employee creation
  const handleConfirmCreation = async () => {
    if (!adminPassword.trim()) {
      setPasswordError('Admin password is required');
      return;
    }

    if (!user?.email) {
      setPasswordError('Unable to get admin email');
      return;
    }

    try {
      setConfirmLoading(true);
      setPasswordError('');

      // Prepare admin credentials
      const adminCredentials = {
        email: user.email,
        password: adminPassword
      };

      // Create employee with admin credentials
      const newEmployee = await createEmployee(tempFormData, adminCredentials);
      
      if (newEmployee) {
        // Success - close dialog and show success message
        setPasswordDialogOpen(false);
        setAdminPassword('');
        setTempFormData(null);
        setSuccessMessage('Employee and user account created successfully!');
        
        // Redirect to employee list after a short delay
        setTimeout(() => {
          navigate('/employees');
        }, 2000);
      } else {
        setPasswordError('Failed to create employee. Please check your password.');
      }
    } catch (error) {
      console.error('Error creating employee:', error);
      
      // Handle specific auth errors
      if (error.message.includes('auth/wrong-password') || error.message.includes('auth/invalid-credential')) {
        setPasswordError('Incorrect admin password. Please try again.');
      } else if (error.message.includes('auth/too-many-requests')) {
        setPasswordError('Too many failed attempts. Please wait a moment and try again.');
      } else {
        setPasswordError(error.message || 'Failed to create employee and user account.');
      }
    } finally {
      setConfirmLoading(false);
    }
  };

  // Handle cancel password dialog
  const handleCancelPassword = () => {
    setPasswordDialogOpen(false);
    setAdminPassword('');
    setPasswordError('');
    setTempFormData(null);
  };

  // Handle form cancellation
  const handleCancel = () => {
    navigate('/employees');
  };

  // Toggle password visibility
  const handleTogglePassword = () => {
    setShowPassword(prev => !prev);
  };

  return (
    <Layout 
      title="Add New Employee" 
      breadcrumbs={breadcrumbs}
    >
      <Box>
        {/* Success Message */}
        {successMessage && (
          <Alert severity="success" sx={{ mb: 3 }}>
            {successMessage}
          </Alert>
        )}

        {/* Error Message */}
        {submitError && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {submitError}
          </Alert>
        )}

        {/* Employee Form */}
        <EmployeeForm
          isEdit={false}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          loading={loading}
          error={error}
        />

        {/* Admin Password Confirmation Dialog */}
        <Dialog 
          open={passwordDialogOpen} 
          onClose={handleCancelPassword}
          maxWidth="sm"
          fullWidth
          disableEscapeKeyDown={confirmLoading}
        >
          <DialogTitle>
            <Box display="flex" alignItems="center" gap={2}>
              <SecurityIcon color="primary" />
              <Box>
                <Typography variant="h6">Confirm Admin Password</Typography>
                <Typography variant="body2" color="text.secondary">
                  To create employee accounts, please confirm your admin password
                </Typography>
              </Box>
            </Box>
          </DialogTitle>
          
          <DialogContent>
            <Alert severity="info" sx={{ mb: 3 }}>
              <Typography variant="body2">
                This creates both an employee record and a user account. Your admin session will be preserved.
              </Typography>
            </Alert>

            <Box display="flex" alignItems="center" gap={2} mb={2}>
              <Typography variant="body2" color="text.secondary">
                Admin Email:
              </Typography>
              <Typography variant="body2" fontWeight="medium">
                {user?.email}
              </Typography>
            </Box>

            <TextField
              fullWidth
              label="Admin Password"
              type={showPassword ? "text" : "password"}
              value={adminPassword}
              onChange={(e) => {
                setAdminPassword(e.target.value);
                if (passwordError) setPasswordError('');
              }}
              error={!!passwordError}
              helperText={passwordError || "Enter your current admin password to confirm"}
              disabled={confirmLoading}
              autoFocus
              sx={{ mt: 2 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockIcon color="action" />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={handleTogglePassword}
                      onMouseDown={(e) => e.preventDefault()}
                      disabled={confirmLoading}
                      size="small"
                    >
                      {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !confirmLoading) {
                  handleConfirmCreation();
                }
              }}
            />
          </DialogContent>
          
          <DialogActions sx={{ p: 3 }}>
            <Button 
              onClick={handleCancelPassword}
              disabled={confirmLoading}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleConfirmCreation}
              variant="contained"
              disabled={confirmLoading || !adminPassword.trim()}
              startIcon={
                confirmLoading ? 
                <CircularProgress size={20} /> : 
                <SecurityIcon />
              }
            >
              {confirmLoading ? 'Creating Employee...' : 'Confirm & Create'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Layout>
  );
};

// Main Component with Provider
const AddEmployeePage = () => {
  return (
    <EmployeeProvider>
      <AddEmployeePageContent />
    </EmployeeProvider>
  );
};

export default AddEmployeePage;