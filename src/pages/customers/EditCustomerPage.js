import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Box, Alert, Skeleton, Card, CardContent } from '@mui/material';

import Layout from '../../components/common/Layout/Layout';
import CustomerForm from '../../components/customers/CustomerForm';
import { CustomerProvider, useCustomer } from '../../contexts/CustomerContext/CustomerContext';

// Page Content Component
const EditCustomerPageContent = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { 
    currentCustomer, 
    updateCustomer, 
    getCustomerById, 
    loading, 
    error 
  } = useCustomer();
  
  const [submitError, setSubmitError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [customerLoading, setCustomerLoading] = useState(true);
  const [customerNotFound, setCustomerNotFound] = useState(false);

  // Load customer data
  useEffect(() => {
    const loadCustomer = async () => {
      if (id) {
        setCustomerLoading(true);
        try {
          const customer = await getCustomerById(id);
          if (!customer) {
            setCustomerNotFound(true);
          }
        } catch (error) {
          console.error('Error loading customer:', error);
          setCustomerNotFound(true);
        } finally {
          setCustomerLoading(false);
        }
      }
    };

    loadCustomer();
  }, [id, getCustomerById]);

  const breadcrumbs = [
    {
      label: 'Customers',
      path: '/customers'
    },
    {
      label: currentCustomer?.name || 'Customer',
      path: `/customers/view/${id}`
    },
    {
      label: 'Edit',
      path: `/customers/edit/${id}`
    }
  ];

  // Handle form submission
  const handleSubmit = async (customerData) => {
    try {
      setSubmitError(null);
      setSuccessMessage(null);

      const updatedCustomer = await updateCustomer(id, customerData);
      
      if (updatedCustomer) {
        setSuccessMessage('Customer updated successfully!');
        
        // Redirect to customer details after a short delay
        setTimeout(() => {
          navigate(`/customers/view/${id}`);
        }, 1500);
      } else {
        setSubmitError('Failed to update customer. Please try again.');
      }
    } catch (error) {
      console.error('Error updating customer:', error);
      setSubmitError(error.message || 'Failed to update customer. Please try again.');
    }
  };

  // Handle form cancellation
  const handleCancel = () => {
    navigate(`/customers/view/${id}`);
  };

  // Show loading skeleton while loading customer
  if (customerLoading) {
    return (
      <Layout title="Edit Customer" breadcrumbs={breadcrumbs}>
        <Card>
          <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
            <Box mb={3}>
              <Skeleton variant="text" width={200} height={32} />
              <Skeleton variant="text" width={400} height={20} />
            </Box>
            
            {/* Basic Information Skeleton */}
            <Box mb={3}>
              <Skeleton variant="text" width={150} height={24} sx={{ mb: 2 }} />
              <Box display="grid" gridTemplateColumns="repeat(auto-fit, minmax(300px, 1fr))" gap={3}>
                {Array.from({ length: 6 }).map((_, index) => (
                  <Box key={index}>
                    <Skeleton variant="text" width={100} height={20} />
                    <Skeleton variant="rectangular" height={56} sx={{ mt: 1 }} />
                  </Box>
                ))}
              </Box>
            </Box>

            {/* Address Information Skeleton */}
            <Box mb={3}>
              <Skeleton variant="text" width={150} height={24} sx={{ mb: 2 }} />
              <Box mb={3}>
                <Skeleton variant="text" width={80} height={20} />
                <Skeleton variant="rectangular" height={88} sx={{ mt: 1 }} />
              </Box>
              <Box display="grid" gridTemplateColumns="repeat(auto-fit, minmax(200px, 1fr))" gap={3}>
                {Array.from({ length: 3 }).map((_, index) => (
                  <Box key={index}>
                    <Skeleton variant="text" width={80} height={20} />
                    <Skeleton variant="rectangular" height={56} sx={{ mt: 1 }} />
                  </Box>
                ))}
              </Box>
            </Box>

            {/* Action Buttons Skeleton */}
            <Box display="flex" gap={2} justifyContent="flex-end">
              <Skeleton variant="rectangular" width={100} height={48} />
              <Skeleton variant="rectangular" width={150} height={48} />
            </Box>
          </CardContent>
        </Card>
      </Layout>
    );
  }

  // Show error if customer not found
  if (customerNotFound) {
    return (
      <Layout title="Edit Customer" breadcrumbs={breadcrumbs}>
        <Alert severity="error">
          Customer not found. The customer may have been deleted or the ID is invalid.
        </Alert>
      </Layout>
    );
  }

  // Show error if no customer data
  if (!currentCustomer) {
    return (
      <Layout title="Edit Customer" breadcrumbs={breadcrumbs}>
        <Alert severity="warning">
          Unable to load customer data. Please try refreshing the page.
        </Alert>
      </Layout>
    );
  }

  return (
    <Layout 
      title={`Edit ${currentCustomer.name}`} 
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

        {/* Customer Form */}
        <CustomerForm
          customer={currentCustomer}
          isEdit={true}
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
const EditCustomerPage = () => {
  return (
    <CustomerProvider>
      <EditCustomerPageContent />
    </CustomerProvider>
  );
};

export default EditCustomerPage;