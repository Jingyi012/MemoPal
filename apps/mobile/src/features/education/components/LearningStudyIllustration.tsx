import { useState } from 'react';
import { Text, View } from 'react-native';
import Svg, { Circle, Polygon, Rect } from 'react-native-svg';
import AnimatedPressable from '@/components/AnimatedPressable';
import { useLearningCopy, useLearningStyles, useLearningTheme } from './LearningUi';
import { LearningPatternExplorer, learningPatterns } from './LearningPatternExplorer';

const fractions: Record<string, { parts: number; shaded: number }> = {
  'fraction-half': { parts: 2, shaded: 1 },
  'fraction-quarter': { parts: 4, shaded: 1 },
  'fraction-three-quarters': { parts: 4, shaded: 3 },
};

export function LearningStudyIllustration({ code }: { code?: string | null }) {
  if (!code) return null;
  if (Object.hasOwn(learningPatterns, code)) return <LearningPatternExplorer key={code} code={code as keyof typeof learningPatterns} />;
  const fraction = fractions[code];
  if (fraction) return <FractionExplorer key={code} {...fraction} />;
  if (code === 'shape-circle' || code === 'shape-triangle' || code === 'shape-square') return <ShapeIllustration key={code} code={code} />;
  return null;
}

function FractionExplorer({ parts, shaded }: { parts: number; shaded: number }) {
  const { zh } = useLearningCopy();
  const { styles: s, theme } = useLearningStyles();
  const subject = useLearningTheme();
  const initial = () => Array.from({ length: parts }, (_, index) => index < shaded);
  const [selected, setSelected] = useState(initial);
  const count = selected.filter(Boolean).length;
  return <View style={[s.card, { gap: 14, borderColor: subject.line, backgroundColor: theme.paper }]}>
    <Text accessibilityRole="header" style={s.heading}>{zh ? '动手涂一涂' : 'Colour the equal parts'}</Text>
    <Text style={s.small}>{zh ? `这一个整体分成 ${parts} 个同样大的部分。点一点，改变涂色。` : `One whole, split into ${parts} equal parts. Tap to change the shading.`}</Text>
    <View style={{ flexDirection: 'row', borderRadius: 16, borderWidth: 2, borderColor: subject.color, overflow: 'hidden' }}>
      {selected.map((active, index) => <AnimatedPressable key={index} accessibilityRole="checkbox" accessibilityState={{ checked: active }}
        accessibilityLabel={zh ? `第 ${index + 1} 等份` : `Equal part ${index + 1}`}
        onPress={() => setSelected(current => current.map((value, i) => i === index ? !value : value))}
        style={{ flex: 1, minHeight: 76, minWidth: 44, borderLeftWidth: index ? 2 : 0, borderLeftColor: subject.color, backgroundColor: active ? subject.color : theme.paper, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={[s.heading, { color: active ? theme.onAccent : theme.inkSoft }]}>{active ? '✓' : '·'}</Text>
      </AnimatedPressable>)}
    </View>
    <Text accessibilityLiveRegion="polite" style={s.body}>{zh ? `你涂了 ${count}/${parts}：${parts} 等份中的 ${count} 份。` : `You shaded ${count}/${parts}: ${count} of ${parts} equal parts.`}</Text>
    <AnimatedPressable accessibilityRole="button" onPress={() => setSelected(initial())} style={{ minHeight: 44, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={[s.small, { color: subject.color }]}>{zh ? `回到例子 ${shaded}/${parts}` : `Reset to ${shaded}/${parts}`}</Text>
    </AnimatedPressable>
  </View>;
}

function ShapeIllustration({ code }: { code: string }) {
  const { styles: s, theme } = useLearningStyles();
  const subject = useLearningTheme();
  const { zh } = useLearningCopy();
  const [visited, setVisited] = useState<number[]>([]);
  const corners: readonly (readonly [number, number])[] = code === 'shape-triangle' ? [[100, 26], [174, 164], [26, 164]]
    : code === 'shape-square' ? [[42, 42], [158, 42], [158, 158], [42, 158]] : [];
  const complete = corners.length > 0 && visited.length === corners.length;
  const label = code === 'shape-circle' ? (zh ? '圆：没有角' : 'Circle: no corners')
    : code === 'shape-triangle' ? (zh ? '三角形：3 条直边，3 个角' : 'Triangle: 3 straight sides and 3 corners')
      : (zh ? '正方形：4 条等长直边，4 个直角' : 'Square: 4 equal straight sides and 4 right angles');
  return <View style={[s.card, { alignItems: 'center', gap: 12, backgroundColor: theme.paper, borderColor: subject.line }]}>
    <Text accessibilityRole="header" style={s.heading}>{zh ? '一起找找角' : 'Let’s explore the corners'}</Text>
    <Text style={s.body}>{corners.length
      ? (zh ? '点一点图形上的圆点，数数有几个角。' : 'Tap the dots on the shape and count its corners.')
      : (zh ? '沿着圆边看一圈：圆没有直边，也没有角。' : 'Follow the curved edge around: a circle has no straight sides or corners.')}</Text>
    <View style={{ width: 200, height: 200 }}>
      <View accessible accessibilityRole="image" accessibilityLabel={label}>
        <Svg width={200} height={200} viewBox="0 0 200 200">
          {code === 'shape-circle' ? <Circle cx={100} cy={100} r={72} fill={subject.tint} stroke={subject.color} strokeWidth={5} />
            : code === 'shape-triangle' ? <Polygon points="100,26 174,164 26,164" fill={subject.tint} stroke={subject.color} strokeWidth={5} strokeLinejoin="round" />
              : <Rect x={42} y={42} width={116} height={116} fill={subject.tint} stroke={subject.color} strokeWidth={5} />}
        </Svg>
      </View>
      {corners.map(([x, y], index) => {
        const order = visited.indexOf(index);
        return <AnimatedPressable key={index} accessibilityRole="button"
          accessibilityState={{ selected: order >= 0 }}
          accessibilityLabel={zh ? `角 ${index + 1}${order >= 0 ? '，已找到' : ''}` : `Corner ${index + 1}${order >= 0 ? ', found' : ''}`}
          onPress={() => setVisited(current => current.includes(index) ? current : [...current, index])}
          containerStyle={{ position: 'absolute', left: x - 22, top: y - 22, width: 44, height: 44 }}
          style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}>
          <View style={{ minWidth: 32, minHeight: 32, paddingHorizontal: 4, borderRadius: 16, borderWidth: 2, borderColor: subject.color,
            backgroundColor: order >= 0 ? subject.color : theme.paper, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={[s.small, { color: order >= 0 ? theme.onAccent : subject.color }]}>{order >= 0 ? order + 1 : '·'}</Text>
          </View>
        </AnimatedPressable>;
      })}
    </View>
    <Text accessibilityLiveRegion="polite" style={[s.body, { color: theme.ink }]}>{complete ? `✓ ${label}` : corners.length
      ? (zh ? `已经找到 ${visited.length} 个角` : `${visited.length} corners found`)
      : label}</Text>
    {corners.length > 0 ? <AnimatedPressable accessibilityRole="button" disabled={!visited.length} accessibilityState={{ disabled: !visited.length }} onPress={() => setVisited([])} style={{ minHeight: 44, justifyContent: 'center' }}>
      <Text style={[s.small, { color: visited.length ? subject.color : theme.inkSoft }]}>{zh ? '再数一次' : 'Count again'}</Text>
    </AnimatedPressable> : null}
  </View>;
}
