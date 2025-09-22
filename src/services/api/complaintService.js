import { ref, push, set, get, update, remove } from 'firebase/database';
import { database } from '../../services/firebase/config';
import { getComplaintsPath } from '../../utils/helpers/firebasePathHelper';
import independentComplaintNotificationService from '../independentComplaintNotificationService';
import { 
  COMPLAINT_STATUS, 
  COMPLAINT_SEVERITY, 
  ASSIGNEE_TYPE,
  COMPLAINT_VALIDATION_RULES,
  isComplaintOverdue 
} from '../../utils/constants/appConstants';

class EnhancedComplaintService {
  /**
   * Trigger notification refresh in UI components
   */
  triggerNotificationRefresh() {
    try {
      // Dispatch custom event to trigger notification panel refresh
      const refreshEvent = new CustomEvent('complaint-notification-refresh', {
        detail: {
          timestamp: new Date().toISOString(),
          source: 'complaint-creation'
        }
      });
      window.dispatchEvent(refreshEvent);
      console.log('🔔 Triggered notification panel refresh');
    } catch (error) {
      console.warn('Could not trigger notification refresh:', error);
    }
  }

  /**
   * Generate unique complaint number
   * @param {string} userType 
   * @returns {Promise<string>}
   */
  async generateComplaintNumber(userType) {
    try {
      const complaintsPath = getComplaintsPath(userType);
      const complaintsRef = ref(database, complaintsPath);
      const snapshot = await get(complaintsRef);
      
      let count = 0;
      if (snapshot.exists()) {
        snapshot.forEach(() => count++);
      }
      
      const currentYear = new Date().getFullYear();
      const prefix = userType === 'electronics' ? 'ECM' : 'FCM';
      const complaintNumber = `${prefix}${currentYear}${String(count + 1).padStart(4, '0')}`;
      
      return complaintNumber;
    } catch (error) {
      console.error('Error generating complaint number:', error);
      throw new Error('Failed to generate complaint number');
    }
  }

  /**
   * Get all complaints for a specific user type
   * @param {string} userType - 'electronics' or 'furniture'
   * @param {Object} options - Query options (limit, offset, search, etc.)
   * @returns {Promise<Object>}
   */
  async getComplaints(userType, options = {}) {
    try {
      const { 
        limit = null,
        offset = 0, 
        search = '', 
        sortBy = 'createdAt', 
        sortOrder = 'desc',
        status = '',
        severity = '',
        assignedTo = ''
      } = options;

      const complaintsPath = getComplaintsPath(userType);
      const complaintsRef = ref(database, complaintsPath);

      const snapshot = await get(complaintsRef);
      
      if (!snapshot.exists()) {
        return {
          complaints: [],
          total: 0,
          hasMore: false,
          currentPage: 1,
          totalPages: 0
        };
      }

      let complaints = [];
      snapshot.forEach((childSnapshot) => {
        const complaintData = childSnapshot.val();
        complaints.push({
          id: childSnapshot.key, // Firebase key as ID
          ...complaintData,
          // Add computed fields
          isOverdue: isComplaintOverdue(complaintData.expectedResolutionDate, complaintData.status)
        });
      });

      // Apply filters
      if (search && search.trim()) {
        const searchTerm = search.toLowerCase().trim();
        complaints = complaints.filter(complaint => {
          return (
            complaint.complaintNumber?.toLowerCase().includes(searchTerm) ||
            complaint.title?.toLowerCase().includes(searchTerm) ||
            complaint.customerName?.toLowerCase().includes(searchTerm) ||
            complaint.customerPhone?.includes(searchTerm) ||
            complaint.description?.toLowerCase().includes(searchTerm)
          );
        });
      }

      if (status) {
        complaints = complaints.filter(complaint => complaint.status === status);
      }

      if (severity) {
        complaints = complaints.filter(complaint => complaint.severity === severity);
      }

      if (assignedTo) {
        complaints = complaints.filter(complaint => 
          complaint.assignedEmployeeId === assignedTo || 
          complaint.servicePersonContact === assignedTo
        );
      }

      // Apply sorting
      complaints.sort((a, b) => {
        let aValue = a[sortBy] || '';
        let bValue = b[sortBy] || '';
        
        if (typeof aValue === 'string') {
          aValue = aValue.toLowerCase();
          bValue = bValue.toLowerCase();
        }
        
        if (sortBy === 'createdAt' || sortBy === 'updatedAt' || sortBy === 'expectedResolutionDate') {
          aValue = new Date(aValue).getTime() || 0;
          bValue = new Date(bValue).getTime() || 0;
        }
        
        if (aValue < bValue) {
          return sortOrder === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortOrder === 'asc' ? 1 : -1;
        }
        return 0;
      });

      // Apply pagination if limit is specified
      if (limit && limit > 0) {
        const total = complaints.length;
        const startIndex = offset;
        const endIndex = startIndex + limit;
        const paginatedComplaints = complaints.slice(startIndex, endIndex);

        return {
          complaints: paginatedComplaints,
          total,
          hasMore: endIndex < total,
          currentPage: Math.floor(offset / limit) + 1,
          totalPages: Math.ceil(total / limit)
        };
      } else {
        return {
          complaints: complaints,
          total: complaints.length,
          hasMore: false,
          currentPage: 1,
          totalPages: 1
        };
      }
    } catch (error) {
      console.error('Error fetching complaints:', error);
      throw new Error('Failed to fetch complaints');
    }
  }

  /**
   * Get complaint by ID
   * @param {string} userType 
   * @param {string} complaintId - Firebase key
   * @returns {Promise<Object|null>}
   */
  async getComplaintById(userType, complaintId) {
    try {
      console.log('=== GET COMPLAINT BY ID ===');
      console.log('Complaint ID:', complaintId);
      console.log('User Type:', userType);
      
      const complaintPath = getComplaintsPath(userType, complaintId);
      console.log('Full Path:', complaintPath);
      
      const complaintRef = ref(database, complaintPath);
      const snapshot = await get(complaintRef);
      
      if (!snapshot.exists()) {
        console.log('❌ Complaint not found at path:', complaintPath);
        return null;
      }
      
      const complaintData = snapshot.val();
      const complaint = {
        id: complaintId, // Firebase key as ID
        ...complaintData,
        isOverdue: isComplaintOverdue(complaintData.expectedResolutionDate, complaintData.status)
      };
      
      console.log('✅ Complaint found:', complaint.complaintNumber);
      return complaint;
    } catch (error) {
      console.error('Error fetching complaint:', error);
      throw new Error('Failed to fetch complaint');
    }
  }

  /**
   * Create new complaint
   * @param {string} userType 
   * @param {Object} complaintData 
   * @returns {Promise<Object>}
   */
  async createComplaint(userType, complaintData) {
    try {
      console.log('=== CREATE COMPLAINT ===');
      console.log('Input data:', complaintData);
      
      this.validateComplaintData(complaintData);

      const complaintsPath = getComplaintsPath(userType);
      const complaintsRef = ref(database, complaintsPath);
      
      // Generate complaint number
      const complaintNumber = await this.generateComplaintNumber(userType);
      
      const newComplaint = {
        ...complaintData,
        complaintNumber,
        status: COMPLAINT_STATUS.OPEN,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        statusHistory: [{
          status: COMPLAINT_STATUS.OPEN,
          changedAt: new Date().toISOString(),
          changedBy: complaintData.createdBy,
          changedByName: complaintData.createdByName,
          remarks: 'Complaint created'
        }]
      };
      
      console.log('Data to store:', newComplaint);
      
      const newComplaintRef = push(complaintsRef);
      await set(newComplaintRef, newComplaint);
      
      const firebaseKey = newComplaintRef.key;
      console.log('✅ Complaint created with Firebase key:', firebaseKey);
      
      // Return the created complaint with ID
      const createdComplaint = {
        id: firebaseKey,
        ...newComplaint
      };

      // Check if complaint needs immediate notification (if due today or overdue)
      await this.checkAndCreateImmediateNotification(userType, createdComplaint);

      // Trigger UI refresh for complaint notifications
      this.triggerNotificationRefresh();
      
      return createdComplaint;
    } catch (error) {
      console.error('Error creating complaint:', error);
      throw new Error(`Failed to create complaint: ${error.message}`);
    }
  }

  /**
   * Update complaint with independent notification handling
   * @param {string} userType 
   * @param {string} complaintId - Firebase key
   * @param {Object} updates 
   * @returns {Promise<Object>}
   */
  async updateComplaint(userType, complaintId, updates) {
    try {
      console.log('=== UPDATE COMPLAINT (ENHANCED) ===');
      console.log('Complaint ID:', complaintId);
      console.log('Updates:', updates);
      
      const complaintPath = getComplaintsPath(userType, complaintId);
      console.log('Update path:', complaintPath);
      
      const complaintRef = ref(database, complaintPath);
      
      // Check if complaint exists and get current data
      const existingSnapshot = await get(complaintRef);
      if (!existingSnapshot.exists()) {
        console.log('❌ Complaint not found for update at:', complaintPath);
        throw new Error('Complaint not found');
      }

      const existingComplaint = existingSnapshot.val();
      const originalDueDate = existingComplaint.expectedResolutionDate;
      
      // Validate updates (partial validation for updates)
      this.validateComplaintData(updates, false);
      
      const updateData = {
        ...updates,
        updatedAt: new Date().toISOString()
      };

      // If status is being updated, add to status history
      if (updates.status && updates.status !== existingComplaint.status) {
        const statusHistory = existingComplaint.statusHistory || [];
        statusHistory.push({
          status: updates.status,
          changedAt: new Date().toISOString(),
          changedBy: updates.updatedBy,
          changedByName: updates.updatedByName,
          remarks: updates.statusRemarks || `Status changed to ${updates.status}`
        });
        updateData.statusHistory = statusHistory;
      }
      
      console.log('Clean update data:', updateData);
      
      // Perform the update
      await update(complaintRef, updateData);
      console.log('✅ Complaint updated successfully');
      
      // Get the updated complaint data
      const updatedSnapshot = await get(complaintRef);
      const updatedComplaint = {
        id: complaintId,
        ...updatedSnapshot.val(),
        isOverdue: isComplaintOverdue(updatedSnapshot.val().expectedResolutionDate, updatedSnapshot.val().status)
      };

      // 🔥 CRITICAL: Handle notification updates when due date changes
      const newDueDate = updates.expectedResolutionDate;
      if (newDueDate && newDueDate !== originalDueDate) {
        console.log('🚨 Due date changed - updating notifications');
        console.log('Original due date:', originalDueDate);
        console.log('New due date:', newDueDate);
        
        try {
          await independentComplaintNotificationService.handleComplaintDueDateChange(
            userType, 
            complaintId, 
            updatedComplaint
          );
          console.log('✅ Notifications updated for due date change');
          
          // Trigger UI refresh
          this.triggerNotificationRefresh();
          
        } catch (notificationError) {
          console.error('⚠️ Failed to update notifications for due date change:', notificationError);
          // Don't fail the complaint update, but log the warning
        }
      }

      // Also handle status changes that might affect notifications
      if (updates.status && updates.status !== existingComplaint.status) {
        console.log('🚨 Status changed - may need notification cleanup');
        
        if (updates.status === COMPLAINT_STATUS.RESOLVED || 
            updates.status === COMPLAINT_STATUS.CLOSED) {
          try {
            // Trigger cleanup for this specific complaint
            await this.cleanupNotificationsForResolvedComplaint(userType, complaintId);
            console.log('✅ Cleaned up notifications for resolved/closed complaint');
          } catch (notificationError) {
            console.error('⚠️ Failed to cleanup notifications:', notificationError);
          }
        }
      }
      
      return updatedComplaint;
    } catch (error) {
      console.error('Error updating complaint:', error);
      throw new Error(`Failed to update complaint: ${error.message}`);
    }
  }

  /**
   * Delete complaint
   * @param {string} userType 
   * @param {string} complaintId - Firebase key
   * @returns {Promise<void>}
   */
  async deleteComplaint(userType, complaintId) {
    try {
      console.log('=== DELETE COMPLAINT ===');
      console.log('Complaint ID:', complaintId);
      
      // Clean up related notifications first
      try {
        await this.cleanupNotificationsForResolvedComplaint(userType, complaintId);
        console.log('✅ Cleaned up notifications for deleted complaint');
      } catch (notificationError) {
        console.warn('⚠️ Failed to cleanup notifications for deleted complaint:', notificationError);
      }
      
      const complaintPath = getComplaintsPath(userType, complaintId);
      console.log('Delete path:', complaintPath);
      
      const complaintRef = ref(database, complaintPath);
      await remove(complaintRef);
      
      console.log('✅ Complaint deleted successfully');
    } catch (error) {
      console.error('Error deleting complaint:', error);
      throw new Error('Failed to delete complaint');
    }
  }

  /**
   * Check and create immediate notification for new/updated complaints
   * @param {string} userType - User type
   * @param {Object} complaint - Complaint data
   * @returns {Promise<void>}
   */
  async checkAndCreateImmediateNotification(userType, complaint) {
    try {
      console.log('🔍 Checking immediate notification for complaint:', complaint.complaintNumber);
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const expectedDate = new Date(complaint.expectedResolutionDate);
      expectedDate.setHours(0, 0, 0, 0);
      const daysDiff = Math.ceil((expectedDate - today) / (1000 * 60 * 60 * 24));

      console.log('📅 Due date comparison:', {
        today: today.toISOString(),
        expectedDate: expectedDate.toISOString(),
        daysDiff,
        status: complaint.status
      });

      // Only create notification if due today or overdue AND not resolved/closed
      if (daysDiff <= 0 && 
          complaint.status !== COMPLAINT_STATUS.RESOLVED && 
          complaint.status !== COMPLAINT_STATUS.CLOSED) {
        
        console.log('🔔 Creating immediate notification for due/overdue complaint');
        
        // Create individual notifications for this specific complaint
        await this.createImmediateComplaintNotification(userType, complaint);
        
        console.log('✅ Immediate notification created successfully');
      } else {
        console.log('ℹ️ No immediate notification needed - complaint not due/overdue or already resolved');
      }
    } catch (error) {
      console.warn('⚠️ Failed to create immediate notification:', error);
      // Don't fail the complaint creation/update
    }
  }

  /**
   * Create immediate notification for a specific complaint
   * @param {string} userType - User type
   * @param {Object} complaint - Complaint data
   * @returns {Promise<void>}
   */
  async createImmediateComplaintNotification(userType, complaint) {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const expectedDate = new Date(complaint.expectedResolutionDate);
      expectedDate.setHours(0, 0, 0, 0);
      const daysDiff = Math.ceil((expectedDate - today) / (1000 * 60 * 60 * 24));

      let notificationType, title, message, priority;
      
      if (daysDiff < 0) {
        // Overdue
        const daysOverdue = Math.abs(daysDiff);
        notificationType = 'complaint_overdue';
        title = 'Complaint Overdue';
        message = `Complaint #${complaint.complaintNumber} from ${complaint.customerName} is ${daysOverdue} day${daysOverdue > 1 ? 's' : ''} overdue`;
        priority = 'high';
      } else {
        // Due today
        notificationType = 'complaint_due_today';
        title = 'Complaint Due Today';
        message = `Complaint #${complaint.complaintNumber} from ${complaint.customerName} is due for resolution today`;
        priority = 'high';
      }

      const notificationData = {
        complaintId: complaint.id,
        complaintNumber: complaint.complaintNumber || '',
        customerName: complaint.customerName || '',
        customerPhone: complaint.customerPhone || '',
        title: complaint.title || '',
        severity: complaint.severity || 'medium',
        status: complaint.status || 'open',
        expectedResolutionDate: complaint.expectedResolutionDate || '',
        assigneeType: complaint.assigneeType || '',
        assignedEmployeeName: complaint.assignedEmployeeName || '',
        assignedEmployeeId: complaint.assignedEmployeeId || '',
        servicePersonName: complaint.servicePersonName || '',
        servicePersonContact: complaint.servicePersonContact || '',
        daysOverdue: daysDiff < 0 ? Math.abs(daysDiff) : 0,
        isDueToday: daysDiff === 0,
        isOverdue: daysDiff < 0,
        notificationDate: new Date().toISOString(),
        immediateNotification: true
      };

      // Get all users who should be notified
      const usersToNotify = new Set();

      // Add creator/admin
      if (complaint.createdBy) {
        usersToNotify.add(complaint.createdBy);
      }

      // Add assigned employee if different from creator
      if (complaint.assigneeType === ASSIGNEE_TYPE.EMPLOYEE && 
          complaint.assignedEmployeeId && 
          complaint.assignedEmployeeId !== complaint.createdBy) {
        
        try {
          const employeeService = await import('./employeeService');
          const employee = await employeeService.default.getEmployeeById(userType, complaint.assignedEmployeeId);
          if (employee && employee.userId) {
            usersToNotify.add(employee.userId);
          }
        } catch (error) {
          console.warn('Could not get employee for notification:', error);
        }
      }

      // Create notifications for all relevant users
      let created = 0;
      for (const userId of usersToNotify) {
        try {
          await independentComplaintNotificationService.createComplaintNotification(userType, {
            title,
            message,
            type: notificationType,
            userId,
            priority,
            data: notificationData
          });
          created++;
          console.log(`✅ Created immediate notification for user ${userId}`);
        } catch (error) {
          console.error(`❌ Failed to create notification for user ${userId}:`, error);
        }
      }

      console.log(`🎯 Created ${created} immediate notifications for complaint ${complaint.complaintNumber}`);
      
    } catch (error) {
      console.error('Error creating immediate complaint notification:', error);
      throw error;
    }
  }

  /**
   * Clean up notifications for a specific resolved complaint
   * @param {string} userType - User type
   * @param {string} complaintId - Complaint ID
   * @returns {Promise<void>}
   */
  async cleanupNotificationsForResolvedComplaint(userType, complaintId) {
    try {
      // Get all notifications for this complaint
      const allNotifications = await independentComplaintNotificationService.getAllComplaintNotifications(userType);
      const complaintNotifications = allNotifications.filter(n => 
        n.data?.complaintId === complaintId &&
        (n.type === 'complaint_due_today' || n.type === 'complaint_overdue')
      );

      // Delete them
      for (const notification of complaintNotifications) {
        await independentComplaintNotificationService.deleteNotification(userType, notification.id);
      }

      console.log(`🧹 Cleaned up ${complaintNotifications.length} notifications for complaint ${complaintId}`);
    } catch (error) {
      console.error('Error cleaning up notifications for specific complaint:', error);
      throw error;
    }
  }

  /**
   * Search complaints
   * @param {string} userType 
   * @param {string} searchTerm 
   * @param {number} limit 
   * @returns {Promise<Array>}
   */
  async searchComplaints(userType, searchTerm, limit = null) {
    try {
      if (!searchTerm || searchTerm.length < 1) {
        return [];
      }

      const complaintsPath = getComplaintsPath(userType);
      const complaintsRef = ref(database, complaintsPath);
      const snapshot = await get(complaintsRef);
      
      if (!snapshot.exists()) {
        return [];
      }

      let complaints = [];
      snapshot.forEach((childSnapshot) => {
        const complaintData = childSnapshot.val();
        const complaint = {
          id: childSnapshot.key,
          ...complaintData,
          isOverdue: isComplaintOverdue(complaintData.expectedResolutionDate, complaintData.status)
        };
        
        const searchLower = searchTerm.toLowerCase();
        if (
          complaint.complaintNumber?.toLowerCase().includes(searchLower) ||
          complaint.title?.toLowerCase().includes(searchLower) ||
          complaint.customerName?.toLowerCase().includes(searchLower) ||
          complaint.customerPhone?.includes(searchTerm) ||
          complaint.description?.toLowerCase().includes(searchLower)
        ) {
          complaints.push(complaint);
        }
      });

      // Sort by relevance and date
      complaints.sort((a, b) => {
        const aExact = a.complaintNumber?.toLowerCase().startsWith(searchTerm.toLowerCase()) ? 1 : 0;
        const bExact = b.complaintNumber?.toLowerCase().startsWith(searchTerm.toLowerCase()) ? 1 : 0;
        if (aExact !== bExact) return bExact - aExact;
        
        return new Date(b.createdAt) - new Date(a.createdAt);
      });

      return limit ? complaints.slice(0, limit) : complaints;
    } catch (error) {
      console.error('Error searching complaints:', error);
      throw new Error('Failed to search complaints');
    }
  }

  /**
   * Get complaints assigned to employee
   * @param {string} userType 
   * @param {string} employeeId 
   * @returns {Promise<Array>}
   */
  async getAssignedComplaints(userType, employeeId) {
    try {
      const allComplaints = await this.getComplaints(userType, {
        assignedTo: employeeId
      });
      return allComplaints.complaints;
    } catch (error) {
      console.error('Error fetching assigned complaints:', error);
      throw new Error('Failed to fetch assigned complaints');
    }
  }

  /**
   * Get complaint statistics
   * @param {string} userType 
   * @returns {Promise<Object>}
   */
  async getComplaintStats(userType) {
    try {
      const complaintsPath = getComplaintsPath(userType);
      const complaintsRef = ref(database, complaintsPath);
      const snapshot = await get(complaintsRef);
      
      if (!snapshot.exists()) {
        return {
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
        };
      }

      const stats = {
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
      };

      snapshot.forEach((childSnapshot) => {
        const complaint = childSnapshot.val();
        stats.total++;

        // Count by status
        if (complaint.status === COMPLAINT_STATUS.OPEN) stats.open++;
        else if (complaint.status === COMPLAINT_STATUS.IN_PROGRESS) stats.inProgress++;
        else if (complaint.status === COMPLAINT_STATUS.RESOLVED) stats.resolved++;
        else if (complaint.status === COMPLAINT_STATUS.CLOSED) stats.closed++;
        else if (complaint.status === COMPLAINT_STATUS.ESCALATED) stats.escalated++;

        // Count by severity
        if (complaint.severity === COMPLAINT_SEVERITY.LOW) stats.bySeverity.low++;
        else if (complaint.severity === COMPLAINT_SEVERITY.MEDIUM) stats.bySeverity.medium++;
        else if (complaint.severity === COMPLAINT_SEVERITY.HIGH) stats.bySeverity.high++;
        else if (complaint.severity === COMPLAINT_SEVERITY.CRITICAL) stats.bySeverity.critical++;

        // Count overdue
        if (isComplaintOverdue(complaint.expectedResolutionDate, complaint.status)) {
          stats.overdue++;
        }
      });

      return stats;
    } catch (error) {
      console.error('Error fetching complaint stats:', error);
      return {
        total: 0,
        open: 0,
        inProgress: 0,
        resolved: 0,
        closed: 0,
        escalated: 0,
        overdue: 0,
        bySeverity: { low: 0, medium: 0, high: 0, critical: 0 }
      };
    }
  }

  /**
   * Validate complaint data
   * @param {Object} complaintData 
   * @param {boolean} isCreate 
   */
  validateComplaintData(complaintData, isCreate = true) {
    const rules = COMPLAINT_VALIDATION_RULES;

    if (isCreate) {
      // Required fields for creation
      if (!complaintData.customerId || complaintData.customerId.trim() === '') {
        throw new Error('Customer is required');
      }
      
      if (!complaintData.title || complaintData.title.trim().length < rules.TITLE.MIN_LENGTH) {
        throw new Error(`Title must be at least ${rules.TITLE.MIN_LENGTH} characters`);
      }
      
      if (!complaintData.description || complaintData.description.trim().length < rules.DESCRIPTION.MIN_LENGTH) {
        throw new Error(`Description must be at least ${rules.DESCRIPTION.MIN_LENGTH} characters`);
      }
      
      if (!complaintData.expectedResolutionDate) {
        throw new Error('Expected resolution date is required');
      }
    }

    // Validate title length
    if (complaintData.title && complaintData.title.length > rules.TITLE.MAX_LENGTH) {
      throw new Error(`Title cannot exceed ${rules.TITLE.MAX_LENGTH} characters`);
    }

    // Validate description length
    if (complaintData.description && complaintData.description.length > rules.DESCRIPTION.MAX_LENGTH) {
      throw new Error(`Description cannot exceed ${rules.DESCRIPTION.MAX_LENGTH} characters`);
    }

    // Validate expected resolution date
    if (complaintData.expectedResolutionDate) {
      const expectedDate = new Date(complaintData.expectedResolutionDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (expectedDate < today) {
        throw new Error('Expected resolution date cannot be in the past');
      }
    }

    // Validate assignee type and related fields
    if (complaintData.assigneeType === ASSIGNEE_TYPE.SERVICE_PERSON) {
      if (!complaintData.servicePersonName || complaintData.servicePersonName.trim().length < rules.SERVICE_PERSON_NAME.MIN_LENGTH) {
        throw new Error(`Service person name must be at least ${rules.SERVICE_PERSON_NAME.MIN_LENGTH} characters`);
      }
      
      if (!complaintData.servicePersonContact || !rules.SERVICE_PERSON_CONTACT.PATTERN.test(complaintData.servicePersonContact)) {
        throw new Error('Valid service person contact number is required');
      }
    }

    // Validate severity
    if (complaintData.severity && !Object.values(COMPLAINT_SEVERITY).includes(complaintData.severity)) {
      throw new Error('Invalid severity level');
    }

    // Validate status
    if (complaintData.status && !Object.values(COMPLAINT_STATUS).includes(complaintData.status)) {
      throw new Error('Invalid complaint status');
    }
  }

  /**
   * Get overdue complaints
   * @param {string} userType 
   * @returns {Promise<Array>}
   */
  async getOverdueComplaints(userType) {
    try {
      const allComplaints = await this.getComplaints(userType);
      return allComplaints.complaints.filter(complaint => complaint.isOverdue);
    } catch (error) {
      console.error('Error fetching overdue complaints:', error);
      throw new Error('Failed to fetch overdue complaints');
    }
  }
}

// Create and export singleton instance
const enhancedComplaintService = new EnhancedComplaintService();
export default enhancedComplaintService;