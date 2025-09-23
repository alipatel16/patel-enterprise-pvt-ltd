import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Alert, CircularProgress } from '@mui/material';

import Layout from '../../components/common/Layout/Layout';
import QuotationForm from '../../components/quotations/QuotationForm/QuotationForm';
import { QuotationProvider, useQuotation } from '../../contexts/QuotationContext/QuotationContext';
import { CustomerProvider } from '../../contexts/CustomerContext/CustomerContext';
import { EmployeeProvider } from '../../contexts/EmployeeContext/EmployeeContext';
import { useUserType } from '../../contexts/UserTypeContext/UserTypeContext';

// Page Content Component
const EditQuotationPageContent = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { 
    currentQuotation, 
    loading, 
    error, 
    getQuotationById, 
    updateQuotation 
  } = useQuotation();
  const { userType } = useUserType();
  
  const [submitError, setSubmitError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [loadingQuotation, setLoadingQuotation] = useState(true);

  const breadcrumbs = [
    {
      label: 'Quotations',
      path: '/quotations'
    },
    {
      label: currentQuotation?.quotationNumber || 'Loading...',
      path: `/quotations/view/${id}`
    },
    {
      label: 'Edit',
      path: `/quotations/edit/${id}`
    }
  ];

  // Load quotation data
  useEffect(() => {
    const loadQuotation = async () => {
      if (id) {
        setLoadingQuotation(true);
        try {
          await getQuotationById(id);
        } catch (err) {
          console.error('Error loading quotation:', err);
        } finally {
          setLoadingQuotation(false);
        }
      }
    };

    loadQuotation();
  }, [id, getQuotationById]);

  // Check if quotation can be edited
  const canEdit = () => {
    if (!currentQuotation) return false;
    
    // Don't allow editing if converted to invoice
    if (currentQuotation.converted) return false;
    
    // Don't allow editing if cancelled
    if (currentQuotation.status === 'cancelled') return false;
    
    return true;
  };

  // Handle form submission
  const handleSubmit = async (quotationData) => {
    try {
      setSubmitError(null);
      setSuccessMessage(null);

      const updatedQuotation = await updateQuotation(id, quotationData);
      
      if (updatedQuotation) {
        setSuccessMessage(`Quotation ${updatedQuotation.quotationNumber} updated successfully!`);
        
        // Redirect to quotation view after a short delay
        setTimeout(() => {
          navigate(`/quotations/view/${id}`);
        }, 1500);
      } else {
        setSubmitError('Failed to update quotation. Please try again.');
      }
    } catch (error) {
      console.error('Error updating quotation:', error);
      setSubmitError(error.message || 'Failed to update quotation. Please try again.');
    }
  };

  // Handle form cancellation
  const handleCancel = () => {
    navigate(`/quotations/view/${id}`);
  };

  // Show loading state
  if (loadingQuotation || loading) {
    return (
      <Layout title="Loading..." breadcrumbs={breadcrumbs}>
        <Box display="flex" justifyContent="center" mt={4}>
          <CircularProgress />
        </Box>
      </Layout>
    );
  }

  // Show error state
  if (error || !currentQuotation) {
    return (
      <Layout title="Quotation Not Found" breadcrumbs={breadcrumbs}>
        <Alert severity="error">
          {error || 'Quotation not found'}
        </Alert>
      </Layout>
    );
  }

  // Check if quotation can be edited
  if (!canEdit()) {
    const reason = currentQuotation.converted 
      ? 'This quotation has been converted to an invoice and cannot be edited.'
      : currentQuotation.status === 'cancelled'
      ? 'This quotation has been cancelled and cannot be edited.'
      : 'This quotation cannot be edited.';

    return (
      <Layout 
        title={`Edit Quotation ${currentQuotation.quotationNumber}`} 
        breadcrumbs={breadcrumbs}
      >
        <Alert severity="warning">
          {reason}
        </Alert>
      </Layout>
    );
  }

  return (
    <Layout 
      title={`Edit Quotation ${currentQuotation.quotationNumber}`} 
      breadcrumbs={breadcrumbs}
    >
      <Box>
        {/* Success Message */}
        {successMessage && (
          <Alert severity="success" sx={{ mb: 3 }}>
            {successMessage}
          </Alert>
        )}

        {/* Error Message */}
        {submitError && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {submitError}
          </Alert>
        )}

        {/* Warning for expired quotations */}
        {currentQuotation.validUntil && new Date(currentQuotation.validUntil) < new Date() && (
          <Alert severity="warning" sx={{ mb: 3 }}>
            This quotation has expired on {new Date(currentQuotation.validUntil).toLocaleDateString()}. 
            Consider updating the validity date.
          </Alert>
        )}

        {/* Quotation Form */}
        <QuotationForm
          quotation={currentQuotation}
          isEdit={true}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          loading={loading}
          error={error}
          userType={userType}
        />
      </Box>
    </Layout>
  );
};

// Main Component with Providers
const EditQuotationPage = () => {
  return (
    <CustomerProvider>
      <EmployeeProvider>
        <QuotationProvider>
          <EditQuotationPageContent />
        </QuotationProvider>
      </EmployeeProvider>
    </CustomerProvider>
  );
};

export default EditQuotationPage;