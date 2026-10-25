import AnimatedPressable from '@/components/AnimatedPressable';
import { AppearanceItemPreview, MemoryAvatar } from '@/components/MemoryAvatar';
import LoadingView from '@/components/LoadingView';
import { CommonHeader } from '@/components/CommonHeader';
import { Camera, Check, Crown, Image as ImageIcon, Layers, LockKeyhole, Sparkles, Star, X } from '@/core/icons';
import type { LucideIcon } from '@/core/icons';
import { useTranslation } from '@/core/i18n/useTranslation';
import { getEquippedAvatar, useAvatars } from '@/features/avatars/hooks/useAvatars';
import type { AvatarDefinition } from '@/features/avatars/types/avatar';
import { getEquippedAppearance, useAppearance } from '@/features/appearance/hooks/useAppearance';
import { useSaveAvatarAppearance } from '@/features/appearance/hooks/useSaveAvatarAppearance';
import type { AppearanceDefinition, AppearanceItemType, EquippedAppearance } from '@/features/appearance/types/appearance';
import { authApi } from '@/features/auth/api/auth';
import { useCurrentUser } from '@/features/profile/hooks/useCurrentUser';
import { useLevelByXp } from '@/features/gamification/shared/hooks/useLevelConfigs';
import { createThemedStyles } from '@/theme/createThemedStyles';
import { typography } from '@/theme/typography';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Easing, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

type WardrobeTab = 'companion' | AppearanceItemType | 'photo';

interface AppearanceDraft {
  source: 'companion' | 'photo';
  avatarId: string | null;
  photoUri: string | null;
  frameId: string | null;
  decorationId: string | null;
  outfitId: string | null;
}

export default function CompanionClosetScreen() {
  const { styles, theme } = useStyles();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { language, t } = useTranslation('profile');
  const { user, isLoading: userLoading } = useCurrentUser();
  const { avatars, isLoading: avatarsLoading } = useAvatars();
  const { items: appearanceItems, isLoading: appearanceLoading } = useAppearance();
  const saveAppearanceMutation = useSaveAvatarAppearance();
  const totalXp = Math.max(0, user?.totalXp ?? 0);
  const { levelInfo } = useLevelByXp(totalXp, user?.level);
  const level = Math.max(1, levelInfo?.currentLevel ?? user?.level ?? 1);
  const equippedAvatar = getEquippedAvatar(avatars, user?.selectedAvatarId, level);
  const equippedAppearance = getEquippedAppearance(
    appearanceItems,
    user?.selectedAvatarFrameId,
    user?.selectedAvatarDecorationId,
    user?.selectedAvatarOutfitId,
    level,
  );
  const currentSource = (user?.avatarSource === 'photo' || (!user?.avatarSource && Boolean(user?.avatarUrl))) && user?.avatarUrl
    ? 'photo'
    : 'companion';
  const initialDraft = useMemo<AppearanceDraft>(
    () => ({
      source: currentSource,
      avatarId: avatars.some((avatar) => avatar.id === user?.selectedAvatarId) ? user?.selectedAvatarId ?? null : null,
      photoUri: null,
      frameId: equippedAppearance.frame?.id ?? null,
      decorationId: equippedAppearance.decoration?.id ?? null,
      outfitId: equippedAppearance.outfit?.id ?? null,
    }),
    [avatars, currentSource, user?.selectedAvatarId, equippedAppearance.decoration?.id, equippedAppearance.frame?.id, equippedAppearance.outfit?.id],
  );
  const [tab, setTab] = useState<WardrobeTab>('companion');
  const [draft, setDraft] = useState<AppearanceDraft>(initialDraft);
  const [saving, setSaving] = useState(false);
  const floatValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    setDraft(initialDraft);
  }, [initialDraft]);

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(floatValue, { toValue: 1, duration: 1700, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(floatValue, { toValue: 0, duration: 1700, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [floatValue]);

  const previewAvatar = avatars.find((avatar) => avatar.id === draft.avatarId) ?? equippedAvatar;
  const previewPhoto = draft.source === 'photo' ? (draft.photoUri ?? user?.avatarUrl ?? null) : null;
  const previewAppearance = useMemo<EquippedAppearance>(() => ({
    frame: appearanceItems.find((item) => item.id === draft.frameId),
    decoration: appearanceItems.find((item) => item.id === draft.decorationId),
    outfit: appearanceItems.find((item) => item.id === draft.outfitId),
  }), [appearanceItems, draft.decorationId, draft.frameId, draft.outfitId]);
  const isDirty = !sameDraft(draft, initialDraft);
  const appearanceTab = tab === 'frame' || tab === 'decoration' || tab === 'outfit' ? tab : null;
  const visibleItems = appearanceTab ? appearanceItems.filter((item) => item.itemType === appearanceTab && item.isActive) : [];
  const tabs: readonly [WardrobeTab, string, LucideIcon][] = [
    ['companion', t('companionTab'), Sparkles],
    ['frame', t('frameTab'), Layers],
    ['decoration', t('decorationTab'), Sparkles],
    ['outfit', t('outfitTab'), Crown],
    ['photo', t('photoTab'), ImageIcon],
  ];

  const updateDraft = (partial: Partial<AppearanceDraft>) => setDraft((current) => ({ ...current, ...partial }));

  const choosePhoto = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Toast.show({ type: 'error', text1: t('permissionNeeded'), text2: t('allowPhoto') });
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.85,
      allowsEditing: true,
      aspect: [1, 1],
    });
    if (!result.canceled && result.assets?.[0]?.uri) {
      updateDraft({ source: 'photo', photoUri: result.assets[0].uri });
    }
  };

  const save = async () => {
    if (saving || !isDirty) return;
    setSaving(true);
    try {
      let avatarUrl = user?.avatarUrl ?? null;
      if (draft.source === 'photo' && draft.photoUri && isLocalMediaUri(draft.photoUri)) {
        avatarUrl = await authApi.uploadAvatar(draft.photoUri, draft.photoUri.split('/').pop() || 'avatar.jpg');
      }
      await saveAppearanceMutation.mutateAsync({
        source: draft.source,
        avatarId: draft.avatarId,
        avatarUrl: draft.source === 'photo' ? avatarUrl : null,
        frameId: draft.frameId,
        decorationId: draft.decorationId,
        outfitId: draft.outfitId,
      });
      Toast.show({ type: 'success', text1: t('appearanceUpdated') });
      router.back();
    } catch (error) {
      Toast.show({ type: 'error', text1: t('appearanceUpdateFailed'), text2: error instanceof Error ? error.message : undefined });
    } finally {
      setSaving(false);
    }
  };

  if (userLoading || avatarsLoading || appearanceLoading) return <LoadingView />;

  return (
    <View style={styles.page}>
      <CommonHeader
        title={t('customizeAppearance')}
        backAction={() => router.back()}
        showAiCredits={false}
      />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.studioHero}>
          <LinearGradient colors={[theme.violetDeep, theme.sky]} start={{ x: 0.08, y: 0.05 }} end={{ x: 0.92, y: 1 }} style={StyleSheet.absoluteFillObject} />
          <View style={styles.heroOrbLarge} />
          <View style={styles.heroOrbSmall} />
          <View style={styles.heroOrbitOuter} />
          <View style={styles.heroOrbitInner} />
          <Animated.View style={[styles.heroStar, styles.heroStarOne, { transform: [{ translateY: floatValue.interpolate({ inputRange: [0, 1], outputRange: [0, -9] }) }, { rotate: floatValue.interpolate({ inputRange: [0, 1], outputRange: ['-8deg', '8deg'] }) }] }]}><Sparkles color={theme.onAccent} size={18} /></Animated.View>
          <Animated.View style={[styles.heroStar, styles.heroStarTwo, { transform: [{ translateY: floatValue.interpolate({ inputRange: [0, 1], outputRange: [-4, 6] }) }, { rotate: floatValue.interpolate({ inputRange: [0, 1], outputRange: ['10deg', '-8deg'] }) }] }]}><Star color={theme.sun} size={14} fill={theme.sun} /></Animated.View>
          <View style={styles.liveBadge}><View style={styles.liveDot} /><Text style={styles.liveBadgeText}>{t('appearancePreview')}</Text></View>
          <Animated.View style={[styles.heroAvatar, { transform: [{ translateY: floatValue.interpolate({ inputRange: [0, 1], outputRange: [0, -6] }) }] }]}><MemoryAvatar avatar={previewAvatar} appearance={previewAppearance} imageUrl={previewPhoto} level={level} size={176} /></Animated.View>
          <Text style={styles.heroName}>{draft.source === 'photo' ? t('photoTab') : previewAvatar ? getName(previewAvatar, language) : t('companionTab')}</Text>
        </View>

        <ScrollView horizontal contentContainerStyle={styles.tabs} showsHorizontalScrollIndicator={false}>
          {tabs.map(([value, label, Icon]) => (
            <AnimatedPressable
              accessibilityRole="tab"
              accessibilityState={{ selected: tab === value }}
              key={value}
              onPress={() => setTab(value)}
              style={[styles.tab, tab === value && styles.tabActive]}>
              <Icon color={tab === value ? theme.onAccent : theme.inkSoft} size={15} />
              <Text style={[styles.tabText, tab === value && styles.tabTextActive]}>{label}</Text>
            </AnimatedPressable>
          ))}
        </ScrollView>

        <View style={styles.catalogHeader}>
          <View>
            <Text style={styles.catalogTitle}>{tab === 'photo' ? t('photoTab') : tab === 'companion' ? t('companionTab') : tab === 'frame' ? t('frameTab') : tab === 'decoration' ? t('decorationTab') : t('outfitTab')}</Text>
          </View>
          {appearanceTab ? <Text style={styles.catalogCount}>{visibleItems.length} {t('appearanceItems')}</Text> : null}
        </View>

        {tab === 'photo' ? (
          <View style={styles.photoPanel}>
            <View style={styles.photoPreview}>
              {previewPhoto ? <MemoryAvatar avatar={previewAvatar} appearance={previewAppearance} imageUrl={previewPhoto} level={level} size={132} /> : <View style={styles.photoPlaceholder}><Camera color={theme.violetDeep} size={30} /></View>}
            </View>
            <View style={styles.photoCopy}>
              <Text style={styles.photoTitle}>{t('photoTab')}</Text>
              <AnimatedPressable onPress={() => { void choosePhoto(); }} style={styles.primaryAction}>
                <Camera color={theme.onAccent} size={17} />
                <Text style={styles.primaryActionText}>{previewPhoto ? t('usePhoto') : t('uploadPhoto')}</Text>
              </AnimatedPressable>
            </View>
          </View>
        ) : tab === 'companion' ? (
          <View style={styles.grid}>
            {avatars.map((avatar) => {
              const unlocked = avatar.requiredLevel <= level;
              const selected = draft.source === 'companion' && avatar.id === draft.avatarId;
              return <WardrobeCard key={avatar.id} avatar={avatar} appearance={{}} language={language} unlocked={unlocked} selected={selected} level={level} labels={{ locked: t('avatarLocked'), selected: t('avatarSelected') }} onPress={() => updateDraft({ source: 'companion', avatarId: avatar.id })} />;
            })}
          </View>
        ) : (
          <View style={styles.grid}>
            <NoneCard selected={selectedAppearanceId(draft, appearanceTab ?? 'frame') === null} label={t('appearanceNone')} equippedLabel={t('avatarSelected')} onPress={() => updateDraft({ [`${appearanceTab ?? 'frame'}Id`]: null } as Partial<AppearanceDraft>)} />
            {visibleItems.map((item) => {
              const unlocked = item.requiredLevel <= level;
              const selected = selectedAppearanceId(draft, item.itemType) === item.id;
              const itemAppearance = { ...previewAppearance, [item.itemType]: item } as EquippedAppearance;
              return <WardrobeCard key={item.id} item={item} avatar={previewAvatar} appearance={itemAppearance} language={language} unlocked={unlocked} selected={selected} level={level} labels={{ locked: t('avatarLocked'), selected: t('avatarSelected') }} onPress={() => updateDraft(item.itemType === 'frame' ? { frameId: item.id } : item.itemType === 'decoration' ? { decorationId: item.id } : { outfitId: item.id })} />;
            })}
          </View>
        )}
        <View style={{ height: 24 }} />
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <AnimatedPressable disabled={!isDirty || saving} onPress={() => { void save(); }} style={[styles.saveButton, (!isDirty || saving) && styles.disabledButton]}>
          {saving ? <ActivityIndicator color={theme.onAccent} size="small" /> : <Check color={theme.onAccent} size={18} strokeWidth={3} />}
          <Text style={styles.saveButtonText}>{saving ? t('saving') : t('saveAppearance')}</Text>
        </AnimatedPressable>
      </View>
    </View>
  );
}

function WardrobeCard({
  avatar,
  item,
  appearance,
  language,
  unlocked,
  selected,
  level,
  labels,
  onPress,
}: {
  avatar?: AvatarDefinition;
  item?: AppearanceDefinition;
  appearance: EquippedAppearance;
  language: string;
  unlocked: boolean;
  selected: boolean;
  level: number;
  labels: { locked: string; selected: string };
  onPress: () => void;
}) {
  const { styles, theme } = useStyles();
  // Cosmetic cards must use the cosmetic title. The companion is only the
  // preview target; using it here made every frame look like the owl card.
  const title = item ? getName(item, language) : avatar ? getName(avatar, language) : '';
  const accent = item
    ? item.itemType === 'frame'
      ? { tint: theme.violetTint, line: theme.violetLine, color: theme.violetDeep }
      : item.itemType === 'decoration'
        ? { tint: theme.sunTint, line: theme.sunLine, color: theme.sunDeep }
        : { tint: theme.berryTint, line: theme.berryLine, color: theme.berryDeep }
    : { tint: theme.skyTint, line: theme.skyLine, color: theme.sky };
  return (
    <AnimatedPressable
      accessibilityLabel={unlocked ? title : `${title}, ${labels.locked.replace('{level}', String(item?.requiredLevel ?? avatar?.requiredLevel ?? level))}`}
      containerStyle={styles.cardContainer}
      disabled={!unlocked}
      onPress={onPress}
      style={[styles.wardrobeCard, selected && styles.wardrobeCardSelected, !unlocked && styles.wardrobeCardLocked]}>
      {item ? (
        <LinearGradient colors={[accent.tint, theme.paper]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.cardVisual, styles.cosmeticVisual, { borderColor: accent.line }]}>
          <View style={[styles.cosmeticGlow, { backgroundColor: accent.color }]} />
          <AppearanceItemPreview item={item} size={88} />
        </LinearGradient>
      ) : (
        <View style={[styles.cardVisual, styles.companionVisual]}><MemoryAvatar avatar={avatar} appearance={appearance} locked={!unlocked} level={level} size={88} /></View>
      )}
      <Text numberOfLines={1} style={styles.cardTitle}>{title}</Text>
      <Text style={[styles.cardMeta, unlocked && styles.cardMetaUnlocked]}>{selected ? labels.selected : unlocked ? `Lv. ${item?.requiredLevel ?? avatar?.requiredLevel ?? 1}` : labels.locked.replace('{level}', String(item?.requiredLevel ?? avatar?.requiredLevel ?? level))}</Text>
      {selected ? <View style={[styles.selectedMark, { backgroundColor: accent.color }]}><Check color={theme.onAccent} size={14} strokeWidth={3} /></View> : !unlocked ? <View style={styles.lockMark}><LockKeyhole color={theme.inkSoft} size={14} /></View> : null}
    </AnimatedPressable>
  );
}

function NoneCard({ selected, label, equippedLabel, onPress }: { selected: boolean; label: string; equippedLabel: string; onPress: () => void }) {
  const { styles, theme } = useStyles();
  return (
    <AnimatedPressable containerStyle={styles.cardContainer} onPress={onPress} style={[styles.wardrobeCard, styles.noneCard, selected && styles.wardrobeCardSelected]}>
      <View style={styles.noneVisual}><X color={theme.inkSoft} size={28} /></View>
      <Text numberOfLines={1} style={styles.cardTitle}>{label}</Text>
      <Text style={[styles.cardMeta, selected && styles.cardMetaUnlocked]}>{selected ? equippedLabel : label}</Text>
      {selected ? <View style={styles.selectedMark}><Check color={theme.onAccent} size={14} strokeWidth={3} /></View> : null}
    </AnimatedPressable>
  );
}

function getName(item: AvatarDefinition | AppearanceDefinition, language: string) {
  return language === 'zh' ? item.titleZh : item.titleEn;
}

function selectedAppearanceId(draft: AppearanceDraft, type: AppearanceItemType) {
  if (type === 'frame') return draft.frameId;
  if (type === 'decoration') return draft.decorationId;
  return draft.outfitId;
}

function sameDraft(left: AppearanceDraft, right: AppearanceDraft) {
  return left.source === right.source && left.avatarId === right.avatarId && left.photoUri === right.photoUri && left.frameId === right.frameId && left.decorationId === right.decorationId && left.outfitId === right.outfitId;
}

function isLocalMediaUri(value: string) {
  const normalized = value.trim().toLowerCase();
  return normalized.startsWith('file://') || normalized.startsWith('content://') || normalized.startsWith('ph://') || normalized.startsWith('assets-library://');
}

const useStyles = createThemedStyles((theme) => StyleSheet.create({
  page: { flex: 1, backgroundColor: theme.canvas },
  content: { padding: 16, paddingBottom: 28 },
  studioHero: { minHeight: 312, alignItems: 'center', overflow: 'hidden', borderRadius: 28, borderWidth: 1.5, borderColor: theme.violetLine, backgroundColor: theme.violetDeep, paddingTop: 16, paddingBottom: 18, position: 'relative' },
  heroOrbLarge: { position: 'absolute', width: 280, height: 280, borderRadius: 140, backgroundColor: 'rgba(255,255,255,0.12)', top: 31 },
  heroOrbSmall: { position: 'absolute', width: 110, height: 110, borderRadius: 55, backgroundColor: 'rgba(255,255,255,0.12)', top: 126, right: -24 },
  heroOrbitOuter: { position: 'absolute', width: 244, height: 244, borderRadius: 122, borderWidth: 1, borderColor: 'rgba(255,255,255,0.28)', borderStyle: 'dashed', top: 48 },
  heroOrbitInner: { position: 'absolute', width: 206, height: 206, borderRadius: 103, borderWidth: 1, borderColor: 'rgba(255,255,255,0.16)', top: 67 },
  heroStar: { position: 'absolute', zIndex: 4 },
  heroStarOne: { left: '18%', top: 82 },
  heroStarTwo: { right: '19%', top: 118 },
  liveBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.18)', paddingHorizontal: 9, paddingVertical: 5, marginLeft: 14, zIndex: 5 },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: theme.grass },
  liveBadgeText: { color: theme.onAccent, fontFamily: typography.bodyExtraBold, fontSize: 9.5 },
  heroAvatar: { marginTop: 3, zIndex: 3 },
  heroName: { color: theme.onAccent, fontFamily: typography.displayExtraBold, fontSize: 18, marginTop: 2, zIndex: 5 },
  tabs: { gap: 8, paddingVertical: 17, paddingRight: 4 },
  tab: { minWidth: 88, minHeight: 42, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, borderRadius: 14, borderWidth: 1.5, borderColor: theme.line, backgroundColor: theme.paper, paddingHorizontal: 11 },
  tabActive: { borderColor: theme.violetDeep, backgroundColor: theme.violetDeep },
  tabText: { color: theme.inkSoft, fontFamily: typography.bodyExtraBold, fontSize: 10 },
  tabTextActive: { color: theme.onAccent },
  catalogHeader: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12, marginBottom: 10 },
  catalogTitle: { color: theme.ink, fontFamily: typography.displayExtraBold, fontSize: 15 },
  catalogCount: { color: theme.inkMuted, fontFamily: typography.bodyExtraBold, fontSize: 9.5 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 0 },
  cardContainer: { width: '48.4%', marginBottom: 11 },
  wardrobeCard: { minHeight: 168, width: '100%', alignItems: 'center', justifyContent: 'center', position: 'relative', borderRadius: 21, borderWidth: 1.5, borderColor: theme.line, backgroundColor: theme.paper, paddingVertical: 12, paddingHorizontal: 8, boxShadow: '0px 4px 0px rgba(105,80,204,0.05)' },
  wardrobeCardSelected: { borderColor: theme.violetDeep, backgroundColor: theme.violetTint, boxShadow: '0px 4px 0px rgba(105,80,204,0.12)' },
  wardrobeCardLocked: { opacity: 0.55 },
  cardVisual: { width: 102, height: 102, alignItems: 'center', justifyContent: 'center', borderRadius: 24 },
  companionVisual: { backgroundColor: theme.skyTint },
  cosmeticVisual: { overflow: 'hidden', borderWidth: 1 },
  cosmeticGlow: { position: 'absolute', width: 76, height: 76, borderRadius: 38, opacity: 0.13, top: -23, right: -18 },
  cardTitle: { maxWidth: '100%', color: theme.ink, fontFamily: typography.displayExtraBold, fontSize: 12, marginTop: 3 },
  cardMeta: { color: theme.inkMuted, fontFamily: typography.bodyExtraBold, fontSize: 9.5, marginTop: 3 },
  cardMetaUnlocked: { color: theme.violetDeep },
  selectedMark: { position: 'absolute', top: 9, right: 9, width: 25, height: 25, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.violetDeep },
  lockMark: { position: 'absolute', top: 9, right: 9, width: 25, height: 25, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.line },
  noneCard: { borderStyle: 'dashed' },
  noneVisual: { width: 82, height: 82, alignItems: 'center', justifyContent: 'center', borderRadius: 41, borderWidth: 1.5, borderColor: theme.line, backgroundColor: theme.canvas },
  photoPanel: { flexDirection: 'row', alignItems: 'center', gap: 16, minHeight: 190, borderRadius: 22, borderWidth: 1.5, borderColor: theme.line, backgroundColor: theme.paper, padding: 16 },
  photoPreview: { width: 136, height: 136, alignItems: 'center', justifyContent: 'center' },
  photoPlaceholder: { width: 66, height: 66, alignItems: 'center', justifyContent: 'center', borderRadius: 23, backgroundColor: theme.violetTint },
  photoCopy: { flex: 1, minWidth: 0 },
  photoTitle: { color: theme.ink, fontFamily: typography.displayExtraBold, fontSize: 15 },
  primaryAction: { minHeight: 42, alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderRadius: 13, backgroundColor: theme.violetDeep, paddingHorizontal: 13, marginTop: 12 },
  primaryActionText: { color: theme.onAccent, fontFamily: typography.displayExtraBold, fontSize: 11 },
  footer: { borderTopWidth: 1.5, borderTopColor: theme.line, backgroundColor: theme.canvas, paddingHorizontal: 16, paddingTop: 10 },
  saveButton: { minHeight: 50, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, borderRadius: 15, backgroundColor: theme.violetDeep },
  saveButtonText: { color: theme.onAccent, fontFamily: typography.displayExtraBold, fontSize: 13 },
  disabledButton: { opacity: 0.45 },
}));
