import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  Alert,
  Breadcrumbs,
  Link,
  Grid,
  Card,
  CardContent,
  Chip,
  Divider,
  IconButton,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Print as PrintIcon,
  Download as DownloadIcon,
  Receipt as ReceiptIcon,
  Share as ShareIcon
} from '@mui/icons-material';

import Layout from '../../components/common/Layout/Layout';
import LoadingSpinner from '../../components/common/UI/LoadingSpinner';
import ConfirmDialog from '../../components/common/UI/ConfirmDialog';
import InvoicePreview from '../../components/sales/Invoice/InvoicePreview';
import { useSales } from '../../hooks/useSales';
import { useAuth } from '../../hooks/useAuth';
import { useUserType } from '../../hooks/useUserType';
import { formatCurrency, formatDate } from '../../utils/helpers/formatHelpers';
import { USER_ROLES, PAYMENT_STATUS, DELIVERY_STATUS } from '../../utils/constants/appConstants';

/**
 * View Invoice page component
 */
const ViewInvoicePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const {
    currentInvoice,
    loading,
    error,
    deleteSale,
    getInvoiceById,
    clearError
  } = useSales();
  
  const { user } = useAuth();
  const { getDisplayName, getThemeColors } = useUserType();
  
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  
  const themeColors = getThemeColors();

  // Load invoice data
  useEffect(() => {
    if (id) {
      getInvoiceById(id);
    }
  }, [id, getInvoiceById]);

  // Clear errors on mount
  useEffect(() => {
    clearError();
  }, [clearError]);

  // Handle edit
  const handleEdit = () => {
    navigate(`/sales/edit/${id}`);
  };

  // Handle delete
  const handleDelete = async () => {
    try {
      setDeleteLoading(true);
      await deleteSale(id);
      navigate('/sales', { 
        state: { 
          message: 'Invoice deleted successfully',
          severity: 'success'
        }
      });
    } catch (err) {
      console.error('Error deleting invoice:', err);
    } finally {
      setDeleteLoading(false);
      setShowDeleteDialog(false);
    }
  };

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
          {/* Breadcrumbs */}
          <Breadcrumbs sx={{ mb: 2, fontSize: { xs: '0.875rem', sm: '1rem' } }}>
            <Link
              color="inherit"
              href="/dashboard"
              onClick={(e) => {
                e.preventDefault();
                navigate('/dashboard');
              }}
              sx={{ 
                textDecoration: 'none',
                '&:hover': { textDecoration: 'underline' }
              }}
            >
              Dashboard
            </Link>
            <Link
              color="inherit"
              href="/sales"
              onClick={(e) => {
                e.preventDefault();
                navigate('/sales');
              }}
              sx={{ 
                textDecoration: 'none',
                '&:hover': { textDecoration: 'underline' }
              }}
            >
              Sales
            </Link>
            <Typography color="text.primary">
              Invoice #{currentInvoice.invoiceNumber}
            </Typography>
          </Breadcrumbs>

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
                {getDisplayName()} invoice for {currentInvoice.customer?.name}
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
              
              {canDelete && (
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
              )}
            </Box>
          </Box>

          {/* Invoice Status */}
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
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
              label={formatDate(currentInvoice.date)}
              variant="outlined"
              size={isMobile ? 'small' : 'medium'}
            />
          </Box>
        </Box>

        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={clearError}>
            {error}
          </Alert>
        )}

        {/* Invoice Preview */}
        <Paper 
          sx={{ 
            backgroundColor: 'background.paper',
            borderRadius: 2,
            overflow: 'hidden'
          }}
        >
          <InvoicePreview 
            invoice={currentInvoice}
            showActions={false}
          />
        </Paper>

        {/* Delete Confirmation Dialog */}
        <ConfirmDialog
          open={showDeleteDialog}
          title="Delete Invoice"
          message={`Are you sure you want to delete invoice #${currentInvoice.invoiceNumber}? This action cannot be undone.`}
          confirmText="Delete"
          cancelText="Cancel"
          onConfirm={handleDelete}
          onCancel={() => setShowDeleteDialog(false)}
          loading={deleteLoading}
          severity="error"
        />
      </Container>
    </Layout>
  );
};

export default ViewInvoicePage;