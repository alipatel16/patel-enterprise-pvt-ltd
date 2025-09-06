import { USER_TYPES, APP_COLORS } from '../../utils/constants/appConstants';

/**
 * User type service for managing user type specific configurations
 */
class UserTypeService {
  /**
   * Get all available user types
   * @returns {Array} Array of user type objects
   */
  getAllUserTypes() {
    return [
      {
        value: USER_TYPES.ELECTRONICS,
        label: 'Electronics Showroom',
        description: 'Manage electronics products, warranties, and technical services',
        icon: 'electrical_services',
        features: [
          'Product warranties',
          'Serial number tracking',
          'Technical support',
          'Installation services',
          'Extended warranties'
        ],
        commonProducts: [
          'Mobile Phones',
          'Laptops',
          'Televisions',
          'Air Conditioners',
          'Refrigerators',
          'Washing Machines',
          'Audio Systems',
          'Gaming Consoles'
        ],
        colors: APP_COLORS.ELECTRONICS
      },
      {
        value: USER_TYPES.FURNITURE,
        label: 'Furniture Showroom',
        description: 'Manage furniture products, custom designs, and delivery services',
        icon: 'chair',
        features: [
          'Custom designs',
          'Material selection',
          'Delivery & installation',
          'Maintenance services',
          'Interior consultation'
        ],
        commonProducts: [
          'Sofas & Couches',
          'Beds & Mattresses',
          'Dining Tables',
          'Office Chairs',
          'Wardrobes',
          'TV Units',
          'Bookshelves',
          'Coffee Tables'
        ],
        colors: APP_COLORS.FURNITURE
      }
    ];
  }

  /**
   * Get user type by value
   * @param {string} userTypeValue - User type value
   * @returns {Object|null} User type object
   */
  getUserTypeByValue(userTypeValue) {
    const userTypes = this.getAllUserTypes();
    return userTypes.find(type => type.value === userTypeValue) || null;
  }

  /**
   * Get user type display name
   * @param {string} userTypeValue - User type value
   * @returns {string} User type display name
   */
  getUserTypeDisplayName(userTypeValue) {
    const userType = this.getUserTypeByValue(userTypeValue);
    return userType ? userType.label : userTypeValue;
  }

  /**
   * Get user type colors
   * @param {string} userTypeValue - User type value
   * @returns {Object} Color configuration
   */
  getUserTypeColors(userTypeValue) {
    const userType = this.getUserTypeByValue(userTypeValue);
    if (!userType) {
      return APP_COLORS.ELECTRONICS; // Default fallback
    }

    const baseColors = userType.colors;
    
    return {
      primary: baseColors.primary,
      secondary: baseColors.secondary,
      primaryLight: this.lightenColor(baseColors.primary, 0.1),
      primaryDark: this.darkenColor(baseColors.primary, 0.1),
      secondaryLight: this.lightenColor(baseColors.secondary, 0.1),
      secondaryDark: this.darkenColor(baseColors.secondary, 0.1),
    };
  }

  /**
   * Get business-specific configuration
   * @param {string} userTypeValue - User type value
   * @returns {Object} Business configuration
   */
  getBusinessConfig(userTypeValue) {
    const userType = this.getUserTypeByValue(userTypeValue);
    
    const baseConfig = {
      currency: '₹',
      gstEnabled: true,
      emiEnabled: true,
      deliveryTracking: true,
      invoicePrefix: userTypeValue === USER_TYPES.ELECTRONICS ? 'ELE' : 'FUR'
    };

    if (!userType) {
      return baseConfig;
    }

    if (userTypeValue === USER_TYPES.ELECTRONICS) {
      return {
        ...baseConfig,
        itemUnit: 'piece',
        commonItems: userType.commonProducts,
        businessSpecific: {
          warrantyTracking: true,
          serialNumberRequired: true,
          technicalSupport: true,
          installationServices: true
        }
      };
    }

    if (userTypeValue === USER_TYPES.FURNITURE) {
      return {
        ...baseConfig,
        itemUnit: 'piece',
        commonItems: userType.commonProducts,
        businessSpecific: {
          materialTracking: true,
          customDesign: true,
          deliveryAssembly: true,
          interiorConsultation: true
        }
      };
    }

    return baseConfig;
  }

  /**
   * Get form fields specific to user type
   * @param {string} userTypeValue - User type value
   * @returns {Object} Form field configurations
   */
  getFormFields(userTypeValue) {
    const baseFields = {
      customer: ['name', 'phone', 'email', 'address', 'customerType', 'category'],
      invoice: ['customer', 'items', 'paymentTerms', 'deliveryDetails'],
      employee: ['name', 'email', 'phone', 'role', 'department']
    };

    if (userTypeValue === USER_TYPES.ELECTRONICS) {
      return {
        ...baseFields,
        invoice: [...baseFields.invoice, 'warrantyDetails', 'serialNumbers'],
        product: ['name', 'model', 'brand', 'serialNumber', 'warranty', 'specifications']
      };
    }

    if (userTypeValue === USER_TYPES.FURNITURE) {
      return {
        ...baseFields,
        invoice: [...baseFields.invoice, 'materialDetails', 'customDesign'],
        product: ['name', 'material', 'dimensions', 'color', 'style', 'customOptions']
      };
    }

    return baseFields;
  }

  /**
   * Get dashboard widgets for user type
   * @param {string} userTypeValue - User type value
   * @returns {Array} Widget configurations
   */
  getDashboardWidgets(userTypeValue) {
    const commonWidgets = [
      { id: 'sales_overview', title: 'Sales Overview', size: 'large' },
      { id: 'recent_customers', title: 'Recent Customers', size: 'medium' },
      { id: 'pending_payments', title: 'Pending Payments', size: 'medium' },
      { id: 'recent_activity', title: 'Recent Activity', size: 'large' }
    ];

    if (userTypeValue === USER_TYPES.ELECTRONICS) {
      return [
        ...commonWidgets,
        { id: 'warranty_alerts', title: 'Warranty Alerts', size: 'medium' },
        { id: 'technical_support', title: 'Technical Support', size: 'medium' }
      ];
    }

    if (userTypeValue === USER_TYPES.FURNITURE) {
      return [
        ...commonWidgets,
        { id: 'delivery_schedule', title: 'Delivery Schedule', size: 'medium' },
        { id: 'custom_orders', title: 'Custom Orders', size: 'medium' }
      ];
    }

    return commonWidgets;
  }

  /**
   * Validate user type
   * @param {string} userTypeValue - User type value
   * @returns {boolean} Whether user type is valid
   */
  isValidUserType(userTypeValue) {
    return Object.values(USER_TYPES).includes(userTypeValue);
  }

  /**
   * Get default settings for user type
   * @param {string} userTypeValue - User type value
   * @returns {Object} Default settings
   */
  getDefaultSettings(userTypeValue) {
    const baseSettings = {
      language: 'en',
      currency: 'INR',
      dateFormat: 'DD/MM/YYYY',
      numberFormat: 'en-IN',
      gstEnabled: true,
      emiEnabled: true
    };

    const userType = this.getUserTypeByValue(userTypeValue);
    if (!userType) {
      return baseSettings;
    }

    return {
      ...baseSettings,
      businessType: userTypeValue,
      features: userType.features,
      defaultProducts: userType.commonProducts
    };
  }

  /**
   * Helper function to lighten color
   * @param {string} color - Hex color
   * @param {number} amount - Amount to lighten (0-1)
   * @returns {string} Lightened color
   */
  lightenColor(color, amount) {
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);

    const newR = Math.min(255, Math.floor(r + (255 - r) * amount));
    const newG = Math.min(255, Math.floor(g + (255 - g) * amount));
    const newB = Math.min(255, Math.floor(b + (255 - b) * amount));

    return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
  }

  /**
   * Helper function to darken color
   * @param {string} color - Hex color
   * @param {number} amount - Amount to darken (0-1)
   * @returns {string} Darkened color
   */
  darkenColor(color, amount) {
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);

    const newR = Math.max(0, Math.floor(r * (1 - amount)));
    const newG = Math.max(0, Math.floor(g * (1 - amount)));
    const newB = Math.max(0, Math.floor(b * (1 - amount)));

    return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
  }
}

// Create and export singleton instance
const userTypeService = new UserTypeService();
export default userTypeService;