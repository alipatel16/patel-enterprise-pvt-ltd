// Company information for quotations
export const COMPANIES = {
  ELECTRONICS_1: {
    id: "electronics_1",
    code: "EL1",
    name: "Patel Electronics And Furniture",
    address: "1st Floor Patel House near Petrol Pump Mandal Road Viramgam",
    city: "Ahmedabad",
    state: "Gujarat",
    pincode: "382150",
    phone: "+91-7862819198",
    email: "info@techworld.com",
    gstNumber: "24AAVFP7956R1ZW",
    website: "www.techworld.com",
    logo: null, // Can be added later
    category: "electronics"
  },
  ELECTRONICS_2: {
    id: "electronics_2", 
    code: "EL2",
    name: "Patel Engineering Works",
    address: "Opposite Mataji Temple Bhutiyajin Compound Mandal Road Viramgam",
    city: "Ahmedabad",
    state: "Gujarat", 
    pincode: "382150",
    phone: "+91-8154884077",
    email: "contact@digitalsolutions.com",
    gstNumber: "24ABCPP2196D1ZV",
    website: "www.digitalsolutions.com",
    logo: null,
    category: "electronics"
  },
  FURNITURE_1: {
    id: "furniture_1",
    code: "FN1", 
    name: "M-Raj Steel Sydicate",
    address: "Opposite Dinesh Farsal Mandal Road Viramgam",
    city: "Ahmedabad",
    state: "Gujarat",
    pincode: "382150", 
    phone: "+91-8200152937",
    email: "sales@royalfurniture.com",
    gstNumber: "24ACCPP4650M1ZF",
    website: "www.royalfurniture.com",
    logo: null,
    category: "furniture"
  },
  FURNITURE_2: {
    id: "furniture_2",
    code: "FN2",
    name: "Patel Furniture",
    address: "Above SBI Bank Opp. APMC Market Seva Sadan Road",
    city: "Viramgam", 
    state: "Gujarat",
    pincode: "382150",
    phone: "+91-7600946872",
    email: "info@modernliving.com", 
    gstNumber: "24CAIPP6969F1Z8",
    website: "www.modernliving.com",
    logo: null,
    category: "furniture"
  }
};

// Helper functions
export const getCompaniesByCategory = (category) => {
  return Object.values(COMPANIES).filter(company => company.category === category);
};

export const getCompanyById = (companyId) => {
  return Object.values(COMPANIES).find(company => company.id === companyId);
};

export const getCompanyByCode = (code) => {
  return Object.values(COMPANIES).find(company => company.code === code);
};

export const getAllCompanies = () => {
  return Object.values(COMPANIES);
};

// Default terms and conditions
export const DEFAULT_TERMS_CONDITIONS = {
  electronics: [
    "Prices are subject to change without prior notice.",
    "Delivery charges extra as applicable.",
    "Warranty terms as per manufacturer's policy.",
    "Payment terms: 50% advance, balance on delivery.",
    "Goods once sold cannot be returned or exchanged.",
    "Subject to Ahmedabad jurisdiction only.",
    "Technical specifications may vary as per availability."
  ],
  furniture: [
    "Prices are subject to change without prior notice.", 
    "Transportation and installation charges extra.",
    "Warranty: 1 year on manufacturing defects only.",
    "Payment terms: 50% advance, balance on delivery.",
    "Custom made items cannot be returned or exchanged.",
    "Delivery time: 15-30 working days from confirmation.",
    "Subject to Ahmedabad jurisdiction only."
  ]
};

export const getDefaultTermsConditions = (category) => {
  return DEFAULT_TERMS_CONDITIONS[category] || DEFAULT_TERMS_CONDITIONS.electronics;
};