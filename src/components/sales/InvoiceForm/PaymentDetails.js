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
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  useTheme
} from '@mui/material';
import {
  Payment as PaymentIcon,
  Schedule as ScheduleIcon,
  CheckCircle as PaidIcon,
  AccountBalance as BankIcon,
  CreditCard as CardIcon,
  Money as CashIcon
} from '@mui/icons-material';

import FormField from '../../common/Forms/FormField';
import DatePicker from '../../common/Forms/DatePicker';
import { 
  PAYMENT_STATUS,
} from '../../../utils/constants/appConstants';
import { formatCurrency, formatDate, addMonths } from '../../../utils/helpers/formatHelpers';

/**
 * Payment details component for invoice form
 * @param {Object} props
 * @param {Object} props.paymentData - Payment data
 * @param {function} props.onChange - Change handler
 * @param {number} props.totalAmount - Total invoice amount
 * @param {string} props.error - Error message
 * @param {boolean} props.readOnly - Whether form is read-only
 */
const PaymentDetails = ({
  paymentData = {},
  onChange,
  totalAmount = 0,
  error,
  readOnly = false
}) => {
  const theme = useTheme();

  // Default payment data
  const defaultPaymentData = {
    status: PAYMENT_STATUS.PENDING,
    method: 'cash',
    paidAmount: 0,
    dueDate: null,
    emiDetails: {
      monthlyAmount: 0,
      startDate: null,
      duration: 12,
      totalAmount: 0
    },
    notes: ''
  };

  const [formData, setFormData] = useState({ ...defaultPaymentData, ...paymentData });
  const [emiSchedule, setEmiSchedule] = useState([]);

  // Update parent when form data changes
  useEffect(() => {
    onChange(formData);
  }, [formData, onChange]);

  // Calculate EMI schedule when EMI details change
  useEffect(() => {
    if (formData.status === PAYMENT_STATUS.EMI && formData.emiDetails.monthlyAmount > 0) {
      generateEmiSchedule();
    }
  }, [formData.emiDetails, formData.status]);

  // Handle field change
  const handleChange = (field) => (value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle EMI details change
  const handleEmiChange = (field) => (value) => {
    setFormData(prev => ({
      ...prev,
      emiDetails: {
        ...prev.emiDetails,
        [field]: value
      }
    }));
  };

  // Handle payment status change
  const handleStatusChange = (event) => {
    const status = event.target.value;
    setFormData(prev => ({
      ...prev,
      status,
      paidAmount: status === PAYMENT_STATUS.PAID ? totalAmount : 0
    }));
  };

  // Generate EMI schedule
  const generateEmiSchedule = () => {
    const { monthlyAmount, startDate, duration } = formData.emiDetails;
    
    if (!startDate || !monthlyAmount || !duration) {
      setEmiSchedule([]);
      return;
    }

    const schedule = [];
    const start = new Date(startDate);

    for (let i = 0; i < duration; i++) {
      const dueDate = addMonths(start, i);
      schedule.push({
        installment: i + 1,
        dueDate,
        amount: monthlyAmount,
        status: 'pending'
      });
    }

    setEmiSchedule(schedule);

    // Update total EMI amount
    const totalEmiAmount = monthlyAmount * duration;
    setFormData(prev => ({
      ...prev,
      emiDetails: {
        ...prev.emiDetails,
        totalAmount: totalEmiAmount
      }
    }));
  };

  // Calculate remaining amount
  const remainingAmount = Math.max(0, totalAmount - formData.paidAmount);

  // Payment method options
  const paymentMethods = [
    { value: 'cash', label: 'Cash', icon: <CashIcon /> },
    { value: 'bank_transfer', label: 'Bank Transfer', icon: <BankIcon /> },
    { value: 'card', label: 'Card Payment', icon: <CardIcon /> },
    { value: 'upi', label: 'UPI Payment', icon: <PaymentIcon /> },
    { value: 'cheque', label: 'Cheque', icon: <BankIcon /> }
  ];

  return (
    <Box>
      <Typography variant="h6" fontWeight={600} gutterBottom>
        Payment Details
      </Typography>

      {/* Payment Status */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="subtitle1" fontWeight={600} gutterBottom>
            Payment Status
          </Typography>

          <RadioGroup
            value={formData.status}
            onChange={handleStatusChange}
            disabled={readOnly}
          >
            <FormControlLabel
              value={PAYMENT_STATUS.PAID}
              control={<Radio />}
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <PaidIcon color="success" />
                  <Typography>Paid in Full</Typography>
                </Box>
              }
            />
            
            <FormControlLabel
              value={PAYMENT_STATUS.PENDING}
              control={<Radio />}
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <ScheduleIcon color="warning" />
                  <Typography>Payment Pending</Typography>
                </Box>
              }
            />
            
            <FormControlLabel
              value={PAYMENT_STATUS.EMI}
              control={<Radio />}
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <PaymentIcon color="info" />
                  <Typography>EMI Payment</Typography>
                </Box>
              }
            />
          </RadioGroup>

          {/* Amount Summary */}
          <Box sx={{ mt: 2, p: 2, backgroundColor: theme.palette.grey[50], borderRadius: 1 }}>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  Total Amount
                </Typography>
                <Typography variant="h6" fontWeight={600}>
                  {formatCurrency(totalAmount)}
                </Typography>
              </Grid>
              
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  Remaining
                </Typography>
                <Typography variant="h6" fontWeight={600} color="error.main">
                  {formatCurrency(remainingAmount)}
                </Typography>
              </Grid>
            </Grid>
          </Box>
        </CardContent>
      </Card>

      {/* Payment Method */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="subtitle1" fontWeight={600} gutterBottom>
            Payment Method
          </Typography>

          <FormField
            type="select"
            value={formData.method}
            onChange={handleChange('method')}
            disabled={readOnly}
            options={paymentMethods}
            fullWidth
          />

          {/* Paid Amount */}
          {formData.status !== PAYMENT_STATUS.EMI && (
            <Box sx={{ mt: 2 }}>
              <FormField
                type="number"
                label="Amount Paid"
                value={formData.paidAmount}
                onChange={handleChange('paidAmount')}
                disabled={readOnly || formData.status === PAYMENT_STATUS.PAID}
                inputProps={{ min: 0, max: totalAmount, step: 0.01 }}
                startAdornment="₹"
                helperText={formData.status === PAYMENT_STATUS.PAID ? 'Automatically set to full amount' : ''}
              />
            </Box>
          )}

          {/* Due Date for Pending Payments */}
          {formData.status === PAYMENT_STATUS.PENDING && (
            <Box sx={{ mt: 2 }}>
              <DatePicker
                label="Due Date"
                value={formData.dueDate}
                onChange={handleChange('dueDate')}
                disabled={readOnly}
                minDate={new Date()}
              />
            </Box>
          )}
        </CardContent>
      </Card>

      {/* EMI Details */}
      {formData.status === PAYMENT_STATUS.EMI && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="subtitle1" fontWeight={600} gutterBottom>
              EMI Configuration
            </Typography>

            <Grid container spacing={2}>
              {/* Monthly Amount */}
              <Grid item xs={12} sm={6}>
                <FormField
                  type="number"
                  label="Monthly EMI Amount"
                  value={formData.emiDetails.monthlyAmount}
                  onChange={handleEmiChange('monthlyAmount')}
                  disabled={readOnly}
                  inputProps={{ min: 1, step: 0.01 }}
                  startAdornment="₹"
                  required
                />
              </Grid>

              {/* Duration */}
              <Grid item xs={12} sm={6}>
                <FormField
                  type="select"
                  label="Duration (Months)"
                  value={formData.emiDetails.duration}
                  onChange={handleEmiChange('duration')}
                  disabled={readOnly}
                  options={[
                    { value: 3, label: '3 Months' },
                    { value: 6, label: '6 Months' },
                    { value: 12, label: '12 Months' },
                    { value: 18, label: '18 Months' },
                    { value: 24, label: '24 Months' },
                    { value: 36, label: '36 Months' }
                  ]}
                />
              </Grid>

              {/* Start Date */}
              <Grid item xs={12} sm={6}>
                <DatePicker
                  label="EMI Start Date"
                  value={formData.emiDetails.startDate}
                  onChange={handleEmiChange('startDate')}
                  disabled={readOnly}
                  minDate={new Date()}
                />
              </Grid>

              {/* Total EMI Amount */}
              <Grid item xs={12} sm={6}>
                <FormField
                  label="Total EMI Amount"
                  value={formatCurrency(formData.emiDetails.totalAmount)}
                  disabled
                  helperText="Calculated automatically"
                />
              </Grid>
            </Grid>

            {/* EMI vs Invoice Amount Warning */}
            {formData.emiDetails.totalAmount > 0 && formData.emiDetails.totalAmount !== totalAmount && (
              <Alert 
                severity={formData.emiDetails.totalAmount > totalAmount ? "warning" : "info"} 
                sx={{ mt: 2 }}
              >
                {formData.emiDetails.totalAmount > totalAmount ? (
                  <Typography variant="body2">
                    Total EMI amount ({formatCurrency(formData.emiDetails.totalAmount)}) is higher than invoice amount ({formatCurrency(totalAmount)}). 
                    Interest: {formatCurrency(formData.emiDetails.totalAmount - totalAmount)}
                  </Typography>
                ) : (
                  <Typography variant="body2">
                    Total EMI amount ({formatCurrency(formData.emiDetails.totalAmount)}) is lower than invoice amount. 
                    Please adjust the monthly amount or duration.
                  </Typography>
                )}
              </Alert>
            )}

            {/* EMI Schedule Preview */}
            {emiSchedule.length > 0 && (
              <Box sx={{ mt: 3 }}>
                <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                  EMI Schedule Preview (First 6 installments)
                </Typography>
                
                <List dense>
                  {emiSchedule.slice(0, 6).map((installment, index) => (
                    <ListItem key={index} divider>
                      <ListItemText
                        primary={`Installment ${installment.installment}`}
                        secondary={formatDate(installment.dueDate)}
                      />
                      <ListItemSecondaryAction>
                        <Typography variant="body2" fontWeight={500}>
                          {formatCurrency(installment.amount)}
                        </Typography>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                  
                  {emiSchedule.length > 6 && (
                    <ListItem>
                      <ListItemText
                        primary={`... and ${emiSchedule.length - 6} more installments`}
                        secondary="View full schedule after saving"
                      />
                    </ListItem>
                  )}
                </List>
              </Box>
            )}
          </CardContent>
        </Card>
      )}

      {/* Payment Notes */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="subtitle1" fontWeight={600} gutterBottom>
            Payment Notes (Optional)
          </Typography>

          <FormField
            label="Additional Notes"
            value={formData.notes}
            onChange={handleChange('notes')}
            disabled={readOnly}
            multiline
            rows={3}
            placeholder="Any special payment terms, bank details, or instructions..."
          />
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

export default PaymentDetails;