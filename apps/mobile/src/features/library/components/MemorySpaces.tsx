import { AppText as Text } from '@/components/ui/AppText';
import { appRadii, appSpacing, appTextStyles } from '@/theme/designSystem';
import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import AnimatedPressable from '@/components/AnimatedPressable';
import { useTranslation } from '@/core/i18n/useTranslation';
import { createThemedStyles } from '@/theme/createThemedStyles';
import { typography } from '@/theme/typography';
import { useEnabledMemoryModules } from '@/core/memory';

export function MemorySpaces() {
  const { styles: s, theme } = useStyles(); const router = useRouter(); const { language, t } = useTranslation('practice'); const zh = language === 'zh';
  const enabled = useEnabledMemoryModules();
  return <View style={s.navigation}>
    {enabled.length ? <View style={s.spaces}>
    {[{ key: 'palace', route: '/palaces' as const, icon: 'business-outline' as const, title: zh ? '记忆宫殿' : 'Memory palaces', body: zh ? '沿着熟悉的路线回忆' : 'Remember along a familiar route', ink: theme.violetDeep },
      { key: 'number-peg', route: '/number-peg' as const, icon: 'keypad-outline' as const, title: zh ? '数字挂钩' : 'Number pegs', body: zh ? '用图像串起每个要点' : 'Connect ideas with images', ink: theme.successText }].filter(item => enabled.some(module => module.key === item.key)).map(item => <AnimatedPressable key={item.route} accessibilityRole="button" accessibilityLabel={item.title} onPress={() => router.push(item.route)} style={s.space}>
        <View style={s.top}><Ionicons name={item.icon} size={25} color={item.ink} /><Ionicons name="arrow-forward" size={17} color={item.ink} /></View><Text style={s.title}>{item.title}</Text><Text style={s.body}>{item.body}</Text>
      </AnimatedPressable>)}
    </View> : null}
    <AnimatedPressable accessibilityRole="button" accessibilityLabel={t('exploreTemplates')}
      accessibilityHint={t('allLessonsBody')} onPress={() => router.push('/lessons')}
      pressedStyle={{ backgroundColor: theme.controlPressed }} style={s.templates}>
      <Ionicons name="compass-outline" size={28} color={theme.violetDeep} />
      <View style={s.templateCopy}>
        <Text style={s.title}>{t('exploreTemplates')}</Text>
        <Text style={s.body}>{t('allLessonsBody')}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={theme.violetDeep} />
    </AnimatedPressable>
  </View>;
}
const useStyles = createThemedStyles(t => StyleSheet.create({ navigation: { gap: appSpacing.md, marginBottom: appSpacing.sm }, templates: { flexDirection: 'row', alignItems: 'center', gap: appSpacing.md, minHeight: 76, backgroundColor: t.paper, borderColor: t.line, borderWidth: 1, borderRadius: appRadii.card, padding: 14 }, templateCopy: { flex: 1, minWidth: 0, gap: appSpacing.xs }, spaces: { flexDirection: 'row', gap: appSpacing.md }, space: { flex: 1, minWidth: 0, backgroundColor: t.paper, borderColor: t.line, borderWidth: 1, borderRadius: appRadii.card, padding: 14, gap: appSpacing.sm, minHeight: 116 }, top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, title: { color: t.ink, fontFamily: typography.displayExtraBold, fontSize: appTextStyles.cardTitle.fontSize, lineHeight: appTextStyles.cardTitle.lineHeight }, body: { color: t.inkSoft, fontFamily: typography.bodySemibold, fontSize: appTextStyles.caption.fontSize, lineHeight: appTextStyles.caption.lineHeight } }));
