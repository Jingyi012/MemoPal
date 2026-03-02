import { Word } from '@/types/lesson';
import React from 'react';
import { Text, View } from 'react-native';

interface PalacePathProps {
  words: Word[];
}

export const LessonWordList: React.FC<PalacePathProps> = ({ words }) => {
  return (
    <View className="mt-3">
      <View className="mb-3 flex-row items-end justify-between px-1">
        <Text className="text-xl font-bold text-slate-900">Lesson Content</Text>
        <Text className="text-xs font-medium text-slate-500">{words.length} Words</Text>
      </View>

      <View className="overflow-hidden rounded-3xl border border-slate-100 bg-white">
        {words.map((word, index) => (
          <View
            key={word.id}
            className={`p-4 ${index !== words.length - 1 ? 'border-b border-gray-50' : ''}`}>
            <View className="flex-row items-start">
              <View className="mr-3 h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white shadow-sm">
                <Text className="text-xs font-bold text-slate-600">{index + 1}</Text>
              </View>
              <View className="flex-1">
                <Text className="text-base font-bold leading-5 text-slate-900">{word.text}</Text>
                {!!word.meaning && (
                  <Text className="mt-1 text-sm leading-5 text-slate-500">{word.meaning}</Text>
                )}
              </View>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
};
