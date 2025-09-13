// src/services/attendance/smartAutoCheckoutService.js
import { database } from '../../services/firebase/config';
import { ref, get, query, orderByChild, equalTo, update } from 'firebase/database';
import { getCollectionPath } from '../../utils/helpers/firebasePathHelper';

class SmartAutoCheckoutService {
  constructor() {
    this.collectionName = 'attendance';
    this.AUTO_CHECKOUT_TIME = '22:00'; // 10:00 PM
    this.AUTO_CHECKOUT_REASON = 'Automatic checkout - End of previous day';
  }

  /**
   * Get attendance path for user type
   */
  getAttendancePath(userType, attendanceId = null) {
    return getCollectionPath(userType, this.collectionName, attendanceId);
  }

  /**
   * Get previous working day (skips weekends if needed)
   * @returns {string} Date in YYYY-MM-DD format
   */
  getPreviousWorkingDay() {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    
    // You can add weekend logic here if needed
    // For now, just return previous day
    return yesterday.toISOString().split('T')[0];
  }

  /**
   * Check if employee has incomplete attendance from previous day
   * @param {string} userType
   * @param {string} employeeId - Firebase employee key
   * @returns {Promise<Object|null>}
   */
  async checkPreviousDayIncompleteAttendance(userType, employeeId) {
    try {
      const previousDay = this.getPreviousWorkingDay();
      console.log(`Checking incomplete attendance for ${employeeId} on ${previousDay}`);

      const attendancePath = this.getAttendancePath(userType);
      const attendanceRef = ref(database, attendancePath);
      
      // Query for previous day's attendance
      const previousDayQuery = query(
        attendanceRef,
        orderByChild('date'),
        equalTo(previousDay)
      );

      const snapshot = await get(previousDayQuery);
      if (!snapshot.exists()) {
        return null;
      }

      // Find this employee's record for previous day
      let incompleteRecord = null;
      snapshot.forEach((childSnapshot) => {
        const record = childSnapshot.val();
        if (record.employeeId === employeeId) {
          // Check if employee is still checked in or on break
          if (record.status === 'checked_in' || record.status === 'on_break') {
            incompleteRecord = {
              attendanceId: childSnapshot.key,
              ...record
            };
          }
        }
      });

      return incompleteRecord;
    } catch (error) {
      console.error('Error checking previous day incomplete attendance:', error);
      return null;
    }
  }

  /**
   * Auto-checkout employee from previous day
   * @param {string} userType
   * @param {Object} incompleteRecord
   * @returns {Promise<Object>}
   */
  async autoCheckoutPreviousDay(userType, incompleteRecord) {
    try {
      console.log(`Auto-checking out ${incompleteRecord.employeeName} from ${incompleteRecord.date}`);

      const attendancePath = this.getAttendancePath(userType, incompleteRecord.attendanceId);
      const attendanceRef = ref(database, attendancePath);
      
      // Calculate work time up to 10 PM of that day
      const checkInTime = new Date(`${incompleteRecord.date}T${incompleteRecord.checkInTime}`);
      const autoCheckoutTime = new Date(`${incompleteRecord.date}T${this.AUTO_CHECKOUT_TIME}`);
      const totalMinutes = Math.floor((autoCheckoutTime - checkInTime) / (1000 * 60));

      // Handle active breaks
      let updatedBreaks = [...(incompleteRecord.breaks || [])];
      let totalBreakTime = incompleteRecord.totalBreakTime || 0;
      
      // If employee was on break, end the current break
      if (incompleteRecord.status === 'on_break') {
        const activeBreakIndex = updatedBreaks.findIndex(br => !br.endTime);
        if (activeBreakIndex !== -1) {
          const activeBreak = updatedBreaks[activeBreakIndex];
          const breakStartTime = new Date(`${incompleteRecord.date}T${activeBreak.startTime}`);
          const breakDuration = Math.floor((autoCheckoutTime - breakStartTime) / (1000 * 60));
          
          updatedBreaks[activeBreakIndex] = {
            ...activeBreak,
            endTime: this.AUTO_CHECKOUT_TIME,
            duration: breakDuration
          };
          
          // Recalculate total break time
          totalBreakTime = updatedBreaks.reduce((total, br) => total + (br.duration || 0), 0);
        }
      }

      // Calculate final work time
      const finalWorkTime = Math.max(0, totalMinutes - totalBreakTime);

      const updatedRecord = {
        ...incompleteRecord,
        checkOutTime: this.AUTO_CHECKOUT_TIME,
        checkOutLocation: {
          latitude: null,
          longitude: null,
          accuracy: null,
          timestamp: new Date().toISOString(),
          note: 'Auto-checkout - Location not captured'
        },
        breaks: updatedBreaks,
        totalBreakTime: totalBreakTime,
        totalWorkTime: finalWorkTime,
        status: 'checked_out',
        autoCheckout: true,
        autoCheckoutReason: this.AUTO_CHECKOUT_REASON,
        autoCheckoutTime: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Remove attendanceId from the record before saving
      const { attendanceId, ...recordToSave } = updatedRecord;

      await update(attendanceRef, recordToSave);

      console.log(`✅ Auto-checkout completed for ${incompleteRecord.employeeName} from ${incompleteRecord.date}`);
      
      return updatedRecord;
    } catch (error) {
      console.error(`Error auto-checking out ${incompleteRecord.employeeName}:`, error);
      throw error;
    }
  }

  /**
   * Check and fix incomplete attendance when employee opens app
   * @param {string} userType
   * @param {string} employeeId - Firebase employee key
   * @returns {Promise<Object>} Result of the check
   */
  async checkAndFixIncompleteAttendance(userType, employeeId) {
    try {
      console.log(`🔍 Checking for incomplete attendance for employee: ${employeeId}`);

      // Check if employee has incomplete attendance from previous day
      const incompleteRecord = await this.checkPreviousDayIncompleteAttendance(userType, employeeId);
      
      if (!incompleteRecord) {
        console.log('✅ No incomplete attendance found');
        return {
          hadIncompleteAttendance: false,
          message: 'No incomplete attendance from previous day'
        };
      }

      console.log(`⚠️ Found incomplete attendance from ${incompleteRecord.date}`);

      // Auto-checkout from previous day
      const updatedRecord = await this.autoCheckoutPreviousDay(userType, incompleteRecord);

      return {
        hadIncompleteAttendance: true,
        previousDate: incompleteRecord.date,
        employeeName: incompleteRecord.employeeName,
        originalStatus: incompleteRecord.status,
        autoCheckoutTime: this.AUTO_CHECKOUT_TIME,
        workTime: this.formatDuration(updatedRecord.totalWorkTime),
        message: `Auto-checked out from ${incompleteRecord.date} at ${this.AUTO_CHECKOUT_TIME}`,
        updatedRecord
      };

    } catch (error) {
      console.error('Error in checkAndFixIncompleteAttendance:', error);
      return {
        hadIncompleteAttendance: false,
        error: error.message,
        message: 'Failed to check incomplete attendance'
      };
    }
  }

  /**
   * Format duration in minutes to readable format
   * @param {number} minutes
   * @returns {string}
   */
  formatDuration(minutes) {
    if (!minutes || minutes === 0) return '0h 0m';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  }

  /**
   * Get today's date in YYYY-MM-DD format
   * @returns {string}
   */
  getTodayDate() {
    return new Date().toISOString().split('T')[0];
  }

  /**
   * Check if employee can start fresh attendance today
   * @param {string} userType
   * @param {string} employeeId
   * @returns {Promise<boolean>}
   */
  async canStartFreshAttendanceToday(userType, employeeId) {
    try {
      const today = this.getTodayDate();
      const attendancePath = this.getAttendancePath(userType);
      const attendanceRef = ref(database, attendancePath);
      
      const todayQuery = query(
        attendanceRef,
        orderByChild('date'),
        equalTo(today)
      );

      const snapshot = await get(todayQuery);
      if (!snapshot.exists()) {
        return true; // No attendance record for today yet
      }

      // Check if this employee already has attendance for today
      let hasAttendanceToday = false;
      snapshot.forEach((childSnapshot) => {
        const record = childSnapshot.val();
        if (record.employeeId === employeeId) {
          hasAttendanceToday = true;
        }
      });

      return !hasAttendanceToday;
    } catch (error) {
      console.error('Error checking today attendance:', error);
      return false;
    }
  }
}

export default new SmartAutoCheckoutService();