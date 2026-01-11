import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ChevronRight } from 'lucide-react-native';
import React, { useMemo, useRef, useState } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import AnimatedPressable from '@/components/AnimatedPressable';
import { ConfirmModal } from '@/components/ConfirmModal';
import lessons from '@/utils/mock/lessons.json';
import data from '@/utils/mock/palaces.json';
import { ReviewHeader } from './ReviewHeader';
import { ReviewImageDisplay } from './ReviewImageDisplay';
import { ReviewInputSection } from './ReviewInputSection';
import { ReviewSummary } from './ReviewSummary';

export function ReviewTest({ lessonId }: { lessonId: string }) {
  const router = useRouter();
  const inputRef = useRef<TextInput>(null);

  const lesson = lessons.lessons.find((l) => l.id === lessonId);
  const steps = useMemo(() => lesson?.words || [], [lesson?.words]);
  const totalSteps = steps.length;

  const [currentStep, setCurrentStep] = useState(0);
  const [inputValue, setInputValue] = useState('');
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [isRevealed, setIsRevealed] = useState(false);
  const [streak, setStreak] = useState(0);
  const [results, setResults] = useState<any[]>([]);
  const [showSummary, setShowSummary] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);

  const step = steps[currentStep];
  const location = data.locations.find((x) => x.id === step?.locationId);

  // Animations
  const shakeX = useSharedValue(0);
  const scoreScale = useSharedValue(1);
  const shakeStyle = useAnimatedStyle(() => ({ transform: [{ translateX: shakeX.value }] }));
  const streakStyle = useAnimatedStyle(() => ({ transform: [{ scale: scoreScale.value }] }));

  const handleVerify = () => {
    if (isRevealed || !inputValue.trim()) return;
    const isCorrect = inputValue.trim().toLowerCase() === step.text.toLowerCase();

    if (isCorrect) {
      setFeedback('correct');
      setStreak((s) => s + 1);
      setIsRevealed(true);
      scoreScale.value = withSequence(withSpring(1.5), withSpring(1));
    } else {
      setFeedback('wrong');
      setStreak(0);
      shakeX.value = withSequence(
        withTiming(-10, { duration: 50 }),
        withTiming(10, { duration: 50 }),
        withTiming(0, { duration: 50 })
      );
      setTimeout(() => setIsRevealed(true), 500);
    }
    setResults((prev) => [...prev, { wordId: step.id, isCorrect, entered: inputValue }]);
  };

  const handleNext = () => {
    if (currentStep < totalSteps - 1) {
      setIsRevealed(false);
      setFeedback(null);
      setInputValue('');
      setCurrentStep((s) => s + 1);
      // Short delay to ensure input is ready to receive focus after state change
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setShowSummary(true);
    }
  };

  if (showSummary) {
    return (
      <ReviewSummary
        correctCount={results.filter((r) => r.isCorrect).length}
        totalSteps={totalSteps}
        onFinish={() => router.push(`/palaces/${lesson?.palaceId}`)}
      />
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View className="flex-1 bg-slate-50">
          <ReviewHeader
            currentStep={currentStep}
            totalSteps={totalSteps}
            streak={streak}
            streakStyle={streakStyle}
            onExit={() => setShowExitModal(true)}
          />

          <ScrollView
            className="flex-1"
            contentContainerStyle={{ flexGrow: 1, paddingBottom: 20 }}
            keyboardShouldPersistTaps="handled">
            <View className="items-center px-6 pt-2">
              <Text className="mb-6 text-center text-2xl font-black text-slate-800">
                What is stored here?
              </Text>
              <Text className="mb-3 text-center text-xl font-medium text-slate-500">
                {location?.name || 'Memory Station'}
              </Text>

              <ReviewImageDisplay
                imageUrl={location?.image}
                isRevealed={isRevealed}
                feedback={feedback}
              />

              <ReviewInputSection
                inputRef={inputRef}
                value={inputValue}
                onChange={setInputValue}
                feedback={feedback}
                isRevealed={isRevealed}
                onSubmit={handleVerify}
                shakeStyle={shakeStyle}
                correctWord={step.text}
              />
            </View>
          </ScrollView>

          {/* Action Button Section - Sticky to bottom of keyboard */}
          <View className="bg-slate-50 p-6">
            {!isRevealed ? (
              <AnimatedPressable
                onPress={handleVerify}
                className="w-full items-center rounded-2xl bg-slate-900 py-5 shadow-lg">
                <Text className="text-lg font-black text-white">CHECK ANSWER</Text>
              </AnimatedPressable>
            ) : (
              <AnimatedPressable
                onPress={handleNext}
                className="w-full overflow-hidden rounded-2xl shadow-lg">
                <LinearGradient
                  colors={['#0d9488', '#4f46e5']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  className="flex-row items-center justify-center py-5">
                  <Text className="mr-2 text-lg font-black text-white">
                    {currentStep === totalSteps - 1 ? 'VIEW RESULTS' : 'NEXT LOCATION'}
                  </Text>
                  <ChevronRight size={20} color="white" strokeWidth={3} />
                </LinearGradient>
              </AnimatedPressable>
            )}
          </View>

          <ConfirmModal
            visible={showExitModal}
            title="Exit lesson?"
            description="Are you sure you want to exit? Your progress will not be saved."
            confirmText="Exit"
            cancelText="Stay"
            destructive
            onCancel={() => setShowExitModal(false)}
            onConfirm={() => {
              setShowExitModal(false);
              router.replace(`/lessons/${lessonId}`);
            }}
          />
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}
