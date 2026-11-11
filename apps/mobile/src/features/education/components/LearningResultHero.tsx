import { AppText as Text } from '@/components/ui/AppText';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';
import { View } from 'react-native';
import { CompanionActor } from '@/features/profile/companion/CompanionActor';
import { useAuth } from '@/contexts/AuthProvider';
import { LearningArrival, useLearningStyles } from './LearningUi';

export function LearningResultHero({ title, subtitle, stars }: { title: string; subtitle: string; stars: number }) {
  const { theme, styles } = useLearningStyles();
  const { user } = useAuth();
  return <LearningArrival><LinearGradient colors={theme.hero as [string, string]} start={[0, 0]} end={[1, 1]} style={styles.resultHero}>
    <CompanionActor stage={user?.level ?? 1} size={96} cue={{ action: 'celebrate', sequence: 0 }} />
    <View accessibilityLabel={`${stars}/3`} style={styles.row}>{[1, 2, 3].map(star => <Ionicons key={star} name={star <= stars ? 'star' : 'star-outline'} size={44} color={theme.sun} />)}</View>
    <Text accessibilityRole="header" style={styles.resultTitle}>{title}</Text>
    <Text style={styles.resultSubtitle}>{subtitle}</Text>
  </LinearGradient></LearningArrival>;
}
