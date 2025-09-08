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
  TextField,
  InputAdornment,
  CircularProgress,
  useTheme,
  useMediaQuery,
  Avatar,
  Tooltip
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
  Clear as ClearIcon,
  AccountBalance as BankIcon,
  CreditCard as CardIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  PaymentOutlined as RecordPaymentIcon,
  Save as SaveIcon,
  Close as CloseIcon,
  DateRange as DateRangeIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';

import salesService from '../../../services/api/salesService';
import { useSales } from '../../../contexts/SalesContext/SalesContext';
import { useAuth } from '../../../contexts/AuthContext/AuthContext';
import SearchBar from '../../common/UI/SearchBar';
import Pagination from '../../common/UI/Pagination';
import { 
  PAYMENT_STATUS, 
  PAYMENT_STATUS_DISPLAY,
  PAYMENT_METHODS,
  PAYMENT_METHOD_DISPLAY,
  DELIVERY_STATUS,
  PAYMENT_CATEGORIES,
  PAYMENT_CATEGORY_DISPLAY
} from '../../../utils/constants/appConstants';
import { useUserType } from '../../../contexts/UserTypeContext';

const SalesHistory = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const { userType } = useUserType();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [searchParams, setSearchParams] = useSearchParams();

  const {
    sales,
    loading,
    error,
    loadSales,
    deleteInvoice,
    clearError,
  } = useSales();

  const { canDelete } = useAuth();

  // Get customer ID from URL query parameter
  const customerIdFromUrl = searchParams.get('customer');

  // Local state for search and filters (no debouncing to avoid focus loss)
  const [searchValue, setSearchValue] = useState('');
  const [localFilters, setLocalFilters] = useState({
    paymentStatus: '',
    deliveryStatus: '',
    originalPaymentCategory: '', // NEW - Filter by original payment category
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

  // Payment recording state with date picker
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    paymentMethod: PAYMENT_METHODS.CASH,
    reference: '',
    notes: '',
    paymentDate: new Date() // NEW - Add payment date
  });
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentError, setPaymentError] = useState('');

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
    localFilters.originalPaymentCategory, // NEW
    localFilters.sortBy,
    localFilters.sortOrder,
    pageSize,
    customerIdFromUrl
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

    // NEW - Apply original payment category filter
    if (localFilters.originalPaymentCategory) {
      filtered = filtered.filter(
        (sale) => sale.originalPaymentCategory === localFilters.originalPaymentCategory
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
  }, [sales, searchValue, localFilters, customerIdFromUrl]);

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

  // Payment recording functions
  const canRecordPayment = (invoice) => {
    if (!invoice) return false;
    
    const isPartialPayment = invoice.paymentStatus === PAYMENT_STATUS.FINANCE || 
                            invoice.paymentStatus === PAYMENT_STATUS.BANK_TRANSFER;
    
    if (!isPartialPayment) return false;
    
    const remainingBalance = getRemainingBalance(invoice);
    return remainingBalance > 0;
  };

  const handleRecordPayment = () => {
    if (!selectedInvoice) return;
    
    const remainingBalance = getRemainingBalance(selectedInvoice);
    setPaymentForm({
      amount: remainingBalance.toString(),
      paymentMethod: PAYMENT_METHODS.CASH,
      reference: '',
      notes: '',
      paymentDate: new Date() // NEW - Default to today
    });
    setPaymentError('');
    setPaymentDialogOpen(true);
    handleActionMenuClose();
  };

  const handlePaymentFormChange = (field) => (event) => {
    setPaymentForm(prev => ({
      ...prev,
      [field]: event.target.value
    }));
  };

  // NEW - Handle payment date change
  const handlePaymentDateChange = (date) => {
    setPaymentForm(prev => ({
      ...prev,
      paymentDate: date
    }));
  };

  const handlePaymentSubmit = async () => {
    if (!selectedInvoice) return;

    const amount = parseFloat(paymentForm.amount);
    const remainingBalance = getRemainingBalance(selectedInvoice);

    // Validation
    if (!amount || amount <= 0) {
      setPaymentError('Please enter a valid payment amount');
      return;
    }

    if (amount > remainingBalance) {
      setPaymentError(`Payment amount cannot exceed remaining balance of ${formatCurrency(remainingBalance)}`);
      return;
    }

    if (!paymentForm.paymentDate) {
      setPaymentError('Please select a payment date');
      return;
    }

    setPaymentLoading(true);
    setPaymentError('');

    try {
      const paymentDetails = {
        paymentMethod: paymentForm.paymentMethod,
        reference: paymentForm.reference,
        notes: paymentForm.notes,
        paymentDate: paymentForm.paymentDate.toISOString(), // NEW - Include payment date
        recordedBy: 'current-user-id',
        recordedByName: 'Current User'
      };
      
      await salesService.recordAdditionalPayment(userType, selectedInvoice?.id, amount, paymentDetails);
      
      // Reload sales
      await loadSales();
      
      setPaymentDialogOpen(false);
      setSelectedInvoice(null);
      
      console.log('Payment recorded successfully');
      
    } catch (error) {
      setPaymentError(error.message || 'Failed to record payment');
    } finally {
      setPaymentLoading(false);
    }
  };

  const handlePaymentCancel = () => {
    setPaymentDialogOpen(false);
    setPaymentForm({
      amount: '',
      paymentMethod: PAYMENT_METHODS.CASH,
      reference: '',
      notes: '',
      paymentDate: new Date()
    });
    setPaymentError('');
    setSelectedInvoice(null);
  };

  // Get payment status color with new statuses
  const getPaymentStatusColor = (status) => {
    const statusColors = {
      [PAYMENT_STATUS.PAID]: 'success',
      [PAYMENT_STATUS.PENDING]: 'error',
      [PAYMENT_STATUS.EMI]: 'warning',
      [PAYMENT_STATUS.FINANCE]: 'info',
      [PAYMENT_STATUS.BANK_TRANSFER]: 'primary'
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

  // Get payment status icon
  const getPaymentStatusIcon = (status) => {
    const iconMap = {
      [PAYMENT_STATUS.PAID]: <MoneyIcon />,
      [PAYMENT_STATUS.PENDING]: <PaymentIcon />,
      [PAYMENT_STATUS.EMI]: <ScheduleIcon />,
      [PAYMENT_STATUS.FINANCE]: <BankIcon />,
      [PAYMENT_STATUS.BANK_TRANSFER]: <CardIcon />
    };
    return iconMap[status] || <PaymentIcon />;
  };

  // Calculate actual amount paid for partial payments
  const getActualAmountPaid = (sale) => {
    if (sale.paymentStatus === PAYMENT_STATUS.FINANCE || 
        sale.paymentStatus === PAYMENT_STATUS.BANK_TRANSFER) {
      return sale.paymentDetails?.downPayment || 0;
    }
    if (sale.paymentStatus === PAYMENT_STATUS.PAID || sale.fullyPaid) {
      return sale.grandTotal || sale.totalAmount || 0;
    }
    if (sale.paymentStatus === PAYMENT_STATUS.EMI && sale.emiDetails?.schedule) {
      return sale.emiDetails.schedule
        .filter(emi => emi.paid)
        .reduce((sum, emi) => sum + (emi.paidAmount || emi.amount || 0), 0);
    }
    return 0;
  };

  // Get remaining balance
  const getRemainingBalance = (sale) => {
    const totalAmount = sale.grandTotal || sale.totalAmount || 0;
    const paidAmount = getActualAmountPaid(sale);
    return Math.max(0, totalAmount - paidAmount);
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

  // Filter options for search bar - UPDATED with new payment categories
  const filterOptions = [
    {
      key: 'paymentStatus',
      label: 'Payment Status',
      options: [
        { value: '', label: 'All Payment Status' },
        { value: PAYMENT_STATUS.PAID, label: PAYMENT_STATUS_DISPLAY[PAYMENT_STATUS.PAID] },
        { value: PAYMENT_STATUS.PENDING, label: PAYMENT_STATUS_DISPLAY[PAYMENT_STATUS.PENDING] },
        { value: PAYMENT_STATUS.EMI, label: PAYMENT_STATUS_DISPLAY[PAYMENT_STATUS.EMI] },
        { value: PAYMENT_STATUS.FINANCE, label: PAYMENT_STATUS_DISPLAY[PAYMENT_STATUS.FINANCE] },
        { value: PAYMENT_STATUS.BANK_TRANSFER, label: PAYMENT_STATUS_DISPLAY[PAYMENT_STATUS.BANK_TRANSFER] }
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
    },
    // NEW - Filter by original payment category
    {
      key: 'originalPaymentCategory',
      label: 'Payment Category',
      options: [
        { value: '', label: 'All Payment Categories' },
        ...Object.entries(PAYMENT_CATEGORY_DISPLAY).map(([key, label]) => ({
          value: key,
          label
        }))
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
              {searchValue || localFilters.paymentStatus || localFilters.deliveryStatus || localFilters.originalPaymentCategory ? 
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
                      Amount Paid
                    </Typography>
                    <Typography variant="h6" color="success.main">
                      {formatCurrency(
                        filteredAndSortedSales.reduce((sum, sale) => 
                          sum + getActualAmountPaid(sale), 0
                        )
                      )}
                    </Typography>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Typography variant="body2" color="text.secondary">
                      Outstanding
                    </Typography>
                    <Typography variant="h6" color="error.main">
                      {formatCurrency(
                        filteredAndSortedSales.reduce((sum, sale) => 
                          sum + getRemainingBalance(sale), 0
                        )
                      )}
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          )}

          <Grid container spacing={3}>
            {paginatedSales.map((sale) => {
              const actualPaid = getActualAmountPaid(sale);
              const remainingBalance = getRemainingBalance(sale);
              const isPartialPayment = sale.paymentStatus === PAYMENT_STATUS.FINANCE || 
                                     sale.paymentStatus === PAYMENT_STATUS.BANK_TRANSFER;

              return (
                <Grid item xs={12} sm={6} lg={4} key={sale.id}>
                  <Card
                    sx={{
                      cursor: 'pointer',
                      transition: 'all 0.2s ease-in-out',
                      height: 350, // Increased height to accommodate new fields
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
                      <Box mb={2} sx={{ flex: 1, minHeight: 160 }}>
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
                        
                        {/* Total Amount */}
                        <Box display="flex" alignItems="center" gap={1} mb={1}>
                          <MoneyIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                          <Typography variant="h6" color="primary.main" fontWeight="bold" sx={{ fontSize: '1.1rem' }}>
                            {formatCurrency(sale.grandTotal || sale.totalAmount)}
                          </Typography>
                        </Box>

                        {/* NEW - Show original payment category */}
                        {sale.originalPaymentCategory && (
                          <Box mb={1}>
                            <Chip
                              label={PAYMENT_CATEGORY_DISPLAY[sale.originalPaymentCategory] || sale.originalPaymentCategory}
                              size="small"
                              variant="outlined"
                              sx={{ fontSize: '0.7rem', height: 20 }}
                            />
                          </Box>
                        )}

                        {/* Payment Progress for Partial Payments */}
                        {isPartialPayment && (
                          <Box mt={1}>
                            <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                              <TrendingUpIcon sx={{ fontSize: 14, color: 'success.main' }} />
                              <Typography variant="caption" color="success.main">
                                Paid: {formatCurrency(actualPaid)}
                              </Typography>
                            </Box>
                            {remainingBalance > 0 && (
                              <Box display="flex" alignItems="center" gap={1}>
                                <TrendingDownIcon sx={{ fontSize: 14, color: 'warning.main' }} />
                                <Typography variant="caption" color="warning.main">
                                  Balance: {formatCurrency(remainingBalance)}
                                </Typography>
                              </Box>
                            )}
                          </Box>
                        )}

                        {/* NEW - Show if fully paid flag */}
                        {sale.fullyPaid && sale.paymentStatus !== PAYMENT_STATUS.PAID && (
                          <Box mt={1}>
                            <Chip
                              label="Fully Paid"
                              size="small"
                              color="success"
                              sx={{ fontSize: '0.7rem', height: 20 }}
                            />
                          </Box>
                        )}
                      </Box>

                      {/* Status Chips and Additional Info */}
                      <Box mt="auto">
                        {/* Status Chips */}
                        <Box display="flex" gap={1} flexWrap="wrap" mb={2}>
                          <Tooltip title={PAYMENT_STATUS_DISPLAY[sale.paymentStatus] || sale.paymentStatus}>
                            <Chip
                              label={sale.paymentStatus?.toUpperCase()}
                              size="small"
                              color={getPaymentStatusColor(sale.paymentStatus)}
                              icon={getPaymentStatusIcon(sale.paymentStatus)}
                              sx={{ textTransform: 'capitalize', fontSize: '0.75rem', height: 24 }}
                            />
                          </Tooltip>
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

                          {sale.paymentStatus === PAYMENT_STATUS.FINANCE && sale.paymentDetails?.financeCompany && (
                            <Box display="flex" alignItems="center" gap={1} mb={1}>
                              <BankIcon sx={{ fontSize: 16, color: 'info.main' }} />
                              <Typography variant="caption" color="info.main">
                                Finance: {sale.paymentDetails.financeCompany}
                              </Typography>
                            </Box>
                          )}

                          {sale.paymentStatus === PAYMENT_STATUS.BANK_TRANSFER && sale.paymentDetails?.bankName && (
                            <Box display="flex" alignItems="center" gap={1} mb={1}>
                              <CardIcon sx={{ fontSize: 16, color: 'primary.main' }} />
                              <Typography variant="caption" color="primary.main">
                                Bank: {sale.paymentDetails.bankName}
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
              );
            })}
          </Grid>

          {/* Pagination */}
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

        {/* Record Payment option */}
        {canRecordPayment(selectedInvoice) && (
          <MenuItem onClick={handleRecordPayment}>
            <ListItemIcon>
              <RecordPaymentIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Record Payment</ListItemText>
          </MenuItem>
        )}

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

      {/* Payment Recording Dialog with Date Picker */}
      <Dialog
        open={paymentDialogOpen}
        onClose={paymentLoading ? undefined : handlePaymentCancel}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <RecordPaymentIcon color="primary" />
          Record Payment - {selectedInvoice?.invoiceNumber}
        </DialogTitle>
        <DialogContent>
          {selectedInvoice && (
            <Box sx={{ mb: 3 }}>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Customer:
                  </Typography>
                  <Typography variant="body1" fontWeight={500}>
                    {selectedInvoice.customerName}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Invoice Total:
                  </Typography>
                  <Typography variant="body1" fontWeight={500}>
                    {formatCurrency(selectedInvoice.grandTotal || selectedInvoice.totalAmount)}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Amount Paid:
                  </Typography>
                  <Typography variant="body1" fontWeight={500} color="success.main">
                    {formatCurrency(getActualAmountPaid(selectedInvoice))}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Remaining Balance:
                  </Typography>
                  <Typography variant="body1" fontWeight={500} color="warning.main">
                    {formatCurrency(getRemainingBalance(selectedInvoice))}
                  </Typography>
                </Grid>
              </Grid>
            </Box>
          )}

          {paymentError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {paymentError}
            </Alert>
          )}

          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Payment Amount"
                type="number"
                value={paymentForm.amount}
                onChange={handlePaymentFormChange('amount')}
                disabled={paymentLoading}
                inputProps={{ min: 0, max: selectedInvoice ? getRemainingBalance(selectedInvoice) : 0, step: 0.01 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">₹</InputAdornment>
                  ),
                }}
                helperText={selectedInvoice ? `Maximum: ${formatCurrency(getRemainingBalance(selectedInvoice))}` : ''}
              />
            </Grid>

            {/* NEW - Payment Date Picker */}
            <Grid item xs={12} sm={6}>
              <DatePicker
                label="Payment Date"
                value={paymentForm.paymentDate}
                onChange={handlePaymentDateChange}
                disabled={paymentLoading}
                maxDate={new Date()}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    InputProps: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <DateRangeIcon />
                        </InputAdornment>
                      ),
                    },
                  },
                }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                select
                label="Payment Method"
                value={paymentForm.paymentMethod}
                onChange={handlePaymentFormChange('paymentMethod')}
                disabled={paymentLoading}
                SelectProps={{
                  native: true,
                }}
              >
                <option value={PAYMENT_METHODS.CASH}>{PAYMENT_METHOD_DISPLAY[PAYMENT_METHODS.CASH]}</option>
                <option value={PAYMENT_METHODS.CARD}>{PAYMENT_METHOD_DISPLAY[PAYMENT_METHODS.CARD]}</option>
                <option value={PAYMENT_METHODS.CREDIT_CARD}>{PAYMENT_METHOD_DISPLAY[PAYMENT_METHODS.CREDIT_CARD]}</option>
                <option value={PAYMENT_METHODS.UPI}>{PAYMENT_METHOD_DISPLAY[PAYMENT_METHODS.UPI]}</option>
                <option value={PAYMENT_METHODS.NET_BANKING}>{PAYMENT_METHOD_DISPLAY[PAYMENT_METHODS.NET_BANKING]}</option>
                <option value={PAYMENT_METHODS.CHEQUE}>{PAYMENT_METHOD_DISPLAY[PAYMENT_METHODS.CHEQUE]}</option>
                <option value={PAYMENT_METHODS.BANK_TRANSFER}>{PAYMENT_METHOD_DISPLAY[PAYMENT_METHODS.BANK_TRANSFER]}</option>
              </TextField>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Payment Reference"
                placeholder="Transaction ID, Cheque No, etc."
                value={paymentForm.reference}
                onChange={handlePaymentFormChange('reference')}
                disabled={paymentLoading}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Notes"
                placeholder="Additional notes about this payment..."
                value={paymentForm.notes}
                onChange={handlePaymentFormChange('notes')}
                disabled={paymentLoading}
                multiline
                rows={2}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button 
            onClick={handlePaymentCancel} 
            disabled={paymentLoading}
            startIcon={<CloseIcon />}
          >
            Cancel
          </Button>
          <Button
            onClick={handlePaymentSubmit}
            color="primary"
            variant="contained"
            disabled={paymentLoading || !paymentForm.amount || !paymentForm.paymentDate}
            startIcon={
              paymentLoading ? (
                <CircularProgress size={20} color="inherit" />
              ) : (
                <SaveIcon />
              )
            }
          >
            {paymentLoading ? 'Recording...' : 'Record Payment'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SalesHistory;