import { systemSettingsApi } from '@/core/settings/api/systemSettings';
import { ActionSheet } from '@/components/ActionSheet';
import AnimatedPressable from '@/components/AnimatedPressable';
import { AppButton } from '@/components/ui/AppButton';
import { BaseCard } from '@/components/BaseCard';
import { CommonHeader } from '@/components/CommonHeader';
import LoadingView from '@/components/LoadingView';
import { memopalTheme as theme, memopalThemes } from '@/theme/memopalTheme';
import { createThemedStyles } from '@/theme/createThemedStyles';
import { typography } from '@/theme/typography';
import {
  DEFAULT_PREMIUM_SUBSCRIPTION_CONFIG,
  normalizePremiumSubscriptionConfig,
} from '@/features/subscription/hooks/usePremiumSubscriptionConfig';
import { PremiumSubscriptionConfig } from '@/features/subscription/types/premiumSubscriptionConfig';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Check, Coins, Crown, Sparkles, X } from '@/core/icons';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import TermsAndConditionSheet from '../components/TermsAndConditionSheet';
import { useTranslation } from '@/core/i18n/useTranslation';
import { useColorScheme } from 'nativewind';
import { AiCreditCoinButton } from '@/features/ai-credits/components/AiCreditBalanceLink';
import { useAiCredits } from '@/features/ai-credits/hooks/useAiCredits';
import { useCurrentUser } from '@/features/profile/hooks/useCurrentUser';
import { useUserState } from '@/contexts/UserStateContext';
import { billingApi } from '@/features/subscription/api/billing';
import Toast from 'react-native-toast-message';

const PremiumScreen: React.FC = () => {
  const router = useRouter();
  const { t, language } = useTranslation('subscription');
  const zh = language === 'zh';
  const { colorScheme } = useColorScheme();
  const activeTheme = memopalThemes[colorScheme ?? 'light'];
  const { user, isLoading: isUserLoading, refetch: refetchUser } = useCurrentUser();
  const { userState, updateState } = useUserState();
  const insets = useSafeAreaInsets();
  const termsRef = useRef<BottomSheetModal>(null);
  const [config, setConfig] = useState<PremiumSubscriptionConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);

  const plans = useMemo(() => config?.plans ?? [], [config?.plans]);
  const features = useMemo(() => config?.features ?? [], [config?.features]);
  const selectedPlan = useMemo(
    () => plans.find((plan) => plan.key === selectedPlanId) ?? null,
    [plans, selectedPlanId]
  );

  const loadPremiumConfig = useCallback(async (silent = false) => {
    try {
      if (silent) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      const setting = await systemSettingsApi.getPremiumSubscriptionConfig();
      if (!setting?.value) {
        // Keep the page usable in a fresh environment before an admin has
        // published the optional premium copy/configuration.
        setConfig(DEFAULT_PREMIUM_SUBSCRIPTION_CONFIG);
        setLoadError(null);
        return;
      }

      const parsed = JSON.parse(setting.value) as Partial<PremiumSubscriptionConfig>;
      setConfig(normalizePremiumSubscriptionConfig(parsed));
      setLoadError(null);
    } catch (error: any) {
      const message =
        error?.message?.trim() ||
        'Could not load premium data. Check your connection and try again.';
      // Premium configuration is presentation data, not an authorization
      // source. Render the built-in copy when the API is unavailable so a
      // transient/configuration issue cannot strand the user on an error page.
      setConfig(DEFAULT_PREMIUM_SUBSCRIPTION_CONFIG);
      setLoadError(message);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadPremiumConfig();
  }, [loadPremiumConfig]);

  useEffect(() => {
    if (plans.length === 0) {
      setSelectedPlanId(null);
      return;
    }

    const stillExists = selectedPlanId && plans.some((plan) => plan.key === selectedPlanId);
    if (!stillExists) {
      setSelectedPlanId(plans[0].key);
    }
  }, [plans, selectedPlanId]);

  const onRefresh = useCallback(async () => {
    await Promise.all([loadPremiumConfig(true), refetchUser()]);
  }, [loadPremiumConfig, refetchUser]);

  const cancelSubscription = useCallback(async () => {
    const entitlement = await billingApi.cancelSubscription();
    await updateState((current) => ({
      subscription: {
        ...current.subscription,
        isPremium: entitlement.isPremium,
        planId: entitlement.planId ?? undefined,
        startedAt: entitlement.startedAt ?? undefined,
        expiresAt: entitlement.expiresAt ?? undefined,
        autoRenew: entitlement.autoRenew,
        status: (entitlement.status as any) ?? undefined,
      },
    }));
    await refetchUser();
  }, [refetchUser, updateState]);

  if (isLoading || isUserLoading) {
    return <LoadingView />;
  }

  if (user?.isPremium) {
    return <PremiumMemberView theme={activeTheme}
      config={config ?? DEFAULT_PREMIUM_SUBSCRIPTION_CONFIG}
      subscription={userState.subscription} isRefreshing={isRefreshing}
      onRefresh={onRefresh} onCancel={cancelSubscription} onClose={() => router.back()} />;
  }

  const topBar = (
      <View style={[styles.topBar, { paddingTop: insets.top + 8, backgroundColor: activeTheme.canvas, borderBottomColor: activeTheme.line }]}>
      <View style={styles.topBarPill}>
        <Sparkles size={14} color={activeTheme.berryDeep} strokeWidth={2.5} />
        <Text style={[styles.topBarLabel, { color: activeTheme.berryDeep }]}>{t('upgrade')}</Text>
      </View>
      <View style={styles.topBarActions}>
      <AiCreditCoinButton />
      <AnimatedPressable
        accessibilityLabel="Close premium page"
        onPress={() => router.back()}
        style={[styles.closeButton, { backgroundColor: activeTheme.sand }]}>
        <X size={19} color={activeTheme.inkSoft} />
      </AnimatedPressable>
      </View>
    </View>
  );

  if (!config) {
    return (
      <View style={styles.page}>
        {topBar}
        <View style={styles.unavailableContent}>
          <View style={styles.unavailableIcon}>
            <Sparkles size={24} color={theme.violetDeep} />
          </View>
          <Text style={styles.unavailableTitle}>{t('premiumUnavailable')}</Text>
          <Text style={styles.unavailableBody}>
            {loadError ?? 'Please try again in a moment.'}
          </Text>
          <AppButton label={t('tryAgain')} onPress={() => void loadPremiumConfig()} size="regular" style={styles.retryButton} variant="secondary" />
        </View>
      </View>
    );
  }

  const handleSubscribePress = () => {
    Toast.show({
      type: 'info',
      text1: t('subscriptionUnavailable'),
      text2: config.subscribeButton.pendingMessage,
    });
  };

  return (
    <View style={[styles.page, { backgroundColor: activeTheme.canvas }] }>
      {topBar}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />}>
        {loadError ? (
          <View style={[styles.errorBanner, { borderColor: activeTheme.berryLine, backgroundColor: activeTheme.berryTint }]}>
            <Text style={styles.errorTitle}>{t('refreshUnavailable')}</Text>
            <Text style={styles.errorBody}>{loadError}</Text>
          </View>
        ) : null}

        <LinearGradient
          colors={[theme.night, theme.nightDeep]}
          start={[0, 0]}
          end={[1, 1]}
          style={styles.heroCard}>
          <View pointerEvents="none" style={styles.heroGlow} />
          <View style={styles.heroHeader}>
            <View style={styles.heroIcon}>
              <Crown size={27} color={theme.sun} strokeWidth={2.4} />
            </View>
            <View style={styles.heroTag}>
              <Sparkles size={13} color={theme.sun} strokeWidth={2.5} />
              <Text style={styles.heroTagText}>{t('title')}</Text>
            </View>
          </View>
          <Text style={styles.heroTitle}>{config.hero.title}</Text>
          <Text style={styles.heroSubtitle}>{config.hero.subtitle}</Text>
          <View style={styles.heroRule} />
          <View style={styles.heroPromise}>
            <Check size={15} color={theme.sun} strokeWidth={3} />
            <Text style={styles.heroPromiseText}>{config.sections.includedTitle}</Text>
          </View>
        </LinearGradient>

        <View style={[styles.body, { backgroundColor: activeTheme.canvas }]}>
          <BaseCard radius="3xl" padding="lg" shadow="sm" style={styles.featuresCard}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: activeTheme.ink }]}>{config.sections.includedTitle}</Text>
              <View style={styles.sectionMarker}>
                <Check size={14} color={theme.violetDeep} strokeWidth={3} />
              </View>
            </View>
            <View style={styles.featureList}>
              {features.map((feature) => (
                <View key={feature.key} style={styles.featureRow}>
                  <View style={styles.featureIcon}>
                    <Check size={15} color={theme.violetDeep} strokeWidth={3} />
                  </View>
                  <View style={styles.featureCopy}>
                    <Text style={[styles.featureTitle, { color: activeTheme.ink }]}>{feature.title}</Text>
                    <Text style={[styles.featureDescription, { color: activeTheme.inkSoft }]}>{feature.description}</Text>
                  </View>
                </View>
              ))}
            </View>
          </BaseCard>

          <View style={styles.planHeading}>
            <View>
              <Text style={[styles.planHeadingTitle, { color: activeTheme.ink }]}>{zh ? '选择付款周期' : 'Choose your billing cycle'}</Text>
              <Text style={[styles.planHeadingBody, { color: activeTheme.inkSoft }]}>{zh ? '随时可在应用商店管理或取消' : 'Manage or cancel through the app store'}</Text>
            </View>
            <View style={[styles.securePill, { backgroundColor: activeTheme.mintTint }]}><Text style={[styles.securePillText, { color: activeTheme.successText }]}>{zh ? '安全结账' : 'SECURE'}</Text></View>
          </View>

          <View style={[styles.creditAllowance, { backgroundColor: activeTheme.sunTint, borderColor: activeTheme.sunLine }]}>
            <View style={[styles.creditAllowanceIcon, { backgroundColor: activeTheme.paper }]}><Coins size={20} color={activeTheme.sunDeep} strokeWidth={2.5} /></View>
            <View style={styles.creditAllowanceCopy}>
              <Text style={[styles.creditAllowanceTitle, { color: activeTheme.ink }]}>{config.monthlyAiCredits.toLocaleString()} AI credits / {zh ? '月' : 'month'}</Text>
              <Text style={[styles.creditAllowanceBody, { color: activeTheme.inkSoft }]}>{zh ? '月付和年付方案均按月发放' : 'Granted monthly on both monthly and yearly plans'}</Text>
            </View>
          </View>

          <View style={styles.planList}>
            {plans.map((plan) => {
              const selected = plan.key === selectedPlan?.key;
              return (
                <TouchableOpacity
                  key={plan.key}
                  activeOpacity={0.8}
                  onPress={() => setSelectedPlanId(plan.key)}
                  style={[
                    [styles.planCard, { backgroundColor: activeTheme.paper, borderColor: activeTheme.line }],
                    plan.isBestValue && styles.planCardBestValue,
                    selected && styles.planCardSelected,
                  ]}>
                  {plan.isBestValue && (
                    <View style={styles.bestValueBadge}>
                      <LinearGradient
                        colors={[theme.sun, theme.sunDeep]}
                        start={[0, 0]}
                        end={[1, 0]}
                        style={styles.bestValueGradient}>
                        <Text style={styles.bestValueText}>BEST VALUE</Text>
                      </LinearGradient>
                    </View>
                  )}

                  <View style={styles.planRow}>
                    <View style={[styles.radio, selected && styles.radioSelected]}>
                      {selected && <View style={styles.radioDot} />}
                    </View>
                    <View style={styles.planDetails}>
                      <Text
                        numberOfLines={1}
                        style={[styles.planName, { color: selected ? activeTheme.violetDeep : activeTheme.ink }]}>
                        {plan.name}
                      </Text>
                      {!!plan.savings && <Text style={[styles.planSavings, { color: activeTheme.grass }]}>{plan.savings}</Text>}
                      {!!plan.subtext && <Text style={[styles.planSubtext, { color: activeTheme.inkSoft }]}>{plan.subtext}</Text>}
                    </View>
                    <View style={styles.priceBlock}>
                      <Text style={[styles.planPrice, { color: activeTheme.ink }]}>{plan.price}</Text>
                      <Text style={[styles.planLabel, { color: activeTheme.inkSoft }]}>{plan.label}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {selectedPlan ? (
            <View style={[styles.selectionSummary, { backgroundColor: activeTheme.paper, borderColor: activeTheme.line }]}>
              <View style={styles.selectionCopy}>
                <Text style={[styles.selectionLabel, { color: activeTheme.inkSoft }]}>{zh ? '你选择了' : 'YOUR SELECTION'}</Text>
                <Text style={[styles.selectionName, { color: activeTheme.ink }]}>{selectedPlan.name}</Text>
              </View>
              <View style={styles.selectionPriceBlock}>
                <Text style={[styles.selectionPrice, { color: activeTheme.ink }]}>{selectedPlan.price}</Text>
                <Text style={[styles.selectionPeriod, { color: activeTheme.inkSoft }]}>{selectedPlan.label}</Text>
              </View>
            </View>
          ) : null}

          <AnimatedPressable
            onPress={handleSubscribePress}
            accessibilityHint={!config.subscribeButton.enabled ? config.subscribeButton.pendingMessage : undefined}
            style={[
              styles.subscribeButton,
              config.subscribeButton.enabled ? styles.subscribeShadow : styles.subscribeDisabled,
            ]}>
            {config.subscribeButton.enabled ? (
              <LinearGradient
                colors={[activeTheme.violetDeep, activeTheme.violet]}
                start={[0, 0]}
                end={[1, 0]}
                style={styles.subscribeGradient}>
                <Text style={[styles.subscribeText, { color: activeTheme.onAccent }]}>{config.subscribeButton.label}</Text>
                <Check size={18} color={activeTheme.onAccent} strokeWidth={3} />
              </LinearGradient>
            ) : (
              <View style={[styles.disabledInner, { backgroundColor: activeTheme.violetTint }]}>
                <Text style={[styles.disabledText, { color: activeTheme.violetDeep }]}>{config.subscribeButton.disabledLabel}</Text>
                <Text style={styles.disabledHint}>{zh ? '点击查看开放状态' : 'Tap for availability details'}</Text>
              </View>
            )}
          </AnimatedPressable>

          <View style={styles.footer}>
            <Text style={[styles.finePrint, { color: activeTheme.inkMuted }]}>{config.footer.finePrint}</Text>
            <TouchableOpacity onPress={() => termsRef.current?.present()}>
              <Text style={[styles.termsLink, { color: activeTheme.berryDeep }]}>{config.terms.buttonLabel}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      <TermsAndConditionSheet ref={termsRef} terms={config.terms} />
    </View>
  );
};

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: 'transparent' },
  topBarActions: { flexDirection: 'row', alignItems: 'center', gap: 8 }, topBar: { minHeight: 64, paddingHorizontal: 16, paddingBottom: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: theme.canvas, borderBottomWidth: 1, borderBottomColor: theme.line },
  topBarPill: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 999, borderWidth: 1.3, borderColor: theme.berryLine, backgroundColor: theme.berryTint, paddingHorizontal: 10, paddingVertical: 5 },
  topBarLabel: { color: theme.berryDeep, fontFamily: typography.bodyExtraBold, fontSize: 10, letterSpacing: 0.8, textTransform: 'uppercase' },
  closeButton: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.sand },
  scrollContent: { paddingBottom: 36 },
  errorBanner: { marginHorizontal: 16, marginTop: 12, borderRadius: 16, borderWidth: 1.5, borderColor: theme.berryLine, backgroundColor: theme.berryTint, paddingHorizontal: 14, paddingVertical: 11 },
  errorTitle: { color: theme.berryDeep, fontFamily: typography.bodyExtraBold, fontSize: 12 },
  errorBody: { color: theme.berryDeep, fontFamily: typography.bodySemibold, fontSize: 11, lineHeight: 16, marginTop: 3 },
  heroCard: { minHeight: 214, marginHorizontal: 16, marginTop: 16, borderRadius: 26, padding: 20, overflow: 'hidden', boxShadow: '0px 8px 16px rgba(43, 38, 65, 0.22)' },
  heroGlow: { position: 'absolute', width: 190, height: 190, borderRadius: 95, top: -76, right: -48, backgroundColor: 'rgba(255, 201, 60, 0.2)' },
  heroHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  heroIcon: { width: 52, height: 52, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255, 201, 60, 0.16)', borderWidth: 1, borderColor: 'rgba(255, 201, 60, 0.3)' },
  heroTag: { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 10, paddingVertical: 6 },
  heroTagText: { color: '#FFFFFF', fontFamily: typography.bodyExtraBold, fontSize: 10, letterSpacing: 0.5 },
  heroTitle: { color: '#FFFFFF', fontFamily: typography.displayExtraBold, fontSize: 28, lineHeight: 34, marginTop: 18 },
  heroSubtitle: { color: 'rgba(255,255,255,0.78)', fontFamily: typography.bodySemibold, fontSize: 13, lineHeight: 19, marginTop: 4, maxWidth: '88%' },
  heroRule: { height: 1, backgroundColor: 'rgba(255,255,255,0.14)', marginTop: 17 },
  heroPromise: { flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 12 },
  heroPromiseText: { color: '#FFFFFF', fontFamily: typography.bodyExtraBold, fontSize: 11 },
  body: { paddingHorizontal: 16 },
  featuresCard: { marginTop: 16 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  sectionTitle: { color: theme.inkSoft, fontFamily: typography.bodyExtraBold, fontSize: 11, letterSpacing: 1, textTransform: 'uppercase' },
  sectionMarker: { width: 28, height: 28, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.sunTint },
  featureList: { gap: 15 },
  featureRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  featureIcon: { width: 27, height: 27, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.mintTint },
  featureCopy: { flex: 1, minWidth: 0 },
  featureTitle: { color: theme.ink, fontFamily: typography.bodyExtraBold, fontSize: 13, lineHeight: 18 },
  featureDescription: { color: theme.inkSoft, fontFamily: typography.bodySemibold, fontSize: 11, lineHeight: 16, marginTop: 2 },
  planHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginTop: 22 }, planHeadingTitle: { color: theme.ink, fontFamily: typography.displayExtraBold, fontSize: 19 }, planHeadingBody: { color: theme.inkSoft, fontFamily: typography.bodySemibold, fontSize: 10, marginTop: 3 }, securePill: { borderRadius: 999, paddingHorizontal: 9, paddingVertical: 5, backgroundColor: theme.mintTint }, securePillText: { color: theme.successText, fontFamily: typography.bodyExtraBold, fontSize: 8, letterSpacing: 0.6 },
  creditAllowance: { minHeight: 72, marginTop: 13, borderRadius: 18, borderWidth: 1.5, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 11, backgroundColor: theme.sunTint, borderColor: theme.sunLine }, creditAllowanceIcon: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.paper }, creditAllowanceCopy: { flex: 1, minWidth: 0 }, creditAllowanceTitle: { color: theme.ink, fontFamily: typography.bodyExtraBold, fontSize: 14 }, creditAllowanceBody: { color: theme.inkSoft, fontFamily: typography.bodySemibold, fontSize: 10, lineHeight: 15, marginTop: 2 },
  planList: { gap: 12, marginTop: 13 },
  planCard: { position: 'relative', borderRadius: 20, borderWidth: 2, borderColor: theme.line, backgroundColor: theme.paper, paddingHorizontal: 16, paddingVertical: 17 },
  planCardBestValue: { paddingTop: 38 },
  planCardSelected: { borderColor: theme.violet, backgroundColor: theme.violetTint, boxShadow: '0px 4px 10px rgba(122, 104, 224, 0.13)' },
  bestValueBadge: { position: 'absolute', zIndex: 2, top: 11, right: 16, borderRadius: 999, overflow: 'hidden' },
  bestValueGradient: { borderRadius: 999, paddingHorizontal: 11, paddingVertical: 5 },
  bestValueText: { color: theme.ink, fontFamily: typography.bodyExtraBold, fontSize: 9, letterSpacing: 0.5 },
  planRow: { flexDirection: 'row', alignItems: 'center' },
  radio: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: '#D8D4C9', alignItems: 'center', justifyContent: 'center', marginRight: 11 },
  radioSelected: { borderColor: theme.violetDeep },
  radioDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: theme.violetDeep },
  planDetails: { flex: 1, minWidth: 0 },
  planName: { color: theme.ink, fontFamily: typography.bodyExtraBold, fontSize: 15, lineHeight: 20 },
  planNameSelected: { color: theme.violetDeep },
  planSavings: { color: theme.grass, fontFamily: typography.bodyExtraBold, fontSize: 11, lineHeight: 16, marginTop: 1 },
  planSubtext: { color: theme.inkSoft, fontFamily: typography.bodySemibold, fontSize: 10, lineHeight: 15, marginTop: 1 },
  priceBlock: { alignItems: 'flex-end', marginLeft: 10 },
  planPrice: { color: theme.ink, fontFamily: typography.displayExtraBold, fontSize: 21, lineHeight: 25 },
  planLabel: { color: theme.inkSoft, fontFamily: typography.bodySemibold, fontSize: 10, marginTop: 1 },
  selectionSummary: { minHeight: 70, marginTop: 14, borderRadius: 18, borderWidth: 1.5, paddingHorizontal: 15, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, backgroundColor: theme.paper }, selectionCopy: { flex: 1, minWidth: 0 }, selectionLabel: { color: theme.inkSoft, fontFamily: typography.bodyExtraBold, fontSize: 8, letterSpacing: 0.7 }, selectionName: { color: theme.ink, fontFamily: typography.bodyExtraBold, fontSize: 13, marginTop: 3 }, selectionPriceBlock: { alignItems: 'flex-end' }, selectionPrice: { color: theme.ink, fontFamily: typography.displayExtraBold, fontSize: 18 }, selectionPeriod: { color: theme.inkSoft, fontFamily: typography.bodySemibold, fontSize: 9 },
  subscribeButton: { width: '100%', minHeight: 56, borderRadius: 18, marginTop: 20, overflow: 'visible' },
  subscribeShadow: { boxShadow: '0px 6px 0px rgba(105, 80, 204, 0.3)' },
  subscribeGradient: { minHeight: 56, borderRadius: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 16 },
  subscribeText: { color: theme.ink, fontFamily: typography.bodyExtraBold, fontSize: 15 },
  subscribeDisabled: { opacity: 0.78 },
  disabledInner: { minHeight: 56, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.line },
  disabledText: { color: theme.inkSoft, fontFamily: typography.bodyExtraBold, fontSize: 15 },
  disabledHint: { color: theme.inkMuted, fontFamily: typography.bodySemibold, fontSize: 9, marginTop: 2 },
  footer: { alignItems: 'center', marginTop: 19, marginBottom: 12 },
  finePrint: { color: '#9A97A7', fontFamily: typography.bodySemibold, fontSize: 10, lineHeight: 15, textAlign: 'center' },
  termsLink: { color: theme.berryDeep, fontFamily: typography.bodyExtraBold, fontSize: 11, marginTop: 8, textDecorationLine: 'underline' },
  unavailableContent: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28 },
  unavailableIcon: { width: 56, height: 56, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.skyTint, marginBottom: 14 },
  unavailableTitle: { color: theme.ink, fontFamily: typography.bodyExtraBold, fontSize: 16, lineHeight: 22, textAlign: 'center' },
  unavailableBody: { color: theme.inkSoft, fontFamily: typography.bodySemibold, fontSize: 12, lineHeight: 18, textAlign: 'center', marginTop: 7, marginBottom: 18 },
  retryButton: { alignSelf: 'center' },
});

export default PremiumScreen;

function PremiumMemberView({ theme, config, subscription, isRefreshing, onRefresh, onCancel, onClose }: {
  theme: typeof memopalThemes.light;
  config: PremiumSubscriptionConfig;
  subscription: {
    planId?: string; expiresAt?: string; autoRenew: boolean; status?: string;
  };
  isRefreshing: boolean;
  onRefresh: () => Promise<void>;
  onCancel: () => Promise<void>;
  onClose: () => void;
}) {
  const { styles } = useMemberStyles();
  const { language, t } = useTranslation('subscription');
  const credits = useAiCredits();
  const zh = language === 'zh';
  const plan = config.plans.find((item) =>
    subscription.planId?.toLowerCase().includes(item.key.toLowerCase())) ?? null;
  const planName = plan?.name ?? (subscription.planId || (zh ? 'Premium 方案' : 'Premium plan'));
  const statusLabel = subscription.status === 'trialing'
    ? (zh ? '试用中' : 'Trial')
    : subscription.status === 'past_due'
      ? (zh ? '付款待处理' : 'Payment due')
      : subscription.status === 'canceled' || subscription.status === 'cancelled'
        ? (zh ? '已取消续订' : 'Cancelled')
      : (zh ? '已激活' : 'Active');
  const renewalLabel = subscription.autoRenew
    ? (zh ? '自动续订已开启' : 'Auto-renew is on')
    : (zh ? '当前周期结束后停止' : 'Ends after this period');
  const periodDate = subscription.expiresAt
    ? new Date(subscription.expiresAt).toLocaleDateString()
    : (zh ? '由账户同步' : 'Synced from your account');
  const cancelSheetRef = useRef<BottomSheetModal>(null);

  return <View style={styles.memberPage}>
    <CommonHeader
      title={t('manage')}
      eyebrow="MEMOPAL PREMIUM"
      backAction={onClose}
    />
    <ScrollView contentContainerStyle={styles.memberContent} showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={isRefreshing || credits.isRefetching}
        onRefresh={() => void Promise.all([onRefresh(), credits.refetch()])} />}>
      <View style={styles.memberHero}><View style={styles.memberHeroTop}><View style={styles.memberOrb}><Crown size={27} color={theme.sun} strokeWidth={2.3} /></View><View style={styles.activeBadge}><View style={styles.activeDot} /><Text style={styles.activeBadgeText}>{statusLabel.toUpperCase()}</Text></View></View>
        <Text style={styles.memberEyebrow}>MEMOPAL PREMIUM</Text>
        <Text style={styles.memberTitle}>{zh ? 'Premium 已启用' : 'Premium is active'}</Text>
        <Text style={styles.memberSubtitle}>{zh ? '所有进阶记忆工具和会员权益都已为你解锁。' : 'Your advanced memory tools and member benefits are unlocked.'}</Text>
      </View>

      <View style={styles.planCard}>
        <Text style={styles.planCardEyebrow}>{zh ? '当前方案' : 'CURRENT PLAN'}</Text>
        <Text style={styles.planCardTitle}>{planName}</Text>
        <View style={styles.planCardDivider} />
        <View style={styles.detailGrid}>
          <View style={styles.detailCell}><Text style={styles.detailLabel}>{zh ? '续订方式' : 'Renewal'}</Text><Text style={styles.detailValue}>{renewalLabel}</Text></View>
          <View style={styles.detailCellDivider} />
          <View style={styles.detailCell}><Text style={styles.detailLabel}>{zh ? '本期结束' : 'Period ends'}</Text><Text style={styles.detailValue}>{periodDate}</Text></View>
        </View>
        {subscription.status !== 'canceled' && subscription.status !== 'cancelled' ? (
          <AnimatedPressable
            accessibilityRole="button"
            accessibilityLabel={t('cancelSubscription')}
            onPress={() => cancelSheetRef.current?.present()}
            style={styles.cancelButton}>
            <Text style={styles.cancelButtonText}>{t('cancelSubscription')}</Text>
          </AnimatedPressable>
        ) : (
          <View style={styles.cancelledNote}>
            <Text style={styles.cancelledNoteText}>{t('subscriptionCancelled')}</Text>
          </View>
        )}
      </View>

      <View style={styles.creditSummary}>
        <View style={styles.creditSummaryCell}><View style={[styles.creditSummaryIcon, styles.monthlyCreditIcon]}><Coins size={18} color={theme.violetDeep} /></View><Text style={styles.creditSummaryValue}>{config.monthlyAiCredits.toLocaleString()}</Text><Text style={styles.creditSummaryLabel}>{zh ? '每月发放' : 'Credits each month'}</Text></View>
        <View style={styles.creditSummaryDivider} />
        <View style={styles.creditSummaryCell}><View style={[styles.creditSummaryIcon, styles.availableCreditIcon]}><Sparkles size={18} color={theme.grass} /></View><Text style={styles.creditSummaryValue}>{credits.isPending ? '…' : (credits.data?.available ?? 0).toLocaleString()}</Text><Text style={styles.creditSummaryLabel}>{zh ? '当前可用' : 'Available now'}</Text></View>
      </View>

      <View style={styles.memberSection}><Text style={styles.memberSectionTitle}>{zh ? '你的全部权益' : 'Your Premium benefits'}</Text>
        <View style={styles.creditBenefit}><View style={styles.checkCircle}><Check size={14} color={theme.onAccent} strokeWidth={3} /></View><View style={styles.memberRowCopy}><Text style={styles.memberRowTitle}>{zh ? `每月 ${config.monthlyAiCredits.toLocaleString()} AI credits` : `${config.monthlyAiCredits.toLocaleString()} AI credits every month`}</Text><Text style={styles.memberRowDescription}>{zh ? '可用于生成联想故事和图片，需要时仍可额外充值。' : 'Use them for AI stories and images, with optional top-ups whenever needed.'}</Text></View></View>
        {config.features.map((feature) => <View key={feature.key} style={styles.memberRow}><View style={styles.checkCircle}><Check size={14} color={theme.onAccent} strokeWidth={3} /></View><View style={styles.memberRowCopy}><Text style={styles.memberRowTitle}>{feature.title}</Text><Text style={styles.memberRowDescription}>{feature.description}</Text></View></View>)}
      </View>

      <Text style={styles.syncNote}>{zh ? '取消后仍可使用至当前周期结束。订阅状态由 MemoPal 账户安全同步。' : 'After cancelling, you can keep using Premium until the current period ends. Subscription status is securely synced from your MemoPal account.'}</Text>

    </ScrollView>
    <ActionSheet
      ref={cancelSheetRef}
      title={zh ? '取消自动续订？' : 'Cancel auto-renewal?'}
      description={zh
        ? `取消后你仍可使用 Premium 至 ${periodDate}。之后不会再次扣款。`
        : `You will keep Premium until ${periodDate}. You will not be charged again after that.`}
      actionLabel={t('cancelSubscription')}
      cancelLabel={t('keepSubscription')}
      variant="destructive"
      Icon={X}
      onAction={async () => {
        try {
          await onCancel();
        } catch (error: any) {
          Toast.show({
            type: 'error',
            text1: t('cancelFailed'),
            text2: error?.message ?? t('tryAgain'),
          });
        }
      }}
    />
  </View>;
}

const useMemberStyles = createThemedStyles((theme) => StyleSheet.create({
  memberPage: { flex: 1, backgroundColor: theme.canvas },
  memberContent: { padding: 16, gap: 14, paddingBottom: 40 }, memberHero: { borderRadius: 24, padding: 20, backgroundColor: theme.night, overflow: 'hidden' }, memberHeroTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, memberOrb: { width: 50, height: 50, borderRadius: 17, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(255,201,60,0.14)', borderWidth: 1, borderColor: 'rgba(255,201,60,0.28)' },
  memberEyebrow: { color: theme.sun, fontFamily: typography.bodyExtraBold, fontSize: 9, letterSpacing: 1, marginTop: 18 }, memberTitle: { color: '#FFF', fontFamily: typography.displayExtraBold, fontSize: 27, lineHeight: 34, marginTop: 4 }, memberSubtitle: { color: 'rgba(255,255,255,0.72)', fontFamily: typography.bodySemibold, fontSize: 12, lineHeight: 18, marginTop: 3, maxWidth: '90%' }, activeBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6, backgroundColor: 'rgba(63,184,127,0.15)', borderWidth: 1, borderColor: 'rgba(95,208,154,0.28)' }, activeDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: theme.grass }, activeBadgeText: { color: '#8BE0B4', fontFamily: typography.bodyExtraBold, fontSize: 9, letterSpacing: 0.7 },
  planCard: { borderRadius: 22, padding: 17, backgroundColor: theme.paper, borderWidth: 1.5, borderColor: theme.line, boxShadow: '0px 4px 0px rgba(105,80,204,0.06)' }, planCardEyebrow: { color: theme.inkMuted, fontFamily: typography.bodyExtraBold, fontSize: 9, letterSpacing: 0.8 }, planCardTitle: { color: theme.ink, fontFamily: typography.displayExtraBold, fontSize: 21, marginTop: 4 }, planCardDivider: { height: 1, backgroundColor: theme.line, marginVertical: 14 }, cancelButton: { minHeight: 44, alignItems: 'center', justifyContent: 'center', marginTop: 14, borderRadius: 13, borderWidth: 1.5, borderColor: theme.berryLine, backgroundColor: theme.berryTint }, cancelButtonText: { color: theme.berryDeep, fontFamily: typography.bodyExtraBold, fontSize: 12 }, cancelledNote: { marginTop: 14, borderRadius: 13, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: theme.mintTint }, cancelledNoteText: { color: theme.successText, fontFamily: typography.bodyExtraBold, fontSize: 11, textAlign: 'center' },
  detailGrid: { minHeight: 54, flexDirection: 'row', alignItems: 'stretch' }, detailCell: { flex: 1, justifyContent: 'center' }, detailCellDivider: { width: 1, marginHorizontal: 14, backgroundColor: theme.line }, detailLabel: { color: theme.inkMuted, fontFamily: typography.bodyExtraBold, fontSize: 9, letterSpacing: 0.4 }, detailValue: { color: theme.ink, fontFamily: typography.bodyExtraBold, fontSize: 11, lineHeight: 16, marginTop: 5 },
  creditSummary: { minHeight: 118, borderRadius: 22, padding: 15, flexDirection: 'row', alignItems: 'center', backgroundColor: theme.paper, borderWidth: 1.5, borderColor: theme.line }, creditSummaryCell: { flex: 1, alignItems: 'center' }, creditSummaryIcon: { width: 34, height: 34, borderRadius: 12, justifyContent: 'center', alignItems: 'center' }, monthlyCreditIcon: { backgroundColor: theme.violetTint }, availableCreditIcon: { backgroundColor: theme.mintTint }, creditSummaryValue: { color: theme.ink, fontFamily: typography.displayExtraBold, fontSize: 23, marginTop: 6 }, creditSummaryLabel: { color: theme.inkSoft, fontFamily: typography.bodySemibold, fontSize: 10, marginTop: 1 }, creditSummaryDivider: { width: 1, height: 66, backgroundColor: theme.line },
  memberSection: { borderRadius: 22, padding: 17, backgroundColor: theme.paper, borderWidth: 1.5, borderColor: theme.line, gap: 16 }, memberSectionTitle: { color: theme.inkMuted, fontFamily: typography.bodyExtraBold, fontSize: 10, letterSpacing: 0.9, textTransform: 'uppercase' }, memberRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 11 }, creditBenefit: { flexDirection: 'row', alignItems: 'flex-start', gap: 11, paddingBottom: 15, borderBottomWidth: 1, borderBottomColor: theme.line }, checkCircle: { width: 25, height: 25, borderRadius: 9, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.violetDeep }, memberRowCopy: { flex: 1, minWidth: 0 }, memberRowTitle: { color: theme.ink, fontFamily: typography.bodyExtraBold, fontSize: 13, lineHeight: 18 }, memberRowDescription: { color: theme.inkSoft, fontFamily: typography.bodySemibold, fontSize: 10, lineHeight: 15, marginTop: 2 }, syncNote: { color: theme.inkMuted, fontFamily: typography.bodySemibold, fontSize: 9, lineHeight: 14, textAlign: 'center', paddingHorizontal: 18, marginTop: 2 },
}));
