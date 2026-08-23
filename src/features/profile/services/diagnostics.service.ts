import { userStatsApi } from '@/features/gamification/shared/api/userStats';
import { xpEventApi } from '@/features/gamification/shared/api/xpEvent';

export async function getXpIntegrityStatus() {
  const [level, events] = await Promise.all([userStatsApi.getLevel(), xpEventApi.getAll()]);
  const xpEventsTotal = events.reduce((total, event) => total + event.xpAmount, 0);
  const userXp = level.xp;

  return {
    ok: userXp === xpEventsTotal,
    userXp,
    xpEventsTotal,
  };
}
