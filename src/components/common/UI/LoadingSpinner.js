import React from 'react';
import { 
  Box, 
  CircularProgress, 
  Typography, 
  Backdrop,
  useTheme
} from '@mui/material';

/**
 * LoadingSpinner component for displaying loading states
 * @param {Object} props
 * @param {string} props.message - Loading message to display
 * @param {boolean} props.overlay - Whether to show as overlay
 * @param {string} props.size - Size of the spinner ('small', 'medium', 'large')
 * @param {boolean} props.fullScreen - Whether to cover full screen
 * @param {string} props.color - Color of the spinner
 * @returns {React.ReactElement}
 */
const LoadingSpinner = ({ 
  message = 'Loading...', 
  overlay = false, 
  size = 'medium',
  fullScreen = true,
  color = 'primary'
}) => {
  const theme = useTheme();

  // Size mapping
  const sizeMap = {
    small: 24,
    medium: 40,
    large: 60
  };

  // Loading content
  const LoadingContent = () => (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      gap={2}
      p={3}
      sx={{
        minHeight: fullScreen ? '100vh' : '200px',
        width: '100%'
      }}
    >
      <CircularProgress 
        color={color}
        size={sizeMap[size]}
        thickness={4}
      />
      {message && (
        <Typography 
          variant="body2" 
          color="text.secondary"
          align="center"
          sx={{
            fontSize: {
              xs: '0.875rem',
              sm: '1rem'
            },
            maxWidth: '300px'
          }}
        >
          {message}
        </Typography>
      )}
    </Box>
  );

  // Return overlay version if requested
  if (overlay) {
    return (
      <Backdrop
        open={true}
        sx={{
          color: '#fff',
          zIndex: theme.zIndex.drawer + 1,
          backgroundColor: 'rgba(0, 0, 0, 0.5)'
        }}
      >
        <Box
          display="flex"
          flexDirection="column"
          alignItems="center"
          gap={2}
        >
          <CircularProgress 
            color="inherit"
            size={sizeMap[size]}
            thickness={4}
          />
          {message && (
            <Typography 
              variant="body1" 
              color="inherit"
              align="center"
            >
              {message}
            </Typography>
          )}
        </Box>
      </Backdrop>
    );
  }

  // Return standard loading component
  return <LoadingContent />;
};

// Preset loading components for common use cases
export const FullScreenLoader = ({ message }) => (
  <LoadingSpinner 
    message={message} 
    fullScreen={true} 
    size="large" 
  />
);

export const OverlayLoader = ({ message }) => (
  <LoadingSpinner 
    message={message} 
    overlay={true} 
    size="medium" 
  />
);

export const InlineLoader = ({ message, size = 'small' }) => (
  <LoadingSpinner 
    message={message} 
    fullScreen={false} 
    size={size} 
  />
);

export const PageLoader = ({ message = 'Loading page...' }) => (
  <Box
    display="flex"
    justifyContent="center"
    alignItems="center"
    minHeight="400px"
    width="100%"
  >
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      gap={2}
    >
      <CircularProgress size={40} />
      <Typography variant="body2" color="text.secondary">
        {message}
      </Typography>
    </Box>
  </Box>
);

export const ButtonLoader = ({ size = 20 }) => (
  <CircularProgress 
    size={size} 
    color="inherit"
    sx={{ mr: 1 }}
  />
);

export default LoadingSpinner;