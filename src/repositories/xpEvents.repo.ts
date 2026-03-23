import { db } from '@/db/client';
import * as schema from '@/db/schema';
import { EntityType } from '@/enums/entityType';
import { SourceType } from '@/enums/sourceType';
import { SyncBase } from '@/services/sync/sync.base';
import { and, asc, eq, isNull, sql } from 'drizzle-orm';
import * as Crypto from 'expo-crypto';

export interface XpEventCreateResult {
  id: string;
  levelUpTo?: number;
  achievedMilestones: string[];
  earnedBadges: string[];
}

type BadgeMetrics = {
  completedLessons: number;
  learnedWords: number;
  level: number;
  totalReviews: number;
  totalXp: number;
  currentStreak: number;
  missionCompletions: number;
};

function isBadgeEarnedByKey(key: string, metrics: BadgeMetrics): boolean {
  const normalized = key.trim().toLowerCase();

  switch (normalized) {
    case 'first_lesson':
    case 'palace_pioneer':
      return metrics.completedLessons >= 1;
    case 'palace_complete':
      return metrics.completedLessons >= 3;
    case 'lesson_sprinter':
      return metrics.completedLessons >= 5;
    case 'memory_builder':
      return metrics.completedLessons >= 10 && metrics.learnedWords >= 100;
    case 'review_25':
      return metrics.totalReviews >= 25;
    case 'review_rhythm':
      return metrics.totalReviews >= 10;
    case 'review_streak_7':
      return metrics.currentStreak >= 7;
    case 'review_streak_30':
      return metrics.currentStreak >= 30;
    case 'level_5':
    case 'level_climber_5':
      return metrics.level >= 5;
    case 'level_master_10':
      return metrics.level >= 10;
    case 'word_collector_300':
      return metrics.learnedWords >= 300;
    case 'mission_specialist':
      return metrics.missionCompletions >= 5;
    default:
      break;
  }

  const dynamicMetricMatch = normalized.match(
    /^(level|reviews|lessons_completed|words_learned|total_xp|streak_days|missions_completed)_(\d+)$/
  );

  if (dynamicMetricMatch) {
    const [, metric, rawTarget] = dynamicMetricMatch;
    const target = Number(rawTarget);
    if (Number.isNaN(target)) return false;

    switch (metric) {
      case 'level':
        return metrics.level >= target;
      case 'reviews':
        return metrics.totalReviews >= target;
      case 'lessons_completed':
        return metrics.completedLessons >= target;
      case 'words_learned':
        return metrics.learnedWords >= target;
      case 'total_xp':
        return metrics.totalXp >= target;
      case 'streak_days':
        return metrics.currentStreak >= target;
      case 'missions_completed':
        return metrics.missionCompletions >= target;
      default:
        return false;
    }
  }

  const reviewStreakMatch = normalized.match(/^review_streak_(\d+)$/);
  if (reviewStreakMatch) {
    return metrics.currentStreak >= Number(reviewStreakMatch[1]);
  }

  const levelClimberMatch = normalized.match(/^level_climber_(\d+)$/);
  if (levelClimberMatch) {
    return metrics.level >= Number(levelClimberMatch[1]);
  }

  const levelMasterMatch = normalized.match(/^level_master_(\d+)$/);
  if (levelMasterMatch) {
    return metrics.level >= Number(levelMasterMatch[1]);
  }

  const wordCollectorMatch = normalized.match(/^word_collector_(\d+)$/);
  if (wordCollectorMatch) {
    return metrics.learnedWords >= Number(wordCollectorMatch[1]);
  }

  return false;
}

interface XpEventsRepository {
  getAll(): Promise<any[]>;
  getTotalXp(): Promise<number>;
  getBySourceType(sourceType: string): Promise<any[]>;
  create(data: {
    sourceType: string;
    sourceId?: string;
    xpAmount: number;
    clientEventId: string;
  }): Promise<XpEventCreateResult>;
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
    }): Promise<XpEventCreateResult> {
      const now = new Date().toISOString();
      const currentUser = await db.query.users.findFirst({ columns: { id: true } });
      if (!currentUser) {
        throw new Error('No local user found to apply XP event.');
      }

      const existing = await db.query.xpEvents.findFirst({
        columns: { id: true },
        where: eq(schema.xpEvents.clientEventId, data.clientEventId),
      });

      if (existing) {
        return { id: existing.id, achievedMilestones: [], earnedBadges: [] };
      }

      const id = Crypto.randomUUID();
      let persistedId = id;
      let levelUpTo: number | undefined;
      const achievedMilestones: string[] = [];
      const earnedBadges: string[] = [];

      await db.transaction(async (tx) => {
        const duplicateInTx = await tx.query.xpEvents.findFirst({
          columns: { id: true },
          where: eq(schema.xpEvents.clientEventId, data.clientEventId),
        });

        if (duplicateInTx) {
          persistedId = duplicateInTx.id;
          return;
        }

        await tx.insert(schema.xpEvents).values({
          id,
          sourceType: data.sourceType as any,
          sourceId: data.sourceId,
          xpAmount: data.xpAmount,
          clientEventId: data.clientEventId,
          createdAt: now,
          updatedAt: now,
        });

        await tx
          .update(schema.users)
          .set({
            totalXp: sql`${schema.users.totalXp} + ${data.xpAmount}`,
            updatedAt: now,
          })
          .where(eq(schema.users.id, currentUser.id));

        const userAfterXp = await tx.query.users.findFirst({
          where: eq(schema.users.id, currentUser.id),
        });
        if (userAfterXp) {
          const eligibleLevel = await tx.query.levelConfigs.findFirst({
            where: sql`${schema.levelConfigs.requiredXp} <= ${userAfterXp.totalXp}`,
            orderBy: (fields, { desc }) => [desc(fields.requiredXp), desc(fields.level)],
          });
          const resolvedLevel = Math.max(1, eligibleLevel?.level ?? 1);

          if (resolvedLevel !== userAfterXp.level) {
            await tx
              .update(schema.users)
              .set({ level: resolvedLevel, updatedAt: now })
              .where(eq(schema.users.id, userAfterXp.id));
            levelUpTo = resolvedLevel;
          }
        }

        const [userStats, userSnapshot] = await Promise.all([
          tx.query.userStats.findFirst({
            where: eq(schema.userStats.userId, currentUser.id),
          }),
          tx.query.users.findFirst({
            where: eq(schema.users.id, currentUser.id),
          }),
        ]);

        const reviewAggregate = await tx
          .select({
            total: sql<number>`coalesce(sum(${schema.lessonProgress.totalReviews}), 0)`,
          })
          .from(schema.lessonProgress);

        const missionAggregate = await tx
          .select({
            total: sql<number>`count(*)`,
          })
          .from(schema.xpEvents)
          .where(
            and(
              eq(schema.xpEvents.isDeleted, false),
              eq(schema.xpEvents.sourceType, SourceType.MissionComplete)
            )
          );

        const metrics: BadgeMetrics = {
          completedLessons: Math.max(0, userStats?.lessonsCompleted ?? 0),
          learnedWords: Math.max(0, userStats?.wordsLearned ?? 0),
          level: Math.max(1, userSnapshot?.level ?? userAfterXp?.level ?? 1),
          totalReviews: Math.max(0, reviewAggregate[0]?.total ?? 0),
          totalXp: Math.max(0, userSnapshot?.totalXp ?? userAfterXp?.totalXp ?? 0),
          currentStreak: Math.max(0, userStats?.currentStreak ?? 0),
          missionCompletions: Math.max(0, missionAggregate[0]?.total ?? 0),
        };

        const milestonesToAward = await tx.query.milestones.findMany({
          where: and(eq(schema.milestones.isDeleted, false), isNull(schema.milestones.achievedAt)),
        });

        for (const milestone of milestonesToAward) {
          const pass =
            (milestone.conditionType === 'lessons_completed' &&
              metrics.completedLessons >= milestone.conditionValue) ||
            (milestone.conditionType === 'words_learned' &&
              metrics.learnedWords >= milestone.conditionValue) ||
            (milestone.conditionType === 'level' && metrics.level >= milestone.conditionValue) ||
            (milestone.conditionType === 'total_xp' && metrics.totalXp >= milestone.conditionValue) ||
            (milestone.conditionType === 'streak_days' &&
              metrics.currentStreak >= milestone.conditionValue);

          if (pass) {
            await tx
              .update(schema.milestones)
              .set({ achievedAt: now, updatedAt: now })
              .where(eq(schema.milestones.id, milestone.id));
            achievedMilestones.push(milestone.title);
          }
        }

        const badgesToAward = await tx.query.badges.findMany({
          where: and(eq(schema.badges.isDeleted, false), isNull(schema.badges.earnedAt)),
        });

        for (const badge of badgesToAward) {
          if (!isBadgeEarnedByKey(badge.key, metrics)) {
            continue;
          }

          await tx
            .update(schema.badges)
            .set({ earnedAt: now, updatedAt: now })
            .where(eq(schema.badges.id, badge.id));
          earnedBadges.push(badge.name);
        }

        await SyncBase.addToQueue(tx as any, {
          entityType: EntityType.XP_EVENT,
          entityId: persistedId,
          action: 'create',
          payload: { ...data, id: persistedId, createdAt: now, updatedAt: now },
        });
      });

      return { id: persistedId, levelUpTo, achievedMilestones, earnedBadges };
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
