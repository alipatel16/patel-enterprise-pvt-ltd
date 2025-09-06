import customerService from '../api/customerService';
import employeeService from '../api/employeeService';
import salesService from '../api/salesService';
import notificationService from '../api/notificationService';
import authService from '../auth/authService';
import roleService from '../auth/roleService';
import userTypeService from '../auth/userTypeService';

/**
 * Service factory for centralized service management
 */
class ServiceFactory {
  constructor() {
    this.services = new Map();
    this.initializeServices();
  }

  /**
   * Initialize all services
   */
  initializeServices() {
    // API Services
    this.services.set('customer', customerService);
    this.services.set('employee', employeeService);
    this.services.set('sales', salesService);
    this.services.set('notification', notificationService);

    // Auth Services
    this.services.set('auth', authService);
    this.services.set('role', roleService);
    this.services.set('userType', userTypeService);
  }

  /**
   * Get service by name
   * @param {string} serviceName - Service name
   * @returns {Object} Service instance
   */
  getService(serviceName) {
    const service = this.services.get(serviceName);
    if (!service) {
      throw new Error(`Service '${serviceName}' not found`);
    }
    return service;
  }

  /**
   * Get customer service
   * @returns {Object} Customer service
   */
  getCustomerService() {
    return this.getService('customer');
  }

  /**
   * Get employee service
   * @returns {Object} Employee service
   */
  getEmployeeService() {
    return this.getService('employee');
  }

  /**
   * Get sales service
   * @returns {Object} Sales service
   */
  getSalesService() {
    return this.getService('sales');
  }

  /**
   * Get notification service
   * @returns {Object} Notification service
   */
  getNotificationService() {
    return this.getService('notification');
  }

  /**
   * Get auth service
   * @returns {Object} Auth service
   */
  getAuthService() {
    return this.getService('auth');
  }

  /**
   * Get role service
   * @returns {Object} Role service
   */
  getRoleService() {
    return this.getService('role');
  }

  /**
   * Get user type service
   * @returns {Object} User type service
   */
  getUserTypeService() {
    return this.getService('userType');
  }

  /**
   * Get all services
   * @returns {Map} All services map
   */
  getAllServices() {
    return this.services;
  }

  /**
   * Register custom service
   * @param {string} name - Service name
   * @param {Object} service - Service instance
   */
  registerService(name, service) {
    this.services.set(name, service);
  }

  /**
   * Unregister service
   * @param {string} name - Service name
   */
  unregisterService(name) {
    this.services.delete(name);
  }

  /**
   * Check if service exists
   * @param {string} name - Service name
   * @returns {boolean} Whether service exists
   */
  hasService(name) {
    return this.services.has(name);
  }

  /**
   * Get services by category
   * @param {string} category - Service category
   * @returns {Array} Services in category
   */
  getServicesByCategory(category) {
    const categoryMap = {
      api: ['customer', 'employee', 'sales', 'notification'],
      auth: ['auth', 'role', 'userType'],
      all: Array.from(this.services.keys())
    };

    const serviceNames = categoryMap[category] || [];
    return serviceNames.map(name => ({
      name,
      service: this.services.get(name)
    }));
  }

  /**
   * Initialize service with configuration
   * @param {string} serviceName - Service name
   * @param {Object} config - Service configuration
   */
  configureService(serviceName, config) {
    const service = this.getService(serviceName);
    if (service && typeof service.configure === 'function') {
      service.configure(config);
    }
  }

  /**
   * Get service health status
   * @param {string} serviceName - Service name
   * @returns {Promise<Object>} Service health status
   */
  async getServiceHealth(serviceName) {
    try {
      const service = this.getService(serviceName);
      
      if (typeof service.healthCheck === 'function') {
        return await service.healthCheck();
      }

      return {
        service: serviceName,
        status: 'healthy',
        message: 'Service is available'
      };
    } catch (error) {
      return {
        service: serviceName,
        status: 'unhealthy',
        message: error.message
      };
    }
  }

  /**
   * Get all services health status
   * @returns {Promise<Array>} All services health status
   */
  async getAllServicesHealth() {
    const healthChecks = Array.from(this.services.keys()).map(serviceName => 
      this.getServiceHealth(serviceName)
    );

    return await Promise.all(healthChecks);
  }

  /**
   * Reset service state
   * @param {string} serviceName - Service name
   */
  resetService(serviceName) {
    const service = this.getService(serviceName);
    if (service && typeof service.reset === 'function') {
      service.reset();
    }
  }

  /**
   * Reset all services
   */
  resetAllServices() {
    this.services.forEach((service, name) => {
      this.resetService(name);
    });
  }

  /**
   * Get service dependencies
   * @param {string} serviceName - Service name
   * @returns {Array} Service dependencies
   */
  getServiceDependencies(serviceName) {
    const dependencies = {
      customer: ['auth', 'userType'],
      employee: ['auth', 'userType', 'role'],
      sales: ['auth', 'userType', 'customer'],
      notification: ['auth', 'userType'],
      auth: [],
      role: ['auth'],
      userType: []
    };

    return dependencies[serviceName] || [];
  }

  /**
   * Check if service dependencies are ready
   * @param {string} serviceName - Service name
   * @returns {boolean} Whether dependencies are ready
   */
  areDependenciesReady(serviceName) {
    const dependencies = this.getServiceDependencies(serviceName);
    
    return dependencies.every(depName => {
      const depService = this.services.get(depName);
      return depService && (
        typeof depService.isReady !== 'function' || 
        depService.isReady()
      );
    });
  }

  /**
   * Wait for service dependencies to be ready
   * @param {string} serviceName - Service name
   * @param {number} timeout - Timeout in milliseconds
   * @returns {Promise<boolean>} Whether dependencies are ready
   */
  async waitForDependencies(serviceName, timeout = 5000) {
    const startTime = Date.now();
    
    return new Promise((resolve) => {
      const checkDependencies = () => {
        if (this.areDependenciesReady(serviceName)) {
          resolve(true);
          return;
        }

        if (Date.now() - startTime > timeout) {
          resolve(false);
          return;
        }

        setTimeout(checkDependencies, 100);
      };

      checkDependencies();
    });
  }

  /**
   * Create service proxy with error handling
   * @param {string} serviceName - Service name
   * @returns {Proxy} Service proxy
   */
  createServiceProxy(serviceName) {
    const service = this.getService(serviceName);
    
    return new Proxy(service, {
      get(target, prop) {
        const value = target[prop];
        
        if (typeof value === 'function') {
          return async (...args) => {
            try {
              return await value.apply(target, args);
            } catch (error) {
              console.error(`Error in ${serviceName}.${prop}:`, error);
              throw error;
            }
          };
        }
        
        return value;
      }
    });
  }

  /**
   * Get service with error handling
   * @param {string} serviceName - Service name
   * @returns {Proxy} Service proxy with error handling
   */
  getServiceSafe(serviceName) {
    return this.createServiceProxy(serviceName);
  }
}

// Create and export singleton instance
export const serviceFactory = new ServiceFactory();
export default serviceFactory;