import { getHelpFaqConfig } from '@/core/settings/services/systemSettings.service';
import { useTranslation } from '@/core/i18n/useTranslation';
import {
  DEFAULT_HELP_FAQ_CONFIG,
  localizeHelpFaqConfig,
  normalizeHelpFaqConfig,
} from '@/features/support/utils/helpFaqLocalization';
import { useQuery } from '@tanstack/react-query';

export { DEFAULT_HELP_FAQ_CONFIG } from '@/features/support/utils/helpFaqLocalization';

export const HELP_FAQ_CONFIG_KEYS = {
  all: ['help-faq-config'] as const,
  mobile: () => [...HELP_FAQ_CONFIG_KEYS.all, 'mobile'] as const,
};

export function useHelpFaqConfig() {
  const { language } = useTranslation('support');
  const query = useQuery({
    queryKey: [...HELP_FAQ_CONFIG_KEYS.mobile(), language],
    queryFn: async () => localizeHelpFaqConfig(normalizeHelpFaqConfig(await getHelpFaqConfig()), language),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 15,
  });

  return {
    config: query.data ?? localizeHelpFaqConfig(DEFAULT_HELP_FAQ_CONFIG, language),
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
}
