import { ChevronRight, CircleHelp, Flame, Sparkles } from '@/core/icons';
import { useSpotlightTour } from '@/features/onboarding/components/SpotlightTourProvider';
import { User } from '@/features/profile/types/users';
import AnimatedPressable from '@/components/AnimatedPressable';
import { MemoryAvatar } from '@/components/MemoryAvatar';
import { useRouter } from 'expo-router';
import { Text, View } from 'react-native';
import { typography } from '@/theme/typography';
import { useTranslation } from '@/core/i18n/useTranslation';
import { memopalThemes } from '@/theme/memopalTheme';
import { useColorScheme } from 'nativewind';
import { useAiCredits } from '@/features/ai-credits/hooks/useAiCredits';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLevelByXp } from '@/features/gamification/shared/hooks/useLevelConfigs';
import Svg, { Circle as SvgCircle } from 'react-native-svg';
import { getEquippedAvatar, useAvatars } from '@/features/avatars/hooks/useAvatars';
import { getEquippedAppearance, useAppearance } from '@/features/appearance/hooks/useAppearance';

interface HomeHeaderProps {
  userData: User;
}

export function HomeHeader({ userData }: HomeHeaderProps) {
  const router = useRouter();
  const { start } = useSpotlightTour();
  const { t: onboardingT } = useTranslation('onboarding');
  const { t } = useTranslation('home');
  const hour = new Date().getHours();
  const greeting = hour < 12 ? t('greetingMorning') : hour < 18 ? t('greetingAfternoon') : t('greetingEvening');
  const name = userData?.displayName?.trim() || t('welcome');
  const level = Math.max(1, userData?.level ?? 1);
  const { colorScheme } = useColorScheme();
  const theme = memopalThemes[colorScheme ?? 'light'];
  const streak = Math.max(0, userData?.stats?.currentStreak ?? 0);
  const insets = useSafeAreaInsets();
  const aiCredits = useAiCredits();
  const { levelInfo } = useLevelByXp(userData.totalXp ?? 0, level);
  const { avatars } = useAvatars();
  const { items: appearanceItems } = useAppearance();
  const equippedAvatar = getEquippedAvatar(avatars, userData.selectedAvatarId, level);
  const equippedAppearance = getEquippedAppearance(
    appearanceItems,
    userData.selectedAvatarFrameId,
    userData.selectedAvatarDecorationId,
    userData.selectedAvatarOutfitId,
    level,
  );
  const usePhoto = (userData.avatarSource === 'photo' || (!userData.avatarSource && Boolean(userData.avatarUrl))) && Boolean(userData.avatarUrl);
  const levelProgress = levelInfo
    ? levelInfo.xpInCurrentLevel / Math.max(1, levelInfo.xpInCurrentLevel + levelInfo.xpToNextLevel)
    : 0;

  return (
    <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
      <View style={styles.identityRow}>
        <AnimatedPressable
          accessibilityLabel={`${t('levelLabel')} ${level}`}
          onPress={() => router.push('/(tabs)/profile')}
          style={styles.avatarRing}>
          <Svg width={52} height={52} viewBox="0 0 52 52" style={styles.avatarProgress}>
            <SvgCircle cx={26} cy={26} r={23} fill="none" stroke={theme.line} strokeWidth={3} />
            <SvgCircle cx={26} cy={26} r={23} fill="none" stroke="#FFC93C" strokeWidth={3} strokeDasharray={`${2 * Math.PI * 23 * levelProgress} ${2 * Math.PI * 23}`} strokeLinecap="round" rotation={-90} origin="26, 26" />
          </Svg>
          <View style={styles.avatarInner}>
            {usePhoto || equippedAvatar?.imageUrl ? (
              <MemoryAvatar
                avatar={equippedAvatar}
                appearance={equippedAppearance}
                imageUrl={usePhoto ? userData.avatarUrl : undefined}
                size={40}
                showLevelBadge={false}
              />
            ) : <Text style={styles.avatarFallback}>🦉</Text>}
          </View>
          <Text style={[styles.levelBadge, { backgroundColor: theme.violetDeep, color: theme.onAccent }]}>Lv.{level}</Text>
        </AnimatedPressable>
        <View style={styles.greetingCopy}>
          <Text numberOfLines={1} style={[styles.greetingTitle, { color: theme.ink }]}>{greeting}, {name} 👋</Text>
        </View>
        <AnimatedPressable accessibilityRole="button" accessibilityLabel={onboardingT('guideEntry')} onPress={() => start()} style={[styles.helpButton, { borderColor: theme.violetLine, backgroundColor: theme.paper }]}>
          <CircleHelp size={18} color={theme.violetDeep} />
        </AnimatedPressable>
      </View>
      <View style={[styles.statusRail, { backgroundColor: theme.paper, borderColor: theme.violetLine }]}>
        <View style={styles.statusCell}>
          <View style={[styles.statusIcon, { backgroundColor: theme.sunTint }]}>
            <Flame size={16} color={theme.berryDeep} fill={theme.berryDeep} />
          </View>
          <View style={styles.statusCopy}>
            <Text style={[styles.creditValue, { color: theme.ink }]}>{streak}</Text>
            <Text style={[styles.statusLabel, { color: theme.inkSoft }]}>{t('streakDaysLabel')}</Text>
          </View>
        </View>
        <View style={[styles.statusDivider, { backgroundColor: theme.line }]} />
        <AnimatedPressable
          accessibilityRole="button"
          accessibilityLabel={`${t('aiCreditsLabel')} ${aiCredits.data?.available ?? 0}`}
          onPress={() => router.push('/ai-credits')}
          style={styles.statusCell}>
          <View style={[styles.creditIcon, { backgroundColor: theme.violetTint }]}><Sparkles size={16} color={theme.violetDeep} /></View>
          <View style={styles.statusCopy}>
            <Text style={[styles.creditValue, { color: theme.ink }]}>{aiCredits.isPending ? '…' : compactCreditCount(aiCredits.data?.available ?? 0)}</Text>
            <Text style={[styles.statusLabel, { color: theme.inkSoft }]}>{t('aiCreditsLabel')}</Text>
          </View>
          <ChevronRight size={16} color={theme.inkSoft} />
        </AnimatedPressable>
      </View>
    </View>
  );
}

const styles = {
  header: {
    paddingHorizontal: 18,
    paddingTop: 8,
    paddingBottom: 6,
  },
  identityRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 10,
  },
  avatarRing: { width: 48, height: 48, borderRadius: 24, alignItems: 'center' as const, justifyContent: 'center' as const, position: 'relative' as const },
  avatarProgress: { position: 'absolute' as const, left: -2, top: -2 },
  avatarInner: { width: 40, height: 40, borderRadius: 20, alignItems: 'center' as const, justifyContent: 'center' as const, backgroundColor: '#EEE8FF' },
  avatarFallback: { fontSize: 24 },
  levelBadge: { position: 'absolute' as const, right: -6, bottom: -5, borderRadius: 10, borderWidth: 2, borderColor: '#FFFFFF', paddingHorizontal: 5, paddingVertical: 1, fontFamily: typography.bodyExtraBold, fontSize: 8 },
  greetingCopy: { flex: 1, minWidth: 0 },
  greetingTitle: { fontFamily: typography.displayExtraBold, fontSize: 18 },
  statusRail: { height: 58, flexDirection: 'row' as const, alignItems: 'center' as const, borderWidth: 1.5, borderRadius: 18, marginTop: 12, overflow: 'hidden' as const },
  statusCell: { flex: 1, minWidth: 0, height: '100%' as const, flexDirection: 'row' as const, alignItems: 'center' as const, justifyContent: 'center' as const, gap: 9, paddingHorizontal: 10 },
  statusDivider: { width: 1, height: 32 },
  statusIcon: { width: 30, height: 30, borderRadius: 11, alignItems: 'center' as const, justifyContent: 'center' as const },
  statusLabel: { fontFamily: typography.bodyBold, fontSize: 9.5, marginTop: 1 },
  creditIcon: { width: 30, height: 30, borderRadius: 11, alignItems: 'center' as const, justifyContent: 'center' as const },
  statusCopy: { minWidth: 0 },
  creditValue: { fontFamily: typography.displayExtraBold, fontSize: 14, lineHeight: 16 },
  helpButton: { width: 44, height: 44, borderRadius: 16, borderWidth: 1.5, alignItems: 'center' as const, justifyContent: 'center' as const },
};

function compactCreditCount(value: number) {
  if (value >= 1_000_000) return `${Math.floor(value / 100_000) / 10}m`;
  if (value >= 10_000) return `${Math.floor(value / 1_000)}k`;
  if (value >= 1_000) return `${Math.floor(value / 100) / 10}k`;
  return String(value);
}
