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
  SwapHoriz,
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
  netPayable: "Net Payable",
  exchangeCredit: "Less: Exchange Credit",
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
      if (
        invoiceData.paymentStatus === PAYMENT_STATUS.PAID ||
        invoiceData.fullyPaid
      ) {
        return (
          invoiceData.netPayable ||
          invoiceData.grandTotal ||
          invoiceData.totalAmount ||
          0
        );
      }

      // CRITICAL FIX: Calculate from downPayment + all additional payments in history
      const downPayment = parseFloat(
        invoiceData.paymentDetails?.downPayment || 0
      );

      // Sum all additional payments (excluding initial down payment record)
      const additionalPayments = (
        invoiceData.paymentDetails?.paymentHistory || []
      )
        .filter((payment) => payment.type !== "down_payment") // Exclude down payment record
        .reduce((sum, payment) => sum + (payment.amount || 0), 0);

      const totalPaid = downPayment + additionalPayments;

      // For EMI, also add paid installments
      if (
        invoiceData.paymentStatus === PAYMENT_STATUS.EMI &&
        invoiceData.emiDetails?.schedule
      ) {
        const installmentsPaid = invoiceData.emiDetails.schedule
          .filter((emi) => emi.paid)
          .reduce((sum, emi) => sum + (emi.paidAmount || emi.amount || 0), 0);
        return totalPaid + installmentsPaid;
      }

      return totalPaid;
    };

    const getRemainingBalance = () => {
      const totalAmount =
        invoiceData.netPayable ||
        invoiceData.grandTotal ||
        invoiceData.totalAmount ||
        0;
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

    return (
      <Box
        ref={ref}
        sx={{
          backgroundColor: variant === "print" ? "white" : "background.paper",
        }}
      >
        <Card
          elevation={variant === "print" ? 0 : 1}
          sx={{
            width: "210mm",
            minHeight: "297mm",
            margin: "auto",
            borderRadius: variant === "print" ? 0 : 2,
          }}
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
                          <Typography variant="body2" sx={{ fontSize: "11px" }}>
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
                                  invoiceData.bulkPricingDetails?.gstSlab || 18
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

                    {/* EXCHANGE CREDIT DISPLAY */}
                    {invoiceData.exchangeDetails?.hasExchange &&
                      invoiceData.exchangeDetails?.exchangeAmount > 0 && (
                        <>
                          <Box
                            sx={{
                              display: "flex",
                              justifyContent: "space-between",
                            }}
                          >
                            <Typography
                              variant="body2"
                              sx={{ fontSize: "11px", color: "success.main" }}
                            >
                              {t.exchangeCredit}:
                            </Typography>
                            <Typography
                              variant="body2"
                              sx={{
                                fontSize: "11px",
                                fontWeight: 600,
                                color: "success.main",
                              }}
                            >
                              -
                              {formatCurrency(
                                invoiceData.exchangeDetails.exchangeAmount
                              )}
                            </Typography>
                          </Box>

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
                              {t.netPayable}:
                            </Typography>
                            <Typography
                              variant="h6"
                              sx={{
                                fontSize: "16px",
                                fontWeight: 700,
                                color: themeColors.primary,
                              }}
                            >
                              {formatCurrency(invoiceData.netPayable || 0)}
                            </Typography>
                          </Box>
                        </>
                      )}
                  </Stack>
                </Paper>
              </Grid>
            </Grid>

            {/* EXCHANGE DETAILS SECTION */}
            {invoiceData.exchangeDetails?.hasExchange && (
              <Paper
                elevation={0}
                sx={{
                  mb: 3,
                  p: 2,
                  backgroundColor: alpha("#4caf50", 0.08),
                  border: `2px solid ${alpha("#4caf50", 0.3)}`,
                  borderRadius: 1,
                  pageBreakInside: "avoid",
                }}
              >
                <Typography
                  variant="subtitle1"
                  fontWeight={600}
                  gutterBottom
                  sx={{
                    color: "#2e7d32",
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    fontSize: "13px",
                  }}
                >
                  <SwapHoriz fontSize="small" />
                  Exchange/Trade-In Details
                </Typography>

                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography
                      variant="body2"
                      sx={{ fontSize: "11px", color: "text.secondary" }}
                    >
                      Exchange Credit:
                    </Typography>
                    <Typography
                      variant="body2"
                      fontWeight={600}
                      sx={{ fontSize: "12px", color: "success.main" }}
                    >
                      {formatCurrency(
                        invoiceData.exchangeDetails.exchangeAmount
                      )}
                    </Typography>
                  </Grid>

                  {invoiceData.exchangeDetails.exchangeDescription && (
                    <Grid item xs={12}>
                      <Typography
                        variant="body2"
                        sx={{ fontSize: "11px", color: "text.secondary" }}
                      >
                        Item Exchanged:
                      </Typography>
                      <Typography variant="body2" sx={{ fontSize: "11px" }}>
                        {invoiceData.exchangeDetails.exchangeDescription}
                      </Typography>
                    </Grid>
                  )}

                  <Grid item xs={12} sm={6}>
                    <Typography
                      variant="body2"
                      sx={{ fontSize: "11px", color: "text.secondary" }}
                    >
                      Item Received:
                    </Typography>
                    <Chip
                      label={
                        invoiceData.exchangeDetails.itemReceived
                          ? "Received"
                          : "Pending"
                      }
                      size="small"
                      color={
                        invoiceData.exchangeDetails.itemReceived
                          ? "success"
                          : "warning"
                      }
                      sx={{ fontSize: "10px", height: 20 }}
                    />
                  </Grid>

                  {invoiceData.exchangeDetails.itemReceived &&
                    invoiceData.exchangeDetails.exchangeReceivedDate && (
                      <Grid item xs={12} sm={6}>
                        <Typography
                          variant="caption"
                          sx={{ fontSize: "10px", color: "text.secondary" }}
                        >
                          Received on:{" "}
                          {formatDate(
                            invoiceData.exchangeDetails.exchangeReceivedDate
                          )}
                        </Typography>
                      </Grid>
                    )}
                </Grid>
              </Paper>
            )}

            {/* Payment Details Section */}
            {(isPartialPayment ||
              invoiceData.paymentStatus === PAYMENT_STATUS.EMI ||
              invoiceData.paymentStatus === PAYMENT_STATUS.PAID ||
              invoiceData.fullyPaid) && (
              <Paper
                elevation={0}
                sx={{
                  mb: 3,
                  p: 2,
                  backgroundColor:
                    invoiceData.paymentStatus === PAYMENT_STATUS.PAID ||
                    invoiceData.fullyPaid
                      ? alpha("#4caf50", 0.05) // Green for paid
                      : alpha("#1976d2", 0.05), // Blue for partial/EMI
                  border:
                    invoiceData.paymentStatus === PAYMENT_STATUS.PAID ||
                    invoiceData.fullyPaid
                      ? `1px solid ${alpha("#4caf50", 0.2)}`
                      : `1px solid ${alpha("#1976d2", 0.2)}`,
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
                      color:
                        invoiceData.paymentStatus === PAYMENT_STATUS.PAID ||
                        invoiceData.fullyPaid
                          ? "#2e7d32" // Green for paid
                          : "#1976d2", // Blue for partial/EMI
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
                      sx={{ fontSize: "11px" }}
                    >
                      Record Payment
                    </Button>
                  )}
                </Box>

                {/* PAID Status - Show payment method and date */}
                {(invoiceData.paymentStatus === PAYMENT_STATUS.PAID ||
                  invoiceData.fullyPaid) && (
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
                          "Cash"}
                      </Typography>
                    </Grid>

                    {invoiceData.paymentDate && (
                      <Grid item xs={12} sm={6}>
                        <Typography
                          variant="body2"
                          sx={{ fontSize: "11px", color: "text.secondary" }}
                        >
                          Payment Date:
                        </Typography>
                        <Typography
                          variant="body2"
                          fontWeight={500}
                          sx={{ fontSize: "11px" }}
                        >
                          {formatDate(invoiceData.paymentDate)}
                        </Typography>
                      </Grid>
                    )}

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

                    <Grid item xs={12}>
                      <Box
                        sx={{
                          p: 1.5,
                          backgroundColor: alpha("#4caf50", 0.08),
                          borderRadius: 1,
                          border: `1px solid ${alpha("#4caf50", 0.2)}`,
                        }}
                      >
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                        >
                          <Typography
                            variant="body2"
                            fontWeight={600}
                            sx={{ fontSize: "12px", color: "success.main" }}
                          >
                            ✓ Paid in Full
                          </Typography>
                          <Typography
                            variant="h6"
                            fontWeight={700}
                            sx={{ fontSize: "14px", color: "success.main" }}
                          >
                            {formatCurrency(
                              invoiceData.netPayable ||
                                invoiceData.grandTotal ||
                                0
                            )}
                          </Typography>
                        </Box>
                      </Box>
                    </Grid>
                  </Grid>
                )}

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
                              invoiceData.paymentDetails?.remainingBalance || 0
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
                {invoiceData.paymentStatus === PAYMENT_STATUS.BANK_TRANSFER && (
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
                                  invoiceData.netPayable ||
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
                          {formatCurrency(invoiceData.emiDetails.monthlyAmount)}
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
                          {formatCurrency(
                            invoiceData.netPayable ||
                              invoiceData.grandTotal ||
                              0
                          )}
                        </Typography>
                      </Grid>
                    </Grid>
                  )}

                {/* Payment Breakdown for Partial Payments (NOT for PAID) */}
                {isPartialPayment &&
                  invoiceData.paymentStatus !== PAYMENT_STATUS.PAID &&
                  !invoiceData.fullyPaid && (
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
                            {invoiceData.exchangeDetails?.hasExchange
                              ? t.netPayable
                              : t.totalInvoice}
                            :
                          </Typography>
                          <Typography
                            variant="body2"
                            fontWeight={600}
                            sx={{ fontSize: "11px", color: "primary.main" }}
                          >
                            {formatCurrency(
                              invoiceData.netPayable ||
                                invoiceData.grandTotal ||
                                0
                            )}
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
                  This is a {invoiceData.includeGST ? "GST" : "Non-GST"} invoice
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
    );
  }
);

InvoicePreview.displayName = "InvoicePreview";

export default InvoicePreview;
