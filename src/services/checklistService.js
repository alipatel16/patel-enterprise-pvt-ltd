// src/services/checklistService.js - COMPLETE REWRITE WITH RACE CONDITION FIXES
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
 * Enhanced Checklist Service - Complete Rewrite with Race Condition Prevention
 * Features:
 * - Clean employee ID resolution
 * - Automatic assignment generation on login
 * - Backup employee support
 * - Duplicate prevention with atomic operations
 * - Calendar-based admin view
 * - Race condition prevention
 */
class ChecklistService {
  constructor() {
    this.database = database;
    this.generationLocks = new Map(); // In-memory lock tracking
    this.assignmentLocks = new Map(); // Assignment-level locks
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
    // FIXED: Add validation to prevent null paths
    if (!userType || userType === "null" || userType === "undefined") {
      console.error("❌ Invalid userType for generation lock:", userType);
      console.trace("Stack trace for debugging:");
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

      // Generate initial assignments for today
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

  // ==================== ASSIGNMENT GENERATION (UPDATED WITH RACE CONDITION FIXES) ====================

  /**
   * Main method: Generate assignments on login - UPDATED with race condition prevention
   */
  async generateAssignmentsOnLogin(userType, user) {
    try {
      console.log("=== AUTO-GENERATION ON LOGIN ===");
      console.log("User:", user.name, "Role:", user.role);

      const today = new Date().toISOString().split("T")[0];
      const globalLockKey = `${userType}-${today}-${user.uid}`;

      // UPDATED: Check recent generation with longer timeout
      if (await this.hasRecentGeneration(userType, user.uid, today)) {
        console.log("⏭️ Already generated recently (within 5 minutes)");
        return { alreadyGenerated: true, date: today };
      }

      // UPDATED: Acquire global generation lock
      const lockAcquired = await this.acquireGenerationLock(
        userType,
        globalLockKey
      );
      if (!lockAcquired) {
        console.log("⏭️ Another generation in progress, skipping");
        return { skipped: true, reason: "concurrent_generation", date: today };
      }

      let result;
      try {
        if (user.role === "admin") {
          result = await this.generateForAllEmployees(
            userType,
            today,
            user.uid
          );
        } else {
          const employeeId = await this.resolveEmployeeId(user, userType);
          result = await this.generateForEmployee(
            userType,
            employeeId,
            today,
            user.uid
          );
        }

        // UPDATED: Cleanup duplicates after generation
        await this.cleanupDuplicates(userType, today);

        // Record generation
        await this.recordGeneration(userType, user.uid, today, result);
      } finally {
        // UPDATED: Always release the lock
        await this.releaseGenerationLock(userType, globalLockKey);
      }

      return result;
    } catch (error) {
      console.error("Error in auto-generation:", error);
      throw error;
    }
  }

  /**
   * Generate assignments for all employees (admin login) - UPDATED with sequential processing
   */
  async generateForAllEmployees(userType, targetDate, adminId) {
    try {
      console.log("🔐 Admin generation for all employees");

      const activeChecklists = await this.getChecklists(userType, {
        isActive: true,
      });
      let totalGenerated = 0;

      // UPDATED: Process checklists sequentially to avoid race conditions
      for (const checklist of activeChecklists) {
        if (this.shouldChecklistAppearOnDate(checklist, targetDate)) {
          console.log(`Processing checklist: ${checklist.title}`);

          const generated = await this.generateAssignmentsForChecklist(
            userType,
            checklist,
            targetDate
          );
          totalGenerated += generated;

          // Small delay to prevent rapid-fire operations
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
      }

      console.log(
        `✅ Admin generation complete: ${totalGenerated} assignments`
      );

      return {
        type: "admin",
        date: targetDate,
        totalGenerated,
        processedChecklists: activeChecklists.length,
      };
    } catch (error) {
      console.error("Error in admin generation:", error);
      throw error;
    }
  }

  /**
   * Generate assignments for specific employee
   */
  async generateForEmployee(userType, employeeId, targetDate, userId) {
    try {
      console.log("👤 Employee generation for:", employeeId);

      const activeChecklists = await this.getChecklists(userType, {
        isActive: true,
      });
      let primaryGenerated = 0;
      let backupGenerated = 0;

      // Generate primary assignments
      for (const checklist of activeChecklists) {
        if (this.shouldChecklistAppearOnDate(checklist, targetDate)) {
          if (checklist.assignedEmployees?.includes(employeeId)) {
            const generated = await this.generateSingleAssignment(
              userType,
              checklist,
              employeeId,
              targetDate,
              false
            );
            if (generated) primaryGenerated++;
          }
        }
      }

      // Generate backup assignments if primary employees haven't logged in
      backupGenerated = await this.generateBackupAssignments(
        userType,
        employeeId,
        targetDate
      );

      const totalGenerated = primaryGenerated + backupGenerated;
      console.log(
        `✅ Employee generation complete: ${totalGenerated} assignments`
      );

      return {
        type: "employee",
        employeeId,
        date: targetDate,
        totalGenerated,
        primaryAssignments: primaryGenerated,
        backupAssignments: backupGenerated,
      };
    } catch (error) {
      console.error("Error in employee generation:", error);
      throw error;
    }
  }

  /**
   * Generate assignments for a specific checklist - UPDATED with sequential processing
   */
  async generateAssignmentsForChecklist(userType, checklist, targetDate) {
    try {
      let generated = 0;

      // UPDATED: Process employees sequentially to prevent race conditions
      for (let i = 0; i < checklist.assignedEmployees.length; i++) {
        const employeeId = checklist.assignedEmployees[i];
        const success = await this.generateSingleAssignment(
          userType,
          checklist,
          employeeId,
          targetDate,
          false
        );
        if (success) generated++;

        // Small delay between assignments
        await new Promise((resolve) => setTimeout(resolve, 50));
      }

      return generated;
    } catch (error) {
      console.error("Error generating assignments for checklist:", error);
      return 0;
    }
  }

  /**
   * Generate single assignment with duplicate prevention - UPDATED with atomic operations
   */
  async generateSingleAssignment(
    userType,
    checklist,
    employeeId,
    targetDate,
    isBackup = false,
    originalEmployeeId = null
  ) {
    // UPDATED: Create unique assignment key for locking
    const assignmentKey = `${checklist.id}_${employeeId}_${targetDate}`;

    // UPDATED: Check in-memory lock first (fastest)
    if (this.assignmentLocks.has(assignmentKey)) {
      console.log(`⏭️ Assignment locked in memory: ${assignmentKey}`);
      return false;
    }

    // UPDATED: Acquire assignment lock
    this.assignmentLocks.set(assignmentKey, true);

    try {
      // UPDATED: Double-check for existing assignment (after acquiring lock)
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

      // UPDATED: Create assignment with generation metadata
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
        // UPDATED: Add generation metadata for tracking
        generatedBy: "system",
        assignmentKey: assignmentKey,
      };

      // UPDATED: Use atomic write operation
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
      // UPDATED: Always release assignment lock
      this.assignmentLocks.delete(assignmentKey);
    }
  }

  /**
   * Generate backup assignments for employee
   */
  async generateBackupAssignments(userType, employeeId, targetDate) {
    try {
      const activeChecklists = await this.getChecklists(userType, {
        isActive: true,
      });
      let backupGenerated = 0;

      for (const checklist of activeChecklists) {
        if (!this.shouldChecklistAppearOnDate(checklist, targetDate)) continue;
        if (!checklist.backupEmployees?.includes(employeeId)) continue;

        console.log(`🔍 Checking backup for: ${checklist.title}`);

        // Check if any primary employee has assignment
        let primaryHasAssignment = false;
        for (const primaryEmployeeId of checklist.assignedEmployees) {
          const existingAssignments = await this.getCompletions(userType, {
            checklistId: checklist.id,
            employeeId: primaryEmployeeId,
            date: targetDate,
          });
          if (existingAssignments.length > 0) {
            primaryHasAssignment = true;
            break;
          }
        }

        if (!primaryHasAssignment) {
          // No primary employee has logged in - create backup assignment
          console.log(`🆘 Creating backup assignment for: ${checklist.title}`);
          const originalEmployeeId = checklist.assignedEmployees[0]; // Use first primary as original
          const success = await this.generateSingleAssignment(
            userType,
            checklist,
            employeeId,
            targetDate,
            true,
            originalEmployeeId
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
   * Generate today's assignments for new checklist
   */
  async generateTodayAssignments(userType, checklist) {
    try {
      const today = new Date().toISOString().split("T")[0];
      if (this.shouldChecklistAppearOnDate(checklist, today)) {
        await this.generateAssignmentsForChecklist(userType, checklist, today);
      }
    } catch (error) {
      console.error("Error generating today assignments:", error);
    }
  }

  // ==================== UPDATED: GENERATION LOCK MANAGEMENT ====================

  /**
   * UPDATED: Acquire generation lock with timeout
   */
  async acquireGenerationLock(userType, lockKey, timeoutMs = 30000) {
    try {
      const lockRef = ref(
        this.database,
        this.getGenerationLockPath(userType, `active_${lockKey}`)
      );
      const snapshot = await get(lockRef);

      if (snapshot.exists()) {
        const lockData = snapshot.val();
        const lockAge = Date.now() - new Date(lockData.timestamp).getTime();

        // If lock is older than timeout, consider it stale
        if (lockAge < timeoutMs) {
          return false; // Lock still active
        }
      }

      // Acquire lock
      await set(lockRef, {
        lockKey,
        timestamp: new Date().toISOString(),
        expires: new Date(Date.now() + timeoutMs).toISOString(),
      });

      return true;
    } catch (error) {
      console.error("Error acquiring generation lock:", error);
      return false;
    }
  }

  /**
   * UPDATED: Release generation lock
   */
  async releaseGenerationLock(userType, lockKey) {
    try {
      const lockRef = ref(
        this.database,
        this.getGenerationLockPath(userType, `active_${lockKey}`)
      );
      await remove(lockRef);
    } catch (error) {
      console.error("Error releasing generation lock:", error);
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

  // ==================== GENERATION HELPERS (UPDATED) ====================

  /**
   * Check if generation was done recently - UPDATED with longer timeout
   */
  async hasRecentGeneration(userType, userId, date) {
    try {
      const lockRef = ref(
        this.database,
        this.getGenerationLockPath(userType, `${userId}_${date}`)
      );
      const snapshot = await get(lockRef);

      if (!snapshot.exists()) return false;

      const lockData = snapshot.val();
      // UPDATED: Increased timeout to 5 minutes to prevent rapid regeneration
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();

      return lockData.timestamp > fiveMinutesAgo;
    } catch (error) {
      console.error("Error checking recent generation:", error);
      return false;
    }
  }

  /**
   * Record generation attempt
   */
  async recordGeneration(userType, userId, date, result) {
    try {
      const lockRef = ref(
        this.database,
        this.getGenerationLockPath(userType, `${userId}_${date}`)
      );
      await set(lockRef, {
        userId,
        date,
        timestamp: new Date().toISOString(),
        result,
      });
    } catch (error) {
      console.error("Error recording generation:", error);
    }
  }

  // ==================== STATS & REPORTS ====================

  /**
   * Get dashboard stats
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
   * Get dashboard stats with auto-generation
   */
  async getDashboardStatsWithGeneration(userType, user) {
    try {
      // Generate assignments first
      const generationResult = await this.generateAssignmentsOnLogin(
        userType,
        user
      );

      // Get updated stats
      const stats = await this.getDashboardStats(userType, user);

      return {
        ...stats,
        autoGeneration: generationResult,
      };
    } catch (error) {
      console.error("Error getting dashboard stats with generation:", error);
      return await this.getDashboardStats(userType, user);
    }
  }

  // ==================== LEAVE INTEGRATION ====================

  /**
   * Handle checklist reassignment when employee marks leave
   * This should be called from the attendance service when leave is marked
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
        // Check if this employee already has assignment for this date
        const existingAssignment = await this.getCompletions(userType, {
          checklistId: checklist.id,
          employeeId: employeeId,
          date: leaveDate,
        });

        if (existingAssignment.length > 0) {
          // Remove the existing assignment since employee is on leave
          for (const assignment of existingAssignment) {
            const completionRef = ref(
              this.database,
              this.getCompletionsPath(userType, assignment.id)
            );
            await remove(completionRef);
            console.log(
              `🗑️ Removed assignment: ${checklist.title} from ${employeeId} (on leave)`
            );
          }
        }

        // Check if checklist has backup employees
        if (checklist.backupEmployees?.length > 0) {
          // Assign to first available backup employee
          for (const backupEmployeeId of checklist.backupEmployees) {
            // Check if backup already has this assignment
            const backupAssignment = await this.getCompletions(userType, {
              checklistId: checklist.id,
              employeeId: backupEmployeeId,
              date: leaveDate,
            });

            if (backupAssignment.length === 0) {
              // Create backup assignment
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
   * This should be called when leave is cancelled
   */
  async handleEmployeeLeaveCancel(userType, employeeId, leaveDate) {
    try {
      console.log("=== HANDLING EMPLOYEE LEAVE CANCELLATION ===");
      console.log("Employee:", employeeId, "Date:", leaveDate);

      // Get all backup assignments for this date that were for this employee
      const backupAssignments = await this.getCompletions(userType, {
        date: leaveDate,
        isBackupAssignment: true,
      });

      const relevantBackups = backupAssignments.filter(
        (assignment) => assignment.originalEmployeeId === employeeId
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

          // Restore original assignment
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

  /**
   * Clean up duplicate assignments - UPDATED with enhanced detection
   */
  async cleanupDuplicates(userType, targetDate = null) {
    try {
      const date = targetDate || new Date().toISOString().split("T")[0];
      console.log("🧹 Cleaning duplicates for:", date);

      const allCompletions = await this.getCompletions(userType, { date });

      // UPDATED: Group by unique key and sort by creation time
      const groups = {};
      allCompletions.forEach((completion) => {
        const key = `${completion.checklistId}_${completion.employeeId}_${completion.date}`;
        if (!groups[key]) groups[key] = [];
        groups[key].push(completion);
      });

      let duplicatesRemoved = 0;
      for (const [key, completions] of Object.entries(groups)) {
        if (completions.length > 1) {
          // UPDATED: Sort by creation time and keep the first one
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
