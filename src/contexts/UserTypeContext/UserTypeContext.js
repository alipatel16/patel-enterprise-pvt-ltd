import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from '../AuthContext/AuthContext';
import { USER_TYPES, APP_COLORS } from '../../utils/constants/appConstants';
import { 
  getCollectionPath,
  getCustomersPath,
  getEmployeesPath,
  getSalesPath,
  getInvoicesPath,
  getUserTypeDisplayName
} from '../../utils/helpers/firebasePathHelper';

// Create context
const UserTypeContext = createContext();

// Custom hook to use UserType context
export const useUserType = () => {
  const context = useContext(UserTypeContext);
  if (!context) {
    throw new Error('useUserType must be used within a UserTypeProvider');
  }
  return context;
};

// UserType Provider component
export const UserTypeProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [userType, setUserType] = useState(null);

  // Set user type when user changes
  useEffect(() => {
    if (isAuthenticated && user?.userType) {
      setUserType(user.userType);
    } else {
      setUserType(null);
    }
  }, [isAuthenticated, user]);

  // Helper functions to check user type
  const isElectronics = () => {
    return userType === USER_TYPES.ELECTRONICS;
  };

  const isFurniture = () => {
    return userType === USER_TYPES.FURNITURE;
  };

  // Get display name
  const getDisplayName = () => {
    return userType ? getUserTypeDisplayName(userType) : '';
  };

  // Get theme colors based on user type
  const getThemeColors = () => {
    if (!userType) return APP_COLORS.ELECTRONICS;
    return APP_COLORS[userType.toUpperCase()] || APP_COLORS.ELECTRONICS;
  };

  // Firebase path helpers for current user type
  const getPath = (collection, documentId = null) => {
    if (!userType) {
      throw new Error('User type not available');
    }
    return getCollectionPath(userType, collection, documentId);
  };

  const getCustomersPathForCurrentUser = (customerId = null) => {
    if (!userType) {
      throw new Error('User type not available');
    }
    return getCustomersPath(userType, customerId);
  };

  const getEmployeesPathForCurrentUser = (employeeId = null) => {
    if (!userType) {
      throw new Error('User type not available');
    }
    return getEmployeesPath(userType, employeeId);
  };

  const getSalesPathForCurrentUser = (saleId = null) => {
    if (!userType) {
      throw new Error('User type not available');
    }
    return getSalesPath(userType, saleId);
  };

  const getInvoicesPathForCurrentUser = (invoiceId = null) => {
    if (!userType) {
      throw new Error('User type not available');
    }
    return getInvoicesPath(userType, invoiceId);
  };

  // Get app title based on user type
  const getAppTitle = () => {
    const baseTitle = 'Showroom Management';
    if (!userType) return baseTitle;
    
    const typeDisplayName = getUserTypeDisplayName(userType);
    return `${typeDisplayName} ${baseTitle}`;
  };

  // Get navigation items based on user type
  const getNavigationItems = () => {
    const typeDisplayName = getDisplayName();
    
    return [
      {
        label: 'Dashboard',
        path: '/dashboard',
        icon: 'dashboard'
      },
      {
        label: 'Customers',
        path: '/customers',
        icon: 'people',
        description: `Manage ${typeDisplayName.toLowerCase()} customers`
      },
      {
        label: 'Employees',
        path: '/employees',
        icon: 'badge',
        description: `Manage ${typeDisplayName.toLowerCase()} employees`,
        adminOnly: true
      },
      {
        label: 'Sales',
        path: '/sales',
        icon: 'receipt',
        description: `Manage ${typeDisplayName.toLowerCase()} sales`
      }
    ];
  };

  // Get business-specific configurations
  const getBusinessConfig = () => {
    const baseConfig = {
      currency: '₹',
      gstEnabled: true,
      emiEnabled: true,
      deliveryTracking: true
    };

    // Add business-specific configurations
    if (userType === USER_TYPES.ELECTRONICS) {
      return {
        ...baseConfig,
        itemUnit: 'piece',
        commonItems: ['Mobile', 'Laptop', 'TV', 'AC', 'Refrigerator'],
        businessSpecific: {
          warrantyTracking: true,
          serialNumberRequired: true
        }
      };
    }

    if (userType === USER_TYPES.FURNITURE) {
      return {
        ...baseConfig,
        itemUnit: 'piece',
        commonItems: ['Sofa', 'Bed', 'Table', 'Chair', 'Wardrobe'],
        businessSpecific: {
          materialTracking: true,
          customDesign: true
        }
      };
    }

    return baseConfig;
  };

  // Context value
  const value = {
    // State
    userType,
    
    // Helper functions
    isElectronics,
    isFurniture,
    getDisplayName,
    getThemeColors,
    getAppTitle,
    getNavigationItems,
    getBusinessConfig,
    
    // Path helpers
    getPath,
    getCustomersPath: getCustomersPathForCurrentUser,
    getEmployeesPath: getEmployeesPathForCurrentUser,
    getSalesPath: getSalesPathForCurrentUser,
    getInvoicesPath: getInvoicesPathForCurrentUser,
    
    // Validation
    isValidUserType: () => !!userType && Object.values(USER_TYPES).includes(userType)
  };

  return (
    <UserTypeContext.Provider value={value}>
      {children}
    </UserTypeContext.Provider>
  );
};

export default UserTypeContext;