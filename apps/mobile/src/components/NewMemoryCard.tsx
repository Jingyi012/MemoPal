import AnimatedPressable from '@/components/AnimatedPressable';
import { typography } from '@/theme/typography';
import { memopalTheme as theme } from '@/theme/memopalTheme';
import { StyleSheet, Text } from 'react-native';

type NewMemoryCardProps = {
  title: string;
  body: string;
  onPress: () => void;
};

/** Shared entry card used wherever a user can start a new memory. */
export function NewMemoryCard({ title, body, onPress }: NewMemoryCardProps) {
  return (
    <AnimatedPressable onPress={onPress} style={styles.card}>
      <Text style={styles.emoji}>➕</Text>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.body}>{body}</Text>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  card: {
    minHeight: 126,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: theme.sunLine,
    backgroundColor: theme.sunTint,
    padding: 18,
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0px 8px 20px rgba(43, 42, 61, 0.08)',
  },
  emoji: { fontSize: 32, lineHeight: 36 },
  title: { color: theme.ink, fontFamily: typography.displayExtraBold, fontSize: 16.5, marginTop: 8 },
  body: { color: theme.inkSoft, fontFamily: typography.bodyBold, fontSize: 12.5, textAlign: 'center', marginTop: 4 },
});
