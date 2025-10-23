import { useState, useEffect, useCallback } from 'react';
import { useUserType } from '../contexts/UserTypeContext/UserTypeContext';
import appointmentService from '../services/firebase/appointmentService';

export const useAppointments = () => {
  const { userType } = useUserType();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch all appointments
  const fetchAppointments = useCallback(async () => {
    if (!userType) return;
    
    try {
      setLoading(true);
      setError(null);
      const data = await appointmentService.getAllAppointments(userType);
      setAppointments(data);
    } catch (err) {
      console.error('Error fetching appointments:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [userType]);

  // Get appointment by ID
  const getAppointmentById = useCallback(async (appointmentId) => {
    try {
      return await appointmentService.getAppointmentById(userType, appointmentId);
    } catch (err) {
      console.error('Error fetching appointment:', err);
      throw err;
    }
  }, [userType]);

  // Create appointment
  const createAppointment = async (appointmentData) => {
    try {
      const result = await appointmentService.createAppointment(userType, appointmentData);
      await fetchAppointments();
      return result;
    } catch (err) {
      console.error('Error creating appointment:', err);
      throw err;
    }
  };

  // Update appointment
  const updateAppointment = async (appointmentId, updates) => {
    try {
      const result = await appointmentService.updateAppointment(userType, appointmentId, updates);
      await fetchAppointments();
      return result;
    } catch (err) {
      console.error('Error updating appointment:', err);
      throw err;
    }
  };

  // Update appointment status
  const updateAppointmentStatus = async (appointmentId, status) => {
    try {
      const result = await appointmentService.updateAppointmentStatus(userType, appointmentId, status);
      await fetchAppointments();
      return result;
    } catch (err) {
      console.error('Error updating appointment status:', err);
      throw err;
    }
  };

  // Delete appointment
  const deleteAppointment = async (appointmentId) => {
    try {
      const result = await appointmentService.deleteAppointment(userType, appointmentId);
      await fetchAppointments();
      return result;
    } catch (err) {
      console.error('Error deleting appointment:', err);
      throw err;
    }
  };

  // Get upcoming appointments
  const getUpcomingAppointments = useCallback(() => {
    const now = new Date();
    return appointments.filter(apt => {
      const aptDate = new Date(apt.appointmentDate);
      return aptDate >= now && apt.status !== 'cancelled' && apt.status !== 'completed';
    }).sort((a, b) => new Date(a.appointmentDate) - new Date(b.appointmentDate));
  }, [appointments]);

  // Get today's appointments
  const getTodayAppointments = useCallback(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    return appointments.filter(apt => {
      const aptDate = new Date(apt.appointmentDate);
      return aptDate >= today && aptDate < tomorrow && apt.status !== 'cancelled';
    }).sort((a, b) => new Date(a.appointmentDate) - new Date(b.appointmentDate));
  }, [appointments]);

  // Get past appointments
  const getPastAppointments = useCallback(() => {
    const now = new Date();
    return appointments.filter(apt => {
      const aptDate = new Date(apt.appointmentDate);
      return aptDate < now || apt.status === 'completed' || apt.status === 'cancelled';
    }).sort((a, b) => new Date(b.appointmentDate) - new Date(a.appointmentDate));
  }, [appointments]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  return {
    appointments,
    loading,
    error,
    fetchAppointments,
    getAppointmentById,
    createAppointment,
    updateAppointment,
    updateAppointmentStatus,
    deleteAppointment,
    getUpcomingAppointments,
    getTodayAppointments,
    getPastAppointments
  };
};

export default useAppointments;