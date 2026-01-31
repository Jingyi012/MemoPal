import AsyncStorage from '@react-native-async-storage/async-storage';
import axios, { AxiosInstance } from 'axios';

const api: AxiosInstance = axios.create({
  baseURL: 'https://api.memopal.com', // <-- replace with your backend URL
  timeout: 10000, // 10s
  headers: {
    'Content-Type': 'application/json',
  },
});

// ✅ Request interceptor: attach auth token
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ✅ Response interceptor: handle global errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (!error.response) {
      // Network error
      console.warn('Network error:', error);
    } else if (error.response.status === 401) {
      console.warn('Unauthorized - maybe redirect to login');
      // Optional: trigger logout or refresh token
    }
    return Promise.reject(error);
  }
);

export default api;
