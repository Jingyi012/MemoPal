import { db } from '@/db/client';
import * as schema from '@/db/schema';
import { GamificationMobileUiConfig, MissionDashboard } from '@/types/missions';
import { and, asc, eq, notInArray } from 'drizzle-orm';

const MOBILE_UI_CONFIG_ID = 'mobile';

interface MissionRepository {
  getCurrent(): Promise<MissionDashboard | null>;
  upsertCurrent(dashboard: MissionDashboard): Promise<void>;
  getMobileUiConfig(): Promise<GamificationMobileUiConfig | null>;
  upsertMobileUiConfig(config: GamificationMobileUiConfig): Promise<void>;
}

function safeParseUiConfig(payload: string): GamificationMobileUiConfig | null {
  try {
    return JSON.parse(payload) as GamificationMobileUiConfig;
  } catch {
    return null;
  }
}

export function createMissionRepository(): MissionRepository {
  return {
    async getCurrent(): Promise<MissionDashboard | null> {
      const localMissions = await db.query.missions.findMany({
        where: eq(schema.missions.isDeleted, false),
        orderBy: [asc(schema.missions.sortOrder), asc(schema.missions.key)],
      });

      if (localMissions.length === 0) {
        return null;
      }

      return {
        generatedAtUtc:
          localMissions[0]?.generatedAtUtc ??
          localMissions[0]?.updatedAt ??
          new Date().toISOString(),
        missions: localMissions.map((mission) => ({
          key: mission.key,
          title: mission.title,
          description: mission.description,
          metricType: mission.metricType,
          period: mission.period,
          currentValue: mission.currentValue,
          targetValue: mission.targetValue,
          rewardXp: mission.rewardXp,
          sortOrder: mission.sortOrder,
          isActive: mission.isActive,
          isCompleted: mission.isCompleted,
          progressPercent: mission.progressPercent,
        })),
      };
    },

    async upsertCurrent(dashboard: MissionDashboard): Promise<void> {
      const now = new Date().toISOString();
      const incomingMissions = dashboard.missions ?? [];
      const incomingKeys = incomingMissions.map((mission) => mission.key);

      await db.transaction(async (tx) => {
        for (const mission of incomingMissions) {
          await tx
            .insert(schema.missions)
            .values({
              key: mission.key,
              title: mission.title,
              description: mission.description ?? null,
              metricType: mission.metricType,
              period: mission.period,
              currentValue: mission.currentValue,
              targetValue: mission.targetValue,
              rewardXp: mission.rewardXp,
              sortOrder: mission.sortOrder,
              isActive: mission.isActive,
              isCompleted: mission.isCompleted,
              progressPercent: mission.progressPercent,
              generatedAtUtc: dashboard.generatedAtUtc,
              updatedAt: now,
              lastSyncedAt: now,
              isDeleted: false,
              deletedAt: null,
            })
            .onConflictDoUpdate({
              target: schema.missions.key,
              set: {
                title: mission.title,
                description: mission.description ?? null,
                metricType: mission.metricType,
                period: mission.period,
                currentValue: mission.currentValue,
                targetValue: mission.targetValue,
                rewardXp: mission.rewardXp,
                sortOrder: mission.sortOrder,
                isActive: mission.isActive,
                isCompleted: mission.isCompleted,
                progressPercent: mission.progressPercent,
                generatedAtUtc: dashboard.generatedAtUtc,
                updatedAt: now,
                lastSyncedAt: now,
                isDeleted: false,
                deletedAt: null,
              },
            });
        }

        if (incomingKeys.length > 0) {
          await tx
            .update(schema.missions)
            .set({
              isDeleted: true,
              deletedAt: now,
              updatedAt: now,
            })
            .where(
              and(
                eq(schema.missions.isDeleted, false),
                notInArray(schema.missions.key, incomingKeys)
              )
            );
        } else {
          await tx
            .update(schema.missions)
            .set({
              isDeleted: true,
              deletedAt: now,
              updatedAt: now,
            })
            .where(eq(schema.missions.isDeleted, false));
        }
      });
    },

    async getMobileUiConfig(): Promise<GamificationMobileUiConfig | null> {
      const local = await db.query.missionUiConfigs.findFirst({
        where: and(
          eq(schema.missionUiConfigs.id, MOBILE_UI_CONFIG_ID),
          eq(schema.missionUiConfigs.isDeleted, false)
        ),
      });

      if (!local?.payload) {
        return null;
      }

      return safeParseUiConfig(local.payload);
    },

    async upsertMobileUiConfig(config: GamificationMobileUiConfig): Promise<void> {
      const now = new Date().toISOString();
      const payload = JSON.stringify(config);

      await db
        .insert(schema.missionUiConfigs)
        .values({
          id: MOBILE_UI_CONFIG_ID,
          payload,
          updatedAt: now,
          lastSyncedAt: now,
          isDeleted: false,
          deletedAt: null,
        })
        .onConflictDoUpdate({
          target: schema.missionUiConfigs.id,
          set: {
            payload,
            updatedAt: now,
            lastSyncedAt: now,
            isDeleted: false,
            deletedAt: null,
          },
        });
    },
  };
}
