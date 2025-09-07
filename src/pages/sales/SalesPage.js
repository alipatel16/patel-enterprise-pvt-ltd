import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Typography,
  Card,
  CardContent,
  Grid,
  useTheme,
  useMediaQuery,
  Fab
} from '@mui/material';
import {
  Add as AddIcon,
  Receipt as ReceiptIcon,
  TrendingUp as TrendingUpIcon,
  AttachMoney as MoneyIcon,
  Schedule as ScheduleIcon,
  LocalShipping as DeliveryIcon
} from '@mui/icons-material';

import Layout from '../../components/common/Layout/Layout';
import SalesHistory from '../../components/sales/SalesHistory/SalesHistory';
import { SalesProvider, useSales } from '../../contexts/SalesContext/SalesContext';
import { useUserType } from '../../contexts/UserTypeContext/UserTypeContext';

// Stats Component
const SalesStats = () => {
  const { stats, loadSalesStats } = useSales();
  const theme = useTheme();

  useEffect(() => {
    loadSalesStats();
  }, [loadSalesStats]);

  const statCards = [
    {
      title: 'Total Sales',
      value: stats.totalSales,
      icon: ReceiptIcon,
      color: theme.palette.primary.main
    },
    {
      title: 'Total Revenue',
      value: `₹${stats.totalAmount.toLocaleString()}`,
      icon: MoneyIcon,
      color: theme.palette.success.main
    },
    {
      title: "Today's Sales",
      value: `₹${stats.todaysAmount.toLocaleString()}`,
      icon: TrendingUpIcon,
      color: theme.palette.info.main
    },
    {
      title: 'Pending EMIs',
      value: stats.emiInvoices,
      icon: ScheduleIcon,
      color: theme.palette.warning.main
    },
    {
      title: 'Pending Deliveries',
      value: stats.pendingDeliveries,
      icon: DeliveryIcon,
      color: theme.palette.error.main
    }
  ];

  return (
    <Grid container spacing={3} sx={{ mb: 3 }}>
      {statCards.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <Grid item xs={6} sm={4} md={2.4} key={index}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography color="textSecondary" gutterBottom variant="body2">
                      {stat.title}
                    </Typography>
                    <Typography variant="h6" component="h2" fontWeight="bold">
                      {stat.value.toLocaleString()}
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      p: 1,
                      borderRadius: '50%',
                      backgroundColor: `${stat.color}15`,
                    }}
                  >
                    <Icon sx={{ color: stat.color, fontSize: 24 }} />
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        );
      })}
    </Grid>
  );
};

// Main Page Content
const SalesHistoryPageContent = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { getDisplayName } = useUserType();

  const breadcrumbs = [
    {
      label: 'Sales History',
      path: '/sales/history'
    }
  ];

  return (
    <Layout 
      title="Sales History" 
      breadcrumbs={breadcrumbs}
    >
      <Box>
        {/* Page Header */}
        <Box 
          display="flex" 
          justifyContent="space-between" 
          alignItems="flex-start" 
          mb={3}
          flexDirection={{ xs: 'column', sm: 'row' }}
          gap={2}
        >
          <Box>
            <Typography 
              variant="h4" 
              component="h1" 
              gutterBottom
              sx={{
                fontSize: { xs: '1.5rem', sm: '2rem', md: '2.125rem' },
                fontWeight: 700
              }}
            >
              Sales History
            </Typography>
            <Typography 
              variant="body1" 
              color="text.secondary"
              sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
            >
              Track and manage all {getDisplayName().toLowerCase()} sales, invoices, and customer transactions.
            </Typography>
          </Box>
          
          {!isMobile && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => navigate('/sales/create')}
              sx={{ 
                whiteSpace: 'nowrap',
                px: 3,
                py: 1.5
              }}
            >
              Create Invoice
            </Button>
          )}
        </Box>

        {/* Statistics Cards */}
        <SalesStats />

        {/* Sales History List */}
        <Card>
          <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
            <SalesHistory />
          </CardContent>
        </Card>

        {/* Mobile FAB */}
        {isMobile && (
          <Fab
            color="primary"
            aria-label="create invoice"
            sx={{
              position: 'fixed',
              bottom: 24,
              right: 24,
              zIndex: theme.zIndex.speedDial
            }}
            onClick={() => navigate('/sales/create')}
          >
            <AddIcon />
          </Fab>
        )}
      </Box>
    </Layout>
  );
};

// Main Component with Provider
const SalesHistoryPage = () => {
  return (
    <SalesProvider>
      <SalesHistoryPageContent />
    </SalesProvider>
  );
};

export default SalesHistoryPage;