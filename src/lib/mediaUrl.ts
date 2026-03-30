const MEDIA_BASE_URL = import.meta.env.VITE_MEDIA_BASE_URL;

function ensureLeadingSlash(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "/";
  return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
}

export function resolveMediaUrl(
  rawPath: string,
  fallbackBaseUrl?: string,
): string {
  if (!rawPath) return rawPath;

  const value = rawPath.trim();
  if (!value) return value;

  if (/^(blob:|data:|https?:\/\/)/i.test(value)) {
    return value;
  }

  const baseUrl = (MEDIA_BASE_URL || fallbackBaseUrl || "")
    .trim()
    .replace(/\/+$/, "");
  if (!baseUrl) {
    return ensureLeadingSlash(value);
  }

  const normalizedPath = ensureLeadingSlash(value);

  try {
    const mediaUrl = new URL(baseUrl);
    const mediaPrefix = mediaUrl.pathname.replace(/\/+$/, "");
    const pathWithoutPrefix =
      mediaPrefix &&
      (normalizedPath === mediaPrefix ||
        normalizedPath.startsWith(`${mediaPrefix}/`))
        ? normalizedPath.slice(mediaPrefix.length) || "/"
        : normalizedPath;

    return `${mediaUrl.origin}${mediaPrefix}${pathWithoutPrefix}`;
  } catch {
    return `${baseUrl}${normalizedPath}`;
  }
}
