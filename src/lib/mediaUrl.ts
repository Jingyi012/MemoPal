const ENV_MEDIA_BASE_URL = import.meta.env.VITE_MEDIA_BASE_URL;

function normalizeBaseUrl(baseUrl?: string): string {
  return (baseUrl ?? "").trim().replace(/\/+$/, "");
}

function normalizePathPrefix(path?: string): string {
  const value = (path ?? "").trim();
  if (!value) return "";

  const withLeadingSlash = value.startsWith("/") ? value : `/${value}`;
  const normalized = withLeadingSlash.replace(/\/+$/, "");
  return normalized === "/" ? "" : normalized;
}

function normalizeRelativePath(path: string): string {
  return path.startsWith("/") ? path : `/${path}`;
}

function getBasePathPrefix(baseUrl: string): string {
  if (!baseUrl) return "";

  try {
    return normalizePathPrefix(new URL(baseUrl).pathname);
  } catch {
    return "";
  }
}

function hasPathPrefix(path: string, prefix: string): boolean {
  if (!prefix) return true;
  return path === prefix || path.startsWith(`${prefix}/`);
}

export function resolveMediaUrl(rawPath: string, fallbackBaseUrl?: string): string {
  if (!rawPath) return rawPath;

  const path = rawPath.trim();
  if (!path) return path;
  if (/^(blob:|data:)/i.test(path)) return path;

  const baseUrl = normalizeBaseUrl(ENV_MEDIA_BASE_URL || fallbackBaseUrl);
  const basePathPrefix = getBasePathPrefix(baseUrl);

  if (/^https?:\/\//i.test(path)) {
    if (!baseUrl || !basePathPrefix) return path;

    try {
      const absoluteUrl = new URL(path);
      const base = new URL(baseUrl);
      const sameOrigin = absoluteUrl.origin.toLowerCase() === base.origin.toLowerCase();
      if (!sameOrigin || hasPathPrefix(absoluteUrl.pathname, basePathPrefix)) {
        return path;
      }

      absoluteUrl.pathname = `${basePathPrefix}${normalizeRelativePath(absoluteUrl.pathname)}`;
      return absoluteUrl.toString();
    } catch {
      return path;
    }
  }

  const normalizedPath = normalizeRelativePath(path);
  const publicPath = hasPathPrefix(normalizedPath, basePathPrefix)
    ? normalizedPath
    : `${basePathPrefix}${normalizedPath}`;

  if (!baseUrl) return publicPath;
  return `${baseUrl}${publicPath}`;
}
