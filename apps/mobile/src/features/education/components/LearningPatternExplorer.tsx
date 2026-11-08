import { useState } from 'react';
import { Text, View } from 'react-native';
import AnimatedPressable from '@/components/AnimatedPressable';
import { LearningArrival, useLearningCopy, useLearningStyles, useLearningTheme } from './LearningUi';

export const learningPatterns = {
  'pattern-red-blue': ['red', 'blue'],
  'pattern-red-red-blue': ['red', 'red', 'blue'],
  'pattern-circle-triangle': ['circle', 'triangle'],
} as const;

export function LearningPatternExplorer({ code }: { code: keyof typeof learningPatterns }) {
  const { styles: s, theme } = useLearningStyles();
  const subject = useLearningTheme();
  const { zh } = useLearningCopy();
  const [groups, setGroups] = useState(2);
  const pattern = learningPatterns[code];
  const labels = { red: zh ? '红' : 'Red', blue: zh ? '蓝' : 'Blue', circle: zh ? '圆' : 'Circle', triangle: zh ? '三角形' : 'Triangle' };
  return <View style={[s.card, { borderColor: subject.line, backgroundColor: theme.paper, gap: 14 }]}>
    <Text accessibilityRole="header" style={s.heading}>{zh ? '找到重复的一组' : 'Find the repeating group'}</Text>
    <Text style={s.body}>{zh ? '每个框里都是同样的一组，顺序也一样。' : 'Each box repeats the same group, in the same order.'}</Text>
    <View style={{ gap: 10 }}>
      {Array.from({ length: groups }, (_, group) => <LearningArrival key={group} style={{ gap: 8, padding: 12, borderRadius: 18, borderWidth: 2, borderColor: subject.color, backgroundColor: theme.paper }}>
        <Text style={s.small}>{zh ? `第 ${group + 1} 组` : `Group ${group + 1}`}</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
          {pattern.map((symbol, index) => <View key={index} accessible accessibilityLabel={labels[symbol]} style={{ flexGrow: 1, flexBasis: 48, alignItems: 'center', gap: 4 }}>
            <Text accessibilityElementsHidden importantForAccessibility="no" style={{ fontSize: 30, color: symbol === 'red' ? theme.berryDeep : symbol === 'blue' ? (theme.isDark ? theme.sky : '#405EAE') : subject.color }}>{symbol === 'triangle' ? '▲' : '●'}</Text>
            <Text style={[s.small, { color: theme.ink, textAlign: 'center' }]}>{labels[symbol]}</Text>
          </View>)}
        </View>
      </LearningArrival>)}
    </View>
    <Text accessibilityLiveRegion="polite" style={s.body}>{zh ? `“${pattern.map(symbol => labels[symbol]).join('、')}”重复了 ${groups} 次。` : `${pattern.map(symbol => labels[symbol]).join(' → ')} repeats ${groups} times.`}</Text>
    <AnimatedPressable accessibilityRole="button" onPress={() => setGroups(current => current < 4 ? current + 1 : 2)}
      style={{ minHeight: 48, padding: 10, borderRadius: 16, borderWidth: 2, borderBottomWidth: 5, borderColor: subject.line, backgroundColor: theme.paper, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={[s.heading, { color: subject.color, textAlign: 'center' }]}>{groups < 4 ? (zh ? '＋ 再接一组' : '+ Add the next group') : (zh ? '重新探索' : 'Explore again')}</Text>
    </AnimatedPressable>
  </View>;
}
