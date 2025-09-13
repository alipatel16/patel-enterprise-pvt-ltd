// src/utils/helpers/photoUtils.js

/**
 * Capture photo from camera and compress it
 * @param {number} quality - Compression quality (0-1)
 * @param {number} maxWidth - Maximum width in pixels
 * @param {number} maxHeight - Maximum height in pixels
 * @returns {Promise<string>} Base64 encoded image string
 */
export const captureAndCompressPhoto = (quality = 0.7, maxWidth = 800, maxHeight = 600) => {
  return new Promise((resolve, reject) => {
    navigator.mediaDevices.getUserMedia({ 
      video: { 
        facingMode: 'user', // Front camera for selfies
        width: { ideal: maxWidth },
        height: { ideal: maxHeight }
      } 
    })
    .then(stream => {
      // Create video element
      const video = document.createElement('video');
      video.srcObject = stream;
      video.play();

      video.onloadedmetadata = () => {
        // Create canvas for capturing
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        
        // Set canvas dimensions
        canvas.width = Math.min(video.videoWidth, maxWidth);
        canvas.height = Math.min(video.videoHeight, maxHeight);
        
        // Draw video frame to canvas
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Stop the video stream
        stream.getTracks().forEach(track => track.stop());
        
        // Convert to base64 with compression
        const base64String = canvas.toDataURL('image/jpeg', quality);
        
        // Remove data:image/jpeg;base64, prefix for storage
        const base64Data = base64String.split(',')[1];
        
        resolve(base64Data);
      };
    })
    .catch(error => {
      console.error('Error accessing camera:', error);
      reject(new Error('Failed to access camera: ' + error.message));
    });
  });
};

/**
 * Capture photo using file input (fallback)
 * @param {File} file - Image file from input
 * @param {number} quality - Compression quality (0-1)
 * @param {number} maxWidth - Maximum width in pixels
 * @param {number} maxHeight - Maximum height in pixels
 * @returns {Promise<string>} Base64 encoded image string
 */
export const compressImageFile = (file, quality = 0.7, maxWidth = 800, maxHeight = 600) => {
  return new Promise((resolve, reject) => {
    if (!file || !file.type.startsWith('image/')) {
      reject(new Error('Invalid image file'));
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        // Create canvas for compression
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        
        // Calculate new dimensions maintaining aspect ratio
        let { width, height } = img;
        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Draw and compress
        context.drawImage(img, 0, 0, width, height);
        const base64String = canvas.toDataURL('image/jpeg', quality);
        
        // Remove data URL prefix
        const base64Data = base64String.split(',')[1];
        resolve(base64Data);
      };
      img.src = e.target.result;
    };
    reader.onerror = () => reject(new Error('Failed to read image file'));
    reader.readAsDataURL(file);
  });
};

/**
 * Convert base64 string back to image data URL for display
 * @param {string} base64String - Base64 encoded image
 * @returns {string} Data URL for image display
 */
export const base64ToImageUrl = (base64String) => {
  if (!base64String) return '';
  
  // Add data URL prefix if not present
  if (!base64String.startsWith('data:')) {
    return `data:image/jpeg;base64,${base64String}`;
  }
  
  return base64String;
};

/**
 * Validate if browser supports camera access
 * @returns {boolean} Whether camera is supported
 */
export const isCameraSupported = () => {
  return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
};

/**
 * Request camera permission
 * @returns {Promise<boolean>} Whether permission was granted
 */
export const requestCameraPermission = async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    stream.getTracks().forEach(track => track.stop());
    return true;
  } catch (error) {
    console.error('Camera permission denied:', error);
    return false;
  }
};

/**
 * Get image dimensions from base64
 * @param {string} base64String - Base64 encoded image
 * @returns {Promise<Object>} Image dimensions {width, height}
 */
export const getImageDimensions = (base64String) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.width, height: img.height });
    };
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = base64ToImageUrl(base64String);
  });
};

/**
 * Calculate file size from base64 string
 * @param {string} base64String - Base64 encoded string
 * @returns {number} File size in bytes
 */
export const getBase64FileSize = (base64String) => {
  if (!base64String) return 0;
  
  // Remove data URL prefix if present
  const base64Data = base64String.includes(',') ? base64String.split(',')[1] : base64String;
  
  // Calculate size (base64 encoding increases size by ~33%)
  return Math.round((base64Data.length * 3) / 4);
};

/**
 * Format file size for display
 * @param {number} bytes - File size in bytes
 * @returns {string} Formatted file size
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export default {
  captureAndCompressPhoto,
  compressImageFile,
  base64ToImageUrl,
  isCameraSupported,
  requestCameraPermission,
  getImageDimensions,
  getBase64FileSize,
  formatFileSize
};