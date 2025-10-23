import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import {
  MoreVert as MoreIcon,
  Event as EventIcon,
  Person as PersonIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Check as CheckIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { format } from 'date-fns';

const AppointmentCard = ({ 
  appointment, 
  onView, 
  onEdit, 
  onDelete, 
  onStatusUpdate,
  canEdit = true 
}) => {
  const [anchorEl, setAnchorEl] = React.useState(null);

  const handleMenuClick = (event) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleAction = (action) => {
    handleMenuClose();
    action();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'warning';
      case 'confirmed':
        return 'info';
      case 'completed':
        return 'success';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status) => {
    return status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Pending';
  };

  const formatDateTime = (dateTimeString) => {
    try {
      const date = new Date(dateTimeString);
      return format(date, 'MMM dd, yyyy - hh:mm a');
    } catch (error) {
      return dateTimeString;
    }
  };

  return (
    <Card 
      sx={{ 
        mb: 2, 
        cursor: 'pointer',
        '&:hover': { boxShadow: 3 }
      }}
      onClick={() => onView && onView(appointment)}
    >
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
          <Box flex={1}>
            <Typography variant="h6" gutterBottom>
              {appointment.visitorName}
            </Typography>
            <Chip 
              label={getStatusLabel(appointment.status)} 
              color={getStatusColor(appointment.status)} 
              size="small"
            />
          </Box>
          {canEdit && (
            <IconButton onClick={handleMenuClick} size="small">
              <MoreIcon />
            </IconButton>
          )}
        </Box>

        <Box display="flex" alignItems="center" gap={1} mb={1}>
          <EventIcon fontSize="small" color="action" />
          <Typography variant="body2" color="textSecondary">
            {formatDateTime(appointment.appointmentDate)}
          </Typography>
        </Box>

        {appointment.email && (
          <Box display="flex" alignItems="center" gap={1} mb={1}>
            <EmailIcon fontSize="small" color="action" />
            <Typography variant="body2" color="textSecondary">
              {appointment.email}
            </Typography>
          </Box>
        )}

        {appointment.phone && (
          <Box display="flex" alignItems="center" gap={1} mb={1}>
            <PhoneIcon fontSize="small" color="action" />
            <Typography variant="body2" color="textSecondary">
              {appointment.phone}
            </Typography>
          </Box>
        )}

        {appointment.purpose && (
          <Box mt={2}>
            <Typography variant="caption" color="textSecondary">
              Purpose:
            </Typography>
            <Typography variant="body2">
              {appointment.purpose}
            </Typography>
          </Box>
        )}

        {appointment.notes && (
          <Box mt={1}>
            <Typography variant="caption" color="textSecondary">
              Notes:
            </Typography>
            <Typography variant="body2" color="textSecondary">
              {appointment.notes}
            </Typography>
          </Box>
        )}
      </CardContent>

      {canEdit && (
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
        >
          <MenuItem onClick={() => handleAction(() => onView(appointment))}>
            <ListItemIcon>
              <ViewIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>View Details</ListItemText>
          </MenuItem>
          
          {appointment.status === 'pending' && (
            <MenuItem onClick={() => handleAction(() => onStatusUpdate(appointment.id, 'confirmed'))}>
              <ListItemIcon>
                <CheckIcon fontSize="small" color="success" />
              </ListItemIcon>
              <ListItemText>Confirm</ListItemText>
            </MenuItem>
          )}

          {appointment.status === 'confirmed' && (
            <MenuItem onClick={() => handleAction(() => onStatusUpdate(appointment.id, 'completed'))}>
              <ListItemIcon>
                <CheckIcon fontSize="small" color="success" />
              </ListItemIcon>
              <ListItemText>Mark as Completed</ListItemText>
            </MenuItem>
          )}

          {appointment.status !== 'cancelled' && appointment.status !== 'completed' && (
            <MenuItem onClick={() => handleAction(() => onStatusUpdate(appointment.id, 'cancelled'))}>
              <ListItemIcon>
                <CloseIcon fontSize="small" color="error" />
              </ListItemIcon>
              <ListItemText>Cancel</ListItemText>
            </MenuItem>
          )}

          <MenuItem onClick={() => handleAction(() => onEdit(appointment))}>
            <ListItemIcon>
              <EditIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Edit</ListItemText>
          </MenuItem>

          <MenuItem onClick={() => handleAction(() => onDelete(appointment.id))}>
            <ListItemIcon>
              <DeleteIcon fontSize="small" color="error" />
            </ListItemIcon>
            <ListItemText>Delete</ListItemText>
          </MenuItem>
        </Menu>
      )}
    </Card>
  );
};

export default AppointmentCard;