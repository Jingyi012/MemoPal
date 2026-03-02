import { useAuth } from '@/contexts/AuthProvider';
import { db } from '@/db/client';
import { resetSeedData, seedInitialData } from '@/db/seed';
import * as schema from '@/db/schema';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useQueryClient } from '@tanstack/react-query';
import { eq, sql } from 'drizzle-orm';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';

import { ActionSheet } from '@/components/ActionSheet';
import AnimatedPressable from '@/components/AnimatedPressable';
import { CommonHeader } from '@/components/CommonHeader';
import { PremiumUpdateCard } from '@/components/PremiumUpdateCard';
import ReferrerPromptCard from '@/components/PromptCard/ReferrerPromptCard';
import { Colors } from '@/constants/colors';
import { useUserState } from '@/contexts/UserStateContext';
import { PushNotificationService } from '@/services/notification/pushNotificationService';
import { Bell, HelpCircle, LogOut, Moon, Shield } from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import HelpSheet from './HelpSheet';
import PrivacyPolicySheet from './PrivacyPolicySheet';
import ProfileCard from './ProfileCard';
import { ReviewScheduleSheet } from './ReviewScheduleSheet';
import { SettingsRow } from './SettingRow';
import { SettingsSection } from './SettingSection';
import ThemeSheet from './ThemeSheet';

export default function SettingsScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useCurrentUser();
  const { userState, updateState, updatePreferences } = useUserState();
  const [showLogout, setShowLogout] = useState<boolean>(false);
  const { logout } = useAuth();
  const [dailyLearningEnabled, setDailyLearningEnabled] = useState<boolean>(
    userState.notifications.dailyLearningReminder
  );

  const saveDailyLearningReminder = async (enabled: boolean) => {
    setDailyLearningEnabled(enabled);
    const granted = await PushNotificationService.requestPermissions();

    if (!granted) {
      setDailyLearningEnabled(false);
      return;
    }

    if (enabled) {
      await PushNotificationService.scheduleDailyLearning(userState.preferences.reviewTime);
    } else {
      await PushNotificationService.cancelDailyLearning();
    }

    await updateState({
      notifications: {
        ...userState.notifications,
        dailyLearningReminder: enabled,
        reviewReminders: enabled,
      },
    });
  };

  const reseedData = async () => {
    await resetSeedData();
    await seedInitialData(true);
    await queryClient.invalidateQueries();
  };

  const checkXpIntegrity = async () => {
    const current = await db.query.users.findFirst();
    const summed = await db
      .select({ total: sql<number>`sum(${schema.xpEvents.xpAmount})` })
      .from(schema.xpEvents)
      .where(eq(schema.xpEvents.isDeleted, false));

    const sumXp = summed[0]?.total ?? 0;
    const userXp = current?.totalXp ?? 0;

    if (sumXp === userXp) {
      Toast.show({ type: 'success', text1: 'XP integrity OK', text2: `users.totalXp = ${userXp}` });
      return;
    }

    Toast.show({
      type: 'error',
      text1: 'XP mismatch detected',
      text2: `users.totalXp=${userXp}, xp_events_sum=${sumXp}`,
    });
  };

  const togglePremiumForTesting = async () => {
    if (!user) return;
    const nextPremium = !user.isPremium;
    const now = new Date();
    const nextExpiry = new Date(now);
    nextExpiry.setMonth(nextExpiry.getMonth() + 1);

    await db
      .update(schema.users)
      .set({ isPremium: nextPremium, updatedAt: now.toISOString() })
      .where(eq(schema.users.id, user.id));

    await updateState({
      subscription: {
        ...userState.subscription,
        isPremium: nextPremium,
        planId: nextPremium ? 'premium_monthly' : undefined,
        startedAt: nextPremium ? now.toISOString() : userState.subscription.startedAt,
        expiresAt: nextPremium ? nextExpiry.toISOString() : now.toISOString(),
        status: nextPremium ? 'active' : 'canceled',
        autoRenew: nextPremium,
      },
    });

    await queryClient.invalidateQueries();
  };

  const skillLevelRef = useRef<BottomSheetModal>(null);
  const themeRef = useRef<BottomSheetModal>(null);
  const helpRef = useRef<BottomSheetModal>(null);
  const privacyRef = useRef<BottomSheetModal>(null);
  const reviewScheduleRef = useRef<BottomSheetModal>(null);

  return (
    <View className="flex-1 bg-slate-50">
      <CommonHeader title={'Settings'} description={undefined} showNotification hideBackButton />
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <SettingsSection title="Profile">
          <ProfileCard user={user} />
        </SettingsSection>

        <SettingsSection title="Subscription">
          <SettingsRow
            icon={<Shield size={20} color="#475569" />}
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
            icon={<Bell size={20} color="#475569" />}
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
            icon={<Bell size={20} color="#475569" />}
          />
        </SettingsSection>

        <SettingsSection title="Appearance">
          <SettingsRow
            icon={<Moon size={20} color="#475569" />}
            title="Theme"
            subtitle="Light / Dark / Auto"
            onPress={() => themeRef.current?.present()}
          />
        </SettingsSection>

        <SettingsSection title={'Rewards & Community'}>
          <ReferrerPromptCard router={router} />
        </SettingsSection>

        {!user?.isPremium ? (
          <SettingsSection>
            <PremiumUpdateCard />
          </SettingsSection>
        ) : null}

        <SettingsSection title="Developer Tools">
          <SettingsRow
            icon={<Shield size={20} color="#475569" />}
            title="Reseed Offline Data"
            subtitle="Reset DB and apply latest seed content"
            onPress={reseedData}
          />
          <SettingsRow
            icon={<Moon size={20} color="#475569" />}
            title={`Toggle Premium (Current: ${user?.isPremium ? 'ON' : 'OFF'})`}
            subtitle="Testing helper"
            onPress={togglePremiumForTesting}
          />
          <SettingsRow
            icon={<Shield size={20} color="#475569" />}
            title="Check XP Integrity"
            subtitle="Compare users.totalXp with xp_events sum"
            onPress={checkXpIntegrity}
          />
        </SettingsSection>

        <SettingsSection title="Support">
          <SettingsRow
            icon={<HelpCircle size={20} color="#475569" />}
            title="Help & FAQ"
            onPress={() => helpRef.current?.present()}
          />
          <SettingsRow
            icon={<Shield size={20} color="#475569" />}
            title="Privacy Policy"
            onPress={() => privacyRef.current?.present()}
          />
        </SettingsSection>

        {user?.email && (
          <SettingsSection>
            <AnimatedPressable onPress={() => setShowLogout(true)}>
              <View className="flex-row items-center justify-center rounded-lg border border-red-400 bg-red-500 p-4">
                <LogOut size={20} color={Colors.white} />
                <Text className="ml-1 text-white">Sign Out</Text>
              </View>
            </AnimatedPressable>
          </SettingsSection>
        )}

        <Text className="mt-6 text-center text-xs text-slate-400">MemoPal v1.0.0</Text>
      </ScrollView>

      {/* Bottom sheets */}
      <ReviewScheduleSheet
        ref={reviewScheduleRef}
        currentTime={userState.preferences.reviewTime}
        onSave={async (time) => {
          const nextPreferences = { ...userState.preferences, reviewTime: time };
          await updatePreferences(nextPreferences);

          if (userState.notifications.dailyLearningReminder) {
            await PushNotificationService.requestPermissions();
            await PushNotificationService.scheduleDailyLearning(time);
          }

          reviewScheduleRef.current?.dismiss();
        }}
      />

      <ThemeSheet ref={themeRef} />
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
