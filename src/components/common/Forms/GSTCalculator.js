import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  FormControl,
  FormControlLabel,
  Switch,
  Divider,
  Grid,
  Chip,
  IconButton,
  Tooltip,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Calculator as CalculatorIcon,
  Info as InfoIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';

import { 
  calculateGST, 
  calculateGSTFromInclusive,
  formatGSTAmount,
  getGSTDisplayText,
  validateGSTNumber,
  GST_TYPES,
  GST_RATES
} from '../../../utils/helpers/gstCalculator';

/**
 * GST Calculator Component
 * @param {Object} props
 * @param {number} props.amount - Base amount for calculation
 * @param {string} props.customerState - Customer's state
 * @param {function} props.onCalculationChange - Callback when calculation changes
 * @param {boolean} props.showGSTNumber - Whether to show GST number field
 * @param {string} props.gstNumber - GST number value
 * @param {function} props.onGSTNumberChange - GST number change handler
 * @param {boolean} props.editable - Whether amounts are editable
 * @param {boolean} props.compact - Compact view for smaller spaces
 */
const GSTCalculator = ({
  amount = 0,
  customerState = '',
  onCalculationChange,
  showGSTNumber = true,
  gstNumber = '',
  onGSTNumberChange,
  editable = true,
  compact = false,
  sx = {},
  ...props
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [baseAmount, setBaseAmount] = useState(amount);
  const [isInclusive, setIsInclusive] = useState(false);
  const [gstNumberValue, setGSTNumberValue] = useState(gstNumber);
  const [gstNumberError, setGSTNumberError] = useState('');
  const [calculations, setCalculations] = useState({});

  // Update base amount when prop changes
  useEffect(() => {
    setBaseAmount(amount);
  }, [amount]);

  // Update GST number when prop changes
  useEffect(() => {
    setGSTNumberValue(gstNumber);
  }, [gstNumber]);

  // Calculate GST whenever base amount, customer state, or inclusive flag changes
  useEffect(() => {
    const performCalculation = () => {
      if (!baseAmount || baseAmount <= 0) {
        setCalculations({});
        return;
      }

      try {
        let result;
        if (isInclusive) {
          result = calculateGSTFromInclusive(baseAmount, customerState);
        } else {
          result = calculateGST(baseAmount, customerState);
        }
        
        setCalculations(result);
        
        // Notify parent component
        if (onCalculationChange) {
          onCalculationChange(result);
        }
      } catch (error) {
        console.error('GST calculation error:', error);
        setCalculations({});
      }
    };

    performCalculation();
  }, [baseAmount, customerState, isInclusive, onCalculationChange]);

  // Handle base amount change
  const handleAmountChange = (event) => {
    const value = parseFloat(event.target.value) || 0;
    setBaseAmount(value);
  };

  // Handle GST number change
  const handleGSTNumberChange = (event) => {
    const value = event.target.value;
    setGSTNumberValue(value);
    
    // Validate GST number
    const validation = validateGSTNumber(value);
    setGSTNumberError(validation.error || '');
    
    // Notify parent component
    if (onGSTNumberChange) {
      onGSTNumberChange(value, validation);
    }
  };

  // Handle inclusive/exclusive toggle
  const handleInclusiveToggle = (event) => {
    setIsInclusive(event.target.checked);
  };

  // Reset calculator
  const handleReset = () => {
    setBaseAmount(0);
    setIsInclusive(false);
    setGSTNumberValue('');
    setGSTNumberError('');
    setCalculations({});
  };

  // Check if we have valid calculations
  const hasCalculations = calculations && Object.keys(calculations).length > 0;

  return (
    <Card 
      sx={{ 
        borderRadius: 2,
        boxShadow: theme.shadows[2],
        ...sx 
      }} 
      {...props}
    >
      <CardContent sx={{ p: compact ? 2 : 3 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <CalculatorIcon 
            color="primary" 
            sx={{ mr: 1, fontSize: compact ? 20 : 24 }} 
          />
          <Typography 
            variant={compact ? 'subtitle1' : 'h6'} 
            fontWeight={600}
            sx={{ flex: 1 }}
          >
            GST Calculator
          </Typography>
          
          <Tooltip title="Reset Calculator">
            <IconButton 
              onClick={handleReset}
              size="small"
              sx={{ ml: 1 }}
            >
              <RefreshIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>

        <Grid container spacing={compact ? 2 : 3}>
          {/* Input Section */}
          <Grid item xs={12} md={compact ? 12 : 6}>
            <Box>
              {/* Amount Input */}
              <TextField
                fullWidth
                label={isInclusive ? "Amount (Including GST)" : "Base Amount"}
                type="number"
                value={baseAmount || ''}
                onChange={handleAmountChange}
                disabled={!editable}
                inputProps={{ 
                  min: 0, 
                  step: 0.01 
                }}
                sx={{ mb: 2 }}
                InputProps={{
                  startAdornment: (
                    <Typography color="text.secondary" sx={{ mr: 0.5 }}>
                      ₹
                    </Typography>
                  )
                }}
              />

              {/* GST Inclusive Toggle */}
              <FormControlLabel
                control={
                  <Switch
                    checked={isInclusive}
                    onChange={handleInclusiveToggle}
                    disabled={!editable}
                    color="primary"
                  />
                }
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography variant="body2">
                      GST Inclusive Amount
                    </Typography>
                    <Tooltip title="Toggle between GST inclusive and exclusive calculations">
                      <InfoIcon 
                        fontSize="small" 
                        color="action" 
                        sx={{ ml: 0.5 }} 
                      />
                    </Tooltip>
                  </Box>
                }
                sx={{ mb: showGSTNumber ? 2 : 0 }}
              />

              {/* GST Number Input */}
              {showGSTNumber && (
                <TextField
                  fullWidth
                  label="GST Number (Optional)"
                  value={gstNumberValue}
                  onChange={handleGSTNumberChange}
                  error={!!gstNumberError}
                  helperText={gstNumberError || 'Format: 22AAAAA0000A1Z5'}
                  placeholder="Enter GST number"
                  sx={{ mb: 2 }}
                />
              )}

              {/* Customer State Info */}
              {customerState && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Customer State:
                  </Typography>
                  <Chip 
                    label={customerState.toUpperCase()} 
                    size="small" 
                    color="primary"
                    variant="outlined"
                  />
                </Box>
              )}
            </Box>
          </Grid>

          {/* Results Section */}
          <Grid item xs={12} md={compact ? 12 : 6}>
            {hasCalculations ? (
              <Box>
                <Typography 
                  variant="subtitle1" 
                  fontWeight={600} 
                  gutterBottom
                  color="primary"
                >
                  Calculation Results
                </Typography>

                {/* Base Amount */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">
                    Base Amount:
                  </Typography>
                  <Typography variant="body2" fontWeight={500}>
                    {formatGSTAmount(calculations.baseAmount)}
                  </Typography>
                </Box>

                {/* GST Breakdown */}
                {calculations.gstType === GST_TYPES.CGST_SGST ? (
                  <>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2" sx={{ ml: 1 }}>
                        CGST ({GST_RATES.CGST}%):
                      </Typography>
                      <Typography variant="body2">
                        {formatGSTAmount(calculations.cgst)}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2" sx={{ ml: 1 }}>
                        SGST ({GST_RATES.SGST}%):
                      </Typography>
                      <Typography variant="body2">
                        {formatGSTAmount(calculations.sgst)}
                      </Typography>
                    </Box>
                  </>
                ) : calculations.gstType === GST_TYPES.IGST ? (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" sx={{ ml: 1 }}>
                      IGST ({GST_RATES.IGST}%):
                    </Typography>
                    <Typography variant="body2">
                      {formatGSTAmount(calculations.igst)}
                    </Typography>
                  </Box>
                ) : null}

                <Divider sx={{ my: 1 }} />

                {/* Total GST */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" fontWeight={500}>
                    Total GST:
                  </Typography>
                  <Typography variant="body2" fontWeight={500} color="secondary.main">
                    {formatGSTAmount(calculations.totalGST)}
                  </Typography>
                </Box>

                {/* Grand Total */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="subtitle2" fontWeight={600}>
                    Grand Total:
                  </Typography>
                  <Typography 
                    variant="subtitle2" 
                    fontWeight={600} 
                    color="primary.main"
                  >
                    {formatGSTAmount(calculations.totalAmount)}
                  </Typography>
                </Box>

                {/* GST Type Indicator */}
                <Box sx={{ mt: 2 }}>
                  <Chip
                    label={getGSTDisplayText(calculations.gstType)}
                    size="small"
                    color={calculations.gstType === GST_TYPES.NO_GST ? 'default' : 'success'}
                    variant="outlined"
                  />
                </Box>
              </Box>
            ) : (
              <Box 
                sx={{ 
                  display: 'flex', 
                  flexDirection: 'column',
                  alignItems: 'center', 
                  justifyContent: 'center',
                  minHeight: 150,
                  color: 'text.secondary'
                }}
              >
                <CalculatorIcon sx={{ fontSize: 48, mb: 1, opacity: 0.5 }} />
                <Typography variant="body2" textAlign="center">
                  Enter an amount to calculate GST
                </Typography>
              </Box>
            )}
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

export default GSTCalculator;