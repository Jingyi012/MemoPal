import { systemSettingsApi } from '@/api/systemSettings';
import AnimatedPressable from '@/components/AnimatedPressable';
import { BaseCard, getBaseCardClassName } from '@/components/BaseCard';
import LoadingView from '@/components/LoadingView';
import { Colors } from '@/constants/colors';
import { normalizePremiumSubscriptionConfig } from '@/hooks/usePremiumSubscriptionConfig';
import { PremiumSubscriptionConfig } from '@/types/premiumSubscriptionConfig';
import { cn } from '@/utils/cn';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { CheckCircle2, Crown, X } from 'lucide-react-native';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import TermsAndConditionSheet from './TermsAndConditionSheet';

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
      <View className="flex-1 bg-slate-50">
        <LinearGradient
          colors={[Colors.orange400, Colors.orange600]}
          className="px-6 pb-10 pt-8 shadow-lg">
          <View className="flex-row items-center justify-between">
            <Text className="text-2xl font-bold text-white">Premium</Text>
            <AnimatedPressable
              onPress={() => router.back()}
              className="rounded-full bg-white/20 p-2">
              <X size={20} color={Colors.white} />
            </AnimatedPressable>
          </View>
        </LinearGradient>

        <View className="flex-1 items-center justify-center px-6">
          <Text className="mb-2 text-center text-base font-semibold text-slate-700">
            Premium data is unavailable right now.
          </Text>
          <Text className="mb-5 text-center text-sm text-slate-500">
            {loadError ?? 'Please try again in a moment.'}
          </Text>
          <TouchableOpacity
            className="rounded-xl bg-orange-500 px-5 py-3"
            onPress={() => void loadPremiumConfig()}>
            <Text className="font-semibold text-white">Try Again</Text>
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
    <View className="flex-1 bg-slate-50">
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />}>
        {loadError ? (
          <View className="mx-6 mt-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3">
            <Text className="text-sm font-semibold text-rose-700">
              Unable to refresh premium data
            </Text>
            <Text className="mt-1 text-sm text-rose-600">{loadError}</Text>
          </View>
        ) : null}

        <LinearGradient
          colors={[Colors.orange400, Colors.orange600]}
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
              <X size={20} color={Colors.white} />
            </AnimatedPressable>
          </View>
        </LinearGradient>

        <View className="-mt-8 px-6">
          <BaseCard radius="3xl" padding="lg" shadow="sm">
            <Text className="mb-4 text-xs font-bold uppercase tracking-widest text-slate-400">
              {config.sections.includedTitle}
            </Text>
            <View className="gap-y-4">
              {features.map((feature) => (
                <View key={feature.key} className="flex-row items-start gap-3">
                  <View className="mt-1">
                    <CheckCircle2 color={Colors.green500} size={20} />
                  </View>
                  <View className="flex-1">
                    <Text className="font-semibold text-slate-800">{feature.title}</Text>
                    <Text className="text-sm leading-4 text-slate-500">{feature.description}</Text>
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
                      selected ? 'border-orange-500' : 'border-slate-200'
                    ),
                  })}>
                  {plan.isBestValue && (
                    <View className="absolute -top-3 right-6">
                      <LinearGradient
                        colors={[Colors.orange400, Colors.orange600]}
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
                          selected ? 'border-orange-500' : 'border-slate-300'
                        }`}>
                        {selected && <View className="h-3 w-3 rounded-full bg-orange-500" />}
                      </View>
                      <View>
                        <Text
                          className={`text-lg font-bold ${selected ? 'text-orange-900' : 'text-slate-800'}`}>
                          {plan.name}
                        </Text>
                        {!!plan.savings && (
                          <Text className="text-xs font-bold text-green-600">{plan.savings}</Text>
                        )}
                        {!!plan.subtext && (
                          <Text className="text-xs text-slate-500">{plan.subtext}</Text>
                        )}
                      </View>
                    </View>
                    <View className="items-end">
                      <Text className="text-2xl font-black text-slate-900">{plan.price}</Text>
                      <Text className="px-2 text-xs text-slate-500">{plan.label}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          <AnimatedPressable
            onPress={handleSubscribePress}
            disabled={!config.subscribeButton.enabled}
            className={cn(
              'mt-8 rounded-xl',
              config.subscribeButton.enabled ? 'shadow-xl shadow-orange-200' : 'opacity-80'
            )}>
            {config.subscribeButton.enabled ? (
              <LinearGradient
                colors={[Colors.orange400, Colors.orange600]}
                start={[0, 0]}
                end={[1, 0]}
                style={{ borderRadius: 10 }}
                className="py-5">
                <Text className="text-center text-lg font-bold text-white">
                  {config.subscribeButton.label}
                </Text>
              </LinearGradient>
            ) : (
              <View className="rounded-xl bg-slate-300 py-5">
                <Text className="text-center text-lg font-bold text-slate-700">
                  {config.subscribeButton.disabledLabel}
                </Text>
              </View>
            )}
          </AnimatedPressable>

          <View className="mb-10 mt-6 items-center">
            <Text className="text-center text-xs text-slate-400">{config.footer.finePrint}</Text>
            <View className="mt-2 flex-row gap-4">
              <TouchableOpacity onPress={() => termsRef.current?.present()}>
                <Text className="text-xs font-medium text-orange-600 underline">
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

export default PremiumScreen;
