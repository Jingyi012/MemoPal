import { AppText as Text } from '@/components/ui/AppText';
import { appTextStyles, fontFamilies } from '@/theme/designSystem';
import { BaseCard } from '@/components/BaseCard';
import { cn } from '@/utils/cn';
import React from 'react';
import { View } from 'react-native';

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
      !isLast && 'border-b border-[#E5DFFF]'
    )}>
    <Text className="text-[#6B6A80]" style={{ fontFamily: fontFamilies.bodySemibold }}>{label}</Text>
    <View className="flex-row items-center">
      <View className="mr-3 h-1.5 w-16 overflow-hidden rounded-full bg-line">
        <View className={cn('h-full rounded-full', colorClass)} style={{ width: percentage }} />
      </View>
      <Text className="w-8 text-[#2B2A3D]" style={[appTextStyles.caption, { fontFamily: fontFamilies.bodyBold }]}>{percentage}</Text>
    </View>
  </View>
);

export const ForgettingCurveCard: React.FC<Props> = ({ className }) => {
  return (
    <BaseCard
      className={cn('border-2 border-[#E5DFFF] bg-white p-6', className)}
      radius="3xl"
      shadow="sm"
      padding="none"
      style={{
        boxShadow: '0px 2px 10px rgba(43, 42, 61, 0.05)',
      }}>
      {/* Header with Icon Badge */}
      <View className="mb-5 flex-row items-center">
        <View className="mr-3 rounded-xl bg-tint-sky p-2">
          <Text style={{ fontSize: appTextStyles.cardTitle.fontSize }}>🧠</Text>
        </View>
        <View>
          <Text className="text-[#2B2A3D]" style={[appTextStyles.sectionTitle, { fontFamily: fontFamilies.bodyBold }]}>Retention Power</Text>
          <Text className="uppercase tracking-wider text-[#6B6A80]" style={[appTextStyles.caption, { fontFamily: fontFamilies.bodySemibold }]}>
            The Forgetting Curve
          </Text>
        </View>
      </View>

      {/* Main Content: The Visual "Curve" */}
      <View className="rounded-2xl border-2 border-line-mint bg-tint-mint p-4">
        <RetentionRow label="Immediate" percentage="100%" colorClass="bg-[#3FB87F]" />
        <RetentionRow label="After 24h" percentage="30%" colorClass="bg-[#4FC0E8]" />
        <RetentionRow label="After 7 days" percentage="10%" colorClass="bg-[#FF6F91]" />
        <RetentionRow label="After 30 days" percentage="2%" colorClass="bg-[#9A97A7]" isLast />
      </View>

      {/* Footer Insight */}
      <View className="mt-5 flex-row items-start rounded-xl border-2 border-line-sun bg-tint-sun p-3">
        <Text className="mr-2 text-[#F2A900]">💡</Text>
        <Text className="flex-1 leading-4 text-[#6B6A80]" style={[appTextStyles.small, { fontFamily: fontFamilies.bodySemibold }]}>
          Reviews act as <Text style={{ fontFamily: fontFamilies.bodyBold }}>anchors</Text>. Each session resets the curve,
          keeping your memories permanent.
        </Text>
      </View>
    </BaseCard>
  );
};
