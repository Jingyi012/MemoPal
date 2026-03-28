import AnimatedPressable from '@/components/AnimatedPressable';
import CustomBottomSheetModal from '@/components/CustomBottomSheetModal';
import { useMyCommunityLessons } from '@/hooks/useCommunityLibrary';
import { CommunityLesson } from '@/types/community';
import { BottomSheetModal, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { useRouter } from 'expo-router';
import { BookOpen, Crown } from 'lucide-react-native';
import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import { Text, View } from 'react-native';

type Ref = BottomSheetModal;

const ContributionBottomSheet = forwardRef<Ref>((_, ref) => {
  const router = useRouter();
  const { data, isLoading } = useMyCommunityLessons({ pageNumber: 1, pageSize: 100 });

  const bottomSheetRef = useRef<BottomSheetModal>(null);

  useImperativeHandle(ref, () => bottomSheetRef.current!, []);

  const lessons: CommunityLesson[] = data?.items ?? [];

  return (
    <CustomBottomSheetModal ref={bottomSheetRef} snapPoints={['95%']} enableDynamicSizing={false}>
      <View className="flex-1">
        {/* Header */}
        <View className="border-b border-slate-200 bg-white px-6 pb-4 pt-3">
          <Text className="text-2xl font-extrabold text-slate-900">My Contributions</Text>
          <Text className="mt-1 text-sm text-slate-500">Manage your shared lessons.</Text>
        </View>

        {/* Content */}
        <BottomSheetScrollView
          contentContainerStyle={{
            padding: 16,
            paddingBottom: 40,
          }}
          showsVerticalScrollIndicator={false}>
          {isLoading ? (
            <View className="items-center justify-center py-16">
              <Text className="text-sm text-slate-500">Loading your shared lessons...</Text>
            </View>
          ) : lessons.length > 0 ? (
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
                You haven&apos;t shared any lessons with the community.
              </Text>
            </View>
          )}
        </BottomSheetScrollView>
      </View>
    </CustomBottomSheetModal>
  );
});

ContributionBottomSheet.displayName = 'ContributionBottomSheet';

export default ContributionBottomSheet;
