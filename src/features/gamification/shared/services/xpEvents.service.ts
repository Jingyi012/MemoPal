import { SourceType } from '@/enums/sourceType';
import { createXpEventsRepository, XpEventCreateResult } from '@/features/gamification/shared/repositories/xpEvents.repo';
import * as Crypto from 'expo-crypto';

const repo = createXpEventsRepository();

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
  return await repo.create({
    sourceType: sourceType as string,
    sourceId,
    xpAmount,
    clientEventId,
  }, options);
}

export async function getBySourceType(sourceType: string): Promise<any[]> {
  return await repo.getBySourceType(sourceType);
}
