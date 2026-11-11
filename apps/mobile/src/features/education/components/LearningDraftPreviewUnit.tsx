import { AppText as Text } from '@/components/ui/AppText';
import { appSpacing } from '@/theme/designSystem';
import { View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import AnimatedPressable from '@/components/AnimatedPressable';
import { LearningIconButton } from './LearningIconButton';
import { useDraftStyles } from './learningDraftStyles';
import { useLearningCopy } from './LearningUi';
import type { DraftUnit } from '../utils/educationDraftEditor';

export function LearningDraftPreviewUnit({ unit, index, count, onEdit, onMove, onDrag }: {
  unit: DraftUnit; index: number; count: number; onEdit: () => void; onMove: (from: number, to: number) => void; onDrag: (active: boolean) => void;
}) {
  const { styles: s, theme } = useDraftStyles();
  const { zh } = useLearningCopy();
  const height = useSharedValue(120);
  const y = useSharedValue(0);
  const active = useSharedValue(false);
  const drag = Gesture.Pan().activateAfterLongPress(300).onStart(() => { active.value = true; runOnJS(onDrag)(true); })
    .onUpdate(event => { y.value = event.translationY; })
    .onEnd(event => { const to = Math.max(0, Math.min(count - 1, index + Math.round(event.translationY / (height.value + 14)))); runOnJS(onMove)(index, to); })
    .onFinalize(() => { y.value = 0; active.value = false; runOnJS(onDrag)(false); });
  const style = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }], zIndex: active.value ? 10 : 0, opacity: active.value ? .9 : 1 }));
  return <GestureDetector gesture={drag}>
    <Animated.View onLayout={event => { height.value = event.nativeEvent.layout.height; }} style={[s.card, style]}>
      <View style={s.row}>
        <AnimatedPressable accessibilityRole="button" accessibilityLabel={zh ? '编辑这个单元' : 'Edit this unit'} onPress={onEdit} style={{ flex: 1, minWidth: 0, gap: appSpacing.xs, minHeight: 48 }}>
          <Text style={[s.small, { color: theme.violetDeep }]}>{zh ? `单元 ${index + 1} · ${unit.words.length} 张卡片` : `Unit ${index + 1} · ${unit.words.length} cards`}</Text>
          <Text numberOfLines={1} style={s.heading}>{unit.title || (zh ? `单元 ${index + 1}` : `Unit ${index + 1}`)}</Text>
          <Text numberOfLines={2} style={s.small}>{unit.words.map(word => word.text).join(' · ')}</Text>
        </AnimatedPressable>
        <LearningIconButton icon="chevron-up" variant="plain" label={zh ? '单元上移' : 'Move unit up'} disabled={index === 0} onPress={() => onMove(index, index - 1)} />
        <LearningIconButton icon="chevron-down" variant="plain" label={zh ? '单元下移' : 'Move unit down'} disabled={index === count - 1} onPress={() => onMove(index, index + 1)} />
      </View>
    </Animated.View>
  </GestureDetector>;
}
