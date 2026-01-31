import { Colors } from '@/constants/colors';
import { Milestone } from '@/types/levelAndbadge';
import { LinearGradient } from 'expo-linear-gradient';
import { Lock } from 'lucide-react-native';
import React from 'react';
import { Text, View } from 'react-native';

interface MilestoneItemProps {
  milestone: Milestone & { isLocked: boolean };
}

export const MilestoneItem: React.FC<MilestoneItemProps> = ({ milestone }) => {
  const levelDisplay =
    milestone.conditionType === 'total_xp'
      ? `Level ${Math.floor(milestone.conditionValue / 100)}`
      : milestone.title;

  return (
    <View
      className={`mb-2 flex-row items-center rounded-xl bg-white p-4 shadow-sm ${milestone.isLocked ? 'opacity-60' : ''}`}>
      <LinearGradient
        colors={
          milestone.isLocked
            ? [Colors.gray400, Colors.gray600]
            : [Colors.indigo400, Colors.indigo700]
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          borderRadius: 10,
        }}
        className="mr-3 h-10 w-10 items-center justify-center">
        <Text className="font-semibold text-white">{milestone.conditionValue}</Text>
      </LinearGradient>

      <View className="flex-1">
        <Text className="font-medium">{milestone.title}</Text>
        <Text className="text-xs text-slate-600">
          {milestone.description || milestone.conditionType}
        </Text>
      </View>

      {milestone.isLocked && <Lock size={16} color="#9CA3AF" />}
    </View>
  );
};
