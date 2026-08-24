import { systemSettingsApi } from '@/core/settings/api/systemSettings';
import AnimatedPressable from '@/components/AnimatedPressable';
import { BaseCard, getBaseCardClassName } from '@/components/BaseCard';
import LoadingView from '@/components/LoadingView';
import { numberPegTheme as theme } from '@/features/number-peg/constants/numberPegTheme';
import { normalizePremiumSubscriptionConfig } from '@/features/subscription/hooks/usePremiumSubscriptionConfig';
import { PremiumSubscriptionConfig } from '@/features/subscription/types/premiumSubscriptionConfig';
import { cn } from '@/utils/cn';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { CheckCircle2, Crown, X } from 'lucide-react-native';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import TermsAndConditionSheet from '../components/TermsAndConditionSheet';

const PremiumScreen: React.FC = () => {
  const router = useRouter();
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
        throw new Error('Premium subscription config is unavailable.');
      }

      const parsed = JSON.parse(setting.value) as Partial<PremiumSubscriptionConfig>;
      setConfig(normalizePremiumSubscriptionConfig(parsed));
      setLoadError(null);
    } catch (error: any) {
      const message =
        error?.message?.trim() ||
        'Could not load premium data. Check your connection and try again.';
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

  if (!config) {
    return (
      <View className="flex-1 bg-[#FFFDF8]">
        <LinearGradient
          colors={[theme.berry, theme.berryDeep]}
          className="px-6 pb-10 pt-8 shadow-lg">
          <View className="flex-row items-center justify-between">
            <Text className="text-2xl font-bold text-white">Premium</Text>
            <AnimatedPressable
              onPress={() => router.back()}
              className="rounded-full bg-white/20 p-2">
              <X size={20} color="white" />
            </AnimatedPressable>
          </View>
        </LinearGradient>

        <View className="flex-1 items-center justify-center px-6">
          <Text className="mb-2 text-center text-base font-semibold text-[#2B2A3D]">
            Premium data is unavailable right now.
          </Text>
          <Text className="mb-5 text-center text-sm text-[#6B6A80]">
            {loadError ?? 'Please try again in a moment.'}
          </Text>
          <TouchableOpacity
            className="rounded-xl bg-[#FFC93C] px-5 py-3"
            onPress={() => void loadPremiumConfig()}>
            <Text className="font-semibold text-[#2B2A3D]">Try Again</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const handleSubscribePress = () => {
    if (!config.subscribeButton.enabled) return;

    Alert.alert('Subscription Unavailable', config.subscribeButton.pendingMessage);
  };

  return (
    <View className="flex-1 bg-[#FFFDF8]">
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />}>
        {loadError ? (
          <View className="mx-6 mt-3 rounded-2xl border-2 border-[#FFD9E2] bg-[#FFF0F4] px-4 py-3">
            <Text className="text-sm font-semibold text-[#E8527A]">
              Unable to refresh premium data
            </Text>
            <Text className="mt-1 text-sm text-[#E8527A]">{loadError}</Text>
          </View>
        ) : null}

        <LinearGradient
          colors={[theme.berry, theme.berryDeep]}
          className="px-6 pb-16 pt-8 shadow-lg">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-4">
              <View className="rounded-2xl bg-white/20 p-3">
                <Crown color="white" size={32} />
              </View>
              <View>
                <Text className="text-3xl font-bold text-white">{config.hero.title}</Text>
                <Text className="text-white/80">{config.hero.subtitle}</Text>
              </View>
            </View>

            <AnimatedPressable
              onPress={() => router.back()}
              className="rounded-full bg-white/20 p-2">
              <X size={20} color="white" />
            </AnimatedPressable>
          </View>
        </LinearGradient>

        <View className="-mt-8 px-6">
          <BaseCard radius="3xl" padding="lg" shadow="sm">
            <Text className="mb-4 text-xs font-bold uppercase tracking-widest text-[#6B6A80]">
              {config.sections.includedTitle}
            </Text>
            <View className="gap-y-4">
              {features.map((feature) => (
                <View key={feature.key} className="flex-row items-start gap-3">
                  <View className="mt-1">
                    <CheckCircle2 color={theme.grass} size={20} />
                  </View>
                  <View className="flex-1">
                    <Text className="font-semibold text-[#2B2A3D]">{feature.title}</Text>
                    <Text className="text-sm leading-4 text-[#6B6A80]">{feature.description}</Text>
                  </View>
                </View>
              ))}
            </View>
          </BaseCard>

          <View className="mt-8 gap-4">
            {plans.map((plan) => {
              const selected = plan.key === selectedPlan?.key;
              return (
                <TouchableOpacity
                  key={plan.key}
                  activeOpacity={0.8}
                  onPress={() => setSelectedPlanId(plan.key)}
                  className={getBaseCardClassName({
                    padding: 'lg',
                    radius: '3xl',
                    className: cn(
                      'relative border-2',
                      selected ? 'border-[#FF6F91]' : 'border-[#EEE9DC]'
                    ),
                  })}>
                  {plan.isBestValue && (
                    <View className="absolute -top-3 right-6">
                      <LinearGradient
                        colors={[theme.sun, theme.sunDeep]}
                        start={[0, 0]}
                        end={[1, 0]}
                        style={{ borderRadius: 10 }}
                        className="px-4 py-1">
                        <Text className="text-[10px] font-black uppercase text-white">
                          Best Value
                        </Text>
                      </LinearGradient>
                    </View>
                  )}

                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center gap-3">
                      <View
                        className={`h-6 w-6 items-center justify-center rounded-full border-2 ${
                          selected ? 'border-[#FF6F91]' : 'border-[#D8D4C9]'
                        }`}>
                        {selected && <View className="h-3 w-3 rounded-full bg-[#FF6F91]" />}
                      </View>
                      <View>
                        <Text
                          className={`text-lg font-bold ${selected ? 'text-[#E8527A]' : 'text-[#2B2A3D]'}`}>
                          {plan.name}
                        </Text>
                        {!!plan.savings && (
                          <Text className="text-xs font-bold text-[#3FB87F]">{plan.savings}</Text>
                        )}
                        {!!plan.subtext && (
                          <Text className="text-xs text-[#6B6A80]">{plan.subtext}</Text>
                        )}
                      </View>
                    </View>
                    <View className="items-end">
                      <Text className="text-2xl font-black text-[#2B2A3D]">{plan.price}</Text>
                      <Text className="px-2 text-xs text-[#6B6A80]">{plan.label}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          <AnimatedPressable
            onPress={handleSubscribePress}
            disabled={!config.subscribeButton.enabled}
            style={config.subscribeButton.enabled ? styles.subscribeShadow : undefined}
            className={cn(
              'mt-8 rounded-xl',
              !config.subscribeButton.enabled && 'opacity-80'
            )}>
            {config.subscribeButton.enabled ? (
              <LinearGradient
                colors={[theme.sun, theme.sunDeep]}
                start={[0, 0]}
                end={[1, 0]}
                style={{ borderRadius: 10 }}
                className="py-5">
                <Text className="text-center text-lg font-bold text-[#2B2A3D]">
                  {config.subscribeButton.label}
                </Text>
              </LinearGradient>
            ) : (
              <View className="rounded-xl bg-[#D8D4C9] py-5">
                <Text className="text-center text-lg font-bold text-[#6B6A80]">
                  {config.subscribeButton.disabledLabel}
                </Text>
              </View>
            )}
          </AnimatedPressable>

          <View className="mb-10 mt-6 items-center">
            <Text className="text-center text-xs text-[#9A97A7]">{config.footer.finePrint}</Text>
            <View className="mt-2 flex-row gap-4">
              <TouchableOpacity onPress={() => termsRef.current?.present()}>
                <Text className="text-xs font-medium text-[#E8527A] underline">
                  {config.terms.buttonLabel}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>

      <TermsAndConditionSheet ref={termsRef} terms={config.terms} />
    </View>
  );
};

const styles = StyleSheet.create({
  subscribeShadow: {
    shadowColor: '#FFE6A3',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.9,
    shadowRadius: 12,
    elevation: 4,
  },
});

export default PremiumScreen;
