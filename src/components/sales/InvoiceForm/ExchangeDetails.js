// Create this file at: src/components/Sales/InvoiceForm/ExchangeDetails.jsx

import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Grid,
  TextField,
  FormControlLabel,
  Checkbox,
  InputAdornment,
  Box,
  Chip,
  Alert,
} from '@mui/material';
import {
  SwapHoriz as ExchangeIcon,
  CheckCircle as CheckIcon,
  HourglassEmpty as PendingIcon,
} from '@mui/icons-material';

/**
 * ExchangeDetails Component
 * Handles product exchange/trade-in details for invoices
 */
const ExchangeDetails = ({
  exchangeDetails = {
    hasExchange: false,
    exchangeAmount: 0,
    itemReceived: false,
    exchangeDescription: '',
  },
  onExchangeChange,
  loading = false,
  grandTotal = 0,
}) => {
  const handleExchangeToggle = (event) => {
    const hasExchange = event.target.checked;
    onExchangeChange({
      hasExchange,
      exchangeAmount: hasExchange ? exchangeDetails.exchangeAmount : 0,
      itemReceived: false,
      exchangeDescription: hasExchange ? exchangeDetails.exchangeDescription : '',
    });
  };

  const handleAmountChange = (event) => {
    const value = parseFloat(event.target.value) || 0;
    onExchangeChange({
      ...exchangeDetails,
      exchangeAmount: value,
    });
  };

  const handleReceivedToggle = (event) => {
    onExchangeChange({
      ...exchangeDetails,
      itemReceived: event.target.checked,
    });
  };

  const handleDescriptionChange = (event) => {
    onExchangeChange({
      ...exchangeDetails,
      exchangeDescription: event.target.value,
    });
  };

  const netPayable = Math.max(0, grandTotal - (exchangeDetails.exchangeAmount || 0));

  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography
            variant="h6"
            sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
          >
            <ExchangeIcon />
            Exchange / Trade-In
          </Typography>
          <FormControlLabel
            control={
              <Checkbox
                checked={exchangeDetails.hasExchange}
                onChange={handleExchangeToggle}
                disabled={loading}
                color="primary"
              />
            }
            label="Include Exchange"
          />
        </Box>

        {exchangeDetails.hasExchange && (
          <>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Exchange Amount"
                  type="number"
                  value={exchangeDetails.exchangeAmount || ''}
                  onChange={handleAmountChange}
                  disabled={loading}
                  inputProps={{ min: 0, step: 100 }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">₹</InputAdornment>
                    ),
                  }}
                  helperText="Value of the item being exchanged"
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={exchangeDetails.itemReceived}
                      onChange={handleReceivedToggle}
                      disabled={loading}
                      color="success"
                    />
                  }
                  label={
                    <Box display="flex" alignItems="center" gap={1}>
                      Exchange Item Received
                      {exchangeDetails.itemReceived ? (
                        <CheckIcon color="success" fontSize="small" />
                      ) : (
                        <PendingIcon color="warning" fontSize="small" />
                      )}
                    </Box>
                  }
                  sx={{ mt: 2 }}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Exchange Item Description"
                  placeholder="Describe the item being exchanged (e.g., Old refrigerator, Used TV, etc.)"
                  value={exchangeDetails.exchangeDescription || ''}
                  onChange={handleDescriptionChange}
                  disabled={loading}
                  multiline
                  rows={2}
                  helperText="Optional: Details about the exchanged item"
                />
              </Grid>
            </Grid>

            {/* Exchange Summary */}
            <Box
              sx={{
                mt: 3,
                p: 2,
                backgroundColor: 'rgba(46, 125, 50, 0.1)',
                borderRadius: 1,
                border: '1px solid rgba(46, 125, 50, 0.2)',
              }}
            >
              <Typography variant="subtitle2" color="success.main" gutterBottom>
                Exchange Summary:
              </Typography>
              
              <Box display="flex" justifyContent="space-between" mb={1}>
                <Typography variant="body2">Items Total:</Typography>
                <Typography variant="body2" fontWeight={600}>
                  ₹{grandTotal.toFixed(2)}
                </Typography>
              </Box>

              <Box display="flex" justifyContent="space-between" mb={1}>
                <Typography variant="body2" color="success.main">
                  Less: Exchange Credit:
                </Typography>
                <Typography variant="body2" fontWeight={600} color="success.main">
                  -₹{(exchangeDetails.exchangeAmount || 0).toFixed(2)}
                </Typography>
              </Box>

              <Box 
                display="flex" 
                justifyContent="space-between" 
                pt={1}
                sx={{ borderTop: '1px solid rgba(46, 125, 50, 0.3)' }}
              >
                <Typography variant="body1" fontWeight="bold">
                  Net Amount Payable:
                </Typography>
                <Typography variant="body1" fontWeight="bold" color="primary.main">
                  ₹{netPayable.toFixed(2)}
                </Typography>
              </Box>

              {!exchangeDetails.itemReceived && (
                <Alert severity="warning" sx={{ mt: 2 }}>
                  <Typography variant="body2">
                    <strong>Reminder:</strong> Mark the exchange item as received once you collect it from the customer.
                  </Typography>
                </Alert>
              )}

              {exchangeDetails.itemReceived && (
                <Box sx={{ mt: 2 }}>
                  <Chip
                    icon={<CheckIcon />}
                    label="Exchange Item Received"
                    color="success"
                    size="small"
                  />
                </Box>
              )}
            </Box>
          </>
        )}

        {!exchangeDetails.hasExchange && (
          <Alert severity="info">
            Check "Include Exchange" if the customer is trading in an old product.
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

export default ExchangeDetails;