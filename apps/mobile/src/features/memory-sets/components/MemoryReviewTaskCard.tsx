import { AppButton } from '@/components/ui/AppButton';
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
      <AppButton
        label={active ? (due ? t('startDue') : t('startLearn')).replace('{count}', String(due || fresh)) : t('browseShort')}
        variant={active ? 'primary' : 'secondary'}
        size="large"
        lively
        fullWidth
        onPress={due ? onReview : fresh ? onLearn : onBrowse}
        style={styles.primary}
      />
      {active ? <View style={styles.actionFooter}>
        <Text style={[styles.body, styles.flex]}>{due ? t('dueShort') : t('newBody')}</Text>
        <AppButton label={t('browseShort')} variant="tertiary" size="compact" onPress={onBrowse} />
      </View> : null}
      {due > 0 && fresh > 0 ? <AppButton label={t('startLearn').replace('{count}', String(fresh))} variant="secondary" size="compact" onPress={onLearn} style={styles.secondary} /> : null}
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
  primary: { minHeight: 58, borderRadius: 17 },
  secondary: { alignSelf: 'flex-start' },
}));
