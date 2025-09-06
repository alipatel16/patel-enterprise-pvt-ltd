/**
 * User Type Themes
 * Complete theme configurations for different business types (Electronics & Furniture)
 */

import { createTheme } from '@mui/material/styles';
import { 
  ELECTRONICS_COLORS, 
  FURNITURE_COLORS, 
  UI_COLORS, 
  SHADOWS,
  GRADIENTS 
} from './colors';
import { 
  TYPOGRAPHY_SCALE, 
  BUSINESS_TYPOGRAPHY,
  CUSTOM_TYPOGRAPHY 
} from './typography';
import { USER_TYPES } from '../../utils/constants/userTypeConstants';

// Base theme configuration shared across all user types
const baseThemeConfig = {
  breakpoints: {
    values: {
      xs: 0,
      sm: 600,
      md: 960,
      lg: 1280,
      xl: 1920
    }
  },
  
  spacing: 8, // 8px base spacing unit
  
  shape: {
    borderRadius: 8
  },
  
  shadows: [
    SHADOWS.none,
    SHADOWS.xs,
    SHADOWS.sm,
    SHADOWS.sm,
    SHADOWS.md,
    SHADOWS.md,
    SHADOWS.lg,
    SHADOWS.lg,
    SHADOWS.xl,
    SHADOWS.xl,
    SHADOWS.xl,
    SHADOWS.xl,
    SHADOWS.xl,
    SHADOWS.xl,
    SHADOWS.xl,
    SHADOWS.xl,
    SHADOWS.xl,
    SHADOWS.xl,
    SHADOWS.xl,
    SHADOWS.xl,
    SHADOWS.xl,
    SHADOWS.xl,
    SHADOWS.xl,
    SHADOWS.xl,
    SHADOWS.xl
  ],
  
  zIndex: {
    mobileStepper: 1000,
    fab: 1050,
    speedDial: 1050,
    appBar: 1100,
    drawer: 1200,
    modal: 1300,
    snackbar: 1400,
    tooltip: 1500
  },

  components: {
    // Global component overrides
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          fontFamily: TYPOGRAPHY_SCALE.fontFamily,
          backgroundColor: '#f5f5f5',
          margin: 0,
          padding: 0,
          lineHeight: 1.6
        }
      }
    },
    
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 8,
          fontWeight: 600,
          padding: '8px 16px',
          minHeight: 40,
          boxShadow: 'none',
          '&:hover': {
            boxShadow: SHADOWS.sm
          }
        },
        contained: {
          boxShadow: SHADOWS.sm,
          '&:hover': {
            boxShadow: SHADOWS.md
          }
        }
      }
    },
    
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: SHADOWS.sm,
          border: '1px solid rgba(0, 0, 0, 0.04)',
          '&:hover': {
            boxShadow: SHADOWS.md
          }
        }
      }
    },
    
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
            backgroundColor: 'rgba(255, 255, 255, 0.8)',
            '&:hover': {
              backgroundColor: '#ffffff'
            },
            '&.Mui-focused': {
              backgroundColor: '#ffffff'
            }
          }
        }
      }
    },
    
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          fontWeight: 500
        }
      }
    },
    
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: SHADOWS.md,
          background: '#ffffff',
          color: '#333333',
          borderBottom: '1px solid rgba(0, 0, 0, 0.08)'
        }
      }
    },
    
    MuiDrawer: {
      styleOverrides: {
        paper: {
          borderRight: '1px solid rgba(0, 0, 0, 0.08)',
          boxShadow: 'none'
        }
      }
    },
    
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          margin: '2px 8px',
          '&:hover': {
            backgroundColor: 'rgba(0, 0, 0, 0.04)'
          },
          '&.Mui-selected': {
            backgroundColor: 'rgba(25, 118, 210, 0.08)',
            '&:hover': {
              backgroundColor: 'rgba(25, 118, 210, 0.12)'
            }
          }
        }
      }
    },
    
    MuiTableContainer: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          border: '1px solid rgba(0, 0, 0, 0.04)'
        }
      }
    },
    
    MuiTableHead: {
      styleOverrides: {
        root: {
          backgroundColor: '#fafafa'
        }
      }
    },
    
    MuiTableCell: {
      styleOverrides: {
        head: {
          fontWeight: 600,
          color: '#333333',
          borderBottom: '2px solid #e0e0e0'
        },
        body: {
          borderBottom: '1px solid #f0f0f0'
        }
      }
    },
    
    MuiFab: {
      styleOverrides: {
        root: {
          boxShadow: SHADOWS.lg,
          '&:hover': {
            boxShadow: SHADOWS.xl
          }
        }
      }
    }
  }
};

// Electronics Theme
export const ELECTRONICS_THEME = createTheme({
  ...baseThemeConfig,
  
  palette: {
    mode: 'light',
    ...ELECTRONICS_COLORS,
    common: {
      black: '#000000',
      white: '#ffffff'
    },
    divider: UI_COLORS.divider,
    action: {
      active: 'rgba(0, 0, 0, 0.54)',
      hover: 'rgba(0, 0, 0, 0.04)',
      hoverOpacity: 0.04,
      selected: 'rgba(0, 0, 0, 0.08)',
      selectedOpacity: 0.08,
      disabled: 'rgba(0, 0, 0, 0.26)',
      disabledOpacity: 0.26,
      disabledBackground: 'rgba(0, 0, 0, 0.12)',
      focus: 'rgba(0, 0, 0, 0.12)',
      focusOpacity: 0.12,
      activatedOpacity: 0.12
    }
  },
  
  typography: BUSINESS_TYPOGRAPHY.electronics,
  
  components: {
    ...baseThemeConfig.components,
    
    MuiButton: {
      styleOverrides: {
        ...baseThemeConfig.components.MuiButton.styleOverrides,
        containedPrimary: {
          background: GRADIENTS.electronics.primary,
          '&:hover': {
            background: ELECTRONICS_COLORS.primary.dark,
            transform: 'translateY(-1px)'
          }
        }
      }
    },
    
    MuiChip: {
      styleOverrides: {
        ...baseThemeConfig.components.MuiChip.styleOverrides,
        colorPrimary: {
          backgroundColor: ELECTRONICS_COLORS.primary.light,
          color: ELECTRONICS_COLORS.primary.dark
        }
      }
    },
    
    MuiLinearProgress: {
      styleOverrides: {
        colorPrimary: {
          backgroundColor: ELECTRONICS_COLORS.primary.light
        },
        barColorPrimary: {
          backgroundColor: ELECTRONICS_COLORS.primary.main
        }
      }
    }
  },
  
  // Custom theme extensions
  custom: {
    gradients: GRADIENTS.electronics,
    businessType: USER_TYPES.ELECTRONICS,
    features: {
      warrantyTracking: true,
      serialNumbers: true,
      technicalSupport: true
    }
  }
});

// Furniture Theme
export const FURNITURE_THEME = createTheme({
  ...baseThemeConfig,
  
  palette: {
    mode: 'light',
    ...FURNITURE_COLORS,
    common: {
      black: '#000000',
      white: '#ffffff'
    },
    divider: UI_COLORS.divider,
    action: {
      active: 'rgba(0, 0, 0, 0.54)',
      hover: 'rgba(0, 0, 0, 0.04)',
      hoverOpacity: 0.04,
      selected: 'rgba(0, 0, 0, 0.08)',
      selectedOpacity: 0.08,
      disabled: 'rgba(0, 0, 0, 0.26)',
      disabledOpacity: 0.26,
      disabledBackground: 'rgba(0, 0, 0, 0.12)',
      focus: 'rgba(0, 0, 0, 0.12)',
      focusOpacity: 0.12,
      activatedOpacity: 0.12
    }
  },
  
  typography: BUSINESS_TYPOGRAPHY.furniture,
  
  components: {
    ...baseThemeConfig.components,
    
    MuiButton: {
      styleOverrides: {
        ...baseThemeConfig.components.MuiButton.styleOverrides,
        containedPrimary: {
          background: GRADIENTS.furniture.primary,
          '&:hover': {
            background: FURNITURE_COLORS.primary.dark,
            transform: 'translateY(-1px)'
          }
        }
      }
    },
    
    MuiChip: {
      styleOverrides: {
        ...baseThemeConfig.components.MuiChip.styleOverrides,
        colorPrimary: {
          backgroundColor: FURNITURE_COLORS.primary.light,
          color: FURNITURE_COLORS.primary.dark
        }
      }
    },
    
    MuiLinearProgress: {
      styleOverrides: {
        colorPrimary: {
          backgroundColor: FURNITURE_COLORS.primary.light
        },
        barColorPrimary: {
          backgroundColor: FURNITURE_COLORS.primary.main
        }
      }
    },
    
    // Furniture-specific component styling
    MuiCard: {
      styleOverrides: {
        ...baseThemeConfig.components.MuiCard.styleOverrides,
        root: {
          ...baseThemeConfig.components.MuiCard.styleOverrides.root,
          backgroundColor: FURNITURE_COLORS.background.surface
        }
      }
    }
  },
  
  // Custom theme extensions
  custom: {
    gradients: GRADIENTS.furniture,
    businessType: USER_TYPES.FURNITURE,
    features: {
      materialTracking: true,
      customDesign: true,
      deliveryAssembly: true
    }
  }
});

// Dark Mode Themes (for future implementation)
const createDarkTheme = (baseTheme) => createTheme({
  ...baseTheme,
  palette: {
    ...baseTheme.palette,
    mode: 'dark',
    background: {
      default: '#121212',
      paper: '#1e1e1e'
    },
    text: {
      primary: '#ffffff',
      secondary: 'rgba(255, 255, 255, 0.7)'
    }
  }
});

export const ELECTRONICS_DARK_THEME = createDarkTheme(ELECTRONICS_THEME);
export const FURNITURE_DARK_THEME = createDarkTheme(FURNITURE_THEME);

// Theme Selection Function
export const getThemeByUserType = (userType, isDarkMode = false) => {
  switch (userType) {
    case USER_TYPES.ELECTRONICS:
      return isDarkMode ? ELECTRONICS_DARK_THEME : ELECTRONICS_THEME;
    case USER_TYPES.FURNITURE:
      return isDarkMode ? FURNITURE_DARK_THEME : FURNITURE_THEME;
    default:
      return ELECTRONICS_THEME; // Default fallback
  }
};

// Theme Customization Utilities
export const customizeTheme = (baseTheme, customizations = {}) => {
  return createTheme({
    ...baseTheme,
    palette: {
      ...baseTheme.palette,
      ...customizations.palette
    },
    typography: {
      ...baseTheme.typography,
      ...customizations.typography
    },
    components: {
      ...baseTheme.components,
      ...customizations.components
    }
  });
};

// Responsive Theme Adjustments
export const getResponsiveTheme = (theme, isMobile = false) => {
  return createTheme({
    ...theme,
    components: {
      ...theme.components,
      
      // Mobile-specific adjustments
      ...(isMobile && {
        MuiContainer: {
          styleOverrides: {
            root: {
              paddingLeft: 16,
              paddingRight: 16
            }
          }
        },
        
        MuiCard: {
          styleOverrides: {
            root: {
              ...theme.components?.MuiCard?.styleOverrides?.root,
              margin: '8px 0'
            }
          }
        },
        
        MuiButton: {
          styleOverrides: {
            root: {
              ...theme.components?.MuiButton?.styleOverrides?.root,
              minHeight: 48, // Larger touch targets on mobile
              fontSize: '1rem'
            }
          }
        },
        
        MuiIconButton: {
          styleOverrides: {
            root: {
              padding: 12 // Larger touch targets
            }
          }
        }
      })
    }
  });
};

// Theme Provider Values
export const THEME_CONTEXT_VALUES = {
  [USER_TYPES.ELECTRONICS]: {
    theme: ELECTRONICS_THEME,
    colors: ELECTRONICS_COLORS,
    gradients: GRADIENTS.electronics,
    businessType: USER_TYPES.ELECTRONICS,
    isDark: false
  },
  
  [USER_TYPES.FURNITURE]: {
    theme: FURNITURE_THEME,
    colors: FURNITURE_COLORS,
    gradients: GRADIENTS.furniture,
    businessType: USER_TYPES.FURNITURE,
    isDark: false
  }
};

// Theme Helper Functions
export const getThemeColors = (userType) => {
  switch (userType) {
    case USER_TYPES.ELECTRONICS:
      return ELECTRONICS_COLORS;
    case USER_TYPES.FURNITURE:
      return FURNITURE_COLORS;
    default:
      return ELECTRONICS_COLORS;
  }
};

export const getThemeGradients = (userType) => {
  switch (userType) {
    case USER_TYPES.ELECTRONICS:
      return GRADIENTS.electronics;
    case USER_TYPES.FURNITURE:
      return GRADIENTS.furniture;
    default:
      return GRADIENTS.electronics;
  }
};

// Component Theme Overrides by User Type
export const COMPONENT_THEMES = {
  [USER_TYPES.ELECTRONICS]: {
    MuiAppBar: {
      styleOverrides: {
        root: {
          background: GRADIENTS.electronics.surface,
          backdropFilter: 'blur(8px)'
        }
      }
    },
    
    MuiFab: {
      styleOverrides: {
        primary: {
          background: GRADIENTS.electronics.primary
        }
      }
    },
    
    MuiLinearProgress: {
      styleOverrides: {
        colorPrimary: {
          background: GRADIENTS.electronics.secondary
        }
      }
    }
  },
  
  [USER_TYPES.FURNITURE]: {
    MuiAppBar: {
      styleOverrides: {
        root: {
          background: GRADIENTS.furniture.surface,
          backdropFilter: 'blur(8px)'
        }
      }
    },
    
    MuiFab: {
      styleOverrides: {
        primary: {
          background: GRADIENTS.furniture.primary
        }
      }
    },
    
    MuiLinearProgress: {
      styleOverrides: {
        colorPrimary: {
          background: GRADIENTS.furniture.secondary
        }
      }
    }
  }
};

// Print Theme (business type agnostic)
export const PRINT_THEME = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#000000' },
    secondary: { main: '#666666' },
    background: { default: '#ffffff', paper: '#ffffff' },
    text: { primary: '#000000', secondary: '#333333' }
  },
  
  typography: {
    ...TYPOGRAPHY_SCALE,
    h1: { fontSize: '24pt', fontWeight: 700 },
    h2: { fontSize: '20pt', fontWeight: 600 },
    h3: { fontSize: '18pt', fontWeight: 600 },
    h4: { fontSize: '16pt', fontWeight: 600 },
    h5: { fontSize: '14pt', fontWeight: 500 },
    h6: { fontSize: '12pt', fontWeight: 500 },
    body1: { fontSize: '11pt', lineHeight: 1.4 },
    body2: { fontSize: '10pt', lineHeight: 1.3 },
    caption: { fontSize: '9pt', lineHeight: 1.2 }
  },
  
  components: {
    MuiButton: {
      styleOverrides: {
        root: { display: 'none' }
      }
    },
    MuiFab: {
      styleOverrides: {
        root: { display: 'none' }
      }
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: 'none',
          border: '1px solid #cccccc'
        }
      }
    }
  }
});

// High Contrast Theme
export const createHighContrastTheme = (baseTheme) => createTheme({
  ...baseTheme,
  palette: {
    ...baseTheme.palette,
    primary: { main: '#000000', contrastText: '#ffffff' },
    secondary: { main: '#ffffff', contrastText: '#000000' },
    text: {
      primary: '#000000',
      secondary: '#000000'
    },
    background: {
      default: '#ffffff',
      paper: '#ffffff'
    }
  },
  
  components: {
    ...baseTheme.components,
    MuiButton: {
      styleOverrides: {
        root: {
          border: '2px solid currentColor',
          fontWeight: 700
        }
      }
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            border: '2px solid #000000'
          }
        }
      }
    }
  }
});

// Theme Validation
export const validateTheme = (theme) => {
  const requiredProperties = [
    'palette.primary.main',
    'palette.secondary.main',
    'typography.fontFamily',
    'components'
  ];
  
  for (const prop of requiredProperties) {
    const value = prop.split('.').reduce((obj, key) => obj?.[key], theme);
    if (!value) {
      console.warn(`Missing required theme property: ${prop}`);
      return false;
    }
  }
  
  return true;
};

// Theme Debugging Utilities
export const debugTheme = (theme) => {
  console.group('Theme Debug Information');
  console.log('Palette:', theme.palette);
  console.log('Typography:', theme.typography);
  console.log('Breakpoints:', theme.breakpoints);
  console.log('Spacing:', theme.spacing);
  console.log('Custom Properties:', theme.custom);
  console.groupEnd();
};

// Export theme configurations
export const THEMES = {
  [USER_TYPES.ELECTRONICS]: ELECTRONICS_THEME,
  [USER_TYPES.FURNITURE]: FURNITURE_THEME,
  print: PRINT_THEME
};

// Export all theme-related utilities
export default {
  ELECTRONICS_THEME,
  FURNITURE_THEME,
  ELECTRONICS_DARK_THEME,
  FURNITURE_DARK_THEME,
  PRINT_THEME,
  THEMES,
  THEME_CONTEXT_VALUES,
  COMPONENT_THEMES,
  baseThemeConfig,
  
  // Utility functions
  getThemeByUserType,
  getThemeColors,
  getThemeGradients,
  customizeTheme,
  getResponsiveTheme,
  createHighContrastTheme,
  validateTheme,
  debugTheme
};