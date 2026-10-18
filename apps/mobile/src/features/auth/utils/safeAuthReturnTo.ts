/** Keep post-auth navigation on known app-owned public Community routes. */
export function getSafeAuthReturnTo(value: unknown): string | null {
  if (typeof value !== 'string' || value.length > 160) return null;
  const segment = '[A-Za-z0-9_-]{1,100}';
  if (/^\/community\/(?:leaderboard|education|education\/(?:saved|history))$/.test(value)) return value;
  const memorySet = new RegExp(`^/community/memory-sets/(${segment})$`).exec(value);
  if (memorySet) return `/community/memory-sets/${memorySet[1]}`;
  const publicCourse = new RegExp(`^/community/education/(${segment})(?:/(${segment}))?$`).exec(value);
  return publicCourse ? value : null;
}
