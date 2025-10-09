// src/services/api/salesService.js
// COMPLETE WORKING VERSION - All methods included

import BaseService from "./baseService";
import productService from "./productService";
import { calculateItemWithGST } from "../../utils/helpers/gstCalculator";
import {
  PAYMENT_STATUS,
  PAYMENT_METHODS,
  DELIVERY_STATUS,
  getPaymentCategory,
} from "../../utils/constants/appConstants";

/**
 * Complete Sales Service with all utility methods
 */
class SalesService extends BaseService {
  constructor() {
    super("sales");
  }

  /**
   * UTILITY: Clean undefined values from object
   * This method was missing!
   */
  cleanUndefinedValues(obj) {
    if (!obj || typeof obj !== "object") return obj;

    const cleaned = {};
    Object.keys(obj).forEach((key) => {
      const value = obj[key];
      if (value !== undefined && value !== null) {
        if (
          typeof value === "object" &&
          !Array.isArray(value) &&
          !(value instanceof Date)
        ) {
          cleaned[key] = this.cleanUndefinedValues(value);
        } else {
          cleaned[key] = value;
        }
      }
    });
    return cleaned;
  }

  /**
   * 🔥 CRITICAL: Handle payment status transitions intelligently
   */
  _handlePaymentStatusTransition(existingInvoice, updates) {
    const oldStatus = existingInvoice.paymentStatus;
    const newStatus = updates.paymentStatus;

    if (!newStatus || oldStatus === newStatus) {
      return updates;
    }

    console.log(`💳 Payment status transition: ${oldStatus} → ${newStatus}`);

    const totalAmount =
      updates.netPayable ||
      existingInvoice.netPayable ||
      updates.grandTotal ||
      existingInvoice.grandTotal ||
      0;

    // PAID/EMI/FINANCE/BANK → PENDING: Clear all payment data
    if (
      newStatus === PAYMENT_STATUS.PENDING &&
      [
        PAYMENT_STATUS.PAID,
        PAYMENT_STATUS.EMI,
        PAYMENT_STATUS.FINANCE,
        PAYMENT_STATUS.BANK_TRANSFER,
      ].includes(oldStatus)
    ) {
      console.log("🧹 Resetting all payment data (transition to PENDING)");

      return {
        ...updates,
        paymentStatus: PAYMENT_STATUS.PENDING,
        paymentDetails: {
          downPayment: 0,
          remainingBalance: totalAmount,
          paymentMethod:
            updates.paymentDetails?.paymentMethod || PAYMENT_METHODS.CASH,
          paymentHistory: [],
          bankName: "",
          financeCompany: "",
          paymentReference: "",
        },
        emiDetails: null,
        fullyPaid: false,
        paymentDate: null,
        statusChangeHistory: [
          ...(existingInvoice.statusChangeHistory || []),
          {
            from: oldStatus,
            to: newStatus,
            changedAt: new Date().toISOString(),
            changedBy: updates.updatedBy,
            changedByName: updates.updatedByName,
            reason:
              "Payment status reset to pending - all payment data cleared",
          },
        ],
      };
    }

    // ANY STATUS → PAID
    if (newStatus === PAYMENT_STATUS.PAID) {
      console.log("✅ Setting up PAID status");

      return {
        ...updates,
        paymentStatus: PAYMENT_STATUS.PAID,
        paymentDetails: {
          downPayment: totalAmount,
          remainingBalance: 0,
          paymentMethod:
            updates.paymentDetails?.paymentMethod || PAYMENT_METHODS.CASH,
          paymentReference: updates.paymentDetails?.paymentReference || "",
          paymentHistory: updates.paymentDetails?.paymentHistory || [],
        },
        fullyPaid: true,
        paymentDate: updates.paymentDate || new Date().toISOString(),
        emiDetails: null,
        statusChangeHistory: [
          ...(existingInvoice.statusChangeHistory || []),
          {
            from: oldStatus,
            to: newStatus,
            changedAt: new Date().toISOString(),
            changedBy: updates.updatedBy,
            changedByName: updates.updatedByName,
            reason: "Payment marked as paid in full",
          },
        ],
      };
    }

    // ANY STATUS → EMI
    if (newStatus === PAYMENT_STATUS.EMI) {
      console.log("📅 Setting up EMI status");

      const downPayment = parseFloat(updates.paymentDetails?.downPayment || 0);

      return {
        ...updates,
        paymentStatus: PAYMENT_STATUS.EMI,
        paymentDetails: {
          downPayment: downPayment,
          remainingBalance: totalAmount - downPayment,
          paymentMethod:
            updates.paymentDetails?.paymentMethod || PAYMENT_METHODS.CASH,
          paymentHistory: updates.paymentDetails?.paymentHistory || [],
        },
        fullyPaid: false,
        emiDetails: updates.emiDetails ||
          existingInvoice.emiDetails || {
            monthlyAmount: 0,
            numberOfInstallments: 1,
            schedule: [],
          },
        statusChangeHistory: [
          ...(existingInvoice.statusChangeHistory || []),
          {
            from: oldStatus,
            to: newStatus,
            changedAt: new Date().toISOString(),
            changedBy: updates.updatedBy,
            changedByName: updates.updatedByName,
            reason: "Payment changed to EMI",
          },
        ],
      };
    }

    return {
      ...updates,
      statusChangeHistory: [
        ...(existingInvoice.statusChangeHistory || []),
        {
          from: oldStatus,
          to: newStatus,
          changedAt: new Date().toISOString(),
          changedBy: updates.updatedBy,
          changedByName: updates.updatedByName,
        },
      ],
    };
  }

  /**
   * 🔄 SMART EMI RECALCULATION - FIXED VERSION
   * Now properly handles down payment changes and preserves payment history
   */
  _recalculateEMISchedule(existingInvoice, updates) {
    const hasEMISchedule = existingInvoice.emiDetails?.schedule?.length > 0;

    if (
      !hasEMISchedule ||
      existingInvoice.paymentStatus !== PAYMENT_STATUS.EMI
    ) {
      return updates;
    }

    console.log("🔄 Recalculating EMI schedule...");

    const oldTotal = existingInvoice.netPayable || existingInvoice.grandTotal;
    const newTotal = updates.netPayable || updates.grandTotal || oldTotal;

    const existingSchedule = [...existingInvoice.emiDetails.schedule];
    const paidInstallments = existingSchedule.filter((emi) => emi.paid);
    const unpaidInstallments = existingSchedule.filter((emi) => !emi.paid);

    const totalPaidInEMIs = paidInstallments.reduce(
      (sum, emi) => sum + (emi.paidAmount || emi.amount),
      0
    );

    const oldDownPayment = existingInvoice.emiDetails?.downPayment || 0;

    // 🔥 CRITICAL FIX: Check if down payment is being changed
    let newDownPayment = oldDownPayment;
    let downPaymentChanged = false;

    if (updates.emiDetails?.downPayment !== undefined) {
      newDownPayment = parseFloat(updates.emiDetails.downPayment);
      downPaymentChanged = Math.abs(newDownPayment - oldDownPayment) >= 0.01;
    } else if (updates.paymentDetails?.downPayment !== undefined) {
      newDownPayment = parseFloat(updates.paymentDetails.downPayment);
      downPaymentChanged = Math.abs(newDownPayment - oldDownPayment) >= 0.01;
    }

    console.log(
      `💰 Down Payment: Old=₹${oldDownPayment}, New=₹${newDownPayment}, Changed=${downPaymentChanged}`
    );

    // 🔥 CRITICAL FIX: Handle down payment changes in payment history
    if (downPaymentChanged) {
      console.log("💳 Down payment changed - updating payment history...");

      // Initialize payment details if not exists
      if (!updates.paymentDetails) {
        updates.paymentDetails = {
          ...existingInvoice.paymentDetails,
          paymentHistory: [
            ...(existingInvoice.paymentDetails?.paymentHistory || []),
          ],
        };
      }

      // Preserve existing payment history
      const existingPaymentHistory =
        existingInvoice.paymentDetails?.paymentHistory || [];

      if (newDownPayment > oldDownPayment) {
        // DOWN PAYMENT INCREASED - Add additional payment record
        const additionalAmount = newDownPayment - oldDownPayment;

        console.log(
          `✅ Adding additional down payment record: ₹${additionalAmount}`
        );

        const newPaymentRecord = {
          amount: additionalAmount,
          date: new Date().toISOString(),
          method:
            updates.paymentDetails?.paymentMethod ||
            existingInvoice.paymentDetails?.paymentMethod ||
            PAYMENT_METHODS.CASH,
          reference: updates.paymentDetails?.paymentReference || "",
          recordedBy: updates.updatedBy,
          recordedByName: updates.updatedByName,
          type: "emi_down_payment_additional",
          notes: `Additional down payment (₹${oldDownPayment} → ₹${newDownPayment})`,
        };

        updates.paymentDetails.paymentHistory = [
          ...existingPaymentHistory,
          newPaymentRecord,
        ];
      } else if (newDownPayment < oldDownPayment) {
        // DOWN PAYMENT DECREASED - Add reversal/adjustment record
        const reductionAmount = oldDownPayment - newDownPayment;

        console.log(
          `⚠️ Down payment reduced by ₹${reductionAmount} - adding adjustment record`
        );

        const adjustmentRecord = {
          amount: -reductionAmount, // Negative amount for reduction
          date: new Date().toISOString(),
          method:
            updates.paymentDetails?.paymentMethod ||
            existingInvoice.paymentDetails?.paymentMethod ||
            PAYMENT_METHODS.CASH,
          reference: updates.paymentDetails?.paymentReference || "",
          recordedBy: updates.updatedBy,
          recordedByName: updates.updatedByName,
          type: "emi_down_payment_adjustment",
          notes: `Down payment adjusted (₹${oldDownPayment} → ₹${newDownPayment})`,
        };

        updates.paymentDetails.paymentHistory = [
          ...existingPaymentHistory,
          adjustmentRecord,
        ];
      }

      // Update payment details with new down payment
      updates.paymentDetails.downPayment = newDownPayment;
    }

    // Calculate totals
    const totalAlreadyPaid = newDownPayment + totalPaidInEMIs;
    const remainingBalance = Math.max(0, newTotal - totalAlreadyPaid);

    console.log(
      `📊 Total: ₹${newTotal}, Paid: ₹${totalAlreadyPaid}, Remaining: ₹${remainingBalance}`
    );

    // Check if amount changed significantly
    const amountChanged = Math.abs(newTotal - oldTotal) >= 1;

    if (!amountChanged && !downPaymentChanged) {
      console.log("✓ No significant changes, preserving EMI schedule");
      return updates;
    }

    if (remainingBalance === 0) {
      console.log("✅ All payments complete!");
      return {
        ...updates,
        fullyPaid: true,
        paymentDate: new Date().toISOString(),
        emiDetails: {
          ...existingInvoice.emiDetails,
          ...updates.emiDetails,
          schedule: paidInstallments,
          downPayment: newDownPayment,
          emiAmount: 0,
          totalAmount: newTotal,
          totalRemaining: 0,
        },
      };
    }

    const numberOfUnpaidInstallments = unpaidInstallments.length;
    const monthlyAmount =
      updates.emiDetails?.monthlyAmount ||
      existingInvoice.emiDetails.monthlyAmount;

    let newSchedule = [];

    if (monthlyAmount > 0 && remainingBalance > 0) {
      const newInstallmentCount = Math.ceil(remainingBalance / monthlyAmount);

      console.log(
        `📅 Creating ${newInstallmentCount} installments of ₹${monthlyAmount}`
      );

      // Preserve all paid installments
      newSchedule = [...paidInstallments];

      const startDate = unpaidInstallments[0]?.dueDate
        ? new Date(unpaidInstallments[0].dueDate)
        : new Date(existingInvoice.emiDetails.startDate || new Date());

      for (let i = 0; i < newInstallmentCount; i++) {
        const isLast = i === newInstallmentCount - 1;
        const installmentAmount = isLast
          ? remainingBalance - monthlyAmount * (newInstallmentCount - 1)
          : monthlyAmount;

        const dueDate = new Date(startDate);
        dueDate.setMonth(dueDate.getMonth() + i);

        newSchedule.push({
          installmentNumber: paidInstallments.length + i + 1,
          amount: Math.round(installmentAmount * 100) / 100,
          dueDate: dueDate.toISOString(),
          paid: false,
          paidAmount: 0,
          remainingAmount: Math.round(installmentAmount * 100) / 100,
        });
      }
    } else {
      // Equally distribute remaining balance
      const amountPerInstallment =
        remainingBalance / numberOfUnpaidInstallments;

      newSchedule = [
        ...paidInstallments,
        ...unpaidInstallments.map((emi, index) => ({
          ...emi,
          amount:
            index === numberOfUnpaidInstallments - 1
              ? remainingBalance -
                amountPerInstallment * (numberOfUnpaidInstallments - 1)
              : Math.round(amountPerInstallment * 100) / 100,
          remainingAmount:
            index === numberOfUnpaidInstallments - 1
              ? remainingBalance -
                amountPerInstallment * (numberOfUnpaidInstallments - 1)
              : Math.round(amountPerInstallment * 100) / 100,
        })),
      ];
    }

    // Update EMI details
    if (!updates.emiDetails) {
      updates.emiDetails = { ...existingInvoice.emiDetails };
    }

    updates.emiDetails.schedule = newSchedule;
    updates.emiDetails.downPayment = newDownPayment;
    updates.emiDetails.emiAmount = remainingBalance;
    updates.emiDetails.totalAmount = newTotal;
    updates.emiDetails.totalPaid = totalAlreadyPaid;
    updates.emiDetails.totalRemaining = remainingBalance;
    updates.emiDetails.recalculatedAt = new Date().toISOString();

    // Update payment details
    if (!updates.paymentDetails) {
      updates.paymentDetails = { ...existingInvoice.paymentDetails };
    }
    updates.paymentDetails.downPayment = newDownPayment;
    updates.paymentDetails.remainingBalance = remainingBalance;

    console.log("✅ EMI schedule recalculated with payment history preserved");

    return updates;
  }

  /**
   * 🆕 CREATE INVOICE
   */
  async createInvoice(userType, invoiceData) {
    try {
      const invoiceNumber = await this._generateInvoiceNumber(
        userType,
        invoiceData.includeGST
      );

      let subtotal = 0;
      let totalGST = 0;
      const processedItems = [];

      if (invoiceData.bulkPricingApplied && invoiceData.bulkPricingDetails) {
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

        invoiceData.items.forEach((item) => {
          processedItems.push({
            ...item,
            baseAmount: 0,
            gstAmount: 0,
            totalAmount: 0,
            bulkPricing: true,
          });
        });
      } else {
        invoiceData.items.forEach((item) => {
          const itemCalc = calculateItemWithGST(
            item,
            invoiceData.customerState,
            invoiceData.includeGST
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

      const grandTotal = Math.round(subtotal + totalGST);
      const exchangeAmount = invoiceData.exchangeDetails?.hasExchange
        ? parseFloat(invoiceData.exchangeDetails.exchangeAmount || 0)
        : 0;
      const netPayable = Math.max(0, grandTotal - exchangeAmount);

      const originalPaymentCategory = getPaymentCategory(
        invoiceData.paymentStatus,
        invoiceData.paymentDetails?.paymentMethod
      );

      const cleanInvoiceData = {
        invoiceNumber,
        company: invoiceData.company,
        saleDate: invoiceData.saleDate || new Date().toISOString(),
        customerId: invoiceData.customerId,
        customerName: invoiceData.customerName,
        customerPhone: invoiceData.customerPhone || "",
        customerAddress: invoiceData.customerAddress || "",
        customerState: invoiceData.customerState || "",
        customerGSTNumber: invoiceData.customerGSTNumber || "",
        salesPersonId: invoiceData.salesPersonId,
        salesPersonName: invoiceData.salesPersonName,
        items: processedItems,
        includeGST: invoiceData.includeGST !== false,
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
        statusChangeHistory: [],
        ...(invoiceData.bulkPricingDetails && {
          bulkPricingDetails: invoiceData.bulkPricingDetails,
          bulkPricingApplied: true,
        }),
      };

      if (invoiceData.scheduledDeliveryDate) {
        cleanInvoiceData.scheduledDeliveryDate =
          invoiceData.scheduledDeliveryDate;
      }

      if (invoiceData.paymentStatus === PAYMENT_STATUS.PAID) {
        cleanInvoiceData.paymentDetails = {
          downPayment: netPayable,
          remainingBalance: 0,
          paymentMethod:
            invoiceData.paymentDetails?.paymentMethod || PAYMENT_METHODS.CASH,
          paymentReference: invoiceData.paymentDetails?.paymentReference || "",
          paymentHistory: [],
        };
        cleanInvoiceData.paymentDate = new Date().toISOString();
      }

      if (
        [
          PAYMENT_STATUS.FINANCE,
          PAYMENT_STATUS.BANK_TRANSFER,
          PAYMENT_STATUS.PENDING,
        ].includes(invoiceData.paymentStatus)
      ) {
        const downPaymentAmount = parseFloat(
          invoiceData.paymentDetails?.downPayment || 0
        );

        cleanInvoiceData.paymentDetails = {
          downPayment: downPaymentAmount,
          remainingBalance: Math.max(0, netPayable - downPaymentAmount),
          paymentMethod:
            invoiceData.paymentDetails?.paymentMethod || PAYMENT_METHODS.CASH,
          bankName: invoiceData.paymentDetails?.bankName || "",
          financeCompany: invoiceData.paymentDetails?.financeCompany || "",
          paymentReference: invoiceData.paymentDetails?.paymentReference || "",
          paymentHistory:
            downPaymentAmount > 0
              ? [
                  {
                    amount: downPaymentAmount,
                    date: new Date().toISOString(),
                    method:
                      invoiceData.paymentDetails?.paymentMethod ||
                      PAYMENT_METHODS.CASH,
                    type: "down_payment",
                    recordedBy: invoiceData.createdBy,
                    recordedByName: invoiceData.createdByName,
                  },
                ]
              : [],
        };
      }

      if (invoiceData.paymentStatus === PAYMENT_STATUS.EMI) {
        const downPayment = parseFloat(
          invoiceData.paymentDetails?.downPayment || 0
        );
        const emiAmount = netPayable - downPayment;

        const emiDetails = {
          monthlyAmount: parseFloat(invoiceData.emiDetails?.monthlyAmount || 0),
          numberOfInstallments: parseInt(
            invoiceData.emiDetails?.numberOfInstallments || 1
          ),
          downPayment: downPayment,
          totalAmount: netPayable,
          emiAmount: emiAmount,
        };

        if (invoiceData.emiDetails?.startDate) {
          emiDetails.startDate = invoiceData.emiDetails.startDate;

          if (invoiceData.emiDetails.schedule?.length > 0) {
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

      if (processedItems?.length > 0) {
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

  /**
   * ✏️ UPDATE INVOICE - FULLY ENHANCED
   */
  async updateInvoice(userType, invoiceId, updates) {
    try {
      const existingInvoice = await this.getById(userType, invoiceId);
      let cleanUpdates = this.cleanUndefinedValues(updates);

      if (cleanUpdates.invoiceNumber) {
        delete cleanUpdates.invoiceNumber;
      }

      if (updates.company) {
        cleanUpdates.company = updates.company;
      }

      console.log("🔄 Starting invoice update...");

      cleanUpdates = this._handlePaymentStatusTransition(
        existingInvoice,
        cleanUpdates
      );

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
              ? updates.exchangeDetails.exchangeReceivedDate ||
                new Date().toISOString()
              : null,
          };
        } else {
          cleanUpdates.exchangeDetails = null;
        }
      }

      if (cleanUpdates.items) {
        console.log("📊 Recalculating item totals...");

        let subtotal = 0;
        let totalGST = 0;
        const processedItems = [];

        if (
          cleanUpdates.bulkPricingApplied &&
          cleanUpdates.bulkPricingDetails
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

        const exchangeAmount =
          cleanUpdates.exchangeDetails?.exchangeAmount ||
          existingInvoice.exchangeDetails?.exchangeAmount ||
          0;
        cleanUpdates.netPayable = Math.max(
          0,
          cleanUpdates.grandTotal - exchangeAmount
        );

        console.log(
          `💰 New totals - Grand: ₹${cleanUpdates.grandTotal}, Net: ₹${cleanUpdates.netPayable}`
        );
      }

      if (updates.exchangeDetails !== undefined && !updates.items) {
        const grandTotal = existingInvoice.grandTotal;
        const exchangeAmount =
          cleanUpdates.exchangeDetails?.exchangeAmount || 0;
        cleanUpdates.netPayable = Math.max(0, grandTotal - exchangeAmount);

        console.log(
          `💰 Exchange updated - Net payable: ₹${cleanUpdates.netPayable}`
        );
      }

      if (existingInvoice.paymentStatus === PAYMENT_STATUS.EMI) {
        const amountChanged =
          cleanUpdates.netPayable &&
          cleanUpdates.netPayable !== existingInvoice.netPayable;

        // 🔥 FIX: Check BOTH emiDetails AND paymentDetails for down payment
        const oldDownPayment =
          existingInvoice.emiDetails?.downPayment ||
          existingInvoice.paymentDetails?.downPayment ||
          0;
        const newDownPayment =
          cleanUpdates.emiDetails?.downPayment !== undefined
            ? parseFloat(cleanUpdates.emiDetails.downPayment)
            : cleanUpdates.paymentDetails?.downPayment !== undefined
            ? parseFloat(cleanUpdates.paymentDetails.downPayment)
            : oldDownPayment;

        const downPaymentChanged =
          Math.abs(newDownPayment - oldDownPayment) >= 0.01;

        if (amountChanged || downPaymentChanged) {
          console.log("🔄 Triggering EMI recalculation...");
          if (downPaymentChanged) {
            console.log(
              `💰 Down payment change: ₹${oldDownPayment} → ₹${newDownPayment}`
            );
          }
          cleanUpdates = this._recalculateEMISchedule(
            existingInvoice,
            cleanUpdates
          );
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

      console.log("✅ Invoice update complete");

      return await this.update(userType, invoiceId, cleanUpdates);
    } catch (error) {
      console.error("❌ Error updating invoice:", error);
      throw error;
    }
  }

  /**
   * Generate Invoice Number
   */
  async _generateInvoiceNumber(userType, includeGST) {
    try {
      const prefix =
        userType === "electronics"
          ? includeGST
            ? "EL_GST_"
            : "EL_NGST_"
          : includeGST
          ? "FN_GST_"
          : "FN_NGST_";

      const allInvoices = await this.getAll(userType);
      let maxSequence = 0;

      if (allInvoices?.length > 0) {
        allInvoices.forEach((invoice) => {
          if (invoice.invoiceNumber?.startsWith(prefix)) {
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

      const nextSequence = maxSequence + 1;
      const sequenceStr = String(nextSequence).padStart(3, "0");

      return `${prefix}${sequenceStr}`;
    } catch (error) {
      console.error("Error generating invoice number:", error);
      throw error;
    }
  }

  // ============================================
  // EXISTING METHODS
  // ============================================

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

  async getSaleById(userType, saleId) {
    return await this.getInvoiceById(userType, saleId);
  }

  async deleteSale(userType, saleId) {
    return await this.deleteInvoice(userType, saleId);
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

  // FIX: Method name should be getSalesStatistics (not getSalesStats)
  async getSalesStatistics(userType, filters = {}) {
    try {
      const sales = await this.getSales(userType);

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
          sale.paymentStatus === PAYMENT_STATUS.BANK_TRANSFER
        ) {
          return sale.paymentDetails?.downPayment || 0;
        }
        if (sale.paymentStatus === PAYMENT_STATUS.EMI) {
          const downPayment = sale.emiDetails?.downPayment || 0;
          const installmentsPaid = (sale.emiDetails?.schedule || [])
            .filter((emi) => emi.paid)
            .reduce((sum, emi) => sum + (emi.paidAmount || 0), 0);
          return downPayment + installmentsPaid;
        }
        return sale.paymentDetails?.downPayment || 0;
      };

      const paymentStatuses = [
        PAYMENT_STATUS.PAID,
        PAYMENT_STATUS.PENDING,
        PAYMENT_STATUS.EMI,
        PAYMENT_STATUS.FINANCE,
        PAYMENT_STATUS.BANK_TRANSFER,
      ];

      const statsByCategory = {};
      paymentStatuses.forEach((status) => {
        const statusSales = sales.filter(
          (sale) => sale.paymentStatus === status
        );
        statsByCategory[status] = {
          count: statusSales.length,
          totalAmount: statusSales.reduce(
            (sum, sale) =>
              sum +
              (sale.netPayable || sale.grandTotal || sale.totalAmount || 0),
            0
          ),
          paidAmount: statusSales.reduce(
            (sum, sale) => sum + calculateActualAmountPaid(sale),
            0
          ),
        };
      });

      const stats = {
        totalSales: sales.length,
        todaysSales: todaysSales.length,
        totalRevenue: sales.reduce(
          (sum, sale) =>
            sum + (sale.netPayable || sale.grandTotal || sale.totalAmount || 0),
          0
        ),
        todaysRevenue: todaysSales.reduce(
          (sum, sale) =>
            sum + (sale.netPayable || sale.grandTotal || sale.totalAmount || 0),
          0
        ),
        paidInvoices: sales.filter(
          (sale) => sale.paymentStatus === PAYMENT_STATUS.PAID
        ).length,
        pendingInvoices: sales.filter(
          (sale) => sale.paymentStatus === PAYMENT_STATUS.PENDING
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
          const totalAmount =
            sale.netPayable || sale.grandTotal || sale.totalAmount || 0;
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

  // ALIAS: Keep both method names for compatibility
  async getSalesStats(userType, filters = {}) {
    return await this.getSalesStatistics(userType, filters);
  }

  async recordAdditionalPayment(
    userType,
    invoiceId,
    paymentAmount,
    paymentDetails = {}
  ) {
    try {
      const invoice = await this.getById(userType, invoiceId);
      const totalAmount =
        invoice.netPayable || invoice.grandTotal || invoice.totalAmount || 0;

      if (!invoice.paymentDetails) {
        invoice.paymentDetails = {
          downPayment: 0,
          remainingBalance: totalAmount,
          paymentMethod: PAYMENT_METHODS.CASH,
          paymentHistory: [],
        };
      }

      const originalDownPayment = parseFloat(
        invoice.paymentDetails.downPayment || 0
      );
      const paidFromHistory = (invoice.paymentDetails.paymentHistory || [])
        .filter((p) => p.type !== "down_payment")
        .reduce((sum, payment) => sum + (payment.amount || 0), 0);

      const currentTotalPaid = originalDownPayment + paidFromHistory;
      const additionalAmount = parseFloat(paymentAmount);
      const newTotalPaid = currentTotalPaid + additionalAmount;
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
        type: "additional_payment",
        notes: paymentDetails.notes || "",
      };

      const updates = {
        paymentDetails: {
          ...invoice.paymentDetails,
          downPayment: originalDownPayment,
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
      const amount = parseFloat(paymentAmount);
      const currentPaid = installment.paidAmount || 0;
      const newPaidAmount = currentPaid + amount;
      const remainingForThisInstallment = installment.amount - newPaidAmount;

      const paymentRecord = {
        amount: amount,
        paymentDate: paymentDetails.paymentDate || new Date().toISOString(),
        paymentMethod: paymentDetails.paymentMethod || PAYMENT_METHODS.CASH,
        recordedBy: paymentDetails.recordedBy || null,
        recordedByName: paymentDetails.recordedByName || null,
        reference: paymentDetails.reference || "",
        notes: paymentDetails.notes || "",
      };

      schedule[installmentIndex] = {
        ...installment,
        paid: newPaidAmount >= installment.amount,
        partiallyPaid: newPaidAmount > 0 && newPaidAmount < installment.amount,
        paidAmount: newPaidAmount,
        remainingAmount: Math.max(0, remainingForThisInstallment),
        paymentDate:
          newPaidAmount >= installment.amount
            ? paymentDetails.paymentDate || new Date().toISOString()
            : installment.paymentDate || null, // ✅ ensure not undefined
        lastPaymentDate: paymentDetails.paymentDate || new Date().toISOString(),
        paymentHistory: [...(installment.paymentHistory || []), paymentRecord],
        paymentRecord:
          newPaidAmount >= installment.amount
            ? paymentRecord
            : installment.paymentRecord || null, // ✅ ensure not undefined
      };

      // Handle excess payment carry-forward
      let remainingExcess = Math.max(0, -remainingForThisInstallment);

      if (remainingExcess > 0) {
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

      // Calculate totals
      const downPayment = invoice.emiDetails?.downPayment || 0;
      const originalTotal =
        invoice.netPayable || invoice.grandTotal || invoice.totalAmount;

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

      // ✅ Sanitize all undefined -> null before updating Firebase
      const sanitize = (obj) => {
        if (Array.isArray(obj)) {
          return obj.map(sanitize);
        } else if (obj && typeof obj === "object") {
          return Object.fromEntries(
            Object.entries(obj).map(([k, v]) => [
              k,
              v === undefined ? null : sanitize(v),
            ])
          );
        }
        return obj;
      };

      const sanitizedUpdates = sanitize(updates);

      return await this.update(userType, invoiceId, sanitizedUpdates);
    } catch (error) {
      console.error("Error recording installment payment:", error);
      throw error;
    }
  }

  async getPendingInstallments(userType, invoiceId) {
    try {
      const invoice = await this.getById(userType, invoiceId);

      if (!invoice.emiDetails?.schedule) {
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

  async getInstallmentPaymentHistory(userType, invoiceId) {
    try {
      const invoice = await this.getById(userType, invoiceId);

      if (!invoice.emiDetails?.schedule) {
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

  async updateInstallmentDueDate(
    userType,
    invoiceId,
    installmentNumber,
    newDueDate,
    changeDetails = {}
  ) {
    try {
      const invoice = await this.getById(userType, invoiceId);

      if (!invoice.emiDetails?.schedule) {
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

  async getEMISummary(userType, invoiceId) {
    try {
      const invoice = await this.getById(userType, invoiceId);

      if (!invoice.emiDetails?.schedule) {
        throw new Error("EMI schedule not found");
      }

      const schedule = invoice.emiDetails.schedule;
      const totalInstallments = schedule.length;
      const paidInstallments = schedule.filter((emi) => emi.paid).length;
      const pendingInstallments = totalInstallments - paidInstallments;

      const totalAmount =
        invoice.netPayable || invoice.grandTotal || invoice.totalAmount;
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

  async updateEMIPayment(userType, invoiceId, emiIndex, paymentDetails) {
    try {
      const invoice = await this.getById(userType, invoiceId);

      if (!invoice.emiDetails?.schedule) {
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
      const allInvoices = await this.getAll(userType);

      return allInvoices.filter(
        (invoice) =>
          invoice.exchangeDetails?.hasExchange &&
          !invoice.exchangeDetails.itemReceived
      );
    } catch (error) {
      console.error("Error getting pending exchanges:", error);
      throw error;
    }
  }

  async getAllPendingEMIs(userType) {
    try {
      const allInvoices = await this.getAll(userType, {
        where: [["paymentStatus", "==", PAYMENT_STATUS.EMI]],
        orderBy: "createdAt",
        orderDirection: "desc",
      });

      const today = new Date();

      return allInvoices.filter((invoice) => {
        if (!invoice.fullyPaid && invoice.emiDetails?.schedule) {
          return invoice.emiDetails.schedule.some(
            (emi) => !emi.paid && new Date(emi.dueDate) <= today
          );
        }
        return false;
      });
    } catch (error) {
      console.error("Error getting pending EMIs:", error);
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
}

const salesService = new SalesService();
export default salesService;
