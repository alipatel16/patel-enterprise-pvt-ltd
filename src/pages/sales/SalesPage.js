import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Button,
  Alert,
  Snackbar,
  Tab,
  Tabs,
  Paper,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Add as AddIcon,
  Receipt as ReceiptIcon,
  History as HistoryIcon,
  Assessment as AssessmentIcon
} from '@mui/icons-material';

import Layout from '../../components/common/Layout/Layout';
import SalesHistory from '../../components/sales/SalesHistory/SalesHistory';
import LoadingSpinner from '../../components/common/UI/LoadingSpinner';
import { useSales } from '../../hooks/useSales';
import { useAuth } from '../../hooks/useAuth';
import { useUserType } from '../../hooks/useUserType';

/**
 * Sales page component with tabs for different sales views
 */
const SalesPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const {
    sales,
    loading,
    error,
    loadSales,
    clearError,
    statistics
  } = useSales();
  
  const { user } = useAuth();
  const { getDisplayName, getThemeColors } = useUserType();
  
  const [currentTab, setCurrentTab] = useState(0);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  const themeColors = getThemeColors();

  // Handle location state for success messages
  useEffect(() => {
    if (location.state?.message) {
      setSnackbar({
        open: true,
        message: location.state.message,
        severity: location.state.severity || 'success'
      });
      // Clear the location state
      navigate(location.pathname, { replace: true });
    }
  }, [location.state, navigate, location.pathname]);

  // Load sales data on mount
  useEffect(() => {
    loadSales();
  }, [loadSales]);

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
  };

  // Handle create new invoice
  const handleCreateInvoice = () => {
    navigate('/sales/create');
  };

  // Handle snackbar close
  const handleSnackbarClose = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  const tabs = [
    { label: 'Recent Sales', icon: <ReceiptIcon /> },
    { label: 'Sales History', icon: <HistoryIcon /> },
    { label: 'Analytics', icon: <AssessmentIcon /> }
  ];

  return (
    <Layout>
      <Container 
        maxWidth="xl" 
        sx={{ 
          py: { xs: 2, sm: 3 },
          px: { xs: 1, sm: 2 }
        }}
      >
        {/* Header */}
        <Box sx={{ mb: 3 }}>
          <Box 
            sx={{ 
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              justifyContent: 'space-between',
              alignItems: { xs: 'flex-start', sm: 'center' },
              gap: { xs: 2, sm: 0 },
              mb: 2
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <ReceiptIcon 
                color="primary" 
                sx={{ fontSize: { xs: 28, sm: 32 } }}
              />
              <Typography 
                variant="h4" 
                sx={{ 
                  fontSize: { xs: '1.5rem', sm: '2rem' },
                  fontWeight: 600
                }}
              >
                {getDisplayName()} Sales
              </Typography>
            </Box>
            
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleCreateInvoice}
              sx={{
                width: { xs: '100%', sm: 'auto' },
                minWidth: { xs: 'auto', sm: 160 }
              }}
            >
              Create Invoice
            </Button>
          </Box>

          {/* Statistics */}
          {statistics && (
            <Box 
              sx={{ 
                display: 'grid',
                gridTemplateColumns: { 
                  xs: 'repeat(2, 1fr)', 
                  sm: 'repeat(4, 1fr)' 
                },
                gap: { xs: 1, sm: 2 },
                mb: 2
              }}
            >
              <Paper 
                sx={{ 
                  p: { xs: 1.5, sm: 2 }, 
                  textAlign: 'center',
                  backgroundColor: 'background.paper'
                }}
              >
                <Typography 
                  variant="h6" 
                  sx={{ 
                    fontSize: { xs: '1rem', sm: '1.25rem' },
                    fontWeight: 600,
                    color: themeColors.primary
                  }}
                >
                  {statistics.totalSales || 0}
                </Typography>
                <Typography 
                  variant="body2" 
                  color="text.secondary"
                  sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                >
                  Total Sales
                </Typography>
              </Paper>
              
              <Paper 
                sx={{ 
                  p: { xs: 1.5, sm: 2 }, 
                  textAlign: 'center',
                  backgroundColor: 'background.paper'
                }}
              >
                <Typography 
                  variant="h6" 
                  sx={{ 
                    fontSize: { xs: '1rem', sm: '1.25rem' },
                    fontWeight: 600,
                    color: 'success.main'
                  }}
                >
                  ₹{(statistics.totalRevenue || 0).toLocaleString()}
                </Typography>
                <Typography 
                  variant="body2" 
                  color="text.secondary"
                  sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                >
                  Total Revenue
                </Typography>
              </Paper>
              
              <Paper 
                sx={{ 
                  p: { xs: 1.5, sm: 2 }, 
                  textAlign: 'center',
                  backgroundColor: 'background.paper'
                }}
              >
                <Typography 
                  variant="h6" 
                  sx={{ 
                    fontSize: { xs: '1rem', sm: '1.25rem' },
                    fontWeight: 600,
                    color: 'warning.main'
                  }}
                >
                  {statistics.pendingPayments || 0}
                </Typography>
                <Typography 
                  variant="body2" 
                  color="text.secondary"
                  sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                >
                  Pending Payments
                </Typography>
              </Paper>
              
              <Paper 
                sx={{ 
                  p: { xs: 1.5, sm: 2 }, 
                  textAlign: 'center',
                  backgroundColor: 'background.paper'
                }}
              >
                <Typography 
                  variant="h6" 
                  sx={{ 
                    fontSize: { xs: '1rem', sm: '1.25rem' },
                    fontWeight: 600,
                    color: 'info.main'
                  }}
                >
                  {statistics.pendingDeliveries || 0}
                </Typography>
                <Typography 
                  variant="body2" 
                  color="text.secondary"
                  sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                >
                  Pending Deliveries
                </Typography>
              </Paper>
            </Box>
          )}
        </Box>

        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={clearError}>
            {error}
          </Alert>
        )}

        {/* Tabs */}
        <Paper sx={{ mb: 3 }}>
          <Tabs
            value={currentTab}
            onChange={handleTabChange}
            variant={isMobile ? "fullWidth" : "standard"}
            sx={{
              borderBottom: 1,
              borderColor: 'divider',
              '& .MuiTab-root': {
                fontSize: { xs: '0.875rem', sm: '1rem' },
                minHeight: { xs: 48, sm: 64 }
              }
            }}
          >
            {tabs.map((tab, index) => (
              <Tab
                key={index}
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {React.cloneElement(tab.icon, { 
                      fontSize: isMobile ? 'small' : 'medium' 
                    })}
                    <span style={{ display: isMobile ? 'none' : 'block' }}>
                      {tab.label}
                    </span>
                  </Box>
                }
                sx={{
                  minWidth: { xs: 'auto', sm: 120 }
                }}
              />
            ))}
          </Tabs>

          {/* Tab Content */}
          <Box sx={{ p: { xs: 2, sm: 3 } }}>
            {currentTab === 0 && (
              <SalesHistory 
                showFilters={false}
                limit={10}
                title="Recent Sales"
              />
            )}
            
            {currentTab === 1 && (
              <SalesHistory 
                showFilters={true}
                title="Sales History"
              />
            )}
            
            {currentTab === 2 && (
              <Box>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Sales Analytics
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Analytics features coming soon...
                </Typography>
              </Box>
            )}
          </Box>
        </Paper>

        {/* Success Snackbar */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={handleSnackbarClose}
        >
          <Alert
            onClose={handleSnackbarClose}
            severity={snackbar.severity}
            sx={{ width: '100%' }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Container>
    </Layout>
  );
};

export default SalesPage;