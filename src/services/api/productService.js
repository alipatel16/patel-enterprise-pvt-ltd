import BaseService from "./baseService";

/**
 * Product Catalog Service for managing reusable product items
 */
class ProductService extends BaseService {
  constructor() {
    super("products");
  }

  /**
   * Create or update product based on invoice item
   * Auto-saves product details when invoice is created
   * @param {string} userType - User type
   * @param {Object} itemData - Item data from invoice
   * @returns {Promise<Object>} Created/Updated product
   */
  async saveProductFromInvoiceItem(userType, itemData) {
    try {
      // Search for existing product by name (case-insensitive)
      const existingProducts = await this.searchProducts(
        userType,
        itemData.name
      );

      const productData = {
        name: itemData.name,
        description: itemData.description || "",
        hsnCode: itemData.hsnCode || "",
        defaultRate: parseFloat(itemData.rate) || 0,
        defaultGstSlab: parseFloat(itemData.gstSlab) || 18,
        isPriceInclusive: itemData.isPriceInclusive || false,
        lastUsedDate: new Date().toISOString(),
        usageCount: 1,
        updatedAt: new Date().toISOString(),
      };

      if (existingProducts && existingProducts.length > 0) {
        // Update existing product
        const existingProduct = existingProducts[0];
        const updates = {
          ...productData,
          usageCount: (existingProduct.usageCount || 0) + 1,
          // Update rate only if new rate is provided and different
          defaultRate:
            parseFloat(itemData.rate) > 0
              ? parseFloat(itemData.rate)
              : existingProduct.defaultRate,
        };

        return await this.update(userType, existingProduct.id, updates);
      } else {
        // Create new product
        productData.createdAt = new Date().toISOString();
        productData.status = "active";

        return await this.create(userType, productData);
      }
    } catch (error) {
      console.error("Error saving product from invoice item:", error);
      // Don't throw error - just log it, invoice creation should continue
      return null;
    }
  }

  /**
   * Search products by name for autocomplete
   * @param {string} userType - User type
   * @param {string} searchTerm - Search term
   * @param {number} limit - Maximum results
   * @returns {Promise<Array>} Matching products
   */
  async searchProducts(userType, searchTerm, limit = 10) {
    try {
      if (!searchTerm || searchTerm.length < 1) {
        return [];
      }

      // Remove orderBy to avoid index error
      const allProducts = await this.getAll(userType); // No options parameter

      console.log("📦 Products loaded:", allProducts.length);

      const term = searchTerm.toLowerCase().trim();

      const filtered = allProducts.filter((product) => {
        return (
          product.name?.toLowerCase().includes(term) ||
          product.description?.toLowerCase().includes(term) ||
          product.hsnCode?.toLowerCase().includes(term)
        );
      });

      // Sort by lastUsedDate in JavaScript instead
      filtered.sort((a, b) => {
        const dateA = new Date(a.lastUsedDate || 0);
        const dateB = new Date(b.lastUsedDate || 0);
        return dateB - dateA; // Descending order
      });

      return filtered.slice(0, limit);
    } catch (error) {
      console.error("Error searching products:", error);
      return [];
    }
  }

  /**
   * Get product suggestions for autocomplete
   * @param {string} userType - User type
   * @param {string} searchTerm - Search term
   * @returns {Promise<Array>} Product suggestions with label
   */
  async getProductSuggestions(userType, searchTerm) {
    try {
      const products = await this.searchProducts(userType, searchTerm);

      return products.map((product) => ({
        id: product.id,
        name: product.name,
        description: product.description,
        hsnCode: product.hsnCode,
        defaultRate: product.defaultRate,
        defaultGstSlab: product.defaultGstSlab,
        isPriceInclusive: product.isPriceInclusive,
        label: `${product.name}${
          product.hsnCode ? ` (HSN: ${product.hsnCode})` : ""
        }`,
        usageCount: product.usageCount || 0,
      }));
    } catch (error) {
      console.error("Error getting product suggestions:", error);
      return [];
    }
  }

  /**
   * Get recently used products
   * @param {string} userType - User type
   * @param {number} limit - Number of products to return
   * @returns {Promise<Array>} Recent products
   */
  async getRecentProducts(userType, limit = 5) {
    try {
      return await this.getAll(userType, {
        orderBy: "lastUsedDate",
        orderDirection: "desc",
        limit,
      });
    } catch (error) {
      console.error("Error getting recent products:", error);
      return [];
    }
  }

  /**
   * Get frequently used products
   * @param {string} userType - User type
   * @param {number} limit - Number of products to return
   * @returns {Promise<Array>} Frequent products
   */
  async getFrequentProducts(userType, limit = 5) {
    try {
      const products = await this.getAll(userType, {
        orderBy: "usageCount",
        orderDirection: "desc",
        limit: 50,
      });

      return products.filter((p) => p.usageCount > 0).slice(0, limit);
    } catch (error) {
      console.error("Error getting frequent products:", error);
      return [];
    }
  }

  /**
   * Update product details
   * @param {string} userType - User type
   * @param {string} productId - Product ID
   * @param {Object} updates - Update data
   * @returns {Promise<Object>} Updated product
   */
  async updateProduct(userType, productId, updates) {
    try {
      const updatedData = {
        ...updates,
        updatedAt: new Date().toISOString(),
      };

      return await this.update(userType, productId, updatedData);
    } catch (error) {
      console.error("Error updating product:", error);
      throw error;
    }
  }

  /**
   * Delete product
   * @param {string} userType - User type
   * @param {string} productId - Product ID
   * @returns {Promise<boolean>} Success status
   */
  async deleteProduct(userType, productId) {
    try {
      await this.delete(userType, productId);
      return true;
    } catch (error) {
      console.error("Error deleting product:", error);
      throw error;
    }
  }

  /**
   * Get all products
   * @param {string} userType - User type
   * @returns {Promise<Array>} All products
   */
  async getAllProducts(userType) {
    try {
      return await this.getAll(userType, {
        orderBy: "name",
        orderDirection: "asc",
      });
    } catch (error) {
      console.error("Error getting all products:", error);
      return [];
    }
  }
}

// Create and export singleton instance
const productService = new ProductService();
export default productService;
