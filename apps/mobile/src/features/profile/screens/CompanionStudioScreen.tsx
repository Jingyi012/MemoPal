import AnimatedPressable from '@/components/AnimatedPressable';
import { ConfirmModal } from '@/components/ConfirmModal';
import { MemoryAvatar } from '@/components/MemoryAvatar';
import LoadingView from '@/components/LoadingView';
import { CommonHeader } from '@/components/CommonHeader';
import { getApprovedCompanionLayerSource, isApprovedCompanionLayer, isCompanionCompatible, CompanionCharacterArtwork } from '../components/CompanionCharacterArtwork';
import { CompanionSetStory } from '../components/CompanionSetStory';
import { CompanionPresetsRail } from '../components/CompanionPresetsRail';
import { Check, LockKeyhole, RefreshCcw, Sparkles, X } from '@/core/icons';
import { useTranslation } from '@/core/i18n/useTranslation';
import { useAppearance } from '@/features/appearance/hooks/useAppearance';
import type { AppearanceDefinition, AppearanceItemType } from '@/features/appearance/types/appearance';
import { useCompanion, useSaveCompanionLook } from '@/features/profile/hooks/useCompanion';
import type { CompanionLook } from '@/features/profile/api/companion.api';
import { useCurrentUser } from '@/features/profile/hooks/useCurrentUser';
import { useAvatars } from '@/features/avatars/hooks/useAvatars';
import { resolveMediaUrl } from '@/utils/mediaUrl';
import { useLevelByXp } from '@/features/gamification/shared/hooks/useLevelConfigs';
import { createThemedStyles } from '@/theme/createThemedStyles';
import { typography } from '@/theme/typography';
import { useRouter } from 'expo-router';
import { useNavigation, usePreventRemove, type NavigationAction } from '@react-navigation/native';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { cancelAnimation, useAnimatedStyle, useReducedMotion, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';

const CATEGORIES: { type: AppearanceItemType; key: 'wardrobeHeadwear' | 'wardrobeBodywear' | 'wardrobeBackwear' | 'wardrobeHandItem'; slot: keyof CompanionLook }[] = [
  { type: 'headwear', key: 'wardrobeHeadwear', slot: 'headwearId' },
  { type: 'bodywear', key: 'wardrobeBodywear', slot: 'bodywearId' },
  { type: 'backwear', key: 'wardrobeBackwear', slot: 'backwearId' },
  { type: 'handItem', key: 'wardrobeHandItem', slot: 'handItemId' },
];
const OUTFITS_CATEGORY = { type: 'outfits' as const, key: 'wardrobeOutfits' as const };
type WardrobeCategory = typeof OUTFITS_CATEGORY | (typeof CATEGORIES)[number];

export function CompanionStudioRouteScreen() {
  const companion = useCompanion();
  const { isLoading: avatarsLoading } = useAvatars();
  const { t } = useTranslation('companion');
  if (companion.isLoading || avatarsLoading) return <LoadingView />;
  if (companion.isError) return (
    <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
      <Text style={{ textAlign: 'center', marginBottom: 16 }}>{t('wardrobeLoadingError')}</Text>
      <AnimatedPressable accessibilityRole="button" onPress={() => { void companion.refetch(); }} style={{ padding: 14 }}>
        <Text>{t('wardrobeRetry')}</Text>
      </AnimatedPressable>
    </SafeAreaView>
  );
  return <CompanionStudioScreen />;
}

function CompanionStudioScreen() {
  const { styles, theme } = useStyles();
  const router = useRouter();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { language, t } = useTranslation('companion');
  const chinese = language === 'zh';
  const { user } = useCurrentUser();
  const companion = useCompanion();
  const { items, isLoading: itemsLoading } = useAppearance();
  const { avatars } = useAvatars();
  const { width } = useWindowDimensions();
  const saveLook = useSaveCompanionLook();
  const levelInfo = useLevelByXp(user?.totalXp ?? 0, user?.level).levelInfo;
  const level = Math.max(1, levelInfo?.currentLevel ?? user?.level ?? 1);
  const selectedAvatar = avatars.find((item) => item.id === companion.data?.avatarId);
  const isFullBodyCompanion = selectedAvatar?.assetKey === 'memory-owl';
  const companionTitle = selectedAvatar ? (chinese ? selectedAvatar.titleZh : selectedAvatar.titleEn) : t('companionName');
  const stageSize = Math.min(232, Math.max(176, width - 176));
  const savedLook = companion.data?.look;
  const [draft, setDraft] = useState<CompanionLook | null>(null);
  const [category, setCategory] = useState<WardrobeCategory>(OUTFITS_CATEGORY);
  const [focusedItemId, setFocusedItemId] = useState<string | null>(null);
  const [discardModalVisible, setDiscardModalVisible] = useState(false);
  const pendingNavigationAction = useRef<NavigationAction | null>(null);
  const reduceMotion = useReducedMotion();
  const idleMotion = useSharedValue(0);
  const fittingMotion = useSharedValue(0);
  const figureStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: -3 * idleMotion.value },
      { scale: 1 + 0.035 * fittingMotion.value },
      { rotate: `${-2 * fittingMotion.value}deg` },
    ],
  }));

  useEffect(() => {
    if (reduceMotion) return undefined;
    idleMotion.value = withRepeat(withSequence(
      withTiming(1, { duration: 1450 }),
      withTiming(0, { duration: 1450 }),
    ), -1, false);
    return () => cancelAnimation(idleMotion);
  }, [idleMotion, reduceMotion]);

  const celebrateTryOn = () => {
    if (reduceMotion) return;
    fittingMotion.value = withSequence(
      withTiming(1, { duration: 150 }),
      withTiming(0, { duration: 300 }),
    );
  };

  useEffect(() => {
    if (savedLook) setDraft(savedLook);
  }, [savedLook]);

  const visibleCategories = useMemo(() => [OUTFITS_CATEGORY, ...CATEGORIES.filter((candidate) =>
    items.some((item) => item.isActive && item.itemType === candidate.type &&
      isCompanionCompatible(item, companion.data?.avatarId)) || Boolean(draft?.[candidate.slot])
  )], [items, companion.data?.avatarId, draft]);

  useEffect(() => {
    if (visibleCategories.length && !visibleCategories.some((candidate) => candidate.type === category.type)) {
      setCategory(visibleCategories[0]);
      setFocusedItemId(null);
    }
  }, [category.type, visibleCategories]);

  const compatibleItems = useMemo(() => items.filter((item) =>
    category.type !== 'outfits' && item.isActive && item.itemType === category.type &&
    isCompanionCompatible(item, companion.data?.avatarId)
  ), [items, category.type, companion.data?.avatarId]);
  const currentItemId = category.type === 'outfits' ? null : draft?.[category.slot] ?? null;
  const focusedItem = compatibleItems.find((item) => item.id === focusedItemId) ?? compatibleItems.find((item) => item.id === currentItemId);
  const isDirty = Boolean(draft && savedLook && CATEGORIES.some(({ slot }) => draft[slot] !== savedLook[slot]));
  const hasUnavailableLayer = (look: CompanionLook | null | undefined) => Boolean(look && CATEGORIES.some(({ type, slot }) => {
    const itemId = look[slot];
    if (!itemId) return false;
    const item = items.find((candidate) => candidate.id === itemId);
    return !item || !item.isActive || item.itemType !== type || !isApprovedCompanionLayer(item, companion.data?.avatarId) || item.requiredLevel > level;
  }));
  const hasUnavailableSavedLayer = hasUnavailableLayer(savedLook);
  const hasUnavailableDraft = hasUnavailableLayer(draft);

  const toggleItem = (item: AppearanceDefinition) => {
    if (category.type === 'outfits') return;
    if (item.requiredLevel > level || !isApprovedCompanionLayer(item, companion.data?.avatarId)) {
      setFocusedItemId(item.id);
      return;
    }
    if (!draft) return;
    setDraft({ ...draft, [category.slot]: currentItemId === item.id ? null : item.id });
    setFocusedItemId(item.id);
    celebrateTryOn();
  };

  const randomize = () => {
    if (!draft) return;
    const slotsWithOptions = CATEGORIES.map(({ type, slot }) => ({
      slot,
      options: [null, ...items.filter((item) => item.isActive && item.itemType === type && item.requiredLevel <= level &&
        isApprovedCompanionLayer(item, companion.data?.avatarId)).map((item) => item.id)],
    }));
    const sample = () => {
      const next = { ...draft };
      for (const { slot, options } of slotsWithOptions) {
        next[slot] = options[Math.floor(Math.random() * options.length)];
      }
      return next;
    };
    let next = sample();
    for (let attempt = 0; attempt < 5 && CATEGORIES.every(({ slot }) => next[slot] === draft[slot]); attempt += 1) {
      next = sample();
    }
    setDraft(next);
    setFocusedItemId(null);
    celebrateTryOn();
  };

  const save = async () => {
    if (!draft || !companion.data?.avatarId || !isDirty || hasUnavailableDraft || saveLook.isPending) return;
    try {
      await saveLook.mutateAsync({ avatarId: companion.data.avatarId, ...draft });
    } catch { /* The error is presented inline; preserve the unsaved preview. */ }
  };

  const confirmDiscard = useCallback(({ data }: { data: { action: NavigationAction } }) => {
    pendingNavigationAction.current = data.action;
    setDiscardModalVisible(true);
  }, []);
  usePreventRemove(Boolean(isDirty), confirmDiscard);

  if (companion.isLoading || itemsLoading || !draft) return <LoadingView />;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <CommonHeader title={t('companionClosetTitle')} backAction={() => router.back()} showAiCredits={false} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <View style={styles.heroGlow} />
          <View style={styles.heroCopy}><View style={styles.studioBadge}><Sparkles size={13} color={theme.onAccent} /><Text style={styles.badgeText}>{t('wardrobeStudioEyebrow')}</Text></View><Text style={styles.heroTitle}>{t('wardrobeStudioTitle')}</Text><Text style={styles.heroSub}>{t('companionLevel', { name: companionTitle, level })}</Text></View>
          <View style={styles.stage} accessibilityLabel={t('wardrobePreviewAccessibility', { name: companionTitle })}>
            <View style={styles.stageDisc} />
            <Animated.View style={figureStyle}>
              {isFullBodyCompanion
                ? <CompanionCharacterArtwork look={draft} items={items} avatarId={companion.data?.avatarId} size={stageSize} accessibilityLabel={t('wardrobeFullBodyPreviewAccessibility', { name: companionTitle })} />
                : <MemoryAvatar avatar={selectedAvatar} size={206} level={level} showLevelBadge={false} />}
            </Animated.View>
            <View style={styles.stageSparkleOne}><Sparkles color={theme.sun} size={17} /></View><View style={styles.stageSparkleTwo}><Sparkles color={theme.onAccent} size={12} /></View>
          </View>
          <View style={styles.previewCaption}><View style={styles.liveDot} /><Text style={styles.captionText}>{t('wardrobeLivePreview')}</Text></View>
          {hasUnavailableSavedLayer ? <View style={styles.previewNotice} accessibilityRole="text"><LockKeyhole size={13} color={theme.onAccent} /><Text style={styles.previewNoticeText}>{t('wardrobeUnavailableSavedLook')}</Text></View> : null}
          <View style={styles.heroActions}>
            <AnimatedPressable accessibilityLabel={t('wardrobeRandomize')} onPress={randomize} style={styles.randomButton}><Sparkles size={16} color={theme.onAccent} /><Text style={styles.heroActionText}>{t('wardrobeRandomize')}</Text></AnimatedPressable>
            <AnimatedPressable accessibilityLabel={t('wardrobeRevert')} onPress={() => { if (savedLook) setDraft(savedLook); setFocusedItemId(null); }} disabled={!isDirty} style={[styles.revertButton, !isDirty && styles.disabled]}><RefreshCcw size={15} color={theme.onAccent} /><Text style={styles.heroActionText}>{t('wardrobeRevert')}</Text></AnimatedPressable>
          </View>
        </View>

        <ScrollView horizontal accessibilityRole="tablist" contentContainerStyle={styles.categoryRail} showsHorizontalScrollIndicator={false}>
          {visibleCategories.map((item) => (
            <AnimatedPressable key={item.type} accessibilityRole="tab" accessibilityState={{ selected: category.type === item.type }} onPress={() => { setCategory(item); setFocusedItemId(null); }} style={[styles.categoryTab, category.type === item.type && styles.categoryTabActive]}>
              <Text style={[styles.categoryTabText, category.type === item.type && styles.categoryTabTextActive]}>{t(item.key)}</Text>
            </AnimatedPressable>
          ))}
        </ScrollView>

        {category.type === 'outfits' ? (isFullBodyCompanion && companion.data?.avatarId ? <CompanionPresetsRail
          avatarId={companion.data.avatarId}
          draft={draft}
          savedLook={savedLook ?? draft}
          isDirty={isDirty}
          items={items}
          level={level}
          canSave={!hasUnavailableDraft}
          onPreview={setDraft}
          onEquipped={setDraft}
        /> : <View style={styles.noItems}><Text style={styles.noItemsTitle}>{t('wardrobeUnavailable')}</Text></View>) : <>
        {visibleCategories.length < CATEGORIES.length + 1 ? <View style={styles.comingSoon}><Sparkles size={14} color={theme.violetDeep} /><Text style={styles.comingSoonText}>{t('wardrobeMoreComing')}</Text></View> : null}

        <View style={styles.catalogHead}><Text style={styles.sectionTitle}>{t(category.key)}</Text><Text style={styles.catalogCount}>{compatibleItems.length + 1} {t('wardrobeOptions')}</Text></View>
        <ScrollView horizontal contentContainerStyle={styles.itemRail} showsHorizontalScrollIndicator={false}>
          <AnimatedPressable accessibilityRole="button" accessibilityLabel={t('wardrobeClearSlot')} accessibilityState={{ selected: currentItemId === null }} onPress={() => { if (draft) setDraft({ ...draft, [category.slot]: null }); setFocusedItemId(null); }} style={[styles.itemCard, currentItemId === null && styles.itemCardSelected]}>
            <View style={styles.clearPreview}><X size={25} color={theme.inkMuted} /></View><Text style={styles.itemName}>{t('wardrobeNothing')}</Text><Text style={styles.itemMeta}>{currentItemId === null ? t('wardrobeSelected') : t('wardrobeClearSlotHint')}</Text>{currentItemId === null ? <View style={styles.checkBadge}><Check size={13} color={theme.onAccent} /></View> : null}
          </AnimatedPressable>
          {compatibleItems.map((item) => {
            const locked = item.requiredLevel > level || !isApprovedCompanionLayer(item, companion.data?.avatarId);
            const lockReason = item.requiredLevel > level
              ? t('wardrobeUnlockLevel', { level: item.requiredLevel })
              : !isApprovedCompanionLayer(item, companion.data?.avatarId) ? t('wardrobePreviewPending') : null;
            const selected = item.id === currentItemId;
            return <AnimatedPressable key={item.id} accessibilityRole="button" accessibilityLabel={`${nameFor(item, language)}${locked ? `, ${lockReason}` : ''}`} accessibilityState={{ selected, disabled: locked }} onPress={() => toggleItem(item)} style={[styles.itemCard, selected && styles.itemCardSelected, locked && styles.itemCardLocked]}>
              <View style={styles.itemPreview}><LayerPreview item={item} avatarId={companion.data?.avatarId} size={83} /><View style={styles.itemGlow} /></View><Text numberOfLines={1} style={styles.itemName}>{nameFor(item, language)}</Text><Text style={[styles.itemMeta, !locked && styles.itemMetaReady]}>{locked ? lockReason : selected ? t('wardrobeWearing') : t('wardrobeUnlocked')}</Text>{locked ? <View style={styles.lockBadge}><LockKeyhole size={13} color={theme.inkSoft} /></View> : selected ? <View style={styles.checkBadge}><Check size={13} color={theme.onAccent} /></View> : null}
            </AnimatedPressable>;
          })}
          {!compatibleItems.length ? <View style={styles.noItems}><Text style={styles.noItemsTitle}>{t('wardrobeMoreItemsComing')}</Text><Text style={styles.noItemsText}>{t('wardrobeNoItemsInSlot')}</Text></View> : null}
        </ScrollView>

        <View style={styles.detailCard}>
          {focusedItem ? <><View style={styles.detailTitleRow}><View style={styles.detailIcon}><LayerPreview item={focusedItem} avatarId={companion.data?.avatarId} /></View><View style={styles.detailCopy}><Text style={styles.detailTitle}>{nameFor(focusedItem, language)}</Text><Text style={styles.detailSet}>{focusedItem.setKey ? t('wardrobePartOfSet') : t('wardrobeCompanionAccessory')}</Text></View><View style={[styles.stagePill, focusedItem.requiredLevel <= level && isApprovedCompanionLayer(focusedItem, companion.data?.avatarId) ? styles.stagePillReady : styles.stagePillLocked]}><Text style={styles.stagePillText}>{focusedItem.requiredLevel > level ? t('wardrobeLevelShort', { level: focusedItem.requiredLevel }) : !isApprovedCompanionLayer(focusedItem, companion.data?.avatarId) ? t('wardrobePreviewPending') : t('wardrobeUnlocked')}</Text></View></View><Text style={styles.detailDescription}>{language === 'zh' ? focusedItem.descriptionZh : focusedItem.descriptionEn}</Text>{!isApprovedCompanionLayer(focusedItem, companion.data?.avatarId) ? <Text style={styles.unavailableText}>{t('wardrobeUnavailableLayer')}</Text> : null}</> : <><Text style={styles.detailTitle}>{t('wardrobePickPiece')}</Text><Text style={styles.detailDescription}>{isFullBodyCompanion ? t('wardrobeTryOnDescription') : t('wardrobeWearablesComing')}</Text></>}
        </View>
        <CompanionSetStory look={draft} items={items} avatarId={companion.data?.avatarId} />
        </>}

        {saveLook.isError ? <View accessibilityRole="alert" style={styles.errorCard}><Text style={styles.errorText}>{t('wardrobeSaveFailed')}</Text><AnimatedPressable onPress={() => { void save(); }} style={styles.retryButton}><Text style={styles.retryText}>{t('wardrobeRetrySave')}</Text></AnimatedPressable></View> : null}
      </ScrollView>
      <ConfirmModal
        visible={discardModalVisible}
        icon={<RefreshCcw size={27} color={theme.berryDeep} />}
        title={t('wardrobeDiscardTitle')}
        description={t('wardrobeDiscardBody')}
        confirmText={t('wardrobeDiscard')}
        cancelText={t('wardrobeKeepEditing')}
        destructive
        onCancel={() => { pendingNavigationAction.current = null; setDiscardModalVisible(false); }}
        onConfirm={() => {
          const action = pendingNavigationAction.current;
          pendingNavigationAction.current = null;
          setDiscardModalVisible(false);
          if (action) navigation.dispatch(action);
        }}
      />
      {isDirty || saveLook.isPending ? <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 12) }]}><AnimatedPressable accessibilityRole="button" accessibilityState={{ disabled: hasUnavailableDraft || saveLook.isPending }} disabled={hasUnavailableDraft || saveLook.isPending} onPress={() => { void save(); }} style={[styles.saveButton, (hasUnavailableDraft || saveLook.isPending) && styles.disabled]}>{saveLook.isPending ? <ActivityIndicator color={theme.onAccent} /> : <Check size={19} color={theme.onAccent} />}<Text style={styles.saveText}>{saveLook.isPending ? t('wardrobeApplying') : t('wardrobeWearLook')}</Text></AnimatedPressable></View> : null}
    </SafeAreaView>
  );
}

function LayerPreview({ item, avatarId, size = 54 }: { item: AppearanceDefinition; avatarId?: string | null; size?: number }) {
  const asset = getApprovedCompanionLayerSource(item, avatarId);
  if (typeof asset === 'string') return <Image source={{ uri: resolveMediaUrl(asset) }} style={[stylesForUnavailable.layer, stylesForUnavailable.transparent, { width: size, height: size }]} resizeMode="contain" accessible={false} />;
  return asset ? <Image source={asset} style={[stylesForUnavailable.layer, stylesForUnavailable.transparent, { width: size, height: size }]} resizeMode="contain" accessible={false} /> : <View style={stylesForUnavailable.previewPlaceholder}><LockKeyhole size={22} color="#77758A" /></View>;
}

const stylesForUnavailable = StyleSheet.create({ layer: { position: 'absolute', top: 0, left: 0 }, previewPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center' }, transparent: { backgroundColor: 'transparent' } });

function nameFor(item: AppearanceDefinition, language: string) { return language === 'zh' ? item.titleZh : item.titleEn; }

const useStyles = createThemedStyles((theme) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.canvas }, content: { paddingHorizontal: 16, paddingBottom: 24 },
  comingSoon: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: -7, marginBottom: 15, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 13, backgroundColor: theme.violetTint }, comingSoonText: { flex: 1, color: theme.violetDeep, fontFamily: typography.bodyBold, fontSize: 10, lineHeight: 15 },
  hero: { borderRadius: 27, overflow: 'hidden', backgroundColor: theme.violetDeep, paddingHorizontal: 16, paddingTop: 15, paddingBottom: 13, alignItems: 'center' }, heroGlow: { position: 'absolute', width: 280, height: 280, borderRadius: 150, backgroundColor: theme.sky, opacity: 0.32, top: 72 }, heroCopy: { alignSelf: 'stretch', zIndex: 3 }, studioBadge: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 6, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.17)', paddingHorizontal: 10, paddingVertical: 6 }, badgeText: { color: theme.onAccent, fontFamily: typography.bodyExtraBold, letterSpacing: 0.7, fontSize: 9 }, heroTitle: { color: theme.onAccent, fontFamily: typography.displayExtraBold, fontSize: 18, marginTop: 8 }, heroSub: { color: theme.onAccent, opacity: 0.78, fontFamily: typography.bodyBold, fontSize: 11, marginTop: 3 },
  stage: { width: '100%', height: 226, alignItems: 'center', justifyContent: 'center', marginTop: 0 }, stageDisc: { position: 'absolute', width: 192, height: 192, borderRadius: 100, backgroundColor: 'rgba(255,255,255,0.12)', bottom: 7 }, stageSparkleOne: { position: 'absolute', top: 28, right: 28 }, stageSparkleTwo: { position: 'absolute', left: 24, top: 90 }, previewCaption: { flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 12, paddingVertical: 7, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 20 }, previewNotice: { flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 6, paddingHorizontal: 9, paddingVertical: 6, borderRadius: 11, backgroundColor: 'rgba(255,255,255,0.12)' }, previewNoticeText: { flex: 1, color: theme.onAccent, fontFamily: typography.body, fontSize: 9 }, liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: theme.mintTint }, captionText: { color: theme.onAccent, fontFamily: typography.bodyExtraBold, fontSize: 9, letterSpacing: 0.7 }, heroActions: { flexDirection: 'row', gap: 9, marginTop: 9 }, randomButton: { minHeight: 43, flexDirection: 'row', alignItems: 'center', gap: 7, borderRadius: 14, backgroundColor: theme.berryDeep, paddingHorizontal: 15 }, revertButton: { minHeight: 43, flexDirection: 'row', alignItems: 'center', gap: 7, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.19)', paddingHorizontal: 15 }, heroActionText: { color: theme.onAccent, fontFamily: typography.bodyExtraBold, fontSize: 11 },
  categoryRail: { gap: 8, paddingVertical: 16 }, categoryTab: { minHeight: 44, minWidth: 88, justifyContent: 'center', alignItems: 'center', borderRadius: 14, borderWidth: 1, borderColor: theme.line, backgroundColor: theme.paper, paddingHorizontal: 14 }, categoryTabActive: { backgroundColor: theme.violetDeep, borderColor: theme.violetDeep }, categoryTabText: { color: theme.inkSoft, fontFamily: typography.bodyExtraBold, fontSize: 11 }, categoryTabTextActive: { color: theme.onAccent }, catalogHead: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 10 }, sectionTitle: { color: theme.ink, fontFamily: typography.displayExtraBold, fontSize: 17 }, catalogCount: { color: theme.inkMuted, fontFamily: typography.bodyBold, fontSize: 10 }, itemRail: { gap: 10, paddingBottom: 2 }, itemCard: { width: 112, minHeight: 155, alignItems: 'center', justifyContent: 'center', borderRadius: 19, borderWidth: 1.5, borderColor: theme.line, backgroundColor: theme.paper, padding: 9, position: 'relative' }, itemCardSelected: { borderColor: theme.violetDeep, backgroundColor: theme.violetTint }, itemCardLocked: { opacity: 0.68 }, itemPreview: { width: 83, height: 83, borderRadius: 20, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', backgroundColor: theme.skyTint }, itemGlow: { position: 'absolute', width: 38, height: 38, borderRadius: 19, top: -12, right: -7, backgroundColor: theme.sun, opacity: 0.3 }, clearPreview: { width: 83, height: 83, alignItems: 'center', justifyContent: 'center', borderRadius: 20, borderWidth: 1, borderStyle: 'dashed', borderColor: theme.line, backgroundColor: theme.canvas }, itemName: { maxWidth: '100%', color: theme.ink, fontFamily: typography.bodyExtraBold, fontSize: 11, marginTop: 7 }, itemMeta: { color: theme.inkMuted, fontFamily: typography.bodyBold, fontSize: 9, marginTop: 3 }, itemMetaReady: { color: theme.grass }, checkBadge: { position: 'absolute', top: 6, right: 6, width: 23, height: 23, alignItems: 'center', justifyContent: 'center', borderRadius: 13, backgroundColor: theme.violetDeep }, lockBadge: { position: 'absolute', top: 6, right: 6, width: 23, height: 23, alignItems: 'center', justifyContent: 'center', borderRadius: 13, backgroundColor: theme.line }, noItems: { minHeight: 135, width: 220, justifyContent: 'center', padding: 15, borderRadius: 18, backgroundColor: theme.paper }, noItemsTitle: { color: theme.ink, fontFamily: typography.bodyExtraBold, fontSize: 12 }, noItemsText: { color: theme.inkSoft, fontFamily: typography.body, fontSize: 11, marginTop: 6 },
  detailCard: { marginTop: 10, borderRadius: 17, borderWidth: 1, borderColor: theme.line, backgroundColor: theme.paper, padding: 11 }, detailTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 9 }, detailIcon: { width: 44, height: 44, borderRadius: 13, backgroundColor: theme.skyTint, overflow: 'hidden' }, detailCopy: { flex: 1 }, detailTitle: { color: theme.ink, fontFamily: typography.displayExtraBold, fontSize: 13 }, detailSet: { color: theme.inkMuted, fontFamily: typography.bodyBold, fontSize: 9, marginTop: 3 }, stagePill: { borderRadius: 12, paddingHorizontal: 8, paddingVertical: 6 }, stagePillReady: { backgroundColor: theme.mintTint }, stagePillLocked: { backgroundColor: theme.sunTint }, stagePillText: { color: theme.ink, fontFamily: typography.bodyExtraBold, fontSize: 8 }, detailDescription: { color: theme.inkSoft, fontFamily: typography.body, fontSize: 11, lineHeight: 16, marginTop: 8 }, unavailableText: { color: theme.berryDeep, fontFamily: typography.bodyBold, fontSize: 10, lineHeight: 15, marginTop: 6 },
  errorCard: { marginTop: 11, padding: 12, borderRadius: 15, backgroundColor: theme.berryTint }, errorText: { color: theme.berryDeep, fontFamily: typography.bodyBold, fontSize: 11 }, retryButton: { minHeight: 40, alignSelf: 'flex-start', justifyContent: 'center', marginTop: 7, paddingHorizontal: 14, borderRadius: 12, backgroundColor: theme.berryDeep }, retryText: { color: theme.onAccent, fontFamily: typography.bodyExtraBold, fontSize: 11 }, footer: { borderTopWidth: 1, borderColor: theme.line, backgroundColor: theme.canvas, paddingHorizontal: 16, paddingTop: 9 }, saveButton: { minHeight: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 16, backgroundColor: theme.violetDeep }, saveText: { color: theme.onAccent, fontFamily: typography.displayExtraBold, fontSize: 14 }, disabled: { opacity: 0.45 },
}));
