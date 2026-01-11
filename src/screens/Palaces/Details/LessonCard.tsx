import { ActionSheet } from '@/components/ActionSheet';
import AnimatedPressable from '@/components/AnimatedPressable';
import { ProgressBar } from '@/components/ProgressBar';
import { Colors } from '@/constants/colors';
import { masteryProgressMap } from '@/constants/masteryProgressMap';
import { Lesson, LessonProgress } from '@/types/lesson';
import { getMasteryLevel, getNextReview, isReviewDueSoon, isReviewOverdue } from '@/utils/review';
import {
  AlertCircle,
  BookOpen,
  CheckCircle2,
  Clock,
  Crown,
  Lock,
  Play,
  Trash2,
} from 'lucide-react-native';
import React, { useState } from 'react';
import { StyleProp, Text, View, ViewStyle } from 'react-native';

interface Props {
  lesson: Lesson;
  progress?: LessonProgress;
  palaceTrainingCompleted?: boolean;
  onViewLessonDetail?: (lessonId: string) => void;
  onEditLesson?: (lessonId: string) => void;
  onDeleteLesson?: (lesson: Lesson) => void;
  containerStyle?: StyleProp<ViewStyle>;
}

export const LessonCard: React.FC<Props> = ({
  lesson,
  progress,
  palaceTrainingCompleted = true,
  onViewLessonDetail,
  onDeleteLesson,
  containerStyle,
}) => {
  const [isDeleteSheetVisible, setDeleteSheetVisible] = useState(false);
  const canStart = palaceTrainingCompleted && !lesson.locked;

  // Review logic
  const nextReviewKey = progress ? getNextReview(progress.reviewSchedule) : null;
  const nextReviewData = nextReviewKey ? progress?.reviewSchedule[nextReviewKey] : null;
  const isOverdue = nextReviewData ? isReviewOverdue(nextReviewData.dueDate) : false;
  const isDueSoon = nextReviewData ? isReviewDueSoon(nextReviewData.dueDate) : false;
  const masteryLevel = progress ? getMasteryLevel(progress.reviewSchedule) : 'new';

  // Colors
  const getBgColor = () => {
    if (lesson.locked) return Colors.gray100;
    if (isOverdue) return Colors.red100;
    if (isDueSoon) return Colors.orange100;
    if (lesson.completed) return Colors.green100;
    if (masteryLevel === 'mastered') return Colors.blue100;
    if (lesson.isCustom) return Colors.purple100;
    return Colors.teal100;
  };

  const getIconColor = () => {
    if (lesson.locked) return lesson.isPremium ? Colors.yellow500 : Colors.gray400;
    if (isOverdue) return Colors.red600;
    if (isDueSoon) return Colors.orange600;
    if (lesson.completed) return Colors.green600;
    if (masteryLevel === 'mastered') return Colors.blue500;
    if (lesson.isCustom) return Colors.purple600;
    return Colors.teal600;
  };

  const isNewLesson = !progress;
  const progressValue = progress ? masteryProgressMap[masteryLevel] : 0;

  const progressColor = isOverdue
    ? Colors.red600
    : isDueSoon
      ? Colors.orange600
      : masteryLevel === 'mastered'
        ? Colors.blue500
        : Colors.teal500;

  const getStatusIcon = () => {
    const color = getIconColor();
    const size = 24;

    if (lesson.locked) {
      return lesson.isPremium ? (
        <Crown size={size} color={color} />
      ) : (
        <Lock size={size} color={color} />
      );
    }
    if (isOverdue) return <AlertCircle size={size} color={color} />;
    if (isDueSoon) return <Clock size={size} color={color} />;
    if (lesson.completed) return <CheckCircle2 size={size} color={color} />;
    return <BookOpen size={size} color={color} />;
  };

  // Handle long press menu
  const handleLongPress = () => {
    if (onDeleteLesson) {
      setDeleteSheetVisible(true);
    }
  };

  return (
    <>
      <AnimatedPressable
        disabled={!canStart}
        onPress={() => canStart && onViewLessonDetail!(lesson.id)}
        onLongPress={handleLongPress}
        className={`${canStart ? 'bg-white' : 'opacity-60'} w-full rounded-2xl p-4 shadow-sm`}
        style={containerStyle}>
        <View className="flex-row items-center gap-4">
          {/* Status Icon */}
          <View
            style={{ backgroundColor: getBgColor() }}
            className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full">
            {getStatusIcon()}
          </View>

          {/* Lesson Info */}
          <View className="flex-1">
            <Text className="font-semibold text-slate-800">{lesson.title}</Text>
            {/* <Text className="text-sm text-slate-600">{lesson.description}</Text> */}
            <Text className="text-sm text-slate-600">
              {lesson.description ||
                (isNewLesson
                  ? 'Start this lesson to begin training'
                  : 'Continue improving your memory')}
            </Text>
            <View className="mt-1 flex-row items-center gap-2">
              <Text
                style={{ color: lesson.completed ? Colors.green600 : Colors.gray600 }}
                className="text-xs">
                {lesson.wordCount} words
              </Text>

              {isNewLesson && (
                <View className="rounded-full bg-teal-100 px-2 py-0.5">
                  <Text className="text-xs font-medium text-teal-700">New</Text>
                </View>
              )}

              {lesson.isPremium && (
                <View className="rounded-full bg-yellow-100 px-2 py-0.5">
                  <Text style={{ color: Colors.yellow700 }} className="text-xs">
                    Premium
                  </Text>
                </View>
              )}
            </View>

            {/* Progress Bar */}
            {!lesson.locked && <ProgressBar progress={progressValue} color={progressColor} />}
          </View>

          {/* Actions */}
          <View className="flex-row items-center gap-2">
            {canStart && (
              <Play
                size={20}
                color={
                  isOverdue
                    ? Colors.red600
                    : isDueSoon
                      ? Colors.orange600
                      : lesson.completed
                        ? Colors.green600
                        : Colors.teal600
                }
              />
            )}
          </View>
        </View>
      </AnimatedPressable>
      <ActionSheet
        isVisible={isDeleteSheetVisible}
        onClose={() => setDeleteSheetVisible(false)}
        onAction={() => onDeleteLesson?.(lesson)}
        title="Remove Lesson?"
        description={`Are you sure you want to remove "${lesson.title}"? You will lose all your progress data for this lesson.`}
        actionLabel="Remove Lesson"
        variant="destructive"
        Icon={Trash2}
      />
    </>
  );
};
