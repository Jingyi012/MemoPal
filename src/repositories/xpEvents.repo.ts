import { db } from '@/db/client';
import { SYSTEM_SETTING_KEYS } from '@/constants/systemSettingKeys';
import * as schema from '@/db/schema';
import { EntityType } from '@/enums/entityType';
import { SourceType } from '@/enums/sourceType';
import { SyncBase } from '@/services/sync/sync.base';
import { isBadgeAchievementMet } from '@/utils/gamification/badgeRuleEvaluator';
import { resolveNextStreak } from '@/utils/gamification/streak';
import { and, asc, eq, isNull, sql } from 'drizzle-orm';
import * as Crypto from 'expo-crypto';

type ResolvedLevelConfig = {
  level: number;
  requiredXp: number;
};

function parseLevelConfigs(rawValue: string | null | undefined): ResolvedLevelConfig[] {
  if (!rawValue) return [];

  try {
    const parsed = JSON.parse(rawValue);
    const source = Array.isArray(parsed)
      ? parsed
      : Array.isArray(parsed?.levels)
        ? parsed.levels
        : Array.isArray(parsed?.configs)
          ? parsed.configs
          : [];

    return source
      .filter((item: any) => item && typeof item === 'object')
      .map((item: any) => ({
        level: Number(item.level ?? 0),
        requiredXp: Number(item.requiredXp ?? 0),
      }))
      .filter((item) => item.level > 0)
      .sort((a, b) => a.requiredXp - b.requiredXp || a.level - b.level);
  } catch {
    return [];
  }
}

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

interface XpEventsRepository {
  getAll(): Promise<any[]>;
  getTotalXp(): Promise<number>;
  getHistoryXpTotal(): Promise<number>;
  getBySourceType(sourceType: string): Promise<any[]>;
  create(data: {
    sourceType: string;
    sourceId?: string;
    xpAmount: number;
    clientEventId: string;
  }, options?: { trackActivity?: boolean }): Promise<XpEventCreateResult>;
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

    async getTotalXp(): Promise<number> {
      const user = await db.query.users.findFirst({ columns: { totalXp: true } });
      return Math.max(0, user?.totalXp ?? 0);
    },

    async getHistoryXpTotal(): Promise<number> {
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
    }, options: { trackActivity?: boolean } = {}): Promise<XpEventCreateResult> {
      const nowDate = new Date();
      const now = nowDate.toISOString();
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

        if (options.trackActivity !== false) {
          const currentStats = await tx.query.userStats.findFirst({
            where: eq(schema.userStats.userId, currentUser.id),
          });
          const nextStreak = resolveNextStreak(
            {
              currentStreak: currentStats?.currentStreak ?? 0,
              longestStreak: currentStats?.longestStreak ?? 0,
              lastActiveDate: currentStats?.lastActiveDate ?? null,
            },
            nowDate
          );

          if (currentStats) {
            await tx
              .update(schema.userStats)
              .set({
                currentStreak: nextStreak.currentStreak,
                longestStreak: nextStreak.longestStreak,
                lastActiveDate: now,
                updatedAt: now,
              })
              .where(eq(schema.userStats.userId, currentUser.id));
          } else {
            await tx.insert(schema.userStats).values({
              userId: currentUser.id,
              lessonsCompleted: 0,
              wordsLearned: 0,
              currentStreak: nextStreak.currentStreak,
              longestStreak: nextStreak.longestStreak,
              lastActiveDate: now,
              createdAt: now,
              updatedAt: now,
            });
          }

          await SyncBase.addToQueue(tx as any, {
            entityType: EntityType.USER_STATS,
            entityId: currentUser.id,
            action: 'update',
            payload: {
              currentStreak: nextStreak.currentStreak,
              longestStreak: nextStreak.longestStreak,
              lastActiveDate: now,
              updatedAt: now,
            },
          });
        }

        const userAfterXp = await tx.query.users.findFirst({
          where: eq(schema.users.id, currentUser.id),
        });
        if (userAfterXp) {
          const levelSetting = await tx.query.systemSettings.findFirst({
            where: and(
              eq(schema.systemSettings.key, SYSTEM_SETTING_KEYS.LEVEL_CONFIGS),
              eq(schema.systemSettings.isDeleted, false)
            ),
          });
          const resolvedConfigs = parseLevelConfigs(levelSetting?.value);
          const eligibleLevel = resolvedConfigs
            .filter((item) => item.requiredXp <= userAfterXp.totalXp)
            .at(-1);
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
          if (!isBadgeAchievementMet(badge, metrics)) {
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
