import { missionApi } from '@/features/gamification/shared/api/mission';
import { SourceType } from '@/enums/sourceType';
import {
  XpEventCreateResult,
  getBySourceType,
  recordXpEventWithClientEventId,
} from '@/features/gamification/shared/services/xpEvents.service';
import { MissionDashboard, MissionProgress } from '@/features/gamification/shared/types/missions';

export interface MissionClaimResult extends XpEventCreateResult {
  sourceId: string;
  clientEventId: string;
  wasAlreadyClaimed: boolean;
}

function formatDate(value: Date): string {
  return value.toISOString().slice(0, 10);
}

function getWeekStart(value: Date): Date {
  const date = new Date(value);
  const day = date.getUTCDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  date.setUTCDate(date.getUTCDate() + diffToMonday);
  date.setUTCHours(0, 0, 0, 0);
  return date;
}

export function getMissionPeriodToken(period: string, now = new Date()): string {
  const normalized = period.trim().toLowerCase();
  if (normalized === 'daily') {
    return `day:${formatDate(now)}`;
  }
  if (normalized === 'weekly') {
    return `week:${formatDate(getWeekStart(now))}`;
  }
  return 'all-time';
}

export function getMissionClaimSourceId(mission: MissionProgress, now = new Date()): string {
  return `${mission.key}:${getMissionPeriodToken(mission.period, now)}`;
}

export function getMissionClaimClientEventId(mission: MissionProgress, now = new Date()): string {
  const periodToken = getMissionPeriodToken(mission.period, now);
  return `mission:${mission.key}:${periodToken}`;
}

export async function hasClaimedMissionReward(mission: MissionProgress, now = new Date()): Promise<boolean> {
  if (mission.isClaimed) {
    return true;
  }

  const sourceId = getMissionClaimSourceId(mission, now);
  const events = await getBySourceType(SourceType.MissionComplete);
  return events.some((item) => item.sourceId === sourceId && !item.isDeleted);
}

export async function claimMissionReward(
  mission: MissionProgress,
  now = new Date()
): Promise<MissionClaimResult> {
  if (!mission.isCompleted) {
    throw new Error('Mission is not completed yet.');
  }

  const sourceId = getMissionClaimSourceId(mission, now);
  const clientEventId = getMissionClaimClientEventId(mission, now);
  const wasAlreadyClaimed = await hasClaimedMissionReward(mission, now);

  const result = await recordXpEventWithClientEventId(
    SourceType.MissionComplete,
    Math.max(0, mission.rewardXp),
    clientEventId,
    sourceId
  );

  return {
    ...result,
    sourceId,
    clientEventId,
    wasAlreadyClaimed,
  };
}

export async function getCurrentMissionDashboard(): Promise<MissionDashboard> {
  return missionApi.getCurrent();
}
