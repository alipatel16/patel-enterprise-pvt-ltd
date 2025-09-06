import { ref, push, set, get, update, remove, query, orderByChild, equalTo, limitToFirst, startAt, endAt } from 'firebase/database';
import { database } from '../firebase/config';
import { getEmployeesPath } from '../../utils/helpers/firebasePathHelper';
import { v4 as uuidv4 } from 'uuid';

class EmployeeService {
  /**
   * Get all employees for a specific user type
   * @param {string} userType - 'electronics' or 'furniture'
   * @param {Object} options - Query options (limit, offset, search, etc.)
   * @returns {Promise<Object>}
   */
  async getEmployees(userType, options = {}) {
    try {
      const { limit = 10, offset = 0, search = '', sortBy = 'name', sortOrder = 'asc' } = options;
      const employeesPath = getEmployeesPath(userType);
      const employeesRef = ref(database, employeesPath);

      let queryRef = employeesRef;

      // Apply search if provided
      if (search) {
        queryRef = query(employeesRef, orderByChild('name'), startAt(search), endAt(search + '\uf8ff'));
      } else {
        // Apply sorting
        queryRef = query(employeesRef, orderByChild(sortBy));
      }

      const snapshot = await get(queryRef);
      
      if (!snapshot.exists()) {
        return {
          employees: [],
          total: 0,
          hasMore: false
        };
      }

      let employees = [];
      snapshot.forEach((childSnapshot) => {
        employees.push({
          id: childSnapshot.key,
          ...childSnapshot.val()
        });
      });

      // Sort in memory if needed (Firebase doesn't support descending order directly)
      if (sortOrder === 'desc') {
        employees.reverse();
      }

      // Apply pagination
      const total = employees.length;
      const startIndex = offset;
      const endIndex = startIndex + limit;
      const paginatedEmployees = employees.slice(startIndex, endIndex);

      return {
        employees: paginatedEmployees,
        total,
        hasMore: endIndex < total,
        currentPage: Math.floor(offset / limit) + 1,
        totalPages: Math.ceil(total / limit)
      };
    } catch (error) {
      console.error('Error fetching employees:', error);
      throw new Error('Failed to fetch employees');
    }
  }

  /**
   * Get employee by ID
   * @param {string} userType 
   * @param {string} employeeId 
   * @returns {Promise<Object|null>}
   */
  async getEmployeeById(userType, employeeId) {
    try {
      const employeePath = getEmployeesPath(userType, employeeId);
      const employeeRef = ref(database, employeePath);
      const snapshot = await get(employeeRef);
      
      if (!snapshot.exists()) {
        return null;
      }

      return {
        id: snapshot.key,
        ...snapshot.val()
      };
    } catch (error) {
      console.error('Error fetching employee:', error);
      throw new Error('Failed to fetch employee');
    }
  }

  /**
   * Search employees by various fields
   * @param {string} userType 
   * @param {string} searchTerm 
   * @param {Array} searchFields 
   * @returns {Promise<Array>}
   */
  async searchEmployees(userType, searchTerm, searchFields = ['name', 'email', 'phone', 'employeeId']) {
    try {
      const employeesPath = getEmployeesPath(userType);
      const employeesRef = ref(database, employeesPath);
      const snapshot = await get(employeesRef);
      
      if (!snapshot.exists()) {
        return [];
      }

      const employees = [];
      const searchLower = searchTerm.toLowerCase();

      snapshot.forEach((childSnapshot) => {
        const employee = {
          id: childSnapshot.key,
          ...childSnapshot.val()
        };

        // Check if any of the search fields match
        const matches = searchFields.some(field => {
          const fieldValue = employee[field];
          return fieldValue && fieldValue.toLowerCase().includes(searchLower);
        });

        if (matches) {
          employees.push(employee);
        }
      });

      return employees;
    } catch (error) {
      console.error('Error searching employees:', error);
      throw new Error('Failed to search employees');
    }
  }

  /**
   * Create new employee
   * @param {string} userType 
   * @param {Object} employeeData 
   * @returns {Promise<Object>}
   */
  async createEmployee(userType, employeeData) {
    try {
      // Validate required fields
      this.validateEmployeeData(employeeData);

      // Check if employee ID is already in use
      if (employeeData.employeeId) {
        const existingEmployee = await this.getEmployeeByEmployeeId(userType, employeeData.employeeId);
        if (existingEmployee) {
          throw new Error('Employee ID is already in use');
        }
      }

      const employeesPath = getEmployeesPath(userType);
      const employeesRef = ref(database, employeesPath);
      
      const newEmployee = {
        ...employeeData,
        id: uuidv4(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isActive: true
      };

      const newEmployeeRef = push(employeesRef);
      await set(newEmployeeRef, newEmployee);

      return {
        id: newEmployeeRef.key,
        ...newEmployee
      };
    } catch (error) {
      console.error('Error creating employee:', error);
      throw new Error(error.message || 'Failed to create employee');
    }
  }

  /**
   * Update employee
   * @param {string} userType 
   * @param {string} employeeId 
   * @param {Object} updates 
   * @returns {Promise<Object>}
   */
  async updateEmployee(userType, employeeId, updates) {
    try {
      // Validate updates
      if (updates.email || updates.phone || updates.name || updates.employeeId) {
        this.validateEmployeeData(updates, false);
      }

      // Check if employee ID is already in use (excluding current employee)
      if (updates.employeeId) {
        const existingEmployee = await this.getEmployeeByEmployeeId(userType, updates.employeeId);
        if (existingEmployee && existingEmployee.id !== employeeId) {
          throw new Error('Employee ID is already in use');
        }
      }

      const employeePath = getEmployeesPath(userType, employeeId);
      const employeeRef = ref(database, employeePath);
      
      // Check if employee exists
      const snapshot = await get(employeeRef);
      if (!snapshot.exists()) {
        throw new Error('Employee not found');
      }

      const updatedData = {
        ...updates,
        updatedAt: new Date().toISOString()
      };

      await update(employeeRef, updatedData);

      // Return updated employee
      const updatedSnapshot = await get(employeeRef);
      return {
        id: updatedSnapshot.key,
        ...updatedSnapshot.val()
      };
    } catch (error) {
      console.error('Error updating employee:', error);
      throw new Error(error.message || 'Failed to update employee');
    }
  }

  /**
   * Delete employee
   * @param {string} userType 
   * @param {string} employeeId 
   * @returns {Promise<void>}
   */
  async deleteEmployee(userType, employeeId) {
    try {
      const employeePath = getEmployeesPath(userType, employeeId);
      const employeeRef = ref(database, employeePath);
      
      // Check if employee exists
      const snapshot = await get(employeeRef);
      if (!snapshot.exists()) {
        throw new Error('Employee not found');
      }

      await remove(employeeRef);
    } catch (error) {
      console.error('Error deleting employee:', error);
      throw new Error(error.message || 'Failed to delete employee');
    }
  }

  /**
   * Get employee by employee ID
   * @param {string} userType 
   * @param {string} employeeId 
   * @returns {Promise<Object|null>}
   */
  async getEmployeeByEmployeeId(userType, employeeId) {
    try {
      const employeesPath = getEmployeesPath(userType);
      const queryRef = query(
        ref(database, employeesPath),
        orderByChild('employeeId'),
        equalTo(employeeId)
      );

      const snapshot = await get(queryRef);
      
      if (!snapshot.exists()) {
        return null;
      }

      let employee = null;
      snapshot.forEach((childSnapshot) => {
        employee = {
          id: childSnapshot.key,
          ...childSnapshot.val()
        };
      });

      return employee;
    } catch (error) {
      console.error('Error fetching employee by employee ID:', error);
      throw new Error('Failed to fetch employee');
    }
  }

  /**
   * Get employees by role
   * @param {string} userType 
   * @param {string} role 
   * @returns {Promise<Array>}
   */
  async getEmployeesByRole(userType, role) {
    try {
      const employeesPath = getEmployeesPath(userType);
      const queryRef = query(
        ref(database, employeesPath),
        orderByChild('role'),
        equalTo(role)
      );

      const snapshot = await get(queryRef);
      
      if (!snapshot.exists()) {
        return [];
      }

      const employees = [];
      snapshot.forEach((childSnapshot) => {
        employees.push({
          id: childSnapshot.key,
          ...childSnapshot.val()
        });
      });

      return employees;
    } catch (error) {
      console.error('Error fetching employees by role:', error);
      throw new Error('Failed to fetch employees by role');
    }
  }

  /**
   * Get employee suggestions for autocomplete
   * @param {string} userType 
   * @param {string} searchTerm 
   * @param {number} limit 
   * @returns {Promise<Array>}
   */
  async getEmployeeSuggestions(userType, searchTerm, limit = 5) {
    try {
      const employees = await this.searchEmployees(userType, searchTerm, ['name', 'employeeId']);
      
      return employees.slice(0, limit).map(employee => ({
        id: employee.id,
        label: `${employee.name} (${employee.employeeId})`,
        name: employee.name,
        employeeId: employee.employeeId,
        role: employee.role,
        department: employee.department
      }));
    } catch (error) {
      console.error('Error fetching employee suggestions:', error);
      throw new Error('Failed to fetch employee suggestions');
    }
  }

  /**
   * Validate employee data
   * @param {Object} employeeData 
   * @param {boolean} isCreate 
   */
  validateEmployeeData(employeeData, isCreate = true) {
    const requiredFields = isCreate 
      ? ['name', 'employeeId', 'phone', 'role', 'department', 'dateOfJoining']
      : [];

    // Check required fields for creation
    if (isCreate) {
      for (const field of requiredFields) {
        if (!employeeData[field] || employeeData[field].toString().trim() === '') {
          throw new Error(`${field} is required`);
        }
      }
    }

    // Validate email format if provided
    if (employeeData.email && employeeData.email.trim() !== '') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(employeeData.email)) {
        throw new Error('Invalid email format');
      }
    }

    // Validate phone format
    if (employeeData.phone) {
      const phoneRegex = /^[\d\s\-\+\(\)]{10,15}$/;
      if (!phoneRegex.test(employeeData.phone.replace(/\s/g, ''))) {
        throw new Error('Invalid phone number format');
      }
    }

    // Validate employee ID format
    if (employeeData.employeeId) {
      if (employeeData.employeeId.trim().length < 3) {
        throw new Error('Employee ID must be at least 3 characters');
      }
    }

    // Validate salary if provided
    if (employeeData.salary !== undefined && employeeData.salary !== null) {
      if (isNaN(employeeData.salary) || employeeData.salary < 0) {
        throw new Error('Invalid salary amount');
      }
    }

    // Validate date of joining
    if (employeeData.dateOfJoining) {
      const joiningDate = new Date(employeeData.dateOfJoining);
      const today = new Date();
      if (joiningDate > today) {
        throw new Error('Date of joining cannot be in the future');
      }
    }
  }

  /**
   * Get employee statistics
   * @param {string} userType 
   * @returns {Promise<Object>}
   */
  async getEmployeeStats(userType) {
    try {
      const employeesPath = getEmployeesPath(userType);
      const employeesRef = ref(database, employeesPath);
      const snapshot = await get(employeesRef);
      
      if (!snapshot.exists()) {
        return {
          total: 0,
          active: 0,
          inactive: 0,
          byRole: {},
          byDepartment: {}
        };
      }

      let stats = {
        total: 0,
        active: 0,
        inactive: 0,
        byRole: {},
        byDepartment: {}
      };

      snapshot.forEach((childSnapshot) => {
        const employee = childSnapshot.val();
        stats.total++;
        
        if (employee.isActive !== false) {
          stats.active++;
        } else {
          stats.inactive++;
        }
        
        // Count by role
        if (employee.role) {
          stats.byRole[employee.role] = (stats.byRole[employee.role] || 0) + 1;
        }
        
        // Count by department
        if (employee.department) {
          stats.byDepartment[employee.department] = (stats.byDepartment[employee.department] || 0) + 1;
        }
      });

      return stats;
    } catch (error) {
      console.error('Error fetching employee stats:', error);
      throw new Error('Failed to fetch employee statistics');
    }
  }
}

export default new EmployeeService();