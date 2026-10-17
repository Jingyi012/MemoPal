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

const CATEGORIES: { type: AppearanceItemType; en: string; zh: string; slot: keyof CompanionLook }[] = [
  { type: 'headwear', en: 'Headwear', zh: '头饰', slot: 'headwearId' },
  { type: 'bodywear', en: 'Bodywear', zh: '服装', slot: 'bodywearId' },
  { type: 'backwear', en: 'Backwear', zh: '背饰', slot: 'backwearId' },
  { type: 'handItem', en: 'Handheld', zh: '手持', slot: 'handItemId' },
];
const OUTFITS_CATEGORY = { type: 'outfits' as const, en: 'Outfits', zh: '套装' };
type WardrobeCategory = typeof OUTFITS_CATEGORY | (typeof CATEGORIES)[number];

export function CompanionStudioRouteScreen() {
  const companion = useCompanion();
  const { isLoading: avatarsLoading } = useAvatars();
  const { language } = useTranslation('profile');
  if (companion.isLoading || avatarsLoading) return <LoadingView />;
  if (companion.isError) return (
    <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
      <Text style={{ textAlign: 'center', marginBottom: 16 }}>{language === 'zh' ? '暂时无法加载伙伴造型。' : 'Could not load your companion look.'}</Text>
      <AnimatedPressable accessibilityRole="button" onPress={() => { void companion.refetch(); }} style={{ padding: 14 }}>
        <Text>{language === 'zh' ? '重试' : 'Retry'}</Text>
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
  const { language } = useTranslation('profile');
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
  const companionTitle = selectedAvatar ? (chinese ? selectedAvatar.titleZh : selectedAvatar.titleEn) : (chinese ? '伙伴' : 'Companion');
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
      <CommonHeader title={chinese ? '伙伴衣橱' : 'Companion Wardrobe'} backAction={() => router.back()} showAiCredits={false} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <View style={styles.heroGlow} />
          <View style={styles.heroCopy}><View style={styles.studioBadge}><Sparkles size={13} color={theme.onAccent} /><Text style={styles.badgeText}>{chinese ? '伙伴造型间' : 'COMPANION STUDIO'}</Text></View><Text style={styles.heroTitle}>{chinese ? '给今天的伙伴换个造型' : 'A little outfit for today'}</Text><Text style={styles.heroSub}>{chinese ? `${companionTitle} · 等级 ${level}` : `${companionTitle} · Level ${level}`}</Text></View>
          <View style={styles.stage} accessibilityLabel={chinese ? `${companionTitle}造型预览` : `${companionTitle} outfit preview`}>
            <View style={styles.stageDisc} />
            <Animated.View style={figureStyle}>
              {isFullBodyCompanion
                ? <CompanionCharacterArtwork look={draft} items={items} avatarId={companion.data?.avatarId} size={stageSize} accessibilityLabel={chinese ? `${companionTitle}全身造型预览` : `${companionTitle} full-body outfit preview`} />
                : <MemoryAvatar avatar={selectedAvatar} size={206} level={level} showLevelBadge={false} />}
            </Animated.View>
            <View style={styles.stageSparkleOne}><Sparkles color={theme.sun} size={17} /></View><View style={styles.stageSparkleTwo}><Sparkles color={theme.onAccent} size={12} /></View>
          </View>
          <View style={styles.previewCaption}><View style={styles.liveDot} /><Text style={styles.captionText}>{chinese ? '实时试穿预览' : 'LIVE LOOK PREVIEW'}</Text></View>
          {hasUnavailableSavedLayer ? <View style={styles.previewNotice} accessibilityRole="text"><LockKeyhole size={13} color={theme.onAccent} /><Text style={styles.previewNoticeText}>{chinese ? '已保存造型含有尚未通过预览校验的物品，暂不叠加显示。' : 'A saved piece has no approved preview layer yet, so it is hidden from this stage.'}</Text></View> : null}
          <View style={styles.heroActions}>
            <AnimatedPressable accessibilityLabel={chinese ? '随机搭配已解锁物品' : 'Randomize with unlocked items'} onPress={randomize} style={styles.randomButton}><Sparkles size={16} color={theme.onAccent} /><Text style={styles.heroActionText}>{chinese ? '随机搭配' : 'Surprise me'}</Text></AnimatedPressable>
            <AnimatedPressable accessibilityLabel={chinese ? '恢复已保存造型' : 'Revert to saved look'} onPress={() => { if (savedLook) setDraft(savedLook); setFocusedItemId(null); }} disabled={!isDirty} style={[styles.revertButton, !isDirty && styles.disabled]}><RefreshCcw size={15} color={theme.onAccent} /><Text style={styles.heroActionText}>{chinese ? '恢复' : 'Revert'}</Text></AnimatedPressable>
          </View>
        </View>

        <ScrollView horizontal accessibilityRole="tablist" contentContainerStyle={styles.categoryRail} showsHorizontalScrollIndicator={false}>
          {visibleCategories.map((item) => (
            <AnimatedPressable key={item.type} accessibilityRole="tab" accessibilityState={{ selected: category.type === item.type }} onPress={() => { setCategory(item); setFocusedItemId(null); }} style={[styles.categoryTab, category.type === item.type && styles.categoryTabActive]}>
              <Text style={[styles.categoryTabText, category.type === item.type && styles.categoryTabTextActive]}>{chinese ? item.zh : item.en}</Text>
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
        /> : <View style={styles.noItems}><Text style={styles.noItemsTitle}>{chinese ? '伙伴造型暂不可用' : 'Outfits unavailable'}</Text></View>) : <>
        {visibleCategories.length < CATEGORIES.length + 1 ? <View style={styles.comingSoon}><Sparkles size={14} color={theme.violetDeep} /><Text style={styles.comingSoonText}>{chinese ? '更多造型正在准备中，先来搭配已上架的配饰吧。' : 'More looks are on the way. Mix and match the pieces in the catalog for now.'}</Text></View> : null}

        <View style={styles.catalogHead}><Text style={styles.sectionTitle}>{chinese ? category.zh : category.en}</Text><Text style={styles.catalogCount}>{compatibleItems.length + 1} {chinese ? '种选择' : 'options'}</Text></View>
        <ScrollView horizontal contentContainerStyle={styles.itemRail} showsHorizontalScrollIndicator={false}>
          <AnimatedPressable accessibilityRole="button" accessibilityLabel={chinese ? '清除此槽位' : 'Clear this slot'} accessibilityState={{ selected: currentItemId === null }} onPress={() => { if (draft) setDraft({ ...draft, [category.slot]: null }); setFocusedItemId(null); }} style={[styles.itemCard, currentItemId === null && styles.itemCardSelected]}>
            <View style={styles.clearPreview}><X size={25} color={theme.inkMuted} /></View><Text style={styles.itemName}>{chinese ? '不佩戴' : 'Nothing'}</Text><Text style={styles.itemMeta}>{currentItemId === null ? (chinese ? '已选择' : 'Selected') : (chinese ? '清空槽位' : 'Clear slot')}</Text>{currentItemId === null ? <View style={styles.checkBadge}><Check size={13} color={theme.onAccent} /></View> : null}
          </AnimatedPressable>
          {compatibleItems.map((item) => {
            const locked = item.requiredLevel > level || !isApprovedCompanionLayer(item, companion.data?.avatarId);
            const lockReason = item.requiredLevel > level
              ? (chinese ? `等级 ${item.requiredLevel} 解锁` : `Level ${item.requiredLevel}`)
              : !isApprovedCompanionLayer(item, companion.data?.avatarId) ? (chinese ? '预览素材待校验' : 'Preview pending') : null;
            const selected = item.id === currentItemId;
            return <AnimatedPressable key={item.id} accessibilityRole="button" accessibilityLabel={`${nameFor(item, language)}${locked ? `, ${lockReason}` : ''}`} accessibilityState={{ selected, disabled: locked }} onPress={() => toggleItem(item)} style={[styles.itemCard, selected && styles.itemCardSelected, locked && styles.itemCardLocked]}>
              <View style={styles.itemPreview}><LayerPreview item={item} avatarId={companion.data?.avatarId} size={83} /><View style={styles.itemGlow} /></View><Text numberOfLines={1} style={styles.itemName}>{nameFor(item, language)}</Text><Text style={[styles.itemMeta, !locked && styles.itemMetaReady]}>{locked ? lockReason : selected ? (chinese ? '已穿戴' : 'Wearing') : (chinese ? '已解锁' : 'Unlocked')}</Text>{locked ? <View style={styles.lockBadge}><LockKeyhole size={13} color={theme.inkSoft} /></View> : selected ? <View style={styles.checkBadge}><Check size={13} color={theme.onAccent} /></View> : null}
            </AnimatedPressable>;
          })}
          {!compatibleItems.length ? <View style={styles.noItems}><Text style={styles.noItemsTitle}>{chinese ? '新造型正在准备中' : 'More looks are on the way'}</Text><Text style={styles.noItemsText}>{chinese ? '这个分类暂时还没有物品。' : 'There are no items in this slot yet.'}</Text></View> : null}
        </ScrollView>

        <View style={styles.detailCard}>
          {focusedItem ? <><View style={styles.detailTitleRow}><View style={styles.detailIcon}><LayerPreview item={focusedItem} avatarId={companion.data?.avatarId} /></View><View style={styles.detailCopy}><Text style={styles.detailTitle}>{nameFor(focusedItem, language)}</Text><Text style={styles.detailSet}>{focusedItem.setKey ? `${chinese ? '套装' : 'Set'} · ${focusedItem.setKey}` : (chinese ? '伙伴专属配饰' : 'Made for your companion')}</Text></View><View style={[styles.stagePill, focusedItem.requiredLevel <= level && isApprovedCompanionLayer(focusedItem, companion.data?.avatarId) ? styles.stagePillReady : styles.stagePillLocked]}><Text style={styles.stagePillText}>{focusedItem.requiredLevel > level ? (chinese ? `等级 ${focusedItem.requiredLevel}` : `LV ${focusedItem.requiredLevel}`) : !isApprovedCompanionLayer(focusedItem, companion.data?.avatarId) ? (chinese ? '预览待校验' : 'PREVIEW PENDING') : (chinese ? '已解锁' : 'UNLOCKED')}</Text></View></View><Text style={styles.detailDescription}>{chinese ? focusedItem.descriptionZh : focusedItem.descriptionEn}</Text>{!isApprovedCompanionLayer(focusedItem, companion.data?.avatarId) ? <Text style={styles.unavailableText}>{chinese ? '这件物品暂时没有通过校验的全身图层，因此不能试穿或随机搭配。' : 'There is no approved full-body layer for this piece yet, so it cannot be equipped or randomized.'}</Text> : null}</> : <><Text style={styles.detailTitle}>{chinese ? '挑一件试试看' : 'Pick a piece to try on'}</Text><Text style={styles.detailDescription}>{isFullBodyCompanion ? (chinese ? '物品会直接叠在伙伴身上，试穿不影响已保存造型。' : 'Try pieces directly on your companion. Your saved look stays untouched until you save.') : (chinese ? '这个伙伴的专属穿戴素材正在准备中；已保存的造型和伙伴头像仍会保留。' : 'Wearable art for this companion is on the way. Your selected companion stays here while new pieces are prepared.')}</Text></>}
        </View>
        <CompanionSetStory look={draft} items={items} avatarId={companion.data?.avatarId} />
        </>}

        {saveLook.isError ? <View accessibilityRole="alert" style={styles.errorCard}><Text style={styles.errorText}>{chinese ? '保存没有成功，试穿造型仍为你保留。' : 'Couldn’t save this look. Your preview is still here.'}</Text><AnimatedPressable onPress={() => { void save(); }} style={styles.retryButton}><Text style={styles.retryText}>{chinese ? '重试保存' : 'Retry save'}</Text></AnimatedPressable></View> : null}
      </ScrollView>
      <ConfirmModal
        visible={discardModalVisible}
        icon={<RefreshCcw size={27} color={theme.berryDeep} />}
        title={chinese ? '放弃未保存的造型？' : 'Discard your changes?'}
        description={chinese ? '这次试穿还没有保存。' : 'Your outfit preview has not been saved.'}
        confirmText={chinese ? '放弃' : 'Discard'}
        cancelText={chinese ? '继续搭配' : 'Keep editing'}
        destructive
        onCancel={() => { pendingNavigationAction.current = null; setDiscardModalVisible(false); }}
        onConfirm={() => {
          const action = pendingNavigationAction.current;
          pendingNavigationAction.current = null;
          setDiscardModalVisible(false);
          if (action) navigation.dispatch(action);
        }}
      />
      {isDirty || saveLook.isPending ? <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 12) }]}><AnimatedPressable accessibilityRole="button" accessibilityState={{ disabled: hasUnavailableDraft || saveLook.isPending }} disabled={hasUnavailableDraft || saveLook.isPending} onPress={() => { void save(); }} style={[styles.saveButton, (hasUnavailableDraft || saveLook.isPending) && styles.disabled]}>{saveLook.isPending ? <ActivityIndicator color={theme.onAccent} /> : <Check size={19} color={theme.onAccent} />}<Text style={styles.saveText}>{saveLook.isPending ? (chinese ? '正在穿上…' : 'Applying…') : (chinese ? '穿上这套' : 'Wear this look')}</Text></AnimatedPressable></View> : null}
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
