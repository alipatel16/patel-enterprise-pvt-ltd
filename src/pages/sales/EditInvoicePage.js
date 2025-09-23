import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  Alert,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
} from '@mui/icons-material';

import Layout from '../../components/common/Layout/Layout';
import InvoiceForm from '../../components/sales/InvoiceForm/InvoiceForm';
import LoadingSpinner from '../../components/common/UI/LoadingSpinner';
import { SalesProvider, useSales } from '../../contexts/SalesContext/SalesContext'; // Fixed import
import { useUserType } from '../../contexts/UserTypeContext/UserTypeContext'; // Fixed import
import { CustomerProvider } from '../../contexts/CustomerContext/CustomerContext';
import { EmployeeProvider } from '../../contexts/EmployeeContext/EmployeeContext';

/**
 * Edit Invoice page content component
 */
const EditInvoicePageContent = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const {
    currentInvoice,
    loading,
    error,
    updateInvoice, // Updated from updateSale to updateInvoice
    getInvoiceById,
    clearError
  } = useSales();
  
  const { getDisplayName } = useUserType();
  
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // Load invoice data
  useEffect(() => {
    if (id) {
      getInvoiceById(id);
    }
  }, [id, getInvoiceById]);

  // Clear errors on mount
  useEffect(() => {
    clearError();
    setSubmitError('');
  }, [clearError]);

  // Handle form submission
  const handleSubmit = async (invoiceData) => {
    try {
      setSubmitLoading(true);
      setSubmitError('');
      
      await updateInvoice(id, invoiceData);
      navigate('/sales', { 
        state: { 
          message: 'Invoice updated successfully',
          severity: 'success'
        }
      });
    } catch (err) {
      setSubmitError(err.message || 'Failed to update invoice');
    } finally {
      setSubmitLoading(false);
    }
  };

    const breadcrumbs = [
    {
      label: 'Sales',
      path: '/sales'
    },
    {
      label: currentInvoice?.invoiceNumber || 'Edit Invoice Details',
      path: `/sales/edit/${id}`
    }
  ];

  // Handle cancel
  const handleCancel = () => {
    navigate('/sales');
  };

  // Handle back navigation
  const handleBack = () => {
    navigate('/sales');
  };

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
    <Layout title="Edit Details" breadcrumbs={breadcrumbs}>
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
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <EditIcon color="primary" />
              <Typography 
                variant="h4" 
                sx={{ 
                  fontSize: { xs: '1.5rem', sm: '2rem' },
                  fontWeight: 600
                }}
              >
                Edit Invoice
              </Typography>
            </Box>
            
            <Button
              variant="outlined"
              startIcon={<ArrowBackIcon />}
              onClick={handleBack}
              sx={{
                minWidth: { xs: 'auto', sm: 'unset' },
                width: { xs: '100%', sm: 'auto' }
              }}
            >
              Back to Sales
            </Button>
          </Box>

          {/* Invoice Info */}
          <Typography 
            variant="body1" 
            color="text.secondary"
            sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
          >
            Editing {getDisplayName().toLowerCase()} invoice #{currentInvoice.invoiceNumber}
          </Typography>
        </Box>

        {/* Error Alert */}
        {(error || submitError) && (
          <Alert 
            severity="error" 
            sx={{ 
              mb: 3,
              fontSize: { xs: '0.875rem', sm: '1rem' }
            }}
            onClose={() => {
              clearError();
              setSubmitError('');
            }}
          >
            {submitError || error}
          </Alert>
        )}

        {/* Form */}
        <Paper 
          elevation={0} 
          sx={{ 
            p: { xs: 2, sm: 3 },
            backgroundColor: 'background.paper',
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'divider'
          }}
        >
          <InvoiceForm
            invoice={currentInvoice}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            isEdit={true}
            loading={submitLoading}
            error={submitError}
          />
        </Paper>
      </Container>
    </Layout>
  );
};

/**
 * Main Edit Invoice page component with all required providers
 */
const EditInvoicePage = () => {
  return (
    <CustomerProvider>
      <EmployeeProvider>
        <SalesProvider>
          <EditInvoicePageContent />
        </SalesProvider>
      </EmployeeProvider>
    </CustomerProvider>
  );
};

export default EditInvoicePage;