// Company information for quotations
export const COMPANIES = {
  ELECTRONICS_1: {
    id: "electronics_1",
    code: "EL1",
    name: "TechWorld Electronics",
    address: "123 Tech Street, Electronics District",
    city: "Ahmedabad",
    state: "Gujarat",
    pincode: "380001",
    phone: "+91 98765 43210",
    email: "info@techworld.com",
    gstNumber: "24AAAAA0000A1Z5",
    website: "www.techworld.com",
    logo: null, // Can be added later
    category: "electronics"
  },
  ELECTRONICS_2: {
    id: "electronics_2", 
    code: "EL2",
    name: "Digital Solutions Pvt Ltd",
    address: "456 Innovation Hub, IT Park",
    city: "Gandhinagar",
    state: "Gujarat", 
    pincode: "382001",
    phone: "+91 98765 43211",
    email: "contact@digitalsolutions.com",
    gstNumber: "24BBBBB0000B1Z5",
    website: "www.digitalsolutions.com",
    logo: null,
    category: "electronics"
  },
  FURNITURE_1: {
    id: "furniture_1",
    code: "FN1", 
    name: "Royal Furniture House",
    address: "789 Furniture Lane, Design District",
    city: "Surat",
    state: "Gujarat",
    pincode: "395001", 
    phone: "+91 98765 43212",
    email: "sales@royalfurniture.com",
    gstNumber: "24CCCCC0000C1Z5",
    website: "www.royalfurniture.com",
    logo: null,
    category: "furniture"
  },
  FURNITURE_2: {
    id: "furniture_2",
    code: "FN2",
    name: "Modern Living Solutions",
    address: "321 Home Decor Street, Lifestyle Mall",
    city: "Rajkot", 
    state: "Gujarat",
    pincode: "360001",
    phone: "+91 98765 43213",
    email: "info@modernliving.com", 
    gstNumber: "24DDDDD0000D1Z5",
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
    "Subject to Surat jurisdiction only."
  ]
};

export const getDefaultTermsConditions = (category) => {
  return DEFAULT_TERMS_CONDITIONS[category] || DEFAULT_TERMS_CONDITIONS.electronics;
};