import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  IconButton,
  Collapse,
  Divider,
  Chip,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  FilterList as FilterIcon,
  Clear as ClearIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Search as SearchIcon
} from '@mui/icons-material';

import FormField from '../../common/Forms/FormField';
import DatePicker from '../../common/Forms/DatePicker';
import AutoCompleteField from '../../common/Forms/AutoCompleteField';
import { 
  PAYMENT_STATUS,
  DELIVERY_STATUS,
  CUSTOMER_TYPES 
} from '../../../utils/constants/appConstants';
import { formatDate } from '../../../utils/helpers/formatHelpers';

/**
 * Sales filters component for filtering invoices/sales
 * @param {Object} props
 * @param {Object} props.filters - Current filter values
 * @param {function} props.onFiltersChange - Filter change handler
 * @param {array} props.customers - Available customers for filtering
 * @param {boolean} props.loading - Loading state
 * @param {function} props.onReset - Reset filters handler
 */
const SalesFilters = ({
  filters = {},
  onFiltersChange,
  customers = [],
  loading = false,
  onReset
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [expanded, setExpanded] = useState(!isMobile);
  const [tempFilters, setTempFilters] = useState(filters);

  // Default filters
  const defaultFilters = {
    search: '',
    customer: '',
    paymentStatus: '',
    deliveryStatus: '',
    customerType: '',
    dateFrom: null,
    dateTo: null,
    amountMin: '',
    amountMax: '',
    sortBy: 'date',
    sortOrder: 'desc'
  };

  // Handle filter change
  const handleFilterChange = (field) => (value) => {
    const updatedFilters = {
      ...tempFilters,
      [field]: value
    };
    setTempFilters(updatedFilters);
    
    // Apply filters immediately for some fields, debounce for others
    if (['paymentStatus', 'deliveryStatus', 'customerType', 'sortBy', 'sortOrder'].includes(field)) {
      onFiltersChange(updatedFilters);
    }
  };

  // Apply filters (for fields that need explicit apply)
  const handleApplyFilters = () => {
    onFiltersChange(tempFilters);
  };

  // Reset filters
  const handleResetFilters = () => {
    const resetFilters = { ...defaultFilters };
    setTempFilters(resetFilters);
    onFiltersChange(resetFilters);
    if (onReset) onReset();
  };

  // Toggle expanded state
  const handleToggleExpanded = () => {
    setExpanded(prev => !prev);
  };

  // Get active filter count
  const getActiveFilterCount = () => {
    return Object.entries(tempFilters).filter(([key, value]) => {
      if (key === 'sortBy' || key === 'sortOrder') return false;
      return value !== '' && value !== null && value !== undefined;
    }).length;
  };

  const activeFilterCount = getActiveFilterCount();

  // Filter options
  const paymentStatusOptions = [
    { value: '', label: 'All Payment Status' },
    { value: PAYMENT_STATUS.PAID, label: 'Paid' },
    { value: PAYMENT_STATUS.PENDING, label: 'Pending' },
    { value: PAYMENT_STATUS.EMI, label: 'EMI' }
  ];

  const deliveryStatusOptions = [
    { value: '', label: 'All Delivery Status' },
    { value: DELIVERY_STATUS.DELIVERED, label: 'Delivered' },
    { value: DELIVERY_STATUS.SCHEDULED, label: 'Scheduled' },
    { value: DELIVERY_STATUS.PENDING, label: 'Pending' }
  ];

  const customerTypeOptions = [
    { value: '', label: 'All Customer Types' },
    { value: CUSTOMER_TYPES.WHOLESALER, label: 'Wholesaler' },
    { value: CUSTOMER_TYPES.RETAILER, label: 'Retailer' }
  ];

  const sortOptions = [
    { value: 'date', label: 'Date' },
    { value: 'amount', label: 'Amount' },
    { value: 'customer', label: 'Customer' },
    { value: 'status', label: 'Payment Status' }
  ];

  const sortOrderOptions = [
    { value: 'desc', label: 'Descending' },
    { value: 'asc', label: 'Ascending' }
  ];

  return (
    <Card>
      <CardContent sx={{ pb: expanded ? 3 : 2 }}>
        {/* Filter Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: expanded ? 3 : 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <FilterIcon color="primary" />
            <Typography variant="h6" fontWeight={600}>
              Filters
            </Typography>
            {activeFilterCount > 0 && (
              <Chip
                label={activeFilterCount}
                size="small"
                color="primary"
                sx={{ minWidth: 24, height: 20 }}
              />
            )}
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {activeFilterCount > 0 && (
              <Button
                variant="outlined"
                size="small"
                startIcon={<ClearIcon />}
                onClick={handleResetFilters}
                disabled={loading}
              >
                Clear
              </Button>
            )}
            
            <IconButton
              onClick={handleToggleExpanded}
              size="small"
            >
              {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          </Box>
        </Box>

        {/* Filter Content */}
        <Collapse in={expanded}>
          <Grid container spacing={2}>
            {/* Search */}
            <Grid item xs={12} md={6} lg={4}>
              <FormField
                label="Search"
                value={tempFilters.search}
                onChange={handleFilterChange('search')}
                placeholder="Search by invoice number, customer name..."
                startAdornment={<SearchIcon color="action" />}
                disabled={loading}
              />
            </Grid>

            {/* Customer */}
            <Grid item xs={12} md={6} lg={4}>
              <AutoCompleteField
                label="Customer"
                options={[{ id: '', name: 'All Customers' }, ...customers]}
                value={tempFilters.customer}
                onChange={handleFilterChange('customer')}
                getOptionLabel={(option) => option.name || option}
                getOptionValue={(option) => option.id || option}
                loading={loading}
                placeholder="Select customer"
              />
            </Grid>

            {/* Payment Status */}
            <Grid item xs={12} md={6} lg={4}>
              <FormField
                type="select"
                label="Payment Status"
                value={tempFilters.paymentStatus}
                onChange={handleFilterChange('paymentStatus')}
                options={paymentStatusOptions}
                disabled={loading}
              />
            </Grid>

            {/* Delivery Status */}
            <Grid item xs={12} md={6} lg={4}>
              <FormField
                type="select"
                label="Delivery Status"
                value={tempFilters.deliveryStatus}
                onChange={handleFilterChange('deliveryStatus')}
                options={deliveryStatusOptions}
                disabled={loading}
              />
            </Grid>

            {/* Customer Type */}
            <Grid item xs={12} md={6} lg={4}>
              <FormField
                type="select"
                label="Customer Type"
                value={tempFilters.customerType}
                onChange={handleFilterChange('customerType')}
                options={customerTypeOptions}
                disabled={loading}
              />
            </Grid>

            {/* Date From */}
            <Grid item xs={12} md={6} lg={4}>
              <DatePicker
                label="From Date"
                value={tempFilters.dateFrom}
                onChange={handleFilterChange('dateFrom')}
                disabled={loading}
                maxDate={tempFilters.dateTo || new Date()}
                format='dd/MM/yyyy'
              />
            </Grid>

            {/* Date To */}
            <Grid item xs={12} md={6} lg={4}>
              <DatePicker
                label="To Date"
                value={tempFilters.dateTo}
                onChange={handleFilterChange('dateTo')}
                disabled={loading}
                minDate={tempFilters.dateFrom}
                maxDate={new Date()}
                format='dd/MM/yyyy'
              />
            </Grid>

            {/* Amount Range */}
            <Grid item xs={12} md={6} lg={4}>
              <Grid container spacing={1}>
                <Grid item xs={6}>
                  <FormField
                    type="number"
                    label="Min Amount"
                    value={tempFilters.amountMin}
                    onChange={handleFilterChange('amountMin')}
                    inputProps={{ min: 0, step: 1 }}
                    startAdornment="₹"
                    disabled={loading}
                  />
                </Grid>
                <Grid item xs={6}>
                  <FormField
                    type="number"
                    label="Max Amount"
                    value={tempFilters.amountMax}
                    onChange={handleFilterChange('amountMax')}
                    inputProps={{ min: 0, step: 1 }}
                    startAdornment="₹"
                    disabled={loading}
                  />
                </Grid>
              </Grid>
            </Grid>

            {/* Sort By */}
            <Grid item xs={12} md={6} lg={4}>
              <FormField
                type="select"
                label="Sort By"
                value={tempFilters.sortBy}
                onChange={handleFilterChange('sortBy')}
                options={sortOptions}
                disabled={loading}
              />
            </Grid>

            {/* Sort Order */}
            <Grid item xs={12} md={6} lg={4}>
              <FormField
                type="select"
                label="Sort Order"
                value={tempFilters.sortOrder}
                onChange={handleFilterChange('sortOrder')}
                options={sortOrderOptions}
                disabled={loading}
              />
            </Grid>
          </Grid>

          {/* Action Buttons */}
          <Box sx={{ display: 'flex', gap: 2, mt: 3, justifyContent: 'flex-end' }}>
            <Button
              variant="outlined"
              onClick={handleResetFilters}
              disabled={loading || activeFilterCount === 0}
              startIcon={<ClearIcon />}
            >
              Reset
            </Button>
            
            <Button
              variant="contained"
              onClick={handleApplyFilters}
              disabled={loading}
              startIcon={<SearchIcon />}
            >
              Apply Filters
            </Button>
          </Box>

          {/* Active Filters Summary */}
          {activeFilterCount > 0 && (
            <>
              <Divider sx={{ my: 2 }} />
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Active Filters:
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {Object.entries(tempFilters).map(([key, value]) => {
                    if (!value || value === '' || ['sortBy', 'sortOrder'].includes(key)) return null;
                    
                    let displayValue = value;
                    let displayLabel = key;

                    // Format display values
                    switch (key) {
                      case 'dateFrom':
                        displayLabel = 'From';
                        displayValue = formatDate(value);
                        break;
                      case 'dateTo':
                        displayLabel = 'To';
                        displayValue = formatDate(value);
                        break;
                      case 'customer':
                        displayLabel = 'Customer';
                        const customer = customers.find(c => c.id === value);
                        displayValue = customer?.name || value;
                        break;
                      case 'paymentStatus':
                        displayLabel = 'Payment';
                        displayValue = value.charAt(0).toUpperCase() + value.slice(1);
                        break;
                      case 'deliveryStatus':
                        displayLabel = 'Delivery';
                        displayValue = value.charAt(0).toUpperCase() + value.slice(1);
                        break;
                      case 'customerType':
                        displayLabel = 'Type';
                        displayValue = value.charAt(0).toUpperCase() + value.slice(1);
                        break;
                      case 'amountMin':
                        displayLabel = 'Min';
                        displayValue = `₹${value}`;
                        break;
                      case 'amountMax':
                        displayLabel = 'Max';
                        displayValue = `₹${value}`;
                        break;
                      default:
                        displayLabel = key.charAt(0).toUpperCase() + key.slice(1);
                    }

                    return (
                      <Chip
                        key={key}
                        label={`${displayLabel}: ${displayValue}`}
                        size="small"
                        onDelete={() => handleFilterChange(key)('')}
                        variant="outlined"
                      />
                    );
                  })}
                </Box>
              </Box>
            </>
          )}
        </Collapse>
      </CardContent>
    </Card>
  );
};

export default SalesFilters;