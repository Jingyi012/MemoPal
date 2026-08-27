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
    <View className="mb-6 rounded-2xl border-2 border-[#EEE9DC] bg-[#FFFDF8] p-2">
      <View className="flex-row rounded-xl bg-[#F6F3EA] p-1">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.key;

          return (
            <AnimatedPressable
              key={tab.key}
              onPress={() => onTabChange(tab.key)}
              accessibilityRole="button"
              accessibilityState={{ selected: isActive }}
              className={`flex-1 items-center justify-center rounded-lg py-2.5 ${
                isActive ? 'bg-white' : ''
              }`}
              style={
                isActive
                  ? {
                      boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.08)',
                    }
                  : undefined
              }>
              <Text
                numberOfLines={1}
                className={`text-center text-xs font-semibold ${
                  isActive ? 'text-[#7A68E0]' : 'text-[#6B6A80]'
                }`}>
                {tab.label}
              </Text>
            </AnimatedPressable>
          );
        })}
      </View>
    </View>
  );
}
