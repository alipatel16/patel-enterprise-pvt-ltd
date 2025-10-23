import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Button,
  Grid,
  MenuItem,
  Typography
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { useAuth } from '../../contexts/AuthContext/AuthContext';

const AppointmentForm = ({ 
  initialData = null, 
  onSubmit, 
  onCancel, 
  loading = false 
}) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    visitorName: '',
    email: '',
    phone: '',
    appointmentDate: new Date(),
    purpose: '',
    notes: '',
    status: 'pending'
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (initialData) {
      setFormData({
        ...initialData,
        appointmentDate: initialData.appointmentDate 
          ? new Date(initialData.appointmentDate) 
          : new Date()
      });
    }
  }, [initialData]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.visitorName.trim()) {
      newErrors.visitorName = 'Visitor name is required';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^\d{10}$/.test(formData.phone.replace(/\D/g, ''))) {
      newErrors.phone = 'Phone number must be 10 digits';
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    if (!formData.appointmentDate) {
      newErrors.appointmentDate = 'Appointment date and time is required';
    } else if (new Date(formData.appointmentDate) < new Date()) {
      newErrors.appointmentDate = 'Appointment date must be in the future';
    }

    if (!formData.purpose.trim()) {
      newErrors.purpose = 'Purpose is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const appointmentData = {
      ...formData,
      appointmentDate: formData.appointmentDate.toISOString(),
      createdBy: user?.uid,
      createdByName: user?.displayName || user?.email
    };

    await onSubmit(appointmentData);
  };

  return (
    <Box component="form" onSubmit={handleSubmit} noValidate>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Typography variant="h6" gutterBottom>
            {initialData ? 'Edit Appointment' : 'Book New Appointment'}
          </Typography>
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Visitor Name"
            value={formData.visitorName}
            onChange={(e) => handleChange('visitorName', e.target.value)}
            error={Boolean(errors.visitorName)}
            helperText={errors.visitorName}
            required
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Phone Number"
            value={formData.phone}
            onChange={(e) => handleChange('phone', e.target.value)}
            error={Boolean(errors.phone)}
            helperText={errors.phone}
            required
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Email"
            type="email"
            value={formData.email}
            onChange={(e) => handleChange('email', e.target.value)}
            error={Boolean(errors.email)}
            helperText={errors.email}
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <DateTimePicker
            label="Appointment Date & Time"
            value={formData.appointmentDate}
            onChange={(value) => handleChange('appointmentDate', value)}
            renderInput={(params) => (
              <TextField
                {...params}
                fullWidth
                error={Boolean(errors.appointmentDate)}
                helperText={errors.appointmentDate}
                required
              />
            )}
            minDateTime={new Date()}
          />
        </Grid>

        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Purpose of Visit"
            value={formData.purpose}
            onChange={(e) => handleChange('purpose', e.target.value)}
            error={Boolean(errors.purpose)}
            helperText={errors.purpose}
            multiline
            rows={2}
            required
          />
        </Grid>

        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Additional Notes"
            value={formData.notes}
            onChange={(e) => handleChange('notes', e.target.value)}
            multiline
            rows={3}
          />
        </Grid>

        {initialData && (
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              select
              label="Status"
              value={formData.status}
              onChange={(e) => handleChange('status', e.target.value)}
            >
              <MenuItem value="pending">Pending</MenuItem>
              <MenuItem value="confirmed">Confirmed</MenuItem>
              <MenuItem value="completed">Completed</MenuItem>
              <MenuItem value="cancelled">Cancelled</MenuItem>
            </TextField>
          </Grid>
        )}

        <Grid item xs={12}>
          <Box display="flex" gap={2} justifyContent="flex-end">
            <Button onClick={onCancel} disabled={loading}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              variant="contained" 
              disabled={loading}
            >
              {loading ? 'Saving...' : (initialData ? 'Update Appointment' : 'Book Appointment')}
            </Button>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AppointmentForm;