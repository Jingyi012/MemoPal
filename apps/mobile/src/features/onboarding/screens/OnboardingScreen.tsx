import AnimatedPressable from '@/components/AnimatedPressable';
import { useUserState } from '@/contexts/UserStateContext';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ChevronRight } from 'lucide-react-native';
import React, { useCallback, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { FadeInRight, FadeOutLeft } from 'react-native-reanimated';
import { onboardingSlides } from '../components/onboardingSlides';
import { useTranslation } from '@/core/i18n/useTranslation';

export const OnboardingScreen: React.FC = () => {
  const router = useRouter();
  const { completeOnboarding } = useUserState();
  const { t } = useTranslation('onboarding');
  const [index, setIndex] = useState(0);
  const slide = onboardingSlides[index];
  const localizedSlide = {
    ...slide,
    title: t(`slide${index + 1}Title` as 'slide1Title'),
    description: t(`slide${index + 1}Description` as 'slide1Description'),
  };

  const finish = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await completeOnboarding();
    router.replace('/login');
  }, [completeOnboarding, router]);

  const next = useCallback(() => {
    Haptics.selectionAsync();
    if (index < onboardingSlides.length - 1) {
      setIndex((i) => i + 1);
    } else {
      finish();
    }
  }, [finish, index]);

  const panGesture = Gesture.Pan()
    .runOnJS(true) // <--- Add this! This makes the code below run on the JS thread.
    .onEnd((e) => {
      if (e.translationX < -50 && index < onboardingSlides.length - 1) {
        // Now you can call these directly without any wrappers
        Haptics.selectionAsync();
        setIndex(index + 1);
      }

      if (e.translationX > 50 && index > 0) {
        Haptics.selectionAsync();
        setIndex(index - 1);
      }
    });

  return (
    <View className="flex-1 bg-[#FFFDF8] py-6">
      {/* Skip */}
      <View className="items-end p-6">
        <AnimatedPressable onPress={finish}>
          <Text className="font-semibold text-[#6B6A80]">{t('skip')}</Text>
        </AnimatedPressable>
      </View>

      {/* Swipeable content */}
      <GestureDetector gesture={panGesture}>
        <View className="flex-1 items-center justify-center px-8">
          <Animated.View
            key={index}
            entering={FadeInRight.duration(300)}
            exiting={FadeOutLeft.duration(300)}
            className="items-center">
            <LinearGradient
              colors={localizedSlide.colors}
              style={{ borderRadius: 64, boxShadow: '0px 4px 14px rgba(43, 42, 61, 0.18)' }}
              className="mb-8 h-32 w-32 items-center justify-center"
              >
              <Text className="text-7xl">{localizedSlide.icon}</Text>
            </LinearGradient>

            <Text className="mb-4 px-4 text-center text-xl font-semibold text-[#2B2A3D]">
              {localizedSlide.title}
            </Text>

            <Text className="text-center leading-relaxed text-[#6B6A80]">{localizedSlide.description}</Text>
          </Animated.View>
        </View>
      </GestureDetector>

      {/* Footer */}
      <View className="flex-col gap-3 p-8">
        {/* Dots */}
        <View className="flex-row justify-center gap-2">
          {onboardingSlides.map((_, i) => (
            <Pressable
              key={i}
              onPress={() => setIndex(i)}
              className={`h-2 rounded-full ${i === index ? 'w-8 bg-[#7A68E0]' : 'w-2 bg-[#D8D4C9]'}`}
            />
          ))}
        </View>

        {/* Next */}
        <AnimatedPressable
          onPress={next}
          className="flex-row items-center justify-center gap-2 rounded-2xl bg-[#FFC93C] py-4">
          <Text className="font-semibold text-[#2B2A3D]">
            {index === onboardingSlides.length - 1 ? t('getStarted') : t('continue')}
          </Text>
          <ChevronRight size={20} color="#2B2A3D" />
        </AnimatedPressable>
      </View>
    </View>
  );
};
