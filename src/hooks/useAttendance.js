// src/hooks/useAttendance.js
import { useState, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext/AuthContext';
import { useUserType } from '../contexts/UserTypeContext/UserTypeContext';
import attendanceService from '../services/attendance/attendanceService';
import { 
  getCurrentTime, 
  getCurrentDate, 
  formatAttendanceSummary 
} from '../utils/helpers/timeUtils';

/**
 * Custom hook for managing attendance operations
 * @returns {Object} Attendance operations and state
 */
export const useAttendance = () => {
  const { user } = useAuth();
  const { userType } = useUserType();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Clear messages
  const clearMessages = useCallback(() => {
    setError('');
    setSuccess('');
  }, []);

  // Check in employee
  const checkIn = useCallback(async (locationData, photoBase64 = null) => {
    if (!user || !userType) {
      throw new Error('User or userType not available');
    }

    try {
      setLoading(true);
      clearMessages();

      const checkInData = {
        employeeId: user.uid,
        employeeName: user.name,
        date: getCurrentDate(),
        checkInTime: getCurrentTime(),
        checkInPhoto: photoBase64,
        checkInLocation: locationData
      };

      const attendanceId = await attendanceService.checkIn(userType, checkInData);
      setSuccess('Successfully checked in!');
      return attendanceId;
    } catch (error) {
      const errorMessage = error.message || 'Failed to check in';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [user, userType, clearMessages]);

  // Check out employee
  const checkOut = useCallback(async (attendanceId, locationData) => {
    if (!user || !userType) {
      throw new Error('User or userType not available');
    }

    try {
      setLoading(true);
      clearMessages();

      const checkOutData = {
        date: getCurrentDate(),
        checkOutTime: getCurrentTime(),
        checkOutLocation: locationData
      };

      const updatedRecord = await attendanceService.checkOut(userType, attendanceId, checkOutData);
      setSuccess('Successfully checked out!');
      return updatedRecord;
    } catch (error) {
      const errorMessage = error.message || 'Failed to check out';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [user, userType, clearMessages]);

  // Start break
  const startBreak = useCallback(async (attendanceId) => {
    if (!user || !userType) {
      throw new Error('User or userType not available');
    }

    try {
      setLoading(true);
      clearMessages();

      const breakData = {
        startTime: getCurrentTime()
      };

      const updatedRecord = await attendanceService.startBreak(userType, attendanceId, breakData);
      setSuccess('Break started!');
      return updatedRecord;
    } catch (error) {
      const errorMessage = error.message || 'Failed to start break';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [user, userType, clearMessages]);

  // End break
  const endBreak = useCallback(async (attendanceId) => {
    if (!user || !userType) {
      throw new Error('User or userType not available');
    }

    try {
      setLoading(true);
      clearMessages();

      const breakEndData = {
        endTime: getCurrentTime()
      };

      const updatedRecord = await attendanceService.endBreak(userType, attendanceId, breakEndData);
      setSuccess('Break ended!');
      return updatedRecord;
    } catch (error) {
      const errorMessage = error.message || 'Failed to end break';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [user, userType, clearMessages]);

  // Get today's attendance
  const getTodayAttendance = useCallback(async () => {
    if (!user || !userType) {
      return null;
    }

    try {
      setLoading(true);
      clearMessages();

      const attendance = await attendanceService.getTodayAttendance(userType, user.uid);
      return attendance;
    } catch (error) {
      const errorMessage = error.message || 'Failed to fetch today\'s attendance';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, [user, userType, clearMessages]);

  // Get employee attendance history
  const getAttendanceHistory = useCallback(async (limit = null) => {
    if (!user || !userType) {
      return [];
    }

    try {
      setLoading(true);
      clearMessages();

      const records = await attendanceService.getEmployeeAttendance(userType, user.uid, limit);
      return records;
    } catch (error) {
      const errorMessage = error.message || 'Failed to fetch attendance history';
      setError(errorMessage);
      return [];
    } finally {
      setLoading(false);
    }
  }, [user, userType, clearMessages]);

  // Get attendance statistics
  const getAttendanceStats = useCallback(async () => {
    if (!user || !userType) {
      return {};
    }

    try {
      setLoading(true);
      clearMessages();

      const stats = await attendanceService.getAttendanceStats(userType, user.uid);
      return stats;
    } catch (error) {
      const errorMessage = error.message || 'Failed to fetch attendance statistics';
      setError(errorMessage);
      return {};
    } finally {
      setLoading(false);
    }
  }, [user, userType, clearMessages]);

  // Get all employees attendance (Admin only)
  const getAllEmployeesAttendance = useCallback(async (date = null) => {
    if (!user || !userType) {
      return [];
    }

    try {
      setLoading(true);
      clearMessages();

      const records = await attendanceService.getAllEmployeesAttendance(userType, date);
      return records;
    } catch (error) {
      const errorMessage = error.message || 'Failed to fetch employees attendance';
      setError(errorMessage);
      return [];
    } finally {
      setLoading(false);
    }
  }, [user, userType, clearMessages]);

  // Get attendance summary for reporting
  const getAttendanceSummary = useCallback(async (employeeId = null, startDate = null, endDate = null) => {
    if (!userType) {
      return null;
    }

    try {
      setLoading(true);
      clearMessages();

      let records;
      if (employeeId) {
        records = await attendanceService.getEmployeeAttendance(userType, employeeId, 100);
      } else {
        records = await attendanceService.getAllEmployeesAttendance(userType);
      }

      // Filter by date range if provided
      if (startDate && endDate) {
        records = records.filter(record => 
          record.date >= startDate && record.date <= endDate
        );
      }

      return formatAttendanceSummary(records);
    } catch (error) {
      const errorMessage = error.message || 'Failed to generate attendance summary';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, [userType, clearMessages]);

  // Check if user can manage attendance
  const canManageAttendance = useCallback(() => {
    return user?.role === 'admin';
  }, [user]);

  // Check if user can view all attendance
  const canViewAllAttendance = useCallback(() => {
    return user?.role === 'admin' || user?.role === 'manager';
  }, [user]);

  // Utility functions
  const isCheckedIn = useCallback((attendance) => {
    return attendance?.status === 'checked_in' || attendance?.status === 'on_break';
  }, []);

  const isOnBreak = useCallback((attendance) => {
    return attendance?.status === 'on_break';
  }, []);

  const isCheckedOut = useCallback((attendance) => {
    return attendance?.status === 'checked_out';
  }, []);

  const canCheckOut = useCallback((attendance) => {
    return isCheckedIn(attendance) && !isOnBreak(attendance);
  }, [isCheckedIn, isOnBreak]);

  return {
    // State
    loading,
    error,
    success,
    
    // Actions
    checkIn,
    checkOut,
    startBreak,
    endBreak,
    getTodayAttendance,
    getAttendanceHistory,
    getAttendanceStats,
    getAllEmployeesAttendance,
    getAttendanceSummary,
    clearMessages,
    
    // Permissions
    canManageAttendance,
    canViewAllAttendance,
    
    // Utilities
    isCheckedIn,
    isOnBreak,
    isCheckedOut,
    canCheckOut
  };
};

export default useAttendance;