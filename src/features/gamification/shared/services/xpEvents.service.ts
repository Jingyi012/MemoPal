import { SourceType } from '@/enums/sourceType';
import { xpEventApi } from '@/features/gamification/shared/api/xpEvent';
import * as Crypto from 'expo-crypto';

export interface XpEventCreateResult {
  id: string;
  levelUpTo?: number;
  achievedMilestones: string[];
  earnedBadges: string[];
}

export async function recordXpEvent(
  sourceType: SourceType,
  xpAmount: number,
  sourceId?: string,
  options?: { trackActivity?: boolean }
): Promise<XpEventCreateResult> {
  const clientEventId = Crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`;

  return await recordXpEventWithClientEventId(sourceType, xpAmount, clientEventId, sourceId, options);
}

export async function recordXpEventWithClientEventId(
  sourceType: SourceType,
  xpAmount: number,
  clientEventId: string,
  sourceId?: string,
  options?: { trackActivity?: boolean }
): Promise<XpEventCreateResult> {
  const created = await xpEventApi.create({
    id: Crypto.randomUUID(),
    sourceType,
    sourceId,
    xpAmount,
    clientEventId,
  });

  return {
    id: created.id,
    achievedMilestones: [],
    earnedBadges: [],
  };
}

export async function getBySourceType(sourceType: string) {
  const events = await xpEventApi.getAll();
  return events.filter((event) => event.sourceType === sourceType);
}
