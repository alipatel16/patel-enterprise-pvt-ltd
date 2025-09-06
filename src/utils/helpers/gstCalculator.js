import { GST_RATES, GST_TYPES, GUJARAT_STATE } from '../constants/appConstants';

/**
 * Calculate GST based on customer location and amount
 * @param {number} amount - Base amount before GST
 * @param {string} customerState - Customer's state
 * @param {boolean} includeGST - Whether to include GST in calculation
 * @returns {Object} GST calculation details
 */
export const calculateGST = (amount, customerState = '', includeGST = true) => {
  const baseAmount = parseFloat(amount) || 0;
  
  if (!includeGST || baseAmount <= 0) {
    return {
      baseAmount,
      gstType: GST_TYPES.NO_GST,
      cgstRate: 0,
      sgstRate: 0,
      igstRate: 0,
      cgstAmount: 0,
      sgstAmount: 0,
      igstAmount: 0,
      totalGstAmount: 0,
      totalAmount: baseAmount,
      gstBreakdown: {
        cgst: { rate: 0, amount: 0 },
        sgst: { rate: 0, amount: 0 },
        igst: { rate: 0, amount: 0 }
      }
    };
  }

  const isGujaratCustomer = customerState.toLowerCase().trim() === GUJARAT_STATE.toLowerCase();
  const gstType = isGujaratCustomer ? GST_TYPES.CGST_SGST : GST_TYPES.IGST;

  let cgstRate = 0;
  let sgstRate = 0;
  let igstRate = 0;
  let cgstAmount = 0;
  let sgstAmount = 0;
  let igstAmount = 0;

  if (isGujaratCustomer) {
    // Within Gujarat - CGST + SGST
    cgstRate = GST_RATES.CGST;
    sgstRate = GST_RATES.SGST;
    cgstAmount = (baseAmount * cgstRate) / 100;
    sgstAmount = (baseAmount * sgstRate) / 100;
  } else {
    // Outside Gujarat - IGST
    igstRate = GST_RATES.IGST;
    igstAmount = (baseAmount * igstRate) / 100;
  }

  const totalGstAmount = cgstAmount + sgstAmount + igstAmount;
  const totalAmount = baseAmount + totalGstAmount;

  return {
    baseAmount,
    gstType,
    cgstRate,
    sgstRate,
    igstRate,
    cgstAmount: Math.round(cgstAmount * 100) / 100,
    sgstAmount: Math.round(sgstAmount * 100) / 100,
    igstAmount: Math.round(igstAmount * 100) / 100,
    totalGstAmount: Math.round(totalGstAmount * 100) / 100,
    totalAmount: Math.round(totalAmount * 100) / 100,
    gstBreakdown: {
      cgst: { 
        rate: cgstRate, 
        amount: Math.round(cgstAmount * 100) / 100 
      },
      sgst: { 
        rate: sgstRate, 
        amount: Math.round(sgstAmount * 100) / 100 
      },
      igst: { 
        rate: igstRate, 
        amount: Math.round(igstAmount * 100) / 100 
      }
    }
  };
};

/**
 * Calculate GST from inclusive amount (reverse calculation)
 * @param {number} inclusiveAmount - Amount including GST
 * @param {string} customerState - Customer's state
 * @returns {Object} GST calculation details
 */
export const calculateGSTFromInclusive = (inclusiveAmount, customerState = '') => {
  const totalAmount = parseFloat(inclusiveAmount) || 0;
  
  if (totalAmount <= 0) {
    return calculateGST(0, customerState, false);
  }

  const isGujaratCustomer = customerState.toLowerCase().trim() === GUJARAT_STATE.toLowerCase();
  const totalGstRate = isGujaratCustomer ? (GST_RATES.CGST + GST_RATES.SGST) : GST_RATES.IGST;
  
  // Calculate base amount from inclusive amount
  const baseAmount = totalAmount / (1 + totalGstRate / 100);
  
  return calculateGST(baseAmount, customerState, true);
};

/**
 * Format GST amount for display
 * @param {number} amount - Amount to format
 * @param {string} currency - Currency symbol
 * @returns {string} Formatted amount
 */
export const formatGSTAmount = (amount, currency = '₹') => {
  const numAmount = parseFloat(amount) || 0;
  return `${currency}${numAmount.toLocaleString('en-IN', { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  })}`;
};

/**
 * Get GST display text
 * @param {string} gstType - Type of GST
 * @returns {string} Display text
 */
export const getGSTDisplayText = (gstType) => {
  const displayTexts = {
    [GST_TYPES.CGST_SGST]: 'CGST + SGST',
    [GST_TYPES.IGST]: 'IGST',
    [GST_TYPES.NO_GST]: 'No GST'
  };
  return displayTexts[gstType] || 'Unknown';
};

/**
 * Validate GST number format
 * @param {string} gstNumber - GST number to validate
 * @returns {Object} Validation result
 */
export const validateGSTNumber = (gstNumber) => {
  if (!gstNumber || gstNumber.trim() === '') {
    return { isValid: true, error: null }; // GST number is optional
  }

  const cleanGST = gstNumber.trim().toUpperCase();
  
  // GST format: 22AAAAA0000A1Z5
  const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
  
  if (!gstRegex.test(cleanGST)) {
    return {
      isValid: false,
      error: 'Invalid GST number format. Expected format: 22AAAAA0000A1Z5'
    };
  }

  return { isValid: true, error: null };
};

/**
 * Get state code from GST number
 * @param {string} gstNumber - GST number
 * @returns {string} State code
 */
export const getStateCodeFromGST = (gstNumber) => {
  if (!gstNumber || gstNumber.length < 2) {
    return '';
  }
  
  return gstNumber.substring(0, 2);
};

/**
 * Check if GST number belongs to Gujarat
 * @param {string} gstNumber - GST number
 * @returns {boolean} True if Gujarat GST number
 */
export const isGujaratGST = (gstNumber) => {
  const stateCode = getStateCodeFromGST(gstNumber);
  return stateCode === '24'; // Gujarat state code in GST
};

/**
 * Calculate EMI GST (if GST is applicable on EMI)
 * @param {number} emiAmount - EMI amount
 * @param {string} customerState - Customer's state
 * @param {boolean} includeGST - Whether GST is applicable
 * @returns {Object} EMI GST calculation
 */
export const calculateEMIGST = (emiAmount, customerState = '', includeGST = false) => {
  // Usually GST is calculated on the full amount upfront, not on EMI
  // But this function is available if needed for specific business requirements
  if (!includeGST) {
    return {
      emiAmount: parseFloat(emiAmount) || 0,
      gstAmount: 0,
      totalEMIAmount: parseFloat(emiAmount) || 0
    };
  }

  const gstCalc = calculateGST(emiAmount, customerState, true);
  
  return {
    emiAmount: gstCalc.baseAmount,
    gstAmount: gstCalc.totalGstAmount,
    totalEMIAmount: gstCalc.totalAmount,
    gstBreakdown: gstCalc.gstBreakdown
  };
};

/**
 * Generate GST invoice summary
 * @param {Array} items - Array of items with amount and GST details
 * @param {string} customerState - Customer's state
 * @param {Object} discounts - Discount information
 * @returns {Object} Invoice summary with GST
 */
export const generateGSTInvoiceSummary = (items = [], customerState = '', discounts = {}) => {
  let subtotal = 0;
  let totalGST = 0;
  let cgstTotal = 0;
  let sgstTotal = 0;
  let igstTotal = 0;

  // Calculate totals for all items
  items.forEach(item => {
    const itemAmount = parseFloat(item.amount) || 0;
    const gstCalc = calculateGST(itemAmount, customerState, item.includeGST !== false);
    
    subtotal += gstCalc.baseAmount;
    totalGST += gstCalc.totalGstAmount;
    cgstTotal += gstCalc.cgstAmount;
    sgstTotal += gstCalc.sgstAmount;
    igstTotal += gstCalc.igstAmount;
  });

  // Apply discounts
  const discountAmount = parseFloat(discounts.amount) || 0;
  const discountPercent = parseFloat(discounts.percent) || 0;
  
  let finalDiscount = 0;
  if (discountAmount > 0) {
    finalDiscount = discountAmount;
  } else if (discountPercent > 0) {
    finalDiscount = (subtotal * discountPercent) / 100;
  }

  const discountedSubtotal = Math.max(0, subtotal - finalDiscount);
  
  // Recalculate GST on discounted amount
  const finalGSTCalc = calculateGST(discountedSubtotal, customerState, items.some(item => item.includeGST !== false));
  
  const grandTotal = discountedSubtotal + finalGSTCalc.totalGstAmount;

  return {
    subtotal: Math.round(subtotal * 100) / 100,
    discountAmount: Math.round(finalDiscount * 100) / 100,
    discountedSubtotal: Math.round(discountedSubtotal * 100) / 100,
    gstBreakdown: finalGSTCalc.gstBreakdown,
    totalGST: Math.round(finalGSTCalc.totalGstAmount * 100) / 100,
    grandTotal: Math.round(grandTotal * 100) / 100,
    gstType: finalGSTCalc.gstType,
    isGujaratCustomer: customerState.toLowerCase().trim() === GUJARAT_STATE.toLowerCase()
  };
};

export default {
  calculateGST,
  calculateGSTFromInclusive,
  formatGSTAmount,
  getGSTDisplayText,
  validateGSTNumber,
  getStateCodeFromGST,
  isGujaratGST,
  calculateEMIGST,
  generateGSTInvoiceSummary
};