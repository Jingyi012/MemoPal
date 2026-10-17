import AnimatedPressable from '@/components/AnimatedPressable';
import { createThemedStyles } from '@/theme/createThemedStyles';
import { typography } from '@/theme/typography';
import { ChevronRight, Plus, Sparkles } from '@/core/icons';
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
      <View style={styles.glow} />
      <View style={styles.iconWrap}>
        <View style={styles.icon}>
        <Plus size={23} color={theme.onSun} strokeWidth={2.7} />
        </View>
        <View style={styles.sparkle}><Sparkles size={11} color={theme.sunDeep} /></View>
      </View>
      <View style={styles.copy}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.body}>{body}</Text>
      </View>
      <View style={styles.arrow}><ChevronRight size={18} color={theme.onSun} strokeWidth={2.8} /></View>
    </AnimatedPressable>
  );
}

const useStyles = createThemedStyles((theme) => StyleSheet.create({
  card: {
    alignItems: 'center',
    backgroundColor: theme.sunTint,
    borderColor: theme.sunLine,
    borderRadius: 24,
    borderWidth: 1.5,
    boxShadow: '0px 6px 16px rgba(43, 42, 61, 0.06)',
    flexDirection: 'row',
    gap: 12,
    minHeight: 98,
    overflow: 'hidden',
    paddingHorizontal: 15,
    paddingVertical: 14,
  },
  glow: { position: 'absolute', width: 150, height: 150, borderRadius: 75, right: -54, top: -68, backgroundColor: 'rgba(255, 201, 60, 0.22)' },
  iconWrap: { position: 'relative', width: 55, height: 55 },
  icon: {
    alignItems: 'center',
    backgroundColor: theme.sun,
    borderRadius: 18,
    height: 50,
    justifyContent: 'center',
    width: 50,
    boxShadow: '0px 4px 8px rgba(210, 151, 18, 0.22)',
  },
  sparkle: { position: 'absolute', right: -2, top: -4, width: 21, height: 21, borderRadius: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.paper },
  copy: { flex: 1, minWidth: 0 },
  title: { color: theme.ink, fontFamily: typography.displayExtraBold, fontSize: 17 },
  body: { color: theme.inkSoft, fontFamily: typography.bodyBold, fontSize: 11.5, lineHeight: 16, marginTop: 3 },
  arrow: { alignItems: 'center', backgroundColor: theme.sunDeep, borderRadius: 17, height: 34, justifyContent: 'center', width: 34 },
}));
