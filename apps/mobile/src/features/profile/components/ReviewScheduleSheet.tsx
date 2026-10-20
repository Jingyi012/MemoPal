import { createThemedStyles } from '@/theme/createThemedStyles';
import { AppButton } from '@/components/ui/AppButton';
import AnimatedPressable from '@/components/AnimatedPressable';
import CustomBottomSheetModal from '@/components/CustomBottomSheetModal';
import { useTranslation } from '@/core/i18n/useTranslation';
import { typography } from '@/theme/typography';
import { BottomSheetModal, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { LinearGradient } from 'expo-linear-gradient';
import { Clock3 } from '@/core/icons';
import React, { forwardRef, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeViewGestureHandler } from 'react-native-gesture-handler';

interface ReviewScheduleSheetProps {
  currentTime: string;
  onSave: (time: string) => void | Promise<void>;
}

type Ref = BottomSheetModal;
const ITEM_HEIGHT = 44;
const VISIBLE_ITEMS = 5;
const WHEEL_PADDING = ITEM_HEIGHT * Math.floor(VISIBLE_ITEMS / 2);

const QUICK_TIMES = ['08:00', '12:00', '19:00'];

export const ReviewScheduleSheet = forwardRef<Ref, ReviewScheduleSheetProps>(
  ({ currentTime, onSave }, ref) => {
    const { styles, theme } = useStyles();
    const insets = useSafeAreaInsets();
    const { t } = useTranslation('profile');
    const [selectedTime, setSelectedTime] = useState(normalizeTime(currentTime));
    const selectedTimeRef = useRef(normalizeTime(currentTime));
    const [hour, minute] = splitTime(selectedTime);
    const hourListRef = useRef<ScrollView>(null);
    const minuteListRef = useRef<ScrollView>(null);
    const hours = useMemo(() => Array.from({ length: 24 }, (_, value) => value), []);
    const minutes = useMemo(() => Array.from({ length: 12 }, (_, value) => value * 5), []);

    const selectTime = useCallback((time: string) => {
      const normalized = normalizeTime(time);
      selectedTimeRef.current = normalized;
      setSelectedTime(normalized);
    }, []);

    useEffect(() => {
      selectTime(currentTime);
    }, [currentTime, selectTime]);

    const scrollToSelection = (
      list: React.RefObject<ScrollView | null>,
      index: number
    ) => {
      requestAnimationFrame(() =>
        list.current?.scrollTo({ y: index * ITEM_HEIGHT, animated: false })
      );
    };

    useEffect(() => {
      scrollToSelection(hourListRef, hour);
      scrollToSelection(minuteListRef, Math.round(minute / 5));
    }, [hour, minute]);

    const handleDismiss = () => {
      if (ref && 'current' in ref) ref.current?.dismiss();
    };

    const resetSelection = () => selectTime(currentTime);

    const updateHour = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const index = clampIndex(
        Math.round(event.nativeEvent.contentOffset.y / ITEM_HEIGHT),
        hours.length
      );
      const [, currentMinute] = splitTime(selectedTimeRef.current);
      selectTime(formatTime(hours[index], currentMinute));
    };

    const updateMinute = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const index = clampIndex(
        Math.round(event.nativeEvent.contentOffset.y / ITEM_HEIGHT),
        minutes.length
      );
      const [currentHour] = splitTime(selectedTimeRef.current);
      selectTime(formatTime(currentHour, minutes[index]));
    };

    return (
      <CustomBottomSheetModal
        ref={ref}
        snapPoints={['75%']}
        enableDynamicSizing={false}
        enableContentPanningGesture={false}
        onDismiss={resetSelection}>
        <BottomSheetScrollView contentContainerStyle={[styles.sheet, { paddingBottom: insets.bottom + 16 }]} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <View style={styles.headerIcon}>
              <Clock3 size={21} color={theme.violetDeep} />
            </View>
            <View style={styles.headerCopy}>
              <Text style={styles.title}>{t('dailyLearningTime')}</Text>
              <Text style={styles.subtitle}>{t('selectDailyLearningTime')}</Text>
            </View>
          </View>

          <LinearGradient colors={[theme.sunTint, theme.paper]} style={styles.preview}>
            <Text style={styles.previewLabel}>{t('currentTime')}</Text>
            <Text style={styles.previewTime}>{selectedTime}</Text>
            <Text style={styles.previewHint}>{t('dailyLearning')}</Text>
          </LinearGradient>

          <Text style={styles.instruction}>{t('scrollToChoose')}</Text>
          <View style={styles.wheel}>
            <View pointerEvents="none" style={styles.selectionHighlight} />
            <WheelColumn
              data={hours}
              value={hour}
              listRef={hourListRef}
              formatValue={(value) => String(value).padStart(2, '0')}
              onScrollEnd={updateHour}
            />
            <Text style={styles.colon}>:</Text>
            <WheelColumn
              data={minutes}
              value={minute}
              listRef={minuteListRef}
              formatValue={(value) => String(value).padStart(2, '0')}
              onScrollEnd={updateMinute}
            />
          </View>

          <View style={styles.quickRow}>
            <Text style={styles.quickLabel}>{t('quickTimes')}</Text>
            {QUICK_TIMES.map((time) => (
              <AnimatedPressable
                key={time}
                onPress={() => selectTime(time)}
                style={[styles.quickPill, selectedTime === time && styles.quickPillSelected]}>
                <Text style={[styles.quickText, selectedTime === time && styles.quickTextSelected]}>
                  {time}
                </Text>
              </AnimatedPressable>
            ))}
          </View>

          <View style={styles.footer}>
            <View style={styles.buttonSlot}>
              <AppButton fullWidth label={t('cancel')} onPress={handleDismiss} variant="secondary" />
            </View>
            <View style={styles.buttonSlot}>
              <AppButton fullWidth label={t('saveTime')} onPress={() => void onSave(selectedTimeRef.current)} />
            </View>
          </View>
        </BottomSheetScrollView>
      </CustomBottomSheetModal>
    );
  }
);

ReviewScheduleSheet.displayName = 'ReviewScheduleSheet';

function WheelColumn({
  data,
  value,
  listRef,
  formatValue,
  onScrollEnd,
}: {
  data: number[];
  value: number;
  listRef: React.RefObject<ScrollView | null>;
  formatValue: (value: number) => string;
  onScrollEnd: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
}) {
  const { styles } = useStyles();
  return (
    <NativeViewGestureHandler disallowInterruption>
      <ScrollView
        ref={listRef}
        style={styles.wheelList}
        onLayout={() => listRef.current?.scrollTo({ y: Math.max(0, data.indexOf(value)) * ITEM_HEIGHT, animated: false })}
        snapToInterval={ITEM_HEIGHT}
        decelerationRate="fast"
        nestedScrollEnabled
        scrollEnabled
        showsVerticalScrollIndicator={false}
        onMomentumScrollEnd={onScrollEnd}
        onScrollEndDrag={(event) => {
          if (!event.nativeEvent.velocity?.y) onScrollEnd(event);
        }}
        contentContainerStyle={{ paddingVertical: WHEEL_PADDING }}>
        {data.map((item) => (
          <View key={item} style={styles.wheelItem}>
            <Text style={[styles.wheelText, item === value && styles.wheelTextSelected]}>
              {formatValue(item)}
            </Text>
          </View>
        ))}
      </ScrollView>
    </NativeViewGestureHandler>
  );
}

function splitTime(value: string): [number, number] {
  const [hourValue, minuteValue] = value.split(':').map(Number);
  const hour = Number.isFinite(hourValue) ? Math.min(23, Math.max(0, hourValue)) : 9;
  const minute = Number.isFinite(minuteValue)
    ? Math.min(55, Math.max(0, Math.round(minuteValue / 5) * 5))
    : 0;
  return [hour, minute];
}

function normalizeTime(value: string) {
  const [hour, minute] = splitTime(value);
  return formatTime(hour, minute);
}

function formatTime(hour: number, minute: number) {
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

function clampIndex(value: number, length: number) {
  return Math.min(length - 1, Math.max(0, value));
}

const useStyles = createThemedStyles((theme) => StyleSheet.create({
  sheet: { flexGrow: 1, paddingHorizontal: 20, paddingTop: 12 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 11, marginBottom: 12 },
  headerIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.violetTint,
  },
  headerCopy: { flex: 1 },
  title: { color: theme.ink, fontFamily: typography.displayExtraBold, fontSize: 19 },
  subtitle: { color: theme.inkSoft, fontFamily: typography.bodyBold, fontSize: 11.5, marginTop: 2 },
  preview: {
    alignItems: 'center',
    borderColor: theme.sunLine,
    borderRadius: 18,
    borderWidth: 2,
    paddingVertical: 10,
    marginBottom: 10,
  },
  previewLabel: {
    color: theme.inkSoft,
    fontFamily: typography.bodyExtraBold,
    fontSize: 9.5,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  previewTime: {
    color: theme.ink,
    fontFamily: typography.displayExtraBold,
    fontSize: 31,
    lineHeight: 36,
    marginTop: 1,
  },
  previewHint: { color: theme.inkSoft, fontFamily: typography.bodyBold, fontSize: 10 },
  instruction: {
    color: theme.inkSoft,
    fontFamily: typography.bodyBold,
    fontSize: 11,
    textAlign: 'center',
    marginBottom: 6,
  },
  wheel: {
    alignItems: 'center',
    backgroundColor: theme.paper,
    borderColor: theme.violetLine,
    borderRadius: 18,
    borderWidth: 2,
    flexDirection: 'row',
    height: ITEM_HEIGHT * VISIBLE_ITEMS,
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  wheelList: { flexGrow: 0, height: ITEM_HEIGHT * VISIBLE_ITEMS, width: 82 },
  selectionHighlight: {
    backgroundColor: theme.violetTint,
    borderColor: theme.violetLine,
    borderRadius: 12,
    borderWidth: 2,
    height: ITEM_HEIGHT,
    left: '22%',
    position: 'absolute',
    right: '22%',
    top: WHEEL_PADDING,
  },
  wheelItem: { alignItems: 'center', height: ITEM_HEIGHT, justifyContent: 'center', width: 70 },
  wheelText: { color: theme.inkSoft, fontFamily: typography.displayExtraBold, fontSize: 21 },
  wheelTextSelected: { color: theme.violetDeep, fontSize: 25 },
  colon: {
    color: theme.violetDeep,
    fontFamily: typography.displayExtraBold,
    fontSize: 25,
    marginHorizontal: 3,
  },
  quickRow: { alignItems: 'center', flexDirection: 'row', gap: 7, marginTop: 12, marginBottom: 13 },
  quickLabel: {
    color: theme.inkSoft,
    flex: 1,
    fontFamily: typography.bodyExtraBold,
    fontSize: 10,
    textTransform: 'uppercase',
  },
  quickPill: {
    minHeight: 44,
    justifyContent: 'center',
    backgroundColor: theme.violetTint,
    borderColor: theme.line,
    borderRadius: 10,
    borderWidth: 2,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  quickPillSelected: { backgroundColor: theme.violetTint, borderColor: theme.violetLine },
  quickText: { color: theme.inkSoft, fontFamily: typography.bodyExtraBold, fontSize: 11 },
  quickTextSelected: { color: theme.violetDeep },
  footer: {
    alignItems: 'stretch',
    borderTopColor: theme.line,
    borderTopWidth: 2,
    flexDirection: 'row',
    gap: 10,
    marginTop: 'auto',
    paddingTop: 13,
    paddingBottom: 5,
  },
  buttonSlot: { flex: 1 },
}));
