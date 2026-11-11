import { AppText as Text } from '@/components/ui/AppText';
import { appRadii, appSpacing, appTextStyles } from '@/theme/designSystem';
import { createThemedStyles } from '@/theme/createThemedStyles';
import AnimatedPressable from '@/components/AnimatedPressable';
import { typography } from '@/theme/typography';
import { ChevronRight } from '@/core/icons';
import { StyleSheet, View } from 'react-native';

type MemorySetRowProps = {
  tone: 'peg' | 'palace';
  title: string;
  badgeText: string;
  subtitle: string;
  onPress: () => void;
};

export function MemorySetRow({ tone, title, badgeText, subtitle, onPress }: MemorySetRowProps) {
  const { styles, theme } = useStyles();
  const isPeg = tone === 'peg';
  return (
    <AnimatedPressable
      accessibilityLabel={`${title} ${subtitle}`}
      onPress={onPress}
      style={styles.card}>
      <View style={[styles.badge, isPeg ? styles.pegBadge : styles.palaceBadge]}>
        <Text style={[styles.badgeText, isPeg ? styles.pegText : styles.palaceText]}>{badgeText}</Text>
      </View>
      <View style={styles.meta}>
        <Text numberOfLines={1} style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>
      <ChevronRight size={20} color={theme.inkSoft} />
    </AnimatedPressable>
  );
}

const useStyles = createThemedStyles((theme) => StyleSheet.create({
  card: { minHeight: 76, borderRadius: appRadii.card, borderWidth: 2, borderColor: theme.line, backgroundColor: theme.paper, padding: 13, marginBottom: 10, flexDirection: 'row', alignItems: 'center' },
  badge: { width: 44, height: 44, borderRadius: appRadii.control, alignItems: 'center', justifyContent: 'center' },
  pegBadge: { backgroundColor: theme.berryTint },
  palaceBadge: { backgroundColor: theme.violetTint },
  badgeText: { fontFamily: typography.display, fontSize: appTextStyles.sectionTitle.fontSize },
  pegText: { color: theme.berryDeep },
  palaceText: { color: theme.violetDeep },
  meta: { flex: 1, marginHorizontal: appSpacing.md },
  title: { color: theme.ink, fontFamily: typography.bodyExtraBold, fontSize: appTextStyles.body.fontSize },
  subtitle: { color: theme.inkSoft, fontFamily: typography.bodySemibold, fontSize: appTextStyles.caption.fontSize, marginTop: 3 },
}));
