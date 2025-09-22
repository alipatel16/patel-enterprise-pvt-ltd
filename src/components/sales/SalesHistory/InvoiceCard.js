import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Box,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Avatar,
  Chip,
  Button,
  Divider,
  alpha,
  useTheme
} from '@mui/material';
import {
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Receipt as ReceiptIcon,
  Print as PrintIcon,
  Email as EmailIcon,
  Schedule as ScheduleIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  LocalShipping as DeliveryIcon
} from '@mui/icons-material';

import { useAuth } from '../../../contexts/AuthContext/AuthContext';
import { 
  PAYMENT_STATUS,
  DELIVERY_STATUS 
} from '../../../utils/constants/appConstants';
import { formatCurrency, formatDate } from '../../../utils/helpers/formatHelpers';
import ConfirmDialog from '../../common/UI/ConfirmDialog';

/**
 * Invoice card component for displaying invoice in sales history
 * @param {Object} props
 * @param {Object} props.invoice - Invoice data
 * @param {function} props.onUpdate - Update callback
 * @param {function} props.onDelete - Delete callback
 * @param {boolean} props.compact - Compact view
 */
const InvoiceCard = ({ 
  invoice, 
  onUpdate, 
  onDelete, 
  compact = false,
  showActions = true,
  clickable = true
}) => {
  const navigate = useNavigate();
  const theme = useTheme();
  const { canDelete, canEdit } = useAuth();
  
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Handle menu
  const handleMenuOpen = (event) => {
    event.stopPropagation();
    setMenuAnchor(event.currentTarget);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
  };

  // Handle actions
  const handleView = () => {
    navigate(`/sales/view/${invoice.id}`);
    handleMenuClose();
  };

  const handleEdit = () => {
    navigate(`/sales/edit/${invoice.id}`);
    handleMenuClose();
  };

  const handleDeleteClick = () => {
    setDeleteDialogOpen(true);
    handleMenuClose();
  };

  const handleDeleteConfirm = async () => {
    try {
      setDeleting(true);
      if (onDelete) {
        await onDelete(invoice.id);
      }
      setDeleteDialogOpen(false);
    } catch (error) {
      console.error('Error deleting invoice:', error);
    } finally {
      setDeleting(false);
    }
  };

  const handleCardClick = () => {
    if (clickable) {
      navigate(`/sales/view/${invoice.id}`);
    }
  };

  // Get payment status config
  const getPaymentStatusConfig = () => {
    switch (invoice.paymentStatus) {
      case PAYMENT_STATUS.PAID:
        return {
          color: theme.palette.success.main,
          label: 'Paid',
          icon: <CheckCircleIcon />
        };
      case PAYMENT_STATUS.EMI:
        return {
          color: theme.palette.info.main,
          label: 'EMI',
          icon: <ScheduleIcon />
        };
      default:
        return {
          color: theme.palette.warning.main,
          label: 'Pending',
          icon: <WarningIcon />
        };
    }
  };

  // Get delivery status config
  const getDeliveryStatusConfig = () => {
    switch (invoice.deliveryStatus) {
      case DELIVERY_STATUS.DELIVERED:
        return {
          color: theme.palette.success.main,
          label: 'Delivered',
          icon: <CheckCircleIcon />
        };
      case DELIVERY_STATUS.SCHEDULED:
        return {
          color: theme.palette.info.main,
          label: 'Scheduled',
          icon: <ScheduleIcon />
        };
      default:
        return {
          color: theme.palette.warning.main,
          label: 'Pending',
          icon: <DeliveryIcon />
        };
    }
  };

  // Get customer initials
  const getCustomerInitials = () => {
    if (!invoice.customer?.name) return 'C';
    return invoice.customer.name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const paymentConfig = getPaymentStatusConfig();
  const deliveryConfig = getDeliveryStatusConfig();

  // Check if invoice is overdue
  const isOverdue = invoice.dueDate && new Date(invoice.dueDate) < new Date() && invoice.paymentStatus === PAYMENT_STATUS.PENDING;

  return (
    <>
      <Card
        onClick={handleCardClick}
        sx={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          cursor: clickable ? 'pointer' : 'default',
          transition: 'all 0.3s ease',
          '&:hover': clickable ? {
            transform: 'translateY(-2px)',
            boxShadow: theme.shadows[4],
            '& .invoice-card-actions': {
              opacity: 1
            }
          } : {},
          borderRadius: 2,
          overflow: 'hidden',
          borderLeft: isOverdue ? `4px solid ${theme.palette.error.main}` : 'none'
        }}
      >
        {/* Header */}
        <Box
          sx={{
            background: `linear-gradient(135deg, ${theme.palette.primary.main}15, ${theme.palette.secondary.main}05)`,
            borderBottom: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
            p: compact ? 1.5 : 2
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
            {/* Invoice Icon */}
            <Avatar
              sx={{
                width: compact ? 32 : 40,
                height: compact ? 32 : 40,
                backgroundColor: theme.palette.primary.main,
                fontSize: compact ? '0.875rem' : '1rem'
              }}
            >
              <ReceiptIcon />
            </Avatar>

            {/* Invoice Info */}
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography 
                variant={compact ? "subtitle2" : "h6"} 
                fontWeight={600}
                noWrap
                sx={{ mb: 0.5 }}
              >
                #{invoice.invoiceNumber}
              </Typography>
              
              <Typography variant="caption" color="text.secondary" display="block">
                {formatDate(invoice.date)}
              </Typography>

              {/* Status Chips */}
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
                <Chip
                  icon={paymentConfig.icon}
                  label={paymentConfig.label}
                  size="small"
                  sx={{
                    backgroundColor: alpha(paymentConfig.color, 0.1),
                    color: paymentConfig.color,
                    fontSize: '0.625rem',
                    height: 20
                  }}
                />
                
                <Chip
                  icon={deliveryConfig.icon}
                  label={deliveryConfig.label}
                  size="small"
                  sx={{
                    backgroundColor: alpha(deliveryConfig.color, 0.1),
                    color: deliveryConfig.color,
                    fontSize: '0.625rem',
                    height: 20
                  }}
                />

                {isOverdue && (
                  <Chip
                    label="Overdue"
                    size="small"
                    color="error"
                    sx={{ fontSize: '0.625rem', height: 20 }}
                  />
                )}
              </Box>
            </Box>

            {/* Actions Menu */}
            {showActions && (
              <IconButton
                onClick={handleMenuOpen}
                size="small"
                className="invoice-card-actions"
                sx={{
                  opacity: 0,
                  transition: 'opacity 0.3s ease'
                }}
              >
                <MoreVertIcon />
              </IconButton>
            )}
          </Box>
        </Box>

        {/* Content */}
        <CardContent sx={{ flex: 1, p: compact ? 1.5 : 2 }}>
          {/* Customer Info */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
            <Avatar
              sx={{
                width: 24,
                height: 24,
                fontSize: '0.75rem',
                backgroundColor: alpha(theme.palette.secondary.main, 0.1),
                color: theme.palette.secondary.main
              }}
            >
              {getCustomerInitials()}
            </Avatar>
            
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Typography variant="body2" fontWeight={500} noWrap>
                {invoice.customer?.name || 'Unknown Customer'}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {invoice.customer?.type?.charAt(0).toUpperCase() + invoice.customer?.type?.slice(1)}
              </Typography>
            </Box>
          </Box>

          {/* Amount */}
          <Box sx={{ textAlign: 'center', mb: 2 }}>
            <Typography variant="h5" fontWeight={700} color="success.main">
              {formatCurrency(invoice.totalAmount)}
            </Typography>
            {invoice.items?.length && (
              <Typography variant="caption" color="text.secondary">
                {invoice.items.length} item{invoice.items.length > 1 ? 's' : ''}
              </Typography>
            )}
          </Box>

          {/* Additional Info */}
          {!compact && (
            <>
              <Divider sx={{ my: 1 }} />
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                {invoice.dueDate && (
                  <Box sx={{ textAlign: 'left' }}>
                    <Typography variant="caption" color="text.secondary">
                      Due Date
                    </Typography>
                    <Typography variant="body2" fontWeight={500}>
                      {formatDate(invoice.dueDate)}
                    </Typography>
                  </Box>
                )}
                
                {invoice.emiDetails?.monthlyAmount && (
                  <Box sx={{ textAlign: 'right' }}>
                    <Typography variant="caption" color="text.secondary">
                      EMI
                    </Typography>
                    <Typography variant="body2" fontWeight={500}>
                      {formatCurrency(invoice.emiDetails.monthlyAmount)}/month
                    </Typography>
                  </Box>
                )}
              </Box>
            </>
          )}
        </CardContent>

        {/* Actions */}
        {showActions && !compact && (
          <CardActions sx={{ p: 2, pt: 0, gap: 1 }}>
            <Button
              size="small"
              startIcon={<ViewIcon />}
              onClick={(e) => {
                e.stopPropagation();
                handleView();
              }}
            >
              View
            </Button>
            
            <Button
              size="small"
              startIcon={<PrintIcon />}
              onClick={(e) => {
                e.stopPropagation();
                window.print();
              }}
            >
              Print
            </Button>

            <Box sx={{ flex: 1 }} />

            {/* Status indicators */}
            <Box sx={{ display: 'flex', gap: 0.5 }}>
              {invoice.paymentStatus === PAYMENT_STATUS.PAID && (
                <CheckCircleIcon fontSize="small" color="success" />
              )}
              {invoice.deliveryStatus === DELIVERY_STATUS.DELIVERED && (
                <DeliveryIcon fontSize="small" color="success" />
              )}
              {isOverdue && (
                <WarningIcon fontSize="small" color="error" />
              )}
            </Box>
          </CardActions>
        )}
      </Card>

      {/* Action Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <MenuItem onClick={handleView}>
          <ListItemIcon>
            <ViewIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>View Invoice</ListItemText>
        </MenuItem>

        {canEdit() && (
          <MenuItem onClick={handleEdit}>
            <ListItemIcon>
              <EditIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Edit Invoice</ListItemText>
          </MenuItem>
        )}

        <MenuItem onClick={() => window.print()}>
          <ListItemIcon>
            <PrintIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Print Invoice</ListItemText>
        </MenuItem>

        <MenuItem onClick={() => {
          const subject = `Invoice ${invoice.invoiceNumber}`;
          const body = `Please find invoice ${invoice.invoiceNumber} for amount ${formatCurrency(invoice.totalAmount)}`;
          window.open(`mailto:${invoice.customer?.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
          handleMenuClose();
        }}>
          <ListItemIcon>
            <EmailIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Email Invoice</ListItemText>
        </MenuItem>

        <Divider />

        {canDelete() && (
          <MenuItem onClick={handleDeleteClick} sx={{ color: 'error.main' }}>
            <ListItemIcon>
              <DeleteIcon fontSize="small" color="error" />
            </ListItemIcon>
            <ListItemText>Delete Invoice</ListItemText>
          </MenuItem>
        )}
      </Menu>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Invoice"
        message={`Are you sure you want to delete invoice "${invoice.invoiceNumber}"? This action cannot be undone.`}
        type="delete"
        confirmText="Delete"
        loading={deleting}
      />
    </>
  );
};

export default InvoiceCard;