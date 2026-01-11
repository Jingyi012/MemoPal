import AnimatedPressable from '@/components/AnimatedPressable';
import { Colors } from '@/constants/colors';
import { CommunityLesson } from '@/types/community';
import { BookOpen, Check, Crown, Download, Star } from 'lucide-react-native';
import React from 'react';
import { Image, Text, View } from 'react-native';

interface Props {
  lesson: CommunityLesson;
  isImported: boolean;
  onImport: () => void;
  onPreview: () => void;
}

export const LessonCard = ({ lesson, isImported, onImport, onPreview }: Props) => (
  <View className="mb-4 rounded-3xl border border-gray-100 bg-white p-4 shadow-sm">
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
      {lesson.creator.avatarUrl ? (
        <Image
          source={{ uri: lesson.creator.avatarUrl }}
          className="h-10 w-10"
          style={{ borderRadius: 30 }}
        />
      ) : (
        <View className="h-10 w-10 items-center justify-center rounded-full bg-blue-500">
          <Text className="font-bold text-white">{lesson.creator.name.charAt(0)}</Text>
        </View>
      )}
      <Text className="ml-2 text-slate-600">{lesson.creator.name}</Text>
    </View>

    <View className="mb-4 flex-row items-center justify-between">
      <View className="flex-row items-center">
        <Star size={14} color={Colors.yellow500} fill={Colors.yellow500} />
        <Text className="ml-1 text-xs font-bold text-slate-600">{lesson.stats.rating}</Text>
        <Text className="ml-1 text-xs text-slate-400">({lesson.stats.reviewCount})</Text>
        <View className="mx-2 h-1 w-1 rounded-full bg-gray-300" />
        <Download size={14} color={Colors.slate400} />
        <Text className="ml-1 text-xs text-slate-600">{lesson.stats.usageCount}</Text>
      </View>
      <Text className="rounded-lg bg-teal-50 px-2 py-1 text-xs font-medium text-teal-600">
        {lesson.words.length} words
      </Text>
    </View>

    <View className="flex-row gap-2">
      <AnimatedPressable
        onPress={onPreview}
        className="h-12 flex-1 items-center justify-center rounded-xl bg-gray-100">
        <Text className="font-semibold text-slate-700">Preview</Text>
      </AnimatedPressable>

      <AnimatedPressable
        onPress={onImport}
        disabled={isImported}
        className={`h-12 flex-1 flex-row items-center justify-center rounded-xl ${
          isImported ? 'bg-green-50' : 'bg-teal-600'
        }`}>
        {isImported ? (
          <>
            <Check size={18} color="#16a34a" />
            <Text className="ml-2 font-semibold text-green-600">Imported</Text>
          </>
        ) : (
          <>
            <Download size={18} color="white" />
            <Text className="ml-2 font-semibold text-white">Import</Text>
          </>
        )}
      </AnimatedPressable>
    </View>
  </View>
);
