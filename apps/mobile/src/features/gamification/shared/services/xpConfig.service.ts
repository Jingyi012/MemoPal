import { systemSettingsApi } from '@/core/settings/api/systemSettings';
import type { XpConfig } from '@/features/gamification/shared/types/xpConfigs';

function parseItems(value: string): Record<string, unknown>[] {
  try {
    const parsed = JSON.parse(value) as unknown;
    const source = Array.isArray(parsed)
      ? parsed
      : parsed && typeof parsed === 'object'
        ? ((parsed as Record<string, unknown>).configs ?? (parsed as Record<string, unknown>).items)
        : [];
    return Array.isArray(source)
      ? source.filter((item): item is Record<string, unknown> => !!item && typeof item === 'object')
      : [];
  } catch {
    return [];
  }
}

export async function getXpConfigs(_options?: { forceRemote?: boolean }): Promise<XpConfig[]> {
  const setting = await systemSettingsApi.getXpConfigs();
  if (!setting?.value) return [];

  return parseItems(setting.value)
    .map((item) => ({
      id: String(item.id ?? item.key ?? item.sourceType ?? ''),
      sourceType: String(item.sourceType ?? '') as XpConfig['sourceType'],
      baseXp: Number(item.baseXp ?? 0),
      variableXp: Number(item.variableXp ?? 0),
      isActive: Boolean(item.isActive ?? true),
      createdAt: String(item.createdAt ?? setting.createdAt),
      updatedAt: String(item.updatedAt ?? setting.updatedAt),
    }))
    .filter((item) => item.id.length > 0 && item.sourceType.length > 0);
}

export async function getXpConfigBySourceType(sourceType: string): Promise<XpConfig | null> {
  const allConfigs = await getXpConfigs();
  return allConfigs.find((config) => config.sourceType === sourceType) ?? null;
}
