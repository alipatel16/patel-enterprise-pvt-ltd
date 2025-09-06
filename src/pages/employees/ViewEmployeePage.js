import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  Alert,
  Breadcrumbs,
  Link,
  Grid,
  Card,
  CardContent,
  Chip,
  Divider,
  Avatar,
  IconButton,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Work as WorkIcon,
  CalendarToday as CalendarIcon,
  LocationOn as LocationIcon,
  ContactPhone as ContactPhoneIcon
} from '@mui/icons-material';

import Layout from '../../components/common/Layout/Layout';
import LoadingSpinner from '../../components/common/UI/LoadingSpinner';
import ConfirmDialog from '../../components/common/UI/ConfirmDialog';
import { EmployeeProvider, useEmployee } from '../../contexts/EmployeeContext/EmployeeContext';
import { useAuth } from '../../contexts/AuthContext/AuthContext';
import { useUserType } from '../../contexts/UserTypeContext/UserTypeContext';
import { formatDate } from '../../utils/helpers/formatHelpers';
import { USER_ROLES } from '../../utils/constants/appConstants';

/**
 * View Employee page content component
 */
const ViewEmployeePageContent = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const {
    currentEmployee,
    loading,
    error,
    deleteEmployee,
    getEmployeeById,
    clearError
  } = useEmployee();
  
  const { user } = useAuth();
  const { getDisplayName, getThemeColors } = useUserType();
  
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  
  const themeColors = getThemeColors();

  // Load employee data
  useEffect(() => {
    if (id) {
      getEmployeeById(id);
    }
  }, [id, getEmployeeById]);

  // Clear errors on mount
  useEffect(() => {
    clearError();
  }, [clearError]);

  // Handle edit
  const handleEdit = () => {
    navigate(`/employees/edit/${id}`);
  };

  // Handle delete
  const handleDelete = async () => {
    try {
      setDeleteLoading(true);
      const success = await deleteEmployee(id);
      if (success) {
        navigate('/employees', { 
          state: { 
            message: 'Employee deleted successfully',
            severity: 'success'
          }
        });
      }
    } catch (err) {
      console.error('Error deleting employee:', err);
    } finally {
      setDeleteLoading(false);
      setShowDeleteDialog(false);
    }
  };

  const breadcrumbs = [
    {
      label: 'Employees',
      path: '/employees'
    },
    {
      label: currentEmployee?.name || 'Employee Details',
      path: `/employees/view/${id}`
    }
  ];

  // Handle back navigation
  const handleBack = () => {
    navigate('/employees');
  };

  // Check if user can edit/delete
  const canEdit = user?.role === USER_ROLES.ADMIN;
  const canDelete = user?.role === USER_ROLES.ADMIN && currentEmployee?.id !== user?.uid;

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
    <Layout title="Employee Details" breadcrumbs={breadcrumbs}>
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
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar
                sx={{
                  bgcolor: themeColors.primary,
                  width: { xs: 48, sm: 56 },
                  height: { xs: 48, sm: 56 }
                }}
              >
                <PersonIcon sx={{ fontSize: { xs: 24, sm: 28 } }} />
              </Avatar>
              <Box>
                <Typography 
                  variant="h4" 
                  sx={{ 
                    fontSize: { xs: '1.5rem', sm: '2rem' },
                    fontWeight: 600
                  }}
                >
                  {currentEmployee.name}
                </Typography>
                <Typography 
                  variant="body1" 
                  color="text.secondary"
                  sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
                >
                  {currentEmployee.designation || currentEmployee.role}
                </Typography>
              </Box>
            </Box>
            
            <Box 
              sx={{ 
                display: 'flex', 
                gap: 1,
                width: { xs: '100%', sm: 'auto' },
                flexDirection: { xs: 'column', sm: 'row' }
              }}
            >
              <Button
                variant="outlined"
                startIcon={<ArrowBackIcon />}
                onClick={handleBack}
                sx={{ 
                  flex: { xs: 1, sm: 'none' },
                  minWidth: { xs: 'auto', sm: 120 }
                }}
              >
                Back
              </Button>
              
              {canEdit && (
                <Button
                  variant="contained"
                  startIcon={<EditIcon />}
                  onClick={handleEdit}
                  sx={{ 
                    flex: { xs: 1, sm: 'none' },
                    minWidth: { xs: 'auto', sm: 120 }
                  }}
                >
                  Edit
                </Button>
              )}
              
              {canDelete && (
                <IconButton
                  color="error"
                  onClick={() => setShowDeleteDialog(true)}
                  sx={{
                    alignSelf: { xs: 'stretch', sm: 'center' },
                    width: { xs: '100%', sm: 'auto' },
                    height: { xs: '40px', sm: 'auto' }
                  }}
                >
                  <DeleteIcon />
                </IconButton>
              )}
            </Box>
          </Box>

          {/* Employee Status */}
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Chip
              label={currentEmployee.isActive ? 'Active' : 'Inactive'}
              color={currentEmployee.isActive ? 'success' : 'error'}
              size={isMobile ? 'small' : 'medium'}
            />
            <Chip
              label={currentEmployee.role}
              variant="outlined"
              size={isMobile ? 'small' : 'medium'}
            />
            {currentEmployee.department && (
              <Chip
                label={currentEmployee.department}
                variant="outlined"
                size={isMobile ? 'small' : 'medium'}
              />
            )}
          </Box>
        </Box>

        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={clearError}>
            {error}
          </Alert>
        )}

        {/* Employee Details */}
        <Grid container spacing={{ xs: 2, sm: 3 }}>
          {/* Basic Information */}
          <Grid item xs={12} md={6}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <PersonIcon color="primary" />
                  Basic Information
                </Typography>
                
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <EmailIcon color="action" fontSize="small" />
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Email
                      </Typography>
                      <Typography variant="body1">
                        {currentEmployee.email || 'Not provided'}
                      </Typography>
                    </Box>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PhoneIcon color="action" fontSize="small" />
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Phone
                      </Typography>
                      <Typography variant="body1">
                        {currentEmployee.phone}
                      </Typography>
                    </Box>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CalendarIcon color="action" fontSize="small" />
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Joined Date
                      </Typography>
                      <Typography variant="body1">
                        {formatDate(currentEmployee.joinedDate || currentEmployee.dateOfJoining)}
                      </Typography>
                    </Box>
                  </Box>

                  {currentEmployee.address && (
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                      <LocationIcon color="action" fontSize="small" />
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Address
                        </Typography>
                        <Typography variant="body1">
                          {currentEmployee.address}
                        </Typography>
                      </Box>
                    </Box>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Work Information */}
          <Grid item xs={12} md={6}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <WorkIcon color="primary" />
                  Work Information
                </Typography>
                
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Employee ID
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                      {currentEmployee.employeeId}
                    </Typography>
                  </Box>

                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Role
                    </Typography>
                    <Typography variant="body1">
                      {currentEmployee.role}
                    </Typography>
                  </Box>

                  {currentEmployee.department && (
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Department
                      </Typography>
                      <Typography variant="body1">
                        {currentEmployee.department}
                      </Typography>
                    </Box>
                  )}

                  {currentEmployee.salary && (
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Salary
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 600 }}>
                        ₹{Number(currentEmployee.salary).toLocaleString()}
                      </Typography>
                    </Box>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Emergency Contact */}
          {(currentEmployee.emergencyContact || currentEmployee.emergencyPhone) && (
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <ContactPhoneIcon color="primary" />
                    Emergency Contact
                  </Typography>
                  
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {currentEmployee.emergencyContact && (
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Contact Name
                        </Typography>
                        <Typography variant="body1">
                          {currentEmployee.emergencyContact}
                        </Typography>
                      </Box>
                    )}

                    {currentEmployee.emergencyPhone && (
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Contact Phone
                        </Typography>
                        <Typography variant="body1">
                          {currentEmployee.emergencyPhone}
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          )}

          {/* Permissions */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Permissions
                </Typography>
                
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2">
                      Can Create Invoices
                    </Typography>
                    <Chip
                      label={currentEmployee.canCreateInvoices ? 'Yes' : 'No'}
                      color={currentEmployee.canCreateInvoices ? 'success' : 'error'}
                      size="small"
                    />
                  </Box>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2">
                      Can Manage Customers
                    </Typography>
                    <Chip
                      label={currentEmployee.canManageCustomers ? 'Yes' : 'No'}
                      color={currentEmployee.canManageCustomers ? 'success' : 'error'}
                      size="small"
                    />
                  </Box>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2">
                      Can View Reports
                    </Typography>
                    <Chip
                      label={currentEmployee.canViewReports ? 'Yes' : 'No'}
                      color={currentEmployee.canViewReports ? 'success' : 'error'}
                      size="small"
                    />
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Delete Confirmation Dialog */}
        <ConfirmDialog
          open={showDeleteDialog}
          title="Delete Employee"
          message={`Are you sure you want to delete ${currentEmployee.name}? This action cannot be undone.`}
          confirmText="Delete"
          cancelText="Cancel"
          onConfirm={handleDelete}
          onCancel={() => setShowDeleteDialog(false)}
          loading={deleteLoading}
          severity="error"
        />
      </Container>
    </Layout>
  );
};

/**
 * Main View Employee page component with Provider
 */
const ViewEmployeePage = () => {
  return (
    <EmployeeProvider>
      <ViewEmployeePageContent />
    </EmployeeProvider>
  );
};

export default ViewEmployeePage;