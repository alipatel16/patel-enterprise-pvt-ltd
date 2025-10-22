// src/components/gifts/GiftInvoiceForm/GiftInvoiceForm.js
import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Grid,
  Autocomplete,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Add as AddIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Link as LinkIcon,
  CardGiftcard as GiftIcon
} from '@mui/icons-material';

import { useCustomer } from '../../../contexts/CustomerContext/CustomerContext';
import { useGiftSettings } from '../../../contexts/GiftSettingsContext/GiftSettingsContext';
import { useGiftInvoice } from '../../../contexts/GiftInvoiceContext/GiftInvoiceContext';
import {
  getAllCompanies,
} from "../../../utils/constants/companyConstants";
import { GIFT_INVOICE_STATUS, ITEM_DELIVERY_STATUS, ITEM_DELIVERY_STATUS_DISPLAY, ITEM_DELIVERY_STATUS_COLORS } from '../../../utils/constants/index';

/**
 * Gift Invoice Form Component
 * UPDATED: With per-item delivery status
 */
const GiftInvoiceForm = ({
  giftInvoice = null,
  isEdit = false,
  onSubmit,
  onCancel,
  loading = false,
  error = null
}) => {
  const { getCustomerSuggestions } = useCustomer();
  const { giftSets } = useGiftSettings();
  const { getCustomerInvoices } = useGiftInvoice();

  const availableCompanies = getAllCompanies();

  // Form state with items now including delivery status
  const [formData, setFormData] = useState({
    company: null,
    customerId: '',
    customerName: '',
    customerPhone: '',
    customerAddress: '',
    giftSetId: '',
    giftSetTitle: '',
    items: [], // Each item will have: { name, deliveryStatus }
    linkedInvoiceId: '',
    linkedInvoiceNumber: '',
    status: GIFT_INVOICE_STATUS.ACTIVE,
    remarks: ''
  });

  const [formErrors, setFormErrors] = useState({});
  const [customerOptions, setCustomerOptions] = useState([]);
  const [customerLoading, setCustomerLoading] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [selectedGiftSet, setSelectedGiftSet] = useState(null);
  const [customerInvoices, setCustomerInvoices] = useState([]);
  const [linkInvoiceDialogOpen, setLinkInvoiceDialogOpen] = useState(false);
  const [newItemDialogOpen, setNewItemDialogOpen] = useState(false);
  const [newItemName, setNewItemName] = useState('');

  // Initialize form data for edit
  useEffect(() => {
    if (isEdit && giftInvoice) {
      // Ensure items have delivery status
      const itemsWithStatus = (giftInvoice.items || []).map(item => {
        if (typeof item === 'string') {
          return {
            name: item,
            deliveryStatus: ITEM_DELIVERY_STATUS.PENDING
          };
        }
        return {
          name: item.name || item,
          deliveryStatus: item.deliveryStatus || ITEM_DELIVERY_STATUS.PENDING
        };
      });

      setFormData({
        company: giftInvoice.company || null,
        customerId: giftInvoice.customerId || '',
        customerName: giftInvoice.customerName || '',
        customerPhone: giftInvoice.customerPhone || '',
        customerAddress: giftInvoice.customerAddress || '',
        giftSetId: giftInvoice.giftSetId || '',
        giftSetTitle: giftInvoice.giftSetTitle || '',
        items: itemsWithStatus,
        linkedInvoiceId: giftInvoice.linkedInvoiceId || '',
        linkedInvoiceNumber: giftInvoice.linkedInvoiceNumber || '',
        status: giftInvoice.status || GIFT_INVOICE_STATUS.ACTIVE,
        remarks: giftInvoice.remarks || ''
      });

      if (giftInvoice.customerId && giftInvoice.customerName) {
        setSelectedCustomer({
          id: giftInvoice.customerId,
          name: giftInvoice.customerName,
          phone: giftInvoice.customerPhone,
          address: giftInvoice.customerAddress,
          label: `${giftInvoice.customerName} - ${giftInvoice.customerPhone}`
        });
      }

      if (giftInvoice.giftSetId) {
        const giftSet = giftSets.find(s => s.id === giftInvoice.giftSetId);
        if (giftSet) {
          setSelectedGiftSet(giftSet);
        }
      }
    }
  }, [isEdit, giftInvoice, giftSets]);

  // Load customer suggestions
  const handleCustomerSearch = async (searchTerm) => {
    if (!searchTerm || searchTerm.length < 2) {
      setCustomerOptions([]);
      return;
    }

    try {
      setCustomerLoading(true);
      const customers = await getCustomerSuggestions(searchTerm);
      const options = customers.map(customer => ({
        id: customer.id,
        name: customer.name,
        phone: customer.phone,
        address: customer.address,
        state: customer.state,
        label: `${customer.name} - ${customer.phone}`
      }));
      setCustomerOptions(options);
    } catch (err) {
      console.error('Error loading customers:', err);
    } finally {
      setCustomerLoading(false);
    }
  };

  // Handle customer selection
  const handleCustomerSelect = async (event, value) => {
    if (value) {
      setSelectedCustomer(value);
      setFormData(prev => ({
        ...prev,
        customerId: value.id,
        customerName: value.name,
        customerPhone: value.phone,
        customerAddress: value.address
      }));

      // Load customer invoices
      const invoices = await getCustomerInvoices(value.id);
      console.log('Loaded customer invoices:', invoices);
      setCustomerInvoices(invoices);
    } else {
      setSelectedCustomer(null);
      setFormData(prev => ({
        ...prev,
        customerId: '',
        customerName: '',
        customerPhone: '',
        customerAddress: ''
      }));
      setCustomerInvoices([]);
    }
  };

  // Handle company selection
  const handleCompanyChange = (event, company) => {
    setFormData(prev => ({
      ...prev,
      company: company
    }));
  };

  // Handle gift set selection
  const handleGiftSetSelect = (event) => {
    const setId = event.target.value;
    const giftSet = giftSets.find(s => s.id === setId);
    
    if (giftSet) {
      setSelectedGiftSet(giftSet);
      // Convert items to objects with delivery status
      const itemsWithStatus = giftSet.items.map(item => ({
        name: item,
        deliveryStatus: ITEM_DELIVERY_STATUS.DELIVERED
      }));
      
      setFormData(prev => ({
        ...prev,
        giftSetId: giftSet.id,
        giftSetTitle: giftSet.title,
        items: itemsWithStatus
      }));
    } else {
      setSelectedGiftSet(null);
      setFormData(prev => ({
        ...prev,
        giftSetId: '',
        giftSetTitle: '',
        items: []
      }));
    }
  };

  // Handle item delivery status change
  const handleItemDeliveryStatusChange = (index, newStatus) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map((item, i) => 
        i === index ? { ...item, deliveryStatus: newStatus } : item
      )
    }));
  };

  // Handle item removal
  const handleRemoveItem = (index) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  // Handle add new item
  const handleAddNewItem = () => {
    if (newItemName.trim()) {
      setFormData(prev => ({
        ...prev,
        items: [...prev.items, {
          name: newItemName.trim(),
          deliveryStatus: ITEM_DELIVERY_STATUS.PENDING
        }]
      }));
      setNewItemName('');
      setNewItemDialogOpen(false);
    }
  };

  // Handle link invoice
  const handleLinkInvoice = (invoice) => {
    setFormData(prev => ({
      ...prev,
      linkedInvoiceId: invoice.id,
      linkedInvoiceNumber: invoice.invoiceNumber
    }));
    setLinkInvoiceDialogOpen(false);
  };

  // Handle unlink invoice
  const handleUnlinkInvoice = () => {
    setFormData(prev => ({
      ...prev,
      linkedInvoiceId: '',
      linkedInvoiceNumber: ''
    }));
  };

  // Handle form field changes
  const handleChange = (field) => (event) => {
    const value = event.target.value;
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Form validation
  const validateForm = () => {
    const errors = {};

    if (!formData.company) {
      errors.company = 'Company selection is required';
    }

    if (!formData.customerId || !formData.customerName) {
      errors.customer = 'Customer is required';
    }

    if (!formData.giftSetId) {
      errors.giftSet = 'Gift set is required';
    }

    if (formData.items.length === 0) {
      errors.items = 'At least one gift item is required';
    }

    return errors;
  };

  // Form submission
  const handleSubmit = async (event) => {
    event.preventDefault();

    const errors = validateForm();
    setFormErrors(errors);

    if (Object.keys(errors).length > 0) {
      return;
    }

    if (onSubmit) {
      await onSubmit(formData);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit}>
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Left Column */}
        <Grid item xs={12} lg={8}>
          {/* Company & Customer Details */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <GiftIcon />
                Company & Customer Details
              </Typography>

              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={12}>
                  <Autocomplete
                    value={formData.company}
                    onChange={handleCompanyChange}
                    options={availableCompanies}
                    getOptionLabel={(option) => option?.name || ''}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Select Company *"
                        error={!!formErrors.company}
                        helperText={formErrors.company}
                      />
                    )}
                  />
                </Grid>

                <Grid item xs={12}>
                  <Autocomplete
                    value={selectedCustomer}
                    onChange={handleCustomerSelect}
                    onInputChange={(event, value) => handleCustomerSearch(value)}
                    options={customerOptions}
                    loading={customerLoading}
                    getOptionLabel={(option) => option.label || ''}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Search Customer *"
                        placeholder="Type customer name or phone..."
                        error={!!formErrors.customer}
                        helperText={formErrors.customer}
                        InputProps={{
                          ...params.InputProps,
                          endAdornment: (
                            <>
                              {customerLoading ? <CircularProgress size={20} /> : null}
                              {params.InputProps.endAdornment}
                            </>
                          )
                        }}
                      />
                    )}
                  />
                </Grid>

                {selectedCustomer && (
                  <>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Phone"
                        value={formData.customerPhone}
                        disabled
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Address"
                        value={formData.customerAddress}
                        disabled
                      />
                    </Grid>
                  </>
                )}
              </Grid>
            </CardContent>
          </Card>

          {/* Gift Set Selection */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Gift Set Selection
              </Typography>

              <FormControl fullWidth error={!!formErrors.giftSet} sx={{ mt: 2 }}>
                <InputLabel>Select Gift Set *</InputLabel>
                <Select
                  value={formData.giftSetId}
                  onChange={handleGiftSetSelect}
                  label="Select Gift Set *"
                >
                  <MenuItem value="">
                    <em>None</em>
                  </MenuItem>
                  {giftSets.map((set) => (
                    <MenuItem key={set.id} value={set.id}>
                      {set.title} ({set.items.length} items)
                    </MenuItem>
                  ))}
                </Select>
                {formErrors.giftSet && (
                  <Typography variant="caption" color="error">
                    {formErrors.giftSet}
                  </Typography>
                )}
              </FormControl>
            </CardContent>
          </Card>

          {/* Gift Items with Delivery Status */}
          {formData.items.length > 0 && (
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="h6">
                    Gift Items ({formData.items.length})
                  </Typography>
                  <Button
                    size="small"
                    startIcon={<AddIcon />}
                    onClick={() => setNewItemDialogOpen(true)}
                  >
                    Add Item
                  </Button>
                </Box>

                <TableContainer component={Paper} variant="outlined">
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>#</TableCell>
                        <TableCell>Item Name</TableCell>
                        <TableCell>Delivery Status</TableCell>
                        <TableCell align="right">Action</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {formData.items.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>{index + 1}</TableCell>
                          <TableCell>{item.name}</TableCell>
                          <TableCell>
                            <FormControl size="small" sx={{ minWidth: 120 }}>
                              <Select
                                value={item.deliveryStatus || ITEM_DELIVERY_STATUS.PENDING}
                                onChange={(e) => handleItemDeliveryStatusChange(index, e.target.value)}
                              >
                                <MenuItem value={ITEM_DELIVERY_STATUS.PENDING}>
                                  <Chip 
                                    label={ITEM_DELIVERY_STATUS_DISPLAY.pending}
                                    color={ITEM_DELIVERY_STATUS_COLORS.pending}
                                    size="small"
                                  />
                                </MenuItem>
                                <MenuItem value={ITEM_DELIVERY_STATUS.DELIVERED}>
                                  <Chip 
                                    label={ITEM_DELIVERY_STATUS_DISPLAY.delivered}
                                    color={ITEM_DELIVERY_STATUS_COLORS.delivered}
                                    size="small"
                                  />
                                </MenuItem>
                                <MenuItem value={ITEM_DELIVERY_STATUS.CANCELLED}>
                                  <Chip 
                                    label={ITEM_DELIVERY_STATUS_DISPLAY.cancelled}
                                    color={ITEM_DELIVERY_STATUS_COLORS.cancelled}
                                    size="small"
                                  />
                                </MenuItem>
                              </Select>
                            </FormControl>
                          </TableCell>
                          <TableCell align="right">
                            <IconButton
                              size="small"
                              onClick={() => handleRemoveItem(index)}
                              color="error"
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>

                {formErrors.items && (
                  <Alert severity="error" sx={{ mt: 2 }}>
                    {formErrors.items}
                  </Alert>
                )}
              </CardContent>
            </Card>
          )}

          {/* Additional Details */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Additional Details
              </Typography>

              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>Overall Status</InputLabel>
                    <Select
                      value={formData.status}
                      onChange={handleChange('status')}
                      label="Overall Status"
                    >
                      <MenuItem value={GIFT_INVOICE_STATUS.ACTIVE}>Active</MenuItem>
                      <MenuItem value={GIFT_INVOICE_STATUS.COMPLETED}>Completed</MenuItem>
                      <MenuItem value={GIFT_INVOICE_STATUS.CANCELLED}>Cancelled</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Remarks"
                    value={formData.remarks}
                    onChange={handleChange('remarks')}
                    multiline
                    rows={3}
                    placeholder="Add any additional notes or remarks..."
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Right Column */}
        <Grid item xs={12} lg={4}>
          {/* Linked Invoice */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Linked Sales Invoice
              </Typography>

              {formData.linkedInvoiceNumber ? (
                <Box>
                  <Chip
                    label={formData.linkedInvoiceNumber}
                    onDelete={handleUnlinkInvoice}
                    color="primary"
                    sx={{ mb: 2 }}
                  />
                  <Typography variant="caption" color="text.secondary" display="block">
                    This gift invoice is linked to a sales invoice
                  </Typography>
                </Box>
              ) : (
                <Box>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<LinkIcon />}
                    onClick={() => setLinkInvoiceDialogOpen(true)}
                    disabled={!selectedCustomer}
                  >
                    Link to Invoice
                  </Button>
                  {!selectedCustomer && (
                    <Typography variant="caption" color="text.secondary" display="block" mt={1}>
                      Select a customer first
                    </Typography>
                  )}
                  {selectedCustomer && customerInvoices.length === 0 && (
                    <Typography variant="caption" color="text.secondary" display="block" mt={1}>
                      No invoices found for this customer
                    </Typography>
                  )}
                </Box>
              )}
            </CardContent>
          </Card>

          {/* Form Actions */}
          <Card>
            <CardContent>
              <Box display="flex" flexDirection="column" gap={2}>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={loading}
                  size="large"
                  fullWidth
                  startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                >
                  {isEdit ? 'Update Gift Invoice' : 'Create Gift Invoice'}
                </Button>

                <Button
                  variant="outlined"
                  onClick={onCancel}
                  disabled={loading}
                  size="large"
                  fullWidth
                  startIcon={<CancelIcon />}
                >
                  Cancel
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Link Invoice Dialog */}
      <Dialog
        open={linkInvoiceDialogOpen}
        onClose={() => setLinkInvoiceDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Link to Sales Invoice</DialogTitle>
        <DialogContent>
          {customerInvoices.length === 0 ? (
            <Alert severity="info">
              No invoices found for {selectedCustomer?.name}
            </Alert>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Invoice Number</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Total</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {customerInvoices.map((invoice) => (
                    <TableRow key={invoice.id} hover>
                      <TableCell>{invoice.invoiceNumber}</TableCell>
                      <TableCell>{new Date(invoice.saleDate).toLocaleDateString()}</TableCell>
                      <TableCell>₹{invoice.grandTotal?.toFixed(2)}</TableCell>
                      <TableCell>
                        <Chip label={invoice.paymentStatus} size="small" />
                      </TableCell>
                      <TableCell>
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => handleLinkInvoice(invoice)}
                        >
                          Select
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLinkInvoiceDialogOpen(false)}>Cancel</Button>
        </DialogActions>
      </Dialog>

      {/* Add New Item Dialog */}
      <Dialog
        open={newItemDialogOpen}
        onClose={() => setNewItemDialogOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Add Gift Item</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            label="Item Name"
            value={newItemName}
            onChange={(e) => setNewItemName(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddNewItem();
              }
            }}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNewItemDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleAddNewItem} variant="contained" disabled={!newItemName.trim()}>
            Add
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default GiftInvoiceForm;