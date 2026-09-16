import AnimatedPressable from '@/components/AnimatedPressable';
import { useTranslation } from '@/core/i18n/useTranslation';
import type { MemoryReviewProgress } from '@/features/practice-attempts';
import { createThemedStyles } from '@/theme/createThemedStyles';
import { typography } from '@/theme/typography';
import { StyleSheet, Text, View } from 'react-native';

export function MemoryReviewTaskCard({ progress, onReview, onLearn, onBrowse }: {
  progress: MemoryReviewProgress; onReview: () => void; onLearn: () => void; onBrowse: () => void;
}) {
  const { t, language } = useTranslation('reviewPlan');
  const { styles } = useStyles();
  const due = progress.items.filter((item) => item.isDue).length;
  const fresh = progress.items.filter((item) => !item.dueAt).length;
  const active = due > 0 || fresh > 0;
  return <View style={styles.card}>
    {progress.items.length > 0 ? <>
      {!active ? <View style={styles.rest}>
        <Text style={styles.restTitle}>{t('restShort')}</Text>
        {progress.nextReviewAt ? <Text style={styles.body}>
          {t('nextReview').replace('{date}', new Date(progress.nextReviewAt).toLocaleString(language === 'zh' ? 'zh-CN' : 'en-US'))}
        </Text> : null}
      </View> : null}
      <AnimatedPressable lively accessibilityRole="button" onPress={due ? onReview : fresh ? onLearn : onBrowse}
        style={[styles.primary, !active && styles.browseButton]}>
        <Text style={[styles.buttonText, !active && styles.browseText]}>{active ? (due ? t('startDue') : t('startLearn')).replace('{count}', String(due || fresh)) : t('browseShort')}</Text>
      </AnimatedPressable>
      {active ? <View style={styles.actionFooter}>
        <Text style={[styles.body, styles.flex]}>{due ? t('dueShort') : t('newBody')}</Text>
        <AnimatedPressable accessibilityRole="button" style={styles.secondary} onPress={onBrowse}>
          <Text style={styles.link}>{t('browseShort')}</Text>
        </AnimatedPressable>
      </View> : null}
      {due > 0 && fresh > 0 ? <AnimatedPressable accessibilityRole="button" style={styles.secondary} onPress={onLearn}>
        <Text style={styles.link}>{t('startLearn').replace('{count}', String(fresh))}</Text>
      </AnimatedPressable> : null}
    </> : <Text style={styles.body}>{t('empty')}</Text>}
  </View>;
}
const useStyles = createThemedStyles((theme) => StyleSheet.create({
  card: { gap: 2 },
  rest: { backgroundColor: theme.violetTint, borderRadius: 12, padding: 12, gap: 4, marginBottom: 10 },
  restTitle: { color: theme.violetDeep, fontFamily: typography.bodyExtraBold, fontSize: 14 },
  actionFooter: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  flex: { flex: 1 },
  body: { color: theme.inkSoft, fontFamily: typography.bodySemibold, fontSize: 12, lineHeight: 18 },
  primary: { minHeight: 58, padding: 10, paddingRight: 14, borderRadius: 17, backgroundColor: theme.sun, borderBottomWidth: 3, borderBottomColor: theme.sunDeep, flexDirection: 'row', alignItems: 'center', gap: 10 },
  buttonText: { flex: 1, textAlign: 'center', color: theme.onSun, fontFamily: typography.bodyExtraBold, fontSize: 15 },
  browseButton: { backgroundColor: theme.violetTint, borderBottomColor: theme.violetLine },
  browseText: { color: theme.violetDeep },
  secondary: { minHeight: 44, justifyContent: 'center' },
  link: { color: theme.violetDeep, fontFamily: typography.bodyExtraBold, fontSize: 13 },
}));
