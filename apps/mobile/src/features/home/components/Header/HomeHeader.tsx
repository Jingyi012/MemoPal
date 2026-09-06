import { User } from '@/features/profile/types/users';
import AnimatedPressable from '@/components/AnimatedPressable';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Text, View } from 'react-native';
import { typography } from '@/theme/typography';
import { CommonHeader } from '@/components/CommonHeader';
import { useTranslation } from '@/core/i18n/useTranslation';
import { memopalThemes } from '@/theme/memopalTheme';
import { useColorScheme } from 'nativewind';

interface HomeHeaderProps {
  userData: User;
}

export function HomeHeader({ userData }: HomeHeaderProps) {
  const router = useRouter();
  const { t } = useTranslation('home');
  const hour = new Date().getHours();
  const greeting = hour < 12 ? t('greetingMorning') : hour < 18 ? t('greetingAfternoon') : t('greetingEvening');
  const name = userData?.displayName?.trim() || t('welcome');
  const level = Math.max(1, userData?.level ?? 1);
  const { colorScheme } = useColorScheme();
  const theme = memopalThemes[colorScheme ?? 'light'];

  return (
    <>
      <CommonHeader
        eyebrow="MemoPal"
        title={t('title')}
        description={t('description')}
        hideBackButton
      />
      <View style={styles.greetingRow}>
        <View style={styles.greetingCopy}>
          <Text style={[styles.greetingTitle, { color: theme.ink }]}>{greeting}, {name} 👋</Text>
          <Text style={[styles.greetingSubtitle, { color: theme.inkSoft }]}>{t('ready')}</Text>
        </View>
        <AnimatedPressable
          accessibilityLabel={`${t('levelLabel')} ${level}`}
          onPress={() => router.push('/(tabs)/profile')}
          style={styles.levelRing}>
          <LinearGradient colors={['#FFC93C', '#FF6F91']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.levelGradient}>
            <Text style={[styles.levelValue, { color: theme.ink }]}>{level}</Text>
          </LinearGradient>
        </AnimatedPressable>
      </View>
    </>
  );
}

const styles = {
  greetingRow: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 2,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
  },
  greetingCopy: { flex: 1, paddingRight: 12 },
  greetingTitle: { color: '#2B2A3D', fontFamily: typography.displayExtraBold, fontSize: 18 },
  greetingSubtitle: { color: '#6B6A80', fontFamily: typography.bodyBold, fontSize: 12, marginTop: 2 },
  levelRing: { width: 52, height: 52, borderRadius: 26, borderWidth: 3, borderColor: 'rgba(255,255,255,0.25)', overflow: 'hidden' as const },
  levelGradient: { flex: 1, width: '100%' as const, alignItems: 'center' as const, justifyContent: 'center' as const },
  levelValue: { color: '#2B2A3D', fontFamily: typography.displayExtraBold, fontSize: 17 },
};
