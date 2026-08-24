import { useAuth } from '@/contexts/AuthProvider';
import { useCurrentUser } from '@/features/profile/hooks/useCurrentUser';
import { useXpIntegrityCheck } from '@/features/profile/hooks/useDiagnostics';
import { useUpdateProfile } from '@/features/profile/hooks/useProfile';
import { useQueryClient } from '@tanstack/react-query';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';

import { ActionSheet } from '@/components/ActionSheet';
import AnimatedPressable from '@/components/AnimatedPressable';
import { CommonHeader } from '@/components/CommonHeader';
import { PremiumUpdateCard } from '@/components/PremiumUpdateCard';
import { useUserState } from '@/contexts/UserStateContext';
import { PushNotificationService } from '@/features/notifications/services/pushNotificationService';
import { numberPegTheme as theme } from '@/features/number-peg/constants/numberPegTheme';
import { Bell, Gift, HelpCircle, LogOut, Shield } from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import { EditProfileSheet } from '../components/EditProfileSheet';
import HelpSheet from '../components/HelpSheet';
import PrivacyPolicySheet from '../components/PrivacyPolicySheet';
import ProfileCard from '../components/ProfileCard';
import { ReviewScheduleSheet } from '../components/ReviewScheduleSheet';
import { SettingsRow } from '../components/SettingRow';
import { SettingsSection } from '../components/SettingSection';

export default function SettingsScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useCurrentUser();
  const isLocalDevMode =
    String(process.env.EXPO_PUBLIC_LOCAL_DEV_MODE).trim().toLowerCase() === 'true';
  const { userState, updateState, updatePreferences } = useUserState();
  const xpIntegrityCheck = useXpIntegrityCheck();
  const updateProfileMutation = useUpdateProfile();
  const [showLogout, setShowLogout] = useState<boolean>(false);
  const { logout } = useAuth();
  const [dailyLearningEnabled, setDailyLearningEnabled] = useState<boolean>(
    userState.notifications.dailyLearningReminder
  );

  useEffect(() => {
    setDailyLearningEnabled(userState.notifications.dailyLearningReminder);
  }, [userState.notifications.dailyLearningReminder]);

  const persistDailyLearningPreference = async (enabled: boolean) => {
    await updateState({
      notifications: {
        ...userState.notifications,
        dailyLearningReminder: enabled,
      },
    });
  };

  const saveDailyLearningReminder = async (enabled: boolean) => {
    const previousValue = dailyLearningEnabled;
    setDailyLearningEnabled(enabled);

    try {
      if (!enabled) {
        await PushNotificationService.cancelDailyLearning();
        await persistDailyLearningPreference(false);
        return;
      }

      const granted = await PushNotificationService.requestPermissions();
      if (!granted) {
        setDailyLearningEnabled(false);
        await persistDailyLearningPreference(false);
        Toast.show({
          type: 'error',
          text1: 'Notifications disabled',
          text2: 'Enable notification permission to use daily reminders.',
        });
        return;
      }

      await PushNotificationService.scheduleDailyLearning(userState.preferences.reviewTime);
      await persistDailyLearningPreference(true);
    } catch (error) {
      setDailyLearningEnabled(previousValue);
      await persistDailyLearningPreference(previousValue);
      const message = error instanceof Error ? error.message : 'Unable to update daily reminder.';
      Toast.show({
        type: 'error',
        text1: 'Reminder update failed',
        text2: message,
      });
    }
  };

  const clearLocalData = async () => {
    queryClient.clear();
    Toast.show({
      type: 'success',
      text1: 'API cache cleared',
      text2: 'Screens will fetch fresh data from the server.',
    });
  };

  const checkXpIntegrity = async () => {
    const result = await xpIntegrityCheck.mutateAsync();

    if (result.ok) {
      Toast.show({
        type: 'success',
        text1: 'XP integrity OK',
        text2: `users.totalXp = ${result.userXp}`,
      });
      return;
    }

    Toast.show({
      type: 'error',
      text1: 'XP mismatch detected',
      text2: `users.totalXp=${result.userXp}, xp_events_sum=${result.xpEventsTotal}`,
    });
  };

  const helpRef = useRef<BottomSheetModal>(null);
  const privacyRef = useRef<BottomSheetModal>(null);
  const reviewScheduleRef = useRef<BottomSheetModal>(null);
  const editProfileRef = useRef<BottomSheetModal>(null);

  return (
    <View className="flex-1 bg-white">
      <CommonHeader eyebrow="Profile" title="Settings" description={undefined} showNotification hideBackButton />
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <SettingsSection title="Profile">
          <ProfileCard user={user} onEdit={() => editProfileRef.current?.present()} />
        </SettingsSection>

        <SettingsSection title="Subscription">
          <SettingsRow
            icon={<Shield size={20} color={theme.violetDeep} />}
            title={userState.subscription.isPremium ? 'Premium Active' : 'Free Plan'}
            subtitle={
              userState.subscription.isPremium
                ? `Plan: ${userState.subscription.planId ?? 'premium'} • Expires: ${userState.subscription.expiresAt ? new Date(userState.subscription.expiresAt).toLocaleDateString() : '-'}`
                : 'Upgrade to unlock custom palace features'
            }
          />
        </SettingsSection>

        <SettingsSection title="Notifications & Learning Time">
          <SettingsRow
            icon={<Bell size={20} color={theme.violetDeep} />}
            title="Daily Learning Reminder"
            subtitle={`At ${userState.preferences.reviewTime}`}
            right="switch"
            switchValue={dailyLearningEnabled}
            onSwitchChange={saveDailyLearningReminder}
          />
          <SettingsRow
            title="Daily Learning Time"
            subtitle={`Reminder time: ${userState.preferences.reviewTime}`}
            onPress={() => reviewScheduleRef.current?.present()}
            icon={<Bell size={20} color={theme.violetDeep} />}
          />
        </SettingsSection>

        <SettingsSection title={'Rewards & Community'}>
          <SettingsRow
            title="Refer Friends & Earn"
            subtitle={`Get rewards for every referral`}
            onPress={() => router.push('/referral')}
            icon={<Gift size={20} color={theme.berryDeep} />}
          />
        </SettingsSection>

        {!user?.isPremium ? (
          <SettingsSection>
            <PremiumUpdateCard />
          </SettingsSection>
        ) : null}

        {isLocalDevMode && (
          <SettingsSection title="Developer Tools">
            <SettingsRow
              icon={<Shield size={20} color={theme.violetDeep} />}
              title="Clear API Cache"
              subtitle="Discard cached queries and fetch fresh server data"
              onPress={clearLocalData}
            />
            <SettingsRow
              icon={<Shield size={20} color={theme.violetDeep} />}
              title="Check XP Integrity"
              subtitle="Compare users.totalXp with xp_events sum"
              onPress={checkXpIntegrity}
            />
          </SettingsSection>
        )}

        <SettingsSection title="Support">
          <SettingsRow
            icon={<HelpCircle size={20} color={theme.sky} />}
            title="Help & FAQ"
            onPress={() => helpRef.current?.present()}
          />
          <SettingsRow
            icon={<Shield size={20} color={theme.violetDeep} />}
            title="Privacy Policy"
            onPress={() => privacyRef.current?.present()}
          />
        </SettingsSection>

        {user?.email && (
          <SettingsSection>
            <AnimatedPressable onPress={() => setShowLogout(true)}>
              <View className="flex-row items-center justify-center rounded-2xl border-2 border-[#FFD2DC] bg-[#FFF0F4] p-4">
                <LogOut size={20} color={theme.berryDeep} />
                <Text className="ml-1 font-semibold text-[#E8527A]">Sign Out</Text>
              </View>
            </AnimatedPressable>
          </SettingsSection>
        )}
      </ScrollView>

      {/* Bottom sheets */}
      <ReviewScheduleSheet
        ref={reviewScheduleRef}
        currentTime={userState.preferences.reviewTime}
        onSave={async (time) => {
          const nextPreferences = { ...userState.preferences, reviewTime: time };
          await updatePreferences(nextPreferences);

          if (userState.notifications.dailyLearningReminder) {
            const granted = await PushNotificationService.requestPermissions();
            if (!granted) {
              setDailyLearningEnabled(false);
              await persistDailyLearningPreference(false);
              Toast.show({
                type: 'error',
                text1: 'Notifications disabled',
                text2: 'Enable notification permission to keep daily reminders active.',
              });
            } else {
              await PushNotificationService.scheduleDailyLearning(time);
            }
          }

          reviewScheduleRef.current?.dismiss();
        }}
      />

      <EditProfileSheet
        ref={editProfileRef}
        initialName={user?.displayName}
        initialEmail={user?.email}
        initialAvatarUrl={user?.avatarUrl}
        onSave={async (payload) => {
          if (!user) return;
          await updateProfileMutation.mutateAsync({
            id: user.id,
            displayName: payload.displayName,
            email: payload.email,
            avatarUrl: payload.avatarUrl,
          });
          await queryClient.invalidateQueries();
        }}
      />

      <HelpSheet ref={helpRef} router={router} />
      <PrivacyPolicySheet ref={privacyRef} />

      <ActionSheet
        isVisible={showLogout}
        onClose={() => setShowLogout(false)}
        onAction={logout}
        title="Sign Out"
        description="Are you sure you want to sign out? You can sign back in anytime."
        actionLabel="Sign Out"
        cancelLabel="Cancel"
        variant="destructive"
        Icon={LogOut}
      />
    </View>
  );
}
