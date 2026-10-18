import AnimatedPressable from '@/components/AnimatedPressable';
import { CommonHeader } from '@/components/CommonHeader';
import { useAuth } from '@/contexts/AuthProvider';
import { EducationPracticeItemCard } from '@/features/education/components/EducationPracticeItemCard';
import { useEducationPracticeItems } from '@/features/education/hooks/useEducationPracticeItems';
import { useEducationCopy } from '@/features/education/i18n';
import { educationPracticePreferences } from '@/features/education/services/educationPracticePreferences.service';
import type { EducationPracticeFormatPreference, EducationPracticeQuestionType } from '@/features/education/types/educationPractice.types';
import { createThemedStyles } from '@/theme/createThemedStyles';
import { typography } from '@/theme/typography';
import { Href, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';

const FORMAT_TYPES: readonly EducationPracticeQuestionType[] = [
  'single-choice', 'true-false', 'fill-blank', 'multiple-select', 'ordering', 'matching',
];

export default function EducationPracticeScreen() {
  const copy = useEducationCopy();
  const { styles, theme } = useStyles();
  const { user } = useAuth();
  const router = useRouter();
  const practiceItems = useEducationPracticeItems();
  const [selectedFormat, setSelectedFormat] = useState<EducationPracticeFormatPreference>('all');

  useEffect(() => {
    let cancelled = false;
    if (user?.id) {
      void educationPracticePreferences.getFormat(user.id).then(format => {
        if (!cancelled) setSelectedFormat(format);
      });
    }
    return () => { cancelled = true; };
  }, [user?.id]);

  const availableFormats = useMemo(() => {
    const present = new Set((practiceItems.data ?? []).flatMap(item => item.questionTypes.map(format => format.type)));
    return FORMAT_TYPES.filter(format => present.has(format));
  }, [practiceItems.data]);

  const visibleItems = (practiceItems.data ?? []).flatMap(item => {
    const formats = selectedFormat === 'all'
      ? item.questionTypes
      : item.questionTypes.filter(format => format.type === selectedFormat);
    if (formats.length === 0) return [];
    return [{
      ...item,
      questionCount: formats.reduce((total, format) => total + format.count, 0),
      formats,
    }];
  });

  const selectFormat = (format: EducationPracticeFormatPreference) => {
    setSelectedFormat(format);
    if (user?.id) void educationPracticePreferences.setFormat(user.id, format).catch(() => undefined);
  };

  return (
    <View style={styles.page}>
      <CommonHeader title={copy.practiceBrowseTitle} backAction={() => router.back()} />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.body}>{copy.practiceBrowseBody}</Text>
        <Text accessibilityRole="header" style={styles.sectionTitle}>{copy.practiceFormatPrompt}</Text>
        <View style={styles.formats}>
          {(['all', ...availableFormats] as EducationPracticeFormatPreference[]).map(format => (
            <AnimatedPressable
              key={format}
              accessibilityRole="button"
              accessibilityState={{ selected: selectedFormat === format }}
              onPress={() => selectFormat(format)}
              style={[styles.formatChip, selectedFormat === format && styles.selectedFormat]}>
              <Text style={[styles.formatText, selectedFormat === format && styles.selectedFormatText]}>
                {format === 'all' ? copy.practiceAllFormats : copy.questionTypeLabels[format]}
              </Text>
            </AnimatedPressable>
          ))}
        </View>
        {practiceItems.isLoading ? (
          <View style={styles.state}><ActivityIndicator color={theme.violetDeep} /><Text style={styles.body}>{copy.loading}</Text></View>
        ) : practiceItems.isError ? (
          <View style={styles.notice}>
            <Text accessibilityRole="alert" style={styles.body}>{copy.practiceListError}</Text>
            <AnimatedPressable accessibilityRole="button" onPress={() => void practiceItems.refetch()} style={styles.action}>
              <Text style={styles.actionText}>{copy.retry}</Text>
            </AnimatedPressable>
          </View>
        ) : visibleItems.length === 0 ? (
          <Text style={styles.empty}>{practiceItems.data?.length ? copy.practiceNoFormatItems : copy.practiceNoPublishedItems}</Text>
        ) : visibleItems.map(item => (
          <EducationPracticeItemCard
            key={item.attemptId}
            title={item.title}
            questionCount={copy.practiceQuestionCount(item.questionCount)}
            formatSummary={item.formats.map(format => copy.questionTypeLabels[format.type]).join(' · ')}
            onPress={() => router.push({
              pathname: '/education/assignments',
              params: { attemptId: item.attemptId, practiceType: selectedFormat },
            } as Href)}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const useStyles = createThemedStyles((theme) => StyleSheet.create({
  page: { backgroundColor: theme.canvas, flex: 1 },
  content: { gap: 13, padding: 20, paddingBottom: 40 },
  body: { color: theme.inkSoft, fontFamily: typography.bodySemibold, fontSize: 14, lineHeight: 20 },
  sectionTitle: { color: theme.ink, fontFamily: typography.bodyExtraBold, fontSize: 14 },
  formats: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  formatChip: { alignItems: 'center', backgroundColor: theme.paper, borderColor: theme.line, borderRadius: 999, borderWidth: 1, justifyContent: 'center', minHeight: 40, paddingHorizontal: 13 },
  selectedFormat: { backgroundColor: theme.violetDeep, borderColor: theme.violetDeep },
  formatText: { color: theme.inkSoft, fontFamily: typography.bodyBold, fontSize: 12 },
  selectedFormatText: { color: theme.onAccent },
  state: { alignItems: 'center', flexDirection: 'row', gap: 10, minHeight: 60 },
  empty: { backgroundColor: theme.paper, borderColor: theme.line, borderRadius: 14, borderWidth: 1, color: theme.inkSoft, fontFamily: typography.bodySemibold, fontSize: 14, lineHeight: 20, padding: 14 },
  notice: { backgroundColor: theme.peachTint, borderColor: theme.peachLine, borderRadius: 15, borderWidth: 1, gap: 8, padding: 14 },
  action: { alignItems: 'center', alignSelf: 'flex-start', backgroundColor: theme.violetDeep, borderRadius: 12, justifyContent: 'center', minHeight: 44, paddingHorizontal: 15 },
  actionText: { color: theme.onAccent, fontFamily: typography.bodyExtraBold, fontSize: 13 },
}));
