import { LinearGradient } from 'expo-linear-gradient';
import { Text, View } from 'react-native';
import { LearningButton, useLearningStyles } from './LearningUi';

export function LearningMemoryCard({ title, description, label, onPress, disabled }: { title: string; description: string; label: string; onPress: () => void; disabled?: boolean }) {
  const { theme, styles } = useLearningStyles();
  return <LinearGradient colors={theme.memory as [string, string]} start={[0, 0]} end={[1, 1]} style={styles.memoryCard}>
    <Text accessibilityElementsHidden style={{ position: 'absolute', right: 14, top: 12, fontSize: 48 }}>🏛️</Text>
    <View style={{ paddingRight: 60, gap: 4 }}><Text style={[styles.title, { color: theme.memoryInk }]}>{title}</Text><Text style={[styles.body, { color: theme.memoryInk }]}>{description}</Text></View>
    <View style={{ alignSelf: 'flex-start' }}><LearningButton tone="white" compact label={label} disabled={disabled} onPress={onPress} /></View>
  </LinearGradient>;
}
