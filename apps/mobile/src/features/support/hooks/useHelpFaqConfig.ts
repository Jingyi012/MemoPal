import { getHelpFaqConfig } from '@/core/settings/services/systemSettings.service';
import { useTranslation } from '@/core/i18n/useTranslation';
import {
  DEFAULT_HELP_FAQ_CONFIG,
  localizeHelpFaqConfig,
  normalizeHelpFaqConfig,
} from '@/features/support/utils/helpFaqLocalization';
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';

export { DEFAULT_HELP_FAQ_CONFIG } from '@/features/support/utils/helpFaqLocalization';

export const HELP_FAQ_CONFIG_KEYS = {
  all: ['help-faq-config'] as const,
  mobile: () => [...HELP_FAQ_CONFIG_KEYS.all, 'mobile'] as const,
};

export function useHelpFaqConfig() {
  const { language } = useTranslation('support');
  const query = useQuery({
    queryKey: HELP_FAQ_CONFIG_KEYS.mobile(),
    queryFn: async () => normalizeHelpFaqConfig(await getHelpFaqConfig()),
    // Refresh while Help is open so admin changes appear without an app update.
    staleTime: 0,
    gcTime: 1000 * 60 * 15,
    refetchOnMount: 'always',
    refetchOnReconnect: true,
    refetchInterval: 30_000,
    refetchIntervalInBackground: false,
  });

  const config = useMemo(
    () => localizeHelpFaqConfig(query.data ?? DEFAULT_HELP_FAQ_CONFIG, language),
    [language, query.data]
  );

  return {
    config,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
}
