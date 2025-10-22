// src/services/giftSettingsService.js
import { ref, get, set, push, update, remove, query, orderByChild } from 'firebase/database';
import { database } from './firebase/config';
import { COLLECTIONS } from '../utils/constants/index';

/**
 * Gift Settings Service - Manages gift sets
 */
class GiftSettingsService {
  constructor() {
    this.database = database;
  }

  /**
   * Get path for gift sets collection
   */
  getGiftSetsPath(userType, setId = null) {
    const basePath = `${userType}/${COLLECTIONS.GIFT_SETS}`;
    return setId ? `${basePath}/${setId}` : basePath;
  }

  /**
   * Get all gift sets
   */
  async getAllGiftSets(userType) {
    try {
      const path = this.getGiftSetsPath(userType);
      const dbRef = ref(this.database, path);
      const snapshot = await get(dbRef);

      if (!snapshot.exists()) {
        return [];
      }

      const giftSets = [];
      snapshot.forEach((child) => {
        giftSets.push({
          id: child.key,
          ...child.val()
        });
      });

      // Sort by creation date, newest first
      return giftSets.sort((a, b) => 
        new Date(b.createdAt) - new Date(a.createdAt)
      );
    } catch (error) {
      console.error('Error getting gift sets:', error);
      throw new Error('Failed to load gift sets');
    }
  }

  /**
   * Get single gift set by ID
   */
  async getGiftSetById(userType, setId) {
    try {
      const path = this.getGiftSetsPath(userType, setId);
      const dbRef = ref(this.database, path);
      const snapshot = await get(dbRef);

      if (!snapshot.exists()) {
        throw new Error('Gift set not found');
      }

      return {
        id: snapshot.key,
        ...snapshot.val()
      };
    } catch (error) {
      console.error('Error getting gift set:', error);
      throw error;
    }
  }

  /**
   * Create new gift set
   */
  async createGiftSet(userType, giftSetData) {
    try {
      const path = this.getGiftSetsPath(userType);
      const newSetRef = push(ref(this.database, path));

      const newSet = {
        ...giftSetData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await set(newSetRef, newSet);

      return {
        id: newSetRef.key,
        ...newSet
      };
    } catch (error) {
      console.error('Error creating gift set:', error);
      throw new Error('Failed to create gift set');
    }
  }

  /**
   * Update existing gift set
   */
  async updateGiftSet(userType, setId, updates) {
    try {
      const path = this.getGiftSetsPath(userType, setId);
      const dbRef = ref(this.database, path);

      const updateData = {
        ...updates,
        updatedAt: new Date().toISOString()
      };

      await update(dbRef, updateData);

      return {
        id: setId,
        ...updateData
      };
    } catch (error) {
      console.error('Error updating gift set:', error);
      throw new Error('Failed to update gift set');
    }
  }

  /**
   * Delete gift set
   */
  async deleteGiftSet(userType, setId) {
    try {
      const path = this.getGiftSetsPath(userType, setId);
      const dbRef = ref(this.database, path);
      
      await remove(dbRef);
      return true;
    } catch (error) {
      console.error('Error deleting gift set:', error);
      throw new Error('Failed to delete gift set');
    }
  }

  /**
   * Check if gift set is being used in any gift invoice
   */
  async isGiftSetInUse(userType, setId) {
    try {
      const invoicesPath = `${userType}/${COLLECTIONS.GIFT_INVOICES}`;
      const dbRef = ref(this.database, invoicesPath);
      const snapshot = await get(dbRef);

      if (!snapshot.exists()) {
        return false;
      }

      let isInUse = false;
      snapshot.forEach((child) => {
        const invoice = child.val();
        if (invoice.giftSetId === setId) {
          isInUse = true;
        }
      });

      return isInUse;
    } catch (error) {
      console.error('Error checking gift set usage:', error);
      return false;
    }
  }
}

// Create and export singleton instance
const giftSettingsService = new GiftSettingsService();
export default giftSettingsService;