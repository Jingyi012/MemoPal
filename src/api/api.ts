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

type RefreshAttemptFailureKind =
  | 'missing_refresh_token'
  | 'invalid_refresh_payload'
  | 'unauthorized'
  | 'network'
  | 'server'
  | 'unknown';

type RefreshOutcome = {
  token: string | null;
  shouldLogout: boolean;
  failureKind?: RefreshAttemptFailureKind;
  message?: string;
};

let isHandlingUnauthorized = false;
let refreshRequestInFlight: Promise<RefreshOutcome> | null = null;

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

function isValidRefreshPayload(
  payload: GeneralResponse<AuthResponse> | null | undefined
): boolean {
  return !!(
    payload?.success &&
    payload.data?.token &&
    payload.data?.refreshToken &&
    payload.data?.user
  );
}

async function persistRefreshedSession(payload: GeneralResponse<AuthResponse>): Promise<string> {
  await Promise.all([
    setAccessToken(payload.data.token),
    setRefreshToken(payload.data.refreshToken),
    AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(payload.data.user)),
  ]);

  return payload.data.token;
}

function extractApiErrorMessage(error: unknown): string | null {
  if (!isAxiosError(error)) {
    return null;
  }

  const body = error.response?.data;
  if (!body) {
    return null;
  }

  if (typeof body === 'string') {
    const trimmed = body.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  if (typeof body !== 'object') {
    return null;
  }

  const map = body as Record<string, unknown>;
  const directMessage = map.message;
  if (typeof directMessage === 'string' && directMessage.trim().length > 0) {
    return directMessage.trim();
  }

  const directError = map.error;
  if (typeof directError === 'string' && directError.trim().length > 0) {
    return directError.trim();
  }

  return null;
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

async function refreshAccessToken(): Promise<RefreshOutcome> {
  if (refreshRequestInFlight) {
    return refreshRequestInFlight;
  }

  refreshRequestInFlight = (async () => {
    const currentRefreshToken = await getRefreshToken();
    if (!currentRefreshToken) {
      return {
        token: null,
        shouldLogout: true,
        failureKind: 'missing_refresh_token',
        message: 'No refresh token in storage.',
      };
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

    const attemptRefresh = async (
      includeDeviceContext: boolean
    ): Promise<{
      payload: GeneralResponse<AuthResponse> | null;
      shouldRetryWithoutDevice: boolean;
      failureKind?: RefreshAttemptFailureKind;
      message?: string;
    }> => {
      try {
        const payload = await requestRefresh(includeDeviceContext);
        if (isValidRefreshPayload(payload)) {
          return { payload, shouldRetryWithoutDevice: false };
        }

        const message =
          typeof payload?.message === 'string' && payload.message.trim().length > 0
            ? payload.message.trim()
            : 'Invalid refresh response payload.';
        const shouldRetryWithoutDevice =
          includeDeviceContext && /device/i.test(message);

        return {
          payload: null,
          shouldRetryWithoutDevice,
          failureKind: 'invalid_refresh_payload',
          message,
        };
      } catch (error) {
        const statusCode = isAxiosError(error) ? error.response?.status : undefined;
        const message = extractApiErrorMessage(error) ?? (error as Error)?.message ?? 'Refresh request failed.';

        if (statusCode === 401 || statusCode === 403) {
          return {
            payload: null,
            shouldRetryWithoutDevice: includeDeviceContext && /device/i.test(message),
            failureKind: 'unauthorized',
            message,
          };
        }

        if (statusCode === undefined) {
          return {
            payload: null,
            shouldRetryWithoutDevice: false,
            failureKind: 'network',
            message,
          };
        }

        if (statusCode >= 500) {
          return {
            payload: null,
            shouldRetryWithoutDevice: false,
            failureKind: 'server',
            message,
          };
        }

        return {
          payload: null,
          shouldRetryWithoutDevice: false,
          failureKind: 'unknown',
          message,
        };
      }
    };

    try {
      const strictAttempt = await attemptRefresh(true);
      if (strictAttempt.payload) {
        const token = await persistRefreshedSession(strictAttempt.payload);
        return { token, shouldLogout: false };
      }

      if (strictAttempt.shouldRetryWithoutDevice) {
        // Backward compatibility for legacy sessions bound to unknown-device
        // or mismatched device identifiers.
        const fallbackAttempt = await attemptRefresh(false);
        if (fallbackAttempt.payload) {
          const token = await persistRefreshedSession(fallbackAttempt.payload);
          return { token, shouldLogout: false };
        }

        return {
          token: null,
          shouldLogout: fallbackAttempt.failureKind === 'unauthorized',
          failureKind: fallbackAttempt.failureKind,
          message: fallbackAttempt.message,
        };
      }

      return {
        token: null,
        shouldLogout: strictAttempt.failureKind === 'unauthorized' || strictAttempt.failureKind === 'missing_refresh_token',
        failureKind: strictAttempt.failureKind,
        message: strictAttempt.message,
      };
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
      const hasRefreshToken = !!(await getRefreshToken());
      const canTryRefresh =
        !!originalConfig && !originalConfig._retry && !shouldSkipRefresh(originalConfig) && hasRefreshToken;

      if (canTryRefresh) {
        originalConfig._retry = true;
        const refreshOutcome = await refreshAccessToken();
        const nextAccessToken = refreshOutcome.token;

        if (nextAccessToken) {
          originalConfig.headers = originalConfig.headers ?? {};
          originalConfig.headers.Authorization = `Bearer ${nextAccessToken}`;
          return api.request(originalConfig);
        }

        if (__DEV__) {
          console.warn(
            `[MemoPal][API] Refresh token flow failed. kind=${refreshOutcome.failureKind ?? 'unknown'} message=${refreshOutcome.message ?? 'n/a'}`
          );
        }

        if (!refreshOutcome.shouldLogout) {
          return Promise.reject(error);
        }
      }
      else if (__DEV__ && !hasRefreshToken && !includesAuthEndpoint(originalConfig?.url)) {
        console.warn(
          '[MemoPal][API] No refresh token available for 401 recovery. Session will be cleared.'
        );
      }

      if (!includesAuthEndpoint(originalConfig?.url)) {
        await clearSessionAndRedirectToLogin();
      }
    }
    return Promise.reject(error);
  }
);

export default api;
