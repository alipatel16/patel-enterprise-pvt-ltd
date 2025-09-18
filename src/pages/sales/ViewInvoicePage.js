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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  InputAdornment,
  CircularProgress,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  Print as PrintIcon,
  Download as DownloadIcon,
  Receipt as ReceiptIcon,
  AccountBalance as EMIIcon,
  LocalShipping as DeliveryIcon,
  Payment as PaymentIcon,
  Save as SaveIcon,
  Close as CloseIcon,
  DateRange as DateRangeIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';

import Layout from '../../components/common/Layout/Layout';
import LoadingSpinner from '../../components/common/UI/LoadingSpinner';
import InvoicePreview from '../../components/sales/Invoice/InvoicePreview';
import { SalesProvider, useSales } from '../../contexts/SalesContext/SalesContext';
import { useAuth } from '../../contexts/AuthContext/AuthContext';
import { useUserType } from '../../contexts/UserTypeContext/UserTypeContext';
import { formatDate, formatCurrency } from '../../utils/helpers/formatHelpers';
import { 
  USER_ROLES, 
  PAYMENT_STATUS, 
  DELIVERY_STATUS,
  PAYMENT_METHODS,
  PAYMENT_METHOD_DISPLAY 
} from '../../utils/constants/appConstants';
import EMIManagement from '../../components/sales/EMI/EMIManagement';
import InstallmentPaymentDialog from '../../components/sales/EMI/InstallmentPaymentDialog';
import salesService from '../../services/api/salesService';

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
  const { getDisplayName, userType } = useUserType();

  const [currentTab, setCurrentTab] = useState(0);
  
  // EMI Payment states
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [selectedInstallment, setSelectedInstallment] = useState(null);
  const [pendingInstallments, setPendingInstallments] = useState([]);
  
  // NEW: Regular payment recording states
  const [recordPaymentDialogOpen, setRecordPaymentDialogOpen] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    paymentMethod: PAYMENT_METHODS.CASH,
    reference: '',
    notes: '',
    paymentDate: new Date(),
  });
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentError, setPaymentError] = useState('');
  
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

  // Helper function to calculate remaining balance
  const getRemainingBalance = (invoice) => {
    if (!invoice) return 0;
    
    const totalAmount = invoice.grandTotal || invoice.totalAmount || 0;
    let paidAmount = 0;

    if (
      invoice.paymentStatus === PAYMENT_STATUS.PENDING ||
      invoice.paymentStatus === PAYMENT_STATUS.FINANCE ||
      invoice.paymentStatus === PAYMENT_STATUS.BANK_TRANSFER
    ) {
      paidAmount = invoice.paymentDetails?.downPayment || 0;
    } else if (invoice.paymentStatus === PAYMENT_STATUS.PAID || invoice.fullyPaid) {
      paidAmount = totalAmount;
    } else if (
      invoice.paymentStatus === PAYMENT_STATUS.EMI &&
      invoice.emiDetails?.schedule
    ) {
      paidAmount = invoice.emiDetails.schedule
        .filter((emi) => emi.paid)
        .reduce((sum, emi) => sum + (emi.paidAmount || emi.amount || 0), 0);
    }

    return Math.max(0, totalAmount - paidAmount);
  };

  // NEW: Handle record payment click
  const handleRecordPayment = (invoice) => {
    const remainingBalance = getRemainingBalance(invoice);
    setPaymentForm({
      amount: remainingBalance.toString(),
      paymentMethod: PAYMENT_METHODS.CASH,
      reference: '',
      notes: '',
      paymentDate: new Date(),
    });
    setPaymentError('');
    setRecordPaymentDialogOpen(true);
  };

  // NEW: Handle payment form change
  const handlePaymentFormChange = (field) => (event) => {
    setPaymentForm((prev) => ({
      ...prev,
      [field]: event.target.value,
    }));
  };

  // NEW: Handle payment date change
  const handlePaymentDateChange = (date) => {
    setPaymentForm((prev) => ({
      ...prev,
      paymentDate: date,
    }));
  };

  // NEW: Handle payment submit
  const handlePaymentSubmit = async () => {
    if (!currentInvoice) return;

    const amount = parseFloat(paymentForm.amount);
    const remainingBalance = getRemainingBalance(currentInvoice);

    // Validation
    if (!amount || amount <= 0) {
      setPaymentError('Please enter a valid payment amount');
      return;
    }

    if (amount > remainingBalance) {
      setPaymentError(
        `Payment amount cannot exceed remaining balance of ${formatCurrency(remainingBalance)}`
      );
      return;
    }

    if (!paymentForm.paymentDate) {
      setPaymentError('Please select a payment date');
      return;
    }

    setPaymentLoading(true);
    setPaymentError('');

    try {
      const paymentDetails = {
        paymentMethod: paymentForm.paymentMethod,
        reference: paymentForm.reference,
        notes: paymentForm.notes,
        paymentDate: paymentForm.paymentDate.toISOString(),
        recordedBy: user?.uid || 'current-user-id',
        recordedByName: user?.displayName || 'Current User',
      };

      await salesService.recordAdditionalPayment(
        userType,
        currentInvoice?.id,
        amount,
        paymentDetails
      );

      // Reload invoice
      await getInvoiceById(id);

      setRecordPaymentDialogOpen(false);
      setPaymentForm({
        amount: '',
        paymentMethod: PAYMENT_METHODS.CASH,
        reference: '',
        notes: '',
        paymentDate: new Date(),
      });

      console.log('Payment recorded successfully');
    } catch (error) {
      setPaymentError(error.message || 'Failed to record payment');
    } finally {
      setPaymentLoading(false);
    }
  };

  // NEW: Handle payment cancel
  const handlePaymentCancel = () => {
    setRecordPaymentDialogOpen(false);
    setPaymentForm({
      amount: '',
      paymentMethod: PAYMENT_METHODS.CASH,
      reference: '',
      notes: '',
      paymentDate: new Date(),
    });
    setPaymentError('');
  };

  // Handle EMI payment recording
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

  // Handle quick payment click
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

  // Get urgent installment count
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

  // Define tabs based on invoice type
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

              {/* Quick EMI Payment Button - Only show for EMI invoices with pending installments */}
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
            {/* EMI Status Chip */}
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

        {/* Tabs for different sections */}
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
                showActions={true}
                onRecordPayment={handleRecordPayment}
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

            {/* EMI Management Tab */}
            {currentTab === 2 && currentInvoice.paymentStatus === PAYMENT_STATUS.EMI && (
              <EMIManagement invoice={currentInvoice} />
            )}
          </Box>
        </Paper>

        {/* Quick Payment Dialog for EMI invoices */}
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

        {/* NEW: Regular Payment Recording Dialog */}
        <Dialog
          open={recordPaymentDialogOpen}
          onClose={paymentLoading ? undefined : handlePaymentCancel}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PaymentIcon color="primary" />
            Record Payment - {currentInvoice?.invoiceNumber}
          </DialogTitle>
          <DialogContent>
            {currentInvoice && (
              <Box sx={{ mb: 3, mt: 2 }}>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Customer:
                    </Typography>
                    <Typography variant="body1" fontWeight={500}>
                      {currentInvoice.customerName}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Invoice Total:
                    </Typography>
                    <Typography variant="body1" fontWeight={500}>
                      {formatCurrency(
                        currentInvoice.grandTotal || currentInvoice.totalAmount
                      )}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Amount Paid:
                    </Typography>
                    <Typography
                      variant="body1"
                      fontWeight={500}
                      color="success.main"
                    >
                      {formatCurrency(currentInvoice.paymentDetails?.downPayment || 0)}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Remaining Balance:
                    </Typography>
                    <Typography
                      variant="body1"
                      fontWeight={500}
                      color="warning.main"
                    >
                      {formatCurrency(getRemainingBalance(currentInvoice))}
                    </Typography>
                  </Grid>
                </Grid>
              </Box>
            )}

            {paymentError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {paymentError}
              </Alert>
            )}

            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Payment Amount"
                  type="number"
                  value={paymentForm.amount}
                  onChange={handlePaymentFormChange('amount')}
                  disabled={paymentLoading}
                  inputProps={{
                    min: 0,
                    max: currentInvoice
                      ? getRemainingBalance(currentInvoice)
                      : 0,
                    step: 0.01,
                  }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">₹</InputAdornment>
                    ),
                  }}
                  helperText={
                    currentInvoice
                      ? `Maximum: ${formatCurrency(
                          getRemainingBalance(currentInvoice)
                        )}`
                      : ''
                  }
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <DatePicker
                  label="Payment Date"
                  value={paymentForm.paymentDate}
                  onChange={handlePaymentDateChange}
                  disabled={paymentLoading}
                  format="dd/MM/yyyy"
                  maxDate={new Date()}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      InputProps: {
                        startAdornment: (
                          <InputAdornment position="start">
                            <DateRangeIcon />
                          </InputAdornment>
                        ),
                      },
                    },
                  }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  select
                  label="Payment Method"
                  value={paymentForm.paymentMethod}
                  onChange={handlePaymentFormChange('paymentMethod')}
                  disabled={paymentLoading}
                  SelectProps={{
                    native: true,
                  }}
                >
                  <option value={PAYMENT_METHODS.CASH}>
                    {PAYMENT_METHOD_DISPLAY[PAYMENT_METHODS.CASH]}
                  </option>
                  <option value={PAYMENT_METHODS.CARD}>
                    {PAYMENT_METHOD_DISPLAY[PAYMENT_METHODS.CARD]}
                  </option>
                  <option value={PAYMENT_METHODS.CREDIT_CARD}>
                    {PAYMENT_METHOD_DISPLAY[PAYMENT_METHODS.CREDIT_CARD]}
                  </option>
                  <option value={PAYMENT_METHODS.UPI}>
                    {PAYMENT_METHOD_DISPLAY[PAYMENT_METHODS.UPI]}
                  </option>
                  <option value={PAYMENT_METHODS.NET_BANKING}>
                    {PAYMENT_METHOD_DISPLAY[PAYMENT_METHODS.NET_BANKING]}
                  </option>
                  <option value={PAYMENT_METHODS.CHEQUE}>
                    {PAYMENT_METHOD_DISPLAY[PAYMENT_METHODS.CHEQUE]}
                  </option>
                  <option value={PAYMENT_METHODS.BANK_TRANSFER}>
                    {PAYMENT_METHOD_DISPLAY[PAYMENT_METHODS.BANK_TRANSFER]}
                  </option>
                </TextField>
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Payment Reference"
                  placeholder="Transaction ID, Cheque No, etc."
                  value={paymentForm.reference}
                  onChange={handlePaymentFormChange('reference')}
                  disabled={paymentLoading}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Notes"
                  placeholder="Additional notes about this payment..."
                  value={paymentForm.notes}
                  onChange={handlePaymentFormChange('notes')}
                  disabled={paymentLoading}
                  multiline
                  rows={2}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button
              onClick={handlePaymentCancel}
              disabled={paymentLoading}
              startIcon={<CloseIcon />}
            >
              Cancel
            </Button>
            <Button
              onClick={handlePaymentSubmit}
              color="primary"
              variant="contained"
              disabled={
                paymentLoading || !paymentForm.amount || !paymentForm.paymentDate
              }
              startIcon={
                paymentLoading ? (
                  <CircularProgress size={20} color="inherit" />
                ) : (
                  <SaveIcon />
                )
              }
            >
              {paymentLoading ? 'Recording...' : 'Record Payment'}
            </Button>
          </DialogActions>
        </Dialog>
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