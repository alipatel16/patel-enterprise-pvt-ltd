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
 * PaymentDeliveryOptions Component
 * Handles payment and delivery options for invoice forms
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

          <FormControl fullWidth sx={{ mb: 2 }}>
            <TextField
              select
              label="Payment Status"
              value={formData.paymentStatus}
              onChange={onPaymentStatusChange}
              disabled={loading}
            >
              <MenuItem value={PAYMENT_STATUS.PAID}>
                {PAYMENT_STATUS_DISPLAY[PAYMENT_STATUS.PAID]}
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
              <MenuItem value={PAYMENT_STATUS.PENDING}>
                {PAYMENT_STATUS_DISPLAY[PAYMENT_STATUS.PENDING]}
              </MenuItem>
              <MenuItem value={PAYMENT_STATUS.CREDIT_CARD}>
                {PAYMENT_STATUS_DISPLAY[PAYMENT_STATUS.CREDIT_CARD]}
              </MenuItem>
            </TextField>
          </FormControl>

          {currentPaymentCategory && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Payment Category:
              </Typography>
              <Chip
                label={currentPaymentCategory.replace(/_/g, " ").toUpperCase()}
                size="small"
                color="primary"
                variant="outlined"
              />
            </Box>
          )}

          {/* PAID Status */}
          {formData.paymentStatus === PAYMENT_STATUS.PAID && (
            <Box>
              <Alert severity="info" sx={{ mb: 2 }}>
                <Typography variant="body2">
                  Select payment method for full payment
                </Typography>
              </Alert>

              <TextField
                fullWidth
                select
                label="Payment Method"
                value={formData.paymentDetails.paymentMethod}
                onChange={onPaymentDetailsChange("paymentMethod")}
                disabled={loading}
                sx={{ mb: 2 }}
                SelectProps={{
                  native: true,
                }}
              >
                <option value={PAYMENT_METHODS.CASH}>
                  {PAYMENT_METHOD_DISPLAY[PAYMENT_METHODS.CASH]}
                </option>
                <option value={PAYMENT_METHODS.CARD}>
                  {PAYMENT_METHOD_DISPLAY[PAYMENT_METHODS.CARD]}
                </option>
                <option value={PAYMENT_METHODS.CREDIT_CARD}>
                  {PAYMENT_METHOD_DISPLAY[PAYMENT_METHODS.CREDIT_CARD]}
                </option>
                <option value={PAYMENT_METHODS.UPI}>
                  {PAYMENT_METHOD_DISPLAY[PAYMENT_METHODS.UPI]}
                </option>
                <option value={PAYMENT_METHODS.NET_BANKING}>
                  {PAYMENT_METHOD_DISPLAY[PAYMENT_METHODS.NET_BANKING]}
                </option>
                <option value={PAYMENT_METHODS.CHEQUE}>
                  {PAYMENT_METHOD_DISPLAY[PAYMENT_METHODS.CHEQUE]}
                </option>
                <option value={PAYMENT_METHODS.BANK_TRANSFER}>
                  {PAYMENT_METHOD_DISPLAY[PAYMENT_METHODS.BANK_TRANSFER]}
                </option>
              </TextField>

              <Box
                sx={{
                  mt: 2,
                  p: 2,
                  backgroundColor: "rgba(76, 175, 80, 0.1)",
                  borderRadius: 1,
                  border: "1px solid rgba(76, 175, 80, 0.2)",
                }}
              >
                <Typography
                  variant="subtitle2"
                  color="success.main"
                  gutterBottom
                >
                  Full Payment -{" "}
                  {
                    PAYMENT_METHOD_DISPLAY[
                      formData.paymentDetails.paymentMethod
                    ]
                  }
                </Typography>
                <Box display="flex" alignItems="center" gap={1}>
                  {formData.paymentDetails.paymentMethod ===
                    PAYMENT_METHODS.CREDIT_CARD && (
                    <CreditCardIcon color="success" />
                  )}
                  {formData.paymentDetails.paymentMethod ===
                    PAYMENT_METHODS.CASH && <MoneyIcon color="success" />}
                  <Typography variant="body2" fontWeight={600}>
                    Amount: ₹{calculations.grandTotal.toFixed(2)}
                  </Typography>
                </Box>
              </Box>
            </Box>
          )}

          {/* Finance Payment Details */}
          {formData.paymentStatus === PAYMENT_STATUS.FINANCE && (
            <Box>
              <Alert severity="info" sx={{ mb: 2 }}>
                <Typography variant="body2">
                  Configure finance payment with down payment amount
                </Typography>
              </Alert>

              <TextField
                fullWidth
                label="Finance Company"
                placeholder="e.g., ICICI Bank, HDFC Bank"
                value={formData.paymentDetails.financeCompany}
                onChange={onPaymentDetailsChange("financeCompany")}
                error={!!formErrors.financeCompany}
                helperText={formErrors.financeCompany}
                disabled={loading}
                sx={{ mb: 2 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <BankIcon />
                    </InputAdornment>
                  ),
                }}
              />

              <TextField
                fullWidth
                label="Down Payment Amount"
                type="number"
                value={formData.paymentDetails.downPayment}
                onChange={onPaymentDetailsChange("downPayment")}
                error={!!formErrors.downPayment}
                helperText={
                  formErrors.downPayment ||
                  `Remaining: ₹${formData.paymentDetails.remainingBalance.toFixed(
                    2
                  )}`
                }
                disabled={loading || isEdit}
                sx={{ mb: 2 }}
                inputProps={{
                  min: 0,
                  max: calculations.grandTotal,
                  step: 0.01,
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">₹</InputAdornment>
                  ),
                }}
              />

              <TextField
                fullWidth
                label="Payment Reference"
                placeholder="Finance application number or reference"
                value={formData.paymentDetails.paymentReference}
                onChange={onPaymentDetailsChange("paymentReference")}
                disabled={loading}
                sx={{ mb: 2 }}
              />

              <Box
                sx={{
                  mt: 2,
                  p: 2,
                  backgroundColor: "rgba(76, 175, 80, 0.1)",
                  borderRadius: 1,
                  border: "1px solid rgba(76, 175, 80, 0.2)",
                }}
              >
                <Typography
                  variant="subtitle2"
                  color="success.main"
                  gutterBottom
                >
                  Finance Payment Breakdown:
                </Typography>
                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography variant="body2">Down Payment:</Typography>
                  <Typography variant="body2" fontWeight={600}>
                    ₹
                    {parseFloat(
                      formData.paymentDetails.downPayment || 0
                    ).toFixed(2)}
                  </Typography>
                </Box>
                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography variant="body2">Remaining (Finance):</Typography>
                  <Typography variant="body2" fontWeight={600}>
                    ₹{formData.paymentDetails.remainingBalance.toFixed(2)}
                  </Typography>
                </Box>
                <Divider sx={{ my: 1 }} />
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2" fontWeight={600}>
                    Total:
                  </Typography>
                  <Typography variant="body2" fontWeight={600}>
                    ₹{calculations.grandTotal.toFixed(2)}
                  </Typography>
                </Box>
              </Box>
            </Box>
          )}

          {/* Bank Transfer Payment Details */}
          {formData.paymentStatus === PAYMENT_STATUS.BANK_TRANSFER && (
            <Box>
              <Alert severity="info" sx={{ mb: 2 }}>
                <Typography variant="body2">
                  Configure bank transfer payment with down payment amount
                </Typography>
              </Alert>

              <TextField
                fullWidth
                label="Bank Name"
                placeholder="e.g., State Bank of India, ICICI Bank"
                value={formData.paymentDetails.bankName}
                onChange={onPaymentDetailsChange("bankName")}
                error={!!formErrors.bankName}
                helperText={formErrors.bankName}
                disabled={loading}
                sx={{ mb: 2 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <BankIcon />
                    </InputAdornment>
                  ),
                }}
              />

              <TextField
                fullWidth
                label="Down Payment Amount"
                type="number"
                value={formData.paymentDetails.downPayment}
                onChange={onPaymentDetailsChange("downPayment")}
                error={!!formErrors.downPayment}
                helperText={
                  formErrors.downPayment ||
                  `Remaining: ₹${formData.paymentDetails.remainingBalance.toFixed(
                    2
                  )}`
                }
                disabled={loading || isEdit}
                sx={{ mb: 2 }}
                inputProps={{
                  min: 0,
                  max: calculations.grandTotal,
                  step: 0.01,
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">₹</InputAdornment>
                  ),
                }}
              />

              <TextField
                fullWidth
                label="Payment Reference"
                placeholder="Transaction ID or reference number"
                value={formData.paymentDetails.paymentReference}
                onChange={onPaymentDetailsChange("paymentReference")}
                disabled={loading}
                sx={{ mb: 2 }}
              />

              <Box
                sx={{
                  mt: 2,
                  p: 2,
                  backgroundColor: "rgba(33, 150, 243, 0.1)",
                  borderRadius: 1,
                  border: "1px solid rgba(33, 150, 243, 0.2)",
                }}
              >
                <Typography
                  variant="subtitle2"
                  color="primary.main"
                  gutterBottom
                >
                  Bank Transfer Payment Breakdown:
                </Typography>
                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography variant="body2">Down Payment:</Typography>
                  <Typography variant="body2" fontWeight={600}>
                    ₹
                    {parseFloat(
                      formData.paymentDetails.downPayment || 0
                    ).toFixed(2)}
                  </Typography>
                </Box>
                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography variant="body2">Remaining (Transfer):</Typography>
                  <Typography variant="body2" fontWeight={600}>
                    ₹{formData.paymentDetails.remainingBalance.toFixed(2)}
                  </Typography>
                </Box>
                <Divider sx={{ my: 1 }} />
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2" fontWeight={600}>
                    Total:
                  </Typography>
                  <Typography variant="body2" fontWeight={600}>
                    ₹{calculations.grandTotal.toFixed(2)}
                  </Typography>
                </Box>
              </Box>
            </Box>
          )}

          {/* EMI Details */}
          {formData.paymentStatus === PAYMENT_STATUS.EMI && (
            <Box>
              {/* NEW: Down Payment Option for EMI */}
              <Alert severity="info" sx={{ mb: 2 }}>
                <Typography variant="body2">
                  Configure EMI payment. You can optionally set a down payment
                  amount.
                </Typography>
              </Alert>

              <TextField
                fullWidth
                label="Down Payment (Optional)"
                type="number"
                value={formData.paymentDetails?.downPayment || 0}
                onChange={onPaymentDetailsChange("downPayment")}
                error={!!formErrors.downPayment}
                helperText={
                  formErrors.downPayment ||
                  `EMI will be calculated on remaining amount after down payment`
                }
                disabled={loading || isEdit}
                sx={{ mb: 2 }}
                inputProps={{
                  min: 0,
                  max: calculations.grandTotal,
                  step: 0.01,
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">₹</InputAdornment>
                  ),
                }}
              />

              <TextField
                fullWidth
                label="Monthly EMI Amount"
                type="number"
                value={formData.emiDetails.monthlyAmount}
                onChange={onEMIChange("monthlyAmount")}
                error={!!formErrors.emiAmount}
                helperText={formErrors.emiAmount}
                disabled={loading|| isEdit}
                sx={{ mb: 2 }}
                inputProps={{ min: 1, step: 0.01 }}
              />

              <DatePicker
                label="EMI Start Date"
                format="dd/MM/yyyy"
                value={formData.emiDetails.startDate}
                onChange={onEMIStartDateChange}
                disabled={loading || isEdit}
                sx={{ mb: 2 }}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    error: !!formErrors.emiStartDate,
                    helperText: formErrors.emiStartDate,
                  },
                }}
              />

              {formData.emiDetails.monthlyAmount > 0 &&
                calculations.grandTotal > 0 && (
                  <Box
                    sx={{
                      mt: 2,
                      p: 2,
                      backgroundColor: "rgba(25, 118, 210, 0.1)",
                      borderRadius: 1,
                      border: "1px solid rgba(25, 118, 210, 0.2)",
                    }}
                  >
                    <Typography
                      variant="subtitle2"
                      color="primary"
                      gutterBottom
                    >
                      EMI Calculation Summary:
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      <strong>Invoice Total:</strong> ₹
                      {calculations.grandTotal.toFixed(2)}
                    </Typography>

                    {formData.paymentDetails?.downPayment > 0 && (
                      <>
                        <Typography variant="body2" sx={{ mb: 1 }}>
                          <strong>Down Payment:</strong> ₹
                          {parseFloat(
                            formData.paymentDetails.downPayment
                          ).toFixed(2)}
                        </Typography>
                        <Typography variant="body2" sx={{ mb: 1 }}>
                          <strong>EMI Amount (After Down Payment):</strong> ₹
                          {(
                            calculations.grandTotal -
                            parseFloat(formData.paymentDetails.downPayment || 0)
                          ).toFixed(2)}
                        </Typography>
                      </>
                    )}

                    <Typography variant="body2" sx={{ mb: 1 }}>
                      <strong>Monthly EMI:</strong> ₹
                      {parseFloat(formData.emiDetails.monthlyAmount).toFixed(2)}
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      <strong>Number of Installments:</strong>{" "}
                      {formData.emiDetails.numberOfInstallments} months
                    </Typography>

                    {(() => {
                      const monthlyAmount = parseFloat(
                        formData.emiDetails.monthlyAmount
                      );
                      const numberOfInstallments =
                        formData.emiDetails.numberOfInstallments;
                      const totalAmount =
                        calculations.grandTotal -
                        parseFloat(formData.paymentDetails?.downPayment || 0);

                      if (numberOfInstallments > 1) {
                        const regularInstallments = numberOfInstallments - 1;
                        const regularInstallmentTotal =
                          monthlyAmount * regularInstallments;
                        const lastInstallmentAmount =
                          totalAmount - regularInstallmentTotal;

                        return (
                          <>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              sx={{ display: "block", mb: 1 }}
                            >
                              • First {regularInstallments} installments: ₹
                              {monthlyAmount.toFixed(2)} each = ₹
                              {regularInstallmentTotal.toFixed(2)}
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              sx={{ display: "block", mb: 1 }}
                            >
                              • Last installment: ₹
                              {lastInstallmentAmount.toFixed(2)}
                            </Typography>
                          </>
                        );
                      }
                      return null;
                    })()}

                    <Typography
                      variant="body2"
                      color="success.main"
                      fontWeight={600}
                    >
                      <strong>Total EMI Amount:</strong> ₹
                      {(
                        calculations.grandTotal -
                        parseFloat(formData.paymentDetails?.downPayment || 0)
                      ).toFixed(2)}
                    </Typography>

                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ display: "block", mt: 1, fontStyle: "italic" }}
                    >
                      Note: Last installment amount is adjusted to match invoice
                      total
                    </Typography>
                  </Box>
                )}
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Delivery Options */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Delivery Options
          </Typography>

          <FormControl fullWidth sx={{ mb: 2 }}>
            <TextField
              select
              label="Delivery Status"
              value={formData.deliveryStatus}
              onChange={onDeliveryChange}
              disabled={loading}
            >
              <MenuItem value={DELIVERY_STATUS.DELIVERED}>Delivered</MenuItem>
              <MenuItem value={DELIVERY_STATUS.SCHEDULED}>
                Schedule Later
              </MenuItem>
              <MenuItem value={DELIVERY_STATUS.PENDING}>Pending</MenuItem>
            </TextField>
          </FormControl>

          {formData.deliveryStatus === DELIVERY_STATUS.SCHEDULED && (
            <DatePicker
              label="Scheduled Delivery Date"
              format="dd/MM/yyyy"
              value={formData.scheduledDeliveryDate}
              onChange={onDeliveryDateChange}
              disabled={loading}
              slotProps={{
                textField: {
                  fullWidth: true,
                  error: !!formErrors.deliveryDate,
                  helperText: formErrors.deliveryDate,
                },
              }}
            />
          )}
        </CardContent>
      </Card>
    </>
  );
};

export default PaymentDeliveryOptions;
