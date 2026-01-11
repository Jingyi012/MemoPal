import { useAuth } from '@/contexts/AuthProvider';
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
import { Bell, HelpCircle, LogOut, Moon, Shield } from 'lucide-react-native';
import HelpSheet from './HelpSheet';
import PrivacyPolicySheet from './PrivacyPolicySheet';
import ProfileCard from './ProfileCard';
import { ReviewScheduleSheet } from './ReviewScheduleSheet';
import { SettingsRow } from './SettingRow';
import { SettingsSection } from './SettingSection';
import ThemeSheet from './ThemeSheet';

export default function SettingsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { userState, resetState, updatePreferences } = useUserState();
  const [showLogout, setShowLogout] = useState<boolean>(false);
  const { logout } = useAuth();
  const [reviewRemindersEnabled, setReviewRemindersEnabled] = useState<boolean>(
    userState.notifications.reviewReminders
  );

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

        <SettingsSection title="Notifications">
          <SettingsRow
            icon={<Bell size={20} color="#475569" />}
            title="Review Reminders"
            subtitle="Get notified when reviews are due"
            right="switch"
            switchValue={reviewRemindersEnabled}
            onSwitchChange={setReviewRemindersEnabled}
          />
        </SettingsSection>

        <SettingsSection title="Appearance">
          <SettingsRow
            icon={<Moon size={20} color="#475569" />}
            title="Theme"
            subtitle="Light / Dark / Auto"
            onPress={() => themeRef.current?.present()}
          />
          <SettingsRow
            title="Review Schedule"
            subtitle={`Daily at ${userState.preferences.reviewTime}`}
            onPress={() => reviewScheduleRef.current?.present()}
            icon={<Bell size={20} color="#475569" />}
          />
        </SettingsSection>

        <SettingsSection title={'Rewards & Community'}>
          <ReferrerPromptCard router={router} />
        </SettingsSection>

        <SettingsSection>
          <PremiumUpdateCard />
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
        onSave={(time) => {
          userState.preferences.reviewTime = time;
          updatePreferences(userState.preferences);
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
