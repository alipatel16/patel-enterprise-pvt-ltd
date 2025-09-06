import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  Chip,
  IconButton,
  Button,
  Skeleton,
  Alert,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  useTheme,
  useMediaQuery,
  Avatar
} from '@mui/material';
import {
  Receipt as ReceiptIcon,
  Person as PersonIcon,
  Phone as PhoneIcon,
  CalendarToday as CalendarIcon,
  AttachMoney as MoneyIcon,
  LocalShipping as DeliveryIcon,
  Payment as PaymentIcon,
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Visibility as ViewIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Schedule as ScheduleIcon
} from '@mui/icons-material';

import { useSales } from '../../../contexts/SalesContext/SalesContext';
import { useAuth } from '../../../contexts/AuthContext/AuthContext';
import SearchBar from '../../common/UI/SearchBar';
import Pagination from '../../common/UI/Pagination';
import { PAYMENT_STATUS, DELIVERY_STATUS } from '../../../utils/constants/appConstants';

const SalesHistory = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const {
    sales,
    loading,
    error,
    pagination,
    filters,
    loadSales,
    searchSales,
    deleteInvoice,
    setFilters,
    clearError
  } = useSales();

  const { canDelete } = useAuth();

  const [actionMenuAnchor, setActionMenuAnchor] = useState(null);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Load sales on component mount
  useEffect(() => {
    loadSales();
  }, [loadSales]);

  // Handle search
  const handleSearch = (searchTerm) => {
    if (searchTerm.trim()) {
      searchSales(searchTerm);
    } else {
      loadSales();
    }
  };

  // Handle search clear
  const handleSearchClear = () => {
    setFilters({ search: '' });
    loadSales();
  };

  // Handle filter change
  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    loadSales();
  };

  // Handle action menu
  const handleActionMenuOpen = (event, invoice) => {
    setActionMenuAnchor(event.currentTarget);
    setSelectedInvoice(invoice);
  };

  const handleActionMenuClose = () => {
    setActionMenuAnchor(null);
    setSelectedInvoice(null);
  };

  // Handle delete
  const handleDeleteClick = () => {
    setDeleteDialogOpen(true);
    handleActionMenuClose();
  };

  const handleDeleteConfirm = async () => {
    if (!selectedInvoice) return;

    setDeleting(true);
    try {
      const success = await deleteInvoice(selectedInvoice.id);
      if (success) {
        setDeleteDialogOpen(false);
        setSelectedInvoice(null);
        // Reload sales if we're on the last page and it becomes empty
        if (sales.length === 1 && pagination.currentPage > 1) {
          loadSales({ offset: (pagination.currentPage - 2) * 10 });
        }
      }
    } catch (error) {
      console.error('Delete error:', error);
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setSelectedInvoice(null);
  };

  // Get payment status color
  const getPaymentStatusColor = (status) => {
    const statusColors = {
      [PAYMENT_STATUS.PAID]: 'success',
      [PAYMENT_STATUS.PENDING]: 'error',
      [PAYMENT_STATUS.EMI]: 'warning'
    };
    return statusColors[status] || 'default';
  };

  // Get delivery status color
  const getDeliveryStatusColor = (status) => {
    const statusColors = {
      [DELIVERY_STATUS.DELIVERED]: 'success',
      [DELIVERY_STATUS.PENDING]: 'error',
      [DELIVERY_STATUS.SCHEDULED]: 'info'
    };
    return statusColors[status] || 'default';
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Format currency
  const formatCurrency = (amount) => {
    return `₹${parseFloat(amount || 0).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  };

  // Filter options for search bar
  const filterOptions = [
    {
      key: 'paymentStatus',
      label: 'Payment Status',
      options: [
        { value: PAYMENT_STATUS.PAID, label: 'Paid' },
        { value: PAYMENT_STATUS.PENDING, label: 'Pending' },
        { value: PAYMENT_STATUS.EMI, label: 'EMI' }
      ]
    },
    {
      key: 'deliveryStatus',
      label: 'Delivery Status',
      options: [
        { value: DELIVERY_STATUS.DELIVERED, label: 'Delivered' },
        { value: DELIVERY_STATUS.PENDING, label: 'Pending' },
        { value: DELIVERY_STATUS.SCHEDULED, label: 'Scheduled' }
      ]
    }
  ];

  // Sort options
  const sortOptions = {
    createdAt: 'Recent First',
    invoiceNumber: 'Invoice Number',
    customerName: 'Customer Name',
    grandTotal: 'Amount'
  };

  // Render loading skeletons
  if (loading && sales.length === 0) {
    return (
      <Box>
        <SearchBar disabled />
        <Grid container spacing={2} sx={{ mt: 2 }}>
          {Array.from({ length: 6 }).map((_, index) => (
            <Grid item xs={12} sm={6} lg={4} key={index}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center" gap={2} mb={2}>
                    <Skeleton variant="circular" width={40} height={40} />
                    <Box flex={1}>
                      <Skeleton variant="text" width="60%" />
                      <Skeleton variant="text" width="40%" />
                    </Box>
                  </Box>
                  <Skeleton variant="text" width="80%" />
                  <Skeleton variant="text" width="60%" />
                  <Box display="flex" gap={1} mt={2}>
                    <Skeleton variant="rectangular" width={60} height={24} />
                    <Skeleton variant="rectangular" width={80} height={24} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  }

  return (
    <Box>
      {/* Search and Filters */}
      <Box mb={3}>
        <SearchBar
          value={filters.search}
          onChange={(value) => setFilters({ search: value })}
          onSearch={handleSearch}
          onClear={handleSearchClear}
          placeholder="Search by invoice number, customer name, or phone..."
          disabled={loading}
          filters={filters}
          onFilterChange={handleFilterChange}
          filterOptions={filterOptions}
          sortOptions={sortOptions}
          onSortChange={(sortBy) => setFilters({ sortBy })}
          showFilters
          showSort
        />
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={clearError}>
          {error}
        </Alert>
      )}

      {/* Empty State */}
      {!loading && sales.length === 0 && (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 6 }}>
            <ReceiptIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              No sales found
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={3}>
              {filters.search ? 
                'Try adjusting your search criteria or filters.' :
                'Start by creating your first invoice to track sales.'
              }
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => navigate('/sales/create')}
            >
              Create Invoice
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Sales Grid */}
      {sales.length > 0 && (
        <>
          <Grid container spacing={3}>
            {sales.map((sale) => (
              <Grid item xs={12} sm={6} lg={4} key={sale.id}>
                <Card
                  sx={{
                    cursor: 'pointer',
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: 4
                    }
                  }}
                  onClick={() => navigate(`/sales/view/${sale.id}`)}
                >
                  <CardContent>
                    {/* Header */}
                    <Box display="flex" alignItems="flex-start" justifyContent="space-between" mb={2}>
                      <Box display="flex" alignItems="center" gap={2} flex={1} minWidth={0}>
                        <Avatar
                          sx={{
                            bgcolor: theme.palette.primary.main,
                            color: 'white'
                          }}
                        >
                          <ReceiptIcon />
                        </Avatar>
                        <Box minWidth={0} flex={1}>
                          <Typography variant="h6" component="h3" noWrap>
                            {sale.invoiceNumber}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" noWrap>
                            {formatDate(sale.saleDate || sale.createdAt)}
                          </Typography>
                        </Box>
                      </Box>
                      
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleActionMenuOpen(e, sale);
                        }}
                      >
                        <MoreVertIcon />
                      </IconButton>
                    </Box>

                    {/* Customer Info */}
                    <Box mb={2}>
                      <Box display="flex" alignItems="center" gap={1} mb={1}>
                        <PersonIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                        <Typography variant="body2" noWrap>
                          {sale.customerName}
                        </Typography>
                      </Box>
                      {sale.customerPhone && (
                        <Box display="flex" alignItems="center" gap={1} mb={1}>
                          <PhoneIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                          <Typography variant="body2" noWrap>
                            {sale.customerPhone}
                          </Typography>
                        </Box>
                      )}
                    </Box>

                    {/* Amount */}
                    <Box display="flex" alignItems="center" gap={1} mb={2}>
                      <MoneyIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                      <Typography variant="h6" color="primary.main" fontWeight="bold">
                        {formatCurrency(sale.grandTotal)}
                      </Typography>
                    </Box>

                    {/* Status Chips */}
                    <Box display="flex" gap={1} flexWrap="wrap" mb={2}>
                      <Chip
                        label={sale.paymentStatus?.toUpperCase()}
                        size="small"
                        color={getPaymentStatusColor(sale.paymentStatus)}
                        icon={<PaymentIcon />}
                        sx={{ textTransform: 'capitalize' }}
                      />
                      <Chip
                        label={sale.deliveryStatus?.toUpperCase()}
                        size="small"
                        color={getDeliveryStatusColor(sale.deliveryStatus)}
                        icon={<DeliveryIcon />}
                        sx={{ textTransform: 'capitalize' }}
                      />
                    </Box>

                    {/* Additional Info */}
                    <Box>
                      {sale.paymentStatus === PAYMENT_STATUS.EMI && (
                        <Box display="flex" alignItems="center" gap={1} mb={1}>
                          <ScheduleIcon sx={{ fontSize: 16, color: 'warning.main' }} />
                          <Typography variant="caption" color="warning.main">
                            EMI Payment Plan
                          </Typography>
                        </Box>
                      )}
                      
                      {sale.deliveryStatus === DELIVERY_STATUS.SCHEDULED && sale.scheduledDeliveryDate && (
                        <Box display="flex" alignItems="center" gap={1}>
                          <CalendarIcon sx={{ fontSize: 16, color: 'info.main' }} />
                          <Typography variant="caption" color="info.main">
                            Delivery: {formatDate(sale.scheduledDeliveryDate)}
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          {/* Pagination */}
          <Box mt={4}>
            <Pagination
              currentPage={pagination.currentPage}
              totalPages={pagination.totalPages}
              total={pagination.total}
              pageSize={10}
              onPageChange={(page) => loadSales({ offset: (page - 1) * 10 })}
              itemName="invoices"
              disabled={loading}
            />
          </Box>
        </>
      )}

      {/* Action Menu */}
      <Menu
        anchorEl={actionMenuAnchor}
        open={Boolean(actionMenuAnchor)}
        onClose={handleActionMenuClose}
        onClick={(e) => e.stopPropagation()}
      >
        <MenuItem onClick={() => {
          navigate(`/sales/view/${selectedInvoice?.id}`);
          handleActionMenuClose();
        }}>
          <ListItemIcon>
            <ViewIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>View Details</ListItemText>
        </MenuItem>

        <MenuItem onClick={() => {
          navigate(`/sales/edit/${selectedInvoice?.id}`);
          handleActionMenuClose();
        }}>
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Edit Invoice</ListItemText>
        </MenuItem>

        {canDelete() && (
          <MenuItem onClick={handleDeleteClick}>
            <ListItemIcon>
              <DeleteIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Delete Invoice</ListItemText>
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
            Are you sure you want to delete invoice "{selectedInvoice?.invoiceNumber}"? 
            This action cannot be undone and will permanently remove this sales record.
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
    </Box>
  );
};

export default SalesHistory;