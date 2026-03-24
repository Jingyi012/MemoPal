import { createUserRepository } from '@/repositories/user.repo';
import { createXpEventsRepository } from '@/repositories/xpEvents.repo';

const userRepo = createUserRepository();
const xpRepo = createXpEventsRepository();

export async function getXpIntegrityStatus() {
  const user = await userRepo.getCurrent();
  const xpEventsTotal = await xpRepo.getHistoryXpTotal();
  const userXp = user?.totalXp ?? 0;

  return {
    ok: userXp === xpEventsTotal,
    userXp,
    xpEventsTotal,
  };
}
