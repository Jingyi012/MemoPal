import { AppText as Text } from '@/components/ui/AppText';
import { appSpacing } from '@/theme/designSystem';
import { LinearGradient } from 'expo-linear-gradient';
import { View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { LearningButton, useLearningStyles } from './LearningUi';

export function LearningMemoryCard({ title, description, label, onPress, disabled }: { title: string; description: string; label: string; onPress: () => void; disabled?: boolean }) {
  const { theme, styles } = useLearningStyles();
  return <LinearGradient colors={theme.memory as [string, string]} start={[0, 0]} end={[1, 1]} style={styles.memoryCard}>
    <Ionicons name="business-outline" size={40} color={theme.memoryInk} style={{ position: 'absolute', right: 16, top: 16 }} />
    <View style={{ paddingRight: 60, gap: appSpacing.xs }}><Text style={[styles.title, { color: theme.memoryInk }]}>{title}</Text><Text style={[styles.body, { color: theme.memoryInk }]}>{description}</Text></View>
    <View style={{ alignSelf: 'flex-start' }}><LearningButton tone="white" compact label={label} disabled={disabled} onPress={onPress} /></View>
  </LinearGradient>;
}
