import Ionicons from '@expo/vector-icons/Ionicons';
import { Text, View } from 'react-native';
import type { EducationPublicCourseDetail } from '../types/educationPractice.types';
import { learningLayout, learningTypeScale } from '../theme/learningTheme';
import { LearningReadAloud } from './LearningReadAloud';
import { useLearningCopy, useLearningStyles } from './LearningUi';

type StudyItem = EducationPublicCourseDetail['objectives'][number]['studyItems'][number];

/** Keep one authored learning item together; diagrams remain a separate activity. */
export function LearningStudyContentCard({ item }: { item: StudyItem }) {
  const { styles: s, theme } = useLearningStyles();
  const { zh } = useLearningCopy();
  const primary = item.primary.trim();
  const secondary = item.secondary?.trim();
  const extra = item.extra?.trim();
  const showMeaning = !!secondary && secondary !== primary;
  const showExtra = !!extra && extra !== primary && extra !== secondary;

  return <View style={[s.card, { padding: 0, gap: 0, overflow: 'hidden' }]}>
    <View style={[s.row, {
      paddingHorizontal: 18, paddingVertical: 10, minHeight: 64,
      backgroundColor: theme.hero[0], alignItems: 'flex-start',
    }]}>
      <View style={[s.row, { flex: 1, minHeight: learningLayout.touchTarget }]}>
        <Ionicons name="bulb-outline" size={21} color={theme.heroInk} accessible={false} />
        <Text style={[s.small, { flex: 1, color: theme.heroInk }]}>{zh ? '学习要点' : 'STUDY NOTE'}</Text>
      </View>
      {item.languageCode ? <LearningReadAloud key={item.id} text={item.primary} language={item.languageCode} /> : null}
    </View>

    <View style={{ padding: 20, gap: 18 }}>
      <View style={{ gap: 8 }}>
        <Text accessibilityRole="header" style={[
          s.title, learningTypeScale.prompt,
          primary.length <= 4 && { fontSize: 36, lineHeight: 46 },
        ]}>{item.primary}</Text>
        {item.phonetic ? <Text style={[s.body, { color: theme.violetDeep }]}>{item.phonetic}</Text> : null}
      </View>

      {showMeaning ? <View style={{ borderTopWidth: 1, borderTopColor: theme.line, paddingTop: 16, gap: 6 }}>
        <Text style={[s.small, { color: theme.violetDeep }]}>{zh ? '释义与说明' : 'MEANING & NOTES'}</Text>
        <Text style={[s.body, { color: theme.ink }]}>{item.secondary}</Text>
      </View> : null}

      {showExtra ? <View style={{ borderRadius: 16, backgroundColor: theme.violetTint, padding: 14, gap: 6 }}>
        <Text style={[s.small, { color: theme.violetDeep }]}>{zh ? '再想一想' : 'A LITTLE MORE'}</Text>
        <Text style={s.body}>{item.extra}</Text>
      </View> : null}
    </View>
  </View>;
}
