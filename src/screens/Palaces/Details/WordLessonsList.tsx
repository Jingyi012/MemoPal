import AnimatedPressable from '@/components/AnimatedPressable';
import { Colors } from '@/constants/colors';
import { Lesson } from '@/types/lesson';
import { useRouter } from 'expo-router';
import { BookOpen, Crown } from 'lucide-react-native';
import { Text, View } from 'react-native';
import { LessonCard } from './LessonCard';

interface Props {
  lessons: Lesson[];
}

export const WordLessonList: React.FC<Props> = ({ lessons }) => {
  const router = useRouter();

  const handleViewLesson = (id: string) => {
    router.push(`/lessons/${id}`);
  };

  const handleUnlockLesson = () => {};

  return (
    <View className="mt-6">
      <View className="mb-3 flex-row items-center gap-2">
        <BookOpen color={Colors.teal600} size={20} />
        <Text className="text-lg font-semibold text-slate-800">Word Lessons</Text>
      </View>

      <View>
        {lessons.map((item, index) => (
          <View key={item.id}>
            <LessonCard
              lesson={item}
              progress={item.progress}
              onViewLessonDetail={handleViewLesson}
            />
            {index < lessons.length - 1 && <View className="h-3" />}
          </View>
        ))}
      </View>
      <AnimatedPressable
        onPress={handleUnlockLesson}
        className="mt-3 flex-row items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-yellow-400 bg-yellow-50 p-4">
        <Crown className="h-5 w-5" color={Colors.yellow700} />
        <Text className="font-medium text-yellow-700">Unlock More Lessons</Text>
      </AnimatedPressable>
    </View>
  );
};
