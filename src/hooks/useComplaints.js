import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useUserType } from '../contexts/UserTypeContext';
import complaintService from '../services/api/complaintService';
import complaintNotificationService from '../services/complaintNotificationService';
import employeeService from '../services/api/employeeService';

/**
 * Custom hook for complaints management with due/overdue notification system
 * @param {Object} options - Hook options
 * @returns {Object} Complaints state and methods
 */
export const useComplaints = (options = {}) => {
  const { autoLoad = true, enableScheduledNotifications = true } = options;
  
  const { user } = useAuth();
  const { userType } = useUserType();

  // State
  const [complaints, setComplaints] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    open: 0,
    inProgress: 0,
    resolved: 0,
    closed: 0,
    escalated: 0,
    overdue: 0,
    bySeverity: {
      low: 0,
      medium: 0,
      high: 0,
      critical: 0
    }
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [notificationStats, setNotificationStats] = useState({
    total: 0,
    dueToday: 0,
    overdue: 0,
    unread: 0
  });

  // Load complaints
  const loadComplaints = useCallback(async (filters = {}) => {
    if (!userType || !user) return;

    try {
      setLoading(true);
      setError(null);

      const response = await complaintService.getComplaints(userType, filters);
      setComplaints(response.complaints);

      return response;
    } catch (error) {
      console.error('Error loading complaints:', error);
      setError(error.message || 'Failed to load complaints');
      throw error;
    } finally {
      setLoading(false);
    }
  }, [userType, user]);

  // Load statistics
  const loadStats = useCallback(async () => {
    if (!userType) return;

    try {
      const statsData = await complaintService.getComplaintStats(userType);
      setStats(statsData);
      return statsData;
    } catch (error) {
      console.error('Error loading complaint stats:', error);
      throw error;
    }
  }, [userType]);

  // Load notification statistics
  const loadNotificationStats = useCallback(async () => {
    if (!userType || !user) return;

    try {
      const notifStats = await complaintNotificationService.getNotificationStats(userType, user.uid);
      setNotificationStats(notifStats);
      return notifStats;
    } catch (error) {
      console.error('Error loading notification stats:', error);
      throw error;
    }
  }, [userType, user]);

  // Get complaint by ID
  const getComplaint = useCallback(async (complaintId) => {
    if (!userType || !complaintId) return null;

    try {
      const complaint = await complaintService.getComplaintById(userType, complaintId);
      return complaint;
    } catch (error) {
      console.error('Error getting complaint:', error);
      throw error;
    }
  }, [userType]);

  // Create complaint with optional immediate assignment notification
  const createComplaint = useCallback(async (complaintData, sendImmediateNotification = false) => {
    if (!userType || !user) return null;

    try {
      setLoading(true);
      setError(null);

      // Create the complaint
      const newComplaint = await complaintService.createComplaint(userType, {
        ...complaintData,
        createdBy: user.uid,
        createdByName: user.name
      });

      // Send immediate assignment notification only if requested
      if (sendImmediateNotification && 
          newComplaint.assigneeType === 'employee' && 
          newComplaint.assignedEmployeeId) {
        
        try {
          const employee = await employeeService.getEmployeeById(userType, newComplaint.assignedEmployeeId);
          if (employee && employee.userId) {
            await complaintNotificationService.createAssignmentNotification(
              userType,
              newComplaint,
              employee.userId
            );
          }
        } catch (notificationError) {
          console.warn('Failed to send immediate assignment notification:', notificationError);
        }
      }

      // Refresh data
      await Promise.all([loadComplaints(), loadStats(), loadNotificationStats()]);

      return newComplaint;
    } catch (error) {
      console.error('Error creating complaint:', error);
      setError(error.message || 'Failed to create complaint');
      throw error;
    } finally {
      setLoading(false);
    }
  }, [userType, user, loadComplaints, loadStats, loadNotificationStats]);

  // Update complaint with resolution notification
  const updateComplaint = useCallback(async (complaintId, updates) => {
    if (!userType || !user || !complaintId) return null;

    try {
      setLoading(true);
      setError(null);

      // Get current complaint for comparison
      const currentComplaint = await complaintService.getComplaintById(userType, complaintId);
      if (!currentComplaint) {
        throw new Error('Complaint not found');
      }

      // Update the complaint
      const updatedComplaint = await complaintService.updateComplaint(userType, complaintId, {
        ...updates,
        updatedBy: user.uid,
        updatedByName: user.name
      });

      // Send resolution notification if complaint was resolved
      if (updates.status === 'resolved' && currentComplaint.status !== 'resolved') {
        try {
          await complaintNotificationService.createResolutionNotification(
            userType,
            updatedComplaint,
            user.uid, // Admin user ID
            user.name
          );
        } catch (notificationError) {
          console.warn('Failed to send resolution notification:', notificationError);
        }
      }

      // Refresh data
      await Promise.all([loadComplaints(), loadStats(), loadNotificationStats()]);

      return updatedComplaint;
    } catch (error) {
      console.error('Error updating complaint:', error);
      setError(error.message || 'Failed to update complaint');
      throw error;
    } finally {
      setLoading(false);
    }
  }, [userType, user, loadComplaints, loadStats, loadNotificationStats]);

  // Delete complaint
  const deleteComplaint = useCallback(async (complaintId) => {
    if (!userType || !complaintId) return;

    try {
      setLoading(true);
      setError(null);

      await complaintService.deleteComplaint(userType, complaintId);

      // Refresh data
      await Promise.all([loadComplaints(), loadStats(), loadNotificationStats()]);

    } catch (error) {
      console.error('Error deleting complaint:', error);
      setError(error.message || 'Failed to delete complaint');
      throw error;
    } finally {
      setLoading(false);
    }
  }, [userType, loadComplaints, loadStats, loadNotificationStats]);

  // Search complaints
  const searchComplaints = useCallback(async (searchTerm, limit = null) => {
    if (!userType || !searchTerm) return [];

    try {
      const results = await complaintService.searchComplaints(userType, searchTerm, limit);
      return results;
    } catch (error) {
      console.error('Error searching complaints:', error);
      throw error;
    }
  }, [userType]);

  // Get assigned complaints for current user
  const getAssignedComplaints = useCallback(async () => {
    if (!userType || !user) return [];

    try {
      // For employees, get complaints assigned to them
      if (user.role === 'employee' && user.employeeFirebaseId) {
        const assignedComplaints = await complaintService.getAssignedComplaints(
          userType, 
          user.employeeFirebaseId
        );
        return assignedComplaints;
      }

      // For admins, return all complaints
      const response = await complaintService.getComplaints(userType);
      return response.complaints;
    } catch (error) {
      console.error('Error getting assigned complaints:', error);
      throw error;
    }
  }, [userType, user]);

  // Get overdue complaints
  const getOverdueComplaints = useCallback(async () => {
    if (!userType) return [];

    try {
      const overdueComplaints = await complaintService.getOverdueComplaints(userType);
      return overdueComplaints;
    } catch (error) {
      console.error('Error getting overdue complaints:', error);
      throw error;
    }
  }, [userType]);

  // Process due and overdue notifications (to be called daily)
  const processDueNotifications = useCallback(async () => {
    if (!userType || !user || !enableScheduledNotifications) {
      return { generated: 0, cleanedUp: 0, dueToday: 0, overdue: 0 };
    }

    try {
      const result = await complaintNotificationService.processComplaintNotifications(
        userType,
        user.uid // Admin user ID
      );

      // Refresh notification stats after processing
      await loadNotificationStats();

      return result;
    } catch (error) {
      console.error('Error processing due notifications:', error);
      throw error;
    }
  }, [userType, user, enableScheduledNotifications, loadNotificationStats]);

  // Generate notifications for due/overdue complaints only
  const generateDueNotifications = useCallback(async () => {
    if (!userType || !user) {
      return { created: 0, dueToday: 0, overdue: 0, errors: [] };
    }

    try {
      const result = await complaintNotificationService.generateDueAndOverdueNotifications(
        userType,
        user.uid
      );

      // Refresh notification stats
      await loadNotificationStats();

      return result;
    } catch (error) {
      console.error('Error generating due notifications:', error);
      throw error;
    }
  }, [userType, user, loadNotificationStats]);

  // Clean up resolved complaint notifications
  const cleanupResolvedNotifications = useCallback(async () => {
    if (!userType || !user) return 0;

    try {
      const cleanedUp = await complaintNotificationService.cleanupResolvedComplaintNotifications(
        userType,
        user.uid
      );

      // Refresh notification stats
      await loadNotificationStats();

      return cleanedUp;
    } catch (error) {
      console.error('Error cleaning up notifications:', error);
      throw error;
    }
  }, [userType, user, loadNotificationStats]);

  // Refresh all data
  const refresh = useCallback(async () => {
    try {
      await Promise.all([loadComplaints(), loadStats(), loadNotificationStats()]);
    } catch (error) {
      console.error('Error refreshing complaint data:', error);
      throw error;
    }
  }, [loadComplaints, loadStats, loadNotificationStats]);

  // Auto-load data on mount
  useEffect(() => {
    if (autoLoad && userType && user) {
      refresh();
    }
  }, [autoLoad, userType, user, refresh]);

  return {
    // State
    complaints,
    stats,
    notificationStats,
    loading,
    error,

    // Methods
    loadComplaints,
    loadStats,
    loadNotificationStats,
    getComplaint,
    createComplaint,
    updateComplaint,
    deleteComplaint,
    searchComplaints,
    getAssignedComplaints,
    getOverdueComplaints,
    
    // NEW: Due/Overdue notification methods
    processDueNotifications,
    generateDueNotifications,
    cleanupResolvedNotifications,
    
    refresh,

    // Utilities
    clearError: () => setError(null)
  };
};

export default useComplaints;