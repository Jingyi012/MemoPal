import { systemSettingsApi } from '@/core/settings/api/systemSettings';
import AnimatedPressable from '@/components/AnimatedPressable';
import { BaseCard } from '@/components/BaseCard';
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
import { Check, ChevronRight, Crown, Sparkles, X } from 'lucide-react-native';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import TermsAndConditionSheet from '../components/TermsAndConditionSheet';
import { useTranslation } from '@/core/i18n/useTranslation';
import { useColorScheme } from 'nativewind';
import { AiCreditCoinButton } from '@/features/ai-credits/components/AiCreditBalanceLink';
import { useCurrentUser } from '@/features/profile/hooks/useCurrentUser';
import { useUserState } from '@/contexts/UserStateContext';

const PremiumScreen: React.FC = () => {
  const router = useRouter();
  const { t } = useTranslation('subscription');
  const { colorScheme } = useColorScheme();
  const activeTheme = memopalThemes[colorScheme ?? 'light'];
  const { user, isLoading: isUserLoading } = useCurrentUser();
  const { userState } = useUserState();
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

  if (isLoading || isUserLoading) {
    return <LoadingView />;
  }

  if (user?.isPremium) {
    return <PremiumMemberView theme={activeTheme}
      expiresAt={userState.subscription.expiresAt} onClose={() => router.back()} />;
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

function PremiumMemberView({ theme, expiresAt, onClose }: {
  theme: typeof memopalThemes.light; expiresAt?: string | null; onClose: () => void;
}) {
  const { styles } = useMemberStyles();
  const { language } = useTranslation('numberPeg');
  const zh = language === 'zh';
  return <View style={styles.memberPage}>
    <View style={styles.memberTop}><View style={styles.memberEyebrow}><Crown size={15} color={theme.sun} /><Text style={styles.memberEyebrowText}>MEMOPAL PREMIUM</Text></View>
      <View style={styles.memberActions}><AiCreditCoinButton /><AnimatedPressable accessibilityLabel="Close premium page" onPress={onClose} style={styles.memberClose}><X size={19} color={theme.inkSoft} /></AnimatedPressable></View>
    </View>
    <ScrollView contentContainerStyle={styles.memberContent}>
      <View style={styles.memberHero}><View style={styles.memberOrb}><Crown size={32} color={theme.sun} strokeWidth={2.3} /></View>
        <Text style={styles.memberTitle}>{zh ? '你的 Premium 旅程正在进行' : 'Your Premium journey is active'}</Text>
        <Text style={styles.memberSubtitle}>{zh ? '继续建立更深、更有趣的记忆。' : 'Keep building deeper, more playful memories.'}</Text>
        <View style={styles.activeBadge}><Sparkles size={13} color={theme.sun} /><Text style={styles.activeBadgeText}>{zh ? '已激活' : 'ACTIVE'}</Text></View>
      </View>
      <View style={styles.memberSection}><Text style={styles.memberSectionTitle}>{zh ? '本期权益' : 'This period'}</Text>
        <View style={styles.memberRow}><View style={styles.checkCircle}><Check size={14} color={theme.onAccent} strokeWidth={3} /></View><Text style={styles.memberRowText}>{zh ? '所有 Premium 记忆工具已解锁' : 'All Premium memory tools are unlocked'}</Text></View>
        <View style={styles.memberRow}><View style={styles.checkCircle}><Check size={14} color={theme.onAccent} strokeWidth={3} /></View><Text style={styles.memberRowText}>{zh ? 'AI credit 可用于联想故事和图片' : 'AI credits are ready for stories and images'}</Text></View>
      </View>
      <View style={styles.manageCard}><View style={styles.manageCopy}><Text style={styles.manageTitle}>{zh ? '管理订阅' : 'Manage subscription'}</Text><Text style={styles.manageBody}>{expiresAt ? `${zh ? '当前周期至' : 'Current period ends'} ${new Date(expiresAt).toLocaleDateString()}` : (zh ? '订阅状态由账户同步。' : 'Subscription status is synced to your account.')}</Text></View><ChevronRight size={20} color={theme.inkSoft} /></View>
    </ScrollView>
  </View>;
}

const useMemberStyles = createThemedStyles((theme) => StyleSheet.create({
  memberPage: { flex: 1, backgroundColor: theme.canvas }, memberTop: { minHeight: 64, paddingHorizontal: 16, paddingTop: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: theme.line },
  memberActions: { flexDirection: 'row', alignItems: 'center', gap: 8 }, memberEyebrow: { flexDirection: 'row', alignItems: 'center', gap: 7 }, memberEyebrowText: { color: theme.inkSoft, fontFamily: typography.bodyExtraBold, fontSize: 10, letterSpacing: 1 }, memberClose: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.paper },
  memberContent: { padding: 16, gap: 16, paddingBottom: 40 }, memberHero: { borderRadius: 28, padding: 22, backgroundColor: theme.night, overflow: 'hidden' }, memberOrb: { width: 62, height: 62, borderRadius: 22, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(255,201,60,0.16)', borderWidth: 1, borderColor: 'rgba(255,201,60,0.35)' },
  memberTitle: { color: '#FFF', fontFamily: typography.displayExtraBold, fontSize: 27, lineHeight: 34, marginTop: 18 }, memberSubtitle: { color: 'rgba(255,255,255,0.75)', fontFamily: typography.bodySemibold, fontSize: 13, lineHeight: 20, marginTop: 5 }, activeBadge: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 5, marginTop: 18, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6, backgroundColor: 'rgba(255,201,60,0.16)' }, activeBadgeText: { color: theme.sun, fontFamily: typography.bodyExtraBold, fontSize: 10, letterSpacing: 0.8 },
  memberSection: { borderRadius: 22, padding: 17, backgroundColor: theme.paper, borderWidth: 1.5, borderColor: theme.line, gap: 14 }, memberSectionTitle: { color: theme.inkSoft, fontFamily: typography.bodyExtraBold, fontSize: 11, letterSpacing: 1, textTransform: 'uppercase' }, memberRow: { flexDirection: 'row', alignItems: 'center', gap: 10 }, checkCircle: { width: 26, height: 26, borderRadius: 10, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.grass }, memberRowText: { flex: 1, color: theme.ink, fontFamily: typography.bodySemibold, fontSize: 13, lineHeight: 19 }, manageCard: { minHeight: 76, borderRadius: 20, padding: 16, flexDirection: 'row', alignItems: 'center', backgroundColor: theme.violetTint, borderWidth: 1.5, borderColor: theme.violetLine }, manageCopy: { flex: 1 }, manageTitle: { color: theme.ink, fontFamily: typography.bodyExtraBold, fontSize: 14 }, manageBody: { color: theme.inkSoft, fontFamily: typography.bodySemibold, fontSize: 11, marginTop: 4 },
}));
