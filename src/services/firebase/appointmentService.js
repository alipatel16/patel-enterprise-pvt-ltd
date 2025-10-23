import { ref, push, set, get, update, remove } from 'firebase/database';
import { database } from '../firebase/config';
import BaseService from '../api/baseService';

class AppointmentService extends BaseService {
  constructor() {
    super('appointments');
  }

  /**
   * Create a new appointment
   */
  async createAppointment(userType, appointmentData) {
    try {
      const appointmentsRef = ref(database, `${userType}/appointments`);
      const newAppointmentRef = push(appointmentsRef);
      
      const appointment = {
        ...appointmentData,
        id: newAppointmentRef.key,
        status: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await set(newAppointmentRef, appointment);
      return { success: true, id: newAppointmentRef.key, data: appointment };
    } catch (error) {
      console.error('Error creating appointment:', error);
      throw error;
    }
  }

  /**
   * Get all appointments
   */
  async getAllAppointments(userType) {
    try {
      const appointmentsRef = ref(database, `${userType}/appointments`);
      const snapshot = await get(appointmentsRef);
      
      if (snapshot.exists()) {
        const data = snapshot.val();
        return Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        }));
      }
      return [];
    } catch (error) {
      console.error('Error fetching appointments:', error);
      throw error;
    }
  }

  /**
   * Get appointment by ID
   */
  async getAppointmentById(userType, appointmentId) {
    try {
      const appointmentRef = ref(database, `${userType}/appointments/${appointmentId}`);
      const snapshot = await get(appointmentRef);
      
      if (snapshot.exists()) {
        return { id: appointmentId, ...snapshot.val() };
      }
      return null;
    } catch (error) {
      console.error('Error fetching appointment:', error);
      throw error;
    }
  }

  /**
   * Update appointment
   */
  async updateAppointment(userType, appointmentId, updates) {
    try {
      const appointmentRef = ref(database, `${userType}/appointments/${appointmentId}`);
      const updateData = {
        ...updates,
        updatedAt: new Date().toISOString()
      };
      
      await update(appointmentRef, updateData);
      return { success: true };
    } catch (error) {
      console.error('Error updating appointment:', error);
      throw error;
    }
  }

  /**
   * Update appointment status
   */
  async updateAppointmentStatus(userType, appointmentId, status) {
    try {
      return await this.updateAppointment(userType, appointmentId, { status });
    } catch (error) {
      console.error('Error updating appointment status:', error);
      throw error;
    }
  }

  /**
   * Delete appointment
   */
  async deleteAppointment(userType, appointmentId) {
    try {
      const appointmentRef = ref(database, `${userType}/appointments/${appointmentId}`);
      await remove(appointmentRef);
      return { success: true };
    } catch (error) {
      console.error('Error deleting appointment:', error);
      throw error;
    }
  }

  /**
   * Get upcoming appointments
   */
  async getUpcomingAppointments(userType) {
    try {
      const appointments = await this.getAllAppointments(userType);
      const now = new Date();
      
      return appointments.filter(apt => {
        const aptDate = new Date(apt.appointmentDate);
        return aptDate >= now && apt.status !== 'cancelled' && apt.status !== 'completed';
      }).sort((a, b) => new Date(a.appointmentDate) - new Date(b.appointmentDate));
    } catch (error) {
      console.error('Error fetching upcoming appointments:', error);
      throw error;
    }
  }

  /**
   * Get past appointments
   */
  async getPastAppointments(userType) {
    try {
      const appointments = await this.getAllAppointments(userType);
      const now = new Date();
      
      return appointments.filter(apt => {
        const aptDate = new Date(apt.appointmentDate);
        return aptDate < now || apt.status === 'completed' || apt.status === 'cancelled';
      }).sort((a, b) => new Date(b.appointmentDate) - new Date(a.appointmentDate));
    } catch (error) {
      console.error('Error fetching past appointments:', error);
      throw error;
    }
  }

  /**
   * Get today's appointments
   */
  async getTodayAppointments(userType) {
    try {
      const appointments = await this.getAllAppointments(userType);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      return appointments.filter(apt => {
        const aptDate = new Date(apt.appointmentDate);
        return aptDate >= today && aptDate < tomorrow && apt.status !== 'cancelled';
      }).sort((a, b) => new Date(a.appointmentDate) - new Date(b.appointmentDate));
    } catch (error) {
      console.error('Error fetching today\'s appointments:', error);
      throw error;
    }
  }
}

export default new AppointmentService();