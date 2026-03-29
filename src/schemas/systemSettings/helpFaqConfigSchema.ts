export interface HelpFaqItem {
  question: string;
  answer: string;
}

export interface HelpFaqSupportConfig {
  showEmailSupport: boolean;
  email: string;
  emailButtonTitle: string;
  emailSubtitle: string;
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
            title: "Question",
            minLength: 1,
          },
          answer: {
            type: "string",
            title: "Answer",
            minLength: 1,
          },
        },
        required: ["question", "answer"],
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
      },
      required: ["showEmailSupport", "email", "emailButtonTitle", "emailSubtitle"],
      additionalProperties: false,
    },
  },
  required: ["faqItems", "support"],
  additionalProperties: false,
} as const;

export const HELP_FAQ_CONFIG_DEFAULT: HelpFaqConfig = {
  faqItems: [
    {
      question: "What is the Memory Palace technique?",
      answer:
        "The Memory Palace (or Method of Loci) helps you memorize by placing information along familiar locations you can mentally revisit.",
    },
    {
      question: "How does spaced repetition work?",
      answer:
        "MemoPal schedules review at increasing intervals so difficult items appear more often while easier items are spaced further apart.",
    },
    {
      question: "How many palaces can I create?",
      answer:
        "Your palace, lesson, location, and word limits depend on your plan and the configured feature limits.",
    },
    {
      question: "What happens if I miss a review?",
      answer:
        "Missed reviews can still be completed later, but you may receive reduced XP compared with on-time completion.",
    },
    {
      question: "How do I earn badges and XP?",
      answer:
        "Complete learning activities, reviews, missions, and streak goals to accumulate XP and unlock badges.",
    },
  ],
  support: {
    showEmailSupport: false,
    email: "support@mindpal.app",
    emailButtonTitle: "Email Support",
    emailSubtitle: "Contact the MemoPal support team",
  },
};
