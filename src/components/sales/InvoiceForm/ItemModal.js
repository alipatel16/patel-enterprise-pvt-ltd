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
  Autocomplete,
  CircularProgress,
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Close as CloseIcon,
  Calculate as CalculatorIcon,
  Info as InfoIcon,
  AttachMoney as MoneyIcon,
  Inventory as ProductIcon,
} from "@mui/icons-material";

import { calculateItemWithGST } from "../../../utils/helpers/gstCalculator";
import productService from "../../../services/api/productService";
import { useUserType } from "../../../contexts/UserTypeContext/UserTypeContext";

// GST Tax Slabs
const GST_TAX_SLABS = [
  { rate: 0, description: "Nil rated" },
  { rate: 5, description: "Essential goods" },
  { rate: 12, description: "Standard goods" },
  { rate: 18, description: "Most goods and services" },
  { rate: 28, description: "Luxury and sin goods" },
];

/**
 * Enhanced ItemModal component with product autocomplete
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
  const { userType } = useUserType();

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

  // Product autocomplete state
  const [productOptions, setProductOptions] = useState([]);
  const [productLoading, setProductLoading] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Helper function to get display rate
  const getDisplayRate = (itemData) => {
    if (!itemData.baseAmount && !itemData.totalAmount) {
      return itemData.rate || 0;
    }
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
      setSelectedProduct(null);
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

  // Product search handler
  const handleProductSearch = async (searchTerm) => {
    if (!searchTerm || searchTerm.length < 2) {
      setProductOptions([]);
      return;
    }

    setProductLoading(true);
    try {
      const suggestions = await productService.getProductSuggestions(
        userType,
        searchTerm
      );
      setProductOptions(suggestions);
    } catch (error) {
      console.error("Error fetching product suggestions:", error);
      setProductOptions([]);
    } finally {
      setProductLoading(false);
    }
  };

  // Product selection handler
  const handleProductSelect = (product) => {
    setSelectedProduct(product);
    if (product) {
      setFormData((prev) => ({
        ...prev,
        name: product.name,
        description: product.description || "",
        hsnCode: product.hsnCode || "",
        rate: product.defaultRate || 0,
        gstSlab: product.defaultGstSlab || 18,
        isPriceInclusive: product.isPriceInclusive || false,
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

    if (formErrors[field]) {
      setFormErrors((prev) => ({
        ...prev,
        [field]: null,
      }));
    }
  };

  // Handle name change (for manual entry)
  const handleNameChange = (event, value) => {
    setFormData((prev) => ({
      ...prev,
      name: value || "",
    }));

    if (formErrors.name) {
      setFormErrors((prev) => ({
        ...prev,
        name: null,
      }));
    }
  };

  const handlePriceInclusiveChange = (event) => {
    const isInclusive = event.target.checked;

    setFormData((prev) => ({
      ...prev,
      isPriceInclusive: isInclusive,
    }));

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

    const itemData = {
      name: formData.name.trim(),
      description: formData.description.trim(),
      quantity: parseFloat(formData.quantity),
      rate: parseFloat(formData.rate),
      gstSlab: parseFloat(formData.gstSlab),
      isPriceInclusive: formData.isPriceInclusive,
      hsnCode: formData.hsnCode,
      baseAmount: gstCalculation.baseAmount,
      gstAmount: gstCalculation.gstAmount,
      totalAmount: gstCalculation.totalAmount,
    };

    onSave(itemData);
  };

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

      <DialogContent dividers>
        <Grid container spacing={3}>
          {/* Product Autocomplete - FIX: Allow free text entry */}
          <Grid item xs={12}>
            <Autocomplete
              freeSolo
              options={productOptions}
              getOptionLabel={(option) => {
                if (typeof option === "string") return option;
                return option.label || option.name || "";
              }}
              loading={productLoading}
              inputValue={formData.name}
              onInputChange={(event, value, reason) => {
                // Update name field as user types
                if (reason === "input") {
                  setFormData((prev) => ({
                    ...prev,
                    name: value || "",
                  }));
                  // Trigger product search
                  handleProductSearch(value);
                }
                // Clear error when typing
                if (formErrors.name) {
                  setFormErrors((prev) => ({
                    ...prev,
                    name: null,
                  }));
                }
              }}
              onChange={(event, value) => {
                // Handle product selection from dropdown
                if (typeof value === "object" && value !== null) {
                  handleProductSelect(value);
                } else if (typeof value === "string") {
                  // Manual text entry
                  setFormData((prev) => ({
                    ...prev,
                    name: value,
                  }));
                  setSelectedProduct(null);
                }
              }}
              disabled={loading || isEdit}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Item Name / Search Products"
                  placeholder="Start typing to search or enter new item..."
                  required
                  error={!!formErrors.name}
                  helperText={
                    formErrors.name ||
                    "Search existing products or enter new item name"
                  }
                  InputProps={{
                    ...params.InputProps,
                    startAdornment: (
                      <InputAdornment position="start">
                        <ProductIcon />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <>
                        {productLoading ? (
                          <CircularProgress color="inherit" size={20} />
                        ) : null}
                        {params.InputProps.endAdornment}
                      </>
                    ),
                  }}
                />
              )}
              renderOption={(props, option) => (
                <li {...props}>
                  <Box sx={{ width: "100%" }}>
                    <Typography variant="body1" fontWeight={600}>
                      {option.name}
                    </Typography>
                    {option.description && (
                      <Typography variant="caption" color="text.secondary">
                        {option.description}
                      </Typography>
                    )}
                    <Box
                      sx={{
                        display: "flex",
                        gap: 1,
                        mt: 0.5,
                        flexWrap: "wrap",
                      }}
                    >
                      {option.hsnCode && (
                        <Chip
                          size="small"
                          label={`HSN: ${option.hsnCode}`}
                          variant="outlined"
                        />
                      )}
                      {option.defaultRate > 0 && (
                        <Chip
                          size="small"
                          label={`₹${option.defaultRate}`}
                          color="primary"
                          variant="outlined"
                        />
                      )}
                      {option.usageCount > 0 && (
                        <Chip
                          size="small"
                          label={`Used ${option.usageCount}x`}
                          variant="outlined"
                        />
                      )}
                    </Box>
                  </Box>
                </li>
              )}
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

          {/* HSN Code */}
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

          {/* Quantity */}
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

          {/* Rate */}
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

          {/* GST Calculation Display - Rest remains the same */}
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

          {/* Info alerts - Rest remains the same */}
          {parseFloat(formData.rate) === 0 && (
            <Grid item xs={12}>
              <Alert severity="info" icon={<MoneyIcon />}>
                <Typography variant="body2">
                  <strong>Zero Rate Item:</strong> You can add this item with
                  zero rate and update the price later.
                </Typography>
              </Alert>
            </Grid>
          )}

          {includeGST && parseFloat(formData.rate) > 0 && (
            <Grid item xs={12}>
              <Alert severity="info" icon={<InfoIcon />}>
                <Typography variant="body2">
                  <strong>Pricing Help:</strong>
                  {formData.isPriceInclusive ? (
                    <>
                      The rate includes GST. Base amount and GST will be
                      calculated automatically.
                    </>
                  ) : (
                    <>
                      GST will be added to this base rate for the final amount.
                    </>
                  )}
                </Typography>
              </Alert>
            </Grid>
          )}
        </Grid>
      </DialogContent>

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