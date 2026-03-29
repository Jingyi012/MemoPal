import AnimatedPressable from '@/components/AnimatedPressable';
import { AppImage } from '@/components/AppImage';
import { BaseCard } from '@/components/BaseCard';
import { CommunityLesson } from '@/types/community';
import { BookOpen, Check, Crown, Download } from 'lucide-react-native';
import React from 'react';
import { Text, View } from 'react-native';

interface Props {
  lesson: CommunityLesson;
  isImported: boolean;
  onImport: () => void;
  onPreview: () => void;
}

export const LessonCard = ({ lesson, isImported, onImport, onPreview }: Props) => (
  <BaseCard className="mb-4 rounded-3xl p-4" padding="none">
    <View className="mb-3 flex-row items-start">
      <View className="h-11 w-11 items-center justify-center rounded-xl bg-teal-500">
        <BookOpen size={20} color="white" />
      </View>
      <View className="ml-3 flex-1">
        <View className="flex-row items-center justify-between">
          <Text className="flex-1 text-lg font-bold text-slate-800" numberOfLines={1}>
            {lesson.title}
          </Text>
          {lesson.isPremium && <Crown size={16} color="#eab308" />}
        </View>
        <Text className="mt-1 text-sm text-slate-600" numberOfLines={2}>
          {lesson.description}
        </Text>
        {lesson.tags.length > 0 && (
          <View className="mt-2 flex-row flex-wrap">
            {lesson.tags.map((tag) => (
              <View key={tag} className="mb-2 mr-2 rounded-full bg-gray-100 px-2 py-1">
                <Text className="text-xs text-slate-600">#{tag}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </View>

    <View className="flex-row items-center">
      <View className="h-10 w-10 overflow-hidden rounded-full">
        {lesson.creator.avatarUrl ? (
          <AppImage source={{ uri: lesson.creator.avatarUrl }} className="h-10 w-10" />
        ) : (
          <View className="h-10 w-10 items-center justify-center rounded-full bg-blue-500">
            <Text className="font-bold text-white">{lesson.creator.name.charAt(0)}</Text>
          </View>
        )}
      </View>
      <Text className="ml-2 flex-1 text-slate-600" numberOfLines={1}>
        {lesson.creator.name}
      </Text>
    </View>

    <View className="mb-3 flex-row items-center justify-end">
      <Text className="rounded-lg bg-teal-50 px-2 py-1 text-xs font-medium text-teal-600">
        {lesson.words.length} words
      </Text>
    </View>

    <View className="flex-row gap-2">
      <AnimatedPressable
        onPress={onPreview}
        className="h-10 flex-1 items-center justify-center rounded-full border border-slate-200 bg-white">
        <Text className="text-sm font-semibold text-slate-700">Preview</Text>
      </AnimatedPressable>

      <AnimatedPressable
        onPress={onImport}
        disabled={isImported}
        className={`h-10 flex-1 flex-row items-center justify-center rounded-full ${
          isImported ? 'border border-green-200 bg-green-50' : 'bg-teal-600'
        }`}>
        {isImported ? (
          <>
            <Check size={16} color="#16a34a" />
            <Text className="ml-1.5 text-sm font-semibold text-green-600">Imported</Text>
          </>
        ) : (
          <>
            <Download size={16} color="white" />
            <Text className="ml-1.5 text-sm font-semibold text-white">Import</Text>
          </>
        )}
      </AnimatedPressable>
    </View>
  </BaseCard>
);
