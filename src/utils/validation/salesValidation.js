/**
 * Sales Validation
 * Validation functions for sales, invoices, and related forms
 */

import {
  validateRequired,
  validateEmail,
  validatePhone,
  validateNumeric,
  validateAmount,
  validateDate,
  validateStringLength,
  validateFormData
} from '../helpers/validationHelpers';

import {
  PAYMENT_STATUS,
  DELIVERY_STATUS,
  PAYMENT_METHODS,
  EMI_CONFIG,
  VALIDATION_MESSAGES
} from '../constants';

/**
 * Validate invoice form data
 * @param {Object} invoiceData - Invoice form data
 * @returns {Object} Validation result
 */
export const validateInvoiceForm = (invoiceData) => {
  const errors = {};
  let isValid = true;

  // Customer validation
  if (!invoiceData.customerId || !invoiceData.customerName) {
    errors.customer = 'Customer is required';
    isValid = false;
  }

  // Sales person validation
  if (!invoiceData.salesPersonId) {
    errors.salesPerson = 'Sales person is required';
    isValid = false;
  }

  // Invoice date validation
  const dateValidation = validateDate(invoiceData.date, true, true);
  if (!dateValidation.isValid) {
    errors.date = dateValidation.error;
    isValid = false;
  }

  // Items validation
  if (!invoiceData.items || invoiceData.items.length === 0) {
    errors.items = 'At least one item is required';
    isValid = false;
  } else {
    // Validate each item
    invoiceData.items.forEach((item, index) => {
      if (!item.name || !item.name.trim()) {
        errors[`item_${index}_name`] = 'Item name is required';
        isValid = false;
      }

      const quantityValidation = validateNumeric(item.quantity, 1, 10000, 'Quantity');
      if (!quantityValidation.isValid) {
        errors[`item_${index}_quantity`] = quantityValidation.error;
        isValid = false;
      }

      const rateValidation = validateAmount(item.rate, 0.01);
      if (!rateValidation.isValid) {
        errors[`item_${index}_rate`] = rateValidation.error;
        isValid = false;
      }
    });
  }

  // Payment validation
  if (invoiceData.paymentStatus) {
    const paymentValidation = validatePaymentStatus(invoiceData.paymentStatus, invoiceData);
    if (!paymentValidation.isValid) {
      errors.payment = paymentValidation.error;
      isValid = false;
    }
  }

  // Delivery validation
  if (invoiceData.deliveryStatus) {
    const deliveryValidation = validateDeliveryDetails(invoiceData);
    if (!deliveryValidation.isValid) {
      errors.delivery = deliveryValidation.error;
      isValid = false;
    }
  }

  // EMI validation if payment is EMI
  if (invoiceData.paymentStatus === PAYMENT_STATUS.EMI) {
    const emiValidation = validateEMIDetails(invoiceData.emiDetails, invoiceData.totalAmount);
    if (!emiValidation.isValid) {
      errors.emi = emiValidation.error;
      isValid = false;
    }
  }

  return { isValid, errors };
};

/**
 * Validate payment status and related fields
 * @param {string} paymentStatus - Payment status
 * @param {Object} invoiceData - Invoice data
 * @returns {Object} Validation result
 */
export const validatePaymentStatus = (paymentStatus, invoiceData) => {
  if (!paymentStatus) {
    return { isValid: false, error: 'Payment status is required' };
  }

  if (!Object.values(PAYMENT_STATUS).includes(paymentStatus)) {
    return { isValid: false, error: 'Invalid payment status' };
  }

  // Validate payment method if specified
  if (invoiceData.paymentMethod) {
    if (!Object.values(PAYMENT_METHODS).includes(invoiceData.paymentMethod)) {
      return { isValid: false, error: 'Invalid payment method' };
    }
  }

  // Validate paid amount if partially paid
  if (paymentStatus === PAYMENT_STATUS.PARTIAL) {
    if (!invoiceData.paidAmount || invoiceData.paidAmount <= 0) {
      return { isValid: false, error: 'Paid amount is required for partial payments' };
    }
    
    if (invoiceData.paidAmount >= invoiceData.totalAmount) {
      return { isValid: false, error: 'Paid amount cannot be equal or greater than total amount for partial payments' };
    }
  }

  return { isValid: true, error: '' };
};

/**
 * Validate delivery details
 * @param {Object} invoiceData - Invoice data
 * @returns {Object} Validation result
 */
export const validateDeliveryDetails = (invoiceData) => {
  const { deliveryStatus, deliveryAddress, scheduledDeliveryDate } = invoiceData;

  if (!deliveryStatus) {
    return { isValid: false, error: 'Delivery status is required' };
  }

  if (!Object.values(DELIVERY_STATUS).includes(deliveryStatus)) {
    return { isValid: false, error: 'Invalid delivery status' };
  }

  // Validate delivery address for non-pickup deliveries
  if (deliveryStatus !== 'pickup' && (!deliveryAddress || !deliveryAddress.trim())) {
    return { isValid: false, error: 'Delivery address is required' };
  }

  // Validate scheduled delivery date
  if (deliveryStatus === 'scheduled') {
    if (!scheduledDeliveryDate) {
      return { isValid: false, error: 'Scheduled delivery date is required' };
    }

    const dateValidation = validateDate(scheduledDeliveryDate, true, false);
    if (!dateValidation.isValid) {
      return { isValid: false, error: 'Invalid scheduled delivery date' };
    }

    // Check if scheduled date is in the future
    const scheduledDate = new Date(scheduledDeliveryDate);
    const today = new Date();
    if (scheduledDate <= today) {
      return { isValid: false, error: 'Scheduled delivery date must be in the future' };
    }
  }

  return { isValid: true, error: '' };
};

/**
 * Validate EMI details
 * @param {Object} emiDetails - EMI details object
 * @param {number} totalAmount - Total invoice amount
 * @returns {Object} Validation result
 */
export const validateEMIDetails = (emiDetails, totalAmount) => {
  if (!emiDetails) {
    return { isValid: false, error: 'EMI details are required' };
  }

  const { monthlyAmount, startDate, numberOfInstallments } = emiDetails;

  // Validate minimum amount for EMI
  if (totalAmount < EMI_CONFIG.MIN_AMOUNT) {
    return { 
      isValid: false, 
      error: `Minimum amount for EMI is ₹${EMI_CONFIG.MIN_AMOUNT.toLocaleString()}` 
    };
  }

  // Validate monthly amount
  const monthlyValidation = validateAmount(monthlyAmount, 1000);
  if (!monthlyValidation.isValid) {
    return { isValid: false, error: 'Valid monthly EMI amount is required' };
  }

  if (monthlyAmount > totalAmount) {
    return { isValid: false, error: 'Monthly amount cannot exceed total amount' };
  }

  // Validate start date
  const startDateValidation = validateDate(startDate, true, false);
  if (!startDateValidation.isValid) {
    return { isValid: false, error: 'Valid EMI start date is required' };
  }

  const emiStartDate = new Date(startDate);
  const today = new Date();
  if (emiStartDate <= today) {
    return { isValid: false, error: 'EMI start date must be in the future' };
  }

  // Validate number of installments
  const calculatedInstallments = Math.ceil(totalAmount / monthlyAmount);
  if (calculatedInstallments > EMI_CONFIG.MAX_INSTALLMENTS) {
    return { 
      isValid: false, 
      error: `Maximum ${EMI_CONFIG.MAX_INSTALLMENTS} installments allowed` 
    };
  }

  if (calculatedInstallments < EMI_CONFIG.MIN_INSTALLMENTS) {
    return { 
      isValid: false, 
      error: `Minimum ${EMI_CONFIG.MIN_INSTALLMENTS} installments required` 
    };
  }

  return { isValid: true, error: '' };
};

/**
 * Validate invoice item
 * @param {Object} item - Invoice item
 * @param {number} index - Item index
 * @returns {Object} Validation result
 */
export const validateInvoiceItem = (item, index = 0) => {
  const errors = {};
  let isValid = true;

  // Validate item name
  const nameValidation = validateStringLength(item.name, 1, 100, 'Item name');
  if (!nameValidation.isValid) {
    errors[`item_${index}_name`] = nameValidation.error;
    isValid = false;
  }

  // Validate quantity
  const quantityValidation = validateNumeric(item.quantity, 1, 10000, 'Quantity');
  if (!quantityValidation.isValid) {
    errors[`item_${index}_quantity`] = quantityValidation.error;
    isValid = false;
  }

  // Check if quantity is a whole number
  if (item.quantity && parseFloat(item.quantity) % 1 !== 0) {
    errors[`item_${index}_quantity`] = 'Quantity must be a whole number';
    isValid = false;
  }

  // Validate rate/price
  const rateValidation = validateAmount(item.rate, 0.01);
  if (!rateValidation.isValid) {
    errors[`item_${index}_rate`] = rateValidation.error;
    isValid = false;
  }

  // Validate discount if present
  if (item.discount !== undefined && item.discount !== '') {
    const discountValidation = validateNumeric(item.discount, 0, 100, 'Discount');
    if (!discountValidation.isValid) {
      errors[`item_${index}_discount`] = discountValidation.error;
      isValid = false;
    }
  }

  // Validate HSN code if present
  if (item.hsnCode && !/^\d{4,8}$/.test(item.hsnCode)) {
    errors[`item_${index}_hsn`] = 'HSN code must be 4-8 digits';
    isValid = false;
  }

  return { isValid, errors };
};

/**
 * Validate multiple invoice items
 * @param {Array} items - Array of invoice items
 * @returns {Object} Validation result
 */
export const validateInvoiceItems = (items) => {
  if (!items || !Array.isArray(items)) {
    return { isValid: false, errors: { items: 'Items must be an array' } };
  }

  if (items.length === 0) {
    return { isValid: false, errors: { items: 'At least one item is required' } };
  }

  let allErrors = {};
  let allValid = true;

  items.forEach((item, index) => {
    const itemValidation = validateInvoiceItem(item, index);
    if (!itemValidation.isValid) {
      allErrors = { ...allErrors, ...itemValidation.errors };
      allValid = false;
    }
  });

  return { isValid: allValid, errors: allErrors };
};

/**
 * Validate payment transaction
 * @param {Object} paymentData - Payment transaction data
 * @returns {Object} Validation result
 */
export const validatePaymentTransaction = (paymentData) => {
  const validationRules = {
    invoiceId: {
      required: true,
      type: 'stringLength',
      minLength: 1,
      label: 'Invoice ID'
    },
    amount: {
      required: true,
      type: 'amount',
      min: 0.01,
      label: 'Payment Amount'
    },
    paymentMethod: {
      required: true,
      type: 'paymentMethod',
      label: 'Payment Method'
    },
    paymentDate: {
      required: true,
      type: 'date',
      allowFuture: false,
      allowPast: true,
      label: 'Payment Date'
    }
  };

  const validation = validateFormData(paymentData, validationRules);

  // Additional validation for payment method
  if (paymentData.paymentMethod && !Object.values(PAYMENT_METHODS).includes(paymentData.paymentMethod)) {
    validation.isValid = false;
    validation.errors.paymentMethod = 'Invalid payment method';
  }

  // Validate cheque details if payment method is cheque
  if (paymentData.paymentMethod === PAYMENT_METHODS.CHEQUE) {
    if (!paymentData.chequeNumber || !paymentData.chequeNumber.trim()) {
      validation.isValid = false;
      validation.errors.chequeNumber = 'Cheque number is required';
    }

    if (!paymentData.chequeDate) {
      validation.isValid = false;
      validation.errors.chequeDate = 'Cheque date is required';
    }

    if (!paymentData.bankName || !paymentData.bankName.trim()) {
      validation.isValid = false;
      validation.errors.bankName = 'Bank name is required';
    }
  }

  // Validate UPI details if payment method is UPI
  if (paymentData.paymentMethod === PAYMENT_METHODS.UPI) {
    if (!paymentData.upiTransactionId || !paymentData.upiTransactionId.trim()) {
      validation.isValid = false;
      validation.errors.upiTransactionId = 'UPI transaction ID is required';
    }
  }

  return validation;
};

/**
 * Validate invoice totals and calculations
 * @param {Object} invoiceData - Invoice data with calculations
 * @returns {Object} Validation result
 */
export const validateInvoiceTotals = (invoiceData) => {
  const { items, subTotal, totalGST, totalAmount, discountAmount = 0 } = invoiceData;

  const errors = {};
  let isValid = true;

  if (!items || items.length === 0) {
    return { isValid: false, errors: { items: 'Items are required for calculation' } };
  }

  // Calculate expected totals
  const expectedSubTotal = items.reduce((sum, item) => {
    const itemTotal = (parseFloat(item.quantity) || 0) * (parseFloat(item.rate) || 0);
    const itemDiscount = item.discount ? (itemTotal * parseFloat(item.discount)) / 100 : 0;
    return sum + itemTotal - itemDiscount;
  }, 0);

  const expectedTotal = expectedSubTotal + (totalGST || 0) - (discountAmount || 0);

  // Validate subtotal
  const subTotalDiff = Math.abs((subTotal || 0) - expectedSubTotal);
  if (subTotalDiff > 0.01) { // Allow for rounding differences
    errors.subTotal = 'Subtotal calculation mismatch';
    isValid = false;
  }

  // Validate total amount
  const totalDiff = Math.abs((totalAmount || 0) - expectedTotal);
  if (totalDiff > 0.01) {
    errors.totalAmount = 'Total amount calculation mismatch';
    isValid = false;
  }

  // Validate amounts are positive
  if ((subTotal || 0) < 0) {
    errors.subTotal = 'Subtotal cannot be negative';
    isValid = false;
  }

  if ((totalAmount || 0) <= 0) {
    errors.totalAmount = 'Total amount must be greater than zero';
    isValid = false;
  }

  return { isValid, errors };
};

/**
 * Validate delivery information
 * @param {Object} deliveryData - Delivery information
 * @returns {Object} Validation result
 */
export const validateDeliveryInfo = (deliveryData) => {
  const {
    deliveryStatus,
    deliveryAddress,
    scheduledDeliveryDate,
    deliveryCharges,
    specialInstructions
  } = deliveryData;

  const errors = {};
  let isValid = true;

  // Validate delivery status
  if (!deliveryStatus || !Object.values(DELIVERY_STATUS).includes(deliveryStatus)) {
    errors.deliveryStatus = 'Valid delivery status is required';
    isValid = false;
  }

  // Validate delivery address (except for pickup)
  if (deliveryStatus !== 'pickup') {
    if (!deliveryAddress || !deliveryAddress.trim()) {
      errors.deliveryAddress = 'Delivery address is required';
      isValid = false;
    } else if (deliveryAddress.length < 10) {
      errors.deliveryAddress = 'Please provide a complete delivery address';
      isValid = false;
    }
  }

  // Validate scheduled delivery date
  if (deliveryStatus === 'scheduled') {
    if (!scheduledDeliveryDate) {
      errors.scheduledDeliveryDate = 'Scheduled delivery date is required';
      isValid = false;
    } else {
      const dateValidation = validateDate(scheduledDeliveryDate, true, false);
      if (!dateValidation.isValid) {
        errors.scheduledDeliveryDate = dateValidation.error;
        isValid = false;
      }
    }
  }

  // Validate delivery charges
  if (deliveryCharges !== undefined && deliveryCharges !== '') {
    const chargesValidation = validateAmount(deliveryCharges, 0);
    if (!chargesValidation.isValid) {
      errors.deliveryCharges = chargesValidation.error;
      isValid = false;
    }
  }

  // Validate special instructions length
  if (specialInstructions && specialInstructions.length > 500) {
    errors.specialInstructions = 'Special instructions cannot exceed 500 characters';
    isValid = false;
  }

  return { isValid, errors };
};

/**
 * Validate EMI (Equated Monthly Installment) details
 * @param {Object} emiDetails - EMI configuration
 * @param {number} totalAmount - Total invoice amount
 * @returns {Object} Validation result
 */
export const validateEMIDetails = (emiDetails, totalAmount) => {
  if (!emiDetails) {
    return { isValid: false, error: 'EMI details are required' };
  }

  const { monthlyAmount, startDate, numberOfInstallments, interestRate } = emiDetails;

  const errors = {};
  let isValid = true;

  // Check minimum amount eligibility
  if (totalAmount < EMI_CONFIG.MIN_AMOUNT) {
    return {
      isValid: false,
      error: `Minimum amount for EMI is ₹${EMI_CONFIG.MIN_AMOUNT.toLocaleString()}`
    };
  }

  // Validate monthly amount
  const monthlyValidation = validateAmount(monthlyAmount, 1000);
  if (!monthlyValidation.isValid) {
    errors.monthlyAmount = 'Valid monthly amount is required (minimum ₹1,000)';
    isValid = false;
  }

  // Check if monthly amount is reasonable
  if (monthlyAmount && monthlyAmount > totalAmount) {
    errors.monthlyAmount = 'Monthly amount cannot exceed total amount';
    isValid = false;
  }

  // Validate start date
  if (!startDate) {
    errors.startDate = 'EMI start date is required';
    isValid = false;
  } else {
    const dateValidation = validateDate(startDate, true, false);
    if (!dateValidation.isValid) {
      errors.startDate = dateValidation.error;
      isValid = false;
    } else {
      // Check if start date is reasonable (not too far in future)
      const startDateObj = new Date(startDate);
      const maxStartDate = new Date();
      maxStartDate.setMonth(maxStartDate.getMonth() + 3); // Max 3 months from now
      
      if (startDateObj > maxStartDate) {
        errors.startDate = 'EMI start date cannot be more than 3 months in the future';
        isValid = false;
      }
    }
  }

  // Validate number of installments
  if (numberOfInstallments) {
    const installmentsValidation = validateNumeric(
      numberOfInstallments,
      EMI_CONFIG.MIN_INSTALLMENTS,
      EMI_CONFIG.MAX_INSTALLMENTS,
      'Number of installments'
    );
    if (!installmentsValidation.isValid) {
      errors.numberOfInstallments = installmentsValidation.error;
      isValid = false;
    }
  }

  // Validate interest rate
  if (interestRate !== undefined && interestRate !== '') {
    const rateValidation = validateNumeric(interestRate, 0, 50, 'Interest rate');
    if (!rateValidation.isValid) {
      errors.interestRate = rateValidation.error;
      isValid = false;
    }
  }

  return { isValid, errors };
};

/**
 * Validate refund request
 * @param {Object} refundData - Refund request data
 * @returns {Object} Validation result
 */
export const validateRefundRequest = (refundData) => {
  const validationRules = {
    invoiceId: {
      required: true,
      type: 'stringLength',
      minLength: 1,
      label: 'Invoice ID'
    },
    refundAmount: {
      required: true,
      type: 'amount',
      min: 0.01,
      label: 'Refund Amount'
    },
    reason: {
      required: true,
      type: 'stringLength',
      minLength: 10,
      maxLength: 500,
      label: 'Refund Reason'
    },
    refundMethod: {
      required: true,
      type: 'stringLength',
      minLength: 1,
      label: 'Refund Method'
    }
  };

  const validation = validateFormData(refundData, validationRules);

  // Additional business logic validation
  if (refundData.refundAmount && refundData.originalAmount) {
    if (refundData.refundAmount > refundData.originalAmount) {
      validation.isValid = false;
      validation.errors.refundAmount = 'Refund amount cannot exceed original amount';
    }
  }

  return validation;
};

/**
 * Validate sales report parameters
 * @param {Object} reportParams - Report generation parameters
 * @returns {Object} Validation result
 */
export const validateSalesReportParams = (reportParams) => {
  const { startDate, endDate, reportType, customerIds, employeeIds } = reportParams;

  const errors = {};
  let isValid = true;

  // Validate date range
  if (startDate) {
    const startDateValidation = validateDate(startDate, false, true);
    if (!startDateValidation.isValid) {
      errors.startDate = startDateValidation.error;
      isValid = false;
    }
  }

  if (endDate) {
    const endDateValidation = validateDate(endDate, false, true);
    if (!endDateValidation.isValid) {
      errors.endDate = endDateValidation.error;
      isValid = false;
    }
  }

  // Validate date range logic
  if (startDate && endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (start > end) {
      errors.dateRange = 'Start date cannot be after end date';
      isValid = false;
    }

    // Check for reasonable date range (not more than 1 year)
    const daysDiff = (end - start) / (1000 * 60 * 60 * 24);
    if (daysDiff > 365) {
      errors.dateRange = 'Date range cannot exceed 1 year';
      isValid = false;
    }
  }

  // Validate report type
  const validReportTypes = ['sales', 'gst', 'customer', 'employee', 'financial'];
  if (reportType && !validReportTypes.includes(reportType)) {
    errors.reportType = 'Invalid report type';
    isValid = false;
  }

  // Validate array fields
  if (customerIds && (!Array.isArray(customerIds) || customerIds.some(id => !id))) {
    errors.customerIds = 'Invalid customer IDs';
    isValid = false;
  }

  if (employeeIds && (!Array.isArray(employeeIds) || employeeIds.some(id => !id))) {
    errors.employeeIds = 'Invalid employee IDs';
    isValid = false;
  }

  return { isValid, errors };
};

/**
 * Validate discount application
 * @param {number} discountValue - Discount value
 * @param {string} discountType - Discount type (percentage/fixed)
 * @param {number} itemTotal - Item total amount
 * @returns {Object} Validation result
 */
export const validateDiscount = (discountValue, discountType, itemTotal) => {
  const discountValidation = validateNumeric(discountValue, 0, null, 'Discount');
  if (!discountValidation.isValid) {
    return discountValidation;
  }

  if (discountType === 'percentage') {
    if (discountValue > 100) {
      return { isValid: false, error: 'Percentage discount cannot exceed 100%' };
    }
  } else if (discountType === 'fixed') {
    if (discountValue >= itemTotal) {
      return { isValid: false, error: 'Discount cannot be equal to or greater than item total' };
    }
  }

  return { isValid: true, error: '' };
};

/**
 * Complete sales form validation
 * @param {Object} salesData - Complete sales form data
 * @param {string} formType - Type of form ('invoice', 'payment', 'refund')
 * @returns {Object} Complete validation result
 */
export const validateSalesForm = (salesData, formType = 'invoice') => {
  switch (formType) {
    case 'invoice':
      return validateInvoiceForm(salesData);
    case 'payment':
      return validatePaymentTransaction(salesData);
    case 'refund':
      return validateRefundRequest(salesData);
    case 'emi':
      return validateEMIDetails(salesData.emiDetails, salesData.totalAmount);
    case 'delivery':
      return validateDeliveryInfo(salesData);
    case 'report':
      return validateSalesReportParams(salesData);
    default:
      return { isValid: false, errors: { form: 'Unknown form type' } };
  }
};

export default {
  validateInvoiceForm,
  validatePaymentStatus,
  validateDeliveryDetails,
  validateEMIDetails,
  validateInvoiceItem,
  validateInvoiceItems,
  validatePaymentTransaction,
  validateInvoiceTotals,
  validateDeliveryInfo,
  validateRefundRequest,
  validateSalesReportParams,
  validateDiscount,
  validateSalesForm
};