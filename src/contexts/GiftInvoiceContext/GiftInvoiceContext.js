// src/contexts/GiftInvoiceContext/GiftInvoiceContext.js
import React, { createContext, useContext, useState, useCallback } from 'react';
import { useUserType } from '../UserTypeContext/UserTypeContext';
import giftInvoiceService from '../../services/giftInvoiceService';

const GiftInvoiceContext = createContext();

export const useGiftInvoice = () => {
  const context = useContext(GiftInvoiceContext);
  if (!context) {
    throw new Error('useGiftInvoice must be used within GiftInvoiceProvider');
  }
  return context;
};

export const GiftInvoiceProvider = ({ children }) => {
  const { userType } = useUserType();
  const [giftInvoices, setGiftInvoices] = useState([]);
  const [currentGiftInvoice, setCurrentGiftInvoice] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    totalCount: 0,
    totalPages: 0,
    currentPage: 1
  });

  /**
   * Load all gift invoices with pagination
   */
  const loadGiftInvoices = useCallback(async (options = {}) => {
    if (!userType) return;

    try {
      setLoading(true);
      setError(null);
      const result = await giftInvoiceService.getAllGiftInvoices(userType, options);
      setGiftInvoices(result.invoices);
      setPagination({
        totalCount: result.totalCount,
        totalPages: result.totalPages,
        currentPage: result.currentPage
      });
    } catch (err) {
      console.error('Error loading gift invoices:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [userType]);

  /**
   * Get gift invoice by ID
   */
  const getGiftInvoiceById = useCallback(async (invoiceId) => {
    if (!userType) return null;

    try {
      setLoading(true);
      setError(null);
      const invoice = await giftInvoiceService.getGiftInvoiceById(userType, invoiceId);
      setCurrentGiftInvoice(invoice);
      return invoice;
    } catch (err) {
      console.error('Error getting gift invoice:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [userType]);

  /**
   * Get customer invoices for linking
   */
  const getCustomerInvoices = useCallback(async (customerId) => {
    if (!userType || !customerId) return [];

    try {
      return await giftInvoiceService.getCustomerInvoices(userType, customerId);
    } catch (err) {
      console.error('Error getting customer invoices:', err);
      return [];
    }
  }, [userType]);

  /**
   * Create new gift invoice
   */
  const createGiftInvoice = useCallback(async (giftInvoiceData) => {
    if (!userType) return null;

    try {
      setLoading(true);
      setError(null);
      const newInvoice = await giftInvoiceService.createGiftInvoice(userType, giftInvoiceData);
      return newInvoice;
    } catch (err) {
      console.error('Error creating gift invoice:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [userType]);

  /**
   * Update existing gift invoice
   */
  const updateGiftInvoice = useCallback(async (invoiceId, updates) => {
    if (!userType) return null;

    try {
      setLoading(true);
      setError(null);
      const updatedInvoice = await giftInvoiceService.updateGiftInvoice(userType, invoiceId, updates);
      setCurrentGiftInvoice(updatedInvoice);
      return updatedInvoice;
    } catch (err) {
      console.error('Error updating gift invoice:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [userType]);

  /**
   * Delete gift invoice
   */
  const deleteGiftInvoice = useCallback(async (invoiceId) => {
    if (!userType) return false;

    try {
      setLoading(true);
      setError(null);
      await giftInvoiceService.deleteGiftInvoice(userType, invoiceId);
      return true;
    } catch (err) {
      console.error('Error deleting gift invoice:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [userType]);

  /**
   * Get gift invoice statistics
   */
  const getGiftInvoiceStats = useCallback(async () => {
    if (!userType) return null;

    try {
      return await giftInvoiceService.getGiftInvoiceStats(userType);
    } catch (err) {
      console.error('Error getting gift invoice stats:', err);
      return null;
    }
  }, [userType]);

  const value = {
    giftInvoices,
    currentGiftInvoice,
    loading,
    error,
    pagination,
    loadGiftInvoices,
    getGiftInvoiceById,
    getCustomerInvoices,
    createGiftInvoice,
    updateGiftInvoice,
    deleteGiftInvoice,
    getGiftInvoiceStats
  };

  return (
    <GiftInvoiceContext.Provider value={value}>
      {children}
    </GiftInvoiceContext.Provider>
  );
};