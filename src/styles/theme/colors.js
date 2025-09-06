/**
 * Colors Theme Configuration
 * Defines color palettes and theme configurations for the application
 */

// Base Color Palette
export const BASE_COLORS = {
  // Primary Colors
  blue: {
    50: '#e3f2fd',
    100: '#bbdefb',
    200: '#90caf9',
    300: '#64b5f6',
    400: '#42a5f5',
    500: '#2196f3',
    600: '#1e88e5',
    700: '#1976d2',
    800: '#1565c0',
    900: '#0d47a1'
  },
  brown: {
    50: '#efebe9',
    100: '#d7ccc8',
    200: '#bcaaa4',
    300: '#a1887f',
    400: '#8d6e63',
    500: '#795548',
    600: '#6d4c41',
    700: '#5d4037',
    800: '#4e342e',
    900: '#3e2723'
  },
  // Success Colors
  green: {
    50: '#e8f5e8',
    100: '#c8e6c9',
    200: '#a5d6a7',
    300: '#81c784',
    400: '#66bb6a',
    500: '#4caf50',
    600: '#43a047',
    700: '#388e3c',
    800: '#2e7d32',
    900: '#1b5e20'
  },
  // Warning Colors
  orange: {
    50: '#fff3e0',
    100: '#ffe0b2',
    200: '#ffcc80',
    300: '#ffb74d',
    400: '#ffa726',
    500: '#ff9800',
    600: '#fb8c00',
    700: '#f57c00',
    800: '#ef6c00',
    900: '#e65100'
  },
  // Error Colors
  red: {
    50: '#ffebee',
    100: '#ffcdd2',
    200: '#ef9a9a',
    300: '#e57373',
    400: '#ef5350',
    500: '#f44336',
    600: '#e53935',
    700: '#d32f2f',
    800: '#c62828',
    900: '#b71c1c'
  },
  // Info Colors
  lightBlue: {
    50: '#e1f5fe',
    100: '#b3e5fc',
    200: '#81d4fa',
    300: '#4fc3f7',
    400: '#29b6f6',
    500: '#03a9f4',
    600: '#039be5',
    700: '#0288d1',
    800: '#0277bd',
    900: '#01579b'
  },
  // Neutral Colors
  grey: {
    50: '#fafafa',
    100: '#f5f5f5',
    200: '#eeeeee',
    300: '#e0e0e0',
    400: '#bdbdbd',
    500: '#9e9e9e',
    600: '#757575',
    700: '#616161',
    800: '#424242',
    900: '#212121'
  }
};

// Electronics Theme Colors
export const ELECTRONICS_COLORS = {
  primary: {
    light: BASE_COLORS.blue[300],
    main: BASE_COLORS.blue[700],
    dark: BASE_COLORS.blue[900],
    contrastText: '#ffffff'
  },
  secondary: {
    light: BASE_COLORS.lightBlue[200],
    main: BASE_COLORS.lightBlue[500],
    dark: BASE_COLORS.lightBlue[700],
    contrastText: '#ffffff'
  },
  accent: {
    light: BASE_COLORS.orange[300],
    main: BASE_COLORS.orange[500],
    dark: BASE_COLORS.orange[700],
    contrastText: '#ffffff'
  },
  success: {
    light: BASE_COLORS.green[300],
    main: BASE_COLORS.green[500],
    dark: BASE_COLORS.green[700],
    contrastText: '#ffffff'
  },
  warning: {
    light: BASE_COLORS.orange[300],
    main: BASE_COLORS.orange[500],
    dark: BASE_COLORS.orange[700],
    contrastText: '#ffffff'
  },
  error: {
    light: BASE_COLORS.red[300],
    main: BASE_COLORS.red[500],
    dark: BASE_COLORS.red[700],
    contrastText: '#ffffff'
  },
  info: {
    light: BASE_COLORS.lightBlue[300],
    main: BASE_COLORS.lightBlue[500],
    dark: BASE_COLORS.lightBlue[700],
    contrastText: '#ffffff'
  },
  background: {
    default: '#f5f5f5',
    paper: '#ffffff',
    surface: '#fafafa'
  },
  text: {
    primary: BASE_COLORS.grey[900],
    secondary: BASE_COLORS.grey[600],
    disabled: BASE_COLORS.grey[400],
    hint: BASE_COLORS.grey[500]
  }
};

// Furniture Theme Colors
export const FURNITURE_COLORS = {
  primary: {
    light: BASE_COLORS.brown[300],
    main: BASE_COLORS.brown[600],
    dark: BASE_COLORS.brown[800],
    contrastText: '#ffffff'
  },
  secondary: {
    light: BASE_COLORS.brown[200],
    main: BASE_COLORS.brown[400],
    dark: BASE_COLORS.brown[600],
    contrastText: '#ffffff'
  },
  accent: {
    light: BASE_COLORS.orange[300],
    main: BASE_COLORS.orange[600],
    dark: BASE_COLORS.orange[800],
    contrastText: '#ffffff'
  },
  success: {
    light: BASE_COLORS.green[300],
    main: BASE_COLORS.green[600],
    dark: BASE_COLORS.green[800],
    contrastText: '#ffffff'
  },
  warning: {
    light: BASE_COLORS.orange[300],
    main: BASE_COLORS.orange[600],
    dark: BASE_COLORS.orange[800],
    contrastText: '#ffffff'
  },
  error: {
    light: BASE_COLORS.red[300],
    main: BASE_COLORS.red[500],
    dark: BASE_COLORS.red[700],
    contrastText: '#ffffff'
  },
  info: {
    light: BASE_COLORS.blue[300],
    main: BASE_COLORS.blue[500],
    dark: BASE_COLORS.blue[700],
    contrastText: '#ffffff'
  },
  background: {
    default: '#fafafa',
    paper: '#ffffff',
    surface: '#f9f7f4'
  },
  text: {
    primary: BASE_COLORS.grey[900],
    secondary: BASE_COLORS.grey[600],
    disabled: BASE_COLORS.grey[400],
    hint: BASE_COLORS.grey[500]
  }
};

// Common UI Colors
export const UI_COLORS = {
  divider: BASE_COLORS.grey[300],
  border: BASE_COLORS.grey[300],
  hover: BASE_COLORS.grey[100],
  selected: BASE_COLORS.grey[200],
  disabled: BASE_COLORS.grey[300],
  overlay: 'rgba(0, 0, 0, 0.5)',
  backdrop: 'rgba(0, 0, 0, 0.3)',
  focus: 'rgba(25, 118, 210, 0.2)',
  
  // Status Colors
  status: {
    active: BASE_COLORS.green[500],
    inactive: BASE_COLORS.grey[500],
    pending: BASE_COLORS.orange[500],
    cancelled: BASE_COLORS.red[500],
    processing: BASE_COLORS.blue[500],
    completed: BASE_COLORS.green[600]
  },
  
  // Priority Colors
  priority: {
    high: BASE_COLORS.red[500],
    medium: BASE_COLORS.orange[500],
    low: BASE_COLORS.green[500]
  },
  
  // Payment Status Colors
  payment: {
    paid: BASE_COLORS.green[500],
    pending: BASE_COLORS.orange[500],
    overdue: BASE_COLORS.red[500],
    partial: BASE_COLORS.blue[500],
    emi: BASE_COLORS.lightBlue[500]
  },
  
  // Delivery Status Colors
  delivery: {
    delivered: BASE_COLORS.green[500],
    pending: BASE_COLORS.grey[500],
    shipped: BASE_COLORS.blue[500],
    cancelled: BASE_COLORS.red[500],
    returned: BASE_COLORS.orange[500]
  }
};

// Shadow and Elevation Colors
export const SHADOWS = {
  none: 'none',
  xs: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  sm: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)'
};

// Gradient Definitions
export const GRADIENTS = {
  electronics: {
    primary: `linear-gradient(135deg, ${BASE_COLORS.blue[500]}, ${BASE_COLORS.lightBlue[500]})`,
    secondary: `linear-gradient(135deg, ${BASE_COLORS.lightBlue[300]}, ${BASE_COLORS.blue[300]})`,
    surface: `linear-gradient(145deg, #ffffff, #f8fbff)`
  },
  furniture: {
    primary: `linear-gradient(135deg, ${BASE_COLORS.brown[600]}, ${BASE_COLORS.brown[400]})`,
    secondary: `linear-gradient(135deg, ${BASE_COLORS.brown[400]}, ${BASE_COLORS.orange[400]})`,
    surface: `linear-gradient(145deg, #ffffff, #faf8f5)`
  },
  success: `linear-gradient(135deg, ${BASE_COLORS.green[400]}, ${BASE_COLORS.green[600]})`,
  warning: `linear-gradient(135deg, ${BASE_COLORS.orange[400]}, ${BASE_COLORS.orange[600]})`,
  error: `linear-gradient(135deg, ${BASE_COLORS.red[400]}, ${BASE_COLORS.red[600]})`
};

// Chart Colors
export const CHART_COLORS = {
  primary: [
    BASE_COLORS.blue[500],
    BASE_COLORS.blue[400],
    BASE_COLORS.blue[600],
    BASE_COLORS.blue[300],
    BASE_COLORS.blue[700]
  ],
  secondary: [
    BASE_COLORS.brown[500],
    BASE_COLORS.brown[400],
    BASE_COLORS.brown[600],
    BASE_COLORS.brown[300],
    BASE_COLORS.brown[700]
  ],
  mixed: [
    BASE_COLORS.blue[500],
    BASE_COLORS.green[500],
    BASE_COLORS.orange[500],
    BASE_COLORS.red[500],
    BASE_COLORS.brown[500],
    BASE_COLORS.lightBlue[500]
  ],
  gradients: {
    sales: GRADIENTS.electronics.primary,
    revenue: GRADIENTS.furniture.primary,
    growth: GRADIENTS.success
  }
};

// Dark Mode Colors (for future implementation)
export const DARK_MODE_COLORS = {
  background: {
    default: '#121212',
    paper: '#1e1e1e',
    surface: '#252525'
  },
  text: {
    primary: '#ffffff',
    secondary: 'rgba(255, 255, 255, 0.7)',
    disabled: 'rgba(255, 255, 255, 0.38)',
    hint: 'rgba(255, 255, 255, 0.5)'
  },
  divider: 'rgba(255, 255, 255, 0.12)',
  border: 'rgba(255, 255, 255, 0.23)',
  hover: 'rgba(255, 255, 255, 0.04)',
  selected: 'rgba(255, 255, 255, 0.08)'
};

// Color Utility Functions
/**
 * Convert hex color to rgba
 * @param {string} hex - Hex color code
 * @param {number} alpha - Alpha value (0-1)
 * @returns {string} RGBA color string
 */
export const hexToRgba = (hex, alpha) => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

/**
 * Lighten a color
 * @param {string} color - Color to lighten
 * @param {number} amount - Amount to lighten (0-1)
 * @returns {string} Lightened color
 */
export const lightenColor = (color, amount) => {
  // This is a simplified version - in production, use a color manipulation library
  const num = parseInt(color.replace('#', ''), 16);
  const amt = Math.round(255 * amount);
  const R = (num >> 16) + amt;
  const B = (num >> 8 & 0x00FF) + amt;
  const G = (num & 0x0000FF) + amt;
  
  return `#${(0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
    (B < 255 ? B < 1 ? 0 : B : 255) * 0x100 +
    (G < 255 ? G < 1 ? 0 : G : 255)).toString(16).slice(1)}`;
};

/**
 * Darken a color
 * @param {string} color - Color to darken
 * @param {number} amount - Amount to darken (0-1)
 * @returns {string} Darkened color
 */
export const darkenColor = (color, amount) => {
  // This is a simplified version - in production, use a color manipulation library
  const num = parseInt(color.replace('#', ''), 16);
  const amt = Math.round(255 * amount);
  const R = (num >> 16) - amt;
  const B = (num >> 8 & 0x00FF) - amt;
  const G = (num & 0x0000FF) - amt;
  
  return `#${(0x1000000 + (R > 255 ? 255 : R < 0 ? 0 : R) * 0x10000 +
    (B > 255 ? 255 : B < 0 ? 0 : B) * 0x100 +
    (G > 255 ? 255 : G < 0 ? 0 : G)).toString(16).slice(1)}`;
};

/**
 * Get contrasting text color
 * @param {string} backgroundColor - Background color
 * @returns {string} Contrasting text color
 */
export const getContrastText = (backgroundColor) => {
  // Simple contrast calculation
  const hex = backgroundColor.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  
  return brightness > 128 ? '#000000' : '#ffffff';
};

// Custom Color Tokens
export const COLOR_TOKENS = {
  // Brand Colors
  brand: {
    primary: BASE_COLORS.blue[700],
    secondary: BASE_COLORS.brown[600],
    accent: BASE_COLORS.orange[500]
  },
  
  // Semantic Colors
  semantic: {
    success: BASE_COLORS.green[500],
    warning: BASE_COLORS.orange[500],
    error: BASE_COLORS.red[500],
    info: BASE_COLORS.lightBlue[500]
  },
  
  // Interactive Colors
  interactive: {
    primary: BASE_COLORS.blue[700],
    primaryHover: BASE_COLORS.blue[800],
    secondary: BASE_COLORS.grey[600],
    secondaryHover: BASE_COLORS.grey[700],
    disabled: BASE_COLORS.grey[400],
    link: BASE_COLORS.blue[600],
    linkHover: BASE_COLORS.blue[800]
  },
  
  // Surface Colors
  surface: {
    background: '#f5f5f5',
    paper: '#ffffff',
    elevated: '#ffffff',
    overlay: 'rgba(0, 0, 0, 0.04)',
    divider: BASE_COLORS.grey[300],
    border: BASE_COLORS.grey[300]
  }
};

// Color Accessibility Ratios
export const ACCESSIBILITY_RATIOS = {
  AA_NORMAL: 4.5,
  AA_LARGE: 3,
  AAA_NORMAL: 7,
  AAA_LARGE: 4.5
};

// Application-specific color schemes
export const APP_THEMES = {
  electronics: {
    ...ELECTRONICS_COLORS,
    gradients: GRADIENTS.electronics,
    charts: CHART_COLORS.primary
  },
  furniture: {
    ...FURNITURE_COLORS,
    gradients: GRADIENTS.furniture,
    charts: CHART_COLORS.secondary
  }
};

// Export default colors object
export default {
  BASE_COLORS,
  ELECTRONICS_COLORS,
  FURNITURE_COLORS,
  UI_COLORS,
  SHADOWS,
  GRADIENTS,
  CHART_COLORS,
  DARK_MODE_COLORS,
  COLOR_TOKENS,
  APP_THEMES,
  
  // Utility functions
  hexToRgba,
  lightenColor,
  darkenColor,
  getContrastText
};