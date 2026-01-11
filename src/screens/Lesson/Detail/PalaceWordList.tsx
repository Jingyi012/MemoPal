import React from 'react';
import { Text, View } from 'react-native';

interface Word {
  id: string;
  text: string;
  translation: string;
  locationId: string;
}

interface PalacePathProps {
  words: Word[];
}

export const PalaceWordList: React.FC<PalacePathProps> = ({ words }) => {
  return (
    <View className="mt-3">
      <View className="mb-3 flex-row items-end justify-between px-1">
        <Text className="text-xl font-bold text-slate-900">Lesson Content</Text>
        <Text className="text-xs font-medium text-slate-500">{words.length} Locations</Text>
      </View>

      <View className="overflow-hidden rounded-3xl border border-slate-100 bg-white">
        {words.map((word, index) => (
          <View
            key={word.id}
            className={`flex-row items-center p-4 ${
              index !== words.length - 1 ? 'border-b border-gray-50' : ''
            }`}>
            <View className="h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white shadow-sm">
              <Text className="text-xs font-bold text-slate-600">{index + 1}</Text>
            </View>
            <View className="ml-4 flex-1">
              <Text className="text-xs font-bold uppercase tracking-tighter text-slate-400">
                {word.locationId}
              </Text>
              <Text className="text-base font-bold leading-5 text-slate-900">{word.text}</Text>
            </View>
            <Text className="text-sm italic text-slate-500" numberOfLines={1}>
              {word.translation}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
};
