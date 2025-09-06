import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  Alert,
  CircularProgress,
  Breadcrumbs,
  Link,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon
} from '@mui/icons-material';

import Layout from '../../components/common/Layout/Layout';
import EmployeeForm from '../../components/employees/EmployeeForm';
import LoadingSpinner from '../../components/common/UI/LoadingSpinner';
import { useEmployees } from '../../hooks/useEmployees';
import { useUserType } from '../../hooks/useUserType';

/**
 * Edit Employee page component
 */
const EditEmployeePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const {
    currentEmployee,
    loading,
    error,
    updateEmployee,
    getEmployeeById,
    clearError
  } = useEmployees();
  
  const { getDisplayName } = useUserType();
  
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // Load employee data
  useEffect(() => {
    if (id) {
      getEmployeeById(id);
    }
  }, [id, getEmployeeById]);

  // Clear errors on mount
  useEffect(() => {
    clearError();
    setSubmitError('');
  }, [clearError]);

  // Handle form submission
  const handleSubmit = async (employeeData) => {
    try {
      setSubmitLoading(true);
      setSubmitError('');
      
      await updateEmployee(id, employeeData);
      navigate('/employees', { 
        state: { 
          message: 'Employee updated successfully',
          severity: 'success'
        }
      });
    } catch (err) {
      setSubmitError(err.message || 'Failed to update employee');
    } finally {
      setSubmitLoading(false);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    navigate('/employees');
  };

  // Handle back navigation
  const handleBack = () => {
    navigate('/employees');
  };

  if (loading) {
    return (
      <Layout>
        <Container maxWidth="lg" sx={{ py: 3 }}>
          <LoadingSpinner message="Loading employee..." />
        </Container>
      </Layout>
    );
  }

  if (error && !currentEmployee) {
    return (
      <Layout>
        <Container maxWidth="lg" sx={{ py: 3 }}>
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={handleBack}
          >
            Back to Employees
          </Button>
        </Container>
      </Layout>
    );
  }

  if (!currentEmployee) {
    return (
      <Layout>
        <Container maxWidth="lg" sx={{ py: 3 }}>
          <Alert severity="warning" sx={{ mb: 2 }}>
            Employee not found
          </Alert>
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={handleBack}
          >
            Back to Employees
          </Button>
        </Container>
      </Layout>
    );
  }

  return (
    <Layout>
      <Container 
        maxWidth="lg" 
        sx={{ 
          py: { xs: 2, sm: 3 },
          px: { xs: 1, sm: 2 }
        }}
      >
        {/* Header */}
        <Box sx={{ mb: 3 }}>
          {/* Breadcrumbs */}
          <Breadcrumbs sx={{ mb: 2 }}>
            <Link
              color="inherit"
              href="/dashboard"
              onClick={(e) => {
                e.preventDefault();
                navigate('/dashboard');
              }}
              sx={{ 
                textDecoration: 'none',
                '&:hover': { textDecoration: 'underline' }
              }}
            >
              Dashboard
            </Link>
            <Link
              color="inherit"
              href="/employees"
              onClick={(e) => {
                e.preventDefault();
                navigate('/employees');
              }}
              sx={{ 
                textDecoration: 'none',
                '&:hover': { textDecoration: 'underline' }
              }}
            >
              Employees
            </Link>
            <Typography color="text.primary">
              Edit Employee
            </Typography>
          </Breadcrumbs>

          {/* Page Title and Actions */}
          <Box 
            sx={{ 
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              justifyContent: 'space-between',
              alignItems: { xs: 'flex-start', sm: 'center' },
              gap: { xs: 2, sm: 0 },
              mb: 2
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <EditIcon color="primary" />
              <Typography 
                variant="h4" 
                sx={{ 
                  fontSize: { xs: '1.5rem', sm: '2rem' },
                  fontWeight: 600
                }}
              >
                Edit Employee
              </Typography>
            </Box>
            
            <Button
              variant="outlined"
              startIcon={<ArrowBackIcon />}
              onClick={handleBack}
              sx={{
                minWidth: { xs: 'auto', sm: 'unset' },
                width: { xs: '100%', sm: 'auto' }
              }}
            >
              Back to Employees
            </Button>
          </Box>

          {/* Employee Info */}
          <Typography 
            variant="body1" 
            color="text.secondary"
            sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
          >
            Editing {getDisplayName().toLowerCase()} employee: {currentEmployee.name}
          </Typography>
        </Box>

        {/* Error Alert */}
        {(error || submitError) && (
          <Alert 
            severity="error" 
            sx={{ 
              mb: 3,
              fontSize: { xs: '0.875rem', sm: '1rem' }
            }}
            onClose={() => {
              clearError();
              setSubmitError('');
            }}
          >
            {submitError || error}
          </Alert>
        )}

        {/* Form */}
        <Paper 
          elevation={0} 
          sx={{ 
            p: { xs: 2, sm: 3 },
            backgroundColor: 'background.paper',
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'divider'
          }}
        >
          <EmployeeForm
            employee={currentEmployee}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            isEdit={true}
            loading={submitLoading}
            error={submitError}
          />
        </Paper>
      </Container>
    </Layout>
  );
};

export default EditEmployeePage;