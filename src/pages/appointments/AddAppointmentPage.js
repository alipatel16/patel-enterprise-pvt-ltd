import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Paper,
  Typography,
  Alert
} from '@mui/material';
import Layout from '../../components/common/Layout/Layout';
import AppointmentForm from '../../components/appointments/AppointmentForm';
import useAppointments from '../../hooks/useAppointments';

const AddAppointmentPage = () => {
  const navigate = useNavigate();
  const { createAppointment } = useAppointments();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (appointmentData) => {
    try {
      setLoading(true);
      setError(null);
      await createAppointment(appointmentData);
      setSuccess(true);
      setTimeout(() => {
        navigate('/appointments');
      }, 1500);
    } catch (err) {
      console.error('Error creating appointment:', err);
      setError('Failed to create appointment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/appointments');
  };

  return (
    <Layout title="Book Appointment">
      <Container maxWidth="md" sx={{ py: 3 }}>
        <Paper elevation={2} sx={{ p: 4 }}>
          {success && (
            <Alert severity="success" sx={{ mb: 3 }}>
              Appointment booked successfully! Redirecting...
            </Alert>
          )}
          
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          <AppointmentForm
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            loading={loading}
          />
        </Paper>
      </Container>
    </Layout>
  );
};

export default AddAppointmentPage;