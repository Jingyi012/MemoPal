export function getEducationAuthoringPortalUrl(
  configuredBaseUrl = process.env.EXPO_PUBLIC_ADMIN_PORTAL_URL?.trim(),
): string | null {
  if (!configuredBaseUrl) return null;

  try {
    const parsed = new URL(configuredBaseUrl);
    if (parsed.protocol !== 'https:' || parsed.username || parsed.password) return null;
    return new URL('/education/courses', parsed.origin).toString();
  } catch {
    return null;
  }
}
