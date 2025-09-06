import { createTheme } from '@mui/material/styles';
import { APP_COLORS, USER_TYPES } from '../../utils/constants/appConstants';

// Base theme configuration
const baseTheme = {
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 600,
      '@media (max-width:600px)': {
        fontSize: '2rem',
      },
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 600,
      '@media (max-width:600px)': {
        fontSize: '1.75rem',
      },
    },
    h3: {
      fontSize: '1.75rem',
      fontWeight: 500,
      '@media (max-width:600px)': {
        fontSize: '1.5rem',
      },
    },
    h4: {
      fontSize: '1.5rem',
      fontWeight: 500,
      '@media (max-width:600px)': {
        fontSize: '1.25rem',
      },
    },
    h5: {
      fontSize: '1.25rem',
      fontWeight: 500,
      '@media (max-width:600px)': {
        fontSize: '1.125rem',
      },
    },
    h6: {
      fontSize: '1rem',
      fontWeight: 500,
    },
  },
  breakpoints: {
    values: {
      xs: 0,
      sm: 600,
      md: 960,
      lg: 1280,
      xl: 1920,
    },
  },
  shape: {
    borderRadius: 8,
  },
  spacing: 8,
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: '0px 2px 4px -1px rgba(0,0,0,0.2)',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          borderRight: 'none',
          boxShadow: '2px 0px 4px rgba(0,0,0,0.1)',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0px 2px 8px rgba(0,0,0,0.1)',
          borderRadius: '12px',
          transition: 'box-shadow 0.3s ease-in-out',
          '&:hover': {
            boxShadow: '0px 4px 16px rgba(0,0,0,0.15)',
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 500,
          borderRadius: '8px',
          padding: '8px 16px',
          '&.MuiButton-contained': {
            boxShadow: '0px 2px 4px rgba(0,0,0,0.2)',
            '&:hover': {
              boxShadow: '0px 4px 8px rgba(0,0,0,0.3)',
            },
          },
        },
        sizeLarge: {
          padding: '12px 24px',
          fontSize: '1rem',
        },
        sizeSmall: {
          padding: '4px 12px',
          fontSize: '0.875rem',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: '8px',
          },
        },
      },
    },
    MuiDataGrid: {
      styleOverrides: {
        root: {
          borderRadius: '12px',
          border: 'none',
          '& .MuiDataGrid-cell': {
            borderColor: 'rgba(0,0,0,0.05)',
          },
          '& .MuiDataGrid-columnHeaders': {
            backgroundColor: 'rgba(0,0,0,0.02)',
            borderBottom: '2px solid rgba(0,0,0,0.1)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },
    MuiContainer: {
      styleOverrides: {
        root: {
          paddingLeft: '16px',
          paddingRight: '16px',
          '@media (max-width:600px)': {
            paddingLeft: '8px',
            paddingRight: '8px',
          },
        },
      },
    },
  },
};

// Electronics theme
const electronicsTheme = createTheme({
  ...baseTheme,
  palette: {
    mode: 'light',
    primary: {
      main: APP_COLORS.ELECTRONICS.primary,
      light: '#42a5f5',
      dark: '#1565c0',
      contrastText: '#ffffff',
    },
    secondary: {
      main: APP_COLORS.ELECTRONICS.secondary,
      light: '#ff5983',
      dark: '#b0003a',
      contrastText: '#ffffff',
    },
    background: {
      default: '#f5f5f5',
      paper: '#ffffff',
    },
    text: {
      primary: 'rgba(0, 0, 0, 0.87)',
      secondary: 'rgba(0, 0, 0, 0.6)',
    },
    divider: 'rgba(0, 0, 0, 0.12)',
    success: {
      main: '#4caf50',
      light: '#81c784',
      dark: '#388e3c',
    },
    warning: {
      main: '#ff9800',
      light: '#ffb74d',
      dark: '#f57c00',
    },
    error: {
      main: '#f44336',
      light: '#e57373',
      dark: '#d32f2f',
    },
    info: {
      main: '#2196f3',
      light: '#64b5f6',
      dark: '#1976d2',
    },
  },
});

// Furniture theme
const furnitureTheme = createTheme({
  ...baseTheme,
  palette: {
    mode: 'light',
    primary: {
      main: APP_COLORS.FURNITURE.primary,
      light: '#a1765a',
      dark: '#5d2e00',
      contrastText: '#ffffff',
    },
    secondary: {
      main: APP_COLORS.FURNITURE.secondary,
      light: '#ff9f40',
      dark: '#c63f00',
      contrastText: '#ffffff',
    },
    background: {
      default: '#f9f7f4',
      paper: '#ffffff',
    },
    text: {
      primary: 'rgba(0, 0, 0, 0.87)',
      secondary: 'rgba(0, 0, 0, 0.6)',
    },
    divider: 'rgba(0, 0, 0, 0.12)',
    success: {
      main: '#4caf50',
      light: '#81c784',
      dark: '#388e3c',
    },
    warning: {
      main: '#ff9800',
      light: '#ffb74d',
      dark: '#f57c00',
    },
    error: {
      main: '#f44336',
      light: '#e57373',
      dark: '#d32f2f',
    },
    info: {
      main: '#2196f3',
      light: '#64b5f6',
      dark: '#1976d2',
    },
  },
});

// Theme factory function
export const createAppTheme = (userType) => {
  switch (userType) {
    case USER_TYPES.ELECTRONICS:
      return electronicsTheme;
    case USER_TYPES.FURNITURE:
      return furnitureTheme;
    default:
      return electronicsTheme;
  }
};

// Default theme (electronics)
export default electronicsTheme;

// Responsive helper functions
export const getResponsiveSpacing = (theme) => ({
  xs: theme.spacing(1),
  sm: theme.spacing(2),
  md: theme.spacing(3),
  lg: theme.spacing(4),
  xl: theme.spacing(5),
});

export const getResponsiveFontSize = (theme) => ({
  xs: '0.75rem',
  sm: '0.875rem',
  md: '1rem',
  lg: '1.125rem',
  xl: '1.25rem',
});

// Common responsive breakpoints
export const breakpoints = {
  mobile: '@media (max-width:599px)',
  tablet: '@media (min-width:600px) and (max-width:959px)',
  desktop: '@media (min-width:960px)',
  largeDesktop: '@media (min-width:1280px)',
};