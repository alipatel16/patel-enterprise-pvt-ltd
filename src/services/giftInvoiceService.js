// src/services/giftInvoiceService.js
import { ref, get, set, push, update, remove, query, orderByChild } from 'firebase/database';
import { database } from './firebase/config';
import { COLLECTIONS } from '../utils/constants/index';

/**
 * Gift Invoice Service - Manages gift invoices
 * FIXED: Customer invoice fetching now works correctly
 */
class GiftInvoiceService {
  constructor() {
    this.database = database;
  }

  /**
   * Get path for gift invoices collection
   */
  getGiftInvoicesPath(userType, invoiceId = null) {
    const basePath = `${userType}/${COLLECTIONS.GIFT_INVOICES}`;
    return invoiceId ? `${basePath}/${invoiceId}` : basePath;
  }

  /**
   * Generate gift invoice number
   */
  async generateGiftInvoiceNumber(userType) {
    try {
      const currentYear = new Date().getFullYear();
      const path = this.getGiftInvoicesPath(userType);
      const dbRef = ref(this.database, path);
      const snapshot = await get(dbRef);

      let maxNumber = 0;
      if (snapshot.exists()) {
        snapshot.forEach((child) => {
          const invoice = child.val();
          if (invoice.giftInvoiceNumber) {
            const match = invoice.giftInvoiceNumber.match(/GIFT-(\d{4})-(\d+)/);
            if (match && parseInt(match[1]) === currentYear) {
              const num = parseInt(match[2]);
              if (num > maxNumber) maxNumber = num;
            }
          }
        });
      }

      const nextNumber = maxNumber + 1;
      return `GIFT-${currentYear}-${String(nextNumber).padStart(4, '0')}`;
    } catch (error) {
      console.error('Error generating gift invoice number:', error);
      throw new Error('Failed to generate gift invoice number');
    }
  }

  /**
   * Get all gift invoices with pagination
   */
  async getAllGiftInvoices(userType, options = {}) {
    try {
      const { 
        page = 1, 
        pageSize = 10,
        status = null,
        searchTerm = null 
      } = options;

      const path = this.getGiftInvoicesPath(userType);
      const dbRef = ref(this.database, path);
      const snapshot = await get(dbRef);

      if (!snapshot.exists()) {
        return {
          invoices: [],
          totalCount: 0,
          totalPages: 0,
          currentPage: page
        };
      }

      let invoices = [];
      snapshot.forEach((child) => {
        invoices.push({
          id: child.key,
          ...child.val()
        });
      });

      // Sort by date, newest first
      invoices.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      // Filter by status if provided
      if (status) {
        invoices = invoices.filter(inv => inv.status === status);
      }

      // Filter by search term if provided
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        invoices = invoices.filter(inv => 
          inv.giftInvoiceNumber?.toLowerCase().includes(searchLower) ||
          inv.customerName?.toLowerCase().includes(searchLower) ||
          inv.customerPhone?.includes(searchTerm) ||
          inv.giftSetTitle?.toLowerCase().includes(searchLower)
        );
      }

      const totalCount = invoices.length;
      const totalPages = Math.ceil(totalCount / pageSize);
      const startIndex = (page - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      const paginatedInvoices = invoices.slice(startIndex, endIndex);

      return {
        invoices: paginatedInvoices,
        totalCount,
        totalPages,
        currentPage: page
      };
    } catch (error) {
      console.error('Error getting gift invoices:', error);
      throw new Error('Failed to load gift invoices');
    }
  }

  /**
   * Get single gift invoice by ID
   */
  async getGiftInvoiceById(userType, invoiceId) {
    try {
      const path = this.getGiftInvoicesPath(userType, invoiceId);
      const dbRef = ref(this.database, path);
      const snapshot = await get(dbRef);

      if (!snapshot.exists()) {
        throw new Error('Gift invoice not found');
      }

      return {
        id: snapshot.key,
        ...snapshot.val()
      };
    } catch (error) {
      console.error('Error getting gift invoice:', error);
      throw error;
    }
  }

  /**
   * Get invoices for a specific customer
   * FIXED: Now properly searches in the invoices collection
   */
  async getCustomerInvoices(userType, customerId) {
    try {
      console.log('Fetching invoices for customer:', customerId, 'userType:', userType);
      
      // Try both 'invoices' and 'sales' collections
      const paths = [
        `${userType}/${COLLECTIONS.INVOICES}`,
        `${userType}/${COLLECTIONS.SALES}`
      ];

      let allInvoices = [];

      for (const path of paths) {
        try {
          const dbRef = ref(this.database, path);
          const snapshot = await get(dbRef);

          if (snapshot.exists()) {
            snapshot.forEach((child) => {
              const invoice = child.val();
              // Check both customerId and customer_id fields
              if (invoice.customerId === customerId || invoice.customer_id === customerId) {
                allInvoices.push({
                  id: child.key,
                  invoiceNumber: invoice.invoiceNumber || invoice.invoice_number || 'N/A',
                  saleDate: invoice.saleDate || invoice.sale_date || invoice.createdAt,
                  grandTotal: invoice.grandTotal || invoice.grand_total || 0,
                  paymentStatus: invoice.paymentStatus || invoice.payment_status || 'unknown'
                });
              }
            });
          }
        } catch (err) {
          console.log(`Collection ${path} not accessible:`, err.message);
        }
      }

      console.log('Found invoices:', allInvoices.length);

      // Sort by date, newest first
      return allInvoices.sort((a, b) => 
        new Date(b.saleDate) - new Date(a.saleDate)
      );
    } catch (error) {
      console.error('Error getting customer invoices:', error);
      return [];
    }
  }

  /**
   * Create new gift invoice
   */
  async createGiftInvoice(userType, giftInvoiceData) {
    try {
      const path = this.getGiftInvoicesPath(userType);
      const newInvoiceRef = push(ref(this.database, path));

      // Generate invoice number
      const giftInvoiceNumber = await this.generateGiftInvoiceNumber(userType);

      const newInvoice = {
        ...giftInvoiceData,
        giftInvoiceNumber,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await set(newInvoiceRef, newInvoice);

      return {
        id: newInvoiceRef.key,
        ...newInvoice
      };
    } catch (error) {
      console.error('Error creating gift invoice:', error);
      throw new Error('Failed to create gift invoice');
    }
  }

  /**
   * Update existing gift invoice
   */
  async updateGiftInvoice(userType, invoiceId, updates) {
    try {
      const path = this.getGiftInvoicesPath(userType, invoiceId);
      const dbRef = ref(this.database, path);

      const updateData = {
        ...updates,
        updatedAt: new Date().toISOString()
      };

      await update(dbRef, updateData);

      return {
        id: invoiceId,
        ...updateData
      };
    } catch (error) {
      console.error('Error updating gift invoice:', error);
      throw new Error('Failed to update gift invoice');
    }
  }

  /**
   * Update item delivery status
   */
  async updateItemDeliveryStatus(userType, invoiceId, itemIndex, deliveryStatus) {
    try {
      const invoice = await this.getGiftInvoiceById(userType, invoiceId);
      
      if (!invoice.items || !invoice.items[itemIndex]) {
        throw new Error('Item not found');
      }

      // Update the specific item's delivery status
      const updatedItems = invoice.items.map((item, index) => {
        if (index === itemIndex) {
          return {
            ...item,
            deliveryStatus,
            deliveryUpdatedAt: new Date().toISOString()
          };
        }
        return item;
      });

      // Update the invoice
      await this.updateGiftInvoice(userType, invoiceId, {
        items: updatedItems
      });

      return true;
    } catch (error) {
      console.error('Error updating item delivery status:', error);
      throw new Error('Failed to update item delivery status');
    }
  }

  /**
   * Delete gift invoice
   */
  async deleteGiftInvoice(userType, invoiceId) {
    try {
      const path = this.getGiftInvoicesPath(userType, invoiceId);
      const dbRef = ref(this.database, path);
      
      await remove(dbRef);
      return true;
    } catch (error) {
      console.error('Error deleting gift invoice:', error);
      throw new Error('Failed to delete gift invoice');
    }
  }

  /**
   * Get gift invoice statistics
   */
  async getGiftInvoiceStats(userType) {
    try {
      const path = this.getGiftInvoicesPath(userType);
      const dbRef = ref(this.database, path);
      const snapshot = await get(dbRef);

      const stats = {
        total: 0,
        active: 0,
        delivered: 0,
        cancelled: 0,
        pendingDeliveries: 0
      };

      if (snapshot.exists()) {
        snapshot.forEach((child) => {
          const invoice = child.val();
          stats.total++;
          
          // Count by overall status
          if (invoice.status === 'active') stats.active++;
          else if (invoice.status === 'delivered') stats.delivered++;
          else if (invoice.status === 'cancelled') stats.cancelled++;

          // Count pending deliveries (items not yet delivered)
          if (invoice.items && Array.isArray(invoice.items)) {
            const hasPendingItems = invoice.items.some(item => 
              !item.deliveryStatus || item.deliveryStatus === 'pending'
            );
            if (hasPendingItems) {
              stats.pendingDeliveries++;
            }
          }
        });
      }

      return stats;
    } catch (error) {
      console.error('Error getting gift invoice stats:', error);
      return { total: 0, active: 0, delivered: 0, cancelled: 0, pendingDeliveries: 0 };
    }
  }
}

// Create and export singleton instance
const giftInvoiceService = new GiftInvoiceService();
export default giftInvoiceService;