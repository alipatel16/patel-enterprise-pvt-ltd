// src/services/checklistService.js - COMPLETE REWRITE: Check-in Based Generation
import {
  ref,
  get,
  set,
  push,
  update,
  remove,
  query,
  orderByChild,
  equalTo,
} from "firebase/database";
import { database } from "./firebase/config";
import { COLLECTIONS } from "../utils/constants/appConstants";

/**
 * Enhanced Checklist Service - Check-in Based Assignment Generation
 * Features:
 * - Check-in triggered assignment generation (no more login complexity)
 * - Automatic backup assignment on leave marking
 * - Calendar-based admin view
 * - Duplicate prevention
 * - Clean employee ID resolution
 * - Manual generation for admins
 */
class ChecklistService {
  constructor() {
    this.database = database;
    this.assignmentLocks = new Map(); // Assignment-level locks for duplicates
  }

  // ==================== PATH HELPERS ====================

  getChecklistsPath(userType, checklistId = null) {
    const basePath = `${userType}/${COLLECTIONS.CHECKLISTS}`;
    return checklistId ? `${basePath}/${checklistId}` : basePath;
  }

  getCompletionsPath(userType, completionId = null) {
    const basePath = `${userType}/${COLLECTIONS.CHECKLIST_COMPLETIONS}`;
    return completionId ? `${basePath}/${completionId}` : basePath;
  }

  getEmployeesPath(userType) {
    return `${userType}/${COLLECTIONS.EMPLOYEES}`;
  }

  getGenerationLockPath(userType, lockKey) {
    if (!userType || userType === "null" || userType === "undefined") {
      console.error("❌ Invalid userType for generation lock:", userType);
      throw new Error(`Invalid userType for generation lock: ${userType}`);
    }

    if (!lockKey) {
      console.error("❌ Invalid lockKey for generation lock:", lockKey);
      throw new Error(`Invalid lockKey for generation lock: ${lockKey}`);
    }

    const path = `${userType}/generation_locks/${lockKey}`;
    console.log("🔗 Generation lock path created:", path);
    return path;
  }

  // ==================== EMPLOYEE RESOLUTION ====================

  /**
   * Resolve employee ID from user object with multiple strategies
   */
  async resolveEmployeeId(user, userType) {
    try {
      console.log("=== RESOLVING EMPLOYEE ID ===");
      console.log("User object:", {
        uid: user?.uid,
        name: user?.name,
        employeeId: user?.employeeId,
      });

      // Strategy 1: Use employeeFirebaseId if available
      if (user?.employeeFirebaseId) {
        const employeeRef = ref(
          this.database,
          `${userType}/employees/${user.employeeFirebaseId}`
        );
        const snapshot = await get(employeeRef);
        if (snapshot.exists()) {
          const employeeData = snapshot.val();
          console.log("✅ Found via employeeFirebaseId:", employeeData.id);
          return employeeData.id;
        }
      }

      // Strategy 2: Search by employeeId field
      if (user?.employeeId) {
        const employees = await this.getAllEmployees(userType);
        const match = employees.find(
          (emp) => emp.employeeId === user.employeeId
        );
        if (match) {
          console.log("✅ Found via employeeId search:", match.id);
          return match.id;
        }
      }

      // Strategy 3: Search by name
      if (user?.name) {
        const employees = await this.getAllEmployees(userType);
        const match = employees.find((emp) => emp.name === user.name);
        if (match) {
          console.log("✅ Found via name search:", match.id);
          return match.id;
        }
      }

      // Strategy 4: Use uid as fallback
      console.log("⚠️ Using uid as fallback:", user?.uid);
      return user?.uid;
    } catch (error) {
      console.error("Error resolving employee ID:", error);
      return user?.uid;
    }
  }

  /**
   * Get all active employees
   */
  async getAllEmployees(userType) {
    try {
      const employeesRef = ref(this.database, this.getEmployeesPath(userType));
      const snapshot = await get(employeesRef);

      if (!snapshot.exists()) return [];

      const employees = [];
      snapshot.forEach((childSnapshot) => {
        const employeeData = childSnapshot.val();
        if (employeeData.isActive) {
          employees.push({
            id: employeeData.id || childSnapshot.key,
            firebaseId: childSnapshot.key,
            name: employeeData.name,
            email: employeeData.email,
            department: employeeData.department,
            employeeId: employeeData.employeeId,
            isActive: employeeData.isActive,
          });
        }
      });

      console.log(`Found ${employees.length} active employees`);
      return employees;
    } catch (error) {
      console.error("Error getting employees:", error);
      throw error;
    }
  }

  // ==================== CHECKLIST CRUD ====================

  /**
   * Create new checklist
   */
  async createChecklist(userType, checklistData, createdBy) {
    try {
      console.log("=== CREATING CHECKLIST ===");
      console.log("Data:", checklistData);

      const checklistsRef = ref(
        this.database,
        this.getChecklistsPath(userType)
      );
      const newChecklistRef = push(checklistsRef);

      const checklist = {
        ...checklistData,
        id: newChecklistRef.key,
        isActive: checklistData.isActive ?? true,
        createdBy: createdBy.uid,
        createdByName: createdBy.name,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await set(newChecklistRef, checklist);
      console.log("✅ Checklist created:", newChecklistRef.key);

      // Generate assignments for today if needed
      await this.generateTodayAssignments(userType, checklist);

      return checklist;
    } catch (error) {
      console.error("Error creating checklist:", error);
      throw error;
    }
  }

  /**
   * Get all checklists
   */
  async getChecklists(userType, filters = {}) {
    try {
      const checklistsRef = ref(
        this.database,
        this.getChecklistsPath(userType)
      );
      const snapshot = await get(checklistsRef);

      if (!snapshot.exists()) return [];

      let checklists = [];
      snapshot.forEach((childSnapshot) => {
        checklists.push({
          id: childSnapshot.key,
          ...childSnapshot.val(),
        });
      });

      // Apply filters
      if (filters.isActive !== undefined) {
        checklists = checklists.filter((c) => c.isActive === filters.isActive);
      }

      // Sort by creation date
      checklists.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      return checklists;
    } catch (error) {
      console.error("Error getting checklists:", error);
      throw error;
    }
  }

  /**
   * Update checklist
   */
  async updateChecklist(userType, checklistId, updates, updatedBy) {
    try {
      const checklistRef = ref(
        this.database,
        this.getChecklistsPath(userType, checklistId)
      );

      const updateData = {
        ...updates,
        updatedBy: updatedBy.uid,
        updatedByName: updatedBy.name,
        updatedAt: new Date().toISOString(),
      };

      await update(checklistRef, updateData);
      return updateData;
    } catch (error) {
      console.error("Error updating checklist:", error);
      throw error;
    }
  }

  /**
   * Delete checklist
   */
  async deleteChecklist(userType, checklistId) {
    try {
      // Delete all completions first
      await this.deleteAllCompletionsForChecklist(userType, checklistId);

      // Delete checklist
      const checklistRef = ref(
        this.database,
        this.getChecklistsPath(userType, checklistId)
      );
      await remove(checklistRef);

      return true;
    } catch (error) {
      console.error("Error deleting checklist:", error);
      throw error;
    }
  }

  // ==================== NEW: CHECK-IN BASED ASSIGNMENT GENERATION ====================

  /**
   * NEW MAIN METHOD: Generate assignments when employee checks in
   * This replaces all the complex login-based generation logic
   */
  async generateAssignmentsOnCheckIn(userType, employeeId, checkInDate) {
    try {
      console.log("=== GENERATING ASSIGNMENTS ON CHECK-IN ===");
      console.log("Employee ID:", employeeId);
      console.log("Check-in Date:", checkInDate);

      const targetDate = checkInDate || new Date().toISOString().split("T")[0];

      // Check if assignments already generated for this employee today
      const existingAssignments = await this.getCompletions(userType, {
        employeeId: employeeId,
        date: targetDate,
      });

      if (existingAssignments.length > 0) {
        console.log("✅ Assignments already exist for this employee today");
        return {
          type: "check_in",
          alreadyExists: true,
          date: targetDate,
          existingCount: existingAssignments.length,
        };
      }

      // Generate assignments for this employee
      const result = await this.generateAssignmentsForEmployee(
        userType,
        employeeId,
        targetDate
      );

      // Clean up any duplicates that might have been created
      await this.cleanupDuplicates(userType, targetDate);

      console.log("✅ Check-in assignment generation complete");
      return {
        type: "check_in",
        date: targetDate,
        ...result,
      };
    } catch (error) {
      console.error("Error in check-in assignment generation:", error);
      throw error;
    }
  }

  /**
   * Generate assignments for specific employee on check-in
   */
  async generateAssignmentsForEmployee(userType, employeeId, targetDate) {
    try {
      const activeChecklists = await this.getChecklists(userType, {
        isActive: true,
      });

      let primaryGenerated = 0;
      let backupGenerated = 0;

      // Generate primary assignments for this employee
      for (const checklist of activeChecklists) {
        if (!this.shouldChecklistAppearOnDate(checklist, targetDate)) continue;

        if (checklist.assignedEmployees?.includes(employeeId)) {
          const success = await this.generateSingleAssignment(
            userType,
            checklist,
            employeeId,
            targetDate,
            false
          );
          if (success) primaryGenerated++;
        }
      }

      // Check if any backup assignments are needed (only for employees on leave)
      backupGenerated =
        await this.generateBackupAssignmentsForCheckedInEmployee(
          userType,
          employeeId,
          targetDate
        );

      const totalGenerated = primaryGenerated + backupGenerated;

      return {
        employeeId,
        totalGenerated,
        primaryGenerated,
        backupGenerated,
      };
    } catch (error) {
      console.error("Error generating assignments for employee:", error);
      throw error;
    }
  }

  /**
   * Generate backup assignments only when primary employees are confirmed on leave
   */
  async generateBackupAssignmentsForCheckedInEmployee(
    userType,
    employeeId,
    targetDate
  ) {
    try {
      const activeChecklists = await this.getChecklists(userType, {
        isActive: true,
      });
      let backupGenerated = 0;

      for (const checklist of activeChecklists) {
        if (!this.shouldChecklistAppearOnDate(checklist, targetDate)) continue;
        if (!checklist.backupEmployees?.includes(employeeId)) continue;

        // Check if ANY primary employee is on leave
        let primaryOnLeave = null;
        for (const primaryEmployeeId of checklist.assignedEmployees || []) {
          const isOnLeave = await this.isEmployeeOnLeave(
            userType,
            primaryEmployeeId,
            targetDate
          );

          if (isOnLeave) {
            primaryOnLeave = primaryEmployeeId;
            console.log(
              `📋 Primary employee ${primaryEmployeeId} on leave for ${checklist.title}`
            );
            break;
          }
        }

        // Only create backup if primary is confirmed on leave
        if (primaryOnLeave) {
          const success = await this.generateSingleAssignment(
            userType,
            checklist,
            employeeId,
            targetDate,
            true,
            primaryOnLeave
          );
          if (success) backupGenerated++;
        }
      }

      return backupGenerated;
    } catch (error) {
      console.error("Error generating backup assignments:", error);
      return 0;
    }
  }

  /**
   * Check if employee is on leave for specific date
   */
  async isEmployeeOnLeave(userType, employeeId, date) {
    try {
      const { default: attendanceService } = await import(
        "./attendance/attendanceService"
      );
      const attendanceRecord = await attendanceService.getTodayAttendance(
        userType,
        employeeId,
        date
      );

      return attendanceRecord && attendanceRecord.status === "on_leave";
    } catch (error) {
      console.warn(
        `Could not check leave status for employee ${employeeId}:`,
        error
      );
      return false;
    }
  }

  /**
   * Generate single assignment with duplicate prevention
   */
  async generateSingleAssignment(
    userType,
    checklist,
    employeeId,
    targetDate,
    isBackup = false,
    originalEmployeeId = null
  ) {
    const assignmentKey = `${checklist.id}_${employeeId}_${targetDate}`;

    // Check in-memory lock first (fastest)
    if (this.assignmentLocks.has(assignmentKey)) {
      console.log(`⏭️ Assignment locked in memory: ${assignmentKey}`);
      return false;
    }

    // Acquire assignment lock
    this.assignmentLocks.set(assignmentKey, true);

    try {
      // Double-check for existing assignment (after acquiring lock)
      const existing = await this.getCompletions(userType, {
        checklistId: checklist.id,
        employeeId: employeeId,
        date: targetDate,
      });

      if (existing.length > 0) {
        console.log(
          `⏭️ Assignment already exists: ${checklist.title} for ${employeeId}`
        );
        return false;
      }

      // Find employee name
      const employees = await this.getAllEmployees(userType);
      const employee = employees.find((emp) => emp.id === employeeId);
      const employeeName = employee?.name || "Unknown Employee";

      // Get original employee name for backup assignments
      let displayName = employeeName;
      if (isBackup && originalEmployeeId) {
        const originalEmployee = employees.find(
          (emp) => emp.id === originalEmployeeId
        );
        const originalName = originalEmployee?.name || "Unknown";
        displayName = `${employeeName} (Backup for ${originalName})`;
      }

      // Create assignment
      const completionData = {
        checklistId: checklist.id,
        checklistTitle: checklist.title,
        employeeId: employeeId,
        employeeName: displayName,
        date: targetDate,
        completed: false,
        reason: null,
        completedAt: null,
        isBackupAssignment: isBackup,
        originalEmployeeId: originalEmployeeId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        generatedBy: "check_in",
        assignmentKey: assignmentKey,
      };

      // Use atomic write operation
      const completionsRef = ref(
        this.database,
        this.getCompletionsPath(userType)
      );
      const newCompletionRef = push(completionsRef);
      await set(newCompletionRef, {
        ...completionData,
        id: newCompletionRef.key,
      });

      console.log(
        `✅ Created assignment: ${checklist.title} for ${displayName}`
      );
      return true;
    } catch (error) {
      console.error("Error creating single assignment:", error);
      return false;
    } finally {
      // Always release assignment lock
      this.assignmentLocks.delete(assignmentKey);
    }
  }

  /**
   * Generate assignments for new checklist (only for today)
   */
  async generateTodayAssignments(userType, checklist) {
    try {
      const today = new Date().toISOString().split("T")[0];
      if (this.shouldChecklistAppearOnDate(checklist, today)) {
        // Generate assignments only for employees who have already checked in today
        const checkedInEmployees = await this.getCheckedInEmployeesToday(
          userType,
          today
        );

        for (const employeeId of checklist.assignedEmployees || []) {
          if (checkedInEmployees.includes(employeeId)) {
            await this.generateSingleAssignment(
              userType,
              checklist,
              employeeId,
              today,
              false
            );
          }
        }
      }
    } catch (error) {
      console.error("Error generating today assignments:", error);
    }
  }

  /**
   * Get employees who have checked in today
   */
  async getCheckedInEmployeesToday(userType, date) {
    try {
      const { default: attendanceService } = await import(
        "./attendance/attendanceService"
      );
      const todayAttendance = await attendanceService.getAllEmployeesAttendance(
        userType,
        date
      );

      return todayAttendance
        .filter((record) => record.status !== "on_leave")
        .map((record) => record.employeeId);
    } catch (error) {
      console.warn("Could not get checked-in employees:", error);
      return [];
    }
  }

  // ==================== ADMIN MANUAL GENERATION ====================

  /**
   * Manual generation for admins (generates for all checked-in employees)
   */
  async manualGenerateAllAssignments(userType, user, targetDate = null) {
    try {
      console.log("=== MANUAL ASSIGNMENT GENERATION ===");

      if (user.role !== "admin") {
        throw new Error(
          "Only administrators can manually generate assignments"
        );
      }

      const today = targetDate || new Date().toISOString().split("T")[0];

      const [activeChecklists, checkedInEmployees] = await Promise.all([
        this.getChecklists(userType, { isActive: true }),
        this.getCheckedInEmployeesToday(userType, today),
      ]);

      let totalGenerated = 0;
      let primaryGenerated = 0;
      let backupGenerated = 0;

      // Generate assignments for all checked-in employees
      for (const checklist of activeChecklists) {
        if (!this.shouldChecklistAppearOnDate(checklist, today)) continue;

        // Generate primary assignments
        for (const employeeId of checklist.assignedEmployees || []) {
          if (checkedInEmployees.includes(employeeId)) {
            const success = await this.generateSingleAssignment(
              userType,
              checklist,
              employeeId,
              today,
              false
            );
            if (success) {
              primaryGenerated++;
              totalGenerated++;
            }
          }
        }

        // Generate backup assignments for employees on leave
        for (const backupEmployeeId of checklist.backupEmployees || []) {
          if (!checkedInEmployees.includes(backupEmployeeId)) continue;

          // Check if any primary employee is on leave
          const primaryOnLeave = await this.findPrimaryEmployeeOnLeave(
            userType,
            checklist.assignedEmployees || [],
            today
          );

          if (primaryOnLeave) {
            const success = await this.generateSingleAssignment(
              userType,
              checklist,
              backupEmployeeId,
              today,
              true,
              primaryOnLeave
            );
            if (success) {
              backupGenerated++;
              totalGenerated++;
            }
          }
        }
      }

      // Clean up duplicates
      await this.cleanupDuplicates(userType, today);

      // Record manual generation
      await this.recordManualGeneration(userType, today, user, {
        totalGenerated,
        primaryGenerated,
        backupGenerated,
        processedChecklists: activeChecklists.length,
        checkedInEmployees: checkedInEmployees.length,
      });

      return {
        type: "manual_generation",
        success: true,
        date: today,
        totalGenerated,
        primaryGenerated,
        backupGenerated,
        message: `Successfully generated ${totalGenerated} assignments for ${today}`,
      };
    } catch (error) {
      console.error("Error in manual generation:", error);
      throw error;
    }
  }

  /**
   * Find primary employee who is on leave
   */
  async findPrimaryEmployeeOnLeave(userType, primaryEmployeeIds, date) {
    for (const employeeId of primaryEmployeeIds) {
      const isOnLeave = await this.isEmployeeOnLeave(
        userType,
        employeeId,
        date
      );
      if (isOnLeave) {
        return employeeId;
      }
    }
    return null;
  }

  /**
   * Record manual generation
   */
  async recordManualGeneration(userType, date, user, result) {
    try {
      const lockRef = ref(
        this.database,
        this.getGenerationLockPath(userType, `manual_${date}_${Date.now()}`)
      );

      await set(lockRef, {
        date,
        timestamp: new Date().toISOString(),
        generationType: "manual",
        adminId: user.uid,
        adminName: user.name,
        result,
      });
    } catch (error) {
      console.error("Error recording manual generation:", error);
    }
  }

  // ==================== CHECKLIST LOGIC ====================

  /**
   * Check if checklist should appear on specific date
   */
  shouldChecklistAppearOnDate(checklist, dateString) {
    const date = new Date(dateString);
    const dayOfWeek = date.getDay();
    const dayOfMonth = date.getDate();

    switch (checklist.recurrence?.type) {
      case "daily":
        return true;
      case "weekly":
        return dayOfWeek === checklist.recurrence.dayOfWeek;
      case "monthly":
        return dayOfMonth === checklist.recurrence.dayOfMonth;
      case "once":
        const specificDate = checklist.recurrence.specificDate?.split("T")[0];
        return dateString === specificDate;
      default:
        return false;
    }
  }

  // ==================== COMPLETIONS ====================

  /**
   * Get completions with filters
   */
  async getCompletions(userType, filters = {}) {
    try {
      const completionsRef = ref(
        this.database,
        this.getCompletionsPath(userType)
      );
      const snapshot = await get(completionsRef);

      if (!snapshot.exists()) return [];

      let completions = [];
      snapshot.forEach((childSnapshot) => {
        completions.push({
          id: childSnapshot.key,
          ...childSnapshot.val(),
        });
      });

      // Apply filters
      if (filters.employeeId) {
        completions = completions.filter(
          (c) => c.employeeId === filters.employeeId
        );
      }
      if (filters.checklistId) {
        completions = completions.filter(
          (c) => c.checklistId === filters.checklistId
        );
      }
      if (filters.date) {
        completions = completions.filter((c) => c.date === filters.date);
      }
      if (filters.completed !== undefined) {
        completions = completions.filter(
          (c) => c.completed === filters.completed
        );
      }
      if (filters.dateRange) {
        completions = completions.filter(
          (c) =>
            c.date >= filters.dateRange.start && c.date <= filters.dateRange.end
        );
      }

      // Sort by date descending
      completions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      return completions;
    } catch (error) {
      console.error("Error getting completions:", error);
      throw error;
    }
  }

  /**
   * Get today's checklists for employee
   */
  async getTodayChecklistsForEmployee(userType, user) {
    try {
      const employeeId = await this.resolveEmployeeId(user, userType);
      const today = new Date().toISOString().split("T")[0];

      return await this.getCompletions(userType, {
        employeeId: employeeId,
        date: today,
      });
    } catch (error) {
      console.error("Error getting today checklists:", error);
      throw error;
    }
  }

  /**
   * Save completion
   */
  async saveCompletion(userType, completionData) {
    try {
      // Find existing completion
      const existing = await this.getCompletions(userType, {
        checklistId: completionData.checklistId,
        employeeId: completionData.employeeId,
        date: completionData.date,
      });

      if (existing.length > 0) {
        // Update existing
        const completionRef = ref(
          this.database,
          this.getCompletionsPath(userType, existing[0].id)
        );
        const updateData = {
          ...completionData,
          updatedAt: new Date().toISOString(),
          completedAt: completionData.completed
            ? new Date().toISOString()
            : null,
        };
        await update(completionRef, updateData);
        return { ...existing[0], ...updateData };
      } else {
        // Create new
        const completionsRef = ref(
          this.database,
          this.getCompletionsPath(userType)
        );
        const newCompletionRef = push(completionsRef);
        const newCompletionData = {
          ...completionData,
          id: newCompletionRef.key,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          completedAt: completionData.completed
            ? new Date().toISOString()
            : null,
        };
        await set(newCompletionRef, newCompletionData);
        return newCompletionData;
      }
    } catch (error) {
      console.error("Error saving completion:", error);
      throw error;
    }
  }

  /**
   * Delete all completions for checklist
   */
  async deleteAllCompletionsForChecklist(userType, checklistId) {
    try {
      const completions = await this.getCompletions(userType, { checklistId });

      const deletePromises = completions.map((completion) => {
        const completionRef = ref(
          this.database,
          this.getCompletionsPath(userType, completion.id)
        );
        return remove(completionRef);
      });

      await Promise.all(deletePromises);
      console.log(
        `Deleted ${completions.length} completions for checklist ${checklistId}`
      );
    } catch (error) {
      console.error("Error deleting completions:", error);
      throw error;
    }
  }

  // ==================== ADMIN CALENDAR VIEW ====================

  /**
   * Get calendar data for admin view
   */
  async getCalendarData(userType, month, year) {
    try {
      const startDate = `${year}-${month.toString().padStart(2, "0")}-01`;
      const endDate = `${year}-${month.toString().padStart(2, "0")}-31`;

      const [completions, employees, checklists] = await Promise.all([
        this.getCompletions(userType, {
          dateRange: { start: startDate, end: endDate },
        }),
        this.getAllEmployees(userType),
        this.getChecklists(userType, { isActive: true }),
      ]);

      // Organize data by employee and date
      const calendarData = {};

      employees.forEach((employee) => {
        calendarData[employee.id] = {
          employeeInfo: employee,
          checklists: {},
          dailyStats: {},
        };
      });

      // Process completions
      completions.forEach((completion) => {
        const employeeId = completion.employeeId;
        const date = completion.date;

        if (!calendarData[employeeId]) {
          calendarData[employeeId] = {
            employeeInfo: { id: employeeId, name: completion.employeeName },
            checklists: {},
            dailyStats: {},
          };
        }

        if (!calendarData[employeeId].checklists[completion.checklistId]) {
          calendarData[employeeId].checklists[completion.checklistId] = {
            checklistTitle: completion.checklistTitle,
            completions: {},
          };
        }

        calendarData[employeeId].checklists[completion.checklistId].completions[
          date
        ] = {
          completed: completion.completed,
          reason: completion.reason,
          completedAt: completion.completedAt,
          isBackup: completion.isBackupAssignment,
        };

        // Daily stats
        if (!calendarData[employeeId].dailyStats[date]) {
          calendarData[employeeId].dailyStats[date] = {
            total: 0,
            completed: 0,
          };
        }
        calendarData[employeeId].dailyStats[date].total++;
        if (completion.completed) {
          calendarData[employeeId].dailyStats[date].completed++;
        }
      });

      return {
        calendarData,
        employees,
        checklists,
        monthStats: this.calculateMonthStats(completions),
      };
    } catch (error) {
      console.error("Error getting calendar data:", error);
      throw error;
    }
  }

  /**
   * Calculate month statistics
   */
  calculateMonthStats(completions) {
    const stats = {
      totalAssignments: completions.length,
      completedAssignments: 0,
      pendingAssignments: 0,
      completionRate: 0,
      byEmployee: {},
      byDate: {},
    };

    completions.forEach((completion) => {
      if (completion.completed) {
        stats.completedAssignments++;
      } else {
        stats.pendingAssignments++;
      }

      // By employee
      if (!stats.byEmployee[completion.employeeId]) {
        stats.byEmployee[completion.employeeId] = {
          employeeName: completion.employeeName,
          total: 0,
          completed: 0,
        };
      }
      stats.byEmployee[completion.employeeId].total++;
      if (completion.completed) {
        stats.byEmployee[completion.employeeId].completed++;
      }

      // By date
      if (!stats.byDate[completion.date]) {
        stats.byDate[completion.date] = { total: 0, completed: 0 };
      }
      stats.byDate[completion.date].total++;
      if (completion.completed) {
        stats.byDate[completion.date].completed++;
      }
    });

    stats.completionRate =
      stats.totalAssignments > 0
        ? (stats.completedAssignments / stats.totalAssignments) * 100
        : 0;

    return stats;
  }

  // ==================== STATS & REPORTS ====================

  /**
   * SIMPLIFIED: Get dashboard stats (no more complex generation logic)
   */
  async getDashboardStats(userType, user = null) {
    try {
      const today = new Date().toISOString().split("T")[0];

      let todayCompletions;
      if (user && user.role !== "admin") {
        // Employee stats
        const employeeId = await this.resolveEmployeeId(user, userType);
        todayCompletions = await this.getCompletions(userType, {
          employeeId: employeeId,
          date: today,
        });
      } else {
        // Admin stats
        todayCompletions = await this.getCompletions(userType, { date: today });
      }

      const stats = {
        todayTotal: todayCompletions.length,
        todayCompleted: todayCompletions.filter((c) => c.completed).length,
        todayPending: todayCompletions.filter((c) => !c.completed).length,
        completionRate: 0,
      };

      stats.completionRate =
        stats.todayTotal > 0
          ? (stats.todayCompleted / stats.todayTotal) * 100
          : 0;

      return stats;
    } catch (error) {
      console.error("Error getting dashboard stats:", error);
      return {
        todayTotal: 0,
        todayCompleted: 0,
        todayPending: 0,
        completionRate: 0,
      };
    }
  }

  /**
   * SIMPLIFIED: Get generation status for admin
   */
  async getGenerationStatus(userType) {
    const today = new Date().toISOString().split("T")[0];
    try {
      const todayStats = await this.getDashboardStats(userType);

      return {
        date: today,
        todayStats,
        canManualGenerate: true,
        generationMethod: "check_in_based",
      };
    } catch (error) {
      console.error("Error getting generation status:", error);
      return {
        date: today,
        todayStats: { todayTotal: 0, todayCompleted: 0, todayPending: 0 },
        canManualGenerate: true,
        generationMethod: "check_in_based",
      };
    }
  }

  // ==================== LEAVE INTEGRATION (ENHANCED) ====================

  /**
   * ENHANCED: Handle checklist reassignment when employee marks leave
   */
  async handleEmployeeLeave(userType, employeeId, leaveDate) {
    try {
      console.log("=== HANDLING EMPLOYEE LEAVE FOR CHECKLISTS ===");
      console.log("Employee:", employeeId, "Date:", leaveDate);

      // Get all checklists where this employee is primary
      const activeChecklists = await this.getChecklists(userType, {
        isActive: true,
      });
      const employeeChecklists = activeChecklists.filter(
        (checklist) =>
          checklist.assignedEmployees?.includes(employeeId) &&
          this.shouldChecklistAppearOnDate(checklist, leaveDate)
      );

      let reassignedCount = 0;

      for (const checklist of employeeChecklists) {
        // Remove existing assignments for this employee
        const existingAssignments = await this.getCompletions(userType, {
          checklistId: checklist.id,
          employeeId: employeeId,
          date: leaveDate,
        });

        for (const assignment of existingAssignments) {
          const completionRef = ref(
            this.database,
            this.getCompletionsPath(userType, assignment.id)
          );
          await remove(completionRef);
          console.log(
            `🗑️ Removed assignment: ${checklist.title} from ${employeeId} (on leave)`
          );
        }

        // Create backup assignments for checked-in backup employees
        if (checklist.backupEmployees?.length > 0) {
          const checkedInBackupEmployees =
            await this.getCheckedInEmployeesToday(userType, leaveDate);

          for (const backupEmployeeId of checklist.backupEmployees) {
            // Only assign to backup employees who are checked in
            if (checkedInBackupEmployees.includes(backupEmployeeId)) {
              const backupAssignment = await this.getCompletions(userType, {
                checklistId: checklist.id,
                employeeId: backupEmployeeId,
                date: leaveDate,
              });

              if (backupAssignment.length === 0) {
                const success = await this.generateSingleAssignment(
                  userType,
                  checklist,
                  backupEmployeeId,
                  leaveDate,
                  true,
                  employeeId
                );

                if (success) {
                  reassignedCount++;
                  console.log(
                    `📋 Reassigned ${checklist.title} to backup employee ${backupEmployeeId}`
                  );
                  break; // Only assign to one backup employee
                }
              }
            }
          }
        } else {
          console.log(
            `⚠️ No backup employees for checklist: ${checklist.title}`
          );
        }
      }

      console.log(
        `✅ Leave handling complete: ${reassignedCount} checklists reassigned`
      );
      return {
        reassignedCount,
        processedChecklists: employeeChecklists.length,
      };
    } catch (error) {
      console.error("Error handling employee leave:", error);
      throw error;
    }
  }

  /**
   * Handle checklist restoration when employee cancels leave
   */
  async handleEmployeeLeaveCancel(userType, employeeId, leaveDate) {
    try {
      console.log("=== HANDLING EMPLOYEE LEAVE CANCELLATION ===");
      console.log("Employee:", employeeId, "Date:", leaveDate);

      // Get all backup assignments for this date that were for this employee
      const backupAssignments = await this.getCompletions(userType, {
        date: leaveDate,
      });

      const relevantBackups = backupAssignments.filter(
        (assignment) =>
          assignment.isBackupAssignment &&
          assignment.originalEmployeeId === employeeId
      );

      let restoredCount = 0;

      for (const backupAssignment of relevantBackups) {
        // Only remove if not yet completed
        if (!backupAssignment.completed) {
          const completionRef = ref(
            this.database,
            this.getCompletionsPath(userType, backupAssignment.id)
          );
          await remove(completionRef);

          // Restore original assignment only if employee is checked in
          const checkedInEmployees = await this.getCheckedInEmployeesToday(
            userType,
            leaveDate
          );
          if (checkedInEmployees.includes(employeeId)) {
            const success = await this.generateSingleAssignment(
              userType,
              {
                id: backupAssignment.checklistId,
                title: backupAssignment.checklistTitle,
              },
              employeeId,
              leaveDate,
              false
            );

            if (success) {
              restoredCount++;
              console.log(
                `🔄 Restored ${backupAssignment.checklistTitle} to original employee ${employeeId}`
              );
            }
          }
        } else {
          console.log(
            `⏭️ Backup assignment already completed, keeping it: ${backupAssignment.checklistTitle}`
          );
        }
      }

      console.log(
        `✅ Leave cancellation complete: ${restoredCount} checklists restored`
      );
      return { restoredCount, processedBackups: relevantBackups.length };
    } catch (error) {
      console.error("Error handling leave cancellation:", error);
      throw error;
    }
  }

  // ==================== UTILITY METHODS ====================

  /**
   * Clean up duplicate assignments
   */
  async cleanupDuplicates(userType, targetDate = null) {
    try {
      const date = targetDate || new Date().toISOString().split("T")[0];
      console.log("🧹 Cleaning duplicates for:", date);

      const allCompletions = await this.getCompletions(userType, { date });

      // Group by unique key and sort by creation time
      const groups = {};
      allCompletions.forEach((completion) => {
        const key = `${completion.checklistId}_${completion.employeeId}_${completion.date}`;
        if (!groups[key]) groups[key] = [];
        groups[key].push(completion);
      });

      let duplicatesRemoved = 0;
      for (const [key, completions] of Object.entries(groups)) {
        if (completions.length > 1) {
          // Sort by creation time and keep the first one
          completions.sort(
            (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
          );
          const toKeep = completions[0];
          const toRemove = completions.slice(1);

          console.log(
            `🔍 Found ${completions.length} duplicates for ${key}, keeping first one`
          );

          for (const duplicate of toRemove) {
            const completionRef = ref(
              this.database,
              this.getCompletionsPath(userType, duplicate.id)
            );
            await remove(completionRef);
            duplicatesRemoved++;
            console.log(`🗑️ Removed duplicate: ${duplicate.id}`);
          }
        }
      }

      console.log(`✅ Removed ${duplicatesRemoved} duplicates`);
      return { duplicatesRemoved, date };
    } catch (error) {
      console.error("Error cleaning duplicates:", error);
      throw error;
    }
  }
}

// Export singleton instance
const checklistService = new ChecklistService();
export default checklistService;

/* 
=============================================================================
METHODS THAT BECOME UNNECESSARY WITH CHECK-IN BASED APPROACH:
=============================================================================

The following methods from the old service are NO LONGER NEEDED:

1. generateAssignmentsOnLogin() - REPLACED with generateAssignmentsOnCheckIn()
2. generateForAllEmployees() - Complex admin login logic removed
3. generateForEmployee() - Simplified to generateAssignmentsForEmployee()
4. hasRecentGeneration() - No need for login cooldowns
5. recordGeneration() - Simplified tracking
6. acquireGenerationLock() - Simplified locking
7. releaseGenerationLock() - Simplified locking
8. hasGlobalDailyGeneration() - Global generation concept removed
9. recordGlobalDailyGeneration() - Not needed
10. handleAdminLogin() - Login complexity removed
11. handleEmployeeLogin() - Login complexity removed
12. performGlobalGeneration() - Not needed
13. performTargetedEmployeeGeneration() - Simplified
14. generateEmployeeSpecificAssignments() - Replaced
15. generateSmartBackupAssignments() - Enhanced and renamed
16. recordEmployeeGeneration() - Simplified
17. analyzeDailyAssignmentState() - Overhead removed
18. triggerBackupNotifications() - Enhanced leave handling covers this
19. isEmployeeAvailableToday() - Replaced with check-in status
20. getDashboardStatsWithGeneration() - No longer triggers generation

NEW APPROACH BENEFITS:
- Much simpler logic
- No race conditions between users
- Clear trigger point (check-in)
- Reliable attendance integration
- Cleaner admin dashboard
- Better performance
=============================================================================
*/
