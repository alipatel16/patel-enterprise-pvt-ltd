import {
  ref,
  push,
  set,
  get,
  update,
  remove,
  query,
  orderByChild,
  equalTo,
  limitToFirst,
  startAt,
  endAt,
} from "firebase/database";
import { database } from "../firebase/config";
import { getEmployeesPath } from "../../utils/helpers/firebasePathHelper";
import { v4 as uuidv4 } from "uuid";

class EmployeeService {
  /**
   * Get all employees for a specific user type
   * @param {string} userType - 'electronics' or 'furniture'
   * @param {Object} options - Query options (search, sortBy, sortOrder, etc.)
   * @returns {Promise<Object>}
   */
  async getEmployees(userType, options = {}) {
    try {
      const {
        search = "",
        sortBy = "name",
        sortOrder = "asc",
      } = options;
      const employeesPath = getEmployeesPath(userType);
      const employeesRef = ref(database, employeesPath);

      let queryRef = employeesRef;

      // Apply search if provided
      if (search) {
        queryRef = query(
          employeesRef,
          orderByChild("name"),
          startAt(search),
          endAt(search + "\uf8ff")
        );
      } else {
        // Apply sorting
        queryRef = query(employeesRef, orderByChild(sortBy));
      }

      const snapshot = await get(queryRef);

      if (!snapshot.exists()) {
        return {
          employees: [],
          total: 0,
          hasMore: false,
        };
      }

      let employees = [];
      snapshot.forEach((childSnapshot) => {
        employees.push({
          id: childSnapshot.key,
          ...childSnapshot.val(),
        });
      });

      // Sort in memory if needed (Firebase doesn't support descending order directly)
      if (sortOrder === "desc") {
        employees.reverse();
      }

      // Return all employees without pagination
      return {
        employees: employees,
        total: employees.length,
        hasMore: false,
        currentPage: 1,
        totalPages: 1,
      };
    } catch (error) {
      console.error("Error fetching employees:", error);
      throw new Error("Failed to fetch employees");
    }
  }

  /**
   * Get employee by ID - IMPROVED VERSION with multiple fallback strategies
   * @param {string} userType
   * @param {string} employeeId
   * @returns {Promise<Object|null>}
   */
  async getEmployeeById(userType, employeeId) {
    try {
      console.log("Looking for employee with ID:", employeeId);
      
      // Strategy 1: Try direct path lookup
      const employeePath = getEmployeesPath(userType, employeeId);
      const employeeRef = ref(database, employeePath);
      const snapshot = await get(employeeRef);

      if (snapshot.exists()) {
        console.log("Found employee using direct path");
        return {
          id: snapshot.key,
          ...snapshot.val(),
        };
      }

      // Strategy 2: Search through all employees to find by Firebase key
      console.log("Direct path not found, searching through all employees...");
      const employeesPath = getEmployeesPath(userType);
      const employeesRef = ref(database, employeesPath);
      const allSnapshot = await get(employeesRef);

      if (!allSnapshot.exists()) {
        console.log("No employees found in database");
        return null;
      }

      let foundEmployee = null;
      
      // Try to find by Firebase key
      allSnapshot.forEach((childSnapshot) => {
        if (childSnapshot.key === employeeId) {
          foundEmployee = {
            id: childSnapshot.key,
            ...childSnapshot.val(),
          };
          console.log("Found employee by Firebase key");
          return true; // Stop iteration
        }
      });

      if (foundEmployee) {
        return foundEmployee;
      }

      // Strategy 3: Search by employee data fields
      console.log("Firebase key not found, searching by employee data...");
      allSnapshot.forEach((childSnapshot) => {
        const employeeData = childSnapshot.val();
        // Check if the employeeId matches any of the employee's internal IDs
        if (employeeData.id === employeeId || employeeData.employeeId === employeeId) {
          foundEmployee = {
            id: childSnapshot.key,
            ...employeeData,
          };
          console.log("Found employee by employee data match");
          return true; // Stop iteration
        }
      });

      if (foundEmployee) {
        return foundEmployee;
      }

      console.log("Employee not found with any strategy");
      return null;

    } catch (error) {
      console.error("Error fetching employee:", error);
      throw new Error("Failed to fetch employee");
    }
  }

  /**
   * Search employees by various fields
   * @param {string} userType
   * @param {string} searchTerm
   * @param {Array} searchFields
   * @returns {Promise<Array>}
   */
  async searchEmployees(
    userType,
    searchTerm,
    searchFields = ["name", "email", "phone", "employeeId"]
  ) {
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
          ...childSnapshot.val(),
        };

        // Check if any of the search fields match
        const matches = searchFields.some((field) => {
          const fieldValue = employee[field];
          return fieldValue && fieldValue.toLowerCase().includes(searchLower);
        });

        if (matches) {
          employees.push(employee);
        }
      });

      return employees;
    } catch (error) {
      console.error("Error searching employees:", error);
      throw new Error("Failed to search employees");
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
      // Transform joinedDate to dateOfJoining for service compatibility
      const transformedData = {
        ...employeeData,
        dateOfJoining: employeeData.joinedDate || employeeData.dateOfJoining,
      };

      // Auto-generate employeeId if not provided
      if (!transformedData.employeeId) {
        transformedData.employeeId = await this.generateUniqueEmployeeId(
          userType,
          transformedData.name,
          transformedData.department
        );
      }

      // Validate required fields
      this.validateEmployeeData(transformedData);

      // Check if employee ID is already in use
      if (transformedData.employeeId) {
        const existingEmployee = await this.getEmployeeByEmployeeId(
          userType,
          transformedData.employeeId
        );
        if (existingEmployee) {
          throw new Error("Employee ID is already in use");
        }
      }

      const employeesPath = getEmployeesPath(userType);
      const employeesRef = ref(database, employeesPath);

      const newEmployee = {
        ...transformedData,
        id: uuidv4(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isActive: true,
      };

      const newEmployeeRef = push(employeesRef);
      await set(newEmployeeRef, newEmployee);

      return {
        id: newEmployeeRef.key,
        ...newEmployee,
      };
    } catch (error) {
      console.error("Error creating employee:", error);
      throw new Error(error.message || "Failed to create employee");
    }
  }

  /**
   * Generate unique employee ID
   * @param {string} userType
   * @param {string} name
   * @param {string} department
   * @returns {Promise<string>}
   */
  async generateUniqueEmployeeId(userType, name, department) {
    try {
      // Generate base ID
      const nameInitials = name
        .split(" ")
        .map((part) => part.charAt(0).toUpperCase())
        .join("");
      const deptPrefix = department
        ? department.substring(0, 3).toUpperCase()
        : "EMP";

      // Try to find a unique ID (max 5 attempts to avoid infinite loop)
      let sequence = 1;
      let employeeId;
      let isUnique = false;

      while (!isUnique && sequence <= 5) {
        const sequenceStr = sequence.toString().padStart(3, "0");
        employeeId = `${deptPrefix}${nameInitials}${sequenceStr}`;

        try {
          // Check if this ID already exists
          const existing = await this.getEmployeeByEmployeeId(
            userType,
            employeeId
          );
          if (!existing) {
            isUnique = true;
          } else {
            sequence++;
          }
        } catch (error) {
          console.warn("Error checking employee ID uniqueness:", error);
          // If check fails, use this ID anyway
          isUnique = true;
        }
      }

      if (!isUnique) {
        // Fallback to timestamp-based ID
        const timestamp = Date.now().toString().slice(-6);
        employeeId = `EMP${nameInitials}${timestamp}`;
      }

      return employeeId;
    } catch (error) {
      console.error("Error generating employee ID:", error);
      // Fallback ID
      const timestamp = Date.now().toString().slice(-6);
      return `EMP${timestamp}`;
    }
  }

  /**
   * Validate employee data
   * @param {Object} employeeData
   * @param {boolean} isCreate
   */
  validateEmployeeData(employeeData, isCreate = true) {
    // Updated required fields - removed employeeId since we auto-generate it
    // Also support both joinedDate and dateOfJoining
    const requiredFields = isCreate ? ["name", "phone", "role"] : [];

    // Check required fields for creation
    if (isCreate) {
      for (const field of requiredFields) {
        if (
          !employeeData[field] ||
          employeeData[field].toString().trim() === ""
        ) {
          throw new Error(`${field} is required`);
        }
      }

      // Check for date field (either joinedDate or dateOfJoining)
      if (!employeeData.joinedDate && !employeeData.dateOfJoining) {
        throw new Error("joinedDate is required");
      }
    }

    // Validate email format if provided
    if (employeeData.email && employeeData.email.trim() !== "") {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(employeeData.email)) {
        throw new Error("Invalid email format");
      }
    }

    // Validate phone format
    if (employeeData.phone) {
      const phoneRegex = /^[\d\s\-\+\(\)]{10,15}$/;
      if (!phoneRegex.test(employeeData.phone.replace(/\s/g, ""))) {
        throw new Error("Invalid phone number format");
      }
    }

    // Validate employee ID format if provided
    if (employeeData.employeeId) {
      if (employeeData.employeeId.trim().length < 3) {
        throw new Error("Employee ID must be at least 3 characters");
      }
    }

    // Validate salary if provided
    if (employeeData.salary !== undefined && employeeData.salary !== null) {
      if (isNaN(employeeData.salary) || employeeData.salary < 0) {
        throw new Error("Invalid salary amount");
      }
    }

    // Validate date of joining (support both field names)
    const joiningDate = employeeData.joinedDate || employeeData.dateOfJoining;
    if (joiningDate) {
      const date = new Date(joiningDate);
      const today = new Date();
      if (date > today) {
        throw new Error("Date of joining cannot be in the future");
      }
    }
  }

  /**
   * Update employee - IMPROVED VERSION with multiple fallback strategies
   * @param {string} userType
   * @param {string} employeeId
   * @param {Object} updates
   * @returns {Promise<Object>}
   */
  async updateEmployee(userType, employeeId, updates) {
    try {
      console.log("Updating employee with ID:", employeeId);
      console.log("Updates to apply:", updates);
      
      // Validate updates
      if (
        updates.email ||
        updates.phone ||
        updates.name ||
        updates.employeeId
      ) {
        this.validateEmployeeData(updates, false);
      }

      // Check if employee ID is already in use (excluding current employee)
      if (updates.employeeId) {
        const existingEmployee = await this.getEmployeeByEmployeeId(
          userType,
          updates.employeeId
        );
        if (existingEmployee && existingEmployee.id !== employeeId) {
          throw new Error("Employee ID is already in use");
        }
      }

      const employeesPath = getEmployeesPath(userType);
      let employeeRef = null;
      let foundKey = null;

      // Strategy 1: Try direct path lookup
      const employeePath = getEmployeesPath(userType, employeeId);
      employeeRef = ref(database, employeePath);
      let snapshot = await get(employeeRef);

      if (snapshot.exists()) {
        console.log("Found employee using direct path");
        foundKey = employeeId;
      } else {
        // Strategy 2: Search through all employees to find by Firebase key
        console.log("Direct path not found, searching through all employees...");
        const allEmployeesRef = ref(database, employeesPath);
        const allSnapshot = await get(allEmployeesRef);

        if (!allSnapshot.exists()) {
          throw new Error("No employees found in database");
        }

        // Try to find by Firebase key
        allSnapshot.forEach((childSnapshot) => {
          if (childSnapshot.key === employeeId) {
            foundKey = childSnapshot.key;
            console.log("Found employee by Firebase key");
            return true; // Stop iteration
          }
        });

        // Strategy 3: Search by employee data fields if not found by key
        if (!foundKey) {
          console.log("Firebase key not found, searching by employee data...");
          allSnapshot.forEach((childSnapshot) => {
            const employeeData = childSnapshot.val();
            if (employeeData.id === employeeId || employeeData.employeeId === employeeId) {
              foundKey = childSnapshot.key;
              console.log("Found employee by employee data match");
              return true; // Stop iteration
            }
          });
        }

        if (!foundKey) {
          throw new Error("Employee not found");
        }

        // Update reference to use the found key
        employeeRef = ref(database, `${employeesPath}/${foundKey}`);
        
        // Verify the employee exists with the found key
        snapshot = await get(employeeRef);
        if (!snapshot.exists()) {
          throw new Error("Employee not found after key resolution");
        }
      }

      console.log("Updating employee at path:", `${employeesPath}/${foundKey}`);

      const updatedData = {
        ...updates,
        updatedAt: new Date().toISOString(),
      };

      await update(employeeRef, updatedData);
      console.log("Employee updated successfully");

      // Return updated employee
      const updatedSnapshot = await get(employeeRef);
      return {
        id: updatedSnapshot.key,
        ...updatedSnapshot.val(),
      };
    } catch (error) {
      console.error("Error updating employee:", error);
      throw new Error(error.message || "Failed to update employee");
    }
  }

  /**
   * Delete employee - IMPROVED VERSION to handle Firebase keys properly
   * @param {string} userType
   * @param {string} employeeId
   * @returns {Promise<void>}
   */
  async deleteEmployee(userType, employeeId) {
    try {
      console.log("Deleting employee with ID:", employeeId);
      
      const employeesPath = getEmployeesPath(userType);
      
      // First, try to delete using the direct path
      const employeePath = getEmployeesPath(userType, employeeId);
      const employeeRef = ref(database, employeePath);
      
      const snapshot = await get(employeeRef);
      if (snapshot.exists()) {
        await remove(employeeRef);
        console.log("Employee deleted successfully using direct path");
        return;
      }

      // If not found, search through all employees to find by Firebase key
      const allEmployeesRef = ref(database, employeesPath);
      const allSnapshot = await get(allEmployeesRef);

      if (!allSnapshot.exists()) {
        throw new Error("No employees found");
      }

      let foundKey = null;
      allSnapshot.forEach((childSnapshot) => {
        if (childSnapshot.key === employeeId) {
          foundKey = childSnapshot.key;
          return true; // Stop iteration
        }
      });

      if (foundKey) {
        const correctRef = ref(database, `${employeesPath}/${foundKey}`);
        await remove(correctRef);
        console.log("Employee deleted successfully using found key");
        return;
      }

      // If still not found, try to find by employee data
      let employeeToDelete = null;
      allSnapshot.forEach((childSnapshot) => {
        const employeeData = childSnapshot.val();
        if (employeeData.id === employeeId || employeeData.employeeId === employeeId) {
          employeeToDelete = {
            key: childSnapshot.key,
            data: employeeData
          };
          return true; // Stop iteration
        }
      });

      if (employeeToDelete) {
        const finalRef = ref(database, `${employeesPath}/${employeeToDelete.key}`);
        await remove(finalRef);
        console.log("Employee deleted successfully using employee data match");
        return;
      }

      throw new Error("Employee not found");

    } catch (error) {
      console.error("Error deleting employee:", error);
      throw new Error(error.message || "Failed to delete employee");
    }
  }

  /**
   * Get employee by employee ID - FIXED VERSION (safer database query)
   * @param {string} userType
   * @param {string} employeeId
   * @returns {Promise<Object|null>}
   */
  async getEmployeeByEmployeeId(userType, employeeId) {
    try {
      const employeesPath = getEmployeesPath(userType);
      const employeesRef = ref(database, employeesPath);

      // Get all employees and filter in memory (safer than orderByChild query)
      const snapshot = await get(employeesRef);

      if (!snapshot.exists()) {
        return null;
      }

      let foundEmployee = null;
      snapshot.forEach((childSnapshot) => {
        const employee = {
          id: childSnapshot.key,
          ...childSnapshot.val(),
        };

        if (employee.employeeId === employeeId) {
          foundEmployee = employee;
        }
      });

      return foundEmployee;
    } catch (error) {
      console.error("Error fetching employee by employee ID:", error);
      // Return null instead of throwing error to avoid blocking creation
      return null;
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
      const employeesRef = ref(database, employeesPath);

      // Get all employees and filter in memory for better compatibility
      const snapshot = await get(employeesRef);

      if (!snapshot.exists()) {
        return [];
      }

      const employees = [];
      snapshot.forEach((childSnapshot) => {
        const employee = {
          id: childSnapshot.key,
          ...childSnapshot.val(),
        };

        if (employee.role === role) {
          employees.push(employee);
        }
      });

      return employees;
    } catch (error) {
      console.error("Error fetching employees by role:", error);
      throw new Error("Failed to fetch employees by role");
    }
  }

  /**
   * Get employee suggestions for autocomplete
   * @param {string} userType
   * @param {string} searchTerm
   * @param {number} limit
   * @returns {Promise<Array>}
   */
  async getEmployeeSuggestions(userType, searchTerm, limit = 10) {
    try {
      const employees = await this.searchEmployees(userType, searchTerm, [
        "name",
        "employeeId",
      ]);

      return employees.slice(0, limit).map((employee) => ({
        id: employee.id,
        label: `${employee.name} (${employee.employeeId})`,
        name: employee.name,
        employeeId: employee.employeeId,
        role: employee.role,
        department: employee.department,
      }));
    } catch (error) {
      console.error("Error fetching employee suggestions:", error);
      throw new Error("Failed to fetch employee suggestions");
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
          byDepartment: {},
        };
      }

      let stats = {
        total: 0,
        active: 0,
        inactive: 0,
        byRole: {},
        byDepartment: {},
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
          stats.byDepartment[employee.department] =
            (stats.byDepartment[employee.department] || 0) + 1;
        }
      });

      return stats;
    } catch (error) {
      console.error("Error fetching employee stats:", error);
      throw new Error("Failed to fetch employee statistics");
    }
  }
}

export default new EmployeeService();