import axios from 'axios';

// En Render, VITE_API_URL se rellena con `fromService.property: host`, que
// devuelve solo el hostname (sin esquema). Lo normalizamos aquí para que el
// mismo código funcione en local (puerto 5000) y en la nube (https://...).
const urlApi = (import.meta.env.VITE_API_URL || '').trim().replace(/\/$/, '');
const baseURL = urlApi && !/^https?:\/\//.test(urlApi)
  ? `https://${urlApi}`
  : (urlApi || 'http://localhost:5000');

const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para agregar token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar errores de autenticación
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;