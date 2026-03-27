const DAY_MS = 24 * 60 * 60 * 1000;

function startOfLocalDayMs(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

function getDayDiff(lastActiveDate: string | null | undefined, now: Date): number | null {
  if (!lastActiveDate) return null;

  const parsed = new Date(lastActiveDate);
  if (Number.isNaN(parsed.getTime())) return null;

  return Math.floor((startOfLocalDayMs(now) - startOfLocalDayMs(parsed)) / DAY_MS);
}

export function getEffectiveCurrentStreak(
  currentStreak: number,
  lastActiveDate: string | null | undefined,
  now: Date = new Date()
): number {
  const diff = getDayDiff(lastActiveDate, now);
  if (diff === null) return 0;
  if (diff <= 1) return Math.max(0, currentStreak);
  return 0;
}

export function resolveNextStreak(
  input: {
    currentStreak: number;
    longestStreak: number;
    lastActiveDate?: string | null;
  },
  now: Date = new Date()
): { currentStreak: number; longestStreak: number } {
  const diff = getDayDiff(input.lastActiveDate, now);
  const effectiveCurrent = getEffectiveCurrentStreak(
    input.currentStreak,
    input.lastActiveDate ?? null,
    now
  );

  let currentStreak = 1;

  if (diff !== null) {
    if (diff <= 0) {
      // Already active today (or clock skew): keep streak floor at 1.
      currentStreak = Math.max(1, effectiveCurrent);
    } else if (diff === 1) {
      // Consecutive day: extend streak.
      currentStreak = Math.max(1, effectiveCurrent + 1);
    }
  }

  const longestStreak = Math.max(Math.max(0, input.longestStreak), currentStreak);

  return {
    currentStreak,
    longestStreak,
  };
}
