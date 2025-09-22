import { ref, push, set, get, update, remove, query, orderByChild, equalTo } from 'firebase/database';
import { database } from './firebase/config';
import complaintService from './api/complaintService';
import employeeService from './api/employeeService';
import { 
  COMPLAINT_STATUS,
  COMPLAINT_SEVERITY,
  ASSIGNEE_TYPE,
  getComplaintPriorityFromSeverity
} from '../utils/constants/appConstants';

/**
 * Independent Complaint Notification Service
 * Completely separate from the main notification system
 * Handles ONLY complaint-related notifications with due/overdue logic
 */
class IndependentComplaintNotificationService {

  /**
   * Get Firebase path for complaint notifications
   * @param {string} userType - User type (electronics/furniture)
   * @param {string} notificationId - Optional notification ID
   * @returns {string} Firebase path
   */
  getComplaintNotificationsPath(userType, notificationId = null) {
    const basePath = `complaintNotifications/${userType}`;
    return notificationId ? `${basePath}/${notificationId}` : basePath;
  }

  /**
   * Get all complaint notifications for a user
   * @param {string} userType - User type
   * @param {string} userId - User ID
   * @returns {Promise<Array>} Array of notifications
   */
  async getComplaintNotifications(userType, userId) {
    try {
      const notificationsPath = this.getComplaintNotificationsPath(userType);
      const notificationsRef = ref(database, notificationsPath);
      const userQuery = query(
        notificationsRef,
        orderByChild('userId'),
        equalTo(userId)
      );

      const snapshot = await get(userQuery);
      
      if (!snapshot.exists()) {
        return [];
      }

      const notifications = [];
      snapshot.forEach((childSnapshot) => {
        notifications.push({
          id: childSnapshot.key,
          ...childSnapshot.val()
        });
      });

      // Sort by createdAt descending (most recent first)
      notifications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      return notifications;
    } catch (error) {
      console.error('Error getting complaint notifications:', error);
      throw error;
    }
  }

  /**
   * Create a complaint notification
   * @param {string} userType - User type
   * @param {Object} notificationData - Notification data
   * @returns {Promise<Object>} Created notification
   */
  async createComplaintNotification(userType, notificationData) {
    try {
      const notificationsPath = this.getComplaintNotificationsPath(userType);
      const notificationsRef = ref(database, notificationsPath);

      const notification = {
        title: notificationData.title,
        message: notificationData.message,
        type: notificationData.type,
        userId: notificationData.userId,
        userType,
        read: false,
        data: notificationData.data || {},
        priority: notificationData.priority || 'normal',
        category: 'complaints',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const newNotificationRef = push(notificationsRef);
      await set(newNotificationRef, notification);

      return {
        id: newNotificationRef.key,
        ...notification
      };
    } catch (error) {
      console.error('Error creating complaint notification:', error);
      throw error;
    }
  }

  /**
   * Mark notification as read
   * @param {string} userType - User type
   * @param {string} notificationId - Notification ID
   * @returns {Promise<void>}
   */
  async markAsRead(userType, notificationId) {
    try {
      const notificationPath = this.getComplaintNotificationsPath(userType, notificationId);
      const notificationRef = ref(database, notificationPath);
      
      await update(notificationRef, { 
        read: true, 
        readAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  /**
   * Mark all notifications as read for a user
   * @param {string} userType - User type
   * @param {string} userId - User ID
   * @returns {Promise<void>}
   */
  async markAllAsRead(userType, userId) {
    try {
      const notifications = await this.getComplaintNotifications(userType, userId);
      const unreadNotifications = notifications.filter(n => !n.read);

      for (const notification of unreadNotifications) {
        await this.markAsRead(userType, notification.id);
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  }

  /**
   * Delete a notification
   * @param {string} userType - User type
   * @param {string} notificationId - Notification ID
   * @returns {Promise<void>}
   */
  async deleteNotification(userType, notificationId) {
    try {
      const notificationPath = this.getComplaintNotificationsPath(userType, notificationId);
      const notificationRef = ref(database, notificationPath);
      await remove(notificationRef);
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  }

  /**
   * Generate notifications for due and overdue complaints ONLY
   * @param {string} userType - User type
   * @param {string} adminUserId - Admin user ID
   * @returns {Promise<Object>} Generation results
   */
  async generateDueAndOverdueNotifications(userType, adminUserId) {
    try {
      console.log('=== INDEPENDENT: Checking for due and overdue complaints ===');
      
      // Get all active complaints (not resolved or closed)
      const allComplaints = await complaintService.getComplaints(userType, {
        // Get all complaints without pagination
      });

      // Filter for complaints that are due/overdue and not resolved/closed
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      console.log('📅 Today date for comparison:', today.toISOString());
      
      const complaintsNeedingAttention = allComplaints.complaints.filter(complaint => {
        // Only include if status is not resolved or closed
        if (complaint.status === COMPLAINT_STATUS.RESOLVED || 
            complaint.status === COMPLAINT_STATUS.CLOSED) {
          return false;
        }

        const expectedDate = new Date(complaint.expectedResolutionDate);
        expectedDate.setHours(0, 0, 0, 0);
        const daysDiff = Math.ceil((expectedDate - today) / (1000 * 60 * 60 * 24));
        
        console.log(`🔍 Checking complaint ${complaint.complaintNumber}:`, {
          expectedDate: expectedDate.toISOString(),
          daysDiff,
          needsAttention: daysDiff <= 0
        });
        
        // Include if due today or overdue
        return daysDiff <= 0;
      });

      console.log(`Found ${complaintsNeedingAttention.length} complaints needing attention:`, 
        complaintsNeedingAttention.map(c => `${c.complaintNumber} (${c.customerName})`));

      if (complaintsNeedingAttention.length === 0) {
        return {
          created: 0,
          errors: [],
          total: 0,
          dueToday: 0,
          overdue: 0
        };
      }

      // Get ALL existing complaint notifications to avoid duplicates (not just for admin)
      const allExistingNotifications = await this.getAllComplaintNotifications(userType);
      const existingComplaintUserPairs = new Set(
        allExistingNotifications
          .filter(n => n.data?.complaintId && (n.type === 'complaint_due_today' || n.type === 'complaint_overdue'))
          .map(n => `${n.data.complaintId}_${n.userId}`)
      );

      console.log('📋 Existing notification pairs:', [...existingComplaintUserPairs]);

      let created = 0;
      let dueToday = 0;
      let overdue = 0;
      const errors = [];

      for (const complaint of complaintsNeedingAttention) {
        try {
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
            overdue++;
          } else {
            // Due today
            notificationType = 'complaint_due_today';
            title = 'Complaint Due Today';
            message = `Complaint #${complaint.complaintNumber} from ${complaint.customerName} is due for resolution today`;
            priority = getComplaintPriorityFromSeverity(complaint.severity);
            dueToday++;
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
            notificationDate: new Date().toISOString()
          };

          // Collect all users who should be notified
          const usersToNotify = new Set();
          
          // Add admin user
          usersToNotify.add(adminUserId);

          // Add assigned employee (if applicable and different from admin)
          if (complaint.assigneeType === ASSIGNEE_TYPE.EMPLOYEE && complaint.assignedEmployeeId) {
            try {
              const employee = await employeeService.getEmployeeById(userType, complaint.assignedEmployeeId);
              if (employee && employee.userId && employee.userId !== adminUserId) {
                usersToNotify.add(employee.userId);
              }
            } catch (employeeError) {
              console.warn(`Could not get employee for complaint ${complaint.id}:`, employeeError);
            }
          }

          // Create notifications only for users who don't already have one
          for (const userId of usersToNotify) {
            const notificationKey = `${complaint.id}_${userId}`;
            
            if (existingComplaintUserPairs.has(notificationKey)) {
              console.log(`⏩ Skipping duplicate notification for ${complaint.complaintNumber} - user ${userId}`);
              continue;
            }

            const userTitle = userId === adminUserId ? title : `Your Assigned ${daysDiff < 0 ? 'Overdue' : 'Due'} Complaint`;
            
            await this.createComplaintNotification(userType, {
              title: userTitle,
              message,
              type: notificationType,
              userId,
              priority,
              data: notificationData
            });

            created++;
            console.log(`✅ Created notification for complaint ${complaint.complaintNumber} - user ${userId}`);
            
            // Add to our tracking set to prevent duplicates in this run
            existingComplaintUserPairs.add(notificationKey);
          }

        } catch (error) {
          console.error(`Error creating notification for complaint ${complaint.id}:`, error);
          errors.push({
            complaintId: complaint.id,
            complaintNumber: complaint.complaintNumber,
            error: error.message
          });
        }
      }

      console.log(`=== INDEPENDENT: Created ${created} notifications (${dueToday} due today, ${overdue} overdue) ===`);

      return {
        created,
        errors,
        total: complaintsNeedingAttention.length,
        dueToday,
        overdue
      };

    } catch (error) {
      console.error('Error generating due/overdue notifications:', error);
      throw error;
    }
  }

  /**
   * Clean up resolved/closed complaint notifications
   * @param {string} userType - User type
   * @param {string} adminUserId - Admin user ID
   * @returns {Promise<number>} Number of notifications cleaned up
   */
  async cleanupResolvedComplaintNotifications(userType, adminUserId) {
    try {
      console.log('=== INDEPENDENT: Cleaning up resolved complaint notifications ===');
      
      // Get all complaint notifications
      const allNotifications = await this.getComplaintNotifications(userType, adminUserId);
      const complaintNotifications = allNotifications.filter(n => 
        n.type === 'complaint_due_today' || 
        n.type === 'complaint_overdue'
      );

      const notificationsToDelete = [];

      // Check each notification's complaint status
      for (const notification of complaintNotifications) {
        const complaintId = notification.data?.complaintId;
        
        if (!complaintId) continue;
        
        try {
          const complaint = await complaintService.getComplaintById(userType, complaintId);
          
          // If complaint is resolved, closed, or not found, mark notification for deletion
          if (!complaint || 
              complaint.status === COMPLAINT_STATUS.RESOLVED || 
              complaint.status === COMPLAINT_STATUS.CLOSED) {
            notificationsToDelete.push(notification.id);
          }
        } catch (error) {
          // If complaint not found, also delete the notification
          notificationsToDelete.push(notification.id);
        }
      }

      // Delete the notifications
      for (const notificationId of notificationsToDelete) {
        await this.deleteNotification(userType, notificationId);
      }

      console.log(`=== INDEPENDENT: Cleaned up ${notificationsToDelete.length} resolved notifications ===`);
      return notificationsToDelete.length;

    } catch (error) {
      console.error('Error cleaning up resolved complaint notifications:', error);
      throw error;
    }
  }

  /**
   * Update notifications when complaint due date changes
   * This gets called when complaint is updated via edit
   * @param {string} userType - User type
   * @param {string} complaintId - Complaint ID
   * @param {Object} updatedComplaint - Updated complaint data
   * @returns {Promise<void>}
   */
  async handleComplaintDueDateChange(userType, complaintId, updatedComplaint) {
    try {
      console.log('=== INDEPENDENT: Handling complaint due date change ===');
      console.log('Complaint ID:', complaintId);
      console.log('New due date:', updatedComplaint.expectedResolutionDate);

      // Get all notifications for this complaint
      const allNotifications = await this.getAllComplaintNotifications(userType);
      const complaintNotifications = allNotifications.filter(n => 
        n.data?.complaintId === complaintId &&
        (n.type === 'complaint_due_today' || n.type === 'complaint_overdue')
      );

      console.log(`Found ${complaintNotifications.length} existing notifications for this complaint`);

      // Delete existing notifications for this complaint
      for (const notification of complaintNotifications) {
        await this.deleteNotification(userType, notification.id);
        console.log(`Deleted notification ${notification.id}`);
      }

      // Check if new due date requires a notification
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const expectedDate = new Date(updatedComplaint.expectedResolutionDate);
      expectedDate.setHours(0, 0, 0, 0);
      const daysDiff = Math.ceil((expectedDate - today) / (1000 * 60 * 60 * 24));

      // Only create new notification if due today or overdue AND not resolved/closed
      if (daysDiff <= 0 && 
          updatedComplaint.status !== COMPLAINT_STATUS.RESOLVED && 
          updatedComplaint.status !== COMPLAINT_STATUS.CLOSED) {
        
        console.log('Creating new notification for updated due date');
        
        let notificationType, title, message, priority;
        
        if (daysDiff < 0) {
          // Overdue
          const daysOverdue = Math.abs(daysDiff);
          notificationType = 'complaint_overdue';
          title = 'Complaint Overdue';
          message = `Complaint #${updatedComplaint.complaintNumber} from ${updatedComplaint.customerName} is ${daysOverdue} day${daysOverdue > 1 ? 's' : ''} overdue`;
          priority = 'high';
        } else {
          // Due today
          notificationType = 'complaint_due_today';
          title = 'Complaint Due Today';
          message = `Complaint #${updatedComplaint.complaintNumber} from ${updatedComplaint.customerName} is due for resolution today`;
          priority = getComplaintPriorityFromSeverity(updatedComplaint.severity);
        }

        const notificationData = {
          complaintId: updatedComplaint.id,
          complaintNumber: updatedComplaint.complaintNumber || '',
          customerName: updatedComplaint.customerName || '',
          customerPhone: updatedComplaint.customerPhone || '',
          title: updatedComplaint.title || '',
          severity: updatedComplaint.severity || 'medium',
          status: updatedComplaint.status || 'open',
          expectedResolutionDate: updatedComplaint.expectedResolutionDate || '',
          assigneeType: updatedComplaint.assigneeType || '',
          assignedEmployeeName: updatedComplaint.assignedEmployeeName || '',
          assignedEmployeeId: updatedComplaint.assignedEmployeeId || '',
          servicePersonName: updatedComplaint.servicePersonName || '',
          servicePersonContact: updatedComplaint.servicePersonContact || '',
          daysOverdue: daysDiff < 0 ? Math.abs(daysDiff) : 0,
          isDueToday: daysDiff === 0,
          isOverdue: daysDiff < 0,
          notificationDate: new Date().toISOString(),
          dueDateUpdated: true
        };

        // Get all users who should be notified (admin + assigned employee)
        const usersToNotify = [];

        // Find admin users - you might need to adjust this logic based on your user system
        // For now, we'll use the updatedBy field or search for admin users
        if (updatedComplaint.updatedBy) {
          usersToNotify.push(updatedComplaint.updatedBy);
        }

        // Add assigned employee if applicable
        if (updatedComplaint.assigneeType === ASSIGNEE_TYPE.EMPLOYEE && updatedComplaint.assignedEmployeeId) {
          try {
            const employee = await employeeService.getEmployeeById(userType, updatedComplaint.assignedEmployeeId);
            if (employee && employee.userId) {
              usersToNotify.push(employee.userId);
            }
          } catch (error) {
            console.warn('Could not get employee for notification:', error);
          }
        }

        // Create notifications for all relevant users
        for (const userId of [...new Set(usersToNotify)]) {
          await this.createComplaintNotification(userType, {
            title,
            message,
            type: notificationType,
            userId,
            priority,
            data: notificationData
          });
          console.log(`Created updated notification for user ${userId}`);
        }
      }

      console.log('=== INDEPENDENT: Due date change handling complete ===');

    } catch (error) {
      console.error('Error handling complaint due date change:', error);
      throw error;
    }
  }

  /**
   * Get all complaint notifications (across all users) for internal operations
   * @param {string} userType - User type
   * @returns {Promise<Array>} All notifications
   */
  async getAllComplaintNotifications(userType) {
    try {
      const notificationsPath = this.getComplaintNotificationsPath(userType);
      const notificationsRef = ref(database, notificationsPath);
      const snapshot = await get(notificationsRef);
      
      if (!snapshot.exists()) {
        return [];
      }

      const notifications = [];
      snapshot.forEach((childSnapshot) => {
        notifications.push({
          id: childSnapshot.key,
          ...childSnapshot.val()
        });
      });

      return notifications;
    } catch (error) {
      console.error('Error getting all complaint notifications:', error);
      return [];
    }
  }

  /**
   * Main method to process complaint notifications (generate + cleanup)
   * @param {string} userType - User type
   * @param {string} adminUserId - Admin user ID
   * @returns {Promise<Object>} Results summary
   */
  async processComplaintNotifications(userType, adminUserId) {
    try {
      console.log('=== INDEPENDENT: Processing Complaint Notifications ===');
      
      // First clean up resolved notifications
      const cleanedUp = await this.cleanupResolvedComplaintNotifications(userType, adminUserId);
      
      // Then generate new due/overdue notifications
      const generated = await this.generateDueAndOverdueNotifications(userType, adminUserId);
      
      const result = {
        generated: generated.created,
        cleanedUp,
        dueToday: generated.dueToday,
        overdue: generated.overdue,
        errors: generated.errors,
        summary: `Generated ${generated.created} notifications, cleaned up ${cleanedUp} resolved notifications`
      };

      console.log('=== INDEPENDENT: Complaint Notifications Processing Complete ===');
      console.log(result.summary);
      
      return result;

    } catch (error) {
      console.error('Error processing complaint notifications:', error);
      throw error;
    }
  }

  /**
   * Get notification statistics
   * @param {string} userType - User type
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Statistics
   */
  async getNotificationStats(userType, userId) {
    try {
      const notifications = await this.getComplaintNotifications(userType, userId);

      const stats = {
        total: notifications.length,
        dueToday: notifications.filter(n => n.type === 'complaint_due_today').length,
        overdue: notifications.filter(n => n.type === 'complaint_overdue').length,
        resolved: notifications.filter(n => n.type === 'complaint_resolved').length,
        assigned: notifications.filter(n => n.type === 'complaint_assigned').length,
        unread: notifications.filter(n => !n.read).length
      };

      return stats;
    } catch (error) {
      console.error('Error getting notification stats:', error);
      return {
        total: 0, dueToday: 0, overdue: 0, resolved: 0, assigned: 0, unread: 0
      };
    }
  }
}

// Create and export singleton instance
const independentComplaintNotificationService = new IndependentComplaintNotificationService();
export default independentComplaintNotificationService;