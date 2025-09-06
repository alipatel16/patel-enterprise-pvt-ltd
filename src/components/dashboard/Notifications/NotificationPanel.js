import React, { useState, useEffect } from 'react';
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
  IconButton,
  Button,
  Chip,
  Badge,
  Tab,
  Tabs,
  Divider,
  Menu,
  MenuItem,
  alpha,
  useTheme
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  Payment as PaymentIcon,
  LocalShipping as DeliveryIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Schedule as ScheduleIcon,
  CheckCircle as CheckCircleIcon,
  MoreVert as MoreVertIcon,
  Mark as MarkIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Clear as ClearAllIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';

import EMINotifications from './EMINotifications';
import DeliveryNotifications from './DeliveryNotifications';
import { useNotifications } from '../../../hooks/useNotifications';
import { formatDate, formatCurrency } from '../../../utils/helpers/formatHelpers';

/**
 * Main notification panel component
 * @param {Object} props
 * @param {boolean} props.compact - Compact display mode
 * @param {number} props.maxItems - Maximum items to show
 */
const NotificationPanel = ({ 
  compact = false, 
  maxItems = 10 
}) => {
  const navigate = useNavigate();
  const theme = useTheme();
  
  const {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refreshNotifications
  } = useNotifications();

  const [currentTab, setCurrentTab] = useState(0);
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [selectedNotification, setSelectedNotification] = useState(null);

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
  };

  // Handle menu
  const handleMenuOpen = (event, notification) => {
    event.stopPropagation();
    setMenuAnchor(event.currentTarget);
    setSelectedNotification(notification);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
    setSelectedNotification(null);
  };

  // Handle notification click
  const handleNotificationClick = async (notification) => {
    // Mark as read if unread
    if (!notification.read) {
      await markAsRead(notification.id);
    }

    // Navigate based on notification type
    switch (notification.type) {
      case 'emi_due':
      case 'payment_overdue':
        if (notification.data?.customerId) {
          navigate(`/customers/view/${notification.data.customerId}?tab=emi`);
        }
        break;
      case 'delivery_scheduled':
      case 'delivery_pending':
        if (notification.data?.orderId) {
          navigate(`/sales/view/${notification.data.orderId}`);
        }
        break;
      case 'invoice_created':
        if (notification.data?.invoiceId) {
          navigate(`/sales/view/${notification.data.invoiceId}`);
        }
        break;
      case 'customer_added':
        if (notification.data?.customerId) {
          navigate(`/customers/view/${notification.data.customerId}`);
        }
        break;
      default:
        break;
    }
  };

  // Get notification icon and color
  const getNotificationConfig = (type, priority = 'medium') => {
    const configs = {
      emi_due: {
        icon: <PaymentIcon />,
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
      delivery_pending: {
        icon: <ScheduleIcon />,
        color: theme.palette.warning.main,
        bgColor: alpha(theme.palette.warning.main, 0.1)
      },
      invoice_created: {
        icon: <CheckCircleIcon />,
        color: theme.palette.success.main,
        bgColor: alpha(theme.palette.success.main, 0.1)
      },
      customer_added: {
        icon: <CheckCircleIcon />,
        color: theme.palette.primary.main,
        bgColor: alpha(theme.palette.primary.main, 0.1)
      }
    };

    const config = configs[type] || {
      icon: <NotificationsIcon />,
      color: theme.palette.text.secondary,
      bgColor: alpha(theme.palette.text.secondary, 0.1)
    };

    // Adjust color based on priority
    if (priority === 'high') {
      config.color = theme.palette.error.main;
    } else if (priority === 'low') {
      config.color = theme.palette.text.secondary;
    }

    return config;
  };

  // Get priority chip
  const getPriorityChip = (priority) => {
    const colors = {
      high: 'error',
      medium: 'warning',
      low: 'default'
    };

    const labels = {
      high: 'Urgent',
      medium: 'Important',
      low: 'Info'
    };

    return (
      <Chip
        label={labels[priority] || 'Info'}
        size="small"
        color={colors[priority] || 'default'}
        sx={{ fontSize: '0.625rem', height: 18 }}
      />
    );
  };

  // Filter notifications by type
  const getNotificationsByType = (type) => {
    switch (type) {
      case 'emi':
        return notifications.filter(n => n.type === 'emi_due');
      case 'delivery':
        return notifications.filter(n => n.type.includes('delivery'));
      case 'payment':
        return notifications.filter(n => n.type.includes('payment'));
      default:
        return notifications;
    }
  };

  // Get tab counts
  const getTabCounts = () => {
    return {
      all: notifications.length,
      emi: notifications.filter(n => n.type === 'emi_due').length,
      delivery: notifications.filter(n => n.type.includes('delivery')).length,
      payment: notifications.filter(n => n.type.includes('payment')).length
    };
  };

  const tabCounts = getTabCounts();
  const currentNotifications = getNotificationsByType(['all', 'emi', 'delivery', 'payment'][currentTab]);
  const displayNotifications = currentNotifications.slice(0, maxItems);

  const tabs = [
    { label: 'All', count: tabCounts.all },
    { label: 'EMI', count: tabCounts.emi },
    { label: 'Delivery', count: tabCounts.delivery },
    { label: 'Payment', count: tabCounts.payment }
  ];

  if (compact) {
    // Compact view for dashboard
    return (
      <Card sx={{ height: '100%' }}>
        <CardContent sx={{ p: 0 }}>
          {/* Header */}
          <Box sx={{ p: 3, pb: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6" fontWeight={600}>
                <Badge badgeContent={unreadCount} color="error">
                  Notifications
                </Badge>
              </Typography>
              
              <IconButton onClick={refreshNotifications} size="small" disabled={loading}>
                <RefreshIcon fontSize="small" />
              </IconButton>
            </Box>
          </Box>

          <Divider />

          {/* Notification List */}
          {displayNotifications.length > 0 ? (
            <List sx={{ py: 0 }}>
              {displayNotifications.map((notification, index) => {
                const config = getNotificationConfig(notification.type, notification.priority);
                const isLast = index === displayNotifications.length - 1;

                return (
                  <React.Fragment key={notification.id}>
                    <ListItem
                      onClick={() => handleNotificationClick(notification)}
                      sx={{
                        cursor: 'pointer',
                        backgroundColor: notification.read ? 'transparent' : alpha(config.color, 0.04),
                        borderLeft: notification.read ? 'none' : `3px solid ${config.color}`,
                        '&:hover': {
                          backgroundColor: alpha(config.color, 0.08)
                        }
                      }}
                    >
                      <ListItemIcon sx={{ minWidth: 40 }}>
                        <Box
                          sx={{
                            width: 32,
                            height: 32,
                            borderRadius: '50%',
                            backgroundColor: config.bgColor,
                            color: config.color,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          {config.icon}
                        </Box>
                      </ListItemIcon>

                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography 
                              variant="subtitle2" 
                              fontWeight={notification.read ? 400 : 600}
                            >
                              {notification.title}
                            </Typography>
                            {notification.priority === 'high' && getPriorityChip(notification.priority)}
                          </Box>
                        }
                        secondary={
                          <Box>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                              {notification.message}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {formatDate(notification.createdAt)}
                            </Typography>
                          </Box>
                        }
                      />

                      <ListItemSecondaryAction>
                        <IconButton
                          onClick={(e) => handleMenuOpen(e, notification)}
                          size="small"
                        >
                          <MoreVertIcon fontSize="small" />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                    
                    {!isLast && <Divider variant="inset" component="li" />}
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
                py: 4,
                color: 'text.secondary'
              }}
            >
              <CheckCircleIcon sx={{ fontSize: 48, mb: 2, opacity: 0.5 }} />
              <Typography variant="body1" gutterBottom>
                All caught up!
              </Typography>
              <Typography variant="body2">
                No new notifications
              </Typography>
            </Box>
          )}

          {/* View All Button */}
          {notifications.length > maxItems && (
            <>
              <Divider />
              <Box sx={{ p: 2, textAlign: 'center' }}>
                <Button
                  variant="text"
                  onClick={() => navigate('/notifications')}
                  size="small"
                >
                  View All Notifications
                </Button>
              </Box>
            </>
          )}
        </CardContent>

        {/* Action Menu */}
        <Menu
          anchorEl={menuAnchor}
          open={Boolean(menuAnchor)}
          onClose={handleMenuClose}
        >
          {selectedNotification && (
            <>
              {!selectedNotification.read && (
                <MenuItem onClick={async () => {
                  await markAsRead(selectedNotification.id);
                  handleMenuClose();
                }}>
                  <ListItemIcon>
                    <MarkIcon fontSize="small" />
                  </ListItemIcon>
                  Mark as Read
                </MenuItem>
              )}
              
              <MenuItem onClick={() => {
                handleNotificationClick(selectedNotification);
                handleMenuClose();
              }}>
                <ListItemIcon>
                  <ViewIcon fontSize="small" />
                </ListItemIcon>
                View Details
              </MenuItem>
              
              <MenuItem 
                onClick={async () => {
                  await deleteNotification(selectedNotification.id);
                  handleMenuClose();
                }}
                sx={{ color: 'error.main' }}
              >
                <ListItemIcon>
                  <DeleteIcon fontSize="small" color="error" />
                </ListItemIcon>
                Delete
              </MenuItem>
            </>
          )}
        </Menu>
      </Card>
    );
  }

  // Full notification panel
  return (
    <Card>
      <CardContent sx={{ p: 0 }}>
        {/* Header */}
        <Box sx={{ p: 3, pb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" fontWeight={600}>
              Notifications
              <Badge badgeContent={unreadCount} color="error" sx={{ ml: 2 }} />
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 1 }}>
              {unreadCount > 0 && (
                <Button
                  size="small"
                  startIcon={<MarkIcon />}
                  onClick={markAllAsRead}
                >
                  Mark All Read
                </Button>
              )}
              
              <IconButton onClick={refreshNotifications} size="small" disabled={loading}>
                <RefreshIcon fontSize="small" />
              </IconButton>
            </Box>
          </Box>
        </Box>

        {/* Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={currentTab} onChange={handleTabChange} variant="scrollable">
            {tabs.map((tab, index) => (
              <Tab
                key={index}
                label={
                  <Badge badgeContent={tab.count} color="primary">
                    <span>{tab.label}</span>
                  </Badge>
                }
              />
            ))}
          </Tabs>
        </Box>

        {/* Content */}
        <Box sx={{ minHeight: 400 }}>
          {currentTab === 1 && <EMINotifications />}
          {currentTab === 2 && <DeliveryNotifications />}
          {(currentTab === 0 || currentTab === 3) && (
            // All notifications or payment notifications
            <Box sx={{ p: 3 }}>
              <Typography variant="body2" color="text.secondary">
                {currentTab === 0 ? 'All notifications' : 'Payment notifications'} will be displayed here.
              </Typography>
            </Box>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default NotificationPanel;