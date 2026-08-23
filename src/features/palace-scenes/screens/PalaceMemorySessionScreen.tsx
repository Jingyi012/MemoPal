import AnimatedPressable from '@/components/AnimatedPressable';
import { AppImage } from '@/components/AppImage';
import { CommonHeader } from '@/components/CommonHeader';
import LoadingView from '@/components/LoadingView';
import { useMemorySet } from '@/features/memory-sets';
import { usePalaceScene } from '@/features/palace-scenes';
import { numberPegTheme as theme } from '@/features/number-peg/constants/numberPegTheme';
import { useRouter } from 'expo-router';
import { ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

export default function PalaceMemorySessionScreen({ memorySetId }: { memorySetId: string }) {
  const router = useRouter();
  const memorySetQuery = useMemorySet(memorySetId);
  const sceneId = memorySetQuery.data?.techniquePlan?.palaceSceneId ?? '';
  const sceneQuery = usePalaceScene(sceneId);
  const [activeIndex, setActiveIndex] = useState(0);
  const [walking, setWalking] = useState(false);

  const placements = useMemo(() => {
    const memorySet = memorySetQuery.data;
    const scene = sceneQuery.data;
    if (!memorySet || !scene) return [];
    const bindings = memorySet.techniquePlan?.palaceBindings ?? [];
    return memorySet.items.map((item) => {
      const binding = bindings.find((candidate) => candidate.memoryItemId === item.id);
      return { item, binding, locus: scene.loci.find((locus) => locus.id === binding?.locusId) };
    });
  }, [memorySetQuery.data, sceneQuery.data]);

  if (memorySetQuery.isLoading || (sceneId && sceneQuery.isLoading)) {
    return <LoadingView description="Opening your Palace…" />;
  }

  if (!memorySetQuery.data || !sceneQuery.data) {
    return (
      <View style={styles.page}>
        <CommonHeader title="Memory Palace" description="Scene unavailable" backAction={() => router.back()} />
        <View style={styles.empty}><Text style={styles.emptyEmoji}>🏚️</Text><Text style={styles.emptyTitle}>This Palace could not open</Text><Text style={styles.emptyText}>Refresh your connection or choose another memory.</Text></View>
      </View>
    );
  }

  const memorySet = memorySetQuery.data;
  const scene = sceneQuery.data;
  const active = placements[activeIndex];

  return (
    <View style={styles.page}>
      <CommonHeader title={memorySet.title} description={`${scene.name} · ${placements.length} loci`} backAction={() => router.back()} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.canvas}>
          <AppImage imageUrl={scene.imageUrl} style={StyleSheet.absoluteFillObject} />
          {placements.map((placement, index) => placement.locus ? (
            <AnimatedPressable
              key={placement.item.id}
              onPress={() => { setActiveIndex(index); setWalking(false); }}
              style={[styles.marker, { left: `${placement.locus.xPercent}%`, top: `${placement.locus.yPercent}%` }, index === activeIndex && styles.activeMarker]}>
              <Text style={styles.markerText}>{index + 1}</Text>
            </AnimatedPressable>
          ) : null)}
        </View>
        <Text style={styles.hint}>Tap a marker, or walk through every locus in order.</Text>

        {walking && active ? (
          <View style={styles.walkCard}>
            <Text style={styles.walkEyebrow}>LOCUS {activeIndex + 1} · {active.locus?.name.toUpperCase()}</Text>
            <Text style={styles.walkAnswer}>{active.item.answer}</Text>
            <Text style={styles.walkAssociation}>{active.binding?.associationText}</Text>
            <View style={styles.walkActions}>
              <AnimatedPressable disabled={activeIndex === 0} onPress={() => setActiveIndex((value) => Math.max(0, value - 1))} style={[styles.roundButton, activeIndex === 0 && styles.disabled]}><ChevronLeft size={21} color={theme.ink} /></AnimatedPressable>
              <Text style={styles.walkCount}>{activeIndex + 1} / {placements.length}</Text>
              <AnimatedPressable
                onPress={() => activeIndex === placements.length - 1 ? setActiveIndex(0) : setActiveIndex((value) => value + 1)}
                style={styles.roundButton}>
                {activeIndex === placements.length - 1 ? <RotateCcw size={19} color={theme.ink} /> : <ChevronRight size={21} color={theme.ink} />}
              </AnimatedPressable>
            </View>
          </View>
        ) : (
          <>
            {placements.map((placement, index) => (
              <AnimatedPressable key={placement.item.id} onPress={() => setActiveIndex(index)} style={[styles.itemRow, index === activeIndex && styles.activeRow]}>
                <View style={styles.itemNumber}><Text style={styles.itemNumberText}>{index + 1}</Text></View>
                <View style={{ flex: 1 }}><Text style={styles.itemAnswer}>{placement.item.answer}</Text><Text style={styles.itemLocus}>{placement.locus?.name}</Text></View>
              </AnimatedPressable>
            ))}
            <AnimatedPressable onPress={() => { setActiveIndex(0); setWalking(true); }} style={styles.primaryButton}><Text style={styles.primaryText}>🚶 Walk through my Palace</Text></AnimatedPressable>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: theme.canvas }, content: { padding: 16, paddingBottom: 42 },
  canvas: { height: 300, borderRadius: 23, overflow: 'hidden', borderWidth: 2, borderColor: '#DCD4FF', backgroundColor: '#EAE5D8' },
  marker: { position: 'absolute', width: 34, height: 34, marginLeft: -17, marginTop: -17, borderRadius: 17, backgroundColor: '#9B8CFF', borderWidth: 3, borderColor: 'white', alignItems: 'center', justifyContent: 'center', elevation: 4 }, activeMarker: { backgroundColor: theme.sunDeep, transform: [{ scale: 1.18 }] }, markerText: { color: 'white', fontSize: 12, fontWeight: '900' },
  hint: { color: theme.inkSoft, fontSize: 11, lineHeight: 17, fontWeight: '700', textAlign: 'center', marginVertical: 12 },
  itemRow: { minHeight: 62, flexDirection: 'row', alignItems: 'center', gap: 11, borderRadius: 15, borderWidth: 2, borderColor: theme.line, backgroundColor: theme.paper, padding: 10, marginBottom: 8 }, activeRow: { borderColor: '#9B8CFF', backgroundColor: '#F7F5FF' }, itemNumber: { width: 29, height: 29, borderRadius: 15, backgroundColor: '#9B8CFF', alignItems: 'center', justifyContent: 'center' }, itemNumberText: { color: 'white', fontSize: 11, fontWeight: '900' }, itemAnswer: { color: theme.ink, fontSize: 14, fontWeight: '900' }, itemLocus: { color: theme.inkSoft, fontSize: 10, fontWeight: '700', marginTop: 2 },
  primaryButton: { minHeight: 53, borderRadius: 16, backgroundColor: theme.sun, alignItems: 'center', justifyContent: 'center', marginTop: 10, shadowColor: theme.sunDeep, shadowOffset: { width: 0, height: 5 }, shadowOpacity: 1, shadowRadius: 0, elevation: 3 }, primaryText: { color: theme.ink, fontSize: 14, fontWeight: '900' },
  walkCard: { borderRadius: 23, borderWidth: 2, borderColor: theme.line, backgroundColor: theme.paper, padding: 22, alignItems: 'center' }, walkEyebrow: { color: '#7A68E0', fontSize: 10, fontWeight: '900', letterSpacing: 0.8 }, walkAnswer: { color: theme.ink, fontSize: 25, fontWeight: '900', textAlign: 'center', marginTop: 12 }, walkAssociation: { color: theme.inkSoft, fontSize: 13, lineHeight: 20, fontWeight: '700', textAlign: 'center', marginTop: 8 }, walkActions: { width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 22 }, roundButton: { width: 46, height: 46, borderRadius: 23, backgroundColor: theme.sun, alignItems: 'center', justifyContent: 'center' }, disabled: { opacity: 0.35 }, walkCount: { color: theme.inkSoft, fontSize: 12, fontWeight: '900' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }, emptyEmoji: { fontSize: 43 }, emptyTitle: { color: theme.ink, fontSize: 18, fontWeight: '900', marginTop: 12 }, emptyText: { color: theme.inkSoft, fontSize: 13, textAlign: 'center', marginTop: 6 },
});
