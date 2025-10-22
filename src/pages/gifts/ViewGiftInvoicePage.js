// src/pages/gifts/ViewGiftInvoicePage.js
import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Chip,
  Divider,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Stack,
  Avatar,
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select
} from '@mui/material';
import {
  Edit as EditIcon,
  Print as PrintIcon,
  ArrowBack as BackIcon,
  Business as BusinessIcon,
  Person as PersonIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
  CardGiftcard as GiftIcon,
  Receipt as ReceiptIcon,
  LocalShipping as DeliveryIcon,
  MoreVert as MoreVertIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Schedule as PendingIcon,
  Close as CloseIcon
} from '@mui/icons-material';

import Layout from '../../components/common/Layout/Layout';
import PrintableGiftInvoice from '../../components/gifts/PrintableGiftInvoice/PrintableGiftInvoice';
import { GiftInvoiceProvider, useGiftInvoice } from '../../contexts/GiftInvoiceContext/GiftInvoiceContext';
import { 
  GIFT_INVOICE_STATUS_DISPLAY, 
  GIFT_INVOICE_STATUS_COLORS,
  ITEM_DELIVERY_STATUS,
  ITEM_DELIVERY_STATUS_DISPLAY,
  ITEM_DELIVERY_STATUS_COLORS
} from '../../utils/constants/index';
import { useUserType } from '../../contexts/UserTypeContext/UserTypeContext';
import giftInvoiceService from '../../services/giftInvoiceService';

const ViewGiftInvoicePageContent = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentGiftInvoice, loading, error, getGiftInvoiceById } = useGiftInvoice();
  const { userType } = useUserType();
  
  const [loadingInvoice, setLoadingInvoice] = useState(true);
  const [actionMenuAnchor, setActionMenuAnchor] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [updating, setUpdating] = useState(false);
  const [showPrintView, setShowPrintView] = useState(false);

  const breadcrumbs = [
    { label: 'Gifts', path: '/gifts' },
    { label: currentGiftInvoice?.giftInvoiceNumber || 'Loading...', path: `/gifts/view/${id}` }
  ];

  useEffect(() => {
    const loadInvoice = async () => {
      if (id) {
        setLoadingInvoice(true);
        try {
          await getGiftInvoiceById(id);
        } catch (err) {
          console.error('Error loading gift invoice:', err);
        } finally {
          setLoadingInvoice(false);
        }
      }
    };

    loadInvoice();
  }, [id, getGiftInvoiceById]);

  const handlePrint = () => {
    setShowPrintView(true);
  };

  const handlePrintComplete = () => {
    setShowPrintView(false);
  };
 
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const getDeliveryIcon = (status) => {
    switch (status) {
      case ITEM_DELIVERY_STATUS.DELIVERED:
        return <CheckCircleIcon color="success" />;
      case ITEM_DELIVERY_STATUS.CANCELLED:
        return <CancelIcon color="error" />;
      case ITEM_DELIVERY_STATUS.PENDING:
      default:
        return <PendingIcon color="warning" />;
    }
  };

  const handleItemActionClick = (event, item, index) => {
    event.stopPropagation();
    setActionMenuAnchor(event.currentTarget);
    setSelectedItem({ ...item, index });
  };

  const handleActionMenuClose = () => {
    setActionMenuAnchor(null);
  };

  const handleChangeStatusClick = () => {
    if (selectedItem) {
      setNewStatus(selectedItem.deliveryStatus || ITEM_DELIVERY_STATUS.PENDING);
      setStatusDialogOpen(true);
    }
    handleActionMenuClose();
  };

  const handleStatusUpdate = async () => {
    if (!selectedItem || !userType) return;

    try {
      setUpdating(true);
      await giftInvoiceService.updateItemDeliveryStatus(
        userType,
        id,
        selectedItem.index,
        newStatus
      );
      
      await getGiftInvoiceById(id);
      
      setStatusDialogOpen(false);
      setSelectedItem(null);
    } catch (err) {
      console.error('Error updating status:', err);
      alert('Failed to update delivery status');
    } finally {
      setUpdating(false);
    }
  };

  const getDeliveryStats = () => {
    if (!currentGiftInvoice?.items) return { pending: 0, delivered: 0, cancelled: 0, total: 0 };
    
    const stats = {
      pending: 0,
      delivered: 0,
      cancelled: 0,
      total: currentGiftInvoice.items.length
    };

    currentGiftInvoice.items.forEach(item => {
      const status = item.deliveryStatus || ITEM_DELIVERY_STATUS.PENDING;
      if (status === ITEM_DELIVERY_STATUS.PENDING) stats.pending++;
      else if (status === ITEM_DELIVERY_STATUS.DELIVERED) stats.delivered++;
      else if (status === ITEM_DELIVERY_STATUS.CANCELLED) stats.cancelled++;
    });

    return stats;
  };

  if (loadingInvoice || loading) {
    return (
      <Layout title="Loading..." breadcrumbs={breadcrumbs}>
        <Box display="flex" justifyContent="center" mt={4}>
          <CircularProgress />
        </Box>
      </Layout>
    );
  }

  if (error || !currentGiftInvoice) {
    return (
      <Layout title="Gift Invoice Not Found" breadcrumbs={breadcrumbs}>
        <Alert severity="error">
          {error || 'Gift invoice not found'}
        </Alert>
      </Layout>
    );
  }

  const deliveryStats = getDeliveryStats();

  return (
    <Layout 
      title={`Gift Invoice ${currentGiftInvoice.giftInvoiceNumber}`} 
      breadcrumbs={breadcrumbs}
    >
      <Box>
        {/* Action Buttons */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Button
            startIcon={<BackIcon />}
            onClick={() => navigate('/gifts')}
          >
            Back to List
          </Button>
          <Stack direction="row" spacing={2}>
            <Button
              variant="outlined"
              startIcon={<PrintIcon />}
              onClick={handlePrint}
            >
              Print
            </Button>
            <Button
              variant="contained"
              startIcon={<EditIcon />}
              onClick={() => navigate(`/gifts/edit/${id}`)}
            >
              Edit
            </Button>
          </Stack>
        </Box>

        <Grid container spacing={3}>
          {/* Left Column */}
          <Grid item xs={12} lg={8}>
            {/* Company & Customer Info */}
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Grid container spacing={3}>
                  {/* Company Details */}
                  {currentGiftInvoice.company && (
                    <Grid item xs={12} md={6}>
                      <Box display="flex" alignItems="start" mb={2}>
                        <Avatar sx={{ bgcolor: 'primary.light', mr: 2 }}>
                          <BusinessIcon />
                        </Avatar>
                        <Box flex={1}>
                          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                            FROM
                          </Typography>
                          <Typography variant="h6" fontWeight="bold">
                            {currentGiftInvoice.company.name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {currentGiftInvoice.company.address}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {currentGiftInvoice.company.city}, {currentGiftInvoice.company.state} - {currentGiftInvoice.company.pincode}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            <PhoneIcon sx={{ fontSize: 14, verticalAlign: 'middle', mr: 0.5 }} />
                            {currentGiftInvoice.company.phone}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            GST: {currentGiftInvoice.company.gstNumber}
                          </Typography>
                        </Box>
                      </Box>
                    </Grid>
                  )}

                  {/* Customer Details */}
                  <Grid item xs={12} md={6}>
                    <Box display="flex" alignItems="start">
                      <Avatar sx={{ bgcolor: 'success.light', mr: 2 }}>
                        <PersonIcon />
                      </Avatar>
                      <Box flex={1}>
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                          TO
                        </Typography>
                        <Typography variant="h6" fontWeight="bold">
                          {currentGiftInvoice.customerName}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          <PhoneIcon sx={{ fontSize: 14, verticalAlign: 'middle', mr: 0.5 }} />
                          {currentGiftInvoice.customerPhone}
                        </Typography>
                        {currentGiftInvoice.customerAddress && (
                          <Typography variant="body2" color="text.secondary">
                            <LocationIcon sx={{ fontSize: 14, verticalAlign: 'middle', mr: 0.5 }} />
                            {currentGiftInvoice.customerAddress}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            {/* Delivery Stats */}
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <DeliveryIcon />
                  Delivery Status Overview
                </Typography>
                <Grid container spacing={2} sx={{ mt: 1 }}>
                  <Grid item xs={6} sm={3}>
                    <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'grey.100' }}>
                      <Typography variant="h4" fontWeight="bold">
                        {deliveryStats.total}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Total Items
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'warning.lighter' }}>
                      <Typography variant="h4" fontWeight="bold" color="warning.main">
                        {deliveryStats.pending}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Pending
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'success.lighter' }}>
                      <Typography variant="h4" fontWeight="bold" color="success.main">
                        {deliveryStats.delivered}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Delivered
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'error.lighter' }}>
                      <Typography variant="h4" fontWeight="bold" color="error.main">
                        {deliveryStats.cancelled}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Cancelled
                      </Typography>
                    </Paper>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            {/* Gift Items Table */}
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <GiftIcon />
                  Gift Items - {currentGiftInvoice.giftSetTitle}
                </Typography>
                
                <TableContainer sx={{ mt: 2 }}>
                  <Table>
                    <TableHead>
                      <TableRow sx={{ bgcolor: 'grey.50' }}>
                        <TableCell width="60px" align="center">#</TableCell>
                        <TableCell>Item Name</TableCell>
                        <TableCell align="center">Delivery Status</TableCell>
                        <TableCell width="80px" align="center">Action</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {currentGiftInvoice.items.map((item, index) => {
                        const itemName = typeof item === 'string' ? item : item.name;
                        const itemStatus = typeof item === 'object' && item.deliveryStatus 
                          ? item.deliveryStatus 
                          : ITEM_DELIVERY_STATUS.PENDING;

                        return (
                          <TableRow key={index} hover>
                            <TableCell align="center">{index + 1}</TableCell>
                            <TableCell>
                              <Typography variant="body2" fontWeight="medium">
                                {itemName}
                              </Typography>
                            </TableCell>
                            <TableCell align="center">
                              <Chip
                                icon={getDeliveryIcon(itemStatus)}
                                label={ITEM_DELIVERY_STATUS_DISPLAY[itemStatus]}
                                color={ITEM_DELIVERY_STATUS_COLORS[itemStatus]}
                                size="small"
                              />
                            </TableCell>
                            <TableCell align="center">
                              <IconButton
                                size="small"
                                onClick={(e) => handleItemActionClick(e, { name: itemName, deliveryStatus: itemStatus }, index)}
                              >
                                <MoreVertIcon fontSize="small" />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>

          {/* Right Column */}
          <Grid item xs={12} lg={4}>
            {/* Linked Invoice */}
            {currentGiftInvoice.linkedInvoiceNumber && (
              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    <ReceiptIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
                    Linked Sales Invoice
                  </Typography>
                  <Paper sx={{ p: 2, bgcolor: 'primary.lighter', mt: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Invoice Number
                    </Typography>
                    <Chip
                      label={currentGiftInvoice.linkedInvoiceNumber}
                      color="primary"
                      onClick={() => navigate(`/sales/view/${currentGiftInvoice.linkedInvoiceId}`)}
                      clickable
                      sx={{ fontWeight: 'bold' }}
                    />
                    <Typography variant="caption" color="text.secondary" display="block" mt={2}>
                      Click to view full sales invoice
                    </Typography>
                  </Paper>
                </CardContent>
              </Card>
            )}

            {/* Remarks */}
            {currentGiftInvoice.remarks && (
              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Remarks
                  </Typography>
                  <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                    <Typography variant="body2">
                      {currentGiftInvoice.remarks}
                    </Typography>
                  </Paper>
                </CardContent>
              </Card>
            )}

            {/* Info Card */}
            <Paper sx={{ p: 3, bgcolor: 'info.lighter', border: '2px dashed', borderColor: 'info.main' }}>
              <Stack direction="row" spacing={2} alignItems="start">
                <GiftIcon color="info" sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="subtitle1" fontWeight="bold" color="info.dark" gutterBottom>
                    Complimentary Gift
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    All items in this invoice are complimentary gifts. No payment required. Track delivery status for each item individually.
                  </Typography>
                </Box>
              </Stack>
            </Paper>
          </Grid>
        </Grid>

        {/* Action Menu */}
        <Menu
          anchorEl={actionMenuAnchor}
          open={Boolean(actionMenuAnchor)}
          onClose={handleActionMenuClose}
        >
          <MenuItem onClick={handleChangeStatusClick}>
            <DeliveryIcon fontSize="small" sx={{ mr: 1 }} />
            Change Status
          </MenuItem>
        </Menu>

        {/* Status Update Dialog */}
        <Dialog open={statusDialogOpen} onClose={() => setStatusDialogOpen(false)}>
          <DialogTitle>Update Delivery Status</DialogTitle>
          <DialogContent sx={{ minWidth: 300 }}>
            <FormControl fullWidth sx={{ mt: 2 }}>
              <InputLabel>Delivery Status</InputLabel>
              <Select
                value={newStatus}
                label="Delivery Status"
                onChange={(e) => setNewStatus(e.target.value)}
              >
                <MenuItem value={ITEM_DELIVERY_STATUS.PENDING}>
                  {ITEM_DELIVERY_STATUS_DISPLAY[ITEM_DELIVERY_STATUS.PENDING]}
                </MenuItem>
                <MenuItem value={ITEM_DELIVERY_STATUS.DELIVERED}>
                  {ITEM_DELIVERY_STATUS_DISPLAY[ITEM_DELIVERY_STATUS.DELIVERED]}
                </MenuItem>
                <MenuItem value={ITEM_DELIVERY_STATUS.CANCELLED}>
                  {ITEM_DELIVERY_STATUS_DISPLAY[ITEM_DELIVERY_STATUS.CANCELLED]}
                </MenuItem>
              </Select>
            </FormControl>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setStatusDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleStatusUpdate} variant="contained" disabled={updating}>
              {updating ? <CircularProgress size={20} /> : 'Update'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Print Modal */}
        <Dialog
          open={showPrintView}
          onClose={handlePrintComplete}
          maxWidth="lg"
          fullWidth
        >
          <DialogTitle>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="h6">Print Gift Invoice</Typography>
              <IconButton onClick={handlePrintComplete}>
                <CloseIcon />
              </IconButton>
            </Box>
          </DialogTitle>
          <DialogContent dividers>
            <PrintableGiftInvoice giftInvoice={currentGiftInvoice} />
          </DialogContent>
        </Dialog>
      </Box>
    </Layout>
  );
};

const ViewGiftInvoicePage = () => {
  return (
    <GiftInvoiceProvider>
      <ViewGiftInvoicePageContent />
    </GiftInvoiceProvider>
  );
};

export default ViewGiftInvoicePage;