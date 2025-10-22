// src/contexts/GiftSettingsContext/GiftSettingsContext.js
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useUserType } from '../UserTypeContext/UserTypeContext';
import giftSettingsService from '../../services/giftSettingsService';

const GiftSettingsContext = createContext();

export const useGiftSettings = () => {
  const context = useContext(GiftSettingsContext);
  if (!context) {
    throw new Error('useGiftSettings must be used within GiftSettingsProvider');
  }
  return context;
};

export const GiftSettingsProvider = ({ children }) => {
  const { userType } = useUserType();
  const [giftSets, setGiftSets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Load all gift sets
   */
  const loadGiftSets = useCallback(async () => {
    if (!userType) return;

    try {
      setLoading(true);
      setError(null);
      const sets = await giftSettingsService.getAllGiftSets(userType);
      setGiftSets(sets);
    } catch (err) {
      console.error('Error loading gift sets:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [userType]);

  /**
   * Get gift set by ID
   */
  const getGiftSetById = useCallback(async (setId) => {
    if (!userType) return null;

    try {
      return await giftSettingsService.getGiftSetById(userType, setId);
    } catch (err) {
      console.error('Error getting gift set:', err);
      throw err;
    }
  }, [userType]);

  /**
   * Create new gift set
   */
  const createGiftSet = useCallback(async (giftSetData) => {
    if (!userType) return null;

    try {
      setLoading(true);
      setError(null);
      const newSet = await giftSettingsService.createGiftSet(userType, giftSetData);
      await loadGiftSets(); // Reload list
      return newSet;
    } catch (err) {
      console.error('Error creating gift set:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [userType, loadGiftSets]);

  /**
   * Update existing gift set
   */
  const updateGiftSet = useCallback(async (setId, updates) => {
    if (!userType) return null;

    try {
      setLoading(true);
      setError(null);
      const updatedSet = await giftSettingsService.updateGiftSet(userType, setId, updates);
      await loadGiftSets(); // Reload list
      return updatedSet;
    } catch (err) {
      console.error('Error updating gift set:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [userType, loadGiftSets]);

  /**
   * Delete gift set
   */
  const deleteGiftSet = useCallback(async (setId) => {
    if (!userType) return false;

    try {
      setLoading(true);
      setError(null);
      
      // Check if gift set is in use
      const isInUse = await giftSettingsService.isGiftSetInUse(userType, setId);
      if (isInUse) {
        throw new Error('Cannot delete gift set that is being used in gift invoices');
      }

      await giftSettingsService.deleteGiftSet(userType, setId);
      await loadGiftSets(); // Reload list
      return true;
    } catch (err) {
      console.error('Error deleting gift set:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [userType, loadGiftSets]);

  /**
   * Check if gift set is in use
   */
  const checkGiftSetUsage = useCallback(async (setId) => {
    if (!userType) return false;

    try {
      return await giftSettingsService.isGiftSetInUse(userType, setId);
    } catch (err) {
      console.error('Error checking gift set usage:', err);
      return false;
    }
  }, [userType]);

  // Load gift sets on mount or userType change
  useEffect(() => {
    if (userType) {
      loadGiftSets();
    }
  }, [userType, loadGiftSets]);

  const value = {
    giftSets,
    loading,
    error,
    loadGiftSets,
    getGiftSetById,
    createGiftSet,
    updateGiftSet,
    deleteGiftSet,
    checkGiftSetUsage
  };

  return (
    <GiftSettingsContext.Provider value={value}>
      {children}
    </GiftSettingsContext.Provider>
  );
};