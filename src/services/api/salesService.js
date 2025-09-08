import BaseService from "./baseService";
import {
  COLLECTIONS,
  PAYMENT_STATUS,
  DELIVERY_STATUS,
} from "../../utils/constants/appConstants";
import { calculateGSTWithSlab } from "../../utils/helpers/gstCalculator";

/**
 * Sales service for managing sales and invoices
 */
class SalesService extends BaseService {
  constructor() {
    super(COLLECTIONS.SALES || "sales");
  }

  /**
   * Helper function to clean undefined values from object
   * @param {Object} obj - Object to clean
   * @returns {Object} Cleaned object without undefined values
   */
  cleanUndefinedValues(obj) {
    const cleaned = {};

    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const value = obj[key];

        if (value !== undefined) {
          if (
            value !== null &&
            typeof value === "object" &&
            !Array.isArray(value) &&
            !(value instanceof Date)
          ) {
            // Recursively clean nested objects
            const cleanedNested = this.cleanUndefinedValues(value);
            if (Object.keys(cleanedNested).length > 0) {
              cleaned[key] = cleanedNested;
            }
          } else {
            cleaned[key] = value;
          }
        }
      }
    }

    return cleaned;
  }

  /**
   * Create new invoice (alias for createSale for backward compatibility)
   * @param {string} userType - User type
   * @param {Object} invoiceData - Invoice data
   * @returns {Promise<Object>} Created invoice
   */
  async createInvoice(userType, invoiceData) {
    try {
      // Generate invoice number
      const invoiceNumber = await this.generateInvoiceNumber(userType);

      // Calculate totals with GST slabs
      let subtotal = 0;
      let totalGST = 0;
      const processedItems = [];

      // Process each item with its GST slab
      if (invoiceData.items && invoiceData.items.length > 0) {
        invoiceData.items.forEach((item) => {
          const itemTotal =
            parseFloat(item.quantity || 0) * parseFloat(item.rate || 0);
          const gstCalc = calculateGSTWithSlab(
            itemTotal,
            invoiceData.customerState,
            invoiceData.includeGST !== false,
            item.gstSlab || 18
          );

          subtotal += gstCalc.baseAmount;
          totalGST += gstCalc.totalGstAmount;

          processedItems.push({
            ...item,
            baseAmount: gstCalc.baseAmount,
            gstAmount: gstCalc.totalGstAmount,
            totalAmount: gstCalc.totalAmount,
            gstBreakdown: gstCalc.gstBreakdown,
          });
        });
      }

      // Clean invoice data - remove undefined values and structure properly
      const cleanInvoiceData = {
        invoiceNumber,
        saleDate: invoiceData.saleDate,
        customerId: invoiceData.customerId,
        customerName: invoiceData.customerName,
        customerPhone: invoiceData.customerPhone,
        customerAddress: invoiceData.customerAddress,
        customerState: invoiceData.customerState,
        salesPersonId: invoiceData.salesPersonId,
        salesPersonName: invoiceData.salesPersonName,
        items: processedItems,
        includeGST: invoiceData.includeGST,
        subtotal: Math.round(subtotal * 100) / 100,
        totalGST: Math.round(totalGST * 100) / 100,
        grandTotal: Math.round((subtotal + totalGST) * 100) / 100,
        // Firebase rules expect 'totalAmount' - add this field
        totalAmount: Math.round((subtotal + totalGST) * 100) / 100,
        paymentStatus: invoiceData.paymentStatus || PAYMENT_STATUS.PENDING,
        deliveryStatus: invoiceData.deliveryStatus || DELIVERY_STATUS.PENDING,
        status: "active",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: invoiceData.createdBy,
        createdByName: invoiceData.createdByName,
      };

      // Only add scheduledDeliveryDate if it exists
      if (invoiceData.scheduledDeliveryDate) {
        cleanInvoiceData.scheduledDeliveryDate =
          invoiceData.scheduledDeliveryDate;
      }

      // Only add emiDetails if payment status is EMI and data is complete
      if (
        invoiceData.paymentStatus === PAYMENT_STATUS.EMI &&
        invoiceData.emiDetails
      ) {
        const emiDetails = {
          monthlyAmount: parseFloat(invoiceData.emiDetails.monthlyAmount || 0),
          numberOfInstallments: parseInt(
            invoiceData.emiDetails.numberOfInstallments || 1
          ),
        };

        // Only add startDate and schedule if startDate exists
        if (invoiceData.emiDetails.startDate) {
          emiDetails.startDate = invoiceData.emiDetails.startDate;
          emiDetails.schedule = invoiceData.emiDetails.schedule || [];
        }

        cleanInvoiceData.emiDetails = emiDetails;
      }

      return await this.create(userType, cleanInvoiceData);
    } catch (error) {
      console.error("Error creating invoice:", error);
      throw error;
    }
  }

  /**
   * Create new sale/invoice
   * @param {string} userType - User type
   * @param {Object} saleData - Sale data
   * @returns {Promise<Object>} Created sale
   */
  async createSale(userType, saleData) {
    return await this.createInvoice(userType, saleData);
  }

  /**
   * Get invoice by ID
   * @param {string} userType - User type
   * @param {string} invoiceId - Invoice ID
   * @returns {Promise<Object>} Invoice data
   */
  async getInvoiceById(userType, invoiceId) {
    try {
      return await this.getById(userType, invoiceId);
    } catch (error) {
      console.error("Error getting invoice:", error);
      throw error;
    }
  }

  /**
   * Update invoice
   * @param {string} userType - User type
   * @param {string} invoiceId - Invoice ID
   * @param {Object} updates - Update data
   * @returns {Promise<Object>} Updated invoice
   */
  async updateInvoice(userType, invoiceId, updates) {
    try {
      // Clean undefined values from updates
      const cleanUpdates = this.cleanUndefinedValues(updates);

      // Recalculate totals if items changed
      if (cleanUpdates.items) {
        let subtotal = 0;
        let totalGST = 0;
        const processedItems = [];

        cleanUpdates.items.forEach((item) => {
          const itemTotal =
            parseFloat(item.quantity || 0) * parseFloat(item.rate || 0);
          const gstCalc = calculateGSTWithSlab(
            itemTotal,
            cleanUpdates.customerState,
            cleanUpdates.includeGST !== false,
            item.gstSlab || 18
          );

          subtotal += gstCalc.baseAmount;
          totalGST += gstCalc.totalGstAmount;

          processedItems.push({
            ...item,
            baseAmount: gstCalc.baseAmount,
            gstAmount: gstCalc.totalGstAmount,
            totalAmount: gstCalc.totalAmount,
            gstBreakdown: gstCalc.gstBreakdown,
          });
        });

        cleanUpdates.items = processedItems;
        cleanUpdates.subtotal = Math.round(subtotal * 100) / 100;
        cleanUpdates.totalGST = Math.round(totalGST * 100) / 100;
        cleanUpdates.grandTotal = Math.round((subtotal + totalGST) * 100) / 100;
        // Update totalAmount as well for consistency
        cleanUpdates.totalAmount = cleanUpdates.grandTotal;
      }

      cleanUpdates.updatedAt = new Date().toISOString();

      return await this.update(userType, invoiceId, cleanUpdates);
    } catch (error) {
      console.error("Error updating invoice:", error);
      throw error;
    }
  }

  /**
   * Delete invoice
   * @param {string} userType - User type
   * @param {string} invoiceId - Invoice ID
   * @returns {Promise<boolean>} Success status
   */
  async deleteInvoice(userType, invoiceId) {
    try {
      await this.delete(userType, invoiceId);
      return true;
    } catch (error) {
      console.error("Error deleting invoice:", error);
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
    return await this.updateInvoice(userType, saleId, updates);
  }

  /**
   * Get sales with filters - simplified for client-side filtering
   * @param {string} userType - User type
   * @param {Object} filters - Filter options (mostly ignored for client-side filtering)
   * @returns {Promise<Array>} All sales data
   */
  async getSales(userType, filters = {}) {
    try {
      // Simple query to get all sales, let client handle filtering/sorting
      const sales = await this.getAll(userType, {
        orderBy: "createdAt",
        orderDirection: "desc",
      });

      // Return simple array for client-side processing
      return sales;
    } catch (error) {
      console.error("Error getting sales:", error);
      throw error;
    }
  }

  /**
   * Search sales by term
   * @param {string} userType - User type
   * @param {string} searchTerm - Search term
   * @returns {Promise<Array>} Matching sales
   */
  async searchSales(userType, searchTerm) {
    try {
      // Get all sales and filter client-side (Firebase limitation)
      const allSales = await this.getAll(userType, {
        orderBy: "createdAt",
        orderDirection: "desc",
        limit: 100, // Reasonable limit for search
      });

      if (!searchTerm.trim()) {
        return allSales;
      }

      const term = searchTerm.toLowerCase().trim();
      return allSales.filter(
        (sale) =>
          sale.invoiceNumber?.toLowerCase().includes(term) ||
          sale.customerName?.toLowerCase().includes(term) ||
          sale.items?.some((item) => item.name?.toLowerCase().includes(term))
      );
    } catch (error) {
      console.error("Error searching sales:", error);
      throw error;
    }
  }

  /**
   * Get sales statistics
   * @param {string} userType - User type
   * @param {Object} filters - Filter options
   * @returns {Promise<Object>} Sales statistics
   */
  async getSalesStats(userType, filters = {}) {
    try {
      const sales = await this.getAll(userType, {
        orderBy: "createdAt",
        orderDirection: "desc",
      });

      const today = new Date();
      const todayStart = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate()
      );

      const todaysSales = sales.filter((sale) => {
        const saleDate = new Date(sale.saleDate);
        return saleDate >= todayStart;
      });

      const stats = {
        totalSales: sales.length,
        totalAmount: sales.reduce(
          (sum, sale) => sum + (sale.grandTotal || 0),
          0
        ),
        todaysSales: todaysSales.length,
        todaysAmount: todaysSales.reduce(
          (sum, sale) => sum + (sale.grandTotal || 0),
          0
        ),
        pendingPayments: sales.filter(
          (sale) => sale.paymentStatus === PAYMENT_STATUS.PENDING
        ).length,
        pendingDeliveries: sales.filter(
          (sale) => sale.deliveryStatus === DELIVERY_STATUS.PENDING
        ).length,
        paidInvoices: sales.filter(
          (sale) => sale.paymentStatus === PAYMENT_STATUS.PAID
        ).length,
        emiInvoices: sales.filter(
          (sale) => sale.paymentStatus === PAYMENT_STATUS.EMI
        ).length,
      };

      return stats;
    } catch (error) {
      console.error("Error getting sales stats:", error);
      throw error;
    }
  }

  /**
   * Get pending EMI payments
   * @param {string} userType - User type
   * @returns {Promise<Array>} Pending EMI payments
   */
  async getPendingEMIPayments(userType) {
    try {
      return await this.getAll(userType, {
        where: [["paymentStatus", "==", PAYMENT_STATUS.EMI]],
        orderBy: "createdAt",
        orderDirection: "desc",
      });
    } catch (error) {
      console.error("Error getting pending EMIs:", error);
      throw error;
    }
  }

  /**
   * Get pending deliveries
   * @param {string} userType - User type
   * @returns {Promise<Array>} Pending deliveries
   */
  async getPendingDeliveries(userType) {
    try {
      return await this.getAll(userType, {
        where: [["deliveryStatus", "!=", DELIVERY_STATUS.DELIVERED]],
        orderBy: "createdAt",
        orderDirection: "desc",
      });
    } catch (error) {
      console.error("Error getting pending deliveries:", error);
      throw error;
    }
  }

  /**
   * Update payment status
   * @param {string} userType - User type
   * @param {string} invoiceId - Invoice ID
   * @param {string} paymentStatus - New payment status
   * @param {Object} paymentDetails - Additional payment data
   * @returns {Promise<Object>} Updated invoice
   */
  async updatePaymentStatus(
    userType,
    invoiceId,
    paymentStatus,
    paymentDetails = {}
  ) {
    try {
      const updates = {
        paymentStatus,
        ...paymentDetails,
        updatedAt: new Date().toISOString(),
      };

      if (paymentStatus === PAYMENT_STATUS.PAID) {
        updates.paymentDate = new Date().toISOString();
      }

      return await this.updateInvoice(userType, invoiceId, updates);
    } catch (error) {
      console.error("Error updating payment status:", error);
      throw error;
    }
  }

  /**
   * Update delivery status
   * @param {string} userType - User type
   * @param {string} invoiceId - Invoice ID
   * @param {string} deliveryStatus - New delivery status
   * @param {Object} deliveryDetails - Additional delivery data
   * @returns {Promise<Object>} Updated invoice
   */
  async updateDeliveryStatus(
    userType,
    invoiceId,
    deliveryStatus,
    deliveryDetails = {}
  ) {
    try {
      const updates = {
        deliveryStatus,
        ...deliveryDetails,
        updatedAt: new Date().toISOString(),
      };

      if (deliveryStatus === DELIVERY_STATUS.DELIVERED) {
        updates.deliveryDate = new Date().toISOString();
      }

      return await this.updateInvoice(userType, invoiceId, updates);
    } catch (error) {
      console.error("Error updating delivery status:", error);
      throw error;
    }
  }

  /**
   * Update EMI payment
   * @param {string} userType - User type
   * @param {string} invoiceId - Invoice ID
   * @param {number} emiIndex - EMI installment index
   * @param {Object} paymentDetails - Payment details
   * @returns {Promise<Object>} Updated invoice
   */
  async updateEMIPayment(userType, invoiceId, emiIndex, paymentDetails) {
    try {
      const invoice = await this.getById(userType, invoiceId);

      if (!invoice.emiDetails || !invoice.emiDetails.schedule) {
        throw new Error("EMI schedule not found");
      }

      const schedule = [...invoice.emiDetails.schedule];
      if (emiIndex >= 0 && emiIndex < schedule.length) {
        schedule[emiIndex] = {
          ...schedule[emiIndex],
          paid: true,
          paymentDate: new Date().toISOString(),
          ...paymentDetails,
        };

        const updates = {
          emiDetails: {
            ...invoice.emiDetails,
            schedule,
          },
          updatedAt: new Date().toISOString(),
        };

        // Check if all EMIs are paid
        const allPaid = schedule.every((emi) => emi.paid);
        if (allPaid) {
          updates.paymentStatus = PAYMENT_STATUS.PAID;
          updates.paymentDate = new Date().toISOString();
        }

        return await this.updateInvoice(userType, invoiceId, updates);
      } else {
        throw new Error("Invalid EMI index");
      }
    } catch (error) {
      console.error("Error updating EMI payment:", error);
      throw error;
    }
  }

  /**
   * Get customer purchase history
   * @param {string} userType - User type
   * @param {string} customerId - Customer ID
   * @returns {Promise<Array>} Customer's purchase history
   */
  async getCustomerPurchaseHistory(userType, customerId) {
    try {
      return await this.getAll(userType, {
        where: [["customerId", "==", customerId]],
        orderBy: "createdAt",
        orderDirection: "desc",
      });
    } catch (error) {
      console.error("Error getting customer purchase history:", error);
      throw error;
    }
  }

  /**
   * Get sales by date range
   * @param {string} userType - User type
   * @param {string} startDate - Start date
   * @param {string} endDate - End date
   * @returns {Promise<Array>} Sales in date range
   */
  async getSalesByDateRange(userType, startDate, endDate) {
    try {
      return await this.getAll(userType, {
        where: [
          ["saleDate", ">=", startDate],
          ["saleDate", "<=", endDate],
        ],
        orderBy: "saleDate",
        orderDirection: "desc",
      });
    } catch (error) {
      console.error("Error getting sales by date range:", error);
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
      const month = String(now.getMonth() + 1).padStart(2, "0");

      // Get prefix based on user type
      const prefix = userType === "electronics" ? "ELE" : "FUR";

      // Get last invoice number for this month
      const startOfMonth = new Date(year, now.getMonth(), 1).toISOString();
      const endOfMonth = new Date(
        year,
        now.getMonth() + 1,
        0,
        23,
        59,
        59
      ).toISOString();

      const monthlyInvoices = await this.getAll(userType, {
        where: [
          ["createdAt", ">=", startOfMonth],
          ["createdAt", "<=", endOfMonth],
        ],
        orderBy: "createdAt",
        orderDirection: "desc",
        limit: 1,
      });

      let sequence = 1;
      if (monthlyInvoices.length > 0) {
        const lastInvoice = monthlyInvoices[0];
        const lastNumber = lastInvoice.invoiceNumber || "";
        const match = lastNumber.match(/(\d+)$/);
        if (match) {
          sequence = parseInt(match[1]) + 1;
        }
      }

      const sequenceStr = String(sequence).padStart(4, "0");
      return `${prefix}${year}${month}${sequenceStr}`;
    } catch (error) {
      console.error("Error generating invoice number:", error);
      // Fallback to timestamp-based number
      const timestamp = Date.now();
      const prefix = userType === "electronics" ? "ELE" : "FUR";
      return `${prefix}${timestamp}`;
    }
  }

/**
 * Simple EMI payment recording with basic redistribution
 * No complex logic - just basic math
 */
async recordInstallmentPayment(
  userType,
  invoiceId,
  installmentNumber,
  paymentAmount,
  paymentDetails = {}
) {
  try {
    const invoice = await this.getById(userType, invoiceId);
    const schedule = [...invoice.emiDetails.schedule];
    const installmentIndex = schedule.findIndex(
      (emi) => emi.installmentNumber === installmentNumber
    );

    if (installmentIndex === -1) {
      throw new Error("Installment not found");
    }

    if (schedule[installmentIndex].paid) {
      throw new Error("Installment already paid");
    }

    const paymentAmountNum = parseFloat(paymentAmount);

    // STEP 1: Record payment (don't touch anything else)
    schedule[installmentIndex] = {
      ...schedule[installmentIndex],
      paid: true,
      paidAmount: paymentAmountNum,
      paymentDate: new Date().toISOString(),
      paymentRecord: {
        amount: paymentAmountNum,
        paymentDate: new Date().toISOString(),
        paymentMethod: paymentDetails.paymentMethod || "cash",
        transactionId: paymentDetails.transactionId || null,
        notes: paymentDetails.notes || "",
        recordedBy: paymentDetails.recordedBy || null,
        recordedByName: paymentDetails.recordedByName || null,
      }
    };

    // STEP 2: Calculate totals
    const originalTotal = invoice.grandTotal || invoice.totalAmount;
    const totalPaid = schedule
      .filter(emi => emi.paid)
      .reduce((sum, emi) => sum + emi.paidAmount, 0);
    const remainingBalance = originalTotal - totalPaid;

    // STEP 3: Find unpaid installments and redistribute ONLY them
    const unpaidInstallments = schedule.filter(emi => !emi.paid);
    
    if (unpaidInstallments.length > 0) {
      const equalAmount = remainingBalance / unpaidInstallments.length;
      
      unpaidInstallments.forEach((unpaidEmi, index) => {
        const scheduleIndex = schedule.findIndex(
          emi => emi.installmentNumber === unpaidEmi.installmentNumber
        );
        
        if (index === unpaidInstallments.length - 1) {
          // Last installment gets remainder to handle rounding
          const distributedSoFar = equalAmount * (unpaidInstallments.length - 1);
          schedule[scheduleIndex].amount = Math.round((remainingBalance - distributedSoFar) * 100) / 100;
        } else {
          schedule[scheduleIndex].amount = Math.round(equalAmount * 100) / 100;
        }
      });
    }

    // STEP 4: Update totals
    const allPaid = schedule.every(emi => emi.paid);
    const updates = {
      emiDetails: {
        ...invoice.emiDetails,
        schedule,
        totalPaid: Math.round(totalPaid * 100) / 100,
        totalRemaining: Math.round(remainingBalance * 100) / 100,
        lastPaymentDate: new Date().toISOString(),
      },
      updatedAt: new Date().toISOString(),
    };

    if (allPaid) {
      updates.paymentStatus = PAYMENT_STATUS.PAID;
      updates.paymentDate = new Date().toISOString();
    }

    return await this.update(userType, invoiceId, updates);
  } catch (error) {
    console.error("Error recording installment payment:", error);
    throw error;
  }
}

/**
 * Get installment payment history - simplified to show only actual payments
 */
async getInstallmentPaymentHistory(userType, invoiceId) {
  try {
    const invoice = await this.getById(userType, invoiceId);

    if (!invoice.emiDetails || !invoice.emiDetails.schedule) {
      return [];
    }

    return invoice.emiDetails.schedule
      .filter((installment) => installment.paid && installment.paymentRecord)
      .map((installment) => ({
        installmentNumber: installment.installmentNumber,
        paidAmount: installment.paidAmount,
        paymentDate: installment.paymentDate,
        paymentRecord: installment.paymentRecord,
      }))
      .sort((a, b) => new Date(b.paymentDate) - new Date(a.paymentDate));
  } catch (error) {
    console.error("Error getting installment payment history:", error);
    throw error;
  }
}

  /**
   * IMPROVED: Redistribute overpayment across ALL remaining unpaid installments proportionally
   * @param {Array} schedule - EMI schedule array
   * @param {number} startIndex - Index to start redistribution
   * @param {number} overpayment - Overpayment amount
   * @param {Object} paymentDetails - Payment details
   */
  redistributeOverpayment(schedule, startIndex, overpayment, paymentDetails) {
    let remainingOverpayment = overpayment;

    // First, try to pay complete installments in order
    for (
      let i = startIndex;
      i < schedule.length && remainingOverpayment > 0;
      i++
    ) {
      const installment = schedule[i];

      if (!installment.paid) {
        const installmentAmount = parseFloat(installment.amount);

        if (remainingOverpayment >= installmentAmount) {
          // Can pay this installment completely
          schedule[i] = {
            ...installment,
            paid: true,
            paidAmount: installmentAmount,
            paymentDate: new Date().toISOString(),
            paymentRecord: {
              amount: installmentAmount,
              paymentDate: new Date().toISOString(),
              paymentMethod: paymentDetails.paymentMethod || "cash",
              notes: "Auto-applied from overpayment",
              recordedBy: paymentDetails.recordedBy,
              recordedByName: paymentDetails.recordedByName,
            },
            fullyPaid: true,
            appliedFromOverpayment: true,
          };

          remainingOverpayment -= installmentAmount;
        } else {
          // Partial payment of this installment - break here as we'll handle this separately
          break;
        }
      }
    }

    // If there's still overpayment left, distribute proportionally across remaining unpaid installments
    if (remainingOverpayment > 0) {
      const unpaidInstallments = schedule
        .slice(startIndex)
        .map((installment, index) => ({
          ...installment,
          originalIndex: startIndex + index
        }))
        .filter((emi) => !emi.paid);

      if (unpaidInstallments.length > 0) {
        // Calculate total amount of unpaid installments
        const totalUnpaidAmount = unpaidInstallments.reduce(
          (sum, emi) => sum + parseFloat(emi.amount), 
          0
        );

        // If overpayment can cover all remaining installments, pay them all
        if (remainingOverpayment >= totalUnpaidAmount) {
          unpaidInstallments.forEach((installment) => {
            schedule[installment.originalIndex] = {
              ...installment,
              paid: true,
              paidAmount: installment.amount,
              paymentDate: new Date().toISOString(),
              paymentRecord: {
                amount: installment.amount,
                paymentDate: new Date().toISOString(),
                paymentMethod: paymentDetails.paymentMethod || "cash",
                notes: "Fully paid from overpayment",
                recordedBy: paymentDetails.recordedBy,
                recordedByName: paymentDetails.recordedByName,
              },
              fullyPaid: true,
              appliedFromOverpayment: true,
            };
          });
          
          // If there's still money left after paying all EMIs, record the excess
          const excessAmount = remainingOverpayment - totalUnpaidAmount;
          if (excessAmount > 0) {
            console.log(`Excess overpayment of ${excessAmount} will be handled separately (refund/credit)`);
          }
        } else {
          // Distribute overpayment proportionally across remaining installments
          unpaidInstallments.forEach((installment) => {
            const proportion = parseFloat(installment.amount) / totalUnpaidAmount;
            const reductionAmount = remainingOverpayment * proportion;
            const newAmount = Math.max(0, parseFloat(installment.amount) - reductionAmount);

            schedule[installment.originalIndex] = {
              ...installment,
              amount: Math.round(newAmount * 100) / 100,
              overpaymentApplied: Math.round(reductionAmount * 100) / 100,
              originalAmount: installment.amount, // Keep track of original amount
            };
          });
        }
      }
    }
  }

  /**
   * IMPROVED: Redistribute shortfall across remaining installments proportionally
   * @param {Array} schedule - EMI schedule array
   * @param {number} startIndex - Index to start redistribution
   * @param {number} shortfall - Shortfall amount to redistribute
   */
  redistributeShortfall(schedule, startIndex, shortfall) {
    const unpaidInstallments = schedule
      .slice(startIndex)
      .map((installment, index) => ({
        ...installment,
        originalIndex: startIndex + index
      }))
      .filter((emi) => !emi.paid);

    if (unpaidInstallments.length === 0) {
      console.warn("No unpaid installments to redistribute shortfall");
      return;
    }

    // Calculate total amount of unpaid installments
    const totalUnpaidAmount = unpaidInstallments.reduce(
      (sum, emi) => sum + parseFloat(emi.amount), 
      0
    );

    // Distribute shortfall proportionally across remaining installments
    unpaidInstallments.forEach((installment, index) => {
      const proportion = parseFloat(installment.amount) / totalUnpaidAmount;
      const additionalAmount = shortfall * proportion;

      // For the last installment, add any rounding remainder
      const isLastInstallment = index === unpaidInstallments.length - 1;
      let finalAdditionalAmount = additionalAmount;
      
      if (isLastInstallment) {
        // Calculate what has been distributed so far
        const distributedSoFar = unpaidInstallments
          .slice(0, -1)
          .reduce((sum, emi) => {
            const prop = parseFloat(emi.amount) / totalUnpaidAmount;
            return sum + (shortfall * prop);
          }, 0);
        
        // Add any remainder to the last installment
        finalAdditionalAmount = shortfall - distributedSoFar;
      }

      schedule[installment.originalIndex] = {
        ...installment,
        amount: Math.round((parseFloat(installment.amount) + finalAdditionalAmount) * 100) / 100,
        adjustedForShortfall: true,
        shortfallAddition: Math.round(finalAdditionalAmount * 100) / 100,
        originalAmount: installment.amount, // Keep track of original amount
      };
    });
  }

  /**
   * Get installment payment history for an invoice
   * @param {string} userType - User type
   * @param {string} invoiceId - Invoice ID
   * @returns {Promise<Array>} Payment history
   */
  // async getInstallmentPaymentHistory(userType, invoiceId) {
  //   try {
  //     const invoice = await this.getById(userType, invoiceId);

  //     if (!invoice.emiDetails || !invoice.emiDetails.schedule) {
  //       return [];
  //     }

  //     return invoice.emiDetails.schedule
  //       .filter((installment) => installment.paid && installment.paymentRecord)
  //       .map((installment) => ({
  //         installmentNumber: installment.installmentNumber,
  //         originalAmount: installment.originalAmount || installment.amount,
  //         paidAmount: installment.paidAmount,
  //         paymentDate: installment.paymentDate,
  //         paymentRecord: installment.paymentRecord,
  //         fullyPaid: installment.fullyPaid,
  //         shortfallAmount: installment.shortfallAmount || 0,
  //       }))
  //       .sort((a, b) => new Date(b.paymentDate) - new Date(a.paymentDate));
  //   } catch (error) {
  //     console.error("Error getting installment payment history:", error);
  //     throw error;
  //   }
  // }

  /**
   * Get pending installments for an invoice
   * @param {string} userType - User type
   * @param {string} invoiceId - Invoice ID
   * @returns {Promise<Array>} Pending installments
   */
  async getPendingInstallments(userType, invoiceId) {
    try {
      const invoice = await this.getById(userType, invoiceId);

      if (!invoice.emiDetails || !invoice.emiDetails.schedule) {
        return [];
      }

      const today = new Date();

      return invoice.emiDetails.schedule
        .filter((installment) => !installment.paid)
        .map((installment) => {
          const dueDate = new Date(installment.dueDate);
          const daysDiff = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));

          return {
            ...installment,
            daysDiff,
            isOverdue: daysDiff < 0,
            isDueToday: daysDiff === 0,
            isDueSoon: daysDiff > 0 && daysDiff <= 7,
          };
        })
        .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
    } catch (error) {
      console.error("Error getting pending installments:", error);
      throw error;
    }
  }

  /**
   * Update installment due date
   * @param {string} userType - User type
   * @param {string} invoiceId - Invoice ID
   * @param {number} installmentNumber - Installment number
   * @param {string} newDueDate - New due date
   * @returns {Promise<Object>} Updated invoice
   */
  async updateInstallmentDueDate(
    userType,
    invoiceId,
    installmentNumber,
    newDueDate
  ) {
    try {
      const invoice = await this.getById(userType, invoiceId);

      if (!invoice.emiDetails || !invoice.emiDetails.schedule) {
        throw new Error("EMI schedule not found");
      }

      const schedule = [...invoice.emiDetails.schedule];
      const installmentIndex = schedule.findIndex(
        (emi) => emi.installmentNumber === installmentNumber
      );

      if (installmentIndex === -1) {
        throw new Error("Installment not found");
      }

      if (schedule[installmentIndex].paid) {
        throw new Error("Cannot update due date for paid installment");
      }

      schedule[installmentIndex] = {
        ...schedule[installmentIndex],
        dueDate: newDueDate,
        dueDateUpdated: true,
        dueDateUpdatedAt: new Date().toISOString(),
      };

      const updates = {
        emiDetails: {
          ...invoice.emiDetails,
          schedule,
        },
        updatedAt: new Date().toISOString(),
      };

      return await this.update(userType, invoiceId, updates);
    } catch (error) {
      console.error("Error updating installment due date:", error);
      throw error;
    }
  }

  /**
   * Get EMI summary for an invoice
   * @param {string} userType - User type
   * @param {string} invoiceId - Invoice ID
   * @returns {Promise<Object>} EMI summary
   */
/**
 * Get EMI summary for an invoice - FIXED VERSION
 */
async getEMISummary(userType, invoiceId) {
  try {
    const invoice = await this.getById(userType, invoiceId);

    if (!invoice.emiDetails || !invoice.emiDetails.schedule) {
      throw new Error("EMI schedule not found");
    }

    const schedule = invoice.emiDetails.schedule;
    const totalInstallments = schedule.length;
    const paidInstallments = schedule.filter((emi) => emi.paid).length;
    const pendingInstallments = totalInstallments - paidInstallments;

    // FIX: Use original invoice total, NOT sum of current installment amounts
    const totalAmount = invoice.grandTotal || invoice.totalAmount;
    
    // Calculate actual amount paid
    const paidAmount = schedule
      .filter((emi) => emi.paid)
      .reduce((sum, emi) => sum + (emi.paidAmount || 0), 0);
    
    // Remaining is simply: original total - actual payments made
    const remainingAmount = totalAmount - paidAmount;

    const today = new Date();
    const overdueInstallments = schedule.filter(
      (emi) => !emi.paid && new Date(emi.dueDate) < today
    ).length;

    const nextDueInstallment = schedule
      .filter((emi) => !emi.paid)
      .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))[0];

    return {
      invoiceId,
      customerName: invoice.customerName,
      invoiceNumber: invoice.invoiceNumber,
      totalInstallments,
      paidInstallments,
      pendingInstallments,
      overdueInstallments,
      totalAmount: Math.round(totalAmount * 100) / 100,
      paidAmount: Math.round(paidAmount * 100) / 100,
      remainingAmount: Math.round(remainingAmount * 100) / 100,
      paymentPercentage: Math.round((paidAmount / totalAmount) * 100),
      nextDueInstallment,
      lastPaymentDate: invoice.emiDetails.lastPaymentDate,
      schedule,
    };
  } catch (error) {
    console.error("Error getting EMI summary:", error);
    throw error;
  }
}
}

// Create and export singleton instance
const salesService = new SalesService();
export default salesService;
