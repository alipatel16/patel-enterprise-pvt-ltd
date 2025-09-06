import { USER_ROLES } from '../../utils/constants/appConstants';

/**
 * Role service for managing user roles and permissions
 */
class RoleService {
  /**
   * Get all available roles
   * @returns {Array} Array of role objects
   */
  getAllRoles() {
    return [
      {
        value: USER_ROLES.ADMIN,
        label: 'Administrator',
        description: 'Full access to all features and data',
        permissions: [
          'create_invoices',
          'manage_customers',
          'manage_employees',
          'view_reports',
          'manage_settings',
          'delete_data',
          'export_data'
        ]
      },
      {
        value: USER_ROLES.EMPLOYEE,
        label: 'Employee',
        description: 'Limited access based on assigned permissions',
        permissions: [
          'create_invoices',
          'manage_customers',
          'view_reports'
        ]
      }
    ];
  }

  /**
   * Get role by value
   * @param {string} roleValue - Role value
   * @returns {Object|null} Role object
   */
  getRoleByValue(roleValue) {
    const roles = this.getAllRoles();
    return roles.find(role => role.value === roleValue) || null;
  }

  /**
   * Get role display name
   * @param {string} roleValue - Role value
   * @returns {string} Role display name
   */
  getRoleDisplayName(roleValue) {
    const role = this.getRoleByValue(roleValue);
    return role ? role.label : roleValue;
  }

  /**
   * Check if role has specific permission
   * @param {string} roleValue - Role value
   * @param {string} permission - Permission to check
   * @returns {boolean} Whether role has permission
   */
  hasPermission(roleValue, permission) {
    const role = this.getRoleByValue(roleValue);
    return role ? role.permissions.includes(permission) : false;
  }

  /**
   * Check if user can perform action
   * @param {Object} user - User object
   * @param {string} action - Action to check
   * @param {Object} context - Additional context
   * @returns {boolean} Whether user can perform action
   */
  canPerformAction(user, action, context = {}) {
    if (!user || !user.role) {
      return false;
    }

    switch (action) {
      case 'create_invoice':
        return user.role === USER_ROLES.ADMIN || 
               (user.role === USER_ROLES.EMPLOYEE && user.canCreateInvoices);

      case 'manage_customers':
        return user.role === USER_ROLES.ADMIN || 
               (user.role === USER_ROLES.EMPLOYEE && user.canManageCustomers);

      case 'manage_employees':
        return user.role === USER_ROLES.ADMIN;

      case 'view_reports':
        return user.role === USER_ROLES.ADMIN || 
               (user.role === USER_ROLES.EMPLOYEE && user.canViewReports);

      case 'delete_invoice':
        return user.role === USER_ROLES.ADMIN;

      case 'delete_customer':
        return user.role === USER_ROLES.ADMIN;

      case 'delete_employee':
        return user.role === USER_ROLES.ADMIN && context.employeeId !== user.uid;

      case 'edit_invoice':
        return user.role === USER_ROLES.ADMIN || 
               (user.role === USER_ROLES.EMPLOYEE && user.canCreateInvoices);

      case 'edit_customer':
        return user.role === USER_ROLES.ADMIN || 
               (user.role === USER_ROLES.EMPLOYEE && user.canManageCustomers);

      case 'edit_employee':
        return user.role === USER_ROLES.ADMIN;

      case 'view_sensitive_data':
        return user.role === USER_ROLES.ADMIN;

      case 'export_data':
        return user.role === USER_ROLES.ADMIN || 
               (user.role === USER_ROLES.EMPLOYEE && user.canViewReports);

      case 'manage_settings':
        return user.role === USER_ROLES.ADMIN;

      default:
        return false;
    }
  }

  /**
   * Get default permissions for role
   * @param {string} roleValue - Role value
   * @returns {Object} Default permissions object
   */
  getDefaultPermissions(roleValue) {
    switch (roleValue) {
      case USER_ROLES.ADMIN:
        return {
          canCreateInvoices: true,
          canManageCustomers: true,
          canManageEmployees: true,
          canViewReports: true,
          canDeleteData: true,
          canExportData: true,
          canManageSettings: true
        };

      case USER_ROLES.EMPLOYEE:
        return {
          canCreateInvoices: true,
          canManageCustomers: true,
          canManageEmployees: false,
          canViewReports: false,
          canDeleteData: false,
          canExportData: false,
          canManageSettings: false
        };

      default:
        return {
          canCreateInvoices: false,
          canManageCustomers: false,
          canManageEmployees: false,
          canViewReports: false,
          canDeleteData: false,
          canExportData: false,
          canManageSettings: false
        };
    }
  }

  /**
   * Validate role assignment
   * @param {string} assignerRole - Role of user doing the assignment
   * @param {string} targetRole - Role being assigned
   * @returns {boolean} Whether assignment is valid
   */
  canAssignRole(assignerRole, targetRole) {
    // Only admins can assign roles
    if (assignerRole !== USER_ROLES.ADMIN) {
      return false;
    }

    // All role assignments are valid for admins
    return Object.values(USER_ROLES).includes(targetRole);
  }

  /**
   * Get role hierarchy level
   * @param {string} roleValue - Role value
   * @returns {number} Role hierarchy level (higher number = more permissions)
   */
  getRoleHierarchy(roleValue) {
    switch (roleValue) {
      case USER_ROLES.ADMIN:
        return 100;
      case USER_ROLES.EMPLOYEE:
        return 10;
      default:
        return 0;
    }
  }

  /**
   * Check if role A is higher than role B
   * @param {string} roleA - First role
   * @param {string} roleB - Second role
   * @returns {boolean} Whether role A is higher
   */
  isHigherRole(roleA, roleB) {
    return this.getRoleHierarchy(roleA) > this.getRoleHierarchy(roleB);
  }

  /**
   * Get accessible menu items for role
   * @param {string} roleValue - Role value
   * @param {Object} userPermissions - User-specific permissions
   * @returns {Array} Accessible menu items
   */
  getAccessibleMenuItems(roleValue, userPermissions = {}) {
    const menuItems = [
      {
        id: 'dashboard',
        label: 'Dashboard',
        path: '/dashboard',
        icon: 'dashboard',
        requiredPermission: null // Always accessible
      },
      {
        id: 'customers',
        label: 'Customers',
        path: '/customers',
        icon: 'people',
        requiredPermission: 'manage_customers'
      },
      {
        id: 'sales',
        label: 'Sales',
        path: '/sales',
        icon: 'receipt',
        requiredPermission: 'create_invoices'
      },
      {
        id: 'employees',
        label: 'Employees',
        path: '/employees',
        icon: 'badge',
        requiredPermission: 'manage_employees'
      }
    ];

    return menuItems.filter(item => {
      if (!item.requiredPermission) return true;
      
      return this.hasPermission(roleValue, item.requiredPermission) ||
             userPermissions[this.permissionToUserField(item.requiredPermission)];
    });
  }

  /**
   * Convert permission to user field name
   * @param {string} permission - Permission name
   * @returns {string} User field name
   */
  permissionToUserField(permission) {
    const mapping = {
      'create_invoices': 'canCreateInvoices',
      'manage_customers': 'canManageCustomers',
      'manage_employees': 'canManageEmployees',
      'view_reports': 'canViewReports',
      'delete_data': 'canDeleteData',
      'export_data': 'canExportData',
      'manage_settings': 'canManageSettings'
    };

    return mapping[permission] || permission;
  }
}

// Create and export singleton instance
const roleService = new RoleService();
export default roleService;