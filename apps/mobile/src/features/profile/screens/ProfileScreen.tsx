import AnimatedPressable from '@/components/AnimatedPressable';
import { ActionSheet } from '@/components/ActionSheet';
import { AppImage } from '@/components/AppImage';
import { CommonHeader } from '@/components/CommonHeader';
import { NightEmphasisCard } from '@/components/NightEmphasisCard';
import { useAuth } from '@/contexts/AuthProvider';
import { useUserState } from '@/contexts/UserStateContext';
import { useCurrentUser } from '@/features/profile/hooks/useCurrentUser';
import { useUpdateProfile } from '@/features/profile/hooks/useProfile';
import { PushNotificationService } from '@/features/notifications/services/pushNotificationService';
import { InAppNotificationSync } from '@/features/notifications/services/inAppNotificationSync';
import { numberPegTheme as theme } from '@/features/number-peg/constants/numberPegTheme';
import { typography } from '@/theme/typography';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { ChevronRight, LogOut, Pencil } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import React, { ReactNode, useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import Toast from 'react-native-toast-message';
import { EditProfileSheet } from '../components/EditProfileSheet';
import HelpSheet from '../components/HelpSheet';
import PrivacyPolicySheet from '../components/PrivacyPolicySheet';
import { ReviewScheduleSheet } from '../components/ReviewScheduleSheet';
import type { AppLanguage } from '@/features/onboarding/types/userState';
import { LanguageSheet } from '../components/LanguageSheet';
import { useTranslation } from '@/core/i18n/useTranslation';

export default function ProfileScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useCurrentUser();
  const { userState, updateState, updatePreferences } = useUserState();
  const { t } = useTranslation('profile');
  const { t: languageT } = useTranslation('language');
  const { logout } = useAuth();
  const updateProfileMutation = useUpdateProfile();
  const [showLogout, setShowLogout] = useState(false);
  const [reviewRemindersEnabled, setReviewRemindersEnabled] = useState(userState.notifications.reviewReminders);
  const [dailyLearningEnabled, setDailyLearningEnabled] = useState(userState.notifications.dailyLearningReminder);
  const helpRef = useRef<any>(null);
  const privacyRef = useRef<any>(null);
  const reviewScheduleRef = useRef<any>(null);
  const editProfileRef = useRef<any>(null);
  const languageRef = useRef<any>(null);
  const languageLabel = userState.preferences.language === 'system'
    ? `${languageT('followSystem')} · ${languageT('english')}/${languageT('chinese')}`
    : userState.preferences.language === 'zh' ? languageT('chinese') : languageT('english');

  useEffect(() => {
    setReviewRemindersEnabled(userState.notifications.reviewReminders);
    setDailyLearningEnabled(userState.notifications.dailyLearningReminder);
  }, [userState.notifications.dailyLearningReminder, userState.notifications.reviewReminders]);

  const persistDailyLearningPreference = async (enabled: boolean) => {
    await updateState({
      notifications: { ...userState.notifications, dailyLearningReminder: enabled },
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
        Toast.show({ type: 'error', text1: 'Notifications disabled', text2: 'Enable notification permission to use daily reminders.' });
        return;
      }
      await PushNotificationService.scheduleDailyLearning(userState.preferences.reviewTime);
      await persistDailyLearningPreference(true);
    } catch (error) {
      setDailyLearningEnabled(previousValue);
      await persistDailyLearningPreference(previousValue);
      Toast.show({ type: 'error', text1: 'Reminder update failed', text2: error instanceof Error ? error.message : 'Unable to update daily reminder.' });
    }
  };

  const saveReviewReminders = async (enabled: boolean) => {
    const previousValue = reviewRemindersEnabled;
    setReviewRemindersEnabled(enabled);
    try {
      if (!enabled) {
        await PushNotificationService.cancelAllReviewNotifications();
        await updateState({ notifications: { ...userState.notifications, reviewReminders: false } });
        return;
      }

      const granted = await PushNotificationService.requestPermissions();
      if (!granted) {
        setReviewRemindersEnabled(false);
        await updateState({ notifications: { ...userState.notifications, reviewReminders: false } });
        Toast.show({ type: 'error', text1: 'Notifications disabled', text2: 'Enable notification permission to use review reminders.' });
        return;
      }

      await InAppNotificationSync.syncAllUpcoming(true);
      await updateState({ notifications: { ...userState.notifications, reviewReminders: true } });
    } catch (error) {
      setReviewRemindersEnabled(previousValue);
      await updateState({ notifications: { ...userState.notifications, reviewReminders: previousValue } });
      Toast.show({ type: 'error', text1: 'Reminder update failed', text2: error instanceof Error ? error.message : 'Unable to update review reminders.' });
    }
  };

  const displayName = user?.displayName?.trim() || 'Memory learner';
  const level = Math.max(1, user?.level ?? 1);
  const isPremium = Boolean(user?.isPremium);
  const selectedLanguage = (userState.preferences.language as AppLanguage) ?? 'system';

  return (
    <View style={styles.page}>
      <CommonHeader eyebrow={t('title')} title={t('yourProgress')} description={t('levelXpStreak')} hideBackButton />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.profileHead}>
          <View style={styles.avatar}>
            {user?.avatarUrl ? <AppImage source={{ uri: user.avatarUrl }} style={styles.avatarImage} /> : (
              <LinearGradient colors={['#FFC93C', '#FF6F91']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.avatarGradient}>
                <Text style={styles.avatarEmoji}>🧑‍🎓</Text>
              </LinearGradient>
            )}
          </View>
          <Text style={styles.profileName}>{displayName}</Text>
          <Text style={styles.profileSubtitle}>Level {level} · {t('memoryApprentice')}</Text>
          <AnimatedPressable onPress={() => editProfileRef.current?.present()} style={styles.editButton}>
            <Pencil size={14} color="#2B2A3D" />
            <Text style={styles.editButtonText}>{t('editProfile')}</Text>
          </AnimatedPressable>
        </View>

        <NightEmphasisCard style={styles.planCard}>
          <Text style={styles.planBadge}>{isPremium ? t('premiumPlan') : t('freePlan')}</Text>
          <Text style={styles.planTitle}>{isPremium ? t('strongMemoryHabit') : t('unlockFaster')}</Text>
          <Text style={styles.planSubtitle}>{isPremium ? t('keepStreak') : t('premiumBenefits')}</Text>
          <AnimatedPressable onPress={() => router.push('/premium')} style={styles.upgradeButton}>
            <Text style={styles.upgradeButtonText}>{isPremium ? t('managePlan') : t('upgradePro')}</Text>
          </AnimatedPressable>
        </NightEmphasisCard>

        <Text style={styles.sectionLabel}>{t('settings')}</Text>
        <View style={styles.settingsList}>
          <ProfileSettingsRow icon={<Text style={styles.settingsEmoji}>🔔</Text>} title={t('reviewReminders')} value={reviewRemindersEnabled ? t('on') : t('off')} right={<Switch value={reviewRemindersEnabled} onValueChange={saveReviewReminders} />} />
          <ProfileSettingsRow
            icon={<Text style={styles.settingsEmoji}>📚</Text>}
            title={t('dailyLearning')}
            value={userState.preferences.reviewTime}
            right={(
              <View style={styles.reminderControl}>
                <Text style={styles.settingsValue}>{userState.preferences.reviewTime}</Text>
                <Switch value={dailyLearningEnabled} onValueChange={saveDailyLearningReminder} />
              </View>
            )}
            onPress={() => reviewScheduleRef.current?.present()}
          />
          <ProfileSettingsRow icon={<Text style={styles.settingsEmoji}>🔊</Text>} title={t('soundHaptics')} value={t('on')} />
          <ProfileSettingsRow icon={<Text style={styles.settingsEmoji}>🌐</Text>} title={t('language')} value={languageLabel} onPress={() => languageRef.current?.present()} />
          <ProfileSettingsRow icon={<Text style={styles.settingsEmoji}>🌙</Text>} title={t('theme')} value={t('light')} />
          <ProfileSettingsRow icon={<Text style={styles.settingsEmoji}>❓</Text>} title={t('helpSupport')} value="›" onPress={() => helpRef.current?.present()} />
          <ProfileSettingsRow icon={<Text style={styles.settingsEmoji}>ℹ️</Text>} title={t('about')} value="›" onPress={() => privacyRef.current?.present()} />
        </View>

        <AnimatedPressable onPress={() => setShowLogout(true)} style={styles.signOutButton}>
          <LogOut size={18} color={theme.berryDeep} />
          <Text style={styles.signOutText}>{t('signOut')}</Text>
        </AnimatedPressable>
      </ScrollView>

      <ReviewScheduleSheet
        ref={reviewScheduleRef}
        currentTime={userState.preferences.reviewTime}
        onSave={async (time) => {
          await updatePreferences({ reviewTime: time });
          if (userState.notifications.dailyLearningReminder) await PushNotificationService.scheduleDailyLearning(time);
          reviewScheduleRef.current?.dismiss();
        }}
      />
      <LanguageSheet
        ref={languageRef}
        currentLanguage={selectedLanguage}
        onSave={(language) => updatePreferences({ ...userState.preferences, language })}
      />
      <EditProfileSheet
        ref={editProfileRef}
        initialName={user?.displayName}
        initialEmail={user?.email}
        initialAvatarUrl={user?.avatarUrl}
        onSave={async (payload) => {
          if (!user) return;
          await updateProfileMutation.mutateAsync({ id: user.id, displayName: payload.displayName, email: payload.email, avatarUrl: payload.avatarUrl });
          await queryClient.invalidateQueries();
        }}
      />
      <HelpSheet ref={helpRef} router={router} />
      <PrivacyPolicySheet ref={privacyRef} />
      <ActionSheet isVisible={showLogout} onClose={() => setShowLogout(false)} onAction={logout} title={t('signOutTitle')} description={t('signOutDescription')} actionLabel={t('signOutTitle')} cancelLabel={t('cancel')} variant="destructive" Icon={LogOut} />
    </View>
  );
}

function ProfileSettingsRow({ icon, title, value, right, onPress }: { icon: ReactNode; title: string; value: string; right?: ReactNode; onPress?: () => void }) {
  const content = (
    <View style={styles.settingsRow}>
      <View style={styles.settingsIcon}>{icon}</View>
      <Text style={styles.settingsTitle}>{title}</Text>
      {right ?? <Text style={styles.settingsValue}>{value}</Text>}
      {onPress && !right && value !== '›' ? <ChevronRight size={16} color="#6B6A80" /> : null}
    </View>
  );
  return onPress ? <AnimatedPressable onPress={onPress}>{content}</AnimatedPressable> : content;
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#FFFFFF' },
  content: { padding: 16, paddingBottom: 48 },
  profileHead: { alignItems: 'center', paddingTop: 10, paddingBottom: 20 },
  avatar: { width: 78, height: 78, borderRadius: 39, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', boxShadow: '0px 8px 18px rgba(255,111,145,0.28)' },
  avatarGradient: { flex: 1, width: '100%', alignItems: 'center', justifyContent: 'center' },
  avatarImage: { width: '100%', height: '100%', borderRadius: 39 },
  avatarEmoji: { fontSize: 34 },
  profileName: { color: '#2B2A3D', fontFamily: typography.displayExtraBold, fontSize: 19, marginTop: 10 },
  profileSubtitle: { color: '#6B6A80', fontFamily: typography.bodyBold, fontSize: 12, marginTop: 2 },
  editButton: { minHeight: 38, flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#FFFFFF', borderWidth: 2, borderColor: '#EEE9DC', borderRadius: 13, paddingHorizontal: 18, marginTop: 10 },
  editButtonText: { color: '#2B2A3D', fontFamily: typography.display, fontSize: 13.5 },
  planCard: { marginBottom: 8 },
  planBadge: { alignSelf: 'flex-start', color: 'white', backgroundColor: 'rgba(255,255,255,0.14)', fontFamily: typography.displayExtraBold, fontSize: 10.5, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, marginBottom: 10 },
  planTitle: { color: 'white', fontFamily: typography.displayExtraBold, fontSize: 15 },
  planSubtitle: { color: '#C9C5E0', fontFamily: typography.bodyBold, fontSize: 11.5, lineHeight: 16, marginTop: 5 },
  upgradeButton: { minHeight: 48, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFC93C', borderRadius: 15, marginTop: 12, boxShadow: '0px 5px 0px #F2A900' },
  upgradeButtonText: { color: '#2B2A3D', fontFamily: typography.displayExtraBold, fontSize: 14 },
  sectionLabel: { color: '#6B6A80', fontFamily: typography.displayExtraBold, fontSize: 13, letterSpacing: 0.4, textTransform: 'uppercase', marginTop: 22, marginBottom: 10 },
  settingsList: { backgroundColor: '#FFFDF8', borderWidth: 2, borderColor: '#EEE9DC', borderRadius: 16, overflow: 'hidden' },
  settingsRow: { minHeight: 51, flexDirection: 'row', alignItems: 'center', gap: 11, paddingHorizontal: 14, borderBottomWidth: 1, borderBottomColor: '#EEE9DC' },
  settingsIcon: { width: 25, alignItems: 'center' },
  settingsEmoji: { fontSize: 16, lineHeight: 20 },
  settingsTitle: { flex: 1, color: '#2B2A3D', fontFamily: typography.display, fontSize: 13 },
  settingsValue: { color: '#6B6A80', fontFamily: typography.bodyBold, fontSize: 12 },
  reminderControl: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  signOutButton: { minHeight: 46, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderWidth: 2, borderColor: '#FFD2DC', borderRadius: 13, backgroundColor: '#FFF0F4', marginTop: 18 },
  signOutText: { color: '#E8527A', fontFamily: typography.display, fontSize: 13.5 },
});
