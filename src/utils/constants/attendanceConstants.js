// src/utils/constants/attendanceConstants.js
export const ATTENDANCE_STATUS = {
  NOT_CHECKED_IN: 'not_checked_in',
  CHECKED_IN: 'checked_in',
  ON_BREAK: 'on_break',
  CHECKED_OUT: 'checked_out',
  ON_LEAVE: 'on_leave'
};

export const LEAVE_TYPES = {
  SICK: 'sick',
  PERSONAL: 'personal',
  EMERGENCY: 'emergency',
  VACATION: 'vacation',
  MEDICAL: 'medical',
  FAMILY: 'family',
  OTHER: 'other'
};

export const LEAVE_TYPE_DISPLAY = {
  [LEAVE_TYPES.SICK]: 'Sick Leave',
  [LEAVE_TYPES.PERSONAL]: 'Personal Leave',
  [LEAVE_TYPES.EMERGENCY]: 'Emergency Leave',
  [LEAVE_TYPES.VACATION]: 'Vacation',
  [LEAVE_TYPES.MEDICAL]: 'Medical Leave',
  [LEAVE_TYPES.FAMILY]: 'Family Leave',
  [LEAVE_TYPES.OTHER]: 'Other'
};

export const PENALTY_TYPES = {
  HOURLY: 'hourly',
  LEAVE: 'leave',
  MANUAL: 'manual',
  LATE_ARRIVAL: 'late_arrival',
  EARLY_DEPARTURE: 'early_departure',
  INCOMPLETE_HOURS: 'incomplete_hours'
};

export const PENALTY_TYPE_DISPLAY = {
  [PENALTY_TYPES.HOURLY]: 'Hourly Penalty',
  [PENALTY_TYPES.LEAVE]: 'Leave Penalty',
  [PENALTY_TYPES.MANUAL]: 'Manual Penalty',
  [PENALTY_TYPES.LATE_ARRIVAL]: 'Late Arrival',
  [PENALTY_TYPES.EARLY_DEPARTURE]: 'Early Departure',
  [PENALTY_TYPES.INCOMPLETE_HOURS]: 'Incomplete Hours'
};

export const PENALTY_STATUS = {
  ACTIVE: 'active',
  REMOVED: 'removed',
  EXPIRED: 'expired'
};

export const BREAK_TYPES = {
  LUNCH: 'lunch',
  TEA: 'tea',
  PERSONAL: 'personal',
  MEETING: 'meeting',
  OTHER: 'other'
};

export const TIME_CONSTANTS = {
  WORK_HOURS_PER_DAY: 8,
  MINUTES_PER_HOUR: 60,
  MILLISECONDS_PER_MINUTE: 60000,
  DEFAULT_WORK_START_TIME: '09:00',
  DEFAULT_WORK_END_TIME: '18:00',
  MAX_DAILY_WORK_HOURS: 12,
  MIN_BREAK_DURATION: 5, // minutes
  MAX_BREAK_DURATION: 120, // minutes (2 hours)
  LATE_ARRIVAL_THRESHOLD: 15, // minutes
  EARLY_DEPARTURE_THRESHOLD: 15, // minutes
  LUNCH_BREAK_DURATION: 60 // minutes
};

export const PENALTY_SETTINGS_DEFAULTS = {
  HOURLY_PENALTY_RATE: 50, // ₹50 per hour
  LEAVE_PENALTY_RATE: 500, // ₹500 per leave day
  LATE_ARRIVAL_THRESHOLD: 15, // minutes
  EARLY_DEPARTURE_THRESHOLD: 15, // minutes
  AUTO_APPLY_PENALTIES: true,
  WORKING_HOURS_PER_DAY: 8,
  WEEKEND_PENALTY_ENABLED: false,
  HOLIDAY_PENALTY_ENABLED: false
};

export const ATTENDANCE_REPORT_TYPES = {
  DAILY: 'daily',
  WEEKLY: 'weekly',
  MONTHLY: 'monthly',
  CUSTOM: 'custom',
  YEARLY: 'yearly'
};

export const SALARY_CALCULATION_CONSTANTS = {
  WORKING_DAYS_PER_MONTH: 22,
  HOURS_PER_DAY: 8,
  MINIMUM_SALARY: 0,
  MAXIMUM_PENALTY_PERCENTAGE: 50 // Max 50% of salary can be deducted as penalty
};

// Notification Types for Attendance
export const ATTENDANCE_NOTIFICATION_TYPES = {
  CHECK_IN_LATE: 'check_in_late',
  MISSED_CHECK_OUT: 'missed_check_out',
  LONG_BREAK: 'long_break',
  PENALTY_APPLIED: 'penalty_applied',
  PENALTY_REMOVED: 'penalty_removed',
  LEAVE_MARKED: 'leave_marked',
  LEAVE_CANCELLED: 'leave_cancelled'
};

// Permission for Penalty Management
export const PENALTY_PERMISSIONS = {
  VIEW_PENALTY_SETTINGS: 'view_penalty_settings',
  MANAGE_PENALTY_SETTINGS: 'manage_penalty_settings',
  VIEW_EMPLOYEE_PENALTIES: 'view_employee_penalties',
  APPLY_MANUAL_PENALTY: 'apply_manual_penalty',
  REMOVE_PENALTY: 'remove_penalty',
  VIEW_SALARY_REPORTS: 'view_salary_reports',
  EXPORT_SALARY_REPORTS: 'export_salary_reports'
};

// Updated User Permissions (add to existing PERMISSIONS constant)
export const UPDATED_PERMISSIONS = {
  // Existing permissions...
  
  // Attendance permissions
  VIEW_OWN_ATTENDANCE: 'view_own_attendance',
  MANAGE_OWN_ATTENDANCE: 'manage_own_attendance',
  VIEW_ALL_ATTENDANCE: 'view_all_attendance',
  MANAGE_ALL_ATTENDANCE: 'manage_all_attendance',
  EXPORT_ATTENDANCE_REPORTS: 'export_attendance_reports',
  
  // Leave permissions
  MARK_OWN_LEAVE: 'mark_own_leave',
  CANCEL_OWN_LEAVE: 'cancel_own_leave',
  APPROVE_LEAVE: 'approve_leave',
  MANAGE_LEAVE_POLICIES: 'manage_leave_policies',
  
  // Penalty permissions
  ...PENALTY_PERMISSIONS
};

// Updated Role Configuration with Penalty Permissions
export const UPDATED_ROLE_CONFIG = {
  admin: {
    label: 'Administrator',
    permissions: [
      // All existing permissions plus new ones
      'view_own_attendance',
      'manage_own_attendance',
      'view_all_attendance', 
      'manage_all_attendance',
      'export_attendance_reports',
      'mark_own_leave',
      'cancel_own_leave',
      'approve_leave',
      'manage_leave_policies',
      'view_penalty_settings',
      'manage_penalty_settings',
      'view_employee_penalties',
      'apply_manual_penalty',
      'remove_penalty',
      'view_salary_reports',
      'export_salary_reports'
    ]
  },
  manager: {
    label: 'Manager',
    permissions: [
      'view_own_attendance',
      'manage_own_attendance',
      'view_all_attendance',
      'export_attendance_reports',
      'mark_own_leave',
      'cancel_own_leave',
      'approve_leave',
      'view_employee_penalties',
      'view_salary_reports'
    ]
  },
  employee: {
    label: 'Employee',
    permissions: [
      'view_own_attendance',
      'manage_own_attendance',
      'mark_own_leave',
      'cancel_own_leave'
    ]
  },
  intern: {
    label: 'Intern',
    permissions: [
      'view_own_attendance',
      'manage_own_attendance',
      'mark_own_leave'
    ]
  }
};

// Location Validation Constants
export const LOCATION_CONSTANTS = {
  MAX_ALLOWED_DISTANCE: 100, // meters
  GPS_ACCURACY_THRESHOLD: 50, // meters
  LOCATION_TIMEOUT: 10000, // 10 seconds
  HIGH_ACCURACY_ENABLED: true
};

// Work Schedule Templates
export const WORK_SCHEDULE_TEMPLATES = {
  STANDARD: {
    name: 'Standard (9 AM - 6 PM)',
    checkInTime: '09:00',
    checkOutTime: '18:00',
    workHours: 8,
    lunchBreakDuration: 60
  },
  MORNING_SHIFT: {
    name: 'Morning Shift (6 AM - 3 PM)',
    checkInTime: '06:00',
    checkOutTime: '15:00',
    workHours: 8,
    lunchBreakDuration: 60
  },
  EVENING_SHIFT: {
    name: 'Evening Shift (2 PM - 11 PM)',
    checkInTime: '14:00',
    checkOutTime: '23:00',
    workHours: 8,
    lunchBreakDuration: 60
  },
  NIGHT_SHIFT: {
    name: 'Night Shift (10 PM - 7 AM)',
    checkInTime: '22:00',
    checkOutTime: '07:00',
    workHours: 8,
    lunchBreakDuration: 60
  }
};

// Attendance Validation Rules
export const ATTENDANCE_VALIDATION_RULES = {
  MAX_WORK_HOURS_PER_DAY: 12,
  MIN_WORK_HOURS_PER_DAY: 4,
  MAX_BREAKS_PER_DAY: 5,
  MAX_BREAK_DURATION: 120, // minutes
  MIN_TIME_BETWEEN_BREAKS: 30, // minutes
  BACKDATED_ENTRY_LIMIT: 7, // days
  FUTURE_DATE_ALLOWED: false
};

// Leave Policy Defaults
export const LEAVE_POLICY_DEFAULTS = {
  ANNUAL_LEAVE_QUOTA: 24, // days per year
  SICK_LEAVE_QUOTA: 12, // days per year
  PERSONAL_LEAVE_QUOTA: 6, // days per year
  EMERGENCY_LEAVE_QUOTA: 3, // days per year
  CARRY_FORWARD_LIMIT: 5, // days
  NOTICE_PERIOD_DAYS: 1, // days in advance
  MAX_CONSECUTIVE_LEAVE_DAYS: 10
};

// Export all constants
export default {
  ATTENDANCE_STATUS,
  LEAVE_TYPES,
  LEAVE_TYPE_DISPLAY,
  PENALTY_TYPES,
  PENALTY_TYPE_DISPLAY,
  PENALTY_STATUS,
  BREAK_TYPES,
  TIME_CONSTANTS,
  PENALTY_SETTINGS_DEFAULTS,
  ATTENDANCE_REPORT_TYPES,
  SALARY_CALCULATION_CONSTANTS,
  ATTENDANCE_NOTIFICATION_TYPES,
  PENALTY_PERMISSIONS,
  UPDATED_PERMISSIONS,
  UPDATED_ROLE_CONFIG,
  LOCATION_CONSTANTS,
  WORK_SCHEDULE_TEMPLATES,
  ATTENDANCE_VALIDATION_RULES,
  LEAVE_POLICY_DEFAULTS
};