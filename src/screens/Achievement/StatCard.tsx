import { LucideIcon } from 'lucide-react-native';
import React from 'react';
import { Text, View } from 'react-native';

interface StatCardProps {
  label: string;
  value: number | string;
  icon: LucideIcon;
  color: string;
}

export const StatCard: React.FC<StatCardProps> = ({ label, value, icon: Icon, color }) => (
  <View className="flex-1 items-center rounded-xl bg-white p-4">
    <Icon size={20} color={color} style={{ marginBottom: 5 }} />
    <Text className="text-2xl font-normal">{value}</Text>
    <Text className="text-xs text-slate-600">{label}</Text>
  </View>
);
