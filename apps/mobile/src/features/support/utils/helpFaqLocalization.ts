import type { HelpFaqConfig, HelpFaqItem } from '../types/helpFaqConfig';

export type HelpFaqLanguage = 'en' | 'zh';

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

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function chooseText(language: HelpFaqLanguage, english: string, chinese?: string): string {
  return language === 'zh' && text(chinese) ? text(chinese) : english;
}

/** Normalize stored settings while keeping older English-only settings readable. */
export function normalizeHelpFaqConfig(raw?: Partial<HelpFaqConfig> | null): HelpFaqConfig {
  if (!raw) return DEFAULT_HELP_FAQ_CONFIG;

  const faqItems = Array.isArray(raw.faqItems)
    ? raw.faqItems
        .map<HelpFaqItem | null>((item) => {
          const question = text(item?.question);
          const answer = text(item?.answer);
          if (!question || !answer) return null;

          return {
            question,
            answer,
            questionZh: text(item?.questionZh) || undefined,
            answerZh: text(item?.answerZh) || undefined,
          } satisfies HelpFaqItem;
        })
        .filter((item): item is HelpFaqItem => item !== null)
    : [];

  const support = raw.support;
  const emailButtonTitle = text(support?.emailButtonTitle) || DEFAULT_HELP_FAQ_CONFIG.support.emailButtonTitle;
  const emailSubtitle = text(support?.emailSubtitle) || DEFAULT_HELP_FAQ_CONFIG.support.emailSubtitle;

  return {
    faqItems: faqItems.length > 0 ? faqItems : DEFAULT_HELP_FAQ_CONFIG.faqItems,
    support: {
      showEmailSupport:
        typeof support?.showEmailSupport === 'boolean'
          ? support.showEmailSupport
          : DEFAULT_HELP_FAQ_CONFIG.support.showEmailSupport,
      email: text(support?.email) || DEFAULT_HELP_FAQ_CONFIG.support.email,
      emailButtonTitle,
      emailButtonTitleZh: text(support?.emailButtonTitleZh) || undefined,
      emailSubtitle,
      emailSubtitleZh: text(support?.emailSubtitleZh) || undefined,
    },
  };
}

export function localizeHelpFaqConfig(config: HelpFaqConfig, language: HelpFaqLanguage): HelpFaqConfig {
  return {
    faqItems: config.faqItems.map((item) => ({
      ...item,
      question: chooseText(language, text(item.question), item.questionZh),
      answer: chooseText(language, text(item.answer), item.answerZh),
    })),
    support: {
      ...config.support,
      emailButtonTitle: chooseText(language, config.support.emailButtonTitle, config.support.emailButtonTitleZh),
      emailSubtitle: chooseText(language, config.support.emailSubtitle, config.support.emailSubtitleZh),
    },
  };
}
