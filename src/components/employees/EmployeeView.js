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
  IconButton,
  Menu,
  MenuItem,
  alpha,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Work as WorkIcon,
  CalendarToday as CalendarIcon,
  LocationOn as LocationIcon,
  Security as SecurityIcon,
  Assessment as AssessmentIcon,
  Receipt as ReceiptIcon,
  TrendingUp as TrendingUpIcon,
  Group as GroupIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  MoreVert as MoreVertIcon,
  Block as BlockIcon,
  CheckCircle as ActiveIcon,
  AttachMoney as MoneyIcon
} from '@mui/icons-material';

import { useAuth } from '../../contexts/AuthContext/AuthContext';
import { USER_ROLES } from '../../utils/constants/appConstants';
import { formatCurrency, formatDate } from '../../utils/helpers/formatHelpers';
import ConfirmDialog from '../common/UI/ConfirmDialog';

/**
 * Employee view component showing detailed employee information
 * @param {Object} props
 * @param {Object} props.employee - Employee data
 * @param {function} props.onEdit - Edit callback
 * @param {function} props.onDelete - Delete callback
 * @param {function} props.onToggleStatus - Toggle status callback
 * @param {array} props.employeeSales - Employee sales data
 * @param {array} props.employeeCustomers - Employee customers
 * @param {Object} props.employeeStats - Employee statistics
 */
const EmployeeView = ({ 
  employee, 
  onEdit, 
  onDelete, 
  onToggleStatus,
  employeeSales = [],
  employeeCustomers = [],
  employeeStats = {}
}) => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { canEdit, canDelete, user } = useAuth();
  
  const [currentTab, setCurrentTab] = useState(0);
  const [actionMenuAnchor, setActionMenuAnchor] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);

  // Check if current user can manage this employee
  const canManage = user?.role === USER_ROLES.ADMIN && user?.id !== employee.id;

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

  // Handle actions
  const handleEdit = () => {
    onEdit?.(employee.id);
    handleActionMenuClose();
  };

  const handleDelete = () => {
    setDeleteDialogOpen(true);
    handleActionMenuClose();
  };

  const handleToggleStatus = () => {
    setStatusDialogOpen(true);
    handleActionMenuClose();
  };

  const handleDeleteConfirm = async () => {
    if (onDelete) {
      await onDelete(employee.id);
    }
    setDeleteDialogOpen(false);
  };

  const handleStatusConfirm = async () => {
    if (onToggleStatus) {
      await onToggleStatus(employee.id);
    }
    setStatusDialogOpen(false);
  };

  // Get employee initials
  const getInitials = () => {
    if (!employee.name) return 'E';
    return employee.name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Get role color
  const getRoleColor = () => {
    return employee.role === USER_ROLES.ADMIN 
      ? theme.palette.error.main
      : theme.palette.primary.main;
  };

  // Get status config
  const getStatusConfig = () => {
    if (employee.isActive) {
      return {
        color: theme.palette.success.main,
        label: 'Active',
        icon: <ActiveIcon />
      };
    } else {
      return {
        color: theme.palette.error.main,
        label: 'Inactive',
        icon: <BlockIcon />
      };
    }
  };

  const statusConfig = getStatusConfig();

  // Default stats
  const defaultStats = {
    totalSales: 0,
    totalRevenue: 0,
    totalCustomers: 0,
    avgOrderValue: 0,
    monthlyTarget: 0,
    targetAchievement: 0
  };

  const stats = { ...defaultStats, ...employeeStats };

  // Tab panels
  const tabPanels = [
    {
      label: 'Overview',
      icon: <AssessmentIcon />
    },
    {
      label: `Sales (${employeeSales.length})`,
      icon: <ReceiptIcon />
    },
    {
      label: `Customers (${employeeCustomers.length})`,
      icon: <GroupIcon />
    },
    {
      label: 'Performance',
      icon: <TrendingUpIcon />
    }
  ];

  return (
    <Box>
      {/* Employee Header */}
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 3 }}>
            {/* Avatar */}
            <Avatar
              sx={{
                width: { xs: 80, sm: 100 },
                height: { xs: 80, sm: 100 },
                backgroundColor: getRoleColor(),
                fontSize: { xs: '1.5rem', sm: '2rem' },
                fontWeight: 600
              }}
            >
              {getInitials()}
            </Avatar>

            {/* Employee Info */}
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                <Typography variant="h4" fontWeight={600} noWrap>
                  {employee.name}
                </Typography>
                
                <Chip
                  icon={statusConfig.icon}
                  label={statusConfig.label}
                  sx={{
                    backgroundColor: alpha(statusConfig.color, 0.1),
                    color: statusConfig.color,
                    fontWeight: 500
                  }}
                />
              </Box>

              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                <Chip
                  icon={<WorkIcon />}
                  label={employee.role === USER_ROLES.ADMIN ? 'Administrator' : 'Employee'}
                  color={employee.role === USER_ROLES.ADMIN ? 'error' : 'primary'}
                  variant="outlined"
                />
                
                {employee.designation && (
                  <Chip
                    label={employee.designation}
                    size="small"
                    variant="outlined"
                  />
                )}
                
                {employee.department && (
                  <Chip
                    label={employee.department}
                    size="small"
                    variant="outlined"
                  />
                )}
                
                <Chip
                  label={`Joined ${formatDate(employee.joinedDate)}`}
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
                      {employee.phone || 'Not provided'}
                    </Typography>
                  </Box>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <EmailIcon fontSize="small" color="action" />
                    <Typography variant="body2" noWrap>
                      {employee.email || 'Not provided'}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>

              {/* Address */}
              {employee.address && (
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                  <LocationIcon fontSize="small" color="action" sx={{ mt: 0.2 }} />
                  <Typography variant="body2" color="text.secondary">
                    {employee.address}
                  </Typography>
                </Box>
              )}
            </Box>

            {/* Actions */}
            <Box sx={{ display: 'flex', gap: 1, flexShrink: 0 }}>
              {employee.isActive && (
                <Button
                  variant="contained"
                  startIcon={<AssessmentIcon />}
                  onClick={() => navigate(`/reports/employee/${employee.id}`)}
                  size={isMobile ? 'small' : 'medium'}
                >
                  View Reports
                </Button>
              )}
              
              {canManage && (
                <IconButton onClick={handleActionMenuOpen}>
                  <MoreVertIcon />
                </IconButton>
              )}
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
                {stats.totalSales}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Sales
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={6} sm={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center', p: 2 }}>
              <Typography variant="h4" fontWeight={600} color="success.main">
                {formatCurrency(stats.totalRevenue)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Revenue
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={6} sm={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center', p: 2 }}>
              <Typography variant="h4" fontWeight={600} color="info.main">
                {stats.totalCustomers}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Customers Handled
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={6} sm={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center', p: 2 }}>
              <Typography variant="h4" fontWeight={600} color="warning.main">
                {stats.targetAchievement}%
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Target Achievement
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Permissions Card */}
      {employee.role === USER_ROLES.EMPLOYEE && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <SecurityIcon color="primary" />
              <Typography variant="h6" fontWeight={600}>
                Permissions
              </Typography>
            </Box>
            
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CheckCircleIcon 
                    fontSize="small" 
                    color={employee.canCreateInvoices ? "success" : "disabled"}
                  />
                  <Typography variant="body2" color={employee.canCreateInvoices ? "text.primary" : "text.disabled"}>
                    Create Invoices
                  </Typography>
                </Box>
              </Grid>
              
              <Grid item xs={12} sm={4}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CheckCircleIcon 
                    fontSize="small" 
                    color={employee.canManageCustomers ? "success" : "disabled"}
                  />
                  <Typography variant="body2" color={employee.canManageCustomers ? "text.primary" : "text.disabled"}>
                    Manage Customers
                  </Typography>
                </Box>
              </Grid>
              
              <Grid item xs={12} sm={4}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CheckCircleIcon 
                    fontSize="small" 
                    color={employee.canViewReports ? "success" : "disabled"}
                  />
                  <Typography variant="body2" color={employee.canViewReports ? "text.primary" : "text.disabled"}>
                    View Reports
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

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
                label={panel.label}
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
              <Grid container spacing={3}>
                {/* Personal Details */}
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>
                    Personal Details
                  </Typography>
                  
                  <List>
                    <ListItem>
                      <ListItemIcon>
                        <PersonIcon />
                      </ListItemIcon>
                      <ListItemText
                        primary="Full Name"
                        secondary={employee.name}
                      />
                    </ListItem>
                    
                    <ListItem>
                      <ListItemIcon>
                        <EmailIcon />
                      </ListItemIcon>
                      <ListItemText
                        primary="Email"
                        secondary={employee.email}
                      />
                    </ListItem>
                    
                    <ListItem>
                      <ListItemIcon>
                        <PhoneIcon />
                      </ListItemIcon>
                      <ListItemText
                        primary="Phone"
                        secondary={employee.phone}
                      />
                    </ListItem>
                    
                    {employee.emergencyContact && (
                      <ListItem>
                        <ListItemIcon>
                          <PersonIcon />
                        </ListItemIcon>
                        <ListItemText
                          primary="Emergency Contact"
                          secondary={`${employee.emergencyContact} - ${employee.emergencyPhone}`}
                        />
                      </ListItem>
                    )}
                  </List>
                </Grid>

                {/* Work Details */}
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>
                    Work Details
                  </Typography>
                  
                  <List>
                    <ListItem>
                      <ListItemIcon>
                        <WorkIcon />
                      </ListItemIcon>
                      <ListItemText
                        primary="Role"
                        secondary={employee.role === USER_ROLES.ADMIN ? 'Administrator' : 'Employee'}
                      />
                    </ListItem>
                    
                    {employee.designation && (
                      <ListItem>
                        <ListItemIcon>
                          <PersonIcon />
                        </ListItemIcon>
                        <ListItemText
                          primary="Designation"
                          secondary={employee.designation}
                        />
                      </ListItem>
                    )}
                    
                    {employee.department && (
                      <ListItem>
                        <ListItemIcon>
                          <WorkIcon />
                        </ListItemIcon>
                        <ListItemText
                          primary="Department"
                          secondary={employee.department}
                        />
                      </ListItem>
                    )}
                    
                    <ListItem>
                      <ListItemIcon>
                        <CalendarIcon />
                      </ListItemIcon>
                      <ListItemText
                        primary="Joined Date"
                        secondary={formatDate(employee.joinedDate)}
                      />
                    </ListItem>
                    
                    {employee.salary && (
                      <ListItem>
                        <ListItemIcon>
                          <MoneyIcon />
                        </ListItemIcon>
                        <ListItemText
                          primary="Monthly Salary"
                          secondary={formatCurrency(employee.salary)}
                        />
                      </ListItem>
                    )}
                  </List>
                </Grid>
              </Grid>
            </Box>
          )}

          {/* Sales Tab */}
          {currentTab === 1 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Recent Sales
              </Typography>
              {employeeSales.length > 0 ? (
                <Typography variant="body2" color="text.secondary">
                  Sales history table would be displayed here.
                </Typography>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No sales data available.
                </Typography>
              )}
            </Box>
          )}

          {/* Customers Tab */}
          {currentTab === 2 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Managed Customers
              </Typography>
              {employeeCustomers.length > 0 ? (
                <Typography variant="body2" color="text.secondary">
                  Customer list would be displayed here.
                </Typography>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No customer data available.
                </Typography>
              )}
            </Box>
          )}

          {/* Performance Tab */}
          {currentTab === 3 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Performance Metrics
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Performance charts and analytics would be displayed here.
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
          <MenuItem onClick={handleEdit}>
            <ListItemIcon>
              <EditIcon fontSize="small" />
            </ListItemIcon>
            Edit Employee
          </MenuItem>
        )}
        
        <MenuItem onClick={() => navigate(`/reports/employee/${employee.id}`)}>
          <ListItemIcon>
            <AssessmentIcon fontSize="small" />
          </ListItemIcon>
          View Detailed Reports
        </MenuItem>
        
        <Divider />
        
        {canManage && (
          <>
            <MenuItem onClick={handleToggleStatus}>
              <ListItemIcon>
                {employee.isActive ? (
                  <BlockIcon fontSize="small" color="warning" />
                ) : (
                  <ActiveIcon fontSize="small" color="success" />
                )}
              </ListItemIcon>
              {employee.isActive ? 'Deactivate' : 'Activate'} Employee
            </MenuItem>

            {canDelete() && (
              <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
                <ListItemIcon>
                  <DeleteIcon fontSize="small" color="error" />
                </ListItemIcon>
                Delete Employee
              </MenuItem>
            )}
          </>
        )}
      </Menu>

      {/* Delete Dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Employee"
        message={`Are you sure you want to delete "${employee.name}"? This will permanently remove all employee data and cannot be undone.`}
        type="delete"
        confirmText="Delete"
      />

      {/* Status Toggle Dialog */}
      <ConfirmDialog
        open={statusDialogOpen}
        onClose={() => setStatusDialogOpen(false)}
        onConfirm={handleStatusConfirm}
        title={employee.isActive ? 'Deactivate Employee' : 'Activate Employee'}
        message={
          employee.isActive
            ? `Are you sure you want to deactivate "${employee.name}"? They will lose access to the system and cannot perform any actions.`
            : `Are you sure you want to activate "${employee.name}"? They will regain access to the system based on their assigned permissions.`
        }
        type={employee.isActive ? "warning" : "info"}
        confirmText={employee.isActive ? 'Deactivate' : 'Activate'}
      />
    </Box>
  );
};

export default EmployeeView;