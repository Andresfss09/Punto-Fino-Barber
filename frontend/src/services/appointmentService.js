import api from './api';

export const appointmentService = {
  create: async (data) => {
    const res = await api.post('/appointments', data);
    return res?.appointment ? res : (res?.data || res);
  },
  createGuestAppointment: async (data) => {
    const res = await api.post('/appointments', data);
    return res?.appointment ? res : (res?.data || res);
  },
  sendOtp: async (data) => {
    const res = await api.post('/appointments/send-otp', data);
    return res;
  },
  createWalkIn: async (data) => {
    const res = await api.post('/appointments/walk-in', data);
    return res?.appointment ? res : (res?.data || res);
  },
  checkout: async (id, data) => {
    const res = await api.post(`/appointments/${id}/checkout`, data);
    return res?.appointment ? res : (res?.data || res);
  },
  getAvailableSlots: async (params) => {
    const res = await api.get('/appointments/available-slots', { params });
    return res?.slots ? res : (res?.data || res);
  },
  getMyAppointments: (params) => api.get('/appointments/my-appointments', { params }),
  getMyHistory: (status) => api.get('/appointments/my-appointments', { params: { status } }),
  getBarberSchedule: (date) => api.get('/appointments/barber-appointments', { params: { date } }),
  getBarberAppointments: async (params) => {
    const res = await api.get('/appointments/barber-appointments', { params });
    return res?.appointments ? res : (res?.data || res);
  },
  getAll: async (params) => {
    const res = await api.get('/appointments', { params });
    return res?.appointments ? res : (res?.data || res);
  },
  getStats: async (params) => {
    const res = await api.get('/appointments/stats', { params });
    return res?.stats ? res : (res?.data || res);
  },
  cancel: (id, reason) => api.put(`/appointments/${id}/cancel`, { reason }),
  updateStatus: async (id, status) => {
    const res = await api.put(`/appointments/${id}/status`, { status });
    return res?.appointment ? res : (res?.data || res);
  },
};