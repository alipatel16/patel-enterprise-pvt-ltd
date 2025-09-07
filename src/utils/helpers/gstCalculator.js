import { GST_RATES, GST_TYPES } from '../constants/appConstants';

// Define Gujarat state constant locally to avoid import issues
const GUJARAT_STATE = 'gujarat';

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
 * Calculate GST with custom slab rate
 * @param {number} amount - Base amount before GST
 * @param {string} customerState - Customer's state
 * @param {boolean} includeGST - Whether to include GST in calculation
 * @param {number} gstSlabRate - Custom GST slab rate (e.g., 5, 12, 18, 28)
 * @returns {Object} GST calculation details
 */
export const calculateGSTWithSlab = (amount, customerState = '', includeGST = true, gstSlabRate = 18) => {
  const baseAmount = parseFloat(amount) || 0;
  const slabRate = parseFloat(gstSlabRate) || 0;
  
  if (!includeGST || baseAmount <= 0 || slabRate === 0) {
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
      gstSlabRate: slabRate,
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
    // Within Gujarat - CGST + SGST (split the slab rate equally)
    cgstRate = slabRate / 2;
    sgstRate = slabRate / 2;
    cgstAmount = (baseAmount * cgstRate) / 100;
    sgstAmount = (baseAmount * sgstRate) / 100;
  } else {
    // Outside Gujarat - IGST (full slab rate)
    igstRate = slabRate;
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
    gstSlabRate: slabRate,
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
 * Calculate GST from inclusive amount with custom slab
 * @param {number} inclusiveAmount - Amount including GST
 * @param {string} customerState - Customer's state
 * @param {number} gstSlabRate - Custom GST slab rate
 * @returns {Object} GST calculation details
 */
export const calculateGSTFromInclusiveWithSlab = (inclusiveAmount, customerState = '', gstSlabRate = 18) => {
  const totalAmount = parseFloat(inclusiveAmount) || 0;
  const slabRate = parseFloat(gstSlabRate) || 0;
  
  if (totalAmount <= 0 || slabRate === 0) {
    return calculateGSTWithSlab(0, customerState, false, slabRate);
  }

  // Calculate base amount from inclusive amount
  const baseAmount = totalAmount / (1 + slabRate / 100);
  
  return calculateGSTWithSlab(baseAmount, customerState, true, slabRate);
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
 * Generate GST invoice summary with custom slabs
 * @param {Array} items - Array of items with amount, GST details, and slab rates
 * @param {string} customerState - Customer's state
 * @param {Object} discounts - Discount information
 * @returns {Object} Invoice summary with GST
 */
export const generateGSTInvoiceSummaryWithSlabs = (items = [], customerState = '', discounts = {}) => {
  let subtotal = 0;
  let totalGST = 0;
  let cgstTotal = 0;
  let sgstTotal = 0;
  let igstTotal = 0;
  const itemBreakdowns = [];

  // Calculate totals for all items
  items.forEach((item, index) => {
    const itemAmount = parseFloat(item.amount) || 0;
    const gstSlab = parseFloat(item.gstSlab) || 18;
    const gstCalc = calculateGSTWithSlab(itemAmount, customerState, item.includeGST !== false, gstSlab);
    
    subtotal += gstCalc.baseAmount;
    totalGST += gstCalc.totalGstAmount;
    cgstTotal += gstCalc.cgstAmount;
    sgstTotal += gstCalc.sgstAmount;
    igstTotal += gstCalc.igstAmount;
    
    itemBreakdowns.push({
      itemIndex: index,
      baseAmount: gstCalc.baseAmount,
      gstAmount: gstCalc.totalGstAmount,
      totalAmount: gstCalc.totalAmount,
      gstSlab: gstSlab,
      gstBreakdown: gstCalc.gstBreakdown
    });
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
  const grandTotal = discountedSubtotal + totalGST;

  return {
    subtotal: Math.round(subtotal * 100) / 100,
    discountAmount: Math.round(finalDiscount * 100) / 100,
    discountedSubtotal: Math.round(discountedSubtotal * 100) / 100,
    totalGST: Math.round(totalGST * 100) / 100,
    cgstTotal: Math.round(cgstTotal * 100) / 100,
    sgstTotal: Math.round(sgstTotal * 100) / 100,
    igstTotal: Math.round(igstTotal * 100) / 100,
    grandTotal: Math.round(grandTotal * 100) / 100,
    isGujaratCustomer: customerState.toLowerCase().trim() === GUJARAT_STATE.toLowerCase(),
    itemBreakdowns
  };
};

/**
 * Get recommended GST slab for a product category
 * @param {string} productCategory - Product category
 * @returns {number} Recommended GST slab rate
 */
export const getRecommendedGSTSlab = (productCategory = '') => {
  const category = productCategory.toLowerCase();
  
  // Common product categories and their typical GST rates
  const categorySlabs = {
    'food': 5,
    'medicine': 5,
    'book': 5,
    'clothing': 5,
    'electronics': 18,
    'mobile': 12,
    'computer': 18,
    'furniture': 12,
    'luxury': 28,
    'tobacco': 28,
    'alcohol': 28,
    'car': 28,
    'general': 18
  };

  // Check if category matches any known category
  for (const [key, rate] of Object.entries(categorySlabs)) {
    if (category.includes(key)) {
      return rate;
    }
  }

  // Default to 18% for unknown categories
  return 18;
};

export default {
  calculateGST,
  calculateGSTWithSlab,
  calculateGSTFromInclusive,
  calculateGSTFromInclusiveWithSlab,
  formatGSTAmount,
  getGSTDisplayText,
  validateGSTNumber,
  getStateCodeFromGST,
  isGujaratGST,
  calculateEMIGST,
  generateGSTInvoiceSummaryWithSlabs,
  getRecommendedGSTSlab
};