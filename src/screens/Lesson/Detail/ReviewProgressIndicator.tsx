import { AlertCircle, CheckCircle2, Clock, Trophy } from 'lucide-react-native';
import React from 'react';
import { Text, View } from 'react-native';

import { Colors } from '@/constants/colors';
import { ReviewSchedule } from '@/types/lesson';
import { cn } from '@/utils/cn';
import { dateFormatter } from '@/utils/formatter';
import { isReviewDueSoon, isReviewOverdue } from '@/utils/review';

interface ReviewProgressIndicatorProps {
  schedule: ReviewSchedule;
  compact?: boolean;
  className?: string;
}

export function ReviewProgressIndicator({
  schedule,
  compact = false,
  className,
}: ReviewProgressIndicatorProps) {
  const reviews = [
    { key: 'review1', label: '24h', data: schedule.review1 },
    { key: 'review2', label: '3d', data: schedule.review2 },
    { key: 'review3', label: '7d', data: schedule.review3 },
    { key: 'review4', label: '30d', data: schedule.review4 },
  ];

  const allCompleted = reviews.every((r) => r.data.completed);

  /* ------------------------------------------------------------------ */
  /* COMPACT MODE (DOT INDICATOR) */
  /* ------------------------------------------------------------------ */
  if (compact) {
    return (
      <View className="flex-row items-center">
        {reviews.map((review) => {
          const bgColor = review.data.completed
            ? 'bg-green-500'
            : isReviewOverdue(review.data.dueDate)
              ? 'bg-red-400'
              : isReviewDueSoon(review.data.dueDate)
                ? 'bg-orange-400'
                : 'bg-gray-300';

          return <View key={review.key} className={`mr-1.5 h-1.5 w-1.5 rounded-full ${bgColor}`} />;
        })}

        {allCompleted && <Trophy size={12} className="ml-1 text-yellow-500" />}
      </View>
    );
  }

  /* ------------------------------------------------------------------ */
  /* FULL MODE */
  /* ------------------------------------------------------------------ */
  return (
    <View className={cn('rounded-2xl bg-white p-4', className)}>
      <Text className="mb-3">Review Timeline</Text>
      <View className="space-y-2">
        {reviews.map((review, idx) => {
          const isOverdue = !review.data.completed && isReviewOverdue(review.data.dueDate);

          const isDueSoon = !review.data.completed && isReviewDueSoon(review.data.dueDate);

          const statusBg = review.data.completed
            ? 'bg-green-100'
            : isOverdue
              ? 'bg-red-100'
              : isDueSoon
                ? 'bg-orange-100'
                : 'bg-gray-100';

          return (
            <View key={review.key} className="mb-2 flex-row items-center">
              {/* Status Icon */}
              <View className={`mr-3 h-6 w-6 items-center justify-center rounded-full ${statusBg}`}>
                {review.data.completed ? (
                  <CheckCircle2 size={16} color={Colors.green600} />
                ) : isOverdue ? (
                  <AlertCircle size={16} color={Colors.red600} />
                ) : (
                  <Clock size={16} color={isDueSoon ? Colors.orange400 : Colors.gray400} />
                )}
              </View>

              {/* Label & Dates */}
              <View className="flex-1">
                <Text
                  className={`text-xs ${
                    review.data.completed
                      ? 'text-green-600'
                      : isOverdue
                        ? 'text-red-600'
                        : 'text-slate-600'
                  }`}>
                  Review {idx + 1} ({review.label})
                </Text>

                {review.data.completed && review.data.completedDate ? (
                  <Text className="text-xs text-slate-400">
                    {dateFormatter(review.data.completedDate)}
                  </Text>
                ) : (
                  <Text className="text-xs text-slate-400">
                    Due: {dateFormatter(review.data.dueDate)}
                  </Text>
                )}
              </View>

              {/* Progress Bar */}
              <View
                className={`h-1 w-8 rounded-full ${
                  review.data.completed ? 'bg-green-500' : 'bg-gray-200'
                }`}
              />
            </View>
          );
        })}

        {/* Mastery Badge */}
        {allCompleted && (
          <View className="mt-3 flex-row items-center border-t border-gray-200 pt-3">
            <Trophy size={16} className="mr-2" color={Colors.yellow600} />
            <Text className="text-xs font-medium text-yellow-600">Mastered!</Text>
          </View>
        )}
      </View>
    </View>
  );
}
