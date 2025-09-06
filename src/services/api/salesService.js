import BaseService from './baseService';
import { COLLECTIONS, PAYMENT_STATUS, DELIVERY_STATUS } from '../../utils/constants/appConstants';
import { calculateGST } from '../../utils/helpers/gstCalculator';

/**
 * Sales service for managing sales and invoices
 */
class SalesService extends BaseService {
  constructor() {
    super(COLLECTIONS.SALES || 'sales');
  }

  /**
   * Create new sale/invoice
   * @param {string} userType - User type
   * @param {Object} saleData - Sale data
   * @returns {Promise<Object>} Created sale
   */
  async createSale(userType, saleData) {
    try {
      // Generate invoice number
      const invoiceNumber = await this.generateInvoiceNumber(userType);
      
      // Calculate GST and totals
      const gstCalculation = calculateGST(
        saleData.subtotal, 
        saleData.customer?.state,
        saleData.includeGST !== false
      );

      const saleWithCalculations = {
        ...saleData,
        invoiceNumber,
        ...gstCalculation,
        status: 'active',
        paymentStatus: saleData.paymentStatus || PAYMENT_STATUS.PENDING,
        deliveryStatus: saleData.deliveryStatus || DELIVERY_STATUS.PENDING,
        createdBy: saleData.userId
      };

      return await this.create(userType, saleWithCalculations);
    } catch (error) {
      console.error('Error creating sale:', error);
      throw error;
    }
  }

  /**
   * Update sale/invoice
   * @param {string} userType - User type
   * @param {string} saleId - Sale ID
   * @param {Object} updates - Update data
   * @returns {Promise<Object>} Updated sale
   */
  async updateSale(userType, saleId, updates) {
    try {
      // Recalculate GST if amount or customer changed
      if (updates.subtotal || updates.customer || updates.includeGST !== undefined) {
        const existingSale = await this.getById(userType, saleId);
        const customerState = updates.customer?.state || existingSale.customer?.state;
        const subtotal = updates.subtotal || existingSale.subtotal;
        const includeGST = updates.includeGST !== undefined ? updates.includeGST : existingSale.includeGST;

        const gstCalculation = calculateGST(subtotal, customerState, includeGST);
        updates = { ...updates, ...gstCalculation };
      }

      return await this.update(userType, saleId, updates);
    } catch (error) {
      console.error('Error updating sale:', error);
      throw error;
    }
  }

  /**
   * Get sales with filters
   * @param {string} userType - User type
   * @param {Object} filters - Filter options
   * @returns {Promise<Array>} Filtered sales
   */
  async getSales(userType, filters = {}) {
    try {
      const {
        search,
        customer,
        paymentStatus,
        deliveryStatus,
        dateFrom,
        dateTo,
        amountMin,
        amountMax,
        ...otherOptions
      } = filters;

      const whereClause = [];

      // Filter by customer
      if (customer) {
        whereClause.push(['customer.id', '==', customer]);
      }

      // Filter by payment status
      if (paymentStatus) {
        whereClause.push(['paymentStatus', '==', paymentStatus]);
      }

      // Filter by delivery status
      if (deliveryStatus) {
        whereClause.push(['deliveryStatus', '==', deliveryStatus]);
      }

      // Filter by date range
      if (dateFrom) {
        whereClause.push(['date', '>=', dateFrom]);
      }
      if (dateTo) {
        whereClause.push(['date', '<=', dateTo]);
      }

      // Filter by amount range
      if (amountMin) {
        whereClause.push(['totalAmount', '>=', parseFloat(amountMin)]);
      }
      if (amountMax) {
        whereClause.push(['totalAmount', '<=', parseFloat(amountMax)]);
      }

      const queryOptions = {
        where: whereClause,
        ...otherOptions
      };

      let sales = await this.getAll(userType, queryOptions);

      // Apply search filter (client-side due to Firebase limitations)
      if (search && search.trim()) {
        const searchTerm = search.toLowerCase().trim();
        sales = sales.filter(sale => 
          sale.invoiceNumber?.toLowerCase().includes(searchTerm) ||
          sale.customer?.name?.toLowerCase().includes(searchTerm) ||
          sale.items?.some(item => item.name?.toLowerCase().includes(searchTerm))
        );
      }

      return sales;
    } catch (error) {
      console.error('Error getting sales:', error);
      throw error;
    }
  }

  /**
   * Get sales statistics
   * @param {string} userType - User type
   * @param {string} userId - User ID
   * @param {Object} dateRange - Date range for statistics
   * @returns {Promise<Object>} Sales statistics
   */
  async getSalesStatistics(userType, userId, dateRange = {}) {
    try {
      const { from, to } = dateRange;
      const whereClause = [
        ['createdBy', '==', userId],
        ['userType', '==', userType]
      ];

      if (from) whereClause.push(['date', '>=', from]);
      if (to) whereClause.push(['date', '<=', to]);

      const sales = await this.getAll(userType, {
        where: whereClause
      });

      // Calculate statistics
      const stats = {
        totalSales: sales.length,
        totalRevenue: sales.reduce((sum, sale) => sum + (sale.totalAmount || 0), 0),
        pendingPayments: sales.filter(sale => sale.paymentStatus === PAYMENT_STATUS.PENDING).length,
        pendingDeliveries: sales.filter(sale => sale.deliveryStatus === DELIVERY_STATUS.PENDING).length,
        paidSales: sales.filter(sale => sale.paymentStatus === PAYMENT_STATUS.PAID).length,
        deliveredSales: sales.filter(sale => sale.deliveryStatus === DELIVERY_STATUS.DELIVERED).length,
        emiSales: sales.filter(sale => sale.paymentStatus === PAYMENT_STATUS.EMI).length,
        averageSaleAmount: sales.length > 0 ? sales.reduce((sum, sale) => sum + (sale.totalAmount || 0), 0) / sales.length : 0
      };

      return stats;
    } catch (error) {
      console.error('Error getting sales statistics:', error);
      throw error;
    }
  }

  /**
   * Generate unique invoice number
   * @param {string} userType - User type
   * @returns {Promise<string>} Generated invoice number
   */
  async generateInvoiceNumber(userType) {
    try {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      
      // Get prefix based on user type
      const prefix = userType === 'electronics' ? 'ELE' : 'FUR';
      
      // Get last invoice number for this month
      const startOfMonth = new Date(year, now.getMonth(), 1).toISOString();
      const endOfMonth = new Date(year, now.getMonth() + 1, 0, 23, 59, 59).toISOString();

      const monthlyInvoices = await this.getAll(userType, {
        where: [
          ['createdAt', '>=', startOfMonth],
          ['createdAt', '<=', endOfMonth]
        ],
        orderBy: 'createdAt',
        orderDirection: 'desc',
        limit: 1
      });

      let sequence = 1;
      if (monthlyInvoices.length > 0) {
        const lastInvoice = monthlyInvoices[0];
        const lastNumber = lastInvoice.invoiceNumber || '';
        const match = lastNumber.match(/(\d+)$/);
        if (match) {
          sequence = parseInt(match[1]) + 1;
        }
      }

      const sequenceStr = String(sequence).padStart(4, '0');
      return `${prefix}${year}${month}${sequenceStr}`;
    } catch (error) {
      console.error('Error generating invoice number:', error);
      // Fallback to timestamp-based number
      const timestamp = Date.now();
      const prefix = userType === 'electronics' ? 'ELE' : 'FUR';
      return `${prefix}${timestamp}`;
    }
  }

  /**
   * Get pending EMI payments
   * @param {string} userType - User type
   * @param {string} userId - User ID
   * @returns {Promise<Array>} Pending EMI payments
   */
  async getPendingEMIs(userType, userId) {
    try {
      return await this.getAll(userType, {
        where: [
          ['createdBy', '==', userId],
          ['userType', '==', userType],
          ['paymentStatus', '==', PAYMENT_STATUS.EMI]
        ],
        orderBy: 'nextEMIDate',
        orderDirection: 'asc'
      });
    } catch (error) {
      console.error('Error getting pending EMIs:', error);
      throw error;
    }
  }

  /**
   * Get pending deliveries
   * @param {string} userType - User type
   * @param {string} userId - User ID
   * @returns {Promise<Array>} Pending deliveries
   */
  async getPendingDeliveries(userType, userId) {
    try {
      return await this.getAll(userType, {
        where: [
          ['createdBy', '==', userId],
          ['userType', '==', userType],
          ['deliveryStatus', '!=', DELIVERY_STATUS.DELIVERED]
        ],
        orderBy: 'deliveryDate',
        orderDirection: 'asc'
      });
    } catch (error) {
      console.error('Error getting pending deliveries:', error);
      throw error;
    }
  }

  /**
   * Update payment status
   * @param {string} userType - User type
   * @param {string} saleId - Sale ID
   * @param {string} paymentStatus - New payment status
   * @param {Object} paymentData - Additional payment data
   * @returns {Promise<Object>} Updated sale
   */
  async updatePaymentStatus(userType, saleId, paymentStatus, paymentData = {}) {
    try {
      const updates = {
        paymentStatus,
        ...paymentData
      };

      if (paymentStatus === PAYMENT_STATUS.PAID) {
        updates.paymentDate = new Date().toISOString();
      }

      return await this.update(userType, saleId, updates);
    } catch (error) {
      console.error('Error updating payment status:', error);
      throw error;
    }
  }

  /**
   * Update delivery status
   * @param {string} userType - User type
   * @param {string} saleId - Sale ID
   * @param {string} deliveryStatus - New delivery status
   * @param {Object} deliveryData - Additional delivery data
   * @returns {Promise<Object>} Updated sale
   */
  async updateDeliveryStatus(userType, saleId, deliveryStatus, deliveryData = {}) {
    try {
      const updates = {
        deliveryStatus,
        ...deliveryData
      };

      if (deliveryStatus === DELIVERY_STATUS.DELIVERED) {
        updates.deliveryDate = new Date().toISOString();
      }

      return await this.update(userType, saleId, updates);
    } catch (error) {
      console.error('Error updating delivery status:', error);
      throw error;
    }
  }
}

// Create and export singleton instance
const salesService = new SalesService();
export default salesService;