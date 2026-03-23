import { getAccessToken } from '@/services/user.service';
import { mapLocalhostForExpoGo, trimTrailingSlash } from '@/utils/network/localhost';
import axios, { AxiosInstance } from 'axios';

function resolveApiBaseUrl() {
  const configured = process.env.EXPO_PUBLIC_API_BASE_URL?.trim();
  const strictBaseUrl =
    String(process.env.EXPO_PUBLIC_STRICT_BASE_URL).trim().toLowerCase() === 'true';
  const defaultUrl = __DEV__ ? 'http://localhost:5080/' : 'https://api.memopal.com';

  if (!configured) {
    return mapLocalhostForExpoGo(defaultUrl);
  }

  if (!/^https?:\/\//i.test(configured)) {
    console.warn('EXPO_PUBLIC_API_BASE_URL is invalid, falling back to default API URL.');
    return mapLocalhostForExpoGo(defaultUrl);
  }

  const normalizedConfigured = trimTrailingSlash(configured);

  // By default we still map localhost for Expo Go/device/emulator so
  // EXPO_PUBLIC_API_BASE_URL=http://localhost:5080 works in local dev.
  // Set EXPO_PUBLIC_STRICT_BASE_URL=true to disable this behavior.
  if (strictBaseUrl) {
    return normalizedConfigured;
  }

  return mapLocalhostForExpoGo(normalizedConfigured);
}

const resolvedBaseUrl = resolveApiBaseUrl();
if (__DEV__) {
  console.info('[MemoPal][API] baseURL:', resolvedBaseUrl);
}

const api: AxiosInstance = axios.create({
  baseURL: resolvedBaseUrl,
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
      const base = error?.config?.baseURL ?? resolvedBaseUrl;
      const path = error?.config?.url ?? '';
      console.warn(
        `[MemoPal][API] Network error calling ${base}${path}. Ensure backend is running and reachable from this device.`
      );
    } else if (error.response.status === 401) {
      console.warn('Unauthorized - maybe redirect to login');
    }
    return Promise.reject(error);
  }
);

export default api;
