import { useState, useCallback } from "react";
import { adminSystemSettingsApi } from "../api/adminSystemSettingsApi";

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

/**
 * Custom hook for managing config editing with API integration
 * Handles loading, saving, and error states
 */
export function useConfigEditor({
  configKey,
  defaultValue,
}: UseConfigEditorOptions): UseConfigEditorResult {
  const [config, setConfig] = useState<Record<string, unknown>>(defaultValue);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const saveConfig = useCallback(
    async (newConfig: Record<string, unknown>) => {
      setIsLoading(true);
      setError(null);

      try {
        await adminSystemSettingsApi.upsert({
          key: configKey,
          value: JSON.stringify(newConfig),
          description: `Configuration for ${configKey}`,
        });

        setConfig(newConfig);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to save configuration";
        setError(errorMessage);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [configKey],
  );

  const refreshConfig = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await adminSystemSettingsApi.list(1, 100, configKey);
      const setting = response.data?.find((s) => s.key === configKey);

      if (setting && setting.value) {
        try {
          const parsedValue = JSON.parse(setting.value) as Record<
            string,
            unknown
          >;
          setConfig(parsedValue);
        } catch {
          setError("Failed to parse configuration from server");
          setConfig(defaultValue);
        }
      } else {
        setConfig(defaultValue);
      }
    } catch (err) {
      console.error("Failed to refresh config:", err);
      setError("Failed to load configuration");
      setConfig(defaultValue);
    } finally {
      setIsLoading(false);
    }
  }, [configKey, defaultValue]);

  return { config, isLoading, error, saveConfig, refreshConfig };
}
