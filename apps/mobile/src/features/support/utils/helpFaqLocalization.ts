import type { HelpFaqConfig, HelpFaqItem } from '../types/helpFaqConfig';

export type HelpFaqLanguage = 'en' | 'zh';

export const DEFAULT_HELP_FAQ_CONFIG: HelpFaqConfig = {
  faqItems: [
    {
      question: 'What is the Memory Palace technique?',
      answer:
        'The Memory Palace (or Method of Loci) helps you memorize by placing information along familiar locations you can mentally revisit.',
      questionZh: '什么是记忆宫殿?',
      answerZh:
        '记忆宫殿（又称定位法）通过把信息放在熟悉的地点上，帮助你在脑海中重走这些地点来记忆。',
    },
    {
      question: 'How does spaced repetition work?',
      answer:
        'MemoPal schedules review at increasing intervals so difficult items appear more often while easier items are spaced further apart.',
      questionZh: '间隔重复是如何运作的？',
      answerZh:
        'MemoPal 会按照逐渐延长的时间间隔安排复习，让较难的内容更常出现，较容易的内容间隔更长。',
    },
    {
      question: 'How many palaces can I create?',
      answer:
        'Your palace, lesson, location, and word limits depend on your plan and the configured feature limits.',
      questionZh: '我可以创建多少个记忆宫殿？',
      answerZh: '你可以创建的宫殿、课程、位置和词语数量取决于你的方案及当前配置的功能上限。',
    },
    {
      question: 'What happens if I miss a review?',
      answer:
        'Missed reviews can still be completed later, but you may receive reduced XP compared with on-time completion.',
      questionZh: '如果错过一次复习会怎样？',
      answerZh: '错过的复习之后仍然可以完成，但获得的经验值可能会低于按时完成。',
    },
    {
      question: 'How do I earn XP and milestones?',
      answer:
        'Learn a new memory, complete due reviews, and practise consistently. Milestones unlock automatically as your progress grows.',
      questionZh: '如何获得经验值和里程碑？',
      answerZh: '学习新的记忆、完成到期复习并保持练习。随着进度提升，里程碑会自动解锁。',
    },
  ],
  support: {
    showEmailSupport: false,
    email: 'support@mindpal.app',
    emailButtonTitle: 'Email Support',
    emailSubtitle: 'Contact the MemoPal support team',
    emailButtonTitleZh: '联系支持团队',
    emailSubtitleZh: '联系 MemoPal 支持团队',
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

          const matchingDefault = DEFAULT_HELP_FAQ_CONFIG.faqItems.find(
            (defaultItem) => defaultItem.question === question
          );

          return {
            ...matchingDefault,
            question,
            answer,
            questionZh: text(item?.questionZh) || matchingDefault?.questionZh,
            answerZh: text(item?.answerZh) || matchingDefault?.answerZh,
          } satisfies HelpFaqItem;
        })
        .filter((item): item is HelpFaqItem => item !== null)
    : [];

  const support = raw.support;
  const defaultSupport = DEFAULT_HELP_FAQ_CONFIG.support;
  const emailButtonTitle =
    text(support?.emailButtonTitle) || DEFAULT_HELP_FAQ_CONFIG.support.emailButtonTitle;
  const emailSubtitle =
    text(support?.emailSubtitle) || DEFAULT_HELP_FAQ_CONFIG.support.emailSubtitle;

  return {
    faqItems: faqItems.length > 0 ? faqItems : DEFAULT_HELP_FAQ_CONFIG.faqItems,
    support: {
      showEmailSupport:
        typeof support?.showEmailSupport === 'boolean'
          ? support.showEmailSupport
          : DEFAULT_HELP_FAQ_CONFIG.support.showEmailSupport,
      email: text(support?.email) || DEFAULT_HELP_FAQ_CONFIG.support.email,
      emailButtonTitle,
      emailButtonTitleZh: text(support?.emailButtonTitleZh) || defaultSupport.emailButtonTitleZh,
      emailSubtitle,
      emailSubtitleZh: text(support?.emailSubtitleZh) || defaultSupport.emailSubtitleZh,
    },
  };
}

export function localizeHelpFaqConfig(
  config: HelpFaqConfig,
  language: HelpFaqLanguage
): HelpFaqConfig {
  return {
    faqItems: config.faqItems.map((item) => ({
      ...item,
      question: chooseText(language, text(item.question), item.questionZh),
      answer: chooseText(language, text(item.answer), item.answerZh),
    })),
    support: {
      ...config.support,
      emailButtonTitle: chooseText(
        language,
        config.support.emailButtonTitle,
        config.support.emailButtonTitleZh
      ),
      emailSubtitle: chooseText(
        language,
        config.support.emailSubtitle,
        config.support.emailSubtitleZh
      ),
    },
  };
}
