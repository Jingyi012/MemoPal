export interface PremiumSubscriptionPlanConfig {
  key: string;
  name: string;
  price: string;
  label: string;
  savings?: string | null;
  subtext?: string;
  isBestValue?: boolean;
  isActive?: boolean;
  sortOrder?: number;
}

export interface PremiumSubscriptionFeatureConfig {
  key: string;
  title: string;
  description: string;
  isActive?: boolean;
  sortOrder?: number;
}

export interface PremiumSubscriptionTermsSectionConfig {
  title: string;
  body: string;
}

export interface PremiumSubscriptionConfig {
  hero: {
    title: string;
    subtitle: string;
  };
  sections: {
    includedTitle: string;
  };
  plans: PremiumSubscriptionPlanConfig[];
  features: PremiumSubscriptionFeatureConfig[];
  subscribeButton: {
    enabled: boolean;
    label: string;
    disabledLabel: string;
    pendingMessage: string;
  };
  footer: {
    finePrint: string;
  };
  terms: {
    buttonLabel: string;
    title: string;
    closeButtonLabel: string;
    sections: PremiumSubscriptionTermsSectionConfig[];
  };
}
