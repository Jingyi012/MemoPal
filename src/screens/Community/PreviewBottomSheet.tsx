import AnimatedPressable from '@/components/AnimatedPressable';
import { AppImage } from '@/components/AppImage';
import { BaseCard } from '@/components/BaseCard';
import CustomBottomSheetModal from '@/components/CustomBottomSheetModal';
import { Colors } from '@/constants/colors';
import { CommunityLesson } from '@/types/community';
import { BottomSheetModal, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import * as Clipboard from 'expo-clipboard';
import { BadgeCheck, BookOpen, Copy, Crown, Download } from 'lucide-react-native';
import React, { forwardRef } from 'react';
import { Text, View } from 'react-native';
import Toast from 'react-native-toast-message';

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
                    <View className="h-10 w-10 overflow-hidden rounded-full">
                      {selectedLesson.creator.avatarUrl ? (
                        <AppImage source={{ uri: selectedLesson.creator.avatarUrl }} className="h-10 w-10" />
                      ) : (
                        <View className="h-10 w-10 items-center justify-center rounded-full bg-blue-500">
                          <Text className="font-bold text-white">
                            {selectedLesson.creator.name.charAt(0)}
                          </Text>
                        </View>
                      )}
                    </View>
                    <View className="ml-3 flex-1" style={{ minWidth: 0 }}>
                      <Text className="text-[10px] font-bold uppercase text-slate-400">
                        Creator
                      </Text>
                      <View className="flex-row items-center">
                        <Text className="flex-1 font-semibold text-slate-900" numberOfLines={1}>
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

                  {/* Description */}
                  <View className="mt-5">
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
                    <AnimatedPressable
                      onPress={async () => {
                        await Clipboard.setStringAsync(selectedLesson.shareCode);
                        Toast.show({
                          type: 'success',
                          text1: 'Share code copied',
                          text2: selectedLesson.shareCode,
                        });
                      }}
                      className="rounded-lg bg-slate-500 p-2">
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

                    <BaseCard className="overflow-hidden rounded-3xl" padding="none">
                      {selectedLesson.words.map((w, index) => (
                        <View
                          key={index}
                          className={`p-4 ${index !== selectedLesson.words.length - 1 ? 'border-b border-gray-50' : ''}`}>
                          <View className="flex-row items-start">
                            <View className="mr-3 h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white shadow-sm">
                              <Text className="text-xs font-bold text-slate-600">{index + 1}</Text>
                            </View>
                            <View className="flex-1">
                              <Text className="text-base font-bold leading-5 text-slate-900">
                                {w.word}
                              </Text>
                              {!!w.meaning && (
                                <Text className="mt-1 text-sm leading-5 text-slate-500">
                                  {w.meaning}
                                </Text>
                              )}
                            </View>
                          </View>
                        </View>
                      ))}
                    </BaseCard>
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

PreviewBottomSheet.displayName = 'PreviewBottomSheet';

export default PreviewBottomSheet;
