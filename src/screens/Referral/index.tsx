import { CommonHeader } from '@/components/CommonHeader';
import LoadingView from '@/components/LoadingView';
import { Colors } from '@/constants/colors';
import type { ReferralData } from '@/types/referral';
import data from '@/utils/mock/referral.json';
import * as Clipboard from 'expo-clipboard';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import {
  Check,
  Copy,
  Crown,
  Gift,
  MessageCircle,
  Share2,
  Sparkles,
  Users,
} from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { Alert, Linking, ScrollView, Share, Text, TouchableOpacity, View } from 'react-native';
import { MilestoneRow } from './MilestoneRow';
import { ReferralList } from './ReferralList';
import { ShareIconBtn } from './ShareIconBtn';
import { StatBox } from './StatBox';

// --- API Mocking ---
const fetchReferralData = (): Promise<ReferralData> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(data as ReferralData);
    }, 300);
  });
};

const ReferralScreen: React.FC = () => {
  const router = useRouter();
  const [data, setData] = useState<ReferralData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchReferralData().then((res) => {
      setData(res);
      setLoading(false);
    });
  }, []);

  const handleCopy = async () => {
    if (!data) return;

    await Clipboard.setStringAsync(`${data.referralCode}`);

    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  const handleShare = async (platform: 'whatsapp' | 'native') => {
    if (!data) return;
    const message = `Join me on MemoPal! Use my code ${data.referralCode} to unlock rewards: https://mindpal.app/join/${data.referralCode}`;

    if (platform === 'whatsapp') {
      const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
      Linking.openURL(url).catch(() =>
        Alert.alert('Error', 'WhatsApp is not installed on this device')
      );
    } else {
      // This opens the native iOS/Android share sheet
      try {
        await Share.share({
          message: message,
          title: 'Join MemoPal', // Android only title
        });
      } catch (error) {
        Alert.alert('Error', 'Unable to share');
      }
    }
  };

  if (loading) {
    return <LoadingView description="Loading Rewards" />;
  }

  return (
    <View className="flex-1 bg-slate-50">
      <CommonHeader
        title="Refer & Earn"
        description="Invite friends and unlock premium perks"
        backAction={() => router.back()}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 20, paddingBottom: 60 }}>
        {/* Referral Code Section */}
        <View className="mb-8 rounded-[32px] border border-slate-100 bg-white p-6 shadow-sm">
          <Text className="text-center text-xs font-bold uppercase tracking-widest text-slate-400">
            Your Invite Code
          </Text>
          <TouchableOpacity
            onPress={handleCopy}
            className="my-4 flex-row items-center justify-center rounded-2xl border-2 border-dashed border-indigo-200 bg-indigo-50/30 py-4">
            <Text className="mr-3 text-3xl font-black tracking-[4px] text-indigo-600">
              {data?.referralCode}
            </Text>
            {copied ? (
              <Check size={20} color={Colors.teal500} />
            ) : (
              <Copy size={20} color={Colors.indigo500} />
            )}
          </TouchableOpacity>

          <View className="flex-row justify-between gap-3">
            <ShareIconBtn
              icon={<MessageCircle size={20} color={Colors.green600} />}
              label="WhatsApp"
              onPress={() => handleShare('whatsapp')}
            />
            <ShareIconBtn
              icon={<Share2 size={20} color={Colors.indigo500} />}
              label="Share Link"
              onPress={() => handleShare('native')}
            />
          </View>
        </View>

        {/* Stats Section */}
        <View className="mb-8 flex-row gap-4">
          <StatBox
            icon={<Users size={20} color={Colors.indigo500} />}
            value={data?.referralsCount || 0}
            label="Friends Joined"
          />
          <StatBox
            icon={<Sparkles size={20} color={Colors.yellow500} />}
            value={data?.totalRewardsEarned.xp || 0}
            label="Total XP"
          />
        </View>

        {/* Rewards / Milestones */}
        <View className="mb-8 overflow-hidden rounded-3xl border border-slate-100 bg-white p-2">
          <View className="flex-row p-4">
            <Crown size={20} color={Colors.yellow600} />
            <Text className="ml-1 text-lg font-medium text-slate-800">Milestones</Text>
          </View>
          {data?.milestones.map((milestone, index) => (
            <MilestoneRow
              key={milestone.id}
              refs={milestone.referralsRequired}
              reward={milestone.reward}
              current={data?.referralsCount || 0}
              isLast={index === data.milestones.length - 1}
            />
          ))}
        </View>

        {/* Recent Referrals */}
        {data?.referralsList && data.referralsList.length > 0 && (
          <ReferralList referrals={data?.referralsList || []} />
        )}

        {/* CTA */}
        <TouchableOpacity
          activeOpacity={0.8}
          className="overflow-hidden rounded-2xl shadow-lg shadow-indigo-200">
          <LinearGradient
            colors={[Colors.teal500, Colors.blue500]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            className="flex-row items-center justify-center p-5">
            <Gift className="mr-2" color={Colors.white} size={20} />
            <Text className="ml-1 text-base font-medium text-white">
              Have a Coupon Code? Redeem Here
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

export default ReferralScreen;
