import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Paper,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Alert,
  FormControl,
  InputLabel,
  Select,
  Grid,
  Tooltip,
  CircularProgress,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  MoreVert as MoreVertIcon,
  FilterList as FilterIcon,
  Receipt as QuoteIcon,
  TrendingUp as ConvertIcon,
} from '@mui/icons-material';

import Layout from '../../components/common/Layout/Layout';
import { QuotationProvider, useQuotation } from '../../contexts/QuotationContext/QuotationContext';
import { CustomerProvider } from '../../contexts/CustomerContext/CustomerContext';
import { EmployeeProvider } from '../../contexts/EmployeeContext/EmployeeContext';

// Quote status configurations
const QUOTE_STATUS = {
  ACTIVE: 'active',
  CONVERTED: 'converted',
  EXPIRED: 'expired',
  CANCELLED: 'cancelled',
};

const STATUS_COLORS = {
  [QUOTE_STATUS.ACTIVE]: 'success',
  [QUOTE_STATUS.CONVERTED]: 'primary',
  [QUOTE_STATUS.EXPIRED]: 'warning',
  [QUOTE_STATUS.CANCELLED]: 'error',
};

const STATUS_LABELS = {
  [QUOTE_STATUS.ACTIVE]: 'Active',
  [QUOTE_STATUS.CONVERTED]: 'Converted',
  [QUOTE_STATUS.EXPIRED]: 'Expired',
  [QUOTE_STATUS.CANCELLED]: 'Cancelled',
};

// Main content component
const QuotationsPageContent = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const { 
    quotations, 
    loading, 
    error, 
    loadQuotations, 
    deleteQuotation,
    loadQuotationStats,
    stats
  } = useQuotation();

  // State for filtering and pagination
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedQuotation, setSelectedQuotation] = useState(null);

  const breadcrumbs = [
    {
      label: 'Quotations',
      path: '/quotations'
    }
  ];

  // Load data on component mount
  useEffect(() => {
    loadQuotations();
    loadQuotationStats();
  }, [loadQuotations, loadQuotationStats]);

  // FIXED: Helper function to get quotation status with null safety
  const getQuotationStatus = (quotation) => {
    // Add null/undefined check
    if (!quotation) return 'active';
    
    if (quotation.converted) return 'converted';
    if (quotation.status === 'cancelled') return 'cancelled';
    
    // Check if expired
    if (quotation.validUntil) {
      const validUntil = new Date(quotation.validUntil);
      const today = new Date();
      if (validUntil < today && quotation.status === 'active') {
        return 'expired';
      }
    }
    
    return quotation.status || 'active';
  };

  // Filter and paginate quotations
  const filteredQuotations = useMemo(() => {
    let filtered = quotations || []; // Add null safety

    // Search filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (quotation) =>
          quotation?.quotationNumber?.toLowerCase().includes(term) ||
          quotation?.customerName?.toLowerCase().includes(term) ||
          quotation?.company?.name?.toLowerCase().includes(term) ||
          quotation?.items?.some((item) => 
            item?.name?.toLowerCase().includes(term)
          )
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((quotation) => {
        if (!quotation) return false; // Add null safety
        
        if (statusFilter === 'expired') {
          // Check if quotation is expired but still active
          const validUntil = new Date(quotation.validUntil);
          const today = new Date();
          return quotation.status === 'active' && validUntil < today;
        }
        return quotation.status === statusFilter || (quotation.converted && statusFilter === 'converted');
      });
    }

    return filtered;
  }, [quotations, searchTerm, statusFilter]);

  const paginatedQuotations = useMemo(() => {
    const startIndex = page * rowsPerPage;
    return filteredQuotations.slice(startIndex, startIndex + rowsPerPage);
  }, [filteredQuotations, page, rowsPerPage]);

  // Event handlers
  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
    setPage(0); // Reset to first page when searching
  };

  const handleStatusFilterChange = (event) => {
    setStatusFilter(event.target.value);
    setPage(0); // Reset to first page when filtering
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleMenuOpen = (event, quotation) => {
    setAnchorEl(event.currentTarget);
    setSelectedQuotation(quotation);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedQuotation(null);
  };

  const handleCreateQuotation = () => {
    navigate('/quotations/create');
  };

  const handleViewQuotation = (id) => {
    navigate(`/quotations/view/${id}`);
    handleMenuClose();
  };

  const handleEditQuotation = (id) => {
    navigate(`/quotations/edit/${id}`);
    handleMenuClose();
  };

  const handleDeleteQuotation = async (id) => {
    if (window.confirm('Are you sure you want to delete this quotation?')) {
      const success = await deleteQuotation(id);
      if (success) {
        // Refresh the list
        loadQuotations();
      }
    }
    handleMenuClose();
  };

  const handleConvertToInvoice = (quotation) => {
    // Navigate to create invoice with pre-filled data from quotation
    navigate('/sales/create', { 
      state: { 
        fromQuotation: true, 
        quotationData: quotation 
      } 
    });
    handleMenuClose();
  };

  // Helper function to format date
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString();
  };

  if (loading && (!quotations || quotations.length === 0)) {
    return (
      <Layout title="Quotations" breadcrumbs={breadcrumbs}>
        <Box display="flex" justifyContent="center" mt={4}>
          <CircularProgress />
        </Box>
      </Layout>
    );
  }

  return (
    <Layout title="Quotations" breadcrumbs={breadcrumbs}>
      <Box>
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Stats Cards */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom variant="body2">
                  Total Quotations
                </Typography>
                <Typography variant="h4" component="div">
                  {stats?.totalQuotations || 0}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  ₹{stats?.totalAmount?.toLocaleString() || '0'}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom variant="body2">
                  Active Quotes
                </Typography>
                <Typography variant="h4" component="div" color="success.main">
                  {stats?.activeQuotations || 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom variant="body2">
                  Converted
                </Typography>
                <Typography variant="h4" component="div" color="primary.main">
                  {stats?.convertedQuotations || 0}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  {stats?.conversionRate || 0}% rate
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom variant="body2">
                  Expired
                </Typography>
                <Typography variant="h4" component="div" color="warning.main">
                  {stats?.expiredQuotations || 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Filters and Search */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  placeholder="Search quotations..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth>
                  <InputLabel>Status Filter</InputLabel>
                  <Select
                    value={statusFilter}
                    label="Status Filter"
                    onChange={handleStatusFilterChange}
                    startAdornment={<FilterIcon sx={{ mr: 1, color: 'action.active' }} />}
                  >
                    <MenuItem value="all">All Status</MenuItem>
                    <MenuItem value="active">Active</MenuItem>
                    <MenuItem value="converted">Converted</MenuItem>
                    <MenuItem value="expired">Expired</MenuItem>
                    <MenuItem value="cancelled">Cancelled</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Button
                  fullWidth
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={handleCreateQuotation}
                  size="large"
                >
                  New Quotation
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Quotations Table */}
        <Card>
          <CardContent sx={{ p: 0 }}>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Quote #</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Customer</TableCell>
                    <TableCell>Company</TableCell>
                    <TableCell align="right">Amount</TableCell>
                    <TableCell>Valid Until</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedQuotations.length > 0 ? (
                    paginatedQuotations.map((quotation) => {
                      // Add null safety check
                      if (!quotation) return null;
                      
                      const status = getQuotationStatus(quotation);
                      return (
                        <TableRow key={quotation.id} hover>
                          <TableCell>
                            <Typography variant="body2" fontWeight={600}>
                              {quotation.quotationNumber || '-'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {formatDate(quotation.quotationDate)}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Box>
                              <Typography variant="body2" fontWeight={600}>
                                {quotation.customerName || '-'}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {quotation.customerPhone || '-'}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {quotation.company?.name || '-'}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2" fontWeight={600}>
                              ₹{quotation.grandTotal?.toLocaleString() || '0'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {formatDate(quotation.validUntil)}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={STATUS_LABELS[status]}
                              color={STATUS_COLORS[status]}
                              size="small"
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell align="center">
                            {isMobile ? (
                              <IconButton
                                onClick={(e) => handleMenuOpen(e, quotation)}
                                size="small"
                              >
                                <MoreVertIcon />
                              </IconButton>
                            ) : (
                              <Box display="flex" gap={0.5} justifyContent={'center'}>
                                <Tooltip title="View">
                                  <IconButton
                                    size="small"
                                    onClick={() => handleViewQuotation(quotation.id)}
                                  >
                                    <ViewIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Edit">
                                  <IconButton
                                    size="small"
                                    onClick={() => handleEditQuotation(quotation.id)}
                                    disabled={status === 'converted'}
                                  >
                                    <EditIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Convert to Invoice">
                                  <IconButton
                                    size="small"
                                    onClick={() => handleConvertToInvoice(quotation)}
                                    disabled={status === 'converted'}
                                    color="primary"
                                  >
                                    <ConvertIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Delete">
                                  <IconButton
                                    size="small"
                                    onClick={() => handleDeleteQuotation(quotation.id)}
                                    color="error"
                                  >
                                    <DeleteIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              </Box>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                        <Box display="flex" flexDirection="column" alignItems="center" gap={2}>
                          <QuoteIcon sx={{ fontSize: 48, color: 'text.secondary' }} />
                          <Typography variant="body1" color="text.secondary">
                            {searchTerm || statusFilter !== 'all' 
                              ? 'No quotations found matching your filters'
                              : 'No quotations created yet'
                            }
                          </Typography>
                          {(!searchTerm && statusFilter === 'all') && (
                            <Button
                              variant="contained"
                              startIcon={<AddIcon />}
                              onClick={handleCreateQuotation}
                            >
                              Create First Quotation
                            </Button>
                          )}
                        </Box>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Pagination */}
            {filteredQuotations.length > 0 && (
              <TablePagination
                component="div"
                count={filteredQuotations.length}
                page={page}
                onPageChange={handleChangePage}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={handleChangeRowsPerPage}
                rowsPerPageOptions={[5, 10, 25, 50]}
              />
            )}
          </CardContent>
        </Card>

        {/* Mobile Menu */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        >
          <MenuItem onClick={() => handleViewQuotation(selectedQuotation?.id)}>
            <ViewIcon sx={{ mr: 1 }} fontSize="small" />
            View
          </MenuItem>
          <MenuItem 
            onClick={() => handleEditQuotation(selectedQuotation?.id)}
            disabled={getQuotationStatus(selectedQuotation) === 'converted'}
          >
            <EditIcon sx={{ mr: 1 }} fontSize="small" />
            Edit
          </MenuItem>
          <MenuItem 
            onClick={() => handleConvertToInvoice(selectedQuotation)}
            disabled={getQuotationStatus(selectedQuotation) === 'converted'}
          >
            <ConvertIcon sx={{ mr: 1 }} fontSize="small" />
            Convert to Invoice
          </MenuItem>
          <MenuItem onClick={() => handleDeleteQuotation(selectedQuotation?.id)}>
            <DeleteIcon sx={{ mr: 1 }} fontSize="small" />
            Delete
          </MenuItem>
        </Menu>
      </Box>
    </Layout>
  );
};

// Main component with providers
const QuotationsPage = () => {
  return (
    <CustomerProvider>
      <EmployeeProvider>
        <QuotationProvider>
          <QuotationsPageContent />
        </QuotationProvider>
      </EmployeeProvider>
    </CustomerProvider>
  );
};

export default QuotationsPage;