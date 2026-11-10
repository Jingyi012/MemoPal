import { referralApi } from '@/features/referral/api/referral';
import { BaseCard } from '@/components/BaseCard';
import { CommonHeader } from '@/components/CommonHeader';
import { useTranslation } from '@/core/i18n/useTranslation';
import LoadingView from '@/components/LoadingView';
import { useColorScheme } from 'nativewind';
import { memopalThemes } from '@/theme/memopalTheme';
import { NotificationType } from '@/enums/notificationType';
import { useNotificationMutations, useNotifications } from '@/features/notifications/hooks/useNotifications';
import { syncEntitlementToLocal } from '@/features/subscription/services/subscription.service';
import type { Notification } from '@/features/notifications/types/notification';
import type { ReferralSummary } from '@/features/referral/types/referral';
import * as Clipboard from 'expo-clipboard';
import * as ExpoLinking from 'expo-linking';
import { useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
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
  const queryClient = useQueryClient();
  const { t, language } = useTranslation('referral');
  const { colorScheme } = useColorScheme();
  const theme = memopalThemes[colorScheme ?? 'light'];
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
    void queryClient.invalidateQueries({ queryKey: ['ai-credits'] });
    void loadSummary(true);
  }, [lastShownRewardNoticeId, loadSummary, notifications, queryClient]);

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

    const referralUrl = ExpoLinking.createURL('register', { queryParams: { referralCode: summary.referralCode } });
    const message = `Join me on MemoPal and use my referral code ${summary.referralCode} to unlock rewards. Open in MemoPal: ${referralUrl}`;
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
      await queryClient.invalidateQueries({ queryKey: ['ai-credits'] });
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
        text2: `${t('redeemSuccess', { credits: result.inviteeAwardedAiCredits, days: result.inviteeAwardedPremiumDays })}${milestoneBonus > 0 ? ' Your friend also unlocked milestone bonus rewards.' : ''}`,
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
      <View className="flex-1 bg-canvas">
        <CommonHeader showAiCredits={false}
          title={t('title')}
          description={t('description')}
          backAction={() => router.back()}
        />
        <View className="flex-1 items-center justify-center px-6">
          <Text className="mb-2 text-center text-base font-semibold text-ink">
            Referral data is unavailable right now.
          </Text>
          <Text className="mb-4 text-center text-sm text-ink-soft">
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
    <View className="flex-1 bg-canvas">
      <CommonHeader showAiCredits={false}
        title={t('title')}
        description={t('description')}
        backAction={() => router.back()}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
        {loadError ? (
          <View className="mb-5 rounded-2xl border-2 border-line-berry bg-tint-berry px-4 py-3">
            <Text className="text-sm font-semibold text-accent-berry">
              Unable to refresh referral data
            </Text>
            <Text className="mt-1 text-sm text-accent-berry">{loadError}</Text>
          </View>
        ) : null}

        <BaseCard className="mb-8 rounded-[32px] p-6">
          <Text className="text-center text-xs font-bold uppercase tracking-widest text-ink-soft">
            {language === 'zh' ? '你的邀请代码' : 'Your invite code'}
          </Text>
          <Text className="mt-3 text-center text-sm text-ink-soft">
            {t('baseCredits', { credits: summary.config.inviterRewardAiCredits, friendCredits: summary.config.inviteeRewardAiCredits })}
          </Text>
          <TouchableOpacity
            onPress={handleCopy} accessibilityRole="button" accessibilityLabel={language === 'zh' ? '复制邀请代码' : 'Copy invitation code'}
            className="my-4 flex-row items-center justify-center rounded-2xl border-2 border-dashed border-line-sky bg-tint-sky py-4">
            <Text className="mr-3 text-3xl font-black tracking-[4px] text-primary">
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
              label={language === 'zh' ? '分享链接' : 'Share link'}
              onPress={() => void handleShare('native')}
            />
          </View>
        </BaseCard>

        <View className="mb-8 flex-row gap-3">
          <StatBox
            icon={<Text className="text-xl">👥</Text>}
            value={summary.successfulReferrals}
            label={language === 'zh' ? '已加入好友' : 'Friends joined'}
          />
          <StatBox
            icon={<Text className="text-xl">✨</Text>}
            value={summary.totalAiCreditsEarned}
            label={t('creditsEarned')}
          />
          <StatBox
            icon={<Text className="text-xl">👑</Text>}
            value={summary.totalPremiumDaysEarned}
            label={language === 'zh' ? '会员天数' : 'Premium days'}
          />
        </View>

        <BaseCard className="mb-8 overflow-hidden rounded-3xl p-2">
          <View className="flex-row p-4">
            <Text className="text-xl">👑</Text>
            <Text className="ml-1 text-lg font-medium text-ink">{t('milestones')}</Text>
          </View>
          {milestones.map((milestone, index) => {
            const fallbackReward = t('rewardSummary', { credits: milestone.rewardAiCredits, days: milestone.rewardPremiumDays });
            return (
              <MilestoneRow
                key={milestone.key}
                title={milestone.title}
                refs={milestone.referralsRequired}
                rewardLabel={milestone.isAwarded && (milestone.rewardXp ?? 0) > 0
                  ? t('previousReward', { xp: milestone.rewardXp ?? 0, days: milestone.rewardPremiumDays })
                  : milestone.rewardLabel || fallbackReward}
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
              <Text className="text-sm font-semibold text-ink">
                Referral code already used
              </Text>
              <Text className="mt-1 text-sm text-ink-soft">
                You joined using {summary.referredByDisplayName || 'another user'}&apos;s referral
                code.
              </Text>
            </View>
          ) : (
            <View>
              <Text className="text-sm font-semibold text-ink">
                {language === 'zh' ? '有朋友的邀请代码？' : 'Have a friend’s code?'}
              </Text>
              <Text className="mt-1 text-sm text-ink-soft">
                {t('redeemHint')}
              </Text>
              <TextInput accessibilityLabel={t('referralCode')} placeholderTextColor={theme.inkSoft}
                autoCapitalize="characters"
                placeholder={t('referralCode')}
                value={redeemCode}
                onChangeText={setRedeemCode}
                className="mt-4 rounded-xl border-2 border-line bg-surface px-4 py-3 text-base text-ink"
              />
              <TouchableOpacity
                className={`mt-3 rounded-xl px-4 py-3 ${redeeming ? 'bg-line' : 'bg-primary'}`}
                disabled={redeeming}
                onPress={() => void handleRedeem()}>
                <Text style={{ color: redeeming ? theme.inkSoft : theme.onAccent }} className={`text-center font-semibold ${redeeming ? 'text-ink-soft' : ''}`}>
                  {redeeming ? (language === 'zh' ? '正在兑换…' : 'Redeeming…') : (language === 'zh' ? '兑换代码' : 'Redeem code')}
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
            <Text className="text-xs font-bold uppercase tracking-widest text-primary">
              Referral Reward
            </Text>
            <Text className="mt-2 text-xl font-bold text-ink">
              {rewardNotice?.title ?? 'New referral activity'}
            </Text>
            <Text className="mt-3 text-base leading-6 text-ink-soft">
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
