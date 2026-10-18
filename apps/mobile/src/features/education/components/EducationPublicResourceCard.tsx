import AnimatedPressable from '@/components/AnimatedPressable';
import { ArrowRight, BookOpen } from '@/core/icons';
import type { LucideIcon } from '@/core/icons';
import { createThemedStyles } from '@/theme/createThemedStyles';
import { typography } from '@/theme/typography';
import { StyleSheet, Text, View } from 'react-native';

type EducationPublicResourceCardProps = Readonly<{
  title: string;
  detail: string;
  metadata?: string;
  icon?: LucideIcon;
  compact?: boolean;
  tone?: 'violet' | 'gold';
  onPress: () => void;
}>;

export function EducationPublicResourceCard({ title, detail, metadata, icon: Icon = BookOpen, compact = false, tone = 'violet', onPress }: EducationPublicResourceCardProps) {
  const { styles, theme } = useStyles();
  const iconColor = tone === 'gold' ? theme.sunDeep : theme.violetDeep;
  return <AnimatedPressable accessibilityRole="button" accessibilityLabel={`${title}. ${detail}`} onPress={onPress} style={[styles.card, compact && styles.compactCard, tone === 'gold' && styles.goldCard]}>
    {compact ? <>
      <View style={styles.compactTop}>
        <View style={[styles.iconBox, styles.compactIconBox, tone === 'gold' && styles.goldIconBox]}><Icon size={18} color={iconColor} /></View>
        <View style={styles.arrowCircle}><ArrowRight size={15} color={theme.violetDeep} /></View>
      </View>
      <View style={styles.copy}>
        <Text numberOfLines={1} style={styles.compactTitle}>{title}</Text>
        <Text numberOfLines={2} style={styles.compactDetail}>{detail}</Text>
      </View>
    </> : <>
      <View style={[styles.iconBox, tone === 'gold' && styles.goldIconBox]}><Icon size={19} color={iconColor} /></View>
      <View style={styles.copy}>
        <Text numberOfLines={2} style={styles.title}>{title}</Text>
        <Text numberOfLines={2} style={styles.detail}>{detail}</Text>
        {metadata ? <View style={styles.metadataBadge}><Text numberOfLines={1} style={styles.metadata}>{metadata}</Text></View> : null}
      </View>
      <View style={styles.arrowCircle}><ArrowRight size={16} color={theme.violetDeep} /></View>
    </>}
  </AnimatedPressable>;
}

const useStyles = createThemedStyles((theme) => StyleSheet.create({
  card: { alignItems: 'center', backgroundColor: theme.paper, borderColor: theme.violetLine, borderRadius: 18, borderWidth: 1.5, flexDirection: 'row', gap: 10, minHeight: 88, padding: 11 },
  goldCard: { borderColor: theme.sunLine },
  compactCard: { alignItems: 'stretch', flex: 1, flexDirection: 'column', gap: 8, justifyContent: 'flex-start', minHeight: 104, padding: 11 },
  compactTop: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  iconBox: { alignItems: 'center', backgroundColor: theme.violetTint, borderRadius: 12, height: 40, justifyContent: 'center', width: 40 },
  compactIconBox: { height: 34, width: 34 },
  goldIconBox: { backgroundColor: theme.sunTint },
  arrowCircle: { alignItems: 'center', backgroundColor: theme.violetTint, borderRadius: 15, height: 30, justifyContent: 'center', width: 30 },
  copy: { flex: 1, gap: 3 },
  title: { color: theme.ink, fontFamily: typography.displayExtraBold, fontSize: 13, lineHeight: 18 },
  detail: { color: theme.inkSoft, fontFamily: typography.bodySemibold, fontSize: 11, lineHeight: 15 },
  compactTitle: { color: theme.ink, fontFamily: typography.displayExtraBold, fontSize: 12, lineHeight: 16 },
  compactDetail: { color: theme.inkSoft, fontFamily: typography.bodySemibold, fontSize: 10, lineHeight: 14 },
  metadataBadge: { alignSelf: 'flex-start', backgroundColor: theme.violetTint, borderRadius: 999, marginTop: 2, maxWidth: '100%', paddingHorizontal: 8, paddingVertical: 4 },
  metadata: { color: theme.violetDeep, fontFamily: typography.bodyExtraBold, fontSize: 9, lineHeight: 12 },
}));
