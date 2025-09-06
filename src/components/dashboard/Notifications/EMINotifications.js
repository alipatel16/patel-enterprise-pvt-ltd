import React, { useState, useEffect } from 'react';
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
  ListItemButton,
  alpha,
  useTheme
} from '@mui/material';
import {
  Payment as PaymentIcon,
  Schedule as ScheduleIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  CheckCircle as CheckCircleIcon,
  MoreVert as MoreVertIcon,
  Visibility as ViewIcon,
  Phone as PhoneIcon,
  Message as MessageIcon,
  Mark as MarkIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';

import { formatCurrency, formatDate } from '../../../utils/helpers/formatHelpers';
import { useNotifications } from '../../../hooks/useNotifications';

/**
 * EMI notifications component
 */
const EMINotifications = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const { notifications, loading, markAsRead, refreshNotifications } = useNotifications();

  const [menuAnchor, setMenuAnchor] = useState(null);
  const [selectedEMI, setSelectedEMI] = useState(null);

  // Filter EMI notifications
  const emiNotifications = notifications.filter(n => n.type === 'emi_due');

  // Group by status
  const groupedEMIs = {
    overdue: emiNotifications.filter(n => new Date(n.data?.dueDate) < new Date()),
    dueSoon: emiNotifications.filter(n => {
      const dueDate = new Date(n.data?.dueDate);
      const today = new Date();
      const diffDays = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
      return diffDays >= 0 && diffDays <= 7;
    }),
    upcoming: emiNotifications.filter(n => {
      const dueDate = new Date(n.data?.dueDate);
      const today = new Date();
      const diffDays = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
      return diffDays > 7;
    })
  };

  // Handle menu
  const handleMenuOpen = (event, emi) => {
    event.stopPropagation();
    setMenuAnchor(event.currentTarget);
    setSelectedEMI(emi);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
    setSelectedEMI(null);
  };

  // Handle EMI click
  const handleEMIClick = async (emi) => {
    if (!emi.read) {
      await markAsRead(emi.id);
    }
    navigate(`/customers/view/${emi.data?.customerId}?tab=emi`);
  };

  // Get EMI status config
  const getStatusConfig = (emi) => {
    const dueDate = new Date(emi.data?.dueDate);
    const today = new Date();
    const diffDays = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return {
        status: 'overdue',
        label: `${Math.abs(diffDays)} days overdue`,
        color: theme.palette.error.main,
        bgColor: alpha(theme.palette.error.main, 0.1),
        icon: <ErrorIcon />,
        priority: 'high'
      };
    } else if (diffDays <= 3) {
      return {
        status: 'critical',
        label: diffDays === 0 ? 'Due today' : `Due in ${diffDays} days`,
        color: theme.palette.warning.main,
        bgColor: alpha(theme.palette.warning.main, 0.1),
        icon: <WarningIcon />,
        priority: 'high'
      };
    } else if (diffDays <= 7) {
      return {
        status: 'soon',
        label: `Due in ${diffDays} days`,
        color: theme.palette.info.main,
        bgColor: alpha(theme.palette.info.main, 0.1),
        icon: <ScheduleIcon />,
        priority: 'medium'
      };
    } else {
      return {
        status: 'upcoming',
        label: `Due in ${diffDays} days`,
        color: theme.palette.success.main,
        bgColor: alpha(theme.palette.success.main, 0.1),
        icon: <PaymentIcon />,
        priority: 'low'
      };
    }
  };

  // Render EMI group
  const renderEMIGroup = (title, emis, showEmpty = true) => {
    if (emis.length === 0 && !showEmpty) return null;

    return (
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" fontWeight={600} gutterBottom sx={{ px: 2 }}>
          {title} ({emis.length})
        </Typography>

        {emis.length > 0 ? (
          <List>
            {emis.map((emi, index) => {
              const config = getStatusConfig(emi);
              
              return (
                <ListItem
                  key={emi.id}
                  onClick={() => handleEMIClick(emi)}
                  sx={{
                    cursor: 'pointer',
                    backgroundColor: emi.read ? 'transparent' : config.bgColor,
                    borderLeft: emi.read ? 'none' : `3px solid ${config.color}`,
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
                          {emi.data?.customerName || 'Unknown Customer'}
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
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          EMI Amount: {formatCurrency(emi.data?.amount)}
                        </Typography>
                        
                        <Typography variant="caption" color="text.secondary">
                          Due Date: {formatDate(emi.data?.dueDate)} • 
                          Invoice #{emi.data?.invoiceNumber}
                        </Typography>
                        
                        {emi.data?.phoneNumber && (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                            <PhoneIcon fontSize="small" />
                            <Typography variant="caption">
                              {emi.data.phoneNumber}
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    }
                  />

                  <ListItemSecondaryAction>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {/* Quick Actions */}
                      {config.status === 'overdue' || config.status === 'critical' ? (
                        <>
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              window.open(`tel:${emi.data?.phoneNumber}`);
                            }}
                            disabled={!emi.data?.phoneNumber}
                            title="Call Customer"
                          >
                            <PhoneIcon fontSize="small" />
                          </IconButton>
                          
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              window.open(`sms:${emi.data?.phoneNumber}?body=Reminder: Your EMI of ${formatCurrency(emi.data?.amount)} is due on ${formatDate(emi.data?.dueDate)}`);
                            }}
                            disabled={!emi.data?.phoneNumber}
                            title="Send SMS"
                          >
                            <MessageIcon fontSize="small" />
                          </IconButton>
                        </>
                      ) : null}

                      <IconButton
                        size="small"
                        onClick={(e) => handleMenuOpen(e, emi)}
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
              No {title.toLowerCase()} EMIs
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
          Loading EMI notifications...
        </Typography>
      </Box>
    );
  }

  if (emiNotifications.length === 0) {
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
        <PaymentIcon sx={{ fontSize: 64, mb: 2, opacity: 0.5 }} />
        <Typography variant="h6" gutterBottom>
          No EMI notifications
        </Typography>
        <Typography variant="body2" textAlign="center">
          EMI due dates and payment reminders will appear here
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
      {/* Summary Alert */}
      {(groupedEMIs.overdue.length > 0 || groupedEMIs.dueSoon.length > 0) && (
        <Alert 
          severity={groupedEMIs.overdue.length > 0 ? 'error' : 'warning'}
          sx={{ mb: 3 }}
        >
          <Typography variant="subtitle2" gutterBottom>
            Action Required
          </Typography>
          <Typography variant="body2">
            {groupedEMIs.overdue.length > 0 && 
              `${groupedEMIs.overdue.length} overdue EMI${groupedEMIs.overdue.length > 1 ? 's' : ''}`}
            {groupedEMIs.overdue.length > 0 && groupedEMIs.dueSoon.length > 0 && ', '}
            {groupedEMIs.dueSoon.length > 0 && 
              `${groupedEMIs.dueSoon.length} EMI${groupedEMIs.dueSoon.length > 1 ? 's' : ''} due within 7 days`}
          </Typography>
        </Alert>
      )}

      {/* EMI Groups */}
      {renderEMIGroup('Overdue EMIs', groupedEMIs.overdue)}
      {renderEMIGroup('Due Soon', groupedEMIs.dueSoon)}
      {renderEMIGroup('Upcoming', groupedEMIs.upcoming, false)}

      {/* Action Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
      >
        {selectedEMI && (
          <>
            <MenuItem onClick={() => {
              handleEMIClick(selectedEMI);
              handleMenuClose();
            }}>
              <ListItemIcon>
                <ViewIcon fontSize="small" />
              </ListItemIcon>
              View Customer
            </MenuItem>

            {!selectedEMI.read && (
              <MenuItem onClick={async () => {
                await markAsRead(selectedEMI.id);
                handleMenuClose();
              }}>
                <ListItemIcon>
                  <MarkIcon fontSize="small" />
                </ListItemIcon>
                Mark as Read
              </MenuItem>
            )}

            {selectedEMI.data?.phoneNumber && (
              <>
                <MenuItem onClick={() => {
                  window.open(`tel:${selectedEMI.data.phoneNumber}`);
                  handleMenuClose();
                }}>
                  <ListItemIcon>
                    <PhoneIcon fontSize="small" />
                  </ListItemIcon>
                  Call Customer
                </MenuItem>

                <MenuItem onClick={() => {
                  const message = `Reminder: Your EMI of ${formatCurrency(selectedEMI.data?.amount)} is due on ${formatDate(selectedEMI.data?.dueDate)}`;
                  window.open(`sms:${selectedEMI.data.phoneNumber}?body=${encodeURIComponent(message)}`);
                  handleMenuClose();
                }}>
                  <ListItemIcon>
                    <MessageIcon fontSize="small" />
                  </ListItemIcon>
                  Send SMS Reminder
                </MenuItem>
              </>
            )}
          </>
        )}
      </Menu>
    </Box>
  );
};

export default EMINotifications;