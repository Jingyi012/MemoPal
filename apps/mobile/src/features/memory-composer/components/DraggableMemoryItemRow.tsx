import AnimatedPressable from '@/components/AnimatedPressable';
import { memopalTheme as theme } from '@/theme/memopalTheme';
import { typography } from '@/theme/typography';
import * as Haptics from 'expo-haptics';
import { GripVertical, Trash2 } from '@/core/icons';
import { createContext, useContext, useCallback, useLayoutEffect, useMemo, useState, type ReactNode } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  type AccessibilityActionEvent,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  interpolateColor,
  runOnJS,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
const ITEM_GAP = 8;
const ReorderContext = createContext<SharedValue<{ from: number; to: number; stride: number }> | null>(null);

export function MemoryItemReorderProvider({ children }: { children: ReactNode }) {
  const position = useSharedValue({ from: -1, to: -1, stride: 61 });
  return <ReorderContext.Provider value={position}>{children}</ReorderContext.Provider>;
}

export type DraggableMemoryItem = {
  value: string;
  needsReview?: boolean;
};

export function DraggableMemoryItemRow({
  item,
  index,
  itemCount,
  placeholder,
  removeLabel,
  reorderLabel,
  reorderHint,
  onChange,
  onRemove,
  onMove,
  onDragStateChange,
}: {
  item: DraggableMemoryItem;
  index: number;
  itemCount: number;
  placeholder: string;
  removeLabel: string;
  reorderLabel: string;
  reorderHint: string;
  onChange: (value: string) => void;
  onRemove: () => void;
  onMove: (from: number, to: number) => void;
  onDragStateChange: (dragging: boolean) => void;
}) {
  const position = useContext(ReorderContext);
  const translateY = useSharedValue(0);
  const baseOffsetY = useSharedValue(0);
  const rowStride = useSharedValue(61);
  const initialIndex = useSharedValue(index);
  const currentIndex = useSharedValue(index);
  const pressProgress = useSharedValue(0);
  const dragProgress = useSharedValue(0);
  const dragActivated = useSharedValue(false);
  const dropCompleted = useSharedValue(false);
  const [isDragging, setIsDragging] = useState(false);
  const reduceMotion = useReducedMotion();

  const finishDrag = useCallback((from: number, to: number) => {
    if (from !== to) {
      onMove(from, to);
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onDragStateChange(false);

    // Commit once on release so native layout cannot race the finger-following
    // transform. Let the new layout commit before settling into its slot.
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setIsDragging(false);
        if (position) position.value = { from: -1, to: -1, stride: rowStride.value };
        pressProgress.value = withTiming(0, { duration: reduceMotion ? 0 : 100 });
        dragProgress.value = withTiming(0, { duration: reduceMotion ? 0 : 130 });
      });
    });
  }, [dragProgress, onDragStateChange, onMove, position, pressProgress, reduceMotion, rowStride]);

  const startDrag = useCallback(() => {
    setIsDragging(true);
    onDragStateChange(true);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, [onDragStateChange]);

  const cancelDrag = useCallback(() => {
    setIsDragging(false);
    onDragStateChange(false);
  }, [onDragStateChange]);

  useLayoutEffect(() => {
    if (!isDragging) return;
    baseOffsetY.value = (index - initialIndex.value) * rowStride.value;
    if (index !== initialIndex.value && position) {
      position.value = { from: -1, to: -1, stride: rowStride.value };
    }
  }, [baseOffsetY, index, initialIndex, isDragging, position, rowStride]);

  const dragGesture = useMemo(
    () =>
      Gesture.Pan()
        .activateAfterLongPress(300)
        .onBegin(() => {
          pressProgress.value = withTiming(1, { duration: reduceMotion ? 0 : 180 });
        })
        .onStart(() => {
          dragActivated.value = true;
          dropCompleted.value = false;
          initialIndex.value = index;
          currentIndex.value = index;
          if (position) position.value = { from: index, to: index, stride: rowStride.value };
          baseOffsetY.value = 0;
          translateY.value = 0;
          dragProgress.value = withTiming(1, { duration: reduceMotion ? 0 : 90 });
          runOnJS(startDrag)();
        })
        .onUpdate((event) => {
          const offset = Math.round(event.translationY / rowStride.value);
          const targetIndex = Math.max(
            0,
            Math.min(itemCount - 1, initialIndex.value + offset)
          );
          currentIndex.value = targetIndex;
          if (position) position.value = { from: initialIndex.value, to: targetIndex, stride: rowStride.value };
          translateY.value = Math.max(
            -initialIndex.value * rowStride.value,
            Math.min((itemCount - 1 - initialIndex.value) * rowStride.value, event.translationY)
          );
        })
        .onEnd(() => {
          dragActivated.value = false;
          dropCompleted.value = true;
          runOnJS(finishDrag)(initialIndex.value, currentIndex.value);
        })
        .onFinalize(() => {
          if (dragActivated.value) runOnJS(cancelDrag)();
          dragActivated.value = false;
          if (!dropCompleted.value) {
            if (position) position.value = { from: -1, to: -1, stride: rowStride.value };
            pressProgress.value = withTiming(0, { duration: reduceMotion ? 0 : 100 });
            dragProgress.value = withTiming(0, { duration: reduceMotion ? 0 : 130 });
            translateY.value = withTiming(0, { duration: reduceMotion ? 0 : 130 });
          }
        }),
    [baseOffsetY, cancelDrag, currentIndex, dragActivated, dragProgress, dropCompleted, finishDrag, index, initialIndex, itemCount, position, pressProgress, reduceMotion, rowStride, startDrag, translateY]
  );

  const rowAnimatedStyle = useAnimatedStyle(() => {
    const drag = position?.value;
    let offset = 0;
    if (drag && drag.from >= 0 && index !== drag.from) {
      if (index > drag.from && index <= drag.to) offset = -drag.stride;
      if (index < drag.from && index >= drag.to) offset = drag.stride;
    }
    return {
    transform: [
      {
        translateY: dragProgress.value > 0
          ? (translateY.value - baseOffsetY.value) * dragProgress.value
          : drag && drag.from >= 0
            ? withTiming(offset, { duration: reduceMotion ? 0 : 150 })
            : 0,
      },
      { scale: reduceMotion ? 1 : 1 + dragProgress.value * 0.008 },
    ],
    };
  });

  const handleAnimatedStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      pressProgress.value,
      [0, 1],
      ['rgba(0, 0, 0, 0)', theme.violetTint]
    ),
    transform: [{ scale: reduceMotion ? 1 : 1 + pressProgress.value * 0.04 }],
  }));

  const handleAccessibilityAction = (event: AccessibilityActionEvent) => {
    const targetIndex = event.nativeEvent.actionName === 'increment' ? index + 1 : index - 1;
    if (targetIndex >= 0 && targetIndex < itemCount) onMove(index, targetIndex);
  };

  return (
    <Animated.View
      onLayout={(event) => {
        rowStride.value = event.nativeEvent.layout.height + ITEM_GAP;
      }}
      style={[
        styles.itemRow,
        item.needsReview && styles.itemRowNeedsReview,
        isDragging && styles.itemRowDragging,
        rowAnimatedStyle,
      ]}>
      <View style={styles.itemNumber}>
        <Text style={styles.itemNumberText}>{index + 1}</Text>
      </View>
      <TextInput
        value={item.value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor="#AAA7B5"
        maxLength={500}
        selectionColor={theme.violetDeep}
        cursorColor={theme.violetDeep}
        style={styles.itemInput}
      />
      <GestureDetector gesture={dragGesture}>
        <Animated.View
          accessible
          accessibilityRole="adjustable"
          accessibilityLabel={`${reorderLabel} ${index + 1}`}
          accessibilityHint={reorderHint}
          accessibilityActions={[{ name: 'decrement' }, { name: 'increment' }]}
          onAccessibilityAction={handleAccessibilityAction}
          hitSlop={4}
          style={[styles.dragHandle, handleAnimatedStyle]}>
          <GripVertical size={19} color={theme.inkSoft} />
        </Animated.View>
      </GestureDetector>
      <AnimatedPressable
        accessibilityLabel={`${removeLabel} ${item.value || `${index + 1}`}`}
        onPress={onRemove}
        style={styles.removeButton}>
        <Trash2 size={16} color={theme.inkSoft} />
      </AnimatedPressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  itemRow: {
    minHeight: 53,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: theme.line,
    backgroundColor: theme.paper,
    paddingLeft: 9,
    paddingRight: 4,
    zIndex: 0,
  },
  itemRowNeedsReview: { borderColor: '#FFD06A', backgroundColor: '#FFF9E9' },
  itemRowDragging: {
    zIndex: 10,
    elevation: 4,
    borderColor: theme.violetDeep,
  },
  itemNumber: {
    width: 27,
    height: 27,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.violet,
  },
  itemNumberText: { color: 'white', fontFamily: typography.bodyExtraBold, fontSize: 11 },
  itemInput: {
    flex: 1,
    minHeight: 43,
    color: theme.ink,
    fontFamily: typography.bodySemibold,
    fontSize: 14,
    paddingVertical: 8,
  },
  dragHandle: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  removeButton: { width: 40, height: 44, alignItems: 'center', justifyContent: 'center' },
});
