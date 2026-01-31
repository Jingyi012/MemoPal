import { LessonWordForm } from '@/types/lesson';
import data from '@/utils/mock/palaces.json';
import React, { useRef } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { StepNavigationFooter } from '../../../components/StepNavigationFooter';
import { LocationCard } from './LocationCard';
import { WordEditorSheet, WordEditorSheetRef } from './WordEditorSheet';

interface Props {
  palaceId: string;
  words: LessonWordForm[];
  onChangeWords: React.Dispatch<React.SetStateAction<LessonWordForm[]>>;
  onPrevious: () => void;
  onNext: () => void;
}

export function LocationCanvasStep({ palaceId, words, onChangeWords, onPrevious, onNext }: Props) {
  const locations = data.locations.filter((x) => x.palaceId === palaceId);
  const sheetRef = useRef<WordEditorSheetRef>(null);
  const wordsByLocation = Object.fromEntries(words.map((w) => [w.locationId, w]));

  const progress = (words.length / locations.length) * 100;

  const handleConfirm = (locationId: string, text: string, meaning?: string) => {
    onChangeWords((prev) => {
      const filtered = prev.filter((w) => w.locationId !== locationId);
      return [...filtered, { locationId, text, meaning }];
    });
  };

  return (
    <View className="flex-1 bg-slate-50">
      {/* Visual Progress Header */}
      <View className="bg-white px-5 py-4 shadow-sm">
        <View className="mb-2 flex-row items-center justify-between">
          <Text className="text-sm font-bold text-slate-800">Placement Progress</Text>
          <Text className="text-xs font-medium text-teal-600">
            {words.length} / {locations.length}
          </Text>
        </View>
        <View className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
          <View className="h-full rounded-full bg-teal-500" style={{ width: `${progress}%` }} />
        </View>
      </View>

      <ScrollView
        className="flex-1 px-4 pt-4"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 60 }}>
        <Text className="mb-4 ml-1 text-[11px] font-black uppercase tracking-widest text-slate-400">
          Tap a location to place a word
        </Text>
        <View className="flex-row flex-wrap gap-4">
          {locations.map((location) => (
            <LocationCard
              key={location.id}
              location={location}
              word={wordsByLocation[location.id]}
              onPress={() =>
                sheetRef.current?.open({
                  location: location,
                  existingWord: wordsByLocation[location.id],
                })
              }
            />
          ))}
        </View>
        <View className="h-20" />
      </ScrollView>

      {/* Footer with Floating Effect */}
      <StepNavigationFooter
        previousLabel="Previous"
        nextLabel={`Review`}
        onPrevious={onPrevious}
        onNext={onNext}
        disableNext={words.length === 0}
      />

      <WordEditorSheet ref={sheetRef} onConfirm={handleConfirm} />
    </View>
  );
}
