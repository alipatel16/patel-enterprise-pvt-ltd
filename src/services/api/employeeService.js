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
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { auth } from "../firebase/config";

class EmployeeService {
  /**
   * Get all employees for a specific user type
   * @param {string} userType - 'electronics' or 'furniture'
   * @param {Object} options - Query options (search, sortBy, sortOrder, etc.)
   * @returns {Promise<Object>}
   */
  async getEmployees(userType, options = {}) {
    try {
      const { search = "", sortBy = "name", sortOrder = "asc" } = options;
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
        if (
          employeeData.id === employeeId ||
          employeeData.employeeId === employeeId
        ) {
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
   * IMPROVED: Create Firebase Auth user with BETTER session preservation
   * This uses a different Firebase Auth instance to prevent admin logout
   * @private
   * @param {Object} userData - User data
   * @param {Object} adminCredentials - Admin credentials to restore session
   * @returns {Promise<Object>} Created user
   */
  async createUserWithSessionPreservation(userData, adminCredentials) {
    try {
      console.log("Creating user account with session preservation...");

      // Store the current admin user info before creating new user
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error("No admin user currently signed in");
      }

      console.log("Current admin user:", currentUser.email);

      // Create new user account (this will automatically sign in the new user)
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        userData.email,
        userData.password
      );

      const newUser = userCredential.user;
      console.log("New user created:", newUser.uid);

      // Store user data in database BEFORE restoring admin session
      const userDbRef = ref(database, `users/${newUser.uid}`);
      const userDbData = {
        uid: newUser.uid,
        email: userData.email,
        name: userData.name,
        phone: userData.phone,
        role: userData.role,
        userType: userData.userType,
        canCreateInvoices: userData.canCreateInvoices || false,
        canManageCustomers: userData.canManageCustomers || false,
        canViewReports: userData.canViewReports || false,
        isActive: true,
        createdAt: new Date().toISOString(),
      };

      await set(userDbRef, userDbData);
      console.log("User data stored in database");

      // CRITICAL: Immediately restore the admin session before any other operations
      console.log("Restoring admin session immediately...");
      await signInWithEmailAndPassword(
        auth,
        adminCredentials.email,
        adminCredentials.password
      );
      console.log("Admin session restored successfully");

      // Verify admin is signed back in
      const restoredUser = auth.currentUser;
      if (!restoredUser || restoredUser.email !== adminCredentials.email) {
        console.error("Admin session restoration failed");
        throw new Error("Failed to restore admin session properly");
      }

      console.log("✅ Admin session verified:", restoredUser.email);

      return {
        uid: newUser.uid,
        email: userData.email,
        ...userDbData,
      };
    } catch (error) {
      console.error("Error creating user with session preservation:", error);

      // EMERGENCY: Try to restore admin session at all costs
      try {
        console.log("Emergency admin session restoration...");
        await signInWithEmailAndPassword(
          auth,
          adminCredentials.email,
          adminCredentials.password
        );
        console.log("Emergency restoration successful");
      } catch (emergencyError) {
        console.error(
          "CRITICAL: Failed to restore admin session:",
          emergencyError
        );
        // This is a critical error - the admin is now logged out
      }

      throw error;
    }
  }

  /**
   * Create new employee AND user account - IMPROVED VERSION
   * @param {string} userType
   * @param {Object} employeeData
   * @param {Object} adminCredentials - Admin email/password for session restoration
   * @returns {Promise<Object>}
   */
  async createEmployee(userType, employeeData, adminCredentials = null) {
    let createdEmployee = null;
    let createdUser = null;

    try {
      console.log("Creating employee and user account:", employeeData);

      // Validate admin credentials
      if (!adminCredentials?.email || !adminCredentials?.password) {
        throw new Error(
          "Admin credentials (email and password) are required for session preservation"
        );
      }

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

      // Validate password for user account creation
      if (!transformedData.password) {
        throw new Error("Password is required for creating user account");
      }

      if (transformedData.password.length < 6) {
        throw new Error("Password must be at least 6 characters");
      }

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

      // Check if email is already in use
      if (transformedData.email) {
        const existingEmployeeByEmail = await this.getEmployeeByEmail(
          userType,
          transformedData.email
        );
        if (existingEmployeeByEmail) {
          throw new Error("Email is already in use by another employee");
        }
      }

      // Step 1: Create user account with improved session preservation
      console.log("Step 1: Creating user account with session preservation...");
      const userData = {
        name: transformedData.name,
        email: transformedData.email.toLowerCase(),
        phone: transformedData.phone,
        password: transformedData.password,
        role: transformedData.role,
        userType: userType,
        canCreateInvoices: transformedData.canCreateInvoices || false,
        canManageCustomers: transformedData.canManageCustomers || false,
        canViewReports: transformedData.canViewReports || false,
      };

      try {
        createdUser = await this.createUserWithSessionPreservation(
          userData,
          adminCredentials
        );
        console.log(
          "✅ User account created and admin session preserved:",
          createdUser.uid
        );
      } catch (authError) {
        console.error("Failed to create user account:", authError);
        throw new Error(`Failed to create user account: ${authError.message}`);
      }

      // Step 2: Create employee record
      console.log("Step 2: Creating employee record...");
      const employeesPath = getEmployeesPath(userType);
      const employeesRef = ref(database, employeesPath);

      const newEmployee = {
        ...transformedData,
        id: uuidv4(),
        userId: createdUser.uid, // Link to the created user
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isActive: true,
      };

      // Remove password from employee data (it's stored in auth)
      delete newEmployee.password;
      delete newEmployee.confirmPassword;

      const newEmployeeRef = push(employeesRef);
      await set(newEmployeeRef, newEmployee);

      createdEmployee = {
        id: newEmployeeRef.key,
        ...newEmployee,
      };

      console.log("Employee record created successfully:", createdEmployee.id);

      // Step 3: Update user profile with employee ID
      try {
        const userRef = ref(database, `users/${createdUser.uid}`);
        await update(userRef, {
          employeeId: transformedData.employeeId,
          employeeFirebaseId: newEmployeeRef.key,
          updatedAt: new Date().toISOString(),
        });
        console.log("User profile updated with employee information");
      } catch (profileError) {
        console.warn("Failed to update user profile:", profileError);
        // Non-critical error, continue
      }

      // Final verification that admin is still signed in
      const finalUser = auth.currentUser;
      if (!finalUser || finalUser.email !== adminCredentials.email) {
        console.warn(
          "Admin session may have been compromised during operation"
        );
        try {
          await signInWithEmailAndPassword(
            auth,
            adminCredentials.email,
            adminCredentials.password
          );
          console.log("Final admin session restoration completed");
        } catch (finalError) {
          console.error("Failed final admin session restoration:", finalError);
        }
      }

      console.log("✅ Employee and user account created successfully!");
      console.log("✅ Admin session maintained throughout the process!");

      return createdEmployee;
    } catch (error) {
      console.error("Error creating employee:", error);

      // Enhanced rollback strategy
      console.log("Starting enhanced rollback process...");

      // If employee was created but something failed after, remove the employee
      if (createdEmployee) {
        try {
          const employeePath = getEmployeesPath(userType, createdEmployee.id);
          const employeeRef = ref(database, employeePath);
          await remove(employeeRef);
          console.log("Employee record rolled back successfully");
        } catch (rollbackError) {
          console.error("Failed to rollback employee record:", rollbackError);
        }
      }

      // If user was created but employee creation failed, mark user as inactive
      if (createdUser && !createdEmployee) {
        try {
          const userRef = ref(database, `users/${createdUser.uid}`);
          await update(userRef, {
            isActive: false,
            deletedAt: new Date().toISOString(),
            note: "User created but employee creation failed - marked for cleanup",
          });
          console.log("User account marked for cleanup");
        } catch (rollbackError) {
          console.error("Failed to rollback user account:", rollbackError);
          console.error(
            "CRITICAL: User account exists without employee record"
          );
        }
      }

      // Final attempt to restore admin session if needed
      try {
        const currentUser = auth.currentUser;
        if (!currentUser || currentUser.email !== adminCredentials?.email) {
          console.log("Final emergency admin session restoration...");
          await signInWithEmailAndPassword(
            auth,
            adminCredentials.email,
            adminCredentials.password
          );
          console.log("Emergency admin restoration successful");
        }
      } catch (emergencyError) {
        console.error(
          "CRITICAL: Cannot restore admin session:",
          emergencyError
        );
      }

      throw new Error(
        error.message || "Failed to create employee and user account"
      );
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
        console.log(
          "Direct path not found, searching through all employees..."
        );
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
            if (
              employeeData.id === employeeId ||
              employeeData.employeeId === employeeId
            ) {
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
        if (
          employeeData.id === employeeId ||
          employeeData.employeeId === employeeId
        ) {
          employeeToDelete = {
            key: childSnapshot.key,
            data: employeeData,
          };
          return true; // Stop iteration
        }
      });

      if (employeeToDelete) {
        const finalRef = ref(
          database,
          `${employeesPath}/${employeeToDelete.key}`
        );
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
   * Get employee by email
   * @param {string} userType
   * @param {string} email
   * @returns {Promise<Object|null>}
   */
  async getEmployeeByEmail(userType, email) {
    try {
      const employeesPath = getEmployeesPath(userType);
      const employeesRef = ref(database, employeesPath);

      // Get all employees and filter in memory
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

        if (
          employee.email &&
          employee.email.toLowerCase() === email.toLowerCase()
        ) {
          foundEmployee = employee;
        }
      });

      return foundEmployee;
    } catch (error) {
      console.error("Error fetching employee by email:", error);
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
