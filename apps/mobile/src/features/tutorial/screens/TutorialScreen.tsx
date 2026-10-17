import { BaseCard } from '@/components/BaseCard';
import { StepNavigationFooter } from '@/components/StepNavigationFooter';
import { GradientColors } from '@/core/types/colors';
import { memopalTheme as theme } from '@/theme/memopalTheme';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronLeft } from '@/core/icons';
import React, { useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useTranslation } from '@/core/i18n/useTranslation';

interface TutorialStep {
  id: number;
  title: string;
  icon: string;
  colors: GradientColors;
  content: string;
  example: string;
}

const tutorialSteps: TutorialStep[] = [
  {
    id: 1,
    title: 'What is a Memory Palace?',
    icon: '🧠',
    colors: [theme.violetDeep, theme.berryDeep],
    content:
      "A Memory Palace is a mental journey through a familiar place. Each location becomes an anchor for memories. This ancient technique, used by memory champions, leverages your brain's natural ability to remember spaces.",
    example: 'Imagine your home: front door -> living room -> kitchen. Each location holds a memory.',
  },
  {
    id: 2,
    title: 'Visualize & Associate',
    icon: '👁️',
    colors: [theme.sky, theme.violetDeep],
    content:
      'The key is creating vivid, unusual mental images. The more bizarre and emotional the image, the better it sticks. Link each word to a specific location in your palace.',
    example: 'To remember "elephant," imagine a giant pink elephant squeezed into your front door.',
  },
  {
    id: 3,
    title: 'Mental Journey',
    icon: '▶️',
    colors: [theme.berry, theme.berryDeep],
    content:
      'Walk through your palace in the same order every time. Visit each location and recall the vivid image you created. This mental journey retrieves all your memories in sequence.',
    example: 'Walk from room to room, collecting each memory as you go.',
  },
  {
    id: 4,
    title: 'Spaced Repetition',
    icon: '🔁',
    colors: [theme.grass, '#247B67'],
    content:
      'Review at specific intervals (1d, 3d, 7d, 14d, 30d) to combat the forgetting curve. Each review strengthens the memory and moves it from short-term to long-term storage.',
    example: 'Complete all 5 reviews to build a stronger long-term memory.',
  },
  {
    id: 5,
    title: 'Practice & Master',
    icon: '🏆',
    colors: [theme.sun, theme.sunDeep],
    content:
      'Start with small palaces (10 locations) and gradually increase. Build muscle memory by using the same palace for different word sets. Consistency beats intensity!',
    example: 'Master the Beginner Palace before creating custom ones.',
  },
];

interface TutorialScreenProps {
  onBack: () => void;
  onFinish: () => void;
}

export function TutorialScreen({ onBack, onFinish }: TutorialScreenProps) {
  const { t } = useTranslation('tutorial');
  const [currentStep, setCurrentStep] = useState(0);
  const step = tutorialSteps[currentStep];
  const localizedStep = {
    ...step,
    title: t(`step${currentStep + 1}Title` as 'step1Title'),
    content: t(`step${currentStep + 1}Content` as 'step1Content'),
    example: t(`step${currentStep + 1}Example` as 'step1Example'),
  };
  const isLastStep = currentStep === tutorialSteps.length - 1;

  const translateX = useSharedValue(0);
  const opacity = useSharedValue(1);

  const animateStepChange = (direction: 'next' | 'prev', onChange: () => void) => {
    const exitOffset = direction === 'next' ? -40 : 40;
    const enterOffset = direction === 'next' ? 40 : -40;

    translateX.value = withTiming(
      exitOffset,
      { duration: 160, easing: Easing.out(Easing.ease) },
      () => {
        runOnJS(onChange)();

        translateX.value = enterOffset;
        opacity.value = 0;

        translateX.value = withTiming(0, {
          duration: 220,
          easing: Easing.out(Easing.ease),
        });
        opacity.value = withTiming(1, { duration: 220 });
      }
    );

    opacity.value = withTiming(0, { duration: 140 });
  };

  const handleNext = () => {
    if (isLastStep) {
      onFinish();
    } else {
      animateStepChange('next', () => setCurrentStep((prev) => prev + 1));
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      animateStepChange('prev', () => setCurrentStep((prev) => prev - 1));
    }
  };

  const animatedContentStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <View className="flex-1">
      <LinearGradient
        colors={step.colors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="rounded-b-[40px] p-4 pb-8"
        style={{ boxShadow: '0px 4px 12px rgba(43, 42, 61, 0.16)' }}>
        <View className="mb-6 mt-2 flex-row items-center">
          <TouchableOpacity
            onPress={onBack}
            className="h-10 w-10 items-center justify-center rounded-full bg-white/20">
            <ChevronLeft size={24} color="white" />
          </TouchableOpacity>
          <Text className="ml-4 text-lg font-bold text-white">{t('title')}</Text>
        </View>

        <View className="mb-6 flex-row items-center justify-center gap-2">
          {tutorialSteps.map((_, index) => (
            <View
              key={index}
              className={`h-2 rounded-full ${
                index === currentStep
                  ? 'w-8 bg-white'
                  : index < currentStep
                    ? 'w-2 bg-white/60'
                    : 'w-2 bg-white/30'
              }`}
            />
          ))}
        </View>

        <View className="mb-4 items-center">
          <View className="h-24 w-24 items-center justify-center rounded-full bg-white" style={{ boxShadow: '0px 4px 14px rgba(43, 42, 61, 0.18)' }}>
            <Text className="text-5xl">{step.icon}</Text>
          </View>
        </View>

        <Text className="text-center text-xl font-bold text-white">
          {t('step')} {currentStep + 1}: {localizedStep.title}
        </Text>
      </LinearGradient>

      <Animated.ScrollView
        className="flex-1 px-6 pt-6"
        showsVerticalScrollIndicator={false}
        style={animatedContentStyle}>
        <View className="space-y-6 pb-10">
          <BaseCard className="border-2 border-[#E5DFFF] bg-white" radius="3xl" padding="lg" shadow="sm">
            <Text className="text-base leading-6 text-[#6B6A80]">{localizedStep.content}</Text>
          </BaseCard>

          <BaseCard
            className="mt-3 flex-row border-2 border-line-violet bg-tint-violet"
            radius="3xl"
            padding="lg"
            shadow="none">
            <View className="mr-4 h-10 w-10 items-center justify-center rounded-full bg-white" style={{ boxShadow: '0px 2px 8px rgba(43, 42, 61, 0.08)' }}>
              <Text className="text-lg">i</Text>
            </View>
            <View className="flex-1">
              <Text className="mb-1 font-bold text-[#7A68E0]">{t('example')}</Text>
              <Text className="text-sm leading-5 text-[#6B6A80]">{localizedStep.example}</Text>
            </View>
          </BaseCard>

          {currentStep === 1 && (
            <BaseCard
              className="mt-3 border-2 border-line-mint bg-tint-mint"
              radius="3xl"
              padding="lg"
              shadow="none">
              <Text className="mb-3 font-bold text-[#247B67]">{t('tips')}</Text>
              {[
                'Make it exaggerated',
                'Add unusual colors',
                'Include movement',
                'Engage emotions',
              ].map((tip, i) => (
                <Text key={i} className="text-sm text-[#3B6F60]">
                  - {tip}
                </Text>
              ))}
            </BaseCard>
          )}

          {currentStep === 3 && (
            <BaseCard
              className="mt-3 border-2 border-line-sun bg-tint-sun"
              radius="3xl"
              padding="lg"
              shadow="none">
              <Text className="mb-2 font-bold text-[#F2A900]">Forgetting Curve</Text>
              <Text className="text-sm text-[#6B6A80]">- After 24h: 70% forgotten</Text>
              <Text className="text-sm text-[#6B6A80]">- After 7 days: 90% forgotten</Text>
            </BaseCard>
          )}
        </View>
      </Animated.ScrollView>

      <StepNavigationFooter
        onPrevious={currentStep > 0 ? handlePrev : undefined}
        onNext={handleNext}
        nextLabel={isLastStep ? 'Get Started' : 'Next'}
      />
    </View>
  );
}
