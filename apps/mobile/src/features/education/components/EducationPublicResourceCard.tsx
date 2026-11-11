import { AppText as Text } from '@/components/ui/AppText';
import { appRadii, appSpacing, appTextStyles } from '@/theme/designSystem';
import { createLearningStyles as createThemedStyles, learningTypography as typography } from '@/features/education/theme/learningTheme';
import AnimatedPressable from '@/components/AnimatedPressable';
import Ionicons from '@expo/vector-icons/Ionicons';
import type { LucideIcon } from '@/core/icons';
import { StyleSheet, View } from 'react-native';

type EducationPublicResourceCardProps = Readonly<{
  title: string;
  detail: string;
  metadata?: string;
  icon?: LucideIcon;
  compact?: boolean;
  tone?: 'violet' | 'gold';
  onPress: () => void;
}>;

export function EducationPublicResourceCard({ title, detail, metadata, icon: Icon, compact = false, tone = 'violet', onPress }: EducationPublicResourceCardProps) {
  const { styles, theme } = useStyles();
  const iconColor = tone === 'gold' ? theme.sunDeep : theme.violetDeep;
  return <AnimatedPressable accessibilityRole="button" accessibilityLabel={`${title}. ${detail}`} onPress={onPress} style={[styles.card, compact && styles.compactCard, tone === 'gold' && styles.goldCard]}>
    {compact ? <>
      <View style={styles.compactTop}>
        <View style={[styles.iconBox, styles.compactIconBox, tone === 'gold' && styles.goldIconBox]}><>{Icon ? <Icon size={20} color={iconColor} /> : <Ionicons name="book-outline" size={20} color={iconColor} />}</></View>
        <View style={styles.arrowCircle}><Ionicons name="chevron-forward" size={19} color={theme.violetDeep} /></View>
      </View>
      <View style={styles.copy}>
        <Text numberOfLines={2} style={styles.compactTitle}>{title}</Text>
        <Text numberOfLines={2} style={styles.compactDetail}>{detail}</Text>
      </View>
    </> : <>
      <View style={[styles.iconBox, tone === 'gold' && styles.goldIconBox]}><>{Icon ? <Icon size={24} color={iconColor} /> : <Ionicons name="book-outline" size={24} color={iconColor} />}</></View>
      <View style={styles.copy}>
        <Text numberOfLines={2} style={styles.title}>{title}</Text>
        <Text numberOfLines={2} style={styles.detail}>{detail}</Text>
        {metadata ? <View style={styles.metadataBadge}><Text style={styles.metadata}>{metadata}</Text></View> : null}
      </View>
      <View style={styles.arrowCircle}><Ionicons name="chevron-forward" size={20} color={theme.violetDeep} /></View>
    </>}
  </AnimatedPressable>;
}

const useStyles = createThemedStyles((theme) => StyleSheet.create({
  card: { alignItems: 'center', backgroundColor: theme.paper, borderColor: theme.line, borderRadius: appRadii.card, borderWidth: 2, borderBottomWidth: 6, flexDirection: 'row', gap: appSpacing.md, minHeight: 88, padding: 14 },
  goldCard: { borderColor: theme.sunLine },
  compactCard: { alignItems: 'stretch', flex: 1, flexDirection: 'column', gap: appSpacing.sm, justifyContent: 'flex-start', minHeight: 104, padding: 11 },
  compactTop: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  iconBox: { alignItems: 'center', backgroundColor: theme.violetTint, borderRadius: appRadii.control, height: 40, justifyContent: 'center', width: 40 },
  compactIconBox: { height: 34, width: 34 },
  goldIconBox: { backgroundColor: theme.sunTint },
  arrowCircle: { alignItems: 'center', backgroundColor: theme.violetTint, borderRadius: appRadii.control, height: 30, justifyContent: 'center', width: 30 },
  copy: { flex: 1, minWidth: 0, gap: 6 },
  title: { color: theme.ink, fontFamily: typography.displayExtraBold, fontSize: appTextStyles.sectionTitle.fontSize, lineHeight: appTextStyles.sectionTitle.lineHeight },
  detail: { color: theme.inkSoft, fontFamily: typography.bodyBold, fontSize: appTextStyles.small.fontSize, lineHeight: appTextStyles.small.lineHeight },
  compactTitle: { color: theme.ink, fontFamily: typography.displayExtraBold, fontSize: appTextStyles.body.fontSize, lineHeight: appTextStyles.body.lineHeight },
  compactDetail: { color: theme.inkSoft, fontFamily: typography.bodySemibold, fontSize: appTextStyles.small.fontSize, lineHeight: appTextStyles.small.lineHeight },
  metadataBadge: { alignSelf: 'flex-start', backgroundColor: theme.violetTint, borderRadius: appRadii.pill, marginTop: 2, maxWidth: '100%', paddingHorizontal: appSpacing.sm, paddingVertical: appSpacing.xs },
  metadata: { color: theme.violetDeep, fontFamily: typography.bodyExtraBold, fontSize: appTextStyles.small.fontSize, lineHeight: appTextStyles.small.lineHeight },
}));
