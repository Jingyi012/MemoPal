import { AppText as Text } from '@/components/ui/AppText';
import { appRadii, appSpacing, appTextStyles } from '@/theme/designSystem';
import { useState } from 'react';
import { View } from 'react-native';
import AnimatedPressable from '@/components/AnimatedPressable';
import { LearningArrival, useLearningCopy, useLearningStyles, useLearningTheme } from './LearningUi';

import { parseStudyIllustration } from '../utils/studyIllustrations';

export function LearningPatternExplorer({ code }: { code: string }) {
  const { styles: s, theme } = useLearningStyles();
  const subject = useLearningTheme();
  const { zh } = useLearningCopy();
  const [groups, setGroups] = useState(2);
  const configuration = parseStudyIllustration(code);
  const pattern = configuration?.kind === 'pattern' ? configuration.symbols : [];
  const labels = { square: zh ? '方形' : 'Square', red: zh ? '红' : 'Red', blue: zh ? '蓝' : 'Blue', circle: zh ? '圆' : 'Circle', triangle: zh ? '三角形' : 'Triangle' };
  return <View style={[s.card, { borderColor: subject.line, backgroundColor: theme.paper, gap: 14 }]}>
    <Text accessibilityRole="header" style={s.heading}>{zh ? '找到重复的一组' : 'Find the repeating group'}</Text>
    <Text style={s.body}>{zh ? '每个框里都是同样的一组，顺序也一样。' : 'Each box repeats the same group, in the same order.'}</Text>
    <View style={{ gap: 10 }}>
      {Array.from({ length: groups }, (_, group) => <LearningArrival key={group} style={{ gap: appSpacing.sm, padding: appSpacing.md, borderRadius: appRadii.card, borderWidth: 2, borderColor: subject.color, backgroundColor: theme.paper }}>
        <Text style={s.small}>{zh ? `第 ${group + 1} 组` : `Group ${group + 1}`}</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
          {pattern.map((symbol, index) => <View key={index} accessible accessibilityLabel={labels[symbol]} style={{ flexGrow: 1, flexBasis: 48, alignItems: 'center', gap: appSpacing.xs }}>
            <Text accessibilityElementsHidden importantForAccessibility="no" style={{ fontSize: appTextStyles.display.fontSize, color: symbol === 'red' ? theme.berryDeep : symbol === 'blue' ? theme.patternBlue : subject.color }}>{symbol === 'triangle' ? '▲' : symbol === 'square' ? '■' : '●'}</Text>
            <Text style={[s.small, { color: theme.ink, textAlign: 'center' }]}>{labels[symbol]}</Text>
          </View>)}
        </View>
      </LearningArrival>)}
    </View>
    <Text accessibilityLiveRegion="polite" style={s.body}>{zh ? `“${pattern.map(symbol => labels[symbol]).join('、')}”重复了 ${groups} 次。` : `${pattern.map(symbol => labels[symbol]).join(' → ')} repeats ${groups} times.`}</Text>
    <AnimatedPressable accessibilityRole="button" onPress={() => setGroups(current => current < 4 ? current + 1 : 2)}
      style={{ minHeight: 48, padding: 10, borderRadius: appRadii.control, borderWidth: 2, borderBottomWidth: 5, borderColor: subject.line, backgroundColor: theme.paper, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={[s.heading, { color: subject.color, textAlign: 'center' }]}>{groups < 4 ? (zh ? '＋ 再接一组' : '+ Add the next group') : (zh ? '重新探索' : 'Explore again')}</Text>
    </AnimatedPressable>
  </View>;
}
