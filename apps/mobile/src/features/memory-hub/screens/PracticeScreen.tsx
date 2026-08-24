import { CommonHeader } from '@/components/CommonHeader';
import { useEnabledMemoryModules } from '@/core/memory';
import { Href, useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { MemoryModuleCard } from '../components/MemoryModuleCard';

export default function PracticeScreen() {
  const router = useRouter();
  const modules = useEnabledMemoryModules();

  return (
    <View className="flex-1 bg-slate-50">
      <CommonHeader
        title="Practice"
        description="Choose a memory technique to continue learning"
        hideBackButton
      />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}>
        <Text className="mb-3 text-base font-bold text-slate-900">Memory techniques</Text>

        {modules.length > 0 ? (
          modules.map((module) => (
            <MemoryModuleCard
              key={module.key}
              module={module}
              onPress={() => router.push(module.route as Href)}
            />
          ))
        ) : (
          <View className="rounded-2xl border border-slate-200 bg-white p-5">
            <Text className="text-sm text-slate-500">
              No practice modules are available right now.
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
