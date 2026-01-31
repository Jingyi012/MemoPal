import { db } from '@/db/client';
import * as schema from '@/db/schema';
import { EntityType } from '@/enums/entityType';
import { SyncBase } from '@/services/sync/sync.base';
import { and, asc, eq } from 'drizzle-orm';

export function useXpEventsRepository() {
  /**
   * Get all XP events for a user
   */
  const getByUserId = async (userId: string) => {
    return await db.query.xpEvents.findMany({
      where: eq(schema.xpEvents.userId, userId),
      orderBy: [asc(schema.xpEvents.createdAt)],
    });
  };

  /**
   * Get total XP earned by user
   */
  const getTotalXpByUserId = async (userId: string): Promise<number> => {
    const events = await getByUserId(userId);
    return events.reduce((sum, event) => sum + event.xpAmount, 0);
  };

  /**
   * Get XP events by source type
   */
  const getBySourceType = async (userId: string, sourceType: string) => {
    return await db.query.xpEvents.findMany({
      where: and(
        eq(schema.xpEvents.userId, userId),
        eq(schema.xpEvents.sourceType, sourceType as any)
      ),
    });
  };

  /**
   * Create XP event
   */
  const create = async (data: {
    userId: string;
    sourceType: string;
    sourceId?: string;
    xpAmount: number;
    clientEventId: string;
  }) => {
    const now = new Date().toISOString();
    const id = crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`;

    await db.transaction(async (tx) => {
      await tx.insert(schema.xpEvents).values({
        id,
        userId: data.userId,
        sourceType: data.sourceType as any,
        sourceId: data.sourceId,
        xpAmount: data.xpAmount,
        clientEventId: data.clientEventId,
        createdAt: now,
      });

      await SyncBase.addToQueue(tx as any, {
        entityType: EntityType.XP_EVENT,
        entityId: id,
        action: 'create',
        payload: {
          userId: data.userId,
          sourceType: data.sourceType,
          sourceId: data.sourceId,
          xpAmount: data.xpAmount,
          clientEventId: data.clientEventId,
        },
      });
    });

    return id;
  };

  /**
   * Upsert XP events from server
   */
  const upsertMany = async (
    xpEvents: Array<{
      id: string;
      userId: string;
      sourceType: string;
      sourceId?: string;
      xpAmount: number;
      clientEventId: string;
      createdAt: string;
    }>
  ) => {
    if (xpEvents.length === 0) return;

    for (const event of xpEvents) {
      await db
        .insert(schema.xpEvents)
        .values({
          id: event.id,
          userId: event.userId,
          sourceType: event.sourceType as any,
          sourceId: event.sourceId,
          xpAmount: event.xpAmount,
          clientEventId: event.clientEventId,
          createdAt: event.createdAt,
        })
        .onConflictDoNothing();
    }
  };

  return {
    getByUserId,
    getTotalXpByUserId,
    getBySourceType,
    create,
    upsertMany,
  };
}
