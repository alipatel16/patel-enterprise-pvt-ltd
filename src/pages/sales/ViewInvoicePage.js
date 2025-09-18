import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  Alert,
  Grid,
  Chip,
  useTheme,
  useMediaQuery,
  Tabs,
  Tab,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  Print as PrintIcon,
  Download as DownloadIcon,
  Receipt as ReceiptIcon,
  AccountBalance as EMIIcon,
  LocalShipping as DeliveryIcon,
  Payment as PaymentIcon
} from '@mui/icons-material';

import Layout from '../../components/common/Layout/Layout';
import LoadingSpinner from '../../components/common/UI/LoadingSpinner';
import InvoicePreview from '../../components/sales/Invoice/InvoicePreview';
import { SalesProvider, useSales } from '../../contexts/SalesContext/SalesContext';
import { useAuth } from '../../contexts/AuthContext/AuthContext';
import { useUserType } from '../../contexts/UserTypeContext/UserTypeContext';
import { formatDate } from '../../utils/helpers/formatHelpers';
import { USER_ROLES, PAYMENT_STATUS, DELIVERY_STATUS } from '../../utils/constants/appConstants';
// Import the EMI Management component (adjust path as needed)
import EMIManagement from '../../components/sales/EMI/EMIManagement';
import InstallmentPaymentDialog from '../../components/sales/EMI/InstallmentPaymentDialog';

/**
 * View Invoice page content component (wrapped in providers)
 */
const ViewInvoicePageContent = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [searchParams] = useSearchParams();
  
  const {
    currentInvoice,
    loading,
    error,
    getInvoiceById,
    clearError,
    recordInstallmentPayment,
    getPendingInstallments
  } = useSales();
  
  const { user } = useAuth();
  const { getDisplayName } = useUserType();

  const [currentTab, setCurrentTab] = useState(0);
  
  // NEW: EMI Payment states
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [selectedInstallment, setSelectedInstallment] = useState(null);
  const [pendingInstallments, setPendingInstallments] = useState([]);
  
  // Load invoice data
  useEffect(() => {
    if (id) {
      getInvoiceById(id);
    }
  }, [id, getInvoiceById]);

  // Auto-switch to EMI tab when coming from notifications
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'emi' && currentInvoice?.paymentStatus === PAYMENT_STATUS.EMI) {
      setCurrentTab(2); // EMI tab index
    }
  }, [currentInvoice, searchParams]);

  // Load pending installments for EMI invoices
  useEffect(() => {
    const loadPendingInstallments = async () => {
      if (currentInvoice && currentInvoice.paymentStatus === PAYMENT_STATUS.EMI && getPendingInstallments) {
        try {
          const pending = await getPendingInstallments(currentInvoice.id);
          setPendingInstallments(pending);
        } catch (error) {
          console.error('Error loading pending installments:', error);
        }
      }
    };

    loadPendingInstallments();
  }, [currentInvoice, getPendingInstallments]);

  // Clear errors on mount
  useEffect(() => {
    clearError();
  }, [clearError]);

  // NEW: Handle EMI payment recording
  const handlePaymentRecord = async (installmentNumber, paymentAmount, paymentDetails) => {
    if (!currentInvoice || !recordInstallmentPayment) return;

    try {
      await recordInstallmentPayment(
        currentInvoice.id, 
        installmentNumber, 
        paymentAmount, 
        paymentDetails
      );
      
      // Reload invoice to reflect changes
      await getInvoiceById(id);
      
      // Reload pending installments
      const pending = await getPendingInstallments(currentInvoice.id);
      setPendingInstallments(pending);
      
      setPaymentDialogOpen(false);
      setSelectedInstallment(null);
    } catch (error) {
      throw error; // Let dialog handle error display
    }
  };

  // NEW: Handle quick payment click
  const handleQuickPaymentClick = () => {
    if (pendingInstallments.length > 0) {
      // Get the most urgent installment (overdue or due today)
      const urgentInstallment = pendingInstallments.find(inst => 
        inst.isOverdue || inst.isDueToday
      ) || pendingInstallments[0]; // or just first pending

      setSelectedInstallment(urgentInstallment);
      setPaymentDialogOpen(true);
    }
  };

  // Handle edit
  const handleEdit = () => {
    navigate(`/sales/edit/${id}`);
  };

  const breadcrumbs = [
    {
      label: 'Sales',
      path: '/sales'
    },
    {
      label: currentInvoice?.invoiceNumber || 'Invoice Details',
      path: `/sales/view/${id}`
    }
  ];

  // Handle print
  const handlePrint = () => {
    window.print();
  };

  // Handle download
  const handleDownload = () => {
    // Implementation for PDF download
    console.log('Download invoice as PDF');
  };

  // Handle back navigation
  const handleBack = () => {
    navigate('/sales');
  };

  // Check if user can edit/delete
  const canEdit = user?.role === USER_ROLES.ADMIN || 
    (user?.role === USER_ROLES.EMPLOYEE && user?.canCreateInvoices);
  const canDelete = user?.role === USER_ROLES.ADMIN;

  // NEW: Get urgent installment count
  const urgentInstallmentCount = pendingInstallments.filter(inst => 
    inst.isOverdue || inst.isDueToday
  ).length;

  if (loading) {
    return (
      <Layout>
        <Container maxWidth="lg" sx={{ py: 3 }}>
          <LoadingSpinner message="Loading invoice..." />
        </Container>
      </Layout>
    );
  }

  if (error && !currentInvoice) {
    return (
      <Layout>
        <Container maxWidth="lg" sx={{ py: 3 }}>
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={handleBack}
          >
            Back to Sales
          </Button>
        </Container>
      </Layout>
    );
  }

  if (!currentInvoice) {
    return (
      <Layout>
        <Container maxWidth="lg" sx={{ py: 3 }}>
          <Alert severity="warning" sx={{ mb: 2 }}>
            Invoice not found
          </Alert>
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={handleBack}
          >
            Back to Sales
          </Button>
        </Container>
      </Layout>
    );
  }

  // NEW: Define tabs based on invoice type
  const tabs = [
    { label: 'Invoice Details', icon: <ReceiptIcon /> },
    { label: 'Delivery', icon: <DeliveryIcon /> }
  ];

  // Add EMI tab only for EMI invoices
  if (currentInvoice.paymentStatus === PAYMENT_STATUS.EMI) {
    tabs.push({
      label: 'EMI Management',
      icon: <EMIIcon />,
      badge: pendingInstallments.length
    });
  }

  return (
    <Layout title="Invoice Details" breadcrumbs={breadcrumbs}>
      <Container 
        maxWidth="xl" 
        sx={{ 
          py: { xs: 2, sm: 3 },
          px: { xs: 1, sm: 2 }
        }}
      >
        {/* Header */}
        <Box sx={{ mb: 3 }}>
          {/* Page Title and Actions */}
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
            <Box>
              <Typography 
                variant="h4" 
                sx={{ 
                  fontSize: { xs: '1.5rem', sm: '2rem' },
                  fontWeight: 600,
                  mb: 1
                }}
              >
                Invoice #{currentInvoice.invoiceNumber}
              </Typography>
              <Typography 
                variant="body1" 
                color="text.secondary"
                sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
              >
                {getDisplayName()} invoice for {currentInvoice.customerName}
              </Typography>
            </Box>
            
            <Box 
              sx={{ 
                display: 'flex', 
                gap: 1,
                width: { xs: '100%', sm: 'auto' },
                flexDirection: { xs: 'column', sm: 'row' }
              }}
            >
              <Button
                variant="outlined"
                startIcon={<ArrowBackIcon />}
                onClick={handleBack}
                sx={{ 
                  flex: { xs: 1, sm: 'none' }
                }}
              >
                Back
              </Button>

              {/* NEW: Quick EMI Payment Button - Only show for EMI invoices with pending installments */}
              {currentInvoice.paymentStatus === PAYMENT_STATUS.EMI && 
               pendingInstallments.length > 0 && 
               recordInstallmentPayment && (
                <Button
                  variant="contained"
                  color={urgentInstallmentCount > 0 ? 'error' : 'warning'}
                  startIcon={<PaymentIcon />}
                  onClick={handleQuickPaymentClick}
                  sx={{ 
                    flex: { xs: 1, sm: 'none' }
                  }}
                >
                  {urgentInstallmentCount > 0 
                    ? `Pay Urgent EMI (${urgentInstallmentCount})`
                    : 'Record EMI Payment'
                  }
                </Button>
              )}
              
              <Button
                variant="outlined"
                startIcon={<PrintIcon />}
                onClick={handlePrint}
                sx={{ 
                  flex: { xs: 1, sm: 'none' }
                }}
              >
                Print
              </Button>
              
              <Button
                variant="outlined"
                startIcon={<DownloadIcon />}
                onClick={handleDownload}
                sx={{ 
                  flex: { xs: 1, sm: 'none' }
                }}
              >
                Download
              </Button>
              
              {canEdit && (
                <Button
                  variant="contained"
                  startIcon={<EditIcon />}
                  onClick={handleEdit}
                  sx={{ 
                    flex: { xs: 1, sm: 'none' }
                  }}
                >
                  Edit
                </Button>
              )}
              
              {/* {canDelete && (
                <IconButton
                  color="error"
                  onClick={() => setShowDeleteDialog(true)}
                  sx={{
                    alignSelf: { xs: 'stretch', sm: 'center' },
                    width: { xs: '100%', sm: 'auto' },
                    height: { xs: '40px', sm: 'auto' }
                  }}
                >
                  <DeleteIcon />
                </IconButton>
              )} */}
            </Box>
          </Box>

          {/* Invoice Status */}
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
            <Chip
              label={`Payment: ${currentInvoice.paymentStatus}`}
              color={currentInvoice.paymentStatus === PAYMENT_STATUS.PAID ? 'success' : 'warning'}
              size={isMobile ? 'small' : 'medium'}
            />
            <Chip
              label={`Delivery: ${currentInvoice.deliveryStatus}`}
              color={currentInvoice.deliveryStatus === DELIVERY_STATUS.DELIVERED ? 'success' : 'info'}
              variant="outlined"
              size={isMobile ? 'small' : 'medium'}
            />
            <Chip
              label={formatDate(currentInvoice.saleDate)}
              variant="outlined"
              size={isMobile ? 'small' : 'medium'}
            />
            {/* NEW: EMI Status Chip */}
            {currentInvoice.paymentStatus === PAYMENT_STATUS.EMI && (
              <Chip
                label={`${currentInvoice.emiDetails?.schedule?.filter(emi => emi.paid)?.length || 0}/${currentInvoice.emiDetails?.schedule?.length || 0} Installments Paid`}
                color="info"
                variant="outlined"
                size={isMobile ? 'small' : 'medium'}
              />
            )}
          </Box>
        </Box>

        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={clearError}>
            {error}
          </Alert>
        )}

        {/* NEW: Tabs for different sections */}
        <Paper 
          sx={{ 
            backgroundColor: 'background.paper',
            borderRadius: 2,
            overflow: 'hidden',
            mb: 3
          }}
        >
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={currentTab} onChange={(e, newValue) => setCurrentTab(newValue)}>
              {tabs.map((tab, index) => (
                <Tab
                  key={index}
                  label={
                    <Box display="flex" alignItems="center" gap={1}>
                      {tab.icon}
                      {tab.label}
                      {tab.badge > 0 && (
                        <Chip
                          label={tab.badge}
                          size="small"
                          color={urgentInstallmentCount > 0 ? "error" : "warning"}
                          sx={{ ml: 1, fontSize: '0.75rem', height: 20 }}
                        />
                      )}
                    </Box>
                  }
                />
              ))}
            </Tabs>
          </Box>

          <Box sx={{ p: 3 }}>
            {/* Invoice Details Tab */}
            {currentTab === 0 && (
              <InvoicePreview 
                invoice={currentInvoice}
                showActions={false}
              />
            )}

            {/* Delivery Tab */}
            {currentTab === 1 && (
              <Box>
                <Typography variant="h6" gutterBottom>
                  Delivery Information
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      Status
                    </Typography>
                    <Typography variant="body1" fontWeight={500}>
                      {currentInvoice.deliveryStatus}
                    </Typography>
                  </Grid>
                  {currentInvoice.scheduledDeliveryDate && (
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">
                        Scheduled Date
                      </Typography>
                      <Typography variant="body1" fontWeight={500}>
                        {formatDate(currentInvoice.scheduledDeliveryDate)}
                      </Typography>
                    </Grid>
                  )}
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">
                      Delivery Address
                    </Typography>
                    <Typography variant="body1" fontWeight={500}>
                      {currentInvoice.customerAddress}
                    </Typography>
                  </Grid>
                </Grid>
              </Box>
            )}

            {/* NEW: EMI Management Tab */}
            {currentTab === 2 && currentInvoice.paymentStatus === PAYMENT_STATUS.EMI && (
              <EMIManagement invoice={currentInvoice} />
            )}
          </Box>
        </Paper>

        {/* NEW: Quick Payment Dialog for EMI invoices */}
        {recordInstallmentPayment && paymentDialogOpen && selectedInstallment && (
          <InstallmentPaymentDialog
            open={paymentDialogOpen}
            onClose={() => {
              setPaymentDialogOpen(false);
              setSelectedInstallment(null);
            }}
            installment={selectedInstallment}
            invoice={{
              id: currentInvoice.id,
              invoiceNumber: currentInvoice.invoiceNumber,
              customerName: currentInvoice.customerName
            }}
            onPaymentRecorded={handlePaymentRecord}
          />
        )}
      </Container>
    </Layout>
  );
};

/**
 * Main View Invoice page component with providers
 */
const ViewInvoicePage = () => {
  return (
    <SalesProvider>
      <ViewInvoicePageContent />
    </SalesProvider>
  );
};

export default ViewInvoicePage;