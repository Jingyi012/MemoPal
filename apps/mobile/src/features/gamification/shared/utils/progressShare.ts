export function buildProgressShareMessage(
  streakDays: number,
  weeklyActiveDays: number,
  weeklySessions: number,
  labels: Readonly<{
    streak: string;
    activeDays: string;
    sessions: string;
    privacyNote: string;
  }>,
): string {
  const safe = (value: number) => Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
  return `${labels.streak}: ${safe(streakDays)}\n${labels.activeDays}: ${safe(weeklyActiveDays)}\n${labels.sessions}: ${safe(weeklySessions)}\n${labels.privacyNote}`;
}
