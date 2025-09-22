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
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  AttachMoney as MoneyIcon,
  People as PeopleIcon,
  Receipt as ReceiptIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
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

  useEffect(() => {
    loadStatistics();
  }, [userType, selectedPeriod]);

  const loadStatistics = async () => {
    try {
      setLoading(true);
      setError('');

      const stats = await salesStatsService.getComprehensiveSalesStats(
        userType,
        selectedPeriod
      );

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

  if (error) {
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
    <Layout title="Sales Statistics" breadcrumbs={[{ label: 'Sales Statistics' }]}>
      <Container maxWidth="xl">
        {/* Header with Period Selector */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4" component="h1">
            Sales Statistics - {getPeriodLabel()}
          </Typography>
          
          <Box display="flex" gap={2} alignItems="center">
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Period</InputLabel>
              <Select
                value={selectedPeriod}
                label="Period"
                onChange={(e) => setSelectedPeriod(e.target.value)}
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
        </Box>

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
                      {customerStats?.[selectedPeriod]?.count || 0}
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
            <Typography variant="h6" gutterBottom>
              Total Pending Payments from Market
            </Typography>
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
  );
};

export default SalesStatisticsPage;