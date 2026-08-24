import AnimatedPressable from '@/components/AnimatedPressable';
import { AppImage } from '@/components/AppImage';
import { CommonHeader } from '@/components/CommonHeader';
import { useMemorySetMutations } from '@/features/memory-sets';
import type { MemorySetUpsertRequest } from '@/features/memory-sets';
import { usePalaceScenes } from '@/features/palace-scenes';
import { numberPegTheme as theme } from '@/features/number-peg/constants/numberPegTheme';
import { getNumberPegErrorMessage } from '@/features/number-peg/utils/numberPegErrors';
import {
  choosePalaceScene,
  getPalaceCapacity,
  getPalaceCapacityMessage,
  getPalaceLoci,
  sceneFitsPalaceItems,
} from '@/features/palace-scenes/utils/palaceCapacity';
import { Href, useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowRight, Check, Image as ImageIcon, Plus, RefreshCcw, Trash2 } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import { firstParam, parseComposerItems, suggestMemoryTitle } from '@/features/memory-composer/utils/composerParams';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

export default function PalaceMemoryComposerScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    title?: string | string[];
    items?: string | string[];
    sceneId?: string | string[];
  }>();
  const scenesQuery = usePalaceScenes();
  const { createMemorySet } = useMemorySetMutations();
  const prefilledItems = useMemo(() => parseComposerItems(params.items), [params.items]);
  const fromSharedComposer = prefilledItems.length > 0;
  const [title, setTitle] = useState(() => firstParam(params.title) ?? '');
  const [newItem, setNewItem] = useState('');
  const [items, setItems] = useState<string[]>(() => prefilledItems);
  const [selectedSceneId, setSelectedSceneId] = useState(() => firstParam(params.sceneId) ?? '');
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!scenesQuery.data?.length) return;
    const requestedSceneId = firstParam(params.sceneId);
    const selectedSceneIsValid = scenesQuery.data.some((scene) => scene.id === selectedSceneId);
    if (selectedSceneIsValid) return;
    const suggestedScene = choosePalaceScene(scenesQuery.data, items.length, requestedSceneId);
    if (suggestedScene) setSelectedSceneId(suggestedScene.id);
  }, [items.length, params.sceneId, scenesQuery.data, selectedSceneId]);

  const selectedScene = useMemo(
    () => scenesQuery.data?.find((scene) => scene.id === selectedSceneId),
    [scenesQuery.data, selectedSceneId]
  );
  const loci = getPalaceLoci(selectedScene);
  const selectedSceneCapacity = getPalaceCapacity(selectedScene);
  const capacityMessage = selectedScene
    ? getPalaceCapacityMessage(items.length, selectedSceneCapacity)
    : null;

  const addItem = () => {
    const value = newItem.trim();
    if (!value) return;
    if (selectedScene && items.length >= loci.length) {
      setMessage(
        `This scene has ${loci.length} clear loci. Choose a larger scene or create a second memory.`
      );
      return;
    }
    setItems((current) => [...current, value]);
    setNewItem('');
    setMessage(null);
    createMemorySet.reset();
  };

  const save = () => {
    if (!selectedScene) return setMessage('Choose a scene for your Palace.');
    if (!items.length) return setMessage('Add at least one thing to remember.');
    if (items.length > loci.length) {
      return setMessage(capacityMessage ?? `This scene only has ${loci.length} loci.`);
    }
    const normalizedTitle = title.trim() || suggestMemoryTitle('custom', items);
    if (!title.trim()) setTitle(normalizedTitle);

    const request: MemorySetUpsertRequest = {
      title: normalizedTitle,
      goalType: items.length > 10 ? 'facts' : 'ordered-list',
      techniqueKey: 'palace',
      status: 'ready',
      visibility: 'private',
      items: items.map((answer, index) => ({ position: index + 1, prompt: `Recall locus ${index + 1}`, answer })),
      techniquePlan: {
        schemaVersion: 1,
        palaceSceneId: selectedScene.id,
        pegBindings: [],
        palaceBindings: items.map((answer, index) => ({
          itemPosition: index + 1,
          locusId: loci[index].id,
          associationText: `${answer} comes alive at the ${loci[index].name}.`,
          isCustomScene: true,
        })),
      },
    };

    setMessage(null);
    createMemorySet.mutate(request, {
      onSuccess: (created) => router.replace(`/palaces/memory/${created.id}` as Href),
    });
  };

  const error = createMemorySet.isError
    ? getNumberPegErrorMessage(createMemorySet.error, 'Could not save this Palace. Try again.')
    : scenesQuery.isError
      ? getNumberPegErrorMessage(scenesQuery.error, 'Could not load Palace scenes.')
      : null;

  return (
    <View style={styles.page}>
      <CommonHeader
        eyebrow="Memory Palace"
        title={fromSharedComposer ? 'Place your items' : 'Build a Memory Palace'}
        description={fromSharedComposer ? 'Choose a room, then place each item on a locus' : 'One scene · many memorable loci'}
        backAction={() => router.back()}
      />
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
        <View style={styles.infoCard}>
          <Text style={styles.infoEmoji}>🏡</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.infoTitle}>Keep the room. Place the memories.</Text>
            <Text style={styles.infoText}>Each numbered marker is a stable locus. Your words sit on top of one scene, so the journey stays connected.</Text>
          </View>
        </View>

        {fromSharedComposer && title.trim() ? (
          <View style={styles.draftCard}>
            <Text style={styles.draftEyebrow}>SESSION READY</Text>
            <Text numberOfLines={1} style={styles.draftTitle}>{title}</Text>
            <Text style={styles.draftMeta}>{items.length} items · Choose a scene to place them</Text>
          </View>
        ) : (
          <>
            <Text style={styles.label}>Name this memory <Text style={styles.optionalLabel}>optional</Text></Text>
            <TextInput value={title} onChangeText={setTitle} placeholder="e.g. Biology chapter 4" placeholderTextColor="#AAA7B5" style={styles.input} />
          </>
        )}

        <Text style={styles.label}>Choose your scene</Text>
        {scenesQuery.isLoading ? (
          <Text style={styles.helper}>Loading your scenes…</Text>
        ) : scenesQuery.data?.length ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.sceneRail}>
            {scenesQuery.data.map((scene) => {
              const active = scene.id === selectedSceneId;
              const fits = sceneFitsPalaceItems(scene, items.length);
              return (
                <AnimatedPressable
                  key={scene.id}
                  onPress={() => {
                    setSelectedSceneId(scene.id);
                    setMessage(
                      fits
                        ? null
                        : `This scene has ${scene.loci.length} loci. Remove ${items.length - scene.loci.length} item${items.length - scene.loci.length === 1 ? '' : 's'} or choose a larger scene.`
                    );
                  }}
                  style={[styles.sceneOption, active && styles.sceneOptionActive, !fits && styles.sceneOptionLimited]}>
                  <AppImage imageUrl={scene.imageUrl} style={styles.sceneThumb} />
                  <Text numberOfLines={1} style={styles.sceneName}>{scene.name}</Text>
                  <Text style={styles.sceneMeta}>
                    {scene.loci.length} loci{scene.isPremium ? ' · Premium' : ''}{!fits ? ' · Too small' : ''}
                  </Text>
                </AnimatedPressable>
              );
            })}
          </ScrollView>
        ) : (
          <View style={styles.emptyScenes}>
            <ImageIcon size={24} color={theme.inkSoft} />
            <Text style={styles.helper}>No published scenes yet. Add one in Admin, then refresh.</Text>
            <AnimatedPressable onPress={() => scenesQuery.refetch()} style={styles.refreshButton}><RefreshCcw size={15} color={theme.ink} /><Text style={styles.refreshText}>Refresh</Text></AnimatedPressable>
          </View>
        )}

        {selectedScene && (
          <>
            <View style={styles.previewHeader}>
              <View>
                <Text style={styles.previewEyebrow}>SCENE PREVIEW</Text>
                <Text style={styles.previewTitle}>{selectedScene.name}</Text>
              </View>
              <Text style={styles.previewCount}>{items.length}/{loci.length} placed</Text>
            </View>
            <View style={styles.canvas}>
              <AppImage imageUrl={selectedScene.imageUrl} style={StyleSheet.absoluteFillObject} />
              {loci.map((locus, index) => (
                <View
                  key={locus.id}
                  style={[
                    styles.marker,
                    index < items.length && styles.markerPlaced,
                    { left: `${locus.xPercent}%`, top: `${locus.yPercent}%` },
                  ]}>
                  <Text style={styles.markerText}>{index + 1}</Text>
                </View>
              ))}
            </View>
            <Text style={styles.canvasHint}>
              Markers show the order your memory will follow. Add an item to place it on the next marker.
            </Text>
            {capacityMessage && (
              <View style={styles.capacityCard}>
                <Text style={styles.capacityTitle}>This room needs more space</Text>
                <Text style={styles.capacityText}>{capacityMessage}</Text>
              </View>
            )}
          </>
        )}

        <View style={styles.labelRow}><Text style={styles.label}>Add your items</Text><Text style={styles.counter}>{items.length}/{loci.length || '—'}</Text></View>
        <View style={styles.addRow}>
          <TextInput value={newItem} onChangeText={setNewItem} onSubmitEditing={addItem} placeholder="A word, fact, name, or step" placeholderTextColor="#AAA7B5" style={[styles.input, { flex: 1 }]} />
          <AnimatedPressable accessibilityLabel="Add item" onPress={addItem} style={styles.addButton}><Plus size={21} color="white" /></AnimatedPressable>
        </View>
        {items.map((item, index) => (
          <View key={`${item}-${index}`} style={styles.itemRow}>
            <View style={styles.itemNumber}><Text style={styles.itemNumberText}>{index + 1}</Text></View>
            <View style={{ flex: 1 }}><Text style={styles.itemText}>{item}</Text><Text style={styles.locusText}>{loci[index]?.name ?? 'Choose a scene to assign a locus'}</Text></View>
            <AnimatedPressable accessibilityLabel={`Remove ${item}`} onPress={() => setItems((current) => current.filter((_, i) => i !== index))} style={styles.deleteButton}><Trash2 size={17} color={theme.inkSoft} /></AnimatedPressable>
          </View>
        ))}

        {(message || error) && <View style={styles.errorCard}><Text style={styles.errorText}>{message ?? error}</Text></View>}
        <AnimatedPressable disabled={createMemorySet.isPending} onPress={save} style={[styles.saveButton, createMemorySet.isPending && { opacity: 0.5 }]}>
          <Check size={19} color={theme.ink} /><Text style={styles.saveText}>{createMemorySet.isPending ? 'Saving…' : error ? 'Try saving again' : 'Save my Palace'}</Text><ArrowRight size={18} color={theme.ink} />
        </AnimatedPressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: theme.canvas }, content: { padding: 16, paddingBottom: 42 },
  infoCard: { flexDirection: 'row', gap: 12, borderRadius: 19, backgroundColor: '#EEE9FF', borderWidth: 1.5, borderColor: '#DCD4FF', padding: 14 },
  infoEmoji: { fontSize: 28 }, infoTitle: { color: theme.ink, fontSize: 14, fontWeight: '900' }, infoText: { color: theme.inkSoft, fontSize: 12, lineHeight: 18, marginTop: 3, fontWeight: '600' },
  draftCard: { borderRadius: 16, borderWidth: 1.5, borderColor: '#FFE6A3', backgroundColor: '#FFF7E0', padding: 13 }, draftEyebrow: { color: theme.sunDeep, fontSize: 10, fontWeight: '900', letterSpacing: 0.8 }, draftTitle: { color: theme.ink, fontSize: 16, fontWeight: '900', marginTop: 4 }, draftMeta: { color: theme.inkSoft, fontSize: 11, fontWeight: '700', marginTop: 3 },
  label: { color: theme.ink, fontSize: 13, fontWeight: '900', marginTop: 18, marginBottom: 8 }, optionalLabel: { color: theme.inkSoft, fontSize: 11, fontWeight: '700' }, labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, counter: { color: '#7A68E0', fontSize: 12, fontWeight: '900', marginTop: 18 },
  input: { minHeight: 50, borderRadius: 14, borderWidth: 2, borderColor: theme.line, backgroundColor: 'white', paddingHorizontal: 14, color: theme.ink, fontSize: 14, fontWeight: '700' },
  sceneRail: { marginHorizontal: -16, paddingLeft: 16 }, sceneOption: { width: 172, borderRadius: 18, borderWidth: 2, borderColor: theme.line, backgroundColor: theme.paper, padding: 8, marginRight: 10 }, sceneOptionActive: { borderColor: '#7A68E0', backgroundColor: '#F7F5FF' }, sceneOptionLimited: { opacity: 0.72 }, sceneThumb: { height: 92, borderRadius: 12 }, sceneName: { color: theme.ink, fontSize: 13, fontWeight: '900', marginTop: 8 }, sceneMeta: { color: theme.inkSoft, fontSize: 10, fontWeight: '700', marginTop: 2 },
  previewHeader: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 19, marginBottom: 9 }, previewEyebrow: { color: theme.violetDeep, fontSize: 10, fontWeight: '900', letterSpacing: 0.9 }, previewTitle: { color: theme.ink, fontSize: 15, fontWeight: '900', marginTop: 3 }, previewCount: { color: theme.violetDeep, backgroundColor: '#EEE9FF', borderRadius: 999, paddingHorizontal: 9, paddingVertical: 5, fontSize: 10, fontWeight: '900' },
  canvas: { height: 250, borderRadius: 22, overflow: 'hidden', marginTop: 0, borderWidth: 2, borderColor: '#DCD4FF', backgroundColor: '#EAE5D8' }, canvasHint: { color: theme.inkSoft, fontSize: 11, lineHeight: 17, fontWeight: '700', textAlign: 'center', marginTop: 8 }, capacityCard: { marginTop: 11, borderRadius: 14, borderWidth: 1.5, borderColor: '#FFE6A3', backgroundColor: '#FFF7E0', padding: 12 }, capacityTitle: { color: theme.ink, fontSize: 12, fontWeight: '900' }, capacityText: { color: theme.inkSoft, fontSize: 11, lineHeight: 17, fontWeight: '700', marginTop: 3 }, marker: { position: 'absolute', width: 32, height: 32, marginLeft: -16, marginTop: -16, borderRadius: 16, backgroundColor: '#9B8CFF', borderWidth: 3, borderColor: 'white', alignItems: 'center', justifyContent: 'center', shadowColor: '#241F38', shadowOpacity: 0.3, shadowRadius: 4, elevation: 4 }, markerPlaced: { backgroundColor: theme.sunDeep }, markerText: { color: 'white', fontSize: 12, fontWeight: '900' },
  emptyScenes: { borderWidth: 2, borderColor: theme.line, borderRadius: 18, backgroundColor: theme.paper, padding: 18, alignItems: 'center' }, helper: { color: theme.inkSoft, fontSize: 12, lineHeight: 18, textAlign: 'center' }, refreshButton: { marginTop: 10, flexDirection: 'row', gap: 6, backgroundColor: theme.sun, borderRadius: 11, paddingHorizontal: 12, paddingVertical: 8 }, refreshText: { color: theme.ink, fontSize: 12, fontWeight: '900' },
  addRow: { flexDirection: 'row', gap: 9 }, addButton: { width: 50, height: 50, borderRadius: 14, backgroundColor: theme.ink, alignItems: 'center', justifyContent: 'center' },
  itemRow: { minHeight: 62, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: theme.line }, itemNumber: { width: 29, height: 29, borderRadius: 15, backgroundColor: '#9B8CFF', alignItems: 'center', justifyContent: 'center' }, itemNumberText: { color: 'white', fontSize: 11, fontWeight: '900' }, itemText: { color: theme.ink, fontSize: 13, fontWeight: '900', marginLeft: 11 }, locusText: { color: theme.inkSoft, fontSize: 10, fontWeight: '700', marginLeft: 11, marginTop: 2 }, deleteButton: { width: 39, height: 39, alignItems: 'center', justifyContent: 'center' },
  errorCard: { marginTop: 14, borderRadius: 14, backgroundColor: '#FFF0F4', borderWidth: 1.5, borderColor: '#FFD2DC', padding: 12 }, errorText: { color: '#B53A5F', fontSize: 12, lineHeight: 18, fontWeight: '800', textAlign: 'center' },
  saveButton: { minHeight: 53, marginTop: 20, borderRadius: 16, backgroundColor: theme.sun, flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center', shadowColor: theme.sunDeep, shadowOffset: { width: 0, height: 5 }, shadowOpacity: 1, shadowRadius: 0, elevation: 3 }, saveText: { color: theme.ink, fontSize: 14, fontWeight: '900' },
});
