import { format, parse, isValid, addDays, addMonths, differenceInDays, differenceInMonths, startOfDay, endOfDay } from 'date-fns';
import { DATE_FORMATS } from '../constants/appConstants';

/**
 * Format date for display
 * @param {Date|string} date - Date to format
 * @param {string} formatStr - Format string (default: DD/MM/YYYY)
 * @returns {string} Formatted date string
 */
export const formatDate = (date, formatStr = DATE_FORMATS.DISPLAY) => {
  if (!date) return '';
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    if (!isValid(dateObj)) return '';
    
    return format(dateObj, formatStr);
  } catch (error) {
    console.error('Error formatting date:', error);
    return '';
  }
};

/**
 * Format date for storage (ISO string)
 * @param {Date|string} date - Date to format
 * @returns {string} ISO date string
 */
export const formatDateForStorage = (date) => {
  if (!date) return '';
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    if (!isValid(dateObj)) return '';
    
    return dateObj.toISOString();
  } catch (error) {
    console.error('Error formatting date for storage:', error);
    return '';
  }
};

/**
 * Parse date from string
 * @param {string} dateString - Date string to parse
 * @param {string} formatStr - Expected format
 * @returns {Date|null} Parsed date or null if invalid
 */
export const parseDate = (dateString, formatStr = DATE_FORMATS.DISPLAY) => {
  if (!dateString) return null;
  
  try {
    const parsed = parse(dateString, formatStr, new Date());
    return isValid(parsed) ? parsed : null;
  } catch (error) {
    // Try parsing as ISO string
    try {
      const isoDate = new Date(dateString);
      return isValid(isoDate) ? isoDate : null;
    } catch (isoError) {
      console.error('Error parsing date:', error);
      return null;
    }
  }
};

/**
 * Get current date in IST timezone
 * @returns {Date} Current date
 */
export const getCurrentDate = () => {
  return new Date();
};

/**
 * Get current date formatted for display
 * @param {string} formatStr - Format string
 * @returns {string} Formatted current date
 */
export const getCurrentDateFormatted = (formatStr = DATE_FORMATS.DISPLAY) => {
  return formatDate(getCurrentDate(), formatStr);
};

/**
 * Get current date formatted for storage
 * @returns {string} ISO date string
 */
export const getCurrentDateForStorage = () => {
  return formatDateForStorage(getCurrentDate());
};

/**
 * Add days to date
 * @param {Date|string} date - Base date
 * @param {number} days - Number of days to add
 * @returns {Date|null} New date or null if invalid
 */
export const addDaysToDate = (date, days) => {
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    if (!isValid(dateObj)) return null;
    
    return addDays(dateObj, days);
  } catch (error) {
    console.error('Error adding days to date:', error);
    return null;
  }
};

/**
 * Add months to date
 * @param {Date|string} date - Base date
 * @param {number} months - Number of months to add
 * @returns {Date|null} New date or null if invalid
 */
export const addMonthsToDate = (date, months) => {
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    if (!isValid(dateObj)) return null;
    
    return addMonths(dateObj, months);
  } catch (error) {
    console.error('Error adding months to date:', error);
    return null;
  }
};

/**
 * Calculate difference in days between two dates
 * @param {Date|string} startDate - Start date
 * @param {Date|string} endDate - End date
 * @returns {number} Difference in days
 */
export const getDaysDifference = (startDate, endDate) => {
  try {
    const start = typeof startDate === 'string' ? new Date(startDate) : startDate;
    const end = typeof endDate === 'string' ? new Date(endDate) : endDate;
    
    if (!isValid(start) || !isValid(end)) return 0;
    
    return differenceInDays(end, start);
  } catch (error) {
    console.error('Error calculating days difference:', error);
    return 0;
  }
};

/**
 * Calculate difference in months between two dates
 * @param {Date|string} startDate - Start date
 * @param {Date|string} endDate - End date
 * @returns {number} Difference in months
 */
export const getMonthsDifference = (startDate, endDate) => {
  try {
    const start = typeof startDate === 'string' ? new Date(startDate) : startDate;
    const end = typeof endDate === 'string' ? new Date(endDate) : endDate;
    
    if (!isValid(start) || !isValid(end)) return 0;
    
    return differenceInMonths(end, start);
  } catch (error) {
    console.error('Error calculating months difference:', error);
    return 0;
  }
};

/**
 * Check if date is today
 * @param {Date|string} date - Date to check
 * @returns {boolean} True if date is today
 */
export const isToday = (date) => {
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    if (!isValid(dateObj)) return false;
    
    const today = getCurrentDate();
    return formatDate(dateObj, 'yyyy-MM-dd') === formatDate(today, 'yyyy-MM-dd');
  } catch (error) {
    console.error('Error checking if date is today:', error);
    return false;
  }
};

/**
 * Check if date is in the past
 * @param {Date|string} date - Date to check
 * @returns {boolean} True if date is in the past
 */
export const isPastDate = (date) => {
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    if (!isValid(dateObj)) return false;
    
    return dateObj < getCurrentDate();
  } catch (error) {
    console.error('Error checking if date is past:', error);
    return false;
  }
};

/**
 * Check if date is in the future
 * @param {Date|string} date - Date to check
 * @returns {boolean} True if date is in the future
 */
export const isFutureDate = (date) => {
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    if (!isValid(dateObj)) return false;
    
    return dateObj > getCurrentDate();
  } catch (error) {
    console.error('Error checking if date is future:', error);
    return false;
  }
};

/**
 * Get start of day
 * @param {Date|string} date - Date
 * @returns {Date|null} Start of day or null if invalid
 */
export const getStartOfDay = (date) => {
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    if (!isValid(dateObj)) return null;
    
    return startOfDay(dateObj);
  } catch (error) {
    console.error('Error getting start of day:', error);
    return null;
  }
};

/**
 * Get end of day
 * @param {Date|string} date - Date
 * @returns {Date|null} End of day or null if invalid
 */
export const getEndOfDay = (date) => {
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    if (!isValid(dateObj)) return null;
    
    return endOfDay(dateObj);
  } catch (error) {
    console.error('Error getting end of day:', error);
    return null;
  }
};

/**
 * Format relative time (e.g., "2 days ago", "in 3 months")
 * @param {Date|string} date - Date to format
 * @returns {string} Relative time string
 */
export const formatRelativeTime = (date) => {
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    if (!isValid(dateObj)) return '';
    
    const now = getCurrentDate();
    const diffInDays = getDaysDifference(dateObj, now);
    
    if (Math.abs(diffInDays) === 0) {
      return 'Today';
    } else if (diffInDays === 1) {
      return 'Tomorrow';
    } else if (diffInDays === -1) {
      return 'Yesterday';
    } else if (diffInDays > 0 && diffInDays <= 7) {
      return `In ${diffInDays} days`;
    } else if (diffInDays < 0 && diffInDays >= -7) {
      return `${Math.abs(diffInDays)} days ago`;
    } else if (diffInDays > 7) {
      const months = getMonthsDifference(now, dateObj);
      if (months > 0) {
        return `In ${months} months`;
      }
      return `In ${Math.ceil(diffInDays / 7)} weeks`;
    } else {
      const months = getMonthsDifference(dateObj, now);
      if (months > 0) {
        return `${months} months ago`;
      }
      return `${Math.ceil(Math.abs(diffInDays) / 7)} weeks ago`;
    }
  } catch (error) {
    console.error('Error formatting relative time:', error);
    return '';
  }
};

/**
 * Generate EMI due dates
 * @param {Date|string} startDate - EMI start date
 * @param {number} numberOfInstallments - Number of installments
 * @returns {Array<Date>} Array of due dates
 */
export const generateEMIDueDates = (startDate, numberOfInstallments) => {
  try {
    const start = typeof startDate === 'string' ? new Date(startDate) : startDate;
    if (!isValid(start)) return [];
    
    const dueDates = [];
    for (let i = 0; i < numberOfInstallments; i++) {
      const dueDate = addMonthsToDate(start, i);
      if (dueDate) {
        dueDates.push(dueDate);
      }
    }
    
    return dueDates;
  } catch (error) {
    console.error('Error generating EMI due dates:', error);
    return [];
  }
};

/**
 * Get age from birth date
 * @param {Date|string} birthDate - Birth date
 * @returns {number} Age in years
 */
export const getAge = (birthDate) => {
  try {
    const birth = typeof birthDate === 'string' ? new Date(birthDate) : birthDate;
    if (isNaN(birth.getTime())) return 0;
    
    const today = getCurrentDate();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  } catch (error) {
    console.error('Error calculating age:', error);
    return 0;
  }
};

/**
 * Get years and months of service
 * @param {Date|string} joiningDate - Joining date
 * @returns {Object} Object with years and months
 */
export const getServiceDuration = (joiningDate) => {
  try {
    const joining = typeof joiningDate === 'string' ? new Date(joiningDate) : joiningDate;
    if (isNaN(joining.getTime())) return { years: 0, months: 0 };
    
    const today = getCurrentDate();
    let years = today.getFullYear() - joining.getFullYear();
    let months = today.getMonth() - joining.getMonth();
    
    if (months < 0) {
      years--;
      months += 12;
    }
    
    if (today.getDate() < joining.getDate()) {
      months--;
      if (months < 0) {
        years--;
        months += 12;
      }
    }
    
    return { years: Math.max(0, years), months: Math.max(0, months) };
  } catch (error) {
    console.error('Error calculating service duration:', error);
    return { years: 0, months: 0 };
  }
};

/**
 * Validate date range
 * @param {Date|string} startDate - Start date
 * @param {Date|string} endDate - End date
 * @returns {Object} Validation result
 */
export const validateDateRange = (startDate, endDate) => {
  try {
    const start = typeof startDate === 'string' ? new Date(startDate) : startDate;
    const end = typeof endDate === 'string' ? new Date(endDate) : endDate;
    
    if (!isValid(start)) {
      return { isValid: false, error: 'Invalid start date' };
    }
    
    if (!isValid(end)) {
      return { isValid: false, error: 'Invalid end date' };
    }
    
    if (start > end) {
      return { isValid: false, error: 'Start date must be before end date' };
    }
    
    return { isValid: true, error: null };
  } catch (error) {
    console.error('Error validating date range:', error);
    return { isValid: false, error: 'Invalid date range' };
  }
};

export default {
  formatDate,
  formatDateForStorage,
  parseDate,
  getCurrentDate,
  getCurrentDateFormatted,
  getCurrentDateForStorage,
  addDaysToDate,
  addMonthsToDate,
  getDaysDifference,
  getMonthsDifference,
  isToday,
  isPastDate,
  isFutureDate,
  getStartOfDay,
  getEndOfDay,
  formatRelativeTime,
  generateEMIDueDates,
  getAge,
  getServiceDuration,
  validateDateRange
};