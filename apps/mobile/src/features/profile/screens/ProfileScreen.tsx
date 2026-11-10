import { useSpotlightTour } from '@/features/onboarding/components/SpotlightTourProvider';
import { createThemedStyles } from '@/theme/createThemedStyles';
import AnimatedPressable from '@/components/AnimatedPressable';
import { ActionSheet } from '@/components/ActionSheet';
import { MemoryAvatar } from '@/components/MemoryAvatar';
import { CommonHeader } from '@/components/CommonHeader';
import { useAuth } from '@/contexts/AuthProvider';
import { useUserState } from '@/contexts/UserStateContext';
import { useCurrentUser } from '@/features/profile/hooks/useCurrentUser';
import { useUpdateProfile } from '@/features/profile/hooks/useProfile';
import { getEquippedAvatar, useAvatars } from '@/features/avatars/hooks/useAvatars';
import { getEquippedAppearance, useAppearance } from '@/features/appearance/hooks/useAppearance';
import { PushNotificationService } from '@/features/notifications/services/pushNotificationService';
import { InAppNotificationSync } from '@/features/notifications/services/inAppNotificationSync';
import { typography } from '@/theme/typography';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { ArrowRight, Camera, ChevronRight, LogOut, Pencil } from '@/core/icons';
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
import {
  DEFAULT_LEVEL_TITLES,
  getLevelTitleForLevel,
} from '@/features/gamification/shared/utils/levelTitles';

export default function ProfileScreen() {
  const { styles, theme } = useStyles();
  const router = useRouter();
  const { start: startTour } = useSpotlightTour();
  const { user } = useCurrentUser();
  const { avatars } = useAvatars();
  const { items: appearanceItems } = useAppearance();
  const { userState, updateState, updatePreferences } = useUserState();
  const { language, t } = useTranslation('profile');
  const { t: onboardingT } = useTranslation('onboarding');
  const { t: languageT } = useTranslation('language');
  const { t: referralT } = useTranslation('referral');
  const { logout } = useAuth();
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
  const levelTitle =
    language === 'zh'
      ? (levelInfo?.currentLevelConfig?.titleZh ??
        levelInfo?.currentLevelConfig?.title ??
        fallbackLevelTitle.titleZh)
      : (levelInfo?.currentLevelConfig?.title ?? fallbackLevelTitle.titleEn);
  const currentStreak = Math.max(0, user?.stats?.currentStreak ?? 0);
  const totalXpForDisplay = Math.max(0, totalXp);
  const xpInCurrentLevel = Math.max(0, levelInfo?.xpInCurrentLevel ?? totalXpForDisplay % 100);
  const xpToNextLevel = Math.max(1, levelInfo?.xpToNextLevel ?? 100);
  const levelProgress = Math.min(1, xpInCurrentLevel / xpToNextLevel);
  const selectedTheme = userState.preferences.theme ?? 'light';
  const themeLabel =
    selectedTheme === 'dark' ? t('dark') : selectedTheme === 'auto' ? t('systemTheme') : t('light');
  const equippedAvatar = getEquippedAvatar(avatars, user?.selectedAvatarId, level);
  const equippedAppearance = getEquippedAppearance(
    appearanceItems,
    user?.selectedAvatarFrameId,
    user?.selectedAvatarDecorationId,
    user?.selectedAvatarOutfitId,
    level
  );
  const avatarSource =
    (user?.avatarSource === 'photo' || (!user?.avatarSource && Boolean(user?.avatarUrl))) &&
    user?.avatarUrl
      ? 'photo'
      : 'companion';

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
      await PushNotificationService.scheduleDailyLearning(
        reviewTime,
        userState.preferences.language
      );
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
        title={t('title')}
        description={t('profileDescription')}
        hideBackButton
        showAiCredits={false}
        actions={[
          {
            icon: Pencil,
            accessibilityLabel: t('editProfile'),
            onPress: () => editProfileRef.current?.present(),
          },
        ]}
      />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.profileIdentity}>
          <AnimatedPressable
            accessibilityRole="button"
            accessibilityLabel={
              language === 'zh' ? '更换个人照片或头像框' : 'Change profile photo or avatar frame'
            }
            onPress={() => router.push('/companion-closet')}
            style={styles.avatarDisplay}>
            <View style={styles.avatar}>
              {avatarSource === 'photo' ? (
                <MemoryAvatar
                  avatar={equippedAvatar}
                  appearance={equippedAppearance}
                  imageUrl={user?.avatarUrl}
                  level={level}
                  size={76}
                  showLevelBadge={false}
                />
              ) : (
                <MemoryAvatar
                  avatar={equippedAvatar}
                  appearance={equippedAppearance}
                  level={level}
                  size={76}
                  showLevelBadge={false}
                />
              )}
            </View>
            <View pointerEvents="none" style={styles.avatarCameraBadge}>
              <Camera size={12} color={theme.paper} />
            </View>
          </AnimatedPressable>
          <View style={styles.identityCopy}>
            <View style={styles.nameRow}>
              <Text numberOfLines={1} style={styles.profileName}>
                {displayName}
              </Text>
              {isPremium ? (
                <View style={styles.premiumBadge}>
                  <Ionicons name="ribbon" size={13} color={theme.sunDeep} />
                  <Text style={styles.premiumBadgeText}>PRO</Text>
                </View>
              ) : null}
            </View>
            <Text numberOfLines={1} style={styles.profileEmail}>
              {user?.email ?? 'Guest account'}
            </Text>
            <View style={styles.levelPill}>
              <Ionicons name="sparkles" size={14} color={theme.violetDeep} />
              <Text numberOfLines={1} style={styles.levelPillText}>
                {t('level')} {level} · {levelTitle}
              </Text>
            </View>
          </View>
        </View>

        <AnimatedPressable
          accessibilityLabel={t('yourProgress')}
          onPress={() => router.push('/progress')}
          style={styles.progressCard}>
          <View style={styles.cardHeader}>
            <View style={styles.cardHeadingCopy}>
              <Text style={styles.cardEyebrow}>{t('yourProgress')}</Text>
              <Text style={styles.cardDescription}>{t('levelXpStreak')}</Text>
            </View>
            <View style={styles.cardArrow}>
              <ArrowRight size={17} color={theme.violetDeep} strokeWidth={2.5} />
            </View>
          </View>
          <View style={styles.statsRow}>
            <ProfileStat
              icon={<Ionicons name="flame" size={20} color={theme.berryDeep} />}
              iconBackgroundColor={theme.berryTint}
              value={`${currentStreak}`}
              label={t('streak')}
              style={styles.streakStat}
            />
            <ProfileStat
              icon={<Ionicons name="book" size={20} color={theme.grass} />}
              iconBackgroundColor={theme.mintTint}
              value={`${user?.stats?.lessonsCompleted ?? 0}`}
              label={t('lessons')}
              style={styles.lessonsStat}
            />
            <ProfileStat
              icon={<Ionicons name="sparkles" size={20} color={theme.sunDeep} />}
              iconBackgroundColor={theme.sunTint}
              value={`${totalXpForDisplay}`}
              label={t('xp')}
              style={styles.xpStat}
            />
          </View>
          <View style={styles.levelProgressHeader}>
            <Text style={styles.levelProgressLabel}>{levelTitle}</Text>
            <Text style={styles.levelProgressValue}>
              {xpInCurrentLevel} / {xpToNextLevel} {t('xp')}
            </Text>
          </View>
          <View
            accessibilityRole="progressbar"
            accessibilityValue={{ min: 0, max: 100, now: Math.round(levelProgress * 100) }}
            style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${Math.round(levelProgress * 100)}%` }]} />
          </View>
        </AnimatedPressable>

        <AnimatedPressable onPress={() => router.push('/premium')} style={styles.planRow}>
          <View style={[styles.planIcon, isPremium ? styles.planIconPremium : styles.planIconFree]}>
            <Ionicons
              name="ribbon"
              size={22}
              color={isPremium ? theme.sunDeep : theme.violetDeep}
            />
          </View>
          <View style={styles.planCopy}>
            <View style={styles.planTitleRow}>
              <Text style={styles.planTitle}>{isPremium ? t('premiumPlan') : t('freePlan')}</Text>
              <View style={styles.planStatus}>
                <Text style={styles.planStatusText}>
                  {isPremium ? t('managePlan') : t('upgradePro')}
                </Text>
              </View>
            </View>
            <Text numberOfLines={1} style={styles.planSubtitle}>
              {isPremium ? t('keepStreak') : t('premiumBenefits')}
            </Text>
          </View>
          <ChevronRight size={19} color={theme.inkMuted} strokeWidth={2.4} />
        </AnimatedPressable>

        <SettingsSection
          title={language === 'zh' ? '沫沫' : 'Momo'}
          accentColor={theme.violetDeep}>
          <ProfileSettingsRow
            icon={<Ionicons name="paw" size={21} color={theme.violetDeep} />}
            iconBackgroundColor={theme.violetTint}
            title={language === 'zh' ? '沫沫空间' : 'Momo’s space'}
            onPress={() => router.push('/companion')}
            last
          />
        </SettingsSection>

        {user && user.accountMode !== 'RestrictedLearner' ? <SettingsSection title={language === 'zh' ? '账户与奖励' : 'Account & rewards'} accentColor={theme.violetDeep}>
          <ProfileSettingsRow icon={<Ionicons name="sparkles-outline" size={21} color={theme.violetDeep} />} iconBackgroundColor={theme.violetTint}
            title={language === 'zh' ? 'AI 点数' : 'AI credits'} onPress={() => router.push('/ai-credits')} last={false} />
          <ProfileSettingsRow
            icon={<Ionicons name="gift-outline" size={21} color={theme.violetDeep} />}
            iconBackgroundColor={theme.violetTint}
            title={referralT('invite')}
            onPress={() => router.push('/referral')}
            last
          />
        </SettingsSection> : null}

        <SettingsSection title={t('learning')} accentColor={theme.violetDeep}>
          <ProfileSettingsRow
            icon={<Ionicons name="stats-chart-outline" size={21} color={theme.violetDeep} />}
            iconBackgroundColor={theme.violetTint}
            title={language === 'zh' ? '学习记录与报告' : 'Learning history and reports'}
            onPress={() => router.push('/progress')}
            last={false}
          />
          <ProfileSettingsRow
            icon={<Ionicons name="school" size={21} color={theme.violetDeep} />}
            iconBackgroundColor={theme.violetTint}
            title={onboardingT('starterPickerTitle')}
            onPress={() => router.push('/onboarding?replay=true')}
            last={false}
          />
          <ProfileSettingsRow
            icon={<Ionicons name="compass" size={21} color={theme.sky} />}
            iconBackgroundColor={theme.skyTint}
            title={onboardingT('guideEntry')}
            onPress={() => startTour()}
            last
          />
        </SettingsSection>

        <SettingsSection title={t('preferences')} accentColor={theme.violetDeep}>
          <ProfileSettingsRow
            icon={<Ionicons name="notifications" size={21} color={theme.violetDeep} />}
            iconBackgroundColor={theme.violetTint}
            title={t('reviewReminders')}
            value={reviewRemindersEnabled ? t('on') : t('off')}
            right={<Switch value={reviewRemindersEnabled} onValueChange={saveReviewReminders} />}
            last={false}
          />
          <ProfileSettingsRow
            icon={<Ionicons name="time" size={21} color={theme.sunDeep} />}
            iconBackgroundColor={theme.sunTint}
            title={t('dailyLearning')}
            value={reviewTime}
            right={
              <View style={styles.reminderControl}>
                <Text style={styles.settingsValue}>{reviewTime}</Text>
                <Switch value={dailyLearningEnabled} onValueChange={saveDailyLearningReminder} />
              </View>
            }
            onPress={() => reviewScheduleRef.current?.present()}
            last={false}
          />
          <ProfileSettingsRow
            icon={<Ionicons name="volume-high" size={21} color={theme.grass} />}
            iconBackgroundColor={theme.mintTint}
            title={t('soundHaptics')}
            value={soundEnabled ? t('on') : t('off')}
            right={<Switch value={soundEnabled} onValueChange={saveSoundPreference} />}
            last={false}
          />
          <ProfileSettingsRow
            icon={<Ionicons name="globe" size={21} color={theme.link} />}
            iconBackgroundColor={theme.skyTint}
            title={t('language')}
            value={languageLabel}
            onPress={() => languageRef.current?.present()}
            last={false}
          />
          <ProfileSettingsRow
            icon={<Ionicons name="moon" size={21} color={theme.violetDeep} />}
            iconBackgroundColor={theme.violetTint}
            title={t('theme')}
            value={themeLabel}
            onPress={() => themeRef.current?.present()}
            last
          />
        </SettingsSection>

        <SettingsSection title={t('support')} accentColor={theme.sky}>
          <ProfileSettingsRow
            icon={<Ionicons name="help-circle" size={21} color={theme.sky} />}
            iconBackgroundColor={theme.skyTint}
            title={t('helpSupport')}
            onPress={() => helpRef.current?.present()}
            last={false}
          />
          <ProfileSettingsRow
            icon={<Ionicons name="information-circle" size={21} color={theme.inkSoft} />}
            iconBackgroundColor={theme.peachTint}
            title={t('about')}
            onPress={() => privacyRef.current?.present()}
            last
          />
        </SettingsSection>

        <AnimatedPressable
          onPress={() => logoutRef.current?.present()}
          style={styles.signOutButton}>
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
        onSave={async (payload) => {
          if (!user) return;
          await updateProfileMutation.mutateAsync({
            id: user.id,
            displayName: payload.displayName,
            email: payload.email,
          });
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
  iconBackgroundColor,
  title,
  value,
  right,
  onPress,
  last = false,
}: {
  icon: ReactNode;
  iconBackgroundColor?: string;
  title: string;
  value?: string;
  right?: ReactNode;
  onPress?: () => void;
  last?: boolean;
}) {
  const { styles, theme } = useStyles();
  const content = (
    <View style={[styles.settingsRow, !last && styles.settingsRowDivider]}>
      <View
        style={[
          styles.settingsIcon,
          iconBackgroundColor ? { backgroundColor: iconBackgroundColor } : null,
        ]}>
        {icon}
      </View>
      <Text style={styles.settingsTitle}>{title}</Text>
      {right ?? (value ? <Text style={styles.settingsValue}>{value}</Text> : null)}
      {onPress && !right ? (
        <ChevronRight size={18} color={theme.inkMuted} strokeWidth={2.5} />
      ) : null}
    </View>
  );
  return onPress ? <AnimatedPressable onPress={onPress}>{content}</AnimatedPressable> : content;
}

function SettingsSection({
  title,
  accentColor,
  children,
}: {
  title: string;
  accentColor: string;
  children: ReactNode;
}) {
  const { styles } = useStyles();
  return (
    <View style={styles.settingsSection}>
      <View style={styles.sectionLabelRow}>
        <View style={[styles.sectionDot, { backgroundColor: accentColor }]} />
        <Text style={styles.sectionLabel}>{title}</Text>
      </View>
      <View style={styles.settingsGroup}>{children}</View>
    </View>
  );
}

function ProfileStat({
  icon,
  iconBackgroundColor,
  value,
  label,
  style,
}: {
  icon: ReactNode;
  iconBackgroundColor?: string;
  value: string;
  label: string;
  style?: object;
}) {
  const { styles } = useStyles();
  return (
    <View style={[styles.statItem, style]}>
      <View
        style={[
          styles.statIcon,
          iconBackgroundColor ? { backgroundColor: iconBackgroundColor } : null,
        ]}>
        {icon}
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text numberOfLines={1} style={styles.statLabel}>
        {label}
      </Text>
    </View>
  );
}

const useStyles = createThemedStyles((theme) =>
  StyleSheet.create({
    page: { flex: 1, backgroundColor: 'transparent' },
    content: { padding: 20, paddingBottom: 48 },
    profileIdentity: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 18 },
    avatarDisplay: { width: 82, height: 82, alignItems: 'center', justifyContent: 'center' },
    avatarCameraBadge: {
      position: 'absolute',
      right: 0,
      bottom: 0,
      width: 27,
      height: 27,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 14,
      borderWidth: 2,
      borderColor: theme.paper,
      backgroundColor: theme.violetDeep,
    },
    avatar: {
      width: 76,
      height: 76,
      borderRadius: 38,
      overflow: 'visible',
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 3,
      borderColor: theme.paper,
      boxShadow: '0px 6px 16px rgba(105,80,204,0.18)',
    },
    identityCopy: { flex: 1, minWidth: 0 },
    nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, minWidth: 0 },
    profileName: {
      color: theme.ink,
      fontFamily: typography.displayExtraBold,
      fontSize: 21,
      flexShrink: 1,
    },
    profileEmail: {
      color: theme.inkSoft,
      fontFamily: typography.bodyBold,
      fontSize: 12,
    },
    premiumBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3,
      backgroundColor: theme.sunTint,
      borderColor: theme.sunLine,
      borderWidth: 1,
      borderRadius: 999,
      paddingHorizontal: 7,
      paddingVertical: 3,
    },
    premiumBadgeText: {
      color: theme.sunDeep,
      fontFamily: typography.bodyExtraBold,
      fontSize: 9,
      letterSpacing: 0.4,
    },
    levelPill: {
      alignSelf: 'flex-start',
      flexShrink: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      backgroundColor: theme.violetTint,
      borderColor: theme.violetLine,
      borderWidth: 1,
      borderRadius: 999,
      marginTop: 5,
      paddingHorizontal: 8,
      paddingVertical: 4,
      maxWidth: '100%',
    },
    levelPillText: {
      color: theme.violetDeep,
      fontFamily: typography.bodyExtraBold,
      fontSize: 10.5,
      flexShrink: 1,
    },
    progressCard: {
      backgroundColor: theme.paper,
      borderColor: theme.violetLine,
      borderWidth: 1.5,
      borderRadius: 22,
      padding: 16,
      marginBottom: 12,
      boxShadow: '0px 5px 0px rgba(105,80,204,0.06)',
    },
    cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    cardHeadingCopy: { flex: 1, minWidth: 0 },
    cardEyebrow: { color: theme.ink, fontFamily: typography.displayExtraBold, fontSize: 16 },
    cardDescription: {
      color: theme.inkSoft,
      fontFamily: typography.bodyBold,
      fontSize: 11,
      marginTop: 1,
    },
    cardArrow: {
      width: 34,
      height: 34,
      borderRadius: 12,
      backgroundColor: theme.violetTint,
      alignItems: 'center',
      justifyContent: 'center',
    },
    statsRow: { flexDirection: 'row', alignItems: 'stretch', marginTop: 16 },
    statItem: { flex: 1, alignItems: 'center', minWidth: 0, paddingHorizontal: 4 },
    streakStat: { borderRightWidth: 1, borderRightColor: theme.line },
    lessonsStat: { borderRightWidth: 1, borderRightColor: theme.line },
    xpStat: {},
    statIcon: {
      width: 34,
      height: 34,
      borderRadius: 12,
      backgroundColor: theme.peachTint,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 7,
    },
    statValue: { color: theme.ink, fontFamily: typography.displayExtraBold, fontSize: 18 },
    statLabel: {
      color: theme.inkSoft,
      fontFamily: typography.bodyBold,
      fontSize: 10,
      marginTop: 1,
      maxWidth: '100%',
    },
    levelProgressHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 10,
      marginTop: 16,
    },
    levelProgressLabel: {
      color: theme.ink,
      fontFamily: typography.bodyExtraBold,
      fontSize: 11,
      flex: 1,
    },
    levelProgressValue: { color: theme.inkSoft, fontFamily: typography.bodyBold, fontSize: 10 },
    progressTrack: {
      height: 8,
      backgroundColor: theme.line,
      borderRadius: 999,
      overflow: 'hidden',
      marginTop: 8,
    },
    progressFill: { height: '100%', backgroundColor: theme.violetDeep, borderRadius: 999 },
    planRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 11,
      backgroundColor: theme.paper,
      borderColor: theme.line,
      borderWidth: 1.5,
      borderRadius: 18,
      padding: 13,
      marginBottom: 9,
    },
    planIcon: {
      width: 40,
      height: 40,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
    },
    planIconPremium: { backgroundColor: theme.sunTint },
    planIconFree: { backgroundColor: theme.violetTint },
    planCopy: { flex: 1, minWidth: 0 },
    planTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    planTitle: { color: theme.ink, fontFamily: typography.displayExtraBold, fontSize: 13.5 },
    planStatus: {
      backgroundColor: theme.violetTint,
      borderRadius: 999,
      paddingHorizontal: 7,
      paddingVertical: 3,
    },
    planStatusText: {
      color: theme.violetDeep,
      fontFamily: typography.bodyExtraBold,
      fontSize: 9.5,
    },
    planSubtitle: {
      color: theme.inkSoft,
      fontFamily: typography.bodyBold,
      fontSize: 10.5,
      marginTop: 3,
    },
    settingsSection: { marginTop: 8 },
    sectionLabelRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 7,
      marginLeft: 3,
      marginBottom: 8,
      minHeight: 16,
    },
    sectionDot: { width: 7, height: 7, borderRadius: 4 },
    sectionLabel: {
      color: theme.inkSoft,
      fontFamily: typography.displayExtraBold,
      fontSize: 11,
      lineHeight: 16,
      letterSpacing: 0.4,
      textTransform: 'uppercase',
    },
    settingsGroup: {
      backgroundColor: theme.paper,
      borderWidth: 1.5,
      borderColor: theme.line,
      borderRadius: 18,
      overflow: 'hidden',
      marginBottom: 8,
    },
    settingsRow: {
      minHeight: 60,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 11,
      paddingHorizontal: 14,
    },
    settingsRowDivider: {
      borderBottomWidth: 1,
      borderBottomColor: theme.line,
    },
    settingsIcon: {
      width: 36,
      height: 36,
      borderRadius: 12,
      backgroundColor: theme.violetTint,
      alignItems: 'center',
      justifyContent: 'center',
    },
    settingsTitle: {
      flex: 1,
      color: theme.ink,
      fontFamily: typography.bodyExtraBold,
      fontSize: 13,
    },
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
  })
);
