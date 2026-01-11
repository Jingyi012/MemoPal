import AnimatedPressable from '@/components/AnimatedPressable';
import CustomBottomSheetModal from '@/components/CustomBottomSheetModal';
import { useAuth } from '@/contexts/AuthProvider';
import { CommunityLesson } from '@/types/community';
import data from '@/utils/mock/community-lessons.json';
import { BottomSheetModal, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { useRouter } from 'expo-router';
import { BookOpen, Crown, Download, Star, TrendingUp } from 'lucide-react-native';
import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import { Text, View } from 'react-native';

type Ref = BottomSheetModal;

const ContributionBottomSheet = forwardRef<Ref>((_, ref) => {
  const { user } = useAuth();
  const router = useRouter();

  const bottomSheetRef = useRef<BottomSheetModal>(null);

  useImperativeHandle(ref, () => bottomSheetRef.current!, []);

  const lessons: CommunityLesson[] = (data as CommunityLesson[]).filter(
    (x) => x.creator.id === user?.id
  );

  return (
    <CustomBottomSheetModal ref={bottomSheetRef} snapPoints={['95%']} enableDynamicSizing={false}>
      <View className="flex-1">
        {/* Header */}
        <View className="border-b border-slate-200 bg-white px-6 pb-4 pt-3">
          <Text className="text-2xl font-extrabold text-slate-900">My Contributions</Text>
          <Text className="mt-1 text-sm text-slate-500">
            Track your shared lessons and their performance
          </Text>
        </View>

        {/* Content */}
        <BottomSheetScrollView
          contentContainerStyle={{
            padding: 16,
            paddingBottom: 40,
          }}
          showsVerticalScrollIndicator={false}>
          {lessons.length > 0 ? (
            lessons.map((lesson) => (
              <View
                key={lesson.id}
                className="mb-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                {/* Lesson Header */}
                <View className="flex-row items-start">
                  <View className="h-11 w-11 items-center justify-center rounded-xl bg-teal-500">
                    <BookOpen size={20} color="white" />
                  </View>

                  <View className="ml-3 flex-1">
                    <View className="flex-row items-center justify-between">
                      <Text className="flex-1 text-base font-bold text-slate-900" numberOfLines={1}>
                        {lesson.title}
                      </Text>
                      {lesson.isPremium && <Crown size={16} color="#eab308" />}
                    </View>

                    <Text className="mt-1 text-sm text-slate-600" numberOfLines={2}>
                      {lesson.description}
                    </Text>

                    <View className="mt-2 flex-row items-center gap-2">
                      <View className="rounded-full bg-teal-100 px-3 py-1">
                        <Text className="text-xs font-semibold text-teal-700">
                          {lesson.shareCode}
                        </Text>
                      </View>
                      <Text className="text-xs text-slate-500">• {lesson.words.length} words</Text>
                    </View>
                  </View>
                </View>

                {/* Performance */}
                <View className="mt-4 rounded-xl bg-white p-3">
                  <Text className="mb-2 text-sm font-semibold text-slate-700">Performance</Text>

                  <View className="flex-row justify-between">
                    <Stat
                      icon={<Download size={14} color="#0d9488" />}
                      value={lesson.stats.usageCount.toLocaleString()}
                      label="Imports"
                    />
                    <Stat
                      icon={<Star size={14} color="#eab308" fill="#eab308" />}
                      value={lesson.stats.rating}
                      label="Rating"
                    />
                    <Stat
                      icon={<TrendingUp size={14} color="#16a34a" />}
                      value={lesson.stats.reviewCount}
                      label="Reviews"
                    />
                  </View>
                </View>

                {/* Actions */}
                <View className="mt-3 flex-row gap-2">
                  <AnimatedPressable
                    onPress={() => {
                      bottomSheetRef?.current?.dismiss();
                      router.push(`/lessons/${lesson.id}`);
                    }}
                    className="flex-1 rounded-xl border border-slate-200 bg-white py-2">
                    <Text className="text-center text-sm font-semibold text-slate-700">
                      View Details
                    </Text>
                  </AnimatedPressable>

                  <AnimatedPressable
                    onPress={undefined}
                    className="flex-1 rounded-xl border border-red-200 bg-red-50 py-2">
                    <Text className="text-center text-sm font-semibold text-red-600">Unshare</Text>
                  </AnimatedPressable>
                </View>
              </View>
            ))
          ) : (
            /* Empty state */
            <View className="flex-1 items-center justify-center py-20">
              <View className="mb-4 h-16 w-16 items-center justify-center rounded-full bg-slate-100">
                <BookOpen size={28} color="#94a3b8" />
              </View>
              <Text className="text-lg font-bold text-slate-800">No contributions yet</Text>
              <Text className="mt-2 text-center text-sm text-slate-500">
                You haven't shared any lessons with the community.
              </Text>
            </View>
          )}
        </BottomSheetScrollView>
      </View>
    </CustomBottomSheetModal>
  );
});

export default ContributionBottomSheet;

/* Small stat component */
function Stat({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: string | number;
  label: string;
}) {
  return (
    <View className="flex-1 items-center">
      <View className="mb-1 flex-row items-center gap-1">
        {icon}
        <Text className="text-sm font-bold text-slate-900">{value}</Text>
      </View>
      <Text className="text-xs text-slate-500">{label}</Text>
    </View>
  );
}
