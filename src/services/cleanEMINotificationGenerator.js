// Clean EMI Notification Generator - No duplicates, automatic cleanup
import notificationService from './api/notificationService';
import salesService from './api/salesService';
import { formatCurrency } from '../utils/helpers/formatHelpers';

class CleanEMINotificationGenerator {

  /**
   * Generate unique EMI notifications - only for unpaid, due/overdue installments
   * @param {string} userType - User type (electronics/furniture)
   * @param {string} adminUserId - Admin user ID
   */
  async generateEMINotifications(userType, adminUserId) {
    try {
      // Step 1: Get all EMI sales
      const emiSales = await salesService.getAll(userType, {
        where: [['paymentStatus', '==', 'emi']]
      });

      // Step 2: Get existing EMI notifications to avoid duplicates
      const existingNotifications = await notificationService.getNotifications(userType, adminUserId);
      const existingEMINotifications = existingNotifications.filter(n => 
        n.type === 'emi_due' || n.type === 'emi_overdue'
      );

      // Step 3: Build a set of existing notification keys for quick lookup
      const existingKeys = new Set();
      existingEMINotifications.forEach(notification => {
        if (notification.data) {
          const key = `${notification.data.invoiceId}_${notification.data.installmentNumber}`;
          existingKeys.add(key);
        }
      });

      // Step 4: Find installments that need notifications
      const today = new Date();
      const notificationsToCreate = [];
      const notificationsToDelete = []; // For paid installments

      for (const sale of emiSales) {
        if (!sale.emiDetails?.schedule) continue;

        for (const installment of sale.emiDetails.schedule) {
          const notificationKey = `${sale.id}_${installment.installmentNumber}`;
          const dueDate = new Date(installment.dueDate);
          const daysDiff = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));

          // If installment is PAID, mark existing notification for deletion
          if (installment.paid) {
            const existingNotification = existingEMINotifications.find(n => 
              n.data?.invoiceId === sale.id && 
              n.data?.installmentNumber === installment.installmentNumber
            );
            if (existingNotification) {
              notificationsToDelete.push(existingNotification.id);
            }
            continue;
          }

          // Only create notifications for DUE or OVERDUE unpaid installments
          if (daysDiff <= 7) { // Due within 7 days or overdue
            // Skip if notification already exists
            if (existingKeys.has(notificationKey)) {
              continue;
            }

            let title, message, type, priority;

            if (daysDiff < 0) {
              // Overdue
              const overdueDays = Math.abs(daysDiff);
              title = 'EMI Payment Overdue';
              message = `EMI payment of ${formatCurrency(installment.amount)} is ${overdueDays} day${overdueDays > 1 ? 's' : ''} overdue for ${sale.customerName}`;
              type = 'emi_overdue';
              priority = 'high';
            } else if (daysDiff === 0) {
              // Due today
              title = 'EMI Payment Due Today';
              message = `EMI payment of ${formatCurrency(installment.amount)} is due today for ${sale.customerName}`;
              type = 'emi_due';
              priority = 'high';
            } else {
              // Due within 7 days
              title = 'EMI Payment Due Soon';
              message = `EMI payment of ${formatCurrency(installment.amount)} is due in ${daysDiff} day${daysDiff > 1 ? 's' : ''} for ${sale.customerName}`;
              type = 'emi_due';
              priority = 'medium';
            }

            notificationsToCreate.push({
              title,
              message,
              type,
              userId: adminUserId,
              category: 'emi',
              priority,
              createdAt: new Date().toISOString(),
              read: false,
              data: {
                customerId: sale.customerId,
                customerName: sale.customerName,
                invoiceId: sale.id,
                invoiceNumber: sale.invoiceNumber,
                amount: installment.amount,
                dueDate: installment.dueDate,
                installmentNumber: installment.installmentNumber,
                phoneNumber: sale.customerPhone,
                isOverdue: daysDiff < 0,
                daysDiff: Math.abs(daysDiff)
              }
            });
          }
        }
      }

      // Step 5: Delete notifications for paid installments first
      if (notificationsToDelete.length > 0) {
        await Promise.all(
          notificationsToDelete.map(id => 
            notificationService.deleteNotification(userType, id)
          )
        );
      }

      // Step 6: Create new notifications
      if (notificationsToCreate.length > 0) {
        await Promise.all(
          notificationsToCreate.map(data => 
            notificationService.createNotification(userType, data)
          )
        );
      }

      return {
        created: notificationsToCreate.length,
        deleted: notificationsToDelete.length,
        total: notificationsToCreate.length
      };

    } catch (error) {
      console.error('Error generating EMI notifications:', error);
      throw error;
    }
  }

  /**
   * Generate delivery notifications - only for pending/scheduled deliveries
   * @param {string} userType - User type
   * @param {string} adminUserId - Admin user ID
   */
  async generateDeliveryNotifications(userType, adminUserId) {
    try {
      // Step 1: Get all scheduled deliveries
      const scheduledSales = await salesService.getAll(userType, {
        where: [['deliveryStatus', '==', 'scheduled']]
      });

      // Step 2: Get existing delivery notifications
      const existingNotifications = await notificationService.getNotifications(userType, adminUserId);
      const existingDeliveryNotifications = existingNotifications.filter(n => 
        n.type.includes('delivery')
      );

      // Step 3: Build existing keys for quick lookup
      const existingKeys = new Set();
      existingDeliveryNotifications.forEach(notification => {
        if (notification.data) {
          const key = `${notification.data.orderId}`;
          existingKeys.add(key);
        }
      });

      // Step 4: Find deliveries that need notifications
      const today = new Date();
      const notificationsToCreate = [];

      for (const sale of scheduledSales) {
        if (!sale.scheduledDeliveryDate) continue;

        const deliveryDate = new Date(sale.scheduledDeliveryDate);
        const daysDiff = Math.ceil((deliveryDate - today) / (1000 * 60 * 60 * 24));

        // Only create notifications for deliveries due within 7 days or overdue
        if (daysDiff <= 7) {
          const notificationKey = sale.id;

          // Skip if notification already exists
          if (existingKeys.has(notificationKey)) {
            continue;
          }

          let title, message, type, priority;

          if (daysDiff < 0) {
            // Overdue delivery
            const overdueDays = Math.abs(daysDiff);
            title = 'Delivery Overdue';
            message = `Delivery for ${sale.customerName} is ${overdueDays} day${overdueDays > 1 ? 's' : ''} overdue`;
            type = 'delivery_overdue';
            priority = 'high';
          } else if (daysDiff === 0) {
            // Due today
            title = 'Delivery Scheduled Today';
            message = `Delivery scheduled today for ${sale.customerName}`;
            type = 'delivery_today';
            priority = 'high';
          } else {
            // Due within 7 days
            title = 'Delivery Due Soon';
            message = `Delivery scheduled in ${daysDiff} day${daysDiff > 1 ? 's' : ''} for ${sale.customerName}`;
            type = 'delivery_scheduled';
            priority = 'medium';
          }

          notificationsToCreate.push({
            title,
            message,
            type,
            userId: adminUserId,
            category: 'delivery',
            priority,
            createdAt: new Date().toISOString(),
            read: false,
            data: {
              customerId: sale.customerId,
              customerName: sale.customerName,
              orderId: sale.id,
              orderNumber: sale.invoiceNumber,
              scheduledDate: sale.scheduledDeliveryDate,
              address: sale.customerAddress,
              phoneNumber: sale.customerPhone,
              itemCount: sale.items?.length || 0,
              isOverdue: daysDiff < 0,
              daysDiff: Math.abs(daysDiff)
            }
          });
        }
      }

      // Step 5: Create new notifications
      if (notificationsToCreate.length > 0) {
        await Promise.all(
          notificationsToCreate.map(data => 
            notificationService.createNotification(userType, data)
          )
        );
      }

      return {
        created: notificationsToCreate.length,
        total: notificationsToCreate.length
      };

    } catch (error) {
      console.error('Error generating delivery notifications:', error);
      throw error;
    }
  }

  /**
   * Clean up notifications for completed deliveries
   * @param {string} userType - User type
   * @param {string} adminUserId - Admin user ID
   */
  async cleanupDeliveredNotifications(userType, adminUserId) {
    try {
      // Get all delivered sales
      const deliveredSales = await salesService.getAll(userType, {
        where: [['deliveryStatus', '==', 'delivered']]
      });

      const deliveredOrderIds = new Set(deliveredSales.map(sale => sale.id));

      // Get existing delivery notifications
      const existingNotifications = await notificationService.getNotifications(userType, adminUserId);
      const deliveryNotifications = existingNotifications.filter(n => 
        n.type.includes('delivery')
      );

      // Find notifications for delivered orders
      const notificationsToDelete = deliveryNotifications.filter(notification => 
        notification.data?.orderId && deliveredOrderIds.has(notification.data.orderId)
      );

      // Delete them
      if (notificationsToDelete.length > 0) {
        await Promise.all(
          notificationsToDelete.map(notification => 
            notificationService.deleteNotification(userType, notification.id)
          )
        );
      }

      return notificationsToDelete.length;

    } catch (error) {
      console.error('Error cleaning up delivered notifications:', error);
      throw error;
    }
  }

  /**
   * Main method - Generate all notifications cleanly with LOCKING
   * @param {string} userType - User type
   * @param {string} adminUserId - Admin user ID
   */
  async generateAllNotifications(userType, adminUserId) {
    // PREVENT CONCURRENT EXECUTIONS
    if (this.isGenerating) {
      console.log('⏸️ Generation already in progress, skipping...');
      return { 
        emi: { created: 0, deleted: 0 },
        delivery: { created: 0 },
        cleanup: { delivered: 0 },
        total: 0,
        skipped: true
      };
    }

    // PREVENT RAPID SUCCESSIVE CALLS (within 10 seconds)
    const now = Date.now();
    if ((now - this.lastGenerationTime) < 10000) {
      console.log('⏸️ Too soon since last generation, skipping...');
      return { 
        emi: { created: 0, deleted: 0 },
        delivery: { created: 0 },
        cleanup: { delivered: 0 },
        total: 0,
        skipped: true
      };
    }

    try {
      this.isGenerating = true;
      this.lastGenerationTime = now;
      
      console.log('🚀 Starting LOCKED generation process...');

      const [emiResult, deliveryResult, cleanupCount] = await Promise.all([
        this.generateEMINotifications(userType, adminUserId),
        this.generateDeliveryNotifications(userType, adminUserId),
        this.cleanupDeliveredNotifications(userType, adminUserId)
      ]);

      const result = {
        emi: {
          created: emiResult.created,
          deleted: emiResult.deleted
        },
        delivery: {
          created: deliveryResult.created
        },
        cleanup: {
          delivered: cleanupCount
        },
        total: emiResult.created + deliveryResult.created
      };

      console.log('✅ LOCKED generation completed:', result);
      return result;

    } catch (error) {
      console.error('❌ Error in LOCKED generation:', error);
      throw error;
    } finally {
      // ALWAYS release the lock
      this.isGenerating = false;
    }
  }

  /**
   * Clear all EMI and delivery notifications (for fresh start)
   * @param {string} userType - User type
   * @param {string} adminUserId - Admin user ID
   */
  async clearAllNotifications(userType, adminUserId) {
    try {
      const allNotifications = await notificationService.getNotifications(userType, adminUserId);
      const emiAndDeliveryNotifications = allNotifications.filter(n => 
        n.type === 'emi_due' || 
        n.type === 'emi_overdue' || 
        n.type.includes('delivery')
      );

      if (emiAndDeliveryNotifications.length > 0) {
        await Promise.all(
          emiAndDeliveryNotifications.map(notification => 
            notificationService.deleteNotification(userType, notification.id)
          )
        );
      }

      return emiAndDeliveryNotifications.length;

    } catch (error) {
      console.error('Error clearing notifications:', error);
      throw error;
    }
  }
}

// Export singleton instance
const cleanEMIGenerator = new CleanEMINotificationGenerator();
export default cleanEMIGenerator;