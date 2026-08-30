export type HelpFaqItem = {
  question?: string;
  answer?: string;
};

export type HelpFaqSupportConfig = {
  showEmailSupport: boolean;
  email: string;
  emailButtonTitle: string;
  emailSubtitle: string;
};

export type HelpFaqConfig = {
  faqItems: HelpFaqItem[];
  support: HelpFaqSupportConfig;
};
