/**
 * User Type Constants
 * Defines business types and their configurations for the showroom management system
 */

// User Types (Business Types)
export const USER_TYPES = {
  ELECTRONICS: 'electronics',
  FURNITURE: 'furniture'
};

// User Type Display Names
export const USER_TYPE_DISPLAY_NAMES = {
  [USER_TYPES.ELECTRONICS]: 'Electronics Store',
  [USER_TYPES.FURNITURE]: 'Furniture Store'
};

// App Color Schemes by User Type
export const APP_COLORS = {
  ELECTRONICS: {
    primary: '#1976d2',      // Blue
    secondary: '#03dac6',    // Teal
    accent: '#ff4081',       // Pink
    background: '#f5f5f5',
    surface: '#ffffff',
    success: '#4caf50',
    warning: '#ff9800',
    error: '#f44336',
    info: '#2196f3'
  },
  FURNITURE: {
    primary: '#8d6e63',      // Brown
    secondary: '#a1887f',    // Light Brown
    accent: '#ff7043',       // Orange
    background: '#fafafa',
    surface: '#ffffff',
    success: '#66bb6a',
    warning: '#ffa726',
    error: '#e57373',
    info: '#42a5f5'
  }
};

// Business Type Configurations
export const USER_TYPE_CONFIG = {
  [USER_TYPES.ELECTRONICS]: {
    label: 'Electronics Store',
    description: 'Manage electronics inventory, sales, and customer relationships',
    icon: 'tv',
    colors: APP_COLORS.ELECTRONICS,
    features: {
      warrantyTracking: true,
      serialNumberRequired: true,
      technicalSupport: true,
      installationServices: true,
      bulkOrders: true,
      emiSupport: true
    },
    commonProducts: [
      'Mobile Phones',
      'Laptops',
      'Desktop Computers',
      'Televisions',
      'Air Conditioners',
      'Refrigerators',
      'Washing Machines',
      'Audio Systems',
      'Gaming Consoles',
      'Smart Watches',
      'Cameras',
      'Tablets'
    ],
    productFields: [
      { name: 'model', label: 'Model Number', required: true },
      { name: 'brand', label: 'Brand', required: true },
      { name: 'serialNumber', label: 'Serial Number', required: true },
      { name: 'warranty', label: 'Warranty Period', required: true },
      { name: 'specifications', label: 'Technical Specifications', required: false },
      { name: 'powerConsumption', label: 'Power Consumption', required: false }
    ],
    invoicePrefix: 'ELE',
    defaultUnit: 'piece',
    gstCategory: 'electronics',
    businessSpecific: {
      warranty: {
        defaultPeriod: 12, // months
        extendedWarrantyAvailable: true,
        warrantyTypes: ['manufacturer', 'extended', 'comprehensive']
      },
      technicalSupport: {
        available: true,
        supportTypes: ['installation', 'troubleshooting', 'maintenance'],
        supportChannels: ['phone', 'email', 'onsite']
      },
      certification: {
        required: ['BIS', 'FCC'],
        optional: ['Energy Star', 'CE']
      }
    }
  },

  [USER_TYPES.FURNITURE]: {
    label: 'Furniture Store',
    description: 'Manage furniture inventory, custom orders, and interior solutions',
    icon: 'chair',
    colors: APP_COLORS.FURNITURE,
    features: {
      materialTracking: true,
      customDesign: true,
      deliveryAssembly: true,
      interiorConsultation: true,
      bulkOrders: true,
      emiSupport: true
    },
    commonProducts: [
      'Sofas',
      'Beds',
      'Dining Tables',
      'Chairs',
      'Wardrobes',
      'TV Units',
      'Study Tables',
      'Bookshelves',
      'Coffee Tables',
      'Recliners',
      'Mattresses',
      'Office Furniture'
    ],
    productFields: [
      { name: 'material', label: 'Material', required: true },
      { name: 'dimensions', label: 'Dimensions (L×W×H)', required: true },
      { name: 'color', label: 'Color/Finish', required: true },
      { name: 'style', label: 'Style/Design', required: false },
      { name: 'customOptions', label: 'Customization Options', required: false },
      { name: 'assemblyRequired', label: 'Assembly Required', required: false }
    ],
    invoicePrefix: 'FUR',
    defaultUnit: 'piece',
    gstCategory: 'furniture',
    businessSpecific: {
      materials: {
        wood: ['Teak', 'Sheesham', 'Mango Wood', 'Pine', 'Oak'],
        metal: ['Steel', 'Iron', 'Aluminum', 'Brass'],
        fabric: ['Cotton', 'Polyester', 'Leather', 'Velvet'],
        other: ['Glass', 'Plastic', 'Rattan', 'Bamboo']
      },
      customization: {
        available: true,
        options: ['size', 'color', 'material', 'design'],
        leadTime: '2-4 weeks',
        additionalCost: 'variable'
      },
      delivery: {
        assemblyService: true,
        installationService: true,
        packagingOptions: ['standard', 'premium', 'white_glove']
      }
    }
  }
};

// Navigation Items by User Type
export const USER_TYPE_NAVIGATION = {
  [USER_TYPES.ELECTRONICS]: [
    {
      label: 'Dashboard',
      path: '/dashboard',
      icon: 'dashboard'
    },
    {
      label: 'Customers',
      path: '/customers',
      icon: 'people',
      description: 'Manage electronics customers'
    },
    {
      label: 'Sales',
      path: '/sales',
      icon: 'receipt',
      description: 'Electronics sales and invoices'
    },
    {
      label: 'Technical Support',
      path: '/support',
      icon: 'support',
      description: 'Warranty and technical support'
    },
    {
      label: 'Employees',
      path: '/employees',
      icon: 'badge',
      adminOnly: true
    }
  ],

  [USER_TYPES.FURNITURE]: [
    {
      label: 'Dashboard',
      path: '/dashboard',
      icon: 'dashboard'
    },
    {
      label: 'Customers',
      path: '/customers',
      icon: 'people',
      description: 'Manage furniture customers'
    },
    {
      label: 'Sales',
      path: '/sales',
      icon: 'receipt',
      description: 'Furniture sales and orders'
    },
    {
      label: 'Custom Orders',
      path: '/custom-orders',
      icon: 'design_services',
      description: 'Manage custom furniture orders'
    },
    {
      label: 'Delivery',
      path: '/delivery',
      icon: 'local_shipping',
      description: 'Delivery and assembly tracking'
    },
    {
      label: 'Employees',
      path: '/employees',
      icon: 'badge',
      adminOnly: true
    }
  ]
};

// Dashboard Widget Configurations by User Type
export const DASHBOARD_WIDGETS = {
  [USER_TYPES.ELECTRONICS]: [
    {
      id: 'sales_overview',
      title: 'Sales Overview',
      type: 'chart',
      size: 'large',
      order: 1
    },
    {
      id: 'recent_customers',
      title: 'Recent Customers',
      type: 'list',
      size: 'medium',
      order: 2
    },
    {
      id: 'pending_payments',
      title: 'Pending Payments',
      type: 'table',
      size: 'medium',
      order: 3
    },
    {
      id: 'warranty_alerts',
      title: 'Warranty Alerts',
      type: 'notifications',
      size: 'medium',
      order: 4,
      businessSpecific: true
    },
    {
      id: 'technical_support',
      title: 'Technical Support Queue',
      type: 'list',
      size: 'medium',
      order: 5,
      businessSpecific: true
    },
    {
      id: 'inventory_alerts',
      title: 'Low Stock Alerts',
      type: 'notifications',
      size: 'small',
      order: 6
    }
  ],

  [USER_TYPES.FURNITURE]: [
    {
      id: 'sales_overview',
      title: 'Sales Overview',
      type: 'chart',
      size: 'large',
      order: 1
    },
    {
      id: 'recent_customers',
      title: 'Recent Customers',
      type: 'list',
      size: 'medium',
      order: 2
    },
    {
      id: 'delivery_schedule',
      title: 'Delivery Schedule',
      type: 'calendar',
      size: 'medium',
      order: 3,
      businessSpecific: true
    },
    {
      id: 'custom_orders',
      title: 'Custom Orders Progress',
      type: 'progress',
      size: 'medium',
      order: 4,
      businessSpecific: true
    },
    {
      id: 'pending_payments',
      title: 'Pending Payments',
      type: 'table',
      size: 'medium',
      order: 5
    },
    {
      id: 'material_inventory',
      title: 'Material Inventory',
      type: 'grid',
      size: 'small',
      order: 6,
      businessSpecific: true
    }
  ]
};

// Business Type Validation Rules
export const USER_TYPE_VALIDATION = {
  VALID_TYPES: Object.values(USER_TYPES),
  REQUIRED_FIELDS: ['userType'],
  BUSINESS_SPECIFIC_VALIDATIONS: {
    [USER_TYPES.ELECTRONICS]: {
      serialNumber: /^[A-Z0-9]{8,20}$/,
      model: /^[A-Za-z0-9\s\-]{3,50}$/,
      warranty: /^[1-9][0-9]?$/ // 1-99 months
    },
    [USER_TYPES.FURNITURE]: {
      dimensions: /^[0-9]+(\.[0-9]+)?\s*[×x]\s*[0-9]+(\.[0-9]+)?\s*[×x]\s*[0-9]+(\.[0-9]+)?$/,
      material: /^[A-Za-z\s]{2,30}$/,
      color: /^[A-Za-z\s]{2,30}$/
    }
  }
};

// Document Templates by User Type
export const DOCUMENT_TEMPLATES = {
  [USER_TYPES.ELECTRONICS]: {
    invoice: 'electronics_invoice_template',
    warranty: 'warranty_certificate_template',
    quotation: 'electronics_quotation_template',
    receipt: 'electronics_receipt_template'
  },
  [USER_TYPES.FURNITURE]: {
    invoice: 'furniture_invoice_template',
    estimate: 'furniture_estimate_template',
    quotation: 'furniture_quotation_template',
    receipt: 'furniture_receipt_template',
    customOrder: 'custom_order_template'
  }
};

// Default Settings by User Type
export const DEFAULT_USER_TYPE_SETTINGS = {
  [USER_TYPES.ELECTRONICS]: {
    currency: '₹',
    defaultTaxRate: 18,
    invoicePrefix: 'ELE',
    invoiceNumberFormat: 'ELE-{YYYY}-{MM}-{NNNN}',
    defaultPaymentTerms: 15,
    emiEnabled: true,
    warrantyTracking: true,
    serialNumberTracking: true
  },
  [USER_TYPES.FURNITURE]: {
    currency: '₹',
    defaultTaxRate: 12,
    invoicePrefix: 'FUR',
    invoiceNumberFormat: 'FUR-{YYYY}-{MM}-{NNNN}',
    defaultPaymentTerms: 30,
    emiEnabled: true,
    customOrderTracking: true,
    materialTracking: true
  }
};

export default {
  USER_TYPES,
  USER_TYPE_DISPLAY_NAMES,
  APP_COLORS,
  USER_TYPE_CONFIG,
  USER_TYPE_NAVIGATION,
  DASHBOARD_WIDGETS,
  USER_TYPE_VALIDATION,
  DOCUMENT_TEMPLATES,
  DEFAULT_USER_TYPE_SETTINGS
};