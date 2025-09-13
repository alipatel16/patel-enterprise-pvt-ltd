// src/utils/helpers/locationUtils.js
import { USER_TYPES } from '../constants/appConstants';

// Store coordinates
export const STORE_COORDINATES = {
  [USER_TYPES.ELECTRONICS]: {
    latitude: 23.1266973,
    longitude: 72.0487812,
    name: 'Electronics Store',
    address: 'Electronics Store Location'
  },
  [USER_TYPES.FURNITURE]: {
    latitude: 23.1251434,
    longitude: 72.0449629,
    name: 'Furniture Store',
    address: 'Furniture Store Location'
  }
};

// Maximum allowed distance from store (in meters)
export const MAX_ALLOWED_DISTANCE = 100;

/**
 * Get current position using Geolocation API
 * @param {Object} options - Geolocation options
 * @returns {Promise<Object>} Position object with coords
 */
export const getCurrentPosition = (options = {}) => {
  const defaultOptions = {
    enableHighAccuracy: true,
    timeout: 10000,
    maximumAge: 0
  };

  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by this browser'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: new Date().toISOString(),
          altitude: position.coords.altitude,
          altitudeAccuracy: position.coords.altitudeAccuracy,
          heading: position.coords.heading,
          speed: position.coords.speed
        });
      },
      (error) => {
        let errorMessage = 'Failed to get location';
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location access denied by user';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information is unavailable';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out';
            break;
          default:
            errorMessage = 'An unknown error occurred while retrieving location';
            break;
        }
        
        reject(new Error(errorMessage));
      },
      { ...defaultOptions, ...options }
    );
  });
};

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param {number} lat1 - Latitude of first point
 * @param {number} lon1 - Longitude of first point
 * @param {number} lat2 - Latitude of second point
 * @param {number} lon2 - Longitude of second point
 * @returns {number} Distance in meters
 */
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = lat1 * Math.PI / 180; // φ, λ in radians
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) *
    Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
};

/**
 * Check if current location is within allowed radius of store
 * @param {Object} currentLocation - Current GPS coordinates
 * @param {string} userType - Store type (electronics/furniture)
 * @returns {Object} Validation result with distance info
 */
export const validateLocationProximity = (currentLocation, userType) => {
  if (!currentLocation || !userType) {
    return {
      isValid: false,
      distance: null,
      error: 'Location or user type not provided'
    };
  }

  const storeCoords = STORE_COORDINATES[userType];
  if (!storeCoords) {
    return {
      isValid: false,
      distance: null,
      error: 'Store coordinates not found'
    };
  }

  const distance = calculateDistance(
    currentLocation.latitude,
    currentLocation.longitude,
    storeCoords.latitude,
    storeCoords.longitude
  );

  const isValid = distance <= MAX_ALLOWED_DISTANCE;

  return {
    isValid,
    distance: Math.round(distance),
    maxAllowedDistance: MAX_ALLOWED_DISTANCE,
    storeName: storeCoords.name,
    storeCoordinates: storeCoords,
    currentCoordinates: currentLocation,
    error: isValid ? null : `You are ${Math.round(distance)}m away from the store. Please move within ${MAX_ALLOWED_DISTANCE}m to check in.`
  };
};

/**
 * Request location permission
 * @returns {Promise<boolean>} Whether permission was granted
 */
export const requestLocationPermission = async () => {
  try {
    if (!navigator.geolocation) {
      throw new Error('Geolocation not supported');
    }

    // Try to get current position to trigger permission request
    await getCurrentPosition({ timeout: 5000 });
    return true;
  } catch (error) {
    console.error('Location permission denied:', error);
    return false;
  }
};

/**
 * Check if geolocation is supported
 * @returns {boolean} Whether geolocation is supported
 */
export const isGeolocationSupported = () => {
  return 'geolocation' in navigator;
};

/**
 * Format coordinates for display
 * @param {number} latitude - Latitude
 * @param {number} longitude - Longitude
 * @returns {string} Formatted coordinates
 */
export const formatCoordinates = (latitude, longitude) => {
  if (latitude == null || longitude == null) return 'N/A';
  
  return `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
};

/**
 * Get address from coordinates (reverse geocoding)
 * Note: This is a simplified example. In production, you'd use a service like Google Maps API
 * @param {number} latitude - Latitude
 * @param {number} longitude - Longitude
 * @returns {Promise<string>} Address string
 */
export const getAddressFromCoordinates = async (latitude, longitude) => {
  try {
    // This is a placeholder for reverse geocoding
    // In production, integrate with Google Maps Geocoding API or similar service
    return `Lat: ${latitude.toFixed(4)}, Lng: ${longitude.toFixed(4)}`;
  } catch (error) {
    console.error('Failed to get address:', error);
    return formatCoordinates(latitude, longitude);
  }
};

/**
 * Generate Google Maps link for coordinates
 * @param {number} latitude - Latitude
 * @param {number} longitude - Longitude
 * @param {number} zoom - Map zoom level
 * @returns {string} Google Maps URL
 */
export const generateMapsLink = (latitude, longitude, zoom = 15) => {
  if (latitude == null || longitude == null) return '';
  
  return `https://www.google.com/maps?q=${latitude},${longitude}&z=${zoom}`;
};

/**
 * Calculate accuracy status based on GPS accuracy
 * @param {number} accuracy - GPS accuracy in meters
 * @returns {Object} Accuracy status
 */
export const getAccuracyStatus = (accuracy) => {
  if (!accuracy) {
    return { level: 'unknown', color: 'default', text: 'Unknown' };
  }

  if (accuracy <= 5) {
    return { level: 'excellent', color: 'success', text: 'Excellent' };
  } else if (accuracy <= 10) {
    return { level: 'good', color: 'info', text: 'Good' };
  } else if (accuracy <= 20) {
    return { level: 'fair', color: 'warning', text: 'Fair' };
  } else {
    return { level: 'poor', color: 'error', text: 'Poor' };
  }
};

/**
 * Watch position changes
 * @param {Function} callback - Callback function for position updates
 * @param {Object} options - Watch options
 * @returns {number} Watch ID for clearing
 */
export const watchPosition = (callback, options = {}) => {
  if (!navigator.geolocation) {
    throw new Error('Geolocation not supported');
  }

  const defaultOptions = {
    enableHighAccuracy: true,
    timeout: 5000,
    maximumAge: 0
  };

  return navigator.geolocation.watchPosition(
    (position) => {
      const locationData = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        timestamp: new Date().toISOString()
      };
      callback(locationData);
    },
    (error) => {
      console.error('Watch position error:', error);
      callback(null, error);
    },
    { ...defaultOptions, ...options }
  );
};

/**
 * Clear position watch
 * @param {number} watchId - Watch ID to clear
 */
export const clearPositionWatch = (watchId) => {
  if (navigator.geolocation && watchId) {
    navigator.geolocation.clearWatch(watchId);
  }
};

/**
 * Get distance status for UI display
 * @param {number} distance - Distance in meters
 * @param {number} maxDistance - Maximum allowed distance
 * @returns {Object} Status object
 */
export const getDistanceStatus = (distance, maxDistance = MAX_ALLOWED_DISTANCE) => {
  if (distance == null) {
    return { status: 'unknown', color: 'default', text: 'Unknown distance' };
  }

  if (distance <= maxDistance) {
    return { 
      status: 'within', 
      color: 'success', 
      text: `Within range (${distance}m)` 
    };
  } else {
    const excess = distance - maxDistance;
    return { 
      status: 'outside', 
      color: 'error', 
      text: `${excess}m too far` 
    };
  }
};

export default {
  STORE_COORDINATES,
  MAX_ALLOWED_DISTANCE,
  getCurrentPosition,
  calculateDistance,
  validateLocationProximity,
  requestLocationPermission,
  isGeolocationSupported,
  formatCoordinates,
  getAddressFromCoordinates,
  generateMapsLink,
  getAccuracyStatus,
  watchPosition,
  clearPositionWatch,
  getDistanceStatus
};