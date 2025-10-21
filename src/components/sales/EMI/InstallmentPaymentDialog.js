import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  Typography,
  Box,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Divider,
  InputAdornment,
  LinearProgress,
} from "@mui/material";
import {
  Payment as PaymentIcon,
  Schedule as ScheduleIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
} from "@mui/icons-material";

import {
  formatCurrency,
  formatDate,
} from "../../../utils/helpers/formatHelpers";

/**
 * Dialog for recording installment payments with partial payment support
 */
const InstallmentPaymentDialog = ({
  open,
  onClose,
  installment,
  invoice,
  onPaymentRecorded,
}) => {
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [transactionId, setTransactionId] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [previewData, setPreviewData] = useState(null);

  const isPartialPayment =
    installment?.partiallyPaid ||
    (installment?.paidAmount > 0 &&
      installment?.paidAmount < installment?.amount &&
      !installment?.paid);
  const alreadyPaid = installment?.paidAmount || 0;
  const remainingAmount =
    installment?.remainingAmount || (installment?.amount || 0) - alreadyPaid;

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (open && installment) {
      if (isPartialPayment) {
        setPaymentAmount(remainingAmount.toString());
      } else {
        setPaymentAmount(installment.amount?.toString() || "");
      }
      setPaymentMethod("cash");
      setTransactionId("");
      setNotes("");
      setError("");
      setPreviewData(null);
    }
  }, [open, installment, isPartialPayment, remainingAmount]);

  // Calculate payment impact preview
  useEffect(() => {
    if (installment && paymentAmount) {
      const amount = parseFloat(paymentAmount);
      const installmentAmount = parseFloat(installment.amount);

      if (amount > 0) {
        const isFullPayment = amount >= installmentAmount;
        const isPartialPayment = amount < installmentAmount;
        const isOverpayment = amount > installmentAmount;

        setPreviewData({
          isFullPayment,
          isPartialPayment,
          isOverpayment,
          shortfall: isPartialPayment ? installmentAmount - amount : 0,
          overpayment: isOverpayment ? amount - installmentAmount : 0,
          paymentAmount: amount,
          installmentAmount,
        });
      } else {
        setPreviewData(null);
      }
    }
  }, [paymentAmount, installment]);

  const handleSubmit = async () => {
    if (!installment || !paymentAmount || !onPaymentRecorded) return;

    const amount = parseFloat(paymentAmount);
    if (amount <= 0) {
      setError("Payment amount must be greater than 0");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const paymentDetails = {
        paymentMethod,
        transactionId: transactionId.trim() || null,
        notes: notes.trim(),
      };

      await onPaymentRecorded(
        installment.installmentNumber,
        amount,
        paymentDetails
      );

      onClose();
    } catch (err) {
      setError(err.message || "Failed to record payment");
    } finally {
      setLoading(false);
    }
  };

  const getInstallmentStatusColor = () => {
    if (!installment) return "default";

    if (installment.isOverdue) return "error";
    if (installment.isDueToday) return "warning";
    if (installment.isDueSoon) return "info";
    return "success";
  };

  const getInstallmentStatusLabel = () => {
    if (!installment) return "";

    if (installment.isOverdue)
      return `${Math.abs(installment.daysDiff)} days overdue`;
    if (installment.isDueToday) return "Due today";
    if (installment.isDueSoon) return `Due in ${installment.daysDiff} days`;
    return `Due in ${installment.daysDiff} days`;
  };

  if (!installment) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { minHeight: 500 },
      }}
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={2}>
          <PaymentIcon color="primary" />
          <Box>
            <Typography variant="h6">Record Installment Payment</Typography>
            <Typography variant="body2" color="text.secondary">
              {invoice?.customerName} • {invoice?.invoiceNumber}
            </Typography>
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        {/* ADD: Partial payment alert */}
        {isPartialPayment && (
          <Alert severity="info" sx={{ mb: 2 }}>
            <Typography variant="body2">
              <strong>Partial Payment Detected</strong>
            </Typography>
            <Typography variant="body2">
              Already Paid: {formatCurrency(alreadyPaid)}
            </Typography>
            <Typography variant="body2">
              Remaining: {formatCurrency(remainingAmount)}
            </Typography>
          </Alert>
        )}
        {/* Installment Info */}
        <Box mb={3}>
          <Typography variant="subtitle1" fontWeight={600} gutterBottom>
            Installment Details
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={6} sm={3}>
              <Typography variant="body2" color="text.secondary">
                Installment #
              </Typography>
              <Typography variant="h6">
                {installment.installmentNumber}
              </Typography>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Typography variant="body2" color="text.secondary">
                Amount Due
              </Typography>
              <Typography variant="h6" color="primary">
                {formatCurrency(installment.amount)}
              </Typography>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Typography variant="body2" color="text.secondary">
                Due Date
              </Typography>
              <Typography variant="body1">
                {formatDate(installment.dueDate)}
              </Typography>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Typography variant="body2" color="text.secondary">
                Status
              </Typography>
              <Chip
                label={getInstallmentStatusLabel()}
                color={getInstallmentStatusColor()}
                size="small"
                icon={
                  installment.isOverdue ? <WarningIcon /> : <ScheduleIcon />
                }
              />
            </Grid>
          </Grid>
        </Box>

        <Divider sx={{ mb: 3 }} />

        {/* Payment Form */}
        <Typography variant="subtitle1" fontWeight={600} gutterBottom>
          Payment Information
        </Typography>

        <Grid container spacing={3}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Payment Amount"
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(e.target.value)}
              type="number"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">₹</InputAdornment>
                ),
                inputProps: { min: 0, step: 0.01 },
              }}
              error={!!error && error.includes("amount")}
              helperText={
                parseFloat(paymentAmount) > parseFloat(installment.amount)
                  ? "Overpayment will be applied to future installments"
                  : parseFloat(paymentAmount) <
                      parseFloat(installment.amount) &&
                    parseFloat(paymentAmount) > 0
                  ? "Partial payment - remaining amount will be redistributed"
                  : ""
              }
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Payment Method</InputLabel>
              <Select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                label="Payment Method"
              >
                <MenuItem value="cash">Cash</MenuItem>
                <MenuItem value="bank_transfer">Bank Transfer</MenuItem>
                <MenuItem value="check">Check</MenuItem>
                <MenuItem value="online">Online Payment</MenuItem>
                <MenuItem value="card">Card Payment</MenuItem>
                <MenuItem value="upi">UPI</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Transaction ID / Reference"
              value={transactionId}
              onChange={(e) => setTransactionId(e.target.value)}
              placeholder="Enter transaction ID, check number, or reference"
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              multiline
              rows={2}
              placeholder="Add any additional notes about this payment..."
            />
          </Grid>
        </Grid>

        {/* Payment Impact Preview */}
        {previewData && (
          <Box mt={3}>
            <Typography variant="subtitle1" fontWeight={600} gutterBottom>
              Payment Impact
            </Typography>

            <Alert
              severity={
                previewData.isOverpayment
                  ? "info"
                  : previewData.isPartialPayment
                  ? "warning"
                  : "success"
              }
              icon={
                previewData.isFullPayment && !previewData.isOverpayment ? (
                  <CheckCircleIcon />
                ) : (
                  <PaymentIcon />
                )
              }
            >
              <Typography variant="body2" gutterBottom>
                {previewData.isFullPayment &&
                  !previewData.isOverpayment &&
                  "This installment will be marked as fully paid."}
                {previewData.isPartialPayment && (
                  <>
                    <strong>Partial Payment:</strong> Shortfall of{" "}
                    {formatCurrency(previewData.shortfall)}
                    will be redistributed across remaining installments.
                  </>
                )}
                {previewData.isOverpayment && (
                  <>
                    <strong>Overpayment:</strong> Excess amount of{" "}
                    {formatCurrency(previewData.overpayment)}
                    will be applied to future installments automatically.
                  </>
                )}
              </Typography>

              <Box mt={1}>
                <Typography variant="caption" display="block">
                  Payment: {formatCurrency(previewData.paymentAmount)} • Due:{" "}
                  {formatCurrency(previewData.installmentAmount)}
                </Typography>
              </Box>
            </Alert>
          </Box>
        )}

        {/* Error Display */}
        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}

        {/* Loading */}
        {loading && (
          <Box mt={2}>
            <LinearProgress />
            <Typography
              variant="body2"
              color="text.secondary"
              align="center"
              sx={{ mt: 1 }}
            >
              Recording payment...
            </Typography>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 3 }}>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading || !paymentAmount || parseFloat(paymentAmount) <= 0}
          startIcon={<PaymentIcon />}
        >
          {loading ? "Recording..." : "Record Payment"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default InstallmentPaymentDialog;
