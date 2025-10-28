// PaymentReceiptDialog.js - Updated to remove companyDetails prop
import React, { useRef, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Alert,
  FormControl,
  Select,
  MenuItem,
  Typography,
  Divider,
} from '@mui/material';
import {
  Print as PrintIcon,
  Close as CloseIcon,
  Receipt as ReceiptIcon,
} from '@mui/icons-material';
import { useReactToPrint } from 'react-to-print';
import PaymentReceipt from './PaymentReceipt';
import { formatCurrency, formatDate } from '../../../utils/helpers/formatHelpers';

const PaymentReceiptDialog = ({ open, onClose, invoice }) => {
  const receiptRef = useRef();
  const [selectedPayment, setSelectedPayment] = useState('latest');

  const handlePrint = useReactToPrint({
    contentRef: receiptRef,
    documentTitle: `Payment_Receipt_${invoice?.invoiceNumber || 'Invoice'}`,
  });

  if (!invoice) return null;

  const paymentHistory = invoice.paymentDetails?.paymentHistory || [];

  // Get the selected payment details
  const getSelectedPaymentData = () => {
    if (selectedPayment === 'latest' && paymentHistory.length > 0) {
      return paymentHistory[paymentHistory.length - 1];
    } else if (selectedPayment === 'all') {
      // For "all payments", calculate TOTAL paid including down payment
      const downPayment = parseFloat(invoice.paymentDetails?.downPayment || 0);

      // Sum all additional payments (excluding down payment records)
      const additionalPayments = paymentHistory
        .filter((p) => p.type !== 'down_payment')
        .reduce((sum, p) => sum + (p.amount || 0), 0);

      const totalPaid = downPayment + additionalPayments;

      return {
        amount: totalPaid,
        date: new Date().toISOString(),
        method: 'Multiple',
        reference: 'All Payments Summary',
        recordedBy: invoice.createdBy || 'system',
        recordedByName: invoice.createdByName || 'System',
        type: 'summary',
        notes: `Summary of all payments (Initial: ${formatCurrency(
          downPayment
        )}, Additional: ${formatCurrency(additionalPayments)})`,
      };
    } else {
      // Selected specific payment by index
      const index = parseInt(selectedPayment);
      return paymentHistory[index];
    }
  };

  const selectedPaymentData = getSelectedPaymentData();
  const hasPayments = paymentHistory.length > 0;

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <ReceiptIcon color="primary" />
          Print Payment Receipt
        </DialogTitle>

        <DialogContent>
          {!hasPayments ? (
            <Alert severity="info">
              No payment records found for this invoice. Payments must be recorded before printing
              receipts.
            </Alert>
          ) : (
            <>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Select which payment receipt to print:
              </Typography>

              <FormControl fullWidth sx={{ mt: 2, mb: 3 }}>
                <Select
                  value={selectedPayment}
                  onChange={(e) => setSelectedPayment(e.target.value)}
                >
                  <MenuItem value="latest">
                    Latest Payment (
                    {formatCurrency(paymentHistory[paymentHistory.length - 1]?.amount || 0)} on{' '}
                    {formatDate(paymentHistory[paymentHistory.length - 1]?.date)})
                  </MenuItem>

                  <Divider />

                  {paymentHistory.length >= 1 && (
                    <MenuItem value="all">
                      All Payments Summary (
                      {formatCurrency(
                        parseFloat(invoice.paymentDetails?.downPayment || 0) +
                          paymentHistory
                            .filter((p) => p.type !== 'down_payment')
                            .reduce((sum, p) => sum + (p.amount || 0), 0)
                      )}{' '}
                      total paid)
                    </MenuItem>
                  )}

                  {paymentHistory.length > 1 && <Divider />}

                  {paymentHistory.map((payment, index) => (
                    <MenuItem key={index} value={index.toString()}>
                      Payment {index + 1}: {formatCurrency(payment.amount || 0)} on{' '}
                      {formatDate(payment.date)} ({payment.method?.toUpperCase() || 'CASH'})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* Preview of selected payment */}
              <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Receipt Preview:
                </Typography>
                <Typography variant="body2">
                  Amount: <strong>{formatCurrency(selectedPaymentData?.amount || 0)}</strong>
                </Typography>
                <Typography variant="body2">
                  Date: {formatDate(selectedPaymentData?.date)}
                </Typography>
                <Typography variant="body2">
                  Method: {selectedPaymentData?.method?.toUpperCase() || 'CASH'}
                </Typography>
                {selectedPaymentData?.reference && (
                  <Typography variant="body2">
                    Reference: {selectedPaymentData.reference}
                  </Typography>
                )}
                {selectedPaymentData?.type === 'summary' && (
                  <Typography variant="body2" color="primary" sx={{ mt: 1 }}>
                    This will show all payments combined
                  </Typography>
                )}
              </Box>
            </>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 2 }}>
          <Button onClick={onClose} startIcon={<CloseIcon />}>
            Close
          </Button>
          {hasPayments && (
            <Button
              onClick={handlePrint}
              color="primary"
              variant="contained"
              startIcon={<PrintIcon />}
            >
              Print Receipt
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Hidden receipt for printing - No companyDetails prop needed */}
      <div style={{ display: 'none' }}>
        <PaymentReceipt ref={receiptRef} paymentData={selectedPaymentData} invoice={invoice} />
      </div>
    </>
  );
};

export default PaymentReceiptDialog;
