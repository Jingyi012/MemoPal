import { AppImage } from '@/components/AppImage';
import LoadingView from '@/components/LoadingView';
import { StepNavigationFooter } from '@/components/StepNavigationFooter';
import { LearningCompletion } from '@/features/palace/lesson-learning/components/LearningCompletion';
import { useLessonLearningModel } from '@/features/palace/lesson-learning/hooks/useLessonLearningModel';
import { Sparkles } from 'lucide-react-native';
import { ScrollView, Text, View } from 'react-native';
import Animated, { FadeInRight } from 'react-native-reanimated';

interface Props {
  lessonId: string;
}

export function LearnLessonScreen({ lessonId }: Props) {
  const {
    lesson,
    words,
    locations,
    currentStep,
    currentWord,
    isLastStep,
    progress,
    isCompleted,
    completionXp,
    completionRewards,
    isFinalizingCompletion,
    hasFinalizedCompletion,
    isLoading,
    handleNext,
    handlePrevious,
  } = useLessonLearningModel({ lessonId });

  if (isLoading) return <LoadingView />;

  if (!lesson || !locations || words.length === 0 || !currentWord) {
    return (
      <View className="flex-1 items-center justify-center">
        <Text className="text-slate-600">Lesson not found</Text>
      </View>
    );
  }

  if (isCompleted) {
    if (isFinalizingCompletion && !hasFinalizedCompletion) return <LoadingView />;

    return (
      <LearningCompletion
        stepsCount={words.length}
        lessonId={lessonId}
        palaceId={lesson.palaceId}
        earnedXp={completionXp}
        rewards={completionRewards}
      />
    );
  }

  const currentLocation = locations.find((location) => location.id === currentWord.locationId);

  return (
    <View className="flex-1 bg-white">
      <View className="h-2 bg-gray-100">
        <View className="h-full bg-teal-600" style={{ width: `${progress}%` }} />
      </View>

      <ScrollView className="flex-1 px-4">
        <Animated.View key={currentWord.id} entering={FadeInRight}>
          <View className="my-6 items-center">
            <Text className="mb-1 text-slate-600">
              Word {currentStep + 1} of {words.length}
            </Text>
            <Text className="text-2xl font-bold text-slate-800">
              {currentLocation?.name ?? 'Memory Palace'}
            </Text>
          </View>

          <View className="mb-6 h-56 w-full rounded-2xl">
            <AppImage
              source={{ uri: currentLocation?.imageUrl ?? 'https://picsum.photos/800/600' }}
              style={{ borderRadius: 16 }}
            />
          </View>

          <View className="mb-6 items-center rounded-2xl bg-teal-600 p-6">
            <Text className="mb-1 text-sm text-teal-100">Word to Remember</Text>
            <Text className="text-3xl font-extrabold text-white">{currentWord.text}</Text>
            <Text className="mt-2 text-teal-50">{currentWord.meaning}</Text>
          </View>

          <View className="mb-6 flex-row rounded-2xl border border-amber-200 bg-amber-50 p-5">
            <Sparkles size={20} color="#f59e0b" />
            <View className="ml-3 flex-1">
              <Text className="mb-1 font-bold text-slate-800">Visualization Tip</Text>
              <Text className="text-slate-600">
                Imagine this word in an exaggerated, emotional way inside your palace.
              </Text>
            </View>
          </View>

          <View className="rounded-2xl border border-purple-200 bg-purple-50 p-5">
            <Text className="mb-3 font-bold text-purple-900">How to Practice</Text>
            {[
              'Visualize the location clearly',
              `Place "${currentWord.text}" in the scene`,
              'Use sound, color, and movement',
              'Replay the image multiple times',
            ].map((instruction, index) => (
              <Text key={instruction} className="mb-2 text-slate-600">
                {index + 1}. {instruction}
              </Text>
            ))}
          </View>
        </Animated.View>
      </ScrollView>

      <StepNavigationFooter
        onPrevious={currentStep === 0 ? undefined : handlePrevious}
        onNext={handleNext}
        nextLabel={isLastStep ? 'Completed' : 'Next'}
      />
    </View>
  );
}
