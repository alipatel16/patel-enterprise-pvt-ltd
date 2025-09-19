import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Grid,
  Typography,
  Box,
  Alert,
  InputAdornment,
  CircularProgress,
} from '@mui/material';
import {
  PaymentOutlined as RecordPaymentIcon,
  Save as SaveIcon,
  Close as CloseIcon,
  DateRange as DateRangeIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';

import salesService from '../../../services/api/salesService';
import { useAuth } from '../../../contexts/AuthContext/AuthContext';
import { useUserType } from '../../../contexts/UserTypeContext/UserTypeContext';
import { formatCurrency } from '../../../utils/helpers/formatHelpers';
import {
  PAYMENT_METHODS,
  PAYMENT_METHOD_DISPLAY,
} from '../../../utils/constants/appConstants';

/**
 * Reusable Record Payment Dialog Component
 * @param {Object} props
 * @param {boolean} props.open - Dialog open state
 * @param {Function} props.onClose - Close handler
 * @param {Object} props.invoice - Invoice data
 * @param {Function} props.onSuccess - Success callback after payment recorded
 */
const RecordPaymentDialog = ({ open, onClose, invoice, onSuccess }) => {
  const { user } = useAuth();
  const { userType } = useUserType();

  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    paymentMethod: PAYMENT_METHODS.CASH,
    reference: '',
    notes: '',
    paymentDate: new Date(),
  });
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentError, setPaymentError] = useState('');

  // Calculate remaining balance
  const getRemainingBalance = (inv) => {
    if (!inv) return 0;
    const totalAmount = inv.grandTotal || inv.totalAmount || 0;
    const paidAmount = inv.paymentDetails?.downPayment || 0;
    return Math.max(0, totalAmount - paidAmount);
  };

  // Initialize form when dialog opens
  useEffect(() => {
    if (open && invoice) {
      const remainingBalance = getRemainingBalance(invoice);
      setPaymentForm({
        amount: remainingBalance.toString(),
        paymentMethod: PAYMENT_METHODS.CASH,
        reference: '',
        notes: '',
        paymentDate: new Date(),
      });
      setPaymentError('');
    }
  }, [open, invoice]);

  // Handle form field changes
  const handlePaymentFormChange = (field) => (event) => {
    setPaymentForm((prev) => ({
      ...prev,
      [field]: event.target.value,
    }));
  };

  // Handle payment date change
  const handlePaymentDateChange = (date) => {
    setPaymentForm((prev) => ({
      ...prev,
      paymentDate: date,
    }));
  };

  // Handle payment submission
  const handlePaymentSubmit = async () => {
    if (!invoice) return;

    const amount = parseFloat(paymentForm.amount);
    const remainingBalance = getRemainingBalance(invoice);

    // Validation
    if (!amount || amount <= 0) {
      setPaymentError('Please enter a valid payment amount');
      return;
    }

    if (amount > remainingBalance) {
      setPaymentError(
        `Payment amount cannot exceed remaining balance of ${formatCurrency(remainingBalance)}`
      );
      return;
    }

    if (!paymentForm.paymentDate) {
      setPaymentError('Please select a payment date');
      return;
    }

    setPaymentLoading(true);
    setPaymentError('');

    try {
      // Automatically capture logged-in user information
      const paymentDetails = {
        paymentMethod: paymentForm.paymentMethod,
        reference: paymentForm.reference,
        notes: paymentForm.notes,
        paymentDate: paymentForm.paymentDate.toISOString(),
        recordedBy: user?.uid || user?.id || 'unknown',
        recordedByName: user?.displayName || user?.name || user?.email || 'Unknown User',
        recordedByEmail: user?.email || '',
      };

      await salesService.recordAdditionalPayment(
        userType,
        invoice.id,
        amount,
        paymentDetails
      );

      // Reset form
      setPaymentForm({
        amount: '',
        paymentMethod: PAYMENT_METHODS.CASH,
        reference: '',
        notes: '',
        paymentDate: new Date(),
      });

      // Call success callback
      if (onSuccess) {
        await onSuccess();
      }

      // Close dialog
      onClose();
    } catch (error) {
      setPaymentError(error.message || 'Failed to record payment');
    } finally {
      setPaymentLoading(false);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    if (!paymentLoading) {
      setPaymentForm({
        amount: '',
        paymentMethod: PAYMENT_METHODS.CASH,
        reference: '',
        notes: '',
        paymentDate: new Date(),
      });
      setPaymentError('');
      onClose();
    }
  };

  if (!invoice) return null;

  const remainingBalance = getRemainingBalance(invoice);

  return (
    <Dialog
      open={open}
      onClose={paymentLoading ? undefined : handleCancel}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <RecordPaymentIcon color="primary" />
        Record Payment - {invoice.invoiceNumber}
      </DialogTitle>
      <DialogContent>
        {/* Invoice Summary */}
        <Box sx={{ mb: 3, mt: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Typography variant="body2" color="text.secondary">
                Customer:
              </Typography>
              <Typography variant="body1" fontWeight={500}>
                {invoice.customerName}
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2" color="text.secondary">
                Invoice Total:
              </Typography>
              <Typography variant="body1" fontWeight={500}>
                {formatCurrency(invoice.grandTotal || invoice.totalAmount)}
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2" color="text.secondary">
                Amount Paid:
              </Typography>
              <Typography variant="body1" fontWeight={500} color="success.main">
                {formatCurrency(invoice.paymentDetails?.downPayment || 0)}
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2" color="text.secondary">
                Remaining Balance:
              </Typography>
              <Typography variant="body1" fontWeight={500} color="warning.main">
                {formatCurrency(remainingBalance)}
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="body2" color="text.secondary">
                Recorded By:
              </Typography>
              <Typography variant="body1" fontWeight={500} color="primary.main">
                {user?.displayName || user?.name || user?.email || 'Current User'}
              </Typography>
            </Grid>
          </Grid>
        </Box>

        {/* Error Alert */}
        {paymentError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {paymentError}
          </Alert>
        )}

        {/* Payment Form */}
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Payment Amount"
              type="number"
              value={paymentForm.amount}
              onChange={handlePaymentFormChange('amount')}
              disabled={paymentLoading}
              inputProps={{
                min: 0,
                max: remainingBalance,
                step: 0.01,
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">₹</InputAdornment>
                ),
              }}
              helperText={`Maximum: ${formatCurrency(remainingBalance)}`}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <DatePicker
              label="Payment Date"
              value={paymentForm.paymentDate}
              onChange={handlePaymentDateChange}
              disabled={paymentLoading}
              format="dd/MM/yyyy"
              maxDate={new Date()}
              slotProps={{
                textField: {
                  fullWidth: true,
                  InputProps: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <DateRangeIcon />
                      </InputAdornment>
                    ),
                  },
                },
              }}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              select
              label="Payment Method"
              value={paymentForm.paymentMethod}
              onChange={handlePaymentFormChange('paymentMethod')}
              disabled={paymentLoading}
              SelectProps={{
                native: true,
              }}
            >
              <option value={PAYMENT_METHODS.CASH}>
                {PAYMENT_METHOD_DISPLAY[PAYMENT_METHODS.CASH]}
              </option>
              <option value={PAYMENT_METHODS.CARD}>
                {PAYMENT_METHOD_DISPLAY[PAYMENT_METHODS.CARD]}
              </option>
              <option value={PAYMENT_METHODS.CREDIT_CARD}>
                {PAYMENT_METHOD_DISPLAY[PAYMENT_METHODS.CREDIT_CARD]}
              </option>
              <option value={PAYMENT_METHODS.UPI}>
                {PAYMENT_METHOD_DISPLAY[PAYMENT_METHODS.UPI]}
              </option>
              <option value={PAYMENT_METHODS.NET_BANKING}>
                {PAYMENT_METHOD_DISPLAY[PAYMENT_METHODS.NET_BANKING]}
              </option>
              <option value={PAYMENT_METHODS.CHEQUE}>
                {PAYMENT_METHOD_DISPLAY[PAYMENT_METHODS.CHEQUE]}
              </option>
              <option value={PAYMENT_METHODS.BANK_TRANSFER}>
                {PAYMENT_METHOD_DISPLAY[PAYMENT_METHODS.BANK_TRANSFER]}
              </option>
            </TextField>
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Payment Reference"
              placeholder="Transaction ID, Cheque No, etc."
              value={paymentForm.reference}
              onChange={handlePaymentFormChange('reference')}
              disabled={paymentLoading}
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Notes"
              placeholder="Additional notes about this payment..."
              value={paymentForm.notes}
              onChange={handlePaymentFormChange('notes')}
              disabled={paymentLoading}
              multiline
              rows={2}
            />
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button
          onClick={handleCancel}
          disabled={paymentLoading}
          startIcon={<CloseIcon />}
        >
          Cancel
        </Button>
        <Button
          onClick={handlePaymentSubmit}
          color="primary"
          variant="contained"
          disabled={
            paymentLoading || !paymentForm.amount || !paymentForm.paymentDate
          }
          startIcon={
            paymentLoading ? (
              <CircularProgress size={20} color="inherit" />
            ) : (
              <SaveIcon />
            )
          }
        >
          {paymentLoading ? 'Recording...' : 'Record Payment'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default RecordPaymentDialog;