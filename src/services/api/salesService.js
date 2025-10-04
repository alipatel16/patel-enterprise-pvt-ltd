import BaseService from "./baseService";
import {
  COLLECTIONS,
  PAYMENT_STATUS,
  DELIVERY_STATUS,
  getPaymentCategory,
  PAYMENT_METHODS,
} from "../../utils/constants/appConstants";
import { calculateItemWithGST } from "../../utils/helpers/gstCalculator";
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
   */
  cleanUndefinedValues(obj) {
    const cleaned = {};

    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const value = obj[key];

        if (value !== undefined && value !== null) {
          if (key === "bulkPricingDetails" && value === null) {
            continue;
          }

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
   * Generate unique invoice number with new format
   */
  async generateInvoiceNumber(userType, includeGST = true) {
    try {
      let prefix;
      if (userType === "electronics") {
        prefix = includeGST ? "EL_GST_" : "EL_NGST_";
      } else {
        prefix = includeGST ? "FN_GST_" : "FN_NGST_";
      }

      const allInvoices = await this.getAll(userType, {
        orderBy: "createdAt",
        orderDirection: "desc",
        limit: 1000,
      });

      let maxSequence = 0;

      if (allInvoices && allInvoices.length > 0) {
        allInvoices.forEach((invoice) => {
          if (
            invoice.invoiceNumber &&
            invoice.invoiceNumber.startsWith(prefix)
          ) {
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

      const newSequence = maxSequence + 1;
      const sequenceStr = String(newSequence).padStart(3, "0");

      return `${prefix}${sequenceStr}`;
    } catch (error) {
      console.error("Error generating invoice number:", error);
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
   * Create new invoice
   */
  async createInvoice(userType, invoiceData) {
    try {
      const invoiceNumber = await this.generateInvoiceNumber(
        userType,
        invoiceData.includeGST
      );

      let subtotal = 0;
      let totalGST = 0;
      let processedItems = [];

      if (invoiceData.items && invoiceData.items.length > 0) {
        if (
          invoiceData.bulkPricingDetails &&
          invoiceData.bulkPricingDetails.totalPrice > 0
        ) {
          const bulkDetails = invoiceData.bulkPricingDetails;

          if (!invoiceData.includeGST || bulkDetails.gstSlab === 0) {
            subtotal = bulkDetails.totalPrice;
            totalGST = 0;
          } else if (bulkDetails.isPriceInclusive) {
            const baseAmount =
              bulkDetails.totalPrice / (1 + bulkDetails.gstSlab / 100);
            subtotal = Math.round(baseAmount * 100) / 100;
            totalGST =
              Math.round((bulkDetails.totalPrice - baseAmount) * 100) / 100;
          } else {
            subtotal = bulkDetails.totalPrice;
            totalGST =
              Math.round(
                ((bulkDetails.totalPrice * bulkDetails.gstSlab) / 100) * 100
              ) / 100;
          }

          processedItems = invoiceData.items.map((item) => ({
            ...item,
            baseAmount: 0,
            gstAmount: 0,
            totalAmount: 0,
            bulkPricing: true,
            hsnCode: item.hsnCode || "",
          }));
        } else {
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

      const originalPaymentCategory = getPaymentCategory(
        invoiceData.paymentStatus,
        invoiceData.paymentDetails?.paymentMethod
      );

      const grandTotal = Math.round(subtotal + totalGST);
      
      // Calculate net payable (after exchange)
      const exchangeAmount = invoiceData.exchangeDetails?.hasExchange 
        ? parseFloat(invoiceData.exchangeDetails.exchangeAmount || 0)
        : 0;
      const netPayable = Math.max(0, grandTotal - exchangeAmount);

      const cleanInvoiceData = {
        invoiceNumber,
        saleDate: invoiceData.saleDate,
        company: invoiceData.company,
        customerId: invoiceData.customerId,
        customerName: invoiceData.customerName,
        customerPhone: invoiceData.customerPhone,
        customerAddress: invoiceData.customerAddress,
        customerState: invoiceData.customerState,
        customerGSTNumber: invoiceData.customerGSTNumber || "",
        salesPersonId: invoiceData.salesPersonId,
        salesPersonName: invoiceData.salesPersonName,
        items: processedItems,
        includeGST: invoiceData.includeGST,
        subtotal: Math.round(subtotal * 100) / 100,
        totalGST: Math.round(totalGST * 100) / 100,
        grandTotal: grandTotal,
        totalAmount: grandTotal,

        exchangeDetails: invoiceData.exchangeDetails?.hasExchange
          ? {
              hasExchange: true,
              exchangeAmount: exchangeAmount,
              itemReceived: invoiceData.exchangeDetails.itemReceived || false,
              exchangeDescription:
                invoiceData.exchangeDetails.exchangeDescription || "",
              exchangeReceivedDate: invoiceData.exchangeDetails.itemReceived
                ? new Date().toISOString()
                : null,
            }
          : null,

        // CRITICAL FIX: Net payable after exchange
        netPayable: netPayable,

        paymentStatus: invoiceData.paymentStatus || PAYMENT_STATUS.PENDING,
        deliveryStatus: invoiceData.deliveryStatus || DELIVERY_STATUS.PENDING,
        remarks: invoiceData.remarks || "",
        originalPaymentCategory: originalPaymentCategory,
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

      if (invoiceData.scheduledDeliveryDate) {
        cleanInvoiceData.scheduledDeliveryDate =
          invoiceData.scheduledDeliveryDate;
      }

      // CRITICAL FIX: Use netPayable for all payment calculations
      if (
        invoiceData.paymentStatus === PAYMENT_STATUS.FINANCE ||
        invoiceData.paymentStatus === PAYMENT_STATUS.BANK_TRANSFER ||
        invoiceData.paymentStatus === PAYMENT_STATUS.PENDING
      ) {
        if (invoiceData.paymentDetails) {
          const downPaymentAmount = parseFloat(
            invoiceData.paymentDetails.downPayment || 0
          );
          
          cleanInvoiceData.paymentDetails = {
            downPayment: downPaymentAmount,
            remainingBalance: Math.max(0, netPayable - downPaymentAmount),
            paymentMethod:
              invoiceData.paymentDetails.paymentMethod || PAYMENT_METHODS.CASH,
            bankName: invoiceData.paymentDetails.bankName || "",
            financeCompany: invoiceData.paymentDetails.financeCompany || "",
            paymentReference: invoiceData.paymentDetails.paymentReference || "",
            paymentHistory: downPaymentAmount > 0 ? [
              {
                amount: downPaymentAmount,
                date: new Date().toISOString(),
                method:
                  invoiceData.paymentDetails.paymentMethod ||
                  PAYMENT_METHODS.CASH,
                reference: invoiceData.paymentDetails.paymentReference || "",
                recordedBy: invoiceData.createdBy,
                recordedByName: invoiceData.createdByName,
                type: "down_payment",
              },
            ] : [],
          };
        }
        else {
          // If no payment details provided, initialize with netPayable as remaining balance
          cleanInvoiceData.paymentDetails = {
            downPayment: 0,
            remainingBalance: netPayable,
            paymentMethod: PAYMENT_METHODS.CASH,
            bankName: "",
            financeCompany: "",
            paymentReference: "",
            paymentHistory: [],
          };
        }
      }

      // CRITICAL FIX: EMI calculations based on netPayable
      if (
        invoiceData.paymentStatus === PAYMENT_STATUS.EMI &&
        invoiceData.emiDetails
      ) {
        const downPayment = parseFloat(
          invoiceData.paymentDetails?.downPayment || 0
        );
        const emiAmount = netPayable - downPayment;

        const emiDetails = {
          monthlyAmount: parseFloat(invoiceData.emiDetails.monthlyAmount || 0),
          numberOfInstallments: parseInt(
            invoiceData.emiDetails.numberOfInstallments || 1
          ),
          downPayment: downPayment,
          totalAmount: netPayable,
          emiAmount: emiAmount,
        };

        if (invoiceData.emiDetails.startDate) {
          emiDetails.startDate = invoiceData.emiDetails.startDate;

          if (
            invoiceData.emiDetails.schedule &&
            invoiceData.emiDetails.schedule.length > 0
          ) {
            emiDetails.schedule = invoiceData.emiDetails.schedule;
          }
        }

        cleanInvoiceData.emiDetails = emiDetails;

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

      if (processedItems && processedItems.length > 0) {
        processedItems.forEach(async (item) => {
          try {
            await productService.saveProductFromInvoiceItem(userType, item);
          } catch (error) {
            console.error("Error saving product:", error);
          }
        });
      }

      return await this.create(userType, cleanInvoiceData);
    } catch (error) {
      console.error("Error creating invoice:", error);
      throw error;
    }
  }

  async createSale(userType, saleData) {
    return await this.createInvoice(userType, saleData);
  }

  async getInvoiceById(userType, invoiceId) {
    try {
      return await this.getById(userType, invoiceId);
    } catch (error) {
      console.error("Error getting invoice:", error);
      throw error;
    }
  }

  /**
   * Update invoice - CRITICAL FIXES for exchange credit calculations
   */
  async updateInvoice(userType, invoiceId, updates) {
    try {
      const existingInvoice = await this.getById(userType, invoiceId);
      const cleanUpdates = this.cleanUndefinedValues(updates);

      if (cleanUpdates.invoiceNumber) {
        delete cleanUpdates.invoiceNumber;
      }

      if (updates.company) {
        cleanUpdates.company = updates.company;
      }

      // Handle exchange details updates
      if (updates.exchangeDetails !== undefined) {
        if (updates.exchangeDetails?.hasExchange) {
          cleanUpdates.exchangeDetails = {
            hasExchange: true,
            exchangeAmount: parseFloat(
              updates.exchangeDetails.exchangeAmount || 0
            ),
            itemReceived: updates.exchangeDetails.itemReceived || false,
            exchangeDescription:
              updates.exchangeDetails.exchangeDescription || "",
            exchangeReceivedDate: updates.exchangeDetails.itemReceived
              ? existingInvoice.exchangeDetails?.exchangeReceivedDate ||
                new Date().toISOString()
              : null,
          };

          const grandTotal =
            cleanUpdates.grandTotal || existingInvoice.grandTotal;
          cleanUpdates.netPayable = Math.max(
            0,
            grandTotal - cleanUpdates.exchangeDetails.exchangeAmount
          );
        } else {
          cleanUpdates.exchangeDetails = null;
          cleanUpdates.netPayable =
            cleanUpdates.grandTotal || existingInvoice.grandTotal;
        }
      }

      // If items changed, recalculate net payable with exchange
      if (cleanUpdates.items && cleanUpdates.grandTotal) {
        const exchangeAmount =
          cleanUpdates.exchangeDetails?.exchangeAmount ||
          existingInvoice.exchangeDetails?.exchangeAmount ||
          0;
        cleanUpdates.netPayable = Math.max(
          0,
          cleanUpdates.grandTotal - exchangeAmount
        );
      }

      const existingEmiDetails = existingInvoice.emiDetails;
      const hasExistingEmiSchedule = existingEmiDetails?.schedule?.length > 0;

      // Recalculate totals if items changed
      if (cleanUpdates.items) {
        let subtotal = 0;
        let totalGST = 0;
        const processedItems = [];

        if (
          cleanUpdates.bulkPricingDetails &&
          cleanUpdates.bulkPricingDetails.totalPrice > 0
        ) {
          const bulkDetails = cleanUpdates.bulkPricingDetails;

          if (!cleanUpdates.includeGST || bulkDetails.gstSlab === 0) {
            subtotal = bulkDetails.totalPrice;
            totalGST = 0;
          } else if (bulkDetails.isPriceInclusive) {
            const baseAmount =
              bulkDetails.totalPrice / (1 + bulkDetails.gstSlab / 100);
            subtotal = Math.round(baseAmount * 100) / 100;
            totalGST =
              Math.round((bulkDetails.totalPrice - baseAmount) * 100) / 100;
          } else {
            subtotal = bulkDetails.totalPrice;
            totalGST =
              Math.round(
                ((bulkDetails.totalPrice * bulkDetails.gstSlab) / 100) * 100
              ) / 100;
          }

          cleanUpdates.items.forEach((item) => {
            processedItems.push({
              ...item,
              baseAmount: 0,
              gstAmount: 0,
              totalAmount: 0,
              bulkPricing: true,
            });
          });

          cleanUpdates.bulkPricingApplied = true;
        } else {
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

          if (cleanUpdates.bulkPricingDetails === undefined) {
            cleanUpdates.bulkPricingApplied = false;
          }
        }

        cleanUpdates.items = processedItems;
        cleanUpdates.subtotal = Math.round(subtotal * 100) / 100;
        cleanUpdates.totalGST = Math.round(totalGST * 100) / 100;
        cleanUpdates.grandTotal = Math.round(subtotal + totalGST);
        cleanUpdates.totalAmount = cleanUpdates.grandTotal;

        // Recalculate netPayable with exchange
        const exchangeAmount =
          cleanUpdates.exchangeDetails?.exchangeAmount ||
          existingInvoice.exchangeDetails?.exchangeAmount ||
          0;
        cleanUpdates.netPayable = Math.max(0, cleanUpdates.grandTotal - exchangeAmount);

        // CRITICAL FIX: Preserve EMI schedule with net payable
        if (hasExistingEmiSchedule && existingInvoice.paymentStatus === "emi") {
          const newTotal = cleanUpdates.netPayable;
          const existingSchedule = [...existingEmiDetails.schedule];

          const downPayment = parseFloat(
            existingInvoice.emiDetails?.downPayment || 0
          );
          const newEmiAmount = newTotal - downPayment;

          const totalPaid = existingSchedule
            .filter((emi) => emi.paid)
            .reduce((sum, emi) => sum + (emi.paidAmount || emi.amount || 0), 0);

          const newRemainingBalance = newEmiAmount - totalPaid;
          const unpaidInstallments = existingSchedule.filter(
            (emi) => !emi.paid
          );

          if (unpaidInstallments.length > 0 && newRemainingBalance > 0) {
            const equalAmount = newRemainingBalance / unpaidInstallments.length;

            unpaidInstallments.forEach((unpaidEmi, index) => {
              const scheduleIndex = existingSchedule.findIndex(
                (emi) => emi.installmentNumber === unpaidEmi.installmentNumber
              );

              if (index === unpaidInstallments.length - 1) {
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
          }

          let updatedEmiDetails = {
            ...existingEmiDetails,
            schedule: existingSchedule,
            totalPaid: Math.round(totalPaid * 100) / 100,
            totalRemaining: Math.round(newRemainingBalance * 100) / 100,
            emiAmount: newEmiAmount,
            totalAmount: newTotal,
          };

          if (
            existingEmiDetails.lastPaymentDate !== undefined &&
            existingEmiDetails.lastPaymentDate !== null
          ) {
            updatedEmiDetails.lastPaymentDate =
              existingEmiDetails.lastPaymentDate;
          }

          cleanUpdates.emiDetails = updatedEmiDetails;
        }
      }

      // CRITICAL FIX: Payment details with netPayable
      if (cleanUpdates.paymentDetails) {
        const downPaymentAmount = parseFloat(
          cleanUpdates.paymentDetails.downPayment || 0
        );
        const netPayableAmount = 
          cleanUpdates.netPayable || 
          existingInvoice.netPayable || 
          cleanUpdates.grandTotal || 
          existingInvoice.grandTotal;
        
        cleanUpdates.paymentDetails = {
          downPayment: downPaymentAmount,
          remainingBalance: Math.max(0, netPayableAmount - downPaymentAmount),
          paymentMethod: cleanUpdates.paymentDetails.paymentMethod || "cash",
          bankName: cleanUpdates.paymentDetails.bankName || "",
          financeCompany: cleanUpdates.paymentDetails.financeCompany || "",
          paymentReference: cleanUpdates.paymentDetails.paymentReference || "",
          paymentHistory:
            cleanUpdates.paymentDetails.paymentHistory ||
            existingInvoice.paymentDetails?.paymentHistory ||
            [],
        };
      }

      // EMI down payment changes
      if (
        hasExistingEmiSchedule &&
        existingInvoice.paymentStatus === "emi" &&
        cleanUpdates.paymentDetails &&
        cleanUpdates.paymentDetails.downPayment !== undefined
      ) {
        const newDownPayment = parseFloat(
          cleanUpdates.paymentDetails.downPayment || 0
        );
        const existingDownPayment = parseFloat(
          existingInvoice.emiDetails?.downPayment || 0
        );

        if (newDownPayment !== existingDownPayment) {
          if (!cleanUpdates.emiDetails) {
            cleanUpdates.emiDetails = { ...existingInvoice.emiDetails };
          }

          const totalAmount =
            cleanUpdates.netPayable || 
            existingInvoice.netPayable ||
            cleanUpdates.grandTotal || 
            existingInvoice.grandTotal || 
            0;
          const existingSchedule =
            cleanUpdates.emiDetails.schedule ||
            existingInvoice.emiDetails.schedule ||
            [];
          const installmentsPaid = existingSchedule
            .filter((emi) => emi.paid)
            .reduce((sum, emi) => sum + (emi.paidAmount || emi.amount || 0), 0);

          const newEmiAmount = totalAmount - newDownPayment;
          const newRemainingBalance =
            totalAmount - newDownPayment - installmentsPaid;

          if (newDownPayment > existingDownPayment) {
            const additionalPayment = newDownPayment - existingDownPayment;

            const newPaymentRecord = {
              amount: additionalPayment,
              date: new Date().toISOString(),
              method: cleanUpdates.paymentDetails.paymentMethod || "cash",
              reference: cleanUpdates.paymentDetails.paymentReference || "",
              recordedBy: updates.updatedBy,
              recordedByName: updates.updatedByName,
              type: "emi_down_payment_adjustment",
              notes: `Additional down payment: ${existingDownPayment} → ${newDownPayment}`,
            };

            cleanUpdates.paymentDetails.paymentHistory = [
              ...(cleanUpdates.paymentDetails.paymentHistory || []),
              newPaymentRecord,
            ];
          }

          cleanUpdates.emiDetails.downPayment = newDownPayment;
          cleanUpdates.emiDetails.totalAmount = totalAmount;
          cleanUpdates.emiDetails.emiAmount = newEmiAmount;
          cleanUpdates.emiDetails.totalRemaining = Math.max(
            0,
            newRemainingBalance
          );

          const unpaidInstallments = existingSchedule.filter(
            (emi) => !emi.paid
          );

          if (unpaidInstallments.length > 0 && newRemainingBalance > 0) {
            const equalAmount = newRemainingBalance / unpaidInstallments.length;

            unpaidInstallments.forEach((unpaidEmi, index) => {
              const scheduleIndex = existingSchedule.findIndex(
                (emi) => emi.installmentNumber === unpaidEmi.installmentNumber
              );

              if (index === unpaidInstallments.length - 1) {
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

            cleanUpdates.emiDetails.schedule = existingSchedule;
          }
        }
      }

      // EMI monthly amount changes
      if (
        hasExistingEmiSchedule &&
        existingInvoice.paymentStatus === "emi" &&
        updates.emiDetails?.monthlyAmount !== undefined
      ) {
        const newMonthlyAmount = parseFloat(
          updates.emiDetails.monthlyAmount || 0
        );
        const existingMonthlyAmount = parseFloat(
          existingInvoice.emiDetails?.monthlyAmount || 0
        );

        if (
          newMonthlyAmount !== existingMonthlyAmount &&
          newMonthlyAmount > 0
        ) {
          if (!cleanUpdates.emiDetails) {
            cleanUpdates.emiDetails = { ...existingInvoice.emiDetails };
          }

          const totalAmount =
            cleanUpdates.netPayable ||
            existingInvoice.netPayable ||
            cleanUpdates.grandTotal || 
            existingInvoice.grandTotal || 
            0;
          const downPayment = parseFloat(
            cleanUpdates.emiDetails.downPayment ||
              existingInvoice.emiDetails?.downPayment ||
              0
          );
          const emiAmount = totalAmount - downPayment;

          const schedule = [
            ...(cleanUpdates.emiDetails.schedule ||
              existingInvoice.emiDetails.schedule ||
              []),
          ];

          const installmentsPaid = schedule
            .filter((emi) => emi.paid)
            .reduce((sum, emi) => sum + (emi.paidAmount || 0), 0);
          const remainingBalance = emiAmount - installmentsPaid;

          const newNumberOfInstallments = Math.ceil(
            remainingBalance / newMonthlyAmount
          );

          const paidInstallments = schedule.filter((emi) => emi.paid);
          const unpaidInstallments = schedule.filter((emi) => !emi.paid);

          const newSchedule = [...paidInstallments];

          const startDate = existingInvoice.emiDetails.startDate
            ? new Date(existingInvoice.emiDetails.startDate)
            : new Date();
          const nextInstallmentNumber = paidInstallments.length + 1;

          for (let i = 0; i < newNumberOfInstallments; i++) {
            const installmentNumber = nextInstallmentNumber + i;
            const dueDate = new Date(startDate);
            dueDate.setMonth(dueDate.getMonth() + (installmentNumber - 1));

            let amount;
            if (i === newNumberOfInstallments - 1) {
              const distributedSoFar =
                newMonthlyAmount * (newNumberOfInstallments - 1);
              amount =
                Math.round((remainingBalance - distributedSoFar) * 100) / 100;
            } else {
              amount = Math.round(newMonthlyAmount * 100) / 100;
            }

            const existingUnpaid = unpaidInstallments.find(
              (emi) => emi.installmentNumber === installmentNumber
            );

            newSchedule.push({
              installmentNumber,
              dueDate: existingUnpaid?.dueDate || dueDate.toISOString(),
              amount,
              paid: false,
              ...(existingUnpaid?.dueDateChangeHistory && {
                dueDateChangeHistory: existingUnpaid.dueDateChangeHistory,
              }),
              ...(existingUnpaid?.dueDateUpdated && {
                dueDateUpdated: existingUnpaid.dueDateUpdated,
              }),
              ...(existingUnpaid?.dueDateUpdatedAt && {
                dueDateUpdatedAt: existingUnpaid.dueDateUpdatedAt,
              }),
              ...(existingUnpaid?.dueDateChangeCount && {
                dueDateChangeCount: existingUnpaid.dueDateChangeCount,
              }),
              ...(existingUnpaid?.lastDueDateChange && {
                lastDueDateChange: existingUnpaid.lastDueDateChange,
              }),
              ...(existingUnpaid?.hasFrequentDueDateChanges && {
                hasFrequentDueDateChanges:
                  existingUnpaid.hasFrequentDueDateChanges,
              }),
            });
          }

          newSchedule.sort((a, b) => a.installmentNumber - b.installmentNumber);

          cleanUpdates.emiDetails = {
            ...existingInvoice.emiDetails,
            ...cleanUpdates.emiDetails,
            monthlyAmount: newMonthlyAmount,
            schedule: newSchedule,
            numberOfInstallments: newSchedule.length,
            totalRemaining: Math.round(remainingBalance * 100) / 100,
            emiAmount: emiAmount,
            totalAmount: totalAmount,
            downPayment: downPayment,
          };
        }
      }

      if (
        existingInvoice.customerDueDateChangeFlags &&
        !cleanUpdates.customerDueDateChangeFlags
      ) {
        cleanUpdates.customerDueDateChangeFlags =
          existingInvoice.customerDueDateChangeFlags;
      }

      cleanUpdates.updatedAt = new Date().toISOString();

      return await this.update(userType, invoiceId, cleanUpdates);
    } catch (error) {
      throw error;
    }
  }

  async deleteInvoice(userType, invoiceId) {
    try {
      await this.delete(userType, invoiceId);
      return true;
    } catch (error) {
      console.error("Error deleting invoice:", error);
      throw error;
    }
  }

  async updateSale(userType, saleId, updates) {
    return await this.updateInvoice(userType, saleId, updates);
  }

  async getSales(userType, filters = {}) {
    try {
      const sales = await this.getAll(userType, {
        orderBy: "createdAt",
        orderDirection: "desc",
      });
      return sales;
    } catch (error) {
      console.error("Error getting sales:", error);
      throw error;
    }
  }

  async searchSales(userType, searchTerm) {
    try {
      const allSales = await this.getAll(userType, {
        orderBy: "createdAt",
        orderDirection: "desc",
        limit: 100,
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

      const calculateActualAmountPaid = (sale) => {
        if (
          sale.paymentStatus === PAYMENT_STATUS.FINANCE ||
          sale.paymentStatus === PAYMENT_STATUS.BANK_TRANSFER ||
          sale.paymentStatus === PAYMENT_STATUS.PENDING
        ) {
          return sale.paymentDetails?.downPayment || 0;
        }
        if (sale.paymentStatus === PAYMENT_STATUS.PAID || sale.fullyPaid) {
          return sale.netPayable || sale.grandTotal || sale.totalAmount || 0;
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
          sale.netPayable || sale.grandTotal || sale.totalAmount || 0;
        statsByCategory[category].paidAmount += calculateActualAmountPaid(sale);
      });

      const stats = {
        totalSales: sales.length,
        totalAmount: sales.reduce(
          (sum, sale) => sum + (sale.netPayable || sale.grandTotal || sale.totalAmount || 0),
          0
        ),
        totalAmountPaid: sales.reduce(
          (sum, sale) => sum + calculateActualAmountPaid(sale),
          0
        ),
        todaysSales: todaysSales.length,
        todaysAmount: todaysSales.reduce(
          (sum, sale) => sum + (sale.netPayable || sale.grandTotal || sale.totalAmount || 0),
          0
        ),
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
        paidInvoices: sales.filter(
          (sale) => sale.paymentStatus === PAYMENT_STATUS.PAID || sale.fullyPaid
        ).length,
        emiInvoices: sales.filter(
          (sale) => sale.paymentStatus === PAYMENT_STATUS.EMI
        ).length,
        financeInvoices: sales.filter(
          (sale) => sale.paymentStatus === PAYMENT_STATUS.FINANCE
        ).length,
        bankTransferInvoices: sales.filter(
          (sale) => sale.paymentStatus === PAYMENT_STATUS.BANK_TRANSFER
        ).length,
        outstandingAmount: sales.reduce((sum, sale) => {
          const totalAmount = sale.netPayable || sale.grandTotal || sale.totalAmount || 0;
          const paidAmount = calculateActualAmountPaid(sale);
          return sum + Math.max(0, totalAmount - paidAmount);
        }, 0),
        statsByCategory,
      };

      return stats;
    } catch (error) {
      console.error("Error getting sales stats:", error);
      throw error;
    }
  }

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
   * CRITICAL FIX: Record additional payment using netPayable
   */
  async recordAdditionalPayment(
    userType,
    invoiceId,
    paymentAmount,
    paymentDetails = {}
  ) {
    try {
      const invoice = await this.getById(userType, invoiceId);

      const totalAmount = invoice.netPayable || invoice.grandTotal || invoice.totalAmount || 0;

      if (!invoice.paymentDetails) {
        invoice.paymentDetails = {
          downPayment: 0,
          remainingBalance: totalAmount,
          paymentMethod: PAYMENT_METHODS.CASH,
          paymentHistory: [],
        };
      }

      const currentPaid = parseFloat(invoice.paymentDetails.downPayment || 0);
      const additionalAmount = parseFloat(paymentAmount);
      const newTotalPaid = currentPaid + additionalAmount;
      const newRemainingBalance = Math.max(0, totalAmount - newTotalPaid);

      const paymentDate =
        paymentDetails.paymentDate || new Date().toISOString();

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

      if (newRemainingBalance === 0) {
        updates.fullyPaid = true;
        updates.paymentDate = paymentDate;
      }

      return await this.update(userType, invoiceId, updates);
    } catch (error) {
      console.error("Error recording additional payment:", error);
      throw error;
    }
  }

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
        updates.fullyPaid = true;
      }

      return await this.updateInvoice(userType, invoiceId, updates);
    } catch (error) {
      console.error("Error updating payment status:", error);
      throw error;
    }
  }

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

        const allPaid = schedule.every((emi) => emi.paid);
        if (allPaid) {
          updates.fullyPaid = true;
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
   * CRITICAL FIX: Record installment payment using netPayable
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

      const installment = schedule[installmentIndex];
      const paymentAmountNum = parseFloat(paymentAmount);

      const alreadyPaid = installment.paidAmount || 0;
      const installmentAmount = installment.amount || 0;
      const totalPaidNow = alreadyPaid + paymentAmountNum;

      let excessAmount = 0;

      if (totalPaidNow >= installmentAmount) {
        excessAmount = totalPaidNow - installmentAmount;

        schedule[installmentIndex] = {
          ...installment,
          paid: true,
          paidAmount: installmentAmount,
          partiallyPaid: false,
          remainingAmount: 0,
          paymentDate: new Date().toISOString(),
          lastPaymentDate: new Date().toISOString(),
          paymentHistory: [
            ...(installment.paymentHistory || []),
            {
              amount: paymentAmountNum,
              paymentDate: new Date().toISOString(),
              paymentMethod:
                paymentDetails.paymentMethod || PAYMENT_METHODS.CASH,
              transactionId: paymentDetails.transactionId || null,
              notes: paymentDetails.notes || "",
              recordedBy: paymentDetails.recordedBy || null,
              recordedByName: paymentDetails.recordedByName || null,
              cumulativePaid: totalPaidNow,
            },
          ],
        };
      } else {
        schedule[installmentIndex] = {
          ...installment,
          paid: false,
          paidAmount: totalPaidNow,
          partiallyPaid: true,
          remainingAmount: installmentAmount - totalPaidNow,
          lastPaymentDate: new Date().toISOString(),
          paymentHistory: [
            ...(installment.paymentHistory || []),
            {
              amount: paymentAmountNum,
              paymentDate: new Date().toISOString(),
              paymentMethod:
                paymentDetails.paymentMethod || PAYMENT_METHODS.CASH,
              transactionId: paymentDetails.transactionId || null,
              notes: paymentDetails.notes || "",
              recordedBy: paymentDetails.recordedBy || null,
              recordedByName: paymentDetails.recordedByName || null,
              cumulativePaid: totalPaidNow,
            },
          ],
        };
      }

      if (excessAmount > 0) {
        let remainingExcess = excessAmount;

        for (let i = installmentIndex + 1; i < schedule.length; i++) {
          if (remainingExcess <= 0) break;

          const emi = schedule[i];
          if (emi.paid) continue;

          const remaining = emi.amount - (emi.paidAmount || 0);

          if (remainingExcess >= remaining) {
            schedule[i] = {
              ...emi,
              paid: true,
              paidAmount: emi.amount,
              partiallyPaid: false,
              remainingAmount: 0,
              paymentDate: new Date().toISOString(),
              lastPaymentDate: new Date().toISOString(),
              paymentHistory: [
                ...(emi.paymentHistory || []),
                {
                  amount: remaining,
                  paymentDate: new Date().toISOString(),
                  paymentMethod:
                    paymentDetails.paymentMethod || PAYMENT_METHODS.CASH,
                  notes: "Auto-adjusted from overpayment",
                },
              ],
            };
            remainingExcess -= remaining;
          } else {
            schedule[i] = {
              ...emi,
              paid: false,
              partiallyPaid: true,
              paidAmount: (emi.paidAmount || 0) + remainingExcess,
              remainingAmount:
                emi.amount - ((emi.paidAmount || 0) + remainingExcess),
              lastPaymentDate: new Date().toISOString(),
              paymentHistory: [
                ...(emi.paymentHistory || []),
                {
                  amount: remainingExcess,
                  paymentDate: new Date().toISOString(),
                  paymentMethod:
                    paymentDetails.paymentMethod || PAYMENT_METHODS.CASH,
                  notes: "Auto-adjusted from overpayment",
                },
              ],
            };
            remainingExcess = 0;
          }
        }
      }

      const downPayment = invoice.emiDetails?.downPayment || 0;
      const originalTotal = invoice.netPayable || invoice.grandTotal || invoice.totalAmount;

      const totalPaid =
        downPayment +
        schedule.reduce((sum, emi) => {
          return sum + (emi.paidAmount || 0);
        }, 0);

      const remainingBalance = Math.max(0, originalTotal - totalPaid);

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
        updates.fullyPaid = true;
        updates.paymentDate = new Date().toISOString();
      }

      return await this.update(userType, invoiceId, updates);
    } catch (error) {
      console.error("Error recording installment payment:", error);
      throw error;
    }
  }

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

      if (!currentInstallment.dueDateChangeHistory) {
        currentInstallment.dueDateChangeHistory = [];
      }

      const changeRecord = {
        previousDueDate: currentInstallment.dueDate,
        newDueDate: newDueDate,
        changedAt: new Date().toISOString(),
        changedBy: changeDetails.changedBy || null,
        changedByName: changeDetails.changedByName || null,
        reason: changeDetails.reason || "",
        notes: changeDetails.notes || "",
      };

      currentInstallment.dueDateChangeHistory.push(changeRecord);

      schedule[installmentIndex] = {
        ...currentInstallment,
        dueDate: newDueDate,
        dueDateUpdated: true,
        dueDateUpdatedAt: new Date().toISOString(),
        dueDateChangeCount: currentInstallment.dueDateChangeHistory.length,
        lastDueDateChange: changeRecord,
        hasFrequentDueDateChanges:
          currentInstallment.dueDateChangeHistory.length >= 3,
      };

      let customerDueDateChangeFlags = invoice.customerDueDateChangeFlags || {};

      const totalCustomerChanges = schedule.reduce((total, inst) => {
        return total + (inst.dueDateChangeHistory?.length || 0);
      }, 0);

      customerDueDateChangeFlags = {
        totalChanges: totalCustomerChanges,
        hasFrequentChanges: totalCustomerChanges >= 3,
        lastChangeDate: new Date().toISOString(),
        flaggedForReview: totalCustomerChanges >= 5,
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
   * CRITICAL FIX: Get EMI summary using netPayable
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

      const totalAmount = invoice.netPayable || invoice.grandTotal || invoice.totalAmount;
      const downPayment = invoice.emiDetails?.downPayment || 0;

      const installmentsPaid = schedule
        .filter((emi) => emi.paid)
        .reduce((sum, emi) => sum + (emi.paidAmount || 0), 0);

      const paidAmount = downPayment + installmentsPaid;
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
        downPayment: Math.round(downPayment * 100) / 100,
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

  async updateExchangeItemStatus(
    userType,
    invoiceId,
    itemReceived,
    receivedBy,
    receivedByName
  ) {
    try {
      const invoice = await this.getById(userType, invoiceId);

      if (!invoice.exchangeDetails?.hasExchange) {
        throw new Error("Invoice does not have exchange details");
      }

      const updates = {
        exchangeDetails: {
          ...invoice.exchangeDetails,
          itemReceived,
          exchangeReceivedDate: itemReceived ? new Date().toISOString() : null,
          receivedBy: itemReceived ? receivedBy : null,
          receivedByName: itemReceived ? receivedByName : null,
        },
        updatedAt: new Date().toISOString(),
      };

      return await this.update(userType, invoiceId, updates);
    } catch (error) {
      console.error("Error updating exchange item status:", error);
      throw error;
    }
  }

  async getPendingExchanges(userType) {
    try {
      const allSales = await this.getAll(userType, {
        orderBy: "createdAt",
        orderDirection: "desc",
      });

      return allSales.filter(
        (sale) =>
          sale.exchangeDetails?.hasExchange &&
          !sale.exchangeDetails?.itemReceived
      );
    } catch (error) {
      console.error("Error getting pending exchanges:", error);
      throw error;
    }
  }
}

const salesService = new SalesService();
export default salesService;