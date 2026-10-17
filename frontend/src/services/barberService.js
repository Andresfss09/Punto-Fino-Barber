import api from './api';

export const barberService = {
  getAll: async () => {
    const res = await api.get('/barbers');
    return res?.barbers || res?.data?.barbers || res?.data || res;
  },
  getOne: (userId) => api.get(`/barbers/${userId}`),
  updateProfile: (data) => api.put('/barbers/profile', data),
  getMyDashboard: async (params) => {
    const res = await api.get('/barbers/me/dashboard', { params });
    return res?.barber ? res : (res?.data || res);
  },
  getMyEarnings: async (params) => {
    const res = await api.get('/barbers/me/earnings', { params });
    return res?.data || res;
  },
  blockTime: async (data) => {
    const res = await api.post('/barbers/me/block-time', data);
    return res?.data || res;
  },
  getMyStats: async (params) => {
    const res = await api.get('/barbers/stats/me', { params });
    return res?.stats ? res.stats : (res?.data?.stats || res?.data || res);
  },
  getStats: (userId = 'me', params) => api.get(`/barbers/stats/${userId}`, { params }),
};
