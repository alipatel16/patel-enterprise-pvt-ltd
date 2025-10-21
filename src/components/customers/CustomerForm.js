import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Grid,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Alert,
  Divider,
  InputAdornment,
  useTheme,
  useMediaQuery,
  CircularProgress
} from '@mui/material';
import {
  Person as PersonIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  LocationOn as LocationIcon,
  Business as BusinessIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Description as DescriptionIcon
} from '@mui/icons-material';

import { validateCustomerData, cleanCustomerData } from '../../utils/validation/customerValidation';
import { CUSTOMER_TYPES, CUSTOMER_CATEGORIES } from '../../utils/constants/appConstants';

/**
 * CustomerForm component for creating and editing customers
 * @param {Object} props
 * @param {Object} props.customer - Existing customer data (for edit mode)
 * @param {boolean} props.isEdit - Whether this is edit mode
 * @param {Function} props.onSubmit - Submit callback
 * @param {Function} props.onCancel - Cancel callback
 * @param {boolean} props.loading - Loading state
 * @param {string} props.error - Error message
 * @returns {React.ReactElement}
 */
const CustomerForm = ({
  customer = null,
  isEdit = false,
  onSubmit,
  onCancel,
  loading = false,
  error = null
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    customerType: '',
    category: '',
    gstNumber: '',
    purpose: '' // NEW FIELD
  });

  const [formErrors, setFormErrors] = useState({});
  const [touched, setTouched] = useState({});

  // Initialize form data
  useEffect(() => {
    if (isEdit && customer) {
      setFormData({
        name: customer.name || '',
        phone: customer.phone || '',
        email: customer.email || '',
        address: customer.address || '',
        city: customer.city || '',
        state: customer.state || '',
        pincode: customer.pincode || '',
        customerType: customer.customerType || '',
        category: customer.category || '',
        gstNumber: customer.gstNumber || '',
        purpose: customer.purpose || '' // NEW FIELD
      });
    }
  }, [isEdit, customer]);

  // Handle input change
  const handleChange = (field) => (event) => {
    const value = event.target.value;
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear field error when user starts typing
    if (formErrors[field]) {
      setFormErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  // Handle field blur
  const handleBlur = (field) => () => {
    setTouched(prev => ({
      ...prev,
      [field]: true
    }));

    // Validate field on blur
    const { errors } = validateCustomerData({ [field]: formData[field] }, true);
    if (errors[field]) {
      setFormErrors(prev => ({
        ...prev,
        [field]: errors[field]
      }));
    }
  };

  // Handle form submission
  const handleSubmit = async (event) => {
    event.preventDefault();

    // Mark all fields as touched
    const allFields = Object.keys(formData);
    setTouched(allFields.reduce((acc, field) => ({ ...acc, [field]: true }), {}));

    // Validate form
    const { errors, isValid } = validateCustomerData(formData, isEdit);
    setFormErrors(errors);

    if (!isValid) {
      return;
    }

    // Clean and submit data
    const cleanedData = cleanCustomerData(formData);
    
    if (onSubmit) {
      await onSubmit(cleanedData);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
  };

  // Customer type options
  const customerTypeOptions = [
    { value: CUSTOMER_TYPES.WHOLESALER, label: 'Wholesaler' },
    { value: CUSTOMER_TYPES.RETAILER, label: 'Retailer' }
  ];

  // Category options
  const categoryOptions = [
    { value: CUSTOMER_CATEGORIES.INDIVIDUAL, label: 'Individual' },
    { value: CUSTOMER_CATEGORIES.FIRM, label: 'Firm' },
    { value: CUSTOMER_CATEGORIES.SCHOOL, label: 'School' }
  ];

  return (
    <Box component="form" onSubmit={handleSubmit}>
      <Card>
        <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
          {/* Form Header */}
          <Box mb={3}>
            <Typography variant="h6" gutterBottom>
              {isEdit ? 'Edit Customer' : 'Add New Customer'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {isEdit 
                ? 'Update customer information and contact details.'
                : 'Enter customer information and contact details.'
              }
            </Typography>
          </Box>

          {/* Error Alert */}
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {/* Basic Information */}
          <Box mb={3}>
            <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600 }}>
              Basic Information
            </Typography>
            <Grid container spacing={3}>
              {/* Name */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Customer Name"
                  value={formData.name}
                  onChange={handleChange('name')}
                  onBlur={handleBlur('name')}
                  error={touched.name && !!formErrors.name}
                  helperText={touched.name && formErrors.name}
                  required
                  disabled={loading}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PersonIcon />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>

              {/* Phone */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Phone Number"
                  value={formData.phone}
                  onChange={handleChange('phone')}
                  onBlur={handleBlur('phone')}
                  error={touched.phone && !!formErrors.phone}
                  helperText={touched.phone && formErrors.phone}
                  required
                  disabled={loading}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PhoneIcon />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>

              {/* Email */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Email Address"
                  type="email"
                  value={formData.email}
                  onChange={handleChange('email')}
                  onBlur={handleBlur('email')}
                  error={touched.email && !!formErrors.email}
                  helperText={touched.email && formErrors.email}
                  disabled={loading}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <EmailIcon />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>

              {/* Customer Type */}
              <Grid item xs={12} sm={6}>
                <FormControl 
                  fullWidth 
                  error={touched.customerType && !!formErrors.customerType}
                  required
                >
                  <InputLabel>Customer Type</InputLabel>
                  <Select
                    value={formData.customerType}
                    onChange={handleChange('customerType')}
                    onBlur={handleBlur('customerType')}
                    label="Customer Type"
                    disabled={loading}
                  >
                    {customerTypeOptions.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                  {touched.customerType && formErrors.customerType && (
                    <FormHelperText>{formErrors.customerType}</FormHelperText>
                  )}
                </FormControl>
              </Grid>

              {/* Category */}
              <Grid item xs={12} sm={6}>
                <FormControl 
                  fullWidth 
                  error={touched.category && !!formErrors.category}
                  required
                >
                  <InputLabel>Category</InputLabel>
                  <Select
                    value={formData.category}
                    onChange={handleChange('category')}
                    onBlur={handleBlur('category')}
                    label="Category"
                    disabled={loading}
                  >
                    {categoryOptions.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                  {touched.category && formErrors.category && (
                    <FormHelperText>{formErrors.category}</FormHelperText>
                  )}
                </FormControl>
              </Grid>

              {/* GST Number */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="GST Number"
                  value={formData.gstNumber}
                  onChange={handleChange('gstNumber')}
                  onBlur={handleBlur('gstNumber')}
                  error={touched.gstNumber && !!formErrors.gstNumber}
                  helperText={touched.gstNumber && (formErrors.gstNumber || 'Optional - Format: 22AAAAA0000A1Z5')}
                  disabled={loading}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <BusinessIcon />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>

              {/* Purpose for Visit - NEW FIELD */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Purpose for Visit"
                  multiline
                  rows={2}
                  value={formData.purpose}
                  onChange={handleChange('purpose')}
                  onBlur={handleBlur('purpose')}
                  error={touched.purpose && !!formErrors.purpose}
                  helperText={touched.purpose && (formErrors.purpose || 'Optional - Reason for visit or business purpose')}
                  disabled={loading}
                  placeholder="e.g., Looking for office furniture, Inquiring about products, Follow-up meeting..."
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start" sx={{ alignSelf: 'flex-start', mt: 1 }}>
                        <DescriptionIcon />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
            </Grid>
          </Box>

          <Divider sx={{ my: 3 }} />

          {/* Address Information */}
          <Box mb={3}>
            <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600 }}>
              Address Information
            </Typography>
            <Grid container spacing={3}>
              {/* Address */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Address"
                  multiline
                  rows={3}
                  value={formData.address}
                  onChange={handleChange('address')}
                  onBlur={handleBlur('address')}
                  error={touched.address && !!formErrors.address}
                  helperText={touched.address && formErrors.address}
                  required
                  disabled={loading}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start" sx={{ alignSelf: 'flex-start', mt: 1 }}>
                        <LocationIcon />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>

              {/* City */}
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="City"
                  value={formData.city}
                  onChange={handleChange('city')}
                  onBlur={handleBlur('city')}
                  error={touched.city && !!formErrors.city}
                  helperText={touched.city && formErrors.city}
                  disabled={loading}
                />
              </Grid>

              {/* State */}
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="State"
                  value={formData.state}
                  onChange={handleChange('state')}
                  onBlur={handleBlur('state')}
                  error={touched.state && !!formErrors.state}
                  helperText={touched.state && formErrors.state}
                  disabled={loading}
                />
              </Grid>

              {/* PIN Code */}
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="PIN Code"
                  value={formData.pincode}
                  onChange={handleChange('pincode')}
                  onBlur={handleBlur('pincode')}
                  error={touched.pincode && !!formErrors.pincode}
                  helperText={touched.pincode && formErrors.pincode}
                  disabled={loading}
                />
              </Grid>
            </Grid>
          </Box>

          {/* Form Actions */}
          <Box 
            display="flex" 
            gap={2} 
            justifyContent="flex-end"
            flexDirection={{ xs: 'column', sm: 'row' }}
          >
            <Button
              variant="outlined"
              onClick={handleCancel}
              disabled={loading}
              size="large"
              startIcon={<CancelIcon />}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={loading}
              size="large"
              startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
            >
              {isEdit ? 'Update Customer' : 'Add Customer'}
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default CustomerForm;