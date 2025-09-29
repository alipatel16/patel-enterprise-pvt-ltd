import salesService from './api/salesService';
import customerService from './api/customerService';
import { PAYMENT_STATUS } from '../utils/constants/appConstants';

/**
 * Sales Statistics Service
 * Provides comprehensive sales analytics and statistics
 */
class SalesStatsService {
  /**
   * Get comprehensive sales statistics for a given period
   * @param {string} userType - User type (electronics/furniture)
   * @param {string} period - 'daily', 'weekly', 'monthly', or 'all'
   * @param {Date} date - Reference date for calculations (defaults to today)
   * @returns {Promise<Object>} Complete sales statistics
   */
  async getComprehensiveSalesStats(userType, period = 'all', date = new Date()) {
    try {
      // Fetch all sales and customers in parallel for efficiency
      const [allSales, customersData] = await Promise.all([
        salesService.getAll(userType, {
          orderBy: 'createdAt',
          orderDirection: 'desc'
        }),
        customerService.getCustomers(userType, {}) // Get all customers without pagination
      ]);

      const customers = customersData.customers || [];

      // Calculate date ranges
      const dateRanges = this._getDateRanges(date);

      // Filter sales by period
      const periodSales = this._filterSalesByPeriod(allSales, period, dateRanges);
      
      // Calculate all statistics
      const stats = {
        // Period-specific sales breakdown
        periodSales: this._calculatePeriodSalesBreakdown(periodSales),
        
        // Customer registration stats
        customerStats: this._calculateCustomerStats(customers, dateRanges),
        
        // Invoice creation stats
        invoiceStats: this._calculateInvoiceStats(allSales, dateRanges),
        
        // Pending payments breakdown (from all sales, not just period)
        pendingPayments: this._calculatePendingPayments(allSales),
        
        // Payment method breakdown for period
        paymentMethodBreakdown: this._calculatePaymentMethodBreakdown(periodSales),
        
        // Summary totals for period
        summary: this._calculateSummary(periodSales),
        
        // Date range information
        dateRange: dateRanges[period] || dateRanges.all
      };

      return stats;
    } catch (error) {
      console.error('Error fetching comprehensive sales stats:', error);
      throw error;
    }
  }

  /**
   * NEW: Get comprehensive sales statistics for a custom date range
   * @param {string} userType - User type (electronics/furniture)
   * @param {Date} fromDate - Start date (inclusive)
   * @param {Date} toDate - End date (inclusive)
   * @returns {Promise<Object>} Complete sales statistics
   */
  async getComprehensiveSalesStatsByDateRange(userType, fromDate, toDate) {
    try {
      // Validate dates
      if (!fromDate || !toDate) {
        throw new Error('Both fromDate and toDate are required');
      }

      if (fromDate > toDate) {
        throw new Error('fromDate cannot be after toDate');
      }

      // Fetch all sales and customers in parallel for efficiency
      const [allSales, customersData] = await Promise.all([
        salesService.getAll(userType, {
          orderBy: 'createdAt',
          orderDirection: 'desc'
        }),
        customerService.getCustomers(userType, {})
      ]);

      const customers = customersData.customers || [];

      // Set time to start and end of day for proper date comparison
      const startDate = new Date(fromDate);
      startDate.setHours(0, 0, 0, 0);
      
      const endDate = new Date(toDate);
      endDate.setHours(23, 59, 59, 999);

      // Filter sales by date range
      const dateRangeSales = allSales.filter(sale => {
        const saleDate = new Date(sale.saleDate || sale.createdAt);
        return saleDate >= startDate && saleDate <= endDate;
      });

      // Filter customers by date range
      const dateRangeCustomers = customers.filter(customer => {
        const createdDate = new Date(customer.createdAt);
        return createdDate >= startDate && createdDate <= endDate;
      });

      // Calculate statistics with date range info
      const customerStats = this._calculateCustomerStatsForDateRange(customers, startDate, endDate);
      const invoiceStats = this._calculateInvoiceStatsForDateRange(allSales, startDate, endDate);

      const stats = {
        // Period-specific sales breakdown
        periodSales: this._calculatePeriodSalesBreakdown(dateRangeSales),
        
        // Customer registration stats
        customerStats: customerStats,
        
        // Invoice creation stats
        invoiceStats: invoiceStats,
        
        // Pending payments breakdown (filtered by date range for custom dates)
        pendingPayments: this._calculatePendingPayments(dateRangeSales),
        
        // Payment method breakdown for period
        paymentMethodBreakdown: this._calculatePaymentMethodBreakdown(dateRangeSales),
        
        // Summary totals for period
        summary: this._calculateSummary(dateRangeSales),
        
        // Date range information
        dateRange: {
          start: startDate,
          end: endDate,
          fromDate: startDate,
          toDate: endDate
        }
      };

      return stats;
    } catch (error) {
      console.error('Error fetching sales stats by date range:', error);
      throw error;
    }
  }

  /**
   * Get detailed pending payments with customer/company breakdown
   * @param {string} userType - User type
   * @returns {Promise<Object>} Detailed pending payment information
   */
  async getDetailedPendingPayments(userType) {
    try {
      const allSales = await salesService.getAll(userType, {
        orderBy: 'createdAt',
        orderDirection: 'desc'
      });

      return this._calculatePendingPayments(allSales);
    } catch (error) {
      console.error('Error fetching pending payments:', error);
      throw error;
    }
  }

  /**
   * Get daily sales statistics
   * @param {string} userType - User type
   * @param {Date} date - Date to get stats for
   * @returns {Promise<Object>} Daily statistics
   */
  async getDailyStats(userType, date = new Date()) {
    return this.getComprehensiveSalesStats(userType, 'daily', date);
  }

  /**
   * Get weekly sales statistics
   * @param {string} userType - User type
   * @param {Date} date - Date within the week
   * @returns {Promise<Object>} Weekly statistics
   */
  async getWeeklyStats(userType, date = new Date()) {
    return this.getComprehensiveSalesStats(userType, 'weekly', date);
  }

  /**
   * Get monthly sales statistics
   * @param {string} userType - User type
   * @param {Date} date - Date within the month
   * @returns {Promise<Object>} Monthly statistics
   */
  async getMonthlyStats(userType, date = new Date()) {
    return this.getComprehensiveSalesStats(userType, 'monthly', date);
  }

  // ==================== PRIVATE HELPER METHODS ====================

  /**
   * Calculate date ranges for different periods
   * @private
   */
  _getDateRanges(referenceDate) {
    const today = new Date(referenceDate);
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Weekly range (last 7 days)
    const weekStart = new Date(today);
    weekStart.setDate(weekStart.getDate() - 6);

    // Monthly range (current month)
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);

    return {
      daily: { start: today, end: tomorrow },
      weekly: { start: weekStart, end: tomorrow },
      monthly: { start: monthStart, end: monthEnd },
      all: { start: new Date(0), end: new Date() }
    };
  }

  /**
   * Filter sales by period
   * @private
   */
  _filterSalesByPeriod(sales, period, dateRanges) {
    if (period === 'all') return sales;

    const range = dateRanges[period];
    if (!range) return sales;

    return sales.filter(sale => {
      const saleDate = new Date(sale.saleDate || sale.createdAt);
      return saleDate >= range.start && saleDate < range.end;
    });
  }

  /**
   * Calculate sales breakdown by payment type
   * @private
   */
  _calculatePeriodSalesBreakdown(sales) {
    const breakdown = {
      fullPayment: {
        count: 0,
        totalAmount: 0,
        items: []
      },
      emiPayment: {
        count: 0,
        totalAmount: 0,
        items: []
      },
      financePayment: {
        count: 0,
        totalAmount: 0,
        items: []
      },
      pendingPayment: {
        count: 0,
        totalAmount: 0,
        items: []
      }
    };

    sales.forEach(sale => {
      const amount = sale.grandTotal || sale.totalAmount || 0;
      const saleInfo = {
        invoiceNumber: sale.invoiceNumber,
        customerName: sale.customerName,
        amount: amount,
        date: sale.saleDate || sale.createdAt
      };

      if (sale.paymentStatus === PAYMENT_STATUS.PAID || sale.fullyPaid) {
        breakdown.fullPayment.count++;
        breakdown.fullPayment.totalAmount += amount;
        breakdown.fullPayment.items.push(saleInfo);
      } else if (sale.paymentStatus === PAYMENT_STATUS.EMI) {
        breakdown.emiPayment.count++;
        breakdown.emiPayment.totalAmount += amount;
        breakdown.emiPayment.items.push(saleInfo);
      } else if (sale.paymentStatus === PAYMENT_STATUS.FINANCE || 
                 sale.paymentStatus === PAYMENT_STATUS.BANK_TRANSFER) {
        breakdown.financePayment.count++;
        breakdown.financePayment.totalAmount += amount;
        breakdown.financePayment.items.push(saleInfo);
      } else if (sale.paymentStatus === PAYMENT_STATUS.PENDING) {
        breakdown.pendingPayment.count++;
        breakdown.pendingPayment.totalAmount += amount;
        breakdown.pendingPayment.items.push(saleInfo);
      }
    });

    return breakdown;
  }

  /**
   * Calculate customer registration statistics
   * @private
   */
  _calculateCustomerStats(customers, dateRanges) {
    const stats = {
      daily: { count: 0, customers: [] },
      weekly: { count: 0, customers: [] },
      monthly: { count: 0, customers: [] },
      total: customers.length
    };

    customers.forEach(customer => {
      const createdDate = new Date(customer.createdAt);

      // Daily
      if (createdDate >= dateRanges.daily.start && createdDate < dateRanges.daily.end) {
        stats.daily.count++;
        stats.daily.customers.push({
          name: customer.name,
          phone: customer.phone,
          date: customer.createdAt
        });
      }

      // Weekly
      if (createdDate >= dateRanges.weekly.start && createdDate < dateRanges.weekly.end) {
        stats.weekly.count++;
        stats.weekly.customers.push({
          name: customer.name,
          phone: customer.phone,
          date: customer.createdAt
        });
      }

      // Monthly
      if (createdDate >= dateRanges.monthly.start && createdDate <= dateRanges.monthly.end) {
        stats.monthly.count++;
        stats.monthly.customers.push({
          name: customer.name,
          phone: customer.phone,
          date: customer.createdAt
        });
      }
    });

    return stats;
  }

  /**
   * NEW: Calculate customer statistics for a custom date range
   * @private
   */
  _calculateCustomerStatsForDateRange(customers, startDate, endDate) {
    const dateRangeCustomers = customers.filter(customer => {
      const createdDate = new Date(customer.createdAt);
      return createdDate >= startDate && createdDate <= endDate;
    });

    return {
      dateRange: {
        count: dateRangeCustomers.length,
        customers: dateRangeCustomers.map(c => ({
          name: c.name,
          phone: c.phone,
          date: c.createdAt
        }))
      },
      total: customers.length
    };
  }

  /**
   * Calculate invoice creation statistics
   * @private
   */
  _calculateInvoiceStats(sales, dateRanges) {
    const stats = {
      daily: { count: 0, totalAmount: 0, invoices: [] },
      weekly: { count: 0, totalAmount: 0, invoices: [] },
      monthly: { count: 0, totalAmount: 0, invoices: [] },
      total: { count: sales.length, totalAmount: 0 }
    };

    sales.forEach(sale => {
      const createdDate = new Date(sale.createdAt);
      const amount = sale.grandTotal || sale.totalAmount || 0;
      
      stats.total.totalAmount += amount;

      const invoiceInfo = {
        invoiceNumber: sale.invoiceNumber,
        customerName: sale.customerName,
        amount: amount,
        date: sale.createdAt
      };

      // Daily
      if (createdDate >= dateRanges.daily.start && createdDate < dateRanges.daily.end) {
        stats.daily.count++;
        stats.daily.totalAmount += amount;
        stats.daily.invoices.push(invoiceInfo);
      }

      // Weekly
      if (createdDate >= dateRanges.weekly.start && createdDate < dateRanges.weekly.end) {
        stats.weekly.count++;
        stats.weekly.totalAmount += amount;
        stats.weekly.invoices.push(invoiceInfo);
      }

      // Monthly
      if (createdDate >= dateRanges.monthly.start && createdDate <= dateRanges.monthly.end) {
        stats.monthly.count++;
        stats.monthly.totalAmount += amount;
        stats.monthly.invoices.push(invoiceInfo);
      }
    });

    return stats;
  }

  /**
   * NEW: Calculate invoice statistics for a custom date range
   * @private
   */
  _calculateInvoiceStatsForDateRange(sales, startDate, endDate) {
    const dateRangeSales = sales.filter(sale => {
      const createdDate = new Date(sale.createdAt);
      return createdDate >= startDate && createdDate <= endDate;
    });

    const dateRangeTotal = dateRangeSales.reduce((sum, sale) => {
      return sum + (sale.grandTotal || sale.totalAmount || 0);
    }, 0);

    const totalAmount = sales.reduce((sum, sale) => {
      return sum + (sale.grandTotal || sale.totalAmount || 0);
    }, 0);

    return {
      dateRange: {
        count: dateRangeSales.length,
        totalAmount: dateRangeTotal,
        invoices: dateRangeSales.map(s => ({
          invoiceNumber: s.invoiceNumber,
          customerName: s.customerName,
          amount: s.grandTotal || s.totalAmount || 0,
          date: s.createdAt
        }))
      },
      total: {
        count: sales.length,
        totalAmount: totalAmount
      }
    };
  }

  /**
   * Calculate detailed pending payments breakdown
   * @private
   */
  _calculatePendingPayments(sales) {
    const pendingPayments = {
      emi: {
        totalPending: 0,
        byCustomer: {},
        details: []
      },
      finance: {
        totalPending: 0,
        byCompany: {},
        byCustomer: {},
        details: []
      },
      pending: {
        totalPending: 0,
        byCustomer: {},
        details: []
      },
      total: 0
    };

    sales.forEach(sale => {
      const totalAmount = sale.grandTotal || sale.totalAmount || 0;

      // EMI Payments
      if (sale.paymentStatus === PAYMENT_STATUS.EMI && sale.emiDetails) {
        const emiRemaining = sale.emiDetails.totalRemaining || 0;
        
        if (emiRemaining > 0) {
          pendingPayments.emi.totalPending += emiRemaining;
          pendingPayments.total += emiRemaining;

          // By customer
          if (!pendingPayments.emi.byCustomer[sale.customerName]) {
            pendingPayments.emi.byCustomer[sale.customerName] = {
              totalPending: 0,
              invoices: []
            };
          }
          pendingPayments.emi.byCustomer[sale.customerName].totalPending += emiRemaining;
          pendingPayments.emi.byCustomer[sale.customerName].invoices.push({
            invoiceNumber: sale.invoiceNumber,
            totalAmount: totalAmount,
            pendingAmount: emiRemaining,
            paidAmount: sale.emiDetails.totalPaid || 0
          });

          // Details
          pendingPayments.emi.details.push({
            invoiceNumber: sale.invoiceNumber,
            customerName: sale.customerName,
            customerPhone: sale.customerPhone,
            totalAmount: totalAmount,
            pendingAmount: emiRemaining,
            paidAmount: sale.emiDetails.totalPaid || 0,
            installmentsCompleted: sale.emiDetails.schedule?.filter(i => i.paid).length || 0,
            totalInstallments: sale.emiDetails.numberOfInstallments || 0
          });
        }
      }

      // Finance Payments
      if ((sale.paymentStatus === PAYMENT_STATUS.FINANCE || 
           sale.paymentStatus === PAYMENT_STATUS.BANK_TRANSFER) && 
          sale.paymentDetails) {
        const financeRemaining = sale.paymentDetails.remainingBalance || 0;
        
        if (financeRemaining > 0) {
          pendingPayments.finance.totalPending += financeRemaining;
          pendingPayments.total += financeRemaining;

          const financeCompany = sale.paymentDetails.financeCompany || 'Unknown';

          // By company
          if (!pendingPayments.finance.byCompany[financeCompany]) {
            pendingPayments.finance.byCompany[financeCompany] = {
              totalPending: 0,
              invoices: []
            };
          }
          pendingPayments.finance.byCompany[financeCompany].totalPending += financeRemaining;
          pendingPayments.finance.byCompany[financeCompany].invoices.push({
            invoiceNumber: sale.invoiceNumber,
            customerName: sale.customerName,
            totalAmount: totalAmount,
            pendingAmount: financeRemaining,
            downPayment: sale.paymentDetails.downPayment || 0
          });

          // By customer
          if (!pendingPayments.finance.byCustomer[sale.customerName]) {
            pendingPayments.finance.byCustomer[sale.customerName] = {
              totalPending: 0,
              invoices: []
            };
          }
          pendingPayments.finance.byCustomer[sale.customerName].totalPending += financeRemaining;
          pendingPayments.finance.byCustomer[sale.customerName].invoices.push({
            invoiceNumber: sale.invoiceNumber,
            financeCompany: financeCompany,
            totalAmount: totalAmount,
            pendingAmount: financeRemaining,
            downPayment: sale.paymentDetails.downPayment || 0
          });

          // Details
          pendingPayments.finance.details.push({
            invoiceNumber: sale.invoiceNumber,
            customerName: sale.customerName,
            customerPhone: sale.customerPhone,
            financeCompany: financeCompany,
            totalAmount: totalAmount,
            pendingAmount: financeRemaining,
            downPayment: sale.paymentDetails.downPayment || 0
          });
        }
      }

      // Pending Payments
      if (sale.paymentStatus === PAYMENT_STATUS.PENDING && !sale.fullyPaid) {
        pendingPayments.pending.totalPending += totalAmount;
        pendingPayments.total += totalAmount;

        // By customer
        if (!pendingPayments.pending.byCustomer[sale.customerName]) {
          pendingPayments.pending.byCustomer[sale.customerName] = {
            totalPending: 0,
            invoices: []
          };
        }
        pendingPayments.pending.byCustomer[sale.customerName].totalPending += totalAmount;
        pendingPayments.pending.byCustomer[sale.customerName].invoices.push({
          invoiceNumber: sale.invoiceNumber,
          totalAmount: totalAmount,
          date: sale.saleDate || sale.createdAt
        });

        // Details
        pendingPayments.pending.details.push({
          invoiceNumber: sale.invoiceNumber,
          customerName: sale.customerName,
          customerPhone: sale.customerPhone,
          totalAmount: totalAmount,
          date: sale.saleDate || sale.createdAt
        });
      }
    });

    return pendingPayments;
  }

  /**
   * Calculate payment method breakdown
   * @private
   */
  _calculatePaymentMethodBreakdown(sales) {
    const breakdown = {
      cash: { count: 0, amount: 0 },
      card: { count: 0, amount: 0 },
      upi: { count: 0, amount: 0 },
      finance: { count: 0, amount: 0 },
      emi: { count: 0, amount: 0 },
      pending: { count: 0, amount: 0 }
    };

    sales.forEach(sale => {
      const amount = sale.grandTotal || sale.totalAmount || 0;
      const paymentMethod = sale.paymentDetails?.paymentMethod?.toLowerCase() || 'cash';

      if (sale.paymentStatus === PAYMENT_STATUS.EMI) {
        breakdown.emi.count++;
        breakdown.emi.amount += amount;
      } else if (sale.paymentStatus === PAYMENT_STATUS.FINANCE || 
                 sale.paymentStatus === PAYMENT_STATUS.BANK_TRANSFER) {
        breakdown.finance.count++;
        breakdown.finance.amount += amount;
      } else if (sale.paymentStatus === PAYMENT_STATUS.PENDING) {
        breakdown.pending.count++;
        breakdown.pending.amount += amount;
      } else if (paymentMethod.includes('card')) {
        breakdown.card.count++;
        breakdown.card.amount += amount;
      } else if (paymentMethod.includes('upi')) {
        breakdown.upi.count++;
        breakdown.upi.amount += amount;
      } else {
        breakdown.cash.count++;
        breakdown.cash.amount += amount;
      }
    });

    return breakdown;
  }

  /**
   * Calculate summary statistics
   * @private
   */
  _calculateSummary(sales) {
    return {
      totalSales: sales.length,
      totalAmount: sales.reduce((sum, sale) => sum + (sale.grandTotal || sale.totalAmount || 0), 0),
      averageOrderValue: sales.length > 0 
        ? sales.reduce((sum, sale) => sum + (sale.grandTotal || sale.totalAmount || 0), 0) / sales.length 
        : 0,
      completedPayments: sales.filter(s => s.paymentStatus === PAYMENT_STATUS.PAID || s.fullyPaid).length,
      partialPayments: sales.filter(s => 
        (s.paymentStatus === PAYMENT_STATUS.EMI || 
         s.paymentStatus === PAYMENT_STATUS.FINANCE || 
         s.paymentStatus === PAYMENT_STATUS.BANK_TRANSFER) && 
        !s.fullyPaid
      ).length,
      pendingPayments: sales.filter(s => s.paymentStatus === PAYMENT_STATUS.PENDING).length
    };
  }

  /**
   * Format pending payments for display (table format)
   * @param {Object} pendingPayments - Pending payments data
   * @returns {Array} Formatted table rows
   */
  formatPendingPaymentsTable(pendingPayments) {
    const tableData = [];

    // EMI Payments
    Object.entries(pendingPayments.emi.byCustomer).forEach(([customerName, data]) => {
      tableData.push({
        type: 'EMI',
        customer: customerName,
        company: '-',
        pendingAmount: data.totalPending,
        description: `Total EMI payment pending from ${customerName} is ₹${(data.totalPending / 1000).toFixed(0)}k`,
        invoiceCount: data.invoices.length
      });
    });

    // Finance Payments by Company
    Object.entries(pendingPayments.finance.byCompany).forEach(([company, data]) => {
      tableData.push({
        type: 'Finance',
        customer: '-',
        company: company,
        pendingAmount: data.totalPending,
        description: `Remaining finance payment pending from ${company} is ₹${(data.totalPending / 1000).toFixed(0)}k`,
        invoiceCount: data.invoices.length
      });
    });

    // Pending Payments
    Object.entries(pendingPayments.pending.byCustomer).forEach(([customerName, data]) => {
      tableData.push({
        type: 'Pending',
        customer: customerName,
        company: '-',
        pendingAmount: data.totalPending,
        description: `Pending payment from ${customerName} is ₹${(data.totalPending / 1000).toFixed(0)}k`,
        invoiceCount: data.invoices.length
      });
    });

    return tableData;
  }
}

// Create and export singleton instance
const salesStatsService = new SalesStatsService();
export default salesStatsService;