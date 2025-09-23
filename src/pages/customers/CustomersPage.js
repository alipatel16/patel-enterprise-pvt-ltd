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
  People as PeopleIcon,
  Person as PersonIcon,
  Business as BusinessIcon,
  TrendingUp as TrendingUpIcon
} from '@mui/icons-material';

import Layout from '../../components/common/Layout/Layout';
import CustomerList from '../../components/customers/CustomerList';
import { CustomerProvider, useCustomer } from '../../contexts/CustomerContext/CustomerContext';
import { useUserType } from '../../contexts/UserTypeContext/UserTypeContext';

// Stats Component
const CustomerStats = () => {
  const { stats, loadCustomerStats } = useCustomer();
  const theme = useTheme();

  useEffect(() => {
    loadCustomerStats();
  }, [loadCustomerStats]);

  const statCards = [
    {
      title: 'Total Customers',
      value: stats.total,
      icon: PeopleIcon,
      color: theme.palette.primary.main
    },
    {
      title: 'Wholesalers',
      value: stats.wholesalers,
      icon: BusinessIcon,
      color: theme.palette.info.main
    },
    {
      title: 'Retailers',
      value: stats.retailers,
      icon: TrendingUpIcon,
      color: theme.palette.success.main
    },
    {
      title: 'Individuals',
      value: stats.individuals,
      icon: PersonIcon,
      color: theme.palette.warning.main
    }
  ];

  return (
    <Grid container spacing={3} sx={{ mb: 3 }}>
      {statCards.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <Grid item xs={6} sm={3} key={index}>
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
const CustomersPageContent = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { getDisplayName } = useUserType();

  const breadcrumbs = [
    {
      label: 'Customers',
      path: '/customers'
    }
  ];

  return (
    <Layout 
      title="Customer Management" 
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
              Customer Management
            </Typography>
            <Typography 
              variant="body1" 
              color="text.secondary"
              sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
            >
              Manage your {getDisplayName().toLowerCase()} customers, track relationships, and maintain contact information.
            </Typography>
          </Box>
          
          {!isMobile && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => navigate('/customers/add')}
              sx={{ 
                whiteSpace: 'nowrap',
                px: 3,
                py: 1.5
              }}
            >
              Add Customer
            </Button>
          )}
        </Box>

        {/* Statistics Cards */}
        <CustomerStats />

        {/* Customer List */}
        <Card>
          <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
            <CustomerList />
          </CardContent>
        </Card>

        {/* Mobile FAB */}
        {isMobile && (
          <Fab
            color="primary"
            aria-label="add customer"
            sx={{
              position: 'fixed',
              bottom: 24,
              right: 24,
              zIndex: theme.zIndex.speedDial
            }}
            onClick={() => navigate('/customers/add')}
          >
            <AddIcon />
          </Fab>
        )}
      </Box>
    </Layout>
  );
};

// Main Component with Provider
const CustomersPage = () => {
  return (
    <CustomerProvider>
      <CustomersPageContent />
    </CustomerProvider>
  );
};

export default CustomersPage;