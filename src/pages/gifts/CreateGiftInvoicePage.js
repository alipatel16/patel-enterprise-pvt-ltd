// ===== FILE 1: src/pages/gifts/CreateGiftInvoicePage.js =====
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Alert } from '@mui/material';

import Layout from '../../components/common/Layout/Layout';
import GiftInvoiceForm from '../../components/gifts/GiftInvoiceForm/GiftInvoiceForm';
import { GiftInvoiceProvider, useGiftInvoice } from '../../contexts/GiftInvoiceContext/GiftInvoiceContext';
import { GiftSettingsProvider } from '../../contexts/GiftSettingsContext/GiftSettingsContext';
import { CustomerProvider } from '../../contexts/CustomerContext/CustomerContext';

const CreateGiftInvoicePageContent = () => {
  const navigate = useNavigate();
  const { createGiftInvoice, loading, error } = useGiftInvoice();
  
  const [submitError, setSubmitError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  const breadcrumbs = [
    { label: 'Gifts', path: '/gifts' },
    { label: 'Create Gift Invoice', path: '/gifts/create' }
  ];

  const handleSubmit = async (giftInvoiceData) => {
    try {
      setSubmitError(null);
      setSuccessMessage(null);

      const newInvoice = await createGiftInvoice(giftInvoiceData);
      
      if (newInvoice) {
        setSuccessMessage(`Gift Invoice ${newInvoice.giftInvoiceNumber} created successfully!`);
        
        setTimeout(() => {
          navigate(`/gifts/view/${newInvoice.id}`);
        }, 1500);
      } else {
        setSubmitError('Failed to create gift invoice. Please try again.');
      }
    } catch (error) {
      console.error('Error creating gift invoice:', error);
      setSubmitError(error.message || 'Failed to create gift invoice. Please try again.');
    }
  };

  const handleCancel = () => {
    navigate('/gifts');
  };

  return (
    <Layout title="Create Gift Invoice" breadcrumbs={breadcrumbs}>
      <Box>
        {successMessage && (
          <Alert severity="success" sx={{ mb: 3 }}>
            {successMessage}
          </Alert>
        )}

        {submitError && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {submitError}
          </Alert>
        )}

        <GiftInvoiceForm
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

const CreateGiftInvoicePage = () => {
  return (
    <CustomerProvider>
      <GiftSettingsProvider>
        <GiftInvoiceProvider>
          <CreateGiftInvoicePageContent />
        </GiftInvoiceProvider>
      </GiftSettingsProvider>
    </CustomerProvider>
  );
};

export default CreateGiftInvoicePage;