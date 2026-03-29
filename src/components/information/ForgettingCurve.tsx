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
      !isLast && 'border-b border-teal-100/50'
    )}>
    <Text className="font-medium text-teal-800">{label}</Text>
    <View className="flex-row items-center">
      <View className="mr-3 h-1.5 w-16 overflow-hidden rounded-full bg-teal-100">
        <View className={cn('h-full rounded-full', colorClass)} style={{ width: percentage }} />
      </View>
      <Text className="w-8 text-xs font-bold text-teal-900">{percentage}</Text>
    </View>
  </View>
);

export const ForgettingCurveCard: React.FC<Props> = ({ className }) => {
  return (
    <BaseCard
      className={cn('border-teal-100 p-6', className)}
      radius="3xl"
      shadow="sm"
      padding="none"
      style={{
        shadowOpacity: 0.05,
        shadowRadius: 10,
      }}>
      {/* Header with Icon Badge */}
      <View className="mb-5 flex-row items-center">
        <View className="mr-3 rounded-xl bg-teal-300 p-2">
          <Text style={{ fontSize: 16 }}>🧠</Text>
        </View>
        <View>
          <Text className="text-lg font-bold text-slate-900">Retention Power</Text>
          <Text className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            The Forgetting Curve
          </Text>
        </View>
      </View>

      {/* Main Content: The Visual "Curve" */}
      <View className="rounded-2xl border border-teal-50 bg-teal-50/50 p-4">
        <RetentionRow label="Immediate" percentage="100%" colorClass="bg-emerald-500" />
        <RetentionRow label="After 24h" percentage="30%" colorClass="bg-teal-500" />
        <RetentionRow label="After 7 days" percentage="10%" colorClass="bg-rose-400" />
        <RetentionRow label="After 30 days" percentage="2%" colorClass="bg-slate-400" isLast />
      </View>

      {/* Footer Insight */}
      <View className="mt-5 flex-row items-start rounded-xl border border-amber-100 bg-amber-50 p-3">
        <Text className="mr-2 text-amber-600">💡</Text>
        <Text className="flex-1 text-[13px] font-medium leading-4 text-amber-800">
          Reviews act as <Text className="font-bold">anchors</Text>. Each session resets the curve,
          keeping your memories permanent.
        </Text>
      </View>
    </BaseCard>
  );
};
