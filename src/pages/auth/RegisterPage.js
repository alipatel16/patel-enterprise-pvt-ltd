import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Alert,
  IconButton,
  InputAdornment,
  Divider,
  useTheme,
  useMediaQuery,
  Stepper,
  Step,
  StepLabel,
  Chip
} from '@mui/material';
import {
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  PersonAdd as PersonAddIcon,
  Login as LoginIcon,
  ArrowBack as ArrowBackIcon,
  ArrowForward as ArrowForwardIcon,
  Business as BusinessIcon,
  Person as PersonIcon
} from '@mui/icons-material';

// Import your AuthContext
import { useAuth } from '../../contexts/AuthContext/AuthContext'; // Adjust path as needed
import { USER_ROLES, USER_TYPES } from '../../utils/constants/appConstants'; // Adjust path as needed

// Mock user type selector for demo
const UserTypeSelector = ({ selectedType, onTypeChange, sx, ...props }) => {
  const userTypes = [
    {
      type: USER_TYPES.ELECTRONICS, // Use your constants
      label: 'Electronics Store',
      description: 'Manage electronics inventory and sales',
      icon: BusinessIcon,
      color: '#1976d2'
    },
    {
      type: USER_TYPES.FURNITURE, // Use your constants
      label: 'Furniture Store',
      description: 'Manage furniture inventory and sales',
      icon: PersonIcon,
      color: '#8b4513'
    }
  ];

  return (
    <Box sx={{ ...sx }} {...props}>
      <Typography variant="h6" textAlign="center" mb={2} color="text.primary" fontWeight={500}>
        Select Your Business Type
      </Typography>
      
      <Box display="flex" flexDirection="column" gap={2}>
        {userTypes.map((type) => {
          const Icon = type.icon;
          const isSelected = selectedType === type.type;
          
          return (
            <Paper
              key={type.type}
              onClick={() => onTypeChange(type.type)}
              sx={{
                cursor: 'pointer',
                p: 2,
                transition: 'all 0.3s ease',
                background: isSelected ? `${type.color}15` : 'transparent',
                border: isSelected ? `2px solid ${type.color}` : '1px solid #e0e0e0',
                transform: isSelected ? 'translateY(-2px)' : 'none',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: 2
                }
              }}
            >
              <Box display="flex" alignItems="center" gap={2}>
                <Box
                  sx={{
                    p: 1,
                    borderRadius: 2,
                    backgroundColor: `${type.color}20`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Icon sx={{ color: type.color, fontSize: 24 }} />
                </Box>
                <Box>
                  <Typography variant="subtitle1" fontWeight={600} color={type.color}>
                    {type.label}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {type.description}
                  </Typography>
                </Box>
              </Box>
            </Paper>
          );
        })}
      </Box>
    </Box>
  );
};

const RegisterPage = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  // Use your AuthContext
  const { signUp, loading: authLoading, error: authError, clearError } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: USER_ROLES.EMPLOYEE, // Use your constants
    userType: USER_TYPES.ELECTRONICS // Default user type
  });
  
  const [formErrors, setFormErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [registerError, setRegisterError] = useState(null);

  const steps = ['Business Type', 'Account Details', 'Review & Create'];

  // Handle input change
  const handleChange = (field) => (event) => {
    const value = event.target.value;
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear field error when user starts typing
    if (formErrors[field]) {
      setFormErrors(prev => ({
        ...prev,
        [field]: null
      }));
    }
    
    // Clear register error
    if (registerError) {
      setRegisterError(null);
    }

    // Clear auth error
    if (authError) {
      clearError();
    }
  };

  // Handle user type change
  const handleUserTypeChange = (userType) => {
    setFormData(prev => ({
      ...prev,
      userType
    }));
  };

  // Validate current step
  const validateStep = (step) => {
    const errors = {};
    
    switch (step) {
      case 0: // Business Type
        if (!formData.userType) {
          errors.userType = 'Please select a business type';
        }
        break;
      
      case 1: // Account Details
        if (!formData.name.trim()) {
          errors.name = 'This field is required';
        } else if (formData.name.length < 2) {
          errors.name = 'Minimum 2 characters required';
        }
        
        if (!formData.email.trim()) {
          errors.email = 'This field is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
          errors.email = 'Please enter a valid email address';
        }
        
        if (!formData.phone.trim()) {
          errors.phone = 'This field is required';
        } else if (!/^[0-9]{10}$/.test(formData.phone.replace(/\D/g, ''))) {
          errors.phone = 'Please enter a valid 10-digit phone number';
        }
        
        if (!formData.password.trim()) {
          errors.password = 'This field is required';
        } else if (formData.password.length < 6) {
          errors.password = 'Minimum 6 characters required';
        }
        
        if (!formData.confirmPassword.trim()) {
          errors.confirmPassword = 'This field is required';
        } else if (formData.password !== formData.confirmPassword) {
          errors.confirmPassword = 'Passwords do not match';
        }
        break;
      
      case 2: // Review
        // All validations from previous steps
        break;
        
      default:
        break;
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle next step
  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => prev + 1);
    }
  };

  // Handle previous step
  const handlePrevious = () => {
    setCurrentStep(prev => prev - 1);
  };

  // Handle form submission - UPDATED WITH FIREBASE INTEGRATION
  const handleSubmit = async (event) => {
    event.preventDefault();
    
    if (!validateStep(currentStep)) {
      return;
    }
    
    try {
      setLoading(true);
      setRegisterError(null);
      
      // Clear any previous auth errors
      if (authError) {
        clearError();
      }
      
      // Prepare user data for Firebase
      const userData = {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.replace(/\D/g, ''), // Remove non-digits
        password: formData.password,
        role: formData.role,
        userType: formData.userType
      };
      
      // Call your AuthContext signUp method
      await signUp(userData);
      
      // Show success message
      alert('Account created successfully as Employee!');
      
      // Navigate to login or dashboard
      navigate('/login');
      
    } catch (error) {
      console.error('Registration error:', error);
      setRegisterError(error.message || 'Failed to create account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle login navigation
  const handleLoginClick = () => {
    navigate('/login');
  };

  // Toggle password visibility
  const handleTogglePassword = () => {
    setShowPassword(prev => !prev);
  };

  const handleToggleConfirmPassword = () => {
    setShowConfirmPassword(prev => !prev);
  };

  // Get user type label for display
  const getUserTypeLabel = (userType) => {
    const userTypes = {
      [USER_TYPES.ELECTRONICS]: 'Electronics Store',
      [USER_TYPES.FURNITURE]: 'Furniture Store'
    };
    return userTypes[userType] || userType;
  };

  // Render step content
  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <UserTypeSelector 
            selectedType={formData.userType}
            onTypeChange={handleUserTypeChange}
          />
        );
      
      case 1:
        return (
          <Box>
            {/* Name Field */}
            <TextField
              fullWidth
              label="Full Name"
              value={formData.name}
              onChange={handleChange('name')}
              error={!!formErrors.name}
              helperText={formErrors.name}
              disabled={loading || authLoading}
              sx={{ mb: 2 }}
              autoComplete="name"
            />

            {/* Email Field */}
            <TextField
              fullWidth
              label="Email Address"
              type="email"
              value={formData.email}
              onChange={handleChange('email')}
              error={!!formErrors.email}
              helperText={formErrors.email}
              disabled={loading || authLoading}
              sx={{ mb: 2 }}
              autoComplete="email"
            />

            {/* Phone Field */}
            <TextField
              fullWidth
              label="Phone Number"
              value={formData.phone}
              onChange={handleChange('phone')}
              error={!!formErrors.phone}
              helperText={formErrors.phone}
              disabled={loading || authLoading}
              sx={{ mb: 2 }}
              autoComplete="tel"
              placeholder="10-digit phone number"
            />

            {/* Role Display (Read-only) */}
            <Alert severity="info" sx={{ mb: 2 }}>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Typography variant="body2">
                  You are registering as an <strong>Employee</strong>
                </Typography>
                <Chip 
                  label="Employee" 
                  color="primary" 
                  size="small"
                  sx={{ fontWeight: 600 }}
                />
              </Box>
            </Alert>

            {/* Password Field */}
            <TextField
              fullWidth
              label="Password"
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={handleChange('password')}
              error={!!formErrors.password}
              helperText={formErrors.password || 'Minimum 6 characters'}
              disabled={loading || authLoading}
              sx={{ mb: 2 }}
              autoComplete="new-password"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={handleTogglePassword}
                      onMouseDown={(e) => e.preventDefault()}
                      disabled={loading || authLoading}
                      size="small"
                    >
                      {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />

            {/* Confirm Password Field */}
            <TextField
              fullWidth
              label="Confirm Password"
              type={showConfirmPassword ? 'text' : 'password'}
              value={formData.confirmPassword}
              onChange={handleChange('confirmPassword')}
              error={!!formErrors.confirmPassword}
              helperText={formErrors.confirmPassword}
              disabled={loading || authLoading}
              sx={{ mb: 2 }}
              autoComplete="new-password"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={handleToggleConfirmPassword}
                      onMouseDown={(e) => e.preventDefault()}
                      disabled={loading || authLoading}
                      size="small"
                    >
                      {showConfirmPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />
          </Box>
        );
      
      case 2:
        return (
          <Box>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
              Review Your Information
            </Typography>
            
            <Box sx={{ backgroundColor: '#f9f9f9', p: 3, borderRadius: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="body2" color="text.secondary">Name:</Typography>
                <Typography variant="body2" fontWeight={500}>{formData.name}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="body2" color="text.secondary">Email:</Typography>
                <Typography variant="body2" fontWeight={500}>{formData.email}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="body2" color="text.secondary">Phone:</Typography>
                <Typography variant="body2" fontWeight={500}>{formData.phone}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="body2" color="text.secondary">Business Type:</Typography>
                <Chip label={getUserTypeLabel(formData.userType)} size="small" color="primary" />
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary">Role:</Typography>
                <Chip label="Employee" size="small" color="success" />
              </Box>
            </Box>

            <Alert severity="info" sx={{ mt: 3 }}>
              <Typography variant="body2">
                Your account will be created as an <strong>Employee</strong>. 
                An administrator can upgrade your permissions if needed.
              </Typography>
            </Alert>
          </Box>
        );
      
      default:
        return null;
    }
  };

  // Combine loading states
  const isLoading = loading || authLoading;
  
  // Combine error states
  const displayError = registerError || authError;

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        py: 2
      }}
    >
      <Container maxWidth="sm">
        <Paper
          elevation={10}
          sx={{
            p: { xs: 3, sm: 4 },
            borderRadius: 3,
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)'
          }}
        >
          {/* Header */}
          <Box textAlign="center" mb={3}>
            <PersonAddIcon 
              sx={{ 
                fontSize: 48, 
                color: theme.palette.primary.main,
                mb: 1
              }} 
            />
            <Typography 
              variant="h4" 
              fontWeight="bold" 
              color="primary.main"
              sx={{ fontSize: { xs: '1.75rem', sm: '2rem' } }}
            >
              Create Account
            </Typography>
            <Typography 
              variant="body1" 
              color="text.secondary"
              sx={{ mt: 1 }}
            >
              Join as an Employee to start managing your showroom
            </Typography>
          </Box>

          {/* Employee Role Notice */}
          <Alert severity="info" sx={{ mb: 3 }}>
            <Typography variant="body2">
              <strong>Employee Registration:</strong> You are creating an employee account. 
              Contact your administrator if you need admin privileges.
            </Typography>
          </Alert>

          {/* Steps */}
          <Stepper 
            activeStep={currentStep} 
            sx={{ mb: 4 }}
            orientation={isMobile ? 'vertical' : 'horizontal'}
          >
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          {/* Form */}
          <Box component="form" onSubmit={handleSubmit}>
            {/* Global Error */}
            {displayError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {displayError}
              </Alert>
            )}

            {/* Step Content */}
            {renderStepContent(currentStep)}

            {/* Navigation Buttons */}
            <Box 
              sx={{ 
                display: 'flex', 
                flexDirection: { xs: 'column', sm: 'row' },
                gap: 2,
                mt: 4 
              }}
            >
              {currentStep > 0 && (
                <Button
                  variant="outlined"
                  onClick={handlePrevious}
                  disabled={isLoading}
                  startIcon={<ArrowBackIcon />}
                  sx={{ 
                    order: { xs: 2, sm: 1 },
                    flex: { sm: '0 0 auto' }
                  }}
                >
                  Previous
                </Button>
              )}
              
              <Box sx={{ flex: 1, order: { xs: 1, sm: 2 } }} />
              
              {currentStep < steps.length - 1 ? (
                <Button
                  variant="contained"
                  onClick={handleNext}
                  disabled={isLoading}
                  endIcon={<ArrowForwardIcon />}
                  sx={{ order: { xs: 1, sm: 3 } }}
                >
                  Next
                </Button>
              ) : (
                <Button
                  type="submit"
                  variant="contained"
                  disabled={isLoading}
                  sx={{ 
                    order: { xs: 1, sm: 3 },
                    background: 'linear-gradient(135deg, #4caf50 0%, #45a049 100%)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #45a049 0%, #3d8b40 100%)',
                    }
                  }}
                >
                  {isLoading ? 'Creating Account...' : 'Create Employee Account'}
                </Button>
              )}
            </Box>

            {/* Login Link */}
            <Divider sx={{ my: 3 }}>
              <Typography variant="body2" color="text.secondary">
                or
              </Typography>
            </Divider>

            <Button
              fullWidth
              variant="outlined"
              onClick={handleLoginClick}
              disabled={isLoading}
              startIcon={<LoginIcon />}
              sx={{
                py: 1.5,
                borderRadius: 2,
                textTransform: 'none',
                fontSize: '1rem',
                fontWeight: 600
              }}
            >
              Already have an account? Sign In
            </Button>
          </Box>

          {/* Footer */}
          <Box textAlign="center" mt={3}>
            <Typography variant="body2" color="text.secondary">
              By creating an account, you agree to our Terms of Service and Privacy Policy
            </Typography>
          </Box>
        </Paper>

        {/* App Info */}
        <Box mt={3} textAlign="center">
          <Typography 
            variant="body2" 
            sx={{ 
              color: 'rgba(255, 255, 255, 0.8)',
              fontSize: { xs: '0.75rem', sm: '0.875rem' }
            }}
          >
            Showroom Management System v1.0
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default RegisterPage;