import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  TextField,
  Button,
  FormControl,
  FormControlLabel,
  Switch,
  Divider,
  Alert,
  Autocomplete,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  useTheme,
  useMediaQuery,
  CircularProgress
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Receipt as ReceiptIcon,
  Calculate as CalculateIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';

import { useCustomer } from '../../../contexts/CustomerContext/CustomerContext';
import { useEmployee } from '../../../contexts/EmployeeContext/EmployeeContext';
import { calculateGST } from '../../../utils/helpers/gstCalculator';
import { PAYMENT_STATUS, DELIVERY_STATUS } from '../../../utils/constants/appConstants';

/**
 * InvoiceForm component for creating and editing invoices
 * @param {Object} props
 * @param {Object} props.invoice - Existing invoice data (for edit mode)
 * @param {boolean} props.isEdit - Whether this is edit mode
 * @param {Function} props.onSubmit - Submit callback
 * @param {Function} props.onCancel - Cancel callback
 * @param {boolean} props.loading - Loading state
 * @param {string} props.error - Error message
 * @returns {React.ReactElement}
 */
const InvoiceForm = ({
  invoice = null,
  isEdit = false,
  onSubmit,
  onCancel,
  loading = false,
  error = null
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const { getCustomerSuggestions } = useCustomer();
  const { getEmployeeSuggestions } = useEmployee();

  // Form state
  const [formData, setFormData] = useState({
    saleDate: new Date(),
    customerId: '',
    customerName: '',
    customerPhone: '',
    customerAddress: '',
    customerState: '',
    salesPersonId: '',
    salesPersonName: '',
    items: [{ name: '', description: '', quantity: 1, rate: 0 }],
    includeGST: true,
    paymentStatus: PAYMENT_STATUS.PAID,
    deliveryStatus: DELIVERY_STATUS.DELIVERED,
    scheduledDeliveryDate: null,
    emiDetails: {
      monthlyAmount: 0,
      startDate: null,
      numberOfInstallments: 1
    }
  });

  const [formErrors, setFormErrors] = useState({});
  const [customerOptions, setCustomerOptions] = useState([]);
  const [employeeOptions, setEmployeeOptions] = useState([]);
  const [customerLoading, setCustomerLoading] = useState(false);
  const [employeeLoading, setEmployeeLoading] = useState(false);
  const [calculations, setCalculations] = useState({
    subtotal: 0,
    totalGST: 0,
    grandTotal: 0
  });

  // Initialize form data for edit
  useEffect(() => {
    if (isEdit && invoice) {
      setFormData({
        saleDate: invoice.saleDate ? new Date(invoice.saleDate) : new Date(),
        customerId: invoice.customerId || '',
        customerName: invoice.customerName || '',
        customerPhone: invoice.customerPhone || '',
        customerAddress: invoice.customerAddress || '',
        customerState: invoice.customerState || '',
        salesPersonId: invoice.salesPersonId || '',
        salesPersonName: invoice.salesPersonName || '',
        items: invoice.items || [{ name: '', description: '', quantity: 1, rate: 0 }],
        includeGST: invoice.includeGST !== false,
        paymentStatus: invoice.paymentStatus || PAYMENT_STATUS.PAID,
        deliveryStatus: invoice.deliveryStatus || DELIVERY_STATUS.DELIVERED,
        scheduledDeliveryDate: invoice.scheduledDeliveryDate ? new Date(invoice.scheduledDeliveryDate) : null,
        emiDetails: invoice.emiDetails || {
          monthlyAmount: 0,
          startDate: null,
          numberOfInstallments: 1
        }
      });
    }
  }, [isEdit, invoice]);

  // Calculate totals when items or GST settings change
  useEffect(() => {
    const calculateTotals = () => {
      let subtotal = 0;
      let totalGST = 0;

      formData.items.forEach(item => {
        if (item.quantity && item.rate) {
          const itemTotal = parseFloat(item.quantity) * parseFloat(item.rate);
          const gstCalc = calculateGST(itemTotal, formData.customerState, formData.includeGST);
          subtotal += gstCalc.baseAmount;
          totalGST += gstCalc.totalGstAmount;
        }
      });

      setCalculations({
        subtotal: Math.round(subtotal * 100) / 100,
        totalGST: Math.round(totalGST * 100) / 100,
        grandTotal: Math.round((subtotal + totalGST) * 100) / 100
      });
    };

    calculateTotals();
  }, [formData.items, formData.customerState, formData.includeGST]);

  // Handle customer search
  const handleCustomerSearch = async (searchTerm) => {
    if (!searchTerm || searchTerm.length < 2) {
      setCustomerOptions([]);
      return;
    }

    setCustomerLoading(true);
    try {
      const suggestions = await getCustomerSuggestions(searchTerm);
      setCustomerOptions(suggestions);
    } catch (error) {
      console.error('Error fetching customer suggestions:', error);
    } finally {
      setCustomerLoading(false);
    }
  };

  // Handle customer selection
  const handleCustomerSelect = (customer) => {
    if (customer) {
      setFormData(prev => ({
        ...prev,
        customerId: customer.id,
        customerName: customer.name,
        customerPhone: customer.phone,
        customerAddress: customer.address,
        customerState: customer.state || ''
      }));
    }
  };

  // Handle employee search
  const handleEmployeeSearch = async (searchTerm) => {
    if (!searchTerm || searchTerm.length < 2) {
      setEmployeeOptions([]);
      return;
    }

    setEmployeeLoading(true);
    try {
      const suggestions = await getEmployeeSuggestions(searchTerm);
      setEmployeeOptions(suggestions);
    } catch (error) {
      console.error('Error fetching employee suggestions:', error);
    } finally {
      setEmployeeLoading(false);
    }
  };

  // Handle employee selection
  const handleEmployeeSelect = (employee) => {
    if (employee) {
      setFormData(prev => ({
        ...prev,
        salesPersonId: employee.id,
        salesPersonName: employee.name
      }));
    }
  };

  // Handle item changes
  const handleItemChange = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  // Add new item row
  const addItemRow = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { name: '', description: '', quantity: 1, rate: 0 }]
    }));
  };

  // Remove item row
  const removeItemRow = (index) => {
    if (formData.items.length > 1) {
      setFormData(prev => ({
        ...prev,
        items: prev.items.filter((_, i) => i !== index)
      }));
    }
  };

  // Handle form field changes
  const handleChange = (field) => (event) => {
    const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle date changes
  const handleDateChange = (field) => (date) => {
    setFormData(prev => ({
      ...prev,
      [field]: date
    }));
  };

  // Handle EMI details change
  const handleEMIChange = (field) => (event) => {
    const value = event.target.value;
    setFormData(prev => ({
      ...prev,
      emiDetails: {
        ...prev.emiDetails,
        [field]: value
      }
    }));
  };

  // Validate form
  const validateForm = () => {
    const errors = {};

    if (!formData.customerId || !formData.customerName) {
      errors.customer = 'Customer is required';
    }

    if (!formData.salesPersonId || !formData.salesPersonName) {
      errors.salesPerson = 'Sales person is required';
    }

    if (formData.items.length === 0) {
      errors.items = 'At least one item is required';
    }

    formData.items.forEach((item, index) => {
      if (!item.name) {
        errors[`item_${index}_name`] = 'Item name is required';
      }
      if (!item.quantity || parseFloat(item.quantity) <= 0) {
        errors[`item_${index}_quantity`] = 'Valid quantity is required';
      }
      if (!item.rate || parseFloat(item.rate) <= 0) {
        errors[`item_${index}_rate`] = 'Valid rate is required';
      }
    });

    if (formData.paymentStatus === PAYMENT_STATUS.EMI) {
      if (!formData.emiDetails.monthlyAmount || parseFloat(formData.emiDetails.monthlyAmount) <= 0) {
        errors.emiAmount = 'EMI monthly amount is required';
      }
      if (!formData.emiDetails.startDate) {
        errors.emiStartDate = 'EMI start date is required';
      }
    }

    if (formData.deliveryStatus === DELIVERY_STATUS.SCHEDULED && !formData.scheduledDeliveryDate) {
      errors.deliveryDate = 'Scheduled delivery date is required';
    }

    return errors;
  };

  // Generate EMI schedule
  const generateEMISchedule = () => {
    if (formData.paymentStatus !== PAYMENT_STATUS.EMI || !formData.emiDetails.monthlyAmount || !formData.emiDetails.startDate) {
      return [];
    }

    const monthlyAmount = parseFloat(formData.emiDetails.monthlyAmount);
    const startDate = new Date(formData.emiDetails.startDate);
    const totalAmount = calculations.grandTotal;
    const numberOfInstallments = Math.ceil(totalAmount / monthlyAmount);

    const schedule = [];
    for (let i = 0; i < numberOfInstallments; i++) {
      const dueDate = new Date(startDate);
      dueDate.setMonth(dueDate.getMonth() + i);
      
      const isLastInstallment = i === numberOfInstallments - 1;
      const amount = isLastInstallment 
        ? totalAmount - (monthlyAmount * (numberOfInstallments - 1))
        : monthlyAmount;

      schedule.push({
        installmentNumber: i + 1,
        dueDate: dueDate.toISOString(),
        amount: Math.round(amount * 100) / 100,
        paid: false
      });
    }

    return schedule;
  };

  // Handle form submission
  const handleSubmit = async (event) => {
    event.preventDefault();

    const errors = validateForm();
    setFormErrors(errors);

    if (Object.keys(errors).length > 0) {
      return;
    }

    // Prepare invoice data
    const invoiceData = {
      ...formData,
      saleDate: formData.saleDate.toISOString(),
      scheduledDeliveryDate: formData.scheduledDeliveryDate?.toISOString(),
      emiDetails: formData.paymentStatus === PAYMENT_STATUS.EMI ? {
        ...formData.emiDetails,
        startDate: formData.emiDetails.startDate?.toISOString(),
        schedule: generateEMISchedule()
      } : null
    };

    if (onSubmit) {
      await onSubmit(invoiceData);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit}>
      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Left Column */}
        <Grid item xs={12} lg={8}>
          {/* Basic Details */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <ReceiptIcon />
                Invoice Details
              </Typography>
              
              <Grid container spacing={3}>
                {/* Sale Date */}
                <Grid item xs={12} sm={6}>
                  <DatePicker
                    label="Sale Date"
                    value={formData.saleDate}
                    onChange={handleDateChange('saleDate')}
                    disabled={loading}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        required: true
                      }
                    }}
                  />
                </Grid>

                {/* GST Toggle */}
                <Grid item xs={12} sm={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.includeGST}
                        onChange={handleChange('includeGST')}
                        disabled={loading}
                      />
                    }
                    label="Include GST"
                    sx={{ mt: 2 }}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Customer Details */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Customer Details
              </Typography>
              
              {formErrors.customer && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {formErrors.customer}
                </Alert>
              )}

              <Grid container spacing={3}>
                {/* Customer Search */}
                <Grid item xs={12}>
                  <Autocomplete
                    options={customerOptions}
                    getOptionLabel={(option) => option.label || ''}
                    loading={customerLoading}
                    onInputChange={(event, value) => handleCustomerSearch(value)}
                    onChange={(event, value) => handleCustomerSelect(value)}
                    disabled={loading}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Search Customer"
                        placeholder="Type customer name or phone..."
                        required
                        helperText="Start typing to search for existing customers"
                      />
                    )}
                  />
                </Grid>

                {/* Customer Info (Auto-populated) */}
                {formData.customerId && (
                  <>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Customer Name"
                        value={formData.customerName}
                        disabled
                        variant="filled"
                      />
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Phone Number"
                        value={formData.customerPhone}
                        disabled
                        variant="filled"
                      />
                    </Grid>

                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Address"
                        value={formData.customerAddress}
                        disabled
                        variant="filled"
                        multiline
                        rows={2}
                      />
                    </Grid>
                  </>
                )}
              </Grid>
            </CardContent>
          </Card>

          {/* Sales Person */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Sales Person
              </Typography>
              
              {formErrors.salesPerson && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {formErrors.salesPerson}
                </Alert>
              )}

              <Autocomplete
                options={employeeOptions}
                getOptionLabel={(option) => option.label || ''}
                loading={employeeLoading}
                onInputChange={(event, value) => handleEmployeeSearch(value)}
                onChange={(event, value) => handleEmployeeSelect(value)}
                disabled={loading}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Search Sales Person"
                    placeholder="Type employee name or ID..."
                    required
                    helperText="Start typing to search for employees"
                  />
                )}
              />
            </CardContent>
          </Card>

          {/* Items */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h6">
                  Items
                </Typography>
                <Button
                  startIcon={<AddIcon />}
                  onClick={addItemRow}
                  disabled={loading}
                >
                  Add Item
                </Button>
              </Box>

              {formErrors.items && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {formErrors.items}
                </Alert>
              )}

              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Item Name *</TableCell>
                      <TableCell>Description</TableCell>
                      <TableCell>Qty *</TableCell>
                      <TableCell>Rate *</TableCell>
                      <TableCell>Total</TableCell>
                      <TableCell width={50}></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {formData.items.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <TextField
                            fullWidth
                            size="small"
                            placeholder="Item name"
                            value={item.name}
                            onChange={(e) => handleItemChange(index, 'name', e.target.value)}
                            error={!!formErrors[`item_${index}_name`]}
                            disabled={loading}
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            fullWidth
                            size="small"
                            placeholder="Description"
                            value={item.description}
                            onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                            disabled={loading}
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            fullWidth
                            size="small"
                            type="number"
                            placeholder="Qty"
                            value={item.quantity}
                            onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                            error={!!formErrors[`item_${index}_quantity`]}
                            disabled={loading}
                            inputProps={{ min: 1 }}
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            fullWidth
                            size="small"
                            type="number"
                            placeholder="Rate"
                            value={item.rate}
                            onChange={(e) => handleItemChange(index, 'rate', e.target.value)}
                            error={!!formErrors[`item_${index}_rate`]}
                            disabled={loading}
                            inputProps={{ min: 0, step: 0.01 }}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            ₹{(parseFloat(item.quantity || 0) * parseFloat(item.rate || 0)).toFixed(2)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <IconButton
                            size="small"
                            onClick={() => removeItemRow(index)}
                            disabled={formData.items.length === 1 || loading}
                            color="error"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Right Column */}
        <Grid item xs={12} lg={4}>
          {/* Calculation Summary */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CalculateIcon />
                Summary
              </Typography>
              
              <Box>
                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography variant="body2">Subtotal:</Typography>
                  <Typography variant="body2">₹{calculations.subtotal.toFixed(2)}</Typography>
                </Box>
                
                {formData.includeGST && (
                  <Box display="flex" justifyContent="space-between" mb={1}>
                    <Typography variant="body2">
                      GST ({formData.customerState?.toLowerCase() === 'gujarat' ? 'CGST+SGST' : 'IGST'}):
                    </Typography>
                    <Typography variant="body2">₹{calculations.totalGST.toFixed(2)}</Typography>
                  </Box>
                )}
                
                <Divider sx={{ my: 1 }} />
                
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="h6" fontWeight="bold">Grand Total:</Typography>
                  <Typography variant="h6" fontWeight="bold" color="primary.main">
                    ₹{calculations.grandTotal.toFixed(2)}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>

          {/* Payment Options */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Payment Options
              </Typography>
              
              <FormControl fullWidth sx={{ mb: 2 }}>
                <TextField
                  select
                  label="Payment Status"
                  value={formData.paymentStatus}
                  onChange={handleChange('paymentStatus')}
                  disabled={loading}
                >
                  <option value={PAYMENT_STATUS.PAID}>Paid in Full</option>
                  <option value={PAYMENT_STATUS.EMI}>EMI Payment</option>
                  <option value={PAYMENT_STATUS.PENDING}>Payment Pending</option>
                </TextField>
              </FormControl>

              {/* EMI Details */}
              {formData.paymentStatus === PAYMENT_STATUS.EMI && (
                <Box>
                  <TextField
                    fullWidth
                    label="Monthly EMI Amount"
                    type="number"
                    value={formData.emiDetails.monthlyAmount}
                    onChange={handleEMIChange('monthlyAmount')}
                    error={!!formErrors.emiAmount}
                    helperText={formErrors.emiAmount}
                    disabled={loading}
                    sx={{ mb: 2 }}
                    inputProps={{ min: 1, step: 0.01 }}
                  />
                  
                  <DatePicker
                    label="EMI Start Date"
                    value={formData.emiDetails.startDate}
                    onChange={handleDateChange('emiDetails.startDate')}
                    disabled={loading}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        error: !!formErrors.emiStartDate,
                        helperText: formErrors.emiStartDate
                      }
                    }}
                  />
                </Box>
              )}
            </CardContent>
          </Card>

          {/* Delivery Options */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Delivery Options
              </Typography>
              
              <FormControl fullWidth sx={{ mb: 2 }}>
                <TextField
                  select
                  label="Delivery Status"
                  value={formData.deliveryStatus}
                  onChange={handleChange('deliveryStatus')}
                  disabled={loading}
                >
                  <option value={DELIVERY_STATUS.DELIVERED}>Delivered</option>
                  <option value={DELIVERY_STATUS.SCHEDULED}>Schedule Later</option>
                  <option value={DELIVERY_STATUS.PENDING}>Pending</option>
                </TextField>
              </FormControl>

              {/* Scheduled Delivery Date */}
              {formData.deliveryStatus === DELIVERY_STATUS.SCHEDULED && (
                <DatePicker
                  label="Scheduled Delivery Date"
                  value={formData.scheduledDeliveryDate}
                  onChange={handleDateChange('scheduledDeliveryDate')}
                  disabled={loading}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      error: !!formErrors.deliveryDate,
                      helperText: formErrors.deliveryDate
                    }
                  }}
                />
              )}
            </CardContent>
          </Card>

          {/* Form Actions */}
          <Card>
            <CardContent>
              <Box 
                display="flex" 
                flexDirection="column"
                gap={2}
              >
                <Button
                  type="submit"
                  variant="contained"
                  disabled={loading}
                  size="large"
                  fullWidth
                  startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                >
                  {isEdit ? 'Update Invoice' : 'Create Invoice'}
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
    </Box>
  );
};

export default InvoiceForm;