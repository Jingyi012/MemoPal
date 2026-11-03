import { useState } from 'react';
import { Text, View } from 'react-native';
import Svg, { Circle, Polygon, Rect } from 'react-native-svg';
import AnimatedPressable from '@/components/AnimatedPressable';
import { useLearningCopy, useLearningStyles } from './LearningUi';

const fractions: Record<string, { parts: number; shaded: number }> = {
  'fraction-half': { parts: 2, shaded: 1 },
  'fraction-quarter': { parts: 4, shaded: 1 },
  'fraction-three-quarters': { parts: 4, shaded: 3 },
};

export function LearningStudyIllustration({ code }: { code?: string | null }) {
  if (!code) return null;
  const fraction = fractions[code];
  if (fraction) return <FractionExplorer key={code} {...fraction} />;
  if (code === 'shape-circle' || code === 'shape-triangle' || code === 'shape-square') return <ShapeIllustration code={code} />;
  return null;
}

function FractionExplorer({ parts, shaded }: { parts: number; shaded: number }) {
  const { zh } = useLearningCopy();
  const { styles: s, theme } = useLearningStyles();
  const initial = () => Array.from({ length: parts }, (_, index) => index < shaded);
  const [selected, setSelected] = useState(initial);
  const count = selected.filter(Boolean).length;
  return <View style={[s.card, { gap: 14 }]}>
    <Text accessibilityRole="header" style={s.heading}>{zh ? '动手涂一涂' : 'Colour the equal parts'}</Text>
    <Text style={s.small}>{zh ? `这一个整体分成 ${parts} 个同样大的部分。点一点，改变涂色。` : `One whole, split into ${parts} equal parts. Tap to change the shading.`}</Text>
    <View style={{ flexDirection: 'row', borderRadius: 16, borderWidth: 2, borderColor: theme.violetDeep, overflow: 'hidden' }}>
      {selected.map((active, index) => <AnimatedPressable key={index} accessibilityRole="checkbox" accessibilityState={{ checked: active }}
        accessibilityLabel={zh ? `第 ${index + 1} 等份` : `Equal part ${index + 1}`}
        onPress={() => setSelected(current => current.map((value, i) => i === index ? !value : value))}
        style={{ flex: 1, minHeight: 76, minWidth: 44, borderLeftWidth: index ? 2 : 0, borderLeftColor: theme.violetDeep, backgroundColor: active ? theme.violetDeep : theme.paper, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={[s.heading, { color: active ? theme.onAccent : theme.inkSoft }]}>{active ? '✓' : '·'}</Text>
      </AnimatedPressable>)}
    </View>
    <Text accessibilityLiveRegion="polite" style={s.body}>{zh ? `你涂了 ${count}/${parts}：${parts} 等份中的 ${count} 份。` : `You shaded ${count}/${parts}: ${count} of ${parts} equal parts.`}</Text>
    <AnimatedPressable accessibilityRole="button" onPress={() => setSelected(initial())} style={{ minHeight: 44, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={[s.small, { color: theme.violetDeep }]}>{zh ? `回到例子 ${shaded}/${parts}` : `Reset to ${shaded}/${parts}`}</Text>
    </AnimatedPressable>
  </View>;
}

function ShapeIllustration({ code }: { code: string }) {
  const { styles: s, theme } = useLearningStyles();
  const { zh } = useLearningCopy();
  const label = code === 'shape-circle' ? (zh ? '圆：没有角' : 'Circle: no corners')
    : code === 'shape-triangle' ? (zh ? '三角形：3 条直边，3 个角' : 'Triangle: 3 straight sides and 3 corners')
      : (zh ? '正方形：4 条等长直边，4 个直角' : 'Square: 4 equal straight sides and 4 right angles');
  return <View style={[s.card, { alignItems: 'center', gap: 12 }]}>
    <View accessible accessibilityRole="image" accessibilityLabel={label}>
      <Svg width={160} height={160} viewBox="0 0 160 160">
        {code === 'shape-circle' ? <Circle cx={80} cy={80} r={58} fill={theme.violetTint} stroke={theme.violetDeep} strokeWidth={5} />
          : code === 'shape-triangle' ? <Polygon points="80,18 144,136 16,136" fill={theme.violetTint} stroke={theme.violetDeep} strokeWidth={5} strokeLinejoin="round" />
            : <Rect x={24} y={24} width={112} height={112} fill={theme.violetTint} stroke={theme.violetDeep} strokeWidth={5} />}
      </Svg>
    </View>
    <Text style={s.body}>{label}</Text>
  </View>;
}
