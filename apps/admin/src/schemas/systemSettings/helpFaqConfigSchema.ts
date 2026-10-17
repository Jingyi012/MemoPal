export interface HelpFaqItem {
  question: string;
  answer: string;
  questionZh?: string;
  answerZh?: string;
}

export interface HelpFaqSupportConfig {
  showEmailSupport: boolean;
  email: string;
  emailButtonTitle: string;
  emailSubtitle: string;
  emailButtonTitleZh?: string;
  emailSubtitleZh?: string;
}

export interface HelpFaqConfig {
  faqItems: HelpFaqItem[];
  support: HelpFaqSupportConfig;
}

export const HELP_FAQ_CONFIG_SCHEMA = {
  type: "object",
  title: "Help & FAQ Configuration",
  description: "Configure FAQ entries and support contact visibility in mobile app",
  properties: {
    faqItems: {
      type: "array",
      title: "FAQ Items",
      items: {
        type: "object",
        title: "FAQ Item",
        properties: {
          question: {
            type: "string",
            title: "English Question",
            minLength: 1,
          },
          answer: {
            type: "string",
            title: "English Answer",
            minLength: 1,
          },
          questionZh: {
            type: "string",
            title: "Chinese Question",
            description: "Shown when the mobile app is using Simplified Chinese.",
            minLength: 1,
          },
          answerZh: {
            type: "string",
            title: "Chinese Answer",
            description: "Shown when the mobile app is using Simplified Chinese.",
            minLength: 1,
          },
        },
        required: ["question", "answer", "questionZh", "answerZh"],
        additionalProperties: false,
      },
      default: [],
    },
    support: {
      type: "object",
      title: "Support Contact",
      properties: {
        showEmailSupport: {
          type: "boolean",
          title: "Show Email Support Button",
          default: false,
        },
        email: {
          type: "string",
          title: "Support Email",
          default: "support@mindpal.app",
        },
        emailButtonTitle: {
          type: "string",
          title: "Email Button Title",
          default: "Email Support",
        },
        emailSubtitle: {
          type: "string",
          title: "Email Button Subtitle",
          default: "Contact the MemoPal support team",
        },
        emailButtonTitleZh: {
          type: "string",
          title: "Chinese Email Button Title",
          description: "Shown when the mobile app is using Simplified Chinese.",
          default: "邮件支持",
        },
        emailSubtitleZh: {
          type: "string",
          title: "Chinese Email Button Subtitle",
          description: "Shown when the mobile app is using Simplified Chinese.",
          default: "联系 MemoPal 支持团队",
        },
      },
      required: [
        "showEmailSupport",
        "email",
        "emailButtonTitle",
        "emailSubtitle",
        "emailButtonTitleZh",
        "emailSubtitleZh",
      ],
      additionalProperties: false,
    },
  },
  required: ["faqItems", "support"],
  additionalProperties: false,
} as const;

export const HELP_FAQ_CONFIG_UI_SCHEMA = {
  faqItems: {
    items: {
      question: {
        "ui:widget": "textarea",
        "ui:options": { rows: 2 },
      },
      questionZh: {
        "ui:widget": "textarea",
        "ui:options": { rows: 2 },
      },
      answer: {
        "ui:widget": "textarea",
        "ui:options": { rows: 4 },
      },
      answerZh: {
        "ui:widget": "textarea",
        "ui:options": { rows: 4 },
      },
    },
  },
  support: {
    emailSubtitle: {
      "ui:widget": "textarea",
      "ui:options": { rows: 2 },
    },
    emailSubtitleZh: {
      "ui:widget": "textarea",
      "ui:options": { rows: 2 },
    },
  },
} as const;

export const HELP_FAQ_CONFIG_DEFAULT: HelpFaqConfig = {
  faqItems: [
    {
      question: "What is the Memory Palace technique?",
      questionZh: "什么是记忆宫殿？",
      answer:
        "The Memory Palace (or Method of Loci) helps you memorize by placing information along familiar locations you can mentally revisit.",
      answerZh: "记忆宫殿（又称定位法）通过把信息放在熟悉的地点上，帮助你在脑海中重走这些地点来记忆。",
    },
    {
      question: "How does spaced repetition work?",
      questionZh: "间隔重复是如何运作的？",
      answer:
        "MemoPal schedules review at increasing intervals so difficult items appear more often while easier items are spaced further apart.",
      answerZh: "MemoPal 会按照逐渐延长的时间间隔安排复习，让较难的内容更常出现，较容易的内容间隔更长。",
    },
    {
      question: "How many palaces can I create?",
      questionZh: "我可以创建多少个记忆宫殿？",
      answer:
        "Your palace, lesson, location, and word limits depend on your plan and the configured feature limits.",
      answerZh: "你可以创建的宫殿、课程、位置和词语数量取决于你的方案及当前配置的功能上限。",
    },
    {
      question: "What happens if I miss a review?",
      questionZh: "如果错过一次复习会怎样？",
      answer:
        "Missed reviews can still be completed later, but you may receive reduced XP compared with on-time completion.",
      answerZh: "错过的复习之后仍然可以完成，但获得的经验值可能会低于按时完成。",
    },
    {
      question: "How do I earn XP and milestones?",
      questionZh: "如何获得经验值和里程碑？",
      answer:
        "Complete learning activities and reviews to earn XP. Keep a daily streak and unlock milestones as your memory grows.",
      answerZh: "学习新的记忆、完成到期复习并保持练习。随着进度提升，里程碑会自动解锁。",
    },
  ],
  support: {
    showEmailSupport: false,
    email: "support@mindpal.app",
    emailButtonTitle: "Email Support",
    emailButtonTitleZh: "邮件支持",
    emailSubtitle: "Contact the MemoPal support team",
    emailSubtitleZh: "联系 MemoPal 支持团队",
  },
};
