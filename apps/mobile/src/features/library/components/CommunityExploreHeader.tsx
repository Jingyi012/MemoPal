import { AppText as Text } from '@/components/ui/AppText';
import { appArtworkSizes, appRadii, appSpacing, appTextStyles } from '@/theme/designSystem';
import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import AnimatedPressable from '@/components/AnimatedPressable';
import { ArrowRight, BookOpen, Trophy } from '@/core/icons';
import { useTranslation } from '@/core/i18n/useTranslation';
import { createThemedStyles } from '@/theme/createThemedStyles';
import { typography } from '@/theme/typography';

export function CommunityExploreHeader() {
  const { styles: s, theme } = useStyles(); const { language } = useTranslation('library'); const zh = language === 'zh'; const router = useRouter();
  return <View style={s.section}>
    <View style={s.hero}>
      <View style={s.copy}><Text style={s.eyebrow}>{zh ? 'MEMOPAL · 一起发现' : 'MEMOPAL · TOGETHER'}</Text><Text style={s.title}>{zh ? `每个人都有\n值得分享的记忆` : `Good ideas\nare worth sharing`}</Text><Text style={s.body}>{zh ? '看看别人如何记住世界。' : 'See how others remember their world.'}</Text></View>
      <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={s.art}><View style={[s.tile, s.back]}><Text style={s.peg}>1 · 2 · 3</Text><Text style={s.emoji}>💡</Text></View><View style={[s.tile, s.front]}><Text style={s.emoji}>🏰</Text></View></View>
    </View>
    <View style={s.links}>
      <AnimatedPressable accessibilityRole="button" onPress={() => router.push('/discover')} style={s.link}><BookOpen size={23} color={theme.violetDeep} /><View style={s.linkCopy}><Text style={s.linkTitle}>{zh ? '发现课程' : 'Courses'}</Text><Text style={s.linkBody}>{zh ? '找点新知识' : 'Find a new interest'}</Text></View><ArrowRight size={16} color={theme.violetDeep} /></AnimatedPressable>
      <AnimatedPressable accessibilityRole="button" onPress={() => router.push('/community/leaderboard')} style={s.link}><Trophy size={23} color={theme.successText} /><View style={s.linkCopy}><Text style={s.linkTitle}>{zh ? '排行榜' : 'Leaderboard'}</Text><Text style={s.linkBody}>{zh ? '一起向前进' : 'Grow together'}</Text></View><ArrowRight size={16} color={theme.successText} /></AnimatedPressable>
    </View>
  </View>;
}
const useStyles = createThemedStyles(t => StyleSheet.create({
  section: { gap: appSpacing.md }, hero: { backgroundColor: t.violetDeep, padding: 18, borderRadius: appRadii.hero, flexDirection: 'row', alignItems: 'center', overflow: 'hidden' },
  copy: { flex: 1, minWidth: 0, gap: 10, zIndex: 1 }, eyebrow: { color: t.onAccent, fontFamily: typography.bodyExtraBold, fontSize: appTextStyles.caption.fontSize, letterSpacing: 1 }, title: { color: t.onAccent, fontFamily: typography.displayExtraBold, fontSize: appTextStyles.stat.fontSize, lineHeight: appTextStyles.stat.lineHeight }, body: { color: t.onAccent, fontFamily: typography.bodySemibold, fontSize: appTextStyles.caption.fontSize, lineHeight: appTextStyles.caption.lineHeight },
  art: { width: 90, height: 125, marginLeft: appSpacing.xs }, tile: { position: 'absolute', width: 63, height: 80, borderRadius: appRadii.control, alignItems: 'center', justifyContent: 'center' }, back: { backgroundColor: t.mintTint, top: 3, right: -2, transform: [{ rotate: '12deg' }] }, front: { backgroundColor: t.paper, top: 42, left: 0, transform: [{ rotate: '-9deg' }] }, emoji: { fontSize: appArtworkSizes.medium }, peg: { fontSize: appTextStyles.caption.fontSize, fontFamily: typography.bodyExtraBold, color: t.ink },
  links: { flexDirection: 'row', gap: 10 }, link: { backgroundColor: t.paper, borderWidth: 1, borderColor: t.line, minHeight: 76, paddingHorizontal: appSpacing.md, paddingVertical: 10, borderRadius: appRadii.card, flex: 1, flexDirection: 'row', alignItems: 'center', gap: appSpacing.sm }, linkCopy: { flex: 1, minWidth: 0, gap: appSpacing.xs }, linkTitle: { color: t.ink, fontFamily: typography.bodyExtraBold, fontSize: appTextStyles.label.fontSize }, linkBody: { color: t.inkSoft, fontSize: appTextStyles.caption.fontSize, lineHeight: appTextStyles.caption.lineHeight },
}));
