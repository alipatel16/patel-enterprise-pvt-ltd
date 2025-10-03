import { ref, push, set, get, update, remove } from 'firebase/database';
import { database } from '../../services/firebase/config';

/**
 * Service for managing brand hierarchies (Electronics only)
 * Path: /electronics/brandHierarchies/
 * Default Hierarchy Path: /electronics/defaultHierarchy/
 */
class BrandHierarchyService {
  /**
   * Get the path for brand hierarchies
   * @param {string} userType - Should be 'electronics'
   * @param {string} brandId - Optional brand ID
   */
  getBrandHierarchyPath(userType, brandId = null) {
    if (userType !== 'electronics') {
      throw new Error('Brand hierarchy is only available for electronics usertype');
    }
    const basePath = `${userType}/brandHierarchies`;
    return brandId ? `${basePath}/${brandId}` : basePath;
  }

  /**
   * Get the path for default hierarchy
   * @param {string} userType - Should be 'electronics'
   */
  getDefaultHierarchyPath(userType) {
    if (userType !== 'electronics') {
      throw new Error('Brand hierarchy is only available for electronics usertype');
    }
    return `${userType}/defaultHierarchy`;
  }

  /**
   * Get default hierarchy
   * @param {string} userType - Should be 'electronics'
   * @returns {Promise<Object|null>}
   */
  async getDefaultHierarchy(userType) {
    try {
      if (userType !== 'electronics') {
        return null;
      }

      const defaultPath = this.getDefaultHierarchyPath(userType);
      const defaultRef = ref(database, defaultPath);
      const snapshot = await get(defaultRef);

      if (!snapshot.exists()) {
        return null;
      }

      return snapshot.val();
    } catch (error) {
      console.error('Error fetching default hierarchy:', error);
      return null;
    }
  }

  /**
   * Save default hierarchy
   * @param {string} userType - Should be 'electronics'
   * @param {Object} hierarchyData - Hierarchy data {name, contact}
   * @returns {Promise<Object>}
   */
  async saveDefaultHierarchy(userType, hierarchyData) {
    try {
      if (userType !== 'electronics') {
        throw new Error('Brand hierarchy is only available for electronics usertype');
      }

      // Validate hierarchy data
      if (!hierarchyData.name || hierarchyData.name.trim() === '') {
        throw new Error('Service person name is required');
      }
      if (!hierarchyData.contact || !/^[6-9]\d{9}$/.test(hierarchyData.contact)) {
        throw new Error('Valid 10-digit mobile number is required');
      }

      const defaultHierarchy = {
        name: hierarchyData.name.trim(),
        contact: hierarchyData.contact.trim(),
        updatedAt: new Date().toISOString()
      };

      const defaultPath = this.getDefaultHierarchyPath(userType);
      const defaultRef = ref(database, defaultPath);
      await set(defaultRef, defaultHierarchy);

      return defaultHierarchy;
    } catch (error) {
      console.error('Error saving default hierarchy:', error);
      throw error;
    }
  }

  /**
   * Delete default hierarchy
   * @param {string} userType - Should be 'electronics'
   * @returns {Promise<void>}
   */
  async deleteDefaultHierarchy(userType) {
    try {
      if (userType !== 'electronics') {
        throw new Error('Brand hierarchy is only available for electronics usertype');
      }

      const defaultPath = this.getDefaultHierarchyPath(userType);
      const defaultRef = ref(database, defaultPath);
      await remove(defaultRef);
    } catch (error) {
      console.error('Error deleting default hierarchy:', error);
      throw new Error('Failed to delete default hierarchy');
    }
  }

  /**
   * Get all brands with their hierarchies
   * @param {string} userType - Should be 'electronics'
   * @returns {Promise<Array>}
   */
  async getAllBrands(userType) {
    try {
      if (userType !== 'electronics') {
        return [];
      }

      const brandsPath = this.getBrandHierarchyPath(userType);
      const brandsRef = ref(database, brandsPath);
      const snapshot = await get(brandsRef);

      if (!snapshot.exists()) {
        return [];
      }

      const brands = [];
      snapshot.forEach((childSnapshot) => {
        brands.push({
          id: childSnapshot.key,
          ...childSnapshot.val()
        });
      });

      return brands.sort((a, b) => a.brandName.localeCompare(b.brandName));
    } catch (error) {
      console.error('Error fetching brands:', error);
      throw new Error('Failed to fetch brands');
    }
  }

  /**
   * Get a specific brand by ID
   * @param {string} userType - Should be 'electronics'
   * @param {string} brandId - Brand ID
   * @returns {Promise<Object|null>}
   */
  async getBrandById(userType, brandId) {
    try {
      if (userType !== 'electronics') {
        return null;
      }

      const brandPath = this.getBrandHierarchyPath(userType, brandId);
      const brandRef = ref(database, brandPath);
      const snapshot = await get(brandRef);

      if (!snapshot.exists()) {
        return null;
      }

      return {
        id: brandId,
        ...snapshot.val()
      };
    } catch (error) {
      console.error('Error fetching brand:', error);
      throw new Error('Failed to fetch brand');
    }
  }

  /**
   * Find brand by name (case-insensitive)
   * @param {string} userType - Should be 'electronics'
   * @param {string} brandName - Brand name to search
   * @returns {Promise<Object|null>}
   */
  async findBrandByName(userType, brandName) {
    try {
      if (userType !== 'electronics' || !brandName) {
        return null;
      }

      const brands = await this.getAllBrands(userType);
      const searchName = brandName.toLowerCase().trim();
      
      return brands.find(brand => 
        brand.brandName.toLowerCase().trim() === searchName
      ) || null;
    } catch (error) {
      console.error('Error finding brand by name:', error);
      return null;
    }
  }

  /**
   * Detect brand name from complaint title
   * @param {string} userType - Should be 'electronics'
   * @param {string} title - Complaint title
   * @returns {Promise<Object|null>} - Returns brand object if found
   */
  async detectBrandFromTitle(userType, title) {
    try {
      if (userType !== 'electronics' || !title) {
        return null;
      }

      const brands = await this.getAllBrands(userType);
      const titleLower = title.toLowerCase().trim();

      // Find brand whose name appears in the title
      for (const brand of brands) {
        const brandNameLower = brand.brandName.toLowerCase().trim();
        if (titleLower.includes(brandNameLower)) {
          return brand;
        }
      }

      return null;
    } catch (error) {
      console.error('Error detecting brand from title:', error);
      return null;
    }
  }

  /**
   * Create or update a brand
   * @param {string} userType - Should be 'electronics'
   * @param {Object} brandData - Brand data
   * @returns {Promise<Object>}
   */
  async saveBrand(userType, brandData) {
    try {
      if (userType !== 'electronics') {
        throw new Error('Brand hierarchy is only available for electronics usertype');
      }

      // Validate brand data
      if (!brandData.brandName || brandData.brandName.trim() === '') {
        throw new Error('Brand name is required');
      }

      // Check if brand name already exists (for new brands)
      if (!brandData.id) {
        const existingBrand = await this.findBrandByName(userType, brandData.brandName);
        if (existingBrand) {
          throw new Error('A brand with this name already exists');
        }
      }

      const brandToSave = {
        brandName: brandData.brandName.trim(),
        hierarchy: brandData.hierarchy || [],
        createdAt: brandData.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Validate hierarchy
      if (brandToSave.hierarchy.length > 0) {
        for (let i = 0; i < brandToSave.hierarchy.length; i++) {
          const level = brandToSave.hierarchy[i];
          if (!level.name || level.name.trim() === '') {
            throw new Error(`Service person name is required for level ${i + 1}`);
          }
          if (!level.contact || !/^[6-9]\d{9}$/.test(level.contact)) {
            throw new Error(`Valid 10-digit mobile number is required for level ${i + 1}`);
          }
        }
      }

      if (brandData.id) {
        // Update existing brand
        const brandPath = this.getBrandHierarchyPath(userType, brandData.id);
        const brandRef = ref(database, brandPath);
        await update(brandRef, brandToSave);
        
        return {
          id: brandData.id,
          ...brandToSave
        };
      } else {
        // Create new brand
        const brandsPath = this.getBrandHierarchyPath(userType);
        const brandsRef = ref(database, brandsPath);
        const newBrandRef = push(brandsRef);
        await set(newBrandRef, brandToSave);
        
        return {
          id: newBrandRef.key,
          ...brandToSave
        };
      }
    } catch (error) {
      console.error('Error saving brand:', error);
      throw error;
    }
  }

  /**
   * Delete a brand
   * @param {string} userType - Should be 'electronics'
   * @param {string} brandId - Brand ID
   * @returns {Promise<void>}
   */
  async deleteBrand(userType, brandId) {
    try {
      if (userType !== 'electronics') {
        throw new Error('Brand hierarchy is only available for electronics usertype');
      }

      const brandPath = this.getBrandHierarchyPath(userType, brandId);
      const brandRef = ref(database, brandPath);
      await remove(brandRef);
    } catch (error) {
      console.error('Error deleting brand:', error);
      throw new Error('Failed to delete brand');
    }
  }

  /**
   * Get first hierarchy level for a brand
   * @param {string} userType - Should be 'electronics'
   * @param {string} brandName - Brand name
   * @returns {Promise<Object|null>} - Returns {name, contact} or null
   */
  async getFirstHierarchyLevel(userType, brandName) {
    try {
      if (userType !== 'electronics' || !brandName) {
        return null;
      }

      const brand = await this.findBrandByName(userType, brandName);
      if (!brand || !brand.hierarchy || brand.hierarchy.length === 0) {
        return null;
      }

      return brand.hierarchy[0];
    } catch (error) {
      console.error('Error getting first hierarchy level:', error);
      return null;
    }
  }

  /**
   * Get next hierarchy level
   * @param {string} userType - Should be 'electronics'
   * @param {string} brandName - Brand name
   * @param {string} currentContact - Current service person contact
   * @returns {Promise<Object|null>} - Returns {name, contact, level} or null
   */
  async getNextHierarchyLevel(userType, brandName, currentContact) {
    try {
      if (userType !== 'electronics' || !brandName || !currentContact) {
        return null;
      }

      const brand = await this.findBrandByName(userType, brandName);
      if (!brand || !brand.hierarchy || brand.hierarchy.length === 0) {
        return null;
      }

      // Find current level
      const currentIndex = brand.hierarchy.findIndex(
        level => level.contact === currentContact
      );

      if (currentIndex === -1 || currentIndex === brand.hierarchy.length - 1) {
        // Not found or already at last level
        return null;
      }

      // Return next level
      return {
        ...brand.hierarchy[currentIndex + 1],
        level: currentIndex + 2
      };
    } catch (error) {
      console.error('Error getting next hierarchy level:', error);
      return null;
    }
  }

  /**
   * Check if current contact is at the last level of brand hierarchy
   * @param {string} userType - Should be 'electronics'
   * @param {string} brandName - Brand name
   * @param {string} currentContact - Current service person contact
   * @returns {Promise<boolean>}
   */
  async isAtLastHierarchyLevel(userType, brandName, currentContact) {
    try {
      if (userType !== 'electronics' || !brandName || !currentContact) {
        return false;
      }

      const brand = await this.findBrandByName(userType, brandName);
      if (!brand || !brand.hierarchy || brand.hierarchy.length === 0) {
        return false;
      }

      // Find current level
      const currentIndex = brand.hierarchy.findIndex(
        level => level.contact === currentContact
      );

      // Return true if at last level
      return currentIndex === brand.hierarchy.length - 1;
    } catch (error) {
      console.error('Error checking if at last hierarchy level:', error);
      return false;
    }
  }

  /**
   * Extract potential brand name from complaint title
   * Returns first 1-3 words that could be a brand name
   * @param {string} title - Complaint title
   * @returns {string}
   */
  extractPotentialBrandName(title) {
    if (!title) return '';
    
    const words = title.trim().split(/\s+/);
    
    // Try first 3 words, then 2, then 1
    if (words.length >= 3) {
      const threeWords = words.slice(0, 3).join(' ');
      if (threeWords.length <= 30) return threeWords;
    }
    
    if (words.length >= 2) {
      const twoWords = words.slice(0, 2).join(' ');
      if (twoWords.length <= 30) return twoWords;
    }
    
    return words[0] || '';
  }
}

// Create and export singleton instance
const brandHierarchyService = new BrandHierarchyService();
export default brandHierarchyService;