import { db } from '@/db/client';
import * as schema from '@/db/schema';
import { EntityType } from '@/enums/entityType';
import { SyncBase } from '@/services/sync/sync.base';
import { and, asc, eq, sql } from 'drizzle-orm';
import * as Crypto from 'expo-crypto';

interface XpEventsRepository {
  getAll(): Promise<any[]>;
  getTotalXp(): Promise<number>;
  getBySourceType(sourceType: string): Promise<any[]>;
  create(data: {
    sourceType: string;
    sourceId?: string;
    xpAmount: number;
    clientEventId: string;
  }): Promise<string>;
  upsertMany(xpEvents: any[]): Promise<void>;
  delete(eventId: string): Promise<void>;
}

export function createXpEventsRepository(): XpEventsRepository {
  return {
    async getAll(): Promise<any[]> {
      return await db.query.xpEvents.findMany({
        where: eq(schema.xpEvents.isDeleted, false),
        orderBy: [asc(schema.xpEvents.createdAt)],
      });
    },

    /**
     * Efficiently calculates total XP using SQL sum
     */
    async getTotalXp(): Promise<number> {
      const result = await db
        .select({ total: sql<number>`sum(${schema.xpEvents.xpAmount})` })
        .from(schema.xpEvents)
        .where(eq(schema.xpEvents.isDeleted, false));

      return result[0]?.total ?? 0;
    },

    async getBySourceType(sourceType: string): Promise<any[]> {
      return await db.query.xpEvents.findMany({
        where: and(
          eq(schema.xpEvents.sourceType, sourceType as any),
          eq(schema.xpEvents.isDeleted, false)
        ),
      });
    },

    async create(data: {
      sourceType: string;
      sourceId?: string;
      xpAmount: number;
      clientEventId: string;
    }): Promise<string> {
      const now = new Date().toISOString();
      const id = Crypto.randomUUID();

      await db.transaction(async (tx) => {
        await tx.insert(schema.xpEvents).values({
          id,
          sourceType: data.sourceType as any,
          sourceId: data.sourceId,
          xpAmount: data.xpAmount,
          clientEventId: data.clientEventId,
          createdAt: now,
          updatedAt: now,
        });

        await SyncBase.addToQueue(tx as any, {
          entityType: EntityType.XP_EVENT,
          entityId: id,
          action: 'create',
          payload: { ...data, id, createdAt: now },
        });
      });

      return id;
    },

    async upsertMany(xpEvents: any[]): Promise<void> {
      if (xpEvents.length === 0) return;

      await db.transaction(async (tx) => {
        for (const event of xpEvents) {
          // XP Events are typically immutable (historical logs),
          // so onConflictDoNothing is usually the right choice.
          await tx
            .insert(schema.xpEvents)
            .values({
              ...event,
              isDeleted: Boolean(event.isDeleted),
            })
            .onConflictDoNothing();
        }
      });
    },

    async delete(eventId: string): Promise<void> {
      await db.transaction(async (tx) => {
        const record = await tx.query.xpEvents.findFirst({
          columns: { lastSyncedAt: true },
          where: eq(schema.xpEvents.id, eventId),
        });

        if (!record) return;

        const now = new Date().toISOString();

        if (record.lastSyncedAt) {
          await SyncBase.addToQueue(tx as any, {
            entityType: EntityType.XP_EVENT,
            entityId: eventId,
            action: 'delete',
          });
        } else {
          await SyncBase.removePendingSyncs(tx as any, eventId);
        }

        await tx
          .update(schema.xpEvents)
          .set({ isDeleted: true, deletedAt: now, updatedAt: now })
          .where(eq(schema.xpEvents.id, eventId));
      });
    },
  };
}
