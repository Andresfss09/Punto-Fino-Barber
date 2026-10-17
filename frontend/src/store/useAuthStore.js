import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,

      setAuth: (user, token) => {
        if (token) {
          localStorage.setItem('pf_token', token);
        }
        set({ user, token, isAuthenticated: true });
      },

      updateUser: (userData) => {
        set((state) => ({ user: { ...state.user, ...userData } }));
      },

      logout: () => {
        localStorage.removeItem('pf_token');
        localStorage.removeItem('pf_user');
        set({ user: null, token: null, isAuthenticated: false });
      },

      setLoading: (loading) => set({ isLoading: loading }),

      isAdmin: () => {
        const role = (get().user?.role || '').toUpperCase();
        return role === 'ADMIN' || role === 'SUPER_ADMIN';
      },

      isBarber: () => {
        const role = (get().user?.role || '').toUpperCase();
        return (
          role === 'BARBER' ||
          role === 'BARBERO' ||
          Boolean(get().user?.barberProfile) ||
          role === 'ADMIN' ||
          role === 'SUPER_ADMIN'
        );
      },

      isDualRole: () => {
        const user = get().user;
        const role = (user?.role || '').toUpperCase();
        return Boolean(user?.isDualRole || role === 'ADMIN' || role === 'SUPER_ADMIN');
      },
    }),
    {
      name: 'pf_user',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

export default useAuthStore;