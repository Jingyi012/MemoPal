import { Colors } from '@/constants/colors';
import { Milestone } from '@/types/levelAndbadge';
import { LinearGradient } from 'expo-linear-gradient';
import { Lock } from 'lucide-react-native';
import React from 'react';
import { Text, View } from 'react-native';

export const MilestoneItem: React.FC<{ milestone: Milestone }> = ({ milestone: m }) => (
  <View
    className={`mb-2 flex-row items-center rounded-xl bg-white p-4 shadow-sm ${m.isLocked ? 'opacity-60' : ''}`}>
    <LinearGradient
      colors={m.isLocked ? [Colors.gray400, Colors.gray600] : [Colors.indigo400, Colors.indigo700]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{
        borderRadius: 10,
      }}
      className="mr-3 h-10 w-10 items-center justify-center">
      <Text className="font-semibold text-white">{m.level}</Text>
    </LinearGradient>

    <View className="flex-1">
      <Text className="font-medium">Level {m.level}</Text>
      <Text className="text-xs text-slate-600">{m.reward}</Text>
    </View>

    {m.isLocked && <Lock size={16} color="#9CA3AF" />}
  </View>
);
