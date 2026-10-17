import api from './api';

export const authService = {
  register: async (data) => {
    const res = await api.post('/auth/register-staff', data);
    return res.data?.data || res.data;
  },

  login: async (data) => {
    const res = await api.post('/auth/login', {
      email: (data.email || '').trim().toLowerCase(),
      password: data.password,
    });
    const payload = res?.user && res?.token ? res : (res?.data?.data || res?.data || res);
    if (!payload?.user || !payload?.token) {
      throw new Error(payload?.message || res?.message || 'Error al iniciar sesión.');
    }
    return payload;
  },

  getMe: async () => {
    const res = await api.get('/auth/me');
    return res.data?.data || res.data;
  },

  logout: async () => {
    try {
      await api.post('/auth/logout', {});
    } catch (e) {
      // Ignorar si el token ya expiró
    }
  },

  forgotPassword: async (email) => {
    const res = await api.post('/auth/forgot-password', { email });
    return res.data;
  },

  resetPassword: async ({ email, code, newPassword }) => {
    const res = await api.post('/auth/reset-password', { email, code, newPassword });
    return res.data;
  },
};