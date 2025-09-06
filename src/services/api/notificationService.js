import BaseService from './baseService';
import { COLLECTIONS } from '../../utils/constants/appConstants';

/**
 * Notification service for managing notifications
 */
class NotificationService extends BaseService {
  constructor() {
    super(COLLECTIONS.NOTIFICATIONS || 'notifications');
  }

  /**
   * Get notifications for user
   * @param {string} userType - User type
   * @param {string} userId - User ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Notifications array
   */
  async getNotifications(userType, userId, options = {}) {
    try {
      const queryOptions = {
        limit: 50,
        orderBy: 'createdAt',
        orderDirection: 'desc',
        where: [
          ['userId', '==', userId],
          ['userType', '==', userType]
        ],
        ...options
      };

      return await this.getAll(userType, queryOptions);
    } catch (error) {
      console.error('Error getting notifications:', error);
      throw error;
    }
  }

  /**
   * Get unread notifications count
   * @param {string} userType - User type
   * @param {string} userId - User ID
   * @returns {Promise<number>} Unread count
   */
  async getUnreadCount(userType, userId) {
    try {
      return await this.getCount(userType, {
        userId,
        userType,
        read: false
      });
    } catch (error) {
      console.error('Error getting unread notifications count:', error);
      throw error;
    }
  }

  /**
   * Create notification
   * @param {string} userType - User type
   * @param {Object} notificationData - Notification data
   * @returns {Promise<Object>} Created notification
   */
  async createNotification(userType, notificationData) {
    try {
      const notification = {
        title: notificationData.title,
        message: notificationData.message,
        type: notificationData.type || 'info',
        userId: notificationData.userId,
        userType,
        read: false,
        data: notificationData.data || {},
        priority: notificationData.priority || 'normal',
        category: notificationData.category || 'general'
      };

      return await this.create(userType, notification);
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  /**
   * Mark notification as read
   * @param {string} userType - User type
   * @param {string} notificationId - Notification ID
   * @returns {Promise<Object>} Updated notification
   */
  async markAsRead(userType, notificationId) {
    try {
      return await this.update(userType, notificationId, { read: true });
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  /**
   * Mark all notifications as read for user
   * @param {string} userType - User type
   * @param {string} userId - User ID
   * @returns {Promise<void>}
   */
  async markAllAsRead(userType, userId) {
    try {
      const unreadNotifications = await this.getAll(userType, {
        where: [
          ['userId', '==', userId],
          ['userType', '==', userType],
          ['read', '==', false]
        ]
      });

      const operations = unreadNotifications.map(notification => ({
        type: 'update',
        id: notification.id,
        data: { read: true }
      }));

      if (operations.length > 0) {
        await this.batch(userType, operations);
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  }

  /**
   * Delete notification
   * @param {string} userType - User type
   * @param {string} notificationId - Notification ID
   * @returns {Promise<void>}
   */
  async deleteNotification(userType, notificationId) {
    try {
      return await this.delete(userType, notificationId);
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  }

  /**
   * Create EMI payment reminder notification
   * @param {string} userType - User type
   * @param {string} userId - User ID
   * @param {Object} emiData - EMI data
   * @returns {Promise<Object>} Created notification
   */
  async createEMIReminder(userType, userId, emiData) {
    return await this.createNotification(userType, {
      title: 'EMI Payment Due',
      message: `EMI payment of ₹${emiData.amount} is due for ${emiData.customerName}`,
      type: 'reminder',
      userId,
      category: 'emi',
      priority: 'high',
      data: {
        customerId: emiData.customerId,
        invoiceId: emiData.invoiceId,
        amount: emiData.amount,
        dueDate: emiData.dueDate
      }
    });
  }

  /**
   * Create delivery reminder notification
   * @param {string} userType - User type
   * @param {string} userId - User ID
   * @param {Object} deliveryData - Delivery data
   * @returns {Promise<Object>} Created notification
   */
  async createDeliveryReminder(userType, userId, deliveryData) {
    return await this.createNotification(userType, {
      title: 'Delivery Scheduled',
      message: `Delivery scheduled for ${deliveryData.customerName} on ${deliveryData.deliveryDate}`,
      type: 'reminder',
      userId,
      category: 'delivery',
      priority: 'medium',
      data: {
        customerId: deliveryData.customerId,
        invoiceId: deliveryData.invoiceId,
        deliveryDate: deliveryData.deliveryDate,
        address: deliveryData.address
      }
    });
  }

  /**
   * Create low stock notification
   * @param {string} userType - User type
   * @param {string} userId - User ID
   * @param {Object} stockData - Stock data
   * @returns {Promise<Object>} Created notification
   */
  async createLowStockAlert(userType, userId, stockData) {
    return await this.createNotification(userType, {
      title: 'Low Stock Alert',
      message: `${stockData.itemName} is running low on stock (${stockData.quantity} remaining)`,
      type: 'alert',
      userId,
      category: 'inventory',
      priority: 'medium',
      data: {
        itemId: stockData.itemId,
        itemName: stockData.itemName,
        currentStock: stockData.quantity,
        minStock: stockData.minStock
      }
    });
  }

  /**
   * Get notifications by category
   * @param {string} userType - User type
   * @param {string} userId - User ID
   * @param {string} category - Notification category
   * @returns {Promise<Array>} Filtered notifications
   */
  async getNotificationsByCategory(userType, userId, category) {
    try {
      return await this.getAll(userType, {
        where: [
          ['userId', '==', userId],
          ['userType', '==', userType],
          ['category', '==', category]
        ],
        orderBy: 'createdAt',
        orderDirection: 'desc'
      });
    } catch (error) {
      console.error('Error getting notifications by category:', error);
      throw error;
    }
  }

  /**
   * Delete old read notifications
   * @param {string} userType - User type
   * @param {string} userId - User ID
   * @param {number} daysOld - Days old threshold
   * @returns {Promise<void>}
   */
  async deleteOldNotifications(userType, userId, daysOld = 30) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const oldNotifications = await this.getAll(userType, {
        where: [
          ['userId', '==', userId],
          ['userType', '==', userType],
          ['read', '==', true],
          ['createdAt', '<', cutoffDate.toISOString()]
        ]
      });

      const deleteOperations = oldNotifications.map(notification => ({
        type: 'delete',
        id: notification.id
      }));

      if (deleteOperations.length > 0) {
        await this.batch(userType, deleteOperations);
      }

      return deleteOperations.length;
    } catch (error) {
      console.error('Error deleting old notifications:', error);
      throw error;
    }
  }
}

// Create and export singleton instance
const notificationService = new NotificationService();
export default notificationService;