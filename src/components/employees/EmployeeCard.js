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
  Email as EmailIcon,
  Phone as PhoneIcon,
  Work as WorkIcon,
  Assessment as AssessmentIcon,
  Block as BlockIcon,
  CheckCircle as ActiveIcon
} from '@mui/icons-material';

import { useEmployee } from '../../contexts/EmployeeContext/EmployeeContext';
import { useAuth } from '../../contexts/AuthContext/AuthContext';
import { USER_ROLES } from '../../utils/constants/appConstants';
import { formatDate } from '../../utils/helpers/formatHelpers';
import ConfirmDialog from '../common/UI/ConfirmDialog';

/**
 * Employee card component for displaying employee information
 * @param {Object} props
 * @param {Object} props.employee - Employee data
 * @param {function} props.onUpdate - Update callback
 * @param {function} props.onDelete - Delete callback
 * @param {boolean} props.compact - Compact view
 */
const EmployeeCard = ({ 
  employee, 
  onUpdate, 
  onDelete, 
  compact = false,
  showActions = true,
  clickable = true
}) => {
  const navigate = useNavigate();
  const theme = useTheme();
  const { deleteEmployee, toggleEmployeeStatus } = useEmployee();
  const { canDelete, canEdit, user } = useAuth();
  
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Check if current user can manage this employee
  const canManage = user?.role === USER_ROLES.ADMIN && user?.id !== employee.id;

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
    navigate(`/employees/view/${employee.id}`);
    handleMenuClose();
  };

  const handleEdit = () => {
    navigate(`/employees/edit/${employee.id}`);
    handleMenuClose();
  };

  const handleDeleteClick = () => {
    setDeleteDialogOpen(true);
    handleMenuClose();
  };

  const handleToggleStatus = () => {
    setStatusDialogOpen(true);
    handleMenuClose();
  };

  const handleDeleteConfirm = async () => {
    try {
      setDeleting(true);
      await deleteEmployee(employee.id);
      
      if (onDelete) {
        onDelete(employee.id);
      }
      
      setDeleteDialogOpen(false);
    } catch (error) {
      console.error('Error deleting employee:', error);
    } finally {
      setDeleting(false);
    }
  };

  const handleStatusConfirm = async () => {
    try {
      setUpdatingStatus(true);
      await toggleEmployeeStatus(employee.id);
      
      if (onUpdate) {
        onUpdate();
      }
      
      setStatusDialogOpen(false);
    } catch (error) {
      console.error('Error updating employee status:', error);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleCardClick = () => {
    if (clickable) {
      navigate(`/employees/view/${employee.id}`);
    }
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
          opacity: employee.isActive ? 1 : 0.7,
          '&:hover': clickable ? {
            transform: 'translateY(-2px)',
            boxShadow: theme.shadows[4],
            '& .employee-card-actions': {
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
            background: `linear-gradient(135deg, ${getRoleColor()}15, ${getRoleColor()}05)`,
            borderBottom: `1px solid ${alpha(getRoleColor(), 0.1)}`,
            p: compact ? 1.5 : 2
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
            {/* Avatar */}
            <Avatar
              sx={{
                width: compact ? 40 : 48,
                height: compact ? 40 : 48,
                backgroundColor: getRoleColor(),
                fontSize: compact ? '1rem' : '1.2rem',
                fontWeight: 600
              }}
            >
              {getInitials()}
            </Avatar>

            {/* Employee Info */}
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography 
                variant={compact ? "subtitle2" : "h6"} 
                fontWeight={600}
                noWrap
                sx={{ mb: 0.5 }}
              >
                {employee.name}
              </Typography>
              
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <WorkIcon fontSize="small" />
                <Typography variant="caption" color="text.secondary">
                  {employee.role === USER_ROLES.ADMIN ? 'Administrator' : 'Employee'}
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                <Chip
                  icon={statusConfig.icon}
                  label={statusConfig.label}
                  size="small"
                  sx={{
                    backgroundColor: alpha(statusConfig.color, 0.1),
                    color: statusConfig.color,
                    fontWeight: 500,
                    fontSize: '0.75rem'
                  }}
                />
                
                {employee.department && (
                  <Chip
                    label={employee.department}
                    size="small"
                    variant="outlined"
                  />
                )}
              </Box>
            </Box>

            {/* Actions Menu */}
            {showActions && canManage && (
              <IconButton
                onClick={handleMenuOpen}
                size="small"
                className="employee-card-actions"
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
            {employee.phone && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <PhoneIcon fontSize="small" color="action" />
                <Typography variant="body2" color="text.secondary" noWrap>
                  {employee.phone}
                </Typography>
              </Box>
            )}

            {employee.email && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <EmailIcon fontSize="small" color="action" />
                <Typography variant="body2" color="text.secondary" noWrap>
                  {employee.email}
                </Typography>
              </Box>
            )}

            {employee.designation && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <PersonIcon fontSize="small" color="action" />
                <Typography variant="body2" color="text.secondary" noWrap>
                  {employee.designation}
                </Typography>
              </Box>
            )}

            {/* Employee Stats */}
            {!compact && (
              <>
                <Divider sx={{ my: 1 }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h6" fontWeight={600} color="primary">
                      {employee.totalSales || 0}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Sales
                    </Typography>
                  </Box>
                  
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h6" fontWeight={600} color="success.main">
                      {employee.totalCustomers || 0}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Customers
                    </Typography>
                  </Box>
                </Box>

                {employee.joinedDate && (
                  <Typography variant="caption" color="text.secondary" textAlign="center">
                    Joined: {formatDate(employee.joinedDate)}
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
              startIcon={<AssessmentIcon />}
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/reports/employee/${employee.id}`);
              }}
            >
              Reports
            </Button>

            <Box sx={{ flex: 1 }} />

            {employee.isActive ? (
              <Chip
                icon={<ActiveIcon />}
                label="Active"
                size="small"
                color="success"
                variant="outlined"
              />
            ) : (
              <Chip
                icon={<BlockIcon />}
                label="Inactive"
                size="small"
                color="error"
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
            <ListItemText>Edit Employee</ListItemText>
          </MenuItem>
        )}

        <MenuItem onClick={() => navigate(`/reports/employee/${employee.id}`)}>
          <ListItemIcon>
            <AssessmentIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>View Reports</ListItemText>
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
              <ListItemText>
                {employee.isActive ? 'Deactivate' : 'Activate'} Employee
              </ListItemText>
            </MenuItem>

            {canDelete() && (
              <MenuItem onClick={handleDeleteClick} sx={{ color: 'error.main' }}>
                <ListItemIcon>
                  <DeleteIcon fontSize="small" color="error" />
                </ListItemIcon>
                <ListItemText>Delete Employee</ListItemText>
              </MenuItem>
            )}
          </>
        )}
      </Menu>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Employee"
        message={`Are you sure you want to delete "${employee.name}"? This action cannot be undone and will remove all associated data.`}
        type="delete"
        confirmText="Delete"
        loading={deleting}
      />

      {/* Status Change Confirmation Dialog */}
      <ConfirmDialog
        open={statusDialogOpen}
        onClose={() => setStatusDialogOpen(false)}
        onConfirm={handleStatusConfirm}
        title={employee.isActive ? 'Deactivate Employee' : 'Activate Employee'}
        message={
          employee.isActive
            ? `Are you sure you want to deactivate "${employee.name}"? They will lose access to the system.`
            : `Are you sure you want to activate "${employee.name}"? They will regain access to the system.`
        }
        type={employee.isActive ? "warning" : "info"}
        confirmText={employee.isActive ? 'Deactivate' : 'Activate'}
        loading={updatingStatus}
      />
    </>
  );
};

export default EmployeeCard;