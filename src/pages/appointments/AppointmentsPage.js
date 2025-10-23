import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Button,
  Tabs,
  Tab,
  CircularProgress,
  Alert,
  Fab,
  useMediaQuery,
  useTheme
} from '@mui/material';
import {
  Add as AddIcon,
  Event as EventIcon
} from '@mui/icons-material';
import Layout from '../../components/common/Layout/Layout';
import AppointmentCard from '../../components/appointments/AppointmentCard';
import ConfirmDialog from '../../components/common/UI/ConfirmDialog';
import useAppointments from '../../hooks/useAppointments';
import { useAuth } from '../../contexts/AuthContext/AuthContext';

const AppointmentsPage = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { user } = useAuth();
  
  const {
    appointments,
    loading,
    error,
    updateAppointmentStatus,
    deleteAppointment,
    getUpcomingAppointments,
    getTodayAppointments,
    getPastAppointments
  } = useAppointments();

  const [activeTab, setActiveTab] = useState(0);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [appointmentToDelete, setAppointmentToDelete] = useState(null);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleView = (appointment) => {
    navigate(`/appointments/view/${appointment.id}`);
  };

  const handleEdit = (appointment) => {
    navigate(`/appointments/edit/${appointment.id}`);
  };

  const handleDeleteClick = (appointmentId) => {
    setAppointmentToDelete(appointmentId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await deleteAppointment(appointmentToDelete);
      setDeleteDialogOpen(false);
      setAppointmentToDelete(null);
    } catch (error) {
      console.error('Error deleting appointment:', error);
    }
  };

  const handleStatusUpdate = async (appointmentId, newStatus) => {
    try {
      await updateAppointmentStatus(appointmentId, newStatus);
    } catch (error) {
      console.error('Error updating appointment status:', error);
    }
  };

  const getFilteredAppointments = () => {
    switch (activeTab) {
      case 0: // Today
        return getTodayAppointments();
      case 1: // Upcoming
        return getUpcomingAppointments();
      case 2: // Past
        return getPastAppointments();
      case 3: // All
        return appointments;
      default:
        return appointments;
    }
  };

  const filteredAppointments = getFilteredAppointments();

  return (
    <Layout title="Appointments">
      <Container maxWidth="lg" sx={{ py: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Box display="flex" alignItems="center" gap={2}>
            <EventIcon color="primary" sx={{ fontSize: 32 }} />
            <Typography variant="h4" component="h1">
              Appointments
            </Typography>
          </Box>
          {!isMobile && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => navigate('/appointments/add')}
            >
              Book Appointment
            </Button>
          )}
        </Box>

        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs 
            value={activeTab} 
            onChange={handleTabChange}
            variant={isMobile ? 'scrollable' : 'standard'}
            scrollButtons={isMobile ? 'auto' : false}
          >
            <Tab label={`Today (${getTodayAppointments().length})`} />
            <Tab label={`Upcoming (${getUpcomingAppointments().length})`} />
            <Tab label={`Past (${getPastAppointments().length})`} />
            <Tab label={`All (${appointments.length})`} />
          </Tabs>
        </Box>

        {loading ? (
          <Box display="flex" justifyContent="center" py={5}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : filteredAppointments.length === 0 ? (
          <Alert severity="info">No appointments found in this category.</Alert>
        ) : (
          <Box>
            {filteredAppointments.map((appointment) => (
              <AppointmentCard
                key={appointment.id}
                appointment={appointment}
                onView={handleView}
                onEdit={handleEdit}
                onDelete={handleDeleteClick}
                onStatusUpdate={handleStatusUpdate}
                canEdit={true}
              />
            ))}
          </Box>
        )}

        {isMobile && (
          <Fab
            color="primary"
            aria-label="add appointment"
            sx={{ position: 'fixed', bottom: 16, right: 16 }}
            onClick={() => navigate('/appointments/add')}
          >
            <AddIcon />
          </Fab>
        )}

        <ConfirmDialog
          open={deleteDialogOpen}
          title="Delete Appointment"
          message="Are you sure you want to delete this appointment? This action cannot be undone."
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteDialogOpen(false)}
        />
      </Container>
    </Layout>
  );
};

export default AppointmentsPage;