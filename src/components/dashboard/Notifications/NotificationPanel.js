import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
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
  useTheme,
  Alert,
  CircularProgress
} from "@mui/material";
import {
  Notifications as NotificationsIcon,
  Payment as PaymentIcon,
  LocalShipping as DeliveryIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Schedule as ScheduleIcon,
  CheckCircle as CheckCircleIcon,
  MoreVert as MoreVertIcon,
  Check as MarkIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Refresh as RefreshIcon,
  CleaningServices as CleanupIcon,
} from "@mui/icons-material";

import CleanEMINotifications from "./CleanEMINotifications";
import CleanDeliveryNotifications from "./CleanDeliveryNotifications";
import { useNotifications } from "../../../hooks/useNotifications";
import { formatDate, formatCurrency } from "../../../utils/helpers/formatHelpers";
import { useAuth } from "../../../contexts/AuthContext";
import { useUserType } from "../../../contexts/UserTypeContext";

/**
 * Updated notification panel component - CLEAN VERSION
 * @param {Object} props
 * @param {boolean} props.compact - Compact display mode
 * @param {number} props.maxItems - Maximum items to show
 */
const NotificationPanel = ({ compact = false, maxItems = 10 }) => {
  const navigate = useNavigate();
  const theme = useTheme();

  const { user } = useAuth();
  const { userType } = useUserType();

  const {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refreshNotifications,
    autoGenerating
  } = useNotifications();

  const [currentTab, setCurrentTab] = useState(0);
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [cleanupLoading, setCleanupLoading] = useState(false);
  const [actionResult, setActionResult] = useState(null);

  // FIXED: Handle complete cleanup of duplicate notifications
  const handleCleanupDuplicates = async () => {
    if (!user || !userType) return;

    try {
      setCleanupLoading(true);
      setActionResult(null);
      
      console.log('Starting complete cleanup...');
      
      // Import clean generator
      const { default: cleanEMIGenerator } = await import('../../../services/cleanEMINotificationGenerator');
      
      // Clear ALL existing notifications
      const deletedCount = await cleanEMIGenerator.clearAllNotifications(userType, user.uid);
      
      // Generate fresh clean notifications
      const result = await cleanEMIGenerator.generateAllNotifications(userType, user.uid);
      
      // Force refresh the display
      await refreshNotifications();
      
      setActionResult({
        type: 'success',
        message: `Cleanup complete! Deleted ${deletedCount} duplicates, created ${result.total} clean notifications.`
      });
      
    } catch (error) {
      console.error('Error in cleanup:', error);
      setActionResult({
        type: 'error',
        message: 'Failed to cleanup notifications'
      });
    } finally {
      setCleanupLoading(false);
    }
  };

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
      case "emi_due":
      case "emi_overdue":
        if (notification.data?.invoiceId) {
          navigate(`/sales/view/${notification.data.invoiceId}?tab=emi`);
        }
        break;
      case "delivery_scheduled":
      case "delivery_today":
      case "delivery_overdue":
        if (notification.data?.orderId) {
          navigate(`/sales/view/${notification.data.orderId}`);
        }
        break;
      default:
        break;
    }
  };

  // Get notification icon and color
  const getNotificationConfig = (type, priority = "medium") => {
    const configs = {
      emi_due: {
        icon: <PaymentIcon />,
        color: theme.palette.warning.main,
        bgColor: alpha(theme.palette.warning.main, 0.1),
      },
      emi_overdue: {
        icon: <ErrorIcon />,
        color: theme.palette.error.main,
        bgColor: alpha(theme.palette.error.main, 0.1),
      },
      delivery_scheduled: {
        icon: <DeliveryIcon />,
        color: theme.palette.info.main,
        bgColor: alpha(theme.palette.info.main, 0.1),
      },
      delivery_today: {
        icon: <DeliveryIcon />,
        color: theme.palette.warning.main,
        bgColor: alpha(theme.palette.warning.main, 0.1),
      },
      delivery_overdue: {
        icon: <ErrorIcon />,
        color: theme.palette.error.main,
        bgColor: alpha(theme.palette.error.main, 0.1),
      },
    };

    return configs[type] || {
      icon: <NotificationsIcon />,
      color: theme.palette.text.secondary,
      bgColor: alpha(theme.palette.text.secondary, 0.1),
    };
  };

  // Get priority chip
  const getPriorityChip = (priority) => {
    const colors = {
      high: "error",
      medium: "warning",
      low: "default",
    };

    const labels = {
      high: "Urgent",
      medium: "Important",
      low: "Info",
    };

    return (
      <Chip
        label={labels[priority] || "Info"}
        size="small"
        color={colors[priority] || "default"}
        sx={{ fontSize: "0.625rem", height: 18 }}
      />
    );
  };

  // Filter notifications by type (only EMI and Delivery now)
  const getNotificationsByType = (type) => {
    switch (type) {
      case "emi":
        return notifications.filter(
          (n) => n.type === "emi_due" || n.type === "emi_overdue"
        );
      case "delivery":
        return notifications.filter((n) => n.type.includes("delivery"));
      default:
        return notifications;
    }
  };

  // Get tab counts with both total AND unread counts
  const getTabCounts = () => {
    const emiNotifications = notifications.filter(
      (n) => n.type === "emi_due" || n.type === "emi_overdue"
    );
    
    const deliveryNotifications = notifications.filter((n) => 
      n.type.includes("delivery")
    );

    return {
      emi: {
        total: emiNotifications.length,
        unread: emiNotifications.filter(n => !n.read).length
      },
      delivery: {
        total: deliveryNotifications.length,
        unread: deliveryNotifications.filter(n => !n.read).length
      }
    };
  };

  const tabCounts = getTabCounts();
  const currentNotifications = getNotificationsByType(
    ["emi", "delivery"][currentTab]
  );
  const displayNotifications = currentNotifications.slice(0, maxItems);

  const tabs = [
    { 
      label: "EMI", 
      count: tabCounts.emi.unread,
      total: tabCounts.emi.total
    },
    { 
      label: "Delivery", 
      count: tabCounts.delivery.unread,
      total: tabCounts.delivery.total
    },
  ];

  if (compact) {
    // Compact view for dashboard
    return (
      <Card sx={{ height: "100%" }}>
        <CardContent sx={{ p: 0 }}>
          {/* Header */}
          <Box sx={{ p: 3, pb: 2 }}>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Typography variant="h6" fontWeight={600}>
                <Badge badgeContent={unreadCount} color="error">
                  Notifications
                </Badge>
              </Typography>

              <Box sx={{ display: "flex", gap: 1 }}>
                <IconButton
                  onClick={refreshNotifications}
                  size="small"
                  disabled={loading}
                  title="Refresh"
                >
                  {loading ? <CircularProgress size={16} /> : <RefreshIcon fontSize="small" />}
                </IconButton>
                
                <IconButton
                  onClick={handleCleanupDuplicates}
                  size="small"
                  disabled={cleanupLoading}
                  color="secondary"
                  title="Remove Duplicates"
                >
                  {cleanupLoading ? <CircularProgress size={16} /> : <CleanupIcon fontSize="small" />}
                </IconButton>
              </Box>
            </Box>
          </Box>

          <Divider />

          {/* Action Result Alert */}
          {actionResult && (
            <Box sx={{ px: 3, py: 1 }}>
              <Alert 
                severity={actionResult.type} 
                onClose={() => setActionResult(null)}
                sx={{ fontSize: '0.75rem' }}
              >
                {actionResult.message}
              </Alert>
            </Box>
          )}

          {/* Show all notifications in compact mode */}
          {notifications.length > 0 ? (
            <List sx={{ py: 0 }}>
              {notifications.slice(0, maxItems).map((notification, index) => {
                const config = getNotificationConfig(
                  notification.type,
                  notification.priority
                );
                const isLast =
                  index === notifications.slice(0, maxItems).length - 1;

                return (
                  <React.Fragment key={notification.id}>
                    <ListItem
                      onClick={() => handleNotificationClick(notification)}
                      sx={{
                        cursor: "pointer",
                        backgroundColor: notification.read
                          ? "transparent"
                          : alpha(config.color, 0.04),
                        borderLeft: notification.read
                          ? "none"
                          : `3px solid ${config.color}`,
                        "&:hover": {
                          backgroundColor: alpha(config.color, 0.08),
                        },
                      }}
                    >
                      <ListItemIcon sx={{ minWidth: 40 }}>
                        <Box
                          sx={{
                            width: 32,
                            height: 32,
                            borderRadius: "50%",
                            backgroundColor: config.bgColor,
                            color: config.color,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          {config.icon}
                        </Box>
                      </ListItemIcon>

                      <ListItemText
                        primary={
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                            }}
                          >
                            <Typography
                              variant="subtitle2"
                              fontWeight={notification.read ? 400 : 600}
                            >
                              {notification.title}
                            </Typography>
                            {notification.priority === "high" &&
                              getPriorityChip(notification.priority)}
                          </Box>
                        }
                        secondary={
                          <Box>
                            <Typography
                              variant="body2"
                              color="text.secondary"
                              sx={{ mb: 0.5 }}
                            >
                              {notification.message}
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
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
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                py: 4,
                color: "text.secondary",
              }}
            >
              <CheckCircleIcon sx={{ fontSize: 48, mb: 2, opacity: 0.5 }} />
              <Typography variant="body1" gutterBottom>
                All caught up!
              </Typography>
              <Typography variant="body2">No notifications</Typography>
            </Box>
          )}

          {/* View All Button */}
          {notifications.length > maxItems && (
            <>
              <Divider />
              <Box sx={{ p: 2, textAlign: "center" }}>
                <Button
                  variant="text"
                  onClick={() => navigate("/notifications")}
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
                <MenuItem
                  onClick={async () => {
                    await markAsRead(selectedNotification.id);
                    handleMenuClose();
                  }}
                >
                  <MarkIcon fontSize="small" sx={{ mr: 1 }} />
                  Mark as Read
                </MenuItem>
              )}

              <MenuItem
                onClick={() => {
                  handleNotificationClick(selectedNotification);
                  handleMenuClose();
                }}
              >
                <ViewIcon fontSize="small" sx={{ mr: 1 }} />
                View Details
              </MenuItem>

              <MenuItem
                onClick={async () => {
                  await deleteNotification(selectedNotification.id);
                  handleMenuClose();
                }}
                sx={{ color: "error.main" }}
              >
                <DeleteIcon fontSize="small" color="error" sx={{ mr: 1 }} />
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
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Typography variant="h6" fontWeight={600}>
              Notifications
            </Typography>

            <Box sx={{ display: "flex", gap: 1 }}>
              {unreadCount > 0 && (
                <Button
                  size="small"
                  startIcon={<MarkIcon />}
                  onClick={markAllAsRead}
                >
                  Mark All Read
                </Button>
              )}

              <Button
                size="small"
                startIcon={loading || autoGenerating ? <CircularProgress size={16} /> : <RefreshIcon />}
                onClick={refreshNotifications}
                disabled={loading || autoGenerating}
                color="primary"
              >
                {autoGenerating ? 'Generating...' : 'Refresh'}
              </Button>

              <Button
                size="small"
                startIcon={cleanupLoading ? <CircularProgress size={16} /> : <CleanupIcon />}
                onClick={handleCleanupDuplicates}
                disabled={cleanupLoading}
                color="secondary"
              >
                {cleanupLoading ? 'Cleaning...' : 'Remove Duplicates'}
              </Button>
            </Box>
          </Box>
        </Box>

        {/* Action Result Alert */}
        {actionResult && (
          <Box sx={{ px: 3, pb: 2 }}>
            <Alert 
              severity={actionResult.type} 
              onClose={() => setActionResult(null)}
              sx={{ fontSize: '0.875rem' }}
            >
              {actionResult.message}
            </Alert>
          </Box>
        )}

        {/* Auto-generation indicator */}
        {autoGenerating && (
          <Box sx={{ px: 3, pb: 2 }}>
            <Alert severity="info" sx={{ fontSize: '0.875rem' }}>
              Auto-generating clean notifications from your latest data...
            </Alert>
          </Box>
        )}

        {/* Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
          <Tabs
            value={currentTab}
            onChange={handleTabChange}
            variant="scrollable"
          >
            {tabs.map((tab, index) => (
              <Tab
                key={index}
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <span>{tab.label}</span>
                    <Typography variant="caption" color="text.secondary">
                      ({tab.total})
                    </Typography>
                  </Box>
                }
              />
            ))}
          </Tabs>
        </Box>

        {/* Content */}
        <Box sx={{ minHeight: 400 }}>
          {currentTab === 0 && <CleanEMINotifications />}
          {currentTab === 1 && <CleanDeliveryNotifications />}
        </Box>
      </CardContent>
    </Card>
  );
};

export default NotificationPanel;