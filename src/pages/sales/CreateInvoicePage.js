import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Alert } from '@mui/material';

import Layout from '../../components/common/Layout/Layout';
import InvoiceForm from '../../components/sales/InvoiceForm/InvoiceForm';
import { SalesProvider, useSales } from '../../contexts/SalesContext/SalesContext';
import { CustomerProvider } from '../../contexts/CustomerContext/CustomerContext';
import { EmployeeProvider } from '../../contexts/EmployeeContext/EmployeeContext';
import { useUserType } from '../../contexts/UserTypeContext';

// Page Content Component
const CreateInvoicePageContent = () => {
  const navigate = useNavigate();
  const { createInvoice, loading, error } = useSales();

  const { userType } = useUserType()
  
  const [submitError, setSubmitError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  const breadcrumbs = [
    {
      label: 'Sales',
      path: '/sales'
    },
    {
      label: 'Create Invoice',
      path: '/sales/create'
    }
  ];

  // Handle form submission
  const handleSubmit = async (invoiceData) => {
    try {
      setSubmitError(null);
      setSuccessMessage(null);

      const newInvoice = await createInvoice(invoiceData);
      
      if (newInvoice) {
        setSuccessMessage(`Invoice ${newInvoice.invoiceNumber} created successfully!`);
        
        // Redirect to invoice view after a short delay
        setTimeout(() => {
          navigate(`/sales/view/${newInvoice.id}`);
        }, 1500);
      } else {
        setSubmitError('Failed to create invoice. Please try again.');
      }
    } catch (error) {
      console.error('Error creating invoice:', error);
      setSubmitError(error.message || 'Failed to create invoice. Please try again.');
    }
  };

  // Handle form cancellation
  const handleCancel = () => {
    navigate('/sales');
  };

  return (
    <Layout 
      title="Create New Invoice" 
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

        {/* Invoice Form */}
        <InvoiceForm
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
const CreateInvoicePage = () => {
  return (
    <CustomerProvider>
      <EmployeeProvider>
        <SalesProvider>
          <CreateInvoicePageContent />
        </SalesProvider>
      </EmployeeProvider>
    </CustomerProvider>
  );
};

export default CreateInvoicePage;