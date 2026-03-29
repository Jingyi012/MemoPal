import { systemSettingsApi } from '@/api/systemSettings';
import {
  PremiumSubscriptionConfig,
  PremiumSubscriptionFeatureConfig,
  PremiumSubscriptionPlanConfig,
  PremiumSubscriptionTermsSectionConfig,
} from '@/types/premiumSubscriptionConfig';
import { useQuery } from '@tanstack/react-query';

export const DEFAULT_PREMIUM_SUBSCRIPTION_CONFIG: PremiumSubscriptionConfig = {
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
      savings: null,
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

export const PREMIUM_SUBSCRIPTION_CONFIG_KEYS = {
  all: ['premium-subscription-config'] as const,
  mobile: () => [...PREMIUM_SUBSCRIPTION_CONFIG_KEYS.all, 'mobile'] as const,
};

function normalizePlans(
  raw?: PremiumSubscriptionPlanConfig[] | null
): PremiumSubscriptionPlanConfig[] {
  const plans = Array.isArray(raw)
    ? raw
        .map((item, index) => ({
          key: String(item?.key ?? '').trim(),
          name: String(item?.name ?? '').trim(),
          price: String(item?.price ?? '').trim(),
          label: String(item?.label ?? '').trim(),
          savings: typeof item?.savings === 'string' ? item.savings.trim() : null,
          subtext: typeof item?.subtext === 'string' ? item.subtext.trim() : undefined,
          isBestValue: item?.isBestValue === true,
          isActive: item?.isActive !== false,
          sortOrder:
            typeof item?.sortOrder === 'number' && Number.isFinite(item.sortOrder)
              ? item.sortOrder
              : index + 1,
        }))
        .filter((item) => item.key.length > 0 && item.name.length > 0)
    : [];

  const active = plans
    .filter((item) => item.isActive !== false)
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

  return active.length > 0 ? active : DEFAULT_PREMIUM_SUBSCRIPTION_CONFIG.plans;
}

function normalizeFeatures(
  raw?: PremiumSubscriptionFeatureConfig[] | null
): PremiumSubscriptionFeatureConfig[] {
  const features = Array.isArray(raw)
    ? raw
        .map((item, index) => ({
          key: String(item?.key ?? '').trim(),
          title: String(item?.title ?? '').trim(),
          description: String(item?.description ?? '').trim(),
          isActive: item?.isActive !== false,
          sortOrder:
            typeof item?.sortOrder === 'number' && Number.isFinite(item.sortOrder)
              ? item.sortOrder
              : index + 1,
        }))
        .filter(
          (item) => item.key.length > 0 && item.title.length > 0 && item.description.length > 0
        )
    : [];

  const active = features
    .filter((item) => item.isActive !== false)
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

  return active.length > 0 ? active : DEFAULT_PREMIUM_SUBSCRIPTION_CONFIG.features;
}

function normalizeTermSections(
  raw?: PremiumSubscriptionTermsSectionConfig[] | null
): PremiumSubscriptionTermsSectionConfig[] {
  const sections = Array.isArray(raw)
    ? raw
        .map((item) => ({
          title: String(item?.title ?? '').trim(),
          body: String(item?.body ?? '').trim(),
        }))
        .filter((item) => item.title.length > 0 && item.body.length > 0)
    : [];

  return sections.length > 0 ? sections : DEFAULT_PREMIUM_SUBSCRIPTION_CONFIG.terms.sections;
}

function normalizeConfig(raw?: Partial<PremiumSubscriptionConfig> | null): PremiumSubscriptionConfig {
  if (!raw) {
    return DEFAULT_PREMIUM_SUBSCRIPTION_CONFIG;
  }

  return {
    hero: {
      title: raw.hero?.title?.trim() || DEFAULT_PREMIUM_SUBSCRIPTION_CONFIG.hero.title,
      subtitle: raw.hero?.subtitle?.trim() || DEFAULT_PREMIUM_SUBSCRIPTION_CONFIG.hero.subtitle,
    },
    sections: {
      includedTitle:
        raw.sections?.includedTitle?.trim() ||
        DEFAULT_PREMIUM_SUBSCRIPTION_CONFIG.sections.includedTitle,
    },
    plans: normalizePlans(raw.plans),
    features: normalizeFeatures(raw.features),
    subscribeButton: {
      enabled:
        typeof raw.subscribeButton?.enabled === 'boolean'
          ? raw.subscribeButton.enabled
          : DEFAULT_PREMIUM_SUBSCRIPTION_CONFIG.subscribeButton.enabled,
      label:
        raw.subscribeButton?.label?.trim() ||
        DEFAULT_PREMIUM_SUBSCRIPTION_CONFIG.subscribeButton.label,
      disabledLabel:
        raw.subscribeButton?.disabledLabel?.trim() ||
        DEFAULT_PREMIUM_SUBSCRIPTION_CONFIG.subscribeButton.disabledLabel,
      pendingMessage:
        raw.subscribeButton?.pendingMessage?.trim() ||
        DEFAULT_PREMIUM_SUBSCRIPTION_CONFIG.subscribeButton.pendingMessage,
    },
    footer: {
      finePrint:
        raw.footer?.finePrint?.trim() || DEFAULT_PREMIUM_SUBSCRIPTION_CONFIG.footer.finePrint,
    },
    terms: {
      buttonLabel:
        raw.terms?.buttonLabel?.trim() || DEFAULT_PREMIUM_SUBSCRIPTION_CONFIG.terms.buttonLabel,
      title: raw.terms?.title?.trim() || DEFAULT_PREMIUM_SUBSCRIPTION_CONFIG.terms.title,
      closeButtonLabel:
        raw.terms?.closeButtonLabel?.trim() ||
        DEFAULT_PREMIUM_SUBSCRIPTION_CONFIG.terms.closeButtonLabel,
      sections: normalizeTermSections(raw.terms?.sections),
    },
  };
}

export const normalizePremiumSubscriptionConfig = normalizeConfig;

export function usePremiumSubscriptionConfig() {
  const query = useQuery({
    queryKey: PREMIUM_SUBSCRIPTION_CONFIG_KEYS.mobile(),
    queryFn: async () => {
      const setting = await systemSettingsApi.getPremiumSubscriptionConfig();
      if (!setting?.value) {
        return null;
      }

      try {
        const parsed = JSON.parse(setting.value) as Partial<PremiumSubscriptionConfig>;
        return normalizeConfig(parsed);
      } catch {
        throw new Error('Premium subscription config is invalid.');
      }
    },
    refetchOnMount: 'always',
    staleTime: 0,
    gcTime: 1000 * 60 * 15,
    retry: 1,
  });

  const errorMessage =
    query.error instanceof Error ? query.error.message : 'Could not load premium page data.';

  return {
    config: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    errorMessage,
    refetch: query.refetch,
  };
}
