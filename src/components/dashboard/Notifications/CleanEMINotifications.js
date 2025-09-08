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
  alpha,
  useTheme,
  Tooltip,
  LinearProgress,
  Stack,
  Card,
  CardContent,
  useMediaQuery
} from '@mui/material';
import {
  Payment as PaymentIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  CheckCircle as CheckCircleIcon,
  MoreVert as MoreVertIcon,
  Visibility as ViewIcon,
  Phone as PhoneIcon,
  Message as MessageIcon,
  Check as MarkIcon,
  AccountBalance as BankIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';

import { formatCurrency, formatDate } from '../../../utils/helpers/formatHelpers';
import { useNotifications } from '../../../hooks/useNotifications';
import { useSales } from '../../../contexts/SalesContext/SalesContext';
import InstallmentPaymentDialog from '../../sales/EMI/InstallmentPaymentDialog';

/**
 * Mobile Responsive EMI Notifications Component - Only shows due/overdue EMI notifications
 */
const CleanEMINotifications = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  
  const { 
    notifications, 
    loading, 
    markAsRead, 
    refreshNotifications
  } = useNotifications();
  const { recordInstallmentPayment } = useSales();

  const [menuAnchor, setMenuAnchor] = useState(null);
  const [selectedEMI, setSelectedEMI] = useState(null);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);

  // Filter only EMI notifications (due and overdue)
  const emiNotifications = useMemo(() => {
    return notifications.filter(n => 
      n.type === 'emi_due' || n.type === 'emi_overdue'
    ).sort((a, b) => {
      // Sort by priority (overdue first) then by due date
      if (a.priority !== b.priority) {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      }
      return new Date(a.data?.dueDate) - new Date(b.data?.dueDate);
    });
  }, [notifications]);

  // Group by urgency
  const groupedEMIs = useMemo(() => {
    const overdue = emiNotifications.filter(n => n.type === 'emi_overdue');
    const dueToday = emiNotifications.filter(n => {
      if (n.type !== 'emi_due') return false;
      const dueDate = new Date(n.data?.dueDate);
      const today = new Date();
      return Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24)) === 0;
    });
    const dueSoon = emiNotifications.filter(n => {
      if (n.type !== 'emi_due') return false;
      const dueDate = new Date(n.data?.dueDate);
      const today = new Date();
      const daysDiff = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
      return daysDiff > 0 && daysDiff <= 7;
    });

    return { overdue, dueToday, dueSoon };
  }, [emiNotifications]);

  // Handle payment recording
  const handlePaymentRecord = useCallback(async (installmentNumber, paymentAmount, paymentDetails) => {
    if (!selectedEMI || !recordInstallmentPayment) return;

    try {
      await recordInstallmentPayment(
        selectedEMI.data.invoiceId, 
        installmentNumber, 
        paymentAmount, 
        paymentDetails
      );
      
      await refreshNotifications();
      setPaymentDialogOpen(false);
      setSelectedEMI(null);
    } catch (error) {
      throw error;
    }
  }, [selectedEMI, recordInstallmentPayment, refreshNotifications]);

  // Handle menu
  const handleMenuOpen = useCallback((event, emi) => {
    event.stopPropagation();
    setMenuAnchor(event.currentTarget);
    setSelectedEMI(emi);
  }, []);

  const handleMenuClose = useCallback(() => {
    setMenuAnchor(null);
    setSelectedEMI(null);
  }, []);

  // Navigate to sales view
  const handleEMIClick = useCallback(async (emi) => {
    if (!emi.read) {
      await markAsRead(emi.id);
    }
    navigate(`/sales/view/${emi.data?.invoiceId}?tab=emi`);
  }, [markAsRead, navigate]);

  // Get status configuration
  const getStatusConfig = useCallback((emi) => {
    if (emi.type === 'emi_overdue') {
      return {
        status: 'overdue',
        label: `${emi.data?.daysDiff || 0} days overdue`,
        color: theme.palette.error.main,
        bgColor: alpha(theme.palette.error.main, 0.1),
        icon: <ErrorIcon />,
        priority: 'high'
      };
    }

    const dueDate = new Date(emi.data?.dueDate);
    const today = new Date();
    const diffDays = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return {
        status: 'today',
        label: 'Due today',
        color: theme.palette.warning.main,
        bgColor: alpha(theme.palette.warning.main, 0.1),
        icon: <WarningIcon />,
        priority: 'high'
      };
    } else {
      return {
        status: 'soon',
        label: `Due in ${diffDays} days`,
        color: theme.palette.info.main,
        bgColor: alpha(theme.palette.info.main, 0.1),
        icon: <PaymentIcon />,
        priority: 'medium'
      };
    }
  }, [theme]);

  // Render mobile-friendly EMI item
  const renderMobileEMIItem = useCallback((emi, config) => (
    <Card 
      key={emi.id}
      sx={{ 
        mb: 2,
        backgroundColor: emi.read ? 'transparent' : config.bgColor,
        borderLeft: emi.read ? 'none' : `4px solid ${config.color}`,
        cursor: 'pointer',
        '&:hover': {
          backgroundColor: alpha(config.color, 0.08)
        }
      }}
      onClick={() => handleEMIClick(emi)}
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
              {emi.data?.customerName || 'Unknown Customer'}
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
            </Stack>
          </Box>
          
          <IconButton
            size="small"
            onClick={(e) => handleMenuOpen(e, emi)}
            sx={{ alignSelf: 'flex-start' }}
          >
            <MoreVertIcon fontSize="small" />
          </IconButton>
        </Box>

        {/* EMI Details */}
        <Stack spacing={1} sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="body2" color="text.secondary">
              EMI Amount:
            </Typography>
            <Typography variant="body2" fontWeight={500}>
              {formatCurrency(emi.data?.amount)}
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="body2" color="text.secondary">
              Due Date:
            </Typography>
            <Typography variant="body2">
              {formatDate(emi.data?.dueDate)}
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="body2" color="text.secondary">
              Invoice:
            </Typography>
            <Typography variant="body2">
              #{emi.data?.invoiceNumber} • Installment #{emi.data?.installmentNumber}
            </Typography>
          </Box>
          
          {emi.data?.phoneNumber && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <PhoneIcon fontSize="small" />
              <Typography variant="body2">
                {emi.data.phoneNumber}
              </Typography>
            </Box>
          )}
        </Stack>

        {/* Quick Actions */}
        <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
          {recordInstallmentPayment && (
            <Button
              variant="contained"
              size="small"
              startIcon={<BankIcon />}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedEMI(emi);
                setPaymentDialogOpen(true);
              }}
              fullWidth={isMobile}
            >
              Record Payment
            </Button>
          )}

          {emi.data?.phoneNumber && (
            <>
              <Tooltip title="Call Customer">
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    window.open(`tel:${emi.data?.phoneNumber}`);
                  }}
                >
                  <PhoneIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              
              <Tooltip title="Send SMS">
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    const message = `Reminder: Your EMI of ${formatCurrency(emi.data?.amount)} is due on ${formatDate(emi.data?.dueDate)}`;
                    window.open(`sms:${emi.data?.phoneNumber}?body=${encodeURIComponent(message)}`);
                  }}
                >
                  <MessageIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </>
          )}
        </Stack>
      </CardContent>
    </Card>
  ), [isMobile, recordInstallmentPayment, handleMenuOpen, handleEMIClick]);

  // Render desktop EMI item
  const renderDesktopEMIItem = useCallback((emi, config) => (
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

            {config.status === 'overdue' && (
              <Chip
                label="OVERDUE"
                size="small"
                color="error"
                sx={{ fontSize: '0.625rem', fontWeight: 600 }}
              />
            )}
          </Box>
        }
        secondary={
          <Box>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              EMI Amount: {formatCurrency(emi.data?.amount)}
            </Typography>
            
            <Typography variant="caption" color="text.secondary">
              Due Date: {formatDate(emi.data?.dueDate)} • 
              Invoice #{emi.data?.invoiceNumber} • 
              Installment #{emi.data?.installmentNumber}
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
          {recordInstallmentPayment && (
            <Tooltip title="Record Payment">
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedEMI(emi);
                  setPaymentDialogOpen(true);
                }}
                color="primary"
              >
                <BankIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}

          {emi.data?.phoneNumber && (
            <>
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  window.open(`tel:${emi.data?.phoneNumber}`);
                }}
                title="Call Customer"
              >
                <PhoneIcon fontSize="small" />
              </IconButton>
              
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  const message = `Reminder: Your EMI of ${formatCurrency(emi.data?.amount)} is due on ${formatDate(emi.data?.dueDate)}`;
                  window.open(`sms:${emi.data?.phoneNumber}?body=${encodeURIComponent(message)}`);
                }}
                title="Send SMS"
              >
                <MessageIcon fontSize="small" />
              </IconButton>
            </>
          )}

          <IconButton
            size="small"
            onClick={(e) => handleMenuOpen(e, emi)}
          >
            <MoreVertIcon fontSize="small" />
          </IconButton>
        </Box>
      </ListItemSecondaryAction>
    </ListItem>
  ), [recordInstallmentPayment, handleMenuOpen, handleEMIClick]);

  // Render EMI group
  const renderEMIGroup = useCallback((title, emis, showEmpty = true) => {
    if (emis.length === 0 && !showEmpty) return null;

    return (
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" fontWeight={600} gutterBottom sx={{ px: isMobile ? 0 : 2 }}>
          {title} ({emis.length})
        </Typography>

        {emis.length > 0 ? (
          isMobile ? (
            <Box>
              {emis.map((emi) => {
                const config = getStatusConfig(emi);
                return renderMobileEMIItem(emi, config);
              })}
            </Box>
          ) : (
            <List>
              {emis.map((emi) => {
                const config = getStatusConfig(emi);
                return renderDesktopEMIItem(emi, config);
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
  }, [isMobile, getStatusConfig, renderMobileEMIItem, renderDesktopEMIItem]);

  if (loading) {
    return (
      <Box sx={{ p: isMobile ? 2 : 3 }}>
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
          px: isMobile ? 2 : 3,
          color: 'text.secondary'
        }}
      >
        <PaymentIcon sx={{ fontSize: 64, mb: 2, opacity: 0.5 }} />
        <Typography variant="h6" gutterBottom>
          No EMI notifications
        </Typography>
        <Typography variant="body2" textAlign="center" sx={{ mb: 2 }}>
          All EMI payments are up to date
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
      {/* Summary Alert */}
      {(groupedEMIs.overdue.length > 0 || groupedEMIs.dueToday.length > 0) && (
        <Alert 
          severity={groupedEMIs.overdue.length > 0 ? 'error' : 'warning'}
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
            Urgent EMI Payments
          </Typography>
          <Typography variant="body2">
            {groupedEMIs.overdue.length > 0 && 
              `${groupedEMIs.overdue.length} overdue payment${groupedEMIs.overdue.length > 1 ? 's' : ''}`}
            {groupedEMIs.overdue.length > 0 && groupedEMIs.dueToday.length > 0 && ', '}
            {groupedEMIs.dueToday.length > 0 && 
              `${groupedEMIs.dueToday.length} payment${groupedEMIs.dueToday.length > 1 ? 's' : ''} due today`}
          </Typography>
        </Alert>
      )}

      {/* EMI Groups */}
      {renderEMIGroup('Overdue Payments', groupedEMIs.overdue)}
      {renderEMIGroup('Due Today', groupedEMIs.dueToday)}
      {renderEMIGroup('Due Soon', groupedEMIs.dueSoon, false)}

      {/* Payment Dialog */}
      {recordInstallmentPayment && paymentDialogOpen && selectedEMI && (
        <InstallmentPaymentDialog
          open={paymentDialogOpen}
          onClose={() => {
            setPaymentDialogOpen(false);
            setSelectedEMI(null);
          }}
          installment={{
            installmentNumber: selectedEMI.data?.installmentNumber,
            amount: selectedEMI.data?.amount,
            dueDate: selectedEMI.data?.dueDate,
            isOverdue: selectedEMI.type === 'emi_overdue',
            isDueToday: selectedEMI.type === 'emi_due' && Math.ceil((new Date(selectedEMI.data?.dueDate) - new Date()) / (1000 * 60 * 60 * 24)) === 0,
            daysDiff: selectedEMI.data?.daysDiff || 0
          }}
          invoice={{
            id: selectedEMI.data?.invoiceId,
            invoiceNumber: selectedEMI.data?.invoiceNumber,
            customerName: selectedEMI.data?.customerName
          }}
          onPaymentRecorded={handlePaymentRecord}
        />
      )}

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
              <ViewIcon fontSize="small" sx={{ mr: 1 }} />
              View Invoice Details
            </MenuItem>

            {!selectedEMI.read && (
              <MenuItem onClick={async () => {
                await markAsRead(selectedEMI.id);
                handleMenuClose();
              }}>
                <MarkIcon fontSize="small" sx={{ mr: 1 }} />
                Mark as Read
              </MenuItem>
            )}

            {selectedEMI.data?.phoneNumber && (
              <>
                <MenuItem onClick={() => {
                  window.open(`tel:${selectedEMI.data.phoneNumber}`);
                  handleMenuClose();
                }}>
                  <PhoneIcon fontSize="small" sx={{ mr: 1 }} />
                  Call Customer
                </MenuItem>

                <MenuItem onClick={() => {
                  const message = `Reminder: Your EMI of ${formatCurrency(selectedEMI.data?.amount)} is due on ${formatDate(selectedEMI.data?.dueDate)}`;
                  window.open(`sms:${selectedEMI.data.phoneNumber}?body=${encodeURIComponent(message)}`);
                  handleMenuClose();
                }}>
                  <MessageIcon fontSize="small" sx={{ mr: 1 }} />
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

export default CleanEMINotifications;