import { getBaseCardClassName } from '@/components/BaseCard';
import { DueReviewLessonPreview } from '@/features/palace';
import { Clock, ChevronRight } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

interface ReviewDueBadgeProps {
  dueCount: number;
  dueLessons: DueReviewLessonPreview[];
  onOpenLesson: (lessonId: string) => void;
  onOpenAll: () => void;
}

export const ReviewDueBadge: React.FC<ReviewDueBadgeProps> = ({
  dueCount,
  dueLessons,
  onOpenLesson,
  onOpenAll,
}) => {
  if (dueCount === 0) return null;

  return (
    <Animated.View
      entering={FadeInDown.delay(100)}
      className={getBaseCardClassName({
        className: 'mt-3 overflow-hidden bg-amber-100',
        padding: 'none',
        bordered: false,
      })}>
      <View className="border-l-4 border-amber-400 px-4 py-3">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-3">
            <Clock size={22} color="#b45309" />
            <View>
              <Text className="text-sm font-bold text-amber-900">Ready To Review</Text>
              <Text className="text-xs text-amber-900 opacity-80">
                {dueCount} lesson{dueCount !== 1 ? 's' : ''} due
              </Text>
            </View>
          </View>
          <Pressable onPress={onOpenAll} className="rounded-full bg-amber-200 px-3 py-1">
            <Text className="text-xs font-semibold text-amber-900">View All</Text>
          </Pressable>
        </View>

        <View className="mt-3 gap-2">
          {dueLessons.map((lesson) => (
            <Pressable
              key={lesson.reviewId}
              onPress={() => onOpenLesson(lesson.lessonId)}
              className="flex-row items-center justify-between rounded-xl bg-white/75 px-3 py-2">
              <View className="flex-1 pr-2">
                <Text numberOfLines={1} className="text-sm font-semibold text-slate-800">
                  {lesson.lessonTitle}
                </Text>
                <Text
                  className={`mt-0.5 text-xs ${
                    lesson.isOverdue ? 'text-red-700' : 'text-slate-500'
                  }`}>
                  {lesson.isOverdue ? 'Overdue' : 'Due now'}
                </Text>
              </View>
              <ChevronRight size={16} color="#334155" />
            </Pressable>
          ))}
        </View>
      </View>
    </Animated.View>
  );
};

