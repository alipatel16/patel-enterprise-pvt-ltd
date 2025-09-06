import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  Button,
  Avatar,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Tab,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Menu,
  MenuItem,
  ListItemButton,
  alpha,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Person as PersonIcon,
  Business as BusinessIcon,
  School as SchoolIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  LocationOn as LocationIcon,
  CalendarToday as CalendarIcon,
  Receipt as ReceiptIcon,
  TrendingUp as TrendingUpIcon,
  Payment as PaymentIcon,
  LocalShipping as DeliveryIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  MoreVert as MoreVertIcon,
  Add as AddIcon,
  History as HistoryIcon,
  Assessment as AssessmentIcon
} from '@mui/icons-material';

import { useAuth } from '../../contexts/AuthContext/AuthContext';
import { 
  CUSTOMER_TYPES, 
  CUSTOMER_CATEGORIES,
  PAYMENT_STATUS,
  DELIVERY_STATUS
} from '../../utils/constants/appConstants';
import { formatCurrency, formatDate } from '../../utils/helpers/formatHelpers';
import ConfirmDialog from '../common/UI/ConfirmDialog';
import NotificationBadge from '../common/UI/NotificationBadge';

/**
 * Customer view component showing detailed customer information
 * @param {Object} props
 * @param {Object} props.customer - Customer data
 * @param {function} props.onEdit - Edit callback
 * @param {function} props.onDelete - Delete callback
 * @param {array} props.orders - Customer orders
 * @param {array} props.emiSchedule - EMI schedule if any
 */
const CustomerView = ({ 
  customer, 
  onEdit, 
  onDelete, 
  orders = [],
  emiSchedule = []
}) => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { canEdit, canDelete } = useAuth();
  
  const [currentTab, setCurrentTab] = useState(0);
  const [actionMenuAnchor, setActionMenuAnchor] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
  };

  // Handle action menu
  const handleActionMenuOpen = (event) => {
    setActionMenuAnchor(event.currentTarget);
  };

  const handleActionMenuClose = () => {
    setActionMenuAnchor(null);
  };

  // Handle delete
  const handleDelete = () => {
    setDeleteDialogOpen(true);
    handleActionMenuClose();
  };

  const handleDeleteConfirm = async () => {
    if (onDelete) {
      await onDelete(customer.id);
    }
    setDeleteDialogOpen(false);
  };

  // Get category icon and info
  const getCategoryInfo = () => {
    switch (customer.category) {
      case CUSTOMER_CATEGORIES.FIRM:
        return {
          icon: <BusinessIcon />,
          label: 'Business/Firm',
          color: theme.palette.success.main
        };
      case CUSTOMER_CATEGORIES.SCHOOL:
        return {
          icon: <SchoolIcon />,
          label: 'School/Institution', 
          color: theme.palette.warning.main
        };
      default:
        return {
          icon: <PersonIcon />,
          label: 'Individual',
          color: theme.palette.info.main
        };
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

  // Calculate customer stats
  const calculateStats = () => {
    const totalOrders = orders.length;
    const totalAmount = orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
    const pendingPayments = orders.filter(order => 
      order.paymentStatus === PAYMENT_STATUS.PENDING
    ).length;
    const pendingDeliveries = orders.filter(order => 
      order.deliveryStatus === DELIVERY_STATUS.PENDING
    ).length;
    
    return {
      totalOrders,
      totalAmount,
      pendingPayments,
      pendingDeliveries,
      averageOrderValue: totalOrders > 0 ? totalAmount / totalOrders : 0
    };
  };

  const stats = calculateStats();
  const categoryInfo = getCategoryInfo();

  // Tab panels
  const tabPanels = [
    {
      label: 'Overview',
      icon: <AssessmentIcon />
    },
    {
      label: `Orders (${orders.length})`,
      icon: <ReceiptIcon />,
      badge: stats.pendingPayments + stats.pendingDeliveries
    },
    {
      label: 'EMI Schedule',
      icon: <PaymentIcon />,
      badge: emiSchedule.filter(emi => !emi.paid).length
    },
    {
      label: 'History',
      icon: <HistoryIcon />
    }
  ];

  return (
    <Box>
      {/* Customer Header */}
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 3 }}>
            {/* Avatar */}
            <Avatar
              sx={{
                width: { xs: 60, sm: 80 },
                height: { xs: 60, sm: 80 },
                backgroundColor: getTypeColor(),
                fontSize: { xs: '1.5rem', sm: '2rem' },
                fontWeight: 600
              }}
            >
              {getInitials()}
            </Avatar>

            {/* Customer Info */}
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                <Typography variant="h4" fontWeight={600} noWrap>
                  {customer.name}
                </Typography>
                
                <Chip
                  icon={categoryInfo.icon}
                  label={categoryInfo.label}
                  sx={{
                    backgroundColor: alpha(categoryInfo.color, 0.1),
                    color: categoryInfo.color,
                    fontWeight: 500
                  }}
                />
              </Box>

              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                <Chip
                  label={customer.type === CUSTOMER_TYPES.WHOLESALER ? 'Wholesaler' : 'Retailer'}
                  color={customer.type === CUSTOMER_TYPES.WHOLESALER ? 'primary' : 'secondary'}
                  variant="outlined"
                />
                
                {customer.gstNumber && (
                  <Chip
                    label={`GST: ${customer.gstNumber}`}
                    size="small"
                    variant="outlined"
                  />
                )}
                
                <Chip
                  label={`Joined ${formatDate(customer.createdAt)}`}
                  size="small"
                  variant="outlined"
                />
              </Box>

              {/* Contact Info */}
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PhoneIcon fontSize="small" color="action" />
                    <Typography variant="body2">
                      {customer.phone || 'Not provided'}
                    </Typography>
                  </Box>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <EmailIcon fontSize="small" color="action" />
                    <Typography variant="body2" noWrap>
                      {customer.email || 'Not provided'}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>

              {/* Address */}
              {customer.address && (
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                  <LocationIcon fontSize="small" color="action" sx={{ mt: 0.2 }} />
                  <Typography variant="body2" color="text.secondary">
                    {[
                      customer.address,
                      customer.city,
                      customer.state,
                      customer.pincode
                    ].filter(Boolean).join(', ')}
                  </Typography>
                </Box>
              )}
            </Box>

            {/* Actions */}
            <Box sx={{ display: 'flex', gap: 1, flexShrink: 0 }}>
              <Button
                variant="contained"
                startIcon={<ReceiptIcon />}
                onClick={() => navigate(`/sales/create?customerId=${customer.id}`)}
                size={isMobile ? 'small' : 'medium'}
              >
                New Invoice
              </Button>
              
              <IconButton onClick={handleActionMenuOpen}>
                <MoreVertIcon />
              </IconButton>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center', p: 2 }}>
              <Typography variant="h4" fontWeight={600} color="primary">
                {stats.totalOrders}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Orders
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={6} sm={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center', p: 2 }}>
              <Typography variant="h4" fontWeight={600} color="success.main">
                {formatCurrency(stats.totalAmount)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Value
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={6} sm={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center', p: 2 }}>
              <NotificationBadge count={stats.pendingPayments} color="warning">
                <Typography variant="h4" fontWeight={600} color="warning.main">
                  {stats.pendingPayments}
                </Typography>
              </NotificationBadge>
              <Typography variant="body2" color="text.secondary">
                Pending Payments
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={6} sm={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center', p: 2 }}>
              <NotificationBadge count={stats.pendingDeliveries} color="error">
                <Typography variant="h4" fontWeight={600} color="info.main">
                  {stats.pendingDeliveries}
                </Typography>
              </NotificationBadge>
              <Typography variant="body2" color="text.secondary">
                Pending Deliveries
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs 
            value={currentTab} 
            onChange={handleTabChange}
            variant={isMobile ? 'scrollable' : 'standard'}
            scrollButtons="auto"
          >
            {tabPanels.map((panel, index) => (
              <Tab
                key={index}
                icon={panel.icon}
                label={panel.badge ? (
                  <NotificationBadge count={panel.badge} size="small">
                    <span>{panel.label}</span>
                  </NotificationBadge>
                ) : panel.label}
                iconPosition="start"
                sx={{ minHeight: 48 }}
              />
            ))}
          </Tabs>
        </Box>

        {/* Tab Content */}
        <CardContent sx={{ p: 3 }}>
          {/* Overview Tab */}
          {currentTab === 0 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Customer Overview
              </Typography>
              {/* Add overview content */}
              <Typography variant="body2" color="text.secondary">
                Detailed customer analytics and insights would be displayed here.
              </Typography>
            </Box>
          )}

          {/* Orders Tab */}
          {currentTab === 1 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Order History
              </Typography>
              {/* Add orders table */}
              <Typography variant="body2" color="text.secondary">
                Customer order history table would be displayed here.
              </Typography>
            </Box>
          )}

          {/* EMI Tab */}
          {currentTab === 2 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                EMI Schedule
              </Typography>
              {/* Add EMI schedule */}
              <Typography variant="body2" color="text.secondary">
                EMI payment schedule and status would be displayed here.
              </Typography>
            </Box>
          )}

          {/* History Tab */}
          {currentTab === 3 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Activity History
              </Typography>
              {/* Add activity history */}
              <Typography variant="body2" color="text.secondary">
                Customer activity timeline would be displayed here.
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Action Menu */}
      <Menu
        anchorEl={actionMenuAnchor}
        open={Boolean(actionMenuAnchor)}
        onClose={handleActionMenuClose}
      >
        {canEdit() && (
          <MenuItem onClick={() => {
            onEdit?.();
            handleActionMenuClose();
          }}>
            <ListItemIcon>
              <EditIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Edit Customer</ListItemText>
          </MenuItem>
        )}
        
        {canDelete() && (
          <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
            <ListItemIcon>
              <DeleteIcon fontSize="small" color="error" />
            </ListItemIcon>
            <ListItemText>Delete Customer</ListItemText>
          </MenuItem>
        )}
      </Menu>

      {/* Delete Dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Customer"
        message={`Are you sure you want to delete "${customer.name}"? This will also delete all associated orders and data.`}
        type="delete"
        confirmText="Delete"
      />
    </Box>
  );
};

export default CustomerView;