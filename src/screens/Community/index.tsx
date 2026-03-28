import { CommonHeader } from '@/components/CommonHeader';
import { Colors } from '@/constants/colors';
import {
  useCommunityLessonByShareCode,
  useCommunityLessons,
  useImportCommunityLesson,
} from '@/hooks/useCommunityLibrary';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { usePalaceList } from '@/hooks/usePalace';
import { CommunityLesson } from '@/types/community';
import { LessonCategory } from '@/types/lesson';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { Search, Ticket, Users } from 'lucide-react-native';
import React, { useMemo, useRef, useState } from 'react';
import { FlatList, Text, TextInput, View } from 'react-native';
import Toast from 'react-native-toast-message';
import { CategoryFilter } from './CategoryFilter';
import ContributionBottomSheet from './ContributionBottomSheet';
import ImportPalaceBottomSheet from './ImportPalaceBottomSheet';
import { LessonCard } from './LessonCard';
import PreviewBottomSheet from './PreviewBottomSheet';
import ShareCodeBottomSheet from './ShareCodeBottomSheet';

export default function CommunityLibrary() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<LessonCategory | 'all'>('all');
  const [importedIds, setImportedIds] = useState<string[]>([]);
  const [selectedLesson, setSelectedLesson] = useState<CommunityLesson | null>(null);
  const [pendingImportLesson, setPendingImportLesson] = useState<CommunityLesson | null>(null);
  const debouncedSearchQuery = useDebouncedValue(searchQuery, 350);

  const {
    data: lessonsResponse,
    isLoading,
    isRefetching,
    refetch: refetchCommunityLessons,
  } = useCommunityLessons({
    search: debouncedSearchQuery,
    category: selectedCategory,
    pageNumber: 1,
    pageSize: 100,
  });
  const { data: palaces = [] } = usePalaceList();
  const importLessonMutation = useImportCommunityLesson();
  const lessonByShareCodeMutation = useCommunityLessonByShareCode();

  const lessons = lessonsResponse?.items ?? [];
  const availablePalaces = useMemo(
    () => palaces.filter((palace) => !palace.isDeleted && !palace.isLocked),
    [palaces]
  );

  const bottomSheetRef = useRef<BottomSheetModal>(null);
  const handleBottomSheetOpen = (lesson: CommunityLesson) => {
    setSelectedLesson(lesson);
    bottomSheetRef.current?.present();
  };

  const contributionBottomSheetRef = useRef<BottomSheetModal>(null);
  const handleContributionBottomSheetOpen = () => {
    contributionBottomSheetRef.current?.present();
  };
  const shareCodeBottomSheetRef = useRef<BottomSheetModal>(null);
  const handleShareCodeBottomSheetOpen = () => {
    shareCodeBottomSheetRef.current?.present();
  };
  const importBottomSheetRef = useRef<BottomSheetModal>(null);

  const handleImportRequest = (id: string) => {
    if (importedIds.includes(id)) return;

    const lesson =
      lessons.find((item) => item.id === id) ?? (selectedLesson && selectedLesson.id === id
        ? selectedLesson
        : null);
    if (!lesson) return;

    setPendingImportLesson(lesson);
    importBottomSheetRef.current?.present();
  };

  const handleFindByShareCode = async (shareCodeInput: string) => {
    const normalizedCode = shareCodeInput.trim().toUpperCase();
    if (!normalizedCode) {
      Toast.show({
        type: 'error',
        text1: 'Share code required',
        text2: 'Enter a lesson share code first.',
      });
      return;
    }

    try {
      const lesson = await lessonByShareCodeMutation.mutateAsync(normalizedCode);
      setSelectedLesson(lesson);
      shareCodeBottomSheetRef.current?.dismiss();
      bottomSheetRef.current?.present();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to resolve share code.';
      Toast.show({
        type: 'error',
        text1: 'Share code not found',
        text2: message,
      });
    }
  };

  const handleImportToPalace = async (palaceId: string) => {
    if (!pendingImportLesson || importLessonMutation.isPending) return;

    try {
      await importLessonMutation.mutateAsync({
        lesson: pendingImportLesson,
        palaceId,
      });
      setImportedIds((prev) =>
        prev.includes(pendingImportLesson.id) ? prev : [...prev, pendingImportLesson.id]
      );
      importBottomSheetRef.current?.dismiss();
      Toast.show({
        type: 'success',
        text1: 'Lesson imported',
        text2: `Added "${pendingImportLesson.title}" to your palace.`,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to import lesson.';
      Toast.show({
        type: 'error',
        text1: 'Import failed',
        text2: message,
      });
    }
  };

  const handleRefresh = async () => {
    await refetchCommunityLessons();
  };

  return (
    <View className="flex-1">
      {/* Header Container */}
      <CommonHeader
        title={'Community Library'}
        description={'Discover lessons from creators'}
        hideBackButton
        actions={[
          {
            icon: Ticket,
            onPress: () => handleShareCodeBottomSheetOpen(),
          },
          {
            icon: Users,
            onPress: () => handleContributionBottomSheetOpen(),
          },
        ]}
        additionalContent={
          <View className="mt-3 flex-row items-center rounded-lg bg-gray-100 px-3 py-1">
            <Search size={20} color={Colors.slate400} />
            <TextInput
              className="flex-1"
              placeholder="Search lessons..."
              placeholderTextColor={Colors.slate400}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        }
      />

      {/* Sticky Category Filter */}
      <CategoryFilter selected={selectedCategory} onSelect={setSelectedCategory} />

      {/* Main List */}
      <FlatList
        data={lessons}
        keyExtractor={(item) => item.id}
        refreshing={isRefetching}
        onRefresh={handleRefresh}
        renderItem={({ item }) => (
          <LessonCard
            lesson={item}
            isImported={importedIds.includes(item.id)}
            onImport={() => handleImportRequest(item.id)}
            onPreview={() => handleBottomSheetOpen(item)}
          />
        )}
        contentContainerStyle={{ padding: 16, paddingBottom: 30 }}
        ListEmptyComponent={
          <View className="items-center justify-center py-20">
            <Search size={64} color="#e2e8f0" />
            <Text className="mt-4 text-lg text-slate-600">
              {isLoading ? 'Loading community lessons...' : 'No lessons found'}
            </Text>
          </View>
        }
      />
      {/* Preview Modal */}
      <PreviewBottomSheet
        ref={bottomSheetRef}
        selectedLesson={selectedLesson}
        handleImport={handleImportRequest}
        importedIds={importedIds}
      />

      <ContributionBottomSheet ref={contributionBottomSheetRef} />
      <ShareCodeBottomSheet
        ref={shareCodeBottomSheetRef}
        isFinding={lessonByShareCodeMutation.isPending}
        onFind={handleFindByShareCode}
      />
      <ImportPalaceBottomSheet
        ref={importBottomSheetRef}
        palaces={availablePalaces}
        requiredWordCount={pendingImportLesson?.words.length ?? 0}
        isImporting={importLessonMutation.isPending}
        onSelectPalace={handleImportToPalace}
      />
    </View>
  );
}
