import { referralApi } from '@/features/referral/api/referral';
import { BaseCard } from '@/components/BaseCard';
import { CommonHeader } from '@/components/CommonHeader';
import { useTranslation } from '@/core/i18n/useTranslation';
import LoadingView from '@/components/LoadingView';
import { memopalTheme as theme } from '@/theme/memopalTheme';
import { NotificationType } from '@/enums/notificationType';
import { useNotificationMutations, useNotifications } from '@/features/notifications/hooks/useNotifications';
import { syncEntitlementToLocal } from '@/features/subscription/services/subscription.service';
import type { Notification } from '@/features/notifications/types/notification';
import type { ReferralSummary } from '@/features/referral/types/referral';
import * as Clipboard from 'expo-clipboard';
import { useRouter } from 'expo-router';
import { Check, Copy, MessageCircle, Share2 } from '@/core/icons';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Linking,
  Modal,
  RefreshControl,
  ScrollView,
  Share,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Toast from 'react-native-toast-message';
import { MilestoneRow } from '../components/MilestoneRow';
import { ReferralList } from '../components/ReferralList';
import { ShareIconBtn } from '../components/ShareIconBtn';
import { StatBox } from '../components/StatBox';

const ReferralScreen: React.FC = () => {
  const router = useRouter();
  const { t } = useTranslation('referral');
  const { data: notifications = [] } = useNotifications();
  const { markAsRead } = useNotificationMutations();
  const [summary, setSummary] = useState<ReferralSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [redeemCode, setRedeemCode] = useState('');
  const [redeeming, setRedeeming] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [rewardNotice, setRewardNotice] = useState<Notification | null>(null);
  const [lastShownRewardNoticeId, setLastShownRewardNoticeId] = useState<string | null>(null);

  const loadSummary = useCallback(async (silent = false) => {
    try {
      if (silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const data = await referralApi.getMySummary();
      setSummary(data);
      setLoadError(null);
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        'Could not load referral data. Check your connection and try again.';
      setLoadError(message);
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSummary();
  }, [loadSummary]);

  useEffect(() => {
    const latestUnreadReferralNotice = notifications.find(
      (item) =>
        !item.isRead &&
        (item.type === NotificationType.REFERRAL ||
          (item.referenceType ?? '').toLowerCase() === NotificationType.REFERRAL)
    );

    if (!latestUnreadReferralNotice) {
      return;
    }

    if (latestUnreadReferralNotice.id === lastShownRewardNoticeId) {
      return;
    }

    setRewardNotice(latestUnreadReferralNotice);
    setLastShownRewardNoticeId(latestUnreadReferralNotice.id);
  }, [lastShownRewardNoticeId, notifications]);

  const onRefresh = useCallback(() => {
    void loadSummary(true);
  }, [loadSummary]);

  const closeRewardPopup = useCallback(async () => {
    const notificationId = rewardNotice?.id;
    if (notificationId && !rewardNotice?.isRead) {
      try {
        await markAsRead.mutateAsync(notificationId);
      } catch {
        // keep this non-blocking; popup should still be dismissible
      }
    }

    setRewardNotice(null);
  }, [markAsRead, rewardNotice]);

  const milestones = useMemo(
    () =>
      [...(summary?.milestones ?? [])]
        .filter((item) => item.isActive)
        .sort((a, b) => a.sortOrder - b.sortOrder),
    [summary?.milestones]
  );

  const handleCopy = async () => {
    if (!summary) return;
    await Clipboard.setStringAsync(summary.referralCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async (platform: 'whatsapp' | 'native') => {
    if (!summary) return;

    const message = `Join me on MemoPal and use my referral code ${summary.referralCode} to unlock rewards: https://mindpal.app/join/${summary.referralCode}`;
    if (platform === 'whatsapp') {
      const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
      Linking.openURL(url).catch(() =>
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'WhatsApp is not installed on this device',
        })
      );
      return;
    }

    try {
      await Share.share({
        message,
        title: 'Join MemoPal',
      });
    } catch {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Unable to open share options.',
      });
    }
  };

  const handleRedeem = async () => {
    if (!summary) return;
    const normalized = redeemCode.trim().toUpperCase();
    if (!normalized) {
      Toast.show({
        type: 'error',
        text1: 'Referral code required',
        text2: 'Enter a referral code before redeeming.',
      });
      return;
    }

    try {
      setRedeeming(true);
      const result = await referralApi.redeem(normalized);
      setRedeemCode('');
      await syncEntitlementToLocal();
      await loadSummary(true);

      const milestoneBonus = result.newlyAwardedMilestones.reduce(
        (acc, item) => acc + item.rewardPremiumDays,
        0
      );

      Toast.show({
        type: 'success',
        text1: 'Referral redeemed',
        text2: `You earned ${result.inviteeAwardedXp} XP and ${result.inviteeAwardedPremiumDays} premium days.${milestoneBonus > 0 ? ' Your friend also unlocked milestone bonus rewards.' : ''}`,
      });
    } catch (error: any) {
      const message = error?.response?.data?.message || 'Failed to redeem referral code.';
      Toast.show({
        type: 'error',
        text1: 'Redeem failed',
        text2: message,
      });
    } finally {
      setRedeeming(false);
    }
  };

  if (loading) {
    return <LoadingView description={t('description')} />;
  }

  if (!summary) {
    return (
      <View className="flex-1 bg-white">
        <CommonHeader
          title={t('title')}
          description={t('description')}
          backAction={() => router.back()}
        />
        <View className="flex-1 items-center justify-center px-6">
          <Text className="mb-2 text-center text-base font-semibold text-[#2B2A3D]">
            Referral data is unavailable right now.
          </Text>
          <Text className="mb-4 text-center text-sm text-[#6B6A80]">
            {loadError ?? 'Please try again in a moment.'}
          </Text>
          <TouchableOpacity
            className="rounded-xl bg-primary px-4 py-3"
            onPress={() => void loadSummary()}>
            <Text className="font-semibold text-white">{t('retry')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      <CommonHeader
        title={t('title')}
        description={t('description')}
        backAction={() => router.back()}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={{ padding: 20, paddingBottom: 60 }}>
        {loadError ? (
          <View className="mb-5 rounded-2xl border-2 border-line-berry bg-tint-berry px-4 py-3">
            <Text className="text-sm font-semibold text-[#E8527A]">
              Unable to refresh referral data
            </Text>
            <Text className="mt-1 text-sm text-[#E8527A]">{loadError}</Text>
          </View>
        ) : null}

        <BaseCard className="mb-8 rounded-[32px] p-6">
          <Text className="text-center text-xs font-bold uppercase tracking-widest text-[#6B6A80]">
            Your Invite Code
          </Text>
          <TouchableOpacity
            onPress={handleCopy}
            className="my-4 flex-row items-center justify-center rounded-2xl border-2 border-dashed border-line-sky bg-tint-sky py-4">
            <Text className="mr-3 text-3xl font-black tracking-[4px] text-[#7A68E0]">
              {summary.referralCode}
            </Text>
            {copied ? (
              <Check size={20} color={theme.grass} />
            ) : (
              <Copy size={20} color={theme.violetDeep} />
            )}
          </TouchableOpacity>

          <View className="flex-row justify-between gap-3">
            <ShareIconBtn
              icon={<MessageCircle size={20} color={theme.grass} />}
              label="WhatsApp"
              onPress={() => void handleShare('whatsapp')}
            />
            <ShareIconBtn
              icon={<Share2 size={20} color={theme.violetDeep} />}
              label="Share Link"
              onPress={() => void handleShare('native')}
            />
          </View>
        </BaseCard>

        <View className="mb-8 flex-row gap-3">
          <StatBox
            icon={<Text className="text-xl">👥</Text>}
            value={summary.successfulReferrals}
            label="Friends Joined"
          />
          <StatBox
            icon={<Text className="text-xl">✨</Text>}
            value={summary.totalXpEarned}
            label="Total XP Earned"
          />
          <StatBox
            icon={<Text className="text-xl">👑</Text>}
            value={summary.totalPremiumDaysEarned}
            label="Premium Days"
          />
        </View>

        <BaseCard className="mb-8 overflow-hidden rounded-3xl p-2">
          <View className="flex-row p-4">
            <Text className="text-xl">👑</Text>
            <Text className="ml-1 text-lg font-medium text-[#2B2A3D]">{t('milestones')}</Text>
          </View>
          {milestones.map((milestone, index) => {
            const fallbackReward = `${milestone.rewardXp} XP + ${milestone.rewardPremiumDays} premium days`;
            return (
              <MilestoneRow
                key={milestone.key}
                title={milestone.title}
                refs={milestone.referralsRequired}
                rewardLabel={milestone.rewardLabel || fallbackReward}
                current={summary.successfulReferrals}
                isAwarded={milestone.isAwarded}
                isLast={index === milestones.length - 1}
              />
            );
          })}
        </BaseCard>

        <BaseCard className="mb-8 p-5">
          {summary.hasRedeemedCode ? (
            <View>
              <Text className="text-sm font-semibold text-[#2B2A3D]">
                Referral code already used
              </Text>
              <Text className="mt-1 text-sm text-[#6B6A80]">
                You joined using {summary.referredByDisplayName || 'another user'}&apos;s referral
                code.
              </Text>
            </View>
          ) : (
            <View>
              <Text className="text-sm font-semibold text-[#2B2A3D]">
                Have a friend&apos;s code?
              </Text>
              <Text className="mt-1 text-sm text-[#6B6A80]">
                Redeem once to receive instant XP and premium rewards.
              </Text>
              <TextInput
                autoCapitalize="characters"
                placeholder={t('referralCode')}
                value={redeemCode}
                onChangeText={setRedeemCode}
                className="mt-4 rounded-xl border-2 border-[#E5DFFF] bg-white px-4 py-3 text-base text-[#2B2A3D]"
              />
              <TouchableOpacity
                className={`mt-3 rounded-xl px-4 py-3 ${redeeming ? 'bg-line' : 'bg-primary'}`}
                disabled={redeeming}
                onPress={() => void handleRedeem()}>
                <Text className={`text-center font-semibold ${redeeming ? 'text-[#9A97A7]' : 'text-[#2B2A3D]'}`}>
                  {redeeming ? 'Redeeming...' : 'Redeem Code'}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </BaseCard>

        {summary.referrals.length > 0 ? (
          <ReferralList referrals={summary.referrals} pageSize={10} />
        ) : null}
      </ScrollView>

      <Modal
        visible={Boolean(rewardNotice)}
        transparent
        animationType="fade"
        onRequestClose={() => void closeRewardPopup()}>
        <View className="flex-1 items-center justify-center bg-[#2B2A3D]/60 px-6">
          <BaseCard className="w-full max-w-md p-6" radius="3xl" shadow="md" bordered={false}>
            <Text className="text-xs font-bold uppercase tracking-widest text-[#7A68E0]">
              Referral Reward
            </Text>
            <Text className="mt-2 text-xl font-bold text-[#2B2A3D]">
              {rewardNotice?.title ?? 'New referral activity'}
            </Text>
            <Text className="mt-3 text-base leading-6 text-[#6B6A80]">
              {rewardNotice?.body}
            </Text>
            <TouchableOpacity
              className="mt-6 rounded-xl bg-primary px-4 py-3"
              onPress={() => void closeRewardPopup()}>
              <Text className="text-center font-semibold text-white">{t('gotIt')}</Text>
            </TouchableOpacity>
          </BaseCard>
        </View>
      </Modal>
    </View>
  );
};

export default ReferralScreen;
