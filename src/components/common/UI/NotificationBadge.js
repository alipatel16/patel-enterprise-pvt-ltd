import React from 'react';
import {
  Badge,
  Avatar,
  Box,
  Typography,
  alpha,
  useTheme
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  NotificationImportant as ImportantIcon,
  Circle as DotIcon,
  FiberManualRecord as SmallDotIcon
} from '@mui/icons-material';

/**
 * Enhanced notification badge component
 * @param {Object} props
 * @param {number} props.count - Notification count
 * @param {React.ReactNode} props.children - Child component to wrap
 * @param {string} props.variant - Badge variant (standard, important, dot, text)
 * @param {string} props.color - Badge color
 * @param {string} props.size - Badge size (small, medium, large)
 * @param {boolean} props.invisible - Hide badge when count is 0
 * @param {number} props.max - Maximum count to display
 * @param {string} props.position - Badge position
 * @param {boolean} props.showZero - Show badge when count is 0
 * @param {function} props.onClick - Click handler
 * @param {object} props.sx - Additional styling
 */
const NotificationBadge = ({
  count = 0,
  children,
  variant = 'standard',
  color = 'error',
  size = 'medium',
  invisible = false,
  max = 99,
  position = 'top-right',
  showZero = false,
  onClick,
  sx = {},
  ...props
}) => {
  const theme = useTheme();

  // Determine if badge should be visible
  const shouldShowBadge = !invisible && (count > 0 || showZero);

  // Get badge content based on variant
  const getBadgeContent = () => {
    if (variant === 'dot') {
      return ' '; // Empty space for dot variant
    }
    
    if (variant === 'text') {
      return count > max ? `${max}+` : count.toString();
    }
    
    return count > max ? `${max}+` : count;
  };

  // Get badge size configuration
  const getSizeConfig = () => {
    const configs = {
      small: {
        fontSize: '0.625rem',
        minWidth: 16,
        height: 16,
        padding: '0 4px'
      },
      medium: {
        fontSize: '0.75rem',
        minWidth: 20,
        height: 20,
        padding: '0 6px'
      },
      large: {
        fontSize: '0.875rem',
        minWidth: 24,
        height: 24,
        padding: '0 8px'
      }
    };

    return configs[size] || configs.medium;
  };

  const sizeConfig = getSizeConfig();

  // Get position configuration
  const getPositionConfig = () => {
    const configs = {
      'top-right': {
        vertical: 'top',
        horizontal: 'right'
      },
      'top-left': {
        vertical: 'top',
        horizontal: 'left'
      },
      'bottom-right': {
        vertical: 'bottom',
        horizontal: 'right'
      },
      'bottom-left': {
        vertical: 'bottom',
        horizontal: 'left'
      }
    };

    return configs[position] || configs['top-right'];
  };

  const positionConfig = getPositionConfig();

  // Enhanced badge styles based on variant
  const getBadgeStyles = () => {
    const baseStyles = {
      fontWeight: 600,
      fontSize: sizeConfig.fontSize,
      minWidth: sizeConfig.minWidth,
      height: sizeConfig.height,
      padding: sizeConfig.padding,
      borderRadius: variant === 'dot' ? '50%' : 10,
      border: `1px solid ${theme.palette.background.paper}`,
      boxShadow: theme.shadows[2]
    };

    switch (variant) {
      case 'important':
        return {
          ...baseStyles,
          background: `linear-gradient(45deg, ${theme.palette.error.main}, ${theme.palette.error.dark})`,
          animation: 'pulse 2s infinite',
          '@keyframes pulse': {
            '0%': {
              boxShadow: `0 0 0 0 ${alpha(theme.palette.error.main, 0.7)}`
            },
            '70%': {
              boxShadow: `0 0 0 10px ${alpha(theme.palette.error.main, 0)}`
            },
            '100%': {
              boxShadow: `0 0 0 0 ${alpha(theme.palette.error.main, 0)}`
            }
          }
        };
      
      case 'dot':
        return {
          ...baseStyles,
          minWidth: 8,
          height: 8,
          padding: 0
        };
      
      default:
        return baseStyles;
    }
  };

  if (variant === 'standalone') {
    // Standalone notification indicator
    return (
      <Box
        onClick={onClick}
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 1,
          cursor: onClick ? 'pointer' : 'default',
          p: 1,
          borderRadius: 1,
          '&:hover': onClick ? {
            backgroundColor: alpha(theme.palette.primary.main, 0.04)
          } : {},
          ...sx
        }}
        {...props}
      >
        <NotificationsIcon 
          color={count > 0 ? 'primary' : 'disabled'}
          fontSize={size}
        />
        {count > 0 && (
          <Typography
            variant="caption"
            sx={{
              backgroundColor: theme.palette.error.main,
              color: theme.palette.error.contrastText,
              borderRadius: '12px',
              px: 1,
              py: 0.25,
              fontSize: sizeConfig.fontSize,
              fontWeight: 600,
              minWidth: sizeConfig.minWidth,
              textAlign: 'center',
              lineHeight: 1
            }}
          >
            {getBadgeContent()}
          </Typography>
        )}
      </Box>
    );
  }

  if (variant === 'avatar') {
    // Avatar with notification badge
    return (
      <Box sx={{ position: 'relative', ...sx }}>
        {children}
        {shouldShowBadge && (
          <Avatar
            sx={{
              width: sizeConfig.height + 4,
              height: sizeConfig.height + 4,
              fontSize: sizeConfig.fontSize,
              backgroundColor: theme.palette[color]?.main || theme.palette.error.main,
              position: 'absolute',
              top: -4,
              right: -4,
              border: `2px solid ${theme.palette.background.paper}`,
              fontWeight: 600
            }}
          >
            {getBadgeContent()}
          </Avatar>
        )}
      </Box>
    );
  }

  // Standard MUI Badge with enhancements
  return (
    <Badge
      badgeContent={getBadgeContent()}
      color={color}
      invisible={!shouldShowBadge}
      max={max}
      anchorOrigin={positionConfig}
      onClick={onClick}
      sx={{
        cursor: onClick ? 'pointer' : 'default',
        '& .MuiBadge-badge': getBadgeStyles(),
        ...sx
      }}
      {...props}
    >
      {children}
    </Badge>
  );
};

// Predefined notification badge variants
export const ImportantNotificationBadge = (props) => (
  <NotificationBadge variant="important" {...props} />
);

export const DotNotificationBadge = (props) => (
  <NotificationBadge variant="dot" {...props} />
);

export const StandaloneNotificationBadge = (props) => (
  <NotificationBadge variant="standalone" {...props} />
);

export const AvatarNotificationBadge = (props) => (
  <NotificationBadge variant="avatar" {...props} />
);

// Notification indicator for different types
export const EMINotificationBadge = ({ count, ...props }) => (
  <NotificationBadge
    count={count}
    color="warning"
    {...props}
  />
);

export const DeliveryNotificationBadge = ({ count, ...props }) => (
  <NotificationBadge
    count={count}
    color="info"
    {...props}
  />
);

export const PaymentNotificationBadge = ({ count, ...props }) => (
  <NotificationBadge
    count={count}
    color="success"
    {...props}
  />
);

export const OverdueNotificationBadge = ({ count, ...props }) => (
  <NotificationBadge
    count={count}
    variant="important"
    color="error"
    {...props}
  />
);

export default NotificationBadge;