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
import { EmployeeProvider, useEmployee } from '../../contexts/EmployeeContext/EmployeeContext';
import { useUserType } from '../../contexts/UserTypeContext/UserTypeContext';

/**
 * Helper function to safely parse dates and handle edge cases
 */
const safeParseDate = (dateValue) => {
  if (!dateValue) return null;
  
  try {
    // Handle different date formats and edge cases
    let date;
    
    if (dateValue instanceof Date) {
      date = dateValue;
    } else if (typeof dateValue === 'string') {
      // Handle various string formats
      if (dateValue.includes('T') || dateValue.includes('Z')) {
        // ISO format
        date = new Date(dateValue);
      } else if (dateValue.match(/^\d{4}-\d{2}-\d{2}$/)) {
        // YYYY-MM-DD format
        date = new Date(dateValue + 'T00:00:00');
      } else if (dateValue.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
        // DD/MM/YYYY format
        const [day, month, year] = dateValue.split('/');
        date = new Date(year, month - 1, day);
      } else {
        // Try generic parsing
        date = new Date(dateValue);
      }
    } else if (typeof dateValue === 'number') {
      // Timestamp
      date = new Date(dateValue);
    } else {
      console.warn('Unrecognized date format:', dateValue);
      return null;
    }
    
    // Validate the resulting date
    if (isNaN(date.getTime())) {
      console.warn('Invalid date after parsing:', dateValue);
      return null;
    }
    
    // Check reasonable date range (1900 to current year + 1)
    const currentYear = new Date().getFullYear();
    const minDate = new Date(1900, 0, 1);
    const maxDate = new Date(currentYear + 1, 11, 31);
    
    if (date < minDate || date > maxDate) {
      console.warn('Date out of reasonable range:', dateValue, date);
      return null;
    }
    
    return date;
  } catch (error) {
    console.error('Error parsing date:', error, 'for value:', dateValue);
    return null;
  }
};

/**
 * Helper function to safely process employee data
 */
const processEmployeeData = (employee) => {
  if (!employee) return null;
  
  console.log('Processing employee data:', employee);
  
  // Handle date fields safely
  const joinedDate = safeParseDate(employee.joinedDate || employee.dateOfJoining);
  
  // Return processed employee data with safe defaults
  const processedData = {
    ...employee,
    // Ensure required fields have safe defaults
    name: employee.name || '',
    email: employee.email || '',
    phone: employee.phone || '',
    role: employee.role || '',
    department: employee.department || '',
    employeeId: employee.employeeId || '',
    
    // Handle date fields
    joinedDate: joinedDate,
    dateOfJoining: joinedDate, // Ensure both field names are set
    
    // Handle optional fields with safe defaults
    address: employee.address || '',
    salary: employee.salary || '',
    designation: employee.designation || '',
    emergencyContact: employee.emergencyContact || '',
    emergencyPhone: employee.emergencyPhone || '',
    
    // Handle boolean fields
    isActive: employee.isActive !== undefined ? employee.isActive : true,
    canCreateInvoices: employee.canCreateInvoices || false,
    canManageCustomers: employee.canManageCustomers || false,
    canViewReports: employee.canViewReports || false,
  };
  
  console.log('Processed employee data:', processedData);
  return processedData;
};

/**
 * Edit Employee page content component
 */
const EditEmployeePageContent = () => {
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
  } = useEmployee();
  
  const { getDisplayName } = useUserType();
  
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [processedEmployee, setProcessedEmployee] = useState(null);

  // Load employee data with improved error handling
  useEffect(() => {
    const loadEmployee = async () => {
      if (id) {
        console.log('Loading employee with ID:', id);
        try {
          clearError();
          const employee = await getEmployeeById(id);
          console.log('Raw employee data received:', employee);
          
          if (employee) {
            const processed = processEmployeeData(employee);
            setProcessedEmployee(processed);
          } else {
            console.warn('No employee data received for ID:', id);
          }
        } catch (err) {
          console.error('Error loading employee:', err);
        }
      }
    };
    
    loadEmployee();
  }, [id, getEmployeeById, clearError]);

  // Process current employee when it changes
  useEffect(() => {
    if (currentEmployee && !processedEmployee) {
      console.log('Processing current employee from context:', currentEmployee);
      const processed = processEmployeeData(currentEmployee);
      setProcessedEmployee(processed);
    }
  }, [currentEmployee, processedEmployee]);

  // Clear errors on mount
  useEffect(() => {
    clearError();
    setSubmitError('');
  }, [clearError]);

  // Handle form submission
  // const handleSubmit = async (employeeData) => {
  //   try {
  //     setSubmitLoading(true);
  //     setSubmitError('');
      
  //     console.log('Submitting employee data:', employeeData);
      
  //     // Process the form data before submission
  //     const dataToSubmit = {
  //       ...employeeData,
  //       // Ensure date is properly formatted for storage
  //       joinedDate: employeeData.joinedDate ? employeeData.joinedDate.toISOString() : null,
  //       dateOfJoining: employeeData.joinedDate ? employeeData.joinedDate.toISOString() : null,
  //     };
      
  //     const result = await updateEmployee(id, dataToSubmit);
  //     console.log('Update result:', result);
      
  //     if (result) {
  //       navigate('/employees', { 
  //         state: { 
  //           message: 'Employee updated successfully',
  //           severity: 'success'
  //         }
  //       });
  //     }
  //   } catch (err) {
  //     console.error('Error updating employee:', err);
  //     setSubmitError(err.message || 'Failed to update employee');
  //   } finally {
  //     setSubmitLoading(false);
  //   }
  // };

  const handleSubmit = async (employeeData) => {
  try {
    setSubmitLoading(true);
    setSubmitError('');
    
    console.log('Submitting employee data:', employeeData);
    
    // Safe date conversion function
    const convertDateForStorage = (dateValue) => {
      if (!dateValue) return null;
      
      try {
        // If it's already a Date object
        if (dateValue instanceof Date) {
          return isNaN(dateValue.getTime()) ? null : dateValue.toISOString();
        }
        
        // If it's a string, try to parse it
        if (typeof dateValue === 'string') {
          const parsed = new Date(dateValue);
          return isNaN(parsed.getTime()) ? null : parsed.toISOString();
        }
        
        // If it's a timestamp
        if (typeof dateValue === 'number') {
          const parsed = new Date(dateValue);
          return isNaN(parsed.getTime()) ? null : parsed.toISOString();
        }
        
        console.warn('Unrecognized date format:', dateValue);
        return null;
      } catch (error) {
        console.error('Error converting date for storage:', error);
        return null;
      }
    };
    
    // Process the form data before submission
    const dataToSubmit = {
      ...employeeData,
      // Safely convert date fields
      joinedDate: convertDateForStorage(employeeData.joinedDate),
      dateOfJoining: convertDateForStorage(employeeData.joinedDate), // Use same date for both fields
      
      // Handle other fields safely
      salary: employeeData.salary ? parseFloat(employeeData.salary) || null : null,
      
      // Ensure boolean fields are properly set
      isActive: employeeData.isActive !== undefined ? Boolean(employeeData.isActive) : true,
      canCreateInvoices: Boolean(employeeData.canCreateInvoices),
      canManageCustomers: Boolean(employeeData.canManageCustomers),
      canViewReports: Boolean(employeeData.canViewReports),
    };
    
    console.log('Processed data for submission:', dataToSubmit);
    
    const result = await updateEmployee(id, dataToSubmit);
    console.log('Update result:', result);
    
    if (result) {
      navigate('/employees', { 
        state: { 
          message: 'Employee updated successfully',
          severity: 'success'
        }
      });
    }
  } catch (err) {
    console.error('Error updating employee:', err);
    setSubmitError(err.message || 'Failed to update employee');
  } finally {
    setSubmitLoading(false);
  }
};

  const breadcrumbs = [
    {
      label: 'Employees',
      path: '/employees'
    },
    {
      label: processedEmployee?.name || 'Employee Details',
      path: `/employees/edit/${id}`
    }
  ];

  // Handle cancel
  const handleCancel = () => {
    navigate('/employees');
  };

  // Handle back navigation
  const handleBack = () => {
    navigate('/employees');
  };

  // Show loading state
  if (loading) {
    return (
      <Layout title="Loading..." breadcrumbs={breadcrumbs}>
        <Container maxWidth="lg" sx={{ py: 3 }}>
          <LoadingSpinner message="Loading employee data..." />
        </Container>
      </Layout>
    );
  }

  // Show error state if no employee data after loading
  if (error && !processedEmployee) {
    return (
      <Layout title="Error" breadcrumbs={breadcrumbs}>
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

  // Show not found state
  if (!loading && !processedEmployee) {
    return (
      <Layout title="Employee Not Found" breadcrumbs={breadcrumbs}>
        <Container maxWidth="lg" sx={{ py: 3 }}>
          <Alert severity="warning" sx={{ mb: 2 }}>
            Employee not found or failed to load employee data.
          </Alert>
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Employee ID: {id}
            </Typography>
            <Button
              variant="outlined"
              startIcon={<ArrowBackIcon />}
              onClick={handleBack}
            >
              Back to Employees
            </Button>
          </Box>
        </Container>
      </Layout>
    );
  }

  return (
    <Layout title="Edit Employee" breadcrumbs={breadcrumbs}>
      <Container 
        maxWidth="lg" 
        sx={{ 
          py: { xs: 2, sm: 3 },
          px: { xs: 1, sm: 2 }
        }}
      >
        {/* Header */}
        <Box sx={{ mb: 3 }}>
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
          {processedEmployee ? (
            <EmployeeForm
              employee={processedEmployee}
              onSubmit={handleSubmit}
              onCancel={handleCancel}
              isEdit={true}
              loading={submitLoading}
              error={submitError}
            />
          ) : (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <CircularProgress />
              <Typography variant="body1" sx={{ mt: 2 }}>
                Processing employee data...
              </Typography>
            </Box>
          )}
        </Paper>
      </Container>
    </Layout>
  );
};

/**
 * Main Edit Employee page component with Provider
 */
const EditEmployeePage = () => {
  return (
    <EmployeeProvider>
      <EditEmployeePageContent />
    </EmployeeProvider>
  );
};

export default EditEmployeePage;