import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Button,
  IconButton,
  Chip,
  Avatar,
  Alert,
  LinearProgress,
  Menu,
  MenuItem,
  Card,
  CardContent,
  Grid,
  alpha,
  useTheme
} from '@mui/material';
import {
  LocalShipping as DeliveryIcon,
  Schedule as ScheduleIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  LocationOn as LocationIcon,
  Phone as PhoneIcon,
  Directions as DirectionsIcon,
  MoreVert as MoreVertIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  Check as CheckIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';

import { formatDate, formatTime } from '../../../utils/helpers/formatHelpers';
import { useNotifications } from '../../../hooks/useNotifications';
import { DELIVERY_STATUS } from '../../../utils/constants/appConstants';

/**
 * Delivery notifications component
 */
const DeliveryNotifications = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const { notifications, loading, markAsRead, refreshNotifications } = useNotifications();

  const [menuAnchor, setMenuAnchor] = useState(null);
  const [selectedDelivery, setSelectedDelivery] = useState(null);

  // Filter delivery notifications
  const deliveryNotifications = notifications.filter(n => n.type.includes('delivery'));

  // Group by status
  const groupedDeliveries = {
    pending: deliveryNotifications.filter(n => n.data?.status === DELIVERY_STATUS.PENDING),
    scheduled: deliveryNotifications.filter(n => n.data?.status === DELIVERY_STATUS.SCHEDULED),
    delivered: deliveryNotifications.filter(n => n.data?.status === DELIVERY_STATUS.DELIVERED)
  };

  // Handle menu
  const handleMenuOpen = (event, delivery) => {
    event.stopPropagation();
    setMenuAnchor(event.currentTarget);
    setSelectedDelivery(delivery);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
    setSelectedDelivery(null);
  };

  // Handle delivery click
  const handleDeliveryClick = async (delivery) => {
    if (!delivery.read) {
      await markAsRead(delivery.id);
    }
    navigate(`/sales/view/${delivery.data?.orderId}`);
  };

  // Get delivery status config
  const getStatusConfig = (delivery) => {
    const status = delivery.data?.status;
    const scheduledDate = delivery.data?.scheduledDate;
    const isOverdue = scheduledDate && new Date(scheduledDate) < new Date();

    switch (status) {
      case DELIVERY_STATUS.PENDING:
        return {
          status: 'pending',
          label: 'Pending',
          color: theme.palette.warning.main,
          bgColor: alpha(theme.palette.warning.main, 0.1),
          icon: <ScheduleIcon />,
          priority: 'medium'
        };
      
      case DELIVERY_STATUS.SCHEDULED:
        if (isOverdue) {
          return {
            status: 'overdue',
            label: 'Overdue',
            color: theme.palette.error.main,
            bgColor: alpha(theme.palette.error.main, 0.1),
            icon: <ErrorIcon />,
            priority: 'high'
          };
        }
        return {
          status: 'scheduled',
          label: 'Scheduled',
          color: theme.palette.info.main,
          bgColor: alpha(theme.palette.info.main, 0.1),
          icon: <DeliveryIcon />,
          priority: 'medium'
        };
      
      case DELIVERY_STATUS.DELIVERED:
        return {
          status: 'delivered',
          label: 'Delivered',
          color: theme.palette.success.main,
          bgColor: alpha(theme.palette.success.main, 0.1),
          icon: <CheckCircleIcon />,
          priority: 'low'
        };
      
      default:
        return {
          status: 'unknown',
          label: 'Unknown',
          color: theme.palette.text.secondary,
          bgColor: alpha(theme.palette.text.secondary, 0.1),
          icon: <DeliveryIcon />,
          priority: 'low'
        };
    }
  };

  // Get delivery urgency
  const getDeliveryUrgency = (delivery) => {
    const scheduledDate = delivery.data?.scheduledDate;
    if (!scheduledDate) return null;

    const today = new Date();
    const deliveryDate = new Date(scheduledDate);
    const diffDays = Math.ceil((deliveryDate - today) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return { level: 'overdue', days: Math.abs(diffDays) };
    if (diffDays === 0) return { level: 'today', days: 0 };
    if (diffDays === 1) return { level: 'tomorrow', days: 1 };
    if (diffDays <= 3) return { level: 'soon', days: diffDays };
    
    return { level: 'upcoming', days: diffDays };
  };

  // Render delivery summary card
  const renderSummaryCard = () => {
    const pendingCount = groupedDeliveries.pending.length;
    const scheduledCount = groupedDeliveries.scheduled.length;
    const overdueCount = groupedDeliveries.scheduled.filter(d => {
      const scheduledDate = d.data?.scheduledDate;
      return scheduledDate && new Date(scheduledDate) < new Date();
    }).length;

    return (
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h4" fontWeight={600} color="warning.main">
                {pendingCount}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Pending Deliveries
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h4" fontWeight={600} color="info.main">
                {scheduledCount}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Scheduled Deliveries
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h4" fontWeight={600} color="error.main">
                {overdueCount}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Overdue Deliveries
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    );
  };

  // Render delivery group
  const renderDeliveryGroup = (title, deliveries, showEmpty = true) => {
    if (deliveries.length === 0 && !showEmpty) return null;

    return (
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" fontWeight={600} gutterBottom sx={{ px: 2 }}>
          {title} ({deliveries.length})
        </Typography>

        {deliveries.length > 0 ? (
          <List>
            {deliveries.map((delivery) => {
              const config = getStatusConfig(delivery);
              const urgency = getDeliveryUrgency(delivery);
              
              return (
                <ListItem
                  key={delivery.id}
                  onClick={() => handleDeliveryClick(delivery)}
                  sx={{
                    cursor: 'pointer',
                    backgroundColor: delivery.read ? 'transparent' : config.bgColor,
                    borderLeft: delivery.read ? 'none' : `3px solid ${config.color}`,
                    mb: 1,
                    borderRadius: 1,
                    '&:hover': {
                      backgroundColor: alpha(config.color, 0.08)
                    }
                  }}
                >
                  <ListItemIcon>
                    <Avatar
                      sx={{
                        width: 40,
                        height: 40,
                        backgroundColor: config.bgColor,
                        color: config.color
                      }}
                    >
                      {config.icon}
                    </Avatar>
                  </ListItemIcon>

                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                        <Typography variant="subtitle2" fontWeight={500}>
                          {delivery.data?.customerName || 'Unknown Customer'}
                        </Typography>
                        
                        <Chip
                          label={config.label}
                          size="small"
                          sx={{
                            backgroundColor: config.bgColor,
                            color: config.color,
                            fontSize: '0.625rem'
                          }}
                        />

                        {urgency && urgency.level === 'overdue' && (
                          <Chip
                            label={`${urgency.days} days overdue`}
                            size="small"
                            color="error"
                            sx={{ fontSize: '0.625rem' }}
                          />
                        )}
                        
                        {urgency && urgency.level === 'today' && (
                          <Chip
                            label="Today"
                            size="small"
                            color="warning"
                            sx={{ fontSize: '0.625rem' }}
                          />
                        )}
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          Order #{delivery.data?.orderNumber} • 
                          Items: {delivery.data?.itemCount || 0}
                        </Typography>
                        
                        {delivery.data?.scheduledDate && (
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            Scheduled: {formatDate(delivery.data.scheduledDate)} {delivery.data.scheduledTime && formatTime(delivery.data.scheduledTime)}
                          </Typography>
                        )}

                        {delivery.data?.address && (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                            <LocationIcon fontSize="small" />
                            <Typography variant="caption" noWrap>
                              {delivery.data.address}
                            </Typography>
                          </Box>
                        )}

                        {delivery.data?.phoneNumber && (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                            <PhoneIcon fontSize="small" />
                            <Typography variant="caption">
                              {delivery.data.phoneNumber}
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    }
                  />

                  <ListItemSecondaryAction>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {/* Quick Actions */}
                      {delivery.data?.address && (
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            const address = encodeURIComponent(delivery.data.address);
                            window.open(`https://maps.google.com?q=${address}`, '_blank');
                          }}
                          title="Get Directions"
                        >
                          <DirectionsIcon fontSize="small" />
                        </IconButton>
                      )}

                      {delivery.data?.phoneNumber && (
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(`tel:${delivery.data.phoneNumber}`);
                          }}
                          title="Call Customer"
                        >
                          <PhoneIcon fontSize="small" />
                        </IconButton>
                      )}

                      <IconButton
                        size="small"
                        onClick={(e) => handleMenuOpen(e, delivery)}
                      >
                        <MoreVertIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </ListItemSecondaryAction>
                </ListItem>
              );
            })}
          </List>
        ) : (
          <Box
            sx={{
              textAlign: 'center',
              py: 3,
              color: 'text.secondary'
            }}
          >
            <CheckCircleIcon sx={{ fontSize: 48, mb: 1, opacity: 0.5 }} />
            <Typography variant="body2">
              No {title.toLowerCase()} deliveries
            </Typography>
          </Box>
        )}
      </Box>
    );
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <LinearProgress />
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Loading delivery notifications...
        </Typography>
      </Box>
    );
  }

  if (deliveryNotifications.length === 0) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          py: 6,
          color: 'text.secondary'
        }}
      >
        <DeliveryIcon sx={{ fontSize: 64, mb: 2, opacity: 0.5 }} />
        <Typography variant="h6" gutterBottom>
          No delivery notifications
        </Typography>
        <Typography variant="body2" textAlign="center">
          Delivery schedules and updates will appear here
        </Typography>
        
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={refreshNotifications}
          sx={{ mt: 2 }}
        >
          Refresh
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Summary Cards */}
      {renderSummaryCard()}

      {/* Alert for urgent deliveries */}
      {groupedDeliveries.scheduled.some(d => {
        const urgency = getDeliveryUrgency(d);
        return urgency && (urgency.level === 'overdue' || urgency.level === 'today');
      }) && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            Urgent Deliveries
          </Typography>
          <Typography variant="body2">
            Some deliveries need immediate attention - check overdue and today's deliveries
          </Typography>
        </Alert>
      )}

      {/* Delivery Groups */}
      {renderDeliveryGroup('Pending Deliveries', groupedDeliveries.pending)}
      {renderDeliveryGroup('Scheduled Deliveries', groupedDeliveries.scheduled)}
      {renderDeliveryGroup('Recently Delivered', groupedDeliveries.delivered.slice(0, 5), false)}

      {/* Action Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
      >
        {selectedDelivery && (
          <>
            <MenuItem onClick={() => {
              handleDeliveryClick(selectedDelivery);
              handleMenuClose();
            }}>
              <ListItemIcon>
                <ViewIcon fontSize="small" />
              </ListItemIcon>
              View Order Details
            </MenuItem>

            <MenuItem onClick={() => {
              navigate(`/sales/edit/${selectedDelivery.data?.orderId}`);
              handleMenuClose();
            }}>
              <ListItemIcon>
                <EditIcon fontSize="small" />
              </ListItemIcon>
              Update Delivery
            </MenuItem>

            {selectedDelivery.data?.status !== DELIVERY_STATUS.DELIVERED && (
              <MenuItem onClick={() => {
                // Mark as delivered logic would go here
                handleMenuClose();
              }}>
                <ListItemIcon>
                  <CheckIcon fontSize="small" />
                </ListItemIcon>
                Mark as Delivered
              </MenuItem>
            )}

            {selectedDelivery.data?.address && (
              <MenuItem onClick={() => {
                const address = encodeURIComponent(selectedDelivery.data.address);
                window.open(`https://maps.google.com?q=${address}`, '_blank');
                handleMenuClose();
              }}>
                <ListItemIcon>
                  <DirectionsIcon fontSize="small" />
                </ListItemIcon>
                Get Directions
              </MenuItem>
            )}

            {selectedDelivery.data?.phoneNumber && (
              <MenuItem onClick={() => {
                window.open(`tel:${selectedDelivery.data.phoneNumber}`);
                handleMenuClose();
              }}>
                <ListItemIcon>
                  <PhoneIcon fontSize="small" />
                </ListItemIcon>
                Call Customer
              </MenuItem>
            )}
          </>
        )}
      </Menu>
    </Box>
  );
};

export default DeliveryNotifications;