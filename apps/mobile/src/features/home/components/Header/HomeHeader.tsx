import { User } from '@/features/profile/types/users';
import { greetingByTime } from '@/utils/greeting';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Text, View } from 'react-native';
import { typography } from '@/theme/typography';
import { CommonHeader } from '@/components/CommonHeader';
import AnimatedPressable from '@/components/AnimatedPressable';

interface HomeHeaderProps {
  userData: User;
}

export function HomeHeader({ userData }: HomeHeaderProps) {
  const router = useRouter();
  const name = userData?.displayName ?? 'Welcome';
  const level = Math.max(1, userData?.level ?? 1);

  return (
    <>
      <CommonHeader
        eyebrow="MemoPal"
        title="Home"
        description="Your daily memory dashboard"
        hideBackButton
      />
      <View style={styles.greetingRow}>
        <View style={styles.greetingCopy}>
          <Text style={styles.greetingTitle}>{greetingByTime()}, {name} 👋</Text>
          <Text style={styles.greetingSubtitle}>Ready to lock in a few more words?</Text>
        </View>
        <AnimatedPressable
          accessibilityLabel="Open profile"
          onPress={() => router.push('/(tabs)/profile')}
          style={styles.avatarRing}>
          <LinearGradient colors={['#FFC93C', '#FF6F91']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.avatarGradient}>
            <Text style={styles.avatarLevel}>{level}</Text>
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
  avatarRing: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.25)',
    overflow: 'hidden' as const,
  },
  avatarGradient: { flex: 1, width: '100%' as const, alignItems: 'center' as const, justifyContent: 'center' as const },
  avatarLevel: { color: '#2B2A3D', fontFamily: typography.displayExtraBold, fontSize: 16 },
};
