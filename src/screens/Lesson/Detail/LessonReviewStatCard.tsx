import { LucideIcon } from 'lucide-react-native';
import React from 'react';
import { Text, View } from 'react-native';

interface Props {
  label: string;
  value: string;
  Icon: LucideIcon;
  iconColor: string;
}

export const LessonReviewStatCard: React.FC<Props> = ({ label, value, Icon, iconColor }) => {
  return (
    <View className="min-w-36 flex-1 rounded-xl border-slate-200 bg-white p-4 shadow-sm">
      <View className="mb-2 flex-row items-center gap-2">
        <Icon size={16} color={iconColor} />
        <Text className="text-xs text-slate-600">{label}</Text>
      </View>
      <Text className="font-medium text-slate-800">{value}</Text>
    </View>
  );
};
