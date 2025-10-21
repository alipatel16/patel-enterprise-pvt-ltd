import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  Button,
  Avatar,
  Divider,
  Alert,
  Skeleton,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  useTheme,
  Paper,
  alpha
} from '@mui/material';
import {
  Person as PersonIcon,
  Business as BusinessIcon,
  School as SchoolIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  LocationOn as LocationIcon,
  CalendarToday as CalendarIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  MoreVert as MoreVertIcon,
  Receipt as ReceiptIcon,
  History as HistoryIcon,
  ContactPhone as ContactPhoneIcon,
  Description as DescriptionIcon,
  ContactMail as ContactMailIcon
} from '@mui/icons-material';

import Layout from '../../components/common/Layout/Layout';
import { CustomerProvider, useCustomer } from '../../contexts/CustomerContext/CustomerContext';
import { useAuth } from '../../contexts/AuthContext/AuthContext';
import { formatCustomerForDisplay } from '../../utils/validation/customerValidation';
import { CUSTOMER_TYPES, CUSTOMER_CATEGORIES } from '../../utils/constants/appConstants';

// Page Content Component
const ViewCustomerPageContent = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const theme = useTheme();
  
  const { 
    currentCustomer, 
    getCustomerById, 
    deleteCustomer, 
  } = useCustomer();
  const { canDelete } = useAuth();
  
  const [customerLoading, setCustomerLoading] = useState(true);
  const [customerNotFound, setCustomerNotFound] = useState(false);
  const [actionMenuAnchor, setActionMenuAnchor] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Load customer data
  useEffect(() => {
    const loadCustomer = async () => {
      if (id) {
        setCustomerLoading(true);
        try {
          const customer = await getCustomerById(id);
          if (!customer) {
            setCustomerNotFound(true);
          }
        } catch (error) {
          console.error('Error loading customer:', error);
          setCustomerNotFound(true);
        } finally {
          setCustomerLoading(false);
        }
      }
    };

    loadCustomer();
  }, [id, getCustomerById]);

  const breadcrumbs = [
    {
      label: 'Customers',
      path: '/customers'
    },
    {
      label: currentCustomer?.name || 'Customer Details',
      path: `/customers/view/${id}`
    }
  ];

  // Handle action menu
  const handleActionMenuOpen = (event) => {
    setActionMenuAnchor(event.currentTarget);
  };

  const handleActionMenuClose = () => {
    setActionMenuAnchor(null);
  };

  // Handle delete
  const handleDeleteClick = () => {
    setDeleteDialogOpen(true);
    handleActionMenuClose();
  };

  const handleDeleteConfirm = async () => {
    setDeleting(true);
    try {
      const success = await deleteCustomer(id);
      if (success) {
        navigate('/customers');
      }
    } catch (error) {
      console.error('Delete error:', error);
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
  };

  // Get category icon
  const getCategoryIcon = (category) => {
    switch (category) {
      case CUSTOMER_CATEGORIES.INDIVIDUAL:
        return <PersonIcon />;
      case CUSTOMER_CATEGORIES.FIRM:
        return <BusinessIcon />;
      case CUSTOMER_CATEGORIES.SCHOOL:
        return <SchoolIcon />;
      default:
        return <PersonIcon />;
    }
  };

  // Get customer type color
  const getCustomerTypeColor = (type) => {
    return type === CUSTOMER_TYPES.WHOLESALER ? 'primary' : 'secondary';
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Show loading skeleton
  if (customerLoading) {
    return (
      <Layout title="Customer Details" breadcrumbs={breadcrumbs}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent sx={{ p: 3 }}>
                {/* Header Skeleton */}
                <Box display="flex" alignItems="center" gap={3} mb={3}>
                  <Skeleton variant="circular" width={80} height={80} />
                  <Box flex={1}>
                    <Skeleton variant="text" width={200} height={40} />
                    <Skeleton variant="text" width={150} height={24} />
                    <Box display="flex" gap={1} mt={1}>
                      <Skeleton variant="rectangular" width={80} height={24} />
                      <Skeleton variant="rectangular" width={60} height={24} />
                    </Box>
                  </Box>
                </Box>

                {/* Contact Info Skeleton */}
                <Box mb={3}>
                  <Skeleton variant="text" width={120} height={28} sx={{ mb: 2 }} />
                  {Array.from({ length: 3 }).map((_, index) => (
                    <Box display="flex" alignItems="center" gap={2} mb={2} key={index}>
                      <Skeleton variant="circular" width={24} height={24} />
                      <Skeleton variant="text" width={200} height={24} />
                    </Box>
                  ))}
                </Box>

                {/* Address Skeleton */}
                <Box mb={3}>
                  <Skeleton variant="text" width={80} height={28} sx={{ mb: 2 }} />
                  <Skeleton variant="text" width="100%" height={24} />
                  <Skeleton variant="text" width="80%" height={24} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Skeleton variant="text" width={100} height={28} sx={{ mb: 2 }} />
                <Box display="flex" gap={1} mb={3}>
                  <Skeleton variant="rectangular" width={80} height={36} />
                  <Skeleton variant="rectangular" width={80} height={36} />
                </Box>
                <Skeleton variant="rectangular" width="100%" height={120} />
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Layout>
    );
  }

  // Show error if customer not found
  if (customerNotFound) {
    return (
      <Layout title="Customer Details" breadcrumbs={breadcrumbs}>
        <Alert severity="error">
          Customer not found. The customer may have been deleted or the ID is invalid.
        </Alert>
      </Layout>
    );
  }

  // Show error if no customer data
  if (!currentCustomer) {
    return (
      <Layout title="Customer Details" breadcrumbs={breadcrumbs}>
        <Alert severity="warning">
          Unable to load customer data. Please try refreshing the page.
        </Alert>
      </Layout>
    );
  }

  const formattedCustomer = formatCustomerForDisplay(currentCustomer);

  return (
    <Layout 
      title={currentCustomer.name} 
      breadcrumbs={breadcrumbs}
    >
      <Grid container spacing={3}>
        {/* Main Customer Info */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent sx={{ p: 3 }}>
              {/* Header */}
              <Box display="flex" alignItems="flex-start" justifyContent="space-between" mb={3}>
                <Box display="flex" alignItems="center" gap={3}>
                  <Avatar
                    sx={{
                      width: 80,
                      height: 80,
                      bgcolor: theme.palette.primary.main,
                      fontSize: '2rem'
                    }}
                  >
                    {getCategoryIcon(currentCustomer.category)}
                  </Avatar>
                  <Box>
                    <Typography variant="h4" component="h1" gutterBottom>
                      {currentCustomer.name}
                    </Typography>
                    <Typography variant="body1" color="text.secondary" gutterBottom>
                      Customer ID: {currentCustomer.id.slice(-8).toUpperCase()}
                    </Typography>
                    <Box display="flex" gap={1} flexWrap="wrap">
                      <Chip
                        label={formattedCustomer.customerTypeDisplay}
                        color={getCustomerTypeColor(currentCustomer.customerType)}
                        size="small"
                      />
                      <Chip
                        label={formattedCustomer.categoryDisplay}
                        variant="outlined"
                        size="small"
                      />
                    </Box>
                  </Box>
                </Box>

                <IconButton onClick={handleActionMenuOpen}>
                  <MoreVertIcon />
                </IconButton>
              </Box>

              <Divider sx={{ mb: 3 }} />

              {/* Contact Information */}
              <Box mb={3}>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                  Contact Information
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Box display="flex" alignItems="center" gap={2} mb={2}>
                      <PhoneIcon color="primary" />
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Phone
                        </Typography>
                        <Typography variant="body1" fontWeight={500}>
                          {currentCustomer.phone}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>

                  {currentCustomer.email && (
                    <Grid item xs={12} sm={6}>
                      <Box display="flex" alignItems="center" gap={2} mb={2}>
                        <EmailIcon color="primary" />
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            Email
                          </Typography>
                          <Typography variant="body1" fontWeight={500}>
                            {currentCustomer.email}
                          </Typography>
                        </Box>
                      </Box>
                    </Grid>
                  )}

                  {currentCustomer.gstNumber && (
                    <Grid item xs={12}>
                      <Box display="flex" alignItems="center" gap={2} mb={2}>
                        <BusinessIcon color="primary" />
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            GST Number
                          </Typography>
                          <Typography variant="body1" fontWeight={500}>
                            {currentCustomer.gstNumber}
                          </Typography>
                        </Box>
                      </Box>
                    </Grid>
                  )}
                </Grid>
              </Box>

              <Divider sx={{ mb: 3 }} />

              {/* Address Information */}
              <Box mb={3}>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                  Address
                </Typography>
                <Box display="flex" alignItems="flex-start" gap={2}>
                  <LocationIcon color="primary" sx={{ mt: 0.25 }} />
                  <Box>
                    <Typography variant="body1">
                      {formattedCustomer.fullAddress}
                    </Typography>
                  </Box>
                </Box>
              </Box>

              {/* FIXED: Changed !formattedCustomer.purpose to formattedCustomer.purpose */}
              {formattedCustomer.purpose && (
                <>
                  <Divider sx={{ mb: 3 }} />
                  
                  <Box mb={3}>
                    <Paper
                      elevation={0}
                      sx={{ 
                        p: 2, 
                        bgcolor: alpha(theme.palette.primary.main, 0.05),
                        border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                        borderRadius: 1
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                        <DescriptionIcon
                          sx={{ 
                            color: 'primary.main',
                            fontSize: 20,
                            mt: 0.2
                          }} 
                        />
                        <Box flex={1}>
                          <Typography 
                            variant="caption" 
                            sx={{ 
                              fontWeight: 600,
                              color: 'primary.main',
                              textTransform: 'uppercase',
                              letterSpacing: 0.5
                            }}
                          >
                            Purpose for Visit
                          </Typography>
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              mt: 0.5,
                              color: 'text.primary',
                              fontStyle: 'italic'
                            }}
                          >
                            {formattedCustomer.purpose}
                          </Typography>
                        </Box>
                      </Box>
                    </Paper>
                  </Box>
                </>
              )}

              <Divider sx={{ mb: 3 }} />

              {/* Timestamps */}
              <Box>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                  Record Information
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Box display="flex" alignItems="center" gap={2}>
                      <CalendarIcon color="action" />
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Created
                        </Typography>
                        <Typography variant="body2">
                          {formatDate(currentCustomer.createdAt)}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>

                  {currentCustomer.updatedAt && (
                    <Grid item xs={12} sm={6}>
                      <Box display="flex" alignItems="center" gap={2}>
                        <CalendarIcon color="action" />
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            Last Updated
                          </Typography>
                          <Typography variant="body2">
                            {formatDate(currentCustomer.updatedAt)}
                          </Typography>
                        </Box>
                      </Box>
                    </Grid>
                  )}
                </Grid>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Sidebar */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                Quick Actions
              </Typography>
              
              <Box display="flex" flexDirection="column" gap={2}>
                <Button
                  fullWidth
                  variant="contained"
                  startIcon={<EditIcon />}
                  onClick={() => navigate(`/customers/edit/${id}`)}
                >
                  Edit Customer
                </Button>
                
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<ReceiptIcon />}
                  onClick={() => navigate(`/sales/create?customer=${id}`)}
                >
                  Create Invoice
                </Button>

                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<HistoryIcon />}
                  onClick={() => navigate(`/sales/history?customer=${id}`)}
                >
                  View Sales History
                </Button>
              </Box>

              <Divider sx={{ my: 3 }} />

              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                Contact Actions
              </Typography>

              <Box display="flex" flexDirection="column" gap={1}>
                <Button
                  fullWidth
                  variant="text"
                  startIcon={<ContactPhoneIcon />}
                  href={`tel:${currentCustomer.phone}`}
                  sx={{ justifyContent: 'flex-start' }}
                >
                  Call Customer
                </Button>

                {currentCustomer.email && (
                  <Button
                    fullWidth
                    variant="text"
                    startIcon={<ContactMailIcon />}
                    href={`mailto:${currentCustomer.email}`}
                    sx={{ justifyContent: 'flex-start' }}
                  >
                    Send Email
                  </Button>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Action Menu */}
      <Menu
        anchorEl={actionMenuAnchor}
        open={Boolean(actionMenuAnchor)}
        onClose={handleActionMenuClose}
      >
        <MenuItem onClick={() => {
          navigate(`/customers/edit/${id}`);
          handleActionMenuClose();
        }}>
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Edit Customer</ListItemText>
        </MenuItem>

        {canDelete() && (
          <MenuItem onClick={handleDeleteClick}>
            <ListItemIcon>
              <DeleteIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Delete Customer</ListItemText>
          </MenuItem>
        )}
      </Menu>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteCancel}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete customer "{currentCustomer.name}"? 
            This action cannot be undone and will also remove all associated sales records.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel} disabled={deleting}>
            Cancel
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            color="error"
            variant="contained"
            disabled={deleting}
          >
            {deleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Layout>
  );
};

// Main Component with Provider
const ViewCustomerPage = () => {
  return (
    <CustomerProvider>
      <ViewCustomerPageContent />
    </CustomerProvider>
  );
};

export default ViewCustomerPage;