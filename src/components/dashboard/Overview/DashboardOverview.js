import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  IconButton,
  LinearProgress,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  Avatar,
  Chip,
  alpha,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  People as PeopleIcon,
  Receipt as ReceiptIcon,
  AttachMoney as MoneyIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  ArrowForward as ArrowForwardIcon,
  Add as AddIcon,
  Refresh as RefreshIcon,
  Assessment as AssessmentIcon,
  Notifications as NotificationsIcon
} from '@mui/icons-material';

import StatsCard from './StatsCard';
import RecentActivity from './RecentActivity';
import { useAuth } from '../../../contexts/AuthContext/AuthContext';
import { useUserType } from '../../../contexts/UserTypeContext/UserTypeContext';
import { formatCurrency, formatDate, formatPercentage } from '../../../utils/helpers/formatHelpers';

/**
 * Dashboard overview component showing key metrics and recent activity
 * @param {Object} props
 * @param {Object} props.dashboardData - Dashboard statistics
 * @param {boolean} props.loading - Loading state
 * @param {function} props.onRefresh - Refresh callback
 */
const DashboardOverview = ({ 
  dashboardData = {}, 
  loading = false, 
  onRefresh 
}) => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { user } = useAuth();
  const { getDisplayName, getThemeColors } = useUserType();
  
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  
  const themeColors = getThemeColors();

  // Default data structure
  const defaultData = {
    stats: {
      totalCustomers: 0,
      totalSales: 0,
      totalRevenue: 0,
      pendingPayments: 0,
      pendingDeliveries: 0,
      monthlyGrowth: 0
    },
    recentSales: [],
    pendingTasks: [],
    monthlyData: [],
    topCustomers: []
  };

  const data = { ...defaultData, ...dashboardData };

  // Handle quick actions
  const handleQuickAction = (action) => {
    switch (action) {
      case 'new-customer':
        navigate('/customers/add');
        break;
      case 'new-invoice':
        navigate('/sales/create');
        break;
      case 'view-customers':
        navigate('/customers');
        break;
      case 'view-sales':
        navigate('/sales');
        break;
      default:
        break;
    }
  };

  // Calculate percentage changes
  const calculatePercentageChange = (current, previous) => {
    if (!previous || previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'paid':
        return theme.palette.success.main;
      case 'pending':
        return theme.palette.warning.main;
      case 'overdue':
        return theme.palette.error.main;
      default:
        return theme.palette.text.secondary;
    }
  };

  return (
    <Box>
      {/* Welcome Section */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box>
            <Typography variant="h4" fontWeight={600} gutterBottom>
              Welcome back, {user?.name}! 👋
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Here's what's happening with your {getDisplayName().toLowerCase()} business today.
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={onRefresh}
              disabled={loading}
              size={isMobile ? 'small' : 'medium'}
            >
              Refresh
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleQuickAction('new-invoice')}
              size={isMobile ? 'small' : 'medium'}
            >
              New Invoice
            </Button>
          </Box>
        </Box>
        
        {loading && <LinearProgress sx={{ mb: 2 }} />}
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} lg={3}>
          <StatsCard
            title="Total Customers"
            value={data.stats.totalCustomers}
            icon={<PeopleIcon />}
            color={themeColors.primary}
            trend={{
              value: calculatePercentageChange(data.stats.totalCustomers, data.stats.previousCustomers),
              isPositive: true
            }}
            onClick={() => handleQuickAction('view-customers')}
          />
        </Grid>
        
        <Grid item xs={12} sm={6} lg={3}>
          <StatsCard
            title="Monthly Sales"
            value={data.stats.totalSales}
            icon={<ReceiptIcon />}
            color={theme.palette.info.main}
            trend={{
              value: calculatePercentageChange(data.stats.totalSales, data.stats.previousSales),
              isPositive: data.stats.totalSales >= data.stats.previousSales
            }}
            onClick={() => handleQuickAction('view-sales')}
          />
        </Grid>
        
        <Grid item xs={12} sm={6} lg={3}>
          <StatsCard
            title="Monthly Revenue"
            value={formatCurrency(data.stats.totalRevenue)}
            icon={<MoneyIcon />}
            color={theme.palette.success.main}
            trend={{
              value: calculatePercentageChange(data.stats.totalRevenue, data.stats.previousRevenue),
              isPositive: data.stats.totalRevenue >= data.stats.previousRevenue
            }}
            onClick={() => navigate('/reports/sales')}
          />
        </Grid>
        
        <Grid item xs={12} sm={6} lg={3}>
          <StatsCard
            title="Pending Payments"
            value={data.stats.pendingPayments}
            icon={<WarningIcon />}
            color={theme.palette.warning.main}
            urgent={data.stats.pendingPayments > 0}
            onClick={() => navigate('/sales?status=pending')}
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Recent Sales */}
        <Grid item xs={12} lg={8}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" fontWeight={600}>
                  Recent Sales
                </Typography>
                <Button
                  endIcon={<ArrowForwardIcon />}
                  onClick={() => navigate('/sales/history')}
                  size="small"
                >
                  View All
                </Button>
              </Box>
              
              {data.recentSales.length > 0 ? (
                <List>
                  {data.recentSales.slice(0, 5).map((sale, index) => (
                    <ListItem key={sale.id || index} divider={index < 4}>
                      <ListItemIcon>
                        <Avatar
                          sx={{
                            width: 40,
                            height: 40,
                            backgroundColor: alpha(themeColors.primary, 0.1),
                            color: themeColors.primary
                          }}
                        >
                          <ReceiptIcon />
                        </Avatar>
                      </ListItemIcon>
                      
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="subtitle2" fontWeight={500}>
                              {sale.customerName || 'Unknown Customer'}
                            </Typography>
                            <Chip
                              label={sale.paymentStatus || 'pending'}
                              size="small"
                              sx={{
                                backgroundColor: alpha(getStatusColor(sale.paymentStatus), 0.1),
                                color: getStatusColor(sale.paymentStatus),
                                textTransform: 'capitalize'
                              }}
                            />
                          </Box>
                        }
                        secondary={
                          <Typography variant="body2" color="text.secondary">
                            Invoice #{sale.invoiceNumber} • {formatDate(sale.createdAt)}
                          </Typography>
                        }
                      />
                      
                      <ListItemSecondaryAction>
                        <Typography variant="subtitle2" fontWeight={600} color="success.main">
                          {formatCurrency(sale.totalAmount)}
                        </Typography>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    py: 4,
                    color: 'text.secondary'
                  }}
                >
                  <ReceiptIcon sx={{ fontSize: 48, mb: 1, opacity: 0.5 }} />
                  <Typography variant="body1" gutterBottom>
                    No recent sales
                  </Typography>
                  <Typography variant="body2">
                    Create your first invoice to get started
                  </Typography>
                  <Button
                    variant="outlined"
                    startIcon={<AddIcon />}
                    onClick={() => handleQuickAction('new-invoice')}
                    sx={{ mt: 2 }}
                  >
                    Create Invoice
                  </Button>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Quick Actions & Alerts */}
        <Grid item xs={12} lg={4}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Quick Actions */}
            <Card>
              <CardContent>
                <Typography variant="h6" fontWeight={600} gutterBottom>
                  Quick Actions
                </Typography>
                
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<PeopleIcon />}
                      onClick={() => handleQuickAction('new-customer')}
                      sx={{ height: 48, textTransform: 'none' }}
                    >
                      Add Customer
                    </Button>
                  </Grid>
                  
                  <Grid item xs={6}>
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<ReceiptIcon />}
                      onClick={() => handleQuickAction('new-invoice')}
                      sx={{ height: 48, textTransform: 'none' }}
                    >
                      New Invoice
                    </Button>
                  </Grid>
                  
                  <Grid item xs={6}>
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<AssessmentIcon />}
                      onClick={() => navigate('/reports')}
                      sx={{ height: 48, textTransform: 'none' }}
                    >
                      Reports
                    </Button>
                  </Grid>
                  
                  <Grid item xs={6}>
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<NotificationsIcon />}
                      onClick={() => navigate('/notifications')}
                      sx={{ height: 48, textTransform: 'none' }}
                    >
                      Alerts
                    </Button>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            {/* Pending Tasks */}
            <Card>
              <CardContent>
                <Typography variant="h6" fontWeight={600} gutterBottom>
                  Pending Tasks
                </Typography>
                
                {data.pendingTasks.length > 0 ? (
                  <List dense>
                    {data.pendingTasks.slice(0, 3).map((task, index) => (
                      <ListItem key={index}>
                        <ListItemIcon>
                          <ScheduleIcon 
                            fontSize="small" 
                            color={task.urgent ? 'error' : 'warning'} 
                          />
                        </ListItemIcon>
                        <ListItemText
                          primary={task.title}
                          secondary={task.description}
                          primaryTypographyProps={{
                            variant: 'body2',
                            fontWeight: 500
                          }}
                          secondaryTypographyProps={{
                            variant: 'caption'
                          }}
                        />
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <Box sx={{ textAlign: 'center', py: 2 }}>
                    <CheckCircleIcon sx={{ fontSize: 32, color: 'success.main', mb: 1 }} />
                    <Typography variant="body2" color="text.secondary">
                      All caught up! 🎉
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>

            {/* Top Customers */}
            <Card>
              <CardContent>
                <Typography variant="h6" fontWeight={600} gutterBottom>
                  Top Customers
                </Typography>
                
                {data.topCustomers.length > 0 ? (
                  <List dense>
                    {data.topCustomers.slice(0, 3).map((customer, index) => (
                      <ListItem key={customer.id || index}>
                        <ListItemIcon>
                          <Avatar
                            sx={{
                              width: 32,
                              height: 32,
                              backgroundColor: themeColors.primary,
                              fontSize: '0.875rem'
                            }}
                          >
                            {customer.name?.[0]?.toUpperCase()}
                          </Avatar>
                        </ListItemIcon>
                        <ListItemText
                          primary={customer.name}
                          secondary={`${customer.totalOrders} orders`}
                          primaryTypographyProps={{
                            variant: 'body2',
                            fontWeight: 500
                          }}
                          secondaryTypographyProps={{
                            variant: 'caption'
                          }}
                        />
                        <ListItemSecondaryAction>
                          <Typography variant="caption" fontWeight={600} color="success.main">
                            {formatCurrency(customer.totalValue)}
                          </Typography>
                        </ListItemSecondaryAction>
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <Box sx={{ textAlign: 'center', py: 2 }}>
                    <PeopleIcon sx={{ fontSize: 32, opacity: 0.5, mb: 1 }} />
                    <Typography variant="body2" color="text.secondary">
                      No customer data yet
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

export default DashboardOverview;