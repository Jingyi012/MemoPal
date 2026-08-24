import axios, { type InternalAxiosRequestConfig } from "axios";
import type { ApiResponse } from "../types/api";
import type { AuthResponse } from "../types/auth";
import { getDeviceSessionContext } from "./authSession";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5080";

export const tokenStorageKey = "memopal.admin.token";
export const refreshTokenStorageKey = "memopal.admin.refresh-token";
export const authSessionExpiredEventName = "memopal.admin.auth-session-expired";

const AUTH_ENDPOINTS_SKIP_REFRESH = [
  "/auth/login",
  "/auth/register",
  "/auth/google",
  "/auth/facebook",
  "/auth/refresh",
  "/auth/login-methods",
] as const;

type RetryableRequestConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
};

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
});

function isApiEnvelope(value: unknown): value is { success?: unknown; message?: unknown } {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  return Object.prototype.hasOwnProperty.call(value, "success");
}

function includesAuthEndpoint(url?: string): boolean {
  if (!url) return false;
  return AUTH_ENDPOINTS_SKIP_REFRESH.some((endpoint) => url.includes(endpoint));
}

function shouldSkipRefresh(config?: RetryableRequestConfig): boolean {
  if (!config) return false;
  const headerValue = config.headers?.["X-MemoPal-Skip-Refresh"];
  const skipByHeader = String(headerValue ?? "").trim() === "1";
  return skipByHeader || includesAuthEndpoint(config.url);
}

export function getStoredAccessToken(): string | null {
  return localStorage.getItem(tokenStorageKey);
}

export function getStoredRefreshToken(): string | null {
  return localStorage.getItem(refreshTokenStorageKey);
}

export function setStoredAuthSession(payload: {
  token: string;
  refreshToken?: string | null;
}): void {
  localStorage.setItem(tokenStorageKey, payload.token);

  if (typeof payload.refreshToken === "string" && payload.refreshToken.trim().length > 0) {
    localStorage.setItem(refreshTokenStorageKey, payload.refreshToken);
  }
}

export function clearStoredAuthSession(): void {
  localStorage.removeItem(tokenStorageKey);
  localStorage.removeItem(refreshTokenStorageKey);
}

function notifyAuthSessionExpired(): void {
  window.dispatchEvent(new Event(authSessionExpiredEventName));
}

function isValidAuthPayload(payload: ApiResponse<AuthResponse> | null | undefined): payload is ApiResponse<AuthResponse> {
  return !!(
    payload?.success &&
    payload.data?.token &&
    payload.data?.refreshToken
  );
}

let refreshRequestInFlight: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  if (refreshRequestInFlight) {
    return refreshRequestInFlight;
  }

  refreshRequestInFlight = (async () => {
    const refreshToken = getStoredRefreshToken();
    if (!refreshToken) {
      return null;
    }

    const device = getDeviceSessionContext();
    try {
      const response = await axios.post<ApiResponse<AuthResponse>>(
        `${API_BASE_URL}/auth/refresh`,
        {
          refreshToken,
          deviceId: device.deviceId,
          deviceName: device.deviceName,
        },
        {
          headers: {
            "Content-Type": "application/json",
            "X-MemoPal-Skip-Refresh": "1",
          },
        },
      );

      if (!isValidAuthPayload(response.data)) {
        return null;
      }

      setStoredAuthSession({
        token: response.data.data.token,
        refreshToken: response.data.data.refreshToken,
      });

      return response.data.data.token;
    } catch {
      return null;
    } finally {
      refreshRequestInFlight = null;
    }
  })();

  return refreshRequestInFlight;
}

apiClient.interceptors.request.use((config) => {
  const token = getStoredAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

apiClient.interceptors.response.use((response) => {
  const body = response.data;
  if (isApiEnvelope(body) && body.success === false) {
    const fallbackMessage = "Request failed.";
    const message =
      typeof body.message === "string" && body.message.trim().length > 0
        ? body.message.trim()
        : fallbackMessage;

    // Throw a regular Error so React Query treats this as a failed request.
    throw new Error(message);
  }

  return response;
}, async (error) => {
  const statusCode = error?.response?.status as number | undefined;
  const originalConfig = error?.config as RetryableRequestConfig | undefined;

  if (statusCode === 401 && originalConfig) {
    const canTryRefresh = !originalConfig._retry && !shouldSkipRefresh(originalConfig);

    if (canTryRefresh) {
      originalConfig._retry = true;
      const nextAccessToken = await refreshAccessToken();
      if (nextAccessToken) {
        originalConfig.headers = originalConfig.headers ?? {};
        originalConfig.headers.Authorization = `Bearer ${nextAccessToken}`;
        return apiClient.request(originalConfig);
      }
    }

    if (!includesAuthEndpoint(originalConfig.url)) {
      clearStoredAuthSession();
      notifyAuthSessionExpired();
    }
  }

  return Promise.reject(error);
});
