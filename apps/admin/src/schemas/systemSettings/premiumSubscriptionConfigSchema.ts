export interface PremiumPlanConfig {
  key: string;
  name: string;
  price: string;
  label: string;
  savings?: string | null;
  subtext?: string;
  isBestValue: boolean;
  isActive: boolean;
  sortOrder: number;
}

export interface PremiumFeatureConfig {
  key: string;
  title: string;
  description: string;
  isActive: boolean;
  sortOrder: number;
}

export interface PremiumTermsSectionConfig {
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
  plans: PremiumPlanConfig[];
  features: PremiumFeatureConfig[];
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
    sections: PremiumTermsSectionConfig[];
  };
}

export const PREMIUM_SUBSCRIPTION_CONFIG_SCHEMA = {
  type: 'object',
  title: 'Premium Subscription Configuration',
  description: 'Configure premium page content, terms, and CTA behavior in mobile app',
  properties: {
    hero: {
      type: 'object',
      title: 'Hero Section',
      properties: {
        title: { type: 'string', title: 'Title', minLength: 1 },
        subtitle: { type: 'string', title: 'Subtitle', minLength: 1 },
      },
      required: ['title', 'subtitle'],
      additionalProperties: false,
    },
    sections: {
      type: 'object',
      title: 'Section Labels',
      properties: {
        includedTitle: { type: 'string', title: 'Included Section Title', minLength: 1 },
      },
      required: ['includedTitle'],
      additionalProperties: false,
    },
    plans: {
      type: 'array',
      title: 'Plans',
      items: {
        type: 'object',
        title: 'Plan',
        properties: {
          key: { type: 'string', title: 'Key', minLength: 1 },
          name: { type: 'string', title: 'Name', minLength: 1 },
          price: { type: 'string', title: 'Price', minLength: 1 },
          label: { type: 'string', title: 'Price Label', minLength: 1 },
          savings: { type: 'string', title: 'Savings Badge', default: '' },
          subtext: { type: 'string', title: 'Subtext', default: '' },
          isBestValue: { type: 'boolean', title: 'Is Best Value' },
          isActive: { type: 'boolean', title: 'Active' },
          sortOrder: { type: 'number', title: 'Sort Order', minimum: 1 },
        },
        required: ['key', 'name', 'price', 'label', 'isBestValue', 'isActive', 'sortOrder'],
        additionalProperties: false,
      },
      default: [],
    },
    features: {
      type: 'array',
      title: 'Features',
      items: {
        type: 'object',
        title: 'Feature',
        properties: {
          key: { type: 'string', title: 'Key', minLength: 1 },
          title: { type: 'string', title: 'Title', minLength: 1 },
          description: { type: 'string', title: 'Description', minLength: 1 },
          isActive: { type: 'boolean', title: 'Active' },
          sortOrder: { type: 'number', title: 'Sort Order', minimum: 1 },
        },
        required: ['key', 'title', 'description', 'isActive', 'sortOrder'],
        additionalProperties: false,
      },
      default: [],
    },
    subscribeButton: {
      type: 'object',
      title: 'Subscribe Button',
      properties: {
        enabled: {
          type: 'boolean',
          title: 'Enable Subscription Button',
          default: false,
        },
        label: {
          type: 'string',
          title: 'Enabled Label',
          default: 'Start 7-Day Free Trial',
        },
        disabledLabel: {
          type: 'string',
          title: 'Disabled Label',
          default: 'Coming Soon',
        },
        pendingMessage: {
          type: 'string',
          title: 'Message When Enabled But Not Integrated',
          default: 'Subscription checkout is not available yet.',
        },
      },
      required: ['enabled', 'label', 'disabledLabel', 'pendingMessage'],
      additionalProperties: false,
    },
    footer: {
      type: 'object',
      title: 'Footer',
      properties: {
        finePrint: {
          type: 'string',
          title: 'Fine Print Text',
          default: 'Recurring billing. Cancel anytime in App Store.',
        },
      },
      required: ['finePrint'],
      additionalProperties: false,
    },
    terms: {
      type: 'object',
      title: 'Terms & Conditions',
      properties: {
        buttonLabel: { type: 'string', title: 'Terms Button Label', minLength: 1 },
        title: { type: 'string', title: 'Sheet Title', minLength: 1 },
        closeButtonLabel: { type: 'string', title: 'Close Button Label', minLength: 1 },
        sections: {
          type: 'array',
          title: 'Term Sections',
          items: {
            type: 'object',
            title: 'Term Section',
            properties: {
              title: { type: 'string', title: 'Title', minLength: 1 },
              body: { type: 'string', title: 'Body', minLength: 1 },
            },
            required: ['title', 'body'],
            additionalProperties: false,
          },
          default: [],
        },
      },
      required: ['buttonLabel', 'title', 'closeButtonLabel', 'sections'],
      additionalProperties: false,
    },
  },
  required: ['hero', 'sections', 'plans', 'features', 'subscribeButton', 'footer', 'terms'],
  additionalProperties: false,
} as const;

export const PREMIUM_SUBSCRIPTION_CONFIG_DEFAULT: PremiumSubscriptionConfig = {
  hero: {
    title: 'Go Premium',
    subtitle: 'Unlock your full memory potential',
  },
  sections: {
    includedTitle: "What's Included",
  },
  plans: [
    {
      key: 'annual',
      name: 'Annual Plan',
      price: '$39.99',
      label: '/year',
      savings: 'Save 33%',
      subtext: 'Just $3.33/month',
      isBestValue: true,
      isActive: true,
      sortOrder: 1,
    },
    {
      key: 'monthly',
      name: 'Monthly Plan',
      price: '$4.99',
      label: '/month',
      savings: '',
      subtext: 'Cancel anytime',
      isBestValue: false,
      isActive: true,
      sortOrder: 2,
    },
  ],
  features: [
    {
      key: 'custom-palaces',
      title: 'Custom Memory Palaces',
      description: 'Create unlimited custom palaces with your own locations',
      isActive: true,
      sortOrder: 1,
    },
    {
      key: 'edit-default-palaces',
      title: 'Edit Default Palaces',
      description: 'Customize pre-built palaces to match your preferences',
      isActive: true,
      sortOrder: 2,
    },
    {
      key: 'upload-custom-images',
      title: 'Upload Custom Images',
      description: 'Use your own photos for more personal memory locations',
      isActive: true,
      sortOrder: 3,
    },
    {
      key: 'advanced-analytics',
      title: 'Advanced Analytics',
      description: 'Detailed insights into your performance',
      isActive: true,
      sortOrder: 4,
    },
    {
      key: 'cloud-sync',
      title: 'Cloud Sync',
      description: 'Seamlessly sync across all your devices',
      isActive: true,
      sortOrder: 5,
    },
    {
      key: 'ad-free',
      title: 'Ad-Free Experience',
      description: 'Focus on learning without interruptions',
      isActive: true,
      sortOrder: 6,
    },
  ],
  subscribeButton: {
    enabled: false,
    label: 'Start 7-Day Free Trial',
    disabledLabel: 'Coming Soon',
    pendingMessage: 'Subscription checkout is not available yet.',
  },
  footer: {
    finePrint: 'Recurring billing. Cancel anytime in App Store.',
  },
  terms: {
    buttonLabel: 'Terms & Conditions',
    title: 'Terms & Conditions',
    closeButtonLabel: 'Close',
    sections: [
      {
        title: 'Subscription Terms',
        body: 'By subscribing to MemoPal Premium, you agree to pay the subscription fee for the selected plan. Your subscription will automatically renew unless cancelled at least 24 hours before the end of the current period.',
      },
      {
        title: 'Free Trial',
        body: 'New subscribers are eligible for a 7-day free trial. You will not be charged during the trial period. If you do not cancel before the trial ends, your payment method will be charged the subscription fee.',
      },
      {
        title: 'Cancellation',
        body: 'You can cancel your subscription at any time from the Settings page. Cancellation takes effect at the end of your current billing period. No refunds will be provided for partial subscription periods.',
      },
      {
        title: 'Premium Features',
        body: 'Premium features include unlimited custom palaces, custom images, advanced analytics, cloud sync, and an ad-free experience. Features may be updated or modified at our discretion.',
      },
      {
        title: 'Data & Privacy',
        body: 'Your learning data will be stored securely and used only to provide the service. Cloud sync requires Google login and stores your data on secure servers. We will never share your data with third parties.',
      },
      {
        title: 'Changes to Terms',
        body: 'We reserve the right to modify these terms at any time. You will be notified of significant changes. Continued use of the service after changes constitutes acceptance of the new terms.',
      },
    ],
  },
};
