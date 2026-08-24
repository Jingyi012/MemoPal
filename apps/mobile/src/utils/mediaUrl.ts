import { mapLocalhostForExpoGo, trimTrailingSlash } from '@/utils/network/localhost';

function normalizePathPrefix(path?: string): string {
  const value = (path ?? '').trim();
  if (!value) return '';

  const withLeadingSlash = value.startsWith('/') ? value : `/${value}`;
  const normalized = withLeadingSlash.replace(/\/+$/, '');
  return normalized === '/' ? '' : normalized;
}

function normalizeRelativePath(path: string): string {
  const trimmed = path.trim();
  if (!trimmed) return '/';
  return `/${trimmed.replace(/^\/+/, '')}`;
}

function hasPathPrefix(path: string, prefix: string): boolean {
  if (!prefix) return true;
  return path === prefix || path.startsWith(`${prefix}/`);
}

function collapseDuplicatePrefix(path: string, prefix: string): string {
  if (!prefix || !path) return path;

  let current = path;
  const duplicatedPrefix = `${prefix}${prefix}/`;
  while (current.startsWith(duplicatedPrefix)) {
    current = current.slice(prefix.length);
  }

  return current;
}

function resolveMediaBaseUrl(): string {
  const configured = process.env.EXPO_PUBLIC_MEDIA_BASE_URL?.trim();
  if (configured) {
    return mapLocalhostForExpoGo(trimTrailingSlash(configured));
  }

  const apiBase = process.env.EXPO_PUBLIC_API_BASE_URL?.trim();
  if (!apiBase) return '';

  return mapLocalhostForExpoGo(`${trimTrailingSlash(apiBase)}/files`);
}

function getBaseInfo(baseUrl: string): { origin: string; pathPrefix: string } {
  if (!baseUrl) return { origin: '', pathPrefix: '' };

  try {
    const url = new URL(baseUrl);
    return {
      origin: url.origin,
      pathPrefix: normalizePathPrefix(url.pathname),
    };
  } catch {
    return { origin: '', pathPrefix: '' };
  }
}

export function resolveMediaUrl(rawPath?: string | null): string {
  if (!rawPath) return '';

  const path = rawPath.trim();
  if (!path) return '';
  if (/^(blob:|data:|file:|content:)/i.test(path)) return path;

  const baseUrl = resolveMediaBaseUrl();
  const { origin, pathPrefix } = getBaseInfo(baseUrl);

  if (/^https?:\/\//i.test(path)) {
    if (!baseUrl || !pathPrefix) {
      return mapLocalhostForExpoGo(path);
    }

    try {
      const absoluteUrl = new URL(path);
      const sameOrigin = absoluteUrl.origin.toLowerCase() === origin.toLowerCase();
      if (!sameOrigin || hasPathPrefix(absoluteUrl.pathname, pathPrefix)) {
        absoluteUrl.pathname = collapseDuplicatePrefix(absoluteUrl.pathname, pathPrefix);
        return mapLocalhostForExpoGo(absoluteUrl.toString());
      }

      absoluteUrl.pathname = `${pathPrefix}${normalizeRelativePath(absoluteUrl.pathname)}`;
      absoluteUrl.pathname = collapseDuplicatePrefix(absoluteUrl.pathname, pathPrefix);
      return mapLocalhostForExpoGo(absoluteUrl.toString());
    } catch {
      return mapLocalhostForExpoGo(path);
    }
  }

  const normalizedPath = normalizeRelativePath(path);
  const mediaPath = hasPathPrefix(normalizedPath, pathPrefix)
    ? normalizedPath
    : `${pathPrefix}${normalizedPath}`;
  const normalizedMediaPath = collapseDuplicatePrefix(mediaPath, pathPrefix);

  if (!baseUrl) return normalizedMediaPath;
  if (origin) return `${origin}${normalizedMediaPath}`;
  return `${baseUrl}${normalizedMediaPath}`;
}

