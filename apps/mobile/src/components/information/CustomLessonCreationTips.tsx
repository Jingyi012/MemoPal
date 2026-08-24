import React from 'react';
import { Text, View } from 'react-native';

export const CustomLessonCreationTips: React.FC = () => {
  return (
    <View className="rounded-2xl bg-teal-50 p-4">
      <Text className="mb-2 text-base font-semibold text-teal-900">
        💡 Tips for Creating Lessons
      </Text>

      <View className="space-y-1">
        <Text className="text-sm text-teal-700">
          • Choose words from the same category (e.g., all food items)
        </Text>
        <Text className="text-sm text-teal-700">• Add translations to help with learning</Text>
        <Text className="text-sm text-teal-700">• Use clear and simple words</Text>
        <Text className="text-sm text-teal-700">• Make it public to share with the community</Text>
        <Text className="text-sm text-teal-700">• You can create up to 10 custom lessons</Text>
      </View>
    </View>
  );
};
