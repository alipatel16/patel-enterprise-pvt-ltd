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

// Helper function to detect company and return appropriate class
const getCompanyPrintClass = (companyName) => {
  if (!companyName) return 'print-format-default';
  
  const name = companyName.toLowerCase();
  
  if (name.includes('patel furniture')) {
    return 'print-format-patel-furniture';
  } else if (name.includes('patel electronics')) {
    return 'print-format-patel-electronics';
  } else if (name.includes('patel engineering')) {
    return 'print-format-patel-engineering';
  } else if (name.includes('m raj steel') || name.includes('raj steel')) {
    return 'print-format-raj-steel';
  }
  
  return 'print-format-default';
};

// Print styles with multiple company formats
const printStyles = {
  '@media print': {
    // Page setup for A4
    '@page': {
      size: 'A4',
      margin: '0.75in 0.5in',
    },
    // Hide everything except print content
    'body *': {
      visibility: 'hidden !important',
    },
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
    // Reset Material-UI styles
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
    // Force black text
    '*, *::before, *::after': {
      color: 'black !important',
      backgroundColor: 'transparent !important',
    },
    
    // ============================================
    // FORMAT 1: PATEL FURNITURE (Classic Bordered)
    // ============================================
    '.print-format-patel-furniture': {
      '& .print-header': {
        borderBottom: '2px solid #000',
        paddingBottom: '10px',
        marginBottom: '20px',
        pageBreakAfter: 'avoid',
      },
      '& .print-company-info': {
        marginBottom: '20px',
        pageBreakAfter: 'avoid',
      },
      '& .print-customer-info': {
        marginBottom: '20px',
        pageBreakAfter: 'avoid',
      },
      '& .print-items-table': {
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
        },
      },
      '& .print-totals': {
        marginTop: '20px',
        borderTop: '2px solid #000',
        paddingTop: '10px',
      },
      '& .print-footer': {
        marginTop: '30px',
        borderTop: '1px solid #000',
        paddingTop: '10px',
      },
    },

    // ============================================
    // FORMAT 2: PATEL ELECTRONICS (Modern Minimalist)
    // ============================================
    '.print-format-patel-electronics': {
      '& .print-header': {
        backgroundColor: '#f8f9fa !important',
        padding: '15px 20px',
        marginBottom: '25px',
        borderLeft: '4px solid #000',
        pageBreakAfter: 'avoid',
      },
      '& .print-header h1': {
        fontSize: '28px !important',
        fontWeight: '300 !important',
        letterSpacing: '2px !important',
        margin: '0 0 5px 0 !important',
      },
      '& .print-company-info': {
        marginBottom: '20px',
        paddingLeft: '15px',
        borderLeft: '3px solid #000',
        pageBreakAfter: 'avoid',
      },
      '& .print-company-info h3': {
        fontSize: '12px !important',
        fontWeight: 'normal !important',
        textTransform: 'uppercase',
        letterSpacing: '1px',
        marginBottom: '8px !important',
      },
      '& .print-customer-info': {
        marginBottom: '25px',
        padding: '15px',
        backgroundColor: '#fafafa !important',
        pageBreakAfter: 'avoid',
      },
      '& .print-items-table': {
        width: '100%',
        borderCollapse: 'collapse',
        marginBottom: '20px',
        '& thead': {
          borderBottom: '2px solid #000',
        },
        '& th': {
          backgroundColor: 'transparent !important',
          border: 'none !important',
          borderBottom: '2px solid #000 !important',
          padding: '10px 8px !important',
          fontSize: '11px !important',
          fontWeight: 'bold !important',
          textAlign: 'left !important',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
        },
        '& td': {
          border: 'none !important',
          borderBottom: '1px solid #ddd !important',
          padding: '10px 8px !important',
          fontSize: '11px !important',
        },
        '& tbody tr:last-child td': {
          borderBottom: 'none !important',
        },
      },
      '& .print-totals': {
        marginTop: '30px',
        paddingTop: '15px',
        borderTop: '2px solid #000',
      },
      '& .print-footer': {
        marginTop: '40px',
        paddingTop: '15px',
        borderTop: '1px solid #ccc',
      },
    },

    // ============================================
    // FORMAT 3: PATEL ENGINEERING (Side Panel)
    // ============================================
    '.print-format-patel-engineering': {
      display: 'flex',
      flexDirection: 'column',
      
      '& .print-header': {
        textAlign: 'center',
        padding: '20px 0',
        marginBottom: '20px',
        borderBottom: '3px double #000',
        pageBreakAfter: 'avoid',
      },
      '& .print-header h1': {
        fontSize: '26px !important',
        fontWeight: 'bold !important',
        textTransform: 'uppercase',
        letterSpacing: '3px !important',
        margin: '0 !important',
      },
      '& .engineering-layout': {
        display: 'flex',
        gap: '20px',
        marginBottom: '20px',
      },
      '& .engineering-sidebar': {
        width: '35%',
        paddingRight: '15px',
        borderRight: '2px solid #000',
      },
      '& .engineering-main': {
        width: '65%',
      },
      '& .print-company-info': {
        marginBottom: '15px',
        padding: '12px',
        backgroundColor: '#f5f5f5 !important',
        border: '1px solid #000',
      },
      '& .print-company-info h4': {
        fontSize: '13px !important',
        fontWeight: 'bold !important',
        marginBottom: '8px !important',
      },
      '& .print-customer-info': {
        marginBottom: '15px',
        padding: '12px',
        border: '1px solid #000',
      },
      '& .print-customer-info h3': {
        fontSize: '13px !important',
        fontWeight: 'bold !important',
        marginBottom: '8px !important',
        textTransform: 'uppercase',
      },
      '& .print-items-table': {
        width: '100%',
        borderCollapse: 'collapse',
        marginBottom: '20px',
        border: '2px solid #000',
        '& th': {
          backgroundColor: '#000 !important',
          color: '#fff !important',
          border: '1px solid #000 !important',
          padding: '8px !important',
          fontSize: '11px !important',
          fontWeight: 'bold !important',
          textAlign: 'center !important',
        },
        '& td': {
          border: '1px solid #000 !important',
          padding: '6px 8px !important',
          fontSize: '11px !important',
        },
      },
      '& .print-totals': {
        marginTop: '20px',
        padding: '15px',
        backgroundColor: '#f5f5f5 !important',
        border: '2px solid #000',
      },
      '& .print-footer': {
        marginTop: '30px',
        paddingTop: '15px',
        borderTop: '2px solid #000',
        textAlign: 'center',
      },
    },

    // ============================================
    // FORMAT 4: M RAJ STEEL (Bold Contemporary)
    // ============================================
    '.print-format-raj-steel': {
      '& .print-header': {
        position: 'relative',
        paddingBottom: '20px',
        marginBottom: '25px',
        borderBottom: '4px solid #000',
        pageBreakAfter: 'avoid',
      },
      '& .print-header::after': {
        content: '""',
        position: 'absolute',
        bottom: '-4px',
        left: '0',
        width: '30%',
        height: '4px',
        backgroundColor: '#666 !important',
      },
      '& .print-header h1': {
        fontSize: '32px !important',
        fontWeight: 'bold !important',
        margin: '0 0 8px 0 !important',
        textTransform: 'uppercase',
        letterSpacing: '2px !important',
      },
      '& .steel-info-grid': {
        display: 'flex',
        gap: '20px',
        marginBottom: '25px',
      },
      '& .steel-info-box': {
        flex: '1',
        padding: '15px',
        border: '2px solid #000',
        position: 'relative',
      },
      '& .steel-info-box::before': {
        content: '""',
        position: 'absolute',
        top: '-2px',
        left: '-2px',
        width: '20px',
        height: '20px',
        border: '2px solid #000',
        borderRight: 'none',
        borderBottom: 'none',
      },
      '& .print-company-info': {
        marginBottom: '0',
        pageBreakAfter: 'avoid',
      },
      '& .print-company-info h3': {
        fontSize: '14px !important',
        fontWeight: 'bold !important',
        textTransform: 'uppercase',
        marginBottom: '10px !important',
        paddingBottom: '5px',
        borderBottom: '2px solid #000',
      },
      '& .print-customer-info': {
        marginBottom: '0',
        pageBreakAfter: 'avoid',
      },
      '& .print-customer-info h3': {
        fontSize: '14px !important',
        fontWeight: 'bold !important',
        textTransform: 'uppercase',
        marginBottom: '10px !important',
        paddingBottom: '5px',
        borderBottom: '2px solid #000',
      },
      '& .print-items-table': {
        width: '100%',
        borderCollapse: 'collapse',
        marginBottom: '20px',
        marginTop: '25px',
        '& thead': {
          backgroundColor: '#000 !important',
        },
        '& th': {
          backgroundColor: '#000 !important',
          color: '#fff !important',
          border: '2px solid #000 !important',
          padding: '12px 8px !important',
          fontSize: '12px !important',
          fontWeight: 'bold !important',
          textAlign: 'center !important',
          textTransform: 'uppercase',
        },
        '& td': {
          border: '1px solid #333 !important',
          padding: '8px !important',
          fontSize: '11px !important',
        },
        '& tbody tr:nth-child(even)': {
          backgroundColor: '#fafafa !important',
        },
      },
      '& .print-totals': {
        marginTop: '25px',
        padding: '15px 20px',
        border: '3px solid #000',
        backgroundColor: '#f8f8f8 !important',
      },
      '& .print-totals .total-row': {
        backgroundColor: '#000 !important',
        color: '#fff !important',
        padding: '10px',
        marginTop: '10px',
        fontWeight: 'bold !important',
      },
      '& .print-footer': {
        marginTop: '40px',
        paddingTop: '20px',
        borderTop: '3px solid #000',
      },
    },

    // Common styles for all formats
    '.page-break-avoid': {
      pageBreakInside: 'avoid',
    },
    'h1': { fontSize: '24px !important', margin: '0 0 10px 0 !important' },
    'h2': { fontSize: '18px !important', margin: '0 0 8px 0 !important' },
    'h3': { fontSize: '16px !important', margin: '0 0 6px 0 !important' },
    'h4': { fontSize: '14px !important', margin: '0 0 4px 0 !important' },
    'h5': { fontSize: '13px !important', margin: '0 0 4px 0 !important' },
    'h6': { fontSize: '12px !important', margin: '0 0 4px 0 !important' },
    'p, div, span': { fontSize: '11px !important', lineHeight: '1.4 !important' },
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

  useEffect(() => {
    if (id) {
      getQuotationById(id);
    }
  }, [id, getQuotationById]);

  const getQuotationStatus = (quotation) => {
    if (!quotation) return 'active';
    if (quotation.converted) return 'converted';
    if (quotation.status === 'cancelled') return 'cancelled';
    
    if (quotation.validUntil) {
      const validUntil = new Date(quotation.validUntil);
      const today = new Date();
      if (validUntil < today && quotation.status === 'active') {
        return 'expired';
      }
    }
    
    return quotation.status || 'active';
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-IN');
  };

  const formatCurrency = (amount) => {
    if (!amount) return '₹0.00';
    return `₹${parseFloat(amount).toLocaleString('en-IN', { 
      minimumFractionDigits: 2,
      maximumFractionDigits: 2 
    })}`;
  };

  const handleConvertToInvoice = () => {
    if (!currentQuotation) return;
    
    navigate('/sales/create', { 
      state: { 
        fromQuotation: true, 
        quotationData: currentQuotation 
      } 
    });
  };

  const handleEditQuotation = () => {
    navigate(`/quotations/edit/${id}`);
  };

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
  
  // Get company-specific print class
  const printFormatClass = getCompanyPrintClass(currentQuotation.company?.name);

  // Print Content Component
  const PrintContent = () => {
    const companyName = currentQuotation.company?.name?.toLowerCase() || '';
    
    // Check which format to use
    const isPatelFurniture = companyName.includes('patel furniture');
    const isPatelElectronics = companyName.includes('patel electronics');
    const isPatelEngineering = companyName.includes('patel engineering');
    const isRajSteel = companyName.includes('m raj steel') || companyName.includes('raj steel');

    // PATEL ENGINEERING FORMAT (Side Panel Layout)
    if (isPatelEngineering) {
      return (
        <Box className={`print-only ${printFormatClass}`} sx={{ display: 'none' }}>
          <Box className="print-header">
            <Typography variant="h1">QUOTATION</Typography>
            <Box display="flex" justifyContent="space-between" sx={{ mt: 1 }}>
              <Typography variant="body1">
                Quote #{currentQuotation.quotationNumber}
              </Typography>
              <Typography variant="body1">
                Date: {formatDate(currentQuotation.quotationDate)}
              </Typography>
            </Box>
          </Box>

          <Box className="engineering-layout">
            <Box className="engineering-sidebar">
              {currentQuotation.company && (
                <Box className="print-company-info">
                  <Typography variant="h4">{currentQuotation.company.name}</Typography>
                  <Typography variant="body1">{currentQuotation.company.address}</Typography>
                  <Typography variant="body1">
                    {currentQuotation.company.city}, {currentQuotation.company.state} - {currentQuotation.company.pincode}
                  </Typography>
                  <Typography variant="body1">Ph: {currentQuotation.company.phone}</Typography>
                  <Typography variant="body1">GST: {currentQuotation.company.gstNumber}</Typography>
                </Box>
              )}

              <Box className="print-customer-info">
                <Typography variant="h3">Bill To:</Typography>
                <Typography variant="h4">{currentQuotation.customerName}</Typography>
                <Typography variant="body1">{currentQuotation.customerAddress}</Typography>
                <Typography variant="body1">Ph: {currentQuotation.customerPhone}</Typography>
                {currentQuotation.customerGSTNumber && (
                  <Typography variant="body1">GST: {currentQuotation.customerGSTNumber}</Typography>
                )}
              </Box>

              <Box sx={{ mt: 2 }}>
                <Typography variant="body1"><strong>Valid Until:</strong></Typography>
                <Typography variant="body1">{formatDate(currentQuotation.validUntil)}</Typography>
              </Box>
            </Box>

            <Box className="engineering-main">
              <table className="print-items-table">
                <thead>
                  <tr>
                    <th style={{ width: '5%' }}>No.</th>
                    <th style={{ width: '40%' }}>Description</th>
                    <th style={{ width: '10%' }}>HSN</th>
                    <th style={{ width: '10%' }}>Qty</th>
                    <th style={{ width: '15%' }}>Rate</th>
                    {currentQuotation.includeGST && <th style={{ width: '8%' }}>GST</th>}
                    <th style={{ width: '15%' }}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {currentQuotation.items?.map((item, index) => (
                    <tr key={index}>
                      <td style={{ textAlign: 'center' }}>{index + 1}</td>
                      <td>
                        <strong>{item.name}</strong>
                        {item.description && (
                          <div style={{ fontSize: '10px', marginTop: '2px' }}>
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

              <Box className="print-totals">
                <Box display="flex" justifyContent="space-between" sx={{ mb: 0.5 }}>
                  <Typography variant="body1">Subtotal:</Typography>
                  <Typography variant="body1">{formatCurrency(currentQuotation.subtotal)}</Typography>
                </Box>
                {currentQuotation.includeGST && (
                  <Box display="flex" justifyContent="space-between" sx={{ mb: 0.5 }}>
                    <Typography variant="body1">GST:</Typography>
                    <Typography variant="body1">{formatCurrency(currentQuotation.totalGST)}</Typography>
                  </Box>
                )}
                <Box display="flex" justifyContent="space-between" sx={{ mt: 1, pt: 1, borderTop: '2px solid #000' }}>
                  <Typography variant="h5" sx={{ fontWeight: 'bold' }}>Total:</Typography>
                  <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                    {formatCurrency(currentQuotation.grandTotal)}
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Box>

          {currentQuotation.termsAndConditions && (
            <Box className="page-break-avoid" sx={{ mt: 2 }}>
              <Typography variant="h3">Terms & Conditions:</Typography>
              <Typography variant="body1" sx={{ whiteSpace: 'pre-line' }}>
                {currentQuotation.termsAndConditions}
              </Typography>
            </Box>
          )}

          <Box className="print-footer">
            <Typography variant="body1" align="center">
              For {currentQuotation.company?.name}
            </Typography>
            <Typography variant="body1" align="center" sx={{ mt: 3 }}>
              _______________________
            </Typography>
            <Typography variant="body1" align="center">Authorized Signatory</Typography>
          </Box>
        </Box>
      );
    }

    // M RAJ STEEL FORMAT (Bold Contemporary)
    if (isRajSteel) {
      return (
        <Box className={`print-only ${printFormatClass}`} sx={{ display: 'none' }}>
          <Box className="print-header">
            <Typography variant="h1">QUOTATION</Typography>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="h4">#{currentQuotation.quotationNumber}</Typography>
              <Typography variant="body1">Date: {formatDate(currentQuotation.quotationDate)}</Typography>
            </Box>
          </Box>

          <Box className="steel-info-grid">
            <Box className="steel-info-box print-company-info">
              <Typography variant="h3">FROM</Typography>
              {currentQuotation.company && (
                <>
                  <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
                    {currentQuotation.company.name}
                  </Typography>
                  <Typography variant="body1">{currentQuotation.company.address}</Typography>
                  <Typography variant="body1">
                    {currentQuotation.company.city}, {currentQuotation.company.state} - {currentQuotation.company.pincode}
                  </Typography>
                  <Typography variant="body1">Phone: {currentQuotation.company.phone}</Typography>
                  <Typography variant="body1">GST: {currentQuotation.company.gstNumber}</Typography>
                </>
              )}
            </Box>

            <Box className="steel-info-box print-customer-info">
              <Typography variant="h3">TO</Typography>
              <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
                {currentQuotation.customerName}
              </Typography>
              <Typography variant="body1">{currentQuotation.customerAddress}</Typography>
              <Typography variant="body1">Phone: {currentQuotation.customerPhone}</Typography>
              {currentQuotation.customerGSTNumber && (
                <Typography variant="body1">GST: {currentQuotation.customerGSTNumber}</Typography>
              )}
              <Typography variant="body1" sx={{ mt: 1 }}>
                <strong>Valid Until:</strong> {formatDate(currentQuotation.validUntil)}
              </Typography>
            </Box>
          </Box>

          <table className="print-items-table">
            <thead>
              <tr>
                <th style={{ width: '5%' }}>#</th>
                <th style={{ width: '35%' }}>ITEM DETAILS</th>
                <th style={{ width: '10%' }}>HSN</th>
                <th style={{ width: '10%' }}>QTY</th>
                <th style={{ width: '12%' }}>RATE</th>
                {currentQuotation.includeGST && <th style={{ width: '8%' }}>GST</th>}
                <th style={{ width: '15%' }}>AMOUNT</th>
              </tr>
            </thead>
            <tbody>
              {currentQuotation.items?.map((item, index) => (
                <tr key={index}>
                  <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{index + 1}</td>
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
                  <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{formatCurrency(item.totalAmount)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <Box className="print-totals">
            <Box display="flex" justifyContent="flex-end">
              <Box sx={{ width: '40%' }}>
                <Box display="flex" justifyContent="space-between" sx={{ mb: 0.5 }}>
                  <Typography variant="body1">Subtotal:</Typography>
                  <Typography variant="body1">{formatCurrency(currentQuotation.subtotal)}</Typography>
                </Box>
                {currentQuotation.includeGST && (
                  <Box display="flex" justifyContent="space-between" sx={{ mb: 0.5 }}>
                    <Typography variant="body1">GST:</Typography>
                    <Typography variant="body1">{formatCurrency(currentQuotation.totalGST)}</Typography>
                  </Box>
                )}
                <Box className="total-row" display="flex" justifyContent="space-between" sx={{ p: 1 }}>
                  <Typography variant="h5">TOTAL:</Typography>
                  <Typography variant="h5">{formatCurrency(currentQuotation.grandTotal)}</Typography>
                </Box>
              </Box>
            </Box>
          </Box>

          {currentQuotation.termsAndConditions && (
            <Box className="page-break-avoid" sx={{ mt: 2 }}>
              <Typography variant="h3" sx={{ mb: 1 }}>TERMS & CONDITIONS</Typography>
              <Typography variant="body1" sx={{ whiteSpace: 'pre-line' }}>
                {currentQuotation.termsAndConditions}
              </Typography>
            </Box>
          )}

          <Box className="print-footer">
            <Grid container>
              <Grid item xs={6}>
                <Typography variant="body1">Thank you for your business!</Typography>
              </Grid>
              <Grid item xs={6} sx={{ textAlign: 'right' }}>
                <Box sx={{ mt: 3 }}>
                  <Typography variant="body1">_______________________</Typography>
                  <Typography variant="body1">Authorized Signature</Typography>
                </Box>
              </Grid>
            </Grid>
          </Box>
        </Box>
      );
    }

    // PATEL ELECTRONICS FORMAT (Modern Minimalist)
    if (isPatelElectronics) {
      return (
        <Box className={`print-only ${printFormatClass}`} sx={{ display: 'none' }}>
          <Box className="print-header">
            <Typography variant="h1">QUOTATION</Typography>
            <Box display="flex" justifyContent="space-between" sx={{ mt: 1 }}>
              <Typography variant="h4">Quote #{currentQuotation.quotationNumber}</Typography>
              <Typography variant="body1">Date: {formatDate(currentQuotation.quotationDate)}</Typography>
            </Box>
          </Box>

          {currentQuotation.company && (
            <Box className="print-company-info">
              <Typography variant="h3">From</Typography>
              <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                {currentQuotation.company.name}
              </Typography>
              <Typography variant="body1">{currentQuotation.company.address}</Typography>
              <Typography variant="body1">
                {currentQuotation.company.city}, {currentQuotation.company.state} - {currentQuotation.company.pincode}
              </Typography>
              <Typography variant="body1">Phone: {currentQuotation.company.phone}</Typography>
              <Typography variant="body1">GST: {currentQuotation.company.gstNumber}</Typography>
            </Box>
          )}

          <Box className="print-customer-info">
            <Typography variant="h3" sx={{ mb: 1, fontSize: '12px !important', textTransform: 'uppercase', letterSpacing: '1px' }}>
              To
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 0.5 }}>
              {currentQuotation.customerName}
            </Typography>
            <Typography variant="body1">{currentQuotation.customerAddress}</Typography>
            <Typography variant="body1">Phone: {currentQuotation.customerPhone}</Typography>
            {currentQuotation.customerGSTNumber && (
              <Typography variant="body1">GST: {currentQuotation.customerGSTNumber}</Typography>
            )}
            <Typography variant="body1" sx={{ mt: 1 }}>
              Valid Until: {formatDate(currentQuotation.validUntil)}
            </Typography>
          </Box>

          <table className="print-items-table">
            <thead>
              <tr>
                <th style={{ width: '5%', textAlign: 'center' }}>No</th>
                <th style={{ width: '40%' }}>Item Description</th>
                <th style={{ width: '10%', textAlign: 'center' }}>HSN</th>
                <th style={{ width: '8%', textAlign: 'center' }}>Qty</th>
                <th style={{ width: '12%', textAlign: 'right' }}>Rate</th>
                {currentQuotation.includeGST && <th style={{ width: '8%', textAlign: 'center' }}>GST</th>}
                <th style={{ width: '12%', textAlign: 'right' }}>Amount</th>
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

          <Box className="print-totals">
            <Grid container>
              <Grid item xs={7}></Grid>
              <Grid item xs={5}>
                <Box display="flex" justifyContent="space-between" sx={{ mb: 0.5 }}>
                  <Typography variant="body1">Subtotal:</Typography>
                  <Typography variant="body1">{formatCurrency(currentQuotation.subtotal)}</Typography>
                </Box>
                {currentQuotation.includeGST && (
                  <Box display="flex" justifyContent="space-between" sx={{ mb: 0.5 }}>
                    <Typography variant="body1">GST:</Typography>
                    <Typography variant="body1">{formatCurrency(currentQuotation.totalGST)}</Typography>
                  </Box>
                )}
                <Box display="flex" justifyContent="space-between" sx={{ pt: 1, borderTop: '2px solid #000' }}>
                  <Typography variant="h5" sx={{ fontWeight: 'bold' }}>Total:</Typography>
                  <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                    {formatCurrency(currentQuotation.grandTotal)}
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Box>

          {currentQuotation.termsAndConditions && (
            <Box className="page-break-avoid" sx={{ mt: 3 }}>
              <Typography variant="h3" sx={{ mb: 1 }}>Terms & Conditions</Typography>
              <Typography variant="body1" sx={{ whiteSpace: 'pre-line' }}>
                {currentQuotation.termsAndConditions}
              </Typography>
            </Box>
          )}

          {currentQuotation.remarks && (
            <Box className="page-break-avoid" sx={{ mt: 2 }}>
              <Typography variant="h3" sx={{ mb: 1 }}>Remarks</Typography>
              <Typography variant="body1">{currentQuotation.remarks}</Typography>
            </Box>
          )}

          <Box className="print-footer">
            <Grid container>
              <Grid item xs={6}>
                <Typography variant="body1">Thank you for your business</Typography>
                <Typography variant="body1" sx={{ fontSize: '10px !important', mt: 0.5 }}>
                  Quote valid until {formatDate(currentQuotation.validUntil)}
                </Typography>
              </Grid>
              <Grid item xs={6} sx={{ textAlign: 'right' }}>
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body1">_______________________</Typography>
                  <Typography variant="body1">Authorized Signature</Typography>
                </Box>
              </Grid>
            </Grid>
          </Box>
        </Box>
      );
    }

    // DEFAULT FORMAT (PATEL FURNITURE - Original Classic Bordered)
    return (
      <Box className={`print-only ${printFormatClass}`} sx={{ display: 'none' }}>
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

        {currentQuotation.termsAndConditions && (
          <Box className="page-break-avoid" sx={{ mt: 3 }}>
            <Typography variant="h3" sx={{ mb: 1 }}>Terms & Conditions:</Typography>
            <Typography variant="body1" sx={{ whiteSpace: 'pre-line', lineHeight: 1.4 }}>
              {currentQuotation.termsAndConditions}
            </Typography>
          </Box>
        )}

        {currentQuotation.remarks && (
          <Box className="page-break-avoid" sx={{ mt: 2 }}>
            <Typography variant="h3" sx={{ mb: 1 }}>Remarks:</Typography>
            <Typography variant="body1">{currentQuotation.remarks}</Typography>
          </Box>
        )}

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
  };

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
            <Grid item xs={12} lg={8}>
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

            <Grid item xs={12} lg={4}>
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

      <PrintContent />
    </>
  );
};

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