import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Alert } from '@mui/material';

import Layout from '../../components/common/Layout/Layout';
import CustomerForm from '../../components/customers/CustomerForm';
import { CustomerProvider, useCustomer } from '../../contexts/CustomerContext/CustomerContext';
import { useUserType } from '../../contexts/UserTypeContext/UserTypeContext';

// Page Content Component
const AddCustomerPageContent = () => {
  const navigate = useNavigate();
  const { createCustomer, loading, error } = useCustomer();
  const { getDisplayName, userType } = useUserType();
  
  const [submitError, setSubmitError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  const breadcrumbs = [
    {
      label: 'Customers',
      path: '/customers'
    },
    {
      label: 'Add Customer',
      path: '/customers/add'
    }
  ];

  // Handle form submission
  const handleSubmit = async (customerData) => {
    try {
      setSubmitError(null);
      setSuccessMessage(null);

      // Debug logging
      console.log('Form submission started');
      console.log('Customer data:', customerData);
      console.log('User type:', userType);

      // Validate required data
      if (!userType) {
        setSubmitError('User type not available. Please refresh the page and try again.');
        return;
      }

      if (!customerData) {
        setSubmitError('No customer data provided. Please fill out the form.');
        return;
      }

      // Check required fields manually
      const requiredFields = ['name', 'phone', 'customerType', 'category'];
      const missingFields = requiredFields.filter(field => !customerData[field]);
      
      if (missingFields.length > 0) {
        setSubmitError(`Missing required fields: ${missingFields.join(', ')}`);
        return;
      }

      console.log('Creating customer...');
      const newCustomer = await createCustomer(customerData);
      console.log('Customer creation result:', newCustomer);
      
      if (newCustomer && newCustomer.id) {
        setSuccessMessage('Customer added successfully!');
        console.log('Customer created successfully:', newCustomer.id);
        
        // Redirect to customer list after a short delay
        setTimeout(() => {
          navigate('/customers');
        }, 1500);
      } else {
        console.error('Customer creation failed - no customer returned');
        setSubmitError('Failed to add customer. No customer data returned from server.');
      }
    } catch (error) {
      console.error('Error adding customer:', error);
      
      // More specific error messages
      let errorMessage = 'Failed to add customer. Please try again.';
      
      if (error.message) {
        if (error.message.includes('permission')) {
          errorMessage = 'Permission denied. Please check your access rights.';
        } else if (error.message.includes('network') || error.message.includes('connection')) {
          errorMessage = 'Network error. Please check your internet connection and try again.';
        } else if (error.message.includes('required')) {
          errorMessage = error.message;
        } else {
          errorMessage = `Error: ${error.message}`;
        }
      }
      
      setSubmitError(errorMessage);
    }
  };

  // Handle form cancellation
  const handleCancel = () => {
    navigate('/customers');
  };

  return (
    <Layout 
      title="Add New Customer" 
      breadcrumbs={breadcrumbs}
    >
      <Box>
        {/* Debug Info (remove in production) */}
        {process.env.NODE_ENV === 'development' && (
          <Alert severity="info" sx={{ mb: 2 }}>
            Debug: User Type = {userType || 'Not Available'}
          </Alert>
        )}

        {/* Success Message */}
        {successMessage && (
          <Alert severity="success" sx={{ mb: 3 }}>
            {successMessage}
          </Alert>
        )}

        {/* Error Message */}
        {(submitError || error) && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {submitError || error}
          </Alert>
        )}

        {/* User Type Check */}
        {!userType && (
          <Alert severity="warning" sx={{ mb: 3 }}>
            User type not detected. Please ensure you are logged in properly.
          </Alert>
        )}

        {/* Customer Form */}
        <CustomerForm
          isEdit={false}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          loading={loading}
          error={error}
        />
      </Box>
    </Layout>
  );
};

// Main Component with Provider
const AddCustomerPage = () => {
  return (
    <CustomerProvider>
      <AddCustomerPageContent />
    </CustomerProvider>
  );
};

export default AddCustomerPage;