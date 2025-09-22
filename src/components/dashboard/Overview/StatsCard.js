import React from 'react';
import {
  Card,
  CardContent,
  Box,
  Typography,
  Avatar,
  Chip,
  alpha,
  useTheme
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  ArrowForward as ArrowForwardIcon
} from '@mui/icons-material';

/**
 * Statistics card component for dashboard metrics
 * @param {Object} props
 * @param {string} props.title - Card title
 * @param {string|number} props.value - Main value to display
 * @param {React.ReactNode} props.icon - Icon component
 * @param {string} props.color - Theme color
 * @param {Object} props.trend - Trend data {value, isPositive}
 * @param {string} props.subtitle - Optional subtitle
 * @param {boolean} props.urgent - Whether to show urgent styling
 * @param {function} props.onClick - Click handler
 * @param {boolean} props.loading - Loading state
 * @param {object} props.sx - Additional styling
 */
const StatsCard = ({
  title,
  value,
  icon,
  color = '#1976d2',
  trend,
  subtitle,
  urgent = false,
  onClick,
  loading = false,
  sx = {},
  ...props
}) => {
  const theme = useTheme();

  // Format large numbers
  const formatValue = (val) => {
    if (typeof val !== 'number') return val;
    
    if (val >= 1000000) {
      return `${(val / 1000000).toFixed(1)}M`;
    } else if (val >= 1000) {
      return `${(val / 1000).toFixed(1)}K`;
    }
    return val.toString();
  };

  // Get trend icon and color
  const getTrendIcon = () => {
    if (!trend || trend.value === 0) return null;
    
    return trend.isPositive ? (
      <TrendingUpIcon fontSize="small" />
    ) : (
      <TrendingDownIcon fontSize="small" />
    );
  };

  const getTrendColor = () => {
    if (!trend || trend.value === 0) return 'text.secondary';
    return trend.isPositive ? 'success.main' : 'error.main';
  };

  return (
    <Card
      onClick={onClick}
      sx={{
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.3s ease',
        border: urgent ? `2px solid ${theme.palette.error.main}` : 'none',
        background: urgent 
          ? `linear-gradient(135deg, ${alpha(theme.palette.error.main, 0.05)}, ${alpha(theme.palette.error.main, 0.02)})`
          : 'none',
        '&:hover': onClick ? {
          transform: 'translateY(-2px)',
          boxShadow: `0 8px 24px ${alpha(color, 0.2)}`,
          '& .stats-card-arrow': {
            opacity: 1,
            transform: 'translateX(4px)'
          }
        } : {},
        ...sx
      }}
      {...props}
    >
      <CardContent sx={{ p: 3 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
          <Avatar
            sx={{
              width: 56,
              height: 56,
              backgroundColor: alpha(color, 0.1),
              color: color,
              '& svg': {
                fontSize: 28
              }
            }}
          >
            {loading ? (
              <Box
                sx={{
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  border: `2px solid ${alpha(color, 0.3)}`,
                  borderTopColor: color,
                  animation: 'spin 1s linear infinite',
                  '@keyframes spin': {
                    '0%': { transform: 'rotate(0deg)' },
                    '100%': { transform: 'rotate(360deg)' }
                  }
                }}
              />
            ) : (
              icon
            )}
          </Avatar>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {urgent && (
              <Chip
                label="Urgent"
                size="small"
                color="error"
                sx={{ fontSize: '0.625rem', height: 20 }}
              />
            )}
            
            {onClick && (
              <ArrowForwardIcon
                className="stats-card-arrow"
                sx={{
                  fontSize: 20,
                  color: 'text.secondary',
                  opacity: 0,
                  transform: 'translateX(0px)',
                  transition: 'all 0.3s ease'
                }}
              />
            )}
          </Box>
        </Box>

        {/* Value */}
        <Box sx={{ mb: 1 }}>
          <Typography
            variant="h4"
            fontWeight={700}
            sx={{
              color: urgent ? 'error.main' : color,
              fontSize: { xs: '1.75rem', sm: '2rem' },
              lineHeight: 1.2
            }}
          >
            {loading ? '—' : formatValue(value)}
          </Typography>
          
          {subtitle && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {subtitle}
            </Typography>
          )}
        </Box>

        {/* Title and Trend */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography
            variant="body2"
            fontWeight={500}
            color="text.secondary"
            sx={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}
          >
            {title}
          </Typography>
          
          {trend && trend.value !== 0 && !loading && (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
                color: getTrendColor()
              }}
            >
              {getTrendIcon()}
              <Typography
                variant="caption"
                fontWeight={600}
                sx={{ color: 'inherit' }}
              >
                {Math.abs(trend.value).toFixed(1)}%
              </Typography>
            </Box>
          )}
        </Box>

        {/* Progress Bar (if urgent) */}
        {urgent && (
          <Box
            sx={{
              mt: 2,
              height: 4,
              borderRadius: 2,
              backgroundColor: alpha(theme.palette.error.main, 0.1),
              overflow: 'hidden'
            }}
          >
            <Box
              sx={{
                height: '100%',
                width: '75%', // This could be dynamic based on urgency level
                backgroundColor: theme.palette.error.main,
                borderRadius: 2,
                animation: 'pulse 2s infinite',
                '@keyframes pulse': {
                  '0%': { opacity: 1 },
                  '50%': { opacity: 0.7 },
                  '100%': { opacity: 1 }
                }
              }}
            />
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

// Predefined stat card variants
export const CustomerStatsCard = (props) => (
  <StatsCard
    color="#1976d2"
    {...props}
  />
);

export const SalesStatsCard = (props) => (
  <StatsCard
    color="#2196f3"
    {...props}
  />
);

export const RevenueStatsCard = (props) => (
  <StatsCard
    color="#4caf50"
    {...props}
  />
);

export const WarningStatsCard = (props) => (
  <StatsCard
    color="#ff9800"
    urgent
    {...props}
  />
);

export const ErrorStatsCard = (props) => (
  <StatsCard
    color="#f44336"
    urgent
    {...props}
  />
);

export default StatsCard;