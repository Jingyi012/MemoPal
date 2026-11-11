import { AppText as Text } from '@/components/ui/AppText';
import { appRadii, appSpacing, appTextStyles } from '@/theme/designSystem';
import AnimatedPressable from '@/components/AnimatedPressable';
import { createThemedStyles } from '@/theme/createThemedStyles';
import { typography } from '@/theme/typography';
import { ChevronRight, Plus, Sparkles } from '@/core/icons';
import { StyleSheet, View } from 'react-native';

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
        <Plus size={23} color={theme.onAccent} strokeWidth={2.7} />
        </View>
        <View style={styles.sparkle}><Sparkles size={11} color={theme.sunDeep} /></View>
      </View>
      <View style={styles.copy}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.body}>{body}</Text>
      </View>
      <View style={styles.arrow}><ChevronRight size={18} color={theme.onAccent} strokeWidth={2.8} /></View>
    </AnimatedPressable>
  );
}

const useStyles = createThemedStyles((theme) => StyleSheet.create({
  card: {
    alignItems: 'center',
    backgroundColor: theme.violetTint,
    borderColor: theme.violetLine,
    borderRadius: appRadii.hero,
    borderWidth: 1.5,
    boxShadow: '0px 6px 16px rgba(43, 42, 61, 0.06)',
    flexDirection: 'row',
    gap: appSpacing.md,
    minHeight: 98,
    overflow: 'hidden',
    paddingHorizontal: 15,
    paddingVertical: 14,
  },
  glow: { position: 'absolute', width: 150, height: 150, borderRadius: 75, right: -54, top: -68, backgroundColor: theme.violetLine, opacity: 0.45 },
  iconWrap: { position: 'relative', width: 55, height: 55 },
  icon: {
    alignItems: 'center',
    backgroundColor: theme.violetDeep,
    borderRadius: appRadii.card,
    height: 50,
    justifyContent: 'center',
    width: 50,
    boxShadow: '0px 4px 8px rgba(105, 80, 204, 0.22)',
  },
  sparkle: { position: 'absolute', right: -2, top: -4, width: 21, height: 21, borderRadius: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.paper },
  copy: { flex: 1, minWidth: 0 },
  title: { color: theme.ink, fontFamily: typography.displayExtraBold, fontSize: appTextStyles.sectionTitle.fontSize },
  body: { color: theme.inkSoft, fontFamily: typography.bodyBold, fontSize: appTextStyles.caption.fontSize, lineHeight: appTextStyles.caption.lineHeight, marginTop: 3 },
  arrow: { alignItems: 'center', backgroundColor: theme.violetDeep, borderRadius: appRadii.control, height: 34, justifyContent: 'center', width: 34 },
}));
