import api from './api';

export const adminService = {
  getOverview: async () => {
    const res = await api.get('/admin/overview');
    return res?.data || res;
  },

  getPayrollStats: async (params) => {
    const res = await api.get('/admin/payroll', { params });
    return res?.data || res;
  },

  approveSettlement: async (data) => {
    const res = await api.post('/admin/payroll/approve', data);
    return res?.data || res;
  },

  payoutAppointments: (data) => api.put('/admin/payout', data),

  updateBarberCommission: (barberId, commissionRate) =>
    api.put(`/admin/barbers/${barberId}/commission`, { commissionRate }),

  updateBarberSalary: (barberId, baseSalaryCOP, productCommissionRate, commissionRate) =>
    api.put(`/admin/barbers/${barberId}/salary`, { baseSalaryCOP, productCommissionRate, commissionRate }),

  getSchedules: async () => {
    const res = await api.get('/admin/schedules');
    return res?.data || res;
  },

  updateSchedules: async (schedules) => {
    const res = await api.put('/admin/schedules', { schedules });
    return res?.data || res;
  },

  createScheduleException: async (data) => {
    const res = await api.post('/admin/schedules/exceptions', data);
    return res?.data || res;
  },

  deleteScheduleException: async (id) => {
    const res = await api.delete(`/admin/schedules/exceptions/${id}`);
    return res?.data || res;
  },

  openCashRegister: async (data) => {
    const res = await api.post('/admin/cash/open', data);
    return res?.data || res;
  },

  closeCashRegister: async (data) => {
    const res = await api.post('/admin/cash/close', data);
    return res?.data || res;
  },

  getAllAppointments: (params) => api.get('/appointments', { params }),
};
