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
   */
  async getComprehensiveSalesStats(userType, period = 'all', date = new Date()) {
    try {
      const [allSales, customersData] = await Promise.all([
        salesService.getAll(userType, {
          orderBy: 'createdAt',
          orderDirection: 'desc'
        }),
        customerService.getCustomers(userType, {})
      ]);

      const customers = customersData.customers || [];
      const dateRanges = this._getDateRanges(date);
      const periodSales = this._filterSalesByPeriod(allSales, period, dateRanges);
      
      const stats = {
        periodSales: this._calculatePeriodSalesBreakdown(periodSales),
        customerStats: this._calculateCustomerStats(customers, dateRanges),
        invoiceStats: this._calculateInvoiceStats(allSales, dateRanges),
        pendingPayments: this._calculatePendingPayments(allSales),
        paymentMethodBreakdown: this._calculatePaymentMethodBreakdown(periodSales),
        summary: this._calculateSummary(periodSales),
        dateRange: dateRanges[period] || dateRanges.all
      };

      return stats;
    } catch (error) {
      console.error('Error fetching comprehensive sales stats:', error);
      throw error;
    }
  }

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

  async getDailyStats(userType, date = new Date()) {
    return this.getComprehensiveSalesStats(userType, 'daily', date);
  }

  async getWeeklyStats(userType, date = new Date()) {
    return this.getComprehensiveSalesStats(userType, 'weekly', date);
  }

  async getMonthlyStats(userType, date = new Date()) {
    return this.getComprehensiveSalesStats(userType, 'monthly', date);
  }

  // ==================== PRIVATE HELPER METHODS ====================

  _getDateRanges(referenceDate) {
    const today = new Date(referenceDate);
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const weekStart = new Date(today);
    weekStart.setDate(weekStart.getDate() - 6);

    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);

    return {
      daily: { start: today, end: tomorrow },
      weekly: { start: weekStart, end: tomorrow },
      monthly: { start: monthStart, end: monthEnd },
      all: { start: new Date(0), end: new Date() }
    };
  }

  _filterSalesByPeriod(sales, period, dateRanges) {
    if (period === 'all') return sales;

    const range = dateRanges[period];
    if (!range) return sales;

    return sales.filter(sale => {
      const saleDate = new Date(sale.saleDate || sale.createdAt);
      return saleDate >= range.start && saleDate < range.end;
    });
  }

  _calculatePeriodSalesBreakdown(sales) {
    const breakdown = {
      fullPayment: { count: 0, totalAmount: 0, items: [] },
      emiPayment: { count: 0, totalAmount: 0, items: [] },
      financePayment: { count: 0, totalAmount: 0, items: [] },
      pendingPayment: { count: 0, totalAmount: 0, items: [] }
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

  _calculateCustomerStats(customers, dateRanges) {
    const stats = {
      daily: { count: 0, customers: [] },
      weekly: { count: 0, customers: [] },
      monthly: { count: 0, customers: [] },
      total: customers.length
    };

    customers.forEach(customer => {
      const createdDate = new Date(customer.createdAt);

      if (createdDate >= dateRanges.daily.start && createdDate < dateRanges.daily.end) {
        stats.daily.count++;
        stats.daily.customers.push({
          name: customer.name,
          phone: customer.phone,
          date: customer.createdAt
        });
      }

      if (createdDate >= dateRanges.weekly.start && createdDate < dateRanges.weekly.end) {
        stats.weekly.count++;
        stats.weekly.customers.push({
          name: customer.name,
          phone: customer.phone,
          date: customer.createdAt
        });
      }

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

      if (createdDate >= dateRanges.daily.start && createdDate < dateRanges.daily.end) {
        stats.daily.count++;
        stats.daily.totalAmount += amount;
        stats.daily.invoices.push(invoiceInfo);
      }

      if (createdDate >= dateRanges.weekly.start && createdDate < dateRanges.weekly.end) {
        stats.weekly.count++;
        stats.weekly.totalAmount += amount;
        stats.weekly.invoices.push(invoiceInfo);
      }

      if (createdDate >= dateRanges.monthly.start && createdDate <= dateRanges.monthly.end) {
        stats.monthly.count++;
        stats.monthly.totalAmount += amount;
        stats.monthly.invoices.push(invoiceInfo);
      }
    });

    return stats;
  }

  _calculatePendingPayments(sales) {
    console.log('NEW VERSION - Processing', sales.length, 'sales');
    
    const pendingPayments = {
      emi: { totalPending: 0, byCustomer: {}, details: [] },
      finance: { totalPending: 0, byCompany: {}, byCustomer: {}, details: [] },
      pending: { totalPending: 0, byCustomer: {}, details: [] },
      total: 0
    };

    sales.forEach((sale, index) => {
      console.log(`Invoice ${index + 1}: ${sale.invoiceNumber} - Status: ${sale.paymentStatus}`);
      
      const totalAmount = sale.grandTotal || sale.totalAmount || 0;

      // EMI Payments - HARDCODED STRING CHECK
      if (sale.paymentStatus === 'emi' && sale.emiDetails) {
        console.log('EMI DETECTED!', sale.invoiceNumber);
        
        let emiRemaining = sale.emiDetails.totalRemaining;
        
        if (emiRemaining === undefined || emiRemaining === null) {
          console.log('Calculating from schedule...');
          if (sale.emiDetails.schedule && sale.emiDetails.schedule.length > 0) {
            emiRemaining = sale.emiDetails.schedule
              .filter(emi => !emi.paid)
              .reduce((sum, emi) => sum + (emi.amount || 0), 0);
            console.log('Calculated remaining:', emiRemaining);
          } else {
            emiRemaining = 0;
          }
        }
        
        console.log('Final emiRemaining:', emiRemaining);
        
        if (emiRemaining > 0) {
          console.log('ADDING to pending!');
          pendingPayments.emi.totalPending += emiRemaining;
          pendingPayments.total += emiRemaining;

          let totalPaid = sale.emiDetails.totalPaid || 0;
          if (totalPaid === 0 && sale.emiDetails.schedule) {
            const downPayment = sale.emiDetails.downPayment || 0;
            const installmentsPaid = sale.emiDetails.schedule
              .filter(emi => emi.paid)
              .reduce((sum, emi) => sum + (emi.paidAmount || emi.amount || 0), 0);
            totalPaid = downPayment + installmentsPaid;
          }

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
            paidAmount: totalPaid
          });

          pendingPayments.emi.details.push({
            invoiceNumber: sale.invoiceNumber,
            customerName: sale.customerName,
            customerPhone: sale.customerPhone,
            totalAmount: totalAmount,
            pendingAmount: emiRemaining,
            paidAmount: totalPaid,
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

        pendingPayments.pending.details.push({
          invoiceNumber: sale.invoiceNumber,
          customerName: sale.customerName,
          customerPhone: sale.customerPhone,
          totalAmount: totalAmount,
          date: sale.saleDate || sale.createdAt
        });
      }
    });

    console.log('FINAL TOTALS:', {
      total: pendingPayments.total,
      emi: pendingPayments.emi.totalPending,
      emiCustomers: Object.keys(pendingPayments.emi.byCustomer)
    });

    return pendingPayments;
  }

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

  formatPendingPaymentsTable(pendingPayments) {
    const tableData = [];

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

const salesStatsService = new SalesStatsService();
export default salesStatsService;