import React, { forwardRef } from 'react';
import { DatePicker as MUIDatePicker } from '@mui/x-date-pickers/DatePicker';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import {
  useTheme
} from '@mui/material';
import { CalendarToday as CalendarIcon } from '@mui/icons-material';

/**
 * Custom DatePicker component with enhanced functionality
 * @param {Object} props
 * @param {string} props.variant - Type of picker: 'date', 'time', 'datetime'
 * @param {string} props.label - Field label
 * @param {Date|null} props.value - Selected date value
 * @param {function} props.onChange - Change handler
 * @param {string} props.error - Error message
 * @param {boolean} props.required - Whether field is required
 * @param {boolean} props.disabled - Whether field is disabled
 * @param {Date} props.minDate - Minimum allowed date
 * @param {Date} props.maxDate - Maximum allowed date
 * @param {Date} props.disablePast - Disable past dates
 * @param {Date} props.disableFuture - Disable future dates
 * @param {string} props.helperText - Helper text
 * @param {boolean} props.fullWidth - Whether field should be full width
 * @param {string} props.size - Field size (small, medium, large)
 * @param {object} props.sx - MUI sx prop for styling
 */
const DatePicker = forwardRef(({
  variant = 'date',
  label,
  value,
  onChange,
  error,
  required = false,
  disabled = false,
  minDate,
  maxDate,
  disablePast = false,
  disableFuture = false,
  helperText,
  fullWidth = true,
  size = 'medium',
  format,
  placeholder,
  sx = {},
  inputProps = {},
  slotProps = {},
  ...props
}, ref) => {
  const theme = useTheme();

  // Default formats for different variants
  const defaultFormats = {
    date: 'dd/MM/yyyy',
    time: 'HH:mm',
    datetime: 'dd/MM/yyyy HH:mm'
  };

  // Handle change event
  const handleChange = (newValue) => {
    if (onChange) {
      onChange(newValue);
    }
  };

  // Common props for all picker types
  const commonProps = {
    value: value || null,
    onChange: handleChange,
    disabled,
    format: format || defaultFormats[variant],
    minDate,
    maxDate,
    disablePast,
    disableFuture,
    slotProps: {
      textField: {
        ref,
        label,
        required,
        error: !!error,
        helperText: error || helperText,
        fullWidth,
        size,
        placeholder,
        sx: {
          '& .MuiFormHelperText-root.Mui-error': {
            color: theme.palette.error.main
          },
          ...sx
        },
        InputProps: {
          endAdornment: variant === 'date' ? <CalendarIcon color="action" /> : undefined,
          ...inputProps
        },
        ...slotProps.textField
      },
      ...slotProps
    },
    ...props
  };

  // Render appropriate picker based on variant
  switch (variant) {
    case 'time':
      return (
        <TimePicker
          {...commonProps}
          views={['hours', 'minutes']}
        />
      );

    case 'datetime':
      return (
        <DateTimePicker
          {...commonProps}
          views={['year', 'month', 'day', 'hours', 'minutes']}
        />
      );

    case 'date':
    default:
      return (
        <MUIDatePicker
          {...commonProps}
          views={['year', 'month', 'day']}
        />
      );
  }
});

DatePicker.displayName = 'DatePicker';

// Export individual picker components for specific use cases
export const TimePicker_Custom = forwardRef((props, ref) => (
  <DatePicker ref={ref} {...props} variant="time" />
));

export const DateTimePicker_Custom = forwardRef((props, ref) => (
  <DatePicker ref={ref} {...props} variant="datetime" />
));

// Helper functions for date operations
export const dateHelpers = {
  /**
   * Format date for display
   * @param {Date} date 
   * @param {string} format 
   * @returns {string}
   */
  formatDate: (date, format = 'dd/MM/yyyy') => {
    if (!date) return '';
    
    try {
      return new Intl.DateTimeFormat('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: format.includes('HH') ? '2-digit' : undefined,
        minute: format.includes('mm') ? '2-digit' : undefined,
        hour12: false
      }).format(new Date(date));
    } catch (error) {
      console.error('Date formatting error:', error);
      return '';
    }
  },

  /**
   * Parse date string to Date object
   * @param {string} dateString 
   * @returns {Date|null}
   */
  parseDate: (dateString) => {
    if (!dateString) return null;
    
    try {
      const date = new Date(dateString);
      return isNaN(date.getTime()) ? null : date;
    } catch (error) {
      console.error('Date parsing error:', error);
      return null;
    }
  },

  /**
   * Check if date is today
   * @param {Date} date 
   * @returns {boolean}
   */
  isToday: (date) => {
    if (!date) return false;
    
    const today = new Date();
    const checkDate = new Date(date);
    
    return (
      checkDate.getDate() === today.getDate() &&
      checkDate.getMonth() === today.getMonth() &&
      checkDate.getFullYear() === today.getFullYear()
    );
  },

  /**
   * Check if date is in the past
   * @param {Date} date 
   * @returns {boolean}
   */
  isPast: (date) => {
    if (!date) return false;
    return new Date(date) < new Date();
  },

  /**
   * Check if date is in the future
   * @param {Date} date 
   * @returns {boolean}
   */
  isFuture: (date) => {
    if (!date) return false;
    return new Date(date) > new Date();
  },

  /**
   * Get start of day
   * @param {Date} date 
   * @returns {Date}
   */
  startOfDay: (date) => {
    if (!date) return null;
    
    const newDate = new Date(date);
    newDate.setHours(0, 0, 0, 0);
    return newDate;
  },

  /**
   * Get end of day
   * @param {Date} date 
   * @returns {Date}
   */
  endOfDay: (date) => {
    if (!date) return null;
    
    const newDate = new Date(date);
    newDate.setHours(23, 59, 59, 999);
    return newDate;
  },

  /**
   * Add days to date
   * @param {Date} date 
   * @param {number} days 
   * @returns {Date}
   */
  addDays: (date, days) => {
    if (!date) return null;
    
    const newDate = new Date(date);
    newDate.setDate(newDate.getDate() + days);
    return newDate;
  },

  /**
   * Get difference in days between two dates
   * @param {Date} date1 
   * @param {Date} date2 
   * @returns {number}
   */
  diffInDays: (date1, date2) => {
    if (!date1 || !date2) return 0;
    
    const diffTime = Math.abs(new Date(date1) - new Date(date2));
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
};

export default DatePicker;