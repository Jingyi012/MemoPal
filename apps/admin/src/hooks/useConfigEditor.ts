import { useCallback, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminSystemSettingsApi } from "../api/adminSystemSettingsApi";
import { extractApiErrorMessage } from "../lib/errorMessage";

interface UseConfigEditorOptions {
  configKey: string;
  defaultValue: Record<string, unknown>;
}

interface UseConfigEditorResult {
  config: Record<string, unknown>;
  isLoading: boolean;
  error: string | null;
  saveConfig: (newConfig: Record<string, unknown>) => Promise<void>;
  refreshConfig: () => Promise<void>;
}

const ARRAY_WRAPPER_BY_KEY: Record<string, string> = {
  "xp.configs": "configs",
  "level.configs": "levels",
  "gamification.missions.templates": "templates",
};

function getConfigItems(
  parsedValue: unknown,
  wrapperKey: string,
): Record<string, unknown>[] {
  if (Array.isArray(parsedValue)) {
    return parsedValue.filter(
      (item): item is Record<string, unknown> =>
        !!item && typeof item === "object",
    );
  }

  if (parsedValue && typeof parsedValue === "object") {
    const wrapped = (parsedValue as Record<string, unknown>)[wrapperKey];
    if (Array.isArray(wrapped)) {
      return wrapped.filter(
        (item): item is Record<string, unknown> =>
          !!item && typeof item === "object",
      );
    }
  }

  return [];
}

function normalizeLevelConfigs(parsedValue: unknown): Record<string, unknown> {
  const levels = getConfigItems(parsedValue, "levels")
    .map((item) => ({
      level: Number(item.level ?? 0),
      requiredXp: Number(item.requiredXp ?? 0),
      ...(typeof item.title === "string" && item.title.trim().length > 0
        ? { title: item.title.trim() }
        : {}),
    }))
    .filter((item) => item.level > 0);

  return { levels };
}

function normalizeXpConfigs(parsedValue: unknown): Record<string, unknown> {
  const configs = getConfigItems(parsedValue, "configs")
    .map((item) => ({
      key: String(item.key ?? item.id ?? item.sourceType ?? "").trim(),
      sourceType: String(item.sourceType ?? "").trim(),
      baseXp: Number(item.baseXp ?? 0),
      variableXp: Number(item.variableXp ?? 0),
      isActive: item.isActive !== false,
    }))
    .filter((item) => item.key.length > 0 && item.sourceType.length > 0);

  return { configs };
}

function normalizeConfigShape(
  configKey: string,
  parsedValue: unknown,
  defaultValue: Record<string, unknown>,
): Record<string, unknown> {
  if (configKey === "level.configs") {
    return normalizeLevelConfigs(parsedValue);
  }

  if (configKey === "xp.configs") {
    return normalizeXpConfigs(parsedValue);
  }

  if (Array.isArray(parsedValue)) {
    const wrapperKey = ARRAY_WRAPPER_BY_KEY[configKey];
    if (wrapperKey) {
      return { [wrapperKey]: parsedValue };
    }

    return defaultValue;
  }

  if (parsedValue && typeof parsedValue === "object") {
    return parsedValue as Record<string, unknown>;
  }

  return defaultValue;
}

/**
 * Config editor hook backed by TanStack Query.
 */
export function useConfigEditor({
  configKey,
  defaultValue,
}: UseConfigEditorOptions): UseConfigEditorResult {
  const queryClient = useQueryClient();
  const queryKey = useMemo(
    () => ["config-editor", "system-setting", configKey] as const,
    [configKey],
  );

  const query = useQuery({
    queryKey,
    queryFn: async () => {
      try {
        const setting = await adminSystemSettingsApi.getByKey(configKey);
        if (setting?.value) {
          try {
            const parsedValue = JSON.parse(setting.value) as unknown;
            return normalizeConfigShape(configKey, parsedValue, defaultValue);
          } catch {
            throw new Error("Failed to parse configuration from server");
          }
        }

        return defaultValue;
      } catch (err) {
        const status = (err as { response?: { status?: number } })?.response
          ?.status;
        if (status === 404) {
          return defaultValue;
        }

        throw new Error("Failed to load configuration");
      }
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (newConfig: Record<string, unknown>) => {
      const normalized = normalizeConfigShape(configKey, newConfig, defaultValue);
      await adminSystemSettingsApi.upsert({
        key: configKey,
        value: JSON.stringify(normalized),
        description: `Configuration for ${configKey}`,
      });
      return normalized;
    },
    onSuccess: async (savedConfig) => {
      queryClient.setQueryData(queryKey, savedConfig);
      await queryClient.invalidateQueries({ queryKey, exact: true });
    },
  });

  const saveConfig = useCallback(
    async (newConfig: Record<string, unknown>) => {
      await saveMutation.mutateAsync(newConfig);
    },
    [saveMutation],
  );

  const refreshConfig = useCallback(async () => {
    await query.refetch();
  }, [query]);

  const error = useMemo(() => {
    if (saveMutation.error) {
      return extractApiErrorMessage(
        saveMutation.error,
        "Failed to save configuration",
      );
    }

    if (query.error) {
      return extractApiErrorMessage(query.error, "Failed to load configuration");
    }

    return null;
  }, [query.error, saveMutation.error]);

  const config = query.data ?? defaultValue;
  const isLoading =
    query.isLoading || query.isFetching || saveMutation.isPending;

  return { config, isLoading, error, saveConfig, refreshConfig };
}
