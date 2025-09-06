/**
 * GST Constants
 * Indian Goods and Services Tax (GST) related constants and configurations
 */

// GST Types
export const GST_TYPES = {
  NO_GST: 'no_gst',
  CGST_SGST: 'cgst_sgst', // Central + State GST (Intra-state)
  IGST: 'igst',           // Integrated GST (Inter-state)
  EXEMPT: 'exempt'
};

// GST Rates (in percentage)
export const GST_RATES = {
  CGST: 9,    // Central GST
  SGST: 9,    // State GST  
  IGST: 18,   // Integrated GST
  TOTAL: 18   // Total GST rate
};

// Alternative GST Rates for different product categories
export const PRODUCT_GST_RATES = {
  ELECTRONICS: {
    MOBILE_PHONES: 12,
    COMPUTERS: 18,
    ACCESSORIES: 18,
    HOME_APPLIANCES: 28
  },
  FURNITURE: {
    WOODEN_FURNITURE: 12,
    OFFICE_FURNITURE: 18,
    LUXURY_FURNITURE: 28,
    MATTRESSES: 28
  },
  GENERAL: {
    ESSENTIAL_GOODS: 5,
    STANDARD_GOODS: 12,
    LUXURY_GOODS: 28
  }
};

// GST Display Names
export const GST_DISPLAY_NAMES = {
  [GST_TYPES.NO_GST]: 'No GST',
  [GST_TYPES.CGST_SGST]: 'CGST + SGST',
  [GST_TYPES.IGST]: 'IGST',
  [GST_TYPES.EXEMPT]: 'GST Exempt'
};

// Indian States and Union Territories
export const INDIAN_STATES = {
  // States
  'andhra pradesh': 'Andhra Pradesh',
  'arunachal pradesh': 'Arunachal Pradesh',
  'assam': 'Assam',
  'bihar': 'Bihar',
  'chhattisgarh': 'Chhattisgarh',
  'goa': 'Goa',
  'gujarat': 'Gujarat',
  'haryana': 'Haryana',
  'himachal pradesh': 'Himachal Pradesh',
  'jharkhand': 'Jharkhand',
  'karnataka': 'Karnataka',
  'kerala': 'Kerala',
  'madhya pradesh': 'Madhya Pradesh',
  'maharashtra': 'Maharashtra',
  'manipur': 'Manipur',
  'meghalaya': 'Meghalaya',
  'mizoram': 'Mizoram',
  'nagaland': 'Nagaland',
  'odisha': 'Odisha',
  'punjab': 'Punjab',
  'rajasthan': 'Rajasthan',
  'sikkim': 'Sikkim',
  'tamil nadu': 'Tamil Nadu',
  'telangana': 'Telangana',
  'tripura': 'Tripura',
  'uttar pradesh': 'Uttar Pradesh',
  'uttarakhand': 'Uttarakhand',
  'west bengal': 'West Bengal',
  
  // Union Territories
  'andaman and nicobar islands': 'Andaman and Nicobar Islands',
  'chandigarh': 'Chandigarh',
  'dadra and nagar haveli and daman and diu': 'Dadra and Nagar Haveli and Daman and Diu',
  'delhi': 'Delhi',
  'jammu and kashmir': 'Jammu and Kashmir',
  'ladakh': 'Ladakh',
  'lakshadweep': 'Lakshadweep',
  'puducherry': 'Puducherry'
};

// State codes for GST numbers (first 2 digits)
export const GST_STATE_CODES = {
  'jammu and kashmir': '01',
  'himachal pradesh': '02',
  'punjab': '03',
  'chandigarh': '04',
  'uttarakhand': '05',
  'haryana': '06',
  'delhi': '07',
  'rajasthan': '08',
  'uttar pradesh': '09',
  'bihar': '10',
  'sikkim': '11',
  'arunachal pradesh': '12',
  'nagaland': '13',
  'manipur': '14',
  'mizoram': '15',
  'tripura': '16',
  'meghalaya': '17',
  'assam': '18',
  'west bengal': '19',
  'jharkhand': '20',
  'odisha': '21',
  'chhattisgarh': '22',
  'madhya pradesh': '23',
  'gujarat': '24',
  'dadra and nagar haveli and daman and diu': '25',
  'goa': '30',
  'maharashtra': '27',
  'karnataka': '29',
  'andhra pradesh': '37',
  'telangana': '36',
  'kerala': '32',
  'tamil nadu': '33',
  'puducherry': '34',
  'andaman and nicobar islands': '35',
  'lakshadweep': '31'
};

// GST Exemption Categories
export const GST_EXEMPTIONS = {
  EDUCATION: 'education',
  HEALTHCARE: 'healthcare',
  AGRICULTURE: 'agriculture',
  EXPORTS: 'exports',
  CHARITABLE: 'charitable',
  GOVERNMENT: 'government'
};

// GST Calculation Methods
export const GST_CALCULATION_METHODS = {
  EXCLUSIVE: 'exclusive', // GST added to base amount
  INCLUSIVE: 'inclusive'  // GST included in total amount
};

// GST Return Filing Frequencies
export const GST_FILING_FREQUENCIES = {
  MONTHLY: 'monthly',
  QUARTERLY: 'quarterly',
  ANNUAL: 'annual'
};

// HSN (Harmonized System of Nomenclature) Codes
export const COMMON_HSN_CODES = {
  ELECTRONICS: {
    MOBILE_PHONES: '8517',
    COMPUTERS: '8471',
    TELEVISIONS: '8528',
    AIR_CONDITIONERS: '8415',
    REFRIGERATORS: '8418',
    WASHING_MACHINES: '8450'
  },
  FURNITURE: {
    WOODEN_FURNITURE: '9403',
    METAL_FURNITURE: '9403',
    OFFICE_FURNITURE: '9403',
    MATTRESSES: '9404',
    CUSHIONS: '9404'
  }
};

// GST Validation Patterns
export const GST_VALIDATION = {
  GST_NUMBER_PATTERN: /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}[Z]{1}[0-9A-Z]{1}$/,
  PAN_PATTERN: /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/,
  GST_NUMBER_LENGTH: 15,
  PAN_LENGTH: 10
};

// GST Error Messages
export const GST_ERROR_MESSAGES = {
  INVALID_GST_FORMAT: 'Invalid GST number format',
  INVALID_STATE_CODE: 'Invalid state code in GST number',
  INVALID_PAN: 'Invalid PAN in GST number',
  GST_NUMBER_REQUIRED: 'GST number is required for business customers',
  INVALID_HSN_CODE: 'Invalid HSN code format',
  CALCULATION_ERROR: 'Error in GST calculation'
};

// Tax Slabs
export const GST_TAX_SLABS = [
  { rate: 0, description: 'Nil rated' },
  { rate: 5, description: 'Essential goods' },
  { rate: 12, description: 'Standard goods' },
  { rate: 18, description: 'Most goods and services' },
  { rate: 28, description: 'Luxury and sin goods' }
];

// Default GST Settings
export const DEFAULT_GST_SETTINGS = {
  enableGST: true,
  defaultRate: GST_RATES.TOTAL,
  calculationMethod: GST_CALCULATION_METHODS.EXCLUSIVE,
  showGSTBreakdown: true,
  requireGSTForBusiness: true,
  autoDetectInterState: true,
  defaultHSNCode: '9999' // General HSN code
};

// Company GST Registration Types
export const GST_REGISTRATION_TYPES = {
  REGULAR: 'regular',
  COMPOSITION: 'composition',
  CASUAL: 'casual',
  NON_RESIDENT: 'non_resident',
  VOLUNTARY: 'voluntary'
};

export default {
  GST_TYPES,
  GST_RATES,
  PRODUCT_GST_RATES,
  GST_DISPLAY_NAMES,
  INDIAN_STATES,
  GST_STATE_CODES,
  GST_EXEMPTIONS,
  GST_CALCULATION_METHODS,
  GST_FILING_FREQUENCIES,
  COMMON_HSN_CODES,
  GST_VALIDATION,
  GST_ERROR_MESSAGES,
  GST_TAX_SLABS,
  DEFAULT_GST_SETTINGS,
  GST_REGISTRATION_TYPES
};