import { SourceType } from '@/enums/sourceType';
import { createXpEventsRepository } from '@/repositories/xpEvents.repo';
import * as Crypto from 'expo-crypto';

const repo = createXpEventsRepository();

export async function recordXpEvent(
  sourceType: SourceType,
  xpAmount: number,
  sourceId?: string
): Promise<string> {
  const clientEventId = Crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`;

  return await repo.create({
    sourceType: sourceType as string,
    sourceId,
    xpAmount,
    clientEventId,
  });
}

export async function getBySourceType(sourceType: string): Promise<any[]> {
  return await repo.getBySourceType(sourceType);
}
