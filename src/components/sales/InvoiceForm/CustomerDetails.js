import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Button,
  Card,
  CardContent,
  Avatar,
  Chip,
  Divider,
  Alert,
  useTheme
} from '@mui/material';
import {
  Person as PersonIcon,
  Business as BusinessIcon,
  School as SchoolIcon,
  Add as AddIcon,
} from '@mui/icons-material';

import AutoCompleteField from '../../common/Forms/AutoCompleteField';
import { useCustomer } from '../../../contexts/CustomerContext/CustomerContext';
import { 
  CUSTOMER_TYPES, 
  CUSTOMER_CATEGORIES 
} from '../../../utils/constants/appConstants';

/**
 * Customer details component for invoice form
 * @param {Object} props
 * @param {Object} props.selectedCustomer - Currently selected customer
 * @param {function} props.onCustomerSelect - Customer selection handler
 * @param {function} props.onAddNewCustomer - Add new customer handler
 * @param {string} props.error - Error message
 * @param {boolean} props.required - Whether selection is required
 */
const CustomerDetails = ({
  selectedCustomer,
  onCustomerSelect,
  onAddNewCustomer,
  error,
  required = true
}) => {
  const theme = useTheme();
  const { customers, getCustomers, loading } = useCustomer();
  
  const [customerOptions, setCustomerOptions] = useState([]);
  const [searchValue, setSearchValue] = useState('');

  // Load customers on mount
  useEffect(() => {
    const loadCustomers = async () => {
      try {
        await getCustomers(); // Load more customers for search
      } catch (error) {
        console.error('Error loading customers:', error);
      }
    };

    loadCustomers();
  }, [getCustomers]);

  // Format customers for autocomplete
  useEffect(() => {
    const formattedCustomers = customers.map(customer => ({
      ...customer,
      label: customer.name,
      subtitle: `${customer.type?.charAt(0).toUpperCase() + customer.type?.slice(1)} • ${customer.category?.charAt(0).toUpperCase() + customer.category?.slice(1)}`,
      description: customer.phone || customer.email,
      avatar: getCategoryIcon(customer.category)
    }));

    setCustomerOptions(formattedCustomers);
  }, [customers]);

  // Get category icon
  const getCategoryIcon = (category) => {
    switch (category) {
      case CUSTOMER_CATEGORIES.FIRM:
        return <BusinessIcon />;
      case CUSTOMER_CATEGORIES.SCHOOL:
        return <SchoolIcon />;
      default:
        return <PersonIcon />;
    }
  };

  // Get type color
  const getTypeColor = (type) => {
    return type === CUSTOMER_TYPES.WHOLESALER 
      ? theme.palette.primary.main
      : theme.palette.secondary.main;
  };

  // Handle customer selection
  const handleCustomerSelect = (value) => {
    const customer = customerOptions.find(c => c.id === value);
    if (onCustomerSelect && customer) {
      onCustomerSelect(customer);
    }
  };

  // Handle search input change
  const handleInputChange = (value, reason) => {
    setSearchValue(value);
    
    // Optionally trigger search API call for dynamic loading
    if (reason === 'input' && value.length > 2) {
      // Implement dynamic customer search here if needed
    }
  };

  // Handle add new customer
  const handleAddNew = () => {
    if (onAddNewCustomer) {
      onAddNewCustomer();
    }
  };

  return (
    <Box>
      <Typography variant="h6" fontWeight={600} gutterBottom>
        Customer Details
        {required && <span style={{ color: theme.palette.error.main }}>*</span>}
      </Typography>

      {/* Customer Selection */}
      <Box sx={{ mb: 3 }}>
        <AutoCompleteField
          options={customerOptions}
          value={selectedCustomer?.id || ''}
          onChange={handleCustomerSelect}
          onInputChange={handleInputChange}
          label="Select Customer"
          placeholder="Search customers by name, phone, or email..."
          loading={loading}
          error={error}
          required={required}
          noOptionsText="No customers found"
          getOptionLabel={(option) => option.name || option}
          getOptionValue={(option) => option.id || option}
          renderOption={(props, option) => (
            <li {...props}>
              <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                <Avatar 
                  sx={{ 
                    width: 32, 
                    height: 32, 
                    mr: 1,
                    backgroundColor: getTypeColor(option.type) + '20',
                    color: getTypeColor(option.type)
                  }}
                >
                  {getCategoryIcon(option.category)}
                </Avatar>
                
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body1">
                    {option.name}
                  </Typography>
                  {option.subtitle && (
                    <Typography variant="body2" color="text.secondary">
                      {option.subtitle}
                    </Typography>
                  )}
                  {option.description && (
                    <Typography variant="caption" color="text.secondary">
                      {option.description}
                    </Typography>
                  )}
                </Box>
              </Box>
            </li>
          )}
          sx={{ mb: 2 }}
        />

        {/* Add New Customer Button */}
        <Button
          variant="outlined"
          startIcon={<AddIcon />}
          onClick={handleAddNew}
          size="small"
        >
          Add New Customer
        </Button>
      </Box>

      {/* Selected Customer Details */}
      {selectedCustomer && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <Avatar
                sx={{
                  width: 48,
                  height: 48,
                  backgroundColor: getTypeColor(selectedCustomer.type) + '20',
                  color: getTypeColor(selectedCustomer.type)
                }}
              >
                {getCategoryIcon(selectedCustomer.category)}
              </Avatar>
              
              <Box sx={{ flex: 1 }}>
                <Typography variant="h6" fontWeight={600}>
                  {selectedCustomer.name}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                  <Chip
                    label={selectedCustomer.type === CUSTOMER_TYPES.WHOLESALER ? 'Wholesaler' : 'Retailer'}
                    size="small"
                    color={selectedCustomer.type === CUSTOMER_TYPES.WHOLESALER ? 'primary' : 'secondary'}
                  />
                  <Chip
                    label={selectedCustomer.category?.charAt(0).toUpperCase() + selectedCustomer.category?.slice(1)}
                    size="small"
                    variant="outlined"
                  />
                </Box>
              </Box>
            </Box>

            <Divider sx={{ my: 2 }} />

            <Grid container spacing={2}>
              {/* Contact Information */}
              {selectedCustomer.phone && (
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Phone
                  </Typography>
                  <Typography variant="body1" fontWeight={500}>
                    {selectedCustomer.phone}
                  </Typography>
                </Grid>
              )}

              {selectedCustomer.email && (
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Email
                  </Typography>
                  <Typography variant="body1" fontWeight={500}>
                    {selectedCustomer.email}
                  </Typography>
                </Grid>
              )}

              {/* Address */}
              {selectedCustomer.address && (
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary">
                    Address
                  </Typography>
                  <Typography variant="body1" fontWeight={500}>
                    {[
                      selectedCustomer.address,
                      selectedCustomer.city,
                      selectedCustomer.state,
                      selectedCustomer.pincode
                    ].filter(Boolean).join(', ')}
                  </Typography>
                </Grid>
              )}

              {/* GST Number */}
              {selectedCustomer.gstNumber && (
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    GST Number
                  </Typography>
                  <Typography variant="body1" fontWeight={500}>
                    {selectedCustomer.gstNumber}
                  </Typography>
                </Grid>
              )}

              {/* Customer Stats */}
              {selectedCustomer.totalOrders !== undefined && (
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Previous Orders
                  </Typography>
                  <Typography variant="body1" fontWeight={500}>
                    {selectedCustomer.totalOrders} orders
                  </Typography>
                </Grid>
              )}
            </Grid>

            {/* Customer Type Benefits */}
            {selectedCustomer.type === CUSTOMER_TYPES.WHOLESALER && (
              <Alert severity="info" sx={{ mt: 2 }}>
                <Typography variant="body2">
                  <strong>Wholesaler Benefits:</strong> Volume discounts and special pricing may apply to this customer.
                </Typography>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Help Text */}
      {!selectedCustomer && customerOptions.length === 0 && !loading && (
        <Alert severity="info">
          <Typography variant="body2">
            No customers found. Add your first customer to create invoices.
          </Typography>
        </Alert>
      )}
    </Box>
  );
};

export default CustomerDetails;