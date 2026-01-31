import { AlertMessage } from '@/components/AlertMessage';
import AnimatedPressable from '@/components/AnimatedPressable';
import { Colors } from '@/constants/colors';
import { useAuth } from '@/contexts/AuthProvider';
import { Lesson } from '@/types/lesson';
import { useRouter } from 'expo-router';
import { BookOpen, Crown } from 'lucide-react-native';
import { useState } from 'react';
import { Text, View } from 'react-native';
import { LessonCard } from './LessonCard';

interface Props {
  lessons: Lesson[];
}

export const WordLessonList: React.FC<Props> = ({ lessons }) => {
  const router = useRouter();
  const { user } = useAuth();

  // State for alert
  const [lockedAlert, setLockedAlert] = useState<{ visible: boolean; message: string }>({
    visible: false,
    message: '',
  });

  // Navigate to lesson or show locked alert
  const handleViewLesson = (lesson: Lesson) => {
    if (lesson.isLocked) {
      if (lesson.isPremium) {
        router.push('/premium');
      } else {
        setLockedAlert({
          visible: true,
          message: 'This lesson is locked. Complete previous lessons or earn more XP to unlock!',
        });
      }
      return;
    }

    router.push(`/lessons/${lesson.id}`);
  };

  const handleUnlockLesson = () => {
    router.push('/premium'); // Can extend to XP-based unlock flow
  };

  return (
    <View className="mt-6">
      {/* Header */}
      <View className="mb-3 flex-row items-center gap-2">
        <BookOpen color={Colors.teal600} size={20} />
        <Text className="text-lg font-semibold text-slate-800">Word Lessons</Text>
      </View>

      {/* Lessons List */}
      <View>
        {lessons.map((lesson, index) => (
          <View key={lesson.id}>
            <LessonCard
              lesson={lesson}
              progress={lesson.progress}
              onViewLessonDetail={() => handleViewLesson(lesson)}
            />
            {index < lessons.length - 1 && <View className="h-3" />}
          </View>
        ))}
      </View>

      {/* Unlock banner for non-premium users */}
      {!user?.isPremium && (
        <AnimatedPressable
          onPress={handleUnlockLesson}
          className="mt-4 flex-row items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-yellow-400 bg-yellow-50 p-4">
          <Crown className="h-5 w-5" color={Colors.yellow700} />
          <Text className="font-medium text-yellow-700">Unlock More Lessons</Text>
        </AnimatedPressable>
      )}

      {/* Alert Message */}
      <AlertMessage
        isVisible={lockedAlert.visible}
        onClose={() => setLockedAlert({ ...lockedAlert, visible: false })}
        title="Lesson Locked"
        description={lockedAlert.message}
        variant="destructive"
      />
    </View>
  );
};
