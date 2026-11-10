import { BaseCard } from '@/components/BaseCard';
import { ReferralUser } from '@/features/referral/types/referral';
import React, { useEffect, useMemo, useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

interface ReferralListProps {
  referrals: ReferralUser[];
  pageSize?: number;
}

export const ReferralList: React.FC<ReferralListProps> = ({ referrals, pageSize = 10 }) => {
  const [visibleCount, setVisibleCount] = useState(pageSize);

  useEffect(() => {
    setVisibleCount(pageSize);
  }, [pageSize, referrals.length]);

  const visibleReferrals = useMemo(
    () => referrals.slice(0, visibleCount),
    [referrals, visibleCount]
  );

  const hasMore = visibleCount < referrals.length;

  if (!referrals || referrals.length === 0) return null;

  return (
    <BaseCard className="mb-8 rounded-3xl p-2">
      <View className="flex-row p-3">
        <Text className="text-xl">👥</Text>
        <Text className="ml-1 text-lg font-medium text-ink">Referral Friends</Text>
      </View>
      <Text className="px-3 pb-2 text-xs text-ink-soft">
        Showing {visibleReferrals.length} of {referrals.length}
      </Text>

      {visibleReferrals.map((user, i) => {
        const isPremium = user.isPremium;
        const isLast = i === visibleReferrals.length - 1;

        return (
          <View
            key={user.referralId}
            className={`flex-row items-center justify-between p-3 ${
              !isLast ? 'border-b border-line' : ''
            }`}>
            <View className="flex-row items-center">
              <View className="h-10 w-10 items-center justify-center rounded-full bg-tint-sky">
                <Text className="font-bold text-primary">
                  {user.displayName.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View className="ml-3">
                <Text className="font-medium text-ink">{user.displayName}</Text>
                <Text className="text-xs text-ink-soft">{new Date(user.redeemedAt).toLocaleDateString()}</Text>
              </View>
            </View>

            <View
          className={`rounded-full px-2 py-1 ${isPremium ? 'bg-tint-sun' : 'bg-tint-mint'}`}>
              <Text
                className={`text-xs font-bold uppercase ${
                  isPremium ? 'text-ink' : 'text-ink-soft'
                }`}>
                {isPremium ? 'premium' : 'active'}
              </Text>
            </View>
          </View>
        );
      })}

      {hasMore ? (
        <TouchableOpacity
          onPress={() => setVisibleCount((prev) => Math.min(prev + pageSize, referrals.length))}
          className="m-3 items-center rounded-xl bg-tint-peach px-4 py-3">
          <Text className="text-sm font-semibold text-ink-soft">Load More</Text>
        </TouchableOpacity>
      ) : null}
    </BaseCard>
  );
};
