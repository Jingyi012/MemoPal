import AnimatedPressable from '@/components/AnimatedPressable';
import { Check, LockKeyhole, Plus, Trash2 } from '@/core/icons';
import { useTranslation } from '@/core/i18n/useTranslation';
import type { AppearanceDefinition } from '@/features/appearance/types/appearance';
import type { CompanionLook, CompanionPreset } from '@/features/profile/api/companion.api';
import { useCompanionPresets, useCreateCompanionPreset, useDeleteCompanionPreset, useEquipCompanionPreset } from '@/features/profile/hooks/useCompanion';
import { createThemedStyles } from '@/theme/createThemedStyles';
import { typography } from '@/theme/typography';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, Modal, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';
import { CompanionCharacterArtwork, isApprovedCompanionLayer, isCompanionCompatible } from './CompanionCharacterArtwork';

const PRESET_LIMIT = 5;
const LOOK_SLOTS: { slot: keyof CompanionLook; type: AppearanceDefinition['itemType'] }[] = [
  { slot: 'headwearId', type: 'headwear' },
  { slot: 'bodywearId', type: 'bodywear' },
  { slot: 'backwearId', type: 'backwear' },
  { slot: 'handItemId', type: 'handItem' },
];

type Props = {
  avatarId: string;
  companionKey: string;
  characterImageUrl?: string | null;
  draft: CompanionLook;
  savedLook: CompanionLook;
  isDirty: boolean;
  items: readonly AppearanceDefinition[];
  level: number;
  canSave: boolean;
  onPreview: (look: CompanionLook) => void;
  onEquipped: (look: CompanionLook) => void;
};

export function CompanionPresetsRail({ avatarId, companionKey, characterImageUrl, draft, savedLook, isDirty, items, level, canSave, onPreview, onEquipped }: Props) {
  const { styles, theme } = useStyles();
  const { t } = useTranslation('companion');
  const reduceMotion = useReducedMotion();
  const presets = useCompanionPresets();
  const createPreset = useCreateCompanionPreset();
  const equipPreset = useEquipCompanionPreset();
  const deletePreset = useDeleteCompanionPreset();
  const [nameModalVisible, setNameModalVisible] = useState(false);
  const [name, setName] = useState('');
  const [selectedPreset, setSelectedPreset] = useState<CompanionPreset | null>(null);
  const [failedDeletePreset, setFailedDeletePreset] = useState<CompanionPreset | null>(null);
  const [previewNotice, setPreviewNotice] = useState<string | null>(null);
  const trimmedName = name.trim();
  const presetItems = presets.data ?? [];
  const canCreate = Boolean(presets.data) && !presets.isLoading && !presets.isError && presetItems.length < PRESET_LIMIT && canSave && !createPreset.isPending;

  const unavailableCount = (look: CompanionLook) => LOOK_SLOTS.reduce((count, { slot, type }) => {
    const id = look[slot];
    if (!id) return count;
    const item = items.find((candidate) => candidate.id === id);
    return !item || !item.isActive || item.itemType !== type || !isCompanionCompatible(item, companionKey) || !isApprovedCompanionLayer(item, companionKey) ? count + 1 : count;
  }, 0);
  const lockedCount = (look: CompanionLook) => LOOK_SLOTS.reduce((count, { slot }) => {
    const id = look[slot];
    const item = id ? items.find((candidate) => candidate.id === id) : undefined;
    return item && item.isActive && item.requiredLevel > level ? count + 1 : count;
  }, 0);

  const applyPreset = async (preset: CompanionPreset) => {
    setSelectedPreset(preset);
    equipPreset.reset();
    setPreviewNotice(null);
    const withdrawn = unavailableCount(preset.look);
    const locked = lockedCount(preset.look);
    if (withdrawn || locked) {
      onPreview(preset.look);
      setPreviewNotice(withdrawn && locked
        ? t('wardrobePreviewNoticeBoth', { unavailable: t('wardrobeUnavailableCount', { count: withdrawn }), locked: t('wardrobeLockedCount', { count: locked }) })
        : withdrawn
          ? t('wardrobePreviewNoticeUnavailable', { unavailable: t('wardrobeUnavailableCount', { count: withdrawn }) })
          : t('wardrobePreviewNoticeLocked', { locked: t('wardrobeLockedCount', { count: locked }) }));
      return;
    }
    try {
      const status = await equipPreset.mutateAsync(preset.id);
      onEquipped(status.look);
    } catch { /* Mutation state below offers a retry while keeping the current draft. */ }
  };

  const requestPreset = (preset: CompanionPreset) => {
    if (!isDirty) {
      void applyPreset(preset);
      return;
    }
    const withdrawn = unavailableCount(preset.look);
    const locked = lockedCount(preset.look);
    Alert.alert(
      t('wardrobeReplacePreviewTitle'),
      t('wardrobeReplacePreviewBody'),
      [
        { text: t('wardrobeKeepEditing'), style: 'cancel' },
        { text: withdrawn || locked ? t('wardrobePreviewOnly') : t('wardrobeEquipLook'), onPress: () => { void applyPreset(preset); } },
      ],
    );
  };

  const requestDelete = (preset: CompanionPreset) => Alert.alert(
    t('wardrobeDeleteTitle', { name: preset.name }),
    t('wardrobeDeleteBody'),
    [
      { text: t('wardrobeCancel'), style: 'cancel' },
      { text: t('wardrobeDelete'), style: 'destructive', onPress: () => {
        setFailedDeletePreset(preset);
        deletePreset.mutate(preset.id, { onSuccess: () => setFailedDeletePreset(null) });
      } },
    ],
  );

  const submitPreset = async () => {
    if (!trimmedName || trimmedName.length > 30 || presetItems.length >= PRESET_LIMIT || createPreset.isPending) return;
    try {
      await createPreset.mutateAsync({ avatarId, name: trimmedName, look: draft });
      setName('');
      setNameModalVisible(false);
    } catch { /* Modal keeps the name visible and presents retry. */ }
  };

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <Text style={styles.title}>{t('wardrobeSavedOutfits')}</Text>
          <Text style={styles.count}>{presets.data ? presetItems.length : '—'}/{PRESET_LIMIT}</Text>
        </View>
        {isDirty ? <AnimatedPressable accessibilityRole="button" accessibilityLabel={t('wardrobeFavoriteLookAccessibility')} accessibilityState={{ disabled: !canCreate }} disabled={!canCreate} onPress={() => { createPreset.reset(); setNameModalVisible(true); }} style={[styles.addButton, !canCreate && styles.disabled]}>
          <Plus size={17} color={theme.onAccent} /><Text style={styles.addText}>{t('wardrobeFavoriteLook')}</Text>
        </AnimatedPressable> : null}
      </View>
      {isDirty && presetItems.length >= PRESET_LIMIT ? <Text style={styles.limitText}>{t('wardrobePresetLimit')}</Text> : null}
      {!canSave ? <Text style={styles.limitText}>{t('wardrobeClearUnavailable')}</Text> : null}

      {presets.isLoading ? <View style={styles.loading}><ActivityIndicator color={theme.violetDeep} /><Text style={styles.helper}>{t('wardrobeLoadingOutfits')}</Text></View>
        : presets.isError ? <View style={styles.stateCard}><Text style={styles.helper}>{t('wardrobeLoadOutfitsFailed')}</Text><AnimatedPressable accessibilityRole="button" onPress={() => { void presets.refetch(); }} style={styles.retry}><Text style={styles.retryText}>{t('wardrobeRetry')}</Text></AnimatedPressable></View>
          : presetItems.length === 0 ? <View style={styles.emptyHint} accessibilityRole="text"><View style={styles.emptyHintIcon}><Plus size={14} color={theme.violetDeep} /></View><Text style={styles.emptyHintText}>{t('wardrobeSaveFavoriteHint')}</Text></View>
            : <ScrollView horizontal contentContainerStyle={styles.rail} showsHorizontalScrollIndicator={false}>
              {presetItems.map((preset) => {
                const unavailable = unavailableCount(preset.look);
                const locked = lockedCount(preset.look);
                const isSelected = selectedPreset?.id === preset.id;
                const isEquipped = LOOK_SLOTS.every(({ slot }) => preset.look[slot] === savedLook[slot]);
                return <View key={preset.id} style={[styles.presetCard, isSelected && styles.presetCardSelected]}>
                  <AnimatedPressable accessibilityRole="button" accessibilityLabel={`${preset.name}${unavailable || locked ? t('wardrobeUnavailablePresetAccessibility') : t('wardrobeEquipPresetAccessibility')}`} accessibilityHint={t('wardrobeUnsavedPresetHint')} accessibilityState={{ disabled: equipPreset.isPending }} disabled={equipPreset.isPending} onPress={() => requestPreset(preset)} style={styles.presetMain}>
                  <View style={styles.previewWrap}><CompanionCharacterArtwork look={preset.look} items={items} companionKey={companionKey} characterImageUrl={characterImageUrl} size={88} accessibilityLabel={t('wardrobePresetPreview', { name: preset.name })} />{unavailable || locked ? <View style={styles.lockBadge}><LockKeyhole size={13} color={theme.onAccent} /></View> : isEquipped ? <View style={styles.checkBadge}><Check size={13} color={theme.onAccent} /></View> : null}</View>
                    <Text numberOfLines={1} style={styles.presetName}>{preset.name}</Text>
                    <Text numberOfLines={1} style={[styles.presetStatus, Boolean(unavailable || locked) && styles.presetStatusWarning]}>{unavailable ? t('wardrobeUnavailableCount', { count: unavailable }) : locked ? t('wardrobeLockedCount', { count: locked }) : isEquipped ? t('wardrobeEquipped') : isSelected ? t('wardrobePreviewing') : t('wardrobeTapToEquip')}</Text>
                  </AnimatedPressable>
                  <AnimatedPressable accessibilityRole="button" accessibilityLabel={t('wardrobeDeleteOutfitAccessibility', { name: preset.name })} accessibilityState={{ disabled: deletePreset.isPending }} disabled={deletePreset.isPending} onPress={() => requestDelete(preset)} style={styles.deleteButton}><Trash2 size={15} color={theme.berryDeep} /></AnimatedPressable>
                </View>;
              })}
            </ScrollView>}

      {previewNotice ? <Text style={styles.previewNotice} accessibilityRole="text">{previewNotice}</Text> : null}
      {equipPreset.isError && selectedPreset ? <View style={styles.actionError}><Text style={styles.errorText}>{t('wardrobeEquipFailed')}</Text><AnimatedPressable onPress={() => { void applyPreset(selectedPreset); }} style={styles.retry}><Text style={styles.retryText}>{t('wardrobeRetryEquip')}</Text></AnimatedPressable></View> : null}
      {deletePreset.isError && failedDeletePreset ? <View style={styles.actionError}><Text style={styles.errorText}>{t('wardrobeDeleteFailed')}</Text><AnimatedPressable onPress={() => requestDelete(failedDeletePreset)} style={styles.retry}><Text style={styles.retryText}>{t('wardrobeRetryDelete')}</Text></AnimatedPressable></View> : null}

      <Modal visible={nameModalVisible} transparent animationType={reduceMotion ? 'none' : 'fade'} onRequestClose={() => setNameModalVisible(false)}>
        <View style={styles.modalScrim}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{t('wardrobeNameOutfitTitle')}</Text>
            <Text style={styles.modalHint}>{t('wardrobeNameOutfitHint')}</Text>
            <TextInput
              accessibilityLabel={t('wardrobeOutfitName')}
              accessibilityHint={t('wardrobeNameInputHint')}
              value={name}
              onChangeText={setName}
              maxLength={30}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={() => { void submitPreset(); }}
              placeholder={t('wardrobeOutfitNamePlaceholder')}
              style={styles.nameInput}
            />
            <Text style={styles.characterCount}>{trimmedName.length}/30</Text>
            {createPreset.isError ? <View><Text style={styles.errorText}>{t('wardrobeSaveOutfitFailed')}</Text><AnimatedPressable onPress={() => { void submitPreset(); }} disabled={!trimmedName} style={[styles.retry, !trimmedName && styles.disabled]}><Text style={styles.retryText}>{t('wardrobeRetrySaveOutfit')}</Text></AnimatedPressable></View> : null}
            <View style={styles.modalActions}>
              <AnimatedPressable accessibilityRole="button" onPress={() => { setNameModalVisible(false); setName(''); createPreset.reset(); }} style={styles.cancelButton}><Text style={styles.cancelText}>{t('wardrobeCancel')}</Text></AnimatedPressable>
              <AnimatedPressable accessibilityRole="button" accessibilityState={{ disabled: !trimmedName || createPreset.isPending }} disabled={!trimmedName || createPreset.isPending} onPress={() => { void submitPreset(); }} style={[styles.confirmButton, (!trimmedName || createPreset.isPending) && styles.disabled]}>{createPreset.isPending ? <ActivityIndicator color={theme.onAccent} /> : <Check size={17} color={theme.onAccent} />}<Text style={styles.confirmText}>{t('wardrobeSave')}</Text></AnimatedPressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const useStyles = createThemedStyles((theme) => StyleSheet.create({
  section: { paddingVertical: 2 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }, headerCopy: { flexDirection: 'row', alignItems: 'center', gap: 8 }, title: { color: theme.ink, fontFamily: typography.displayExtraBold, fontSize: 16 }, count: { color: theme.violetDeep, fontFamily: typography.bodyExtraBold, fontSize: 10, paddingHorizontal: 7, paddingVertical: 4, overflow: 'hidden', borderRadius: 10, backgroundColor: theme.violetTint },
  addButton: { minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingHorizontal: 11, borderRadius: 13, backgroundColor: theme.violetDeep }, addText: { color: theme.onAccent, fontFamily: typography.bodyExtraBold, fontSize: 10 }, disabled: { opacity: 0.45 }, limitText: { color: theme.inkMuted, fontFamily: typography.body, fontSize: 10, marginTop: 7 },
  loading: { minHeight: 56, alignItems: 'center', justifyContent: 'center', gap: 8 }, helper: { color: theme.inkSoft, fontFamily: typography.body, fontSize: 11, lineHeight: 16 }, emptyHint: { minHeight: 46, flexDirection: 'row', alignItems: 'center', gap: 9, marginTop: 6, paddingHorizontal: 10, borderRadius: 13, backgroundColor: theme.canvas }, emptyHintIcon: { width: 27, height: 27, alignItems: 'center', justifyContent: 'center', borderRadius: 10, backgroundColor: theme.violetTint }, emptyHintText: { flex: 1, color: theme.inkSoft, fontFamily: typography.bodyBold, fontSize: 10 }, stateCard: { minHeight: 56, justifyContent: 'center', alignItems: 'flex-start', gap: 5, marginTop: 8, padding: 10, borderRadius: 14, backgroundColor: theme.canvas }, retry: { minHeight: 40, alignSelf: 'flex-start', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12, borderRadius: 12, backgroundColor: theme.violetDeep }, retryText: { color: theme.onAccent, fontFamily: typography.bodyExtraBold, fontSize: 10 }, rail: { gap: 9, paddingTop: 8, paddingBottom: 2 }, presetCard: { width: 128, minHeight: 166, padding: 7, borderRadius: 16, borderWidth: 1, borderColor: theme.line, backgroundColor: theme.canvas, position: 'relative' }, presetCardSelected: { borderColor: theme.violetDeep, backgroundColor: theme.violetTint }, presetMain: { minHeight: 150, alignItems: 'center', justifyContent: 'flex-start', paddingTop: 2 }, previewWrap: { width: 96, height: 96, alignItems: 'center', justifyContent: 'center', borderRadius: 15, backgroundColor: theme.paper }, presetName: { maxWidth: '100%', color: theme.ink, fontFamily: typography.bodyExtraBold, fontSize: 11, marginTop: 5 }, presetStatus: { color: theme.grass, fontFamily: typography.bodyBold, fontSize: 9, marginTop: 3 }, presetStatusWarning: { color: theme.berryDeep }, lockBadge: { position: 'absolute', right: 3, top: 3, width: 24, height: 24, alignItems: 'center', justifyContent: 'center', borderRadius: 12, backgroundColor: theme.berryDeep }, checkBadge: { position: 'absolute', right: 3, top: 3, width: 24, height: 24, alignItems: 'center', justifyContent: 'center', borderRadius: 12, backgroundColor: theme.violetDeep }, deleteButton: { position: 'absolute', top: 5, right: 5, zIndex: 2, width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 13, backgroundColor: theme.berryTint }, previewNotice: { color: theme.berryDeep, fontFamily: typography.bodyBold, fontSize: 10, lineHeight: 15, marginTop: 8 }, actionError: { marginTop: 8, padding: 10, borderRadius: 13, backgroundColor: theme.berryTint, gap: 6 }, errorText: { color: theme.berryDeep, fontFamily: typography.bodyBold, fontSize: 10, lineHeight: 15 },
  modalScrim: { flex: 1, justifyContent: 'center', padding: 20, backgroundColor: 'rgba(20,16,40,0.56)' }, modalCard: { padding: 18, borderRadius: 22, backgroundColor: theme.paper }, modalTitle: { color: theme.ink, fontFamily: typography.displayExtraBold, fontSize: 18 }, modalHint: { color: theme.inkSoft, fontFamily: typography.body, fontSize: 11, lineHeight: 16, marginTop: 6 }, nameInput: { minHeight: 48, marginTop: 15, paddingHorizontal: 12, borderRadius: 13, borderWidth: 1, borderColor: theme.line, color: theme.ink, fontFamily: typography.body, fontSize: 14, backgroundColor: theme.canvas }, characterCount: { alignSelf: 'flex-end', color: theme.inkMuted, fontFamily: typography.body, fontSize: 10, marginTop: 5 }, modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 9, marginTop: 15 }, cancelButton: { minHeight: 44, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 15, borderRadius: 13, backgroundColor: theme.canvas }, cancelText: { color: theme.ink, fontFamily: typography.bodyBold, fontSize: 12 }, confirmButton: { minHeight: 44, minWidth: 90, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingHorizontal: 14, borderRadius: 13, backgroundColor: theme.violetDeep }, confirmText: { color: theme.onAccent, fontFamily: typography.bodyExtraBold, fontSize: 12 },
}));
