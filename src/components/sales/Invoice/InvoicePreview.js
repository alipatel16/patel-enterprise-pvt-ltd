import React, { forwardRef } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Divider,
  Chip,
  Avatar,
  useTheme,
  alpha
} from '@mui/material';
import {
  Business as BusinessIcon,
  Receipt as ReceiptIcon,
  Person as PersonIcon
} from '@mui/icons-material';

import { useUserType } from '../../../contexts/UserTypeContext/UserTypeContext';
import { formatCurrency, formatDate } from '../../../utils/helpers/formatHelpers';
import { 
  GST_TYPES,
  PAYMENT_STATUS,
  DELIVERY_STATUS 
} from '../../../utils/constants/appConstants';

/**
 * Invoice preview component for displaying invoice in printable format
 * @param {Object} props
 * @param {Object} props.invoice - Invoice data
 * @param {boolean} props.showActions - Whether to show action buttons
 * @param {string} props.variant - Display variant (preview, print, email)
 */
const InvoicePreview = forwardRef(({ 
  invoice = {}, 
  showActions = false,
  variant = 'preview'
}, ref) => {
  const theme = useTheme();
  const { getDisplayName, getThemeColors } = useUserType();
  
  const themeColors = getThemeColors();

  // Default invoice data structure
  const defaultInvoice = {
    invoiceNumber: '',
    date: new Date(),
    dueDate: null,
    customer: {},
    items: [],
    subTotal: 0,
    gstAmount: 0,
    totalAmount: 0,
    paymentStatus: PAYMENT_STATUS.PENDING,
    deliveryStatus: DELIVERY_STATUS.PENDING,
    gstType: GST_TYPES.NO_GST,
    notes: '',
    terms: ''
  };

  const invoiceData = { ...defaultInvoice, ...invoice };

  // Company details (would typically come from settings)
  const companyDetails = {
    name: 'Patel Enterprise Pvt Ltd',
    address: '123 Business Street',
    city: 'Ahmedabad',
    state: 'Gujarat',
    pincode: '380001',
    phone: '+91 79 1234 5678',
    email: 'info@patelenterprise.com',
    gst: '24ABCDE1234F1Z5',
    website: 'www.patelenterprise.com'
  };

  // Get status color
  const getStatusColor = (status, type = 'payment') => {
    const colors = {
      payment: {
        paid: theme.palette.success.main,
        pending: theme.palette.warning.main,
        emi: theme.palette.info.main
      },
      delivery: {
        delivered: theme.palette.success.main,
        pending: theme.palette.warning.main,
        scheduled: theme.palette.info.main
      }
    };
    
    return colors[type]?.[status] || theme.palette.text.secondary;
  };

  // Calculate totals
  const calculations = {
    itemTotal: invoiceData.items.reduce((sum, item) => sum + (item.quantity * item.price), 0),
    gstAmount: invoiceData.gstAmount || 0,
    grandTotal: invoiceData.totalAmount || 0
  };

  return (
    <Box
      ref={ref}
      sx={{
        backgroundColor: variant === 'print' ? 'white' : 'background.paper',
        color: variant === 'print' ? 'black' : 'text.primary',
        fontSize: variant === 'print' ? '12px' : 'inherit',
        '@media print': {
          backgroundColor: 'white !important',
          color: 'black !important',
          boxShadow: 'none !important',
          '& .no-print': {
            display: 'none !important'
          }
        }
      }}
    >
      <Card 
        elevation={variant === 'print' ? 0 : 2}
        sx={{ 
          maxWidth: '21cm',
          margin: 'auto',
          minHeight: variant === 'print' ? '29.7cm' : 'auto'
        }}
      >
        <CardContent sx={{ p: 4 }}>
          {/* Header */}
          <Box sx={{ mb: 4 }}>
            <Grid container spacing={3} alignItems="center">
              {/* Company Logo/Info */}
              <Grid item xs={12} md={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <Avatar
                    sx={{
                      width: 60,
                      height: 60,
                      backgroundColor: themeColors.primary,
                      fontSize: '1.5rem'
                    }}
                  >
                    <BusinessIcon fontSize="large" />
                  </Avatar>
                  <Box>
                    <Typography variant="h5" fontWeight={700} color={themeColors.primary}>
                      {companyDetails.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {getDisplayName()} Business
                    </Typography>
                  </Box>
                </Box>
                
                <Typography variant="body2" sx={{ mb: 1 }}>
                  {companyDetails.address}, {companyDetails.city}
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  {companyDetails.state} - {companyDetails.pincode}
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  Phone: {companyDetails.phone}
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  Email: {companyDetails.email}
                </Typography>
                {companyDetails.gst && (
                  <Typography variant="body2" fontWeight={500}>
                    GST: {companyDetails.gst}
                  </Typography>
                )}
              </Grid>

              {/* Invoice Details */}
              <Grid item xs={12} md={6}>
                <Box sx={{ textAlign: { xs: 'left', md: 'right' } }}>
                  <Typography variant="h4" fontWeight={700} color={themeColors.primary} gutterBottom>
                    INVOICE
                  </Typography>
                  
                  <Box sx={{ display: 'inline-block', textAlign: 'left' }}>
                    <Typography variant="body1" sx={{ mb: 1 }}>
                      <strong>Invoice #:</strong> {invoiceData.invoiceNumber}
                    </Typography>
                    <Typography variant="body1" sx={{ mb: 1 }}>
                      <strong>Date:</strong> {formatDate(invoiceData.date)}
                    </Typography>
                    {invoiceData.dueDate && (
                      <Typography variant="body1" sx={{ mb: 1 }}>
                        <strong>Due Date:</strong> {formatDate(invoiceData.dueDate)}
                      </Typography>
                    )}
                    
                    <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                      <Chip
                        label={invoiceData.paymentStatus?.toUpperCase()}
                        size="small"
                        sx={{
                          backgroundColor: getStatusColor(invoiceData.paymentStatus, 'payment') + '20',
                          color: getStatusColor(invoiceData.paymentStatus, 'payment'),
                          fontWeight: 600
                        }}
                      />
                      <Chip
                        label={invoiceData.deliveryStatus?.toUpperCase()}
                        size="small"
                        sx={{
                          backgroundColor: getStatusColor(invoiceData.deliveryStatus, 'delivery') + '20',
                          color: getStatusColor(invoiceData.deliveryStatus, 'delivery'),
                          fontWeight: 600
                        }}
                      />
                    </Box>
                  </Box>
                </Box>
              </Grid>
            </Grid>
          </Box>

          {/* Bill To */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Bill To:
            </Typography>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <Avatar sx={{ backgroundColor: themeColors.secondary + '20', color: themeColors.secondary }}>
                <PersonIcon />
              </Avatar>
              <Box>
                <Typography variant="h6" fontWeight={600}>
                  {invoiceData.customer?.name || 'Customer Name'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {invoiceData.customer?.type?.charAt(0).toUpperCase() + invoiceData.customer?.type?.slice(1)} • {invoiceData.customer?.category?.charAt(0).toUpperCase() + invoiceData.customer?.category?.slice(1)}
                </Typography>
              </Box>
            </Box>
            
            {invoiceData.customer?.address && (
              <Typography variant="body2" sx={{ mb: 1 }}>
                {invoiceData.customer.address}
              </Typography>
            )}
            
            <Grid container spacing={2}>
              {invoiceData.customer?.phone && (
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2">
                    <strong>Phone:</strong> {invoiceData.customer.phone}
                  </Typography>
                </Grid>
              )}
              
              {invoiceData.customer?.email && (
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2">
                    <strong>Email:</strong> {invoiceData.customer.email}
                  </Typography>
                </Grid>
              )}
              
              {invoiceData.customer?.gstNumber && (
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2">
                    <strong>GST:</strong> {invoiceData.customer.gstNumber}
                  </Typography>
                </Grid>
              )}
            </Grid>
          </Box>

          {/* Items Table */}
          <TableContainer component={Box} sx={{ mb: 4 }}>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: alpha(themeColors.primary, 0.1) }}>
                  <TableCell><strong>#</strong></TableCell>
                  <TableCell><strong>Description</strong></TableCell>
                  <TableCell align="right"><strong>Qty</strong></TableCell>
                  <TableCell align="right"><strong>Rate</strong></TableCell>
                  <TableCell align="right"><strong>Amount</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {invoiceData.items.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={500}>
                        {item.name || item.description}
                      </Typography>
                      {item.description && item.name && (
                        <Typography variant="caption" color="text.secondary">
                          {item.description}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell align="right">{item.quantity}</TableCell>
                    <TableCell align="right">{formatCurrency(item.price)}</TableCell>
                    <TableCell align="right" fontWeight={500}>
                      {formatCurrency(item.quantity * item.price)}
                    </TableCell>
                  </TableRow>
                ))}
                
                {invoiceData.items.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                      <Typography variant="body2" color="text.secondary">
                        No items added
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Totals */}
          <Grid container justifyContent="flex-end">
            <Grid item xs={12} sm={6} md={4}>
              <Box sx={{ border: `1px solid ${theme.palette.divider}`, p: 2, borderRadius: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Subtotal:</Typography>
                  <Typography variant="body2" fontWeight={500}>
                    {formatCurrency(calculations.itemTotal)}
                  </Typography>
                </Box>
                
                {calculations.gstAmount > 0 && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">
                      GST ({invoiceData.gstType === GST_TYPES.CGST_SGST ? 'CGST+SGST' : 'IGST'}):
                    </Typography>
                    <Typography variant="body2" fontWeight={500}>
                      {formatCurrency(calculations.gstAmount)}
                    </Typography>
                  </Box>
                )}
                
                <Divider sx={{ my: 1 }} />
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="h6" fontWeight={700}>Total:</Typography>
                  <Typography variant="h6" fontWeight={700} color={themeColors.primary}>
                    {formatCurrency(calculations.grandTotal)}
                  </Typography>
                </Box>
              </Box>
            </Grid>
          </Grid>

          {/* EMI Details */}
          {invoiceData.paymentStatus === PAYMENT_STATUS.EMI && invoiceData.emiDetails && (
            <Box sx={{ mt: 4, p: 2, backgroundColor: alpha(theme.palette.info.main, 0.1), borderRadius: 1 }}>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                EMI Details:
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2">
                    <strong>Monthly EMI:</strong> {formatCurrency(invoiceData.emiDetails.monthlyAmount)}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2">
                    <strong>Start Date:</strong> {formatDate(invoiceData.emiDetails.startDate)}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2">
                    <strong>Duration:</strong> {invoiceData.emiDetails.months} months
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2">
                    <strong>Total EMI Amount:</strong> {formatCurrency(invoiceData.emiDetails.totalAmount)}
                  </Typography>
                </Grid>
              </Grid>
            </Box>
          )}

          {/* Delivery Details */}
          {invoiceData.deliveryDetails && (
            <Box sx={{ mt: 3, p: 2, backgroundColor: alpha(theme.palette.success.main, 0.1), borderRadius: 1 }}>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Delivery Details:
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2">
                    <strong>Delivery Date:</strong> {formatDate(invoiceData.deliveryDetails.scheduledDate)}
                  </Typography>
                </Grid>
                {invoiceData.deliveryDetails.address && (
                  <Grid item xs={12}>
                    <Typography variant="body2">
                      <strong>Delivery Address:</strong> {invoiceData.deliveryDetails.address}
                    </Typography>
                  </Grid>
                )}
              </Grid>
            </Box>
          )}

          {/* Notes and Terms */}
          {(invoiceData.notes || invoiceData.terms) && (
            <Box sx={{ mt: 4 }}>
              {invoiceData.notes && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h6" fontWeight={600} gutterBottom>
                    Notes:
                  </Typography>
                  <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
                    {invoiceData.notes}
                  </Typography>
                </Box>
              )}
              
              {invoiceData.terms && (
                <Box>
                  <Typography variant="h6" fontWeight={600} gutterBottom>
                    Terms & Conditions:
                  </Typography>
                  <Typography variant="body2">
                    {invoiceData.terms}
                  </Typography>
                </Box>
              )}
            </Box>
          )}

          {/* Footer */}
          <Box sx={{ mt: 6, pt: 3, borderTop: `1px solid ${theme.palette.divider}` }}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="body2" color="text.secondary">
                  Thank you for your business!
                </Typography>
                {companyDetails.website && (
                  <Typography variant="body2" color="text.secondary">
                    Visit us at: {companyDetails.website}
                  </Typography>
                )}
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Box sx={{ textAlign: { xs: 'left', md: 'right' } }}>
                  <Typography variant="body2" color="text.secondary">
                    Generated on {formatDate(new Date())}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Powered by Business Manager
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
});

InvoicePreview.displayName = 'InvoicePreview';

export default InvoicePreview;