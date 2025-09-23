import salesService from './salesService';
import employeeService from './employeeService';

/**
 * Employee Sales Analytics Service
 * Handles employee performance and sales analytics
 */
class EmployeeSalesAnalyticsService {
  
  /**
   * Get employee sales analytics for a specific month
   * @param {string} userType - User type (electronics/furniture)
   * @param {string} year - Year (e.g., "2025")
   * @param {string} month - Month (e.g., "09" for September)
   * @returns {Promise<Object>} Employee sales analytics
   */
  async getEmployeeSalesAnalytics(userType, year, month) {
    try {
      console.log(`🔍 Getting analytics for ${year}-${month} (userType: ${userType})`);

      // Create date range for the selected month
      const startDate = new Date(`${year}-${month}-01`);
      const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0, 23, 59, 59, 999);

      console.log('📅 Date range:', {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      });

      // Get ALL sales first (Firebase date filtering can be unreliable)
      const allSales = await salesService.getSales(userType);
      console.log('📊 Total sales records:', allSales.length);

      // Filter sales by date range on the client side for reliability
      const filteredSales = allSales.filter(sale => {
        const saleDate = new Date(sale.saleDate);
        const isInRange = saleDate >= startDate && saleDate <= endDate;
        
        if (isInRange) {
          console.log('✅ Sale included:', {
            invoiceNumber: sale.invoiceNumber,
            saleDate: sale.saleDate,
            amount: sale.grandTotal || sale.totalAmount
          });
        }
        
        return isInRange;
      });

      console.log(`📋 Filtered sales for ${year}-${month}:`, filteredSales.length, 'sales');

      // Get all employees
      const employees = await employeeService.getEmployees(userType);
      const employeesData = employees.employees || [];
      console.log('👥 Total employees:', employeesData.length);

      // Create employee lookup map
      const employeeLookup = {};
      employeesData.forEach(emp => {
        employeeLookup[emp.id] = emp;
      });

      // Group sales by employee
      const employeePerformance = {};
      let totalSales = 0;

      filteredSales.forEach(sale => {
        const salesPersonId = sale.salesPersonId;
        const saleAmount = sale.grandTotal || sale.totalAmount || 0;
        
        totalSales += saleAmount;

        if (!employeePerformance[salesPersonId]) {
          const employee = employeeLookup[salesPersonId];
          employeePerformance[salesPersonId] = {
            employeeId: salesPersonId,
            employeeName: sale.salesPersonName || employee?.name || 'Unknown',
            employeeDetails: employee || null,
            totalSales: 0,
            totalInvoices: 0,
            averageInvoiceValue: 0,
            salesByWeek: {},
            salesList: []
          };
        }

        employeePerformance[salesPersonId].totalSales += saleAmount;
        employeePerformance[salesPersonId].totalInvoices += 1;
        employeePerformance[salesPersonId].salesList.push({
          invoiceNumber: sale.invoiceNumber,
          amount: saleAmount,
          customerName: sale.customerName,
          date: sale.saleDate,
          paymentStatus: sale.paymentStatus
        });

        // Group by week
        const saleDate = new Date(sale.saleDate);
        const weekNumber = this.getWeekNumber(saleDate);
        if (!employeePerformance[salesPersonId].salesByWeek[weekNumber]) {
          employeePerformance[salesPersonId].salesByWeek[weekNumber] = 0;
        }
        employeePerformance[salesPersonId].salesByWeek[weekNumber] += saleAmount;
      });

      console.log('💰 Total sales amount:', totalSales);
      console.log('🏆 Employee performance:', Object.keys(employeePerformance).length, 'employees with sales');

      // Include employees with zero sales
      employeesData.forEach(emp => {
        if (!employeePerformance[emp.id]) {
          employeePerformance[emp.id] = {
            employeeId: emp.id,
            employeeName: emp.name,
            employeeDetails: emp,
            totalSales: 0,
            totalInvoices: 0,
            averageInvoiceValue: 0,
            salesByWeek: {},
            salesList: []
          };
        }
      });

      // Calculate average invoice value and performance metrics
      const analyticsData = Object.values(employeePerformance).map(emp => {
        emp.averageInvoiceValue = emp.totalInvoices > 0 ? emp.totalSales / emp.totalInvoices : 0;
        emp.performancePercentage = totalSales > 0 ? (emp.totalSales / totalSales) * 100 : 0;
        emp.rank = 0; // Will be calculated after sorting
        return emp;
      });

      // Sort by total sales (descending) and assign ranks
      analyticsData.sort((a, b) => b.totalSales - a.totalSales);
      analyticsData.forEach((emp, index) => {
        emp.rank = index + 1;
      });

      // Get top 3 performers
      const top3Performers = analyticsData.slice(0, 3);

      const result = {
        period: {
          year,
          month,
          monthName: new Date(`${year}-${month}-01`).toLocaleString('default', { month: 'long' })
        },
        totalEmployees: analyticsData.length,
        totalSales,
        totalInvoices: filteredSales.length,
        averagePerEmployee: analyticsData.length > 0 ? totalSales / analyticsData.length : 0,
        employeePerformance: analyticsData,
        top3Performers,
        summary: {
          bestPerformer: analyticsData[0] || null,
          totalActiveEmployees: analyticsData.filter(emp => emp.totalSales > 0).length,
          employeesWithNoSales: analyticsData.filter(emp => emp.totalSales === 0).length
        }
      };

      console.log('📈 Analytics result:', {
        period: result.period,
        totalSales: result.totalSales,
        totalInvoices: result.totalInvoices,
        employeesWithSales: result.summary.totalActiveEmployees
      });

      return result;
    } catch (error) {
      console.error('❌ Error getting employee sales analytics:', error);
      throw new Error('Failed to get employee sales analytics');
    }
  }

  /**
   * Get monthly comparison data for employees
   * @param {string} userType - User type
   * @param {string} year - Year
   * @param {number} monthsBack - Number of months to compare (default 6)
   * @returns {Promise<Object>} Monthly comparison data
   */
  async getMonthlyComparison(userType, year, monthsBack = 6) {
    try {
      const currentDate = new Date();
      const monthlyData = [];

      for (let i = 0; i < monthsBack; i++) {
        const targetDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
        const monthStr = String(targetDate.getMonth() + 1).padStart(2, '0');
        const yearStr = String(targetDate.getFullYear());

        const analytics = await this.getEmployeeSalesAnalytics(userType, yearStr, monthStr);
        monthlyData.push({
          period: `${yearStr}-${monthStr}`,
          year: yearStr,
          month: monthStr,
          monthName: analytics.period.monthName,
          totalSales: analytics.totalSales,
          totalEmployees: analytics.totalEmployees,
          top3: analytics.top3Performers,
          averagePerEmployee: analytics.averagePerEmployee
        });
      }

      return {
        monthlyData: monthlyData.reverse(), // Show oldest to newest
        trends: this.calculateTrends(monthlyData)
      };
    } catch (error) {
      console.error('Error getting monthly comparison:', error);
      throw new Error('Failed to get monthly comparison data');
    }
  }

  /**
   * Get individual employee performance over time
   * @param {string} userType - User type
   * @param {string} employeeId - Employee ID
   * @param {number} monthsBack - Number of months to analyze
   * @returns {Promise<Object>} Employee performance over time
   */
  async getEmployeePerformanceOverTime(userType, employeeId, monthsBack = 12) {
    try {
      const currentDate = new Date();
      const performanceData = [];

      for (let i = 0; i < monthsBack; i++) {
        const targetDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
        const monthStr = String(targetDate.getMonth() + 1).padStart(2, '0');
        const yearStr = String(targetDate.getFullYear());

        const analytics = await this.getEmployeeSalesAnalytics(userType, yearStr, monthStr);
        const employeeData = analytics.employeePerformance.find(emp => emp.employeeId === employeeId);

        performanceData.push({
          period: `${yearStr}-${monthStr}`,
          year: yearStr,
          month: monthStr,
          monthName: analytics.period.monthName,
          totalSales: employeeData?.totalSales || 0,
          totalInvoices: employeeData?.totalInvoices || 0,
          averageInvoiceValue: employeeData?.averageInvoiceValue || 0,
          rank: employeeData?.rank || null,
          performancePercentage: employeeData?.performancePercentage || 0
        });
      }

      return {
        employeeId,
        performanceData: performanceData.reverse(),
        trends: this.calculateEmployeeTrends(performanceData)
      };
    } catch (error) {
      console.error('Error getting employee performance over time:', error);
      throw new Error('Failed to get employee performance data');
    }
  }

  /**
   * Calculate performance trends
   * @param {Array} monthlyData - Monthly data array
   * @returns {Object} Trend analysis
   */
  calculateTrends(monthlyData) {
    if (monthlyData.length < 2) return null;

    const latest = monthlyData[monthlyData.length - 1];
    const previous = monthlyData[monthlyData.length - 2];

    const salesGrowth = previous.totalSales > 0 
      ? ((latest.totalSales - previous.totalSales) / previous.totalSales) * 100 
      : 0;

    const avgGrowth = previous.averagePerEmployee > 0 
      ? ((latest.averagePerEmployee - previous.averagePerEmployee) / previous.averagePerEmployee) * 100 
      : 0;

    return {
      salesGrowthPercentage: salesGrowth,
      averageGrowthPercentage: avgGrowth,
      trend: salesGrowth > 0 ? 'upward' : salesGrowth < 0 ? 'downward' : 'stable',
      isImproving: salesGrowth > 0
    };
  }

  /**
   * Calculate individual employee trends
   * @param {Array} performanceData - Employee performance data
   * @returns {Object} Employee trend analysis
   */
  calculateEmployeeTrends(performanceData) {
    if (performanceData.length < 2) return null;

    const latest = performanceData[performanceData.length - 1];
    const previous = performanceData[performanceData.length - 2];

    const salesGrowth = previous.totalSales > 0 
      ? ((latest.totalSales - previous.totalSales) / previous.totalSales) * 100 
      : 0;

    const rankChange = previous.rank && latest.rank 
      ? previous.rank - latest.rank // Positive means improved rank
      : 0;

    return {
      salesGrowthPercentage: salesGrowth,
      rankChange,
      rankImprovement: rankChange > 0,
      trend: salesGrowth > 0 ? 'improving' : salesGrowth < 0 ? 'declining' : 'stable',
      consistency: this.calculateConsistency(performanceData)
    };
  }

  /**
   * Calculate employee consistency score
   * @param {Array} performanceData - Performance data
   * @returns {number} Consistency score (0-100)
   */
  calculateConsistency(performanceData) {
    if (performanceData.length < 3) return 100;

    const salesValues = performanceData.map(p => p.totalSales).filter(v => v > 0);
    if (salesValues.length < 2) return 0;

    const average = salesValues.reduce((a, b) => a + b, 0) / salesValues.length;
    const variance = salesValues.reduce((acc, val) => acc + Math.pow(val - average, 2), 0) / salesValues.length;
    const stdDev = Math.sqrt(variance);
    
    // Convert to consistency score (lower std dev = higher consistency)
    const coefficientOfVariation = average > 0 ? stdDev / average : 1;
    return Math.max(0, Math.min(100, 100 - (coefficientOfVariation * 100)));
  }

  /**
   * Get week number in a month
   * @param {Date} date - Date object
   * @returns {number} Week number
   */
  getWeekNumber(date) {
    const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
    const daysDiff = Math.floor((date - firstDay) / (24 * 60 * 60 * 1000));
    return Math.floor(daysDiff / 7) + 1;
  }

  /**
   * Export employee analytics to CSV format
   * @param {Object} analyticsData - Analytics data
   * @returns {string} CSV string
   */
  exportToCSV(analyticsData) {
    const headers = [
      'Rank',
      'Employee Name',
      'Employee ID',
      'Department',
      'Total Sales',
      'Total Invoices',
      'Average Invoice Value',
      'Performance %'
    ];

    const rows = analyticsData.employeePerformance.map(emp => [
      emp.rank,
      emp.employeeName,
      emp.employeeDetails?.employeeId || 'N/A',
      emp.employeeDetails?.department || 'N/A',
      emp.totalSales.toFixed(2),
      emp.totalInvoices,
      emp.averageInvoiceValue.toFixed(2),
      emp.performancePercentage.toFixed(2) + '%'
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    return csvContent;
  }
}

// Create and export singleton instance
const employeeSalesAnalyticsService = new EmployeeSalesAnalyticsService();
export default employeeSalesAnalyticsService;