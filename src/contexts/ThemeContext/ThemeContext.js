import React, { createContext, useContext, useState, useEffect } from 'react';
import { createTheme, ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { useUserType } from '../UserTypeContext/UserTypeContext';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [darkMode, setDarkMode] = useState(false);
  const { getThemeColors, userType } = useUserType();
  
  const themeColors = getThemeColors();

  const theme = createTheme({
    palette: {
      mode: darkMode ? 'dark' : 'light',
      primary: {
        main: themeColors.primary,
        light: themeColors.primaryLight,
        dark: themeColors.primaryDark,
      },
      secondary: {
        main: themeColors.secondary,
        light: themeColors.secondaryLight,
        dark: themeColors.secondaryDark,
      },
      background: {
        default: darkMode ? '#121212' : '#f5f5f5',
        paper: darkMode ? '#1e1e1e' : '#ffffff',
      },
    },
    breakpoints: {
      values: {
        xs: 0,
        sm: 600,
        md: 900,
        lg: 1200,
        xl: 1536,
      },
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            borderRadius: '8px',
            fontWeight: 600,
            '@media (max-width: 600px)': {
              minWidth: 'unset',
              padding: '8px 16px',
            },
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: '12px',
            boxShadow: '0 2px 12px rgba(0,0,0,0.1)',
            '@media (max-width: 600px)': {
              margin: '8px',
              borderRadius: '8px',
            },
          },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              borderRadius: '8px',
            },
            '@media (max-width: 600px)': {
              '& .MuiInputLabel-root': {
                fontSize: '0.875rem',
              },
            },
          },
        },
      },
      MuiContainer: {
        styleOverrides: {
          root: {
            '@media (max-width: 600px)': {
              paddingLeft: '16px',
              paddingRight: '16px',
            },
          },
        },
      },
      MuiTableCell: {
        styleOverrides: {
          root: {
            '@media (max-width: 600px)': {
              padding: '8px 4px',
              fontSize: '0.75rem',
            },
          },
        },
      },
    },
    typography: {
      fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
      h1: {
        fontWeight: 700,
        fontSize: '2.5rem',
        '@media (max-width:600px)': {
          fontSize: '2rem',
        },
      },
      h2: {
        fontWeight: 600,
        fontSize: '2rem',
        '@media (max-width:600px)': {
          fontSize: '1.75rem',
        },
      },
      h3: {
        fontWeight: 600,
        fontSize: '1.75rem',
        '@media (max-width:600px)': {
          fontSize: '1.5rem',
        },
      },
      h4: {
        fontWeight: 600,
        fontSize: '1.5rem',
        '@media (max-width:600px)': {
          fontSize: '1.25rem',
        },
      },
      h5: {
        fontWeight: 600,
        fontSize: '1.25rem',
        '@media (max-width:600px)': {
          fontSize: '1.125rem',
        },
      },
      h6: {
        fontWeight: 600,
        fontSize: '1rem',
        '@media (max-width:600px)': {
          fontSize: '0.875rem',
        },
      },
      body1: {
        fontSize: '1rem',
        lineHeight: 1.6,
        '@media (max-width:600px)': {
          fontSize: '0.875rem',
        },
      },
      body2: {
        fontSize: '0.875rem',
        lineHeight: 1.5,
        '@media (max-width:600px)': {
          fontSize: '0.75rem',
        },
      },
    },
  });

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    localStorage.setItem('darkMode', !darkMode);
  };

  useEffect(() => {
    const savedDarkMode = localStorage.getItem('darkMode') === 'true';
    setDarkMode(savedDarkMode);
  }, []);

  const value = {
    darkMode,
    toggleDarkMode,
    theme,
    userType,
    themeColors,
  };

  return (
    <ThemeContext.Provider value={value}>
      <MuiThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
};