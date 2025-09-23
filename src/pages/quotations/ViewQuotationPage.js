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
  Avatar,
  useTheme,
} from '@mui/material';
import {
  Edit as EditIcon,
  Print as PrintIcon,
  GetApp as DownloadIcon,
  Receipt as ConvertIcon,
  Business as BusinessIcon,
  Person as PersonIcon,
  CalendarToday as CalendarIcon,
  AttachMoney as MoneyIcon,
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
    
    // Navigate to create invoice with pre-filled data from quotation
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

  return (
    <Layout 
      title={`Quotation ${currentQuotation.quotationNumber}`} 
      breadcrumbs={breadcrumbs}
    >
      <Box>
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
                      Phone: {currentQuotation.company.phone} | Email: {currentQuotation.company.email}
                    </Typography>
                    <Typography variant="body2">
                      GST: {currentQuotation.company.gstNumber}
                    </Typography>
                    {currentQuotation.company.website && (
                      <Typography variant="body2">
                        Website: {currentQuotation.company.website}
                      </Typography>
                    )}
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

                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Sales Person
                  </Typography>
                  <Typography variant="body1" fontWeight={600}>
                    {currentQuotation.salesPersonName}
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