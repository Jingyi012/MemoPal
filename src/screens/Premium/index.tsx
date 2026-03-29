import AnimatedPressable from '@/components/AnimatedPressable';
import { BaseCard, getBaseCardClassName } from '@/components/BaseCard';
import LoadingView from '@/components/LoadingView';
import { Colors } from '@/constants/colors';
import { cn } from '@/utils/cn';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { CheckCircle2, Crown, X } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import TermsAndConditionSheet from './TermsAndConditionSheet';

const MOCK_API_DATA = {
  plans: [
    {
      id: 'annual',
      name: 'Annual Plan',
      price: '$39.99',
      label: '/year',
      savings: 'Save 33%',
      subtext: 'Just $3.33/month',
      isBestValue: true,
    },
    {
      id: 'monthly',
      name: 'Monthly Plan',
      price: '$4.99',
      label: '/month',
      savings: null,
      subtext: 'Cancel anytime',
      isBestValue: false,
    },
  ],
  features: [
    {
      id: '1',
      title: 'Custom Memory Palaces',
      description: 'Create unlimited custom palaces with your own locations',
    },
    {
      id: '2',
      title: 'Edit Default Palaces',
      description: 'Customize pre-built palaces to match your preferences',
    },
    {
      id: '3',
      title: 'Upload Custom Images',
      description: 'Use your own photos for more personal memory locations',
    },
    {
      id: '4',
      title: 'Advanced Analytics',
      description: 'Detailed insights into your performance',
    },
    { id: '5', title: 'Cloud Sync', description: 'Seamlessly sync across all your devices' },
    {
      id: '6',
      title: 'Ad-Free Experience',
      description: 'Focus on learning without interruptions',
    },
  ],
};

const PremiumScreen: React.FC = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<typeof MOCK_API_DATA | null>(null);
  const [selectedPlanId, setSelectedPlanId] = useState('annual');
  const termsRef = useRef<BottomSheetModal>(null);

  // Simulate API Fetch
  useEffect(() => {
    const timer = setTimeout(() => {
      setData(MOCK_API_DATA);
      setLoading(false);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return <LoadingView />;
  }

  return (
    <View className="flex-1 bg-slate-50">
      <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
        {/* Header */}
        <LinearGradient
          colors={[Colors.orange400, Colors.orange600]}
          className="px-6 pb-16 pt-8 shadow-lg">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-4">
              <View className="rounded-2xl bg-white/20 p-3">
                <Crown color="white" size={32} />
              </View>
              <View>
                <Text className="text-3xl font-bold text-white">Go Premium</Text>
                <Text className="text-white/80">Unlock your full memory potential</Text>
              </View>
            </View>

            <AnimatedPressable
              onPress={() => router.back()}
              className="rounded-full bg-white/20 p-2">
              <X size={20} color={Colors.white} />
            </AnimatedPressable>
          </View>
        </LinearGradient>

        {/* Feature List */}
        <View className="-mt-8 px-6">
          <BaseCard radius="3xl" padding="lg" shadow="sm">
            <Text className="mb-4 text-xs font-bold uppercase tracking-widest text-slate-400">
              What&apos;s Included
            </Text>
            <View className="gap-y-4">
              {data?.features.map((feature) => (
                <View key={feature.id} className="flex-row items-start gap-3">
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

          {/* Pricing Selector */}
          <View className="mt-8 gap-4">
            {data?.plans.map((plan) => (
              <TouchableOpacity
                key={plan.id}
                activeOpacity={0.8}
                onPress={() => setSelectedPlanId(plan.id)}
                className={getBaseCardClassName({
                  padding: 'lg',
                  radius: '3xl',
                  className: cn(
                    'relative border-2',
                    selectedPlanId === plan.id
                      ? 'border-orange-500 bg-orange-50/30'
                      : 'border-slate-200'
                  ),
                })}>
                {plan.isBestValue && (
                  <View className="absolute -top-3 right-6">
                    <LinearGradient
                      colors={[Colors.orange400, Colors.orange600]}
                      start={[0, 0]}
                      end={[1, 0]}
                      style={{
                        borderRadius: 10,
                      }}
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
                        selectedPlanId === plan.id ? 'border-orange-500' : 'border-slate-300'
                      }`}>
                      {selectedPlanId === plan.id && (
                        <View className="h-3 w-3 rounded-full bg-orange-500" />
                      )}
                    </View>
                    <View>
                      <Text
                        className={`text-lg font-bold ${selectedPlanId === plan.id ? 'text-orange-900' : 'text-slate-800'}`}>
                        {plan.name}
                      </Text>
                      {plan.savings && (
                        <Text className="text-xs font-bold text-green-600">{plan.savings}</Text>
                      )}
                    </View>
                  </View>
                  <View className="items-end">
                    <Text className="text-2xl font-black text-slate-900">{plan.price}</Text>
                    <Text className=" text-xs text-slate-500">{plan.label} </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {/* Main CTA */}
          <AnimatedPressable className="mt-8 shadow-xl shadow-orange-200">
            <LinearGradient
              colors={[Colors.orange400, Colors.orange600]}
              start={[0, 0]}
              end={[1, 0]}
              style={{
                borderRadius: 10,
              }}
              className="py-5">
              <Text className="text-center text-lg font-bold text-white">
                Start 7-Day Free Trial
              </Text>
            </LinearGradient>
          </AnimatedPressable>

          {/* Footer Fine Print */}
          <View className="mb-10 mt-6 items-center">
            <Text className="text-center text-xs text-slate-400">
              Recurring billing. Cancel anytime in App Store.
            </Text>
            <View className="mt-2 flex-row gap-4">
              <TouchableOpacity onPress={() => termsRef.current?.present()}>
                <Text className="text-xs font-medium text-orange-600 underline">
                  Terms & Conditions
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
      <TermsAndConditionSheet ref={termsRef} />
    </View>
  );
};

export default PremiumScreen;
