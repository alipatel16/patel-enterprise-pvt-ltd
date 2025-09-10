// Optimized services/emiNotificationGenerator.js - Fast batch creation, no console logs

import notificationService from './api/notificationService';
import salesService from './api/salesService';
import { formatCurrency, formatDate } from '../utils/helpers/formatHelpers';

/**
 * OPTIMIZED EMI Notification Generator Service - Fast batch creation
 */
class EMINotificationGenerator {
  
  /**
   * OPTIMIZED: Clear existing notifications before generating new ones
   * @param {string} userType - User type (electronics/furniture)
   * @param {string} adminUserId - Admin user ID
   */
  async clearExistingNotifications(userType, adminUserId) {
    try {
      const allNotifications = await notificationService.getNotifications(userType, adminUserId);
      
      if (allNotifications.length > 0) {
        const deleteOperations = allNotifications.map(notification => ({
          type: 'delete',
          id: notification.id
        }));

        await notificationService.batch(userType, deleteOperations);
      }
      
      return allNotifications.length;
    } catch (error) {
      throw error;
    }
  }

  /**
   * NEW: Create notifications in batch for better performance
   * @param {string} userType - User type
   * @param {Array} notificationsData - Array of notification data objects
   */
  async createNotificationsBatch(userType, notificationsData) {
    try {
      if (notificationsData.length === 0) return 0;
      
      // Try batch creation first
      try {
        const createOperations = notificationsData.map(data => ({
          type: 'create',
          data
        }));

        await notificationService.batch(userType, createOperations);
        return notificationsData.length;
      } catch (batchError) {
        // Fallback to individual creation if batch fails
        let created = 0;
        for (const data of notificationsData) {
          try {
            await notificationService.createNotification(userType, data);
            created++;
          } catch (individualError) {
            // Skip failed individual notifications but continue
            continue;
          }
        }
        return created;
      }
    } catch (error) {
      throw error;
    }
  }

  /**
   * OPTIMIZED: Generate EMI notifications with batch creation
   * @param {string} userType - User type (electronics/furniture)
   * @param {string} adminUserId - Admin user ID to receive notifications
   */
  async generateEMINotifications(userType, adminUserId) {
    try {
      // Get all sales with EMI payment status
      const allSales = await salesService.getAll(userType, {
        where: [['paymentStatus', '==', 'emi']]
      });

      const notificationsToCreate = [];
      const today = new Date();
      const sevenDaysFromNow = new Date(today.getTime() + (7 * 24 * 60 * 60 * 1000));

      for (const sale of allSales) {
        if (!sale.emiDetails || !sale.emiDetails.schedule) {
          continue;
        }

        // Check each EMI installment
        for (const installment of sale.emiDetails.schedule) {
          // SKIP PAID INSTALLMENTS
          if (installment.paid) {
            continue;
          }

          const dueDate = new Date(installment.dueDate);
          
          // Check if EMI is due within the next 7 days (including overdue)
          if (dueDate <= sevenDaysFromNow) {
            // Calculate days difference
            const daysDiff = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
            
            let title, message, priority;
            
            if (daysDiff < 0) {
              // Overdue
              const overdueDays = Math.abs(daysDiff);
              title = 'EMI Payment Overdue';
              message = `EMI payment of ${formatCurrency(installment.amount)} is ${overdueDays} day${overdueDays > 1 ? 's' : ''} overdue for ${sale.customerName}`;
              priority = 'high';
            } else if (daysDiff === 0) {
              // Due today
              title = 'EMI Payment Due Today';
              message = `EMI payment of ${formatCurrency(installment.amount)} is due today for ${sale.customerName}`;
              priority = 'high';
            } else if (daysDiff <= 3) {
              // Due within 3 days
              title = 'EMI Payment Due Soon';
              message = `EMI payment of ${formatCurrency(installment.amount)} is due in ${daysDiff} day${daysDiff > 1 ? 's' : ''} for ${sale.customerName}`;
              priority = 'medium';
            } else {
              // Due within 7 days
              title = 'Upcoming EMI Payment';
              message = `EMI payment of ${formatCurrency(installment.amount)} is due in ${daysDiff} days for ${sale.customerName}`;
              priority = 'medium';
            }

            // Add to batch instead of creating immediately
            notificationsToCreate.push({
              title,
              message,
              type: 'emi_due',
              userId: adminUserId,
              category: 'emi',
              priority,
              data: {
                customerId: sale.customerId,
                customerName: sale.customerName,
                invoiceId: sale.id || sale.invoiceNumber,
                invoiceNumber: sale.invoiceNumber,
                amount: installment.amount,
                dueDate: installment.dueDate,
                installmentNumber: installment.installmentNumber,
                phoneNumber: sale.customerPhone,
                isOverdue: daysDiff < 0,
                daysDiff: Math.abs(daysDiff),
                urgencyLevel: daysDiff < 0 ? 'overdue' : daysDiff === 0 ? 'today' : daysDiff <= 3 ? 'soon' : 'upcoming'
              }
            });
          }
        }
      }

      // Create all notifications in batch
      const created = await this.createNotificationsBatch(userType, notificationsToCreate);
      return created;
      
    } catch (error) {
      throw error;
    }
  }

  /**
   * OPTIMIZED: Generate delivery notifications with batch creation
   * @param {string} userType - User type
   * @param {string} adminUserId - Admin user ID
   */
  async generateDeliveryNotifications(userType, adminUserId) {
    try {
      // Get all sales with scheduled deliveries
      const allSales = await salesService.getAll(userType, {
        where: [['deliveryStatus', '==', 'scheduled']]
      });

      const notificationsToCreate = [];
      const today = new Date();
      const sevenDaysFromNow = new Date(today.getTime() + (7 * 24 * 60 * 60 * 1000));

      for (const sale of allSales) {
        if (!sale.scheduledDeliveryDate) {
          continue;
        }

        const deliveryDate = new Date(sale.scheduledDeliveryDate);
        
        // Create notifications for deliveries due within next 7 days (including overdue)
        if (deliveryDate <= sevenDaysFromNow) {
          const daysDiff = Math.ceil((deliveryDate - today) / (1000 * 60 * 60 * 24));
          
          let title, message, priority, type;
          
          if (daysDiff < 0) {
            // Overdue delivery
            const overdueDays = Math.abs(daysDiff);
            title = 'Delivery Overdue';
            message = `Delivery for ${sale.customerName} is ${overdueDays} day${overdueDays > 1 ? 's' : ''} overdue`;
            priority = 'high';
            type = 'delivery_overdue';
          } else if (daysDiff === 0) {
            // Due today
            title = 'Delivery Scheduled Today';
            message = `Delivery scheduled today for ${sale.customerName}`;
            priority = 'high';
            type = 'delivery_today';
          } else if (daysDiff <= 3) {
            // Due within 3 days
            title = 'Delivery Due Soon';
            message = `Delivery scheduled in ${daysDiff} day${daysDiff > 1 ? 's' : ''} for ${sale.customerName}`;
            priority = 'medium';
            type = 'delivery_scheduled';
          } else {
            // Due within 7 days
            title = 'Upcoming Delivery';
            message = `Delivery scheduled in ${daysDiff} days for ${sale.customerName}`;
            priority = 'medium';
            type = 'delivery_scheduled';
          }
          
          // Add to batch instead of creating immediately
          notificationsToCreate.push({
            title,
            message,
            type,
            userId: adminUserId,
            category: 'delivery',
            priority,
            data: {
              customerId: sale.customerId,
              customerName: sale.customerName,
              orderId: sale.id,
              orderNumber: sale.invoiceNumber,
              scheduledDate: sale.scheduledDeliveryDate,
              address: sale.customerAddress,
              phoneNumber: sale.customerPhone,
              itemCount: sale.items?.length || 0,
              status: sale.deliveryStatus,
              isOverdue: daysDiff < 0,
              daysDiff: Math.abs(daysDiff),
              urgencyLevel: daysDiff < 0 ? 'overdue' : daysDiff === 0 ? 'today' : daysDiff <= 3 ? 'soon' : 'upcoming'
            }
          });
        }
      }

      // Create all notifications in batch
      const created = await this.createNotificationsBatch(userType, notificationsToCreate);
      return created;
      
    } catch (error) {
      throw error;
    }
  }

  /**
   * OPTIMIZED: Generate upcoming EMI notifications with batch creation
   * @param {string} userType - User type
   * @param {string} adminUserId - Admin user ID
   */
  async generateUpcomingEMINotifications(userType, adminUserId) {
    try {
      const allSales = await salesService.getAll(userType, {
        where: [['paymentStatus', '==', 'emi']]
      });

      const notificationsToCreate = [];
      const today = new Date();
      const thirtyDaysFromNow = new Date(today.getTime() + (30 * 24 * 60 * 60 * 1000));

      for (const sale of allSales) {
        if (!sale.emiDetails || !sale.emiDetails.schedule) {
          continue;
        }

        // Find the next unpaid EMI within 30 days
        const upcomingEMIs = sale.emiDetails.schedule
          .filter(installment => !installment.paid) // ONLY UNPAID INSTALLMENTS
          .filter(installment => {
            const dueDate = new Date(installment.dueDate);
            const daysDiff = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
            return daysDiff > 7 && daysDiff <= 30; // Between 8-30 days
          })
          .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

        // Create notification for the next upcoming EMI only
        if (upcomingEMIs.length > 0) {
          const nextEMI = upcomingEMIs[0];
          const daysDiff = Math.ceil((new Date(nextEMI.dueDate) - today) / (1000 * 60 * 60 * 24));
          
          // Add to batch instead of creating immediately
          notificationsToCreate.push({
            title: 'Upcoming EMI Payment',
            message: `EMI payment of ${formatCurrency(nextEMI.amount)} is due in ${daysDiff} days for ${sale.customerName}`,
            type: 'emi_upcoming',
            userId: adminUserId,
            category: 'emi',
            priority: 'low',
            data: {
              customerId: sale.customerId,
              customerName: sale.customerName,
              invoiceId: sale.id || sale.invoiceNumber,
              invoiceNumber: sale.invoiceNumber,
              amount: nextEMI.amount,
              dueDate: nextEMI.dueDate,
              installmentNumber: nextEMI.installmentNumber,
              phoneNumber: sale.customerPhone,
              daysDiff,
              urgencyLevel: 'upcoming'
            }
          });
        }
      }

      // Create all notifications in batch
      const created = await this.createNotificationsBatch(userType, notificationsToCreate);
      return created;
      
    } catch (error) {
      throw error;
    }
  }

  /**
   * OPTIMIZED: Clean up duplicate notifications quickly
   * @param {string} userType - User type
   * @param {string} adminUserId - Admin user ID
   */
  async cleanupDuplicateNotifications(userType, adminUserId) {
    try {
      const allNotifications = await notificationService.getNotifications(userType, adminUserId);
      
      // Group notifications by unique key
      const notificationGroups = {};
      
      allNotifications.forEach(notification => {
        let key;
        
        if (notification.type === 'emi_due' || notification.type === 'emi_upcoming') {
          // For EMI notifications, use customer + invoice + installment + dueDate
          key = `${notification.data?.customerId}_${notification.data?.invoiceNumber}_${notification.data?.installmentNumber}_${notification.data?.dueDate}`;
        } else if (notification.type.includes('delivery')) {
          // For delivery notifications, use order + scheduled date
          key = `${notification.data?.orderId}_${notification.data?.scheduledDate}`;
        } else {
          // For other notifications, use type + customerId + createdAt date
          const createdDate = new Date(notification.createdAt).toDateString();
          key = `${notification.type}_${notification.data?.customerId}_${createdDate}`;
        }
        
        if (!notificationGroups[key]) {
          notificationGroups[key] = [];
        }
        notificationGroups[key].push(notification);
      });
      
      // Collect duplicates to delete
      const duplicatesToDelete = [];
      
      for (const group of Object.values(notificationGroups)) {
        if (group.length > 1) {
          // Sort by createdAt and keep the newest
          group.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
          
          // Add all except the first (newest) to deletion list
          for (let i = 1; i < group.length; i++) {
            duplicatesToDelete.push(group[i].id);
          }
        }
      }
      
      // Delete duplicates in batch
      if (duplicatesToDelete.length > 0) {
        const deleteOperations = duplicatesToDelete.map(id => ({
          type: 'delete',
          id
        }));
        
        await notificationService.batch(userType, deleteOperations);
      }
      
      return duplicatesToDelete.length;
      
    } catch (error) {
      throw error;
    }
  }

  /**
   * MAIN METHOD: Generate all notifications with clear and batch creation
   * @param {string} userType - User type
   * @param {string} adminUserId - Admin user ID
   */
  async generateAllNotifications(userType, adminUserId) {
    try {
      // Step 1: Clear existing notifications first
      const deletedCount = await this.clearExistingNotifications(userType, adminUserId);
      
      // Step 2: Generate all notifications in parallel for speed
      const [emiCount, deliveryCount, upcomingCount] = await Promise.all([
        this.generateEMINotifications(userType, adminUserId),
        this.generateDeliveryNotifications(userType, adminUserId),
        this.generateUpcomingEMINotifications(userType, adminUserId)
      ]);
      
      return {
        deleted: deletedCount,
        total: emiCount + deliveryCount + upcomingCount,
        emi: emiCount,
        delivery: deliveryCount,
        upcoming: upcomingCount
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Clean up notifications for paid installments
   * @param {string} userType - User type (electronics/furniture)
   * @param {string} adminUserId - Admin user ID
   */
  async cleanupPaidInstallmentNotifications(userType, adminUserId) {
    try {
      // Get all EMI notifications
      const existingNotifications = await notificationService.getNotifications(userType, adminUserId);
      const emiNotifications = existingNotifications.filter(n => 
        n.type === 'emi_due' || n.type === 'emi_upcoming' || n.type === 'payment_overdue'
      );

      if (emiNotifications.length === 0) {
        return 0;
      }

      // Get all EMI sales to check payment status
      const allSales = await salesService.getAll(userType, {
        where: [['paymentStatus', '==', 'emi']]
      });

      const notificationsToDelete = [];

      for (const notification of emiNotifications) {
        const notificationData = notification.data;
        if (!notificationData || !notificationData.invoiceNumber || !notificationData.installmentNumber) {
          continue;
        }

        // Find the corresponding sale
        const sale = allSales.find(s => 
          s.invoiceNumber === notificationData.invoiceNumber ||
          s.id === notificationData.invoiceId
        );

        if (sale && sale.emiDetails && sale.emiDetails.schedule) {
          // Find the specific installment
          const installment = sale.emiDetails.schedule.find(inst => 
            inst.installmentNumber === notificationData.installmentNumber
          );

          // If installment is paid, mark for deletion
          if (installment && installment.paid) {
            notificationsToDelete.push(notification.id);
          }
        }
      }

      // Delete notifications in batch
      if (notificationsToDelete.length > 0) {
        const deleteOperations = notificationsToDelete.map(id => ({
          type: 'delete',
          id
        }));
        
        await notificationService.batch(userType, deleteOperations);
      }

      return notificationsToDelete.length;
      
    } catch (error) {
      throw error;
    }
  }

  /**
   * Clean up old notifications (older than 30 days and read)
   * @param {string} userType - User type
   * @param {string} adminUserId - Admin user ID
   */
  async cleanupOldNotifications(userType, adminUserId) {
    try {
      const deleted = await notificationService.deleteOldNotifications(userType, adminUserId, 30);
      return deleted;
    } catch (error) {
      throw error;
    }
  }
}

// Create and export singleton instance
const emiNotificationGenerator = new EMINotificationGenerator();
export default emiNotificationGenerator;