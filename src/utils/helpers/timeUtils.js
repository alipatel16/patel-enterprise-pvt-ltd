// src/utils/helpers/timeUtils.js
import { TIME_CONSTANTS } from '../constants/appConstants';

/**
 * Get current time in HH:MM format
 * @returns {string} Current time
 */
export const getCurrentTime = () => {
  return new Date().toLocaleTimeString('en-US', { 
    hour12: false,
    hour: '2-digit',
    minute: '2-digit'
  });
};

/**
 * Get current date in YYYY-MM-DD format
 * @returns {string} Current date
 */
export const getCurrentDate = () => {
  return new Date().toISOString().split('T')[0];
};

/**
 * Format time string to display format
 * @param {string} timeString - Time in HH:MM format
 * @param {boolean} use12Hour - Whether to use 12-hour format
 * @returns {string} Formatted time
 */
export const formatTime = (timeString, use12Hour = true) => {
  if (!timeString) return 'N/A';
  
  try {
    const time = new Date(`2000-01-01T${timeString}`);
    return time.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: use12Hour
    });
  } catch (error) {
    return timeString;
  }
};

/**
 * Format date string to display format
 * @param {string} dateString - Date in YYYY-MM-DD format
 * @param {Object} options - Formatting options
 * @returns {string} Formatted date
 */
export const formatDate = (dateString, options = {}) => {
  if (!dateString) return 'N/A';
  
  const defaultOptions = {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  };
  
  try {
    return new Date(dateString).toLocaleDateString('en-US', {
      ...defaultOptions,
      ...options
    });
  } catch (error) {
    return dateString;
  }
};

/**
 * Format duration in minutes to readable format
 * @param {number} minutes - Duration in minutes
 * @param {boolean} shortForm - Whether to use short form (1h 30m vs 1 hour 30 minutes)
 * @returns {string} Formatted duration
 */
export const formatDuration = (minutes, shortForm = true) => {
  if (!minutes || minutes === 0) return shortForm ? '0m' : '0 minutes';
  
  const hours = Math.floor(minutes / TIME_CONSTANTS.MINUTES_PER_HOUR);
  const mins = minutes % TIME_CONSTANTS.MINUTES_PER_HOUR;
  
  if (shortForm) {
    if (hours === 0) return `${mins}m`;
    if (mins === 0) return `${hours}h`;
    return `${hours}h ${mins}m`;
  } else {
    const hourText = hours === 1 ? 'hour' : 'hours';
    const minText = mins === 1 ? 'minute' : 'minutes';
    
    if (hours === 0) return `${mins} ${minText}`;
    if (mins === 0) return `${hours} ${hourText}`;
    return `${hours} ${hourText} ${mins} ${minText}`;
  }
};

/**
 * Calculate time difference in minutes
 * @param {string} startTime - Start time in HH:MM format
 * @param {string} endTime - End time in HH:MM format
 * @param {string} date - Date in YYYY-MM-DD format (optional, defaults to today)
 * @returns {number} Difference in minutes
 */
export const calculateTimeDifference = (startTime, endTime, date = null) => {
  if (!startTime || !endTime) return 0;
  
  const baseDate = date || getCurrentDate();
  
  try {
    const start = new Date(`${baseDate}T${startTime}`);
    const end = new Date(`${baseDate}T${endTime}`);
    
    // Handle case where end time is next day (overnight)
    if (end < start) {
      end.setDate(end.getDate() + 1);
    }
    
    return Math.floor((end - start) / TIME_CONSTANTS.MILLISECONDS_PER_MINUTE);
  } catch (error) {
    console.error('Error calculating time difference:', error);
    return 0;
  }
};

/**
 * Calculate total work time excluding breaks
 * @param {string} checkInTime - Check-in time
 * @param {string} checkOutTime - Check-out time
 * @param {Array} breaks - Array of break objects with startTime, endTime, duration
 * @param {string} date - Date for calculation
 * @returns {number} Total work time in minutes
 */
export const calculateWorkTime = (checkInTime, checkOutTime, breaks = [], date = null) => {
  if (!checkInTime || !checkOutTime) return 0;
  
  const totalTime = calculateTimeDifference(checkInTime, checkOutTime, date);
  const totalBreakTime = breaks.reduce((sum, breakItem) => sum + (breakItem.duration || 0), 0);
  
  return Math.max(0, totalTime - totalBreakTime);
};

/**
 * Check if employee is late based on expected start time
 * @param {string} checkInTime - Actual check-in time
 * @param {string} expectedStartTime - Expected start time (default from constants)
 * @returns {Object} {isLate: boolean, minutesLate: number}
 */
export const checkLateArrival = (checkInTime, expectedStartTime = TIME_CONSTANTS.DEFAULT_WORK_START_TIME) => {
  if (!checkInTime) return { isLate: false, minutesLate: 0 };
  
  const minutesLate = calculateTimeDifference(expectedStartTime, checkInTime);
  
  return {
    isLate: minutesLate > 0,
    minutesLate: Math.max(0, minutesLate)
  };
};

/**
 * Check if employee worked overtime
 * @param {string} checkOutTime - Actual check-out time
 * @param {string} expectedEndTime - Expected end time (default from constants)
 * @returns {Object} {isOvertime: boolean, overtimeMinutes: number}
 */
export const checkOvertime = (checkOutTime, expectedEndTime = TIME_CONSTANTS.DEFAULT_WORK_END_TIME) => {
  if (!checkOutTime) return { isOvertime: false, overtimeMinutes: 0 };
  
  const overtimeMinutes = calculateTimeDifference(expectedEndTime, checkOutTime);
  
  return {
    isOvertime: overtimeMinutes > 0,
    overtimeMinutes: Math.max(0, overtimeMinutes)
  };
};

/**
 * Validate time format (HH:MM)
 * @param {string} timeString - Time string to validate
 * @returns {boolean} Whether time format is valid
 */
export const isValidTimeFormat = (timeString) => {
  const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
  return timeRegex.test(timeString);
};

/**
 * Convert 12-hour time to 24-hour time
 * @param {string} time12h - Time in 12-hour format (e.g., "2:30 PM")
 * @returns {string} Time in 24-hour format (e.g., "14:30")
 */
export const convertTo24Hour = (time12h) => {
  if (!time12h) return '';
  
  try {
    const [time, modifier] = time12h.split(' ');
    let [hours, minutes] = time.split(':');
    
    if (hours === '12') {
      hours = '00';
    }
    
    if (modifier === 'PM') {
      hours = parseInt(hours, 10) + 12;
    }
    
    return `${hours.toString().padStart(2, '0')}:${minutes}`;
  } catch (error) {
    return time12h;
  }
};

/**
 * Convert 24-hour time to 12-hour time
 * @param {string} time24h - Time in 24-hour format (e.g., "14:30")
 * @returns {string} Time in 12-hour format (e.g., "2:30 PM")
 */
export const convertTo12Hour = (time24h) => {
  if (!time24h) return '';
  
  try {
    const [hours, minutes] = time24h.split(':');
    const hour12 = parseInt(hours, 10) % 12 || 12;
    const modifier = parseInt(hours, 10) >= 12 ? 'PM' : 'AM';
    
    return `${hour12}:${minutes} ${modifier}`;
  } catch (error) {
    return time24h;
  }
};

/**
 * Get week start and end dates
 * @param {Date} date - Reference date (defaults to today)
 * @returns {Object} {startDate: string, endDate: string} in YYYY-MM-DD format
 */
export const getWeekRange = (date = new Date()) => {
  const start = new Date(date);
  const day = start.getDay();
  const diff = start.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
  
  start.setDate(diff);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  
  return {
    startDate: start.toISOString().split('T')[0],
    endDate: end.toISOString().split('T')[0]
  };
};

/**
 * Get month start and end dates
 * @param {Date} date - Reference date (defaults to today)
 * @returns {Object} {startDate: string, endDate: string} in YYYY-MM-DD format
 */
export const getMonthRange = (date = new Date()) => {
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  
  return {
    startDate: start.toISOString().split('T')[0],
    endDate: end.toISOString().split('T')[0]
  };
};

/**
 * Calculate working days between two dates (excluding weekends)
 * @param {string} startDate - Start date in YYYY-MM-DD format
 * @param {string} endDate - End date in YYYY-MM-DD format
 * @returns {number} Number of working days
 */
export const calculateWorkingDays = (startDate, endDate) => {
  if (!startDate || !endDate) return 0;
  
  const start = new Date(startDate);
  const end = new Date(endDate);
  let workingDays = 0;
  
  const current = new Date(start);
  while (current <= end) {
    const dayOfWeek = current.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Not Sunday (0) or Saturday (6)
      workingDays++;
    }
    current.setDate(current.getDate() + 1);
  }
  
  return workingDays;
};

/**
 * Get time zones for display
 * @returns {string} Current timezone
 */
export const getCurrentTimezone = () => {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
};

/**
 * Format attendance summary for reports
 * @param {Array} attendanceRecords - Array of attendance records
 * @returns {Object} Summary statistics
 */
export const formatAttendanceSummary = (attendanceRecords) => {
  if (!attendanceRecords || attendanceRecords.length === 0) {
    return {
      totalDays: 0,
      totalWorkTime: 0,
      totalBreakTime: 0,
      averageWorkTime: 0,
      averageBreakTime: 0,
      lateArrivals: 0,
      overtimeOccurrences: 0
    };
  }
  
  const totalDays = attendanceRecords.length;
  const totalWorkTime = attendanceRecords.reduce((sum, record) => sum + (record.totalWorkTime || 0), 0);
  const totalBreakTime = attendanceRecords.reduce((sum, record) => sum + (record.totalBreakTime || 0), 0);
  
  let lateArrivals = 0;
  let overtimeOccurrences = 0;
  
  attendanceRecords.forEach(record => {
    if (record.checkInTime) {
      const { isLate } = checkLateArrival(record.checkInTime);
      if (isLate) lateArrivals++;
    }
    
    if (record.checkOutTime) {
      const { isOvertime } = checkOvertime(record.checkOutTime);
      if (isOvertime) overtimeOccurrences++;
    }
  });
  
  return {
    totalDays,
    totalWorkTime,
    totalBreakTime,
    averageWorkTime: totalDays > 0 ? Math.round(totalWorkTime / totalDays) : 0,
    averageBreakTime: totalDays > 0 ? Math.round(totalBreakTime / totalDays) : 0,
    lateArrivals,
    overtimeOccurrences
  };
};

export default {
  getCurrentTime,
  getCurrentDate,
  formatTime,
  formatDate,
  formatDuration,
  calculateTimeDifference,
  calculateWorkTime,
  checkLateArrival,
  checkOvertime,
  isValidTimeFormat,
  convertTo24Hour,
  convertTo12Hour,
  getWeekRange,
  getMonthRange,
  calculateWorkingDays,
  getCurrentTimezone,
  formatAttendanceSummary
};