import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
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
  Schedule as ScheduleIcon,
  FilterList as FilterIcon,
  Clear as ClearIcon
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
  const [searchParams, setSearchParams] = useSearchParams();

  const {
    sales,
    loading,
    error,
    loadSales,
    deleteInvoice,
    clearError
  } = useSales();

  const { canDelete } = useAuth();

  // Get customer ID from URL query parameter
  const customerIdFromUrl = searchParams.get('customer');

  // Local state for search and filters (no debouncing to avoid focus loss)
  const [searchValue, setSearchValue] = useState('');
  const [localFilters, setLocalFilters] = useState({
    paymentStatus: '',
    deliveryStatus: '',
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });

  // Client-side pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Action menu state
  const [actionMenuAnchor, setActionMenuAnchor] = useState(null);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Load sales on component mount
  useEffect(() => {
    loadSales();
  }, [loadSales]);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [
    searchValue,
    localFilters.paymentStatus,
    localFilters.deliveryStatus,
    localFilters.sortBy,
    localFilters.sortOrder,
    pageSize,
    customerIdFromUrl // Add customerIdFromUrl to dependencies
  ]);

  // Find customer name for filtered customer
  const filteredCustomerName = useMemo(() => {
    if (!customerIdFromUrl || !sales.length) return null;
    
    const customerSale = sales.find(sale => sale.customerId === customerIdFromUrl);
    return customerSale?.customerName || null;
  }, [customerIdFromUrl, sales]);

  // Apply client-side filtering and sorting
  const filteredAndSortedSales = useMemo(() => {
    let filtered = [...sales];

    // FIRST: Apply customer filter if customer ID is provided in URL
    if (customerIdFromUrl) {
      filtered = filtered.filter((sale) => sale.customerId === customerIdFromUrl);
    }

    // Apply search filter
    if (searchValue.trim()) {
      const searchTerm = searchValue.toLowerCase().trim();
      filtered = filtered.filter((sale) => {
        return (
          sale.invoiceNumber?.toLowerCase().includes(searchTerm) ||
          sale.customerName?.toLowerCase().includes(searchTerm) ||
          sale.customerPhone?.includes(searchTerm) ||
          sale.items?.some(item => item.name?.toLowerCase().includes(searchTerm))
        );
      });
    }

    // Apply payment status filter
    if (localFilters.paymentStatus) {
      filtered = filtered.filter(
        (sale) => sale.paymentStatus === localFilters.paymentStatus
      );
    }

    // Apply delivery status filter
    if (localFilters.deliveryStatus) {
      filtered = filtered.filter(
        (sale) => sale.deliveryStatus === localFilters.deliveryStatus
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue = a[localFilters.sortBy] || '';
      let bValue = b[localFilters.sortBy] || '';

      // Handle different data types
      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (
        localFilters.sortBy === 'createdAt' ||
        localFilters.sortBy === 'saleDate' ||
        localFilters.sortBy === 'updatedAt'
      ) {
        aValue = new Date(aValue).getTime() || 0;
        bValue = new Date(bValue).getTime() || 0;
      }

      if (localFilters.sortBy === 'grandTotal' || localFilters.sortBy === 'totalAmount') {
        aValue = parseFloat(aValue) || 0;
        bValue = parseFloat(bValue) || 0;
      }

      if (aValue < bValue) {
        return localFilters.sortOrder === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return localFilters.sortOrder === 'asc' ? 1 : -1;
      }
      return 0;
    });

    return filtered;
  }, [sales, searchValue, localFilters, customerIdFromUrl]); // Add customerIdFromUrl to dependencies

  // Calculate client-side pagination
  const paginatedSales = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return filteredAndSortedSales.slice(startIndex, endIndex);
  }, [filteredAndSortedSales, currentPage, pageSize]);

  // Calculate pagination info
  const paginationInfo = useMemo(() => {
    const total = filteredAndSortedSales.length;
    const totalPages = Math.ceil(total / pageSize);
    const hasMore = currentPage < totalPages;

    return {
      currentPage,
      totalPages,
      total,
      hasMore
    };
  }, [filteredAndSortedSales.length, currentPage, pageSize]);

  // Handle clearing customer filter
  const handleClearCustomerFilter = () => {
    // Remove customer parameter from URL
    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.delete('customer');
    setSearchParams(newSearchParams);
  };

  // Handle search input change (no debouncing)
  const handleSearchChange = (value) => {
    setSearchValue(value);
  };

  // Handle search clear
  const handleSearchClear = () => {
    setSearchValue('');
  };

  // Handle filter change
  const handleFilterChange = (newFilters) => {
    setLocalFilters(prev => ({ ...prev, ...newFilters }));
  };

  // Handle sort change
  const handleSortChange = (sortBy) => {
    const newSortOrder =
      localFilters.sortBy === sortBy && localFilters.sortOrder === 'asc'
        ? 'desc'
        : 'asc';
    setLocalFilters(prev => ({
      ...prev,
      sortBy,
      sortOrder: newSortOrder
    }));
  };

  // Handle action menu
  const handleActionMenuOpen = (event, invoice) => {
    event.stopPropagation();
    setActionMenuAnchor(event.currentTarget);
    setSelectedInvoice(invoice);
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
    if (!selectedInvoice) return;

    setDeleting(true);
    try {
      const success = await deleteInvoice(selectedInvoice.id);
      if (success) {
        setDeleteDialogOpen(false);
        setSelectedInvoice(null);
        // Reload sales
        loadSales();
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

  // Handle pagination change - now works with client-side data
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (newPageSize) => {
    setPageSize(newPageSize);
    setCurrentPage(1); // Reset to first page when page size changes
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
        { value: '', label: 'All Payment Status' },
        { value: PAYMENT_STATUS.PAID, label: 'Paid' },
        { value: PAYMENT_STATUS.PENDING, label: 'Pending' },
        { value: PAYMENT_STATUS.EMI, label: 'EMI' }
      ]
    },
    {
      key: 'deliveryStatus',
      label: 'Delivery Status',
      options: [
        { value: '', label: 'All Delivery Status' },
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
      {/* Customer Filter Indicator */}
      {customerIdFromUrl && filteredCustomerName && (
        <Alert 
          severity="info" 
          sx={{ mb: 3 }}
          action={
            <Button 
              color="inherit" 
              size="small" 
              onClick={handleClearCustomerFilter}
              startIcon={<ClearIcon />}
            >
              Show All
            </Button>
          }
          icon={<FilterIcon />}
        >
          <Typography variant="body2">
            <strong>Filtered by Customer:</strong> {filteredCustomerName}
          </Typography>
        </Alert>
      )}

      {/* Search and Filters */}
      <Box mb={3}>
        <SearchBar
          value={searchValue}
          onChange={handleSearchChange}
          onClear={handleSearchClear}
          placeholder={customerIdFromUrl ? 
            `Search in ${filteredCustomerName}'s invoices...` :
            "Search by invoice number, customer name, or phone..."
          }
          disabled={loading}
          filters={localFilters}
          onFilterChange={handleFilterChange}
          filterOptions={filterOptions}
          sortOptions={sortOptions}
          onSortChange={handleSortChange}
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
      {!loading && filteredAndSortedSales.length === 0 && (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 6 }}>
            <ReceiptIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              {customerIdFromUrl ? 
                `No sales found for ${filteredCustomerName}` :
                'No sales found'
              }
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={3}>
              {searchValue || localFilters.paymentStatus || localFilters.deliveryStatus ? 
                'Try adjusting your search criteria or filters.' :
                customerIdFromUrl ?
                  `${filteredCustomerName} doesn't have any sales yet. Create their first invoice to get started.` :
                  'Start by creating your first invoice to track sales.'
              }
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => navigate(customerIdFromUrl ? 
                `/sales/create?customer=${customerIdFromUrl}` : 
                '/sales/create'
              )}
            >
              Create Invoice
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Sales Grid */}
      {filteredAndSortedSales.length > 0 && (
        <>
          {/* Summary for filtered customer */}
          {customerIdFromUrl && (
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Sales Summary for {filteredCustomerName}
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6} sm={3}>
                    <Typography variant="body2" color="text.secondary">
                      Total Invoices
                    </Typography>
                    <Typography variant="h6" color="primary">
                      {filteredAndSortedSales.length}
                    </Typography>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Typography variant="body2" color="text.secondary">
                      Total Amount
                    </Typography>
                    <Typography variant="h6" color="success.main">
                      {formatCurrency(
                        filteredAndSortedSales.reduce((sum, sale) => 
                          sum + (sale.grandTotal || sale.totalAmount || 0), 0
                        )
                      )}
                    </Typography>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Typography variant="body2" color="text.secondary">
                      EMI Invoices
                    </Typography>
                    <Typography variant="h6" color="warning.main">
                      {filteredAndSortedSales.filter(sale => 
                        sale.paymentStatus === PAYMENT_STATUS.EMI
                      ).length}
                    </Typography>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Typography variant="body2" color="text.secondary">
                      Pending Deliveries
                    </Typography>
                    <Typography variant="h6" color="error.main">
                      {filteredAndSortedSales.filter(sale => 
                        sale.deliveryStatus !== DELIVERY_STATUS.DELIVERED
                      ).length}
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          )}

          <Grid container spacing={3}>
            {paginatedSales.map((sale) => (
              <Grid item xs={12} sm={6} lg={4} key={sale.id}>
                <Card
                  sx={{
                    cursor: 'pointer',
                    transition: 'all 0.2s ease-in-out',
                    height: 280, // Fixed height for consistency
                    display: 'flex',
                    flexDirection: 'column',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: 4
                    }
                  }}
                  onClick={() => navigate(`/sales/view/${sale.id}`)}
                >
                  <CardContent
                    sx={{
                      flex: 1,
                      display: 'flex',
                      flexDirection: 'column',
                      p: 2.5
                    }}
                  >
                    {/* Header */}
                    <Box display="flex" alignItems="flex-start" justifyContent="space-between" mb={2}>
                      <Box display="flex" alignItems="center" gap={2} flex={1} minWidth={0}>
                        <Avatar
                          sx={{
                            bgcolor: theme.palette.primary.main,
                            color: 'white',
                            width: 40,
                            height: 40
                          }}
                        >
                          <ReceiptIcon />
                        </Avatar>
                        <Box minWidth={0} flex={1}>
                          <Typography variant="h6" component="h3" noWrap sx={{ fontSize: '1rem', fontWeight: 600 }}>
                            {sale.invoiceNumber}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" noWrap sx={{ fontSize: '0.75rem' }}>
                            {formatDate(sale.saleDate || sale.createdAt)}
                          </Typography>
                        </Box>
                      </Box>
                      
                      <IconButton
                        size="small"
                        onClick={(e) => handleActionMenuOpen(e, sale)}
                        sx={{ mt: -0.5 }}
                      >
                        <MoreVertIcon />
                      </IconButton>
                    </Box>

                    {/* Customer Info - Fixed height section */}
                    <Box mb={2} sx={{ flex: 1, minHeight: 120 }}>
                      {/* Only show customer name if not filtered by customer */}
                      {!customerIdFromUrl && (
                        <Box display="flex" alignItems="center" gap={1} mb={1}>
                          <PersonIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                          <Typography variant="body2" noWrap sx={{ fontSize: '0.875rem' }}>
                            {sale.customerName}
                          </Typography>
                        </Box>
                      )}
                      
                      {sale.customerPhone && (
                        <Box display="flex" alignItems="center" gap={1} mb={1}>
                          <PhoneIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                          <Typography variant="body2" noWrap sx={{ fontSize: '0.875rem' }}>
                            {sale.customerPhone}
                          </Typography>
                        </Box>
                      )}
                      
                      {/* Amount */}
                      <Box display="flex" alignItems="center" gap={1} mb={2}>
                        <MoneyIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                        <Typography variant="h6" color="primary.main" fontWeight="bold" sx={{ fontSize: '1.1rem' }}>
                          {formatCurrency(sale.grandTotal || sale.totalAmount)}
                        </Typography>
                      </Box>
                    </Box>

                    {/* Status Chips and Additional Info - Fixed bottom section */}
                    <Box mt="auto">
                      {/* Status Chips */}
                      <Box display="flex" gap={1} flexWrap="wrap" mb={2}>
                        <Chip
                          label={sale.paymentStatus?.toUpperCase()}
                          size="small"
                          color={getPaymentStatusColor(sale.paymentStatus)}
                          icon={<PaymentIcon />}
                          sx={{ textTransform: 'capitalize', fontSize: '0.75rem', height: 24 }}
                        />
                        <Chip
                          label={sale.deliveryStatus?.toUpperCase()}
                          size="small"
                          color={getDeliveryStatusColor(sale.deliveryStatus)}
                          icon={<DeliveryIcon />}
                          sx={{ textTransform: 'capitalize', fontSize: '0.75rem', height: 24 }}
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
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          {/* Pagination - Now using client-side pagination info */}
          <Box mt={4}>
            <Pagination
              currentPage={paginationInfo.currentPage}
              totalPages={paginationInfo.totalPages}
              total={paginationInfo.total}
              pageSize={pageSize}
              pageSizeOptions={[5, 10, 25, 50]}
              onPageChange={handlePageChange}
              onPageSizeChange={handlePageSizeChange}
              itemName={customerIdFromUrl ? 
                `invoices for ${filteredCustomerName}` : 
                'invoices'
              }
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