// src/services/upaad/upaadService.js - Employee Advance/Loan Management Service
import { database } from '../firebase/config';
import { ref, push, set, get, update, query, orderByChild, equalTo } from 'firebase/database';
import { getCollectionPath } from '../../utils/helpers/firebasePathHelper';

class UpaadService {
  constructor() {
    this.collectionName = 'upaad_records';
  }

  /**
   * Get upaad records path
   */
  getUpaadPath(userType, upaadId = null) {
    return getCollectionPath(userType, this.collectionName, upaadId);
  }

  /**
   * Create new upaad record
   * @param {string} userType - User type
   * @param {Object} upaadData - Upaad record data
   * @returns {Promise<Object>} Created upaad record
   */
  async createUpaad(userType, upaadData) {
    try {
      const upaadPath = this.getUpaadPath(userType);
      const upaadRef = ref(database, upaadPath);
      const newUpaadRef = push(upaadRef);
      
      const upaadRecord = {
        id: newUpaadRef.key,
        employeeId: upaadData.employeeId,
        employeeName: upaadData.employeeName,
        amount: parseFloat(upaadData.amount),
        borrowDate: upaadData.borrowDate,
        repaymentType: upaadData.repaymentType, // 'full', 'partial', 'emi'
        dueDate: upaadData.dueDate || null,
        emiAmount: upaadData.emiAmount || null,
        emiFrequency: upaadData.emiFrequency || null, // 'weekly', 'monthly'
        totalPaid: 0,
        remainingAmount: parseFloat(upaadData.amount),
        status: 'pending', // 'pending', 'partial', 'completed'
        payments: [],
        notes: upaadData.notes || '',
        createdBy: upaadData.createdBy,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        nextPaymentDate: upaadData.dueDate || null,
        reminderSent: false
      };

      await set(newUpaadRef, upaadRecord);
      return upaadRecord;
    } catch (error) {
      console.error('Error creating upaad record:', error);
      throw new Error('Failed to create upaad record: ' + error.message);
    }
  }

  /**
   * Record payment for upaad
   * @param {string} userType - User type
   * @param {string} upaadId - Upaad record ID
   * @param {Object} paymentData - Payment details
   * @returns {Promise<Object>} Updated upaad record
   */
  async recordPayment(userType, upaadId, paymentData) {
    try {
      const upaadPath = this.getUpaadPath(userType, upaadId);
      const upaadRef = ref(database, upaadPath);
      
      const snapshot = await get(upaadRef);
      if (!snapshot.exists()) {
        throw new Error('Upaad record not found');
      }

      const upaadRecord = snapshot.val();
      const paymentAmount = parseFloat(paymentData.amount);
      
      // Validate payment amount
      if (paymentAmount > upaadRecord.remainingAmount) {
        throw new Error('Payment amount cannot exceed remaining amount');
      }

      const payment = {
        id: Date.now().toString(),
        amount: paymentAmount,
        paymentDate: paymentData.paymentDate,
        paymentMethod: paymentData.paymentMethod || 'cash',
        notes: paymentData.notes || '',
        recordedBy: paymentData.recordedBy,
        recordedAt: new Date().toISOString()
      };

      const updatedPayments = [...(upaadRecord.payments || []), payment];
      const newTotalPaid = upaadRecord.totalPaid + paymentAmount;
      const newRemainingAmount = upaadRecord.amount - newTotalPaid;
      
      // Determine new status
      let newStatus = 'pending';
      if (newRemainingAmount === 0) {
        newStatus = 'completed';
      } else if (newTotalPaid > 0) {
        newStatus = 'partial';
      }

      // Calculate next payment date for EMI
      let nextPaymentDate = upaadRecord.nextPaymentDate;
      if (upaadRecord.repaymentType === 'emi' && newStatus !== 'completed') {
        const currentDate = new Date(paymentData.paymentDate);
        if (upaadRecord.emiFrequency === 'weekly') {
          currentDate.setDate(currentDate.getDate() + 7);
        } else if (upaadRecord.emiFrequency === 'monthly') {
          currentDate.setMonth(currentDate.getMonth() + 1);
        }
        nextPaymentDate = currentDate.toISOString().split('T')[0];
      }

      const updatedRecord = {
        ...upaadRecord,
        payments: updatedPayments,
        totalPaid: newTotalPaid,
        remainingAmount: newRemainingAmount,
        status: newStatus,
        nextPaymentDate: newStatus === 'completed' ? null : nextPaymentDate,
        reminderSent: false,
        updatedAt: new Date().toISOString()
      };

      await set(upaadRef, updatedRecord);
      return updatedRecord;
    } catch (error) {
      console.error('Error recording payment:', error);
      throw new Error('Failed to record payment: ' + error.message);
    }
  }

  /**
   * Get employee upaad records
   * @param {string} userType - User type
   * @param {string} employeeId - Employee ID
   * @param {Object} filters - Optional filters (startDate, endDate, status)
   * @returns {Promise<Array>} Upaad records
   */
  async getEmployeeUpaads(userType, employeeId, filters = {}) {
    try {
      const upaadPath = this.getUpaadPath(userType);
      const upaadRef = ref(database, upaadPath);
      
      const employeeQuery = query(
        upaadRef,
        orderByChild('employeeId'),
        equalTo(employeeId)
      );

      const snapshot = await get(employeeQuery);
      if (!snapshot.exists()) {
        return [];
      }

      let records = [];
      snapshot.forEach((child) => {
        records.push(child.val());
      });

      // Apply filters
      if (filters.startDate) {
        records = records.filter(r => r.borrowDate >= filters.startDate);
      }
      if (filters.endDate) {
        records = records.filter(r => r.borrowDate <= filters.endDate);
      }
      if (filters.status) {
        records = records.filter(r => r.status === filters.status);
      }

      // Sort by borrow date descending
      return records.sort((a, b) => new Date(b.borrowDate) - new Date(a.borrowDate));
    } catch (error) {
      console.error('Error getting employee upaads:', error);
      throw new Error('Failed to get employee upaads: ' + error.message);
    }
  }

  /**
   * Get all upaad records with pagination
   * @param {string} userType - User type
   * @param {Object} options - Pagination and filter options
   * @returns {Promise<Object>} Paginated upaad records
   */
  async getAllUpaads(userType, options = {}) {
    try {
      const { 
        page = 1, 
        limit = 10, 
        employeeId = null,
        month = null,
        year = null,
        status = null 
      } = options;

      const upaadPath = this.getUpaadPath(userType);
      const upaadRef = ref(database, upaadPath);
      
      let queryRef = upaadRef;
      if (employeeId) {
        queryRef = query(
          upaadRef,
          orderByChild('employeeId'),
          equalTo(employeeId)
        );
      }

      const snapshot = await get(queryRef);
      if (!snapshot.exists()) {
        return {
          records: [],
          total: 0,
          page,
          totalPages: 0,
          hasMore: false
        };
      }

      let records = [];
      snapshot.forEach((child) => {
        records.push(child.val());
      });

      // Apply filters
      if (month && year) {
        const monthStr = `${year}-${month.toString().padStart(2, '0')}`;
        records = records.filter(r => r.borrowDate.startsWith(monthStr));
      }
      if (status) {
        records = records.filter(r => r.status === status);
      }

      // Sort by borrow date descending
      records.sort((a, b) => new Date(b.borrowDate) - new Date(a.borrowDate));

      // Pagination
      const total = records.length;
      const totalPages = Math.ceil(total / limit);
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedRecords = records.slice(startIndex, endIndex);

      return {
        records: paginatedRecords,
        total,
        page,
        totalPages,
        hasMore: page < totalPages
      };
    } catch (error) {
      console.error('Error getting all upaads:', error);
      throw new Error('Failed to get upaad records: ' + error.message);
    }
  }

  /**
   * Get employee upaad summary
   * @param {string} userType - User type
   * @param {string} employeeId - Employee ID
   * @returns {Promise<Object>} Summary statistics
   */
  async getEmployeeUpaadSummary(userType, employeeId) {
    try {
      const records = await this.getEmployeeUpaads(userType, employeeId);
      
      const totalBorrowed = records.reduce((sum, r) => sum + r.amount, 0);
      const totalPaid = records.reduce((sum, r) => sum + r.totalPaid, 0);
      const totalPending = records.reduce((sum, r) => sum + r.remainingAmount, 0);
      
      const activeRecords = records.filter(r => r.status !== 'completed');
      const completedRecords = records.filter(r => r.status === 'completed');

      return {
        totalRecords: records.length,
        activeRecords: activeRecords.length,
        completedRecords: completedRecords.length,
        totalBorrowed,
        totalPaid,
        totalPending,
        records: records.slice(0, 5) // Last 5 records
      };
    } catch (error) {
      console.error('Error getting employee summary:', error);
      throw new Error('Failed to get employee summary: ' + error.message);
    }
  }

  /**
   * Get upaads with upcoming payment reminders
   * @param {string} userType - User type
   * @param {number} daysAhead - Number of days to check ahead
   * @returns {Promise<Array>} Upaads needing reminders
   */
  async getUpcomingPaymentReminders(userType, daysAhead = 3) {
    try {
      const upaadPath = this.getUpaadPath(userType);
      const upaadRef = ref(database, upaadPath);
      
      const snapshot = await get(upaadRef);
      if (!snapshot.exists()) {
        return [];
      }

      const today = new Date();
      const futureDate = new Date();
      futureDate.setDate(today.getDate() + daysAhead);

      const reminders = [];
      snapshot.forEach((child) => {
        const record = child.val();
        
        if (record.status !== 'completed' && record.nextPaymentDate) {
          const paymentDate = new Date(record.nextPaymentDate);
          
          if (paymentDate >= today && paymentDate <= futureDate && !record.reminderSent) {
            const daysUntil = Math.ceil((paymentDate - today) / (1000 * 60 * 60 * 24));
            reminders.push({
              ...record,
              daysUntilPayment: daysUntil
            });
          }
        }
      });

      return reminders.sort((a, b) => a.daysUntilPayment - b.daysUntilPayment);
    } catch (error) {
      console.error('Error getting payment reminders:', error);
      throw new Error('Failed to get payment reminders: ' + error.message);
    }
  }

  /**
   * Mark reminder as sent
   * @param {string} userType - User type
   * @param {string} upaadId - Upaad record ID
   * @returns {Promise<void>}
   */
  async markReminderSent(userType, upaadId) {
    try {
      const upaadPath = this.getUpaadPath(userType, upaadId);
      const upaadRef = ref(database, upaadPath);
      
      await update(upaadRef, {
        reminderSent: true,
        lastReminderSent: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error marking reminder sent:', error);
      throw new Error('Failed to mark reminder: ' + error.message);
    }
  }

  /**
   * Update upaad record
   * @param {string} userType - User type
   * @param {string} upaadId - Upaad record ID
   * @param {Object} updates - Updates to apply
   * @returns {Promise<Object>} Updated record
   */
  async updateUpaad(userType, upaadId, updates) {
    try {
      const upaadPath = this.getUpaadPath(userType, upaadId);
      const upaadRef = ref(database, upaadPath);
      
      const snapshot = await get(upaadRef);
      if (!snapshot.exists()) {
        throw new Error('Upaad record not found');
      }

      const updatedData = {
        ...updates,
        updatedAt: new Date().toISOString()
      };

      await update(upaadRef, updatedData);
      
      const updatedSnapshot = await get(upaadRef);
      return updatedSnapshot.val();
    } catch (error) {
      console.error('Error updating upaad:', error);
      throw new Error('Failed to update upaad: ' + error.message);
    }
  }

  /**
   * Delete upaad record (soft delete by marking as cancelled)
   * @param {string} userType - User type
   * @param {string} upaadId - Upaad record ID
   * @param {string} reason - Cancellation reason
   * @returns {Promise<void>}
   */
  async deleteUpaad(userType, upaadId, reason = '') {
    try {
      const upaadPath = this.getUpaadPath(userType, upaadId);
      const upaadRef = ref(database, upaadPath);
      
      await update(upaadRef, {
        status: 'cancelled',
        cancelledAt: new Date().toISOString(),
        cancellationReason: reason
      });
    } catch (error) {
      console.error('Error deleting upaad:', error);
      throw new Error('Failed to delete upaad: ' + error.message);
    }
  }

  /**
   * Get overall upaad statistics
   * @param {string} userType - User type
   * @returns {Promise<Object>} Overall statistics
   */
  async getOverallStatistics(userType) {
    try {
      const upaadPath = this.getUpaadPath(userType);
      const upaadRef = ref(database, upaadPath);
      
      const snapshot = await get(upaadRef);
      if (!snapshot.exists()) {
        return {
          totalRecords: 0,
          activeRecords: 0,
          completedRecords: 0,
          totalAmount: 0,
          totalPaid: 0,
          totalPending: 0
        };
      }

      let totalRecords = 0;
      let activeRecords = 0;
      let completedRecords = 0;
      let totalAmount = 0;
      let totalPaid = 0;
      let totalPending = 0;

      snapshot.forEach((child) => {
        const record = child.val();
        if (record.status !== 'cancelled') {
          totalRecords++;
          totalAmount += record.amount;
          totalPaid += record.totalPaid;
          totalPending += record.remainingAmount;
          
          if (record.status === 'completed') {
            completedRecords++;
          } else {
            activeRecords++;
          }
        }
      });

      return {
        totalRecords,
        activeRecords,
        completedRecords,
        totalAmount,
        totalPaid,
        totalPending
      };
    } catch (error) {
      console.error('Error getting overall statistics:', error);
      throw new Error('Failed to get statistics: ' + error.message);
    }
  }
}

export default new UpaadService();