import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Alert,
  CircularProgress,
  useTheme,
  GlobalStyles,
} from '@mui/material';
import {
  Edit as EditIcon,
  Print as PrintIcon,
  Receipt as ConvertIcon,
  Business as BusinessIcon,
  Person as PersonIcon,
  CalendarToday as CalendarIcon,
} from '@mui/icons-material';

import Layout from '../../components/common/Layout/Layout';
import { QuotationProvider, useQuotation } from '../../contexts/QuotationContext/QuotationContext';
import { CustomerProvider } from '../../contexts/CustomerContext/CustomerContext';
import { EmployeeProvider } from '../../contexts/EmployeeContext/EmployeeContext';

// Quote status configurations
const STATUS_COLORS = {
  active: 'success',
  converted: 'primary',
  expired: 'warning',
  cancelled: 'error',
};

const STATUS_LABELS = {
  active: 'Active',
  converted: 'Converted',
  expired: 'Expired',
  cancelled: 'Cancelled',
};

// Print styles for professional A4 quotation
const printStyles = {
  '@media print': {
    // Page setup for A4
    '@page': {
      size: 'A4',
      margin: '0.75in 0.5in',
      '@top-left': { content: 'none' },
      '@top-center': { content: 'none' },
      '@top-right': { content: 'none' },
      '@bottom-left': { content: 'none' },
      '@bottom-center': { content: 'none' },
      '@bottom-right': { content: 'none' },
    },
    // Hide browser default headers and footers
    '@page :first': {
      '@top-left': { content: 'none' },
      '@top-center': { content: 'none' },
      '@top-right': { content: 'none' },
    },
    // Hide everything except print content
    'body *': {
      visibility: 'hidden !important',
    },
    // Show only print content
    '.print-only, .print-only *': {
      visibility: 'visible !important',
    },
    '.print-only': {
      position: 'absolute !important',
      left: '0 !important',
      top: '0 !important',
      width: '100% !important',
      display: 'block !important',
    },
    // Reset Material-UI styles for print
    '.MuiCard-root': {
      boxShadow: 'none !important',
      border: 'none !important',
      margin: '0 !important',
      padding: '0 !important',
    },
    '.MuiCardContent-root': {
      padding: '0 !important',
      '&:last-child': {
        paddingBottom: '0 !important',
      },
    },
    '.MuiGrid-container': {
      margin: '0 !important',
      width: '100% !important',
    },
    '.MuiGrid-item': {
      padding: '0 !important',
    },
    // Print layout styles
    '.print-header': {
      borderBottom: '2px solid #000',
      paddingBottom: '10px',
      marginBottom: '20px',
      pageBreakAfter: 'avoid',
    },
    '.print-company-info': {
      marginBottom: '20px',
      pageBreakAfter: 'avoid',
    },
    '.print-customer-info': {
      marginBottom: '20px',
      pageBreakAfter: 'avoid',
    },
    '.print-quotation-details': {
      marginBottom: '20px',
      pageBreakAfter: 'avoid',
    },
    '.print-items-table': {
      width: '100%',
      borderCollapse: 'collapse',
      marginBottom: '20px',
      '& th': {
        backgroundColor: '#f5f5f5 !important',
        border: '1px solid #000 !important',
        padding: '8px !important',
        fontSize: '12px !important',
        fontWeight: 'bold !important',
        textAlign: 'center !important',
      },
      '& td': {
        border: '1px solid #000 !important',
        padding: '6px 8px !important',
        fontSize: '11px !important',
        verticalAlign: 'top !important',
      },
      '& thead': {
        pageBreakAfter: 'avoid',
      },
      '& tbody tr': {
        pageBreakInside: 'avoid',
        pageBreakAfter: 'auto',
      },
    },
    '.print-totals': {
      marginTop: '20px',
      borderTop: '2px solid #000',
      paddingTop: '10px',
      pageBreakInside: 'avoid',
    },
    '.print-terms': {
      marginTop: '30px',
      pageBreakBefore: 'auto',
      pageBreakInside: 'avoid',
    },
    '.print-footer': {
      marginTop: '30px',
      borderTop: '1px solid #000',
      paddingTop: '10px',
      pageBreakInside: 'avoid',
    },
    // Typography adjustments for print
    h1: { fontSize: '24px !important', margin: '0 0 10px 0 !important' },
    h2: { fontSize: '18px !important', margin: '0 0 8px 0 !important' },
    h3: { fontSize: '16px !important', margin: '0 0 6px 0 !important' },
    h4: { fontSize: '14px !important', margin: '0 0 4px 0 !important' },
    h5: { fontSize: '13px !important', margin: '0 0 4px 0 !important' },
    h6: { fontSize: '12px !important', margin: '0 0 4px 0 !important' },
    'p, div, span': { fontSize: '11px !important', lineHeight: '1.4 !important' },
    // Force black text for print
    '*, *::before, *::after': {
      color: 'black !important',
      backgroundColor: 'transparent !important',
    },
    // Print page breaks
    '.page-break-before': {
      pageBreakBefore: 'always',
    },
    '.page-break-after': {
      pageBreakAfter: 'always',
    },
    '.page-break-avoid': {
      pageBreakInside: 'avoid',
    },
  },
  // Additional styles for when printing class is added to body
  'body.printing': {
    '@media print': {
      '& > *': {
        display: 'none !important',
      },
      '& .print-only': {
        display: 'block !important',
        position: 'static !important',
        visibility: 'visible !important',
      },
    },
  },
};

// Page content component
const ViewQuotationPageContent = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
  
  const { 
    currentQuotation, 
    loading, 
    error, 
    getQuotationById,
    convertQuotationToInvoice 
  } = useQuotation();

  const [converting, setConverting] = useState(false);
  const [convertError, setConvertError] = useState(null);

  const breadcrumbs = [
    {
      label: 'Quotations',
      path: '/quotations'
    },
    {
      label: currentQuotation?.quotationNumber || 'View Quotation',
      path: `/quotations/view/${id}`
    }
  ];

  // Load quotation data
  useEffect(() => {
    if (id) {
      getQuotationById(id);
    }
  }, [id, getQuotationById]);

  // Helper function to get quotation status
  const getQuotationStatus = (quotation) => {
    if (!quotation) return 'active';
    if (quotation.converted) return 'converted';
    if (quotation.status === 'cancelled') return 'cancelled';
    
    // Check if expired
    if (quotation.validUntil) {
      const validUntil = new Date(quotation.validUntil);
      const today = new Date();
      if (validUntil < today && quotation.status === 'active') {
        return 'expired';
      }
    }
    
    return quotation.status || 'active';
  };

  // Helper function to format date
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-IN');
  };

  // Helper function to format currency
  const formatCurrency = (amount) => {
    if (!amount) return '₹0.00';
    return `₹${parseFloat(amount).toLocaleString('en-IN', { 
      minimumFractionDigits: 2,
      maximumFractionDigits: 2 
    })}`;
  };

  // Handle convert to invoice
  const handleConvertToInvoice = () => {
    if (!currentQuotation) return;
    
    navigate('/sales/create', { 
      state: { 
        fromQuotation: true, 
        quotationData: currentQuotation 
      } 
    });
  };

  // Handle edit quotation
  const handleEditQuotation = () => {
    navigate(`/quotations/edit/${id}`);
  };

  // Handle print quotation
  const handlePrintQuotation = () => {
    window.print();
  };

  if (loading) {
    return (
      <Layout title="Loading..." breadcrumbs={breadcrumbs}>
        <Box display="flex" justifyContent="center" mt={4}>
          <CircularProgress />
        </Box>
      </Layout>
    );
  }

  if (error || !currentQuotation) {
    return (
      <Layout title="Quotation Not Found" breadcrumbs={breadcrumbs}>
        <Alert severity="error">
          {error || 'Quotation not found'}
        </Alert>
      </Layout>
    );
  }

  const status = getQuotationStatus(currentQuotation);
  const isConverted = status === 'converted';
  const isExpired = status === 'expired';

  // Print-optimized JSX content
  const PrintContent = () => (
    <Box className="print-only" sx={{ display: 'none' }}>
      {/* Print Header */}
      <Box className="print-header">
        <Typography variant="h1" align="center" sx={{ fontWeight: 'bold' }}>
          QUOTATION
        </Typography>
        <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mt: 1 }}>
          <Typography variant="h4">
            Quote #{currentQuotation.quotationNumber}
          </Typography>
          <Typography variant="body1">
            Date: {formatDate(currentQuotation.quotationDate)}
          </Typography>
        </Box>
      </Box>

      {/* Company Information */}
      {currentQuotation.company && (
        <Box className="print-company-info">
          <Typography variant="h3" sx={{ mb: 1 }}>From:</Typography>
          <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
            {currentQuotation.company.name}
          </Typography>
          <Typography variant="body1">{currentQuotation.company.address}</Typography>
          <Typography variant="body1">
            {currentQuotation.company.city}, {currentQuotation.company.state} - {currentQuotation.company.pincode}
          </Typography>
          <Typography variant="body1">
            Phone: {currentQuotation.company.phone}
          </Typography>
          <Typography variant="body1">GST: {currentQuotation.company.gstNumber}</Typography>
        </Box>
      )}

      {/* Customer Information */}
      <Box className="print-customer-info">
        <Typography variant="h3" sx={{ mb: 1 }}>To:</Typography>
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
          {currentQuotation.customerName}
        </Typography>
        <Typography variant="body1">{currentQuotation.customerAddress}</Typography>
        <Typography variant="body1">Phone: {currentQuotation.customerPhone}</Typography>
        {currentQuotation.customerGSTNumber && (
          <Typography variant="body1">GST: {currentQuotation.customerGSTNumber}</Typography>
        )}
      </Box>

      {/* Quotation Details */}
      <Box className="print-quotation-details">
        <Grid container spacing={2}>
          <Grid item xs={6}>
            <Typography variant="body1"><strong>Quotation Date:</strong> {formatDate(currentQuotation.quotationDate)}</Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="body1"><strong>Valid Until:</strong> {formatDate(currentQuotation.validUntil)}</Typography>
          </Grid>
        </Grid>
      </Box>

      {/* Items Table */}
      <table className="print-items-table">
        <thead>
          <tr>
            <th style={{ width: '5%' }}>Sr.</th>
            <th style={{ width: '35%' }}>Item Description</th>
            <th style={{ width: '10%' }}>HSN</th>
            <th style={{ width: '8%' }}>Qty</th>
            <th style={{ width: '12%' }}>Rate</th>
            {currentQuotation.includeGST && <th style={{ width: '8%' }}>GST</th>}
            <th style={{ width: '12%' }}>Amount</th>
          </tr>
        </thead>
        <tbody>
          {currentQuotation.items?.map((item, index) => (
            <tr key={index}>
              <td style={{ textAlign: 'center' }}>{index + 1}</td>
              <td>
                <strong>{item.name}</strong>
                {item.description && (
                  <div style={{ fontSize: '10px', color: '#666', marginTop: '2px' }}>
                    {item.description}
                  </div>
                )}
              </td>
              <td style={{ textAlign: 'center' }}>{item.hsnCode || '-'}</td>
              <td style={{ textAlign: 'center' }}>{item.quantity}</td>
              <td style={{ textAlign: 'right' }}>{formatCurrency(item.rate)}</td>
              {currentQuotation.includeGST && (
                <td style={{ textAlign: 'center' }}>{item.gstSlab}%</td>
              )}
              <td style={{ textAlign: 'right' }}>{formatCurrency(item.totalAmount)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totals Section */}
      <Box className="print-totals">
        <Grid container spacing={0}>
          <Grid item xs={8}></Grid>
          <Grid item xs={4}>
            <Box>
              <Box display="flex" justifyContent="space-between" sx={{ mb: 0.5 }}>
                <Typography variant="body1">Subtotal:</Typography>
                <Typography variant="body1">{formatCurrency(currentQuotation.subtotal)}</Typography>
              </Box>
              {currentQuotation.includeGST && (
                <Box display="flex" justifyContent="space-between" sx={{ mb: 0.5 }}>
                  <Typography variant="body1">
                    GST ({currentQuotation.customerState?.toLowerCase() === "gujarat" ? "CGST+SGST" : "IGST"}):
                  </Typography>
                  <Typography variant="body1">{formatCurrency(currentQuotation.totalGST)}</Typography>
                </Box>
              )}
              <Box display="flex" justifyContent="space-between" sx={{ borderTop: '1px solid black', pt: 0.5 }}>
                <Typography variant="h5" sx={{ fontWeight: 'bold' }}>Total:</Typography>
                <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                  {formatCurrency(currentQuotation.grandTotal)}
                </Typography>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Box>

      {/* Terms and Conditions */}
      {currentQuotation.termsAndConditions && (
        <Box className="print-terms page-break-avoid">
          <Typography variant="h3" sx={{ mb: 1 }}>Terms & Conditions:</Typography>
          <Typography variant="body1" sx={{ whiteSpace: 'pre-line', lineHeight: 1.4 }}>
            {currentQuotation.termsAndConditions}
          </Typography>
        </Box>
      )}

      {/* Remarks */}
      {currentQuotation.remarks && (
        <Box className="page-break-avoid" sx={{ mt: 2 }}>
          <Typography variant="h3" sx={{ mb: 1 }}>Remarks:</Typography>
          <Typography variant="body1">{currentQuotation.remarks}</Typography>
        </Box>
      )}

      {/* Footer */}
      <Box className="print-footer">
        <Grid container spacing={2}>
          <Grid item xs={6}>
            <Typography variant="body1">Thank you for your business!</Typography>
            <Typography variant="body1" sx={{ mt: 2 }}>
              This quotation is valid until {formatDate(currentQuotation.validUntil)}
            </Typography>
          </Grid>
          <Grid item xs={6} sx={{ textAlign: 'right' }}>
            <Box sx={{ mt: 4 }}>
              <Typography variant="body1">_______________________</Typography>
              <Typography variant="body1">Authorized Signature</Typography>
            </Box>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );

  return (
    <>
      <GlobalStyles styles={printStyles} />
      
      <Layout 
        title={`Quotation ${currentQuotation.quotationNumber}`} 
        breadcrumbs={breadcrumbs}
        className="no-print"
      >
        <Box className="no-print">
          {convertError && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {convertError}
            </Alert>
          )}

          {/* Header Actions */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
                <Box display="flex" alignItems="center" gap={2}>
                  <Typography variant="h5" fontWeight={600}>
                    {currentQuotation.quotationNumber}
                  </Typography>
                  <Chip
                    label={STATUS_LABELS[status]}
                    color={STATUS_COLORS[status]}
                    variant="outlined"
                  />
                  {isExpired && (
                    <Chip
                      label="Expired"
                      color="warning"
                      size="small"
                    />
                  )}
                </Box>
                
                <Box display="flex" gap={1} flexWrap="wrap">
                  <Button
                    variant="outlined"
                    startIcon={<PrintIcon />}
                    onClick={handlePrintQuotation}
                  >
                    Print
                  </Button>
                  
                  {!isConverted && (
                    <Button
                      variant="outlined"
                      startIcon={<EditIcon />}
                      onClick={handleEditQuotation}
                    >
                      Edit
                    </Button>
                  )}
                  
                  {!isConverted && (
                    <Button
                      variant="contained"
                      startIcon={<ConvertIcon />}
                      onClick={handleConvertToInvoice}
                      disabled={converting}
                    >
                      Convert to Invoice
                    </Button>
                  )}
                </Box>
              </Box>
            </CardContent>
          </Card>

          <Grid container spacing={3}>
            {/* Left Column */}
            <Grid item xs={12} lg={8}>
              {/* Company Information */}
              {currentQuotation.company && (
                <Card sx={{ mb: 3 }}>
                  <CardContent>
                    <Typography
                      variant="h6"
                      gutterBottom
                      sx={{ display: "flex", alignItems: "center", gap: 1 }}
                    >
                      <BusinessIcon />
                      Company Information
                    </Typography>
                    
                    <Box sx={{ 
                      p: 2, 
                      backgroundColor: theme.palette.grey[50], 
                      borderRadius: 1,
                      border: `1px solid ${theme.palette.grey[200]}`
                    }}>
                      <Typography variant="h6" fontWeight={600} gutterBottom>
                        {currentQuotation.company.name}
                      </Typography>
                      <Typography variant="body2" gutterBottom>
                        {currentQuotation.company.address}
                      </Typography>
                      <Typography variant="body2" gutterBottom>
                        {currentQuotation.company.city}, {currentQuotation.company.state} - {currentQuotation.company.pincode}
                      </Typography>
                      <Typography variant="body2" gutterBottom>
                        Phone: {currentQuotation.company.phone}
                      </Typography>
                      <Typography variant="body2">
                        GST: {currentQuotation.company.gstNumber}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              )}

              {/* Customer Details */}
              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Typography
                    variant="h6"
                    gutterBottom
                    sx={{ display: "flex", alignItems: "center", gap: 1 }}
                  >
                    <PersonIcon />
                    Customer Details
                  </Typography>
                  
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">
                        Name
                      </Typography>
                      <Typography variant="body1" fontWeight={600}>
                        {currentQuotation.customerName}
                      </Typography>
                    </Grid>
                    
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">
                        Phone
                      </Typography>
                      <Typography variant="body1">
                        {currentQuotation.customerPhone}
                      </Typography>
                    </Grid>
                    
                    <Grid item xs={12}>
                      <Typography variant="body2" color="text.secondary">
                        Address
                      </Typography>
                      <Typography variant="body1">
                        {currentQuotation.customerAddress}
                      </Typography>
                    </Grid>
                    
                    {currentQuotation.customerGSTNumber && (
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" color="text.secondary">
                          GST Number
                        </Typography>
                        <Typography variant="body1">
                          {currentQuotation.customerGSTNumber}
                        </Typography>
                      </Grid>
                    )}
                  </Grid>
                </CardContent>
              </Card>

              {/* Items */}
              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Items
                  </Typography>

                  <TableContainer component={Paper} variant="outlined">
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Item</TableCell>
                          <TableCell align="center">HSN</TableCell>
                          <TableCell align="center">Qty</TableCell>
                          <TableCell align="right">Rate</TableCell>
                          {currentQuotation.includeGST && (
                            <TableCell align="center">GST</TableCell>
                          )}
                          <TableCell align="right">Amount</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {currentQuotation.items?.map((item, index) => (
                          <TableRow key={index}>
                            <TableCell>
                              <Box>
                                <Typography variant="body2" fontWeight={600}>
                                  {item.name}
                                </Typography>
                                {item.description && (
                                  <Typography variant="caption" color="text.secondary">
                                    {item.description}
                                  </Typography>
                                )}
                              </Box>
                            </TableCell>
                            <TableCell align="center">
                              <Typography variant="body2" fontFamily="monospace">
                                {item.hsnCode || '-'}
                              </Typography>
                            </TableCell>
                            <TableCell align="center">
                              <Typography variant="body2">
                                {item.quantity}
                              </Typography>
                            </TableCell>
                            <TableCell align="right">
                              <Typography variant="body2">
                                {formatCurrency(item.rate)}
                              </Typography>
                            </TableCell>
                            {currentQuotation.includeGST && (
                              <TableCell align="center">
                                <Typography variant="body2">
                                  {item.gstSlab}%
                                </Typography>
                              </TableCell>
                            )}
                            <TableCell align="right">
                              <Typography variant="body2" fontWeight={600}>
                                {formatCurrency(item.totalAmount)}
                              </Typography>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>

              {/* Terms and Conditions */}
              {currentQuotation.termsAndConditions && (
                <Card sx={{ mb: 3 }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Terms & Conditions
                    </Typography>
                    <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>
                      {currentQuotation.termsAndConditions}
                    </Typography>
                  </CardContent>
                </Card>
              )}

              {/* Remarks */}
              {currentQuotation.remarks && (
                <Card sx={{ mb: 3 }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Remarks
                    </Typography>
                    <Typography variant="body2">
                      {currentQuotation.remarks}
                    </Typography>
                  </CardContent>
                </Card>
              )}
            </Grid>

            {/* Right Column */}
            <Grid item xs={12} lg={4}>
              {/* Quotation Summary */}
              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Typography
                    variant="h6"
                    gutterBottom
                    sx={{ display: "flex", alignItems: "center", gap: 1 }}
                  >
                    <CalendarIcon />
                    Quotation Summary
                  </Typography>

                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      Quotation Date
                    </Typography>
                    <Typography variant="body1" fontWeight={600}>
                      {formatDate(currentQuotation.quotationDate)}
                    </Typography>
                  </Box>

                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      Valid Until
                    </Typography>
                    <Typography variant="body1" fontWeight={600}>
                      {formatDate(currentQuotation.validUntil)}
                    </Typography>
                  </Box>

                  <Divider sx={{ my: 2 }} />

                  <Box sx={{ mb: 1 }}>
                    <Box display="flex" justifyContent="space-between">
                      <Typography variant="body2">Subtotal:</Typography>
                      <Typography variant="body2">
                        {formatCurrency(currentQuotation.subtotal)}
                      </Typography>
                    </Box>
                  </Box>

                  {currentQuotation.includeGST && (
                    <Box sx={{ mb: 1 }}>
                      <Box display="flex" justifyContent="space-between">
                        <Typography variant="body2">
                          GST ({currentQuotation.customerState?.toLowerCase() === "gujarat" ? "CGST+SGST" : "IGST"}):
                        </Typography>
                        <Typography variant="body2">
                          {formatCurrency(currentQuotation.totalGST)}
                        </Typography>
                      </Box>
                    </Box>
                  )}

                  <Divider sx={{ my: 2 }} />

                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="h6" fontWeight="bold">
                      Grand Total:
                    </Typography>
                    <Typography variant="h6" fontWeight="bold" color="primary.main">
                      {formatCurrency(currentQuotation.grandTotal)}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>

              {/* Status Information */}
              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Status Information
                  </Typography>

                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      Current Status
                    </Typography>
                    <Chip
                      label={STATUS_LABELS[status]}
                      color={STATUS_COLORS[status]}
                      variant="outlined"
                      sx={{ mt: 0.5 }}
                    />
                  </Box>

                  {currentQuotation.converted && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        Converted On
                      </Typography>
                      <Typography variant="body1">
                        {formatDate(currentQuotation.convertedAt)}
                      </Typography>
                    </Box>
                  )}

                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      Created On
                    </Typography>
                    <Typography variant="body1">
                      {formatDate(currentQuotation.createdAt)}
                    </Typography>
                  </Box>

                  {currentQuotation.createdByName && (
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Created By
                      </Typography>
                      <Typography variant="body1">
                        {currentQuotation.createdByName}
                      </Typography>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
      </Layout>

      {/* Print Content - Hidden on screen, visible on print */}
      <PrintContent />
    </>
  );
};

// Main component with providers
const ViewQuotationPage = () => {
  return (
    <CustomerProvider>
      <EmployeeProvider>
        <QuotationProvider>
          <ViewQuotationPageContent />
        </QuotationProvider>
      </EmployeeProvider>
    </CustomerProvider>
  );
};

export default ViewQuotationPage;