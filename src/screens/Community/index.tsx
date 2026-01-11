import { CommonHeader } from '@/components/CommonHeader';
import { Colors } from '@/constants/colors';
import { CommunityLesson, LessonCategory } from '@/types/community';
import MOCK_DATA from '@/utils/mock/community-lessons.json';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { Search, Users } from 'lucide-react-native';
import React, { useRef, useState } from 'react';
import { FlatList, Text, TextInput, View } from 'react-native';
import { CategoryFilter } from './CategoryFilter';
import ContributionBottomSheet from './ContributionBottomSheet';
import { LessonCard } from './LessonCard';
import PreviewBottomSheet from './PreviewBottomSheet';

export default function CommunityLibrary() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<LessonCategory | 'all'>('all');
  const [importedIds, setImportedIds] = useState<string[]>([]);
  const [selectedLesson, setSelectedLesson] = useState<CommunityLesson | null>(null);

  const bottomSheetRef = useRef<BottomSheetModal>(null);
  const handleBottomSheetOpen = (lesson: CommunityLesson) => {
    setSelectedLesson(lesson);
    bottomSheetRef.current?.present();
  };

  const contributionBottomSheetRef = useRef<BottomSheetModal>(null);
  const handleContributionBottomSheetOpen = () => {
    contributionBottomSheetRef.current?.present();
  };

  // Filter logic
  const filteredLessons = (MOCK_DATA as CommunityLesson[]).filter((lesson) => {
    const matchesSearch =
      lesson.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lesson.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || lesson.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleImport = (id: string) => {
    setImportedIds([...importedIds, id]);
    // Add logic to save to local storage/database
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
            icon: Users,
            onPress: () => handleContributionBottomSheetOpen(),
          },
        ]}
        additionalContent={
          <View className="mt-3 flex-row items-center rounded-lg bg-gray-100 px-3 py-1">
            <Search size={20} color={Colors.slate400} />
            <TextInput placeholder="Search lessons..." placeholderTextColor={Colors.slate400} />
          </View>
        }
      />

      {/* Sticky Category Filter */}
      <CategoryFilter selected={selectedCategory} onSelect={setSelectedCategory} />

      {/* Main List */}
      <FlatList
        data={filteredLessons}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <LessonCard
            lesson={item}
            isImported={importedIds.includes(item.id)}
            onImport={() => handleImport(item.id)}
            onPreview={() => handleBottomSheetOpen(item)}
          />
        )}
        contentContainerStyle={{ padding: 16, paddingBottom: 30 }}
        ListEmptyComponent={
          <View className="items-center justify-center py-20">
            <Search size={64} color="#e2e8f0" />
            <Text className="mt-4 text-lg text-slate-600">No lessons found</Text>
          </View>
        }
      />
      {/* Preview Modal */}
      <PreviewBottomSheet
        ref={bottomSheetRef}
        selectedLesson={selectedLesson}
        handleImport={handleImport}
        importedIds={importedIds}
      />

      <ContributionBottomSheet ref={contributionBottomSheetRef} />
    </View>
  );
}
