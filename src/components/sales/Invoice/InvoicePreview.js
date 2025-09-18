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
  useTheme,
  useMediaQuery,
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
  Info as InfoIcon,
  Assignment as GSTIcon,
  PaymentOutlined as RecordPaymentIcon,
} from "@mui/icons-material";

import { useUserType } from "../../../contexts/UserTypeContext/UserTypeContext";
import {
  formatCurrency,
  formatDate,
} from "../../../utils/helpers/formatHelpers";
import {
  GST_TYPES,
  PAYMENT_STATUS,
  PAYMENT_STATUS_DISPLAY,
  PAYMENT_METHOD_DISPLAY,
  DELIVERY_STATUS,
} from "../../../utils/constants/appConstants";

/**
 * Invoice preview component for displaying invoice in printable format
 * @param {Object} props
 * @param {Object} props.invoice - Invoice data
 * @param {boolean} props.showActions - Whether to show action buttons
 * @param {string} props.variant - Display variant (preview, print, email)
 * @param {Function} props.onRecordPayment - Callback for recording payment
 */
const InvoicePreview = forwardRef(
  ({ invoice = {}, showActions = false, variant = "preview", onRecordPayment }, ref) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("md"));
    const isSmallMobile = useMediaQuery(theme.breakpoints.down("sm"));
    const { getDisplayName, getThemeColors } = useUserType();

    const themeColors = getThemeColors();

    // Default invoice data structure
    const defaultInvoice = {
      invoiceNumber: "",
      saleDate: new Date(),
      dueDate: null,
      customerName: "",
      customerPhone: "",
      customerAddress: "",
      customerState: "",
      customerGSTNumber: "", // NEW - Customer GST Number
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
      },
      notes: "",
      terms: "",
    };

    const invoiceData = { ...defaultInvoice, ...invoice };

    // FIX: Helper function to get the correct display rate for an item
    const getItemDisplayRate = (item) => {
      // If the item has baseAmount, use that for price-inclusive items
      if (item.baseAmount !== undefined) {
        return item.isPriceInclusive ? item.baseAmount : item.rate;
      }
      // Fallback to the original rate
      return item.rate || 0;
    };

    // FIX: Helper function to get the correct total amount for an item
    const getItemTotalAmount = (item) => {
      // If item has totalAmount calculated, use that
      if (item.totalAmount !== undefined) {
        return item.totalAmount;
      }
      // Otherwise calculate from quantity and rate
      return (item.quantity || 0) * (item.rate || 0);
    };

    // FIX: Check if this invoice uses bulk pricing
    const isBulkPricingInvoice =
      invoiceData.bulkPricingApplied ||
      (invoiceData.bulkPricingDetails &&
        invoiceData.items &&
        invoiceData.items.some((item) => item.bulkPricing));

    // Company details (would typically come from settings)
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

    // Get status color
    const getStatusColor = (status, type = "payment") => {
      const colors = {
        payment: {
          [PAYMENT_STATUS.PAID]: theme.palette.success.main,
          [PAYMENT_STATUS.PENDING]: theme.palette.warning.main,
          [PAYMENT_STATUS.EMI]: theme.palette.info.main,
          [PAYMENT_STATUS.FINANCE]: theme.palette.success.main,
          [PAYMENT_STATUS.BANK_TRANSFER]: theme.palette.primary.main,
        },
        delivery: {
          [DELIVERY_STATUS.DELIVERED]: theme.palette.success.main,
          [DELIVERY_STATUS.PENDING]: theme.palette.warning.main,
          [DELIVERY_STATUS.SCHEDULED]: theme.palette.info.main,
        },
      };

      return colors[type]?.[status] || theme.palette.text.secondary;
    };

    // Status chip component
    const StatusChip = ({ label, status, type = "payment" }) => (
      <Chip
        label={label}
        size={isSmallMobile ? "small" : "medium"}
        sx={{
          backgroundColor: alpha(getStatusColor(status, type), 0.1),
          color: getStatusColor(status, type),
          fontWeight: 600,
          border: `1px solid ${alpha(getStatusColor(status, type), 0.3)}`,
        }}
      />
    );

    // Info item component for better organization
    const InfoItem = ({ icon, label, value, href }) => (
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
        {icon && (
          <Box sx={{ color: "text.secondary", fontSize: "1rem" }}>{icon}</Box>
        )}
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ minWidth: "fit-content" }}
        >
          {label}:
        </Typography>
        <Typography
          variant="body2"
          sx={{
            fontWeight: 500,
            wordBreak: "break-word",
            ...(href && {
              color: "primary.main",
              textDecoration: "underline",
              cursor: "pointer",
            }),
          }}
        >
          {value}
        </Typography>
      </Box>
    );

    // Get payment method icon
    const getPaymentMethodIcon = (method) => {
      const iconMap = {
        cash: <MoneyIcon />,
        card: <CardIcon />,
        finance: <BankIcon />,
        bank_transfer: <BankIcon />,
        upi: <PaymentIcon />,
      };
      return iconMap[method] || <PaymentIcon />;
    };

    // UPDATED: Check if payment is partial (finance or bank transfer or PENDING)
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
      if (invoiceData.paymentStatus === PAYMENT_STATUS.PAID || invoiceData.fullyPaid) {
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
      const totalAmount = invoiceData.grandTotal || invoiceData.totalAmount || 0;
      const paidAmount = getActualAmountPaid();
      return Math.max(0, totalAmount - paidAmount);
    };

    const actualPaid = getActualAmountPaid();
    const remainingBalance = getRemainingBalance();
    const canRecordPayment = remainingBalance > 0 && isPartialPayment && !invoiceData.fullyPaid;

    return (
      <Box
        ref={ref}
        sx={{
          backgroundColor: variant === "print" ? "white" : "background.paper",
          color: variant === "print" ? "black" : "text.primary",
          fontSize: variant === "print" ? "12px" : "inherit",
          "@media print": {
            backgroundColor: "white !important",
            color: "black !important",
            boxShadow: "none !important",
            "& .no-print": {
              display: "none !important",
            },
          },
        }}
      >
        <Card
          elevation={variant === "print" ? 0 : 1}
          sx={{
            maxWidth: "21cm",
            margin: "auto",
            minHeight: variant === "print" ? "29.7cm" : "auto",
            borderRadius: variant === "print" ? 0 : 2,
          }}
        >
          <CardContent sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
            {/* Header Section */}
            <Paper
              elevation={0}
              sx={{
                p: { xs: 2, sm: 3 },
                mb: 3,
                background: `linear-gradient(135deg, ${themeColors.primary}15 0%, ${themeColors.secondary}15 100%)`,
                border: `1px solid ${alpha(themeColors.primary, 0.1)}`,
              }}
            >
              <Grid container spacing={3} alignItems="center">
                {/* Company Info */}
                <Grid item xs={12} md={7}>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 2,
                      mb: 2,
                    }}
                  >
                    <Avatar
                      sx={{
                        width: { xs: 50, sm: 60 },
                        height: { xs: 50, sm: 60 },
                        backgroundColor: themeColors.primary,
                        fontSize: { xs: "1.2rem", sm: "1.5rem" },
                      }}
                    >
                      <BusinessIcon fontSize="inherit" />
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                      <Typography
                        variant={isSmallMobile ? "h6" : "h5"}
                        fontWeight={700}
                        color={themeColors.primary}
                        sx={{ lineHeight: 1.2, mb: 0.5 }}
                      >
                        {companyDetails.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {getDisplayName()} Business Solutions
                      </Typography>
                    </Box>
                  </Box>

                  <Stack spacing={0.5}>
                    <InfoItem
                      icon={<LocationIcon fontSize="small" />}
                      label="Address"
                      value={`${companyDetails.address}, ${companyDetails.city}, ${companyDetails.state} - ${companyDetails.pincode}`}
                    />
                    <InfoItem
                      icon={<PhoneIcon fontSize="small" />}
                      label="Phone"
                      value={companyDetails.phone}
                    />
                    <InfoItem
                      icon={<EmailIcon fontSize="small" />}
                      label="Email"
                      value={companyDetails.email}
                    />
                    {companyDetails.gst && (
                      <InfoItem
                        icon={<GSTIcon fontSize="small" />}
                        label="Company GST"
                        value={companyDetails.gst}
                      />
                    )}
                  </Stack>
                </Grid>

                {/* Invoice Details */}
                <Grid item xs={12} md={5}>
                  <Box
                    sx={{
                      textAlign: { xs: "left", md: "right" },
                      mt: { xs: 2, md: 0 },
                    }}
                  >
                    <Typography
                      variant={isSmallMobile ? "h5" : "h4"}
                      fontWeight={700}
                      color={themeColors.primary}
                      gutterBottom
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: { xs: "flex-start", md: "flex-end" },
                        gap: 1,
                      }}
                    >
                      <ReceiptIcon fontSize="inherit" />
                      INVOICE
                    </Typography>

                    <Paper
                      elevation={0}
                      sx={{
                        display: "inline-block",
                        p: 2,
                        backgroundColor: "background.paper",
                        border: `1px solid ${theme.palette.divider}`,
                        borderRadius: 1,
                        textAlign: "left",
                        minWidth: { xs: "100%", md: 250 },
                      }}
                    >
                      <Stack spacing={1}>
                        <InfoItem
                          label="Invoice #"
                          value={invoiceData.invoiceNumber}
                        />
                        <InfoItem
                          icon={<CalendarIcon fontSize="small" />}
                          label="Date"
                          value={formatDate(invoiceData.saleDate)}
                        />
                        {invoiceData.dueDate && (
                          <InfoItem
                            label="Due Date"
                            value={formatDate(invoiceData.dueDate)}
                          />
                        )}
                        {/* NEW - Show GST/Non-GST indicator */}
                        <InfoItem
                          label="Invoice Type"
                          value={
                            invoiceData.includeGST
                              ? "GST Invoice"
                              : "Non-GST Invoice"
                          }
                        />
                      </Stack>

                      <Box
                        sx={{
                          display: "flex",
                          gap: 1,
                          mt: 2,
                          flexWrap: "wrap",
                        }}
                      >
                        <StatusChip
                          label={`Pay: ${
                            PAYMENT_STATUS_DISPLAY[invoiceData.paymentStatus] ||
                            invoiceData.paymentStatus
                          }`}
                          status={invoiceData.paymentStatus}
                          type="payment"
                        />
                        <StatusChip
                          label={`Del: ${invoiceData.deliveryStatus}`}
                          status={invoiceData.deliveryStatus}
                          type="delivery"
                        />
                      </Box>
                    </Paper>
                  </Box>
                </Grid>
              </Grid>
            </Paper>

            {/* Customer and Sales Person Info */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
              {/* Bill To */}
              <Grid item xs={12} md={6}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 2,
                    height: "100%",
                    border: `1px solid ${theme.palette.divider}`,
                    borderRadius: 1,
                  }}
                >
                  <Typography
                    variant="h6"
                    fontWeight={600}
                    gutterBottom
                    sx={{ color: themeColors.primary }}
                  >
                    Bill To:
                  </Typography>

                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 2,
                      mb: 2,
                    }}
                  >
                    <Avatar
                      sx={{
                        backgroundColor: alpha(themeColors.secondary, 0.1),
                        color: themeColors.secondary,
                        width: 40,
                        height: 40,
                      }}
                    >
                      <PersonIcon />
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                      <Typography
                        variant="h6"
                        fontWeight={600}
                        sx={{ fontSize: { xs: "1rem", sm: "1.25rem" } }}
                      >
                        {invoiceData.customerName || "Customer Name"}
                      </Typography>
                    </Box>
                  </Box>

                  <Stack spacing={0.5}>
                    {invoiceData.customerPhone && (
                      <InfoItem
                        icon={<PhoneIcon fontSize="small" />}
                        label="Phone"
                        value={invoiceData.customerPhone}
                      />
                    )}

                    {invoiceData.customerAddress && (
                      <InfoItem
                        icon={<LocationIcon fontSize="small" />}
                        label="Address"
                        value={invoiceData.customerAddress}
                      />
                    )}

                    {invoiceData.customerState && (
                      <InfoItem
                        label="State"
                        value={invoiceData.customerState}
                      />
                    )}

                    {/* NEW - Display Customer GST Number if available */}
                    {invoiceData.customerGSTNumber && (
                      <InfoItem
                        icon={<GSTIcon fontSize="small" />}
                        label="Customer GST"
                        value={invoiceData.customerGSTNumber}
                      />
                    )}
                  </Stack>
                </Paper>
              </Grid>

              {/* Sales Person */}
              <Grid item xs={12} md={6}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 2,
                    height: "100%",
                    border: `1px solid ${theme.palette.divider}`,
                    borderRadius: 1,
                  }}
                >
                  <Typography
                    variant="h6"
                    fontWeight={600}
                    gutterBottom
                    sx={{ color: themeColors.primary }}
                  >
                    Sales Person:
                  </Typography>

                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 2,
                      mb: 2,
                    }}
                  >
                    <Avatar
                      sx={{
                        backgroundColor: alpha(themeColors.primary, 0.1),
                        color: themeColors.primary,
                        width: 40,
                        height: 40,
                      }}
                    >
                      <SalesPersonIcon />
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                      <Typography
                        variant="h6"
                        fontWeight={600}
                        sx={{ fontSize: { xs: "1rem", sm: "1.25rem" } }}
                      >
                        {invoiceData.salesPersonName || "Sales Person"}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
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
              sx={{ mb: 4, border: `1px solid ${theme.palette.divider}` }}
            >
              <Box
                sx={{ p: 2, backgroundColor: alpha(themeColors.primary, 0.05) }}
              >
                <Typography
                  variant="h6"
                  fontWeight={600}
                  sx={{ color: themeColors.primary }}
                >
                  Invoice Items
                  {isBulkPricingInvoice && (
                    <Chip
                      label="Bulk Pricing Applied"
                      size="small"
                      color="success"
                      sx={{ ml: 2 }}
                    />
                  )}
                </Typography>
              </Box>

              {/* Desktop Table */}
              {!isMobile ? (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow
                        sx={{
                          backgroundColor: alpha(themeColors.primary, 0.1),
                        }}
                      >
                        <TableCell sx={{ fontWeight: 700 }}>#</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>
                          Description
                        </TableCell>
                        <TableCell align="center" sx={{ fontWeight: 700 }}>
                          HSN Code
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700 }}>
                          Qty
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700 }}>
                          Rate
                        </TableCell>
                        {invoiceData.includeGST && (
                          <TableCell align="right" sx={{ fontWeight: 700 }}>
                            GST %
                          </TableCell>
                        )}
                        <TableCell align="right" sx={{ fontWeight: 700 }}>
                          Amount
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {invoiceData.items.map((item, index) => (
                        <TableRow
                          key={index}
                          sx={{
                            "&:nth-of-type(odd)": {
                              backgroundColor: alpha(
                                theme.palette.action.hover,
                                0.3
                              ),
                            },
                          }}
                        >
                          <TableCell>{index + 1}</TableCell>
                          <TableCell>
                            <Typography variant="body2" fontWeight={500}>
                              {item.name}
                            </Typography>
                            {item.description && (
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                {item.description}
                              </Typography>
                            )}
                            {/* FIX: Show pricing information for clarity */}
                            {item.isPriceInclusive && !isBulkPricingInvoice && (
                              <Box sx={{ mt: 0.5 }}>
                                <Chip
                                  size="small"
                                  label="Price Incl. GST"
                                  color="info"
                                  variant="outlined"
                                  sx={{ fontSize: "0.7rem", height: 18 }}
                                />
                              </Box>
                            )}
                          </TableCell>
                          <TableCell align="center">
                            <Typography
                              variant="body2"
                              fontFamily="monospace"
                              fontWeight={500}
                            >
                              {item.hsnCode || "-"}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">{item.quantity}</TableCell>
                          <TableCell align="right">
                            {/* FIX: Show correct rate based on pricing type */}
                            {isBulkPricingInvoice ? (
                              <Chip
                                size="small"
                                label="Bulk"
                                color="success"
                                variant="outlined"
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
                            {/* FIX: Show correct total amount */}
                            {isBulkPricingInvoice ? (
                              <Chip
                                size="small"
                                label="See Total Below"
                                color="info"
                                variant="outlined"
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
                            sx={{ py: 4 }}
                          >
                            <Typography variant="body2" color="text.secondary">
                              No items added
                            </Typography>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                /* Mobile Cards */
                <Box sx={{ p: 2 }}>
                  {invoiceData.items.length > 0 ? (
                    <Stack spacing={2}>
                      {invoiceData.items.map((item, index) => (
                        <Paper
                          key={index}
                          elevation={0}
                          sx={{
                            p: 2,
                            border: `1px solid ${theme.palette.divider}`,
                            borderRadius: 1,
                          }}
                        >
                          <Box
                            sx={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "flex-start",
                              mb: 1,
                            }}
                          >
                            <Typography
                              variant="body1"
                              fontWeight={600}
                              sx={{ flex: 1 }}
                            >
                              {index + 1}. {item.name}
                            </Typography>
                            <Typography
                              variant="h6"
                              fontWeight={700}
                              color="primary.main"
                            >
                              {/* FIX: Use correct total amount */}
                              {isBulkPricingInvoice ? (
                                <Chip
                                  size="small"
                                  label="Bulk Pricing"
                                  color="success"
                                />
                              ) : (
                                formatCurrency(getItemTotalAmount(item))
                              )}
                            </Typography>
                          </Box>

                          {item.description && (
                            <Typography
                              variant="body2"
                              color="text.secondary"
                              sx={{ mb: 1 }}
                            >
                              {item.description}
                            </Typography>
                          )}

                          <Grid container spacing={1}>
                            <Grid item xs={3}>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                Qty
                              </Typography>
                              <Typography variant="body2" fontWeight={500}>
                                {item.quantity}
                              </Typography>
                            </Grid>
                            <Grid item xs={3}>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                Rate
                              </Typography>
                              <Typography variant="body2" fontWeight={500}>
                                {/* FIX: Show correct rate */}
                                {isBulkPricingInvoice ? (
                                  <Chip
                                    size="small"
                                    label="Bulk"
                                    color="success"
                                  />
                                ) : (
                                  formatCurrency(getItemDisplayRate(item))
                                )}
                              </Typography>
                            </Grid>
                            <Grid item xs={3}>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                HSN
                              </Typography>
                              <Typography
                                variant="body2"
                                fontWeight={500}
                                fontFamily="monospace"
                              >
                                {item.hsnCode || "-"}
                              </Typography>
                            </Grid>
                            {invoiceData.includeGST && (
                              <Grid item xs={3}>
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                >
                                  GST
                                </Typography>
                                <Typography variant="body2" fontWeight={500}>
                                  {isBulkPricingInvoice
                                    ? `${
                                        invoiceData.bulkPricingDetails
                                          ?.gstSlab || 18
                                      }%`
                                    : `${item.gstSlab || 18}%`}
                                </Typography>
                              </Grid>
                            )}
                          </Grid>

                          {/* FIX: Show pricing information for mobile */}
                          {item.isPriceInclusive && !isBulkPricingInvoice && (
                            <Box sx={{ mt: 1 }}>
                              <Chip
                                size="small"
                                label="Price Inclusive of GST"
                                color="info"
                                variant="outlined"
                                sx={{ fontSize: "0.7rem" }}
                              />
                            </Box>
                          )}
                        </Paper>
                      ))}
                    </Stack>
                  ) : (
                    <Box sx={{ py: 4, textAlign: "center" }}>
                      <Typography variant="body2" color="text.secondary">
                        No items added
                      </Typography>
                    </Box>
                  )}
                </Box>
              )}
            </Paper>

            {/* Totals Section */}
            <Grid container justifyContent="flex-end" sx={{ mb: 4 }}>
              <Grid item xs={12} sm={8} md={6} lg={4}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 3,
                    border: `2px solid ${themeColors.primary}`,
                    borderRadius: 2,
                    backgroundColor: alpha(themeColors.primary, 0.02),
                  }}
                >
                  <Typography
                    variant="h6"
                    fontWeight={700}
                    gutterBottom
                    sx={{ color: themeColors.primary }}
                  >
                    Invoice Summary
                  </Typography>

                  <Stack spacing={1.5}>
                    <Box
                      sx={{ display: "flex", justifyContent: "space-between" }}
                    >
                      <Typography variant="body1">Subtotal:</Typography>
                      <Typography variant="body1" fontWeight={600}>
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
                        <Typography variant="body1">
                          GST (
                          {invoiceData.customerState?.toLowerCase() ===
                          "gujarat"
                            ? "CGST+SGST"
                            : "IGST"}
                          ):
                        </Typography>
                        <Typography variant="body1" fontWeight={600}>
                          {formatCurrency(invoiceData.totalGST || 0)}
                        </Typography>
                      </Box>
                    )}

                    <Divider sx={{ my: 1 }} />

                    <Box
                      sx={{ display: "flex", justifyContent: "space-between" }}
                    >
                      <Typography variant="h6" fontWeight={700}>
                        Grand Total:
                      </Typography>
                      <Typography
                        variant="h6"
                        fontWeight={700}
                        color={themeColors.primary}
                      >
                        {formatCurrency(invoiceData.grandTotal || 0)}
                      </Typography>
                    </Box>
                  </Stack>
                </Paper>
              </Grid>
            </Grid>

            {/* UPDATED: Payment Details Section - Now includes PENDING status */}
            {(isPartialPayment ||
              invoiceData.paymentStatus === PAYMENT_STATUS.EMI) && (
              <Paper
                elevation={0}
                sx={{
                  mb: 4,
                  p: 3,
                  backgroundColor: alpha(
                    getStatusColor(invoiceData.paymentStatus),
                    0.05
                  ),
                  border: `1px solid ${alpha(
                    getStatusColor(invoiceData.paymentStatus),
                    0.2
                  )}`,
                  borderRadius: 2,
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography
                    variant="h6"
                    fontWeight={600}
                    sx={{
                      color: getStatusColor(invoiceData.paymentStatus),
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                    }}
                  >
                    {getPaymentMethodIcon(
                      invoiceData.paymentDetails?.paymentMethod
                    )}
                    Payment Details -{" "}
                    {PAYMENT_STATUS_DISPLAY[invoiceData.paymentStatus]}
                  </Typography>
                  
                  {/* NEW: Record Payment Button */}
                  {canRecordPayment && onRecordPayment && showActions && (
                    <Button
                      variant="contained"
                      color="primary"
                      size="small"
                      startIcon={<RecordPaymentIcon />}
                      onClick={() => onRecordPayment(invoiceData)}
                      className="no-print"
                      sx={{ ml: 2 }}
                    >
                      Record Payment
                    </Button>
                  )}
                </Box>

                {/* NEW: PENDING Payment Details */}
                {invoiceData.paymentStatus === PAYMENT_STATUS.PENDING && (
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <InfoItem
                        label="Payment Method"
                        value={
                          PAYMENT_METHOD_DISPLAY[invoiceData.paymentDetails?.paymentMethod] ||
                          invoiceData.paymentDetails?.paymentMethod ||
                          "Not specified"
                        }
                      />
                    </Grid>
                    {invoiceData.paymentDetails?.paymentReference && (
                      <Grid item xs={12} sm={6}>
                        <InfoItem
                          label="Payment Reference"
                          value={invoiceData.paymentDetails.paymentReference}
                        />
                      </Grid>
                    )}
                    {invoiceData.paymentDetails?.downPayment > 0 && (
                      <>
                        <Grid item xs={12} sm={6}>
                          <InfoItem
                            label="Amount Paid"
                            value={formatCurrency(
                              invoiceData.paymentDetails?.downPayment || 0
                            )}
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <InfoItem
                            label="Remaining Balance"
                            value={formatCurrency(
                              invoiceData.paymentDetails?.remainingBalance || 0
                            )}
                          />
                        </Grid>
                      </>
                    )}
                  </Grid>
                )}

                {/* Finance Payment Details */}
                {invoiceData.paymentStatus === PAYMENT_STATUS.FINANCE && (
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <InfoItem
                        icon={<BankIcon fontSize="small" />}
                        label="Finance Company"
                        value={
                          invoiceData.paymentDetails?.financeCompany ||
                          "Not specified"
                        }
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <InfoItem
                        label="Payment Reference"
                        value={
                          invoiceData.paymentDetails?.paymentReference ||
                          "Not provided"
                        }
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <InfoItem
                        label="Down Payment"
                        value={formatCurrency(
                          invoiceData.paymentDetails?.downPayment || 0
                        )}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <InfoItem
                        label="Remaining (Finance)"
                        value={formatCurrency(
                          invoiceData.paymentDetails?.remainingBalance || 0
                        )}
                      />
                    </Grid>
                  </Grid>
                )}

                {/* Bank Transfer Payment Details */}
                {invoiceData.paymentStatus === PAYMENT_STATUS.BANK_TRANSFER && (
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <InfoItem
                        icon={<BankIcon fontSize="small" />}
                        label="Bank Name"
                        value={
                          invoiceData.paymentDetails?.bankName ||
                          "Not specified"
                        }
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <InfoItem
                        label="Payment Reference"
                        value={
                          invoiceData.paymentDetails?.paymentReference ||
                          "Not provided"
                        }
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <InfoItem
                        label="Down Payment"
                        value={formatCurrency(
                          invoiceData.paymentDetails?.downPayment || 0
                        )}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <InfoItem
                        label="Remaining (Transfer)"
                        value={formatCurrency(
                          invoiceData.paymentDetails?.remainingBalance || 0
                        )}
                      />
                    </Grid>
                  </Grid>
                )}

                {/* EMI Payment Details */}
                {invoiceData.paymentStatus === PAYMENT_STATUS.EMI &&
                  invoiceData.emiDetails && (
                    <Grid container spacing={2}>
                      {/* Show down payment if exists */}
                      {invoiceData.emiDetails.downPayment > 0 && (
                        <>
                          <Grid item xs={12} sm={6}>
                            <InfoItem
                              label="Down Payment"
                              value={formatCurrency(
                                invoiceData.emiDetails.downPayment || 0
                              )}
                            />
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <InfoItem
                              label="EMI Amount"
                              value={formatCurrency(
                                invoiceData.emiDetails.emiAmount ||
                                  invoiceData.grandTotal
                              )}
                            />
                          </Grid>
                        </>
                      )}

                      <Grid item xs={12} sm={6}>
                        <InfoItem
                          label="Monthly EMI"
                          value={formatCurrency(
                            invoiceData.emiDetails.monthlyAmount
                          )}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <InfoItem
                          label="Start Date"
                          value={formatDate(invoiceData.emiDetails.startDate)}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <InfoItem
                          label="Installments"
                          value={`${invoiceData.emiDetails.numberOfInstallments} months`}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <InfoItem
                          label="Total Invoice"
                          value={formatCurrency(invoiceData.grandTotal || 0)}
                        />
                      </Grid>
                    </Grid>
                  )}

                {/* Payment Breakdown for Partial Payments */}
                {isPartialPayment && (
                  <Box
                    sx={{
                      mt: 2,
                      p: 2,
                      backgroundColor: alpha(
                        getStatusColor(invoiceData.paymentStatus),
                        0.03
                      ),
                      borderRadius: 1,
                      border: `1px solid ${alpha(
                        getStatusColor(invoiceData.paymentStatus),
                        0.1
                      )}`,
                    }}
                  >
                    <Typography
                      variant="subtitle2"
                      color="text.secondary"
                      gutterBottom
                    >
                      Payment Breakdown:
                    </Typography>

                    <Stack spacing={0.5}>
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                        }}
                      >
                        <Typography variant="body2" color="text.secondary">
                          Amount Paid:
                        </Typography>
                        <Typography
                          variant="body2"
                          fontWeight={500}
                          color="success.main"
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
                        <Typography variant="body2" color="text.secondary">
                          Remaining Balance:
                        </Typography>
                        <Typography
                          variant="body2"
                          fontWeight={500}
                          color="warning.main"
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
                        <Typography variant="body2" fontWeight={600}>
                          Total Invoice:
                        </Typography>
                        <Typography
                          variant="body2"
                          fontWeight={600}
                          color="primary.main"
                        >
                          {formatCurrency(invoiceData.grandTotal || 0)}
                        </Typography>
                      </Box>
                    </Stack>
                  </Box>
                )}
              </Paper>
            )}

            {/* Remarks Section */}
            {invoiceData.remarks && (
              <Paper
                elevation={0}
                sx={{
                  mb: 4,
                  p: 3,
                  backgroundColor: alpha(theme.palette.info.main, 0.05),
                  border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
                  borderRadius: 2,
                }}
              >
                <Typography
                  variant="h6"
                  fontWeight={600}
                  gutterBottom
                  sx={{
                    color: theme.palette.info.main,
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                  }}
                >
                  <InfoIcon />
                  Remarks
                </Typography>
                <Typography variant="body1" sx={{ whiteSpace: "pre-wrap" }}>
                  {invoiceData.remarks}
                </Typography>
              </Paper>
            )}

            {/* Delivery Details */}
            {invoiceData.deliveryStatus === DELIVERY_STATUS.SCHEDULED &&
              invoiceData.scheduledDeliveryDate && (
                <Paper
                  elevation={0}
                  sx={{
                    mb: 4,
                    p: 3,
                    backgroundColor: alpha(theme.palette.success.main, 0.05),
                    border: `1px solid ${alpha(
                      theme.palette.success.main,
                      0.2
                    )}`,
                    borderRadius: 2,
                  }}
                >
                  <Typography
                    variant="h6"
                    fontWeight={600}
                    gutterBottom
                    sx={{ color: theme.palette.success.main }}
                  >
                    Delivery Information
                  </Typography>
                  <InfoItem
                    icon={<CalendarIcon fontSize="small" />}
                    label="Scheduled Delivery"
                    value={formatDate(invoiceData.scheduledDeliveryDate)}
                  />
                </Paper>
              )}

            {/* Footer */}
            <Box
              sx={{
                mt: 6,
                pt: 3,
                borderTop: `2px solid ${theme.palette.divider}`,
                textAlign: "center",
              }}
            >
              <Typography
                variant="h6"
                fontWeight={600}
                gutterBottom
                sx={{ color: themeColors.primary }}
              >
                Thank you for your business!
              </Typography>

              <Grid container spacing={2} sx={{ mt: 2 }}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    For any queries, contact us at {companyDetails.phone}
                  </Typography>
                  {companyDetails.website && (
                    <Typography variant="body2" color="text.secondary">
                      Visit: {companyDetails.website}
                    </Typography>
                  )}
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Generated on {formatDate(new Date())}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Powered by Business Manager System
                  </Typography>
                </Grid>
              </Grid>

              {/* NEW - Invoice Type Footer Note */}
              <Box
                sx={{
                  mt: 2,
                  pt: 2,
                  borderTop: `1px solid ${theme.palette.divider}`,
                }}
              >
                <Typography
                  variant="caption"
                  color="text.secondary"
                  fontStyle="italic"
                >
                  This is a {invoiceData.includeGST ? "GST" : "Non-GST"} invoice
                  {invoiceData.customerGSTNumber &&
                    " for GST registered customer"}
                  {invoiceData.includeGST &&
                    invoiceData.customerState &&
                    ` • ${
                      invoiceData.customerState?.toLowerCase() === "gujarat"
                        ? "Intra-State"
                        : "Inter-State"
                    } Transaction`}
                </Typography>
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