import React, { useState, useEffect } from "react";
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  TextField,
  Button,
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
  Chip,
  Tooltip,
} from "@mui/material";
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Receipt as ReceiptIcon,
  Calculate as CalculateIcon,
  Business as BusinessIcon,
  Info as InfoIcon,
} from "@mui/icons-material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";

import { useCustomer } from "../../../contexts/CustomerContext/CustomerContext";
import { calculateItemWithGST } from "../../../utils/helpers/gstCalculator";
import { 
  getAllCompanies,  // CHANGED: Use getAllCompanies instead of getCompaniesByCategory
  getDefaultTermsConditions 
} from "../../../utils/constants/companyConstants";

// Import the ItemModal component from sales
import ItemModal from "../../sales/InvoiceForm/ItemModal";

// Helper function to safely parse dates
const parseDate = (dateValue) => {
  if (!dateValue) return null;
  const date = new Date(dateValue);
  return isNaN(date.getTime()) ? null : date;
};

/**
 * QuotationForm component for creating and editing quotations
 * UPDATED: Removed sales person selection, shows all companies
 */
const QuotationForm = ({
  quotation = null,
  isEdit = false,
  onSubmit,
  onCancel,
  loading = false,
  error = null,
  userType = "electronics", // Still used for default terms
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const { getCustomerSuggestions } = useCustomer();

  // Form state - REMOVED sales person fields
  const [formData, setFormData] = useState({
    quotationDate: new Date(),
    validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    company: null,
    customerId: "",
    customerName: "",
    customerPhone: "",
    customerAddress: "",
    customerState: "",
    customerGSTNumber: "",
    // REMOVED: salesPersonId, salesPersonName
    items: [],
    includeGST: true,
    termsAndConditions: "",
    remarks: "",
  });

  const [formErrors, setFormErrors] = useState({});
  const [customerOptions, setCustomerOptions] = useState([]);
  const [customerLoading, setCustomerLoading] = useState(false);
  // REMOVED: employeeOptions, employeeLoading
  const [calculations, setCalculations] = useState({
    subtotal: 0,
    totalGST: 0,
    grandTotal: 0,
    itemTotals: [],
  });

  // Item modal state
  const [itemModalOpen, setItemModalOpen] = useState(false);
  const [editingItemIndex, setEditingItemIndex] = useState(null);

  // Store selected customer - REMOVED selectedEmployee
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  // CHANGED: Get all companies regardless of user type
  const availableCompanies = getAllCompanies();

  // Initialize form data for edit
  useEffect(() => {
    if (isEdit && quotation) {
      const quotationDate = parseDate(quotation.quotationDate) || new Date();
      const validUntil = parseDate(quotation.validUntil);

      setFormData({
        quotationDate,
        validUntil,
        company: quotation.company || null,
        customerId: quotation.customerId || "",
        customerName: quotation.customerName || "",
        customerPhone: quotation.customerPhone || "",
        customerAddress: quotation.customerAddress || "",
        customerState: quotation.customerState || "",
        customerGSTNumber: quotation.customerGSTNumber || "",
        // REMOVED: salesPersonId, salesPersonName
        items: (quotation.items || []).map((item) => ({
          name: item.name || "",
          description: item.description || "",
          quantity: item.quantity || 1,
          rate: item.rate || 0,
          gstSlab: item.gstSlab || 18,
          isPriceInclusive: item.isPriceInclusive || false,
          hsnCode: item.hsnCode || "",
        })),
        includeGST: quotation.includeGST !== false,
        termsAndConditions: quotation.termsAndConditions || "",
        remarks: quotation.remarks || "",
      });

      // Set up autocomplete selections for edit mode
      if (quotation.customerId && quotation.customerName) {
        setSelectedCustomer({
          id: quotation.customerId,
          name: quotation.customerName,
          phone: quotation.customerPhone,
          address: quotation.customerAddress,
          state: quotation.customerState,
          label: `${quotation.customerName} - ${quotation.customerPhone}`,
        });
      }

      // REMOVED: selectedEmployee setup
    } else {
      // Set default terms and conditions for new quotations
      const defaultTerms = getDefaultTermsConditions(userType).join('\n');
      setFormData(prev => ({
        ...prev,
        termsAndConditions: defaultTerms
      }));
    }
  }, [isEdit, quotation, userType]);

  // Calculate totals when items or other relevant fields change
  useEffect(() => {
    const calculateTotals = () => {
      let subtotal = 0;
      let totalGST = 0;
      const itemTotals = [];

      formData.items.forEach((item, index) => {
        if (item.quantity && item.rate) {
          const itemCalc = calculateItemWithGST(
            item,
            formData.customerState,
            formData.includeGST
          );

          subtotal += itemCalc.baseAmount;
          totalGST += itemCalc.gstAmount;

          itemTotals[index] = {
            baseAmount: itemCalc.baseAmount,
            gstAmount: itemCalc.gstAmount,
            totalAmount: itemCalc.totalAmount,
            gstSlab: itemCalc.gstSlab,
            isPriceInclusive: itemCalc.isPriceInclusive,
            gstBreakdown: itemCalc.gstBreakdown,
          };
        } else {
          itemTotals[index] = {
            baseAmount: 0,
            gstAmount: 0,
            totalAmount: 0,
            gstSlab: item.gstSlab || 18,
            isPriceInclusive: item.isPriceInclusive || false,
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

  // Customer search and selection handlers
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
        customerGSTNumber: customer.gstNumber || "",
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        customerId: "",
        customerName: "",
        customerPhone: "",
        customerAddress: "",
        customerState: "",
        customerGSTNumber: "",
      }));
    }
  };

  // REMOVED: Employee search and selection handlers

  // Company selection handler
  const handleCompanySelect = (company) => {
    setFormData((prev) => ({
      ...prev,
      company: company,
    }));
  };

  // Item management handlers
  const handleAddItem = () => {
    setEditingItemIndex(null);
    setItemModalOpen(true);
  };

  const handleEditItem = (index) => {
    setEditingItemIndex(index);
    setItemModalOpen(true);
  };

  const handleItemModalClose = () => {
    setItemModalOpen(false);
    setEditingItemIndex(null);
  };

  const handleItemSave = (itemData) => {
    setFormData((prev) => {
      const newItems = [...prev.items];

      if (editingItemIndex !== null) {
        newItems[editingItemIndex] = {
          name: itemData.name,
          description: itemData.description,
          quantity: itemData.quantity,
          rate: itemData.rate,
          gstSlab: itemData.gstSlab,
          isPriceInclusive: itemData.isPriceInclusive,
          hsnCode: itemData.hsnCode || "",
        };
      } else {
        newItems.push({
          name: itemData.name,
          description: itemData.description,
          quantity: itemData.quantity,
          rate: itemData.rate,
          gstSlab: itemData.gstSlab,
          isPriceInclusive: itemData.isPriceInclusive,
          hsnCode: itemData.hsnCode || "",
        });
      }

      return {
        ...prev,
        items: newItems,
      };
    });

    handleItemModalClose();
  };

  const handleRemoveItem = (index) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  // Form field change handlers
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

  const handleDateChange = (field) => (date) => {
    setFormData((prev) => ({
      ...prev,
      [field]: date,
    }));
  };

  // Form validation - REMOVED sales person validation
  const validateForm = () => {
    const errors = {};

    if (!formData.company) {
      errors.company = "Company selection is required";
    }

    if (!formData.customerId || !formData.customerName) {
      errors.customer = "Customer is required";
    }

    // REMOVED: Sales person validation

    if (formData.items.length === 0) {
      errors.items = "At least one item is required";
    }

    if (!formData.validUntil) {
      errors.validUntil = "Valid until date is required";
    }

    formData.items.forEach((item, index) => {
      if (!item.name) {
        errors[`item_${index}_name`] = "Item name is required";
      }
      if (!item.quantity || parseFloat(item.quantity) <= 0) {
        errors[`item_${index}_quantity`] = "Valid quantity is required";
      }
      if (parseFloat(item.rate) < 0) {
        errors[`item_${index}_rate`] = "Rate cannot be negative";
      }
    });

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

    const quotationData = {
      ...formData,
      quotationDate: formData.quotationDate.toISOString(),
      validUntil: formData.validUntil?.toISOString(),
    };

    if (onSubmit) {
      await onSubmit(quotationData);
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
          {/* Basic Details */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography
                variant="h6"
                gutterBottom
                sx={{ display: "flex", alignItems: "center", gap: 1 }}
              >
                <ReceiptIcon />
                Quotation Details
              </Typography>

              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <DatePicker
                    label="Quotation Date"
                    value={formData.quotationDate}
                    format="dd/MM/yyyy"
                    onChange={handleDateChange("quotationDate")}
                    disabled={loading}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        required: true,
                      },
                    }}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <DatePicker
                    label="Valid Until"
                    value={formData.validUntil}
                    onChange={handleDateChange("validUntil")}
                    format="dd/MM/yyyy"
                    disabled={loading}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        required: true,
                        error: !!formErrors.validUntil,
                        helperText: formErrors.validUntil,
                      },
                    }}
                  />
                </Grid>

                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.includeGST}
                        onChange={handleChange("includeGST")}
                        disabled={loading}
                      />
                    }
                    label="Include GST"
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Company Selection */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography
                variant="h6"
                gutterBottom
                sx={{ display: "flex", alignItems: "center", gap: 1 }}
              >
                <BusinessIcon />
                Company Information
              </Typography>

              {formErrors.company && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {formErrors.company}
                </Alert>
              )}

              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Autocomplete
                    options={availableCompanies}
                    getOptionLabel={(option) => option.name || ""}
                    value={formData.company}
                    onChange={(event, value) => handleCompanySelect(value)}
                    disabled={loading}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Select Company"
                        required
                        helperText="Choose the company to show on the quotation (All companies available)"
                      />
                    )}
                    renderOption={(props, option) => (
                      <Box component="li" {...props}>
                        <Box>
                          <Typography variant="body1" fontWeight={600}>
                            {option.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {option.category} | {option.address} | GST: {option.gstNumber}
                          </Typography>
                        </Box>
                      </Box>
                    )}
                  />
                </Grid>

                {formData.company && (
                  <Grid item xs={12}>
                    <Box
                      sx={{
                        p: 2,
                        backgroundColor: "rgba(25, 118, 210, 0.1)",
                        borderRadius: 1,
                        border: "1px solid rgba(25, 118, 210, 0.2)",
                      }}
                    >
                      <Typography variant="subtitle2" color="primary" gutterBottom>
                        Selected Company Details:
                      </Typography>
                      <Typography variant="body2">
                        <strong>{formData.company.name}</strong> ({formData.company.category})
                      </Typography>
                      <Typography variant="body2">
                        {formData.company.address}, {formData.company.city}, {formData.company.state} - {formData.company.pincode}
                      </Typography>
                      <Typography variant="body2">
                        Phone: {formData.company.phone} | Email: {formData.company.email}
                      </Typography>
                      <Typography variant="body2">
                        GST: {formData.company.gstNumber}
                      </Typography>
                      {formData.company.website && (
                        <Typography variant="body2">
                          Website: {formData.company.website}
                        </Typography>
                      )}
                    </Box>
                  </Grid>
                )}
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

          {/* REMOVED: Sales Person Card */}

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
                  onClick={handleAddItem}
                  disabled={loading}
                  variant="contained"
                  size={isMobile ? "small" : "medium"}
                >
                  Add Item
                </Button>
              </Box>

              {formErrors.items && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {formErrors.items}
                </Alert>
              )}

              {formData.items.length > 0 ? (
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Item</TableCell>
                        <TableCell align="center">HSN</TableCell>
                        <TableCell align="center">Qty</TableCell>
                        <TableCell align="right">Rate</TableCell>
                        {formData.includeGST && (
                          <TableCell align="center">GST</TableCell>
                        )}
                        <TableCell align="right">Total</TableCell>
                        <TableCell align="center" width={80}>
                          Actions
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {formData.items.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            <Box>
                              <Typography variant="body2" fontWeight={600}>
                                {item.name || "Unnamed Item"}
                              </Typography>
                              {item.description && (
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                >
                                  {item.description}
                                </Typography>
                              )}
                            </Box>
                          </TableCell>
                          <TableCell align="center">
                            <Typography variant="body2" fontFamily="monospace">
                              {item.hsnCode || "-"}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Typography variant="body2">
                              {item.quantity}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2">
                              {parseFloat(item.rate) === 0 ? (
                                <Chip
                                  size="small"
                                  label="TBD"
                                  color="warning"
                                  variant="outlined"
                                />
                              ) : (
                                `₹${parseFloat(item.rate).toFixed(2)}`
                              )}
                            </Typography>
                          </TableCell>
                          {formData.includeGST && (
                            <TableCell align="center">
                              <Typography variant="body2">
                                {item.gstSlab}%
                              </Typography>
                            </TableCell>
                          )}
                          <TableCell align="right">
                            <Typography
                              variant="body2"
                              fontWeight={600}
                              color="primary.main"
                            >
                              ₹{
                                calculations.itemTotals[
                                  index
                                ]?.totalAmount?.toFixed(2) || "0.00"
                              }
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Box display="flex" gap={0.5}>
                              <Tooltip title="Edit item">
                                <IconButton
                                  size="small"
                                  onClick={() => handleEditItem(index)}
                                  disabled={loading}
                                >
                                  <EditIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Delete item">
                                <IconButton
                                  size="small"
                                  onClick={() => handleRemoveItem(index)}
                                  disabled={loading}
                                  color="error"
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Alert severity="info" icon={<InfoIcon />}>
                  No items added yet. Click "Add Item" to get started.
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Terms and Conditions */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Terms & Conditions
              </Typography>

              <TextField
                fullWidth
                label="Terms and Conditions"
                placeholder="Enter terms and conditions..."
                value={formData.termsAndConditions}
                onChange={handleChange("termsAndConditions")}
                disabled={loading}
                multiline
                rows={6}
                helperText="Add terms and conditions for this quotation"
              />
            </CardContent>
          </Card>

          {/* Remarks Section */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Additional Information
              </Typography>

              <TextField
                fullWidth
                label="Remarks"
                placeholder="Add any additional notes or remarks..."
                value={formData.remarks}
                onChange={handleChange("remarks")}
                disabled={loading}
                multiline
                rows={3}
                helperText="Optional: Add any special notes or instructions"
              />
            </CardContent>
          </Card>
        </Grid>

        {/* Right Column - Summary and Actions */}
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
                  {isEdit ? "Update Quotation" : "Create Quotation"}
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

      {/* Item Modal */}
      <ItemModal
        open={itemModalOpen}
        onClose={handleItemModalClose}
        onSave={handleItemSave}
        item={
          editingItemIndex !== null ? formData.items[editingItemIndex] : null
        }
        customerState={formData.customerState}
        includeGST={formData.includeGST}
        loading={loading}
      />
    </Box>
  );
};

export default QuotationForm;