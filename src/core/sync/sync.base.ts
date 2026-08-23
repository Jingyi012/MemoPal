import * as schema from '@/db/schema';
import { EntityType } from '@/enums/entityType';
import { and, eq, inArray, sql } from 'drizzle-orm';
import { SyncObserver } from './sync.observer';

// We use 'any' for the db type here to allow both the Drizzle client
// and the Transaction object (tx) to be passed in.
export type DrizzleClient = any;

export const SyncBase = {
  /**
   * Adds an action to the sync queue.
   * Can accept the main db or a transaction 'tx'.
   */
  async addToQueue(
    db: DrizzleClient,
    params: {
      entityType: string;
      entityId: string;
      action: 'create' | 'update' | 'delete';
      payload?: any;
    }
  ) {
    await db.insert(schema.syncQueue).values({
      entityType: params.entityType,
      entityId: params.entityId,
      action: params.action,
      payload: params.payload ? JSON.stringify(params.payload) : null,
      createdAt: new Date().toISOString(),
    });

    SyncObserver.emitDataChange();
  },

  async addManyToQueue(
    tx: any,
    items: {
      entityType: string;
      entityId: string;
      action: 'create' | 'update' | 'delete';
      payload?: any;
    }[]
  ) {
    if (items.length === 0) return;

    await tx.insert(schema.syncQueue).values(
      items.map((item) => ({
        entityType: item.entityType,
        entityId: item.entityId,
        action: item.action,
        payload: item.payload ? JSON.stringify(item.payload) : null,
        createdAt: new Date().toISOString(),
      }))
    );
    SyncObserver.emitDataChange();
  },

  /**
   * Removes all pending sync tasks for a specific entity ID.
   */
  async removePendingSyncs(db: DrizzleClient, entityId: string) {
    await db.delete(schema.syncQueue).where(eq(schema.syncQueue.entityId, entityId));
  },

  /**
   * Checks if an entity has pending sync actions.
   */
  async isDirty(db: DrizzleClient, entityId: string): Promise<boolean> {
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(schema.syncQueue)
      .where(eq(schema.syncQueue.entityId, entityId));

    return (result[0]?.count ?? 0) > 0;
  },

  /**
   * Returns a Set of IDs from a list that have pending changes.
   * Useful for conflict resolution during upsertMany.
   */
  async getEntityDirtyIds(
    db: DrizzleClient,
    ids: string[],
    entityType: EntityType
  ): Promise<Set<string>> {
    if (ids.length === 0) return new Set();

    const result = await db
      .select({ entityId: schema.syncQueue.entityId })
      .from(schema.syncQueue)
      .where(
        and(eq(schema.syncQueue.entityType, entityType), inArray(schema.syncQueue.entityId, ids))
      );

    return new Set(result.map((r: any) => r.entityId));
  },
};
