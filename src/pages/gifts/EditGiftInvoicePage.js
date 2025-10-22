// ===== FILE 2: src/pages/gifts/EditGiftInvoicePage.js =====
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Alert, CircularProgress } from '@mui/material';

import Layout from '../../components/common/Layout/Layout';
import GiftInvoiceForm from '../../components/gifts/GiftInvoiceForm/GiftInvoiceForm';
import { GiftInvoiceProvider, useGiftInvoice } from '../../contexts/GiftInvoiceContext/GiftInvoiceContext';
import { GiftSettingsProvider } from '../../contexts/GiftSettingsContext/GiftSettingsContext';
import { CustomerProvider } from '../../contexts/CustomerContext/CustomerContext';

const EditGiftInvoicePageContent = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { 
    currentGiftInvoice, 
    loading, 
    error, 
    getGiftInvoiceById, 
    updateGiftInvoice 
  } = useGiftInvoice();
  
  const [submitError, setSubmitError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [loadingInvoice, setLoadingInvoice] = useState(true);

  const breadcrumbs = [
    { label: 'Gifts', path: '/gifts' },
    { label: currentGiftInvoice?.giftInvoiceNumber || 'Loading...', path: `/gifts/view/${id}` },
    { label: 'Edit', path: `/gifts/edit/${id}` }
  ];

  useEffect(() => {
    const loadInvoice = async () => {
      if (id) {
        setLoadingInvoice(true);
        try {
          await getGiftInvoiceById(id);
        } catch (err) {
          console.error('Error loading gift invoice:', err);
        } finally {
          setLoadingInvoice(false);
        }
      }
    };

    loadInvoice();
  }, [id, getGiftInvoiceById]);

  const handleSubmit = async (giftInvoiceData) => {
    try {
      setSubmitError(null);
      setSuccessMessage(null);

      const updatedInvoice = await updateGiftInvoice(id, giftInvoiceData);
      
      if (updatedInvoice) {
        setSuccessMessage(`Gift Invoice ${updatedInvoice.giftInvoiceNumber} updated successfully!`);
        
        setTimeout(() => {
          navigate(`/gifts/view/${id}`);
        }, 1500);
      } else {
        setSubmitError('Failed to update gift invoice. Please try again.');
      }
    } catch (error) {
      console.error('Error updating gift invoice:', error);
      setSubmitError(error.message || 'Failed to update gift invoice. Please try again.');
    }
  };

  const handleCancel = () => {
    navigate(`/gifts/view/${id}`);
  };

  if (loadingInvoice || loading) {
    return (
      <Layout title="Loading..." breadcrumbs={breadcrumbs}>
        <Box display="flex" justifyContent="center" mt={4}>
          <CircularProgress />
        </Box>
      </Layout>
    );
  }

  if (error || !currentGiftInvoice) {
    return (
      <Layout title="Gift Invoice Not Found" breadcrumbs={breadcrumbs}>
        <Alert severity="error">
          {error || 'Gift invoice not found'}
        </Alert>
      </Layout>
    );
  }

  return (
    <Layout 
      title={`Edit Gift Invoice ${currentGiftInvoice.giftInvoiceNumber}`} 
      breadcrumbs={breadcrumbs}
    >
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
          giftInvoice={currentGiftInvoice}
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

const EditGiftInvoicePage = () => {
  return (
    <CustomerProvider>
      <GiftSettingsProvider>
        <GiftInvoiceProvider>
          <EditGiftInvoicePageContent />
        </GiftInvoiceProvider>
      </GiftSettingsProvider>
    </CustomerProvider>
  );
};

export default EditGiftInvoicePage;