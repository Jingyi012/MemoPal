import { getHelpFaqConfig } from '@/core/settings/services/systemSettings.service';
import { HelpFaqConfig } from '@/features/support/types/helpFaqConfig';
import { useQuery } from '@tanstack/react-query';

export const DEFAULT_HELP_FAQ_CONFIG: HelpFaqConfig = {
  faqItems: [
    {
      question: 'What is the Memory Palace technique?',
      answer:
        'The Memory Palace (or Method of Loci) helps you memorize by placing information along familiar locations you can mentally revisit.',
    },
    {
      question: 'How does spaced repetition work?',
      answer:
        'MemoPal schedules review at increasing intervals so difficult items appear more often while easier items are spaced further apart.',
    },
    {
      question: 'How many palaces can I create?',
      answer:
        'Your palace, lesson, location, and word limits depend on your plan and the configured feature limits.',
    },
    {
      question: 'What happens if I miss a review?',
      answer:
        'Missed reviews can still be completed later, but you may receive reduced XP compared with on-time completion.',
    },
    {
      question: 'How do I earn XP and milestones?',
      answer:
        'Learn a new memory, complete due reviews, and practise consistently. Milestones unlock automatically as your progress grows.',
    },
  ],
  support: {
    showEmailSupport: false,
    email: 'support@mindpal.app',
    emailButtonTitle: 'Email Support',
    emailSubtitle: 'Contact the MemoPal support team',
  },
};

export const HELP_FAQ_CONFIG_KEYS = {
  all: ['help-faq-config'] as const,
  mobile: () => [...HELP_FAQ_CONFIG_KEYS.all, 'mobile'] as const,
};

function normalizeConfig(raw?: Partial<HelpFaqConfig> | null): HelpFaqConfig {
  if (!raw) {
    return DEFAULT_HELP_FAQ_CONFIG;
  }

  const faqItems = Array.isArray(raw.faqItems)
    ? raw.faqItems
        .map((item) => ({
          question: String(item?.question ?? '').trim(),
          answer: String(item?.answer ?? '').trim(),
        }))
        .filter((item) => item.question.length > 0 && item.answer.length > 0)
    : [];

  return {
    faqItems: faqItems.length > 0 ? faqItems : DEFAULT_HELP_FAQ_CONFIG.faqItems,
    support: {
      showEmailSupport:
        typeof raw.support?.showEmailSupport === 'boolean'
          ? raw.support.showEmailSupport
          : DEFAULT_HELP_FAQ_CONFIG.support.showEmailSupport,
      email: raw.support?.email?.trim() || DEFAULT_HELP_FAQ_CONFIG.support.email,
      emailButtonTitle:
        raw.support?.emailButtonTitle?.trim() || DEFAULT_HELP_FAQ_CONFIG.support.emailButtonTitle,
      emailSubtitle:
        raw.support?.emailSubtitle?.trim() || DEFAULT_HELP_FAQ_CONFIG.support.emailSubtitle,
    },
  };
}

export function useHelpFaqConfig() {
  const query = useQuery({
    queryKey: HELP_FAQ_CONFIG_KEYS.mobile(),
    queryFn: async () => normalizeConfig(await getHelpFaqConfig()),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 15,
  });

  return {
    config: query.data ?? DEFAULT_HELP_FAQ_CONFIG,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
}
