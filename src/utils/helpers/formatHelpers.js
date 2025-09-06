/**
 * Format Helpers
 * Utility functions for formatting data, dates, currency, and other display values
 */

import { DATE_FORMATS, CURRENCY_SETTINGS } from '../constants';

/**
 * Format currency amount
 * @param {number} amount - Amount to format
 * @param {boolean} showSymbol - Whether to show currency symbol
 * @param {number} decimalPlaces - Number of decimal places
 * @returns {string} Formatted currency
 */
export const formatCurrency = (amount, showSymbol = true, decimalPlaces = 2) => {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return showSymbol ? `${CURRENCY_SETTINGS.SYMBOL}0` : '0';
  }

  const formattedAmount = Math.abs(amount).toFixed(decimalPlaces);
  const parts = formattedAmount.split('.');
  
  // Add thousands separator
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, CURRENCY_SETTINGS.THOUSANDS_SEPARATOR);
  
  const result = parts.join(CURRENCY_SETTINGS.DECIMAL_SEPARATOR);
  const symbol = showSymbol ? CURRENCY_SETTINGS.SYMBOL : '';
  const sign = amount < 0 ? '-' : '';
  
  return `${sign}${symbol}${result}`;
};

/**
 * Format currency for GST calculations
 * @param {number} amount - Amount to format
 * @returns {string} Formatted GST amount
 */
export const formatGSTAmount = (amount) => {
  return formatCurrency(amount, true, 2);
};

/**
 * Format date
 * @param {Date|string|number} date - Date to format
 * @param {string} format - Format string
 * @returns {string} Formatted date
 */
export const formatDate = (date, format = DATE_FORMATS.DISPLAY) => {
  if (!date) return '';
  
  try {
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) {
      return '';
    }

    const day = String(dateObj.getDate()).padStart(2, '0');
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const year = dateObj.getFullYear();
    const hours = String(dateObj.getHours()).padStart(2, '0');
    const minutes = String(dateObj.getMinutes()).padStart(2, '0');
    const seconds = String(dateObj.getSeconds()).padStart(2, '0');

    switch (format) {
      case DATE_FORMATS.DISPLAY:
        return `${day}/${month}/${year}`;
      case DATE_FORMATS.DISPLAY_WITH_TIME:
        return `${day}/${month}/${year} ${hours}:${minutes}`;
      case DATE_FORMATS.API:
        return `${year}-${month}-${day}`;
      case DATE_FORMATS.TIMESTAMP:
        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
      default:
        return `${day}/${month}/${year}`;
    }
  } catch (error) {
    console.error('Error formatting date:', error);
    return '';
  }
};

/**
 * Format relative date (e.g., "2 days ago")
 * @param {Date|string|number} date - Date to format
 * @returns {string} Relative date string
 */
export const formatRelativeDate = (date) => {
  if (!date) return '';
  
  try {
    const dateObj = new Date(date);
    const now = new Date();
    const diffMs = now - dateObj;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    
    return formatDate(date);
  } catch (error) {
    console.error('Error formatting relative date:', error);
    return '';
  }
};

/**
 * Format phone number
 * @param {string} phone - Phone number
 * @param {boolean} withCountryCode - Whether to include country code
 * @returns {string} Formatted phone number
 */
export const formatPhone = (phone, withCountryCode = true) => {
  if (!phone) return '';
  
  // Remove all non-digits
  const digits = phone.replace(/\D/g, '');
  
  if (digits.length === 10) {
    // Indian mobile number format: +91 98765 43210
    const formatted = `${digits.slice(0, 5)} ${digits.slice(5)}`;
    return withCountryCode ? `+91 ${formatted}` : formatted;
  }
  
  // Return as-is if not standard format
  return phone;
};

/**
 * Format text to title case
 * @param {string} text - Text to format
 * @returns {string} Title case text
 */
export const formatTitleCase = (text) => {
  if (!text) return '';
  
  return text
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

/**
 * Format text to sentence case
 * @param {string} text - Text to format
 * @returns {string} Sentence case text
 */
export const formatSentenceCase = (text) => {
  if (!text) return '';
  
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
};

/**
 * Format file size
 * @param {number} bytes - File size in bytes
 * @param {number} decimals - Number of decimal places
 * @returns {string} Formatted file size
 */
export const formatFileSize = (bytes, decimals = 2) => {
  if (!bytes || bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
};

/**
 * Format percentage
 * @param {number} value - Value to format as percentage
 * @param {number} total - Total value for calculation
 * @param {number} decimals - Number of decimal places
 * @returns {string} Formatted percentage
 */
export const formatPercentage = (value, total, decimals = 1) => {
  if (!total || total === 0) return '0%';
  
  const percentage = (value / total) * 100;
  return `${percentage.toFixed(decimals)}%`;
};

/**
 * Format invoice number
 * @param {string} prefix - Invoice prefix
 * @param {number} number - Sequential number
 * @param {Date} date - Invoice date
 * @returns {string} Formatted invoice number
 */
export const formatInvoiceNumber = (prefix = 'INV', number, date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const paddedNumber = String(number).padStart(4, '0');
  
  return `${prefix}-${year}-${month}-${paddedNumber}`;
};

/**
 * Format GST number display
 * @param {string} gstNumber - GST number
 * @returns {string} Formatted GST number
 */
export const formatGSTNumber = (gstNumber) => {
  if (!gstNumber || gstNumber.length !== 15) return gstNumber;
  
  // Format as: 12ABCDE3456F1G2
  return gstNumber.toUpperCase();
};

/**
 * Truncate text with ellipsis
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} Truncated text
 */
export const truncateText = (text, maxLength = 50) => {
  if (!text || text.length <= maxLength) return text;
  
  return `${text.substring(0, maxLength)}...`;
};

/**
 * Format address for display
 * @param {Object} address - Address object
 * @returns {string} Formatted address
 */
export const formatAddress = (address) => {
  if (!address) return '';
  
  const parts = [
    address.street,
    address.area,
    address.city,
    address.state,
    address.pincode
  ].filter(part => part && part.trim());
  
  return parts.join(', ');
};

/**
 * Format name for display
 * @param {string} firstName - First name
 * @param {string} lastName - Last name
 * @returns {string} Full name
 */
export const formatName = (firstName, lastName) => {
  const parts = [firstName, lastName].filter(part => part && part.trim());
  return parts.join(' ');
};

/**
 * Format initials from name
 * @param {string} name - Full name
 * @returns {string} Initials
 */
export const getInitials = (name) => {
  if (!name) return '';
  
  return name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .substring(0, 2);
};

/**
 * Format number with Indian numbering system (lakhs, crores)
 * @param {number} number - Number to format
 * @returns {string} Formatted number
 */
export const formatIndianNumber = (number) => {
  if (!number || isNaN(number)) return '0';
  
  const absNumber = Math.abs(number);
  const sign = number < 0 ? '-' : '';
  
  if (absNumber >= 10000000) { // 1 crore+
    return `${sign}${(absNumber / 10000000).toFixed(1)}Cr`;
  } else if (absNumber >= 100000) { // 1 lakh+
    return `${sign}${(absNumber / 100000).toFixed(1)}L`;
  } else if (absNumber >= 1000) { // 1 thousand+
    return `${sign}${(absNumber / 1000).toFixed(1)}K`;
  }
  
  return `${sign}${absNumber}`;
};

/**
 * Parse and format display name
 * @param {string} text - Text to parse
 * @returns {string} Display name
 */
export const formatDisplayName = (text) => {
  if (!text) return '';
  
  return text
    .replace(/[_-]/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase());
};

/**
 * Format duration in hours/minutes
 * @param {number} minutes - Duration in minutes
 * @returns {string} Formatted duration
 */
export const formatDuration = (minutes) => {
  if (!minutes || minutes < 0) return '0 min';
  
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  if (hours > 0) {
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  }
  
  return `${mins}m`;
};

/**
 * Format status badge text
 * @param {string} status - Status value
 * @returns {string} Formatted status
 */
export const formatStatusBadge = (status) => {
  if (!status) return '';
  
  return status
    .replace(/[_-]/g, ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

export default {
  formatCurrency,
  formatGSTAmount,
  formatDate,
  formatRelativeDate,
  formatPhone,
  formatTitleCase,
  formatSentenceCase,
  formatFileSize,
  formatPercentage,
  formatInvoiceNumber,
  formatGSTNumber,
  truncateText,
  formatAddress,
  formatName,
  getInitials,
  formatIndianNumber,
  formatDisplayName,
  formatDuration,
  formatStatusBadge
};