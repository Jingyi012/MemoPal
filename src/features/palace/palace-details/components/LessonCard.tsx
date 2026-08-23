import { formatDistanceToNow } from 'date-fns';
import {
  AlertCircle,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Clock,
  Crown,
  Lock,
  Trash2,
  Zap,
} from 'lucide-react-native';
import React, { useMemo } from 'react';
import { StyleProp, Text, View, ViewStyle } from 'react-native';

import { ActionSheet } from '@/components/ActionSheet';
import AnimatedPressable from '@/components/AnimatedPressable';
import { getBaseCardClassName } from '@/components/BaseCard';
import { ProgressBar } from '@/components/ProgressBar';
import { Colors } from '@/constants/colors';
import { Lesson, LessonProgress } from '@/features/palace/shared/types/lesson.types';
import { cn } from '@/utils/cn';
import { calculateDetailedProgress } from '@/utils/progressBarCalculation';
import { getNextReview, isReviewDueSoon, isReviewOverdue } from '@/features/palace/shared/utils/review';

interface LessonCardProps {
  lesson: Lesson;
  progress?: LessonProgress | null;
  palaceTrainingCompleted?: boolean;
  onViewLessonDetail: (lessonId: string) => void;
  onDeleteLesson?: (lesson: Lesson) => void;
  containerStyle?: StyleProp<ViewStyle>;
  className?: string;
}

interface StatusConfig {
  color: string;
  bgSecondary: string;
  label: string;
  Icon: React.ElementType;
  isUrgent: boolean;
  overdue: boolean;
}

export const LessonCard = ({
  lesson,
  progress,
  palaceTrainingCompleted = true,
  onViewLessonDetail,
  onDeleteLesson,
  className,
}: LessonCardProps) => {
  const [isDeleteSheetVisible, setDeleteSheetVisible] = React.useState(false);
  const canStart = palaceTrainingCompleted && !lesson.isLocked;

  const status = useMemo((): StatusConfig => {
    const nextReviewData = progress ? getNextReview(progress.reviewSchedules) : null;
    const isOverdue = nextReviewData ? isReviewOverdue(nextReviewData.dueDate) : false;
    const isDueSoon = nextReviewData ? isReviewDueSoon(nextReviewData.dueDate) : false;
    const level = progress?.masteryLevel ?? 'new';

    if (lesson.isLocked) {
      return {
        color: Colors.slate400,
        bgSecondary: 'bg-slate-100',
        label: 'Locked',
        Icon: lesson.isPremium ? Crown : Lock,
        isUrgent: false,
        overdue: false,
      };
    }
    if (isOverdue) {
      return {
        color: Colors.red500,
        bgSecondary: 'bg-red-50',
        label: 'Overdue',
        Icon: AlertCircle,
        isUrgent: true,
        overdue: true,
      };
    }
    if (isDueSoon) {
      return {
        color: Colors.orange500,
        bgSecondary: 'bg-orange-50',
        label: 'Due Soon',
        Icon: Clock,
        isUrgent: true,
        overdue: false,
      };
    }
    if (level === 'mastered') {
      return {
        color: Colors.blue500,
        bgSecondary: 'bg-blue-50',
        label: 'Mastered',
        Icon: CheckCircle2,
        isUrgent: false,
        overdue: false,
      };
    }
    return {
      color: Colors.teal500,
      bgSecondary: 'bg-teal-50',
      label: 'Learning',
      Icon: BookOpen,
      isUrgent: false,
      overdue: false,
    };
  }, [progress, lesson.isLocked, lesson.isPremium]);

  const { progressPercentage } = useMemo(() => {
    if (!progress) return { progressPercentage: 0 };

    const totalReviews = progress.totalReviews ?? 0;
    return { progressPercentage: calculateDetailedProgress(progress.masteryLevel, totalReviews) };
  }, [progress]);
  const nextReviewDate = progress ? getNextReview(progress.reviewSchedules)?.dueDate : null;

  return (
    <>
      <AnimatedPressable
        disabled={!canStart}
        onPress={() => onViewLessonDetail(lesson.id)}
        onLongPress={() => onDeleteLesson && setDeleteSheetVisible(true)}
        className={cn(
          getBaseCardClassName({
            padding: 'none',
            className: 'mb-4 overflow-hidden rounded-[28px]',
          }),
          !canStart && 'opacity-60',
          className
        )}>
        <View className="absolute -right-6 -top-6 opacity-[0.04]">
          <status.Icon size={140} color={status.color} strokeWidth={1} />
        </View>

        <View className="p-5">
          <View className="flex-row items-start justify-between">
            <View className="flex-1 pr-4">
              <View className="mb-1.5 flex-row items-center space-x-2">
                <Text className="text-[10px] font-bold uppercase tracking-[1.5px] text-slate-400">
                  {lesson.category || 'General'}
                </Text>
                {lesson.isCustom && (
                  <View className="rounded-md bg-purple-100 px-1.5 py-0.5">
                    <Text className="text-[8px] font-black uppercase text-purple-700">Custom</Text>
                  </View>
                )}
              </View>
              <Text className="text-lg font-bold leading-tight text-slate-900">{lesson.title}</Text>
            </View>

            <View
              className={cn(
                'h-11 w-11 items-center justify-center rounded-2xl',
                status.bgSecondary
              )}>
              <status.Icon size={22} color={status.color} strokeWidth={2.5} />
            </View>
          </View>

          <Text numberOfLines={1} className="mt-2 text-[13px] leading-4 text-slate-500">
            {lesson.description || 'Master these words in your memory palace.'}
          </Text>

          <View className="mt-5">
            <View className="mb-2 flex-row items-end justify-between">
              <View className="flex-row items-center">
                <Zap size={12} color={status.color} />
                <Text className="ml-1 text-xs font-bold uppercase tracking-wide text-slate-700">
                  {progress?.masteryLevel ?? 'New'}
                </Text>
                <Text className="mx-2 text-slate-300">|</Text>
                <Text className="text-xs font-medium text-slate-400">{lesson.wordCount} words</Text>
              </View>
              <Text className="text-xs font-black text-slate-900">
                {Math.round(progressPercentage * 100)}%
              </Text>
            </View>

            <ProgressBar progress={progressPercentage} color={status.color} height={8} />
          </View>

          {!lesson.isLocked && (
            <View className="mt-4 flex-row items-center justify-between border-t border-slate-50 pt-4">
              <View className="flex-row items-center">
                {nextReviewDate ? (
                  <View className="flex-row items-center">
                    <Text className="text-[11px] font-semibold text-slate-400">Next Review: </Text>
                    <Text
                      className="text-[11px] font-bold"
                      style={{ color: status.isUrgent ? status.color : Colors.slate600 }}>
                      {status.overdue
                        ? 'Now'
                        : formatDistanceToNow(new Date(nextReviewDate), { addSuffix: true })}
                    </Text>
                  </View>
                ) : (
                  <View className="rounded-full bg-emerald-50 px-2 py-0.5">
                    <Text className="text-[10px] font-bold uppercase text-emerald-600">
                      Ready to Start
                    </Text>
                  </View>
                )}
              </View>

              <View className="flex-row items-center rounded-full bg-slate-900 py-1.5 pl-3 pr-2">
                <Text className="mr-1 text-[11px] font-bold text-white">
                  {status.overdue ? 'Review' : 'Start'}
                </Text>
                <ChevronRight size={14} color="white" strokeWidth={3} />
              </View>
            </View>
          )}
        </View>
      </AnimatedPressable>

      <ActionSheet
        isVisible={isDeleteSheetVisible}
        onClose={() => setDeleteSheetVisible(false)}
        onAction={() => onDeleteLesson?.(lesson)}
        title="Remove Lesson?"
        description={`This will permanently delete your progress for "${lesson.title}".`}
        actionLabel="Remove Lesson"
        variant="destructive"
        Icon={Trash2}
      />
    </>
  );
};
