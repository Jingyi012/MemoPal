import AnimatedPressable from '@/components/AnimatedPressable';
import CustomBottomSheetModal from '@/components/CustomBottomSheetModal';
import { MemoryAvatar } from '@/components/MemoryAvatar';
import { useTranslation } from '@/core/i18n/useTranslation';
import type { AvatarDefinition } from '@/features/avatars/types/avatar';
import { createThemedStyles } from '@/theme/createThemedStyles';
import { typography } from '@/theme/typography';
import type { BottomSheetModal } from '@gorhom/bottom-sheet';
import { BottomSheetScrollView, BottomSheetView } from '@gorhom/bottom-sheet';
import React, { useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';

type Props = {
  avatar: AvatarDefinition | null;
  avatars: readonly AvatarDefinition[];
  level: number;
  selectedAvatarId: string | null;
  isPending: boolean;
  hasError: boolean;
  onSelect: (avatarId: string) => Promise<unknown>;
};

export function CompanionSwitcher({ avatar, avatars, level, selectedAvatarId, isPending, hasError, onSelect }: Props) {
  const { t, language } = useTranslation('companion');
  const { styles, theme } = useStyles();
  const insets = useSafeAreaInsets();
  const sheetRef = useRef<BottomSheetModal>(null);
  const [pendingAvatarId, setPendingAvatarId] = useState<string | null>(null);
  const unlockedAvatars = avatars.filter((candidate) => candidate.requiredLevel <= level);
  if (unlockedAvatars.length < 2) return null;

  const choose = async (avatarId: string) => {
    if (isPending || avatarId === selectedAvatarId) {
      sheetRef.current?.dismiss();
      return;
    }
    setPendingAvatarId(avatarId);
    try {
      await onSelect(avatarId);
      sheetRef.current?.dismiss();
    } catch {
      // Keep the picker open so the failure message and retry choices remain visible.
    } finally {
      setPendingAvatarId(null);
    }
  };

  return (
    <>
      <AnimatedPressable
        accessibilityRole="button"
        accessibilityLabel={t('chooseCompanion')}
        accessibilityHint={avatar ? (language === 'zh' ? `当前伙伴：${avatar.titleZh}` : `Current companion: ${avatar.titleEn}`) : undefined}
        onPress={() => sheetRef.current?.present()}
        containerStyle={styles.triggerPosition}
        style={styles.trigger}>
        {avatar ? <MemoryAvatar avatar={avatar} size={30} showLevelBadge={false} /> : null}
        <Text numberOfLines={1} style={styles.triggerName}>
          {avatar ? (language === 'zh' ? avatar.titleZh : avatar.titleEn) : t('companionName')}
        </Text>
        <Ionicons name="chevron-down" size={15} color={theme.violetDeep} />
      </AnimatedPressable>

      <CustomBottomSheetModal
        ref={sheetRef}
        snapPoints={['55%']}
        enableDynamicSizing={false}
        backgroundStyle={styles.sheet}>
        <BottomSheetView style={[styles.sheetContent, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <View style={styles.sheetHeading}>
            <Text style={styles.sheetTitle}>{t('chooseCompanion')}</Text>
            <Text style={styles.sheetSubtitle}>{t('chooseCompanionDescription')}</Text>
          </View>
          <BottomSheetScrollView contentContainerStyle={styles.options} showsVerticalScrollIndicator={false}>
            {unlockedAvatars.map((candidate) => {
              const selected = candidate.id === selectedAvatarId;
              return (
                <AnimatedPressable
                  key={candidate.id}
                  accessibilityRole="button"
                  accessibilityLabel={language === 'zh' ? `选择${candidate.titleZh}` : `Choose ${candidate.titleEn}`}
                  accessibilityState={{ selected, disabled: isPending }}
                  disabled={isPending}
                  onPress={() => void choose(candidate.id)}
                  style={[styles.option, selected && styles.optionSelected, isPending && styles.optionDisabled]}>
                  <MemoryAvatar avatar={candidate} size={46} level={level} showLevelBadge={false} />
                  <Text numberOfLines={1} style={styles.optionName}>{language === 'zh' ? candidate.titleZh : candidate.titleEn}</Text>
                  {isPending && pendingAvatarId === candidate.id ? <ActivityIndicator size="small" color={theme.violetDeep} /> : null}
                  {selected ? <Ionicons name="checkmark-circle" size={22} color={theme.violetDeep} /> : null}
                </AnimatedPressable>
              );
            })}
          </BottomSheetScrollView>
          {hasError ? <Text accessibilityRole="alert" style={styles.error}>{t('companionSwitchFailed')}</Text> : null}
        </BottomSheetView>
      </CustomBottomSheetModal>
    </>
  );
}

const useStyles = createThemedStyles((theme) => StyleSheet.create({
  triggerPosition: { position: 'absolute', top: 12, left: 0, zIndex: 30, elevation: 16 },
  trigger: { minHeight: 44, maxWidth: 184, flexDirection: 'row', alignItems: 'center', gap: 7, paddingLeft: 6, paddingRight: 10, borderRadius: 23, borderWidth: 1, borderColor: 'rgba(255,255,255,0.94)', backgroundColor: 'rgba(255,255,255,0.96)', boxShadow: '0px 3px 10px rgba(43,42,61,0.12)' },
  triggerName: { flexShrink: 1, color: theme.ink, fontFamily: typography.bodyExtraBold, fontSize: 11 },
  sheet: { backgroundColor: theme.paper, borderRadius: 28 },
  sheetContent: { flex: 1, paddingHorizontal: 20, paddingTop: 8 },
  sheetHeading: { gap: 4, paddingBottom: 14 },
  sheetTitle: { color: theme.ink, fontFamily: typography.displayExtraBold, fontSize: 19 },
  sheetSubtitle: { color: theme.inkMuted, fontFamily: typography.body, fontSize: 11 },
  options: { gap: 8, paddingBottom: 10 },
  option: { minHeight: 66, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 12, borderWidth: 1, borderColor: theme.line, borderRadius: 18, backgroundColor: theme.canvas },
  optionSelected: { borderColor: theme.violetDeep, backgroundColor: theme.violetTint },
  optionDisabled: { opacity: 0.7 },
  optionName: { flex: 1, color: theme.ink, fontFamily: typography.bodyBold, fontSize: 13 },
  error: { color: theme.berryDeep, fontFamily: typography.body, fontSize: 11, paddingVertical: 8 },
}));
