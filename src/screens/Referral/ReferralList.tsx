import { Colors } from '@/constants/colors';
import { ReferralUser } from '@/types/referral';
import { Users } from 'lucide-react-native';
import React from 'react';
import { Text, View } from 'react-native';

interface ReferralListProps {
  referrals: ReferralUser[];
}

export const ReferralList: React.FC<ReferralListProps> = ({ referrals }) => {
  if (!referrals || referrals.length === 0) return null;

  return (
    <View className="mb-8 rounded-3xl border border-slate-100 bg-white p-2 shadow-sm">
      <View className="flex-row p-3">
        <Users size={20} color={Colors.indigo500} />
        <Text className="ml-1 text-lg font-medium text-slate-800">Your Referrals</Text>
      </View>

      {referrals.map((user, i) => {
        const isPremium = user.status.toLowerCase() === 'premium';
        const isLast = i === referrals.length - 1;

        return (
          <View
            key={user.id}
            className={`flex-row items-center justify-between p-3 ${
              !isLast ? 'border-b border-slate-50' : ''
            }`}>
            <View className="flex-row items-center">
              <View className="h-10 w-10 items-center justify-center rounded-full bg-indigo-50">
                <Text className="font-bold text-indigo-600">
                  {user.name.charAt(0).toUpperCase()}
                </Text>
              </View>
              <Text className="ml-3 font-medium text-slate-700">{user.name}</Text>
            </View>

            <View
              className={`rounded-full px-2 py-1 ${isPremium ? 'bg-amber-100' : 'bg-slate-100'}`}>
              <Text
                className={`text-xs font-bold uppercase ${
                  isPremium ? 'text-amber-700' : 'text-slate-500'
                }`}>
                {user.status}
              </Text>
            </View>
          </View>
        );
      })}
    </View>
  );
};
