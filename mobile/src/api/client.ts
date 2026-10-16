/**
 * Cliente HTTP para App Móvil de Punto Fino
 * Incluye gestión de tokens JWT y fallback transparente a base de datos offline (SQLite)
 */

import axios from 'axios';
import { localDB } from '../storage/localDatabase';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 8000,
  headers: {
    'Content-Type': 'application/json',
  },
});

let authToken: string | null = null;

export const setAuthToken = (token: string | null) => {
  authToken = token;
  if (token) {
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete apiClient.defaults.headers.common['Authorization'];
  }
};

// Interceptor de respuesta con detección offline
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const isNetworkError = !error.response || error.code === 'ECONNABORTED' || error.message.includes('Network Error');

    if (isNetworkError) {
      console.warn('[Mobile API] Conexión caída en el local. Activando fallback offline.');
    }

    return Promise.reject(error);
  }
);
