import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE = 'http://10.0.2.2:5000';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;
