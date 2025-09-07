import React, { useState, useEffect } from "react";
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
  CircularProgress,
  MenuItem,
} from "@mui/material";
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Receipt as ReceiptIcon,
  Calculate as CalculateIcon,
} from "@mui/icons-material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";

import { useCustomer } from "../../../contexts/CustomerContext/CustomerContext";
import { useEmployee } from "../../../contexts/EmployeeContext/EmployeeContext";
import { calculateGSTWithSlab } from "../../../utils/helpers/gstCalculator";
import {
  PAYMENT_STATUS,
  DELIVERY_STATUS,
} from "../../../utils/constants/appConstants";

// GST Tax Slabs - Define inline to avoid import issues
const GST_TAX_SLABS = [
  { rate: 0, description: "Nil rated" },
  { rate: 5, description: "Essential goods" },
  { rate: 12, description: "Standard goods" },
  { rate: 18, description: "Most goods and services" },
  { rate: 28, description: "Luxury and sin goods" },
];

// Helper function to safely parse dates
const parseDate = (dateValue) => {
  if (!dateValue) return null;
  const date = new Date(dateValue);
  return isNaN(date.getTime()) ? null : date;
};

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
  error = null,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const { getCustomerSuggestions } = useCustomer();
  const { getEmployeeSuggestions } = useEmployee();

  // Form state
  const [formData, setFormData] = useState({
    saleDate: new Date(),
    customerId: "",
    customerName: "",
    customerPhone: "",
    customerAddress: "",
    customerState: "",
    salesPersonId: "",
    salesPersonName: "",
    items: [{ name: "", description: "", quantity: 1, rate: 0, gstSlab: 18 }],
    includeGST: true,
    paymentStatus: PAYMENT_STATUS.PAID,
    deliveryStatus: DELIVERY_STATUS.DELIVERED,
    scheduledDeliveryDate: null,
    emiDetails: {
      monthlyAmount: 0,
      startDate: null,
      numberOfInstallments: 1,
    },
  });

  const [formErrors, setFormErrors] = useState({});
  const [customerOptions, setCustomerOptions] = useState([]);
  const [employeeOptions, setEmployeeOptions] = useState([]);
  const [customerLoading, setCustomerLoading] = useState(false);
  const [employeeLoading, setEmployeeLoading] = useState(false);
  const [calculations, setCalculations] = useState({
    subtotal: 0,
    totalGST: 0,
    grandTotal: 0,
    itemTotals: [],
  });

  // Store selected customer and employee for autocomplete
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  // Initialize form data for edit
  useEffect(() => {
    if (isEdit && invoice) {
      // Safely parse dates to avoid Invalid time value error
      const saleDate = parseDate(invoice.saleDate) || new Date();
      const scheduledDeliveryDate = parseDate(invoice.scheduledDeliveryDate);
      const emiStartDate = parseDate(invoice.emiDetails?.startDate);

      setFormData({
        saleDate,
        customerId: invoice.customerId || "",
        customerName: invoice.customerName || "",
        customerPhone: invoice.customerPhone || "",
        customerAddress: invoice.customerAddress || "",
        customerState: invoice.customerState || "",
        salesPersonId: invoice.salesPersonId || "",
        salesPersonName: invoice.salesPersonName || "",
        items: invoice.items || [
          { name: "", description: "", quantity: 1, rate: 0, gstSlab: 18 },
        ],
        includeGST: invoice.includeGST !== false,
        paymentStatus: invoice.paymentStatus || PAYMENT_STATUS.PAID,
        deliveryStatus: invoice.deliveryStatus || DELIVERY_STATUS.DELIVERED,
        scheduledDeliveryDate,
        emiDetails: {
          monthlyAmount: invoice.emiDetails?.monthlyAmount || 0,
          startDate: emiStartDate,
          numberOfInstallments: invoice.emiDetails?.numberOfInstallments || 1,
        },
      });

      // Set up autocomplete selections for edit mode
      if (invoice.customerId && invoice.customerName) {
        setSelectedCustomer({
          id: invoice.customerId,
          name: invoice.customerName,
          phone: invoice.customerPhone,
          address: invoice.customerAddress,
          state: invoice.customerState,
          label: `${invoice.customerName} - ${invoice.customerPhone}`,
        });
      }

      if (invoice.salesPersonId && invoice.salesPersonName) {
        setSelectedEmployee({
          id: invoice.salesPersonId,
          name: invoice.salesPersonName,
          label: invoice.salesPersonName,
        });
      }
    }
  }, [isEdit, invoice]);

  // Calculate totals when items or GST settings change
  useEffect(() => {
    const calculateTotals = () => {
      let subtotal = 0;
      let totalGST = 0;
      const itemTotals = [];

      formData.items.forEach((item, index) => {
        if (item.quantity && item.rate) {
          const itemTotal = parseFloat(item.quantity) * parseFloat(item.rate);
          const gstCalc = calculateGSTWithSlab(
            itemTotal,
            formData.customerState,
            formData.includeGST,
            item.gstSlab || 18
          );

          subtotal += gstCalc.baseAmount;
          totalGST += gstCalc.totalGstAmount;

          itemTotals[index] = {
            baseAmount: gstCalc.baseAmount,
            gstAmount: gstCalc.totalGstAmount,
            totalAmount: gstCalc.totalAmount,
            gstSlab: item.gstSlab || 18,
          };
        } else {
          itemTotals[index] = {
            baseAmount: 0,
            gstAmount: 0,
            totalAmount: 0,
            gstSlab: item.gstSlab || 18,
          };
        }
      });

      setCalculations({
        subtotal: Math.round(subtotal * 100) / 100,
        totalGST: Math.round(totalGST * 100) / 100,
        grandTotal: Math.round((subtotal + totalGST) * 100) / 100,
        itemTotals,
      });
    };

    calculateTotals();
  }, [formData.items, formData.customerState, formData.includeGST]);

  // Auto-calculate EMI installments when relevant values change
  useEffect(() => {
    if (formData.paymentStatus === PAYMENT_STATUS.EMI && 
        formData.emiDetails.monthlyAmount > 0 && 
        calculations.grandTotal > 0) {
      
      const monthlyAmount = parseFloat(formData.emiDetails.monthlyAmount);
      const calculatedInstallments = Math.ceil(calculations.grandTotal / monthlyAmount);
      
      console.log('EMI Auto-Calculation:');
      console.log('- Grand Total:', calculations.grandTotal);
      console.log('- Monthly Amount:', monthlyAmount);
      console.log('- Calculated Installments:', calculatedInstallments);
      console.log('- Current Installments:', formData.emiDetails.numberOfInstallments);
      
      // Only update if the calculated value is different from current value
      if (calculatedInstallments !== formData.emiDetails.numberOfInstallments) {
        console.log('Updating EMI installments from', formData.emiDetails.numberOfInstallments, 'to', calculatedInstallments);
        setFormData((prev) => ({
          ...prev,
          emiDetails: {
            ...prev.emiDetails,
            numberOfInstallments: calculatedInstallments
          }
        }));
      }
    }
  }, [calculations.grandTotal, formData.paymentStatus, formData.emiDetails.monthlyAmount]);

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
      console.error("Error fetching customer suggestions:", error);
    } finally {
      setCustomerLoading(false);
    }
  };

  // Handle customer selection
  const handleCustomerSelect = (customer) => {
    setSelectedCustomer(customer);
    if (customer) {
      setFormData((prev) => ({
        ...prev,
        customerId: customer.id,
        customerName: customer.name,
        customerPhone: customer.phone,
        customerAddress: customer.address,
        customerState: customer.state || "",
      }));
    } else {
      // Clear customer data when selection is cleared
      setFormData((prev) => ({
        ...prev,
        customerId: "",
        customerName: "",
        customerPhone: "",
        customerAddress: "",
        customerState: "",
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
      console.error("Error fetching employee suggestions:", error);
    } finally {
      setEmployeeLoading(false);
    }
  };

  // Handle employee selection
  const handleEmployeeSelect = (employee) => {
    setSelectedEmployee(employee);
    if (employee) {
      setFormData((prev) => ({
        ...prev,
        salesPersonId: employee.id,
        salesPersonName: employee.name,
      }));
    } else {
      // Clear employee data when selection is cleared
      setFormData((prev) => ({
        ...prev,
        salesPersonId: "",
        salesPersonName: "",
      }));
    }
  };

  // Handle item changes
  const handleItemChange = (index, field, value) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      ),
    }));
  };

  // Add new item row
  const addItemRow = () => {
    setFormData((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        { name: "", description: "", quantity: 1, rate: 0, gstSlab: 18 },
      ],
    }));
  };

  // Remove item row
  const removeItemRow = (index) => {
    if (formData.items.length > 1) {
      setFormData((prev) => ({
        ...prev,
        items: prev.items.filter((_, i) => i !== index),
      }));
    }
  };

  // Handle form field changes
  const handleChange = (field) => (event) => {
    const value =
      event.target.type === "checkbox"
        ? event.target.checked
        : event.target.value;
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Handle payment status change with EMI calculation
  const handlePaymentStatusChange = (event) => {
    const newStatus = event.target.value;
    setFormData((prev) => {
      const updatedData = {
        ...prev,
        paymentStatus: newStatus,
      };

      // If switching to EMI and we have values, calculate installments immediately
      if (newStatus === PAYMENT_STATUS.EMI && 
          prev.emiDetails.monthlyAmount > 0 && 
          calculations.grandTotal > 0) {
        const numberOfInstallments = Math.ceil(calculations.grandTotal / parseFloat(prev.emiDetails.monthlyAmount));
        updatedData.emiDetails = {
          ...prev.emiDetails,
          numberOfInstallments
        };
        console.log('Payment Status Change - Calculating EMI installments:', numberOfInstallments);
      }

      return updatedData;
    });
  };

  // Handle date changes
  const handleDateChange = (field) => (date) => {
    setFormData((prev) => ({
      ...prev,
      [field]: date,
    }));
  };

  // Handle EMI details change with immediate calculation
  const handleEMIChange = (field) => (event) => {
    const value = event.target.value;
    setFormData((prev) => {
      const updatedEmiDetails = {
        ...prev.emiDetails,
        [field]: value,
      };

      // Auto-calculate numberOfInstallments when monthlyAmount changes
      if (field === 'monthlyAmount' && value > 0 && calculations.grandTotal > 0) {
        const numberOfInstallments = Math.ceil(calculations.grandTotal / parseFloat(value));
        updatedEmiDetails.numberOfInstallments = numberOfInstallments;
        console.log('EMI Monthly Amount Change - Calculating installments:', numberOfInstallments);
      }

      return {
        ...prev,
        emiDetails: updatedEmiDetails,
      };
    });
  };

  // Validate form
  const validateForm = () => {
    const errors = {};

    if (!formData.customerId || !formData.customerName) {
      errors.customer = "Customer is required";
    }

    if (!formData.salesPersonId || !formData.salesPersonName) {
      errors.salesPerson = "Sales person is required";
    }

    if (formData.items.length === 0) {
      errors.items = "At least one item is required";
    }

    formData.items.forEach((item, index) => {
      if (!item.name) {
        errors[`item_${index}_name`] = "Item name is required";
      }
      if (!item.quantity || parseFloat(item.quantity) <= 0) {
        errors[`item_${index}_quantity`] = "Valid quantity is required";
      }
      if (!item.rate || parseFloat(item.rate) <= 0) {
        errors[`item_${index}_rate`] = "Valid rate is required";
      }
    });

    if (formData.paymentStatus === PAYMENT_STATUS.EMI) {
      if (
        !formData.emiDetails.monthlyAmount ||
        parseFloat(formData.emiDetails.monthlyAmount) <= 0
      ) {
        errors.emiAmount = "EMI monthly amount is required";
      }

      if (
        !formData.emiDetails.startDate ||
        formData.emiDetails.startDate === null
      ) {
        errors.emiStartDate = "EMI start date is required";
      }
    }

    if (
      formData.deliveryStatus === DELIVERY_STATUS.SCHEDULED &&
      !formData.scheduledDeliveryDate
    ) {
      errors.deliveryDate = "Scheduled delivery date is required";
    }

    console.log("Validation errors:", errors);
    return errors;
  };

  const handleEMIStartDateChange = (date) => {
    setFormData((prev) => ({
      ...prev,
      emiDetails: {
        ...prev.emiDetails,
        startDate: date,
      },
    }));
  };

  // Generate EMI schedule with proper installment calculation
  const generateEMISchedule = () => {
    if (
      formData.paymentStatus !== PAYMENT_STATUS.EMI ||
      !formData.emiDetails.monthlyAmount ||
      !formData.emiDetails.startDate ||
      !formData.emiDetails.numberOfInstallments
    ) {
      return [];
    }

    const monthlyAmount = parseFloat(formData.emiDetails.monthlyAmount);
    const startDate = new Date(formData.emiDetails.startDate);
    const totalAmount = calculations.grandTotal;
    const numberOfInstallments = parseInt(formData.emiDetails.numberOfInstallments);

    console.log('Generating EMI Schedule:');
    console.log('- Monthly Amount:', monthlyAmount);
    console.log('- Number of Installments:', numberOfInstallments);
    console.log('- Total Amount:', totalAmount);

    const schedule = [];
    for (let i = 0; i < numberOfInstallments; i++) {
      const dueDate = new Date(startDate);
      dueDate.setMonth(dueDate.getMonth() + i);

      const isLastInstallment = i === numberOfInstallments - 1;
      const amount = isLastInstallment
        ? totalAmount - monthlyAmount * (numberOfInstallments - 1)
        : monthlyAmount;

      schedule.push({
        installmentNumber: i + 1,
        dueDate: dueDate.toISOString(),
        amount: Math.round(amount * 100) / 100,
        paid: false,
      });
    }

    console.log('Generated EMI Schedule:', schedule);
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
      emiDetails:
        formData.paymentStatus === PAYMENT_STATUS.EMI
          ? {
              ...formData.emiDetails,
              startDate: formData.emiDetails.startDate?.toISOString(),
              schedule: generateEMISchedule(),
            }
          : null,
    };

    console.log('Submitting Invoice Data:', invoiceData);
    console.log('EMI Details in submission:', invoiceData.emiDetails);

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
              <Typography
                variant="h6"
                gutterBottom
                sx={{ display: "flex", alignItems: "center", gap: 1 }}
              >
                <ReceiptIcon />
                Invoice Details
              </Typography>

              <Grid container spacing={3}>
                {/* Sale Date */}
                <Grid item xs={12} sm={6}>
                  <DatePicker
                    label="Sale Date"
                    value={formData.saleDate}
                    onChange={handleDateChange("saleDate")}
                    disabled={loading}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        required: true,
                      },
                    }}
                  />
                </Grid>

                {/* GST Toggle */}
                <Grid item xs={12} sm={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.includeGST}
                        onChange={handleChange("includeGST")}
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
                    getOptionLabel={(option) => option.label || ""}
                    loading={customerLoading}
                    value={selectedCustomer}
                    isOptionEqualToValue={(option, value) => 
                      option.id === value.id
                    }
                    onInputChange={(event, value) =>
                      handleCustomerSearch(value)
                    }
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
                getOptionLabel={(option) => option.label || ""}
                loading={employeeLoading}
                value={selectedEmployee}
                isOptionEqualToValue={(option, value) => 
                  option.id === value.id
                }
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
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                mb={3}
              >
                <Typography variant="h6">Items</Typography>
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
                      <TableCell sx={{ width: '30%', minWidth: 200 }}>Item Name *</TableCell>
                      <TableCell sx={{ width: '25%', minWidth: 150 }}>Description</TableCell>
                      <TableCell sx={{ width: '10%', minWidth: 80 }}>Qty *</TableCell>
                      <TableCell sx={{ width: '15%', minWidth: 100 }}>Rate *</TableCell>
                      {formData.includeGST && <TableCell sx={{ width: '10%', minWidth: 80 }}>GST %</TableCell>}
                      <TableCell sx={{ width: '15%', minWidth: 100 }}>Total</TableCell>
                      <TableCell sx={{ width: '5%', minWidth: 50 }}></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {formData.items.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <TextField
                            fullWidth
                            size="medium"
                            placeholder="Enter item name..."
                            value={item.name}
                            onChange={(e) =>
                              handleItemChange(index, "name", e.target.value)
                            }
                            error={!!formErrors[`item_${index}_name`]}
                            disabled={loading}
                            sx={{
                              '& .MuiInputBase-root': {
                                fontSize: '0.875rem',
                              }
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            fullWidth
                            size="medium"
                            placeholder="Item description..."
                            value={item.description}
                            onChange={(e) =>
                              handleItemChange(
                                index,
                                "description",
                                e.target.value
                              )
                            }
                            disabled={loading}
                            multiline
                            maxRows={2}
                            sx={{
                              '& .MuiInputBase-root': {
                                fontSize: '0.875rem',
                              }
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            fullWidth
                            size="medium"
                            type="number"
                            placeholder="Qty"
                            value={item.quantity}
                            onChange={(e) =>
                              handleItemChange(
                                index,
                                "quantity",
                                e.target.value
                              )
                            }
                            error={!!formErrors[`item_${index}_quantity`]}
                            disabled={loading}
                            inputProps={{ min: 1 }}
                            sx={{
                              '& .MuiInputBase-root': {
                                fontSize: '0.875rem',
                              }
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            fullWidth
                            size="medium"
                            type="number"
                            placeholder="Rate"
                            value={item.rate}
                            onChange={(e) =>
                              handleItemChange(index, "rate", e.target.value)
                            }
                            error={!!formErrors[`item_${index}_rate`]}
                            disabled={loading}
                            inputProps={{ min: 0, step: 0.01 }}
                            sx={{
                              '& .MuiInputBase-root': {
                                fontSize: '0.875rem',
                              }
                            }}
                          />
                        </TableCell>
                        {formData.includeGST && (
                          <TableCell>
                            <TextField
                              fullWidth
                              size="medium"
                              select
                              value={item.gstSlab || 18}
                              onChange={(e) =>
                                handleItemChange(
                                  index,
                                  "gstSlab",
                                  parseFloat(e.target.value)
                                )
                              }
                              disabled={loading}
                              sx={{
                                '& .MuiInputBase-root': {
                                  fontSize: '0.875rem',
                                }
                              }}
                            >
                              {GST_TAX_SLABS.map((slab) => (
                                <MenuItem key={slab.rate} value={slab.rate}>
                                  {slab.rate}%
                                </MenuItem>
                              ))}
                            </TextField>
                          </TableCell>
                        )}
                        <TableCell>
                          <Typography variant="body2" fontWeight={600} color="primary.main">
                            ₹
                            {calculations.itemTotals[
                              index
                            ]?.totalAmount?.toFixed(2) || "0.00"}
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
              <Typography
                variant="h6"
                gutterBottom
                sx={{ display: "flex", alignItems: "center", gap: 1 }}
              >
                <CalculateIcon />
                Summary
              </Typography>

              <Box>
                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography variant="body2">Subtotal:</Typography>
                  <Typography variant="body2">
                    ₹{calculations.subtotal.toFixed(2)}
                  </Typography>
                </Box>

                {formData.includeGST && (
                  <Box display="flex" justifyContent="space-between" mb={1}>
                    <Typography variant="body2">
                      GST (
                      {formData.customerState?.toLowerCase() === "gujarat"
                        ? "CGST+SGST"
                        : "IGST"}
                      ):
                    </Typography>
                    <Typography variant="body2">
                      ₹{calculations.totalGST.toFixed(2)}
                    </Typography>
                  </Box>
                )}

                <Divider sx={{ my: 1 }} />

                <Box display="flex" justifyContent="space-between">
                  <Typography variant="h6" fontWeight="bold">
                    Grand Total:
                  </Typography>
                  <Typography
                    variant="h6"
                    fontWeight="bold"
                    color="primary.main"
                  >
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
                  onChange={handlePaymentStatusChange}
                  disabled={loading}
                >
                  <MenuItem value={PAYMENT_STATUS.PAID}>Paid in Full</MenuItem>
                  <MenuItem value={PAYMENT_STATUS.EMI}>EMI Payment</MenuItem>
                  <MenuItem value={PAYMENT_STATUS.PENDING}>
                    Payment Pending
                  </MenuItem>
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
                    onChange={handleEMIChange("monthlyAmount")}
                    error={!!formErrors.emiAmount}
                    helperText={formErrors.emiAmount}
                    disabled={loading}
                    sx={{ mb: 2 }}
                    inputProps={{ min: 1, step: 0.01 }}
                  />

                  <DatePicker
                    label="EMI Start Date"
                    value={formData.emiDetails.startDate}
                    onChange={handleEMIStartDateChange}
                    disabled={loading}
                    sx={{ mb: 2 }}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        error: !!formErrors.emiStartDate,
                        helperText: formErrors.emiStartDate,
                      },
                    }}
                  />

                  {/* Display calculated EMI details */}
                  {formData.emiDetails.monthlyAmount > 0 && calculations.grandTotal > 0 && (
                    <Box sx={{ 
                      mt: 2, 
                      p: 2, 
                      backgroundColor: 'rgba(25, 118, 210, 0.1)', 
                      borderRadius: 1,
                      border: '1px solid rgba(25, 118, 210, 0.2)'
                    }}>
                      <Typography variant="subtitle2" color="primary" gutterBottom>
                        EMI Calculation Summary:
                      </Typography>
                      <Typography variant="body2" sx={{ mb: 1 }}>
                        <strong>Invoice Total:</strong> ₹{calculations.grandTotal.toFixed(2)}
                      </Typography>
                      <Typography variant="body2" sx={{ mb: 1 }}>
                        <strong>Monthly EMI:</strong> ₹{parseFloat(formData.emiDetails.monthlyAmount).toFixed(2)}
                      </Typography>
                      <Typography variant="body2" sx={{ mb: 1 }}>
                        <strong>Number of Installments:</strong> {formData.emiDetails.numberOfInstallments} months
                      </Typography>
                      
                      {/* Calculate correct EMI breakdown */}
                      {(() => {
                        const monthlyAmount = parseFloat(formData.emiDetails.monthlyAmount);
                        const numberOfInstallments = formData.emiDetails.numberOfInstallments;
                        const totalAmount = calculations.grandTotal;
                        
                        if (numberOfInstallments > 1) {
                          const regularInstallments = numberOfInstallments - 1;
                          const regularInstallmentTotal = monthlyAmount * regularInstallments;
                          const lastInstallmentAmount = totalAmount - regularInstallmentTotal;
                          
                          return (
                            <>
                              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                                • First {regularInstallments} installments: ₹{monthlyAmount.toFixed(2)} each = ₹{regularInstallmentTotal.toFixed(2)}
                              </Typography>
                              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                                • Last installment: ₹{lastInstallmentAmount.toFixed(2)}
                              </Typography>
                            </>
                          );
                        }
                        return null;
                      })()}
                      
                      <Typography variant="body2" color="success.main" fontWeight={600}>
                        <strong>Total EMI Amount:</strong> ₹{calculations.grandTotal.toFixed(2)}
                      </Typography>
                      
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1, fontStyle: 'italic' }}>
                        Note: Last installment amount is adjusted to match invoice total
                      </Typography>
                    </Box>
                  )}
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
                  onChange={handleChange("deliveryStatus")}
                  disabled={loading}
                >
                  <MenuItem value={DELIVERY_STATUS.DELIVERED}>
                    Delivered
                  </MenuItem>
                  <MenuItem value={DELIVERY_STATUS.SCHEDULED}>
                    Schedule Later
                  </MenuItem>
                  <MenuItem value={DELIVERY_STATUS.PENDING}>Pending</MenuItem>
                </TextField>
              </FormControl>

              {/* Scheduled Delivery Date */}
              {formData.deliveryStatus === DELIVERY_STATUS.SCHEDULED && (
                <DatePicker
                  label="Scheduled Delivery Date"
                  value={formData.scheduledDeliveryDate}
                  onChange={handleDateChange("scheduledDeliveryDate")}
                  disabled={loading}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      error: !!formErrors.deliveryDate,
                      helperText: formErrors.deliveryDate,
                    },
                  }}
                />
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
                  startIcon={
                    loading ? (
                      <CircularProgress size={20} color="inherit" />
                    ) : (
                      <SaveIcon />
                    )
                  }
                >
                  {isEdit ? "Update Invoice" : "Create Invoice"}
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