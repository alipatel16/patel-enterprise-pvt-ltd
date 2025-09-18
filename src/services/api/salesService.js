import BaseService from "./baseService";
import {
  COLLECTIONS,
  PAYMENT_STATUS,
  DELIVERY_STATUS,
  getPaymentCategory,
  PAYMENT_METHODS,
} from "../../utils/constants/appConstants";
import {
  calculateGSTWithSlab,
  calculateItemWithGST,
} from "../../utils/helpers/gstCalculator";
import productService from "./productService";

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

        if (value !== undefined && value !== null) {
          // Special handling for bulk pricing removal
          if (key === "bulkPricingDetails" && value === null) {
            // Explicitly remove bulk pricing
            continue;
          }

          if (
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
        // Skip undefined and null values entirely
      }
    }

    return cleaned;
  }

  /**
   * Generate unique invoice number with new format
   * Format: EL_GST_001, EL_NGST_001, FN_GST_001, FN_NGST_001
   * @param {string} userType - User type (electronics/furniture)
   * @param {boolean} includeGST - Whether GST is included in invoice
   * @returns {Promise<string>} Generated invoice number
   */
  async generateInvoiceNumber(userType, includeGST = true) {
    try {
      // Determine prefix based on user type and GST inclusion
      let prefix;
      if (userType === "electronics") {
        prefix = includeGST ? "EL_GST_" : "EL_NGST_";
      } else {
        // furniture
        prefix = includeGST ? "FN_GST_" : "FN_NGST_";
      }

      // Get the current year and month for tracking period
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, "0");
      const currentPeriod = `${year}${month}`;

      // Get all invoices with this prefix to find the highest sequence number
      const allInvoices = await this.getAll(userType, {
        orderBy: "createdAt",
        orderDirection: "desc",
        limit: 1000, // Get enough to find the max sequence
      });

      // Filter invoices with the same prefix and find the highest sequence
      let maxSequence = 0;

      if (allInvoices && allInvoices.length > 0) {
        allInvoices.forEach((invoice) => {
          if (
            invoice.invoiceNumber &&
            invoice.invoiceNumber.startsWith(prefix)
          ) {
            // Extract sequence number from invoice number (last 3 digits)
            const match = invoice.invoiceNumber.match(/(\d{3})$/);
            if (match) {
              const sequence = parseInt(match[1]);
              if (sequence > maxSequence) {
                maxSequence = sequence;
              }
            }
          }
        });
      }

      // Increment sequence for new invoice
      const newSequence = maxSequence + 1;
      const sequenceStr = String(newSequence).padStart(3, "0");

      const invoiceNumber = `${prefix}${sequenceStr}`;

      console.log(
        `Generated invoice number: ${invoiceNumber} (userType: ${userType}, includeGST: ${includeGST})`
      );

      return invoiceNumber;
    } catch (error) {
      console.error("Error generating invoice number:", error);
      // Fallback to timestamp-based number
      const timestamp = Date.now().toString().slice(-6);
      const fallbackPrefix =
        userType === "electronics"
          ? includeGST
            ? "EL_GST_"
            : "EL_NGST_"
          : includeGST
          ? "FN_GST_"
          : "FN_NGST_";
      return `${fallbackPrefix}${timestamp}`;
    }
  }

  /**
   * Create new invoice (alias for createSale for backward compatibility)
   * @param {string} userType - User type
   * @param {Object} invoiceData - Invoice data
   * @returns {Promise<Object>} Created invoice
   */
  async createInvoice(userType, invoiceData) {
    try {
      // IMPORTANT: Generate invoice number with GST consideration
      const invoiceNumber = await this.generateInvoiceNumber(
        userType,
        invoiceData.includeGST
      );

      // Calculate totals with GST slabs
      let subtotal = 0;
      let totalGST = 0;
      let processedItems = [];

      // Process each item with its GST slab
      if (invoiceData.items && invoiceData.items.length > 0) {
        // CHECK: Is bulk pricing applied?
        if (
          invoiceData.bulkPricingDetails &&
          invoiceData.bulkPricingDetails.totalPrice > 0
        ) {
          // USE BULK PRICING - ignore individual item calculations
          const bulkDetails = invoiceData.bulkPricingDetails;

          if (!invoiceData.includeGST || bulkDetails.gstSlab === 0) {
            // No GST
            subtotal = bulkDetails.totalPrice;
            totalGST = 0;
          } else if (bulkDetails.isPriceInclusive) {
            // GST included in bulk price
            const baseAmount =
              bulkDetails.totalPrice / (1 + bulkDetails.gstSlab / 100);
            subtotal = Math.round(baseAmount * 100) / 100;
            totalGST =
              Math.round((bulkDetails.totalPrice - baseAmount) * 100) / 100;
          } else {
            // GST to be added to bulk price
            subtotal = bulkDetails.totalPrice;
            totalGST =
              Math.round(
                ((bulkDetails.totalPrice * bulkDetails.gstSlab) / 100) * 100
              ) / 100;
          }

          // Store items without individual calculations (bulk pricing overrides)
          processedItems = invoiceData.items.map((item) => ({
            ...item,
            baseAmount: 0, // Not applicable with bulk pricing
            gstAmount: 0, // Not applicable with bulk pricing
            totalAmount: 0, // Not applicable with bulk pricing
            bulkPricing: true, // Flag to indicate bulk pricing
            hsnCode: item.hsnCode || "",
          }));
        } else {
          // USE INDIVIDUAL ITEM CALCULATIONS (existing logic)
          invoiceData.items.forEach((item) => {
            const itemCalc = calculateItemWithGST(
              item,
              invoiceData.customerState,
              invoiceData.includeGST !== false
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
      }

      // NEW - Determine original payment category for tracking
      const originalPaymentCategory = getPaymentCategory(
        invoiceData.paymentStatus,
        invoiceData.paymentDetails?.paymentMethod
      );

      // Clean invoice data - remove undefined values and structure properly
      const cleanInvoiceData = {
        invoiceNumber,
        saleDate: invoiceData.saleDate,
        customerId: invoiceData.customerId,
        customerName: invoiceData.customerName,
        customerPhone: invoiceData.customerPhone,
        customerAddress: invoiceData.customerAddress,
        customerState: invoiceData.customerState,
        // NEW - Add customer GST number
        customerGSTNumber: invoiceData.customerGSTNumber || "",
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
        remarks: invoiceData.remarks || "", // Remarks field
        // NEW - Add original payment category for tracking
        originalPaymentCategory: originalPaymentCategory,
        // NEW - Add fullyPaid flag for tracking complete payments while maintaining category
        fullyPaid: invoiceData.paymentStatus === PAYMENT_STATUS.PAID,
        status: "active",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: invoiceData.createdBy,
        createdByName: invoiceData.createdByName,
        ...(invoiceData.bulkPricingDetails && {
          bulkPricingDetails: invoiceData.bulkPricingDetails,
          bulkPricingApplied: true,
        }),
      };

      // Only add scheduledDeliveryDate if it exists
      if (invoiceData.scheduledDeliveryDate) {
        cleanInvoiceData.scheduledDeliveryDate =
          invoiceData.scheduledDeliveryDate;
      }

      // Handle payment details for finance and bank transfer
      if (
        invoiceData.paymentStatus === PAYMENT_STATUS.FINANCE ||
        invoiceData.paymentStatus === PAYMENT_STATUS.BANK_TRANSFER
      ) {
        if (invoiceData.paymentDetails) {
          cleanInvoiceData.paymentDetails = {
            downPayment: parseFloat(
              invoiceData.paymentDetails.downPayment || 0
            ),
            remainingBalance: parseFloat(
              invoiceData.paymentDetails.remainingBalance || 0
            ),
            paymentMethod:
              invoiceData.paymentDetails.paymentMethod || PAYMENT_METHODS.CASH,
            bankName: invoiceData.paymentDetails.bankName || "",
            financeCompany: invoiceData.paymentDetails.financeCompany || "",
            paymentReference: invoiceData.paymentDetails.paymentReference || "",
            // Track payment history for partial payments
            paymentHistory: [
              {
                amount: parseFloat(invoiceData.paymentDetails.downPayment || 0),
                date: new Date().toISOString(),
                method:
                  invoiceData.paymentDetails.paymentMethod ||
                  PAYMENT_METHODS.CASH,
                reference: invoiceData.paymentDetails.paymentReference || "",
                recordedBy: invoiceData.createdBy,
                recordedByName: invoiceData.createdByName,
                type: "down_payment",
              },
            ].filter((payment) => payment.amount > 0), // Only add if there's a down payment
          };
        }
      }

      // Handle EMI details with down payment support
      if (
        invoiceData.paymentStatus === PAYMENT_STATUS.EMI &&
        invoiceData.emiDetails
      ) {
        const downPayment = parseFloat(
          invoiceData.paymentDetails?.downPayment || 0
        );
        const totalAmount = cleanInvoiceData.grandTotal;
        const emiAmount = totalAmount - downPayment; // EMI calculated on remaining amount

        const emiDetails = {
          monthlyAmount: parseFloat(invoiceData.emiDetails.monthlyAmount || 0),
          numberOfInstallments: parseInt(
            invoiceData.emiDetails.numberOfInstallments || 1
          ),
          downPayment: downPayment,
          totalAmount: totalAmount,
          emiAmount: emiAmount, // EMI is calculated on this amount
        };

        // Only add startDate and schedule if startDate exists
        if (invoiceData.emiDetails.startDate) {
          emiDetails.startDate = invoiceData.emiDetails.startDate;

          // Generate schedule based on EMI amount (after down payment)
          if (
            invoiceData.emiDetails.schedule &&
            invoiceData.emiDetails.schedule.length > 0
          ) {
            emiDetails.schedule = invoiceData.emiDetails.schedule;
          }
        }

        cleanInvoiceData.emiDetails = emiDetails;

        // Record down payment in payment history if provided
        if (downPayment > 0) {
          cleanInvoiceData.paymentDetails = {
            downPayment: downPayment,
            remainingBalance: emiAmount,
            paymentMethod:
              invoiceData.paymentDetails?.paymentMethod || PAYMENT_METHODS.CASH,
            paymentHistory: [
              {
                amount: downPayment,
                date: new Date().toISOString(),
                method:
                  invoiceData.paymentDetails?.paymentMethod ||
                  PAYMENT_METHODS.CASH,
                type: "emi_down_payment",
                notes: "Down payment for EMI",
                recordedBy: invoiceData.createdBy,
                recordedByName: invoiceData.createdByName,
              },
            ],
          };
        }
      }

      // NEW: Save products to catalog after processing items
      if (processedItems && processedItems.length > 0) {
        // Save each item as a product in the catalog (non-blocking)
        processedItems.forEach(async (item) => {
          try {
            await productService.saveProductFromInvoiceItem(userType, item);
          } catch (error) {
            console.error("Error saving product:", error);
            // Don't fail invoice creation if product save fails
          }
        });
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
   * FIXED: Update invoice method that preserves EMI payment history
   * IMPORTANT: Invoice number should NOT be changed during updates
   * @param {string} userType - User type
   * @param {string} invoiceId - Invoice ID
   * @param {Object} updates - Update data
   * @returns {Promise<Object>} Updated invoice
   */
  async updateInvoice(userType, invoiceId, updates) {
    try {
      // CRITICAL FIX: Get existing invoice first to preserve EMI history
      const existingInvoice = await this.getById(userType, invoiceId);

      // Clean undefined values from updates
      const cleanUpdates = this.cleanUndefinedValues(updates);

      // CRITICAL: Remove invoiceNumber from updates to prevent changes during edit
      if (cleanUpdates.invoiceNumber) {
        console.log(
          "Removing invoiceNumber from updates to prevent modification during edit"
        );
        delete cleanUpdates.invoiceNumber;
      }

      // CRITICAL FIX: Preserve existing EMI details before any processing
      const existingEmiDetails = existingInvoice.emiDetails;
      const hasExistingEmiSchedule = existingEmiDetails?.schedule?.length > 0;

      // Log for debugging
      if (hasExistingEmiSchedule) {
        console.log(
          "🔒 Preserving EMI schedule with",
          existingEmiDetails.schedule.length,
          "installments"
        );

        // Count paid installments for verification
        const paidCount = existingEmiDetails.schedule.filter(
          (emi) => emi.paid
        ).length;
        console.log("📊 Preserving", paidCount, "paid installments");
      }

      // Recalculate totals if items changed
      if (cleanUpdates.items) {
        let subtotal = 0;
        let totalGST = 0;
        const processedItems = [];

        // CHECK: Is bulk pricing applied in the update?
        if (
          cleanUpdates.bulkPricingDetails &&
          cleanUpdates.bulkPricingDetails.totalPrice > 0
        ) {
          // USE BULK PRICING - ignore individual item calculations
          const bulkDetails = cleanUpdates.bulkPricingDetails;

          if (!cleanUpdates.includeGST || bulkDetails.gstSlab === 0) {
            // No GST
            subtotal = bulkDetails.totalPrice;
            totalGST = 0;
          } else if (bulkDetails.isPriceInclusive) {
            // GST included in bulk price
            const baseAmount =
              bulkDetails.totalPrice / (1 + bulkDetails.gstSlab / 100);
            subtotal = Math.round(baseAmount * 100) / 100;
            totalGST =
              Math.round((bulkDetails.totalPrice - baseAmount) * 100) / 100;
          } else {
            // GST to be added to bulk price
            subtotal = bulkDetails.totalPrice;
            totalGST =
              Math.round(
                ((bulkDetails.totalPrice * bulkDetails.gstSlab) / 100) * 100
              ) / 100;
          }

          // Store items without individual calculations
          cleanUpdates.items.forEach((item) => {
            processedItems.push({
              ...item,
              baseAmount: 0,
              gstAmount: 0,
              totalAmount: 0,
              bulkPricing: true,
            });
          });

          // Set bulk pricing flags
          cleanUpdates.bulkPricingApplied = true;
        } else {
          // USE INDIVIDUAL ITEM CALCULATIONS (existing logic)
          cleanUpdates.items.forEach((item) => {
            const itemCalc = calculateItemWithGST(
              item,
              cleanUpdates.customerState || existingInvoice.customerState,
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

          // Remove bulk pricing if switching back to individual items
          if (cleanUpdates.bulkPricingDetails === undefined) {
            cleanUpdates.bulkPricingApplied = false;
          }
        }

        cleanUpdates.items = processedItems;
        cleanUpdates.subtotal = Math.round(subtotal * 100) / 100;
        cleanUpdates.totalGST = Math.round(totalGST * 100) / 100;
        cleanUpdates.grandTotal = Math.round((subtotal + totalGST) * 100) / 100;
        cleanUpdates.totalAmount = cleanUpdates.grandTotal;

        // CRITICAL FIX: If this is an EMI invoice with existing schedule,
        // preserve the schedule and only update unpaid installment amounts
        if (hasExistingEmiSchedule && existingInvoice.paymentStatus === "emi") {
          console.log("💰 EMI invoice detected - preserving payment history");

          const newTotal = cleanUpdates.grandTotal;
          const existingSchedule = [...existingEmiDetails.schedule];

          // Calculate how much has been paid already
          const totalPaid = existingSchedule
            .filter((emi) => emi.paid)
            .reduce((sum, emi) => sum + (emi.paidAmount || emi.amount || 0), 0);

          // Calculate new remaining balance
          const newRemainingBalance = newTotal - totalPaid;

          // Get unpaid installments
          const unpaidInstallments = existingSchedule.filter(
            (emi) => !emi.paid
          );

          if (unpaidInstallments.length > 0 && newRemainingBalance > 0) {
            // Redistribute only the unpaid amounts
            const equalAmount = newRemainingBalance / unpaidInstallments.length;

            unpaidInstallments.forEach((unpaidEmi, index) => {
              const scheduleIndex = existingSchedule.findIndex(
                (emi) => emi.installmentNumber === unpaidEmi.installmentNumber
              );

              if (index === unpaidInstallments.length - 1) {
                // Last installment gets remainder to handle rounding
                const distributedSoFar =
                  equalAmount * (unpaidInstallments.length - 1);
                existingSchedule[scheduleIndex].amount =
                  Math.round((newRemainingBalance - distributedSoFar) * 100) /
                  100;
              } else {
                existingSchedule[scheduleIndex].amount =
                  Math.round(equalAmount * 100) / 100;
              }
            });

            console.log("✅ Redistributed unpaid amounts:", {
              newTotal,
              totalPaid,
              newRemainingBalance,
              unpaidCount: unpaidInstallments.length,
            });
          }

          // CRITICAL: Preserve the EMI details with updated schedule
          let updatedEmiDetails = {
            ...existingEmiDetails,
            schedule: existingSchedule,
            // Update totals but preserve all other data
            totalPaid: Math.round(totalPaid * 100) / 100,
            totalRemaining: Math.round(newRemainingBalance * 100) / 100,
            // Preserve last payment date and other metadata
            // Keep any other existing properties
          };

          if (
            existingEmiDetails.lastPaymentDate !== undefined &&
            existingEmiDetails.lastPaymentDate !== null
          ) {
            updatedEmiDetails = {
              ...existingEmiDetails,
              schedule: existingSchedule,
              // Update totals but preserve all other data
              totalPaid: Math.round(totalPaid * 100) / 100,
              totalRemaining: Math.round(newRemainingBalance * 100) / 100,
              // Preserve last payment date and other metadata
              // Keep any other existing properties
            };
          }

          cleanUpdates.emiDetails = updatedEmiDetails;
        }
      }

      // Handle payment details updates (preserve existing logic)
      if (cleanUpdates.paymentDetails) {
        cleanUpdates.paymentDetails = {
          downPayment: parseFloat(cleanUpdates.paymentDetails.downPayment || 0),
          remainingBalance: parseFloat(
            cleanUpdates.paymentDetails.remainingBalance || 0
          ),
          paymentMethod: cleanUpdates.paymentDetails.paymentMethod || "cash",
          bankName: cleanUpdates.paymentDetails.bankName || "",
          financeCompany: cleanUpdates.paymentDetails.financeCompany || "",
          paymentReference: cleanUpdates.paymentDetails.paymentReference || "",
          // CRITICAL: Preserve existing payment history
          paymentHistory:
            cleanUpdates.paymentDetails.paymentHistory ||
            existingInvoice.paymentDetails?.paymentHistory ||
            [],
        };
      }

      // CRITICAL FIX: Preserve customer due date change flags
      if (
        existingInvoice.customerDueDateChangeFlags &&
        !cleanUpdates.customerDueDateChangeFlags
      ) {
        cleanUpdates.customerDueDateChangeFlags =
          existingInvoice.customerDueDateChangeFlags;
      }

      cleanUpdates.updatedAt = new Date().toISOString();

      const result = await this.update(userType, invoiceId, cleanUpdates);

      // Verification log
      if (hasExistingEmiSchedule && result.emiDetails?.schedule) {
        const finalPaidCount = result.emiDetails.schedule.filter(
          (emi) => emi.paid
        ).length;
        console.log(
          "✅ EMI history preserved - Final paid count:",
          finalPaidCount
        );
      }

      return result;
    } catch (error) {
      console.error("Error updating invoice:", error);
      throw error;
    }
  }

  // ... rest of the methods remain the same as in the original file ...
  // (copying all other methods as they were, with no changes to functionality)

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
   * Get sales statistics - UPDATED to handle new payment types and tracking
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

      // Calculate actual amounts paid for partial payments
      const calculateActualAmountPaid = (sale) => {
        if (
          sale.paymentStatus === PAYMENT_STATUS.FINANCE ||
          sale.paymentStatus === PAYMENT_STATUS.BANK_TRANSFER
        ) {
          return sale.paymentDetails?.downPayment || 0;
        }
        if (sale.paymentStatus === PAYMENT_STATUS.PAID || sale.fullyPaid) {
          return sale.grandTotal || sale.totalAmount || 0;
        }
        if (
          sale.paymentStatus === PAYMENT_STATUS.EMI &&
          sale.emiDetails?.schedule
        ) {
          return sale.emiDetails.schedule
            .filter((emi) => emi.paid)
            .reduce((sum, emi) => sum + (emi.paidAmount || emi.amount || 0), 0);
        }
        return 0;
      };

      // NEW - Calculate stats by original payment category
      const statsByCategory = {};
      sales.forEach((sale) => {
        const category = sale.originalPaymentCategory || "unknown";
        if (!statsByCategory[category]) {
          statsByCategory[category] = {
            count: 0,
            totalAmount: 0,
            paidAmount: 0,
          };
        }
        statsByCategory[category].count++;
        statsByCategory[category].totalAmount +=
          sale.grandTotal || sale.totalAmount || 0;
        statsByCategory[category].paidAmount += calculateActualAmountPaid(sale);
      });

      const stats = {
        totalSales: sales.length,
        totalAmount: sales.reduce(
          (sum, sale) => sum + (sale.grandTotal || sale.totalAmount || 0),
          0
        ),
        // Actual amount collected
        totalAmountPaid: sales.reduce(
          (sum, sale) => sum + calculateActualAmountPaid(sale),
          0
        ),
        todaysSales: todaysSales.length,
        todaysAmount: todaysSales.reduce(
          (sum, sale) => sum + (sale.grandTotal || sale.totalAmount || 0),
          0
        ),
        // Today's actual collections
        todaysAmountPaid: todaysSales.reduce(
          (sum, sale) => sum + calculateActualAmountPaid(sale),
          0
        ),
        pendingPayments: sales.filter(
          (sale) => sale.paymentStatus === PAYMENT_STATUS.PENDING
        ).length,
        pendingDeliveries: sales.filter(
          (sale) => sale.deliveryStatus === DELIVERY_STATUS.PENDING
        ).length,
        // Updated to use fullyPaid flag instead of just paymentStatus
        paidInvoices: sales.filter(
          (sale) => sale.paymentStatus === PAYMENT_STATUS.PAID || sale.fullyPaid
        ).length,
        emiInvoices: sales.filter(
          (sale) => sale.paymentStatus === PAYMENT_STATUS.EMI
        ).length,
        // Finance and Bank Transfer invoices (regardless of full payment status)
        financeInvoices: sales.filter(
          (sale) => sale.paymentStatus === PAYMENT_STATUS.FINANCE
        ).length,
        bankTransferInvoices: sales.filter(
          (sale) => sale.paymentStatus === PAYMENT_STATUS.BANK_TRANSFER
        ).length,
        // Outstanding amounts
        outstandingAmount: sales.reduce((sum, sale) => {
          const totalAmount = sale.grandTotal || sale.totalAmount || 0;
          const paidAmount = calculateActualAmountPaid(sale);
          return sum + Math.max(0, totalAmount - paidAmount);
        }, 0),
        // NEW - Stats by original payment category
        statsByCategory,
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
   * UPDATED - Record additional payment for PENDING, FINANCE, and BANK_TRANSFER invoices
   * @param {string} userType - User type
   * @param {string} invoiceId - Invoice ID
   * @param {number} paymentAmount - Payment amount
   * @param {Object} paymentDetails - Payment details including date
   * @returns {Promise<Object>} Updated invoice
   */
  async recordAdditionalPayment(
    userType,
    invoiceId,
    paymentAmount,
    paymentDetails = {}
  ) {
    try {
      const invoice = await this.getById(userType, invoiceId);

      // Initialize paymentDetails if it doesn't exist (for PENDING invoices)
      if (!invoice.paymentDetails) {
        invoice.paymentDetails = {
          downPayment: 0,
          remainingBalance: invoice.grandTotal || invoice.totalAmount || 0,
          paymentMethod: PAYMENT_METHODS.CASH,
          paymentHistory: [],
        };
      }

      const currentPaid = parseFloat(invoice.paymentDetails.downPayment || 0);
      const additionalAmount = parseFloat(paymentAmount);
      const newTotalPaid = currentPaid + additionalAmount;
      const totalAmount = invoice.grandTotal || invoice.totalAmount || 0;
      const newRemainingBalance = Math.max(0, totalAmount - newTotalPaid);

      // Use provided payment date or current date
      const paymentDate =
        paymentDetails.paymentDate || new Date().toISOString();

      // Add to payment history
      const newPaymentRecord = {
        amount: additionalAmount,
        date: paymentDate,
        method: paymentDetails.paymentMethod || PAYMENT_METHODS.CASH,
        reference: paymentDetails.reference || "",
        recordedBy: paymentDetails.recordedBy,
        recordedByName: paymentDetails.recordedByName,
        type:
          invoice.paymentStatus === PAYMENT_STATUS.PENDING
            ? "pending_payment"
            : "additional_payment",
        notes: paymentDetails.notes || "",
      };

      const updates = {
        paymentDetails: {
          ...invoice.paymentDetails,
          downPayment: newTotalPaid,
          remainingBalance: newRemainingBalance,
          paymentHistory: [
            ...(invoice.paymentDetails.paymentHistory || []),
            newPaymentRecord,
          ],
        },
        updatedAt: new Date().toISOString(),
      };

      // If fully paid, set fullyPaid flag but KEEP original payment status for tracking
      if (newRemainingBalance === 0) {
        updates.fullyPaid = true;
        updates.paymentDate = paymentDate;
        // DON'T change paymentStatus - keep it as PENDING/FINANCE/BANK_TRANSFER for tracking
      }

      return await this.update(userType, invoiceId, updates);
    } catch (error) {
      console.error("Error recording additional payment:", error);
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
        updates.fullyPaid = true; // NEW - Set fullyPaid flag
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
          updates.fullyPaid = true; // NEW - Set fullyPaid flag instead of changing status
          updates.paymentDate = new Date().toISOString();
          // Keep paymentStatus as EMI for tracking purposes
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
          paymentMethod: paymentDetails.paymentMethod || PAYMENT_METHODS.CASH,
          transactionId: paymentDetails.transactionId || null,
          notes: paymentDetails.notes || "",
          recordedBy: paymentDetails.recordedBy || null,
          recordedByName: paymentDetails.recordedByName || null,
        },
      };

      // STEP 2: Calculate totals
      const originalTotal = invoice.grandTotal || invoice.totalAmount;
      const totalPaid = schedule
        .filter((emi) => emi.paid)
        .reduce((sum, emi) => sum + emi.paidAmount, 0);
      const remainingBalance = originalTotal - totalPaid;

      // STEP 3: Find unpaid installments and redistribute ONLY them
      const unpaidInstallments = schedule.filter((emi) => !emi.paid);

      if (unpaidInstallments.length > 0) {
        const equalAmount = remainingBalance / unpaidInstallments.length;

        unpaidInstallments.forEach((unpaidEmi, index) => {
          const scheduleIndex = schedule.findIndex(
            (emi) => emi.installmentNumber === unpaidEmi.installmentNumber
          );

          if (index === unpaidInstallments.length - 1) {
            // Last installment gets remainder to handle rounding
            const distributedSoFar =
              equalAmount * (unpaidInstallments.length - 1);
            schedule[scheduleIndex].amount =
              Math.round((remainingBalance - distributedSoFar) * 100) / 100;
          } else {
            schedule[scheduleIndex].amount =
              Math.round(equalAmount * 100) / 100;
          }
        });
      }

      // STEP 4: Update totals
      const allPaid = schedule.every((emi) => emi.paid);
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
        updates.fullyPaid = true; // NEW - Set fullyPaid flag instead of changing status
        updates.paymentDate = new Date().toISOString();
        // Keep paymentStatus as EMI for tracking purposes
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
   * Update installment due date with change tracking
   * @param {string} userType - User type
   * @param {string} invoiceId - Invoice ID
   * @param {number} installmentNumber - Installment number
   * @param {string} newDueDate - New due date
   * @param {Object} changeDetails - Change details (reason, changedBy, etc.)
   * @returns {Promise<Object>} Updated invoice
   */
  async updateInstallmentDueDate(
    userType,
    invoiceId,
    installmentNumber,
    newDueDate,
    changeDetails = {}
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

      const currentInstallment = schedule[installmentIndex];

      // Initialize due date change tracking if not exists
      if (!currentInstallment.dueDateChangeHistory) {
        currentInstallment.dueDateChangeHistory = [];
      }

      // Record the change in history
      const changeRecord = {
        previousDueDate: currentInstallment.dueDate,
        newDueDate: newDueDate,
        changedAt: new Date().toISOString(),
        changedBy: changeDetails.changedBy || null,
        changedByName: changeDetails.changedByName || null,
        reason: changeDetails.reason || "",
        notes: changeDetails.notes || "",
      };

      // Add to change history
      currentInstallment.dueDateChangeHistory.push(changeRecord);

      // Update installment with new due date and metadata
      schedule[installmentIndex] = {
        ...currentInstallment,
        dueDate: newDueDate,
        dueDateUpdated: true,
        dueDateUpdatedAt: new Date().toISOString(),
        dueDateChangeCount: currentInstallment.dueDateChangeHistory.length,
        lastDueDateChange: changeRecord,
        // Flag for multiple changes (3+ times)
        hasFrequentDueDateChanges:
          currentInstallment.dueDateChangeHistory.length >= 3,
      };

      // Update customer-level tracking for frequent due date changes
      let customerDueDateChangeFlags = invoice.customerDueDateChangeFlags || {};

      // Count total due date changes for this customer across all installments
      const totalCustomerChanges = schedule.reduce((total, inst) => {
        return total + (inst.dueDateChangeHistory?.length || 0);
      }, 0);

      customerDueDateChangeFlags = {
        totalChanges: totalCustomerChanges,
        hasFrequentChanges: totalCustomerChanges >= 3,
        lastChangeDate: new Date().toISOString(),
        flaggedForReview: totalCustomerChanges >= 5, // Flag for management review at 5+ changes
      };

      const updates = {
        emiDetails: {
          ...invoice.emiDetails,
          schedule,
        },
        customerDueDateChangeFlags,
        updatedAt: new Date().toISOString(),
      };

      return await this.update(userType, invoiceId, updates);
    } catch (error) {
      console.error("Error updating installment due date:", error);
      throw error;
    }
  }

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

      const totalAmount = invoice.grandTotal || invoice.totalAmount;
      const downPayment = invoice.emiDetails?.downPayment || 0; // Add down payment

      // Calculate actual amount paid (down payment + paid installments)
      const installmentsPaid = schedule
        .filter((emi) => emi.paid)
        .reduce((sum, emi) => sum + (emi.paidAmount || 0), 0);

      const paidAmount = downPayment + installmentsPaid; // Include down payment
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
        downPayment: Math.round(downPayment * 100) / 100, // Add to return
        emiAmount:
          Math.round(
            (invoice.emiDetails?.emiAmount || totalAmount - downPayment) * 100
          ) / 100,
        paidAmount: Math.round(paidAmount * 100) / 100,
        remainingAmount: Math.round(remainingAmount * 100) / 100,
        paymentPercentage: Math.round((paidAmount / totalAmount) * 100),
        nextDueInstallment,
        lastPaymentDate: invoice.emiDetails?.lastPaymentDate,
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
