import { missionApi } from '@/api/mission';
import { SourceType } from '@/enums/sourceType';
import { createMissionRepository } from '@/repositories/mission.repo';
import { XpEventCreateResult, createXpEventsRepository } from '@/repositories/xpEvents.repo';
import { MissionDashboard, MissionProgress } from '@/types/missions';
import { recordXpEventWithClientEventId } from './xpEvents.service';

export interface MissionClaimResult extends XpEventCreateResult {
  sourceId: string;
  clientEventId: string;
  wasAlreadyClaimed: boolean;
}

const xpEventRepo = createXpEventsRepository();
const missionRepo = createMissionRepository();

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
  const sourceId = getMissionClaimSourceId(mission, now);
  const events = await xpEventRepo.getBySourceType(SourceType.MissionComplete);
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
  try {
    const remoteDashboard = await missionApi.getCurrent();
    await missionRepo.upsertCurrent(remoteDashboard);
  } catch (error) {
    console.warn('Failed to sync missions from backend, using local data:', error);
  }

  const localDashboard = await missionRepo.getCurrent();
  if (localDashboard) {
    return localDashboard;
  }

  throw new Error('Unable to load missions right now.');
}
