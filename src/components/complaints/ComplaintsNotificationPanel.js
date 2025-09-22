import React, { useState, useEffect, useCallback } from 'react';
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
  Divider,
  Menu,
  MenuItem,
  alpha,
  useTheme,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  SupportAgent as ComplaintIcon,
  Assignment as AssignmentIcon,
  Schedule as ScheduleIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  MoreVert as MoreVertIcon,
  Check as MarkIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Refresh as RefreshIcon,
  CleaningServices as CleanupIcon,
  Phone as PhoneIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Person as PersonIcon,
  Build as ServiceIcon
} from '@mui/icons-material';

import { useAuth } from '../../contexts/AuthContext';
import { useUserType } from '../../contexts/UserTypeContext';
import independentComplaintNotificationService from '../../services/independentComplaintNotificationService';
import { formatDate } from '../../utils/helpers/formatHelpers';

// Helper function for formatting date and time
const formatDateTime = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${day}/${month}/${year} ${hours}:${minutes}`;
};

/**
 * Independent Complaints Notification Panel - Completely separate from main notifications
 * @param {Object} props
 * @param {boolean} props.compact - Compact display mode
 * @param {number} props.maxItems - Maximum items to show
 */
const ComplaintsNotificationPanel = ({ compact = false, maxItems = 10 }) => {
  const navigate = useNavigate();
  const theme = useTheme();
  const { user } = useAuth();
  const { userType } = useUserType();

  // State - COLLAPSED BY DEFAULT
  const [complaintNotifications, setComplaintNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [generationLoading, setGenerationLoading] = useState(false);
  const [actionResult, setActionResult] = useState(null);
  const [expanded, setExpanded] = useState(false); // COLLAPSED BY DEFAULT

  // Load complaint notifications only (independent system)
  const loadComplaintNotifications = useCallback(async () => {
    if (!user || !userType) return;

    try {
      setLoading(true);
      console.log('🔄 Loading complaint notifications for user:', user.uid);
      
      const notifications = await independentComplaintNotificationService.getComplaintNotifications(
        userType, 
        user.uid
      );
      
      console.log('📋 Loaded complaint notifications:', {
        count: notifications.length,
        notifications: notifications.map(n => ({
          id: n.id,
          type: n.type,
          complaintNumber: n.data?.complaintNumber,
          customerName: n.data?.customerName,
          read: n.read
        }))
      });
      
      setComplaintNotifications(notifications);
      setUnreadCount(notifications.filter(n => !n.read).length);
      
    } catch (error) {
      console.error('Error loading complaint notifications:', error);
      setActionResult({
        type: 'error',
        message: `Failed to load notifications: ${error.message}`
      });
    } finally {
      setLoading(false);
    }
  }, [user, userType]);

  // Generate complaint notifications (due/overdue only)
  const handleGenerateComplaintNotifications = async () => {
    if (!user || !userType) return;

    try {
      setGenerationLoading(true);
      setActionResult(null);

      // Process complaint notifications
      const result = await independentComplaintNotificationService.processComplaintNotifications(
        userType, 
        user.uid
      );

      // Refresh display
      await loadComplaintNotifications();

      setActionResult({
        type: 'success',
        message: `Generated ${result.generated} complaint notifications (${result.dueToday} due today, ${result.overdue} overdue), cleaned up ${result.cleanedUp} resolved notifications.`
      });

    } catch (error) {
      console.error('Error generating complaint notifications:', error);
      setActionResult({
        type: 'error',
        message: 'Failed to generate complaint notifications'
      });
    } finally {
      setGenerationLoading(false);
    }
  };

  // Mark notification as read
  const markAsRead = async (notificationId) => {
    try {
      await independentComplaintNotificationService.markAsRead(userType, notificationId);
      await loadComplaintNotifications();
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Mark all complaint notifications as read
  const markAllAsRead = async () => {
    try {
      const unreadComplaintIds = complaintNotifications
        .filter(n => !n.read)
        .map(n => n.id);

      await independentComplaintNotificationService.markAllAsRead(userType, user.uid);
      await loadComplaintNotifications();
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  // Delete notification
  const deleteNotification = async (notificationId) => {
    try {
      await independentComplaintNotificationService.deleteNotification(userType, notificationId);
      await loadComplaintNotifications();
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
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

  // Handle expand/collapse toggle
  const handleToggleExpanded = () => {
    setExpanded(!expanded);
  };

  // Handle notification click
  const handleNotificationClick = async (notification) => {
    // Mark as read if unread
    if (!notification.read) {
      await markAsRead(notification.id);
    }

    // Navigate to complaint details
    if (notification.data?.complaintId) {
      navigate(`/complaints/view/${notification.data.complaintId}`);
    }
  };

  // Get notification configuration
  const getNotificationConfig = (type) => {
    const configs = {
      complaint_assigned: {
        icon: <AssignmentIcon />,
        color: theme.palette.primary.main,
        bgColor: alpha(theme.palette.primary.main, 0.1),
        label: 'Assigned'
      },
      complaint_due_today: {
        icon: <ScheduleIcon />,
        color: theme.palette.warning.main,
        bgColor: alpha(theme.palette.warning.main, 0.1),
        label: 'Due Today'
      },
      complaint_overdue: {
        icon: <ErrorIcon />,
        color: theme.palette.error.main,
        bgColor: alpha(theme.palette.error.main, 0.1),
        label: 'Overdue'
      },
      complaint_resolved: {
        icon: <CheckCircleIcon />,
        color: theme.palette.success.main,
        bgColor: alpha(theme.palette.success.main, 0.1),
        label: 'Resolved'
      }
    };

    return configs[type] || {
      icon: <ComplaintIcon />,
      color: theme.palette.text.secondary,
      bgColor: alpha(theme.palette.text.secondary, 0.1),
      label: 'Complaint'
    };
  };

  // Load notifications on mount and when dependencies change
  useEffect(() => {
    loadComplaintNotifications();
  }, [user, userType]);

  // Listen for notification refresh events
  useEffect(() => {
    const handleNotificationRefresh = (event) => {
      console.log('🔄 Received notification refresh event:', event.detail);
      loadComplaintNotifications();
    };

    // Add event listener for complaint notification refresh
    window.addEventListener('complaint-notification-refresh', handleNotificationRefresh);

    // Cleanup event listener on unmount
    return () => {
      window.removeEventListener('complaint-notification-refresh', handleNotificationRefresh);
    };
  }, [user, userType, loadComplaintNotifications]);

  // Auto-refresh every 30 seconds when expanded (optional)
  useEffect(() => {
    if (!expanded) return;

    const interval = setInterval(() => {
      console.log('🔄 Auto-refreshing notifications...');
      loadComplaintNotifications();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [expanded, loadComplaintNotifications]);

  if (compact) {
    // Compact expandable/collapsible view for complaints page
    return (
      <Card>
        <CardContent sx={{ p: 0 }}>
          {/* Header - Always visible */}
          <Box 
            sx={{ 
              p: 2, 
              cursor: 'pointer',
              '&:hover': {
                backgroundColor: 'action.hover'
              }
            }}
            onClick={handleToggleExpanded}
          >
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <Typography variant="h6" fontWeight={600}>
                  <Badge badgeContent={unreadCount} color="error">
                    Complaint Notifications
                  </Badge>
                </Typography>
                {complaintNotifications.length > 0 && (
                  <Typography variant="body2" color="text.secondary">
                    ({complaintNotifications.length} total)
                  </Typography>
                )}
              </Box>

              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <IconButton
                  onClick={(e) => {
                    e.stopPropagation();
                    handleGenerateComplaintNotifications();
                  }}
                  size="small"
                  disabled={generationLoading}
                  color="secondary"
                  title="Generate Complaint Notifications"
                >
                  {generationLoading ? <CircularProgress size={16} /> : <CleanupIcon fontSize="small" />}
                </IconButton>
                
                <IconButton size="small">
                  {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                </IconButton>
              </Box>
            </Box>

            {/* Show quick summary when collapsed */}
            {!expanded && complaintNotifications.length > 0 && (
              <Box sx={{ mt: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  {unreadCount > 0 ? `${unreadCount} unread, ` : ''}
                  {complaintNotifications.filter(n => n.type === 'complaint_overdue').length} overdue, 
                  {' '}{complaintNotifications.filter(n => n.type === 'complaint_due_today').length} due today
                </Typography>
              </Box>
            )}
          </Box>

          {/* Action Result Alert - Show even when collapsed */}
          {actionResult && (
            <Box sx={{ px: 2, pb: expanded ? 0 : 2 }}>
              <Alert 
                severity={actionResult.type} 
                onClose={() => setActionResult(null)}
                sx={{ fontSize: '0.75rem' }}
              >
                {actionResult.message}
              </Alert>
            </Box>
          )}

          {/* Expandable Content */}
          {expanded && (
            <>
              <Divider />

              {/* Complaint Notifications List */}
              {complaintNotifications.length > 0 ? (
                <List sx={{ py: 0, maxHeight: 400, overflowY: 'auto' }}>
                  {complaintNotifications.slice(0, maxItems).map((notification, index) => {
                    const config = getNotificationConfig(notification.type);
                    const isLast = index === complaintNotifications.slice(0, maxItems).length - 1;
                    const data = notification.data || {};

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
                              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                <Typography
                                  variant="subtitle2"
                                  fontWeight={notification.read ? 400 : 600}
                                >
                                  {notification.title}
                                </Typography>
                                <Chip
                                  label={config.label}
                                  size="small"
                                  sx={{
                                    backgroundColor: config.bgColor,
                                    color: config.color,
                                    fontSize: '0.625rem',
                                    height: 18
                                  }}
                                />
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

                                {/* Complaint Details */}
                                {data.complaintNumber && (
                                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                    Complaint: <strong>{data.complaintNumber}</strong>
                                    {data.customerName && ` • Customer: ${data.customerName}`}
                                  </Typography>
                                )}

                                {/* Assisting Person Info */}
                                {data.assigneeType && (
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                                    {data.assigneeType === 'employee' ? (
                                      <>
                                        <PersonIcon fontSize="small" color="action" />
                                        <Typography variant="caption" color="text.secondary">
                                          Employee: <strong>{data.assignedEmployeeName || 'Unassigned'}</strong>
                                        </Typography>
                                      </>
                                    ) : (
                                      <>
                                        <ServiceIcon fontSize="small" color="action" />
                                        <Typography variant="caption" color="text.secondary">
                                          Service: <strong>{data.servicePersonName || 'Unassigned'}</strong>
                                          {data.servicePersonContact && (
                                            <> • {data.servicePersonContact}</>
                                          )}
                                        </Typography>
                                      </>
                                    )}
                                  </Box>
                                )}

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
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    py: 3,
                    color: "text.secondary",
                  }}
                >
                  <ComplaintIcon sx={{ fontSize: 36, mb: 1, opacity: 0.5 }} />
                  <Typography variant="body2" gutterBottom>
                    No Complaint Notifications
                  </Typography>
                  <Typography variant="caption" textAlign="center">
                    Generate notifications to see due/overdue complaints
                  </Typography>
                </Box>
              )}

              {/* Actions in expanded view */}
              {expanded && (
                <>
                  <Divider />
                  <Box sx={{ p: 2, display: 'flex', gap: 1, justifyContent: 'space-between' }}>
                    <Button
                      size="small"
                      startIcon={<RefreshIcon />}
                      onClick={loadComplaintNotifications}
                      disabled={loading}
                    >
                      Refresh
                    </Button>
                    
                    {unreadCount > 0 && (
                      <Button
                        size="small"
                        startIcon={<MarkIcon />}
                        onClick={markAllAsRead}
                      >
                        Mark All Read
                      </Button>
                    )}

                    {complaintNotifications.length > maxItems && (
                      <Button
                        variant="text"
                        onClick={() => navigate("/complaints")}
                        size="small"
                      >
                        View All
                      </Button>
                    )}
                  </Box>
                </>
              )}
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
                View Complaint
              </MenuItem>

              {/* Quick Call Actions */}
              {selectedNotification.data?.customerPhone && (
                <MenuItem
                  onClick={() => {
                    window.open(`tel:${selectedNotification.data.customerPhone}`, '_self');
                    handleMenuClose();
                  }}
                >
                  <PhoneIcon fontSize="small" sx={{ mr: 1 }} />
                  Call Customer
                </MenuItem>
              )}

              {selectedNotification.data?.servicePersonContact && (
                <MenuItem
                  onClick={() => {
                    window.open(`tel:${selectedNotification.data.servicePersonContact}`, '_self');
                    handleMenuClose();
                  }}
                >
                  <PhoneIcon fontSize="small" sx={{ mr: 1 }} />
                  Call Service Person
                </MenuItem>
              )}

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

  // Full complaint notification panel (for standalone page)
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
              Complaint Notifications
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
                startIcon={loading ? <CircularProgress size={16} /> : <RefreshIcon />}
                onClick={loadComplaintNotifications}
                disabled={loading}
                color="primary"
              >
                Refresh
              </Button>

              <Button
                size="small"
                startIcon={generationLoading ? <CircularProgress size={16} /> : <CleanupIcon />}
                onClick={handleGenerateComplaintNotifications}
                disabled={generationLoading}
                color="secondary"
              >
                {generationLoading ? 'Processing...' : 'Generate Notifications'}
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

        <Divider />

        {/* Content */}
        <Box sx={{ minHeight: 400 }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : complaintNotifications.length === 0 ? (
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                py: 6,
                color: 'text.secondary'
              }}
            >
              <ComplaintIcon sx={{ fontSize: 64, mb: 2, opacity: 0.5 }} />
              <Typography variant="h6" gutterBottom>
                No Complaint Notifications
              </Typography>
              <Typography variant="body2" textAlign="center" sx={{ mb: 3 }}>
                Click "Generate Notifications" to check for due/overdue complaints
              </Typography>
              <Button
                variant="outlined"
                startIcon={<CleanupIcon />}
                onClick={handleGenerateComplaintNotifications}
                disabled={generationLoading}
              >
                Generate Notifications
              </Button>
            </Box>
          ) : (
            <List sx={{ py: 0 }}>
              {complaintNotifications.map((notification, index) => {
                const config = getNotificationConfig(notification.type);
                const isLast = index === complaintNotifications.length - 1;
                const data = notification.data || {};

                return (
                  <React.Fragment key={notification.id}>
                    <ListItem
                      onClick={() => handleNotificationClick(notification)}
                      sx={{
                        cursor: 'pointer',
                        backgroundColor: notification.read
                          ? 'transparent'
                          : alpha(config.color, 0.04),
                        borderLeft: notification.read
                          ? 'none'
                          : `3px solid ${config.color}`,
                        '&:hover': {
                          backgroundColor: alpha(config.color, 0.08)
                        },
                        py: 2
                      }}
                    >
                      <ListItemIcon sx={{ minWidth: 48 }}>
                        <Box
                          sx={{
                            width: 40,
                            height: 40,
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
                              sx={{ flex: 1 }}
                            >
                              {notification.title}
                            </Typography>
                            <Chip
                              label={config.label}
                              size="small"
                              sx={{
                                backgroundColor: config.bgColor,
                                color: config.color,
                                fontSize: '0.625rem',
                                height: 20
                              }}
                            />
                          </Box>
                        }
                        secondary={
                          <Box sx={{ mt: 1 }}>
                            <Typography
                              variant="body2"
                              color="text.secondary"
                              gutterBottom
                            >
                              {notification.message}
                            </Typography>

                            {/* Complaint Details */}
                            {data.complaintNumber && (
                              <Box sx={{ mb: 1 }}>
                                <Typography variant="caption" color="text.secondary">
                                  Complaint: <strong>{data.complaintNumber}</strong>
                                </Typography>
                                {data.customerName && (
                                  <Typography variant="caption" color="text.secondary" sx={{ ml: 2 }}>
                                    Customer: <strong>{data.customerName}</strong>
                                  </Typography>
                                )}
                              </Box>
                            )}

                            {/* Assisting Person Info */}
                            {data.assigneeType && (
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                {data.assigneeType === 'employee' ? (
                                  <>
                                    <PersonIcon fontSize="small" color="action" />
                                    <Typography variant="caption" color="text.secondary">
                                      Employee: <strong>{data.assignedEmployeeName || 'Unassigned'}</strong>
                                    </Typography>
                                  </>
                                ) : (
                                  <>
                                    <ServiceIcon fontSize="small" color="action" />
                                    <Typography variant="caption" color="text.secondary">
                                      Service Person: <strong>{data.servicePersonName || 'Unassigned'}</strong>
                                      {data.servicePersonContact && (
                                        <> • Contact: {data.servicePersonContact}</>
                                      )}
                                    </Typography>
                                  </>
                                )}
                              </Box>
                            )}

                            {/* Overdue indicator */}
                            {notification.type === 'complaint_overdue' && data.daysOverdue && (
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                <WarningIcon fontSize="small" color="error" />
                                <Typography variant="caption" color="error.main" fontWeight={500}>
                                  {data.daysOverdue} day{data.daysOverdue > 1 ? 's' : ''} overdue
                                </Typography>
                              </Box>
                            )}

                            {/* Severity chip */}
                            {data.severity && (
                              <Chip
                                label={`${data.severity.charAt(0).toUpperCase() + data.severity.slice(1)} Priority`}
                                size="small"
                                color={
                                  data.severity === 'critical' || data.severity === 'high' ? 'error' :
                                  data.severity === 'medium' ? 'warning' : 'default'
                                }
                                sx={{ fontSize: '0.625rem', height: 18, mr: 1, mb: 1 }}
                              />
                            )}

                            <Typography variant="caption" color="text.secondary">
                              {formatDateTime(notification.createdAt)}
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

                    {!isLast && (
                      <Box sx={{ mx: 2 }}>
                        <Box
                          sx={{
                            height: 1,
                            backgroundColor: 'divider',
                            ml: 6 // Align with text content
                          }}
                        />
                      </Box>
                    )}
                  </React.Fragment>
                );
              })}
            </List>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default ComplaintsNotificationPanel;