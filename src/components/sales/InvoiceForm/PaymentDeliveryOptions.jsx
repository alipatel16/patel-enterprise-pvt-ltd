// src/components/sales/InvoiceForm/PaymentDeliveryOptions.jsx
// COMPLETE UPDATED VERSION - Now fully editable in edit mode

import React from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  FormControl,
  MenuItem,
  Alert,
  Divider,
  Chip,
  InputAdornment,
} from "@mui/material";
import {
  Payment as PaymentIcon,
  AccountBalance as BankIcon,
  AttachMoney as MoneyIcon,
  CreditCard as CreditCardIcon,
  Warning as WarningIcon,
} from "@mui/icons-material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";

import {
  PAYMENT_STATUS,
  PAYMENT_STATUS_DISPLAY,
  PAYMENT_METHODS,
  PAYMENT_METHOD_DISPLAY,
  DELIVERY_STATUS,
  getPaymentCategory,
} from "../../../utils/constants/appConstants";

/**
 * PaymentDeliveryOptions Component - FULLY EDITABLE VERSION
 * ✅ Allows payment status changes in edit mode
 * ✅ Allows all payment details editing
 * ✅ Shows warnings when changing from PAID/EMI to PENDING
 * ✅ Works seamlessly with enhanced salesService
 */
const PaymentDeliveryOptions = ({
  formData,
  formErrors,
  calculations,
  loading,
  onPaymentStatusChange,
  onPaymentDetailsChange,
  onEMIChange,
  onEMIStartDateChange,
  onDeliveryChange,
  onDeliveryDateChange,
  isEdit = false,
}) => {
  const currentPaymentCategory = getPaymentCategory(
    formData.paymentStatus,
    formData.paymentDetails.paymentMethod
  );

  // CRITICAL: Use netPayable for all payment calculations (accounts for exchange)
  const basePaymentAmount = calculations.netPayable || calculations.grandTotal;

  // Check if user is changing FROM a paid status TO pending (show warning)
  const isChangingToPending = isEdit && 
    formData.paymentStatus === PAYMENT_STATUS.PENDING &&
    formData.originalPaymentStatus &&
    [PAYMENT_STATUS.PAID, PAYMENT_STATUS.EMI, PAYMENT_STATUS.FINANCE, PAYMENT_STATUS.BANK_TRANSFER]
      .includes(formData.originalPaymentStatus);

  return (
    <>
      {/* Payment Options */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography
            variant="h6"
            gutterBottom
            sx={{ display: "flex", alignItems: "center", gap: 1 }}
          >
            <PaymentIcon />
            Payment Options
          </Typography>

          {/* ⚠️ WARNING: Show when changing to PENDING from paid status */}
          {isChangingToPending && (
            <Alert severity="warning" icon={<WarningIcon />} sx={{ mb: 2 }}>
              <Typography variant="body2" fontWeight="bold">
                Payment Status Change Warning
              </Typography>
              <Typography variant="body2">
                Changing from {PAYMENT_STATUS_DISPLAY[formData.originalPaymentStatus]} to Pending 
                will automatically clear all payment history and reset balances. This action will be 
                logged in the audit trail.
              </Typography>
            </Alert>
          )}

          {/* ✅ PAYMENT STATUS - ALWAYS EDITABLE */}
          <FormControl fullWidth sx={{ mb: 2 }}>
            <TextField
              select
              label="Payment Status"
              value={formData.paymentStatus}
              onChange={onPaymentStatusChange}
              disabled={loading}  // ✅ Removed isEdit from disabled condition
              error={!!formErrors.paymentStatus}
              helperText={
                formErrors.paymentStatus ||
                (isEdit 
                  ? "You can change payment status - changes will be tracked" 
                  : "Select how the customer will pay")
              }
            >
              <MenuItem value={PAYMENT_STATUS.PAID}>
                {PAYMENT_STATUS_DISPLAY[PAYMENT_STATUS.PAID]}
              </MenuItem>
              <MenuItem value={PAYMENT_STATUS.PENDING}>
                {PAYMENT_STATUS_DISPLAY[PAYMENT_STATUS.PENDING]}
              </MenuItem>
              <MenuItem value={PAYMENT_STATUS.EMI}>
                {PAYMENT_STATUS_DISPLAY[PAYMENT_STATUS.EMI]}
              </MenuItem>
              <MenuItem value={PAYMENT_STATUS.FINANCE}>
                {PAYMENT_STATUS_DISPLAY[PAYMENT_STATUS.FINANCE]}
              </MenuItem>
              <MenuItem value={PAYMENT_STATUS.BANK_TRANSFER}>
                {PAYMENT_STATUS_DISPLAY[PAYMENT_STATUS.BANK_TRANSFER]}
              </MenuItem>
            </TextField>
          </FormControl>

          <Divider sx={{ my: 2 }} />

          {/* Payment Method */}
          <FormControl fullWidth sx={{ mb: 2 }}>
            <TextField
              select
              label="Payment Method"
              value={formData.paymentDetails.paymentMethod}
              onChange={onPaymentDetailsChange("paymentMethod")}
              disabled={loading}  // ✅ Editable in edit mode
              helperText={isEdit ? "You can change payment method" : "Select payment method"}
            >
              {Object.entries(PAYMENT_METHOD_DISPLAY).map(([value, label]) => (
                <MenuItem key={value} value={value}>
                  {label}
                </MenuItem>
              ))}
            </TextField>
          </FormControl>

          {/* PAID IN FULL - Show info */}
          {formData.paymentStatus === PAYMENT_STATUS.PAID && (
            <Alert severity="success" icon={<MoneyIcon />} sx={{ mb: 2 }}>
              <Typography variant="body2">
                <strong>Paid in Full:</strong> Complete payment of ₹
                {basePaymentAmount.toFixed(2)} received.
                {isEdit && " You can change this if needed."}
              </Typography>
            </Alert>
          )}

          {/* PENDING - Show balance */}
          {formData.paymentStatus === PAYMENT_STATUS.PENDING && (
            <Alert severity="info" icon={<WarningIcon />}>
              <Typography variant="body2">
                <strong>Pending Payment:</strong> Amount to be collected: ₹
                {basePaymentAmount.toFixed(2)}
              </Typography>
            </Alert>
          )}

          {/* FINANCE/BANK TRANSFER - Down payment option */}
          {(formData.paymentStatus === PAYMENT_STATUS.FINANCE ||
            formData.paymentStatus === PAYMENT_STATUS.BANK_TRANSFER) && (
            <>
              <Alert severity="info" icon={<BankIcon />} sx={{ mb: 2 }}>
                <Typography variant="body2">
                  {formData.paymentStatus === PAYMENT_STATUS.FINANCE
                    ? "Finance payment selected. You can record a down payment."
                    : "Bank transfer selected. You can record an advance payment."}
                </Typography>
              </Alert>

              {/* ✅ DOWN PAYMENT - EDITABLE */}
              <TextField
                fullWidth
                label="Down Payment (Optional)"
                type="number"
                value={formData.paymentDetails?.downPayment || 0}
                onChange={onPaymentDetailsChange("downPayment")}
                error={!!formErrors.downPayment}
                helperText={
                  formErrors.downPayment ||
                  `Optional down payment. Max: ₹${basePaymentAmount.toFixed(2)}`
                }
                disabled={loading}  // ✅ Editable in edit mode
                sx={{ mb: 2 }}
                inputProps={{
                  min: 0,
                  max: basePaymentAmount,
                  step: 0.01,
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">₹</InputAdornment>
                  ),
                }}
              />

              {/* Finance Company / Bank Name */}
              {formData.paymentStatus === PAYMENT_STATUS.FINANCE && (
                <TextField
                  fullWidth
                  label="Finance Company Name"
                  value={formData.paymentDetails?.financeCompany || ""}
                  onChange={onPaymentDetailsChange("financeCompany")}
                  disabled={loading}  // ✅ Editable
                  sx={{ mb: 2 }}
                  helperText="Name of the finance company"
                />
              )}

              {formData.paymentStatus === PAYMENT_STATUS.BANK_TRANSFER && (
                <TextField
                  fullWidth
                  label="Bank Name"
                  value={formData.paymentDetails?.bankName || ""}
                  onChange={onPaymentDetailsChange("bankName")}
                  disabled={loading}  // ✅ Editable
                  sx={{ mb: 2 }}
                  helperText="Customer's bank name"
                />
              )}

              <TextField
                fullWidth
                label="Payment Reference"
                value={formData.paymentDetails?.paymentReference || ""}
                onChange={onPaymentDetailsChange("paymentReference")}
                disabled={loading}  // ✅ Editable
                helperText="Transaction ID or reference number"
              />
            </>
          )}

          {/* EMI - Full details with edit capability */}
          {formData.paymentStatus === PAYMENT_STATUS.EMI && (
            <>
              <Alert severity="info" icon={<CreditCardIcon />} sx={{ mb: 2 }}>
                <Typography variant="body2">
                  <strong>EMI Payment Plan:</strong>
                  {isEdit 
                    ? " You can modify EMI details. Paid installments will be preserved automatically."
                    : " Set up monthly installment plan. You can optionally set a down payment."}
                </Typography>
              </Alert>

              {/* ✅ DOWN PAYMENT - EDITABLE IN EDIT MODE */}
              <TextField
                fullWidth
                label="Down Payment (Optional)"
                type="number"
                value={formData.paymentDetails?.downPayment || 0}
                onChange={onPaymentDetailsChange("downPayment")}
                error={!!formErrors.downPayment}
                helperText={
                  formErrors.downPayment ||
                  (isEdit
                    ? `Change down payment - EMI will recalculate automatically. Max: ₹${basePaymentAmount.toFixed(2)}`
                    : `EMI will be calculated on remaining amount after down payment. Max: ₹${basePaymentAmount.toFixed(2)}`)
                }
                disabled={loading}  // ✅ Editable in edit mode!
                sx={{ mb: 2 }}
                inputProps={{
                  min: 0,
                  max: basePaymentAmount,
                  step: 0.01,
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">₹</InputAdornment>
                  ),
                }}
              />

              {/* ✅ MONTHLY EMI - EDITABLE (with warning in edit mode) */}
              <TextField
                fullWidth
                label="Monthly EMI Amount"
                type="number"
                value={formData.emiDetails.monthlyAmount}
                onChange={onEMIChange("monthlyAmount")}
                error={!!formErrors.emiAmount}
                helperText={
                  formErrors.emiAmount ||
                  (isEdit
                    ? "⚠️ Changing monthly amount will recalculate all unpaid installments"
                    : "Enter the monthly installment amount")
                }
                disabled={loading}  // ✅ Editable in edit mode!
                sx={{ mb: 2 }}
                inputProps={{ min: 1, step: 0.01 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">₹</InputAdornment>
                  ),
                }}
              />

              {/* ✅ START DATE - EDITABLE */}
              <DatePicker
                label="EMI Start Date"
                format="dd/MM/yyyy"
                value={formData.emiDetails.startDate}
                onChange={onEMIStartDateChange}
                disabled={loading}  // ✅ Editable in edit mode
                sx={{ mb: 2 }}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    error: !!formErrors.emiStartDate,
                    helperText: formErrors.emiStartDate || 
                      (isEdit ? "Change start date if needed" : "Select when EMI payments start"),
                  },
                }}
              />

              {/* Show calculated number of installments */}
              {formData.emiDetails.numberOfInstallments > 0 && (
                <Alert severity="info" sx={{ mt: 2 }}>
                  <Typography variant="body2">
                    <strong>Installments:</strong>{" "}
                    {formData.emiDetails.numberOfInstallments} months
                    {isEdit && formData.emiDetails.schedule?.filter(e => e.paid).length > 0 && (
                      <>
                        <br />
                        <strong>Paid:</strong> {formData.emiDetails.schedule.filter(e => e.paid).length} installments 
                        (will be preserved)
                      </>
                    )}
                  </Typography>
                </Alert>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Delivery Options - Always editable */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography
            variant="h6"
            gutterBottom
            sx={{ display: "flex", alignItems: "center", gap: 1 }}
          >
            <BankIcon />
            Delivery Options
          </Typography>

          {/* ✅ DELIVERY STATUS - EDITABLE */}
          <FormControl fullWidth sx={{ mb: 2 }}>
            <TextField
              select
              label="Delivery Status"
              value={formData.deliveryStatus}
              onChange={onDeliveryChange}
              disabled={loading}  // ✅ Editable in edit mode
              helperText={isEdit ? "You can change delivery status" : "Select delivery status"}
            >
              <MenuItem value={DELIVERY_STATUS.DELIVERED}>
                Delivered
              </MenuItem>
              <MenuItem value={DELIVERY_STATUS.SCHEDULED}>
                Scheduled
              </MenuItem>
              <MenuItem value={DELIVERY_STATUS.PENDING}>
                Pending
              </MenuItem>
            </TextField>
          </FormControl>

          {/* Scheduled Delivery Date - Editable */}
          {formData.deliveryStatus === DELIVERY_STATUS.SCHEDULED && (
            <>
              <Alert severity="info" sx={{ mb: 2 }}>
                <Typography variant="body2">
                  Delivery scheduled - please select date
                </Typography>
              </Alert>

              <DatePicker
                label="Scheduled Delivery Date"
                format="dd/MM/yyyy"
                value={formData.scheduledDeliveryDate}
                onChange={onDeliveryDateChange}
                disabled={loading}  // ✅ Editable
                slotProps={{
                  textField: {
                    fullWidth: true,
                    error: !!formErrors.deliveryDate,
                    helperText: formErrors.deliveryDate,
                  },
                }}
              />
            </>
          )}
        </CardContent>
      </Card>
    </>
  );
};

export default PaymentDeliveryOptions;