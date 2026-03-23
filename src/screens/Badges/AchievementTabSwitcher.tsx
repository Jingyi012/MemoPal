import AnimatedPressable from '@/components/AnimatedPressable';
import React from 'react';
import { Text, View } from 'react-native';

export type AchievementTab = 'overview' | 'badges' | 'milestones' | 'missions';

const TABS: { key: AchievementTab; label: string }[] = [
  { key: 'overview', label: 'Overview' },
  { key: 'badges', label: 'Badges' },
  { key: 'milestones', label: 'Milestones' },
  { key: 'missions', label: 'Missions' },
];

interface AchievementTabSwitcherProps {
  activeTab: AchievementTab;
  onTabChange: (tab: AchievementTab) => void;
}

export function AchievementTabSwitcher({ activeTab, onTabChange }: AchievementTabSwitcherProps) {
  return (
    <View className="mb-6 rounded-2xl bg-white p-3">
      <View className="flex-row flex-wrap gap-2">
        {TABS.map((tab) => (
          <AnimatedPressable
            key={tab.key}
            onPress={() => onTabChange(tab.key)}
            className={`rounded-xl px-3 py-2 ${activeTab === tab.key ? 'bg-teal-600' : 'bg-slate-100'}`}>
            <Text
              className={`text-sm font-semibold ${
                activeTab === tab.key ? 'text-white' : 'text-slate-700'
              }`}>
              {tab.label}
            </Text>
          </AnimatedPressable>
        ))}
      </View>
    </View>
  );
}

