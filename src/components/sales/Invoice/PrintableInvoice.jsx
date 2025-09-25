import React, { useEffect } from 'react';
import {
  Box,
  Typography,
  GlobalStyles,
} from '@mui/material';
import {
  Business as BusinessIcon,
  Receipt as ReceiptIcon,
  QrCode as QRCodeIcon,
} from '@mui/icons-material';
import { formatCurrency, formatDate } from '../../../utils/helpers/formatHelpers';

// Professional print styles optimized for invoices
const invoicePrintStyles = {
  '@media print': {
    // A4 Page setup with proper margins
    '@page': {
      size: 'A4',
      margin: '0.6in 0.5in',
      '@top-left': { content: 'none' },
      '@top-center': { content: 'none' },
      '@top-right': { content: 'none' },
      '@bottom-left': { content: 'none' },
      '@bottom-center': { content: 'none' },
      '@bottom-right': { content: 'none' },
    },
    
    // Hide everything except print content
    'body *': {
      visibility: 'hidden !important',
    },
    '.print-invoice-only, .print-invoice-only *': {
      visibility: 'visible !important',
    },
    '.print-invoice-only': {
      position: 'absolute !important',
      left: '0 !important',
      top: '0 !important',
      width: '100% !important',
      display: 'block !important',
      backgroundColor: 'white !important',
    },
    '.no-print-invoice': {
      display: 'none !important',
    },

    // Reset Material-UI styles for print
    '.MuiCard-root': {
      boxShadow: 'none !important',
      border: 'none !important',
      margin: '0 !important',
      padding: '0 !important',
      backgroundColor: 'transparent !important',
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

    // Print layout sections
    '.print-invoice-header': {
      borderBottom: '1px solid #000',
      paddingBottom: '15px',
      marginBottom: '25px',
      pageBreakAfter: 'avoid',
      display: 'flex !important',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
    },
    '.print-invoice-company-section': {
      flex: '1',
      paddingRight: '30px',
    },
    '.print-invoice-details-section': {
      textAlign: 'right',
      minWidth: '280px',
    },
    '.print-invoice-logo-section': {
      display: 'flex !important',
      alignItems: 'center',
      marginBottom: '15px',
      gap: '20px',
    },
    '.print-invoice-company-logo': {
      width: '65px',
      height: '65px',
      border: '2px solid #000',
      borderRadius: '8px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#f8f9fa',
      flexShrink: 0,
    },
    '.print-invoice-customer-sales-section': {
      display: 'flex !important',
      justifyContent: 'space-between',
      pageBreakAfter: 'avoid',
      gap: '20px',
      paddingTop: '20px',
      paddingBottom: '20px',
    },
    '.print-invoice-customer-info, .print-invoice-sales-info': {
      flex: '1',
      border: '1px solid #000',
      padding: '15px',
      borderRadius: '8px',
      backgroundColor: '#fafafa',
      marginBottom: '25px',
    },
    '.print-invoice-items-section': {
      pageBreakInside: 'avoid',
      marginBottom: '0px', // No margin to connect with totals
    },
    '.print-invoice-items-table': {
      width: '100%',
      borderCollapse: 'collapse',
      border: '1px solid #000',
      marginBottom: '0', // No margin to connect with totals
      '& th': {
        backgroundColor: '#e8f5e8 !important',
        border: '1px solid #000 !important',
        padding: '12px 8px !important',
        fontSize: '12px !important',
        fontWeight: 'bold !important',
        textAlign: 'center !important',
        lineHeight: '1.3 !important',
      },
      '& td': {
        border: '1px solid #000 !important',
        padding: '10px 8px !important',
        fontSize: '11px !important',
        verticalAlign: 'top !important',
        lineHeight: '1.4 !important',
      },
      '& thead': {
        pageBreakAfter: 'avoid',
      },
      '& tbody tr': {
        pageBreakInside: 'avoid',
        pageBreakAfter: 'auto',
      },
    },
    // NEW: Divider after items table
    '.print-invoice-totals-divider': {
      borderTop: '1px solid #000',
      margin: '0',
      marginBottom: '20px',
    },
    '.print-invoice-totals-section': {
      display: 'flex !important',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: '30px',
      pageBreakInside: 'avoid',
      gap: '25px',
    },
    '.print-invoice-remarks-section': {
      flex: '1',
    },
    '.print-invoice-totals-box': {
      border: '3px solid #000',
      padding: '20px',
      minWidth: '280px',
      backgroundColor: '#f0f8ff',
      borderRadius: '8px',
    },
    '.print-invoice-payment-details': {
      border: '2px solid #4caf50',
      padding: '18px',
      marginBottom: '25px',
      backgroundColor: '#e8f5e8',
      borderRadius: '8px',
      pageBreakInside: 'avoid',
    },
    '.print-invoice-footer-section': {
      display: 'flex !important',
      justifyContent: 'space-between',
      alignItems: 'flex-start', // FIXED: Changed from flex-end to flex-start for proper alignment
      marginTop: '40px',
      borderTop: '2px solid #000',
      paddingTop: '20px',
      pageBreakInside: 'avoid',
    },
    '.print-invoice-thank-you-section': {
      flex: '1',
      paddingRight: '25px',
    },
    '.print-invoice-qr-section': {
      textAlign: 'center',
      minWidth: '140px', // Fixed width for consistency
    },
    '.print-invoice-qr-code': {
      width: '140px',
      height: '140px',
      border: '2px solid #000',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#f8f9fa',
    //   margin: '0 auto',
      borderRadius: '8px',
    },

    // Typography adjustments for print
    'h1': { fontSize: '28px !important', margin: '0 0 10px 0 !important', fontWeight: 'bold !important' },
    'h2': { fontSize: '22px !important', margin: '0 0 8px 0 !important', fontWeight: 'bold !important' },
    'h3': { fontSize: '18px !important', margin: '0 0 6px 0 !important', fontWeight: 'bold !important' },
    'h4': { fontSize: '15px !important', margin: '0 0 5px 0 !important', fontWeight: 'bold !important' },
    'h5': { fontSize: '13px !important', margin: '0 0 4px 0 !important', fontWeight: 'bold !important' },
    'h6': { fontSize: '12px !important', margin: '0 0 3px 0 !important', fontWeight: 'bold !important' },
    'p, div, span': { fontSize: '11px !important', lineHeight: '1.5 !important', margin: '0 !important' },
    'small': { fontSize: '10px !important' },

    // Force black text and proper backgrounds
    '*, *::before, *::after': {
      color: 'black !important',
      backgroundColor: 'transparent !important',
      '-webkit-print-color-adjust': 'exact !important',
      'print-color-adjust': 'exact !important',
    },
    '.print-invoice-totals-box, .print-invoice-payment-details, .print-invoice-company-logo, .print-invoice-qr-code, .print-invoice-customer-info, .print-invoice-sales-info, .print-invoice-payment-status-section': {
      backgroundColor: '#f5f5f5 !important',
      '-webkit-print-color-adjust': 'exact !important',
      'print-color-adjust': 'exact !important',
    },
    '.print-invoice-items-table th': {
      backgroundColor: '#e8f5e8 !important',
      '-webkit-print-color-adjust': 'exact !important',
      'print-color-adjust': 'exact !important',
    },

    // Page break controls
    '.print-page-break-before': { pageBreakBefore: 'always' },
    '.print-page-break-after': { pageBreakAfter: 'always' },
    '.print-page-break-avoid': { pageBreakInside: 'avoid' },
  },
};

const PrintableInvoice = ({ invoice, onPrint, autoTriggerPrint = false }) => {
  // UPDATED: Use company details from invoice or fallback to defaults
  const getCompanyDetails = () => {
    // If invoice has company information, use it
    if (invoice?.company) {
      return {
        name: invoice.company.name || "Your Company Name",
        address: invoice.company.address || "123 Business Street",
        city: invoice.company.city || "Your City",
        state: invoice.company.state || "Your State",
        pincode: invoice.company.pincode || "123456",
        phone: invoice.company.phone || "+91 12345 67890",
        email: invoice.company.email || "info@yourcompany.com",
        gst: invoice.company.gstNumber || "24ABCDE1234F1Z5",
        website: invoice.company.website || "www.yourcompany.com",
      };
    }
    
    // Fallback to default values
    return {
      name: "Your Company Name",
      address: "123 Business Street",
      city: "Your City",
      state: "Your State",
      pincode: "123456",
      phone: "+91 12345 67890",
      email: "info@yourcompany.com",
      gst: "24ABCDE1234F1Z5",
      website: "www.yourcompany.com",
    };
  };

  const companyDetails = getCompanyDetails();

  // Auto-trigger print when component mounts and autoTriggerPrint is true
  useEffect(() => {
    if (autoTriggerPrint) {
      // Small delay to ensure component is fully rendered
      const timer = setTimeout(() => {
        handlePrint();
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [autoTriggerPrint]);

  // Handle print events
  useEffect(() => {
    if (autoTriggerPrint) {
      const handleAfterPrint = () => {
        // Call the onPrint callback when printing is done
        if (onPrint) {
          onPrint();
        }
      };

      const handleBeforePrint = () => {
        console.log('Print dialog opened');
      };

      // Listen for print events
      window.addEventListener('afterprint', handleAfterPrint);
      window.addEventListener('beforeprint', handleBeforePrint);

      // Also handle case where user cancels print dialog
      // This is a bit tricky - we'll use a timeout approach
      let printCheckTimer;
      const checkPrintCancel = () => {
        printCheckTimer = setTimeout(() => {
          // If we reach here and no print happened, user likely cancelled
          if (onPrint) {
            onPrint();
          }
        }, 1000); // Wait 1 second after print dialog
      };

      const clearPrintCheck = () => {
        if (printCheckTimer) {
          clearTimeout(printCheckTimer);
        }
      };

      window.addEventListener('beforeprint', clearPrintCheck);
      window.addEventListener('afterprint', clearPrintCheck);

      return () => {
        window.removeEventListener('afterprint', handleAfterPrint);
        window.removeEventListener('beforeprint', handleBeforePrint);
        window.removeEventListener('beforeprint', clearPrintCheck);
        window.removeEventListener('afterprint', clearPrintCheck);
        if (printCheckTimer) {
          clearTimeout(printCheckTimer);
        }
      };
    }
  }, [autoTriggerPrint, onPrint]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      <GlobalStyles styles={invoicePrintStyles} />
      
      {/* Screen view - Only show if NOT auto-triggering print */}
      {!autoTriggerPrint && (
        <Box className="no-print-invoice" sx={{ textAlign: 'center', p: 2 }}>
          <Typography variant="h5" gutterBottom>
            Invoice Print Preview
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            This is how your invoice will look when printed
          </Typography>
          <button
            onClick={handlePrint}
            style={{
              padding: '12px 24px',
              fontSize: '16px',
              backgroundColor: '#1976d2',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              marginBottom: '20px'
            }}
          >
            Print Invoice
          </button>
        </Box>
      )}

      {/* Print-only content */}
      <Box className="print-invoice-only" sx={{ display: autoTriggerPrint ? 'block' : 'none' }}>
        {/* Header with Company Info and Invoice Details */}
        <Box className="print-invoice-header">
          <Box className="print-invoice-company-section">
            <Box className="print-invoice-logo-section">
              <Box className="print-invoice-company-logo">
                <BusinessIcon style={{ fontSize: '35px' }} />
              </Box>
              <Box>
                <Typography variant="h2" style={{ fontWeight: 'bold', marginBottom: '5px' }}>
                  {companyDetails.name}
                </Typography>
                <Typography variant="body1" style={{ fontSize: '11px', color: '#666' }}>
                  Professional Business Solutions
                </Typography>
              </Box>
            </Box>
            
            <Box style={{ fontSize: '11px', lineHeight: '1.5' }}>
              <Typography variant="body2">
                {companyDetails.address}, {companyDetails.city}
              </Typography>
              <Typography variant="body2">
                {companyDetails.state} - {companyDetails.pincode}
              </Typography>
              <Typography variant="body2">
                Phone: {companyDetails.phone} | Email: {companyDetails.email}
              </Typography>
              <Typography variant="body2">
                GST: {companyDetails.gst}
              </Typography>
              <Typography variant="body2">
                Website: {companyDetails.website}
              </Typography>
            </Box>
          </Box>

          <Box className="print-invoice-details-section">
            <Typography variant="h1" style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'flex-end', 
              gap: '10px',
              marginBottom: '15px'
            }}>
              <ReceiptIcon style={{ fontSize: '28px' }} />
              INVOICE
            </Typography>
            
            <Box style={{ 
              border: '1px solid #000', 
              padding: '15px', 
              backgroundColor: '#f0f8ff',
              borderRadius: '8px',
              textAlign: 'left'
            }}>
              <Typography variant="body1" style={{ marginBottom: '5px' }}>
                <strong>Invoice #:</strong> {invoice.invoiceNumber}
              </Typography>
              <Typography variant="body1" style={{ marginBottom: '5px' }}>
                <strong>Date:</strong> {formatDate(invoice.saleDate)}
              </Typography>
              {invoice.dueDate && (
                <Typography variant="body1" style={{ marginBottom: '5px' }}>
                  <strong>Due Date:</strong> {formatDate(invoice.dueDate)}
                </Typography>
              )}
              <Typography variant="body1" style={{ marginBottom: '5px' }}>
                <strong>Type:</strong> {invoice.includeGST ? 'GST Invoice' : 'Non-GST Invoice'}
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Customer and Sales Person Information */}
        <Box className="print-invoice-customer-sales-section">
          <Box className="print-invoice-customer-info">
            <Typography variant="h4" style={{ marginBottom: '10px', borderBottom: '1px solid #000', paddingBottom: '8px', paddingTop: '3px' }}>
              Bill To:
            </Typography>
            <Typography variant="h5" style={{ fontWeight: 'bold', marginBottom: '6px' }}>
              {invoice.customerName || "Customer Name"}
            </Typography>
            {invoice.customerPhone && (
              <Typography variant="body2" style={{ marginBottom: '3px' }}>
                Phone: {invoice.customerPhone}
              </Typography>
            )}
            {invoice.customerAddress && (
              <Typography variant="body2" style={{ marginBottom: '3px' }}>
                Address: {invoice.customerAddress}
              </Typography>
            )}
            {invoice.customerState && (
              <Typography variant="body2" style={{ marginBottom: '3px' }}>
                State: {invoice.customerState}
              </Typography>
            )}
            {invoice.customerGSTNumber && (
              <Typography variant="body2">
                GST: {invoice.customerGSTNumber}
              </Typography>
            )}
          </Box>

          <Box className="print-invoice-sales-info">
            <Typography variant="h4" style={{ marginBottom: '10px', borderBottom: '1px solid #000', paddingBottom: '8px', paddingTop: '3px' }}>
              Sales Person:
            </Typography>
            <Typography variant="h5" style={{ fontWeight: 'bold', marginBottom: '6px' }}>
              {invoice.salesPersonName || "Sales Person"}
            </Typography>
            <Typography variant="body2" style={{ color: '#666' }}>
              Sales Representative
            </Typography>
            <Typography variant="body2" style={{ marginTop: '5px' }}>
              Sale Date: {formatDate(invoice.saleDate)}
            </Typography>
          </Box>
        </Box>

        {/* Items Table */}
        <Box className="print-invoice-items-section">
          <Typography variant="h4" style={{ marginBottom: '12px' }}>
            Invoice Items
            {/* UPDATED: Show bulk pricing indicator if applicable */}
            {(invoice.bulkPricingApplied || invoice.bulkPricingDetails) && (
              <span style={{ 
                marginLeft: '10px', 
                border: '1px solid #4caf50', 
                padding: '2px 6px', 
                fontSize: '9px',
                backgroundColor: '#e8f5e8',
                borderRadius: '4px'
              }}>
                Bulk Pricing Applied
              </span>
            )}
          </Typography>

          <table className="print-invoice-items-table">
            <thead>
              <tr>
                <th style={{ width: '5%' }}>#</th>
                <th style={{ width: '30%' }}>Description</th>
                <th style={{ width: '10%' }}>HSN Code</th>
                <th style={{ width: '8%' }}>Qty</th>
                <th style={{ width: '12%' }}>Unit Rate</th>
                {invoice.includeGST && (
                  <th style={{ width: '10%' }}>GST %</th>
                )}
                <th style={{ width: '15%' }}>Total Amount</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items?.map((item, index) => (
                <tr key={index}>
                  <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{index + 1}</td>
                  <td>
                    <strong style={{ fontSize: '12px' }}>{item.name}</strong>
                    {item.description && (
                      <div style={{ fontSize: '10px', color: '#666', marginTop: '3px' }}>
                        {item.description}
                      </div>
                    )}
                    {/* UPDATED: Show bulk pricing indicator for individual items */}
                    {(invoice.bulkPricingApplied || item.bulkPricing) && (
                      <div style={{ marginTop: '3px' }}>
                        <span style={{ 
                          border: '1px solid #4caf50', 
                          padding: '1px 4px', 
                          fontSize: '8px',
                          backgroundColor: '#e8f5e8',
                          borderRadius: '3px'
                        }}>
                          Bulk Pricing Applied
                        </span>
                      </div>
                    )}
                  </td>
                  <td style={{ textAlign: 'center', fontFamily: 'monospace' }}>
                    {item.hsnCode || "-"}
                  </td>
                  <td style={{ textAlign: 'center', fontWeight: 'bold' }}>
                    {item.quantity}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    {/* UPDATED: Show bulk pricing indicator or actual rate */}
                    {(invoice.bulkPricingApplied || item.bulkPricing) ? (
                      <span style={{ 
                        border: '1px solid #4caf50', 
                        padding: '1px 4px', 
                        fontSize: '8px',
                        backgroundColor: '#e8f5e8',
                        borderRadius: '3px'
                      }}>
                        Bulk
                      </span>
                    ) : (
                      formatCurrency(item.rate || 0)
                    )}
                  </td>
                  {invoice.includeGST && (
                    <td style={{ textAlign: 'center' }}>
                      {/* UPDATED: Show bulk GST slab or individual item GST */}
                      {(invoice.bulkPricingApplied || item.bulkPricing)
                        ? `${invoice.bulkPricingDetails?.gstSlab || 18}%`
                        : `${item.gstSlab || 18}%`}
                    </td>
                  )}
                  <td style={{ textAlign: 'right', fontWeight: 'bold' }}>
                    {/* UPDATED: Show bulk pricing indicator or actual amount */}
                    {(invoice.bulkPricingApplied || item.bulkPricing) ? (
                      <span style={{ 
                        border: '1px solid #2196f3', 
                        padding: '1px 4px', 
                        fontSize: '8px',
                        backgroundColor: '#e3f2fd',
                        borderRadius: '3px'
                      }}>
                        See Below
                      </span>
                    ) : (
                      formatCurrency(item.totalAmount || (item.quantity * item.rate))
                    )}
                  </td>
                </tr>
              ))}

              {(!invoice.items || invoice.items.length === 0) && (
                <tr>
                  <td 
                    colSpan={invoice.includeGST ? 7 : 6} 
                    style={{ textAlign: 'center', padding: '20px', color: '#666', fontStyle: 'italic' }}
                  >
                    No items found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </Box>

        {/* NEW: Divider line after items table */}
        <hr className="print-invoice-totals-divider" />

        {/* Totals Section with Remarks - NOW BELOW THE DIVIDER */}
        <Box className="print-invoice-totals-section">
          <Box className="print-invoice-remarks-section">
            {invoice.remarks && (
              <Box>
                <Typography variant="h4" style={{ marginBottom: '8px' }}>
                  Remarks:
                </Typography>
                <Typography variant="body2" style={{ 
                  whiteSpace: 'pre-wrap', 
                  lineHeight: '1.5',
                  padding: '10px',
                  backgroundColor: '#f9f9f9',
                  border: '1px solid #ddd',
                  borderRadius: '4px'
                }}>
                  {invoice.remarks}
                </Typography>
              </Box>
            )}
          </Box>

          {/* Totals Box - Now displays like quotation page */}
          <Box>
            <Box style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <Typography variant="body2">Subtotal:</Typography>
              <Typography variant="body2" style={{ fontWeight: 'bold' }}>
                {formatCurrency(invoice.subtotal || 0)}
              </Typography>
            </Box>

            {invoice.includeGST && invoice.totalGST > 0 && (
              <Box style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <Typography variant="body2">
                  Total GST ({invoice.customerState?.toLowerCase() === "gujarat" ? "CGST+SGST" : "IGST"}):
                </Typography>
                <Typography variant="body2" style={{ fontWeight: 'bold' }}>
                  {formatCurrency(invoice.totalGST || 0)}
                </Typography>
              </Box>
            )}

            <hr style={{ margin: '10px 0', border: 'none', borderTop: '2px solid #000' }} />

            <Box style={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="h5" style={{ fontWeight: 'bold' }}>
                Grand Total:
              </Typography>
              <Typography variant="h5" style={{ fontWeight: 'bold', color: '#2e7d32' }}>
                {formatCurrency(invoice.grandTotal || 0)}
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Footer with QR Code and Signature - FIXED ALIGNMENT */}
        <Box className="print-invoice-footer-section">
          <Box className="print-invoice-thank-you-section">
            <Typography variant="h5" style={{ marginBottom: '8px', color: '#1976d2' }}>
              Thank you for your business!
            </Typography>
            
            <Typography variant="body2" style={{ marginBottom: '4px' }}>
              For any queries: {companyDetails.phone}
            </Typography>
            <Typography variant="body2" style={{ marginBottom: '4px' }}>
              Visit us: {companyDetails.website}
            </Typography>
            <Typography variant="body2" style={{ marginBottom: '4px' }}>
              Email: {companyDetails.email}
            </Typography>
            <Typography variant="body2" style={{ fontSize: '10px', color: '#666', marginTop: '10px' }}>
              Generated on {formatDate(new Date())} | Powered by Business Management System
            </Typography>

            {/* Terms */}
            <Typography variant="body2" style={{ 
              fontSize: '10px', 
              fontStyle: 'italic', 
              marginTop: '15px',
              color: '#666'
            }}>
              This is a {invoice.includeGST ? "GST" : "Non-GST"} invoice
              {invoice.customerGSTNumber && " for GST registered customer"}
              {invoice.includeGST && invoice.customerState && 
                ` • ${invoice.customerState?.toLowerCase() === "gujarat" ? "Intra-State" : "Inter-State"} Transaction`}
            </Typography>
          </Box>

          <Box className="print-invoice-qr-section" >
            <Box className="print-invoice-qr-code">
              <QRCodeIcon style={{ fontSize: '50px' }} />
            </Box>
            
            {/* Signature */}
            <Box style={{ marginTop: '30px', textAlign: 'center', width: '100%' }}>
              <Box style={{ 
                width: '140px', 
                height: '50px', // Added height for signature space
                borderBottom: '1px solid #000', 
                margin: '0 auto 8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }} />
              <Typography variant="body2" style={{ fontSize: '11px', textAlign: 'center', paddingTop: '10px' }}>
                Authorized Signature
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>
    </>
  );
};

export default PrintableInvoice;