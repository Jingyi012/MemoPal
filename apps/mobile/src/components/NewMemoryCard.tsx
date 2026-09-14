import AnimatedPressable from '@/components/AnimatedPressable';
import { createThemedStyles } from '@/theme/createThemedStyles';
import { typography } from '@/theme/typography';
import { ChevronRight, Plus } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';

type NewMemoryCardProps = {
  title: string;
  body: string;
  onPress: () => void;
};

/** Shared entry card used wherever a user can start a new memory. */
export function NewMemoryCard({ title, body, onPress }: NewMemoryCardProps) {
  const { styles, theme } = useStyles();

  return (
    <AnimatedPressable accessibilityLabel={title} onPress={onPress} style={styles.card}>
      <View style={styles.icon}>
        <Plus size={23} color={theme.onSun} strokeWidth={2.7} />
      </View>
      <View style={styles.copy}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.body}>{body}</Text>
      </View>
      <ChevronRight size={20} color={theme.sunDeep} strokeWidth={2.6} />
    </AnimatedPressable>
  );
}

const useStyles = createThemedStyles((theme) => StyleSheet.create({
  card: {
    alignItems: 'center',
    backgroundColor: theme.sunTint,
    borderColor: theme.sunLine,
    borderRadius: 20,
    borderWidth: 1.5,
    boxShadow: '0px 6px 16px rgba(43, 42, 61, 0.06)',
    flexDirection: 'row',
    gap: 12,
    minHeight: 88,
    paddingHorizontal: 15,
    paddingVertical: 13,
  },
  icon: {
    alignItems: 'center',
    backgroundColor: theme.sun,
    borderRadius: 16,
    height: 50,
    justifyContent: 'center',
    width: 50,
  },
  copy: { flex: 1, minWidth: 0 },
  title: { color: theme.ink, fontFamily: typography.displayExtraBold, fontSize: 16.5 },
  body: { color: theme.inkSoft, fontFamily: typography.bodyBold, fontSize: 11.5, lineHeight: 16, marginTop: 3 },
}));
