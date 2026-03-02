import { getAccessToken } from '@/services/user.service';
import axios, { AxiosInstance } from 'axios';

function resolveApiBaseUrl() {
  const configured = process.env.EXPO_PUBLIC_API_BASE_URL?.trim();

  if (!configured) {
    return 'https://api.memopal.com';
  }

  if (!/^https?:\/\//i.test(configured)) {
    console.warn('EXPO_PUBLIC_API_BASE_URL is invalid, falling back to default HTTPS URL.');
    return 'https://api.memopal.com';
  }

  return configured;
}

const api: AxiosInstance = axios.create({
  baseURL: resolveApiBaseUrl(),
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  async (config) => {
    const token = await getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (!error.response) {
      console.warn('Network error:', error);
    } else if (error.response.status === 401) {
      console.warn('Unauthorized - maybe redirect to login');
    }
    return Promise.reject(error);
  }
);

export default api;
