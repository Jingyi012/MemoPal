import AnimatedPressable from '@/components/AnimatedPressable';
import { memopalTheme as theme } from '@/theme/memopalTheme';
import { typography } from '@/theme/typography';
import * as Haptics from 'expo-haptics';
import { GripVertical, Trash2 } from 'lucide-react-native';
import { useCallback, useMemo, useRef, useState } from 'react';
import {
  Animated,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type AccessibilityActionEvent,
} from 'react-native';
import type { OcrItem } from '../utils/ocr';

const ITEM_GAP = 8;

export function DraggableOcrItemRow({
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
  item: OcrItem;
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
  const translateY = useRef(new Animated.Value(0)).current;
  const rowHeight = useRef(53);
  const [isDragging, setIsDragging] = useState(false);

  const finishDrag = useCallback((dy: number, shouldMove: boolean) => {
    const offset = shouldMove ? Math.round(dy / (rowHeight.current + ITEM_GAP)) : 0;
    const targetIndex = Math.max(0, Math.min(itemCount - 1, index + offset));
    translateY.setValue(0);
    setIsDragging(false);
    onDragStateChange(false);
    if (targetIndex !== index) {
      onMove(index, targetIndex);
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, [index, itemCount, onDragStateChange, onMove, translateY]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: () => {
          setIsDragging(true);
          onDragStateChange(true);
          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        },
        onPanResponderMove: Animated.event([null, { dy: translateY }], {
          useNativeDriver: false,
        }),
        onPanResponderRelease: (_, gestureState) => finishDrag(gestureState.dy, true),
        onPanResponderTerminate: (_, gestureState) => finishDrag(gestureState.dy, false),
      }),
    [finishDrag, onDragStateChange, translateY]
  );

  const handleAccessibilityAction = (event: AccessibilityActionEvent) => {
    const targetIndex = event.nativeEvent.actionName === 'increment' ? index + 1 : index - 1;
    if (targetIndex >= 0 && targetIndex < itemCount) onMove(index, targetIndex);
  };

  return (
    <Animated.View
      onLayout={(event) => {
        rowHeight.current = event.nativeEvent.layout.height;
      }}
      style={[
        styles.itemRow,
        item.needsReview && styles.itemRowNeedsReview,
        isDragging && styles.itemRowDragging,
        { transform: [{ translateY }] },
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
      <Pressable
        accessibilityRole="adjustable"
        accessibilityLabel={`${reorderLabel} ${index + 1}`}
        accessibilityHint={reorderHint}
        accessibilityActions={[{ name: 'decrement' }, { name: 'increment' }]}
        onAccessibilityAction={handleAccessibilityAction}
        hitSlop={4}
        style={({ pressed }) => [styles.dragHandle, pressed && styles.dragHandlePressed]}
        {...panResponder.panHandlers}>
        <GripVertical size={19} color={theme.inkSoft} />
      </Pressable>
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
    elevation: 8,
    borderColor: theme.violetDeep,
    opacity: 0.96,
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
  dragHandlePressed: { backgroundColor: theme.canvas },
  removeButton: { width: 40, height: 44, alignItems: 'center', justifyContent: 'center' },
});
