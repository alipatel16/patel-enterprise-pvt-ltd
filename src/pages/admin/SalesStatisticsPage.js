import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Alert,
  Chip,
  Divider,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Stack
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  AttachMoney as MoneyIcon,
  People as PeopleIcon,
  Receipt as ReceiptIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
  Clear as ClearIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import Layout from '../../components/common/Layout/Layout';
import salesStatsService from '../../services/salesStatsService';
import { useUserType } from '../../contexts/UserTypeContext/UserTypeContext';

const SalesStatisticsPage = () => {
  const { userType } = useUserType();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('daily');
  const [statsData, setStatsData] = useState(null);
  
  // NEW: Date range filter state
  const [fromDate, setFromDate] = useState(null);
  const [toDate, setToDate] = useState(null);
  const [dateFilterActive, setDateFilterActive] = useState(false);

  useEffect(() => {
    loadStatistics();
  }, [userType, selectedPeriod]);

  const loadStatistics = async () => {
    try {
      setLoading(true);
      setError('');

      let stats;
      
      // NEW: Use date range if active, otherwise use period
      if (dateFilterActive && fromDate && toDate) {
        stats = await salesStatsService.getComprehensiveSalesStatsByDateRange(
          userType,
          fromDate,
          toDate
        );
      } else {
        stats = await salesStatsService.getComprehensiveSalesStats(
          userType,
          selectedPeriod
        );
      }

      setStatsData(stats);
    } catch (err) {
      console.error('Error loading statistics:', err);
      setError('Failed to load statistics. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadStatistics();
  };

  // NEW: Handle date range filter application
  const handleApplyDateFilter = () => {
    if (!fromDate || !toDate) {
      setError('Please select both from and to dates');
      return;
    }

    if (fromDate > toDate) {
      setError('From date cannot be after to date');
      return;
    }

    setDateFilterActive(true);
    setSelectedPeriod(''); // Clear period selection when using date range
    loadStatistics();
  };

  // NEW: Handle date range filter clear
  const handleClearDateFilter = () => {
    setFromDate(null);
    setToDate(null);
    setDateFilterActive(false);
    setSelectedPeriod('daily');
    setError('');
    // Will trigger useEffect to reload with default period
  };

  const formatCurrency = (amount) => {
    if (amount >= 100000) {
      return `₹${(amount / 100000).toFixed(2)}L`;
    } else if (amount >= 1000) {
      return `₹${(amount / 1000).toFixed(0)}k`;
    }
    return `₹${amount.toFixed(0)}`;
  };

  const formatAmount = (amount) => {
    return `₹${amount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
  };

  const getPeriodLabel = () => {
    // NEW: Show date range label when date filter is active
    if (dateFilterActive && fromDate && toDate) {
      const formatDate = (date) => {
        return date.toLocaleDateString('en-GB', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        });
      };
      return `${formatDate(fromDate)} to ${formatDate(toDate)}`;
    }
    
    const labels = {
      daily: 'Today',
      weekly: 'This Week',
      monthly: 'This Month',
      all: 'All Time'
    };
    return labels[selectedPeriod] || 'Unknown';
  };

  if (loading) {
    return (
      <Layout title="Sales Statistics" breadcrumbs={[{ label: 'Sales Statistics' }]}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </Layout>
    );
  }

  if (error && !statsData) {
    return (
      <Layout title="Sales Statistics" breadcrumbs={[{ label: 'Sales Statistics' }]}>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      </Layout>
    );
  }

  const { periodSales, customerStats, invoiceStats, pendingPayments, summary } = statsData || {};

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Layout title="Sales Statistics" breadcrumbs={[{ label: 'Sales Statistics' }]}>
        <Container maxWidth="xl">
          {/* Header with Period Selector and Date Range Filter */}
          <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={3} flexWrap="wrap" gap={2}>
            <Typography variant="h4" component="h1">
              Sales Statistics - {getPeriodLabel()}
            </Typography>
            
            <Box display="flex" flexDirection="column" gap={2}>
              {/* Period Selector and Refresh Button */}
              <Box display="flex" gap={2} alignItems="center" justifyContent="flex-end">
                <FormControl size="small" sx={{ minWidth: 150 }}>
                  <InputLabel>Period</InputLabel>
                  <Select
                    value={selectedPeriod}
                    label="Period"
                    onChange={(e) => {
                      setSelectedPeriod(e.target.value);
                      setDateFilterActive(false);
                      setFromDate(null);
                      setToDate(null);
                    }}
                    disabled={dateFilterActive}
                  >
                    <MenuItem value="daily">Daily</MenuItem>
                    <MenuItem value="weekly">Weekly</MenuItem>
                    <MenuItem value="monthly">Monthly</MenuItem>
                    <MenuItem value="all">All Time</MenuItem>
                  </Select>
                </FormControl>
                
                <IconButton onClick={handleRefresh} disabled={refreshing}>
                  <RefreshIcon />
                </IconButton>
              </Box>

              {/* NEW: Date Range Filter */}
              <Box display="flex" gap={2} alignItems="center" flexWrap="wrap" justifyContent="flex-end">
                <DatePicker
                  label="From Date"
                  value={fromDate}
                  onChange={setFromDate}
                  format="dd/MM/yyyy"
                  slotProps={{
                    textField: {
                      size: 'small',
                      sx: { minWidth: 150 }
                    }
                  }}
                />
                
                <DatePicker
                  label="To Date"
                  value={toDate}
                  onChange={setToDate}
                  format="dd/MM/yyyy"
                  minDate={fromDate}
                  slotProps={{
                    textField: {
                      size: 'small',
                      sx: { minWidth: 150 }
                    }
                  }}
                />
                
                <Button
                  variant="contained"
                  startIcon={<SearchIcon />}
                  onClick={handleApplyDateFilter}
                  disabled={!fromDate || !toDate}
                  size="small"
                >
                  Apply
                </Button>
                
                {dateFilterActive && (
                  <Button
                    variant="outlined"
                    startIcon={<ClearIcon />}
                    onClick={handleClearDateFilter}
                    size="small"
                  >
                    Clear
                  </Button>
                )}
              </Box>
            </Box>
          </Box>

          {/* Error Alert for date validation */}
          {error && statsData && (
            <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
              {error}
            </Alert>
          )}

          {/* Active Date Filter Indicator */}
          {dateFilterActive && fromDate && toDate && (
            <Alert severity="info" sx={{ mb: 3 }}>
              Showing statistics from {fromDate.toLocaleDateString('en-GB')} to {toDate.toLocaleDateString('en-GB')}
            </Alert>
          )}

          {/* Summary Cards */}
          <Grid container spacing={3} mb={3}>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Box>
                      <Typography color="textSecondary" variant="body2">
                        Total Sales
                      </Typography>
                      <Typography variant="h5" fontWeight="bold">
                        {summary?.totalSales || 0}
                      </Typography>
                    </Box>
                    <ReceiptIcon sx={{ fontSize: 40, color: 'primary.main' }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Box>
                      <Typography color="textSecondary" variant="body2">
                        Total Revenue
                      </Typography>
                      <Typography variant="h5" fontWeight="bold">
                        {formatCurrency(summary?.totalAmount || 0)}
                      </Typography>
                    </Box>
                    <MoneyIcon sx={{ fontSize: 40, color: 'success.main' }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Box>
                      <Typography color="textSecondary" variant="body2">
                        New Customers
                      </Typography>
                      <Typography variant="h5" fontWeight="bold">
                        {customerStats?.[selectedPeriod]?.count || customerStats?.dateRange?.count || 0}
                      </Typography>
                    </Box>
                    <PeopleIcon sx={{ fontSize: 40, color: 'info.main' }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Box>
                      <Typography color="textSecondary" variant="body2">
                        Avg Order Value
                      </Typography>
                      <Typography variant="h5" fontWeight="bold">
                        {formatCurrency(summary?.averageOrderValue || 0)}
                      </Typography>
                    </Box>
                    <TrendingUpIcon sx={{ fontSize: 40, color: 'warning.main' }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Payment Type Breakdown */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Sales by Payment Type - {getPeriodLabel()}
              </Typography>
              <Grid container spacing={2} mt={1}>
                <Grid item xs={12} sm={6} md={3}>
                  <Paper elevation={0} sx={{ p: 2, bgcolor: 'success.light' }}>
                    <Typography variant="body2" color="textSecondary">
                      Full Payment
                    </Typography>
                    <Typography variant="h6" fontWeight="bold">
                      {periodSales?.fullPayment?.count || 0} invoices
                    </Typography>
                    <Typography variant="body2">
                      {formatAmount(periodSales?.fullPayment?.totalAmount || 0)}
                    </Typography>
                  </Paper>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                  <Paper elevation={0} sx={{ p: 2, bgcolor: 'info.light' }}>
                    <Typography variant="body2" color="textSecondary">
                      EMI Payment
                    </Typography>
                    <Typography variant="h6" fontWeight="bold">
                      {periodSales?.emiPayment?.count || 0} invoices
                    </Typography>
                    <Typography variant="body2">
                      {formatAmount(periodSales?.emiPayment?.totalAmount || 0)}
                    </Typography>
                  </Paper>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                  <Paper elevation={0} sx={{ p: 2, bgcolor: 'warning.light' }}>
                    <Typography variant="body2" color="textSecondary">
                      Finance Payment
                    </Typography>
                    <Typography variant="h6" fontWeight="bold">
                      {periodSales?.financePayment?.count || 0} invoices
                    </Typography>
                    <Typography variant="body2">
                      {formatAmount(periodSales?.financePayment?.totalAmount || 0)}
                    </Typography>
                  </Paper>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                  <Paper elevation={0} sx={{ p: 2, bgcolor: 'error.light' }}>
                    <Typography variant="body2" color="textSecondary">
                      Pending Payment
                    </Typography>
                    <Typography variant="h6" fontWeight="bold">
                      {periodSales?.pendingPayment?.count || 0} invoices
                    </Typography>
                    <Typography variant="body2">
                      {formatAmount(periodSales?.pendingPayment?.totalAmount || 0)}
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Pending Payments Detail */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Box>
                  <Typography variant="h6" gutterBottom>
                    Total Pending Payments from Market
                  </Typography>
                  {dateFilterActive && fromDate && toDate && (
                    <Typography variant="caption" color="text.secondary">
                      From sales between {fromDate.toLocaleDateString('en-GB')} and {toDate.toLocaleDateString('en-GB')}
                    </Typography>
                  )}
                </Box>
              </Box>
              <Typography variant="h4" color="error.main" gutterBottom>
                {formatAmount(pendingPayments?.total || 0)}
              </Typography>

              <Divider sx={{ my: 2 }} />

              {/* EMI Pending Payments */}
              <Typography variant="h6" color="info.main" gutterBottom sx={{ mt: 2 }}>
                EMI Payments Pending: {formatAmount(pendingPayments?.emi?.totalPending || 0)}
              </Typography>
              <TableContainer component={Paper} variant="outlined" sx={{ mb: 3 }}>
                <Table size="small" sx={{ minWidth: 650 }}>
                  <TableHead>
                    <TableRow sx={{ backgroundColor: 'grey.100' }}>
                      <TableCell sx={{ fontWeight: 'bold', width: '25%' }}>Customer Name</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold', width: '20%' }}>Pending Amount</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', width: '55%' }}>Description</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {Object.entries(pendingPayments?.emi?.byCustomer || {}).map(([customer, data]) => (
                      <TableRow key={customer} hover>
                        <TableCell sx={{ width: '25%' }}>{customer}</TableCell>
                        <TableCell align="right" sx={{ width: '20%', fontWeight: 'medium' }}>
                          {formatAmount(data.totalPending)}
                        </TableCell>
                        <TableCell sx={{ width: '55%' }}>
                          Total EMI payment pending from {customer} is {formatCurrency(data.totalPending)}
                        </TableCell>
                      </TableRow>
                    ))}
                    {Object.keys(pendingPayments?.emi?.byCustomer || {}).length === 0 && (
                      <TableRow>
                        <TableCell colSpan={3} align="center" sx={{ py: 3 }}>
                          <Typography color="textSecondary">No pending EMI payments</Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>

              {/* Finance Pending Payments */}
              <Typography variant="h6" color="warning.main" gutterBottom>
                Finance Payments Pending: {formatAmount(pendingPayments?.finance?.totalPending || 0)}
              </Typography>
              <TableContainer component={Paper} variant="outlined" sx={{ mb: 3 }}>
                <Table size="small" sx={{ minWidth: 650 }}>
                  <TableHead>
                    <TableRow sx={{ backgroundColor: 'grey.100' }}>
                      <TableCell sx={{ fontWeight: 'bold', width: '25%' }}>Finance Company</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold', width: '20%' }}>Pending Amount</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', width: '55%' }}>Description</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {Object.entries(pendingPayments?.finance?.byCompany || {}).map(([company, data]) => (
                      <TableRow key={company} hover>
                        <TableCell sx={{ width: '25%' }}>{company}</TableCell>
                        <TableCell align="right" sx={{ width: '20%', fontWeight: 'medium' }}>
                          {formatAmount(data.totalPending)}
                        </TableCell>
                        <TableCell sx={{ width: '55%' }}>
                          Remaining finance payment pending from {company} is {formatCurrency(data.totalPending)}
                        </TableCell>
                      </TableRow>
                    ))}
                    {Object.keys(pendingPayments?.finance?.byCompany || {}).length === 0 && (
                      <TableRow>
                        <TableCell colSpan={3} align="center" sx={{ py: 3 }}>
                          <Typography color="textSecondary">No pending finance payments</Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>

              {/* Pending Payments */}
              <Typography variant="h6" color="error.main" gutterBottom>
                Pending Payments: {formatAmount(pendingPayments?.pending?.totalPending || 0)}
              </Typography>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small" sx={{ minWidth: 650 }}>
                  <TableHead>
                    <TableRow sx={{ backgroundColor: 'grey.100' }}>
                      <TableCell sx={{ fontWeight: 'bold', width: '25%' }}>Customer Name</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold', width: '20%' }}>Pending Amount</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', width: '55%' }}>Description</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {Object.entries(pendingPayments?.pending?.byCustomer || {}).map(([customer, data]) => (
                      <TableRow key={customer} hover>
                        <TableCell sx={{ width: '25%' }}>{customer}</TableCell>
                        <TableCell align="right" sx={{ width: '20%', fontWeight: 'medium' }}>
                          {formatAmount(data.totalPending)}
                        </TableCell>
                        <TableCell sx={{ width: '55%' }}>
                          Pending payment from {customer} is {formatCurrency(data.totalPending)}
                        </TableCell>
                      </TableRow>
                    ))}
                    {Object.keys(pendingPayments?.pending?.byCustomer || {}).length === 0 && (
                      <TableRow>
                        <TableCell colSpan={3} align="center" sx={{ py: 3 }}>
                          <Typography color="textSecondary">No pending payments</Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>

          {/* Customer & Invoice Stats */}
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Customer Registration Stats
                  </Typography>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Period</TableCell>
                          <TableCell align="right">Count</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {!dateFilterActive ? (
                          <>
                            <TableRow>
                              <TableCell>Daily</TableCell>
                              <TableCell align="right">
                                <Chip label={customerStats?.daily?.count || 0} color="primary" size="small" />
                              </TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell>Weekly</TableCell>
                              <TableCell align="right">
                                <Chip label={customerStats?.weekly?.count || 0} color="info" size="small" />
                              </TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell>Monthly</TableCell>
                              <TableCell align="right">
                                <Chip label={customerStats?.monthly?.count || 0} color="success" size="small" />
                              </TableCell>
                            </TableRow>
                          </>
                        ) : (
                          <TableRow>
                            <TableCell>Selected Range</TableCell>
                            <TableCell align="right">
                              <Chip label={customerStats?.dateRange?.count || 0} color="primary" size="small" />
                            </TableCell>
                          </TableRow>
                        )}
                        <TableRow>
                          <TableCell><strong>Total</strong></TableCell>
                          <TableCell align="right">
                            <Chip label={customerStats?.total || 0} color="default" size="small" />
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Invoice Creation Stats
                  </Typography>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Period</TableCell>
                          <TableCell align="right">Count</TableCell>
                          <TableCell align="right">Amount</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {!dateFilterActive ? (
                          <>
                            <TableRow>
                              <TableCell>Daily</TableCell>
                              <TableCell align="right">
                                <Chip label={invoiceStats?.daily?.count || 0} color="primary" size="small" />
                              </TableCell>
                              <TableCell align="right">{formatCurrency(invoiceStats?.daily?.totalAmount || 0)}</TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell>Weekly</TableCell>
                              <TableCell align="right">
                                <Chip label={invoiceStats?.weekly?.count || 0} color="info" size="small" />
                              </TableCell>
                              <TableCell align="right">{formatCurrency(invoiceStats?.weekly?.totalAmount || 0)}</TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell>Monthly</TableCell>
                              <TableCell align="right">
                                <Chip label={invoiceStats?.monthly?.count || 0} color="success" size="small" />
                              </TableCell>
                              <TableCell align="right">{formatCurrency(invoiceStats?.monthly?.totalAmount || 0)}</TableCell>
                            </TableRow>
                          </>
                        ) : (
                          <TableRow>
                            <TableCell>Selected Range</TableCell>
                            <TableCell align="right">
                              <Chip label={invoiceStats?.dateRange?.count || 0} color="primary" size="small" />
                            </TableCell>
                            <TableCell align="right">{formatCurrency(invoiceStats?.dateRange?.totalAmount || 0)}</TableCell>
                          </TableRow>
                        )}
                        <TableRow>
                          <TableCell><strong>Total</strong></TableCell>
                          <TableCell align="right">
                            <Chip label={invoiceStats?.total?.count || 0} color="default" size="small" />
                          </TableCell>
                          <TableCell align="right">
                            <strong>{formatCurrency(invoiceStats?.total?.totalAmount || 0)}</strong>
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Container>
      </Layout>
    </LocalizationProvider>
  );
};

export default SalesStatisticsPage;