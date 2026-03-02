import AnimatedPressable from '@/components/AnimatedPressable';
import { AppImage } from '@/components/AppImage';
import CustomBottomSheetModal from '@/components/CustomBottomSheetModal';
import { Colors } from '@/constants/colors';
import { CommunityLesson } from '@/types/community';
import { dateFormatter } from '@/utils/formatter';
import { BottomSheetModal, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { BadgeCheck, BookOpen, Calendar, Copy, Crown, Download, Star } from 'lucide-react-native';
import React, { forwardRef } from 'react';
import { Text, View } from 'react-native';

interface Props {
  selectedLesson: CommunityLesson | null;
  handleImport: (id: string) => void;
  importedIds: string[];
}

type Ref = BottomSheetModal;

const PreviewBottomSheet = forwardRef<Ref, Props>(
  ({ selectedLesson, importedIds, handleImport }, ref) => {
    return (
      <CustomBottomSheetModal ref={ref}>
        <View className="relative flex-1">
          {/* Scrollable content */}
          <View style={{ paddingBottom: 90 }}>
            <BottomSheetScrollView
              contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 16 }}>
              {selectedLesson && (
                <>
                  {/* Category & Premium Badge */}
                  <View className="mb-2 flex-row items-center justify-between">
                    <View className="rounded-md bg-teal-100 px-2 py-1">
                      <Text className="text-xs font-bold uppercase tracking-wider text-teal-700">
                        {selectedLesson.category.replace('-', ' ')}
                      </Text>
                    </View>
                    {selectedLesson.isPremium && (
                      <View className="flex-row items-center rounded-md bg-amber-100 px-2 py-1">
                        <Crown size={12} color={Colors.amber700} />
                        <Text className="ml-1 text-xs font-bold uppercase text-amber-700">
                          Premium
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* Title */}
                  <Text className="text-2xl font-extrabold leading-tight text-slate-900">
                    {selectedLesson.title}
                  </Text>

                  {/* Creator Info */}
                  <View className="mt-4 flex-row items-center rounded-2xl border border-slate-100 bg-slate-50 p-3">
                    {selectedLesson.creator.avatarUrl ? (
                      <AppImage
                        source={{ uri: selectedLesson.creator.avatarUrl }}
                        className="h-10 w-10"
                        style={{ borderRadius: 30 }}
                      />
                    ) : (
                      <View className="h-10 w-10 items-center justify-center rounded-full bg-blue-500">
                        <Text className="font-bold text-white">
                          {selectedLesson.creator.name.charAt(0)}
                        </Text>
                      </View>
                    )}
                    <View className="ml-3 flex-1">
                      <Text className="text-[10px] font-bold uppercase text-slate-400">
                        Creator
                      </Text>
                      <View className="flex-row items-center">
                        <Text className="font-semibold text-slate-900">
                          {selectedLesson.creator.name}
                        </Text>
                        {selectedLesson.creator.isVerified && (
                          <View className="ml-1">
                            <BadgeCheck size={16} color={Colors.teal500} fill={Colors.teal50} />
                          </View>
                        )}
                      </View>
                    </View>
                  </View>

                  {/* Stats Grid */}
                  <View className="mt-6 flex-row justify-between border-y border-slate-100 py-4">
                    <View className="flex-1 items-center border-r border-slate-100">
                      <View className="flex-row items-center">
                        <Star size={16} color={Colors.yellow500} fill={Colors.yellow500} />
                        <Text className="ml-1 font-bold text-slate-900">
                          {selectedLesson.stats.rating}
                        </Text>
                      </View>
                      <Text className="mt-1 text-xs uppercase text-slate-500">Rating</Text>
                    </View>
                    <View className="flex-1 items-center border-r border-slate-100">
                      <View className="flex-row items-center">
                        <Download size={16} color={Colors.slate400} />
                        <Text className="ml-1 font-bold text-slate-900">
                          {selectedLesson.stats.usageCount}
                        </Text>
                      </View>
                      <Text className="mt-1 text-xs uppercase text-slate-500">Users</Text>
                    </View>
                    <View className="flex-1 items-center">
                      <View className="flex-row items-center">
                        <Calendar size={16} color={Colors.slate400} />
                        <Text className="ml-1 font-bold text-slate-900">
                          {dateFormatter(selectedLesson.stats.updatedAt)}
                        </Text>
                      </View>
                      <Text className="mt-1 text-xs uppercase text-slate-500">Updated</Text>
                    </View>
                  </View>

                  {/* Description */}
                  <View className="mt-6">
                    <Text className="text-sm font-semibold uppercase tracking-widest text-slate-900">
                      About Lesson
                    </Text>
                    <Text className="mt-2 leading-6 text-slate-600">
                      {selectedLesson.description}
                    </Text>
                  </View>

                  {/* Tags */}
                  <View className="mt-4 flex-row flex-wrap">
                    {selectedLesson.tags.map((tag) => (
                      <View
                        key={tag}
                        className="mb-2 mr-2 rounded-lg border border-slate-200 bg-slate-100 px-3 py-1">
                        <Text className="text-xs font-medium text-slate-600">#{tag}</Text>
                      </View>
                    ))}
                  </View>

                  {/* Share Code Section */}
                  <View className="mt-6 flex-row items-center justify-between rounded-2xl bg-slate-800 p-4">
                    <View>
                      <Text className="text-xs font-bold uppercase text-slate-400">
                        Lesson Share Code
                      </Text>
                      <Text className="font-mono text-lg font-bold tracking-tighter text-white">
                        {selectedLesson.shareCode}
                      </Text>
                    </View>
                    <AnimatedPressable className="rounded-lg bg-slate-500 p-2">
                      <Copy size={20} color="white" />
                    </AnimatedPressable>
                  </View>

                  {/* Content Preview */}
                  <View className="mt-8">
                    <View className="mb-4 flex-row items-center justify-between">
                      <View className="flex-row items-center">
                        <BookOpen size={20} color={Colors.slate900} />
                        <Text className="ml-2 text-lg font-bold text-slate-900">
                          Lesson Content
                        </Text>
                      </View>
                      <Text className="font-semibold text-teal-600">
                        {selectedLesson.words.length} items
                      </Text>
                    </View>

                    <View className="space-y-3">
                      {selectedLesson.words.map((w, index) => (
                        <View
                          key={index}
                          className="mb-2 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-4">
                          <Text className="mb-1 text-xs font-bold uppercase text-slate-400">Word</Text>
                          <Text className="text-base font-bold text-slate-900">{w.word}</Text>

                          <View className="my-3 h-[1px] bg-slate-200" />

                          <Text className="mb-1 text-xs font-bold uppercase text-slate-400">Meaning</Text>
                          <Text className="text-sm leading-5 font-medium text-teal-700">{w.meaning}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                </>
              )}
            </BottomSheetScrollView>
          </View>

          {/* Fixed Import Button */}
          {selectedLesson && (
            <View className="absolute bottom-0 left-0 right-0 border-t border-slate-200 bg-white px-6 py-4">
              <AnimatedPressable
                onPress={() => handleImport(selectedLesson.id)}
                className={`w-full flex-row items-center justify-center rounded-2xl py-4 ${
                  importedIds.includes(selectedLesson.id) ? 'bg-slate-200' : 'bg-teal-600'
                }`}>
                <Download
                  size={20}
                  color={importedIds.includes(selectedLesson.id) ? Colors.slate500 : 'white'}
                />
                <Text
                  className={`ml-2 text-lg font-bold ${
                    importedIds.includes(selectedLesson.id) ? 'text-slate-500' : 'text-white'
                  }`}>
                  {importedIds.includes(selectedLesson.id)
                    ? 'Already in Library'
                    : 'Import to My Lessons'}
                </Text>
              </AnimatedPressable>
            </View>
          )}
        </View>
      </CustomBottomSheetModal>
    );
  }
);

export default PreviewBottomSheet;
