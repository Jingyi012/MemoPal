import { useSpotlightTour } from '@/features/onboarding/components/SpotlightTourProvider';
import { createThemedStyles } from '@/theme/createThemedStyles';
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
import { memopalThemes } from '@/theme/memopalTheme';
import { typography } from '@/theme/typography';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { ChevronRight, LogOut, Pencil } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import React, { ReactNode, useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import Toast from 'react-native-toast-message';
import { EditProfileSheet } from '../components/EditProfileSheet';
import HelpSheet from '../components/HelpSheet';
import AboutSheet from '../components/AboutSheet';
import { ReviewScheduleSheet } from '../components/ReviewScheduleSheet';
import type { AppLanguage, AppTheme } from '@/features/onboarding/types/userState';
import { LanguageSheet } from '../components/LanguageSheet';
import ThemeSheet from '../components/ThemeSheet';
import { useTranslation } from '@/core/i18n/useTranslation';
import { useLevelByXp } from '@/features/gamification/shared/hooks/useLevelConfigs';
import { DEFAULT_LEVEL_TITLES, getLevelTitleForLevel } from '@/features/gamification/shared/utils/levelTitles';
import { useColorScheme } from 'nativewind';

export default function ProfileScreen() {
  const { styles, theme } = useStyles();
  const router = useRouter();
  const { start: startTour } = useSpotlightTour();
  const queryClient = useQueryClient();
  const { user } = useCurrentUser();
  const { userState, updateState, updatePreferences } = useUserState();
  const { language, t } = useTranslation('profile');
  const { t: onboardingT } = useTranslation('onboarding');
  const { t: languageT } = useTranslation('language');
  const { logout } = useAuth();
  const { colorScheme } = useColorScheme();
  const activeTheme = memopalThemes[colorScheme ?? 'light'];
  const updateProfileMutation = useUpdateProfile();
  const totalXp = Math.max(0, user?.totalXp ?? 0);
  const { levelInfo } = useLevelByXp(totalXp, user?.level);
  const [reviewRemindersEnabled, setReviewRemindersEnabled] = useState(
    userState.notifications.reviewReminders
  );
  const [dailyLearningEnabled, setDailyLearningEnabled] = useState(
    userState.notifications.dailyLearningReminder
  );
  const [reviewTime, setReviewTime] = useState(userState.preferences.reviewTime);
  const [soundEnabled, setSoundEnabled] = useState(userState.preferences.soundEnabled);
  const helpRef = useRef<any>(null);
  const privacyRef = useRef<any>(null);
  const reviewScheduleRef = useRef<any>(null);
  const editProfileRef = useRef<any>(null);
  const languageRef = useRef<any>(null);
  const themeRef = useRef<BottomSheetModal>(null);
  const logoutRef = useRef<BottomSheetModal>(null);
  const languageLabel =
    userState.preferences.language === 'system'
      ? `${languageT('followSystem')} · ${languageT('english')}/${languageT('chinese')}`
      : userState.preferences.language === 'zh'
        ? languageT('chinese')
        : languageT('english');
  const level = Math.max(1, levelInfo?.currentLevel ?? user?.level ?? 1);
  const fallbackLevelTitle = getLevelTitleForLevel(level, DEFAULT_LEVEL_TITLES);
  const levelTitle = language === 'zh'
    ? levelInfo?.currentLevelConfig?.titleZh ?? levelInfo?.currentLevelConfig?.title ?? fallbackLevelTitle.titleZh
    : levelInfo?.currentLevelConfig?.title ?? fallbackLevelTitle.titleEn;
  const selectedTheme = userState.preferences.theme ?? 'light';
  const themeLabel = selectedTheme === 'dark'
    ? t('dark')
    : selectedTheme === 'auto'
      ? t('systemTheme')
      : t('light');

  useEffect(() => {
    setReviewRemindersEnabled(userState.notifications.reviewReminders);
    setDailyLearningEnabled(userState.notifications.dailyLearningReminder);
    setReviewTime(userState.preferences.reviewTime);
    setSoundEnabled(userState.preferences.soundEnabled);
  }, [
    userState.notifications.dailyLearningReminder,
    userState.notifications.reviewReminders,
    userState.preferences.reviewTime,
    userState.preferences.soundEnabled,
  ]);

  const saveSoundPreference = async (enabled: boolean) => {
    setSoundEnabled(enabled);
    await updatePreferences({ soundEnabled: enabled });
  };

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
        Toast.show({
          type: 'error',
          text1: t('notificationsDisabled'),
          text2: t('enableDailyReminders'),
        });
        return;
      }
      await PushNotificationService.scheduleDailyLearning(reviewTime, userState.preferences.language);
      await persistDailyLearningPreference(true);
    } catch (error) {
      setDailyLearningEnabled(previousValue);
      await persistDailyLearningPreference(previousValue);
      Toast.show({
        type: 'error',
        text1: t('reminderUpdateFailed'),
        text2: error instanceof Error ? error.message : t('unableUpdateDailyReminder'),
      });
    }
  };

  const saveReviewReminders = async (enabled: boolean) => {
    const previousValue = reviewRemindersEnabled;
    setReviewRemindersEnabled(enabled);
    try {
      if (!enabled) {
        await PushNotificationService.cancelAllReviewNotifications();
        await updateState({
          notifications: { ...userState.notifications, reviewReminders: false },
        });
        return;
      }

      const granted = await PushNotificationService.requestPermissions();
      if (!granted) {
        setReviewRemindersEnabled(false);
        await updateState({
          notifications: { ...userState.notifications, reviewReminders: false },
        });
        Toast.show({
          type: 'error',
          text1: t('notificationsDisabled'),
          text2: t('enableReviewReminders'),
        });
        return;
      }

      await InAppNotificationSync.syncAllUpcoming(true, userState.preferences.language);
      await updateState({ notifications: { ...userState.notifications, reviewReminders: true } });
    } catch (error) {
      setReviewRemindersEnabled(previousValue);
      await updateState({
        notifications: { ...userState.notifications, reviewReminders: previousValue },
      });
      Toast.show({
        type: 'error',
        text1: t('reminderUpdateFailed'),
        text2: error instanceof Error ? error.message : t('unableUpdateReviewReminders'),
      });
    }
  };

  const displayName = user?.displayName?.trim() || 'Memory learner';
  const isPremium = Boolean(user?.isPremium);
  const selectedLanguage = (userState.preferences.language as AppLanguage) ?? 'system';

  const saveReviewTime = (time: string) => {
    const previousTime = reviewTime;

    // Update the visible setting and close the sheet immediately. Persistence
    // and native notification scheduling should not delay the interaction.
    setReviewTime(time);
    reviewScheduleRef.current?.dismiss();

    void (async () => {
      try {
        await updatePreferences({ reviewTime: time });
      } catch (error) {
        setReviewTime(previousTime);
        await updatePreferences({ reviewTime: previousTime }).catch(() => undefined);
        Toast.show({
          type: 'error',
          text1: t('reminderUpdateFailed'),
          text2: error instanceof Error ? error.message : t('unableSaveReminderTime'),
        });
        return;
      }

      if (!dailyLearningEnabled) return;

      try {
        await PushNotificationService.scheduleDailyLearning(time, userState.preferences.language);
      } catch (error) {
        Toast.show({
          type: 'error',
          text1: t('reminderUpdateFailed'),
          text2: error instanceof Error ? error.message : t('timeSavedScheduleFailed'),
        });
      }
    })();
  };

  return (
    <View style={styles.page}>
      <CommonHeader
        eyebrow={t('title')}
        title={t('yourProgress')}
        description={t('levelXpStreak')}
        hideBackButton
        showAiCredits={false}
      />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={[styles.profileHead, { backgroundColor: activeTheme.violetTint, borderColor: activeTheme.violetLine }]}>
          <View style={styles.avatar}>
            {user?.avatarUrl ? (
              <AppImage source={{ uri: user.avatarUrl }} style={styles.avatarImage} />
            ) : (
              <LinearGradient
                colors={['#FFC93C', '#FF6F91']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.avatarGradient}>
                <Text style={styles.avatarEmoji}>🧑‍🎓</Text>
              </LinearGradient>
            )}
          </View>
          <Text style={[styles.profileName, { color: activeTheme.ink }]}>{displayName}</Text>
          <Text style={[styles.profileSubtitle, { color: activeTheme.inkSoft }]}>
            Level {level} · {levelTitle}
          </Text>
          <AnimatedPressable
            onPress={() => editProfileRef.current?.present()}
            style={[styles.editButton, { backgroundColor: activeTheme.paper, borderColor: activeTheme.line }]}>
            <Pencil size={14} color={activeTheme.ink} />
            <Text style={[styles.editButtonText, { color: activeTheme.ink }]}>{t('editProfile')}</Text>
          </AnimatedPressable>
        </View>

        <NightEmphasisCard style={styles.planCard}>
          <Text style={styles.planBadge}>{isPremium ? t('premiumPlan') : t('freePlan')}</Text>
          <Text style={styles.planTitle}>
            {isPremium ? t('strongMemoryHabit') : t('unlockFaster')}
          </Text>
          <Text style={styles.planSubtitle}>
            {isPremium ? t('keepStreak') : t('premiumBenefits')}
          </Text>
          <AnimatedPressable onPress={() => router.push('/premium')} style={styles.upgradeButton}>
            <Text style={styles.upgradeButtonText}>
              {isPremium ? t('managePlan') : t('upgradePro')}
            </Text>
          </AnimatedPressable>
        </NightEmphasisCard>

        <Text style={[styles.sectionLabel, { color: activeTheme.ink }]}>{t('settings')}</Text>
        <View style={styles.settingsList}>
          <ProfileSettingsRow
            icon={<Text style={styles.settingsEmoji}>🧠</Text>}
            title={onboardingT('starterPickerTitle')}
            onPress={() => router.push('/onboarding?replay=true')}
          />
          <ProfileSettingsRow
            icon={<Text style={styles.settingsEmoji}>🧭</Text>}
            title={onboardingT('guideEntry')}
            onPress={() => startTour()}
          />
          <ProfileSettingsRow
            icon={<Text style={styles.settingsEmoji}>🔔</Text>}
            title={t('reviewReminders')}
            value={reviewRemindersEnabled ? t('on') : t('off')}
            right={<Switch value={reviewRemindersEnabled} onValueChange={saveReviewReminders} />}
          />
          <ProfileSettingsRow
            icon={<Text style={styles.settingsEmoji}>📚</Text>}
            title={t('dailyLearning')}
            value={reviewTime}
            right={
              <View style={styles.reminderControl}>
                <Text style={styles.settingsValue}>{reviewTime}</Text>
                <Switch value={dailyLearningEnabled} onValueChange={saveDailyLearningReminder} />
              </View>
            }
            onPress={() => reviewScheduleRef.current?.present()}
          />
          <ProfileSettingsRow
            icon={<Text style={styles.settingsEmoji}>🔊</Text>}
            title={t('soundHaptics')}
            value={soundEnabled ? t('on') : t('off')}
            right={<Switch value={soundEnabled} onValueChange={saveSoundPreference} />}
          />
          <ProfileSettingsRow
            icon={<Text style={styles.settingsEmoji}>🌐</Text>}
            title={t('language')}
            value={languageLabel}
            onPress={() => languageRef.current?.present()}
          />
          <ProfileSettingsRow
            icon={<Text style={styles.settingsEmoji}>🌙</Text>}
            title={t('theme')}
            value={themeLabel}
            onPress={() => themeRef.current?.present()}
          />
          <ProfileSettingsRow
            icon={<Text style={styles.settingsEmoji}>❓</Text>}
            title={t('helpSupport')}
            onPress={() => helpRef.current?.present()}
          />
          <ProfileSettingsRow
            icon={<Text style={styles.settingsEmoji}>ℹ️</Text>}
            title={t('about')}
            onPress={() => privacyRef.current?.present()}
          />
        </View>

        <AnimatedPressable onPress={() => logoutRef.current?.present()} style={styles.signOutButton}>
          <LogOut size={18} color={theme.berryDeep} />
          <Text style={styles.signOutText}>{t('signOut')}</Text>
        </AnimatedPressable>
      </ScrollView>

      <ReviewScheduleSheet
        ref={reviewScheduleRef}
        currentTime={reviewTime}
        onSave={saveReviewTime}
      />
      <LanguageSheet
        ref={languageRef}
        currentLanguage={selectedLanguage}
        onSave={(language) => {
          languageRef.current?.dismiss();
          return updatePreferences({ language });
        }}
      />
      <ThemeSheet
        ref={themeRef}
        currentTheme={selectedTheme}
        onSave={(nextTheme: AppTheme) => {
          themeRef.current?.dismiss();
          return updatePreferences({ theme: nextTheme });
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
      <AboutSheet ref={privacyRef} />
      <ActionSheet
        ref={logoutRef}
        onAction={logout}
        title={t('signOutTitle')}
        description={t('signOutDescription')}
        actionLabel={t('signOutTitle')}
        cancelLabel={t('cancel')}
        variant="destructive"
        Icon={LogOut}
      />
    </View>
  );
}

function ProfileSettingsRow({
  icon,
  title,
  value,
  right,
  onPress,
}: {
  icon: ReactNode;
  title: string;
  value?: string;
  right?: ReactNode;
  onPress?: () => void;
}) {
  const { styles, theme } = useStyles();
  const content = (
    <View style={styles.settingsRow}>
      <View style={styles.settingsIcon}>{icon}</View>
      <Text style={styles.settingsTitle}>{title}</Text>
      {right ?? (value ? <Text style={styles.settingsValue}>{value}</Text> : null)}
      {onPress && !right ? <ChevronRight size={18} color={theme.inkMuted} strokeWidth={2.5} /> : null}
    </View>
  );
  return onPress ? <AnimatedPressable onPress={onPress}>{content}</AnimatedPressable> : content;
}

const useStyles = createThemedStyles((theme) => StyleSheet.create({
  page: { flex: 1, backgroundColor: 'transparent' },
  content: { padding: 20, paddingBottom: 48 },
  profileHead: { alignItems: 'center', padding: 24, marginBottom: 22, borderRadius: 28, borderWidth: 2 },
  avatar: {
    width: 78,
    height: 78,
    borderRadius: 39,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0px 8px 18px rgba(255,111,145,0.28)',
  },
  avatarGradient: { flex: 1, width: '100%', alignItems: 'center', justifyContent: 'center' },
  avatarImage: { width: '100%', height: '100%', borderRadius: 39 },
  avatarEmoji: { fontSize: 34 },
  profileName: {
    color: theme.ink,
    fontFamily: typography.displayExtraBold,
    fontSize: 19,
    marginTop: 10,
  },
  profileSubtitle: {
    color: theme.inkSoft,
    fontFamily: typography.bodyBold,
    fontSize: 12,
    marginTop: 2,
  },
  editButton: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: theme.paper,
    borderWidth: 2,
    borderColor: theme.line,
    borderRadius: 13,
    paddingHorizontal: 18,
    marginTop: 10,
  },
  editButtonText: { color: theme.ink, fontFamily: typography.display, fontSize: 13.5 },
  planCard: { marginBottom: 8 },
  planBadge: {
    alignSelf: 'flex-start',
    color: 'white',
    backgroundColor: 'rgba(255,255,255,0.14)',
    fontFamily: typography.displayExtraBold,
    fontSize: 10.5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    marginBottom: 10,
  },
  planTitle: { color: 'white', fontFamily: typography.displayExtraBold, fontSize: 15 },
  planSubtitle: {
    color: '#C9C5E0',
    fontFamily: typography.bodyBold,
    fontSize: 11.5,
    lineHeight: 16,
    marginTop: 5,
  },
  upgradeButton: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.sun,
    borderRadius: 15,
    marginTop: 12,
    boxShadow: `0px 5px 0px ${theme.sunDeep}`,
  },
  upgradeButtonText: { color: theme.onSun, fontFamily: typography.displayExtraBold, fontSize: 14 },
  sectionLabel: {
    color: theme.inkSoft,
    fontFamily: typography.displayExtraBold,
    fontSize: 13,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    marginTop: 22,
    marginBottom: 10,
  },
  settingsList: {
    backgroundColor: theme.paper,
    borderWidth: 2,
    borderColor: theme.line,
    borderRadius: 16,
    overflow: 'hidden',
  },
  settingsRow: {
    minHeight: 60,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: theme.line,
  },
  settingsIcon: { width: 36, height: 36, borderRadius: 12, backgroundColor: theme.violetTint, alignItems: 'center', justifyContent: 'center' },
  settingsEmoji: { fontSize: 19, lineHeight: 24 },
  settingsTitle: { flex: 1, color: theme.ink, fontFamily: typography.display, fontSize: 13 },
  settingsValue: { color: theme.inkSoft, fontFamily: typography.bodyBold, fontSize: 12 },
  reminderControl: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  signOutButton: {
    minHeight: 46,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 2,
    borderColor: theme.berryLine,
    borderRadius: 13,
    backgroundColor: theme.berryTint,
    marginTop: 18,
  },
  signOutText: { color: theme.berryDeep, fontFamily: typography.display, fontSize: 13.5 },
}));
