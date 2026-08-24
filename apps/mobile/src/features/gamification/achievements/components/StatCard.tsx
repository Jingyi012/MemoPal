import { BaseCard } from '@/components/BaseCard';
import { LucideIcon } from 'lucide-react-native';
import React from 'react';
import { Text } from 'react-native';

interface StatCardProps {
  label: string;
  value: number | string;
  icon: LucideIcon;
  color: string;
}

export const StatCard: React.FC<StatCardProps> = ({ label, value, icon: Icon, color }) => (
  <BaseCard className="flex-1 items-center rounded-2xl border-2 border-[#EEE9DC] bg-[#FFFDF8] p-4" padding="none">
    <Icon size={20} color={color} style={{ marginBottom: 5 }} />
    <Text className="text-2xl font-bold text-[#2B2A3D]">{value}</Text>
    <Text className="text-xs text-[#6B6A80]">{label}</Text>
  </BaseCard>
);
