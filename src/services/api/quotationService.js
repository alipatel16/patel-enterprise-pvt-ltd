import BaseService from "./baseService";
import {
  COLLECTIONS,
} from "../../utils/constants/appConstants";
import {
  calculateItemWithGST,
} from "../../utils/helpers/gstCalculator";

/**
 * Quotation service for managing quotations
 */
class QuotationService extends BaseService {
  constructor() {
    super(COLLECTIONS.QUOTATIONS || "quotations");
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

        if (value !== undefined && value !== null) {
          if (
            typeof value === "object" &&
            !Array.isArray(value) &&
            !(value instanceof Date)
          ) {
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
   * Generate unique quotation number
   * Format: QT_EL_001, QT_FN_001
   * @param {string} userType - User type (electronics/furniture)
   * @param {string} companyCode - Company code (EL/FN/etc)
   * @returns {Promise<string>} Generated quotation number
   */
  async generateQuotationNumber(userType, companyCode = null) {
    try {
      // Determine company code based on userType if not provided
      let prefix;
      if (companyCode) {
        prefix = `QT_${companyCode}_`;
      } else {
        prefix = userType === "electronics" ? "QT_EL_" : "QT_FN_";
      }

      // Get all quotations with this prefix to find the highest sequence number
      const allQuotations = await this.getAll(userType, {
        orderBy: "createdAt",
        orderDirection: "desc",
        limit: 1000,
      });

      // Filter quotations with the same prefix and find the highest sequence
      let maxSequence = 0;

      if (allQuotations && allQuotations.length > 0) {
        allQuotations.forEach((quotation) => {
          if (
            quotation.quotationNumber &&
            quotation.quotationNumber.startsWith(prefix)
          ) {
            // Extract sequence number from quotation number (last 3 digits)
            const match = quotation.quotationNumber.match(/(\d{3})$/);
            if (match) {
              const sequence = parseInt(match[1]);
              if (sequence > maxSequence) {
                maxSequence = sequence;
              }
            }
          }
        });
      }

      // Increment sequence for new quotation
      const newSequence = maxSequence + 1;
      const sequenceStr = String(newSequence).padStart(3, "0");

      const quotationNumber = `${prefix}${sequenceStr}`;

      console.log(
        `Generated quotation number: ${quotationNumber} (userType: ${userType}, companyCode: ${companyCode})`
      );

      return quotationNumber;
    } catch (error) {
      console.error("Error generating quotation number:", error);
      // Fallback to timestamp-based number
      const timestamp = Date.now().toString().slice(-6);
      const fallbackPrefix = companyCode 
        ? `QT_${companyCode}_` 
        : userType === "electronics" 
        ? "QT_EL_" 
        : "QT_FN_";
      return `${fallbackPrefix}${timestamp}`;
    }
  }

  /**
   * Create new quotation
   * @param {string} userType - User type
   * @param {Object} quotationData - Quotation data
   * @returns {Promise<Object>} Created quotation
   */
  async createQuotation(userType, quotationData) {
    try {
      // Generate quotation number
      const quotationNumber = await this.generateQuotationNumber(
        userType,
        quotationData.company?.code
      );

      // Calculate totals with GST slabs
      let subtotal = 0;
      let totalGST = 0;
      let processedItems = [];

      // Process each item with its GST slab
      if (quotationData.items && quotationData.items.length > 0) {
        quotationData.items.forEach((item) => {
          const itemCalc = calculateItemWithGST(
            item,
            quotationData.customerState,
            quotationData.includeGST !== false
          );

          subtotal += itemCalc.baseAmount;
          totalGST += itemCalc.gstAmount;

          processedItems.push({
            ...item,
            baseAmount: itemCalc.baseAmount,
            gstAmount: itemCalc.gstAmount,
            totalAmount: itemCalc.totalAmount,
            gstBreakdown: itemCalc.gstBreakdown,
            hsnCode: item.hsnCode || "",
          });
        });
      }

      // FIXED: Clean quotation data - removed sales person fields
      const cleanQuotationData = {
        quotationNumber,
        quotationDate: quotationData.quotationDate,
        validUntil: quotationData.validUntil,
        customerId: quotationData.customerId,
        customerName: quotationData.customerName,
        customerPhone: quotationData.customerPhone,
        customerAddress: quotationData.customerAddress,
        customerState: quotationData.customerState,
        customerGSTNumber: quotationData.customerGSTNumber || "",
        // REMOVED: salesPersonId, salesPersonName
        company: quotationData.company, // Company information
        items: processedItems,
        includeGST: quotationData.includeGST,
        subtotal: Math.round(subtotal * 100) / 100,
        totalGST: Math.round(totalGST * 100) / 100,
        grandTotal: Math.round((subtotal + totalGST) * 100) / 100,
        totalAmount: Math.round((subtotal + totalGST) * 100) / 100,
        termsAndConditions: quotationData.termsAndConditions || "",
        remarks: quotationData.remarks || "",
        status: "active", // active, converted, expired, cancelled
        converted: false, // Track if converted to invoice
        convertedInvoiceId: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: quotationData.createdBy,
        createdByName: quotationData.createdByName,
      };

      return await this.create(userType, cleanQuotationData);
    } catch (error) {
      console.error("Error creating quotation:", error);
      throw error;
    }
  }

  /**
   * Get quotation by ID
   * @param {string} userType - User type
   * @param {string} quotationId - Quotation ID
   * @returns {Promise<Object>} Quotation data
   */
  async getQuotationById(userType, quotationId) {
    try {
      return await this.getById(userType, quotationId);
    } catch (error) {
      console.error("Error getting quotation:", error);
      throw error;
    }
  }

  /**
   * Update quotation
   * @param {string} userType - User type
   * @param {string} quotationId - Quotation ID
   * @param {Object} updates - Update data
   * @returns {Promise<Object>} Updated quotation
   */
  async updateQuotation(userType, quotationId, updates) {
    try {
      const existingQuotation = await this.getById(userType, quotationId);
      
      // Clean undefined values from updates
      const cleanUpdates = this.cleanUndefinedValues(updates);

      // Remove quotationNumber from updates to prevent changes during edit
      if (cleanUpdates.quotationNumber) {
        console.log("Removing quotationNumber from updates to prevent modification during edit");
        delete cleanUpdates.quotationNumber;
      }

      // FIXED: Remove sales person fields if they exist in updates but are undefined
      if (cleanUpdates.salesPersonId === undefined) {
        delete cleanUpdates.salesPersonId;
      }
      if (cleanUpdates.salesPersonName === undefined) {
        delete cleanUpdates.salesPersonName;
      }

      // Recalculate totals if items changed
      if (cleanUpdates.items) {
        let subtotal = 0;
        let totalGST = 0;
        const processedItems = [];

        cleanUpdates.items.forEach((item) => {
          const itemCalc = calculateItemWithGST(
            item,
            cleanUpdates.customerState || existingQuotation.customerState,
            cleanUpdates.includeGST !== false
          );

          subtotal += itemCalc.baseAmount;
          totalGST += itemCalc.gstAmount;

          processedItems.push({
            ...item,
            baseAmount: itemCalc.baseAmount,
            gstAmount: itemCalc.gstAmount,
            totalAmount: itemCalc.totalAmount,
            gstBreakdown: itemCalc.gstBreakdown,
            hsnCode: item.hsnCode || "",
          });
        });

        cleanUpdates.items = processedItems;
        cleanUpdates.subtotal = Math.round(subtotal * 100) / 100;
        cleanUpdates.totalGST = Math.round(totalGST * 100) / 100;
        cleanUpdates.grandTotal = Math.round((subtotal + totalGST) * 100) / 100;
        cleanUpdates.totalAmount = cleanUpdates.grandTotal;
      }

      cleanUpdates.updatedAt = new Date().toISOString();

      return await this.update(userType, quotationId, cleanUpdates);
    } catch (error) {
      console.error("Error updating quotation:", error);
      throw error;
    }
  }

  /**
   * Delete quotation
   * @param {string} userType - User type
   * @param {string} quotationId - Quotation ID
   * @returns {Promise<boolean>} Success status
   */
  async deleteQuotation(userType, quotationId) {
    try {
      await this.delete(userType, quotationId);
      return true;
    } catch (error) {
      console.error("Error deleting quotation:", error);
      throw error;
    }
  }

  /**
   * Get quotations with filters
   * @param {string} userType - User type
   * @param {Object} filters - Filter options
   * @returns {Promise<Array>} Quotations data
   */
  async getQuotations(userType, filters = {}) {
    try {
      const quotations = await this.getAll(userType, {
        orderBy: "createdAt",
        orderDirection: "desc",
      });

      return quotations;
    } catch (error) {
      console.error("Error getting quotations:", error);
      throw error;
    }
  }

  /**
   * Search quotations by term
   * @param {string} userType - User type
   * @param {string} searchTerm - Search term
   * @returns {Promise<Array>} Matching quotations
   */
  async searchQuotations(userType, searchTerm) {
    try {
      const allQuotations = await this.getAll(userType, {
        orderBy: "createdAt",
        orderDirection: "desc",
        limit: 100,
      });

      if (!searchTerm.trim()) {
        return allQuotations;
      }

      const term = searchTerm.toLowerCase().trim();
      return allQuotations.filter(
        (quotation) =>
          quotation.quotationNumber?.toLowerCase().includes(term) ||
          quotation.customerName?.toLowerCase().includes(term) ||
          quotation.items?.some((item) => item.name?.toLowerCase().includes(term))
      );
    } catch (error) {
      console.error("Error searching quotations:", error);
      throw error;
    }
  }

  /**
   * Get quotation statistics
   * @param {string} userType - User type
   * @returns {Promise<Object>} Quotation statistics
   */
  async getQuotationStats(userType) {
    try {
      const quotations = await this.getAll(userType, {
        orderBy: "createdAt",
        orderDirection: "desc",
      });

      const today = new Date();
      const todayStart = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate()
      );

      const todaysQuotations = quotations.filter((quotation) => {
        const quotationDate = new Date(quotation.quotationDate);
        return quotationDate >= todayStart;
      });

      // Calculate expired quotations
      const expiredQuotations = quotations.filter((quotation) => {
        if (!quotation.validUntil) return false;
        const validUntil = new Date(quotation.validUntil);
        return validUntil < today && quotation.status === "active";
      });

      const stats = {
        totalQuotations: quotations.length,
        totalAmount: quotations.reduce(
          (sum, quotation) => sum + (quotation.grandTotal || quotation.totalAmount || 0),
          0
        ),
        todaysQuotations: todaysQuotations.length,
        todaysAmount: todaysQuotations.reduce(
          (sum, quotation) => sum + (quotation.grandTotal || quotation.totalAmount || 0),
          0
        ),
        activeQuotations: quotations.filter(
          (quotation) => quotation.status === "active"
        ).length,
        convertedQuotations: quotations.filter(
          (quotation) => quotation.converted === true
        ).length,
        expiredQuotations: expiredQuotations.length,
        conversionRate: quotations.length > 0 
          ? ((quotations.filter(q => q.converted).length / quotations.length) * 100).toFixed(1)
          : 0,
      };

      return stats;
    } catch (error) {
      console.error("Error getting quotation stats:", error);
      throw error;
    }
  }

  /**
   * Convert quotation to invoice
   * @param {string} userType - User type
   * @param {string} quotationId - Quotation ID
   * @param {string} invoiceId - Created invoice ID
   * @returns {Promise<Object>} Updated quotation
   */
  async convertQuotationToInvoice(userType, quotationId, invoiceId) {
    try {
      const updates = {
        converted: true,
        convertedInvoiceId: invoiceId,
        convertedAt: new Date().toISOString(),
        status: "converted",
        updatedAt: new Date().toISOString(),
      };

      return await this.update(userType, quotationId, updates);
    } catch (error) {
      console.error("Error converting quotation to invoice:", error);
      throw error;
    }
  }

  /**
   * Get customer quotation history
   * @param {string} userType - User type
   * @param {string} customerId - Customer ID
   * @returns {Promise<Array>} Customer's quotation history
   */
  async getCustomerQuotationHistory(userType, customerId) {
    try {
      return await this.getAll(userType, {
        where: [["customerId", "==", customerId]],
        orderBy: "createdAt",
        orderDirection: "desc",
      });
    } catch (error) {
      console.error("Error getting customer quotation history:", error);
      throw error;
    }
  }
}

// Create and export singleton instance
const quotationService = new QuotationService();
export default quotationService;