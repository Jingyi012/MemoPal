import AnimatedPressable from '@/components/AnimatedPressable';
import { CommonHeader } from '@/components/CommonHeader';
import { useTranslation } from '@/core/i18n/useTranslation';
import {
  DEFAULT_PREMIUM_SUBSCRIPTION_CONFIG,
  usePremiumSubscriptionConfig,
} from '@/features/subscription/hooks/usePremiumSubscriptionConfig';
import { createThemedStyles } from '@/theme/createThemedStyles';
import { typography } from '@/theme/typography';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ArrowRight, Check, Coins, LockKeyhole, RefreshCw, Sparkles } from '@/core/icons';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useAiCredits } from '../hooks/useAiCredits';

export default function AiCreditPurchaseScreen() {
  const router = useRouter();
  const { language } = useTranslation('subscription');
  const zh = language === 'zh';
  const balance = useAiCredits();
  const premium = usePremiumSubscriptionConfig();
  const { styles, theme } = useStyles();
  const purchaseConfig = balance.data?.purchaseConfig;
  const purchasesEnabled = balance.data?.purchasesEnabled === true;
  const [customAmount, setCustomAmount] = useState('');
  const [selectedPackKey, setSelectedPackKey] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (!purchaseConfig) return;
    setCustomAmount((current) => current || String(purchaseConfig.customMinCredits));
    if (!purchaseConfig.customPurchaseEnabled && purchaseConfig.packs.length > 0) {
      setSelectedPackKey((current) => current ?? purchaseConfig.packs[0].key);
    }
  }, [purchaseConfig]);

  const customCredits = Number.parseInt(customAmount, 10);
  const customIsValid =
    purchaseConfig?.customPurchaseEnabled === true &&
    Number.isInteger(customCredits) &&
    customCredits >= purchaseConfig!.customMinCredits &&
    customCredits <= purchaseConfig!.customMaxCredits &&
    (customCredits - purchaseConfig!.customMinCredits) % purchaseConfig!.customStep === 0;
  const selectedPack = purchaseConfig?.packs.find((pack) => pack.key === selectedPackKey) ?? null;
  const selectedCredits = selectedPack?.credits ?? (customIsValid ? customCredits : 0);
  const selectedPrice =
    selectedPack?.price ??
    (customIsValid ? customCredits * (purchaseConfig?.pricePerCredit ?? 0) : 0);
  const premiumCredits =
    premium.config?.monthlyAiCredits ?? DEFAULT_PREMIUM_SUBSCRIPTION_CONFIG.monthlyAiCredits;
  const priceText = useMemo(
    () => formatPrice(selectedPrice, purchaseConfig?.currencyCode, purchaseConfig?.currencySymbol),
    [purchaseConfig?.currencyCode, purchaseConfig?.currencySymbol, selectedPrice]
  );

  const selectCustom = (value: string) => {
    setSelectedPackKey(null);
    setCustomAmount(value.replace(/[^0-9]/g, ''));
  };

  const selectPack = (key: string, credits: number) => {
    setSelectedPackKey(key);
    setCustomAmount(String(credits));
  };

  const handleCheckout = () => {
    if (!customIsValid && !selectedPack) {
      Alert.alert(
        zh ? '请输入有效数量' : 'Enter a valid amount',
        purchaseConfig
          ? `${purchaseConfig.customMinCredits.toLocaleString()}–${purchaseConfig.customMaxCredits.toLocaleString()} credits`
          : undefined
      );
      return;
    }
    Alert.alert(
      zh ? '结账尚未接入' : 'Checkout is not connected yet',
      zh
        ? `已选择 ${selectedCredits.toLocaleString()} credits（${priceText}）。需要接入应用商店商品与服务端收据验证后才能完成购买。`
        : `You selected ${selectedCredits.toLocaleString()} credits (${priceText}). Store products and server-side receipt verification are required before purchase can complete.`
    );
  };

  const refresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([balance.refetch(), premium.refetch()]);
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <View style={styles.page}>
      <CommonHeader title={zh ? '购买 AI credits' : 'Buy AI credits'} showAiCredits={false} />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={() => void refresh()} />}>
        <LinearGradient
          colors={[theme.night, theme.nightDeep]}
          start={[0, 0]}
          end={[1, 1]}
          style={styles.hero}>
          <View pointerEvents="none" style={styles.glow} />
          <View style={styles.heroTop}>
            <View style={styles.coin}>
              <Coins size={25} color={theme.sun} strokeWidth={2.5} />
            </View>
            <View style={styles.balancePill}>
              {balance.isPending ? (
                <ActivityIndicator size="small" color={theme.sun} />
              ) : (
                <Text style={styles.balancePillText}>
                  {balance.data?.available ?? 0} {zh ? '可用' : 'available'}
                </Text>
              )}
            </View>
          </View>
          <Text style={styles.heroTitle}>
            {zh ? '选择你需要的额度' : 'Choose the credits you need'}
          </Text>
          <Text style={styles.heroBody}>
            {zh
              ? '输入自定义数量，或从下方选择一个快捷充值套餐。'
              : 'Enter a custom amount or pick one of the quick top-up packs below.'}
          </Text>
        </LinearGradient>

        {purchaseConfig?.customPurchaseEnabled ? (
          <View style={styles.purchaseSection}>
            <Text style={styles.sectionTitle}>
              {zh ? '输入 credit 数量' : 'Enter a credit amount'}
            </Text>
            <View style={styles.customCard}>
              <View style={styles.inputRow}>
                <TextInput
                  accessibilityLabel={zh ? '自定义 credit 数量' : 'Custom credit amount'}
                  keyboardType="number-pad"
                  maxLength={7}
                  onChangeText={selectCustom}
                  onFocus={() => setSelectedPackKey(null)}
                  placeholder={String(purchaseConfig.customMinCredits)}
                  placeholderTextColor={theme.inkMuted}
                  selectionColor={theme.violetDeep}
                  style={styles.amountInput}
                  value={customAmount}
                />
                <Text style={styles.creditUnit}>credits</Text>
              </View>
              <View style={styles.customMeta}>
                <Text style={[styles.rangeText, !customIsValid && styles.invalidText]}>
                  {zh
                    ? `范围 ${purchaseConfig.customMinCredits}–${purchaseConfig.customMaxCredits}，每次增加 ${purchaseConfig.customStep}`
                    : `${purchaseConfig.customMinCredits}–${purchaseConfig.customMaxCredits}, in steps of ${purchaseConfig.customStep}`}
                </Text>
              </View>
            </View>
          </View>
        ) : null}

        {purchaseConfig?.packs.length ? (
          <View style={styles.purchaseSection}>
            <Text style={styles.sectionTitle}>{zh ? '快捷充值' : 'Quick top-ups'}</Text>
            <View style={styles.packGrid}>
              {purchaseConfig.packs.map((pack) => {
                const selected = pack.key === selectedPackKey;
                return (
                  <AnimatedPressable
                    key={pack.key}
                    onPress={() => selectPack(pack.key, pack.credits)}
                    accessibilityState={{ selected }}
                    containerStyle={styles.packContainer}
                    style={[styles.packCard, selected && styles.packCardSelected]}>
                    {pack.badge ? (
                      <View style={styles.packBadge}>
                        <Text style={styles.packBadgeText}>{pack.badge}</Text>
                      </View>
                    ) : null}
                    <View style={styles.packTop}>
                      <Text style={[styles.packLabel, selected && styles.selectedText]}>
                        {pack.label}
                      </Text>
                      {selected ? (
                        <View style={styles.check}>
                          <Check size={12} color={theme.onAccent} strokeWidth={3} />
                        </View>
                      ) : null}
                    </View>
                    <Text style={styles.packCredits}>{pack.credits.toLocaleString()}</Text>
                    <Text style={styles.packUnit}>AI credits</Text>
                    <Text style={styles.packPrice}>
                      {formatPrice(
                        pack.price,
                        purchaseConfig.currencyCode,
                        purchaseConfig.currencySymbol
                      )}
                    </Text>
                  </AnimatedPressable>
                );
              })}
            </View>
          </View>
        ) : null}

        {!purchasesEnabled ? (
          <View style={styles.statusCard}>
            <View style={styles.statusIcon}>
              <LockKeyhole size={20} color={theme.violetDeep} />
            </View>
            <View style={styles.statusCopy}>
              <Text style={styles.statusTitle}>
                {zh ? '充值尚未开放' : 'Top-ups are not live yet'}
              </Text>
              <Text style={styles.statusBody}>
                {zh
                  ? '管理员可以预先配置套餐与价格；正式接入商店支付和收据验证后再开放购买。'
                  : 'Admins can prepare packs and prices now. Enable purchases only after store checkout and receipt verification are connected.'}
              </Text>
            </View>
          </View>
        ) : null}

        <AnimatedPressable
          onPress={handleCheckout}
          style={[styles.checkoutButton, !purchasesEnabled && styles.checkoutButtonDisabled]}>
          <View>
            <Text style={styles.checkoutTitle}>
              {purchasesEnabled
                ? zh
                  ? `购买 ${selectedCredits.toLocaleString()} credits`
                  : `Buy ${selectedCredits.toLocaleString()} credits`
                : zh
                  ? '购买即将开放'
                  : 'Purchases coming soon'}
            </Text>
            <Text style={styles.checkoutPrice}>{selectedCredits > 0 ? priceText : '—'}</Text>
          </View>
          <ArrowRight size={19} color={theme.ink} strokeWidth={2.5} />
        </AnimatedPressable>

        <View style={styles.premiumCard}>
          <View style={styles.premiumTop}>
            <View style={styles.sparkleBadge}>
              <Sparkles size={17} color={theme.sunDeep} />
            </View>
            <Text style={styles.premiumEyebrow}>MEMOPAL PREMIUM</Text>
          </View>
          <Text style={styles.premiumTitle}>
            {premiumCredits.toLocaleString()} AI credits / {zh ? '月' : 'month'}
          </Text>
          <Text style={styles.premiumBody}>
            {zh
              ? 'Premium 与单次充值互不冲突。月付或年付会员都会每月获得固定额度，你仍可以按需额外充值。'
              : 'Premium and top-ups work together. Monthly and yearly members receive a monthly allowance and can still buy more whenever needed.'}
          </Text>
          <AnimatedPressable onPress={() => router.push('/premium')} style={styles.premiumButton}>
            <Text style={styles.premiumButtonText}>
              {zh ? '比较月付与年付' : 'Compare monthly and yearly'}
            </Text>
            <ArrowRight size={17} color={theme.ink} strokeWidth={2.5} />
          </AnimatedPressable>
        </View>

        {balance.isError ? (
          <AnimatedPressable onPress={() => void balance.refetch()} style={styles.retryButton}>
            <RefreshCw size={16} color={theme.berryDeep} />
            <Text style={styles.retryText}>
              {zh ? '购买配置加载失败，点击重试' : 'Purchase options failed to load. Tap to retry.'}
            </Text>
          </AnimatedPressable>
        ) : null}
        <Text style={styles.footnote}>
          {zh
            ? '最终价格与税费以应用商店结账页为准。完成验证后 credits 才会到账。'
            : 'Final price and taxes are confirmed by the app store. Credits are added only after verification.'}
        </Text>
      </ScrollView>
    </View>
  );
}

function formatPrice(value: number, currencyCode = 'USD', symbol = '$') {
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency: currencyCode }).format(
      value
    );
  } catch {
    return `${symbol}${value.toFixed(2)}`;
  }
}

const useStyles = createThemedStyles((theme) =>
  StyleSheet.create({
    page: { flex: 1, backgroundColor: theme.canvas },
    content: { padding: 16, paddingBottom: 40, gap: 18 },
    hero: { minHeight: 218, borderRadius: 28, padding: 20, overflow: 'hidden' },
    glow: {
      position: 'absolute',
      width: 220,
      height: 220,
      borderRadius: 110,
      right: -62,
      top: -92,
      backgroundColor: 'rgba(255,201,60,0.15)',
    },
    heroTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    coin: {
      width: 52,
      height: 52,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(255,201,60,0.14)',
      borderWidth: 1,
      borderColor: 'rgba(255,201,60,0.28)',
    },
    balancePill: {
      minHeight: 34,
      minWidth: 74,
      paddingHorizontal: 12,
      borderRadius: 999,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(255,255,255,0.1)',
    },
    balancePillText: { color: '#FFF', fontFamily: typography.bodyExtraBold, fontSize: 11 },
    heroTitle: {
      color: '#FFF',
      fontFamily: typography.displayExtraBold,
      fontSize: 29,
      lineHeight: 35,
      marginTop: 24,
      maxWidth: '86%',
    },
    heroBody: {
      color: 'rgba(255,255,255,0.74)',
      fontFamily: typography.bodySemibold,
      fontSize: 12,
      lineHeight: 19,
      marginTop: 7,
    },
    purchaseSection: { gap: 10 },
    sectionTitle: { color: theme.ink, fontFamily: typography.displayExtraBold, fontSize: 19 },
    customCard: { width: '100%' },
    inputRow: {
      minHeight: 52,
      flexDirection: 'row',
      alignItems: 'center',
      borderRadius: 15,
      paddingHorizontal: 14,
      backgroundColor: theme.canvas,
      borderWidth: 1.5,
      borderColor: theme.line,
    },
    amountInput: {
      flex: 1,
      color: theme.ink,
      fontFamily: typography.displayExtraBold,
      fontSize: 24,
      paddingVertical: 8,
    },
    creditUnit: { color: theme.inkSoft, fontFamily: typography.bodyExtraBold, fontSize: 11 },
    customMeta: {
      marginTop: 10,
    },
    rangeText: {
      color: theme.inkSoft,
      fontFamily: typography.bodySemibold,
      fontSize: 9,
      lineHeight: 14,
    },
    invalidText: { color: theme.berryDeep },
    packGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      rowGap: 8,
    },
    packContainer: { width: '30%' },
    packCard: {
      width: '100%',
      minHeight: 124,
      borderRadius: 18,
      borderWidth: 2,
      borderColor: theme.line,
      paddingHorizontal: 12,
      paddingVertical: 11,
      backgroundColor: theme.paper,
      overflow: 'hidden',
    },
    packCardSelected: { borderColor: theme.violet, backgroundColor: theme.violetTint },
    packBadge: {
      position: 'absolute',
      right: 0,
      top: 0,
      borderBottomLeftRadius: 9,
      paddingHorizontal: 7,
      paddingVertical: 4,
      backgroundColor: theme.sun,
    },
    packBadgeText: {
      color: theme.ink,
      fontFamily: typography.bodyExtraBold,
      fontSize: 6,
      letterSpacing: 0.3,
    },
    packTop: {
      minHeight: 22,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 4,
    },
    packLabel: {
      flex: 1,
      color: theme.inkSoft,
      fontFamily: typography.bodyExtraBold,
      fontSize: 9,
      textTransform: 'uppercase',
      letterSpacing: 0.3,
    },
    selectedText: { color: theme.violetDeep },
    check: {
      width: 19,
      height: 19,
      borderRadius: 7,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.violetDeep,
    },
    packCredits: {
      color: theme.ink,
      fontFamily: typography.displayExtraBold,
      fontSize: 23,
      lineHeight: 27,
      marginTop: 6,
    },
    packUnit: { color: theme.inkSoft, fontFamily: typography.bodySemibold, fontSize: 9 },
    packPrice: {
      color: theme.violetDeep,
      fontFamily: typography.bodyExtraBold,
      fontSize: 13,
      marginTop: 6,
    },
    statusCard: {
      borderRadius: 18,
      borderWidth: 1.5,
      borderColor: theme.violetLine,
      padding: 13,
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 10,
      backgroundColor: theme.violetTint,
    },
    statusIcon: {
      width: 38,
      height: 38,
      borderRadius: 13,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.paper,
    },
    statusCopy: { flex: 1 },
    statusTitle: { color: theme.ink, fontFamily: typography.bodyExtraBold, fontSize: 12 },
    statusBody: {
      color: theme.inkSoft,
      fontFamily: typography.bodySemibold,
      fontSize: 10,
      lineHeight: 15,
      marginTop: 3,
    },
    checkoutButton: {
      minHeight: 62,
      borderRadius: 18,
      paddingHorizontal: 17,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: theme.sun,
      boxShadow: '0px 5px 0px rgba(242,169,0,0.85)',
    },
    checkoutButtonDisabled: { opacity: 0.72, boxShadow: '0px 3px 0px rgba(154,151,167,0.35)' },
    checkoutTitle: { color: theme.ink, fontFamily: typography.bodyExtraBold, fontSize: 13 },
    checkoutPrice: {
      color: theme.inkSoft,
      fontFamily: typography.bodySemibold,
      fontSize: 10,
      marginTop: 2,
    },
    premiumCard: {
      borderRadius: 24,
      padding: 18,
      backgroundColor: theme.sunTint,
      borderWidth: 1.5,
      borderColor: theme.sunLine,
    },
    premiumTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    sparkleBadge: {
      width: 32,
      height: 32,
      borderRadius: 11,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.paper,
    },
    premiumEyebrow: {
      color: theme.inkSoft,
      fontFamily: typography.bodyExtraBold,
      fontSize: 9,
      letterSpacing: 0.8,
    },
    premiumTitle: {
      color: theme.ink,
      fontFamily: typography.displayExtraBold,
      fontSize: 20,
      marginTop: 12,
    },
    premiumBody: {
      color: theme.inkSoft,
      fontFamily: typography.bodySemibold,
      fontSize: 11,
      lineHeight: 18,
      marginTop: 5,
    },
    premiumButton: {
      minHeight: 48,
      borderRadius: 15,
      marginTop: 16,
      paddingHorizontal: 15,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: theme.sun,
    },
    premiumButtonText: { color: theme.ink, fontFamily: typography.bodyExtraBold, fontSize: 12 },
    retryButton: {
      minHeight: 48,
      borderRadius: 15,
      paddingHorizontal: 14,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 9,
      backgroundColor: theme.berryTint,
      borderWidth: 1,
      borderColor: theme.berryLine,
    },
    retryText: {
      flex: 1,
      color: theme.berryDeep,
      fontFamily: typography.bodyExtraBold,
      fontSize: 11,
    },
    footnote: {
      color: theme.inkMuted,
      fontFamily: typography.bodySemibold,
      fontSize: 10,
      lineHeight: 15,
      textAlign: 'center',
      paddingHorizontal: 14,
    },
  })
);
