import AnimatedPressable from '@/components/AnimatedPressable';
import { Colors } from '@/constants/colors';
import lessons from '@/utils/mock/lessons.json';
import data from '@/utils/mock/palaces.json';
import { useRouter } from 'expo-router';
import { ChevronRight, Sparkles } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Dimensions, Image, ScrollView, Text, View } from 'react-native';
import Animated, { FadeInRight } from 'react-native-reanimated';
import { LearningCompletion } from './LearningCompletion';

const { width } = Dimensions.get('window');

interface LearningFlowProps {
  lessonId: string;
}

export function LearnLessonScreen({ lessonId }: LearningFlowProps) {
  const router = useRouter();
  const lesson = lessons.lessons.find((l) => l.id === lessonId);
  const locations = data.locations;

  if (!lesson) {
    return (
      <View className="flex-1 items-center justify-center">
        <Text className="text-slate-600">Lesson not found</Text>
      </View>
    );
  }

  const [currentStep, setCurrentStep] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);

  const steps = useMemo(() => lesson.words, [lesson.words]);

  const progress = ((currentStep + 1) / steps.length) * 100;
  const step = steps[currentStep];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      setIsCompleted(true);
    }
  };

  /* ================= COMPLETION ================= */

  if (isCompleted) {
    const earnedXP = steps.length * 10;

    return (
      <LearningCompletion
        stepsCount={steps.length}
        lessonId={lessonId}
        palaceId={lesson.palaceId}
      />
    );
  }

  /* ================= LEARNING ================= */

  return (
    <View className="flex-1 bg-white">
      {/* Progress bar */}
      <View className="h-2 bg-gray-100">
        <View className="h-full bg-teal-600" style={{ width: `${progress}%` }} />
      </View>

      <ScrollView className="flex-1 px-4">
        <Animated.View key={step.id} entering={FadeInRight}>
          {/* Header */}
          <View className="my-6 items-center">
            <Text className="mb-1 text-slate-600">
              Word {currentStep + 1} of {steps.length}
            </Text>
            <Text className="text-2xl font-bold text-slate-800">
              {locations.find((x) => x.id === step.locationId)?.name ?? 'Memory Palace'}
            </Text>
          </View>

          {/* Image */}
          <Image
            source={{
              uri:
                locations.find((x) => x.id === step.locationId)?.image ??
                'https://picsum.photos/800/600',
            }}
            className="mb-6 h-56 w-full rounded-2xl"
            resizeMode="cover"
          />

          {/* Word card */}
          <View className="mb-6 items-center rounded-2xl bg-teal-600 p-6">
            <Text className="mb-1 text-sm text-teal-100">Word to Remember</Text>
            <Text className="text-3xl font-extrabold text-white">{step.text}</Text>
            <Text className="mt-2 text-teal-50">{step.translation}</Text>
          </View>

          {/* Tip */}
          <View className="mb-6 flex-row rounded-2xl border border-amber-200 bg-amber-50 p-5">
            <Sparkles size={20} color="#f59e0b" />
            <View className="ml-3 flex-1">
              <Text className="mb-1 font-bold text-slate-800">Visualization Tip</Text>
              <Text className="text-slate-600">
                Imagine this word in an exaggerated, emotional way inside your palace.
              </Text>
            </View>
          </View>

          {/* Instructions */}
          <View className="rounded-2xl border border-purple-200 bg-purple-50 p-5">
            <Text className="mb-3 font-bold text-purple-900">How to Practice</Text>

            {[
              'Visualize the location clearly',
              `Place "${step.text}" in the scene`,
              'Use sound, color, and movement',
              'Replay the image multiple times',
            ].map((text, index) => (
              <Text key={index} className="mb-2 text-slate-600">
                {index + 1}. {text}
              </Text>
            ))}
          </View>
        </Animated.View>
      </ScrollView>

      {/* Footer */}
      <View className="border-t border-gray-100 p-4">
        <AnimatedPressable
          onPress={handleNext}
          className="flex-row items-center justify-center rounded-xl bg-teal-600 py-4">
          <Text className="mr-2 text-lg font-bold text-white">
            {currentStep === steps.length - 1 ? 'Finish' : 'Next'}
          </Text>
          <ChevronRight size={20} color={Colors.white} />
        </AnimatedPressable>
      </View>
    </View>
  );
}
