import React from 'react';
import {
  Box,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Card,
  CardContent,
  Typography,
  Grid,
  alpha,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Store as StoreIcon,
  Business as BusinessIcon,
  Person as PersonIcon,
  School as SchoolIcon,
  LocalShipping as WholesaleIcon,
  ShoppingCart as RetailIcon
} from '@mui/icons-material';

import { 
  CUSTOMER_TYPES, 
  CUSTOMER_CATEGORIES 
} from '../../utils/constants/appConstants';

/**
 * Customer type and category selector component
 * @param {Object} props
 * @param {string} props.customerType - Selected customer type (wholesaler/retailer)
 * @param {string} props.customerCategory - Selected customer category (individual/firm/school)
 * @param {function} props.onTypeChange - Type change handler
 * @param {function} props.onCategoryChange - Category change handler
 * @param {boolean} props.disabled - Whether selectors are disabled
 * @param {string} props.error - Error message
 * @param {boolean} props.required - Whether selection is required
 * @param {boolean} props.compact - Compact display mode
 */
const CustomerTypeSelector = ({
  customerType = '',
  customerCategory = '',
  onTypeChange,
  onCategoryChange,
  disabled = false,
  error = '',
  required = false,
  compact = false,
  sx = {},
  ...props
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Customer type options
  const customerTypes = [
    {
      value: CUSTOMER_TYPES.WHOLESALER,
      label: 'Wholesaler',
      description: 'Bulk purchases, volume discounts',
      icon: WholesaleIcon,
      color: theme.palette.primary.main
    },
    {
      value: CUSTOMER_TYPES.RETAILER,
      label: 'Retailer',
      description: 'Individual sales, standard pricing',
      icon: RetailIcon,
      color: theme.palette.secondary.main
    }
  ];

  // Customer category options
  const customerCategories = [
    {
      value: CUSTOMER_CATEGORIES.INDIVIDUAL,
      label: 'Individual',
      description: 'Personal customer',
      icon: PersonIcon,
      color: theme.palette.info.main
    },
    {
      value: CUSTOMER_CATEGORIES.FIRM,
      label: 'Business/Firm',
      description: 'Company or business entity',
      icon: BusinessIcon,
      color: theme.palette.success.main
    },
    {
      value: CUSTOMER_CATEGORIES.SCHOOL,
      label: 'School/Institution',
      description: 'Educational institution',
      icon: SchoolIcon,
      color: theme.palette.warning.main
    }
  ];

  // Handle type change
  const handleTypeChange = (event) => {
    if (onTypeChange) {
      onTypeChange(event.target.value);
    }
  };

  // Handle category change
  const handleCategoryChange = (event) => {
    if (onCategoryChange) {
      onCategoryChange(event.target.value);
    }
  };

  // Render option card
  const renderOptionCard = (option, isSelected, onClick, size = 'medium') => {
    const Icon = option.icon;
    
    return (
      <Card
        onClick={!disabled ? onClick : undefined}
        sx={{
          cursor: disabled ? 'default' : 'pointer',
          transition: 'all 0.3s ease',
          backgroundColor: isSelected 
            ? alpha(option.color, 0.1) 
            : 'transparent',
          border: isSelected 
            ? `2px solid ${option.color}` 
            : `1px solid ${theme.palette.divider}`,
          transform: isSelected ? 'translateY(-2px)' : 'none',
          boxShadow: isSelected 
            ? `0 4px 12px ${alpha(option.color, 0.2)}` 
            : 'none',
          opacity: disabled ? 0.6 : 1,
          '&:hover': !disabled ? {
            transform: 'translateY(-1px)',
            boxShadow: `0 2px 8px ${alpha(option.color, 0.15)}`,
            borderColor: alpha(option.color, 0.5)
          } : {}
        }}
      >
        <CardContent
          sx={{
            textAlign: 'center',
            p: compact ? 2 : 3,
            '&:last-child': { pb: compact ? 2 : 3 }
          }}
        >
          <Icon
            sx={{
              fontSize: compact ? 32 : 40,
              color: isSelected ? option.color : theme.palette.text.secondary,
              mb: 1.5,
              transition: 'color 0.3s ease'
            }}
          />
          
          <Typography
            variant={compact ? 'subtitle2' : 'h6'}
            fontWeight={600}
            sx={{
              color: isSelected ? option.color : theme.palette.text.primary,
              mb: 0.5
            }}
          >
            {option.label}
          </Typography>
          
          {!compact && (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ fontSize: '0.875rem', lineHeight: 1.4 }}
            >
              {option.description}
            </Typography>
          )}
          
          {isSelected && (
            <Box
              sx={{
                mt: 1.5,
                p: 0.5,
                borderRadius: 1,
                backgroundColor: alpha(option.color, 0.1),
                display: 'inline-flex',
                alignItems: 'center'
              }}
            >
              <Typography
                variant="caption"
                sx={{
                  color: option.color,
                  fontWeight: 600,
                  fontSize: '0.75rem'
                }}
              >
                ✓ Selected
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <Box sx={{ ...sx }} {...props}>
      {/* Customer Type Selection */}
      <Box sx={{ mb: 4 }}>
        <Typography 
          variant="h6" 
          fontWeight={600}
          gutterBottom
          sx={{ 
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            mb: 2
          }}
        >
          <StoreIcon color="primary" />
          Customer Type
          {required && (
            <Typography component="span" color="error.main">
              *
            </Typography>
          )}
        </Typography>
        
        <Grid container spacing={2}>
          {customerTypes.map((type) => (
            <Grid item xs={12} sm={6} key={type.value}>
              {renderOptionCard(
                type,
                customerType === type.value,
                () => handleTypeChange({ target: { value: type.value } }),
                compact ? 'small' : 'medium'
              )}
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* Customer Category Selection */}
      <Box>
        <Typography 
          variant="h6" 
          fontWeight={600}
          gutterBottom
          sx={{ 
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            mb: 2
          }}
        >
          <BusinessIcon color="primary" />
          Customer Category
          {required && (
            <Typography component="span" color="error.main">
              *
            </Typography>
          )}
        </Typography>
        
        <Grid container spacing={2}>
          {customerCategories.map((category) => (
            <Grid item xs={12} sm={6} md={4} key={category.value}>
              {renderOptionCard(
                category,
                customerCategory === category.value,
                () => handleCategoryChange({ target: { value: category.value } }),
                compact ? 'small' : 'medium'
              )}
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* Error Message */}
      {error && (
        <Typography 
          variant="body2" 
          color="error.main"
          sx={{ mt: 2, textAlign: 'center' }}
        >
          {error}
        </Typography>
      )}

      {/* Help Text */}
      {!compact && (
        <Box 
          sx={{ 
            mt: 3, 
            p: 2, 
            backgroundColor: alpha(theme.palette.info.main, 0.05),
            borderRadius: 2,
            border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`
          }}
        >
          <Typography variant="body2" color="text.secondary" gutterBottom>
            <strong>Customer Type</strong> determines pricing and discount structures:
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ ml: 2, mb: 1 }}>
            • <strong>Wholesaler:</strong> Bulk orders, volume discounts, special pricing
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ ml: 2, mb: 2 }}>
            • <strong>Retailer:</strong> Regular orders, standard pricing
          </Typography>
          
          <Typography variant="body2" color="text.secondary" gutterBottom>
            <strong>Customer Category</strong> affects documentation and communication:
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ ml: 2, mb: 1 }}>
            • <strong>Individual:</strong> Personal purchases, simplified invoicing
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ ml: 2, mb: 1 }}>
            • <strong>Business/Firm:</strong> Corporate purchases, detailed invoicing, GST
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ ml: 2 }}>
            • <strong>School/Institution:</strong> Educational discounts, institutional billing
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default CustomerTypeSelector;