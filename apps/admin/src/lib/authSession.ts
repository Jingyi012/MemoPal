const deviceIdStorageKey = "memopal.admin.device-id";
const maxDeviceNameLength = 256;

function generateDeviceId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `web-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function resolveDeviceName(): string {
  if (typeof navigator === "undefined") {
    return "web-admin-portal";
  }

  const platform = navigator.platform || "unknown-platform";
  const userAgent = navigator.userAgent || "unknown-browser";
  const raw = `web:${platform}:${userAgent}`;
  return raw.length <= maxDeviceNameLength ? raw : raw.slice(0, maxDeviceNameLength);
}

export function getDeviceSessionContext(): { deviceId: string; deviceName: string } {
  const existing = localStorage.getItem(deviceIdStorageKey)?.trim();
  if (existing) {
    return { deviceId: existing, deviceName: resolveDeviceName() };
  }

  const generated = generateDeviceId();
  localStorage.setItem(deviceIdStorageKey, generated);
  return { deviceId: generated, deviceName: resolveDeviceName() };
}
