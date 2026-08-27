import AnimatedPressable from '@/components/AnimatedPressable';
import { AppImage } from '@/components/AppImage';
import { CommonHeader } from '@/components/CommonHeader';
import LoadingView from '@/components/LoadingView';
import { ModuleNoticeCard } from '@/components/ModuleNoticeCard';
import { useCurrentUser } from '@/features/profile/hooks/useCurrentUser';
import { numberPegTheme as theme } from '@/features/number-peg/constants/numberPegTheme';
import { typography } from '@/theme/typography';
import { usePalaceScenes } from '@/features/palace-scenes/hooks/usePalaceScenes';
import { getNumberPegErrorMessage } from '@/features/number-peg/utils/numberPegErrors';
import { Href, useRouter } from 'expo-router';
import { ArrowRight } from 'lucide-react-native';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

export default function PalaceMapScreen() {
  const router = useRouter();
  const { user } = useCurrentUser();
  const scenes = usePalaceScenes();
  const isPremium = Boolean(user?.isPremium);
  const availableScenes = (scenes.data ?? []).filter((scene) => !scene.isPremium || isPremium);

  return (
    <View style={styles.page}>
      <CommonHeader
        eyebrow="Your palaces"
        title="Palace unlocks"
        description="Choose a room, then place your items"
        backAction={() => router.back()}
      />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={scenes.isRefetching} onRefresh={scenes.refetch} />}>
        <View style={styles.summaryCard}>
          <View style={styles.summaryIcon}><Text style={styles.summaryEmoji}>🗺️</Text></View>
          <View style={styles.summaryCopy}>
            <Text style={styles.summaryTitle}>{availableScenes.length} rooms ready for a walk</Text>
            <Text style={styles.summaryBody}>Use a familiar route for each memory so your lists stay separate.</Text>
          </View>
        </View>

        <View style={styles.headingRow}>
          <View>
            <Text style={styles.eyebrow}>ROOM LIBRARY</Text>
            <Text style={styles.heading}>Choose a scene</Text>
          </View>
          <Text style={styles.countPill}>{scenes.data?.length ?? 0} total</Text>
        </View>

        {scenes.isLoading ? (
          <View style={styles.loadingFrame}><LoadingView description="Opening the Palace doors…" /></View>
        ) : scenes.isError ? (
          <ModuleNoticeCard
            title="The Palace doors are stuck"
            body={getNumberPegErrorMessage(scenes.error, 'Check your connection and try again.')}
            onAction={scenes.refetch}
          />
        ) : scenes.data?.length ? (
          <View style={styles.grid}>
            {scenes.data.map((scene) => {
              const locked = scene.isPremium && !isPremium;
              return (
                <AnimatedPressable
                  key={scene.id}
                  accessibilityLabel={locked ? `Unlock ${scene.name}` : `Use ${scene.name}`}
                  onPress={() => router.push((locked ? '/premium' : `/palaces/create-memory?sceneId=${encodeURIComponent(scene.id)}`) as Href)}
                  style={[styles.sceneCard, locked && styles.sceneCardLocked]}>
                  <AppImage imageUrl={scene.imageUrl} imageSource={scene.imageSource} style={styles.sceneImage} />
                  <View style={styles.sceneShade} />
                  {locked ? <View style={styles.lockBadge}><Text style={styles.lockEmoji}>🔒</Text><Text style={styles.lockText}>Premium</Text></View> : null}
                  <View style={styles.sceneCopy}>
                    <Text numberOfLines={1} style={styles.sceneName}>{scene.name}</Text>
                    <Text style={styles.sceneMeta}>{scene.loci.length} loci</Text>
                  </View>
                </AnimatedPressable>
              );
            })}
          </View>
        ) : (
          <ModuleNoticeCard
            title="No Palace scenes yet"
            body="Publish a scene and its loci from the admin studio to start building journeys."
            onAction={scenes.refetch}
          />
        )}

        <AnimatedPressable style={styles.startButton} onPress={() => router.push('/palaces/create-memory' as Href)}>
          <Text style={styles.startButtonText}>Build a memory Palace</Text>
          <ArrowRight size={17} color={theme.ink} />
        </AnimatedPressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: theme.canvas },
  content: { padding: 16, paddingBottom: 40 },
  summaryCard: { flexDirection: 'row', alignItems: 'center', gap: 11, borderRadius: 18, borderWidth: 2, borderColor: '#DCD4FF', backgroundColor: '#F7F5FF', padding: 13 },
  summaryIcon: { width: 40, height: 40, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: '#EEE9FF' },
  summaryEmoji: { fontSize: 20 },
  summaryCopy: { flex: 1 },
  summaryTitle: { color: theme.ink, fontFamily: typography.display, fontSize: 14 },
  summaryBody: { color: theme.inkSoft, fontFamily: typography.bodyBold, fontSize: 11, lineHeight: 16, marginTop: 2 },
  headingRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 25, marginBottom: 12 },
  eyebrow: { color: theme.violetDeep, fontFamily: typography.bodyExtraBold, fontSize: 10, letterSpacing: 1 },
  heading: { color: theme.ink, fontFamily: typography.display, fontSize: 18, marginTop: 3 },
  countPill: { color: theme.violetDeep, backgroundColor: '#EEE9FF', borderRadius: 999, paddingHorizontal: 9, paddingVertical: 6, fontFamily: typography.bodyExtraBold, fontSize: 10 },
  grid: { flexDirection: 'column', gap: 14 },
  sceneCard: { width: '100%', height: 110, overflow: 'hidden', borderRadius: 20, backgroundColor: '#E3D7B3', borderWidth: 2, borderColor: '#EEE9DC' },
  sceneCardLocked: { opacity: 0.78 },
  sceneImage: { ...StyleSheet.absoluteFillObject },
  sceneShade: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(43,42,61,0.28)' },
  lockBadge: { position: 'absolute', top: 9, left: 9, flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 999, backgroundColor: 'rgba(43,42,61,.86)', paddingHorizontal: 7, paddingVertical: 5 },
  lockEmoji: { fontSize: 11 },
  lockText: { color: 'white', fontFamily: typography.bodyExtraBold, fontSize: 9 },
  sceneCopy: { position: 'absolute', left: 16, right: 16, bottom: 14 },
  sceneName: { color: 'white', fontFamily: typography.displayExtraBold, fontSize: 16, textShadowColor: 'rgba(0,0,0,0.35)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 5 },
  sceneMeta: { color: 'rgba(255,255,255,0.85)', fontFamily: typography.bodyBold, fontSize: 11, marginTop: 2 },
  loadingFrame: { height: 150, overflow: 'hidden', borderRadius: 18 },
  startButton: { minHeight: 50, marginTop: 20, borderRadius: 15, backgroundColor: theme.sun, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: `0px 5px 0px ${theme.sunDeep}` },
  startButtonText: { color: theme.ink, fontFamily: typography.bodyExtraBold, fontSize: 13 },
});
