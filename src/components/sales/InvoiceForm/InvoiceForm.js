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
  Chip,
  InputAdornment,
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
  Payment as PaymentIcon,
  AccountBalance as BankIcon,
  AttachMoney as MoneyIcon,
  CreditCard as CreditCardIcon,
  Info as InfoIcon,
} from "@mui/icons-material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";

import { useCustomer } from "../../../contexts/CustomerContext/CustomerContext";
import { useEmployee } from "../../../contexts/EmployeeContext/EmployeeContext";
import { calculateItemWithGST } from "../../../utils/helpers/gstCalculator";
import {
  PAYMENT_STATUS,
  PAYMENT_STATUS_DISPLAY,
  PAYMENT_METHODS,
  PAYMENT_METHOD_DISPLAY,
  DELIVERY_STATUS,
  getPaymentCategory,
} from "../../../utils/constants/appConstants";

// Import the new ItemModal component
import ItemModal from "./ItemModal";

// Helper function to safely parse dates
const parseDate = (dateValue) => {
  if (!dateValue) return null;
  const date = new Date(dateValue);
  return isNaN(date.getTime()) ? null : date;
};

// GST Tax Slabs
const GST_TAX_SLABS = [
  { rate: 0, description: "Nil rated" },
  { rate: 5, description: "Essential goods" },
  { rate: 12, description: "Standard goods" },
  { rate: 18, description: "Most goods and services" },
  { rate: 28, description: "Luxury and sin goods" },
];

/**
 * Enhanced InvoiceForm component with ItemModal for mobile-friendly item management
 * Clean, modular implementation
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

  const [showBulkPricing, setShowBulkPricing] = useState(false);
  const [bulkPricing, setBulkPricing] = useState({
    totalPrice: 0,
    gstSlab: 18,
    isPriceInclusive: false,
  });
  const [bulkPricingApplied, setBulkPricingApplied] = useState(false);

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
    items: [],
    includeGST: true,
    paymentStatus: PAYMENT_STATUS.PAID,
    deliveryStatus: DELIVERY_STATUS.DELIVERED,
    scheduledDeliveryDate: null,
    remarks: "",
    paymentDetails: {
      downPayment: 0,
      remainingBalance: 0,
      paymentMethod: PAYMENT_METHODS.CASH,
      bankName: "",
      financeCompany: "",
      paymentReference: "",
    },
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

  // Item modal state
  const [itemModalOpen, setItemModalOpen] = useState(false);
  const [editingItemIndex, setEditingItemIndex] = useState(null);

  // Store selected customer and employee for autocomplete
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  // Initialize form data for edit
  useEffect(() => {
    if (isEdit && invoice) {
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
        items: (invoice.items || []).map((item) => ({
          name: item.name || "",
          description: item.description || "",
          quantity: item.quantity || 1,
          rate: item.rate || 0,
          gstSlab: item.gstSlab || 18,
          isPriceInclusive: item.isPriceInclusive || false,
        })),
        includeGST: invoice.includeGST !== false,
        paymentStatus: invoice.paymentStatus || PAYMENT_STATUS.PAID,
        deliveryStatus: invoice.deliveryStatus || DELIVERY_STATUS.DELIVERED,
        scheduledDeliveryDate,
        remarks: invoice.remarks || "",
        paymentDetails: {
          downPayment: invoice.paymentDetails?.downPayment || 0,
          remainingBalance: invoice.paymentDetails?.remainingBalance || 0,
          paymentMethod:
            invoice.paymentDetails?.paymentMethod || PAYMENT_METHODS.CASH,
          bankName: invoice.paymentDetails?.bankName || "",
          financeCompany: invoice.paymentDetails?.financeCompany || "",
          paymentReference: invoice.paymentDetails?.paymentReference || "",
        },
        emiDetails: {
          monthlyAmount: invoice.emiDetails?.monthlyAmount || 0,
          startDate: emiStartDate,
          numberOfInstallments: invoice.emiDetails?.numberOfInstallments || 1,
        },
        // FIX: Check for bulk pricing details and set them
        bulkPricingDetails: invoice.bulkPricingDetails || null,
      });

      // FIX: Auto-populate bulk pricing if it exists in the invoice
      if (invoice.bulkPricingDetails || invoice.bulkPricingApplied) {
        const bulkDetails = invoice.bulkPricingDetails;
        if (bulkDetails) {
          setBulkPricing({
            totalPrice: bulkDetails.totalPrice || 0,
            gstSlab: bulkDetails.gstSlab || 18,
            isPriceInclusive: bulkDetails.isPriceInclusive || false,
          });
          setBulkPricingApplied(true);
        }
      }

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

  // Bulk pricing handlers
  const handleBulkPricingToggle = () => {
    setShowBulkPricing(!showBulkPricing);
    if (!showBulkPricing) {
      // When opening bulk pricing, set current total as starting point
      setBulkPricing((prev) => ({
        ...prev,
        totalPrice: calculations.grandTotal || 0,
      }));
    }
  };

  const handleBulkPricingChange = (field) => (event) => {
    const value =
      event.target.type === "checkbox"
        ? event.target.checked
        : parseFloat(event.target.value) || 0;
    setBulkPricing((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const applyBulkPricing = () => {
    if (formData.items.length === 0 || bulkPricing.totalPrice <= 0) return;

    setBulkPricingApplied(true);
    setFormData((prev) => ({
      ...prev,
      bulkPricingDetails: {
        totalPrice: bulkPricing.totalPrice,
        gstSlab: bulkPricing.gstSlab,
        isPriceInclusive: bulkPricing.isPriceInclusive,
      },
    }));
    setShowBulkPricing(false);
  };

  const clearBulkPricing = () => {
    setBulkPricingApplied(false);
    setFormData((prev) => {
      const newData = { ...prev };
      delete newData.bulkPricingDetails;
      return newData;
    });
  };

  useEffect(() => {
    const calculateTotals = () => {
      let subtotal = 0;
      let totalGST = 0;
      const itemTotals = [];

      if (bulkPricingApplied && formData.bulkPricingDetails) {
        // Use bulk pricing - ignore individual item calculations
        const bulkDetails = formData.bulkPricingDetails;

        if (!formData.includeGST || bulkDetails.gstSlab === 0) {
          // No GST
          subtotal = bulkDetails.totalPrice;
          totalGST = 0;
        } else if (bulkDetails.isPriceInclusive) {
          // GST included in bulk price
          const baseAmount =
            bulkDetails.totalPrice / (1 + bulkDetails.gstSlab / 100);
          subtotal = Math.round(baseAmount * 100) / 100;
          totalGST =
            Math.round((bulkDetails.totalPrice - baseAmount) * 100) / 100;
        } else {
          // GST to be added to bulk price
          subtotal = bulkDetails.totalPrice;
          totalGST =
            Math.round(
              ((bulkDetails.totalPrice * bulkDetails.gstSlab) / 100) * 100
            ) / 100;
        }

        // Set empty item totals since we're using bulk pricing
        formData.items.forEach((item, index) => {
          itemTotals[index] = {
            baseAmount: 0,
            gstAmount: 0,
            totalAmount: 0,
            bulkPricing: true,
          };
        });
      } else {
        // Regular individual item calculation
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
      }

      setCalculations({
        subtotal: Math.round(subtotal * 100) / 100,
        totalGST: Math.round(totalGST * 100) / 100,
        grandTotal: Math.round((subtotal + totalGST) * 100) / 100,
        itemTotals,
      });
    };

    calculateTotals();
  }, [
    formData.items,
    formData.customerState,
    formData.includeGST,
    bulkPricingApplied,
    formData.bulkPricingDetails,
  ]);

  // Auto-calculate remaining balance for finance/bank transfer
  useEffect(() => {
    if (
      formData.paymentStatus === PAYMENT_STATUS.FINANCE ||
      formData.paymentStatus === PAYMENT_STATUS.BANK_TRANSFER
    ) {
      const downPayment = parseFloat(formData.paymentDetails.downPayment) || 0;
      const remainingBalance = Math.max(
        0,
        calculations.grandTotal - downPayment
      );

      setFormData((prev) => ({
        ...prev,
        paymentDetails: {
          ...prev.paymentDetails,
          remainingBalance: Math.round(remainingBalance * 100) / 100,
        },
      }));
    }
  }, [
    calculations.grandTotal,
    formData.paymentDetails.downPayment,
    formData.paymentStatus,
  ]);

  // Auto-calculate EMI installments when relevant values change
  useEffect(() => {
    if (
      formData.paymentStatus === PAYMENT_STATUS.EMI &&
      formData.emiDetails.monthlyAmount > 0 &&
      calculations.grandTotal > 0
    ) {
      const monthlyAmount = parseFloat(formData.emiDetails.monthlyAmount);
      const calculatedInstallments = Math.ceil(
        calculations.grandTotal / monthlyAmount
      );

      if (calculatedInstallments !== formData.emiDetails.numberOfInstallments) {
        setFormData((prev) => ({
          ...prev,
          emiDetails: {
            ...prev.emiDetails,
            numberOfInstallments: calculatedInstallments,
          },
        }));
      }
    }
  }, [
    calculations.grandTotal,
    formData.paymentStatus,
    formData.emiDetails.monthlyAmount,
  ]);

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
      }));
    } else {
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

  // Employee search and selection handlers
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

  const handleEmployeeSelect = (employee) => {
    setSelectedEmployee(employee);
    if (employee) {
      setFormData((prev) => ({
        ...prev,
        salesPersonId: employee.id,
        salesPersonName: employee.name,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        salesPersonId: "",
        salesPersonName: "",
      }));
    }
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
        };
      } else {
        newItems.push({
          name: itemData.name,
          description: itemData.description,
          quantity: itemData.quantity,
          rate: itemData.rate,
          gstSlab: itemData.gstSlab,
          isPriceInclusive: itemData.isPriceInclusive,
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

  const handlePaymentDetailsChange = (field) => (event) => {
    const value = event.target.value;
    setFormData((prev) => ({
      ...prev,
      paymentDetails: {
        ...prev.paymentDetails,
        [field]: value,
      },
    }));
  };

  const handlePaymentStatusChange = (event) => {
    const newStatus = event.target.value;
    setFormData((prev) => {
      const updatedData = {
        ...prev,
        paymentStatus: newStatus,
      };

      if (
        newStatus === PAYMENT_STATUS.FINANCE ||
        newStatus === PAYMENT_STATUS.BANK_TRANSFER
      ) {
        updatedData.paymentDetails = {
          ...prev.paymentDetails,
          downPayment: 0,
          remainingBalance: calculations.grandTotal,
        };
      } else if (newStatus === PAYMENT_STATUS.PAID) {
        updatedData.paymentDetails = {
          ...prev.paymentDetails,
          downPayment: calculations.grandTotal,
          remainingBalance: 0,
        };
      }

      if (
        newStatus === PAYMENT_STATUS.EMI &&
        prev.emiDetails.monthlyAmount > 0 &&
        calculations.grandTotal > 0
      ) {
        const numberOfInstallments = Math.ceil(
          calculations.grandTotal / parseFloat(prev.emiDetails.monthlyAmount)
        );
        updatedData.emiDetails = {
          ...prev.emiDetails,
          numberOfInstallments,
        };
      }

      return updatedData;
    });
  };

  const handleDateChange = (field) => (date) => {
    setFormData((prev) => ({
      ...prev,
      [field]: date,
    }));
  };

  const handleEMIChange = (field) => (event) => {
    const value = event.target.value;
    setFormData((prev) => {
      const updatedEmiDetails = {
        ...prev.emiDetails,
        [field]: value,
      };

      if (
        field === "monthlyAmount" &&
        value > 0 &&
        calculations.grandTotal > 0
      ) {
        const numberOfInstallments = Math.ceil(
          calculations.grandTotal / parseFloat(value)
        );
        updatedEmiDetails.numberOfInstallments = numberOfInstallments;
      }

      return {
        ...prev,
        emiDetails: updatedEmiDetails,
      };
    });
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

  // Form validation
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
      if (parseFloat(item.rate) < 0) {
        errors[`item_${index}_rate`] = "Rate cannot be negative";
      }
    });

    // Validate payment details
    if (formData.paymentStatus === PAYMENT_STATUS.FINANCE) {
      if (!formData.paymentDetails.financeCompany) {
        errors.financeCompany = "Finance company is required";
      }
      if (parseFloat(formData.paymentDetails.downPayment) < 0) {
        errors.downPayment = "Down payment cannot be negative";
      }
      if (
        parseFloat(formData.paymentDetails.downPayment) >
        calculations.grandTotal
      ) {
        errors.downPayment = "Down payment cannot exceed total amount";
      }
    }

    if (formData.paymentStatus === PAYMENT_STATUS.BANK_TRANSFER) {
      if (!formData.paymentDetails.bankName) {
        errors.bankName = "Bank name is required";
      }
      if (parseFloat(formData.paymentDetails.downPayment) < 0) {
        errors.downPayment = "Down payment cannot be negative";
      }
      if (
        parseFloat(formData.paymentDetails.downPayment) >
        calculations.grandTotal
      ) {
        errors.downPayment = "Down payment cannot exceed total amount";
      }
    }

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

    return errors;
  };

  // Generate EMI schedule
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
    const numberOfInstallments = parseInt(
      formData.emiDetails.numberOfInstallments
    );

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

    return schedule;
  };

  // Form submission
  const handleSubmit = async (event) => {
    event.preventDefault();

    const errors = validateForm();
    setFormErrors(errors);

    if (Object.keys(errors).length > 0) {
      return;
    }

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
      // FIX: Include bulk pricing information in submission
      bulkPricingApplied,
      bulkPricingDetails: bulkPricingApplied ? formData.bulkPricingDetails : null,
    };

    if (onSubmit) {
      await onSubmit(invoiceData);
    }
  };

  const currentPaymentCategory = getPaymentCategory(
    formData.paymentStatus,
    formData.paymentDetails.paymentMethod
  );

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
                Invoice Details
              </Typography>

              <Grid container spacing={3}>
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
                isOptionEqualToValue={(option, value) => option.id === value.id}
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

          {/* Items - Enhanced with Modal */}
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
                              {bulkPricingApplied && (
                                <Box sx={{ mt: 0.5 }}>
                                  <Chip
                                    size="small"
                                    label="Bulk Pricing Applied"
                                    color="success"
                                    variant="outlined"
                                    sx={{ fontSize: "0.7rem", height: 20 }}
                                  />
                                </Box>
                              )}
                            </Box>
                          </TableCell>
                          <TableCell align="center">
                            <Typography variant="body2">
                              {item.quantity}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2">
                              {bulkPricingApplied ? (
                                <Chip
                                  size="small"
                                  label="Bulk"
                                  color="success"
                                  variant="outlined"
                                />
                              ) : parseFloat(item.rate) === 0 ? (
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
                                {bulkPricingApplied
                                  ? `${
                                      formData.bulkPricingDetails?.gstSlab || 18
                                    }%`
                                  : `${item.gstSlab}%`}
                              </Typography>
                            </TableCell>
                          )}
                          <TableCell align="right">
                            <Typography
                              variant="body2"
                              fontWeight={600}
                              color="primary.main"
                            >
                              {bulkPricingApplied ? (
                                <Chip
                                  size="small"
                                  label="See Total Below"
                                  color="info"
                                  variant="outlined"
                                />
                              ) : (
                                `₹${
                                  calculations.itemTotals[
                                    index
                                  ]?.totalAmount?.toFixed(2) || "0.00"
                                }`
                              )}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Box display="flex" gap={0.5}>
                              {!bulkPricingApplied && (
                                <>
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
                                </>
                              )}
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

          {/* Bulk Pricing Section */}
          {formData.items.length > 0 && (
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Box
                  display="flex"
                  justifyContent="space-between"
                  alignItems="center"
                  mb={2}
                >
                  <Typography variant="h6">Bulk Pricing</Typography>
                  <Box display="flex" gap={1}>
                    {bulkPricingApplied && (
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={clearBulkPricing}
                        color="error"
                        startIcon={<CancelIcon />}
                      >
                        Remove Bulk Pricing
                      </Button>
                    )}
                    {!bulkPricingApplied && (
                      <Button
                        variant={showBulkPricing ? "outlined" : "contained"}
                        size="small"
                        onClick={handleBulkPricingToggle}
                        startIcon={
                          showBulkPricing ? <CancelIcon /> : <MoneyIcon />
                        }
                      >
                        {showBulkPricing ? "Cancel" : "Set Bulk Price"}
                      </Button>
                    )}
                  </Box>
                </Box>

                {bulkPricingApplied && (
                  <Alert severity="success" sx={{ mb: 2 }}>
                    <Typography variant="body2">
                      <strong>Bulk Pricing Active:</strong> Total invoice amount
                      is ₹{formData.bulkPricingDetails?.totalPrice}
                      {formData.bulkPricingDetails?.isPriceInclusive
                        ? " (inclusive of GST)"
                        : " (exclusive of GST)"}
                      at {formData.bulkPricingDetails?.gstSlab}% GST rate.
                    </Typography>
                  </Alert>
                )}

                {showBulkPricing && !bulkPricingApplied && (
                  <Box>
                    <Alert severity="info" sx={{ mb: 2 }}>
                      <Typography variant="body2">
                        Set the total price for the entire invoice. This will
                        replace individual item pricing.
                      </Typography>
                    </Alert>

                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={4}>
                        <TextField
                          fullWidth
                          label="Total Invoice Price"
                          type="number"
                          value={bulkPricing.totalPrice}
                          onChange={handleBulkPricingChange("totalPrice")}
                          inputProps={{ min: 0, step: 0.01 }}
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                ₹
                              </InputAdornment>
                            ),
                          }}
                        />
                      </Grid>

                      <Grid item xs={12} sm={3}>
                        <TextField
                          fullWidth
                          select
                          label="GST Slab"
                          value={bulkPricing.gstSlab}
                          onChange={handleBulkPricingChange("gstSlab")}
                        >
                          {GST_TAX_SLABS.map((slab) => (
                            <MenuItem key={slab.rate} value={slab.rate}>
                              {slab.rate}% - {slab.description}
                            </MenuItem>
                          ))}
                        </TextField>
                      </Grid>

                      <Grid item xs={12} sm={3}>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={bulkPricing.isPriceInclusive}
                              onChange={handleBulkPricingChange(
                                "isPriceInclusive"
                              )}
                            />
                          }
                          label="Price Inclusive of GST"
                          sx={{ mt: 1 }}
                        />
                      </Grid>

                      <Grid item xs={12} sm={2}>
                        <Button
                          fullWidth
                          variant="contained"
                          onClick={applyBulkPricing}
                          disabled={bulkPricing.totalPrice <= 0}
                          sx={{ mt: 1 }}
                        >
                          Apply
                        </Button>
                      </Grid>
                    </Grid>

                    {bulkPricing.totalPrice > 0 && (
                      <Box
                        sx={{
                          mt: 2,
                          p: 2,
                          backgroundColor: "rgba(25, 118, 210, 0.1)",
                          borderRadius: 1,
                          border: "1px solid rgba(25, 118, 210, 0.2)",
                        }}
                      >
                        <Typography
                          variant="subtitle2"
                          color="primary"
                          gutterBottom
                        >
                          Bulk Pricing Preview:
                        </Typography>
                        <Box
                          display="flex"
                          justifyContent="space-between"
                          mb={1}
                        >
                          <Typography variant="body2">
                            Total Invoice Amount:
                          </Typography>
                          <Typography variant="body2" fontWeight={600}>
                            ₹{bulkPricing.totalPrice.toFixed(2)}
                          </Typography>
                        </Box>
                        <Box display="flex" justifyContent="space-between">
                          <Typography variant="body2">
                            GST Treatment:
                          </Typography>
                          <Typography variant="body2" fontWeight={600}>
                            {bulkPricing.isPriceInclusive
                              ? "Inclusive"
                              : "Exclusive"}{" "}
                            ({bulkPricing.gstSlab}%)
                          </Typography>
                        </Box>
                      </Box>
                    )}
                  </Box>
                )}
              </CardContent>
            </Card>
          )}

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

        {/* Right Column - Use existing payment and delivery components */}
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

          {/* Payment Options - All existing functionality preserved */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography
                variant="h6"
                gutterBottom
                sx={{ display: "flex", alignItems: "center", gap: 1 }}
              >
                <PaymentIcon />
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
                  <MenuItem value={PAYMENT_STATUS.PAID}>
                    {PAYMENT_STATUS_DISPLAY[PAYMENT_STATUS.PAID]}
                  </MenuItem>
                  <MenuItem value={PAYMENT_STATUS.EMI}>
                    {PAYMENT_STATUS_DISPLAY[PAYMENT_STATUS.EMI]}
                  </MenuItem>
                  <MenuItem value={PAYMENT_STATUS.FINANCE}>
                    {PAYMENT_STATUS_DISPLAY[PAYMENT_STATUS.FINANCE]}
                  </MenuItem>
                  <MenuItem value={PAYMENT_STATUS.BANK_TRANSFER}>
                    {PAYMENT_STATUS_DISPLAY[PAYMENT_STATUS.BANK_TRANSFER]}
                  </MenuItem>
                  <MenuItem value={PAYMENT_STATUS.PENDING}>
                    {PAYMENT_STATUS_DISPLAY[PAYMENT_STATUS.PENDING]}
                  </MenuItem>
                  <MenuItem value={PAYMENT_STATUS.CREDIT_CARD}>
                    {PAYMENT_STATUS_DISPLAY[PAYMENT_STATUS.CREDIT_CARD]}
                  </MenuItem>
                </TextField>
              </FormControl>

              {currentPaymentCategory && (
                <Box sx={{ mb: 2 }}>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    gutterBottom
                  >
                    Payment Category:
                  </Typography>
                  <Chip
                    label={currentPaymentCategory
                      .replace(/_/g, " ")
                      .toUpperCase()}
                    size="small"
                    color="primary"
                    variant="outlined"
                  />
                </Box>
              )}

              {/* PAID Status - Show payment method selection */}
              {formData.paymentStatus === PAYMENT_STATUS.PAID && (
                <Box>
                  <Alert severity="info" sx={{ mb: 2 }}>
                    <Typography variant="body2">
                      Select payment method for full payment
                    </Typography>
                  </Alert>

                  <TextField
                    fullWidth
                    select
                    label="Payment Method"
                    value={formData.paymentDetails.paymentMethod}
                    onChange={handlePaymentDetailsChange("paymentMethod")}
                    disabled={loading}
                    sx={{ mb: 2 }}
                    SelectProps={{
                      native: true,
                    }}
                  >
                    <option value={PAYMENT_METHODS.CASH}>
                      {PAYMENT_METHOD_DISPLAY[PAYMENT_METHODS.CASH]}
                    </option>
                    <option value={PAYMENT_METHODS.CARD}>
                      {PAYMENT_METHOD_DISPLAY[PAYMENT_METHODS.CARD]}
                    </option>
                    <option value={PAYMENT_METHODS.CREDIT_CARD}>
                      {PAYMENT_METHOD_DISPLAY[PAYMENT_METHODS.CREDIT_CARD]}
                    </option>
                    <option value={PAYMENT_METHODS.UPI}>
                      {PAYMENT_METHOD_DISPLAY[PAYMENT_METHODS.UPI]}
                    </option>
                    <option value={PAYMENT_METHODS.NET_BANKING}>
                      {PAYMENT_METHOD_DISPLAY[PAYMENT_METHODS.NET_BANKING]}
                    </option>
                    <option value={PAYMENT_METHODS.CHEQUE}>
                      {PAYMENT_METHOD_DISPLAY[PAYMENT_METHODS.CHEQUE]}
                    </option>
                    <option value={PAYMENT_METHODS.BANK_TRANSFER}>
                      {PAYMENT_METHOD_DISPLAY[PAYMENT_METHODS.BANK_TRANSFER]}
                    </option>
                  </TextField>

                  <Box
                    sx={{
                      mt: 2,
                      p: 2,
                      backgroundColor: "rgba(76, 175, 80, 0.1)",
                      borderRadius: 1,
                      border: "1px solid rgba(76, 175, 80, 0.2)",
                    }}
                  >
                    <Typography
                      variant="subtitle2"
                      color="success.main"
                      gutterBottom
                    >
                      Full Payment -{" "}
                      {
                        PAYMENT_METHOD_DISPLAY[
                          formData.paymentDetails.paymentMethod
                        ]
                      }
                    </Typography>
                    <Box display="flex" alignItems="center" gap={1}>
                      {formData.paymentDetails.paymentMethod ===
                        PAYMENT_METHODS.CREDIT_CARD && (
                        <CreditCardIcon color="success" />
                      )}
                      {formData.paymentDetails.paymentMethod ===
                        PAYMENT_METHODS.CASH && <MoneyIcon color="success" />}
                      <Typography variant="body2" fontWeight={600}>
                        Amount: ₹{calculations.grandTotal.toFixed(2)}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              )}

              {/* Finance Payment Details */}
              {formData.paymentStatus === PAYMENT_STATUS.FINANCE && (
                <Box>
                  <Alert severity="info" sx={{ mb: 2 }}>
                    <Typography variant="body2">
                      Configure finance payment with down payment amount
                    </Typography>
                  </Alert>

                  <TextField
                    fullWidth
                    label="Finance Company"
                    placeholder="e.g., ICICI Bank, HDFC Bank"
                    value={formData.paymentDetails.financeCompany}
                    onChange={handlePaymentDetailsChange("financeCompany")}
                    error={!!formErrors.financeCompany}
                    helperText={formErrors.financeCompany}
                    disabled={loading}
                    sx={{ mb: 2 }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <BankIcon />
                        </InputAdornment>
                      ),
                    }}
                  />

                  <TextField
                    fullWidth
                    label="Down Payment Amount"
                    type="number"
                    value={formData.paymentDetails.downPayment}
                    onChange={handlePaymentDetailsChange("downPayment")}
                    error={!!formErrors.downPayment}
                    helperText={
                      formErrors.downPayment ||
                      `Remaining: ₹${formData.paymentDetails.remainingBalance.toFixed(
                        2
                      )}`
                    }
                    disabled={loading}
                    sx={{ mb: 2 }}
                    inputProps={{
                      min: 0,
                      max: calculations.grandTotal,
                      step: 0.01,
                    }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">₹</InputAdornment>
                      ),
                    }}
                  />

                  <TextField
                    fullWidth
                    label="Payment Reference"
                    placeholder="Finance application number or reference"
                    value={formData.paymentDetails.paymentReference}
                    onChange={handlePaymentDetailsChange("paymentReference")}
                    disabled={loading}
                    sx={{ mb: 2 }}
                  />

                  <Box
                    sx={{
                      mt: 2,
                      p: 2,
                      backgroundColor: "rgba(76, 175, 80, 0.1)",
                      borderRadius: 1,
                      border: "1px solid rgba(76, 175, 80, 0.2)",
                    }}
                  >
                    <Typography
                      variant="subtitle2"
                      color="success.main"
                      gutterBottom
                    >
                      Finance Payment Breakdown:
                    </Typography>
                    <Box display="flex" justifyContent="space-between" mb={1}>
                      <Typography variant="body2">Down Payment:</Typography>
                      <Typography variant="body2" fontWeight={600}>
                        ₹
                        {parseFloat(
                          formData.paymentDetails.downPayment || 0
                        ).toFixed(2)}
                      </Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between" mb={1}>
                      <Typography variant="body2">
                        Remaining (Finance):
                      </Typography>
                      <Typography variant="body2" fontWeight={600}>
                        ₹{formData.paymentDetails.remainingBalance.toFixed(2)}
                      </Typography>
                    </Box>
                    <Divider sx={{ my: 1 }} />
                    <Box display="flex" justifyContent="space-between">
                      <Typography variant="body2" fontWeight={600}>
                        Total:
                      </Typography>
                      <Typography variant="body2" fontWeight={600}>
                        ₹{calculations.grandTotal.toFixed(2)}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              )}

              {/* Bank Transfer Payment Details */}
              {formData.paymentStatus === PAYMENT_STATUS.BANK_TRANSFER && (
                <Box>
                  <Alert severity="info" sx={{ mb: 2 }}>
                    <Typography variant="body2">
                      Configure bank transfer payment with down payment amount
                    </Typography>
                  </Alert>

                  <TextField
                    fullWidth
                    label="Bank Name"
                    placeholder="e.g., State Bank of India, ICICI Bank"
                    value={formData.paymentDetails.bankName}
                    onChange={handlePaymentDetailsChange("bankName")}
                    error={!!formErrors.bankName}
                    helperText={formErrors.bankName}
                    disabled={loading}
                    sx={{ mb: 2 }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <BankIcon />
                        </InputAdornment>
                      ),
                    }}
                  />

                  <TextField
                    fullWidth
                    label="Down Payment Amount"
                    type="number"
                    value={formData.paymentDetails.downPayment}
                    onChange={handlePaymentDetailsChange("downPayment")}
                    error={!!formErrors.downPayment}
                    helperText={
                      formErrors.downPayment ||
                      `Remaining: ₹${formData.paymentDetails.remainingBalance.toFixed(
                        2
                      )}`
                    }
                    disabled={loading}
                    sx={{ mb: 2 }}
                    inputProps={{
                      min: 0,
                      max: calculations.grandTotal,
                      step: 0.01,
                    }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">₹</InputAdornment>
                      ),
                    }}
                  />

                  <TextField
                    fullWidth
                    label="Payment Reference"
                    placeholder="Transaction ID or reference number"
                    value={formData.paymentDetails.paymentReference}
                    onChange={handlePaymentDetailsChange("paymentReference")}
                    disabled={loading}
                    sx={{ mb: 2 }}
                  />

                  <Box
                    sx={{
                      mt: 2,
                      p: 2,
                      backgroundColor: "rgba(33, 150, 243, 0.1)",
                      borderRadius: 1,
                      border: "1px solid rgba(33, 150, 243, 0.2)",
                    }}
                  >
                    <Typography
                      variant="subtitle2"
                      color="primary.main"
                      gutterBottom
                    >
                      Bank Transfer Payment Breakdown:
                    </Typography>
                    <Box display="flex" justifyContent="space-between" mb={1}>
                      <Typography variant="body2">Down Payment:</Typography>
                      <Typography variant="body2" fontWeight={600}>
                        ₹
                        {parseFloat(
                          formData.paymentDetails.downPayment || 0
                        ).toFixed(2)}
                      </Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between" mb={1}>
                      <Typography variant="body2">
                        Remaining (Transfer):
                      </Typography>
                      <Typography variant="body2" fontWeight={600}>
                        ₹{formData.paymentDetails.remainingBalance.toFixed(2)}
                      </Typography>
                    </Box>
                    <Divider sx={{ my: 1 }} />
                    <Box display="flex" justifyContent="space-between">
                      <Typography variant="body2" fontWeight={600}>
                        Total:
                      </Typography>
                      <Typography variant="body2" fontWeight={600}>
                        ₹{calculations.grandTotal.toFixed(2)}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              )}

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

                  {formData.emiDetails.monthlyAmount > 0 &&
                    calculations.grandTotal > 0 && (
                      <Box
                        sx={{
                          mt: 2,
                          p: 2,
                          backgroundColor: "rgba(25, 118, 210, 0.1)",
                          borderRadius: 1,
                          border: "1px solid rgba(25, 118, 210, 0.2)",
                        }}
                      >
                        <Typography
                          variant="subtitle2"
                          color="primary"
                          gutterBottom
                        >
                          EMI Calculation Summary:
                        </Typography>
                        <Typography variant="body2" sx={{ mb: 1 }}>
                          <strong>Invoice Total:</strong> ₹
                          {calculations.grandTotal.toFixed(2)}
                        </Typography>
                        <Typography variant="body2" sx={{ mb: 1 }}>
                          <strong>Monthly EMI:</strong> ₹
                          {parseFloat(
                            formData.emiDetails.monthlyAmount
                          ).toFixed(2)}
                        </Typography>
                        <Typography variant="body2" sx={{ mb: 1 }}>
                          <strong>Number of Installments:</strong>{" "}
                          {formData.emiDetails.numberOfInstallments} months
                        </Typography>

                        {(() => {
                          const monthlyAmount = parseFloat(
                            formData.emiDetails.monthlyAmount
                          );
                          const numberOfInstallments =
                            formData.emiDetails.numberOfInstallments;
                          const totalAmount = calculations.grandTotal;

                          if (numberOfInstallments > 1) {
                            const regularInstallments =
                              numberOfInstallments - 1;
                            const regularInstallmentTotal =
                              monthlyAmount * regularInstallments;
                            const lastInstallmentAmount =
                              totalAmount - regularInstallmentTotal;

                            return (
                              <>
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                  sx={{ display: "block", mb: 1 }}
                                >
                                  • First {regularInstallments} installments: ₹
                                  {monthlyAmount.toFixed(2)} each = ₹
                                  {regularInstallmentTotal.toFixed(2)}
                                </Typography>
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                  sx={{ display: "block", mb: 1 }}
                                >
                                  • Last installment: ₹
                                  {lastInstallmentAmount.toFixed(2)}
                                </Typography>
                              </>
                            );
                          }
                          return null;
                        })()}

                        <Typography
                          variant="body2"
                          color="success.main"
                          fontWeight={600}
                        >
                          <strong>Total EMI Amount:</strong> ₹
                          {calculations.grandTotal.toFixed(2)}
                        </Typography>

                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ display: "block", mt: 1, fontStyle: "italic" }}
                        >
                          Note: Last installment amount is adjusted to match
                          invoice total
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

export default InvoiceForm;