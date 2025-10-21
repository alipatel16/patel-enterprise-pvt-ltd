import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Chip,
  Avatar,
  Alert,
  CircularProgress,
  useTheme
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  EmojiEvents as TrophyIcon,
  Person as PersonIcon,
  Assessment as AssessmentIcon,
  Download as DownloadIcon,
  Refresh as RefreshIcon,
  Star as StarIcon,
  ArrowUpward as ArrowUpIcon,
  ArrowDownward as ArrowDownIcon
} from '@mui/icons-material';

import { useAuth } from '../../contexts/AuthContext/AuthContext';
import { useUserType } from '../../contexts/UserTypeContext/UserTypeContext';
import employeeSalesAnalyticsService from '../../services/api/employeeSalesAnalyticsService';
import LoadingSpinner from '../../components/common/UI/LoadingSpinner';

const EmployeeSalesAnalyticsPage = () => {
  const theme = useTheme();
  const { canManageEmployees } = useAuth();
  const { userType, getDisplayName } = useUserType();

  // State management
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState(null);
  const [error, setError] = useState(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [selectedMonth, setSelectedMonth] = useState(String(new Date().getMonth() + 1).padStart(2, '0'));
  const [ monthlyComparison, setMonthlyComparison] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // Check if user has access (admin only)
  const hasAccess = canManageEmployees();

  // Generate year options (current year and previous 2 years)
  const yearOptions = [];
  const currentYear = new Date().getFullYear();
  for (let i = 0; i < 3; i++) {
    yearOptions.push((currentYear - i).toString());
  }

  // Month options
  const monthOptions = [
    { value: '01', label: 'January' },
    { value: '02', label: 'February' },
    { value: '03', label: 'March' },
    { value: '04', label: 'April' },
    { value: '05', label: 'May' },
    { value: '06', label: 'June' },
    { value: '07', label: 'July' },
    { value: '08', label: 'August' },
    { value: '09', label: 'September' },
    { value: '10', label: 'October' },
    { value: '11', label: 'November' },
    { value: '12', label: 'December' }
  ];

  // Load analytics data
  const loadAnalytics = async () => {
    if (!userType || !hasAccess) return;

    try {
      setLoading(true);
      setError(null);

      const [analyticsData, comparisonData] = await Promise.all([
        employeeSalesAnalyticsService.getEmployeeSalesAnalytics(userType, selectedYear, selectedMonth),
        employeeSalesAnalyticsService.getMonthlyComparison(userType, selectedYear, 6)
      ]);

      setAnalytics(analyticsData);
      setMonthlyComparison(comparisonData);
    } catch (err) {
      console.error('Error loading analytics:', err);
      setError(err.message || 'Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  // Refresh data
  const handleRefresh = async () => {
    setRefreshing(true);
    await loadAnalytics();
    setRefreshing(false);
  };

  // Export to CSV
  const handleExportCSV = () => {
    if (!analytics) return;

    try {
      const csvContent = employeeSalesAnalyticsService.exportToCSV(analytics);
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', `employee-analytics-${selectedYear}-${selectedMonth}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error exporting CSV:', error);
    }
  };

  // Load data when component mounts or filters change
  useEffect(() => {
    loadAnalytics();
  }, [userType, selectedYear, selectedMonth, hasAccess]);

  // Render access denied for non-admin users
  if (!hasAccess) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          Access Denied. Only administrators can view employee sales analytics.
        </Alert>
      </Container>
    );
  }

  // Loading state
  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <LoadingSpinner message="Loading employee sales analytics..." />
      </Container>
    );
  }

  // Error state
  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
        <Button variant="contained" onClick={handleRefresh} startIcon={<RefreshIcon />}>
          Retry
        </Button>
      </Container>
    );
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getRankColor = (rank) => {
    if (rank === 1) return '#ffd700'; // Gold
    if (rank === 2) return '#c0c0c0'; // Silver
    if (rank === 3) return '#cd7f32'; // Bronze
    return theme.palette.text.secondary;
  };

  const getRankIcon = (rank) => {
    if (rank <= 3) {
      return <TrophyIcon sx={{ color: getRankColor(rank), fontSize: 20 }} />;
    }
    return <PersonIcon sx={{ color: theme.palette.text.secondary, fontSize: 20 }} />;
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" component="h1" fontWeight="bold" gutterBottom>
            Employee Sales Analytics
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Track and analyze employee sales performance for {getDisplayName()}
          </Typography>
        </Box>
        <Box display="flex" gap={2}>
          <Button
            variant="outlined"
            startIcon={refreshing ? <CircularProgress size={16} /> : <RefreshIcon />}
            onClick={handleRefresh}
            disabled={refreshing}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<DownloadIcon />}
            onClick={handleExportCSV}
            disabled={!analytics?.employeePerformance?.length}
          >
            Export CSV
          </Button>
        </Box>
      </Box>

      {/* Filters */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth>
              <InputLabel>Year</InputLabel>
              <Select
                value={selectedYear}
                label="Year"
                onChange={(e) => setSelectedYear(e.target.value)}
              >
                {yearOptions.map(year => (
                  <MenuItem key={year} value={year}>{year}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth>
              <InputLabel>Month</InputLabel>
              <Select
                value={selectedMonth}
                label="Month"
                onChange={(e) => setSelectedMonth(e.target.value)}
              >
                {monthOptions.map(month => (
                  <MenuItem key={month.value} value={month.value}>
                    {month.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Typography variant="h6" color="primary">
              {analytics?.period?.monthName} {analytics?.period?.year}
            </Typography>
          </Grid>
        </Grid>
      </Paper>

      {analytics && (
        <>
          {/* Summary Cards */}
          <Grid container spacing={3} mb={3}>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Box>
                      <Typography color="textSecondary" gutterBottom variant="body2">
                        Total Sales
                      </Typography>
                      <Typography variant="h5" fontWeight="bold">
                        {formatCurrency(analytics.totalSales)}
                      </Typography>
                    </Box>
                    <TrendingUpIcon sx={{ color: '#4caf50', fontSize: 32 }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Box>
                      <Typography color="textSecondary" gutterBottom variant="body2">
                        Total Invoices
                      </Typography>
                      <Typography variant="h5" fontWeight="bold">
                        {analytics.totalInvoices}
                      </Typography>
                    </Box>
                    <AssessmentIcon sx={{ color: '#2196f3', fontSize: 32 }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Box>
                      <Typography color="textSecondary" gutterBottom variant="body2">
                        Active Employees
                      </Typography>
                      <Typography variant="h5" fontWeight="bold">
                        {analytics.summary.totalActiveEmployees}
                      </Typography>
                    </Box>
                    <PersonIcon sx={{ color: '#ff9800', fontSize: 32 }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Box>
                      <Typography color="textSecondary" gutterBottom variant="body2">
                        Average per Employee
                      </Typography>
                      <Typography variant="h5" fontWeight="bold">
                        {formatCurrency(analytics.averagePerEmployee)}
                      </Typography>
                    </Box>
                    <StarIcon sx={{ color: '#9c27b0', fontSize: 32 }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Top 3 Performers */}
          <Paper sx={{ mb: 3 }}>
            <Box sx={{ p: 3, borderBottom: '1px solid', borderColor: 'divider' }}>
              <Typography variant="h6" fontWeight="bold" display="flex" alignItems="center" gap={1}>
                <TrophyIcon sx={{ color: '#ffd700' }} />
                Top 3 Performers - {analytics.period.monthName} {analytics.period.year}
              </Typography>
            </Box>
            <Box sx={{ p: 3 }}>
              <Grid container spacing={3}>
                {analytics.top3Performers.map((performer, index) => (
                  <Grid item xs={12} md={4} key={performer.employeeId}>
                    <Card 
                      sx={{ 
                        border: index === 0 ? '2px solid #ffd700' : 
                               index === 1 ? '2px solid #c0c0c0' : 
                               '2px solid #cd7f32',
                        position: 'relative',
                        overflow: 'visible'
                      }}
                    >
                      <Box
                        sx={{
                          position: 'absolute',
                          top: -10,
                          left: -10,
                          width: 40,
                          height: 40,
                          borderRadius: '50%',
                          background: index === 0 ? '#ffd700' : 
                                     index === 1 ? '#c0c0c0' : '#cd7f32',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          fontWeight: 'bold',
                          fontSize: '1.2rem'
                        }}
                      >
                        {index + 1}
                      </Box>
                      <CardContent sx={{ pt: 3 }}>
                        <Box display="flex" alignItems="center" gap={2} mb={2}>
                          <Avatar sx={{ bgcolor: theme.palette.primary.main }}>
                            {performer.employeeName.charAt(0)}
                          </Avatar>
                          <Box>
                            <Typography variant="h6" fontWeight="bold">
                              {performer.employeeName}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {performer.employeeDetails?.department || 'N/A'}
                            </Typography>
                          </Box>
                        </Box>
                        <Box>
                          <Typography variant="h5" fontWeight="bold" color="primary">
                            {formatCurrency(performer.totalSales)}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {performer.totalInvoices} invoices • {performer.performancePercentage.toFixed(1)}% of total
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Avg: {formatCurrency(performer.averageInvoiceValue)}
                          </Typography>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Box>
          </Paper>

          {/* All Employees Performance Table */}
          <Paper>
            <Box sx={{ p: 3, borderBottom: '1px solid', borderColor: 'divider' }}>
              <Typography variant="h6" fontWeight="bold">
                All Employee Performance
              </Typography>
            </Box>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Rank</TableCell>
                    <TableCell>Employee</TableCell>
                    <TableCell>Department</TableCell>
                    <TableCell align="right">Total Sales</TableCell>
                    <TableCell align="center">Invoices</TableCell>
                    <TableCell align="right">Avg Invoice</TableCell>
                    <TableCell align="center">Performance %</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {analytics.employeePerformance.map((employee) => (
                    <TableRow 
                      key={employee.employeeId}
                      sx={{ 
                        '&:hover': { backgroundColor: theme.palette.action.hover },
                        backgroundColor: employee.rank <= 3 ? `${getRankColor(employee.rank)}15` : 'inherit'
                      }}
                    >
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1}>
                          {getRankIcon(employee.rank)}
                          <Typography variant="body2" fontWeight={employee.rank <= 3 ? 'bold' : 'normal'}>
                            #{employee.rank}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={2}>
                          <Avatar sx={{ width: 32, height: 32, bgcolor: theme.palette.primary.main }}>
                            {employee.employeeName.charAt(0)}
                          </Avatar>
                          <Box>
                            <Typography variant="body2" fontWeight="bold">
                              {employee.employeeName}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              ID: {employee.employeeDetails?.employeeId || 'N/A'}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={employee.employeeDetails?.department || 'N/A'} 
                          size="small" 
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" fontWeight="bold">
                          {formatCurrency(employee.totalSales)}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Chip 
                          label={employee.totalInvoices} 
                          size="small" 
                          color={employee.totalInvoices > 10 ? 'success' : 'default'}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2">
                          {formatCurrency(employee.averageInvoiceValue)}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Box display="flex" alignItems="center" justifyContent="center" gap={1}>
                          <Typography variant="body2" fontWeight="bold">
                            {employee.performancePercentage.toFixed(1)}%
                          </Typography>
                          {employee.performancePercentage > 20 ? (
                            <ArrowUpIcon sx={{ color: '#4caf50', fontSize: 16 }} />
                          ) : employee.performancePercentage < 5 ? (
                            <ArrowDownIcon sx={{ color: '#f44336', fontSize: 16 }} />
                          ) : null}
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </>
      )}
    </Container>
  );
};

export default EmployeeSalesAnalyticsPage;