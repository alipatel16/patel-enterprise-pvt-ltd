import React, { forwardRef } from "react";
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
  alpha,
  Stack,
  Paper,
  Button,
  GlobalStyles,
} from "@mui/material";
import {
  Business as BusinessIcon,
  Receipt as ReceiptIcon,
  Person as PersonIcon,
  AccountCircle as SalesPersonIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  LocationOn as LocationIcon,
  CalendarToday as CalendarIcon,
  Payment as PaymentIcon,
  AccountBalance as BankIcon,
  Money as MoneyIcon,
  CreditCard as CardIcon,
  Assignment as GSTIcon,
  PaymentOutlined as RecordPaymentIcon,
  QrCode as QRCodeIcon,
} from "@mui/icons-material";

import { useUserType } from "../../../contexts/UserTypeContext/UserTypeContext";
import {
  formatCurrency,
  formatDate,
} from "../../../utils/helpers/formatHelpers";
import {
  PAYMENT_STATUS,
  PAYMENT_STATUS_DISPLAY,
  PAYMENT_METHOD_DISPLAY,
  DELIVERY_STATUS,
} from "../../../utils/constants/appConstants";

// Translation object - Using English only
const translations = {
  invoice: "INVOICE",
  billTo: "Bill To:",
  salesPerson: "Sales Person:",
  invoiceNumber: "Invoice #",
  date: "Date",
  dueDate: "Due Date",
  invoiceType: "Invoice Type",
  gstInvoice: "GST Invoice",
  nonGstInvoice: "Non-GST Invoice",
  items: "Invoice Items",
  description: "Description",
  hsnCode: "HSN Code",
  qty: "Qty",
  rate: "Rate",
  gst: "GST %",
  amount: "Amount",
  subtotal: "Subtotal",
  totalGST: "Total GST",
  grandTotal: "Grand Total",
  paymentDetails: "Payment Details",
  paymentBreakdown: "Payment Breakdown",
  amountPaid: "Amount Paid",
  remainingBalance: "Remaining Balance",
  totalInvoice: "Total Invoice",
  paymentMethod: "Payment Method",
  paymentReference: "Payment Reference",
  financeCompany: "Finance Company",
  bankName: "Bank Name",
  downPayment: "Down Payment",
  emiAmount: "EMI Amount",
  monthlyEMI: "Monthly EMI",
  startDate: "Start Date",
  installments: "Installments",
  paymentHistory: "Payment History",
  recordedBy: "Recorded By",
  remarks: "Remarks",
  deliveryInfo: "Delivery Information",
  scheduledDelivery: "Scheduled Delivery",
  thankYou: "Thank you for your business!",
  phone: "Phone",
  email: "Email",
  address: "Address",
  state: "State",
  companyGST: "Company GST",
  customerGST: "Customer GST",
  bulkPricingApplied: "Bulk Pricing Applied",
  paymentStatus: "Payment",
  deliveryStatus: "Delivery",
  cgstSgst: "CGST+SGST",
  igst: "IGST",
  intraState: "Intra-State",
  interState: "Inter-State",
  transaction: "Transaction",
  paymentQR: "Scan to Pay",
};

// UPDATED: Exact same print styles as PrintableInvoice
const invoicePrintStyles = {
  "@media print": {
    // A4 Page setup with proper margins
    "@page": {
      size: "A4",
      margin: "0.6in 0.5in",
      "@top-left": { content: "none" },
      "@top-center": { content: "none" },
      "@top-right": { content: "none" },
      "@bottom-left": { content: "none" },
      "@bottom-center": { content: "none" },
      "@bottom-right": { content: "none" },
    },

    // Hide everything except print content
    "body *": {
      visibility: "hidden !important",
    },
    ".print-invoice-only, .print-invoice-only *": {
      visibility: "visible !important",
    },
    ".print-invoice-only": {
      position: "absolute !important",
      left: "0 !important",
      top: "0 !important",
      width: "100% !important",
      display: "block !important",
      backgroundColor: "white !important",
    },
    ".no-print-invoice": {
      display: "none !important",
    },

    // Reset Material-UI styles for print
    ".MuiCard-root": {
      boxShadow: "none !important",
      border: "none !important",
      margin: "0 !important",
      padding: "0 !important",
      backgroundColor: "transparent !important",
    },
    ".MuiCardContent-root": {
      padding: "0 !important",
      "&:last-child": {
        paddingBottom: "0 !important",
      },
    },
    ".MuiGrid-container": {
      margin: "0 !important",
      width: "100% !important",
    },
    ".MuiGrid-item": {
      padding: "0 !important",
    },

    // Print layout sections
    ".print-invoice-header": {
      borderBottom: "1px solid #000",
      paddingBottom: "15px",
      marginBottom: "25px",
      pageBreakAfter: "avoid",
      display: "flex !important",
      justifyContent: "space-between",
      alignItems: "flex-start",
    },
    ".print-invoice-company-section": {
      flex: "1",
      paddingRight: "30px",
    },
    ".print-invoice-details-section": {
      textAlign: "right",
      minWidth: "280px",
    },
    ".print-invoice-logo-section": {
      display: "flex !important",
      alignItems: "center",
      marginBottom: "15px",
      gap: "20px",
    },
    ".print-invoice-company-logo": {
      width: "65px",
      height: "65px",
      border: "2px solid #000",
      borderRadius: "8px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "#f8f9fa",
      flexShrink: 0,
      overflow: "hidden",
    },
    ".print-invoice-company-logo img": {
      width: "100%",
      height: "100%",
      objectFit: "cover",
      borderRadius: "6px",
      imageRendering: "auto",
      "-webkit-print-color-adjust": "exact",
      "print-color-adjust": "exact",
    },
    ".print-invoice-customer-sales-section": {
      display: "flex !important",
      justifyContent: "space-between",
      pageBreakAfter: "avoid",
      gap: "20px",
      paddingTop: "20px",
      paddingBottom: "20px",
    },
    ".print-invoice-customer-info, .print-invoice-sales-info": {
      flex: "1",
      border: "1px solid #000",
      padding: "15px",
      borderRadius: "8px",
      backgroundColor: "#fafafa",
      marginBottom: "25px",
    },
    ".print-invoice-items-section": {
      pageBreakInside: "avoid",
      marginBottom: "0px", // No margin to connect with totals
    },
    ".print-invoice-items-table": {
      width: "100%",
      borderCollapse: "collapse",
      border: "1px solid #000",
      marginBottom: "0", // No margin to connect with totals
      "& th": {
        backgroundColor: "#e8f5e8 !important",
        border: "1px solid #000 !important",
        padding: "12px 8px !important",
        fontSize: "12px !important",
        fontWeight: "bold !important",
        textAlign: "center !important",
        lineHeight: "1.3 !important",
      },
      "& td": {
        border: "1px solid #000 !important",
        padding: "10px 8px !important",
        fontSize: "11px !important",
        verticalAlign: "top !important",
        lineHeight: "1.4 !important",
      },
      "& thead": {
        pageBreakAfter: "avoid",
      },
      "& tbody tr": {
        pageBreakInside: "avoid",
        pageBreakAfter: "auto",
      },
    },
    // NEW: Divider after items table
    ".print-invoice-totals-divider": {
      borderTop: "1px solid #000",
      margin: "0",
      marginBottom: "20px",
    },
    ".print-invoice-totals-section": {
      display: "flex !important",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: "30px",
      pageBreakInside: "avoid",
      gap: "25px",
    },
    ".print-invoice-remarks-section": {
      flex: "1",
    },
    ".print-invoice-totals-box": {
      border: "3px solid #000",
      padding: "20px",
      minWidth: "280px",
      backgroundColor: "#f0f8ff",
      borderRadius: "8px",
    },
    ".print-invoice-payment-details": {
      border: "2px solid #4caf50",
      padding: "18px",
      marginBottom: "25px",
      backgroundColor: "#e8f5e8",
      borderRadius: "8px",
      pageBreakInside: "avoid",
    },
    ".print-invoice-footer-section": {
      display: "flex !important",
      justifyContent: "space-between",
      alignItems: "flex-start", // FIXED: Changed from flex-end to flex-start for proper alignment
      marginTop: "40px",
      borderTop: "2px solid #000",
      paddingTop: "20px",
      pageBreakInside: "avoid",
    },
    ".print-invoice-thank-you-section": {
      flex: "1",
      paddingRight: "25px",
    },
    ".print-invoice-qr-section": {
      textAlign: "center",
      minWidth: "140px", // Fixed width for consistency
    },
    ".print-invoice-qr-code": {
      width: "140px",
      height: "140px",
      border: "2px solid #000",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "#f8f9fa",
      borderRadius: "8px",
      overflow: "hidden",
    },
    ".print-invoice-qr-code img": {
      width: "100%",
      height: "100%",
      objectFit: "cover",
      borderRadius: "6px",
      imageRendering: "auto",
      "-webkit-print-color-adjust": "exact",
      "print-color-adjust": "exact",
    },
    ".print-invoice-signature": {
      width: "140px",
      height: "50px",
      margin: "0 auto 8px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
    },
    ".print-invoice-signature img": {
      width: "100%",
      height: "100%",
      objectFit: "contain",
      imageRendering: "auto",
      "-webkit-print-color-adjust": "exact",
      "print-color-adjust": "exact",
    },

    // Typography adjustments for print
    h1: {
      fontSize: "28px !important",
      margin: "0 0 10px 0 !important",
      fontWeight: "bold !important",
    },
    h2: {
      fontSize: "22px !important",
      margin: "0 0 8px 0 !important",
      fontWeight: "bold !important",
    },
    h3: {
      fontSize: "18px !important",
      margin: "0 0 6px 0 !important",
      fontWeight: "bold !important",
    },
    h4: {
      fontSize: "15px !important",
      margin: "0 0 5px 0 !important",
      fontWeight: "bold !important",
    },
    h5: {
      fontSize: "13px !important",
      margin: "0 0 4px 0 !important",
      fontWeight: "bold !important",
    },
    h6: {
      fontSize: "12px !important",
      margin: "0 0 3px 0 !important",
      fontWeight: "bold !important",
    },
    "p, div, span": {
      fontSize: "11px !important",
      lineHeight: "1.5 !important",
      margin: "0 !important",
    },
    small: { fontSize: "10px !important" },

    // Force black text and proper backgrounds
    "*, *::before, *::after": {
      color: "black !important",
      backgroundColor: "transparent !important",
      "-webkit-print-color-adjust": "exact !important",
      "print-color-adjust": "exact !important",
    },
    ".print-invoice-totals-box, .print-invoice-payment-details, .print-invoice-company-logo, .print-invoice-qr-code, .print-invoice-customer-info, .print-invoice-sales-info, .print-invoice-payment-status-section":
      {
        backgroundColor: "#f5f5f5 !important",
        "-webkit-print-color-adjust": "exact !important",
        "print-color-adjust": "exact !important",
      },
    ".print-invoice-items-table th": {
      backgroundColor: "#e8f5e8 !important",
      "-webkit-print-color-adjust": "exact !important",
      "print-color-adjust": "exact !important",
    },

    // Page break controls
    ".print-page-break-before": { pageBreakBefore: "always" },
    ".print-page-break-after": { pageBreakAfter: "always" },
    ".print-page-break-avoid": { pageBreakInside: "avoid" },
  },
};

/**
 * Invoice preview component for displaying invoice in printable format
 */
const InvoicePreview = forwardRef(
  (
    { invoice = {}, showActions = false, variant = "preview", onRecordPayment },
    ref
  ) => {
    const { getDisplayName, getThemeColors } = useUserType();
    const themeColors = getThemeColors();
    const t = translations;

    // Default invoice data structure
    const defaultInvoice = {
      invoiceNumber: "",
      saleDate: new Date(),
      dueDate: null,
      customerName: "",
      customerPhone: "",
      customerAddress: "",
      customerState: "",
      customerGSTNumber: "",
      salesPersonName: "",
      items: [],
      subtotal: 0,
      totalGST: 0,
      grandTotal: 0,
      paymentStatus: PAYMENT_STATUS.PENDING,
      deliveryStatus: DELIVERY_STATUS.PENDING,
      includeGST: false,
      remarks: "",
      paymentDetails: {
        downPayment: 0,
        remainingBalance: 0,
        paymentMethod: "cash",
        bankName: "",
        financeCompany: "",
        paymentReference: "",
        paymentHistory: [],
      },
      notes: "",
      terms: "",
    };

    const invoiceData = { ...defaultInvoice, ...invoice };

    // Helper function to get the correct display rate for an item
    const getItemDisplayRate = (item) => {
      if (item.baseAmount !== undefined) {
        return item.isPriceInclusive ? item.baseAmount : item.rate;
      }
      return item.rate || 0;
    };

    // Helper function to get the correct total amount for an item
    const getItemTotalAmount = (item) => {
      if (item.totalAmount !== undefined) {
        return item.totalAmount;
      }
      return (item.quantity || 0) * (item.rate || 0);
    };

    // Check if this invoice uses bulk pricing
    const isBulkPricingInvoice =
      invoiceData.bulkPricingApplied ||
      (invoiceData.bulkPricingDetails &&
        invoiceData.items &&
        invoiceData.items.some((item) => item.bulkPricing));

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

    // Check if payment is partial
    const isPartialPayment =
      invoiceData.paymentStatus === PAYMENT_STATUS.PENDING ||
      invoiceData.paymentStatus === PAYMENT_STATUS.FINANCE ||
      invoiceData.paymentStatus === PAYMENT_STATUS.BANK_TRANSFER;

    // Calculate actual amount paid and remaining balance
    const getActualAmountPaid = () => {
      if (invoiceData.paymentStatus === PAYMENT_STATUS.PENDING) {
        return invoiceData.paymentDetails?.downPayment || 0;
      }
      if (
        invoiceData.paymentStatus === PAYMENT_STATUS.FINANCE ||
        invoiceData.paymentStatus === PAYMENT_STATUS.BANK_TRANSFER
      ) {
        return invoiceData.paymentDetails?.downPayment || 0;
      }
      if (
        invoiceData.paymentStatus === PAYMENT_STATUS.PAID ||
        invoiceData.fullyPaid
      ) {
        return invoiceData.grandTotal || invoiceData.totalAmount || 0;
      }
      if (
        invoiceData.paymentStatus === PAYMENT_STATUS.EMI &&
        invoiceData.emiDetails?.schedule
      ) {
        return invoiceData.emiDetails.schedule
          .filter((emi) => emi.paid)
          .reduce((sum, emi) => sum + (emi.paidAmount || emi.amount || 0), 0);
      }
      return 0;
    };

    const getRemainingBalance = () => {
      const totalAmount =
        invoiceData.grandTotal || invoiceData.totalAmount || 0;
      const paidAmount = getActualAmountPaid();
      return Math.max(0, totalAmount - paidAmount);
    };

    const actualPaid = getActualAmountPaid();
    const remainingBalance = getRemainingBalance();
    const canRecordPayment =
      remainingBalance > 0 && isPartialPayment && !invoiceData.fullyPaid;

    // Get payment method icon
    const getPaymentMethodIcon = (method) => {
      const iconMap = {
        cash: <MoneyIcon fontSize="small" />,
        card: <CardIcon fontSize="small" />,
        finance: <BankIcon fontSize="small" />,
        bank_transfer: <BankIcon fontSize="small" />,
        upi: <PaymentIcon fontSize="small" />,
      };
      return iconMap[method] || <PaymentIcon fontSize="small" />;
    };

    // UPDATED: Print-optimized content component - matching PrintableInvoice exactly
    const PrintInvoiceContent = () => (
      <Box className="print-invoice-only" sx={{ display: "none" }}>
        {/* Header with Company Info and Invoice Details */}
        <Box className="print-invoice-header">
          <Box className="print-invoice-company-section">
            <Box className="print-invoice-logo-section">
              <Box className="print-invoice-company-logo">
                <BusinessIcon style={{ fontSize: "35px" }} />
              </Box>
              <Box>
                <Typography
                  variant="h2"
                  style={{ fontWeight: "bold", marginBottom: "5px" }}
                >
                  {companyDetails.name}
                </Typography>
                <Typography
                  variant="body1"
                  style={{ fontSize: "11px", color: "#666" }}
                >
                  Professional Business Solutions
                </Typography>
              </Box>
            </Box>

            <Box style={{ fontSize: "11px", lineHeight: "1.5" }}>
              <Typography variant="body2">
                {companyDetails.address}, {companyDetails.city}
              </Typography>
              <Typography variant="body2">
                {companyDetails.state} - {companyDetails.pincode}
              </Typography>
              <Typography variant="body2">
                Phone: {companyDetails.phone} | Email: {companyDetails.email}
              </Typography>
              <Typography variant="body2">GST: {companyDetails.gst}</Typography>
              <Typography variant="body2">
                Website: {companyDetails.website}
              </Typography>
            </Box>
          </Box>

          <Box className="print-invoice-details-section">
            <Typography
              variant="h1"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-end",
                gap: "10px",
                marginBottom: "15px",
              }}
            >
              <ReceiptIcon style={{ fontSize: "28px" }} />
              INVOICE
            </Typography>

            <Box
              style={{
                border: "1px solid #000",
                padding: "15px",
                backgroundColor: "#f0f8ff",
                borderRadius: "8px",
                textAlign: "left",
              }}
            >
              <Typography variant="body1" style={{ marginBottom: "5px" }}>
                <strong>Invoice #:</strong> {invoiceData.invoiceNumber}
              </Typography>
              <Typography variant="body1" style={{ marginBottom: "5px" }}>
                <strong>Date:</strong> {formatDate(invoiceData.saleDate)}
              </Typography>
              {invoiceData.dueDate && (
                <Typography variant="body1" style={{ marginBottom: "5px" }}>
                  <strong>Due Date:</strong> {formatDate(invoiceData.dueDate)}
                </Typography>
              )}
            </Box>
          </Box>
        </Box>

        {/* Customer and Sales Person Information */}
        <Box className="print-invoice-customer-sales-section">
          <Box className="print-invoice-customer-info">
            <Typography
              variant="h4"
              style={{
                marginBottom: "10px",
                borderBottom: "1px solid #000",
                paddingBottom: "8px",
                paddingTop: "3px",
              }}
            >
              Bill To:
            </Typography>
            <Typography
              variant="h5"
              style={{ fontWeight: "bold", marginBottom: "6px" }}
            >
              {invoiceData.customerName || "Customer Name"}
            </Typography>
            {invoiceData.customerPhone && (
              <Typography variant="body2" style={{ marginBottom: "3px" }}>
                Phone: {invoiceData.customerPhone}
              </Typography>
            )}
            {invoiceData.customerAddress && (
              <Typography variant="body2" style={{ marginBottom: "3px" }}>
                Address: {invoiceData.customerAddress}
              </Typography>
            )}
            {invoiceData.customerState && (
              <Typography variant="body2" style={{ marginBottom: "3px" }}>
                State: {invoiceData.customerState}
              </Typography>
            )}
            {invoiceData.customerGSTNumber && (
              <Typography variant="body2">
                GST: {invoiceData.customerGSTNumber}
              </Typography>
            )}
          </Box>

          <Box className="print-invoice-sales-info">
            <Typography
              variant="h4"
              style={{
                marginBottom: "10px",
                borderBottom: "1px solid #000",
                paddingBottom: "8px",
                paddingTop: "3px",
              }}
            >
              Sales Person:
            </Typography>
            <Typography
              variant="h5"
              style={{ fontWeight: "bold", marginBottom: "6px" }}
            >
              {invoiceData.salesPersonName || "Sales Person"}
            </Typography>
            <Typography variant="body2" style={{ color: "#666" }}>
              Sales Representative
            </Typography>
            <Typography variant="body2" style={{ marginTop: "5px" }}>
              Sale Date: {formatDate(invoiceData.saleDate)}
            </Typography>
          </Box>
        </Box>

        {/* Items Table */}
        <Box className="print-invoice-items-section">
          <Typography variant="h4" style={{ marginBottom: "12px" }}>
            Invoice Items
            {isBulkPricingInvoice && (
              <span
                style={{
                  marginLeft: "10px",
                  border: "1px solid #4caf50",
                  padding: "2px 6px",
                  fontSize: "9px",
                  backgroundColor: "#e8f5e8",
                  borderRadius: "4px",
                }}
              >
                Bulk Pricing Applied
              </span>
            )}
          </Typography>

          <table className="print-invoice-items-table">
            <thead>
              <tr>
                <th style={{ width: "5%" }}>#</th>
                <th style={{ width: "30%" }}>Description</th>
                <th style={{ width: "10%" }}>HSN Code</th>
                <th style={{ width: "8%" }}>Qty</th>
                <th style={{ width: "12%" }}>Unit Rate</th>
                {invoiceData.includeGST && <th style={{ width: "10%" }}>GST %</th>}
                <th style={{ width: "15%" }}>Total Amount</th>
              </tr>
            </thead>
            <tbody>
              {invoiceData.items?.map((item, index) => (
                <tr key={index}>
                  <td style={{ textAlign: "center", fontWeight: "bold" }}>
                    {index + 1}
                  </td>
                  <td>
                    <strong style={{ fontSize: "12px" }}>{item.name}</strong>
                    {item.description && (
                      <div
                        style={{
                          fontSize: "10px",
                          color: "#666",
                          marginTop: "3px",
                        }}
                      >
                        {item.description}
                      </div>
                    )}
                    {isBulkPricingInvoice && (
                      <div style={{ marginTop: "3px" }}>
                        <span
                          style={{
                            border: "1px solid #4caf50",
                            padding: "1px 4px",
                            fontSize: "8px",
                            backgroundColor: "#e8f5e8",
                            borderRadius: "3px",
                          }}
                        >
                          Bulk Pricing Applied
                        </span>
                      </div>
                    )}
                  </td>
                  <td style={{ textAlign: "center", fontFamily: "monospace" }}>
                    {item.hsnCode || "-"}
                  </td>
                  <td style={{ textAlign: "center", fontWeight: "bold" }}>
                    {item.quantity}
                  </td>
                  <td style={{ textAlign: "right" }}>
                    {isBulkPricingInvoice ? (
                      <span
                        style={{
                          border: "1px solid #4caf50",
                          padding: "1px 4px",
                          fontSize: "8px",
                          backgroundColor: "#e8f5e8",
                          borderRadius: "3px",
                        }}
                      >
                        Bulk
                      </span>
                    ) : (
                      formatCurrency(getItemDisplayRate(item))
                    )}
                  </td>
                  {invoiceData.includeGST && (
                    <td style={{ textAlign: "center" }}>
                      {isBulkPricingInvoice
                        ? `${invoiceData.bulkPricingDetails?.gstSlab || 18}%`
                        : `${item.gstSlab || 18}%`}
                    </td>
                  )}
                  <td style={{ textAlign: "right", fontWeight: "bold" }}>
                    {isBulkPricingInvoice ? (
                      <span
                        style={{
                          border: "1px solid #2196f3",
                          padding: "1px 4px",
                          fontSize: "8px",
                          backgroundColor: "#e3f2fd",
                          borderRadius: "3px",
                        }}
                      >
                        See Below
                      </span>
                    ) : (
                      formatCurrency(getItemTotalAmount(item))
                    )}
                  </td>
                </tr>
              ))}

              {(!invoiceData.items || invoiceData.items.length === 0) && (
                <tr>
                  <td
                    colSpan={invoiceData.includeGST ? 7 : 6}
                    style={{
                      textAlign: "center",
                      padding: "20px",
                      color: "#666",
                      fontStyle: "italic",
                    }}
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
            {invoiceData.remarks && (
              <Box>
                <Typography variant="h4" style={{ marginBottom: "8px" }}>
                  Remarks:
                </Typography>
                <Typography
                  variant="body2"
                  style={{
                    whiteSpace: "pre-wrap",
                    lineHeight: "1.5",
                    padding: "10px",
                    backgroundColor: "#f9f9f9",
                    border: "1px solid #ddd",
                    borderRadius: "4px",
                  }}
                >
                  {invoiceData.remarks}
                </Typography>
              </Box>
            )}
          </Box>

          {/* Totals Box - Now displays like quotation page */}
          <Box>
            <Box
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: "6px",
              }}
            >
              <Typography variant="body2">Subtotal:</Typography>
              <Typography variant="body2" style={{ fontWeight: "bold" }}>
                {formatCurrency(invoiceData.subtotal || 0)}
              </Typography>
            </Box>

            {invoiceData.includeGST && invoiceData.totalGST > 0 && (
              <Box
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: "6px",
                }}
              >
                <Typography variant="body2">
                  Total GST (
                  {invoiceData.customerState?.toLowerCase() === "gujarat"
                    ? "CGST+SGST"
                    : "IGST"}
                  ):
                </Typography>
                <Typography variant="body2" style={{ fontWeight: "bold" }}>
                  {formatCurrency(invoiceData.totalGST || 0)}
                </Typography>
              </Box>
            )}

            <hr
              style={{
                margin: "10px 0",
                border: "none",
                borderTop: "2px solid #000",
              }}
            />

            <Box style={{ display: "flex", justifyContent: "space-between" }}>
              <Typography variant="h5" style={{ fontWeight: "bold" }}>
                Grand Total:
              </Typography>
              <Typography
                variant="h5"
                style={{ fontWeight: "bold", color: "#2e7d32" }}
              >
                {formatCurrency(invoiceData.grandTotal || 0)}
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Footer with QR Code and Signature */}
        <Box className="print-invoice-footer-section">
          <Box className="print-invoice-thank-you-section">
            <Typography
              variant="h5"
              style={{ marginBottom: "8px", color: "#1976d2" }}
            >
              Terms & Conditions:
            </Typography>

            <Box style={{ fontSize: "10px", lineHeight: "1.4" }}>
              <Typography
                variant="body2"
                style={{ marginBottom: "3px", fontSize: "10px" }}
              >
                1) Goods once sold will not be taken back under any
                circumstances.
              </Typography>
              <Typography
                variant="body2"
                style={{ marginBottom: "3px", fontSize: "10px" }}
              >
                2) Cheques are subject to Realisation.
              </Typography>
              <Typography
                variant="body2"
                style={{ marginBottom: "3px", fontSize: "10px" }}
              >
                3) Subject to Viramgam Jurisdiction.
              </Typography>
              <Typography
                variant="body2"
                style={{ marginBottom: "3px", fontSize: "10px" }}
              >
                4) Warranty will be covered as per manufacturer's terms and
                conditions.
              </Typography>
              <Typography
                variant="body2"
                style={{ marginBottom: "3px", fontSize: "10px" }}
              >
                5) Warranty from Company Not From us.
              </Typography>
              <Typography
                variant="body2"
                style={{ marginBottom: "3px", fontSize: "10px" }}
              >
                6) Patel Electronics & Furniture not liable for delays or
                rejections. We will assist and guide you through the service
                process.
              </Typography>
              <Typography
                variant="body2"
                style={{ marginBottom: "3px", fontSize: "10px" }}
              >
                7) Cheques are in favour of PATEL ELECTRONICS & FURNITURE
              </Typography>
              <Typography
                variant="body2"
                style={{ marginBottom: "3px", fontSize: "10px" }}
              >
                8) GST billed on all products
              </Typography>
            </Box>
          </Box>

          <Box className="print-invoice-qr-section">
            <Box className="print-invoice-qr-code">
              <QRCodeIcon style={{ fontSize: "50px" }} />
            </Box>

            {/* Signature */}
            <Box
              style={{ textAlign: "center", width: "100%", paddingTop: "10px" }}
            >
              <Box className="print-invoice-signature">
                <div
                  style={{
                    borderBottom: "1px solid #000",
                    width: "100%",
                    height: "100%",
                  }}
                />
              </Box>
              <Typography
                variant="body2"
                style={{
                  fontSize: "11px",
                  textAlign: "center",
                  paddingTop: "10px",
                }}
              >
                Authorized Signature
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>
    );

    return (
      <>
        {/* Add print styles - UPDATED to match PrintableInvoice exactly */}
        <GlobalStyles styles={invoicePrintStyles} />

        <Box
          ref={ref}
          sx={{
            backgroundColor: variant === "print" ? "white" : "background.paper",
            "@media print": {
              backgroundColor: "white !important",
              "& .no-print-invoice": {
                display: "none !important",
              },
            },
          }}
        >
          <Card
            elevation={variant === "print" ? 0 : 1}
            sx={{
              width: "210mm",
              minHeight: "297mm",
              margin: "auto",
              borderRadius: variant === "print" ? 0 : 2,
              "@media print": {
                width: "100%",
                boxShadow: "none",
                pageBreakAfter: "always",
              },
            }}
            className="no-print-invoice"
          >
            <CardContent sx={{ p: "15mm" }}>
              {/* Header Section */}
              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  mb: 3,
                  background: `linear-gradient(135deg, ${themeColors.primary}15 0%, ${themeColors.secondary}15 100%)`,
                  border: `1px solid ${alpha(themeColors.primary, 0.1)}`,
                  pageBreakInside: "avoid",
                }}
              >
                <Grid container spacing={2} alignItems="center">
                  {/* Company Info with Logo */}
                  <Grid item xs={7}>
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 2,
                        mb: 1,
                      }}
                    >
                      {/* Company Logo */}
                      <Avatar
                        sx={{
                          width: 60,
                          height: 60,
                          backgroundColor: themeColors.primary,
                          border: `2px solid ${themeColors.primary}`,
                        }}
                      >
                        <BusinessIcon fontSize="large" />
                      </Avatar>
                      <Box sx={{ flex: 1 }}>
                        <Typography
                          variant="h5"
                          fontWeight={700}
                          color={themeColors.primary}
                          sx={{ lineHeight: 1.2, mb: 0.5, fontSize: "28px" }}
                        >
                          {companyDetails.name}
                        </Typography>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ fontSize: "11px" }}
                        >
                          {getDisplayName()} Business Solutions
                        </Typography>
                      </Box>
                    </Box>

                    <Stack
                      spacing={0.3}
                      sx={{ fontSize: "11px", lineHeight: 1.6 }}
                    >
                      <Typography variant="body2" sx={{ fontSize: "11px" }}>
                        <LocationIcon
                          sx={{
                            fontSize: 12,
                            mr: 0.5,
                            verticalAlign: "middle",
                          }}
                        />
                        {companyDetails.address}, {companyDetails.city},{" "}
                        {companyDetails.state} - {companyDetails.pincode}
                      </Typography>
                      <Typography variant="body2" sx={{ fontSize: "11px" }}>
                        <PhoneIcon
                          sx={{
                            fontSize: 12,
                            mr: 0.5,
                            verticalAlign: "middle",
                          }}
                        />
                        {t.phone}: {companyDetails.phone}
                      </Typography>
                      <Typography variant="body2" sx={{ fontSize: "11px" }}>
                        <EmailIcon
                          sx={{
                            fontSize: 12,
                            mr: 0.5,
                            verticalAlign: "middle",
                          }}
                        />
                        {t.email}: {companyDetails.email}
                      </Typography>
                      {companyDetails.gst && (
                        <Typography variant="body2" sx={{ fontSize: "11px" }}>
                          <GSTIcon
                            sx={{
                              fontSize: 12,
                              mr: 0.5,
                              verticalAlign: "middle",
                            }}
                          />
                          {t.companyGST}: {companyDetails.gst}
                        </Typography>
                      )}
                    </Stack>
                  </Grid>

                  {/* Invoice Details */}
                  <Grid item xs={5}>
                    <Box sx={{ textAlign: "right" }}>
                      <Typography
                        variant="h4"
                        fontWeight={700}
                        color={themeColors.primary}
                        gutterBottom
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "flex-end",
                          gap: 1,
                          fontSize: "32px",
                        }}
                      >
                        <ReceiptIcon />
                        {t.invoice}
                      </Typography>

                      <Paper
                        elevation={0}
                        sx={{
                          display: "inline-block",
                          p: 1.5,
                          backgroundColor: "background.paper",
                          border: `2px solid ${themeColors.primary}`,
                          borderRadius: 2,
                          textAlign: "left",
                          minWidth: 200,
                        }}
                      >
                        <Stack spacing={0.5}>
                          <Typography variant="body2" sx={{ fontSize: "11px" }}>
                            <strong>{t.invoiceNumber}:</strong>{" "}
                            {invoiceData.invoiceNumber}
                          </Typography>
                          <Typography variant="body2" sx={{ fontSize: "11px" }}>
                            <CalendarIcon
                              sx={{
                                fontSize: 12,
                                mr: 0.5,
                                verticalAlign: "middle",
                              }}
                            />
                            <strong>{t.date}:</strong>{" "}
                            {formatDate(invoiceData.saleDate)}
                          </Typography>
                          {invoiceData.dueDate && (
                            <Typography
                              variant="body2"
                              sx={{ fontSize: "11px" }}
                            >
                              <strong>{t.dueDate}:</strong>{" "}
                              {formatDate(invoiceData.dueDate)}
                            </Typography>
                          )}
                          <Typography variant="body2" sx={{ fontSize: "11px" }}>
                            <strong>{t.invoiceType}:</strong>{" "}
                            {invoiceData.includeGST
                              ? t.gstInvoice
                              : t.nonGstInvoice}
                          </Typography>
                        </Stack>
                      </Paper>
                    </Box>
                  </Grid>
                </Grid>
              </Paper>

              {/* Customer and Sales Person Info */}
              <Grid
                container
                spacing={2}
                sx={{ mb: 3, pageBreakInside: "avoid" }}
              >
                {/* Bill To */}
                <Grid item xs={6}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2,
                      height: "100%",
                      border: `1px solid #e0e0e0`,
                      borderRadius: 1,
                    }}
                  >
                    <Typography
                      variant="subtitle1"
                      fontWeight={600}
                      gutterBottom
                      sx={{ color: themeColors.primary, fontSize: "13px" }}
                    >
                      {t.billTo}
                    </Typography>

                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                        mb: 1,
                      }}
                    >
                      <Avatar
                        sx={{
                          backgroundColor: alpha(themeColors.secondary, 0.1),
                          color: themeColors.secondary,
                          width: 35,
                          height: 35,
                        }}
                      >
                        <PersonIcon fontSize="small" />
                      </Avatar>
                      <Typography
                        variant="body1"
                        fontWeight={600}
                        sx={{ fontSize: "14px" }}
                      >
                        {invoiceData.customerName || "Customer Name"}
                      </Typography>
                    </Box>

                    <Stack spacing={0.3} sx={{ fontSize: "11px" }}>
                      {invoiceData.customerPhone && (
                        <Typography variant="body2" sx={{ fontSize: "11px" }}>
                          <PhoneIcon
                            sx={{
                              fontSize: 12,
                              mr: 0.5,
                              verticalAlign: "middle",
                            }}
                          />
                          {t.phone}: {invoiceData.customerPhone}
                        </Typography>
                      )}
                      {invoiceData.customerAddress && (
                        <Typography variant="body2" sx={{ fontSize: "11px" }}>
                          <LocationIcon
                            sx={{
                              fontSize: 12,
                              mr: 0.5,
                              verticalAlign: "middle",
                            }}
                          />
                          {t.address}: {invoiceData.customerAddress}
                        </Typography>
                      )}
                      {invoiceData.customerState && (
                        <Typography variant="body2" sx={{ fontSize: "11px" }}>
                          {t.state}: {invoiceData.customerState}
                        </Typography>
                      )}
                      {invoiceData.customerGSTNumber && (
                        <Typography variant="body2" sx={{ fontSize: "11px" }}>
                          <GSTIcon
                            sx={{
                              fontSize: 12,
                              mr: 0.5,
                              verticalAlign: "middle",
                            }}
                          />
                          {t.customerGST}: {invoiceData.customerGSTNumber}
                        </Typography>
                      )}
                    </Stack>
                  </Paper>
                </Grid>

                {/* Sales Person */}
                <Grid item xs={6}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2,
                      height: "100%",
                      border: `1px solid #e0e0e0`,
                      borderRadius: 1,
                    }}
                  >
                    <Typography
                      variant="subtitle1"
                      fontWeight={600}
                      gutterBottom
                      sx={{ color: themeColors.primary, fontSize: "13px" }}
                    >
                      {t.salesPerson}
                    </Typography>

                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                        mb: 1,
                      }}
                    >
                      <Avatar
                        sx={{
                          backgroundColor: alpha(themeColors.primary, 0.1),
                          color: themeColors.primary,
                          width: 35,
                          height: 35,
                        }}
                      >
                        <SalesPersonIcon fontSize="small" />
                      </Avatar>
                      <Box>
                        <Typography
                          variant="body1"
                          fontWeight={600}
                          sx={{ fontSize: "14px" }}
                        >
                          {invoiceData.salesPersonName || "Sales Person"}
                        </Typography>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ fontSize: "10px" }}
                        >
                          Sales Representative
                        </Typography>
                      </Box>
                    </Box>
                  </Paper>
                </Grid>
              </Grid>

              {/* Items Table */}
              <Paper
                elevation={0}
                sx={{
                  mb: 3,
                  border: `1px solid #e0e0e0`,
                  pageBreakInside: "avoid",
                }}
              >
                <Box
                  sx={{
                    p: 1.5,
                    backgroundColor: alpha(themeColors.primary, 0.05),
                  }}
                >
                  <Typography
                    variant="subtitle1"
                    fontWeight={600}
                    sx={{ color: themeColors.primary, fontSize: "13px" }}
                  >
                    {t.items}
                    {isBulkPricingInvoice && (
                      <Chip
                        label={t.bulkPricingApplied}
                        size="small"
                        color="success"
                        sx={{ ml: 1, fontSize: "9px", height: 18 }}
                      />
                    )}
                  </Typography>
                </Box>

                <TableContainer>
                  <Table
                    size="small"
                    sx={{ "& .MuiTableCell-root": { fontSize: "11px" } }}
                  >
                    <TableHead>
                      <TableRow
                        sx={{
                          backgroundColor: alpha(themeColors.primary, 0.1),
                        }}
                      >
                        <TableCell sx={{ fontWeight: 700, width: "5%" }}>
                          #
                        </TableCell>
                        <TableCell sx={{ fontWeight: 700, width: "35%" }}>
                          {t.description}
                        </TableCell>
                        <TableCell
                          align="center"
                          sx={{ fontWeight: 700, width: "12%" }}
                        >
                          {t.hsnCode}
                        </TableCell>
                        <TableCell
                          align="right"
                          sx={{ fontWeight: 700, width: "8%" }}
                        >
                          {t.qty}
                        </TableCell>
                        <TableCell
                          align="right"
                          sx={{ fontWeight: 700, width: "15%" }}
                        >
                          {t.rate}
                        </TableCell>
                        {invoiceData.includeGST && (
                          <TableCell
                            align="right"
                            sx={{ fontWeight: 700, width: "10%" }}
                          >
                            {t.gst}
                          </TableCell>
                        )}
                        <TableCell
                          align="right"
                          sx={{ fontWeight: 700, width: "15%" }}
                        >
                          {t.amount}
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {invoiceData.items.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>{index + 1}</TableCell>
                          <TableCell>
                            <Typography
                              variant="body2"
                              fontWeight={600}
                              sx={{ fontSize: "11px" }}
                            >
                              {item.name}
                            </Typography>
                            {item.description && (
                              <Typography
                                variant="caption"
                                sx={{
                                  fontSize: "9px",
                                  color: "#666",
                                  fontStyle: "italic",
                                }}
                              >
                                {item.description}
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell align="center">
                            <Typography
                              variant="body2"
                              fontFamily="monospace"
                              fontWeight={500}
                              sx={{ fontSize: "11px" }}
                            >
                              {item.hsnCode || "-"}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">{item.quantity}</TableCell>
                          <TableCell align="right">
                            {isBulkPricingInvoice ? (
                              <Chip
                                size="small"
                                label="Bulk"
                                color="success"
                                variant="outlined"
                                sx={{ fontSize: "9px", height: 18 }}
                              />
                            ) : (
                              formatCurrency(getItemDisplayRate(item))
                            )}
                          </TableCell>
                          {invoiceData.includeGST && (
                            <TableCell align="right">
                              {isBulkPricingInvoice
                                ? `${
                                    invoiceData.bulkPricingDetails?.gstSlab ||
                                    18
                                  }%`
                                : `${item.gstSlab || 18}%`}
                            </TableCell>
                          )}
                          <TableCell align="right" sx={{ fontWeight: 600 }}>
                            {isBulkPricingInvoice ? (
                              <Chip
                                size="small"
                                label="See Below"
                                color="info"
                                variant="outlined"
                                sx={{ fontSize: "9px", height: 18 }}
                              />
                            ) : (
                              formatCurrency(getItemTotalAmount(item))
                            )}
                          </TableCell>
                        </TableRow>
                      ))}

                      {invoiceData.items.length === 0 && (
                        <TableRow>
                          <TableCell
                            colSpan={invoiceData.includeGST ? 7 : 6}
                            align="center"
                            sx={{ py: 2 }}
                          >
                            <Typography
                              variant="body2"
                              color="text.secondary"
                              sx={{ fontSize: "11px" }}
                            >
                              No items added
                            </Typography>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>

              {/* Totals Section */}
              <Grid
                container
                spacing={2}
                sx={{ mb: 3, pageBreakInside: "avoid" }}
              >
                <Grid item xs={7}>
                  {invoiceData.remarks && (
                    <Box
                      sx={{
                        border: "1px solid #e0e0e0",
                        borderRadius: 1,
                        p: 2,
                        background: "#fafafa",
                      }}
                    >
                      <Typography
                        variant="body2"
                        sx={{ fontWeight: 700, fontSize: "11px", mb: 0.5 }}
                      >
                        {t.remarks}:
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{ fontSize: "11px", whiteSpace: "pre-wrap" }}
                      >
                        {invoiceData.remarks}
                      </Typography>
                    </Box>
                  )}
                </Grid>

                <Grid item xs={5}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2,
                      border: `2px solid ${themeColors.primary}`,
                      borderRadius: 1,
                      backgroundColor: "#f8f9fa",
                    }}
                  >
                    <Stack spacing={1}>
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                        }}
                      >
                        <Typography variant="body2" sx={{ fontSize: "11px" }}>
                          {t.subtotal}:
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{ fontSize: "11px", fontWeight: 600 }}
                        >
                          {formatCurrency(invoiceData.subtotal || 0)}
                        </Typography>
                      </Box>

                      {invoiceData.includeGST && invoiceData.totalGST > 0 && (
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                          }}
                        >
                          <Typography variant="body2" sx={{ fontSize: "11px" }}>
                            {t.totalGST} (
                            {invoiceData.customerState?.toLowerCase() ===
                            "gujarat"
                              ? t.cgstSgst
                              : t.igst}
                            ):
                          </Typography>
                          <Typography
                            variant="body2"
                            sx={{ fontSize: "11px", fontWeight: 600 }}
                          >
                            {formatCurrency(invoiceData.totalGST || 0)}
                          </Typography>
                        </Box>
                      )}

                      <Divider />

                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                        }}
                      >
                        <Typography
                          variant="h6"
                          sx={{ fontSize: "14px", fontWeight: 700 }}
                        >
                          {t.grandTotal}:
                        </Typography>
                        <Typography
                          variant="h6"
                          sx={{
                            fontSize: "16px",
                            fontWeight: 700,
                            color: themeColors.primary,
                          }}
                        >
                          {formatCurrency(invoiceData.grandTotal || 0)}
                        </Typography>
                      </Box>
                    </Stack>
                  </Paper>
                </Grid>
              </Grid>

              {/* Payment Details Section */}
              {(isPartialPayment ||
                invoiceData.paymentStatus === PAYMENT_STATUS.EMI) && (
                <Paper
                  elevation={0}
                  sx={{
                    mb: 3,
                    p: 2,
                    backgroundColor: alpha("#1976d2", 0.05),
                    border: `1px solid ${alpha("#1976d2", 0.2)}`,
                    borderRadius: 1,
                    pageBreakInside: "avoid",
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      mb: 2,
                    }}
                  >
                    <Typography
                      variant="subtitle1"
                      fontWeight={600}
                      sx={{
                        color: "#1976d2",
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                        fontSize: "13px",
                      }}
                    >
                      {getPaymentMethodIcon(
                        invoiceData.paymentDetails?.paymentMethod
                      )}
                      {t.paymentDetails} -{" "}
                      {PAYMENT_STATUS_DISPLAY[invoiceData.paymentStatus]}
                    </Typography>

                    {canRecordPayment && onRecordPayment && showActions && (
                      <Button
                        variant="contained"
                        color="primary"
                        size="small"
                        startIcon={<RecordPaymentIcon />}
                        onClick={() => onRecordPayment(invoiceData)}
                        className="no-print-invoice"
                        sx={{ fontSize: "11px" }}
                      >
                        Record Payment
                      </Button>
                    )}
                  </Box>

                  {/* PENDING Payment Details */}
                  {invoiceData.paymentStatus === PAYMENT_STATUS.PENDING && (
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <Typography
                          variant="body2"
                          sx={{ fontSize: "11px", color: "text.secondary" }}
                        >
                          {t.paymentMethod}:
                        </Typography>
                        <Typography
                          variant="body2"
                          fontWeight={500}
                          sx={{ fontSize: "11px" }}
                        >
                          {PAYMENT_METHOD_DISPLAY[
                            invoiceData.paymentDetails?.paymentMethod
                          ] ||
                            invoiceData.paymentDetails?.paymentMethod ||
                            "Not specified"}
                        </Typography>
                      </Grid>
                      {invoiceData.paymentDetails?.paymentReference && (
                        <Grid item xs={12} sm={6}>
                          <Typography
                            variant="body2"
                            sx={{ fontSize: "11px", color: "text.secondary" }}
                          >
                            {t.paymentReference}:
                          </Typography>
                          <Typography
                            variant="body2"
                            fontWeight={500}
                            sx={{ fontSize: "11px" }}
                          >
                            {invoiceData.paymentDetails.paymentReference}
                          </Typography>
                        </Grid>
                      )}
                      {invoiceData.paymentDetails?.downPayment > 0 && (
                        <>
                          <Grid item xs={12} sm={6}>
                            <Typography
                              variant="body2"
                              sx={{ fontSize: "11px", color: "text.secondary" }}
                            >
                              {t.amountPaid}:
                            </Typography>
                            <Typography
                              variant="body2"
                              fontWeight={500}
                              sx={{ fontSize: "11px" }}
                            >
                              {formatCurrency(
                                invoiceData.paymentDetails?.downPayment || 0
                              )}
                            </Typography>
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <Typography
                              variant="body2"
                              sx={{ fontSize: "11px", color: "text.secondary" }}
                            >
                              {t.remainingBalance}:
                            </Typography>
                            <Typography
                              variant="body2"
                              fontWeight={500}
                              sx={{ fontSize: "11px" }}
                            >
                              {formatCurrency(
                                invoiceData.paymentDetails?.remainingBalance ||
                                  0
                              )}
                            </Typography>
                          </Grid>
                        </>
                      )}
                    </Grid>
                  )}

                  {/* Finance Payment Details */}
                  {invoiceData.paymentStatus === PAYMENT_STATUS.FINANCE && (
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <Typography
                          variant="body2"
                          sx={{ fontSize: "11px", color: "text.secondary" }}
                        >
                          <BankIcon
                            sx={{
                              fontSize: 12,
                              mr: 0.5,
                              verticalAlign: "middle",
                            }}
                          />
                          {t.financeCompany}:
                        </Typography>
                        <Typography
                          variant="body2"
                          fontWeight={500}
                          sx={{ fontSize: "11px" }}
                        >
                          {invoiceData.paymentDetails?.financeCompany ||
                            "Not specified"}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography
                          variant="body2"
                          sx={{ fontSize: "11px", color: "text.secondary" }}
                        >
                          {t.paymentReference}:
                        </Typography>
                        <Typography
                          variant="body2"
                          fontWeight={500}
                          sx={{ fontSize: "11px" }}
                        >
                          {invoiceData.paymentDetails?.paymentReference ||
                            "Not provided"}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography
                          variant="body2"
                          sx={{ fontSize: "11px", color: "text.secondary" }}
                        >
                          {t.downPayment}:
                        </Typography>
                        <Typography
                          variant="body2"
                          fontWeight={500}
                          sx={{ fontSize: "11px" }}
                        >
                          {formatCurrency(
                            invoiceData.paymentDetails?.downPayment || 0
                          )}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography
                          variant="body2"
                          sx={{ fontSize: "11px", color: "text.secondary" }}
                        >
                          {t.remainingBalance}:
                        </Typography>
                        <Typography
                          variant="body2"
                          fontWeight={500}
                          sx={{ fontSize: "11px" }}
                        >
                          {formatCurrency(
                            invoiceData.paymentDetails?.remainingBalance || 0
                          )}
                        </Typography>
                      </Grid>
                    </Grid>
                  )}

                  {/* Bank Transfer Payment Details */}
                  {invoiceData.paymentStatus ===
                    PAYMENT_STATUS.BANK_TRANSFER && (
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <Typography
                          variant="body2"
                          sx={{ fontSize: "11px", color: "text.secondary" }}
                        >
                          <BankIcon
                            sx={{
                              fontSize: 12,
                              mr: 0.5,
                              verticalAlign: "middle",
                            }}
                          />
                          {t.bankName}:
                        </Typography>
                        <Typography
                          variant="body2"
                          fontWeight={500}
                          sx={{ fontSize: "11px" }}
                        >
                          {invoiceData.paymentDetails?.bankName ||
                            "Not specified"}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography
                          variant="body2"
                          sx={{ fontSize: "11px", color: "text.secondary" }}
                        >
                          {t.paymentReference}:
                        </Typography>
                        <Typography
                          variant="body2"
                          fontWeight={500}
                          sx={{ fontSize: "11px" }}
                        >
                          {invoiceData.paymentDetails?.paymentReference ||
                            "Not provided"}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography
                          variant="body2"
                          sx={{ fontSize: "11px", color: "text.secondary" }}
                        >
                          {t.downPayment}:
                        </Typography>
                        <Typography
                          variant="body2"
                          fontWeight={500}
                          sx={{ fontSize: "11px" }}
                        >
                          {formatCurrency(
                            invoiceData.paymentDetails?.downPayment || 0
                          )}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography
                          variant="body2"
                          sx={{ fontSize: "11px", color: "text.secondary" }}
                        >
                          {t.remainingBalance}:
                        </Typography>
                        <Typography
                          variant="body2"
                          fontWeight={500}
                          sx={{ fontSize: "11px" }}
                        >
                          {formatCurrency(
                            invoiceData.paymentDetails?.remainingBalance || 0
                          )}
                        </Typography>
                      </Grid>
                    </Grid>
                  )}

                  {/* EMI Payment Details */}
                  {invoiceData.paymentStatus === PAYMENT_STATUS.EMI &&
                    invoiceData.emiDetails && (
                      <Grid container spacing={2}>
                        {invoiceData.emiDetails.downPayment > 0 && (
                          <>
                            <Grid item xs={12} sm={6}>
                              <Typography
                                variant="body2"
                                sx={{
                                  fontSize: "11px",
                                  color: "text.secondary",
                                }}
                              >
                                {t.downPayment}:
                              </Typography>
                              <Typography
                                variant="body2"
                                fontWeight={500}
                                sx={{ fontSize: "11px" }}
                              >
                                {formatCurrency(
                                  invoiceData.emiDetails.downPayment || 0
                                )}
                              </Typography>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                              <Typography
                                variant="body2"
                                sx={{
                                  fontSize: "11px",
                                  color: "text.secondary",
                                }}
                              >
                                {t.emiAmount}:
                              </Typography>
                              <Typography
                                variant="body2"
                                fontWeight={500}
                                sx={{ fontSize: "11px" }}
                              >
                                {formatCurrency(
                                  invoiceData.emiDetails.emiAmount ||
                                    invoiceData.grandTotal
                                )}
                              </Typography>
                            </Grid>
                          </>
                        )}

                        <Grid item xs={12} sm={6}>
                          <Typography
                            variant="body2"
                            sx={{ fontSize: "11px", color: "text.secondary" }}
                          >
                            {t.monthlyEMI}:
                          </Typography>
                          <Typography
                            variant="body2"
                            fontWeight={500}
                            sx={{ fontSize: "11px" }}
                          >
                            {formatCurrency(
                              invoiceData.emiDetails.monthlyAmount
                            )}
                          </Typography>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Typography
                            variant="body2"
                            sx={{ fontSize: "11px", color: "text.secondary" }}
                          >
                            {t.startDate}:
                          </Typography>
                          <Typography
                            variant="body2"
                            fontWeight={500}
                            sx={{ fontSize: "11px" }}
                          >
                            {formatDate(invoiceData.emiDetails.startDate)}
                          </Typography>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Typography
                            variant="body2"
                            sx={{ fontSize: "11px", color: "text.secondary" }}
                          >
                            {t.installments}:
                          </Typography>
                          <Typography
                            variant="body2"
                            fontWeight={500}
                            sx={{ fontSize: "11px" }}
                          >
                            {invoiceData.emiDetails.numberOfInstallments} months
                          </Typography>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Typography
                            variant="body2"
                            sx={{ fontSize: "11px", color: "text.secondary" }}
                          >
                            {t.totalInvoice}:
                          </Typography>
                          <Typography
                            variant="body2"
                            fontWeight={500}
                            sx={{ fontSize: "11px" }}
                          >
                            {formatCurrency(invoiceData.grandTotal || 0)}
                          </Typography>
                        </Grid>
                      </Grid>
                    )}

                  {/* Payment Breakdown for Partial Payments */}
                  {isPartialPayment && (
                    <Box
                      sx={{
                        mt: 2,
                        p: 1.5,
                        backgroundColor: alpha("#1976d2", 0.03),
                        borderRadius: 1,
                        border: `1px solid ${alpha("#1976d2", 0.1)}`,
                      }}
                    >
                      <Typography
                        variant="body2"
                        sx={{ fontSize: "11px", fontWeight: 600, mb: 1 }}
                      >
                        {t.paymentBreakdown}:
                      </Typography>

                      <Stack spacing={0.5}>
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                          }}
                        >
                          <Typography
                            variant="body2"
                            sx={{ fontSize: "11px", color: "text.secondary" }}
                          >
                            {t.amountPaid}:
                          </Typography>
                          <Typography
                            variant="body2"
                            fontWeight={500}
                            sx={{ fontSize: "11px", color: "success.main" }}
                          >
                            {formatCurrency(actualPaid)}
                          </Typography>
                        </Box>
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                          }}
                        >
                          <Typography
                            variant="body2"
                            sx={{ fontSize: "11px", color: "text.secondary" }}
                          >
                            {t.remainingBalance}:
                          </Typography>
                          <Typography
                            variant="body2"
                            fontWeight={500}
                            sx={{ fontSize: "11px", color: "warning.main" }}
                          >
                            {formatCurrency(remainingBalance)}
                          </Typography>
                        </Box>
                        <Divider sx={{ my: 0.5 }} />
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                          }}
                        >
                          <Typography
                            variant="body2"
                            fontWeight={600}
                            sx={{ fontSize: "11px" }}
                          >
                            {t.totalInvoice}:
                          </Typography>
                          <Typography
                            variant="body2"
                            fontWeight={600}
                            sx={{ fontSize: "11px", color: "primary.main" }}
                          >
                            {formatCurrency(invoiceData.grandTotal || 0)}
                          </Typography>
                        </Box>
                      </Stack>
                    </Box>
                  )}
                </Paper>
              )}

              {/* Payment History */}
              {invoiceData.paymentDetails?.paymentHistory &&
                invoiceData.paymentDetails.paymentHistory.length > 0 && (
                  <Box sx={{ mb: 3, pageBreakInside: "avoid" }}>
                    <Typography
                      variant="body2"
                      sx={{ fontSize: "11px", fontWeight: 600, mb: 1 }}
                    >
                      {t.paymentHistory}:
                    </Typography>

                    {invoiceData.paymentDetails.paymentHistory.map(
                      (payment, index) => (
                        <Paper
                          key={index}
                          elevation={0}
                          sx={{
                            p: 1.5,
                            mb: 1,
                            backgroundColor: alpha("#4caf50", 0.05),
                            border: `1px solid ${alpha("#4caf50", 0.2)}`,
                          }}
                        >
                          <Grid container spacing={1}>
                            <Grid item xs={6} sm={3}>
                              <Typography
                                variant="caption"
                                sx={{
                                  fontSize: "10px",
                                  color: "text.secondary",
                                }}
                              >
                                Amount
                              </Typography>
                              <Typography
                                variant="body2"
                                fontWeight={500}
                                sx={{ fontSize: "11px" }}
                              >
                                {formatCurrency(payment.amount)}
                              </Typography>
                            </Grid>
                            <Grid item xs={6} sm={3}>
                              <Typography
                                variant="caption"
                                sx={{
                                  fontSize: "10px",
                                  color: "text.secondary",
                                }}
                              >
                                Date
                              </Typography>
                              <Typography
                                variant="body2"
                                fontWeight={500}
                                sx={{ fontSize: "11px" }}
                              >
                                {formatDate(payment.date)}
                              </Typography>
                            </Grid>
                            <Grid item xs={6} sm={3}>
                              <Typography
                                variant="caption"
                                sx={{
                                  fontSize: "10px",
                                  color: "text.secondary",
                                }}
                              >
                                Method
                              </Typography>
                              <Typography
                                variant="body2"
                                fontWeight={500}
                                sx={{ fontSize: "11px" }}
                              >
                                {PAYMENT_METHOD_DISPLAY[payment.method] ||
                                  payment.method}
                              </Typography>
                            </Grid>
                            <Grid item xs={6} sm={3}>
                              <Typography
                                variant="caption"
                                sx={{
                                  fontSize: "10px",
                                  color: "text.secondary",
                                }}
                              >
                                {t.recordedBy}
                              </Typography>
                              <Typography
                                variant="body2"
                                fontWeight={500}
                                sx={{ fontSize: "11px", color: "primary.main" }}
                              >
                                {payment.recordedByName || "Unknown"}
                              </Typography>
                            </Grid>
                            {payment.reference && (
                              <Grid item xs={12}>
                                <Typography
                                  variant="caption"
                                  sx={{
                                    fontSize: "10px",
                                    color: "text.secondary",
                                  }}
                                >
                                  Reference: {payment.reference}
                                </Typography>
                              </Grid>
                            )}
                            {payment.notes && (
                              <Grid item xs={12}>
                                <Typography
                                  variant="caption"
                                  sx={{
                                    fontSize: "10px",
                                    color: "text.secondary",
                                  }}
                                >
                                  Notes: {payment.notes}
                                </Typography>
                              </Grid>
                            )}
                          </Grid>
                        </Paper>
                      )
                    )}
                  </Box>
                )}

              {/* Delivery Details */}
              {invoiceData.deliveryStatus === DELIVERY_STATUS.SCHEDULED &&
                invoiceData.scheduledDeliveryDate && (
                  <Paper
                    elevation={0}
                    sx={{
                      mb: 3,
                      p: 2,
                      backgroundColor: alpha("#4caf50", 0.05),
                      border: `1px solid ${alpha("#4caf50", 0.2)}`,
                      borderRadius: 1,
                      pageBreakInside: "avoid",
                    }}
                  >
                    <Typography
                      variant="subtitle1"
                      fontWeight={600}
                      gutterBottom
                      sx={{ color: "#4caf50", fontSize: "13px" }}
                    >
                      {t.deliveryInfo}
                    </Typography>
                    <Typography variant="body2" sx={{ fontSize: "11px" }}>
                      <CalendarIcon
                        sx={{ fontSize: 12, mr: 0.5, verticalAlign: "middle" }}
                      />
                      {t.scheduledDelivery}:{" "}
                      {formatDate(invoiceData.scheduledDeliveryDate)}
                    </Typography>
                  </Paper>
                )}

              {/* Footer with QR Code */}
              <Box
                sx={{
                  mt: 4,
                  pt: 2,
                  borderTop: `2px solid #e0e0e0`,
                  pageBreakInside: "avoid",
                }}
              >
                <Grid container spacing={3} alignItems="flex-end">
                  <Grid item xs={12} sm={8}>
                    <Typography
                      variant="subtitle1"
                      fontWeight={600}
                      gutterBottom
                      sx={{ color: themeColors.primary, fontSize: "13px" }}
                    >
                      {t.thankYou}
                    </Typography>

                    <Grid container spacing={2} sx={{ mt: 1 }}>
                      <Grid item xs={12} sm={6}>
                        <Typography
                          variant="body2"
                          sx={{ fontSize: "11px", color: "text.secondary" }}
                        >
                          For any queries, contact us at {companyDetails.phone}
                        </Typography>
                        {companyDetails.website && (
                          <Typography
                            variant="body2"
                            sx={{ fontSize: "11px", color: "text.secondary" }}
                          >
                            Visit: {companyDetails.website}
                          </Typography>
                        )}
                      </Grid>

                      <Grid item xs={12} sm={6}>
                        <Typography
                          variant="body2"
                          sx={{ fontSize: "11px", color: "text.secondary" }}
                        >
                          Generated on {formatDate(new Date())}
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{ fontSize: "10px", color: "text.secondary" }}
                        >
                          Powered by Business Manager System
                        </Typography>
                      </Grid>
                    </Grid>
                  </Grid>

                  {/* Payment QR Code */}
                  <Grid item xs={12} sm={4}>
                    <Box sx={{ textAlign: "center" }}>
                      <Typography
                        variant="body2"
                        sx={{
                          fontSize: "11px",
                          mb: 1,
                          color: themeColors.primary,
                          fontWeight: 600,
                        }}
                      >
                        {t.paymentQR}
                      </Typography>
                      <Box
                        sx={{
                          width: 100,
                          height: 100,
                          border: `2px solid ${themeColors.primary}`,
                          borderRadius: 1,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          backgroundColor: alpha(themeColors.primary, 0.05),
                          mx: "auto",
                          mb: 1,
                        }}
                      >
                        <QRCodeIcon
                          sx={{ fontSize: 40, color: themeColors.primary }}
                        />
                      </Box>
                      <Typography
                        variant="caption"
                        sx={{ fontSize: "9px", color: "text.secondary" }}
                      >
                        UPI: company@upi
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>

                <Box
                  sx={{
                    mt: 2,
                    pt: 2,
                    borderTop: `1px solid #e0e0e0`,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "end",
                  }}
                >
                  <Typography
                    variant="caption"
                    sx={{
                      fontSize: "10px",
                      color: "text.secondary",
                      fontStyle: "italic",
                    }}
                  >
                    This is a {invoiceData.includeGST ? "GST" : "Non-GST"}{" "}
                    invoice
                    {invoiceData.customerGSTNumber &&
                      " for GST registered customer"}
                    {invoiceData.includeGST &&
                      invoiceData.customerState &&
                      ` • ${
                        invoiceData.customerState?.toLowerCase() === "gujarat"
                          ? t.intraState
                          : t.interState
                      } ${t.transaction}`}
                  </Typography>

                  <Box sx={{ textAlign: "right" }}>
                    <Box
                      sx={{ width: 100, borderTop: "1px solid #000", mb: 0.5 }}
                    />
                    <Typography variant="caption" sx={{ fontSize: "10px" }}>
                      Authorized Signature
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Box>

        {/* UPDATED: Print-only content - matching PrintableInvoice structure exactly */}
        <PrintInvoiceContent />
      </>
    );
  }
);

InvoicePreview.displayName = "InvoicePreview";

export default InvoicePreview;