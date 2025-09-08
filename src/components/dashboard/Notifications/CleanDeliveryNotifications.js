import React, { useState, useMemo, useCallback } from 'react';
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
  Menu,
  MenuItem,
  Card,
  CardContent,
  Grid,
  alpha,
  useTheme,
  LinearProgress,
  Stack,
  useMediaQuery
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
  Check as MarkIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';

import { formatDate } from '../../../utils/helpers/formatHelpers';
import { useNotifications } from '../../../hooks/useNotifications';

/**
 * Mobile Responsive Delivery Notifications Component - Only shows pending/scheduled deliveries
 */
const CleanDeliveryNotifications = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  
  const { notifications, loading, markAsRead, refreshNotifications } = useNotifications();

  const [menuAnchor, setMenuAnchor] = useState(null);
  const [selectedDelivery, setSelectedDelivery] = useState(null);

  // Filter only delivery notifications
  const deliveryNotifications = useMemo(() => {
    return notifications.filter(n => 
      n.type.includes('delivery')
    ).sort((a, b) => {
      // Sort by priority (overdue first) then by scheduled date
      if (a.priority !== b.priority) {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      }
      return new Date(a.data?.scheduledDate) - new Date(b.data?.scheduledDate);
    });
  }, [notifications]);

  // Group by urgency level
  const groupedDeliveries = useMemo(() => {
    const overdue = deliveryNotifications.filter(n => n.type === 'delivery_overdue');
    const dueToday = deliveryNotifications.filter(n => n.type === 'delivery_today');
    const upcoming = deliveryNotifications.filter(n => n.type === 'delivery_scheduled');

    return { overdue, dueToday, upcoming };
  }, [deliveryNotifications]);

  // Handle menu
  const handleMenuOpen = useCallback((event, delivery) => {
    event.stopPropagation();
    setMenuAnchor(event.currentTarget);
    setSelectedDelivery(delivery);
  }, []);

  const handleMenuClose = useCallback(() => {
    setMenuAnchor(null);
    setSelectedDelivery(null);
  }, []);

  // Handle delivery click
  const handleDeliveryClick = useCallback(async (delivery) => {
    if (!delivery.read) {
      await markAsRead(delivery.id);
    }
    navigate(`/sales/view/${delivery.data?.orderId}`);
  }, [markAsRead, navigate]);

  // Get delivery status config
  const getStatusConfig = useCallback((delivery) => {
    switch (delivery.type) {
      case 'delivery_overdue':
        return {
          status: 'overdue',
          label: `${delivery.data?.daysDiff || 0} days overdue`,
          color: theme.palette.error.main,
          bgColor: alpha(theme.palette.error.main, 0.1),
          icon: <ErrorIcon />,
          priority: 'high'
        };
      case 'delivery_today':
        return {
          status: 'today',
          label: 'Due Today',
          color: theme.palette.warning.main,
          bgColor: alpha(theme.palette.warning.main, 0.1),
          icon: <WarningIcon />,
          priority: 'high'
        };
      case 'delivery_scheduled':
      default:
        const scheduledDate = delivery.data?.scheduledDate;
        let label = 'Scheduled';
        if (scheduledDate) {
          const deliveryDate = new Date(scheduledDate);
          const today = new Date();
          const diffDays = Math.ceil((deliveryDate - today) / (1000 * 60 * 60 * 24));
          if (diffDays === 1) {
            label = 'Tomorrow';
          } else if (diffDays > 1) {
            label = `In ${diffDays} days`;
          }
        }
        return {
          status: 'scheduled',
          label,
          color: theme.palette.info.main,
          bgColor: alpha(theme.palette.info.main, 0.1),
          icon: <DeliveryIcon />,
          priority: 'medium'
        };
    }
  }, [theme]);

  // Render mobile summary cards
  const renderSummaryCards = useCallback(() => {
    const overdueCount = groupedDeliveries.overdue.length;
    const todayCount = groupedDeliveries.dueToday.length;
    const upcomingCount = groupedDeliveries.upcoming.length;

    return (
      <Grid container spacing={isMobile ? 1 : 2} sx={{ mb: 3 }}>
        <Grid item xs={4}>
          <Card>
            <CardContent sx={{ textAlign: 'center', py: isMobile ? 1.5 : 2 }}>
              <Typography variant={isMobile ? "h5" : "h4"} fontWeight={600} color="error.main">
                {overdueCount}
              </Typography>
              <Typography variant={isMobile ? "caption" : "body2"} color="text.secondary">
                Overdue
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={4}>
          <Card>
            <CardContent sx={{ textAlign: 'center', py: isMobile ? 1.5 : 2 }}>
              <Typography variant={isMobile ? "h5" : "h4"} fontWeight={600} color="warning.main">
                {todayCount}
              </Typography>
              <Typography variant={isMobile ? "caption" : "body2"} color="text.secondary">
                Due Today
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={4}>
          <Card>
            <CardContent sx={{ textAlign: 'center', py: isMobile ? 1.5 : 2 }}>
              <Typography variant={isMobile ? "h5" : "h4"} fontWeight={600} color="info.main">
                {upcomingCount}
              </Typography>
              <Typography variant={isMobile ? "caption" : "body2"} color="text.secondary">
                Upcoming
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    );
  }, [groupedDeliveries, isMobile]);

  // Render mobile-friendly delivery item
  const renderMobileDeliveryItem = useCallback((delivery, config) => (
    <Card 
      key={delivery.id}
      sx={{ 
        mb: 2,
        backgroundColor: delivery.read ? 'transparent' : config.bgColor,
        borderLeft: delivery.read ? 'none' : `4px solid ${config.color}`,
        cursor: 'pointer',
        '&:hover': {
          backgroundColor: alpha(config.color, 0.08)
        }
      }}
      onClick={() => handleDeliveryClick(delivery)}
    >
      <CardContent sx={{ pb: 2 }}>
        {/* Header with customer name and status */}
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 2 }}>
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
          
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="subtitle2" fontWeight={600} noWrap>
              {delivery.data?.customerName || 'Unknown Customer'}
            </Typography>
            
            <Stack direction="row" spacing={1} sx={{ mt: 0.5 }} flexWrap="wrap">
              <Chip
                label={config.label}
                size="small"
                sx={{
                  backgroundColor: config.bgColor,
                  color: config.color,
                  fontSize: '0.625rem'
                }}
              />

              {config.status === 'overdue' && (
                <Chip
                  label="OVERDUE"
                  size="small"
                  color="error"
                  sx={{ fontSize: '0.625rem', fontWeight: 600 }}
                />
              )}
              
              {config.status === 'today' && (
                <Chip
                  label="TODAY"
                  size="small"
                  color="warning"
                  sx={{ fontSize: '0.625rem', fontWeight: 600 }}
                />
              )}
            </Stack>
          </Box>
          
          <IconButton
            size="small"
            onClick={(e) => handleMenuOpen(e, delivery)}
            sx={{ alignSelf: 'flex-start' }}
          >
            <MoreVertIcon fontSize="small" />
          </IconButton>
        </Box>

        {/* Delivery Details */}
        <Stack spacing={1} sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="body2" color="text.secondary">
              Order:
            </Typography>
            <Typography variant="body2" fontWeight={500}>
              #{delivery.data?.orderNumber || delivery.data?.invoiceNumber}
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="body2" color="text.secondary">
              Items:
            </Typography>
            <Typography variant="body2">
              {delivery.data?.itemCount || 0}
            </Typography>
          </Box>
          
          {delivery.data?.scheduledDate && (
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2" color="text.secondary">
                Scheduled:
              </Typography>
              <Typography variant="body2">
                {formatDate(delivery.data.scheduledDate)}
              </Typography>
            </Box>
          )}

          {delivery.data?.address && (
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.5 }}>
              <LocationIcon fontSize="small" sx={{ mt: 0.25 }} />
              <Typography variant="body2" sx={{ flex: 1 }}>
                {delivery.data.address}
              </Typography>
            </Box>
          )}

          {delivery.data?.phoneNumber && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <PhoneIcon fontSize="small" />
              <Typography variant="body2">
                {delivery.data.phoneNumber}
              </Typography>
            </Box>
          )}
        </Stack>

        {/* Quick Actions */}
        <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
          {delivery.data?.address && (
            <Button
              variant="outlined"
              size="small"
              startIcon={<DirectionsIcon />}
              onClick={(e) => {
                e.stopPropagation();
                const address = encodeURIComponent(delivery.data.address);
                window.open(`https://maps.google.com?q=${address}`, '_blank');
              }}
              fullWidth={isMobile}
            >
              Directions
            </Button>
          )}

          {delivery.data?.phoneNumber && (
            <Button
              variant="contained"
              size="small"
              startIcon={<PhoneIcon />}
              onClick={(e) => {
                e.stopPropagation();
                window.open(`tel:${delivery.data.phoneNumber}`);
              }}
              fullWidth={isMobile}
            >
              Call
            </Button>
          )}
        </Stack>
      </CardContent>
    </Card>
  ), [isMobile, handleMenuOpen, handleDeliveryClick]);

  // Render desktop delivery item
  const renderDesktopDeliveryItem = useCallback((delivery, config) => (
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

            {config.status === 'overdue' && (
              <Chip
                label="OVERDUE"
                size="small"
                color="error"
                sx={{ fontSize: '0.625rem', fontWeight: 600 }}
              />
            )}
            
            {config.status === 'today' && (
              <Chip
                label="TODAY"
                size="small"
                color="warning"
                sx={{ fontSize: '0.625rem', fontWeight: 600 }}
              />
            )}
          </Box>
        }
        secondary={
          <Box>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Order #{delivery.data?.orderNumber || delivery.data?.invoiceNumber} • 
              Items: {delivery.data?.itemCount || 0}
            </Typography>
            
            {delivery.data?.scheduledDate && (
              <Typography variant="body2" color="text.secondary" gutterBottom>
                <strong>Scheduled:</strong> {formatDate(delivery.data.scheduledDate)}
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
  ), [handleMenuOpen, handleDeliveryClick]);

  // Render delivery group
  const renderDeliveryGroup = useCallback((title, deliveries, showEmpty = true) => {
    if (deliveries.length === 0 && !showEmpty) return null;

    return (
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" fontWeight={600} gutterBottom sx={{ px: isMobile ? 0 : 2 }}>
          {title} ({deliveries.length})
        </Typography>

        {deliveries.length > 0 ? (
          isMobile ? (
            <Box>
              {deliveries.map((delivery) => {
                const config = getStatusConfig(delivery);
                return renderMobileDeliveryItem(delivery, config);
              })}
            </Box>
          ) : (
            <List>
              {deliveries.map((delivery) => {
                const config = getStatusConfig(delivery);
                return renderDesktopDeliveryItem(delivery, config);
              })}
            </List>
          )
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
              No {title.toLowerCase()}
            </Typography>
          </Box>
        )}
      </Box>
    );
  }, [isMobile, getStatusConfig, renderMobileDeliveryItem, renderDesktopDeliveryItem]);

  if (loading) {
    return (
      <Box sx={{ p: isMobile ? 2 : 3 }}>
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
          px: isMobile ? 2 : 3,
          color: 'text.secondary'
        }}
      >
        <DeliveryIcon sx={{ fontSize: 64, mb: 2, opacity: 0.5 }} />
        <Typography variant="h6" gutterBottom>
          No delivery notifications
        </Typography>
        <Typography variant="body2" textAlign="center" sx={{ mb: 2 }}>
          All deliveries are up to date
        </Typography>
        
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={refreshNotifications}
        >
          Refresh
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: isMobile ? 2 : 3 }}>
      {/* Summary Cards */}
      {renderSummaryCards()}

      {/* Alert for urgent deliveries */}
      {(groupedDeliveries.overdue.length > 0 || groupedDeliveries.dueToday.length > 0) && (
        <Alert 
          severity={groupedDeliveries.overdue.length > 0 ? 'error' : 'warning'} 
          sx={{ mb: 3 }}
          action={
            <Button
              color="inherit"
              size="small"
              startIcon={<RefreshIcon />}
              onClick={refreshNotifications}
            >
              Refresh
            </Button>
          }
        >
          <Typography variant="subtitle2" gutterBottom>
            Urgent Deliveries
          </Typography>
          <Typography variant="body2">
            {groupedDeliveries.overdue.length > 0 && 
              `${groupedDeliveries.overdue.length} overdue deliveries need immediate attention`}
            {groupedDeliveries.overdue.length > 0 && groupedDeliveries.dueToday.length > 0 && ', '}
            {groupedDeliveries.dueToday.length > 0 && 
              `${groupedDeliveries.dueToday.length} deliveries due today`}
          </Typography>
        </Alert>
      )}

      {/* Delivery Groups */}
      {renderDeliveryGroup('Overdue Deliveries', groupedDeliveries.overdue)}
      {renderDeliveryGroup('Due Today', groupedDeliveries.dueToday)}
      {renderDeliveryGroup('Upcoming Deliveries', groupedDeliveries.upcoming, false)}

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
              <ViewIcon fontSize="small" sx={{ mr: 1 }} />
              View Order Details
            </MenuItem>

            <MenuItem onClick={() => {
              navigate(`/sales/edit/${selectedDelivery.data?.orderId}`);
              handleMenuClose();
            }}>
              <EditIcon fontSize="small" sx={{ mr: 1 }} />
              Update Delivery
            </MenuItem>

            {!selectedDelivery.read && (
              <MenuItem onClick={async () => {
                await markAsRead(selectedDelivery.id);
                handleMenuClose();
              }}>
                <MarkIcon fontSize="small" sx={{ mr: 1 }} />
                Mark as Read
              </MenuItem>
            )}

            {selectedDelivery.data?.address && (
              <MenuItem onClick={() => {
                const address = encodeURIComponent(selectedDelivery.data.address);
                window.open(`https://maps.google.com?q=${address}`, '_blank');
                handleMenuClose();
              }}>
                <DirectionsIcon fontSize="small" sx={{ mr: 1 }} />
                Get Directions
              </MenuItem>
            )}

            {selectedDelivery.data?.phoneNumber && (
              <MenuItem onClick={() => {
                window.open(`tel:${selectedDelivery.data.phoneNumber}`);
                handleMenuClose();
              }}>
                <PhoneIcon fontSize="small" sx={{ mr: 1 }} />
                Call Customer
              </MenuItem>
            )}
          </>
        )}
      </Menu>
    </Box>
  );
};

export default CleanDeliveryNotifications;