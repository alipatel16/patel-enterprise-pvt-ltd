import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  FormControlLabel,
  RadioGroup,
  Radio,
  Alert,
  Button,
  IconButton,
  Chip,
  useTheme
} from '@mui/material';
import {
  LocalShipping as DeliveryIcon,
  Schedule as ScheduleIcon,
  Home as HomeIcon,
  Store as StoreIcon,
  LocationOn as LocationIcon,
  Person as PersonIcon,
  Phone as PhoneIcon,
  MyLocation as MyLocationIcon
} from '@mui/icons-material';

import FormField from '../../common/Forms/FormField';
import DatePicker from '../../common/Forms/DatePicker';
import { 
  DELIVERY_STATUS,
  DELIVERY_TYPES 
} from '../../../utils/constants/appConstants';
import { formatDate, formatTime } from '../../../utils/helpers/formatHelpers';

/**
 * Delivery details component for invoice form
 * @param {Object} props
 * @param {Object} props.deliveryData - Delivery data
 * @param {function} props.onChange - Change handler
 * @param {Object} props.customer - Customer data for default address
 * @param {string} props.error - Error message
 * @param {boolean} props.readOnly - Whether form is read-only
 */
const DeliveryDetails = ({
  deliveryData = {},
  onChange,
  customer = {},
  error,
  readOnly = false
}) => {
  const theme = useTheme();

  // Default delivery data
  const defaultDeliveryData = {
    type: 'store_pickup',
    status: DELIVERY_STATUS.PENDING,
    scheduledDate: null,
    scheduledTime: null,
    address: '',
    city: '',
    state: '',
    pincode: '',
    contactPerson: '',
    contactPhone: '',
    instructions: '',
    charges: 0
  };

  const [formData, setFormData] = useState({ ...defaultDeliveryData, ...deliveryData });

  // Initialize with customer data
  useEffect(() => {
    if (customer && Object.keys(customer).length > 0 && !deliveryData.address) {
      setFormData(prev => ({
        ...prev,
        address: customer.address || '',
        city: customer.city || '',
        state: customer.state || '',
        pincode: customer.pincode || '',
        contactPerson: customer.name || '',
        contactPhone: customer.phone || ''
      }));
    }
  }, [customer, deliveryData.address]);

  // Update parent when form data changes
  useEffect(() => {
    onChange(formData);
  }, [formData, onChange]);

  // Handle field change
  const handleChange = (field) => (value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle delivery type change
  const handleTypeChange = (event) => {
    const type = event.target.value;
    setFormData(prev => ({
      ...prev,
      type,
      charges: type === 'home_delivery' ? prev.charges || 50 : 0
    }));
  };

  // Use customer address
  const handleUseCustomerAddress = () => {
    if (customer) {
      setFormData(prev => ({
        ...prev,
        address: customer.address || '',
        city: customer.city || '',
        state: customer.state || '',
        pincode: customer.pincode || '',
        contactPerson: customer.name || '',
        contactPhone: customer.phone || ''
      }));
    }
  };

  // Get current location (if browser supports)
  const handleGetCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          // In a real app, you'd reverse geocode these coordinates
          console.log('Location:', latitude, longitude);
          // For demo, just show coordinates
          setFormData(prev => ({
            ...prev,
            instructions: prev.instructions + `\nCoordinates: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
          }));
        },
        (error) => {
          console.error('Location error:', error);
          alert('Unable to get location. Please enter address manually.');
        }
      );
    } else {
      alert('Geolocation is not supported by this browser.');
    }
  };

  // Delivery type options
  const deliveryTypes = [
    {
      value: 'store_pickup',
      label: 'Store Pickup',
      description: 'Customer will collect from store',
      icon: <StoreIcon />,
      charges: 0
    },
    {
      value: 'home_delivery',
      label: 'Home Delivery',
      description: 'Deliver to customer address',
      icon: <HomeIcon />,
      charges: 50
    }
  ];

  // Time slots for delivery
  const timeSlots = [
    { value: '09:00-12:00', label: '9 AM - 12 PM' },
    { value: '12:00-15:00', label: '12 PM - 3 PM' },
    { value: '15:00-18:00', label: '3 PM - 6 PM' },
    { value: '18:00-21:00', label: '6 PM - 9 PM' }
  ];

  return (
    <Box>
      <Typography variant="h6" fontWeight={600} gutterBottom>
        Delivery Details
      </Typography>

      {/* Delivery Type */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="subtitle1" fontWeight={600} gutterBottom>
            Delivery Type
          </Typography>

          <RadioGroup
            value={formData.type}
            onChange={handleTypeChange}
            disabled={readOnly}
          >
            {deliveryTypes.map((type) => (
              <FormControlLabel
                key={type.value}
                value={type.value}
                control={<Radio />}
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 1 }}>
                    <Box sx={{ color: theme.palette.primary.main }}>
                      {type.icon}
                    </Box>
                    <Box>
                      <Typography variant="body1" fontWeight={500}>
                        {type.label}
                        {type.charges > 0 && (
                          <Chip
                            label={`+₹${type.charges}`}
                            size="small"
                            sx={{ ml: 1 }}
                          />
                        )}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {type.description}
                      </Typography>
                    </Box>
                  </Box>
                }
                sx={{ 
                  m: 0,
                  p: 1,
                  borderRadius: 1,
                  border: formData.type === type.value ? `1px solid ${theme.palette.primary.main}` : '1px solid transparent',
                  backgroundColor: formData.type === type.value ? theme.palette.primary.main + '08' : 'transparent'
                }}
              />
            ))}
          </RadioGroup>

          {/* Delivery Charges */}
          {formData.type === 'home_delivery' && (
            <Box sx={{ mt: 2 }}>
              <FormField
                type="number"
                label="Delivery Charges"
                value={formData.charges}
                onChange={handleChange('charges')}
                disabled={readOnly}
                inputProps={{ min: 0, step: 1 }}
                startAdornment="₹"
                helperText="Additional charges for home delivery"
              />
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Delivery Schedule */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="subtitle1" fontWeight={600} gutterBottom>
            {formData.type === 'store_pickup' ? 'Pickup Schedule' : 'Delivery Schedule'}
          </Typography>

          <Grid container spacing={2}>
            {/* Scheduled Date */}
            <Grid item xs={12} sm={6}>
              <DatePicker
                label={formData.type === 'store_pickup' ? 'Pickup Date' : 'Delivery Date'}
                value={formData.scheduledDate}
                onChange={handleChange('scheduledDate')}
                disabled={readOnly}
                minDate={new Date()}
                helperText="Select preferred date"
              />
            </Grid>

            {/* Scheduled Time */}
            <Grid item xs={12} sm={6}>
              <FormField
                type="select"
                label="Time Slot"
                value={formData.scheduledTime}
                onChange={handleChange('scheduledTime')}
                disabled={readOnly}
                options={timeSlots}
                helperText="Select preferred time slot"
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Delivery Address (for home delivery) */}
      {formData.type === 'home_delivery' && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="subtitle1" fontWeight={600}>
                Delivery Address
              </Typography>
              
              <Box sx={{ display: 'flex', gap: 1 }}>
                {customer?.address && (
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={handleUseCustomerAddress}
                    disabled={readOnly}
                    startIcon={<PersonIcon />}
                  >
                    Use Customer Address
                  </Button>
                )}
                
                <IconButton
                  size="small"
                  onClick={handleGetCurrentLocation}
                  disabled={readOnly}
                  title="Get Current Location"
                >
                  <MyLocationIcon />
                </IconButton>
              </Box>
            </Box>

            <Grid container spacing={2}>
              {/* Address */}
              <Grid item xs={12}>
                <FormField
                  label="Address"
                  value={formData.address}
                  onChange={handleChange('address')}
                  disabled={readOnly}
                  required={formData.type === 'home_delivery'}
                  multiline
                  rows={2}
                  placeholder="Enter complete address with landmarks"
                  startAdornment={<LocationIcon color="action" />}
                />
              </Grid>

              {/* City */}
              <Grid item xs={12} sm={4}>
                <FormField
                  label="City"
                  value={formData.city}
                  onChange={handleChange('city')}
                  disabled={readOnly}
                  required={formData.type === 'home_delivery'}
                />
              </Grid>

              {/* State */}
              <Grid item xs={12} sm={4}>
                <FormField
                  label="State"
                  value={formData.state}
                  onChange={handleChange('state')}
                  disabled={readOnly}
                  required={formData.type === 'home_delivery'}
                />
              </Grid>

              {/* Pincode */}
              <Grid item xs={12} sm={4}>
                <FormField
                  label="Pincode"
                  value={formData.pincode}
                  onChange={handleChange('pincode')}
                  disabled={readOnly}
                  required={formData.type === 'home_delivery'}
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Contact Information */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="subtitle1" fontWeight={600} gutterBottom>
            Contact Information
          </Typography>

          <Grid container spacing={2}>
            {/* Contact Person */}
            <Grid item xs={12} sm={6}>
              <FormField
                label="Contact Person"
                value={formData.contactPerson}
                onChange={handleChange('contactPerson')}
                disabled={readOnly}
                required
                startAdornment={<PersonIcon color="action" />}
                helperText="Person to contact for delivery/pickup"
              />
            </Grid>

            {/* Contact Phone */}
            <Grid item xs={12} sm={6}>
              <FormField
                label="Contact Phone"
                value={formData.contactPhone}
                onChange={handleChange('contactPhone')}
                disabled={readOnly}
                required
                startAdornment={<PhoneIcon color="action" />}
                helperText="Phone number for delivery coordination"
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Special Instructions */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="subtitle1" fontWeight={600} gutterBottom>
            Special Instructions (Optional)
          </Typography>

          <FormField
            label="Delivery Instructions"
            value={formData.instructions}
            onChange={handleChange('instructions')}
            disabled={readOnly}
            multiline
            rows={3}
            placeholder="Any special instructions for delivery/pickup (e.g., gate code, floor number, best time to call, etc.)"
          />
        </CardContent>
      </Card>

      {/* Delivery Summary */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="subtitle1" fontWeight={600} gutterBottom>
            {formData.type === 'store_pickup' ? 'Pickup Summary' : 'Delivery Summary'}
          </Typography>

          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary">
                Type
              </Typography>
              <Typography variant="body1" fontWeight={500}>
                {formData.type === 'store_pickup' ? 'Store Pickup' : 'Home Delivery'}
              </Typography>
            </Grid>

            {formData.scheduledDate && (
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">
                  Scheduled Date & Time
                </Typography>
                <Typography variant="body1" fontWeight={500}>
                  {formatDate(formData.scheduledDate)}
                  {formData.scheduledTime && ` at ${formData.scheduledTime}`}
                </Typography>
              </Grid>
            )}

            {formData.charges > 0 && (
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">
                  Delivery Charges
                </Typography>
                <Typography variant="body1" fontWeight={500} color="primary">
                  ₹{formData.charges}
                </Typography>
              </Grid>
            )}

            {formData.type === 'home_delivery' && formData.address && (
              <Grid item xs={12}>
                <Typography variant="body2" color="text.secondary">
                  Delivery Address
                </Typography>
                <Typography variant="body1" fontWeight={500}>
                  {[
                    formData.address,
                    formData.city,
                    formData.state,
                    formData.pincode
                  ].filter(Boolean).join(', ')}
                </Typography>
              </Grid>
            )}
          </Grid>

          {/* Store Address for Pickup */}
          {formData.type === 'store_pickup' && (
            <Alert severity="info" sx={{ mt: 2 }}>
              <Typography variant="body2">
                <strong>Store Address:</strong><br />
                Patel Enterprise Pvt Ltd<br />
                123 Business Street, Ahmedabad<br />
                Gujarat - 380001<br />
                Phone: +91 79 1234 5678
              </Typography>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Alert severity="error">
          {error}
        </Alert>
      )}
    </Box>
  );
};

export default DeliveryDetails;