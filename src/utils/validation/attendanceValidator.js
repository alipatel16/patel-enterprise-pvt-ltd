// src/utils/validators/attendanceValidator.js
import { 
  validateLocationProximity,
  getCurrentPosition 
} from '../helpers/locationUtils';
import { 
  getCurrentTime,
  getCurrentDate,
  checkLateArrival,
  checkOvertime,
  isValidTimeFormat
} from '../helpers/timeUtils';
import { TIME_CONSTANTS } from '../constants/appConstants';

/**
 * Comprehensive attendance validation utilities
 */

/**
 * Validate check-in requirements
 * @param {Object} params - Validation parameters
 * @param {string} params.userType - User type (electronics/furniture)
 * @param {Object} params.currentLocation - Current GPS location
 * @param {boolean} params.requirePhoto - Whether photo is required
 * @param {string} params.photoData - Base64 photo data
 * @param {Object} params.existingAttendance - Today's existing attendance record
 * @returns {Object} Validation result
 */
export const validateCheckIn = async (params) => {
  const {
    userType,
    currentLocation,
    requirePhoto = false,
    photoData = null,
    existingAttendance = null
  } = params;

  const errors = [];
  const warnings = [];

  try {
    // 1. Check if already checked in today
    if (existingAttendance) {
      errors.push('You have already checked in today');
      return { isValid: false, errors, warnings };
    }

    // 2. Validate location if provided
    if (currentLocation) {
      const locationValidation = validateLocationProximity(currentLocation, userType);
      if (!locationValidation.isValid) {
        errors.push(locationValidation.error);
      }
      
      // Check GPS accuracy
      if (currentLocation.accuracy > 50) {
        warnings.push(`GPS accuracy is poor (${currentLocation.accuracy}m). Consider waiting for better signal.`);
      }
    } else {
      errors.push('Location is required for check-in');
    }

    // 3. Validate photo if required
    if (requirePhoto && !photoData) {
      errors.push('Photo is required for check-in');
    }

    // 4. Check time constraints (optional business rules)
    const currentTime = getCurrentTime();
    const { isLate, minutesLate } = checkLateArrival(currentTime);
    
    if (isLate && minutesLate > 30) {
      warnings.push(`You are ${minutesLate} minutes late. Please contact your supervisor.`);
    }

    // 5. Weekend/holiday checks (implement based on business needs)
    const today = new Date();
    const dayOfWeek = today.getDay();
    
    if (dayOfWeek === 0 || dayOfWeek === 6) { // Sunday or Saturday
      warnings.push('Check-in on weekend detected. Please confirm this is authorized.');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      locationValidation: currentLocation ? validateLocationProximity(currentLocation, userType) : null,
      timeInfo: {
        isLate,
        minutesLate,
        currentTime
      }
    };

  } catch (error) {
    errors.push(`Validation error: ${error.message}`);
    return { isValid: false, errors, warnings };
  }
};

/**
 * Validate check-out requirements
 * @param {Object} params - Validation parameters
 * @returns {Object} Validation result
 */
export const validateCheckOut = async (params) => {
  const {
    userType,
    currentLocation,
    attendanceRecord,
    minimumWorkHours = TIME_CONSTANTS.WORK_HOURS_PER_DAY
  } = params;

  const errors = [];
  const warnings = [];

  try {
    // 1. Check if checked in
    if (!attendanceRecord) {
      errors.push('No check-in record found for today');
      return { isValid: false, errors, warnings };
    }

    // 2. Check if already checked out
    if (attendanceRecord.checkOutTime) {
      errors.push('You have already checked out today');
      return { isValid: false, errors, warnings };
    }

    // 3. Check if on break
    if (attendanceRecord.status === 'on_break') {
      errors.push('Please end your break before checking out');
      return { isValid: false, errors, warnings };
    }

    // 4. Validate location
    if (currentLocation) {
      const locationValidation = validateLocationProximity(currentLocation, userType);
      if (!locationValidation.isValid) {
        errors.push(locationValidation.error);
      }
    } else {
      errors.push('Location is required for check-out');
    }

    // 5. Check minimum work hours
    const checkInTime = new Date(`${attendanceRecord.date}T${attendanceRecord.checkInTime}`);
    const now = new Date();
    const workedMinutes = Math.floor((now - checkInTime) / (1000 * 60));
    const workedHours = workedMinutes / 60;
    
    if (workedHours < minimumWorkHours) {
      const remaining = minimumWorkHours - workedHours;
      warnings.push(`You have worked ${workedHours.toFixed(1)} hours. Minimum is ${minimumWorkHours} hours (${remaining.toFixed(1)} hours remaining).`);
    }

    // 6. Check for overtime
    const { isOvertime, overtimeMinutes } = checkOvertime(getCurrentTime());
    if (isOvertime) {
      warnings.push(`You are working ${Math.floor(overtimeMinutes / 60)} hours ${overtimeMinutes % 60} minutes overtime.`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      workInfo: {
        workedHours: Math.round(workedHours * 100) / 100,
        minimumHours: minimumWorkHours,
        isOvertime,
        overtimeMinutes
      }
    };

  } catch (error) {
    errors.push(`Validation error: ${error.message}`);
    return { isValid: false, errors, warnings };
  }
};

/**
 * Validate break start requirements
 * @param {Object} params - Validation parameters
 * @returns {Object} Validation result
 */
export const validateBreakStart = (params) => {
  const { attendanceRecord, maxBreaksPerDay = 5 } = params;
  
  const errors = [];
  const warnings = [];

  try {
    // 1. Check if checked in
    if (!attendanceRecord) {
      errors.push('You must be checked in to start a break');
      return { isValid: false, errors, warnings };
    }

    // 2. Check if already on break
    if (attendanceRecord.status === 'on_break') {
      errors.push('You are already on a break');
      return { isValid: false, errors, warnings };
    }

    // 3. Check if checked out
    if (attendanceRecord.status === 'checked_out') {
      errors.push('Cannot start break after checkout');
      return { isValid: false, errors, warnings };
    }

    // 4. Check maximum breaks per day
    const breakCount = attendanceRecord.breaks ? attendanceRecord.breaks.length : 0;
    if (breakCount >= maxBreaksPerDay) {
      errors.push(`Maximum ${maxBreaksPerDay} breaks per day allowed`);
    }

    // 5. Check if minimum work time before break
    const checkInTime = new Date(`${attendanceRecord.date}T${attendanceRecord.checkInTime}`);
    const now = new Date();
    const workedMinutes = Math.floor((now - checkInTime) / (1000 * 60));
    
    if (workedMinutes < 60) { // Less than 1 hour
      warnings.push('You have worked less than 1 hour. Consider working longer before taking a break.');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      breakInfo: {
        breakCount,
        maxBreaks: maxBreaksPerDay,
        workedMinutes
      }
    };

  } catch (error) {
    errors.push(`Validation error: ${error.message}`);
    return { isValid: false, errors, warnings };
  }
};

/**
 * Validate break end requirements
 * @param {Object} params - Validation parameters
 * @returns {Object} Validation result
 */
export const validateBreakEnd = (params) => {
  const { attendanceRecord, minimumBreakDuration = 5 } = params;
  
  const errors = [];
  const warnings = [];

  try {
    // 1. Check if on break
    if (!attendanceRecord || attendanceRecord.status !== 'on_break') {
      errors.push('You are not currently on a break');
      return { isValid: false, errors, warnings };
    }

    // 2. Find active break
    const activeBreak = attendanceRecord.breaks?.find(br => !br.endTime);
    if (!activeBreak) {
      errors.push('No active break found');
      return { isValid: false, errors, warnings };
    }

    // 3. Check minimum break duration
    const breakStart = new Date(`${attendanceRecord.date}T${activeBreak.startTime}`);
    const now = new Date();
    const breakMinutes = Math.floor((now - breakStart) / (1000 * 60));
    
    if (breakMinutes < minimumBreakDuration) {
      warnings.push(`Break duration is only ${breakMinutes} minutes. Minimum recommended is ${minimumBreakDuration} minutes.`);
    }

    // 4. Check for excessively long breaks
    if (breakMinutes > 120) { // 2 hours
      warnings.push(`Break duration is ${breakMinutes} minutes. This seems unusually long.`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      breakInfo: {
        breakDuration: breakMinutes,
        minimumDuration: minimumBreakDuration
      }
    };

  } catch (error) {
    errors.push(`Validation error: ${error.message}`);
    return { isValid: false, errors, warnings };
  }
};

/**
 * Validate attendance data for admin operations
 * @param {Object} attendanceData - Attendance record data
 * @returns {Object} Validation result
 */
export const validateAttendanceData = (attendanceData) => {
  const errors = [];
  const warnings = [];

  try {
    // 1. Required fields
    const requiredFields = ['employeeId', 'employeeName', 'date', 'checkInTime'];
    requiredFields.forEach(field => {
      if (!attendanceData[field]) {
        errors.push(`${field} is required`);
      }
    });

    // 2. Date format validation
    if (attendanceData.date && !/^\d{4}-\d{2}-\d{2}$/.test(attendanceData.date)) {
      errors.push('Date must be in YYYY-MM-DD format');
    }

    // 3. Time format validation
    if (attendanceData.checkInTime && !isValidTimeFormat(attendanceData.checkInTime)) {
      errors.push('Check-in time must be in HH:MM format');
    }

    if (attendanceData.checkOutTime && !isValidTimeFormat(attendanceData.checkOutTime)) {
      errors.push('Check-out time must be in HH:MM format');
    }

    // 4. Logical validations
    if (attendanceData.checkInTime && attendanceData.checkOutTime) {
      const checkIn = new Date(`${attendanceData.date}T${attendanceData.checkInTime}`);
      const checkOut = new Date(`${attendanceData.date}T${attendanceData.checkOutTime}`);
      
      if (checkOut <= checkIn) {
        errors.push('Check-out time must be after check-in time');
      }
    }

    // 5. Break validations
    if (attendanceData.breaks && Array.isArray(attendanceData.breaks)) {
      attendanceData.breaks.forEach((breakItem, index) => {
        if (!breakItem.startTime || !isValidTimeFormat(breakItem.startTime)) {
          errors.push(`Break ${index + 1}: Invalid start time`);
        }
        
        if (breakItem.endTime && !isValidTimeFormat(breakItem.endTime)) {
          errors.push(`Break ${index + 1}: Invalid end time`);
        }
        
        if (breakItem.startTime && breakItem.endTime) {
          const start = new Date(`${attendanceData.date}T${breakItem.startTime}`);
          const end = new Date(`${attendanceData.date}T${breakItem.endTime}`);
          
          if (end <= start) {
            errors.push(`Break ${index + 1}: End time must be after start time`);
          }
        }
      });
    }

    // 6. Location validations
    if (attendanceData.checkInLocation) {
      const { latitude, longitude } = attendanceData.checkInLocation;
      if (typeof latitude !== 'number' || typeof longitude !== 'number') {
        errors.push('Invalid check-in location coordinates');
      }
      
      if (Math.abs(latitude) > 90 || Math.abs(longitude) > 180) {
        errors.push('Check-in location coordinates out of valid range');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };

  } catch (error) {
    errors.push(`Data validation error: ${error.message}`);
    return { isValid: false, errors, warnings };
  }
};

/**
 * Get current location with validation
 * @param {string} userType - User type for store validation
 * @returns {Promise<Object>} Location with validation
 */
export const getCurrentLocationWithValidation = async (userType) => {
  try {
    const position = await getCurrentPosition();
    const validation = validateLocationProximity(position, userType);
    
    return {
      location: position,
      validation,
      isValid: validation.isValid,
      error: validation.error
    };
  } catch (error) {
    return {
      location: null,
      validation: null,
      isValid: false,
      error: error.message
    };
  }
};

/**
 * Batch validate multiple attendance records
 * @param {Array} records - Array of attendance records
 * @returns {Object} Batch validation results
 */
export const batchValidateAttendanceRecords = (records) => {
  const results = {
    valid: [],
    invalid: [],
    warnings: [],
    summary: {
      total: records.length,
      validCount: 0,
      invalidCount: 0,
      warningCount: 0
    }
  };

  records.forEach((record, index) => {
    const validation = validateAttendanceData(record);
    
    if (validation.isValid) {
      results.valid.push({ index, record, validation });
      results.summary.validCount++;
    } else {
      results.invalid.push({ index, record, validation });
      results.summary.invalidCount++;
    }
    
    if (validation.warnings.length > 0) {
      results.warnings.push({ index, record, warnings: validation.warnings });
      results.summary.warningCount++;
    }
  });

  return results;
};

export default {
  validateCheckIn,
  validateCheckOut,
  validateBreakStart,
  validateBreakEnd,
  validateAttendanceData,
  getCurrentLocationWithValidation,
  batchValidateAttendanceRecords
};