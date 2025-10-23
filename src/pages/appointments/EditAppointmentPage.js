import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Paper,
  Typography,
  Alert,
  CircularProgress,
  Button
} from '@mui/material';
import { ArrowBack as BackIcon } from '@mui/icons-material';
import Layout from '../../components/common/Layout/Layout';
import AppointmentForm from '../../components/appointments/AppointmentForm';
import useAppointments from '../../hooks/useAppointments';

const EditAppointmentPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getAppointmentById, updateAppointment } = useAppointments();
  
  const [appointment, setAppointment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

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

  const handleSubmit = async (appointmentData) => {
    try {
      setSubmitting(true);
      setError(null);
      await updateAppointment(id, appointmentData);
      setSuccess(true);
      setTimeout(() => {
        navigate(`/appointments/view/${id}`);
      }, 1500);
    } catch (err) {
      console.error('Error updating appointment:', err);
      setError('Failed to update appointment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate(`/appointments/view/${id}`);
  };

  if (loading) {
    return (
      <Layout title="Edit Appointment">
        <Container maxWidth="md" sx={{ py: 3 }}>
          <Box display="flex" justifyContent="center" py={5}>
            <CircularProgress />
          </Box>
        </Container>
      </Layout>
    );
  }

  if (error && !appointment) {
    return (
      <Layout title="Edit Appointment">
        <Container maxWidth="md" sx={{ py: 3 }}>
          <Alert severity="error">{error}</Alert>
          <Button startIcon={<BackIcon />} onClick={() => navigate('/appointments')} sx={{ mt: 2 }}>
            Back to Appointments
          </Button>
        </Container>
      </Layout>
    );
  }

  return (
    <Layout title="Edit Appointment">
      <Container maxWidth="md" sx={{ py: 3 }}>
        <Box mb={3}>
          <Button startIcon={<BackIcon />} onClick={() => navigate(`/appointments/view/${id}`)}>
            Back to Details
          </Button>
        </Box>

        <Paper elevation={2} sx={{ p: 4 }}>
          {success && (
            <Alert severity="success" sx={{ mb: 3 }}>
              Appointment updated successfully! Redirecting...
            </Alert>
          )}
          
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          <AppointmentForm
            initialData={appointment}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            loading={submitting}
          />
        </Paper>
      </Container>
    </Layout>
  );
};

export default EditAppointmentPage;