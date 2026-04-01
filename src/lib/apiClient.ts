import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5080";

export const tokenStorageKey = "memopal.admin.token";

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

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem(tokenStorageKey);
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
});
