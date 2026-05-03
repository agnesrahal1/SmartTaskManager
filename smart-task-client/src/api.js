import axios from 'axios';

const getBaseUrl = () => {
  const isCapacitor = window.Capacitor !== undefined && 
                      window.Capacitor.isNativePlatform();
  return isCapacitor 
    ? 'http://10.0.2.2:5034/api'
    : 'http://localhost:5034/api';
};

const api = axios.create({
  baseURL: getBaseUrl(),
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;