import { createLearningStyles as createThemedStyles, learningTypography as typography } from '@/features/education/theme/learningTheme';
import AnimatedPressable from '@/components/AnimatedPressable';
import { LearningHeader as CommonHeader } from '@/features/education/components/LearningHeader';
import { useCommunityMemorySet } from '@/features/memory-sets';
import { CompanionLearningPresence } from '@/features/profile/companion/CompanionLearningPresence';
import { Href, useLocalSearchParams, useRouter } from 'expo-router';
import { LearningMemoryHero, LearningMemoryItem } from '../components/LearningMemoryContent';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useEducationPublicCourse } from '../hooks/useEducationPracticeItems';
import { LearningButton, LearningSkeleton, learningThemeFor, useLearningStyles, useLearningCopy } from '../components/LearningUi';

export default function EducationMemoryPracticeScreen() {
  const { courseId = '', memorySetId: requestedSetId = '' } = useLocalSearchParams<{ courseId: string; memorySetId?: string }>();
  const router = useRouter();
  const ui = useLearningCopy();
  const insets = useSafeAreaInsets();
  const { styles: ls, theme } = useLearningStyles();
  const { styles } = useStyles();
  const course = useEducationPublicCourse(courseId);
  const recommendations = useMemo(() => (course.data?.objectives ?? []).flatMap(objective => objective.recommendedMemorySet
    ? [{ objectiveId: objective.id, objectiveTitle: objective.title, memorySet: objective.recommendedMemorySet }]
    : []), [course.data?.objectives]);
  const [selectedId, setSelectedId] = useState(requestedSetId);
  useEffect(() => {
    if (recommendations.length && !recommendations.some(item => item.memorySet.id === selectedId))
      setSelectedId(recommendations[0]!.memorySet.id);
  }, [recommendations, selectedId]);
  const selected = recommendations.find(item => item.memorySet.id === selectedId) ?? recommendations[0];
  const memorySet = useCommunityMemorySet(selected?.memorySet.id ?? '');
  const methods = [...new Set(recommendations.map(item => item.memorySet.techniqueKey))];
  const activeMethod = selected?.memorySet.techniqueKey;
  const related = recommendations.filter(item => item.memorySet.techniqueKey === activeMethod);
  const subjectTheme = learningThemeFor(course.data?.title ?? '', theme, course.data?.subjectCode);
  const returnToLearning = () => {
    if (router.canGoBack()) router.back();
    else router.replace(`/community/education/${encodeURIComponent(courseId)}` as Href);
  };

  return <View style={ls.page}>
    <CommonHeader showAiCredits={false} title={ui.memory} backAction={returnToLearning} />
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {course.isLoading ? <LearningSkeleton /> : course.isError || !course.data ? <View style={ls.card}>
        <Text accessibilityRole="alert" style={ls.body}>{ui.zh ? '无法载入课程记忆练习。' : 'Could not load this course’s memory practice.'}</Text>
        <LearningButton secondary label={ui.zh ? '重试' : 'Retry'} onPress={() => void course.refetch()} />
      </View> : recommendations.length === 0 ? <View style={[ls.card, { alignItems: 'center' }]}>
        <CompanionLearningPresence state="thinking" />
        <Text style={ls.body}>{ui.memoryNotReady}</Text>
      </View> : <>
        <LearningMemoryHero courseTitle={course.data.title} itemCount={memorySet.data?.items.length ?? null} />
        <Text style={ls.small}>{ui.zh ? '这是可选的记忆小帮手。随时返回，继续刚才的学习。' : 'An optional memory helper. Return whenever you’re ready to keep learning.'}</Text>
        {methods.length > 1 ? <View style={styles.segment} accessibilityRole="tablist">
          {methods.map(method => {
            const active = method === activeMethod;
            const label = method === 'palace' ? (ui.zh ? '记忆宫殿' : 'Palace') : (ui.zh ? '数字挂钩' : 'Number Peg');
            return <AnimatedPressable key={method} accessibilityRole="tab" accessibilityState={{ selected: active }} onPress={() => {
              const next = recommendations.find(item => item.memorySet.techniqueKey === method);
              if (next) setSelectedId(next.memorySet.id);
            }} style={[styles.segmentButton, active && styles.segmentButtonActive]}>
              <Ionicons name={method === 'palace' ? 'business-outline' : 'grid-outline'} size={21} color={active ? theme.violetDeep : theme.inkSoft} /><Text style={[styles.segmentText, active && styles.segmentTextActive]}>{label}</Text>
            </AnimatedPressable>;
          })}
        </View> : null}
        {related.length > 1 ? <View style={styles.recommendationList}>
          {related.map(item => <AnimatedPressable key={item.memorySet.id} accessibilityRole="button" accessibilityState={{ selected: selected?.memorySet.id === item.memorySet.id }} onPress={() => setSelectedId(item.memorySet.id)} style={[styles.recommendation, selected?.memorySet.id === item.memorySet.id && styles.recommendationSelected]}>
            <Text numberOfLines={1} style={styles.recommendationTitle}>{item.objectiveTitle}</Text>
            <Text numberOfLines={1} style={styles.recommendationMeta}>{item.memorySet.title}</Text>
          </AnimatedPressable>)}
        </View> : null}
        {selected ? <View style={styles.recommendationIntro}>
          <View style={styles.recommendationHeader}><Ionicons name={activeMethod === 'palace' ? 'business-outline' : 'apps-outline'} size={23} color={subjectTheme.color} /><View style={{ flex: 1, gap: 2 }}>
            <Text style={styles.recommendationBadge}>{ui.zh ? '课程推荐' : 'COURSE RECOMMENDATION'}</Text>
            <Text style={styles.recommendationTitle}>{selected.objectiveTitle}</Text>
          </View></View>
          {memorySet.isLoading ? <LearningSkeleton /> : memorySet.isError || !memorySet.data ? <View style={{ gap: 8 }}><Text accessibilityRole="alert" style={ls.body}>{ui.zh ? '无法载入记忆内容。' : 'Could not load memory items.'}</Text><LearningButton secondary label={ui.zh ? '重试' : 'Retry'} onPress={() => void memorySet.refetch()} /></View> : <>
            <Text style={styles.memoryDescription}>{memorySet.data.description || selected.memorySet.description || ui.memoryBody}</Text>
            <View style={styles.itemList}>{memorySet.data.items.map((item, index) => {
              const palaceHint = memorySet.data.techniquePlan?.palaceBindings.find(binding => binding.memoryItemId === item.id)?.associationText;
              const pegHint = memorySet.data.techniquePlan?.pegBindings.find(binding => binding.memoryItemId === item.id)?.sceneText;
              const hint = activeMethod === 'palace' ? palaceHint : pegHint;
              return <LearningMemoryItem key={item.id} prompt={item.prompt || `${ui.zh ? '学习条目' : 'Item'} ${index + 1}`} answer={item.answer} hint={hint} index={index} method={activeMethod ?? 'palace'} />;
            })}</View>
          </>}
        </View> : null}
      </>}
    </ScrollView>
    <View style={[ls.dock, { paddingBottom: Math.max(16, insets.bottom), gap: 10 }]}>
      {selected ? <LearningButton disabled={!memorySet.data} label={ui.startMemory} onPress={() => {
        if (memorySet.data?.existingCopyId) router.push(`/memory-details/${memorySet.data.existingCopyId}` as Href);
        else router.push(`/community/memory-sets/${selected.memorySet.id}` as Href);
      }} /> : null}
      <LearningButton secondary={!!selected} label={ui.zh ? '返回课程，继续学习' : 'Return to learning'} onPress={returnToLearning} />
    </View>
  </View>;
}

const useStyles = createThemedStyles(theme => StyleSheet.create({
  content: { gap: 15, padding: 16, paddingBottom: 28 },
  segment: { backgroundColor: theme.violetTint, borderRadius: 18, flexDirection: 'row', gap: 4, padding: 4 },
  segmentButton: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, paddingVertical: 10, alignItems: 'center', borderRadius: 14, flex: 1, justifyContent: 'center', minHeight: 46, paddingHorizontal: 5 },
  segmentButtonActive: { backgroundColor: theme.paper, borderBottomColor: theme.line, borderBottomWidth: 4 },
  segmentText: { color: theme.inkSoft, fontFamily: typography.bodyExtraBold, fontSize: 13 },
  segmentTextActive: { color: theme.violetDeep },
  recommendationList: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  recommendation: { backgroundColor: theme.paper, borderColor: theme.line, borderRadius: 15, borderWidth: 1.5, gap: 2, maxWidth: '100%', minHeight: 54, paddingHorizontal: 12, paddingVertical: 8 },
  recommendationSelected: { backgroundColor: theme.violetTint, borderColor: theme.violetDeep },
  recommendationTitle: { color: theme.ink, fontFamily: typography.bodyExtraBold, fontSize: 14, lineHeight: 19 },
  recommendationMeta: { color: theme.inkSoft, fontFamily: typography.bodySemibold, fontSize: 14, lineHeight: 21 },
  recommendationIntro: { gap: 13 },
  recommendationHeader: { alignItems: 'center', flexDirection: 'row', gap: 9 },
  recommendationBadge: { color: theme.violetDeep, fontFamily: typography.bodyExtraBold, fontSize: 15, lineHeight: 23, letterSpacing: .3 },
  memoryDescription: { color: theme.inkSoft, fontFamily: typography.bodySemibold, fontSize: 15, lineHeight: 23 },
  itemList: { gap: 9 },
}));
