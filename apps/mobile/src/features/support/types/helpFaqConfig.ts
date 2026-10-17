export type HelpFaqItem = {
  question?: string;
  answer?: string;
  questionZh?: string;
  answerZh?: string;
};

export type HelpFaqSupportConfig = {
  showEmailSupport: boolean;
  email: string;
  emailButtonTitle: string;
  emailSubtitle: string;
  emailButtonTitleZh?: string;
  emailSubtitleZh?: string;
};

export type HelpFaqConfig = {
  faqItems: HelpFaqItem[];
  support: HelpFaqSupportConfig;
};
