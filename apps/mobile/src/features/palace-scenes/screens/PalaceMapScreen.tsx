import { AppText as Text } from '@/components/ui/AppText';
import { appArtworkSizes, appRadii, appSpacing, appTextStyles } from '@/theme/designSystem';
import AnimatedPressable from '@/components/AnimatedPressable';
import { AppImage } from '@/components/AppImage';
import { CommonHeader } from '@/components/CommonHeader';
import LoadingView from '@/components/LoadingView';
import { ModuleNoticeCard } from '@/components/ModuleNoticeCard';
import { useCurrentUser } from '@/features/profile/hooks/useCurrentUser';
import { usePalaceScenes } from '@/features/palace-scenes/hooks/usePalaceScenes';
import { isPalaceSceneUnlocked } from '@/features/palace-scenes/utils/palaceCapacity';
import { getPalaceSceneName } from '@/features/palace-scenes/utils/palaceLocalization';
import type { PalaceScene } from '@/features/palace-scenes/types/palaceScene.types';
import { createThemedStyles } from '@/theme/createThemedStyles';
import { typography } from '@/theme/typography';
import { getNumberPegErrorMessage } from '@/features/number-peg/utils/numberPegErrors';
import { useRouter } from 'expo-router';
import { ArrowRight, Check, LockKeyhole } from '@/core/icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useMemo, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { useTranslation } from '@/core/i18n/useTranslation';
import { useNetworkStatus } from '@/core/hooks/useNetworkStatus';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type SceneCategory = 'all' | 'home' | 'work' | 'outdoor';
const CATEGORY_LABEL: Record<SceneCategory, 'allScenes' | 'homeScenes' | 'workScenes' | 'outdoorScenes'> = {
  all: 'allScenes', home: 'homeScenes', work: 'workScenes', outdoor: 'outdoorScenes',
};

export default function PalaceMapScreen() {
  const { styles, theme } = useStyles();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t, language } = useTranslation('palace');
  const { isOffline, canShowRequestErrors } = useNetworkStatus();
  const { user } = useCurrentUser();
  const scenesQuery = usePalaceScenes();
  const [category, setCategory] = useState<SceneCategory>('all');
  const [selectedSceneId, setSelectedSceneId] = useState<string | null>(null);
  const isPremium = Boolean(user?.isPremium);
  const currentLevel = Math.max(1, user?.level ?? 1);
  const scenes = scenesQuery.data ?? [];
  const filteredScenes = useMemo(
    () => scenes.filter((scene) => category === 'all' || getSceneCategory(scene) === category),
    [category, scenes]
  );
  const selectedScene = scenes.find((scene) => scene.id === selectedSceneId);
  const availableCount = scenes.filter((scene) => isPalaceSceneUnlocked(scene, currentLevel, isPremium)).length;
  const openSelectedScene = () => {
    if (selectedScene) {
      router.push({ pathname: '/palaces/create-memory', params: { sceneId: selectedScene.id } });
    }
  };

  return (
    <View style={styles.page}>
      <CommonHeader showAiCredits={false}
        eyebrow={t('yourPalaces')}
        title={t('palaceUnlocks')}
        description={t('mapDescription')}
        backAction={() => router.back()}
      />
      <ScrollView
        contentContainerStyle={[styles.content, selectedScene && styles.contentWithDock]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={scenesQuery.isRefetching} onRefresh={() => void scenesQuery.refetch()} />}>
        <View style={styles.libraryIntro}>
          <View style={styles.introIcon}><Text style={styles.introEmoji}>🗺️</Text></View>
          <View style={styles.introCopy}>
            <Text style={styles.introTitle}>{t('roomsReadyTitle').replace('{count}', String(availableCount))}</Text>
          </View>
        </View>

        <View style={styles.headingRow}>
          <View style={styles.headingCopy}>
            <Text style={styles.eyebrow}>{t('roomLibrary')}</Text>
            <Text style={styles.heading}>{t('chooseScene')}</Text>
          </View>
          <Text style={styles.countPill}>{filteredScenes.length} {t('totalCount')}</Text>
        </View>

        {!isOffline && scenesQuery.isLoading ? (
          <View style={styles.loadingFrame}><LoadingView description={t('loading')} /></View>
        ) : canShowRequestErrors && scenesQuery.isError ? (
          <ModuleNoticeCard
            title={t('doorsStuck')}
            body={getNumberPegErrorMessage(scenesQuery.error, t('connection'))}
            onAction={() => void scenesQuery.refetch()}
          />
        ) : scenes.length ? (
          <>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryRail}>
              {(Object.keys(CATEGORY_LABEL) as SceneCategory[]).map((key) => {
                const active = category === key;
                return (
                  <AnimatedPressable
                    key={key}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    onPress={() => {
                      setCategory(key);
                      setSelectedSceneId(null);
                    }}
                    style={[styles.categoryChip, active && styles.categoryChipActive]}>
                    <Text style={[styles.categoryText, active && styles.categoryTextActive]}>{t(CATEGORY_LABEL[key])}</Text>
                  </AnimatedPressable>
                );
              })}
            </ScrollView>
            {filteredScenes.length ? (
              <View style={styles.grid}>
                {filteredScenes.map((scene) => {
                  const locked = !isPalaceSceneUnlocked(scene, currentLevel, isPremium);
                  const selected = selectedSceneId === scene.id;
                  const lockReason = scene.isPremium && !isPremium
                    ? t('premium')
                    : t('unlockAtLevel').replace('{level}', String(scene.unlockLevel ?? 1));
                  return (
                    <SceneCard
                      key={scene.id}
                      scene={scene}
                      name={getPalaceSceneName(scene, language)}
                      selected={selected}
                      locked={locked}
                      lockReason={lockReason}
                      onPress={() => setSelectedSceneId((current) => current === scene.id ? null : scene.id)}
                    />
                  );
                })}
              </View>
            ) : (
              <Text style={styles.noScenes}>{t('noScenesInCategory')}</Text>
            )}
          </>
        ) : (
          <ModuleNoticeCard title={t('noScenes')} body={t('publishScene')} onAction={() => void scenesQuery.refetch()} />
        )}
      </ScrollView>

      {selectedScene ? (
        <View style={[styles.bottomDock, { paddingBottom: Math.max(insets.bottom, 12) }]}>
          <AnimatedPressable accessibilityRole="button" onPress={openSelectedScene} style={styles.createSelectedButton}>
            <Text numberOfLines={1} style={styles.createSelectedText}>{t('createWithScene', { name: getPalaceSceneName(selectedScene, language) })}</Text>
            <ArrowRight size={18} color={theme.onAccent} />
          </AnimatedPressable>
        </View>
      ) : null}
    </View>
  );
}

function SceneCard({ scene, name, selected, locked, lockReason, onPress }: {
  scene: PalaceScene;
  name: string;
  selected: boolean;
  locked: boolean;
  lockReason: string;
  onPress: () => void;
}) {
  const { styles, theme } = useStyles();
  const { t } = useTranslation('palace');
  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityLabel={t(locked ? 'unlockScene' : 'useScene', { name })}
      accessibilityState={{ selected, disabled: locked }}
      disabled={locked}
      onPress={onPress}
      style={[styles.sceneCard, selected && styles.sceneCardSelected, locked && styles.sceneCardLocked]}>
      <AppImage imageUrl={scene.imageUrl} imageSource={scene.imageSource} style={StyleSheet.absoluteFill} />
      <LinearGradient colors={['rgba(30,23,53,0.02)', 'rgba(30,23,53,0.04)', 'rgba(30,23,53,0.78)']} locations={[0, 0.48, 1]} style={StyleSheet.absoluteFill} />
      {locked ? (
        <View style={styles.lockBadge}>
          <LockKeyhole size={12} color="#FFFFFF" />
          <Text numberOfLines={1} style={styles.lockText}>{lockReason}</Text>
        </View>
      ) : null}
      {selected ? <View style={styles.selectedBadge}><Check size={15} color={theme.onSun} strokeWidth={3} /></View> : null}
      <View style={styles.sceneCopy}>
        <Text numberOfLines={2} style={styles.sceneName}>{name}</Text>
        <Text style={styles.sceneMeta}>{t('lociCount').replace('{count}', String(scene.loci.length))}</Text>
      </View>
    </AnimatedPressable>
  );
}

function getSceneCategory(scene: PalaceScene): Exclude<SceneCategory, 'all'> | null {
  const text = `${scene.name} ${scene.description}`.toLocaleLowerCase();
  if (/garden|backyard|park|trail|street|outdoor|patio|beach|forest|花园|后院|公园|户外|街道|海边|森林|露台/.test(text)) return 'outdoor';
  if (/office|workshop|work|classroom|school|studio|desk|办公室|工作室|教室|学校|书房|工作/.test(text)) return 'work';
  if (/home|house|foyer|entry|living|dining|kitchen|pantry|laundry|utility|bedroom|room|家|房|玄关|客厅|餐厅|厨房|储藏|洗衣|卧室/.test(text)) return 'home';
  const id = scene.id.toLocaleLowerCase();
  if (/garden|backyard|park|trail|street|outdoor|patio|beach|forest/.test(id)) return 'outdoor';
  if (/office|workshop|work|classroom|school|studio|desk/.test(id)) return 'work';
  if (/home|house|foyer|entry|living|dining|kitchen|pantry|laundry|utility|bedroom|room/.test(id)) return 'home';
  return null;
}

const useStyles = createThemedStyles((theme) => StyleSheet.create({
  page: { flex: 1, backgroundColor: 'transparent' },
  content: { gap: appSpacing.lg, paddingHorizontal: appSpacing.lg, paddingTop: 10, paddingBottom: 30 },
  contentWithDock: { paddingBottom: 116 },
  libraryIntro: { alignItems: 'center', backgroundColor: theme.paper, borderColor: theme.line, borderRadius: appRadii.card, borderWidth: 1.5, flexDirection: 'row', gap: 11, padding: appSpacing.md },
  introIcon: { alignItems: 'center', backgroundColor: theme.paper, borderRadius: appRadii.control, height: 42, justifyContent: 'center', width: 42 },
  introEmoji: { fontSize: appArtworkSizes.small },
  introCopy: { flex: 1 },
  introTitle: { color: theme.ink, fontFamily: typography.displayExtraBold, fontSize: appTextStyles.small.fontSize },
  headingRow: { alignItems: 'flex-end', flexDirection: 'row', justifyContent: 'space-between', marginTop: 2 },
  headingCopy: { flex: 1 },
  eyebrow: { color: theme.violetDeep, fontFamily: typography.bodyExtraBold, fontSize: appTextStyles.caption.fontSize, letterSpacing: 1 },
  heading: { color: theme.ink, fontFamily: typography.displayExtraBold, fontSize: appTextStyles.sectionTitle.fontSize, marginTop: 3 },
  countPill: { color: theme.violetDeep, backgroundColor: theme.violetTint, borderRadius: appRadii.pill, paddingHorizontal: 9, paddingVertical: 6, fontFamily: typography.bodyExtraBold, fontSize: appTextStyles.caption.fontSize },
  categoryRail: { gap: appSpacing.sm, paddingVertical: 2, paddingRight: 3 },
  categoryChip: { alignItems: 'center', backgroundColor: theme.paper, borderColor: theme.line, borderRadius: appRadii.pill, borderWidth: 1.5, justifyContent: 'center', minHeight: 44, paddingHorizontal: 14 },
  categoryChipActive: { backgroundColor: theme.violetDeep, borderColor: theme.violetDeep },
  categoryText: { color: theme.ink, fontFamily: typography.bodyExtraBold, fontSize: appTextStyles.caption.fontSize },
  categoryTextActive: { color: theme.onAccent },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: appSpacing.md },
  sceneCard: { backgroundColor: theme.violetTint, borderColor: theme.violetLine, borderRadius: 19, borderWidth: 2, height: 164, overflow: 'hidden', width: '48.5%' },
  sceneCardSelected: { borderColor: theme.sunDeep, borderWidth: 3 },
  sceneCardLocked: { opacity: 0.78 },
  lockBadge: { alignItems: 'center', backgroundColor: 'rgba(35,29,54,0.78)', borderRadius: appRadii.pill, flexDirection: 'row', gap: appSpacing.xs, left: 7, maxWidth: '86%', paddingHorizontal: 7, paddingVertical: 5, position: 'absolute', top: 7 },
  lockText: { color: '#FFFFFF', flexShrink: 1, fontFamily: typography.bodyExtraBold, fontSize: appTextStyles.caption.fontSize },
  selectedBadge: { alignItems: 'center', backgroundColor: theme.sun, borderRadius: appRadii.control, height: 28, justifyContent: 'center', position: 'absolute', right: 8, top: 8, width: 28 },
  sceneCopy: { bottom: 0, left: 0, paddingBottom: 10, paddingHorizontal: 10, paddingTop: appSpacing.section, position: 'absolute', right: 0 },
  sceneName: { color: '#FFFFFF', fontFamily: typography.displayExtraBold, fontSize: appTextStyles.small.fontSize, lineHeight: appTextStyles.small.lineHeight },
  sceneMeta: { color: 'rgba(255,255,255,0.92)', fontFamily: typography.bodyBold, fontSize: appTextStyles.caption.fontSize, marginTop: 3 },
  noScenes: { color: theme.inkSoft, fontFamily: typography.bodySemibold, fontSize: appTextStyles.caption.fontSize, paddingVertical: appSpacing.xl, textAlign: 'center' },
  loadingFrame: { height: 150, justifyContent: 'center' },
  bottomDock: { backgroundColor: theme.canvas, borderTopColor: theme.line, borderTopWidth: 1, bottom: 0, left: 0, paddingHorizontal: appSpacing.xl, paddingTop: 10, position: 'absolute', right: 0 },
  createSelectedButton: { alignItems: 'center', backgroundColor: theme.violetDeep, borderRadius: appRadii.control, flexDirection: 'row', gap: 9, justifyContent: 'center', minHeight: 50, paddingHorizontal: 14 },
  createSelectedText: { color: theme.onAccent, flexShrink: 1, fontFamily: typography.displayExtraBold, fontSize: appTextStyles.small.fontSize },
}));
