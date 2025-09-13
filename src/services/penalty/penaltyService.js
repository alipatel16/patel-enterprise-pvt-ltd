// src/services/penalty/penaltyService.js - UPDATED WITH SUNDAY WEEKENDS & PAID LEAVES
import { database } from '../firebase/config';
import { ref, set, get, push, remove, query, orderByChild, equalTo } from 'firebase/database';
import { getCollectionPath } from '../../utils/helpers/firebasePathHelper';

class PenaltyService {
  constructor() {
    this.settingsCollection = 'penalty_settings';
    this.penaltiesCollection = 'penalties';
  }

  /**
   * Get penalty settings path
   */
  getSettingsPath(userType) {
    return getCollectionPath(userType, this.settingsCollection);
  }

  /**
   * Get penalties path
   */
  getPenaltiesPath(userType, penaltyId = null) {
    return getCollectionPath(userType, this.penaltiesCollection, penaltyId);
  }

  /**
   * Get penalty settings for user type
   */
  async getPenaltySettings(userType) {
    try {
      const settingsPath = this.getSettingsPath(userType);
      const settingsRef = ref(database, settingsPath);
      const snapshot = await get(settingsRef);
      
      if (snapshot.exists()) {
        return snapshot.val();
      }
      
      // Return default settings if none exist
      return this.getDefaultSettings();
    } catch (error) {
      console.error('Error getting penalty settings:', error);
      throw new Error('Failed to get penalty settings: ' + error.message);
    }
  }

  /**
   * Update penalty settings (Admin only)
   */
  async updatePenaltySettings(userType, settings) {
    try {
      const settingsPath = this.getSettingsPath(userType);
      const settingsRef = ref(database, settingsPath);
      
      const updatedSettings = {
        ...settings,
        updatedAt: new Date().toISOString(),
        updatedBy: settings.updatedBy || 'admin'
      };
      
      await set(settingsRef, updatedSettings);
      return updatedSettings;
    } catch (error) {
      console.error('Error updating penalty settings:', error);
      throw new Error('Failed to update penalty settings: ' + error.message);
    }
  }

  /**
   * Check if date is a Sunday (weekend)
   * Updated to only consider Sunday as weekend, not Saturday
   */
  isSunday(dateString) {
    const date = new Date(dateString);
    return date.getDay() === 0; // 0 = Sunday
  }

  /**
   * Count employee's leaves in a specific period
   */
  async getEmployeeLeaveCount(userType, employeeId, startDate, endDate) {
    try {
      // Get attendance service to count leaves
      const attendanceService = require('../attendance/attendanceService').default;
      const attendanceRecords = await attendanceService.getEmployeeAttendance(userType, employeeId, 100);
      
      // Filter for leave records in the specified period
      const leaveRecords = attendanceRecords.filter(record => 
        record.status === 'on_leave' && 
        record.date >= startDate && 
        record.date <= endDate
      );

      return leaveRecords.length;
    } catch (error) {
      console.error('Error counting employee leaves:', error);
      return 0;
    }
  }

  /**
   * Check if leave penalty should apply based on paid leave allowance
   * NEW: Only apply penalty after employee exceeds their paid leave quota
   */
  async shouldApplyLeavePenalty(userType, employeeId, leaveDate, settings) {
  try {
    const { paidLeavesPerMonth = 2 } = settings;

    // Get the month boundaries for the leave date
    const leaveYear = parseInt(leaveDate.substring(0, 4));
    const leaveMonth = parseInt(leaveDate.substring(5, 7));
    const startDate = `${leaveYear}-${leaveMonth.toString().padStart(2, '0')}-01`;
    
    // Get the last day of the month
    const lastDay = new Date(leaveYear, leaveMonth, 0).getDate();
    const endDate = `${leaveYear}-${leaveMonth.toString().padStart(2, '0')}-${lastDay.toString().padStart(2, '0')}`;

    // Count total leaves taken this month EXCLUDING the current leave being processed
    const attendancePath = this.getAttendancePath ? 
      this.getAttendancePath(userType) : 
      getCollectionPath(userType, 'attendance');
    
    const attendanceRef = ref(database, attendancePath);
    const employeeQuery = query(
      attendanceRef,
      orderByChild('employeeId'),
      equalTo(employeeId)
    );

    const snapshot = await get(employeeQuery);
    if (!snapshot.exists()) {
      return false; // No previous leaves, so this should be free
    }

    let currentMonthLeaves = 0;
    snapshot.forEach((child) => {
      const record = child.val();
      // Count leaves in the current month, excluding the current date being processed
      if (record.status === 'on_leave' && 
          record.date >= startDate && 
          record.date <= endDate &&
          record.date !== leaveDate) { // Exclude current leave date
        currentMonthLeaves++;
      }
    });
    
    // Only apply penalty if employee has already used their paid leave quota
    return currentMonthLeaves >= paidLeavesPerMonth;
  } catch (error) {
    console.error('Error checking leave penalty eligibility:', error);
    // If we can't determine, don't apply penalty (safer default)
    return false;
  }
}

  /**
   * Calculate hourly penalty for employee
   */
  calculateHourlyPenalty(attendanceRecord, settings) {
    if (!attendanceRecord || !settings) return 0;

    const { 
      hourlyPenaltyRate = 0, 
      lateArrivalThreshold = 15, 
      earlyDepartureThreshold = 15,
      weekendPenaltyEnabled = false
    } = settings;

    // NEW: Check if it's Sunday and weekend penalties are disabled
    if (!weekendPenaltyEnabled && this.isSunday(attendanceRecord.date)) {
      return 0; // No penalty for Sunday if weekend penalties are disabled
    }

    let penaltyHours = 0;
    const standardWorkHours = 8; // hours
    const standardWorkMinutes = standardWorkHours * 60;

    // Calculate actual work time
    const actualWorkMinutes = attendanceRecord.totalWorkTime || 0;
    const shortfallMinutes = Math.max(0, standardWorkMinutes - actualWorkMinutes);
    
    // Convert shortfall to hours for penalty calculation
    penaltyHours = shortfallMinutes / 60;

    // Add late arrival penalty
    if (attendanceRecord.checkInTime && attendanceRecord.expectedCheckIn) {
      const checkInTime = new Date(`${attendanceRecord.date}T${attendanceRecord.checkInTime}`);
      const expectedTime = new Date(`${attendanceRecord.date}T${attendanceRecord.expectedCheckIn || '09:00'}`);
      const lateMinutes = Math.max(0, (checkInTime - expectedTime) / (1000 * 60));
      
      if (lateMinutes > lateArrivalThreshold) {
        penaltyHours += (lateMinutes - lateArrivalThreshold) / 60;
      }
    }

    // Add early departure penalty
    if (attendanceRecord.checkOutTime && attendanceRecord.expectedCheckOut) {
      const checkOutTime = new Date(`${attendanceRecord.date}T${attendanceRecord.checkOutTime}`);
      const expectedTime = new Date(`${attendanceRecord.date}T${attendanceRecord.expectedCheckOut || '18:00'}`);
      const earlyMinutes = Math.max(0, (expectedTime - checkOutTime) / (1000 * 60));
      
      if (earlyMinutes > earlyDepartureThreshold) {
        penaltyHours += (earlyMinutes - earlyDepartureThreshold) / 60;
      }
    }

    return penaltyHours * hourlyPenaltyRate;
  }

  /**
   * Apply penalty to employee for a specific date
   */
  async applyPenalty(userType, penaltyData) {
    try {
      const penaltiesPath = this.getPenaltiesPath(userType);
      const penaltyRef = push(ref(database, penaltiesPath));
      
      const penalty = {
        id: penaltyRef.key,
        employeeId: penaltyData.employeeId,
        employeeName: penaltyData.employeeName,
        date: penaltyData.date,
        type: penaltyData.type, // 'hourly', 'leave', 'manual'
        amount: penaltyData.amount,
        reason: penaltyData.reason,
        attendanceId: penaltyData.attendanceId || null,
        appliedBy: penaltyData.appliedBy,
        appliedAt: new Date().toISOString(),
        status: 'active',
        removedAt: null,
        removedBy: null,
        removedReason: null
      };

      await set(penaltyRef, penalty);
      return penalty;
    } catch (error) {
      console.error('Error applying penalty:', error);
      throw new Error('Failed to apply penalty: ' + error.message);
    }
  }

  /**
   * Remove penalty
   */
  async removePenalty(userType, penaltyId, removedBy, reason = '') {
    try {
      const penaltyPath = this.getPenaltiesPath(userType, penaltyId);
      const penaltyRef = ref(database, penaltyPath);
      
      const snapshot = await get(penaltyRef);
      if (!snapshot.exists()) {
        throw new Error('Penalty not found');
      }

      const penalty = snapshot.val();
      const updatedPenalty = {
        ...penalty,
        status: 'removed',
        removedAt: new Date().toISOString(),
        removedBy,
        removedReason: reason
      };

      await set(penaltyRef, updatedPenalty);
      return updatedPenalty;
    } catch (error) {
      console.error('Error removing penalty:', error);
      throw new Error('Failed to remove penalty: ' + error.message);
    }
  }

  /**
   * Remove all penalties for a specific date
   */
  async removeDailyPenalties(userType, employeeId, date, removedBy, reason = '') {
    try {
      const penaltiesPath = this.getPenaltiesPath(userType);
      const penaltiesRef = ref(database, penaltiesPath);
      
      const penaltyQuery = query(
        penaltiesRef,
        orderByChild('employeeId'),
        equalTo(employeeId)
      );

      const snapshot = await get(penaltyQuery);
      if (!snapshot.exists()) {
        return [];
      }

      const removedPenalties = [];
      const updates = {};

      snapshot.forEach((child) => {
        const penalty = child.val();
        if (penalty.date === date && penalty.status === 'active') {
          const updatedPenalty = {
            ...penalty,
            status: 'removed',
            removedAt: new Date().toISOString(),
            removedBy,
            removedReason: reason
          };
          updates[child.key] = updatedPenalty;
          removedPenalties.push(updatedPenalty);
        }
      });

      // Batch update
      for (const [penaltyId, penaltyData] of Object.entries(updates)) {
        const penaltyPath = this.getPenaltiesPath(userType, penaltyId);
        await set(ref(database, penaltyPath), penaltyData);
      }

      return removedPenalties;
    } catch (error) {
      console.error('Error removing daily penalties:', error);
      throw new Error('Failed to remove daily penalties: ' + error.message);
    }
  }

  /**
   * Remove all penalties for a month
   */
  async removeMonthlyPenalties(userType, employeeId, year, month, removedBy, reason = '') {
    try {
      const monthPrefix = `${year}-${month.toString().padStart(2, '0')}`;
      const penaltiesPath = this.getPenaltiesPath(userType);
      const penaltiesRef = ref(database, penaltiesPath);
      
      const penaltyQuery = query(
        penaltiesRef,
        orderByChild('employeeId'),
        equalTo(employeeId)
      );

      const snapshot = await get(penaltyQuery);
      if (!snapshot.exists()) {
        return [];
      }

      const removedPenalties = [];
      const updates = {};

      snapshot.forEach((child) => {
        const penalty = child.val();
        if (penalty.date.startsWith(monthPrefix) && penalty.status === 'active') {
          const updatedPenalty = {
            ...penalty,
            status: 'removed',
            removedAt: new Date().toISOString(),
            removedBy,
            removedReason: reason
          };
          updates[child.key] = updatedPenalty;
          removedPenalties.push(updatedPenalty);
        }
      });

      // Batch update
      for (const [penaltyId, penaltyData] of Object.entries(updates)) {
        const penaltyPath = this.getPenaltiesPath(userType, penaltyId);
        await set(ref(database, penaltyPath), penaltyData);
      }

      return removedPenalties;
    } catch (error) {
      console.error('Error removing monthly penalties:', error);
      throw new Error('Failed to remove monthly penalties: ' + error.message);
    }
  }

  /**
   * Get employee penalties
   */
  async getEmployeePenalties(userType, employeeId, startDate = null, endDate = null) {
    try {
      const penaltiesPath = this.getPenaltiesPath(userType);
      const penaltiesRef = ref(database, penaltiesPath);
      
      const penaltyQuery = query(
        penaltiesRef,
        orderByChild('employeeId'),
        equalTo(employeeId)
      );

      const snapshot = await get(penaltyQuery);
      if (!snapshot.exists()) {
        return [];
      }

      const penalties = [];
      snapshot.forEach((child) => {
        const penalty = child.val();
        
        // Filter by date range if provided
        if (startDate && penalty.date < startDate) return;
        if (endDate && penalty.date > endDate) return;
        
        penalties.push(penalty);
      });

      // Sort by date descending
      return penalties.sort((a, b) => new Date(b.date) - new Date(a.date));
    } catch (error) {
      console.error('Error getting employee penalties:', error);
      throw new Error('Failed to get employee penalties: ' + error.message);
    }
  }

  /**
   * Calculate total penalties for period
   */
  async calculateTotalPenalties(userType, employeeId, startDate, endDate) {
    try {
      const penalties = await this.getEmployeePenalties(userType, employeeId, startDate, endDate);
      
      const activePenalties = penalties.filter(p => p.status === 'active');
      const totalAmount = activePenalties.reduce((sum, p) => sum + (p.amount || 0), 0);
      
      return {
        totalAmount,
        penaltyCount: activePenalties.length,
        removedCount: penalties.filter(p => p.status === 'removed').length,
        breakdown: {
          hourly: activePenalties.filter(p => p.type === 'hourly').reduce((sum, p) => sum + p.amount, 0),
          leave: activePenalties.filter(p => p.type === 'leave').reduce((sum, p) => sum + p.amount, 0),
          manual: activePenalties.filter(p => p.type === 'manual').reduce((sum, p) => sum + p.amount, 0)
        },
        penalties: activePenalties
      };
    } catch (error) {
      console.error('Error calculating total penalties:', error);
      throw new Error('Failed to calculate penalties: ' + error.message);
    }
  }

  /**
   * Calculate final salary after penalties
   */
  async calculateFinalSalary(userType, employeeId, baseSalary, startDate, endDate) {
    try {
      const penaltyData = await this.calculateTotalPenalties(userType, employeeId, startDate, endDate);
      
      const finalSalary = Math.max(0, baseSalary - penaltyData.totalAmount);
      
      return {
        baseSalary,
        totalPenalties: penaltyData.totalAmount,
        finalSalary,
        penaltyBreakdown: penaltyData.breakdown,
        penaltyDetails: penaltyData.penalties
      };
    } catch (error) {
      console.error('Error calculating final salary:', error);
      throw new Error('Failed to calculate final salary: ' + error.message);
    }
  }

  /**
   * Get default penalty settings
   * UPDATED: Added new settings for Sunday-only weekends and paid leaves
   */
  getDefaultSettings() {
    return {
      hourlyPenaltyRate: 50, // ₹50 per hour
      leavePenaltyRate: 500, // ₹500 per leave
      lateArrivalThreshold: 15, // minutes
      earlyDepartureThreshold: 15, // minutes
      autoApplyPenalties: true,
      workingHoursPerDay: 8,
      expectedCheckInTime: '09:00',
      expectedCheckOutTime: '18:00',
      weekendPenaltyEnabled: false, // Only applies to Sundays now
      holidayPenaltyEnabled: false,
      paidLeavesPerMonth: 2, // NEW: Number of paid leaves per month before penalties apply
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  /**
   * Auto-apply penalties based on attendance record
   * UPDATED: Enhanced logic for Sunday weekends and paid leave tracking
   */
  async autoApplyPenalties(userType, attendanceRecord, employeeSalary = null) {
  try {
    const settings = await this.getPenaltySettings(userType);
    
    if (!settings.autoApplyPenalties) {
      return null;
    }

    const penalties = [];

    // Apply leave penalty - FIXED: Only if employee has exceeded paid leave quota
    if (attendanceRecord.status === 'on_leave') {
      const shouldPenalize = await this.shouldApplyLeavePenalty(
        userType, 
        attendanceRecord.employeeId, 
        attendanceRecord.date, // Use the actual leave date from attendance record
        settings
      );

      if (shouldPenalize) {
        const leavePenalty = await this.applyPenalty(userType, {
          employeeId: attendanceRecord.employeeId,
          employeeName: attendanceRecord.employeeName,
          date: attendanceRecord.date, // FIXED: Use the same date as the leave
          type: 'leave',
          amount: settings.leavePenaltyRate,
          reason: `Leave penalty for ${attendanceRecord.leaveType || 'unspecified'} leave (exceeded paid leave quota)`,
          attendanceId: attendanceRecord.id, // Link to the attendance record
          appliedBy: 'system'
        });
        penalties.push(leavePenalty);
      }
    }

    // Apply hourly penalty for incomplete work - UPDATED: Enhanced Sunday logic
    if (attendanceRecord.status === 'checked_out') {
      const hourlyPenaltyAmount = this.calculateHourlyPenalty(attendanceRecord, settings);
      
      if (hourlyPenaltyAmount > 0) {
        let penaltyReason = 'Hourly penalty for incomplete work hours or late arrival/early departure';
        
        // Add Sunday context if applicable
        if (this.isSunday(attendanceRecord.date) && settings.weekendPenaltyEnabled) {
          penaltyReason += ' (Sunday work)';
        }

        const hourlyPenalty = await this.applyPenalty(userType, {
          employeeId: attendanceRecord.employeeId,
          employeeName: attendanceRecord.employeeName,
          date: attendanceRecord.date, // Use the actual work date
          type: 'hourly',
          amount: hourlyPenaltyAmount,
          reason: penaltyReason,
          attendanceId: attendanceRecord.id,
          appliedBy: 'system'
        });
        penalties.push(hourlyPenalty);
      }
    }

    return penalties;
  } catch (error) {
    console.error('Error auto-applying penalties:', error);
    throw new Error('Failed to auto-apply penalties: ' + error.message);
  }
}
}

export default new PenaltyService();