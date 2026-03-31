import { AUTH_STORAGE_KEY } from '@/constants/auth';
import { USER_STATE_STORAGE_KEY } from '@/constants/storage';
import { getDeviceSessionContext } from '@/services/authSession.service';
import { AuthResponse } from '@/types/auth';
import { GeneralResponse } from '@/types/general';
import { mapLocalhostForExpoGo, trimTrailingSlash } from '@/utils/network/localhost';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios, { AxiosInstance, InternalAxiosRequestConfig, isAxiosError } from 'axios';
import { router } from 'expo-router';
import {
  clearAuthTokens,
  getAccessToken,
  getRefreshToken,
  setAccessToken,
  setRefreshToken,
} from '@/services/user.service';

function resolveApiBaseUrl() {
  const configured = process.env.EXPO_PUBLIC_API_BASE_URL?.trim();
  const strictBaseUrl =
    String(process.env.EXPO_PUBLIC_STRICT_BASE_URL).trim().toLowerCase() === 'true';
  const defaultUrl = __DEV__ ? 'http://localhost:5080/' : 'https://memopal-api.cheehong.cloud';

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

const AUTH_ENDPOINTS_SKIP_AUTO_LOGOUT = [
  '/auth/login',
  '/auth/register',
  '/auth/google',
  '/auth/facebook',
  '/auth/refresh',
  '/auth/login-methods',
];

type RetryableRequestConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
};

let isHandlingUnauthorized = false;
let refreshRequestInFlight: Promise<string | null> | null = null;

function includesAuthEndpoint(url?: string): boolean {
  if (!url) return false;
  return AUTH_ENDPOINTS_SKIP_AUTO_LOGOUT.some((path) => url.includes(path));
}

function shouldSkipRefresh(config?: RetryableRequestConfig): boolean {
  if (!config) return false;
  const headerValue = config.headers?.['X-MemoPal-Skip-Refresh'];
  const skipByHeader = String(headerValue ?? '').trim() === '1';
  return skipByHeader || includesAuthEndpoint(config.url);
}

async function clearSessionAndRedirectToLogin() {
  if (isHandlingUnauthorized) {
    return;
  }

  isHandlingUnauthorized = true;
  try {
    await Promise.allSettled([
      clearAuthTokens(),
      AsyncStorage.multiRemove([AUTH_STORAGE_KEY, USER_STATE_STORAGE_KEY]),
    ]);
    router.replace('/login');
  } catch (unauthorizedHandlerError) {
    console.warn('[MemoPal][API] Failed handling unauthorized response:', unauthorizedHandlerError);
  } finally {
    isHandlingUnauthorized = false;
  }
}

async function refreshAccessToken(): Promise<string | null> {
  if (refreshRequestInFlight) {
    return refreshRequestInFlight;
  }

  refreshRequestInFlight = (async () => {
    const currentRefreshToken = await getRefreshToken();
    if (!currentRefreshToken) {
      return null;
    }

    const device = await getDeviceSessionContext();
    const requestRefresh = async (includeDeviceContext: boolean) => {
      const payload = includeDeviceContext
        ? {
            refreshToken: currentRefreshToken,
            deviceId: device.deviceId,
            deviceName: device.deviceName,
          }
        : {
            refreshToken: currentRefreshToken,
          };

      const response = await axios.post<GeneralResponse<AuthResponse>>(
        `${resolvedBaseUrl}/auth/refresh`,
        payload,
        {
          timeout: 10000,
          headers: {
            'Content-Type': 'application/json',
            'X-MemoPal-Skip-Refresh': '1',
          },
        }
      );

      return response.data;
    };

    try {
      let refreshPayload = await requestRefresh(true);

      // Backward compatibility: old sessions may be bound to "unknown-device".
      // If strict device refresh fails server-side, retry once without device context.
      if (
        !refreshPayload?.success ||
        !refreshPayload.data?.token ||
        !refreshPayload.data?.refreshToken
      ) {
        return null;
      }

      await Promise.all([
        setAccessToken(refreshPayload.data.token),
        setRefreshToken(refreshPayload.data.refreshToken),
        AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(refreshPayload.data.user)),
      ]);

      return refreshPayload.data.token;
    } catch (error) {
      const statusCode = isAxiosError(error) ? error.response?.status : undefined;
      if (statusCode !== 401 && statusCode !== 403) {
        return null;
      }

      try {
        const refreshPayload = await requestRefresh(false);
        if (
          !refreshPayload?.success ||
          !refreshPayload.data?.token ||
          !refreshPayload.data?.refreshToken
        ) {
          return null;
        }

        await Promise.all([
          setAccessToken(refreshPayload.data.token),
          setRefreshToken(refreshPayload.data.refreshToken),
          AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(refreshPayload.data.user)),
        ]);

        return refreshPayload.data.token;
      } catch {
        return null;
      }
    } finally {
      refreshRequestInFlight = null;
    }
  })();

  return refreshRequestInFlight;
}

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
  async (error) => {
    if (!error.response) {
      const base = error?.config?.baseURL ?? resolvedBaseUrl;
      const path = error?.config?.url ?? '';
      console.warn(
        `[MemoPal][API] Network error calling ${base}${path}. Ensure backend is running and reachable from this device.`
      );
    } else if (error.response.status === 401) {
      const originalConfig = error.config as RetryableRequestConfig | undefined;
      const canTryRefresh =
        !!originalConfig && !originalConfig._retry && !shouldSkipRefresh(originalConfig);

      if (canTryRefresh) {
        originalConfig._retry = true;
        const nextAccessToken = await refreshAccessToken();
        if (nextAccessToken) {
          originalConfig.headers = originalConfig.headers ?? {};
          originalConfig.headers.Authorization = `Bearer ${nextAccessToken}`;
          return api.request(originalConfig);
        }
      }

      if (!includesAuthEndpoint(originalConfig?.url)) {
        await clearSessionAndRedirectToLogin();
      }
    }
    return Promise.reject(error);
  }
);

export default api;
