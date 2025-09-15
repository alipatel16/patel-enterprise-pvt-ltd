// src/services/attendance/attendanceService.js - Enhanced with Checklist Integration
import { database } from "../firebase/config";
import {
  ref,
  push,
  set,
  get,
  query,
  orderByChild,
  equalTo,
  orderByKey,
  limitToLast,
} from "firebase/database";
import { getCollectionPath } from "../../utils/helpers/firebasePathHelper";
import penaltyService from "../penalty/penaltyService";

class AttendanceService {
  constructor() {
    this.collectionName = "attendance";
  }

  /**
   * Get attendance path for user type
   * @param {string} userType - electronics or furniture
   * @param {string} attendanceId - optional attendance ID
   * @returns {string} Firebase path
   */
  getAttendancePath(userType, attendanceId = null) {
    return getCollectionPath(userType, this.collectionName, attendanceId);
  }

  /**
   * Check in employee
   * @param {string} userType - User type (electronics/furniture)
   * @param {Object} checkInData - Check in data
   * @returns {Promise<string>} Attendance record ID
   */
  async checkIn(userType, checkInData) {
    try {
      const attendancePath = this.getAttendancePath(userType);
      const attendanceRef = ref(database, attendancePath);

      const newAttendanceRef = push(attendanceRef);
      const attendanceId = newAttendanceRef.key;

      const attendanceRecord = {
        id: attendanceId,
        employeeId: checkInData.employeeId,
        employeeName: checkInData.employeeName,
        date: checkInData.date,
        checkInTime: checkInData.checkInTime,
        checkInPhoto: checkInData.checkInPhoto, // Base64 string
        checkInLocation: checkInData.checkInLocation,
        checkOutTime: null,
        checkOutLocation: null,
        breaks: [],
        totalBreakTime: 0,
        totalWorkTime: 0,
        status: "checked_in",
        leaveType: null,
        leaveReason: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await set(newAttendanceRef, attendanceRecord);

      // NEW: Automatically generate checklist assignments on check-in
      try {
        console.log("🔄 Triggering checklist generation on check-in...");
        const { default: checklistService } = await import(
          "../checklistService"
        );

        const checklistResult =
          await checklistService.generateAssignmentsOnCheckIn(
            userType,
            checkInData.employeeId,
            checkInData.date
          );

        console.log(`📋 Checklist generation result:`, checklistResult);

        // Return attendance ID with checklist info
        return {
          attendanceId,
          checklistGeneration: checklistResult,
        };
      } catch (checklistError) {
        console.warn(
          "Failed to generate checklist assignments:",
          checklistError
        );
        // Don't fail check-in if checklist generation fails
        return {
          attendanceId,
          checklistGeneration: { error: checklistError.message },
        };
      }
    } catch (error) {
      console.error("Check-in error:", error);
      throw new Error("Failed to check in: " + error.message);
    }
  }

  /**
   * Check out employee
   * @param {string} userType - User type
   * @param {string} attendanceId - Attendance record ID
   * @param {Object} checkOutData - Check out data
   * @returns {Promise<Object>} Updated attendance record
   */
  async checkOut(userType, attendanceId, checkOutData) {
    try {
      const attendancePath = this.getAttendancePath(userType, attendanceId);
      const attendanceRef = ref(database, attendancePath);

      const snapshot = await get(attendanceRef);
      if (!snapshot.exists()) {
        throw new Error("Attendance record not found");
      }

      const attendanceRecord = snapshot.val();

      // Calculate total work time
      const checkInTime = new Date(
        `${attendanceRecord.date}T${attendanceRecord.checkInTime}`
      );
      const checkOutTime = new Date(
        `${checkOutData.date}T${checkOutData.checkOutTime}`
      );
      const totalMinutes = Math.floor(
        (checkOutTime - checkInTime) / (1000 * 60)
      );
      const totalWorkTime = Math.max(
        0,
        totalMinutes - (attendanceRecord.totalBreakTime || 0)
      );

      const updatedRecord = {
        ...attendanceRecord,
        checkOutTime: checkOutData.checkOutTime,
        checkOutLocation: checkOutData.checkOutLocation || null,
        totalWorkTime: totalWorkTime,
        status: "checked_out",
        updatedAt: new Date().toISOString(),
      };

      await set(attendanceRef, updatedRecord);

      // Auto-apply penalties if enabled
      try {
        await penaltyService.autoApplyPenalties(userType, updatedRecord);
      } catch (penaltyError) {
        console.warn("Failed to auto-apply penalties:", penaltyError);
        // Don't fail checkout if penalty application fails
      }

      return updatedRecord;
    } catch (error) {
      console.error("Check-out error:", error);
      throw new Error("Failed to check out: " + error.message);
    }
  }

  /**
   * Mark leave for employee - ENHANCED with checklist integration
   * @param {string} userType - User type
   * @param {Object} leaveData - Leave data
   * @returns {Promise<string>} Attendance record ID
   */
  async markLeave(userType, leaveData) {
    try {
      // Check if employee already has attendance for the date
      const existingAttendance = await this.getTodayAttendance(
        userType,
        leaveData.employeeId,
        leaveData.date
      );
      if (existingAttendance) {
        throw new Error(
          "Attendance already exists for this date. Cannot mark leave."
        );
      }

      const attendancePath = this.getAttendancePath(userType);
      const attendanceRef = ref(database, attendancePath);

      const newAttendanceRef = push(attendanceRef);
      const attendanceId = newAttendanceRef.key;

      const leaveRecord = {
        id: attendanceId,
        employeeId: leaveData.employeeId,
        employeeName: leaveData.employeeName,
        date: leaveData.date,
        checkInTime: null,
        checkInPhoto: null,
        checkInLocation: null,
        checkOutTime: null,
        checkOutLocation: null,
        breaks: [],
        totalBreakTime: 0,
        totalWorkTime: 0,
        status: "on_leave",
        leaveType: leaveData.leaveType || "personal",
        leaveReason: leaveData.reason || "",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await set(newAttendanceRef, leaveRecord);

      // Auto-apply leave penalty if enabled
      try {
        await penaltyService.autoApplyPenalties(userType, leaveRecord);
      } catch (penaltyError) {
        console.warn("Failed to auto-apply leave penalty:", penaltyError);
      }

      // ENHANCED: Handle checklist reassignment when leave is marked
      try {
        console.log(
          "🔄 Triggering checklist reassignment for employee on leave..."
        );
        const { default: checklistService } = await import(
          "../checklistService"
        );

        const reassignmentResult = await checklistService.handleEmployeeLeave(
          userType,
          leaveData.employeeId,
          leaveData.date
        );

        console.log(`📋 Checklist reassignment result:`, reassignmentResult);

        return {
          attendanceId,
          checklistReassignment: reassignmentResult,
        };
      } catch (checklistError) {
        console.warn(
          "Failed to handle checklist reassignment:",
          checklistError
        );
        return {
          attendanceId,
          checklistReassignment: { error: checklistError.message },
        };
      }
    } catch (error) {
      console.error("Mark leave error:", error);
      throw new Error("Failed to mark leave: " + error.message);
    }
  }

  /**
   * Cancel leave and allow normal attendance - ENHANCED with checklist integration
   * @param {string} userType - User type
   * @param {string} attendanceId - Attendance record ID
   * @returns {Promise<void>}
   */
  async cancelLeave(userType, attendanceId) {
    try {
      const attendancePath = this.getAttendancePath(userType, attendanceId);
      const attendanceRef = ref(database, attendancePath);

      const snapshot = await get(attendanceRef);
      if (!snapshot.exists()) {
        throw new Error("Leave record not found");
      }

      const leaveRecord = snapshot.val();

      if (leaveRecord.status !== "on_leave") {
        throw new Error("Record is not a leave record");
      }

      // NEW: Handle checklist restoration before removing leave record
      try {
        console.log(
          "🔄 Triggering checklist restoration for cancelled leave..."
        );
        const { default: checklistService } = await import(
          "../checklistService"
        );
        const restorationResult =
          await checklistService.handleEmployeeLeaveCancel(
            userType,
            leaveRecord.employeeId,
            leaveRecord.date
          );
        console.log(`📋 Checklist restoration result:`, restorationResult);
      } catch (checklistError) {
        console.warn("Failed to handle checklist restoration:", checklistError);
        // Don't fail leave cancellation if checklist restoration fails
      }

      // Remove the leave record to allow normal attendance
      await set(attendanceRef, null);

      // Remove any associated leave penalties
      try {
        const penalties = await penaltyService.getEmployeePenalties(
          userType,
          leaveRecord.employeeId,
          leaveRecord.date,
          leaveRecord.date
        );

        const leavePenalties = penalties.filter(
          (p) =>
            p.type === "leave" &&
            p.status === "active" &&
            p.date === leaveRecord.date
        );

        for (const penalty of leavePenalties) {
          await penaltyService.removePenalty(
            userType,
            penalty.id,
            "system",
            "Leave cancelled"
          );
        }
      } catch (penaltyError) {
        console.warn("Failed to remove leave penalties:", penaltyError);
      }
    } catch (error) {
      console.error("Cancel leave error:", error);
      throw new Error("Failed to cancel leave: " + error.message);
    }
  }

  /**
   * Start break
   * @param {string} userType - User type
   * @param {string} attendanceId - Attendance record ID
   * @param {Object} breakData - Break start data
   * @returns {Promise<Object>} Updated attendance record
   */
  async startBreak(userType, attendanceId, breakData) {
    try {
      const attendancePath = this.getAttendancePath(userType, attendanceId);
      const attendanceRef = ref(database, attendancePath);

      const snapshot = await get(attendanceRef);
      if (!snapshot.exists()) {
        throw new Error("Attendance record not found");
      }

      const attendanceRecord = snapshot.val();

      // Cannot start break if on leave
      if (attendanceRecord.status === "on_leave") {
        throw new Error("Cannot start break while on leave");
      }

      const breaks = attendanceRecord.breaks || [];

      // Check if there's already an active break
      const activeBreak = breaks.find((br) => !br.endTime);
      if (activeBreak) {
        throw new Error("Break already in progress");
      }

      const newBreak = {
        id: Date.now().toString(),
        startTime: breakData.startTime,
        endTime: null,
        duration: 0,
      };

      breaks.push(newBreak);

      const updatedRecord = {
        ...attendanceRecord,
        breaks: breaks,
        status: "on_break",
        updatedAt: new Date().toISOString(),
      };

      await set(attendanceRef, updatedRecord);
      return updatedRecord;
    } catch (error) {
      console.error("Start break error:", error);
      throw new Error("Failed to start break: " + error.message);
    }
  }

  /**
   * End break
   * @param {string} userType - User type
   * @param {string} attendanceId - Attendance record ID
   * @param {Object} breakEndData - Break end data
   * @returns {Promise<Object>} Updated attendance record
   */
  async endBreak(userType, attendanceId, breakEndData) {
    try {
      const attendancePath = this.getAttendancePath(userType, attendanceId);
      const attendanceRef = ref(database, attendancePath);

      const snapshot = await get(attendanceRef);
      if (!snapshot.exists()) {
        throw new Error("Attendance record not found");
      }

      const attendanceRecord = snapshot.val();
      const breaks = attendanceRecord.breaks || [];

      // Find the active break
      const activeBreakIndex = breaks.findIndex((br) => !br.endTime);
      if (activeBreakIndex === -1) {
        throw new Error("No active break found");
      }

      const activeBreak = breaks[activeBreakIndex];
      const startTime = new Date(
        `${attendanceRecord.date}T${activeBreak.startTime}`
      );
      const endTime = new Date(
        `${attendanceRecord.date}T${breakEndData.endTime}`
      );
      const duration = Math.floor((endTime - startTime) / (1000 * 60)); // Duration in minutes

      breaks[activeBreakIndex] = {
        ...activeBreak,
        endTime: breakEndData.endTime,
        duration: duration,
      };

      // Calculate total break time
      const totalBreakTime = breaks.reduce(
        (total, br) => total + (br.duration || 0),
        0
      );

      const updatedRecord = {
        ...attendanceRecord,
        breaks: breaks,
        totalBreakTime: totalBreakTime,
        status: "checked_in",
        updatedAt: new Date().toISOString(),
      };

      await set(attendanceRef, updatedRecord);
      return updatedRecord;
    } catch (error) {
      console.error("End break error:", error);
      throw new Error("Failed to end break: " + error.message);
    }
  }

  /**
   * Get employee's attendance records
   * @param {string} userType - User type
   * @param {string} employeeId - Employee ID
   * @param {number} limit - Number of records to fetch
   * @returns {Promise<Array>} Attendance records
   */
  async getEmployeeAttendance(userType, employeeId, limit = null) {
    try {
      const attendancePath = this.getAttendancePath(userType);
      const attendanceRef = ref(database, attendancePath);

      const employeeQuery = query(
        attendanceRef,
        orderByChild("employeeId"),
        equalTo(employeeId)
      );

      const snapshot = await get(employeeQuery);
      if (!snapshot.exists()) {
        return [];
      }

      const records = [];
      snapshot.forEach((child) => {
        records.push(child.val());
      });

      // Sort by date descending and limit
      return records
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, limit);
    } catch (error) {
      console.error("Get employee attendance error:", error);
      throw new Error("Failed to fetch attendance records: " + error.message);
    }
  }

  /**
   * Get all employees attendance records (Admin only)
   * @param {string} userType - User type
   * @param {string} date - Specific date (YYYY-MM-DD) or null for all
   * @returns {Promise<Array>} All attendance records
   */
  async getAllEmployeesAttendance(userType, date = null) {
    try {
      const attendancePath = this.getAttendancePath(userType);
      const attendanceRef = ref(database, attendancePath);

      let attendanceQuery;
      if (date) {
        attendanceQuery = query(
          attendanceRef,
          orderByChild("date"),
          equalTo(date)
        );
      } else {
        attendanceQuery = query(attendanceRef, orderByKey());
      }

      const snapshot = await get(attendanceQuery);
      if (!snapshot.exists()) {
        return [];
      }

      const records = [];
      snapshot.forEach((child) => {
        records.push(child.val());
      });

      // Sort by date descending, then by employee name
      return records.sort((a, b) => {
        const dateCompare = new Date(b.date) - new Date(a.date);
        if (dateCompare !== 0) return dateCompare;
        return a.employeeName.localeCompare(b.employeeName);
      });
    } catch (error) {
      console.error("Get all employees attendance error:", error);
      throw new Error("Failed to fetch attendance records: " + error.message);
    }
  }

  /**
   * Get today's attendance for an employee
   * @param {string} userType - User type
   * @param {string} employeeId - Employee ID
   * @param {string} date - Date in YYYY-MM-DD format (optional, defaults to today)
   * @returns {Promise<Object|null>} Today's attendance record
   */
  async getTodayAttendance(userType, employeeId, date = null) {
    try {
      const targetDate = date || new Date().toISOString().split("T")[0]; // YYYY-MM-DD format
      const attendancePath = this.getAttendancePath(userType);
      const attendanceRef = ref(database, attendancePath);

      const todayQuery = query(
        attendanceRef,
        orderByChild("date"),
        equalTo(targetDate)
      );

      const snapshot = await get(todayQuery);
      if (!snapshot.exists()) {
        return null;
      }

      let todayRecord = null;
      snapshot.forEach((child) => {
        const record = child.val();
        if (record.employeeId === employeeId) {
          todayRecord = record;
        }
      });

      return todayRecord;
    } catch (error) {
      console.error("Get today attendance error:", error);
      throw new Error("Failed to fetch today's attendance: " + error.message);
    }
  }

  /**
   * Get attendance statistics for dashboard
   * @param {string} userType - User type
   * @param {string} employeeId - Employee ID (for employee view)
   * @returns {Promise<Object>} Statistics
   */
  async getAttendanceStats(userType, employeeId = null) {
    try {
      const today = new Date().toISOString().split("T")[0];
      const thisMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format

      const attendancePath = this.getAttendancePath(userType);
      const attendanceRef = ref(database, attendancePath);

      let baseQuery = attendanceRef;
      if (employeeId) {
        baseQuery = query(
          attendanceRef,
          orderByChild("employeeId"),
          equalTo(employeeId)
        );
      }

      const snapshot = await get(baseQuery);
      if (!snapshot.exists()) {
        return {
          todayPresent: 0,
          monthlyPresent: 0,
          totalWorkHours: 0,
          averageWorkHours: 0,
          totalLeaves: 0,
          monthlyLeaves: 0,
        };
      }

      const records = [];
      snapshot.forEach((child) => {
        records.push(child.val());
      });

      const todayRecords = records.filter((r) => r.date === today);
      const monthlyRecords = records.filter((r) =>
        r.date.startsWith(thisMonth)
      );
      const leaveRecords = records.filter((r) => r.status === "on_leave");
      const monthlyLeaves = leaveRecords.filter((r) =>
        r.date.startsWith(thisMonth)
      );

      const totalWorkMinutes = monthlyRecords.reduce((total, record) => {
        return total + (record.totalWorkTime || 0);
      }, 0);

      // Count only working days (exclude leaves) for average calculation
      const workingDays = monthlyRecords.filter((r) => r.status !== "on_leave");

      return {
        todayPresent: todayRecords.filter((r) => r.status !== "on_leave")
          .length,
        monthlyPresent: workingDays.length,
        totalWorkHours: Math.round((totalWorkMinutes / 60) * 100) / 100,
        averageWorkHours:
          workingDays.length > 0
            ? Math.round((totalWorkMinutes / workingDays.length / 60) * 100) /
              100
            : 0,
        totalLeaves: leaveRecords.length,
        monthlyLeaves: monthlyLeaves.length,
      };
    } catch (error) {
      console.error("Get attendance stats error:", error);
      throw new Error(
        "Failed to fetch attendance statistics: " + error.message
      );
    }
  }

  /**
   * Update existing leave record
   * @param {string} userType - User type
   * @param {string} attendanceId - Attendance record ID
   * @param {Object} updateData - Updated leave data
   * @returns {Promise<Object>} Updated record
   */
  async updateLeave(userType, attendanceId, updateData) {
    try {
      const attendancePath = this.getAttendancePath(userType, attendanceId);
      const attendanceRef = ref(database, attendancePath);

      const snapshot = await get(attendanceRef);
      if (!snapshot.exists()) {
        throw new Error("Leave record not found");
      }

      const leaveRecord = snapshot.val();

      if (leaveRecord.status !== "on_leave") {
        throw new Error("Record is not a leave record");
      }

      const updatedRecord = {
        ...leaveRecord,
        leaveType: updateData.leaveType || leaveRecord.leaveType,
        leaveReason: updateData.leaveReason || leaveRecord.leaveReason,
        updatedAt: new Date().toISOString(),
      };

      await set(attendanceRef, updatedRecord);
      return updatedRecord;
    } catch (error) {
      console.error("Update leave error:", error);
      throw new Error("Failed to update leave: " + error.message);
    }
  }

  /**
   * Get leave statistics
   * @param {string} userType - User type
   * @param {string} employeeId - Employee ID (optional)
   * @param {string} year - Year (optional)
   * @param {string} month - Month (optional)
   * @returns {Promise<Object>} Leave statistics
   */
  async getLeaveStats(userType, employeeId = null, year = null, month = null) {
    try {
      const attendancePath = this.getAttendancePath(userType);
      const attendanceRef = ref(database, attendancePath);

      let attendanceQuery = attendanceRef;
      if (employeeId) {
        attendanceQuery = query(
          attendanceRef,
          orderByChild("employeeId"),
          equalTo(employeeId)
        );
      }

      const snapshot = await get(attendanceQuery);
      if (!snapshot.exists()) {
        return {
          totalLeaves: 0,
          leavesByType: {},
          monthlyBreakdown: {},
        };
      }

      const records = [];
      snapshot.forEach((child) => {
        const record = child.val();
        if (record.status === "on_leave") {
          records.push(record);
        }
      });

      // Filter by year/month if specified
      let filteredRecords = records;
      if (year) {
        filteredRecords = filteredRecords.filter((r) =>
          r.date.startsWith(year)
        );
      }
      if (month) {
        const monthStr = `${year}-${month.toString().padStart(2, "0")}`;
        filteredRecords = filteredRecords.filter((r) =>
          r.date.startsWith(monthStr)
        );
      }

      // Calculate statistics
      const leavesByType = {};
      const monthlyBreakdown = {};

      filteredRecords.forEach((record) => {
        // By type
        const type = record.leaveType || "unspecified";
        leavesByType[type] = (leavesByType[type] || 0) + 1;

        // By month
        const monthKey = record.date.substring(0, 7); // YYYY-MM
        monthlyBreakdown[monthKey] = (monthlyBreakdown[monthKey] || 0) + 1;
      });

      return {
        totalLeaves: filteredRecords.length,
        leavesByType,
        monthlyBreakdown,
      };
    } catch (error) {
      console.error("Get leave stats error:", error);
      throw new Error("Failed to fetch leave statistics: " + error.message);
    }
  }
}

export default new AttendanceService();
