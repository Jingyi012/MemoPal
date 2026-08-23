import { Colors } from '@/constants/colors';
import { Brain } from 'lucide-react-native';
import React from 'react';
import { Text, View } from 'react-native';

export default function MemoryRetentionCard({ retentionRate }: { retentionRate: number }) {
  return (
    <View className="rounded-2xl bg-white/20 p-4 backdrop-blur-sm">
      <View className="mb-2 flex-row items-center justify-between">
        <View className="flex-row items-center gap-2">
          <Brain className="h-5 w-5" color={Colors.white} />
          <Text className="text-sm text-white">Memory Retention</Text>
        </View>
        <Text className="text-white">{Math.round(retentionRate)}%</Text>
      </View>
      <View className="h-3 overflow-hidden rounded-full bg-white/20">
        <View
          className={`h-full rounded-full transition-all duration-500 ${
            retentionRate >= 90
              ? 'bg-green-400'
              : retentionRate >= 60
                ? 'bg-yellow-400'
                : 'bg-red-400'
          }`}
          style={{ width: `${retentionRate}%` }}
        />
      </View>
      <Text className="mt-2 text-xs text-teal-100">
        {retentionRate < 30 && '⚠️ Critical! Review now to prevent forgetting'}
        {retentionRate >= 30 && retentionRate < 60 && '📉 Declining. Review soon to strengthen memory'}
        {retentionRate >= 60 && retentionRate < 90 && '📊 Good progress. Keep reviewing to master!'}
        {retentionRate >= 90 && "🎉 Excellent! You've mastered this lesson"}
      </Text>
    </View>
  );
}
