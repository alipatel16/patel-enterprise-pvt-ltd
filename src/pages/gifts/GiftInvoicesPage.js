// src/pages/gifts/GiftInvoicesPage.js
// UPDATED: Fixed status filter to match new status values
import React, { useState, useEffect } from 'react';
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
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  Grid,
  useTheme,
  useMediaQuery,
  Stack
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  MoreVert as MoreVertIcon,
  CardGiftcard as GiftIcon,
  Settings as SettingsIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';

import Layout from '../../components/common/Layout/Layout';
import { GiftInvoiceProvider, useGiftInvoice } from '../../contexts/GiftInvoiceContext/GiftInvoiceContext';
import { CustomerProvider } from '../../contexts/CustomerContext/CustomerContext';
import { GIFT_INVOICE_STATUS, GIFT_INVOICE_STATUS_DISPLAY, GIFT_INVOICE_STATUS_COLORS } from '../../utils/constants/index';

const GiftInvoicesPageContent = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const {
    giftInvoices,
    loading,
    error,
    pagination,
    loadGiftInvoices,
    deleteGiftInvoice
  } = useGiftInvoice();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [actionMenuAnchor, setActionMenuAnchor] = useState(null);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const breadcrumbs = [
    { label: 'Gifts', path: '/gifts' },
    { label: 'Gift Invoices', path: '/gifts' }
  ];

  // Load gift invoices
  useEffect(() => {
    loadGiftInvoices({
      page: currentPage,
      pageSize,
      status: statusFilter || null,
      searchTerm: searchTerm || null
    });
  }, [currentPage, pageSize, statusFilter, searchTerm, loadGiftInvoices]);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleStatusFilterChange = (e) => {
    setStatusFilter(e.target.value);
    setCurrentPage(1);
  };

  const handlePageChange = (event, newPage) => {
    setCurrentPage(newPage + 1);
  };

  const handlePageSizeChange = (event) => {
    setPageSize(parseInt(event.target.value, 10));
    setCurrentPage(1);
  };

  const handleActionMenuOpen = (event, invoice) => {
    event.stopPropagation();
    setActionMenuAnchor(event.currentTarget);
    setSelectedInvoice(invoice);
  };

  const handleActionMenuClose = () => {
    setActionMenuAnchor(null);
  };

  const handleView = () => {
    if (selectedInvoice) {
      navigate(`/gifts/view/${selectedInvoice.id}`);
    }
    handleActionMenuClose();
  };

  const handleEdit = () => {
    if (selectedInvoice) {
      navigate(`/gifts/edit/${selectedInvoice.id}`);
    }
    handleActionMenuClose();
  };

  const handleDeleteClick = () => {
    setDeleteDialogOpen(true);
    handleActionMenuClose();
  };

  const handleDeleteConfirm = async () => {
    if (selectedInvoice) {
      try {
        await deleteGiftInvoice(selectedInvoice.id);
        setDeleteDialogOpen(false);
        setSelectedInvoice(null);
        loadGiftInvoices({
          page: currentPage,
          pageSize,
          status: statusFilter || null,
          searchTerm: searchTerm || null
        });
      } catch (err) {
        console.error('Delete error:', err);
      }
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const getItemsDeliveryInfo = (items) => {
    if (!items || items.length === 0) return { delivered: 0, total: 0 };
    
    const delivered = items.filter(item => {
      const status = typeof item === 'object' ? item.deliveryStatus : null;
      return status === 'delivered';
    }).length;

    return { delivered, total: items.length };
  };

  return (
    <Layout title="Gift Invoices" breadcrumbs={breadcrumbs}>
      <Box>
        {/* Header */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4" fontWeight="bold">
            Gift Invoices
          </Typography>
          <Stack direction="row" spacing={2}>
            <Button
              variant="outlined"
              startIcon={<SettingsIcon />}
              onClick={() => navigate('/gifts/settings')}
            >
              Gift Settings
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => navigate('/gifts/create')}
            >
              Create Gift Invoice
            </Button>
          </Stack>
        </Box>

        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Filters */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  placeholder="Search by invoice number, customer name, or phone..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon />
                      </InputAdornment>
                    )
                  }}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <FormControl fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={statusFilter}
                    onChange={handleStatusFilterChange}
                    label="Status"
                  >
                    <MenuItem value="">All Statuses</MenuItem>
                    <MenuItem value={GIFT_INVOICE_STATUS.ACTIVE}>Active</MenuItem>
                    <MenuItem value={GIFT_INVOICE_STATUS.COMPLETED}>Completed</MenuItem>
                    <MenuItem value={GIFT_INVOICE_STATUS.CANCELLED}>Cancelled</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Loading State */}
        {loading && giftInvoices.length === 0 ? (
          <Box display="flex" justifyContent="center" py={5}>
            <CircularProgress />
          </Box>
        ) : giftInvoices.length === 0 ? (
          <Card>
            <CardContent>
              <Box textAlign="center" py={5}>
                <GiftIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No Gift Invoices Found
                </Typography>
                <Typography variant="body2" color="text.secondary" mb={3}>
                  Create your first gift invoice to get started
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => navigate('/gifts/create')}
                >
                  Create Gift Invoice
                </Button>
              </Box>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Invoice Number</TableCell>
                    <TableCell>Customer</TableCell>
                    <TableCell>Gift Set</TableCell>
                    <TableCell>Items Delivered</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Linked Invoice</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {giftInvoices.map((invoice) => {
                    const deliveryInfo = getItemsDeliveryInfo(invoice.items);
                    
                    return (
                      <TableRow
                        key={invoice.id}
                        hover
                        sx={{ cursor: 'pointer' }}
                        onClick={() => navigate(`/gifts/view/${invoice.id}`)}
                      >
                        <TableCell>
                          <Typography variant="body2" fontWeight="bold">
                            {invoice.giftInvoiceNumber}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">{invoice.customerName}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {invoice.customerPhone}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">{invoice.giftSetTitle}</Typography>
                        </TableCell>
                        <TableCell>
                          <Stack direction="row" spacing={1} alignItems="center">
                            <CheckCircleIcon 
                              fontSize="small" 
                              color={deliveryInfo.delivered === deliveryInfo.total ? 'success' : 'disabled'}
                            />
                            <Typography variant="body2">
                              {deliveryInfo.delivered} / {deliveryInfo.total}
                            </Typography>
                          </Stack>
                        </TableCell>
                        <TableCell>{formatDate(invoice.createdAt)}</TableCell>
                        <TableCell>
                          <Chip
                            label={GIFT_INVOICE_STATUS_DISPLAY[invoice.status]}
                            color={GIFT_INVOICE_STATUS_COLORS[invoice.status]}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          {invoice.linkedInvoiceNumber ? (
                            <Chip
                              label={invoice.linkedInvoiceNumber}
                              size="small"
                              variant="outlined"
                            />
                          ) : (
                            <Typography variant="caption" color="text.secondary">
                              None
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell align="right">
                          <IconButton
                            size="small"
                            onClick={(e) => handleActionMenuOpen(e, invoice)}
                          >
                            <MoreVertIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              component="div"
              count={pagination.totalCount}
              page={currentPage - 1}
              onPageChange={handlePageChange}
              rowsPerPage={pageSize}
              onRowsPerPageChange={handlePageSizeChange}
              rowsPerPageOptions={[5, 10, 25, 50]}
            />
          </Card>
        )}

        {/* Action Menu */}
        <Menu
          anchorEl={actionMenuAnchor}
          open={Boolean(actionMenuAnchor)}
          onClose={handleActionMenuClose}
        >
          <MenuItem onClick={handleView}>
            <ViewIcon fontSize="small" sx={{ mr: 1 }} />
            View
          </MenuItem>
          <MenuItem onClick={handleEdit}>
            <EditIcon fontSize="small" sx={{ mr: 1 }} />
            Edit
          </MenuItem>
          <MenuItem onClick={handleDeleteClick}>
            <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
            Delete
          </MenuItem>
        </Menu>
      </Box>
    </Layout>
  );
};

const GiftInvoicesPage = () => {
  return (
    <CustomerProvider>
      <GiftInvoiceProvider>
        <GiftInvoicesPageContent />
      </GiftInvoiceProvider>
    </CustomerProvider>
  );
};

export default GiftInvoicesPage;