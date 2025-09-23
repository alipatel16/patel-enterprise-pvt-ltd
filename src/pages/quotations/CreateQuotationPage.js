import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Alert } from '@mui/material';

import Layout from '../../components/common/Layout/Layout';
import QuotationForm from '../../components/quotations/QuotationForm/QuotationForm';
import { QuotationProvider, useQuotation } from '../../contexts/QuotationContext/QuotationContext';
import { CustomerProvider } from '../../contexts/CustomerContext/CustomerContext';
import { EmployeeProvider } from '../../contexts/EmployeeContext/EmployeeContext';
import { useUserType } from '../../contexts/UserTypeContext/UserTypeContext';

// Page Content Component
const CreateQuotationPageContent = () => {
  const navigate = useNavigate();
  const { createQuotation, loading, error } = useQuotation();
  const { userType } = useUserType();
  
  const [submitError, setSubmitError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  const breadcrumbs = [
    {
      label: 'Quotations',
      path: '/quotations'
    },
    {
      label: 'Create Quotation',
      path: '/quotations/create'
    }
  ];

  // Handle form submission
  const handleSubmit = async (quotationData) => {
    try {
      setSubmitError(null);
      setSuccessMessage(null);

      const newQuotation = await createQuotation(quotationData);
      
      if (newQuotation) {
        setSuccessMessage(`Quotation ${newQuotation.quotationNumber} created successfully!`);
        
        // Redirect to quotation view after a short delay
        setTimeout(() => {
          navigate(`/quotations/view/${newQuotation.id}`);
        }, 1500);
      } else {
        setSubmitError('Failed to create quotation. Please try again.');
      }
    } catch (error) {
      console.error('Error creating quotation:', error);
      setSubmitError(error.message || 'Failed to create quotation. Please try again.');
    }
  };

  // Handle form cancellation
  const handleCancel = () => {
    navigate('/quotations');
  };

  return (
    <Layout 
      title="Create New Quotation" 
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

        {/* Quotation Form */}
        <QuotationForm
          isEdit={false}
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
const CreateQuotationPage = () => {
  return (
    <CustomerProvider>
      <EmployeeProvider>
        <QuotationProvider>
          <CreateQuotationPageContent />
        </QuotationProvider>
      </EmployeeProvider>
    </CustomerProvider>
  );
};

export default CreateQuotationPage;