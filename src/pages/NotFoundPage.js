import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Button,
  Paper,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Home as HomeIcon,
  ArrowBack as ArrowBackIcon,
  ErrorOutline as ErrorIcon
} from '@mui/icons-material';

const NotFoundPage = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const handleGoHome = () => {
    navigate('/dashboard');
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        p: { xs: 2, sm: 3 }
      }}
    >
      <Container maxWidth="sm">
        <Paper
          elevation={10}
          sx={{
            p: { xs: 3, sm: 4, md: 5 },
            borderRadius: 3,
            textAlign: 'center',
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
          }}
        >
          {/* Error Icon */}
          <Box
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: { xs: 80, sm: 100 },
              height: { xs: 80, sm: 100 },
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)',
              mb: 3,
              color: 'white'
            }}
          >
            <ErrorIcon sx={{ fontSize: { xs: 40, sm: 50 } }} />
          </Box>

          {/* 404 Text */}
          <Typography 
            variant="h1" 
            component="h1" 
            sx={{
              fontSize: { xs: '4rem', sm: '6rem', md: '8rem' },
              fontWeight: 900,
              color: 'transparent',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              mb: 2,
              lineHeight: 0.8
            }}
          >
            404
          </Typography>

          {/* Page Not Found */}
          <Typography 
            variant="h4" 
            component="h2" 
            gutterBottom
            sx={{
              fontWeight: 700,
              color: 'text.primary',
              fontSize: { xs: '1.5rem', sm: '2rem', md: '2.125rem' },
              mb: 2
            }}
          >
            Page Not Found
          </Typography>

          {/* Description */}
          <Typography 
            variant="body1" 
            color="text.secondary"
            sx={{ 
              fontSize: { xs: '0.875rem', sm: '1rem' },
              mb: 4,
              maxWidth: '400px',
              mx: 'auto'
            }}
          >
            The page you're looking for doesn't exist or has been moved. 
            Don't worry, let's get you back on track!
          </Typography>

          {/* Action Buttons */}
          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              gap: 2,
              justifyContent: 'center',
              alignItems: 'center'
            }}
          >
            <Button
              variant="contained"
              size="large"
              startIcon={<HomeIcon />}
              onClick={handleGoHome}
              sx={{
                px: 3,
                py: 1.5,
                borderRadius: 2,
                fontSize: { xs: '0.875rem', sm: '1rem' },
                fontWeight: 600,
                textTransform: 'none',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%)',
                },
                minWidth: { xs: '100%', sm: 'auto' }
              }}
            >
              Go to Dashboard
            </Button>

            <Button
              variant="outlined"
              size="large"
              startIcon={<ArrowBackIcon />}
              onClick={handleGoBack}
              sx={{
                px: 3,
                py: 1.5,
                borderRadius: 2,
                fontSize: { xs: '0.875rem', sm: '1rem' },
                fontWeight: 600,
                textTransform: 'none',
                borderColor: 'primary.main',
                color: 'primary.main',
                '&:hover': {
                  backgroundColor: 'primary.main',
                  color: 'white'
                },
                minWidth: { xs: '100%', sm: 'auto' }
              }}
            >
              Go Back
            </Button>
          </Box>

          {/* Help Text */}
          <Box mt={4} pt={3} borderTop="1px solid" borderColor="divider">
            <Typography 
              variant="body2" 
              color="text.secondary"
              sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
            >
              Need help? Contact your administrator or check the navigation menu.
            </Typography>
          </Box>
        </Paper>

        {/* Additional Info */}
        <Box mt={3} textAlign="center">
          <Typography 
            variant="body2" 
            sx={{ 
              color: 'rgba(255, 255, 255, 0.8)',
              fontSize: { xs: '0.75rem', sm: '0.875rem' }
            }}
          >
            Showroom Management System
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default NotFoundPage;