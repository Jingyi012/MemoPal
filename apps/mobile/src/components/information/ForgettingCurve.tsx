import { BaseCard } from '@/components/BaseCard';
import { cn } from '@/utils/cn';
import React from 'react';
import { Text, View } from 'react-native';

interface Props {
  className?: string;
}

const RetentionRow = ({
  label,
  percentage,
  colorClass,
  isLast,
}: {
  label: string;
  percentage: any;
  colorClass: string;
  isLast?: boolean;
}) => (
  <View
    className={cn(
      'flex-row items-center justify-between py-2',
      !isLast && 'border-b border-[#EEE9DC]'
    )}>
    <Text className="font-medium text-[#6B6A80]">{label}</Text>
    <View className="flex-row items-center">
      <View className="mr-3 h-1.5 w-16 overflow-hidden rounded-full bg-[#EEE9DC]">
        <View className={cn('h-full rounded-full', colorClass)} style={{ width: percentage }} />
      </View>
      <Text className="w-8 text-xs font-bold text-[#2B2A3D]">{percentage}</Text>
    </View>
  </View>
);

export const ForgettingCurveCard: React.FC<Props> = ({ className }) => {
  return (
    <BaseCard
      className={cn('border-2 border-[#EEE9DC] p-6', className)}
      radius="3xl"
      shadow="sm"
      padding="none"
      style={{
        shadowOpacity: 0.05,
        shadowRadius: 10,
      }}>
      {/* Header with Icon Badge */}
      <View className="mb-5 flex-row items-center">
        <View className="mr-3 rounded-xl bg-[#EEE9FF] p-2">
          <Text style={{ fontSize: 16 }}>🧠</Text>
        </View>
        <View>
          <Text className="text-lg font-bold text-[#2B2A3D]">Retention Power</Text>
          <Text className="text-xs font-semibold uppercase tracking-wider text-[#6B6A80]">
            The Forgetting Curve
          </Text>
        </View>
      </View>

      {/* Main Content: The Visual "Curve" */}
      <View className="rounded-2xl border-2 border-[#EEE9DC] bg-[#F6F3EA] p-4">
        <RetentionRow label="Immediate" percentage="100%" colorClass="bg-[#3FB87F]" />
        <RetentionRow label="After 24h" percentage="30%" colorClass="bg-[#4FC0E8]" />
        <RetentionRow label="After 7 days" percentage="10%" colorClass="bg-[#FF6F91]" />
        <RetentionRow label="After 30 days" percentage="2%" colorClass="bg-[#9A97A7]" isLast />
      </View>

      {/* Footer Insight */}
      <View className="mt-5 flex-row items-start rounded-xl border-2 border-[#FFE6A3] bg-[#FFF7E0] p-3">
        <Text className="mr-2 text-[#F2A900]">💡</Text>
        <Text className="flex-1 text-[13px] font-medium leading-4 text-[#6B6A80]">
          Reviews act as <Text className="font-bold">anchors</Text>. Each session resets the curve,
          keeping your memories permanent.
        </Text>
      </View>
    </BaseCard>
  );
};
