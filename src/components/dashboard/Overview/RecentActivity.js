import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Avatar,
  Chip,
  Button,
  IconButton,
  Menu,
  MenuItem,
  Divider,
  alpha,
  useTheme
} from '@mui/material';
import {
  Person as PersonIcon,
  Receipt as ReceiptIcon,
  Payment as PaymentIcon,
  LocalShipping as DeliveryIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  TrendingUp as TrendingUpIcon,
  Schedule as ScheduleIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  MoreVert as MoreVertIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';

import { formatDate, formatTime, formatCurrency } from '../../../utils/helpers/formatHelpers';
import { 
  PAYMENT_STATUS, 
  DELIVERY_STATUS 
} from '../../../utils/constants/appConstants';

/**
 * Recent activity component showing timeline of recent actions
 * @param {Object} props
 * @param {array} props.activities - List of recent activities
 * @param {boolean} props.loading - Loading state
 * @param {function} props.onRefresh - Refresh callback
 * @param {number} props.maxItems - Maximum items to show
 */
const RecentActivity = ({
  activities = [],
  loading = false,
  onRefresh,
  maxItems = 10
}) => {
  const navigate = useNavigate();
  const theme = useTheme();
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [selectedActivity, setSelectedActivity] = useState(null);

  // Handle menu
  const handleMenuOpen = (event, activity) => {
    event.stopPropagation();
    setMenuAnchor(event.currentTarget);
    setSelectedActivity(activity);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
    setSelectedActivity(null);
  };

  // Get activity icon and color
  const getActivityConfig = (activity) => {
    const configs = {
      customer_created: {
        icon: <PersonIcon />,
        color: theme.palette.primary.main,
        bgColor: alpha(theme.palette.primary.main, 0.1)
      },
      customer_updated: {
        icon: <EditIcon />,
        color: theme.palette.info.main,
        bgColor: alpha(theme.palette.info.main, 0.1)
      },
      invoice_created: {
        icon: <ReceiptIcon />,
        color: theme.palette.success.main,
        bgColor: alpha(theme.palette.success.main, 0.1)
      },
      payment_received: {
        icon: <PaymentIcon />,
        color: theme.palette.success.main,
        bgColor: alpha(theme.palette.success.main, 0.1)
      },
      payment_pending: {
        icon: <ScheduleIcon />,
        color: theme.palette.warning.main,
        bgColor: alpha(theme.palette.warning.main, 0.1)
      },
      payment_overdue: {
        icon: <ErrorIcon />,
        color: theme.palette.error.main,
        bgColor: alpha(theme.palette.error.main, 0.1)
      },
      delivery_scheduled: {
        icon: <DeliveryIcon />,
        color: theme.palette.info.main,
        bgColor: alpha(theme.palette.info.main, 0.1)
      },
      delivery_completed: {
        icon: <CheckCircleIcon />,
        color: theme.palette.success.main,
        bgColor: alpha(theme.palette.success.main, 0.1)
      },
      emi_scheduled: {
        icon: <ScheduleIcon />,
        color: theme.palette.secondary.main,
        bgColor: alpha(theme.palette.secondary.main, 0.1)
      }
    };

    return configs[activity.type] || {
      icon: <TrendingUpIcon />,
      color: theme.palette.text.secondary,
      bgColor: alpha(theme.palette.text.secondary, 0.1)
    };
  };

  // Get activity title and description
  const getActivityContent = (activity) => {
    switch (activity.type) {
      case 'customer_created':
        return {
          title: 'New customer added',
          description: `${activity.data.customerName} was added to the system`
        };
      case 'customer_updated':
        return {
          title: 'Customer updated',
          description: `${activity.data.customerName} information was updated`
        };
      case 'invoice_created':
        return {
          title: 'Invoice created',
          description: `Invoice #${activity.data.invoiceNumber} for ${activity.data.customerName}`
        };
      case 'payment_received':
        return {
          title: 'Payment received',
          description: `${formatCurrency(activity.data.amount)} received from ${activity.data.customerName}`
        };
      case 'payment_pending':
        return {
          title: 'Payment pending',
          description: `${formatCurrency(activity.data.amount)} pending from ${activity.data.customerName}`
        };
      case 'payment_overdue':
        return {
          title: 'Payment overdue',
          description: `${formatCurrency(activity.data.amount)} overdue from ${activity.data.customerName}`
        };
      case 'delivery_scheduled':
        return {
          title: 'Delivery scheduled',
          description: `Delivery scheduled for ${activity.data.customerName} on ${formatDate(activity.data.deliveryDate)}`
        };
      case 'delivery_completed':
        return {
          title: 'Delivery completed',
          description: `Order delivered to ${activity.data.customerName}`
        };
      case 'emi_scheduled':
        return {
          title: 'EMI scheduled',
          description: `EMI of ${formatCurrency(activity.data.amount)} due on ${formatDate(activity.data.dueDate)}`
        };
      default:
        return {
          title: activity.title || 'Activity',
          description: activity.description || 'No description available'
        };
    }
  };

  // Handle activity click
  const handleActivityClick = (activity) => {
    switch (activity.type) {
      case 'customer_created':
      case 'customer_updated':
        if (activity.data.customerId) {
          navigate(`/customers/view/${activity.data.customerId}`);
        }
        break;
      case 'invoice_created':
      case 'payment_received':
      case 'payment_pending':
      case 'payment_overdue':
        if (activity.data.invoiceId) {
          navigate(`/sales/view/${activity.data.invoiceId}`);
        }
        break;
      case 'delivery_scheduled':
      case 'delivery_completed':
        if (activity.data.orderId) {
          navigate(`/sales/view/${activity.data.orderId}`);
        }
        break;
      case 'emi_scheduled':
        if (activity.data.customerId) {
          navigate(`/customers/view/${activity.data.customerId}?tab=emi`);
        }
        break;
      default:
        break;
    }
  };

  // Get relative time
  const getRelativeTime = (date) => {
    const now = new Date();
    const activityDate = new Date(date);
    const diffInMinutes = Math.floor((now - activityDate) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    
    return formatDate(activityDate);
  };

  // Filter and sort activities
  const displayActivities = activities
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, maxItems);

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent sx={{ p: 0 }}>
        {/* Header */}
        <Box sx={{ p: 3, pb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" fontWeight={600}>
              Recent Activity
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 1 }}>
              <IconButton 
                onClick={onRefresh}
                disabled={loading}
                size="small"
              >
                <RefreshIcon fontSize="small" />
              </IconButton>
            </Box>
          </Box>
          
          {activities.length > 0 && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {activities.length} recent activities
            </Typography>
          )}
        </Box>

        <Divider />

        {/* Activity List */}
        {loading ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Loading activities...
            </Typography>
          </Box>
        ) : displayActivities.length > 0 ? (
          <List sx={{ py: 0 }}>
            {displayActivities.map((activity, index) => {
              const config = getActivityConfig(activity);
              const content = getActivityContent(activity);
              const isLast = index === displayActivities.length - 1;
              const isClickable = ['customer_created', 'customer_updated', 'invoice_created', 'payment_received'].includes(activity.type);

              return (
                <React.Fragment key={activity.id || index}>
                  <ListItem
                    onClick={isClickable ? () => handleActivityClick(activity) : undefined}
                    sx={{
                      cursor: isClickable ? 'pointer' : 'default',
                      px: 3,
                      py: 2,
                      '&:hover': isClickable ? {
                        backgroundColor: alpha(config.color, 0.04)
                      } : {}
                    }}
                  >
                    {/* Activity Icon */}
                    <ListItemIcon sx={{ minWidth: 48 }}>
                      <Avatar
                        sx={{
                          width: 36,
                          height: 36,
                          backgroundColor: config.bgColor,
                          color: config.color
                        }}
                      >
                        {config.icon}
                      </Avatar>
                    </ListItemIcon>

                    {/* Activity Content */}
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                          <Typography variant="subtitle2" fontWeight={500}>
                            {content.title}
                          </Typography>
                          
                          {activity.priority === 'high' && (
                            <Chip
                              label="Urgent"
                              size="small"
                              color="error"
                              sx={{ fontSize: '0.625rem', height: 18 }}
                            />
                          )}
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                            {content.description}
                          </Typography>
                          
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Typography variant="caption" color="text.secondary">
                              {getRelativeTime(activity.createdAt)}
                            </Typography>
                            
                            {activity.data?.amount && (
                              <Chip
                                label={formatCurrency(activity.data.amount)}
                                size="small"
                                variant="outlined"
                                sx={{ fontSize: '0.625rem', height: 18 }}
                              />
                            )}
                          </Box>
                        </Box>
                      }
                    />

                    {/* Action Menu */}
                    <ListItemSecondaryAction>
                      <IconButton
                        onClick={(e) => handleMenuOpen(e, activity)}
                        size="small"
                        sx={{ opacity: 0.7 }}
                      >
                        <MoreVertIcon fontSize="small" />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                  
                  {!isLast && <Divider variant="inset" component="li" sx={{ ml: 8 }} />}
                </React.Fragment>
              );
            })}
          </List>
        ) : (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              py: 6,
              px: 3,
              color: 'text.secondary'
            }}
          >
            <TrendingUpIcon sx={{ fontSize: 48, mb: 2, opacity: 0.5 }} />
            <Typography variant="h6" fontWeight={500} gutterBottom>
              No recent activity
            </Typography>
            <Typography variant="body2" textAlign="center" sx={{ mb: 3 }}>
              Activity will appear here as you use the system
            </Typography>
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={() => navigate('/sales/create')}
            >
              Create First Invoice
            </Button>
          </Box>
        )}

        {/* Show More Button */}
        {activities.length > maxItems && (
          <>
            <Divider />
            <Box sx={{ p: 2, textAlign: 'center' }}>
              <Button
                variant="text"
                onClick={() => navigate('/activity')}
                size="small"
              >
                View All Activity
              </Button>
            </Box>
          </>
        )}
      </CardContent>

      {/* Activity Action Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        {selectedActivity && (
          <>
            <MenuItem onClick={() => {
              handleActivityClick(selectedActivity);
              handleMenuClose();
            }}>
              View Details
            </MenuItem>
            
            {selectedActivity.type.includes('customer') && (
              <MenuItem onClick={() => {
                navigate(`/customers/view/${selectedActivity.data.customerId}`);
                handleMenuClose();
              }}>
                View Customer
              </MenuItem>
            )}
            
            {selectedActivity.type.includes('invoice') && (
              <MenuItem onClick={() => {
                navigate(`/sales/view/${selectedActivity.data.invoiceId}`);
                handleMenuClose();
              }}>
                View Invoice
              </MenuItem>
            )}
          </>
        )}
      </Menu>
    </Card>
  );
};

export default RecentActivity;