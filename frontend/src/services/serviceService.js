import api from './api';

export const serviceService = {
  getAll: async (params) => {
    const res = await api.get('/services', { params });
    return res?.services || res?.data?.services || res?.data || res;
  },
  getOne: (id) => api.get(`/services/${id}`),
  create: (data) => api.post('/services', data),
  update: (id, data) => api.put(`/services/${id}`, data),
  delete: (id) => api.delete(`/services/${id}`),
};