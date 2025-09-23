import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Alert,
  Button,
  Divider,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Payment as PaymentIcon,
  Calculate as CalculateIcon
} from '@mui/icons-material';

import FormField from '../../common/Forms/FormField';
import DatePicker from '../../common/Forms/DatePicker';
import { formatCurrency, formatDate, addMonths } from '../../../utils/helpers/formatHelpers';

/**
 * EMI details component for invoice form
 * @param {Object} props
 * @param {Object} props.emiData - EMI configuration data
 * @param {function} props.onChange - Change handler
 * @param {number} props.totalAmount - Total invoice amount
 * @param {string} props.error - Error message
 * @param {boolean} props.readOnly - Whether form is read-only
 */
const EMIDetails = ({
  emiData = {},
  onChange,
  totalAmount = 0,
  error,
  readOnly = false
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Default EMI data
  const defaultEmiData = {
    monthlyAmount: 0,
    startDate: null,
    duration: 12,
    interestRate: 0,
    processingFee: 0,
    totalAmount: 0
  };

  const [formData, setFormData] = useState({ ...defaultEmiData, ...emiData });
  const [emiSchedule, setEmiSchedule] = useState([]);
  const [calculations, setCalculations] = useState({});

  // Update parent when form data changes
  useEffect(() => {
    onChange(formData);
  }, [formData, onChange]);

  // Calculate EMI schedule and totals when data changes
  useEffect(() => {
    if (formData.monthlyAmount > 0 && formData.startDate && formData.duration > 0) {
      calculateEMI();
    } else {
      setEmiSchedule([]);
      setCalculations({});
    }
  }, [formData, totalAmount]);

  // Handle field change
  const handleChange = (field) => (value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Calculate EMI schedule and totals
  const calculateEMI = () => {
    const { monthlyAmount, startDate, duration, interestRate, processingFee } = formData;
    
    if (!startDate || !monthlyAmount || !duration) return;

    // Generate EMI schedule
    const schedule = [];
    const start = new Date(startDate);
    let cumulativeAmount = 0;

    for (let i = 0; i < duration; i++) {
      const dueDate = addMonths(start, i);
      const installmentAmount = monthlyAmount;
      cumulativeAmount += installmentAmount;

      schedule.push({
        installment: i + 1,
        dueDate,
        amount: installmentAmount,
        cumulativeAmount,
        status: 'pending',
        interestPortion: interestRate > 0 ? (installmentAmount * interestRate / 100) : 0,
        principalPortion: installmentAmount - (interestRate > 0 ? (installmentAmount * interestRate / 100) : 0)
      });
    }

    setEmiSchedule(schedule);

    // Calculate totals
    const totalEmiAmount = monthlyAmount * duration;
    const totalInterest = (totalEmiAmount - totalAmount);
    const effectiveInterestRate = totalAmount > 0 ? (totalInterest / totalAmount) * 100 : 0;

    const calcs = {
      totalEmiAmount,
      totalInterest,
      effectiveInterestRate,
      processingFee: processingFee || 0,
      grandTotal: totalEmiAmount + (processingFee || 0)
    };

    setCalculations(calcs);

    // Update form data with calculated total
    setFormData(prev => ({
      ...prev,
      totalAmount: totalEmiAmount
    }));
  };

  // Auto-calculate monthly amount based on duration
  const handleAutoCalculate = () => {
    if (totalAmount > 0 && formData.duration > 0) {
      const baseMonthlyAmount = Math.ceil(totalAmount / formData.duration);
      const interestAmount = formData.interestRate > 0 ? (baseMonthlyAmount * formData.interestRate / 100) : 0;
      const monthlyAmount = baseMonthlyAmount + interestAmount;
      
      setFormData(prev => ({
        ...prev,
        monthlyAmount: Math.round(monthlyAmount)
      }));
    }
  };

  // Get EMI status color
  const getEmiStatusColor = (status) => {
    switch (status) {
      case 'paid': return 'success';
      case 'overdue': return 'error';
      case 'due_soon': return 'warning';
      default: return 'default';
    }
  };

  // Duration options
  const durationOptions = [
    { value: 3, label: '3 Months' },
    { value: 6, label: '6 Months' },
    { value: 9, label: '9 Months' },
    { value: 12, label: '12 Months' },
    { value: 18, label: '18 Months' },
    { value: 24, label: '24 Months' },
    { value: 30, label: '30 Months' },
    { value: 36, label: '36 Months' }
  ];

  return (
    <Box>
      <Typography variant="h6" fontWeight={600} gutterBottom>
        EMI Configuration
      </Typography>

      {/* EMI Setup */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
            <PaymentIcon color="primary" />
            <Typography variant="subtitle1" fontWeight={600}>
              EMI Setup
            </Typography>
            <Button
              variant="outlined"
              size="small"
              startIcon={<CalculateIcon />}
              onClick={handleAutoCalculate}
              disabled={readOnly || !totalAmount}
              sx={{ ml: 'auto' }}
            >
              Auto Calculate
            </Button>
          </Box>

          <Grid container spacing={3}>
            {/* Monthly Amount */}
            <Grid item xs={12} sm={6}>
              <FormField
                type="number"
                label="Monthly EMI Amount"
                value={formData.monthlyAmount}
                onChange={handleChange('monthlyAmount')}
                disabled={readOnly}
                required
                inputProps={{ min: 1, step: 1 }}
                startAdornment="₹"
                helperText="Amount to be paid each month"
              />
            </Grid>

            {/* Duration */}
            <Grid item xs={12} sm={6}>
              <FormField
                type="select"
                label="Duration"
                value={formData.duration}
                onChange={handleChange('duration')}
                disabled={readOnly}
                required
                options={durationOptions}
                helperText="Total number of installments"
              />
            </Grid>

            {/* Start Date */}
            <Grid item xs={12} sm={6}>
              <DatePicker
                label="EMI Start Date"
                value={formData.startDate}
                onChange={handleChange('startDate')}
                disabled={readOnly}
                required
                minDate={new Date()}
                helperText="Date of first EMI payment"
              />
            </Grid>

            {/* Interest Rate */}
            <Grid item xs={12} sm={6}>
              <FormField
                type="number"
                label="Interest Rate (% per month)"
                value={formData.interestRate}
                onChange={handleChange('interestRate')}
                disabled={readOnly}
                inputProps={{ min: 0, max: 10, step: 0.1 }}
                endAdornment="%"
                helperText="Optional: Interest charged per month"
              />
            </Grid>

            {/* Processing Fee */}
            <Grid item xs={12} sm={6}>
              <FormField
                type="number"
                label="Processing Fee"
                value={formData.processingFee}
                onChange={handleChange('processingFee')}
                disabled={readOnly}
                inputProps={{ min: 0, step: 1 }}
                startAdornment="₹"
                helperText="One-time processing fee"
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* EMI Summary */}
      {Object.keys(calculations).length > 0 && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="subtitle1" fontWeight={600} gutterBottom>
              EMI Summary
            </Typography>

            <Grid container spacing={2}>
              <Grid item xs={6} sm={3}>
                <Typography variant="body2" color="text.secondary">
                  Invoice Amount
                </Typography>
                <Typography variant="h6" fontWeight={600}>
                  {formatCurrency(totalAmount)}
                </Typography>
              </Grid>

              <Grid item xs={6} sm={3}>
                <Typography variant="body2" color="text.secondary">
                  Total EMI Amount
                </Typography>
                <Typography variant="h6" fontWeight={600} color="primary">
                  {formatCurrency(calculations.totalEmiAmount)}
                </Typography>
              </Grid>

              <Grid item xs={6} sm={3}>
                <Typography variant="body2" color="text.secondary">
                  Total Interest
                </Typography>
                <Typography 
                  variant="h6" 
                  fontWeight={600}
                  color={calculations.totalInterest > 0 ? "warning.main" : "success.main"}
                >
                  {formatCurrency(calculations.totalInterest)}
                </Typography>
              </Grid>

              <Grid item xs={6} sm={3}>
                <Typography variant="body2" color="text.secondary">
                  Processing Fee
                </Typography>
                <Typography variant="h6" fontWeight={600}>
                  {formatCurrency(calculations.processingFee)}
                </Typography>
              </Grid>
            </Grid>

            <Divider sx={{ my: 2 }} />

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6" fontWeight={700}>
                Grand Total:
              </Typography>
              <Typography variant="h5" fontWeight={700} color="primary">
                {formatCurrency(calculations.grandTotal)}
              </Typography>
            </Box>

            {/* Interest Rate Information */}
            {calculations.effectiveInterestRate !== 0 && (
              <Alert 
                severity={calculations.effectiveInterestRate > 0 ? "warning" : "info"}
                sx={{ mt: 2 }}
              >
                <Typography variant="body2">
                  Effective interest rate: {calculations.effectiveInterestRate.toFixed(2)}% 
                  {calculations.effectiveInterestRate > 0 
                    ? ` (Customer pays ${formatCurrency(calculations.totalInterest)} extra)`
                    : ' (No additional charges)'
                  }
                </Typography>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* EMI Schedule */}
      {emiSchedule.length > 0 && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="subtitle1" fontWeight={600} gutterBottom>
              EMI Schedule
            </Typography>

            <TableContainer component={Paper} variant="outlined">
              <Table size={isMobile ? 'small' : 'medium'}>
                <TableHead>
                  <TableRow sx={{ backgroundColor: theme.palette.grey[50] }}>
                    <TableCell>Installment</TableCell>
                    <TableCell>Due Date</TableCell>
                    <TableCell align="right">Amount</TableCell>
                    {!isMobile && formData.interestRate > 0 && (
                      <>
                        <TableCell align="right">Interest</TableCell>
                        <TableCell align="right">Principal</TableCell>
                      </>
                    )}
                    <TableCell align="right">Cumulative</TableCell>
                    <TableCell align="center">Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {emiSchedule.map((installment) => (
                    <TableRow key={installment.installment} hover>
                      <TableCell fontWeight={500}>
                        #{installment.installment}
                      </TableCell>
                      <TableCell>
                        {formatDate(installment.dueDate)}
                      </TableCell>
                      <TableCell align="right" fontWeight={500}>
                        {formatCurrency(installment.amount)}
                      </TableCell>
                      {!isMobile && formData.interestRate > 0 && (
                        <>
                          <TableCell align="right">
                            {formatCurrency(installment.interestPortion)}
                          </TableCell>
                          <TableCell align="right">
                            {formatCurrency(installment.principalPortion)}
                          </TableCell>
                        </>
                      )}
                      <TableCell align="right">
                        {formatCurrency(installment.cumulativeAmount)}
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={installment.status.charAt(0).toUpperCase() + installment.status.slice(1)}
                          size="small"
                          color={getEmiStatusColor(installment.status)}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {emiSchedule.length > 12 && (
              <Alert severity="info" sx={{ mt: 2 }}>
                <Typography variant="body2">
                  Showing all {emiSchedule.length} installments. Schedule will be saved with the invoice.
                </Typography>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* EMI Terms & Conditions */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="subtitle1" fontWeight={600} gutterBottom>
            EMI Terms & Conditions
          </Typography>

          <Box component="ul" sx={{ pl: 3, m: 0 }}>
            <Typography component="li" variant="body2" sx={{ mb: 1 }}>
              EMI payments are due on the specified dates each month
            </Typography>
            <Typography component="li" variant="body2" sx={{ mb: 1 }}>
              Late payment charges may apply for overdue installments
            </Typography>
            <Typography component="li" variant="body2" sx={{ mb: 1 }}>
              Customer can prepay remaining amount at any time
            </Typography>
            <Typography component="li" variant="body2" sx={{ mb: 1 }}>
              All EMI payments must be completed before product delivery (if applicable)
            </Typography>
            {formData.processingFee > 0 && (
              <Typography component="li" variant="body2" sx={{ mb: 1 }}>
                Processing fee of {formatCurrency(formData.processingFee)} is non-refundable
              </Typography>
            )}
          </Box>
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

export default EMIDetails;