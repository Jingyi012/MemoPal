import React from 'react';
import { Text, View } from 'react-native';

export const CustomLessonCreationTips: React.FC = () => {
  return (
    <View className="rounded-2xl border-2 border-[#E0D9FF] bg-[#EEE9FF] p-4">
      <Text className="mb-2 text-base font-semibold text-[#7A68E0]">
        💡 Tips for Creating Lessons
      </Text>

      <View className="space-y-1">
        <Text className="text-sm text-[#6B6A80]">
          • Choose words from the same category (e.g., all food items)
        </Text>
        <Text className="text-sm text-[#6B6A80]">• Add translations to help with learning</Text>
        <Text className="text-sm text-[#6B6A80]">• Use clear and simple words</Text>
        <Text className="text-sm text-[#6B6A80]">• Make it public to share with the community</Text>
        <Text className="text-sm text-[#6B6A80]">• You can create up to 10 custom lessons</Text>
      </View>
    </View>
  );
};
