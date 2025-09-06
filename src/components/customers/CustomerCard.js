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
  Person as PersonIcon,
  Business as BusinessIcon,
  School as SchoolIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  LocationOn as LocationIcon,
  Receipt as ReceiptIcon,
  TrendingUp as TrendingUpIcon
} from '@mui/icons-material';

import { useCustomer } from '../../contexts/CustomerContext/CustomerContext';
import { useAuth } from '../../contexts/AuthContext/AuthContext';
import { 
  CUSTOMER_TYPES, 
  CUSTOMER_CATEGORIES 
} from '../../utils/constants/appConstants';
import { formatCurrency, formatDate } from '../../utils/helpers/formatHelpers';
import ConfirmDialog from '../common/UI/ConfirmDialog';

/**
 * Customer card component for displaying customer information
 * @param {Object} props
 * @param {Object} props.customer - Customer data
 * @param {function} props.onUpdate - Update callback
 * @param {function} props.onDelete - Delete callback
 * @param {boolean} props.compact - Compact view
 */
const CustomerCard = ({ 
  customer, 
  onUpdate, 
  onDelete, 
  compact = false,
  showActions = true,
  clickable = true
}) => {
  const navigate = useNavigate();
  const theme = useTheme();
  const { deleteCustomer } = useCustomer();
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
    navigate(`/customers/view/${customer.id}`);
    handleMenuClose();
  };

  const handleEdit = () => {
    navigate(`/customers/edit/${customer.id}`);
    handleMenuClose();
  };

  const handleDeleteClick = () => {
    setDeleteDialogOpen(true);
    handleMenuClose();
  };

  const handleDeleteConfirm = async () => {
    try {
      setDeleting(true);
      await deleteCustomer(customer.id);
      
      if (onDelete) {
        onDelete(customer.id);
      }
      
      setDeleteDialogOpen(false);
    } catch (error) {
      console.error('Error deleting customer:', error);
    } finally {
      setDeleting(false);
    }
  };

  const handleCardClick = () => {
    if (clickable) {
      navigate(`/customers/view/${customer.id}`);
    }
  };

  // Get category icon
  const getCategoryIcon = () => {
    switch (customer.category) {
      case CUSTOMER_CATEGORIES.FIRM:
        return <BusinessIcon />;
      case CUSTOMER_CATEGORIES.SCHOOL:
        return <SchoolIcon />;
      default:
        return <PersonIcon />;
    }
  };

  // Get customer initials
  const getInitials = () => {
    if (!customer.name) return 'C';
    return customer.name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Get type color
  const getTypeColor = () => {
    return customer.type === CUSTOMER_TYPES.WHOLESALER 
      ? theme.palette.primary.main
      : theme.palette.secondary.main;
  };

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
            '& .customer-card-actions': {
              opacity: 1
            }
          } : {},
          borderRadius: 2,
          overflow: 'hidden'
        }}
      >
        {/* Header */}
        <Box
          sx={{
            background: `linear-gradient(135deg, ${getTypeColor()}15, ${getTypeColor()}05)`,
            borderBottom: `1px solid ${alpha(getTypeColor(), 0.1)}`,
            p: compact ? 1.5 : 2
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
            {/* Avatar */}
            <Avatar
              sx={{
                width: compact ? 40 : 48,
                height: compact ? 40 : 48,
                backgroundColor: getTypeColor(),
                fontSize: compact ? '1rem' : '1.2rem',
                fontWeight: 600
              }}
            >
              {getInitials()}
            </Avatar>

            {/* Customer Info */}
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography 
                variant={compact ? "subtitle2" : "h6"} 
                fontWeight={600}
                noWrap
                sx={{ mb: 0.5 }}
              >
                {customer.name}
              </Typography>
              
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                {getCategoryIcon()}
                <Typography variant="caption" color="text.secondary">
                  {customer.category?.charAt(0).toUpperCase() + customer.category?.slice(1)}
                </Typography>
              </Box>

              <Chip
                label={customer.type === CUSTOMER_TYPES.WHOLESALER ? 'Wholesaler' : 'Retailer'}
                size="small"
                sx={{
                  backgroundColor: alpha(getTypeColor(), 0.1),
                  color: getTypeColor(),
                  fontWeight: 500,
                  fontSize: '0.75rem'
                }}
              />
            </Box>

            {/* Actions Menu */}
            {showActions && (
              <IconButton
                onClick={handleMenuOpen}
                size="small"
                className="customer-card-actions"
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
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {/* Contact Info */}
            {customer.phone && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <PhoneIcon fontSize="small" color="action" />
                <Typography variant="body2" color="text.secondary" noWrap>
                  {customer.phone}
                </Typography>
              </Box>
            )}

            {customer.email && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <EmailIcon fontSize="small" color="action" />
                <Typography variant="body2" color="text.secondary" noWrap>
                  {customer.email}
                </Typography>
              </Box>
            )}

            {customer.city && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <LocationIcon fontSize="small" color="action" />
                <Typography variant="body2" color="text.secondary" noWrap>
                  {customer.city}
                </Typography>
              </Box>
            )}

            {/* Business Stats */}
            {!compact && (
              <>
                <Divider sx={{ my: 1 }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h6" fontWeight={600} color="primary">
                      {customer.totalOrders || 0}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Orders
                    </Typography>
                  </Box>
                  
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h6" fontWeight={600} color="success.main">
                      {formatCurrency(customer.totalAmount || 0)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Total Value
                    </Typography>
                  </Box>
                </Box>

                {customer.lastOrderDate && (
                  <Typography variant="caption" color="text.secondary" textAlign="center">
                    Last order: {formatDate(customer.lastOrderDate)}
                  </Typography>
                )}
              </>
            )}
          </Box>
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
              startIcon={<ReceiptIcon />}
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/sales/create?customerId=${customer.id}`);
              }}
            >
              Invoice
            </Button>

            <Box sx={{ flex: 1 }} />

            {customer.totalOrders > 0 && (
              <Chip
                icon={<TrendingUpIcon />}
                label="Active"
                size="small"
                color="success"
                variant="outlined"
              />
            )}
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
          <ListItemText>View Details</ListItemText>
        </MenuItem>

        {canEdit() && (
          <MenuItem onClick={handleEdit}>
            <ListItemIcon>
              <EditIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Edit Customer</ListItemText>
          </MenuItem>
        )}

        <MenuItem onClick={() => navigate(`/sales/create?customerId=${customer.id}`)}>
          <ListItemIcon>
            <ReceiptIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Create Invoice</ListItemText>
        </MenuItem>

        {canDelete() && (
          <MenuItem onClick={handleDeleteClick} sx={{ color: 'error.main' }}>
            <ListItemIcon>
              <DeleteIcon fontSize="small" color="error" />
            </ListItemIcon>
            <ListItemText>Delete Customer</ListItemText>
          </MenuItem>
        )}
      </Menu>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Customer"
        message={`Are you sure you want to delete "${customer.name}"? This action cannot be undone.`}
        type="delete"
        confirmText="Delete"
        loading={deleting}
      />
    </>
  );
};

export default CustomerCard;