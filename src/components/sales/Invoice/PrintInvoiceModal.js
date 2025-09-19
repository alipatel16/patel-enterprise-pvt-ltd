import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
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
  Stack,
  Paper,
  Button,
  IconButton,
} from "@mui/material";
import {
  Close as CloseIcon,
  Print as PrintIcon,
  Business as BusinessIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  LocationOn as LocationIcon,
  Assignment as GSTIcon,
  QrCode as QrCodeIcon,
} from "@mui/icons-material";

import {
  formatCurrency,
  formatDate,
} from "../../../utils/helpers/formatHelpers";

// Translation object
const translations = {
  en: {
    invoice: "INVOICE",
    billTo: "Bill To:",
    invoiceNumber: "Invoice #",
    date: "Date",
    invoiceType: "Invoice Type",
    gstInvoice: "GST Invoice",
    nonGstInvoice: "Non-GST Invoice",
    description: "Description",
    hsnCode: "HSN Code",
    qty: "Qty",
    rate: "Rate",
    gst: "GST %",
    amount: "Amount",
    subtotal: "Subtotal",
    totalGST: "Total GST",
    grandTotal: "Grand Total",
    amountInWords: "Amount in Words",
    thankYou: "Thank you for your business!",
    terms: "Terms & Conditions",
    authorizedSignature: "Authorized Signature",
    phone: "Phone",
    email: "Email",
    address: "Address",
    companyGST: "GSTIN",
    customerGST: "Customer GSTIN",
    printInvoice: "Print Invoice",
    payHere: "Scan to Pay",
    cgstSgst: "CGST+SGST",
    igst: "IGST",
  },
  gu: {
    invoice: "બિલ",
    billTo: "ગ્રાહક:",
    invoiceNumber: "બિલ નંબર",
    date: "તારીખ",
    invoiceType: "બિલ પ્રકાર",
    gstInvoice: "GST બિલ",
    nonGstInvoice: "બિન-GST બિલ",
    description: "વર્ણન",
    hsnCode: "HSN કોડ",
    qty: "જથ્થો",
    rate: "ભાવ",
    gst: "GST %",
    amount: "રકમ",
    subtotal: "પેટા કુલ",
    totalGST: "કુલ GST",
    grandTotal: "કુલ રકમ",
    amountInWords: "શબ્દોમાં રકમ",
    thankYou: "તમારા વ્યવસાય માટે આભાર!",
    terms: "શરતો અને નિયમો",
    authorizedSignature: "અધિકૃત સહી",
    phone: "ફોન",
    email: "ઈમેલ",
    address: "સરનામું",
    companyGST: "GSTIN",
    customerGST: "ગ્રાહક GSTIN",
    printInvoice: "પ્રિન્ટ કરો",
    payHere: "ચુકવણી માટે સ્કેન",
    cgstSgst: "CGST+SGST",
    igst: "IGST",
  }
};

// Number to words conversion
const numberToWords = (num) => {
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];

  if (num === 0) return 'Zero';

  const convertLessThanThousand = (n) => {
    if (n === 0) return '';
    if (n < 10) return ones[n];
    if (n < 20) return teens[n - 10];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + ones[n % 10] : '');
    return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 !== 0 ? ' ' + convertLessThanThousand(n % 100) : '');
  };

  const crore = Math.floor(num / 10000000);
  const lakh = Math.floor((num % 10000000) / 100000);
  const thousand = Math.floor((num % 100000) / 1000);
  const hundred = num % 1000;

  let result = '';
  if (crore > 0) result += convertLessThanThousand(crore) + ' Crore ';
  if (lakh > 0) result += convertLessThanThousand(lakh) + ' Lakh ';
  if (thousand > 0) result += convertLessThanThousand(thousand) + ' Thousand ';
  if (hundred > 0) result += convertLessThanThousand(hundred);

  return result.trim() + ' Rupees Only';
};

const PrintInvoiceModal = ({ open, onClose, invoice }) => {
  const [language, setLanguage] = useState('en');
  const t = translations[language];

  if (!invoice) return null;

  const companyDetails = {
    name: "Patel Enterprise Pvt Ltd",
    address: "123 Business Street",
    city: "Ahmedabad",
    state: "Gujarat",
    pincode: "380001",
    phone: "+91 79 1234 5678",
    email: "info@patelenterprise.com",
    gst: "24ABCDE1234F1Z5",
    website: "www.patelenterprise.com",
  };

  const handlePrint = () => {
    window.print();
  };

  // Helper functions for item display
  const getItemDisplayRate = (item) => {
    if (item.baseAmount !== undefined) {
      return item.isPriceInclusive ? item.baseAmount : item.rate;
    }
    return item.rate || 0;
  };

  const getItemTotalAmount = (item) => {
    if (item.totalAmount !== undefined) {
      return item.totalAmount;
    }
    return (item.quantity || 0) * (item.rate || 0);
  };

  const isBulkPricingInvoice = invoice.bulkPricingApplied || 
    (invoice.bulkPricingDetails && invoice.items?.some(item => item.bulkPricing));

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={false}
      fullScreen
      PaperProps={{
        sx: {
          backgroundColor: '#f5f5f5',
        }
      }}
    >
      <DialogContent sx={{ p: 0 }}>
        {/* Print Controls - Hidden during print */}
        <Box 
          className="no-print" 
          sx={{ 
            position: 'sticky',
            top: 0,
            zIndex: 1000,
            backgroundColor: 'white',
            borderBottom: '1px solid #e0e0e0',
            p: 2,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <Typography variant="h6">Print Invoice</Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant={language === 'en' ? 'contained' : 'outlined'}
              size="small"
              onClick={() => setLanguage('en')}
            >
              English
            </Button>
            <Button
              variant={language === 'gu' ? 'contained' : 'outlined'}
              size="small"
              onClick={() => setLanguage('gu')}
            >
              ગુજરાતી
            </Button>
            <Button
              variant="contained"
              startIcon={<PrintIcon />}
              onClick={handlePrint}
            >
              {t.printInvoice}
            </Button>
            <IconButton onClick={onClose}>
              <CloseIcon />
            </IconButton>
          </Box>
        </Box>

        {/* Invoice Content */}
        <Box sx={{ p: 3, display: 'flex', justifyContent: 'center' }}>
          <Card
            sx={{
              width: '210mm',
              minHeight: '297mm',
              backgroundColor: 'white',
              boxShadow: '0 0 20px rgba(0,0,0,0.1)',
              '@media print': {
                width: '100%',
                boxShadow: 'none',
                margin: 0,
                pageBreakAfter: 'always',
              }
            }}
          >
            <CardContent sx={{ p: '15mm' }}>
              {/* Header with Logo and Company Details */}
              <Grid container spacing={2} sx={{ mb: 3, borderBottom: '3px solid #1976d2', pb: 2, pageBreakInside: 'avoid' }}>
                {/* Company Logo and Info */}
                <Grid item xs={7}>
                  <Box sx={{ display: 'flex', gap: 2, mb: 1 }}>
                    {/* Logo Placeholder */}
                    <Box
                      sx={{
                        width: 60,
                        height: 60,
                        backgroundColor: '#f0f0f0',
                        borderRadius: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '2px dashed #ccc',
                      }}
                    >
                      <BusinessIcon sx={{ fontSize: 30, color: '#999' }} />
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="h5" fontWeight={700} sx={{ color: '#1976d2', fontSize: '24px', mb: 0.5 }}>
                        {companyDetails.name}
                      </Typography>
                      <Typography variant="caption" sx={{ fontSize: '10px', color: 'text.secondary' }}>
                        Business Solutions Provider
                      </Typography>
                    </Box>
                  </Box>
                  
                  <Stack spacing={0.2} sx={{ fontSize: '10px' }}>
                    <Typography variant="body2" sx={{ fontSize: '10px' }}>
                      <LocationIcon sx={{ fontSize: 10, mr: 0.5, verticalAlign: 'middle' }} />
                      {companyDetails.address}, {companyDetails.city}, {companyDetails.state} - {companyDetails.pincode}
                    </Typography>
                    <Typography variant="body2" sx={{ fontSize: '10px' }}>
                      <PhoneIcon sx={{ fontSize: 10, mr: 0.5, verticalAlign: 'middle' }} />
                      {t.phone}: {companyDetails.phone} | 
                      <EmailIcon sx={{ fontSize: 10, mx: 0.5, verticalAlign: 'middle' }} />
                      {t.email}: {companyDetails.email}
                    </Typography>
                    <Typography variant="body2" sx={{ fontSize: '10px' }}>
                      <GSTIcon sx={{ fontSize: 10, mr: 0.5, verticalAlign: 'middle' }} />
                      {t.companyGST}: {companyDetails.gst}
                    </Typography>
                  </Stack>
                </Grid>

                {/* Invoice Details and QR */}
                <Grid item xs={5}>
                  <Box sx={{ textAlign: 'right' }}>
                    <Typography variant="h3" fontWeight={700} sx={{ color: '#1976d2', fontSize: '28px', mb: 1 }}>
                      {t.invoice}
                    </Typography>
                    
                    <Grid container spacing={1}>
                      <Grid item xs={8}>
                        <Paper
                          elevation={0}
                          sx={{
                            p: 1.5,
                            border: '2px solid #1976d2',
                            borderRadius: 1,
                            textAlign: 'left',
                          }}
                        >
                          <Typography variant="body2" sx={{ fontSize: '10px', mb: 0.5 }}>
                            <strong>{t.invoiceNumber}:</strong> {invoice.invoiceNumber}
                          </Typography>
                          <Typography variant="body2" sx={{ fontSize: '10px', mb: 0.5 }}>
                            <strong>{t.date}:</strong> {formatDate(invoice.saleDate)}
                          </Typography>
                          <Typography variant="body2" sx={{ fontSize: '10px' }}>
                            <strong>{t.invoiceType}:</strong> {invoice.includeGST ? t.gstInvoice : t.nonGstInvoice}
                          </Typography>
                        </Paper>
                      </Grid>
                      
                      {/* QR Code Placeholder */}
                      <Grid item xs={4}>
                        <Box
                          sx={{
                            width: '100%',
                            height: 80,
                            backgroundColor: '#f0f0f0',
                            borderRadius: 1,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: '2px dashed #ccc',
                          }}
                        >
                          <QrCodeIcon sx={{ fontSize: 30, color: '#999', mb: 0.5 }} />
                          <Typography variant="caption" sx={{ fontSize: '8px', color: '#999' }}>
                            {t.payHere}
                          </Typography>
                        </Box>
                      </Grid>
                    </Grid>
                  </Box>
                </Grid>
              </Grid>

              {/* Customer Details - UPDATED with better alignment */}
              <Grid container spacing={2} sx={{ mb: 2, pageBreakInside: 'avoid' }}>
                <Grid item xs={12}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 1.5,
                      border: '1px solid #e0e0e0',
                      backgroundColor: '#fafafa',
                    }}
                  >
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, fontSize: '11px', mb: 1, color: '#1976d2' }}>
                      {t.billTo}
                    </Typography>
                    
                    <Grid container spacing={1}>
                      {/* Customer Name */}
                      <Grid item xs={3}>
                        <Typography variant="caption" sx={{ fontSize: '9px', color: 'text.secondary', display: 'block', mb: 0.3 }}>
                          Name:
                        </Typography>
                        <Typography variant="body2" sx={{ fontSize: '10px', fontWeight: 600 }}>
                          {invoice.customerName}
                        </Typography>
                      </Grid>
                      
                      {/* Phone */}
                      <Grid item xs={3}>
                        <Typography variant="caption" sx={{ fontSize: '9px', color: 'text.secondary', display: 'block', mb: 0.3 }}>
                          <PhoneIcon sx={{ fontSize: 9, mr: 0.3, verticalAlign: 'middle' }} />
                          Phone:
                        </Typography>
                        <Typography variant="body2" sx={{ fontSize: '10px' }}>
                          {invoice.customerPhone}
                        </Typography>
                      </Grid>
                      
                      {/* Address */}
                      <Grid item xs={6}>
                        <Typography variant="caption" sx={{ fontSize: '9px', color: 'text.secondary', display: 'block', mb: 0.3 }}>
                          <LocationIcon sx={{ fontSize: 9, mr: 0.3, verticalAlign: 'middle' }} />
                          Address:
                        </Typography>
                        <Typography variant="body2" sx={{ fontSize: '10px', lineHeight: 1.3 }}>
                          {invoice.customerAddress}
                          {invoice.customerState && `, ${invoice.customerState}`}
                        </Typography>
                      </Grid>
                      
                      {/* Customer GST - Only show if available */}
                      {invoice.customerGSTNumber && (
                        <Grid item xs={12}>
                          <Typography variant="caption" sx={{ fontSize: '9px', color: 'text.secondary', display: 'inline-block', mr: 0.5 }}>
                            <GSTIcon sx={{ fontSize: 9, mr: 0.3, verticalAlign: 'middle' }} />
                            {t.customerGST}:
                          </Typography>
                          <Typography variant="body2" sx={{ fontSize: '10px', fontWeight: 600, display: 'inline' }}>
                            {invoice.customerGSTNumber}
                          </Typography>
                        </Grid>
                      )}
                    </Grid>
                  </Paper>
                </Grid>
              </Grid>

              {/* Items Table */}
              <TableContainer sx={{ mb: 2, pageBreakInside: 'avoid' }}>
                <Table size="small" sx={{ '& .MuiTableCell-root': { fontSize: '10px', p: 0.75 } }}>
                  <TableHead>
                    <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                      <TableCell sx={{ fontWeight: 700, width: '5%' }}>#</TableCell>
                      <TableCell sx={{ fontWeight: 700, width: '40%' }}>{t.description}</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 700, width: '12%' }}>{t.hsnCode}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, width: '8%' }}>{t.qty}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, width: '13%' }}>{t.rate}</TableCell>
                      {invoice.includeGST && (
                        <TableCell align="right" sx={{ fontWeight: 700, width: '10%' }}>{t.gst}</TableCell>
                      )}
                      <TableCell align="right" sx={{ fontWeight: 700, width: '12%' }}>{t.amount}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {invoice.items?.map((item, index) => (
                      <TableRow key={index} sx={{ '&:nth-of-type(even)': { backgroundColor: '#fafafa' } }}>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontSize: '10px', fontWeight: 600 }}>
                            {item.name}
                          </Typography>
                          {item.description && (
                            <Typography variant="caption" sx={{ fontSize: '8px', color: '#666', fontStyle: 'italic' }}>
                              {item.description}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell align="center">{item.hsnCode || '-'}</TableCell>
                        <TableCell align="right">{item.quantity}</TableCell>
                        <TableCell align="right">
                          {isBulkPricingInvoice ? 'Bulk' : formatCurrency(getItemDisplayRate(item))}
                        </TableCell>
                        {invoice.includeGST && (
                          <TableCell align="right">
                            {isBulkPricingInvoice
                              ? `${invoice.bulkPricingDetails?.gstSlab || 18}%`
                              : `${item.gstSlab || 18}%`}
                          </TableCell>
                        )}
                        <TableCell align="right" sx={{ fontWeight: 600 }}>
                          {isBulkPricingInvoice ? '-' : formatCurrency(getItemTotalAmount(item))}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              {/* Amount in Words and Totals */}
              <Grid container spacing={2} sx={{ mb: 2, pageBreakInside: 'avoid' }}>
                <Grid item xs={7}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 1.5,
                      border: '1px solid #e0e0e0',
                      backgroundColor: '#fafafa',
                    }}
                  >
                    <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '10px', mb: 0.5 }}>
                      {t.amountInWords}:
                    </Typography>
                    <Typography variant="body2" sx={{ fontSize: '10px', fontStyle: 'italic' }}>
                      {numberToWords(Math.round(invoice.grandTotal || 0))}
                    </Typography>
                  </Paper>
                </Grid>

                <Grid item xs={5}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 1.5,
                      border: '2px solid #1976d2',
                      backgroundColor: '#f8f9fa',
                    }}
                  >
                    <Stack spacing={0.5}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" sx={{ fontSize: '10px' }}>{t.subtotal}:</Typography>
                        <Typography variant="body2" sx={{ fontSize: '10px', fontWeight: 600 }}>
                          {formatCurrency(invoice.subtotal || 0)}
                        </Typography>
                      </Box>
                      
                      {invoice.includeGST && invoice.totalGST > 0 && (
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="body2" sx={{ fontSize: '10px' }}>
                            {t.totalGST} ({invoice.customerState?.toLowerCase() === "gujarat" ? t.cgstSgst : t.igst}):
                          </Typography>
                          <Typography variant="body2" sx={{ fontSize: '10px', fontWeight: 600 }}>
                            {formatCurrency(invoice.totalGST || 0)}
                          </Typography>
                        </Box>
                      )}
                      
                      <Divider sx={{ my: 0.5 }} />
                      
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="h6" sx={{ fontSize: '12px', fontWeight: 700 }}>
                          {t.grandTotal}:
                        </Typography>
                        <Typography variant="h6" sx={{ fontSize: '14px', fontWeight: 700, color: '#1976d2' }}>
                          {formatCurrency(invoice.grandTotal || 0)}
                        </Typography>
                      </Box>
                    </Stack>
                  </Paper>
                </Grid>
              </Grid>

              {/* Terms and Signature */}
              <Grid container spacing={2} sx={{ mt: 2, borderTop: '2px solid #e0e0e0', pt: 2, pageBreakInside: 'avoid' }}>
                <Grid item xs={8}>
                  <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '10px', mb: 0.5 }}>
                    {t.terms}:
                  </Typography>
                  <Typography variant="body2" sx={{ fontSize: '9px', lineHeight: 1.4 }}>
                    1. Payment is due within 30 days from the invoice date<br/>
                    2. Please include invoice number with your payment<br/>
                    3. Goods once sold will not be taken back or exchanged<br/>
                    4. Interest @18% per annum will be charged on overdue payments
                  </Typography>
                </Grid>
                
                <Grid item xs={4} sx={{ textAlign: 'right' }}>
                  <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '10px', mb: 3 }}>
                    {t.authorizedSignature}
                  </Typography>
                  <Box sx={{ borderTop: '1px solid #000', width: '120px', ml: 'auto', mt: 2 }} />
                </Grid>
              </Grid>

              {/* Footer */}
              <Box sx={{ mt: 2, pt: 1.5, borderTop: '1px solid #e0e0e0', textAlign: 'center' }}>
                <Typography variant="body2" sx={{ fontSize: '10px', color: 'text.secondary' }}>
                  {t.thankYou}
                </Typography>
                <Typography variant="caption" sx={{ fontSize: '9px', color: 'text.secondary' }}>
                  For queries: {companyDetails.phone} | {companyDetails.email} | {companyDetails.website}
                </Typography>
                <Typography variant="caption" sx={{ display: 'block', fontSize: '8px', color: 'text.secondary', mt: 0.5 }}>
                  Generated on {formatDate(new Date())} | Powered by Business Manager System
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Box>

        {/* Print Styles */}
        <style>{`
          @media print {
            @page {
              size: A4;
              margin: 10mm;
            }
            
            body {
              print-color-adjust: exact;
              -webkit-print-color-adjust: exact;
            }
            
            .no-print {
              display: none !important;
            }
            
            * {
              page-break-inside: avoid;
            }
            
            table {
              page-break-inside: auto;
            }
            
            tr {
              page-break-inside: avoid;
              page-break-after: auto;
            }

            .MuiDialog-paper {
              box-shadow: none !important;
            }
          }
        `}</style>
      </DialogContent>
    </Dialog>
  );
};

export default PrintInvoiceModal;