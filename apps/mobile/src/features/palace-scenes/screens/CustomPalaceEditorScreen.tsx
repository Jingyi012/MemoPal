import AnimatedPressable from '@/components/AnimatedPressable';
import { AppImage } from '@/components/AppImage';
import { CommonHeader } from '@/components/CommonHeader';
import { mediaApi } from '@/core/api/media';
import { useFeatureLimits } from '@/features/subscription/hooks/useFeatureLimits';
import { useCurrentUser } from '@/features/profile/hooks/useCurrentUser';
import { usePalaceSceneMutations } from '@/features/palace-scenes/hooks/usePalaceSceneMutations';
import { usePalaceScene } from '@/features/palace-scenes/hooks/usePalaceScenes';
import {
  clearCustomPalaceDraft,
  readCustomPalaceDraft,
  writeCustomPalaceDraft,
} from '@/features/palace-scenes/services/customPalaceDraft';
import type { PalaceLocusInput } from '@/features/palace-scenes/types/palaceScene.types';
import { numberPegTheme as theme } from '@/features/number-peg/constants/numberPegTheme';
import { typography } from '@/theme/typography';
import { firstParam } from '@/features/memory-composer/utils/composerParams';
import { Href, useLocalSearchParams, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useTranslation } from '@/core/i18n/useTranslation';
import { Check, Plus, Trash2 } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type GestureResponderEvent,
} from 'react-native';

type CanvasSize = { width: number; height: number };

export default function CustomPalaceEditorScreen() {
  const { t } = useTranslation('palace');
  const router = useRouter();
  const params = useLocalSearchParams<{ sceneId?: string | string[] }>();
  const sceneId = firstParam(params.sceneId);
  const sceneQuery = usePalaceScene(sceneId ?? '');
  const { user } = useCurrentUser();
  const { limits } = useFeatureLimits();
  const { createCustom, updateCustom } = usePalaceSceneMutations();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [imageUri, setImageUri] = useState('');
  const [loci, setLoci] = useState<PalaceLocusInput[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [canvasSize, setCanvasSize] = useState<CanvasSize>({ width: 1, height: 1 });
  const [message, setMessage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [hydratedSceneId, setHydratedSceneId] = useState<string | null>(null);
  const [draftHydrated, setDraftHydrated] = useState(Boolean(sceneId));

  useEffect(() => {
    if (!sceneQuery.data || hydratedSceneId === sceneQuery.data.id) return;
    const scene = sceneQuery.data;
    setName(scene.name);
    setDescription(scene.description);
    setImageUri(scene.imageUrl);
    setLoci(
      scene.loci.map(
        ({
          id,
          position,
          name: locusName,
          description: locusDescription,
          xPercent,
          yPercent,
          radiusPercent,
        }) => ({
          id,
          position,
          name: locusName,
          description: locusDescription ?? undefined,
          xPercent,
          yPercent,
          radiusPercent,
        })
      )
    );
    setHydratedSceneId(scene.id);
  }, [hydratedSceneId, sceneQuery.data]);

  useEffect(() => {
    if (sceneId || !user?.id || draftHydrated) return;
    void readCustomPalaceDraft(user.id).then((draft) => {
      if (draft) {
        setName(draft.name);
        setDescription(draft.description);
        setImageUri(draft.imageUri);
        setLoci(draft.loci);
        setMessage('Your unfinished Palace draft was restored.');
      }
      setDraftHydrated(true);
    });
  }, [draftHydrated, sceneId, user?.id]);

  useEffect(() => {
    if (sceneId || !user?.id || !draftHydrated) return;
    const hasDraft = Boolean(name.trim() || description.trim() || imageUri || loci.length);
    if (!hasDraft) return;
    const timer = setTimeout(() => {
      void writeCustomPalaceDraft(user.id, { name, description, imageUri, loci });
    }, 400);
    return () => clearTimeout(timer);
  }, [description, draftHydrated, imageUri, loci, name, sceneId, user?.id]);

  const maxLoci = Math.max(1, limits.customLocationsPerPalace);
  const canCreate = limits.customPalaces > 0;
  const canSave = canCreate || Boolean(sceneId);

  const chooseImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setMessage(
        'Photo access is needed to use a Palace image. You can enable it in device settings.'
      );
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.82,
      aspect: [16, 10],
    });
    if (result.canceled || !result.assets?.[0]?.uri) return;
    setImageUri(result.assets[0].uri);
    setMessage(null);
  };

  const placeLocus = (event: GestureResponderEvent) => {
    if (!imageUri) {
      setMessage('Choose a photo first, then tap memorable spots on it.');
      return;
    }
    const xPercent = Math.max(
      0,
      Math.min(100, (event.nativeEvent.locationX / canvasSize.width) * 100)
    );
    const yPercent = Math.max(
      0,
      Math.min(100, (event.nativeEvent.locationY / canvasSize.height) * 100)
    );
    if (selectedIndex === loci.length) {
      if (loci.length >= maxLoci) {
        setMessage(`Your plan allows up to ${maxLoci} loci in this Palace.`);
        return;
      }
      const nextIndex = loci.length;
      setLoci((current) => [
        ...current,
        {
          position: nextIndex + 1,
          name: `Spot ${nextIndex + 1}`,
          xPercent,
          yPercent,
          radiusPercent: 7,
        },
      ]);
      setSelectedIndex(nextIndex);
      setMessage(null);
      return;
    }
    if (selectedIndex === null || !loci[selectedIndex]) return;
    setLoci((current) =>
      current.map((locus, index) =>
        index === selectedIndex ? { ...locus, xPercent, yPercent } : locus
      )
    );
    setMessage(null);
  };

  const addLocus = () => {
    if (loci.length >= maxLoci) {
      setMessage(`Your plan allows up to ${maxLoci} loci in this Palace.`);
      return;
    }
    if (!imageUri) {
      setMessage('Choose a photo first, then tap memorable spots on it.');
      return;
    }
    setSelectedIndex(loci.length);
    setMessage('Now tap the next memorable spot on your image.');
  };

  const removeLocus = (index: number) => {
    setLoci((current) =>
      current
        .filter((_, locusIndex) => locusIndex !== index)
        .map((locus, locusIndex) => ({ ...locus, position: locusIndex + 1 }))
    );
    setSelectedIndex((current) => {
      if (current === null) return null;
      if (current === index) return null;
      return current > index ? current - 1 : current;
    });
  };

  const save = async () => {
    if (!canSave) {
      router.push('/premium' as Href);
      return;
    }
    if (!name.trim()) return setMessage('Give this Palace a name first.');
    if (!imageUri) return setMessage('Choose a photo for your Palace.');
    if (!loci.length) return setMessage('Tap at least one memorable spot on your image.');

    setIsUploading(true);
    setMessage(null);
    try {
      const fileName = imageUri.split('/').pop() || 'palace.jpg';
      const imageUrl = /^(file:|content:|blob:|data:)/i.test(imageUri)
        ? await mediaApi.uploadImage(imageUri, fileName, 'palace')
        : imageUri;
      const request = {
        name: name.trim(),
        description: description.trim(),
        imageUrl,
        status: 'published',
        isPremium: false,
        loci,
        ...(sceneQuery.data ? { expectedVersion: sceneQuery.data.version } : {}),
      } as const;
      const scene = sceneId
        ? await updateCustom.mutateAsync({ sceneId, request })
        : await createCustom.mutateAsync(request);
      if (user?.id && !sceneId) await clearCustomPalaceDraft(user.id);
      if (sceneId) {
        router.back();
        return;
      }
      router.replace({ pathname: '/palaces/create-memory', params: { sceneId: scene.id } });
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not save your Palace. Try again.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.page}>
      <CommonHeader
        eyebrow={t('custom')}
        title={sceneId ? t('tune') : t('makePlace')}
        description={t('description')}
        backAction={() => router.back()}
      />
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <View style={styles.privacyCard}>
          <Text style={styles.privacyEmoji}>🔒</Text>
          <View style={styles.flex}>
            <Text style={styles.privacyTitle}>{t('privateDefault')}</Text>
            <Text style={styles.privacyBody}>
              Your image is used only for your Palace. Avoid faces, addresses, or school details.
            </Text>
          </View>
        </View>

        {!canSave ? (
          <View style={styles.upgradeCard}>
            <View style={styles.upgradeIcon}>
              <Text style={styles.upgradeEmoji}>👑</Text>
            </View>
            <Text style={styles.upgradeTitle}>{t('customPremium')}</Text>
            <Text style={styles.upgradeBody}>
              Use the starter scenes for free, or unlock your own photo-based routes.
            </Text>
            <AnimatedPressable
              onPress={() => router.push('/premium' as Href)}
              style={styles.upgradeButton}>
              <Text style={styles.upgradeButtonText}>{t('seePremium')}</Text>
            </AnimatedPressable>
          </View>
        ) : null}

        <Text style={styles.label}>{t('namePalace')}</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          maxLength={200}
          placeholder="e.g. Grandma's kitchen"
          placeholderTextColor="#AAA7B5"
          style={styles.input}
        />
        <Text style={styles.label}>
          {t('shortDescription')} <Text style={styles.optional}>{t('optional')}</Text>
        </Text>
        <TextInput
          value={description}
          onChangeText={setDescription}
          maxLength={1000}
          multiline
          placeholder={t('familiarPrompt')}
          placeholderTextColor="#AAA7B5"
          style={[styles.input, styles.descriptionInput]}
        />

        <Text style={styles.label}>{t('sceneImage')}</Text>
        <AnimatedPressable onPress={chooseImage} style={styles.imageButton}>
          {imageUri ? (
            <AppImage source={{ uri: imageUri }} style={styles.imagePreview} />
          ) : (
            <>
              <Text style={styles.imageButtonEmoji}>🖼️</Text>
              <Text style={styles.imageButtonTitle}>{t('choosePhoto')}</Text>
              <Text style={styles.imageButtonBody}>
                A room, route, desk, or any place you know well
              </Text>
            </>
          )}
        </AnimatedPressable>

        <View style={styles.locusHeading}>
          <View style={styles.flex}>
            <Text style={styles.label}>{t('setupLoci')}</Text>
            <Text style={styles.helper}>
              Select a marker, then tap the image to move it. Add a new marker for another memorable
              spot.
            </Text>
          </View>
          <Text style={styles.counter}>
            {loci.length}/{maxLoci}
          </Text>
        </View>
        <View
          onLayout={(event) =>
            setCanvasSize({
              width: event.nativeEvent.layout.width,
              height: event.nativeEvent.layout.height,
            })
          }
          style={styles.canvas}>
          {imageUri ? (
            <Pressable onPress={placeLocus} style={StyleSheet.absoluteFillObject}>
              <AppImage source={{ uri: imageUri }} style={StyleSheet.absoluteFillObject} />
            </Pressable>
          ) : (
            <View style={styles.canvasEmpty}>
              <Text style={styles.canvasEmptyEmoji}>🗺️</Text>
              <Text style={styles.canvasEmptyText}>{t('lociOnPhoto')}</Text>
            </View>
          )}
          {loci.map((locus, index) => (
            <Pressable
              key={locus.id ?? index}
              accessibilityLabel={`Locus ${index + 1}: ${locus.name}`}
              onPress={(event) => {
                event.stopPropagation();
                setSelectedIndex(index);
              }}
              style={[
                styles.marker,
                { left: `${locus.xPercent}%`, top: `${locus.yPercent}%` },
                selectedIndex === index && styles.markerActive,
              ]}>
              <Text style={styles.markerText}>{index + 1}</Text>
            </Pressable>
          ))}
        </View>
        <AnimatedPressable onPress={addLocus} style={styles.addLocusButton}>
          <Plus size={17} color={theme.violetDeep} />
          <Text style={styles.addLocusText}>
            {selectedIndex === loci.length ? 'Tap the image to place it' : 'Add a locus'}
          </Text>
        </AnimatedPressable>
        <Text style={styles.canvasMode}>
          {selectedIndex === loci.length
            ? 'Adding a new locus · tap the image'
            : selectedIndex !== null
              ? `Moving locus ${selectedIndex + 1} · tap the image`
              : 'Select a marker to edit its position'}
        </Text>

        <View style={styles.locusList}>
          {loci.map((locus, index) => (
            <View
              key={locus.id ?? index}
              style={[styles.locusRow, selectedIndex === index && styles.locusRowActive]}>
              <View style={styles.locusNumber}>
                <Text style={styles.locusNumberText}>{index + 1}</Text>
              </View>
              <TextInput
                value={locus.name}
                onChangeText={(value) =>
                  setLoci((current) =>
                    current.map((entry, entryIndex) =>
                      entryIndex === index ? { ...entry, name: value } : entry
                    )
                  )
                }
                onFocus={() => setSelectedIndex(index)}
                placeholder={t('spotName')}
                placeholderTextColor="#AAA7B5"
                style={styles.locusInput}
              />
              <AnimatedPressable
                accessibilityLabel={`Remove locus ${index + 1}`}
                onPress={() => removeLocus(index)}
                style={styles.deleteButton}>
                <Trash2 size={17} color={theme.inkSoft} />
              </AnimatedPressable>
            </View>
          ))}
        </View>

        {message ? (
          <View style={styles.messageCard}>
            <Text style={styles.messageText}>{message}</Text>
          </View>
        ) : null}
        <AnimatedPressable
          disabled={isUploading || createCustom.isPending || updateCustom.isPending}
          onPress={save}
          style={[
            styles.saveButton,
            (isUploading || createCustom.isPending || updateCustom.isPending) && styles.disabled,
          ]}>
          <Check size={19} color={theme.ink} />
          <Text style={styles.saveText}>
            {isUploading
              ? 'Uploading image…'
              : createCustom.isPending || updateCustom.isPending
                ? 'Saving…'
                : canSave
                  ? sceneId
                    ? 'Save Palace changes'
                    : 'Save my Palace'
                  : 'Unlock custom Palaces'}
          </Text>
        </AnimatedPressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: theme.canvas },
  content: { padding: 16, paddingBottom: 44 },
  flex: { flex: 1 },
  privacyCard: {
    flexDirection: 'row',
    gap: 10,
    borderRadius: 17,
    borderWidth: 1.5,
    borderColor: '#BFE7D6',
    backgroundColor: '#EAF9F1',
    padding: 13,
  },
  privacyEmoji: { fontSize: 22 },
  privacyTitle: { color: '#247B67', fontFamily: typography.bodyExtraBold, fontSize: 13 },
  privacyBody: {
    color: '#3E7769',
    fontFamily: typography.bodyBold,
    fontSize: 11,
    lineHeight: 16,
    marginTop: 3,
  },
  upgradeCard: {
    marginTop: 14,
    borderRadius: 19,
    borderWidth: 1.5,
    borderColor: '#FFE6A3',
    backgroundColor: '#FFF7E0',
    padding: 15,
    alignItems: 'center',
  },
  upgradeIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  upgradeEmoji: { fontSize: 20 },
  upgradeTitle: {
    color: theme.ink,
    fontFamily: typography.bodyExtraBold,
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
  },
  upgradeBody: {
    color: theme.inkSoft,
    fontFamily: typography.bodyBold,
    fontSize: 12,
    lineHeight: 17,
    textAlign: 'center',
    marginTop: 3,
  },
  upgradeButton: {
    minHeight: 38,
    borderRadius: 11,
    backgroundColor: theme.ink,
    paddingHorizontal: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 11,
  },
  upgradeButtonText: { color: 'white', fontFamily: typography.bodyExtraBold, fontSize: 12 },
  label: {
    color: theme.ink,
    fontFamily: typography.bodyExtraBold,
    fontSize: 13,
    marginTop: 18,
    marginBottom: 8,
  },
  optional: { color: theme.inkSoft, fontFamily: typography.bodyBold, fontSize: 11 },
  input: {
    minHeight: 50,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: theme.line,
    backgroundColor: 'white',
    paddingHorizontal: 14,
    color: theme.ink,
    fontFamily: typography.bodySemibold,
    fontSize: 14,
  },
  descriptionInput: { minHeight: 76, paddingTop: 12, textAlignVertical: 'top' },
  imageButton: {
    width: '100%',
    height: 185,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#DCD4FF',
    borderStyle: 'dashed',
    backgroundColor: '#F7F5FF',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  imagePreview: { ...StyleSheet.absoluteFillObject },
  imageButtonTitle: {
    color: theme.violetDeep,
    fontFamily: typography.bodyExtraBold,
    fontSize: 14,
    marginTop: 8,
  },
  imageButtonEmoji: { fontSize: 28 },
  imageButtonBody: {
    color: theme.inkSoft,
    fontFamily: typography.bodyBold,
    fontSize: 11,
    marginTop: 3,
  },
  locusHeading: { flexDirection: 'row', alignItems: 'flex-end', marginTop: 5 },
  helper: { color: theme.inkSoft, fontFamily: typography.bodyBold, fontSize: 11, lineHeight: 16 },
  counter: {
    color: theme.violetDeep,
    backgroundColor: '#EEE9FF',
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 5,
    fontFamily: typography.bodyExtraBold,
    fontSize: 11,
  },
  canvas: {
    height: 240,
    marginTop: 5,
    borderRadius: 21,
    borderWidth: 2,
    borderColor: '#DCD4FF',
    overflow: 'hidden',
    backgroundColor: '#EEE9FF',
  },
  canvasEmpty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  canvasEmptyText: { color: theme.violetDeep, fontFamily: typography.bodyExtraBold, fontSize: 12 },
  canvasEmptyEmoji: { fontSize: 24 },
  canvasMode: {
    color: theme.violetDeep,
    fontFamily: typography.bodyBold,
    fontSize: 11,
    textAlign: 'center',
    marginTop: 7,
  },
  marker: {
    position: 'absolute',
    width: 34,
    height: 34,
    marginLeft: -17,
    marginTop: -17,
    borderRadius: 17,
    borderWidth: 3,
    borderColor: 'white',
    backgroundColor: '#9B8CFF',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0px 2px 4px rgba(36, 31, 56, 0.25)',
  },
  markerActive: { backgroundColor: theme.sunDeep, borderWidth: 4, transform: [{ scale: 1.12 }] },
  markerText: { color: 'white', fontFamily: typography.bodyExtraBold, fontSize: 12 },
  addLocusButton: {
    width: '100%',
    minHeight: 44,
    borderRadius: 13,
    borderWidth: 1.5,
    borderColor: '#DCD4FF',
    backgroundColor: '#F7F5FF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    marginTop: 9,
  },
  addLocusText: { color: theme.violetDeep, fontFamily: typography.bodyExtraBold, fontSize: 12 },
  locusList: { marginTop: 8, gap: 7 },
  locusRow: {
    minHeight: 54,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: theme.line,
    backgroundColor: theme.paper,
    paddingHorizontal: 9,
  },
  locusRowActive: { borderColor: '#9B8CFF', backgroundColor: '#F7F5FF' },
  locusNumber: {
    width: 27,
    height: 27,
    borderRadius: 14,
    backgroundColor: '#9B8CFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  locusNumberText: { color: 'white', fontFamily: typography.bodyExtraBold, fontSize: 11 },
  locusInput: {
    flex: 1,
    minHeight: 42,
    color: theme.ink,
    fontFamily: typography.bodyExtraBold,
    fontSize: 13,
  },
  deleteButton: {
    width: 38,
    height: 38,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  messageCard: {
    marginTop: 13,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#FFD2DC',
    backgroundColor: '#FFF0F4',
    padding: 12,
  },
  messageText: {
    color: '#B53A5F',
    fontFamily: typography.bodyExtraBold,
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
  },
  saveButton: {
    width: '100%',
    minHeight: 54,
    marginTop: 18,
    borderRadius: 16,
    backgroundColor: theme.sun,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    boxShadow: `0px 5px 0px ${theme.sunDeep}`,
  },
  saveText: { color: theme.ink, fontFamily: typography.bodyExtraBold, fontSize: 14 },
  disabled: { opacity: 0.55 },
});
