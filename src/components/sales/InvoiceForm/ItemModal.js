import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  FormControlLabel,
  Switch,
  MenuItem,
  Typography,
  Box,
  Alert,
  IconButton,
  InputAdornment,
  Chip,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Close as CloseIcon,
  Calculate as CalculatorIcon,
  Info as InfoIcon,
  AttachMoney as MoneyIcon,
} from "@mui/icons-material";

import { calculateItemWithGST } from "../../../utils/helpers/gstCalculator";

// GST Tax Slabs
const GST_TAX_SLABS = [
  { rate: 0, description: "Nil rated" },
  { rate: 5, description: "Essential goods" },
  { rate: 12, description: "Standard goods" },
  { rate: 18, description: "Most goods and services" },
  { rate: 28, description: "Luxury and sin goods" },
];

/**
 * ItemModal component for adding/editing invoice items
 * @param {Object} props
 * @param {boolean} props.open - Whether modal is open
 * @param {Function} props.onClose - Close handler
 * @param {Function} props.onSave - Save handler
 * @param {Object} props.item - Item data for editing (null for new item)
 * @param {string} props.customerState - Customer state for GST calculation
 * @param {boolean} props.includeGST - Whether GST is enabled for invoice
 * @param {boolean} props.loading - Loading state
 * @returns {React.ReactElement}
 */
const ItemModal = ({
  open = false,
  onClose,
  onSave,
  item = null,
  customerState = "",
  includeGST = true,
  loading = false,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isEdit = Boolean(item);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    quantity: 1,
    rate: 0,
    gstSlab: 18,
    isPriceInclusive: false,
    hsnCode: "",
  });

  const [formErrors, setFormErrors] = useState({});
  const [gstCalculation, setGstCalculation] = useState({
    baseAmount: 0,
    gstAmount: 0,
    totalAmount: 0,
  });

  // FIX: Helper function to get the display rate (what user should see in the rate field)
  const getDisplayRate = (itemData) => {
    // For new items or items without calculation data, use the rate as-is
    if (!itemData.baseAmount && !itemData.totalAmount) {
      return itemData.rate || 0;
    }

    // For existing items with calculation data:
    // - If price-inclusive: show the total amount (what user originally entered)
    // - If price-exclusive: show the base amount (rate without GST)
    if (itemData.isPriceInclusive) {
      return itemData.totalAmount || itemData.rate || 0;
    } else {
      return itemData.baseAmount || itemData.rate || 0;
    }
  };

  // Initialize form data when modal opens or item changes
  useEffect(() => {
    if (open) {
      if (isEdit && item) {
        // FIX: Properly initialize the rate field based on pricing type
        const displayRate = getDisplayRate(item);

        setFormData({
          name: item.name || "",
          description: item.description || "",
          quantity: item.quantity || 1,
          rate: displayRate,
          gstSlab: item.gstSlab || 18,
          isPriceInclusive: item.isPriceInclusive || false,
          hsnCode: item.hsnCode || "",
        });
      } else {
        // Reset for new item
        setFormData({
          name: "",
          description: "",
          quantity: 1,
          rate: 0,
          gstSlab: 18,
          isPriceInclusive: false,
          hsnCode: "",
        });
      }
      setFormErrors({});
    }
  }, [open, isEdit, item]);

  // Calculate GST whenever relevant values change
  useEffect(() => {
    if (formData.quantity && formData.rate) {
      const itemCalc = calculateItemWithGST(
        formData,
        customerState,
        includeGST
      );

      setGstCalculation({
        baseAmount: itemCalc.baseAmount || 0,
        gstAmount: itemCalc.gstAmount || 0,
        totalAmount: itemCalc.totalAmount || 0,
      });
    } else {
      setGstCalculation({
        baseAmount: 0,
        gstAmount: 0,
        totalAmount: 0,
      });
    }
  }, [
    formData.quantity,
    formData.rate,
    formData.gstSlab,
    formData.isPriceInclusive,
    customerState,
    includeGST,
  ]);

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

    // Clear field error
    if (formErrors[field]) {
      setFormErrors((prev) => ({
        ...prev,
        [field]: null,
      }));
    }
  };

  // FIX: Handle price inclusive toggle - maintain the user's entered rate
  const handlePriceInclusiveChange = (event) => {
    const isInclusive = event.target.checked;

    setFormData((prev) => ({
      ...prev,
      isPriceInclusive: isInclusive,
    }));

    // Clear error if any
    if (formErrors.isPriceInclusive) {
      setFormErrors((prev) => ({
        ...prev,
        isPriceInclusive: null,
      }));
    }
  };

  // Validate form
  const validateForm = () => {
    const errors = {};

    if (!formData.name.trim()) {
      errors.name = "Item name is required";
    }

    if (!formData.quantity || parseFloat(formData.quantity) <= 0) {
      errors.quantity = "Quantity must be greater than 0";
    }

    if (parseFloat(formData.rate) < 0) {
      errors.rate = "Rate cannot be negative";
    }

    return errors;
  };

  // Handle save
  const handleSave = () => {
    const errors = validateForm();
    setFormErrors(errors);

    if (Object.keys(errors).length > 0) {
      return;
    }

    // FIX: Prepare item data with correct rate based on pricing type
    const itemData = {
      name: formData.name.trim(),
      description: formData.description.trim(),
      quantity: parseFloat(formData.quantity),
      rate: parseFloat(formData.rate), // This is what the user entered
      gstSlab: parseFloat(formData.gstSlab),
      isPriceInclusive: formData.isPriceInclusive,
      hsnCode: formData.hsnCode,
      // FIX: Include calculated values for proper handling
      baseAmount: gstCalculation.baseAmount,
      gstAmount: gstCalculation.gstAmount,
      totalAmount: gstCalculation.totalAmount,
    };

    onSave(itemData);
  };

  // Handle close
  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      fullScreen={isMobile}
      PaperProps={{
        sx: {
          borderRadius: isMobile ? 0 : 2,
          maxHeight: isMobile ? "100vh" : "90vh",
        },
      }}
    >
      {/* Header */}
      <DialogTitle
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          pb: 1,
        }}
      >
        <Box display="flex" alignItems="center" gap={1}>
          {isEdit ? <EditIcon /> : <AddIcon />}
          <Typography variant="h6">
            {isEdit ? "Edit Item" : "Add Item"}
          </Typography>
        </Box>

        <IconButton onClick={handleClose} disabled={loading} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      {/* Content */}
      <DialogContent dividers>
        <Grid container spacing={3}>
          {/* Item Name */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Item Name"
              placeholder="Enter item name..."
              value={formData.name}
              onChange={handleChange("name")}
              error={!!formErrors.name}
              helperText={formErrors.name}
              disabled={loading}
              required
            />
          </Grid>

          {/* Description */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Description"
              placeholder="Enter item description..."
              value={formData.description}
              onChange={handleChange("description")}
              disabled={loading}
              multiline
              rows={2}
            />
          </Grid>

          {/* NEW - HSN Code Field */}
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="HSN Code"
              placeholder="e.g., 8504, 9403, 6109"
              value={formData.hsnCode}
              onChange={handleChange("hsnCode")}
              disabled={loading}
              helperText="Harmonized System of Nomenclature code for GST"
              inputProps={{
                maxLength: 8,
                style: { textTransform: "uppercase" },
              }}
            />
          </Grid>

          {/* Quantity and Rate */}
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Quantity"
              type="number"
              value={formData.quantity}
              onChange={handleChange("quantity")}
              error={!!formErrors.quantity}
              helperText={formErrors.quantity}
              disabled={loading}
              inputProps={{ min: 0.01, step: 0.01 }}
              required
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label={
                formData.isPriceInclusive
                  ? "Rate (Including GST)"
                  : "Rate (Excluding GST)"
              }
              type="number"
              value={formData.rate}
              onChange={handleChange("rate")}
              error={!!formErrors.rate}
              helperText={formErrors.rate || "Enter 0 to set price later"}
              disabled={loading}
              inputProps={{ min: 0, step: 0.01 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">₹</InputAdornment>
                ),
              }}
            />
          </Grid>

          {/* GST Slab */}
          {includeGST && (
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                select
                label="GST Slab"
                value={formData.gstSlab}
                onChange={handleChange("gstSlab")}
                disabled={loading}
                helperText="Select applicable GST rate"
              >
                {GST_TAX_SLABS.map((slab) => (
                  <MenuItem key={slab.rate} value={slab.rate}>
                    {slab.rate}% - {slab.description}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
          )}

          {/* Price Type Toggle */}
          {includeGST && parseFloat(formData.rate) > 0 && (
            <Grid item xs={12} sm={includeGST ? 6 : 12}>
              <Box
                sx={{
                  p: 2,
                  backgroundColor: "rgba(25, 118, 210, 0.05)",
                  borderRadius: 1,
                  border: "1px solid rgba(25, 118, 210, 0.1)",
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                }}
              >
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.isPriceInclusive}
                      onChange={handlePriceInclusiveChange}
                      disabled={loading}
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="body2" fontWeight={600}>
                        Price includes GST
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {formData.isPriceInclusive
                          ? "The entered rate includes GST amount"
                          : "GST will be added to the entered rate"}
                      </Typography>
                    </Box>
                  }
                />
              </Box>
            </Grid>
          )}

          {/* GST Calculation Display */}
          {includeGST &&
            parseFloat(formData.rate) > 0 &&
            parseFloat(formData.quantity) > 0 && (
              <Grid item xs={12}>
                <Box
                  sx={{
                    p: 2,
                    backgroundColor: "rgba(76, 175, 80, 0.05)",
                    borderRadius: 1,
                    border: "1px solid rgba(76, 175, 80, 0.2)",
                  }}
                >
                  <Typography
                    variant="subtitle2"
                    gutterBottom
                    sx={{ display: "flex", alignItems: "center", gap: 1 }}
                  >
                    <CalculatorIcon fontSize="small" />
                    Price Breakdown (Per Unit)
                  </Typography>

                  <Grid container spacing={2}>
                    <Grid item xs={6} sm={3}>
                      <Typography variant="body2" color="text.secondary">
                        Entered Rate:
                      </Typography>
                      <Typography variant="body1" fontWeight={600}>
                        ₹{parseFloat(formData.rate).toFixed(2)}
                      </Typography>
                    </Grid>

                    <Grid item xs={6} sm={3}>
                      <Typography variant="body2" color="text.secondary">
                        Base Amount:
                      </Typography>
                      <Typography variant="body1" fontWeight={600}>
                        ₹{gstCalculation.baseAmount.toFixed(2)}
                      </Typography>
                    </Grid>

                    <Grid item xs={6} sm={3}>
                      <Typography variant="body2" color="text.secondary">
                        GST ({formData.gstSlab}%):
                      </Typography>
                      <Typography variant="body1" fontWeight={600}>
                        ₹{gstCalculation.gstAmount.toFixed(2)}
                      </Typography>
                    </Grid>

                    <Grid item xs={6} sm={3}>
                      <Typography variant="body2" color="text.secondary">
                        Total Amount:
                      </Typography>
                      <Typography
                        variant="h6"
                        color="primary.main"
                        fontWeight={700}
                      >
                        ₹{gstCalculation.totalAmount.toFixed(2)}
                      </Typography>
                    </Grid>
                  </Grid>

                  {/* FIX: Enhanced breakdown for total quantity */}
                  {parseFloat(formData.quantity) > 1 && (
                    <>
                      <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
                        Total for {formData.quantity} units:
                      </Typography>
                      <Grid container spacing={2}>
                        <Grid item xs={4}>
                          <Typography variant="body2" color="text.secondary">
                            Total Base:
                          </Typography>
                          <Typography variant="body1" fontWeight={600}>
                            ₹
                            {(
                              gstCalculation.baseAmount *
                              parseFloat(formData.quantity)
                            ).toFixed(2)}
                          </Typography>
                        </Grid>
                        <Grid item xs={4}>
                          <Typography variant="body2" color="text.secondary">
                            Total GST:
                          </Typography>
                          <Typography variant="body1" fontWeight={600}>
                            ₹
                            {(
                              gstCalculation.gstAmount *
                              parseFloat(formData.quantity)
                            ).toFixed(2)}
                          </Typography>
                        </Grid>
                        <Grid item xs={4}>
                          <Typography variant="body2" color="text.secondary">
                            Grand Total:
                          </Typography>
                          <Typography
                            variant="h6"
                            color="primary.main"
                            fontWeight={700}
                          >
                            ₹
                            {(
                              gstCalculation.totalAmount *
                              parseFloat(formData.quantity)
                            ).toFixed(2)}
                          </Typography>
                        </Grid>
                      </Grid>
                    </>
                  )}

                  {/* Price Mode Indicator */}
                  <Box sx={{ mt: 2 }}>
                    <Chip
                      size="small"
                      icon={<InfoIcon />}
                      label={
                        formData.isPriceInclusive
                          ? `Rate ₹${parseFloat(formData.rate).toFixed(
                              2
                            )} includes ₹${gstCalculation.gstAmount.toFixed(
                              2
                            )} GST`
                          : `Rate ₹${parseFloat(formData.rate).toFixed(
                              2
                            )} + ₹${gstCalculation.gstAmount.toFixed(
                              2
                            )} GST = ₹${gstCalculation.totalAmount.toFixed(2)}`
                      }
                      color={
                        formData.isPriceInclusive ? "secondary" : "primary"
                      }
                      variant="outlined"
                      sx={{ fontSize: "0.75rem" }}
                    />
                  </Box>
                </Box>
              </Grid>
            )}

          {/* Info for zero rate */}
          {parseFloat(formData.rate) === 0 && (
            <Grid item xs={12}>
              <Alert severity="info" icon={<MoneyIcon />}>
                <Typography variant="body2">
                  <strong>Zero Rate Item:</strong> You can add this item with
                  zero rate and update the price later. This is useful when
                  adding multiple items and setting prices at the end.
                </Typography>
              </Alert>
            </Grid>
          )}

          {/* FIX: Help text for price inclusive/exclusive */}
          {includeGST && parseFloat(formData.rate) > 0 && (
            <Grid item xs={12}>
              <Alert severity="info" icon={<InfoIcon />}>
                <Typography variant="body2">
                  <strong>Pricing Help:</strong>
                  {formData.isPriceInclusive ? (
                    <>
                      {" "}
                      The rate you entered (₹
                      {parseFloat(formData.rate).toFixed(2)}) includes GST. The
                      system will automatically calculate the base amount (₹
                      {gstCalculation.baseAmount.toFixed(2)}) and GST component
                      (₹{gstCalculation.gstAmount.toFixed(2)}) for proper
                      accounting.
                    </>
                  ) : (
                    <>
                      {" "}
                      The rate you entered (₹
                      {parseFloat(formData.rate).toFixed(2)}) is the base
                      amount. GST of ₹{gstCalculation.gstAmount.toFixed(2)} will
                      be added, making the total ₹
                      {gstCalculation.totalAmount.toFixed(2)} per unit.
                    </>
                  )}
                </Typography>
              </Alert>
            </Grid>
          )}
        </Grid>
      </DialogContent>

      {/* Actions */}
      <DialogActions sx={{ p: 3, gap: 1 }}>
        <Button
          onClick={handleClose}
          disabled={loading}
          variant="outlined"
          size="large"
          fullWidth={isMobile}
        >
          Cancel
        </Button>

        <Button
          onClick={handleSave}
          disabled={loading}
          variant="contained"
          size="large"
          fullWidth={isMobile}
          startIcon={loading ? null : isEdit ? <EditIcon /> : <AddIcon />}
        >
          {loading ? "Saving..." : isEdit ? "Update Item" : "Add Item"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ItemModal;
