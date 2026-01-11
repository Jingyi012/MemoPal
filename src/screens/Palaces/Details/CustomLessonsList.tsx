import AnimatedPressable from '@/components/AnimatedPressable';
import { Colors } from '@/constants/colors';
import { Lesson } from '@/types/lesson';
import { useRouter } from 'expo-router';
import { Edit2, Plus } from 'lucide-react-native';
import { Text, View } from 'react-native';
import { LessonCard } from './LessonCard';

interface Props {
  palaceId: string;
  lessons: Lesson[];
}

export const CustomLessonList: React.FC<Props> = ({ palaceId, lessons }) => {
  const router = useRouter();
  const handleViewLesson = (id: string) => {
    router.push(`/lessons/${id}`);
  };

  const handleCreateLesson = () => {
    router.push(`/palaces/${palaceId}/lessons/create`);
  };
  const handleDeleteLesson = () => {};

  return (
    <View className="mt-6">
      <View className="mb-3 flex-row items-center justify-between">
        <View className="flex-row items-center gap-2">
          <Edit2 color="#9333ea" size={20} />
          <Text className="text-lg font-semibold text-slate-800">My Custom Lessons</Text>
        </View>
        <Text className="text-xs text-text-muted">{lessons.length} / 10</Text>
      </View>
      <View>
        {lessons.map((item, index) => (
          <View key={item.id}>
            <LessonCard
              lesson={item}
              progress={item.progress}
              onViewLessonDetail={handleViewLesson}
              onDeleteLesson={handleDeleteLesson}
            />
            {index < lessons.length - 1 && <View className="h-3" />}
          </View>
        ))}
      </View>
      {lessons.length < 10 && (
        <AnimatedPressable
          onPress={handleCreateLesson}
          className="mt-3 flex-row items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-purple-300 bg-purple-50 p-4">
          <Plus className="h-5 w-5" color={Colors.purple600} />
          <Text className="font-medium text-purple-700">Create New Lesson</Text>
        </AnimatedPressable>
      )}
    </View>
  );
};
