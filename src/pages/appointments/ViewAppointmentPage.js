import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Paper,
  Typography,
  Button,
  Grid,
  Chip,
  CircularProgress,
  Alert,
  Divider
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  ArrowBack as BackIcon,
  Event as EventIcon,
  Person as PersonIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Description as DescriptionIcon,
  Check as CheckIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import Layout from '../../components/common/Layout/Layout';
import ConfirmDialog from '../../components/common/UI/ConfirmDialog';
import useAppointments from '../../hooks/useAppointments';
import { useAuth } from '../../contexts/AuthContext/AuthContext';

const ViewAppointmentPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { getAppointmentById, deleteAppointment, updateAppointmentStatus } = useAppointments();
  
  const [appointment, setAppointment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  useEffect(() => {
    loadAppointment();
  }, [id]);

  const loadAppointment = async () => {
    try {
      setLoading(true);
      const data = await getAppointmentById(id);
      if (data) {
        setAppointment(data);
      } else {
        setError('Appointment not found');
      }
    } catch (err) {
      console.error('Error loading appointment:', err);
      setError('Failed to load appointment');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteAppointment(id);
      navigate('/appointments');
    } catch (err) {
      console.error('Error deleting appointment:', err);
    }
  };

  const handleStatusUpdate = async (newStatus) => {
    try {
      await updateAppointmentStatus(id, newStatus);
      await loadAppointment();
    } catch (err) {
      console.error('Error updating status:', err);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'confirmed': return 'info';
      case 'completed': return 'success';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  const formatDateTime = (dateTimeString) => {
    try {
      const date = new Date(dateTimeString);
      return format(date, 'MMMM dd, yyyy - hh:mm a');
    } catch (error) {
      return dateTimeString;
    }
  };

  if (loading) {
    return (
      <Layout title="Appointment Details">
        <Container maxWidth="md" sx={{ py: 3 }}>
          <Box display="flex" justifyContent="center" py={5}>
            <CircularProgress />
          </Box>
        </Container>
      </Layout>
    );
  }

  if (error || !appointment) {
    return (
      <Layout title="Appointment Details">
        <Container maxWidth="md" sx={{ py: 3 }}>
          <Alert severity="error">{error || 'Appointment not found'}</Alert>
          <Button startIcon={<BackIcon />} onClick={() => navigate('/appointments')} sx={{ mt: 2 }}>
            Back to Appointments
          </Button>
        </Container>
      </Layout>
    );
  }

  return (
    <Layout title="Appointment Details">
      <Container maxWidth="md" sx={{ py: 3 }}>
        <Box mb={3}>
          <Button startIcon={<BackIcon />} onClick={() => navigate('/appointments')}>
            Back to Appointments
          </Button>
        </Box>

        <Paper elevation={2} sx={{ p: 4 }}>
          <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={3}>
            <Box>
              <Typography variant="h4" gutterBottom>
                Appointment Details
              </Typography>
              <Chip 
                label={appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)} 
                color={getStatusColor(appointment.status)} 
                sx={{ mt: 1 }}
              />
            </Box>
            <Box display="flex" gap={1}>
              <Button
                variant="outlined"
                startIcon={<EditIcon />}
                onClick={() => navigate(`/appointments/edit/${id}`)}
              >
                Edit
              </Button>
              <Button
                variant="outlined"
                color="error"
                startIcon={<DeleteIcon />}
                onClick={() => setDeleteDialogOpen(true)}
              >
                Delete
              </Button>
            </Box>
          </Box>

          <Divider sx={{ my: 3 }} />

          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Box display="flex" alignItems="center" gap={2} mb={2}>
                <PersonIcon color="action" />
                <Box>
                  <Typography variant="caption" color="textSecondary">
                    Visitor Name
                  </Typography>
                  <Typography variant="h6">
                    {appointment.visitorName}
                  </Typography>
                </Box>
              </Box>
            </Grid>

            <Grid item xs={12} md={6}>
              <Box display="flex" alignItems="center" gap={2} mb={2}>
                <EventIcon color="action" />
                <Box>
                  <Typography variant="caption" color="textSecondary">
                    Appointment Date & Time
                  </Typography>
                  <Typography variant="body1">
                    {formatDateTime(appointment.appointmentDate)}
                  </Typography>
                </Box>
              </Box>
            </Grid>

            <Grid item xs={12} md={6}>
              <Box display="flex" alignItems="center" gap={2} mb={2}>
                <PhoneIcon color="action" />
                <Box>
                  <Typography variant="caption" color="textSecondary">
                    Phone Number
                  </Typography>
                  <Typography variant="body1">
                    {appointment.phone}
                  </Typography>
                </Box>
              </Box>
            </Grid>

            {appointment.email && (
              <Grid item xs={12}>
                <Box display="flex" alignItems="center" gap={2} mb={2}>
                  <EmailIcon color="action" />
                  <Box>
                    <Typography variant="caption" color="textSecondary">
                      Email
                    </Typography>
                    <Typography variant="body1">
                      {appointment.email}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            )}

            <Grid item xs={12}>
              <Box display="flex" alignItems="flex-start" gap={2} mb={2}>
                <DescriptionIcon color="action" sx={{ mt: 0.5 }} />
                <Box>
                  <Typography variant="caption" color="textSecondary">
                    Purpose of Visit
                  </Typography>
                  <Typography variant="body1">
                    {appointment.purpose}
                  </Typography>
                </Box>
              </Box>
            </Grid>

            {appointment.notes && (
              <Grid item xs={12}>
                <Box display="flex" alignItems="flex-start" gap={2}>
                  <DescriptionIcon color="action" sx={{ mt: 0.5 }} />
                  <Box>
                    <Typography variant="caption" color="textSecondary">
                      Additional Notes
                    </Typography>
                    <Typography variant="body1" color="textSecondary">
                      {appointment.notes}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            )}
          </Grid>

          <Divider sx={{ my: 3 }} />

          <Box display="flex" gap={2} justifyContent="flex-end">
            {appointment.status === 'pending' && (
              <Button
                variant="contained"
                color="success"
                startIcon={<CheckIcon />}
                onClick={() => handleStatusUpdate('confirmed')}
              >
                Confirm Appointment
              </Button>
            )}
            {appointment.status === 'confirmed' && (
              <Button
                variant="contained"
                color="success"
                startIcon={<CheckIcon />}
                onClick={() => handleStatusUpdate('completed')}
              >
                Mark as Completed
              </Button>
            )}
            {appointment.status !== 'cancelled' && appointment.status !== 'completed' && (
              <Button
                variant="outlined"
                color="error"
                startIcon={<CloseIcon />}
                onClick={() => handleStatusUpdate('cancelled')}
              >
                Cancel Appointment
              </Button>
            )}
          </Box>
        </Paper>

        <ConfirmDialog
          open={deleteDialogOpen}
          title="Delete Appointment"
          message="Are you sure you want to delete this appointment? This action cannot be undone."
          onConfirm={handleDelete}
          onCancel={() => setDeleteDialogOpen(false)}
        />
      </Container>
    </Layout>
  );
};

export default ViewAppointmentPage;