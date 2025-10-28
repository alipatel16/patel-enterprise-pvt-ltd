// PaymentReceipt.js - FIXED: Centered + Dynamic company details from invoice
import React, { forwardRef } from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableRow,
  Divider,
  Grid,
} from '@mui/material';
import { formatCurrency, formatDate } from '../../../utils/helpers/formatHelpers';

const PaymentReceipt = forwardRef(({ paymentData, invoice }, ref) => {
  // Extract company details from invoice
  const getCompanyDetails = () => {
    if (invoice?.company) {
      return {
        name: invoice.company.name || 'Your Company Name',
        address: `${invoice.company.address || ''}, ${invoice.company.city || ''}, ${
          invoice.company.state || ''
        } - ${invoice.company.pincode || ''}`.replace(/^[,\s-]+|[,\s-]+$/g, ''),
        phone: invoice.company.phone || 'Contact Number',
        email: invoice.company.email || '',
        gst: invoice.company.gstNumber || '',
      };
    }

    // Fallback to default
    return {
      name: 'Your Company Name',
      address: 'Company Address',
      phone: 'Contact Number',
      email: '',
      gst: '',
    };
  };

  const companyDetails = getCompanyDetails();

  // Calculate correct amounts based on payment type
  const calculateAmounts = () => {
    const totalInvoice = invoice?.grandTotal || invoice?.totalAmount || 0;
    const downPayment = parseFloat(invoice?.paymentDetails?.downPayment || 0);
    const paymentHistory = invoice?.paymentDetails?.paymentHistory || [];

    // Calculate all additional payments (excluding down payment records)
    const additionalPayments = paymentHistory
      .filter((p) => p.type !== 'down_payment')
      .reduce((sum, p) => sum + (p.amount || 0), 0);

    const totalPaidSoFar = downPayment + additionalPayments;

    if (paymentData?.type === 'summary') {
      // For "all payments" summary
      return {
        paymentAmount: totalPaidSoFar,
        previousPaid: 0,
        remainingBalance: Math.max(0, totalInvoice - totalPaidSoFar),
        isSummary: true,
        totalPaid: totalPaidSoFar,
      };
    } else {
      // For specific payment
      const thisPaymentAmount = paymentData?.amount || 0;

      // Calculate what was paid BEFORE this payment
      const paymentIndex = paymentHistory.findIndex(
        (p) =>
          p.amount === thisPaymentAmount &&
          p.date === paymentData?.date &&
          p.method === paymentData?.method
      );

      let paidBeforeThis = downPayment;
      if (paymentIndex > 0) {
        paidBeforeThis += paymentHistory
          .slice(0, paymentIndex)
          .filter((p) => p.type !== 'down_payment')
          .reduce((sum, p) => sum + (p.amount || 0), 0);
      }

      return {
        paymentAmount: thisPaymentAmount,
        previousPaid: paidBeforeThis,
        remainingBalance: Math.max(0, totalInvoice - paidBeforeThis - thisPaymentAmount),
        isSummary: false,
      };
    }
  };

  const amounts = calculateAmounts();

  return (
    <Box
      ref={ref}
      sx={{
        width: '148mm',
        minHeight: '210mm',
        margin: '0 auto', // Center horizontally
        padding: '10mm',
        bgcolor: 'white',
        fontSize: '10pt',
        position: 'relative',
        left: '50%',
        transform: 'translateX(-50%)', // Perfect centering
        '@media print': {
          width: '148mm',
          minHeight: '210mm',
          margin: '0 auto',
          padding: '10mm',
          pageBreakAfter: 'always',
          position: 'static',
          left: 'auto',
          transform: 'none',
          // Center on page
          '@page': {
            size: 'A4 portrait',
            margin: '0',
          },
        },
      }}
    >
      <Paper
        elevation={0}
        sx={{
          p: 2,
          border: '1px solid #ddd',
          '@media print': {
            border: '1px solid #000',
            boxShadow: 'none',
          },
        }}
      >
        {/* Header */}
        <Box sx={{ textAlign: 'center', mb: 2, borderBottom: '2px solid #000', pb: 1 }}>
          <Typography variant="body1" fontWeight="bold" sx={{ fontSize: '11pt', mt: 0.5 }}>
            {companyDetails.name}
          </Typography>
          <Typography variant="body2" sx={{ fontSize: '9pt' }}>
            {companyDetails.address}
          </Typography>
          <Typography variant="body2" sx={{ fontSize: '9pt' }}>
            Phone: {companyDetails.phone}
            {companyDetails.email && ` | Email: ${companyDetails.email}`}
          </Typography>
          {companyDetails.gst && (
            <Typography variant="body2" sx={{ fontSize: '8pt', fontWeight: 'bold' }}>
              GSTIN: {companyDetails.gst}
            </Typography>
          )}
        </Box>

        {/* Receipt Details */}
        <Grid container spacing={1} sx={{ mb: 2, fontSize: '9pt' }}>
          <Grid item xs={6}>
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '8pt' }}>
              Receipt No:
            </Typography>
            <Typography variant="body1" fontWeight="bold" sx={{ fontSize: '9pt' }}>
              {`PAY-${invoice?.invoiceNumber || ''}-${Date.now().toString().slice(-6)}`}
            </Typography>
          </Grid>
          <Grid item xs={6} sx={{ textAlign: 'right' }}>
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '8pt' }}>
              Date:
            </Typography>
            <Typography variant="body1" fontWeight="bold" sx={{ fontSize: '9pt' }}>
              {formatDate(paymentData?.date || new Date())}
            </Typography>
          </Grid>
        </Grid>

        <Divider sx={{ my: 1.5 }} />

        {/* Customer & Invoice Details */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" sx={{ fontSize: '9pt', fontWeight: 'bold' }} gutterBottom>
            Customer Details:
          </Typography>
          <Typography variant="body2" sx={{ fontSize: '9pt' }}>
            <strong>{invoice?.customerName || 'Customer Name'}</strong>
          </Typography>
          <Typography variant="body2" sx={{ fontSize: '8pt' }}>
            Phone: {invoice?.customerPhone || ''}
          </Typography>
          {invoice?.customerAddress && (
            <Typography variant="body2" sx={{ fontSize: '8pt' }}>
              Address: {invoice.customerAddress}
            </Typography>
          )}

          <Typography
            variant="subtitle2"
            sx={{ fontSize: '9pt', fontWeight: 'bold', mt: 1.5 }}
            gutterBottom
          >
            Invoice Details:
          </Typography>
          <Typography variant="body2" sx={{ fontSize: '9pt' }}>
            Invoice #: <strong>{invoice?.invoiceNumber || ''}</strong>
          </Typography>
          <Typography variant="body2" sx={{ fontSize: '8pt' }}>
            Invoice Date: {formatDate(invoice?.saleDate || invoice?.createdAt)}
          </Typography>
        </Box>

        <Divider sx={{ my: 1.5 }} />

        {/* Payment Details Table */}
        <Table size="small" sx={{ mb: 2 }}>
          <TableBody>
            <TableRow>
              <TableCell
                sx={{ fontWeight: 'bold', borderBottom: 'none', fontSize: '9pt', py: 0.5 }}
              >
                {amounts.isSummary ? 'Total Amount Paid:' : 'Payment Amount:'}
              </TableCell>
              <TableCell
                align="right"
                sx={{ fontWeight: 'bold', fontSize: '11pt', borderBottom: 'none', py: 0.5 }}
              >
                {formatCurrency(amounts.paymentAmount)}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell sx={{ borderBottom: 'none', fontSize: '9pt', py: 0.5 }}>
                Payment Method:
              </TableCell>
              <TableCell align="right" sx={{ borderBottom: 'none', fontSize: '9pt', py: 0.5 }}>
                {paymentData?.method?.toUpperCase() || 'CASH'}
              </TableCell>
            </TableRow>
            {paymentData?.reference && (
              <TableRow>
                <TableCell sx={{ borderBottom: 'none', fontSize: '9pt', py: 0.5 }}>
                  Reference:
                </TableCell>
                <TableCell align="right" sx={{ borderBottom: 'none', fontSize: '9pt', py: 0.5 }}>
                  {paymentData.reference}
                </TableCell>
              </TableRow>
            )}
            <TableRow>
              <TableCell sx={{ borderBottom: 'none', fontSize: '9pt', py: 0.5 }}>
                Recorded By:
              </TableCell>
              <TableCell align="right" sx={{ borderBottom: 'none', fontSize: '9pt', py: 0.5 }}>
                {paymentData?.recordedByName || 'Staff'}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>

        <Divider sx={{ my: 1.5 }} />

        {/* Invoice Balance Summary */}
        <Table size="small">
          <TableBody>
            <TableRow>
              <TableCell sx={{ fontSize: '9pt', py: 0.5 }}>Total Invoice Amount:</TableCell>
              <TableCell align="right" sx={{ fontSize: '9pt', py: 0.5 }}>
                {formatCurrency(invoice?.grandTotal || invoice?.totalAmount || 0)}
              </TableCell>
            </TableRow>

            {!amounts.isSummary && amounts.previousPaid > 0 && (
              <TableRow>
                <TableCell sx={{ fontSize: '9pt', py: 0.5 }}>Previously Paid:</TableCell>
                <TableCell align="right" sx={{ fontSize: '9pt', py: 0.5 }}>
                  {formatCurrency(amounts.previousPaid)}
                </TableCell>
              </TableRow>
            )}

            <TableRow>
              <TableCell sx={{ fontSize: '9pt', py: 0.5 }}>
                {amounts.isSummary ? 'Total Paid:' : 'This Payment:'}
              </TableCell>
              <TableCell align="right" sx={{ fontSize: '9pt', py: 0.5 }}>
                {formatCurrency(amounts.paymentAmount)}
              </TableCell>
            </TableRow>

            <TableRow sx={{ bgcolor: 'action.hover' }}>
              <TableCell sx={{ fontWeight: 'bold', fontSize: '9pt', py: 0.5 }}>
                Remaining Balance:
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: 'bold', fontSize: '10pt', py: 0.5 }}>
                {formatCurrency(amounts.remainingBalance)}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>

        {/* Notes */}
        {paymentData?.notes && (
          <Box sx={{ mt: 2, p: 1.5, bgcolor: 'grey.50', borderRadius: 1 }}>
            <Typography variant="body2" sx={{ fontSize: '8pt' }}>
              <strong>Notes:</strong> {paymentData.notes}
            </Typography>
          </Box>
        )}

        {/* Footer */}
        <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid #ddd', textAlign: 'center' }}>
          <Typography variant="body2" sx={{ fontSize: '8pt' }}>
            This is a computer generated receipt. No signature required.
          </Typography>
          <Typography variant="body2" sx={{ fontSize: '8pt', mt: 0.5 }}>
            Thank you for your payment!
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
});

PaymentReceipt.displayName = 'PaymentReceipt';

export default PaymentReceipt;
