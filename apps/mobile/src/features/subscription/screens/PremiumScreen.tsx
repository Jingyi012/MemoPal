import { systemSettingsApi } from '@/core/settings/api/systemSettings';
import AnimatedPressable from '@/components/AnimatedPressable';
import { BaseCard } from '@/components/BaseCard';
import LoadingView from '@/components/LoadingView';
import { memopalTheme as theme, memopalThemes } from '@/theme/memopalTheme';
import { typography } from '@/theme/typography';
import {
  DEFAULT_PREMIUM_SUBSCRIPTION_CONFIG,
  normalizePremiumSubscriptionConfig,
} from '@/features/subscription/hooks/usePremiumSubscriptionConfig';
import { PremiumSubscriptionConfig } from '@/features/subscription/types/premiumSubscriptionConfig';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Check, Crown, Sparkles, X } from 'lucide-react-native';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import TermsAndConditionSheet from '../components/TermsAndConditionSheet';
import { useTranslation } from '@/core/i18n/useTranslation';
import { useColorScheme } from 'nativewind';

const PremiumScreen: React.FC = () => {
  const router = useRouter();
  const { t } = useTranslation('subscription');
  const { colorScheme } = useColorScheme();
  const activeTheme = memopalThemes[colorScheme ?? 'light'];
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

  const onRefresh = useCallback(() => {
    void loadPremiumConfig(true);
  }, [loadPremiumConfig]);

  if (isLoading) {
    return <LoadingView />;
  }

  const topBar = (
    <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
      <View style={styles.topBarPill}>
        <Sparkles size={14} color={theme.berryDeep} strokeWidth={2.5} />
        <Text style={styles.topBarLabel}>{t('upgrade')}</Text>
      </View>
      <AnimatedPressable
        accessibilityLabel="Close premium page"
        onPress={() => router.back()}
        style={styles.closeButton}>
        <X size={19} color={theme.inkSoft} />
      </AnimatedPressable>
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
          <AnimatedPressable style={styles.retryButton} onPress={() => void loadPremiumConfig()}>
            <Text style={styles.retryButtonText}>{t('tryAgain')}</Text>
          </AnimatedPressable>
        </View>
      </View>
    );
  }

  const handleSubscribePress = () => {
    if (!config.subscribeButton.enabled) return;

    Alert.alert(t('subscriptionUnavailable'), config.subscribeButton.pendingMessage);
  };

  return (
    <View style={styles.page}>
      {topBar}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />}>
        {loadError ? (
          <View style={styles.errorBanner}>
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

        <View style={styles.body}>
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
                    <Text style={styles.featureTitle}>{feature.title}</Text>
                    <Text style={styles.featureDescription}>{feature.description}</Text>
                  </View>
                </View>
              ))}
            </View>
          </BaseCard>

          <View style={styles.planList}>
            {plans.map((plan) => {
              const selected = plan.key === selectedPlan?.key;
              return (
                <TouchableOpacity
                  key={plan.key}
                  activeOpacity={0.8}
                  onPress={() => setSelectedPlanId(plan.key)}
                  style={[
                    styles.planCard,
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
                        style={[styles.planName, selected && styles.planNameSelected]}>
                        {plan.name}
                      </Text>
                      {!!plan.savings && <Text style={styles.planSavings}>{plan.savings}</Text>}
                      {!!plan.subtext && <Text style={styles.planSubtext}>{plan.subtext}</Text>}
                    </View>
                    <View style={styles.priceBlock}>
                      <Text style={styles.planPrice}>{plan.price}</Text>
                      <Text style={styles.planLabel}>{plan.label}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          <AnimatedPressable
            onPress={handleSubscribePress}
            disabled={!config.subscribeButton.enabled}
            style={[
              styles.subscribeButton,
              config.subscribeButton.enabled ? styles.subscribeShadow : styles.subscribeDisabled,
            ]}>
            {config.subscribeButton.enabled ? (
              <LinearGradient
                colors={[theme.sun, theme.sunDeep]}
                start={[0, 0]}
                end={[1, 0]}
                style={styles.subscribeGradient}>
                <Text style={styles.subscribeText}>{config.subscribeButton.label}</Text>
                <Check size={18} color={theme.ink} strokeWidth={3} />
              </LinearGradient>
            ) : (
              <View style={styles.disabledInner}>
                <Text style={styles.disabledText}>{config.subscribeButton.disabledLabel}</Text>
              </View>
            )}
          </AnimatedPressable>

          <View style={styles.footer}>
            <Text style={styles.finePrint}>{config.footer.finePrint}</Text>
            <TouchableOpacity onPress={() => termsRef.current?.present()}>
              <Text style={styles.termsLink}>{config.terms.buttonLabel}</Text>
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
  topBar: { minHeight: 64, paddingHorizontal: 16, paddingBottom: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: theme.canvas, borderBottomWidth: 1, borderBottomColor: theme.line },
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
  planList: { gap: 12, marginTop: 20 },
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
  subscribeButton: { width: '100%', minHeight: 56, borderRadius: 18, marginTop: 20, overflow: 'visible' },
  subscribeShadow: { boxShadow: '0px 6px 0px rgba(242, 169, 0, 0.9)' },
  subscribeGradient: { minHeight: 56, borderRadius: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 16 },
  subscribeText: { color: theme.ink, fontFamily: typography.bodyExtraBold, fontSize: 15 },
  subscribeDisabled: { opacity: 0.78 },
  disabledInner: { minHeight: 56, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.line },
  disabledText: { color: theme.inkSoft, fontFamily: typography.bodyExtraBold, fontSize: 15 },
  footer: { alignItems: 'center', marginTop: 19, marginBottom: 12 },
  finePrint: { color: '#9A97A7', fontFamily: typography.bodySemibold, fontSize: 10, lineHeight: 15, textAlign: 'center' },
  termsLink: { color: theme.berryDeep, fontFamily: typography.bodyExtraBold, fontSize: 11, marginTop: 8, textDecorationLine: 'underline' },
  unavailableContent: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28 },
  unavailableIcon: { width: 56, height: 56, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.skyTint, marginBottom: 14 },
  unavailableTitle: { color: theme.ink, fontFamily: typography.bodyExtraBold, fontSize: 16, lineHeight: 22, textAlign: 'center' },
  unavailableBody: { color: theme.inkSoft, fontFamily: typography.bodySemibold, fontSize: 12, lineHeight: 18, textAlign: 'center', marginTop: 7, marginBottom: 18 },
  retryButton: { borderRadius: 14, backgroundColor: theme.sun, paddingHorizontal: 22, paddingVertical: 12, boxShadow: '0px 4px 0px rgba(242, 169, 0, 0.8)' },
  retryButtonText: { color: theme.ink, fontFamily: typography.bodyExtraBold, fontSize: 13 },
});

export default PremiumScreen;
