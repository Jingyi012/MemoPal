import AnimatedPressable from '@/components/AnimatedPressable';
import { CommonHeader } from '@/components/CommonHeader';
import { useTranslation } from '@/core/i18n/useTranslation';
import { memopalTheme as theme } from '@/theme/memopalTheme';
import { typography } from '@/theme/typography';
import { Camera, Check, Images, Plus, RefreshCcw, ScanText } from '@/core/icons';
import * as ImagePicker from 'expo-image-picker';
import { Href, useLocalSearchParams, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  extractMemoryItems,
  MAX_OCR_ITEMS,
  OcrError,
  parseOcrReviewText,
  recognizeMemoryPhoto,
  type OcrItem,
} from '../utils/ocr';
import { consumeOcrDraft, saveOcrDraft, type OcrDraft } from '../utils/ocrDraftStore';
import { translations } from '@/core/i18n/i18n';
import { firstParam } from '../utils/composerParams';
import { DraggableMemoryItemRow, MemoryItemReorderProvider } from '../components/DraggableMemoryItemRow';
import { ScanPhotoPreview } from '../components/ScanPhotoPreview';
import { reorderItems } from '../utils/reorderItems';

type ScanPhase = 'choose' | 'processing' | 'review';
type EditableOcrItem = OcrItem & { id: string };

let nextOcrItemId = 0;
const makeEditableItem = (item: OcrItem): EditableOcrItem => ({
  ...item,
  id: `ocr-item-${++nextOcrItemId}`,
});

export default function ScanMemoryScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ sourceDraftId?: string | string[] }>();
  const { t } = useTranslation('memoryComposer');
  const [phase, setPhase] = useState<ScanPhase>('choose');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [items, setItems] = useState<EditableOcrItem[]>([]);
  const [quickEditText, setQuickEditText] = useState('');
  const [reviewMode, setReviewMode] = useState<'quick' | 'items'>('quick');
  const [message, setMessage] = useState<string | null>(null);
  const [sourceDraft, setSourceDraft] = useState<OcrDraft | null>(null);
  const [isReordering, setIsReordering] = useState(false);

  useEffect(() => {
    setSourceDraft(consumeOcrDraft(firstParam(params.sourceDraftId)));
  }, [params.sourceDraftId]);

  const runOcr = async (uri: string) => {
    setMessage(null);
    setPhase('processing');
    try {
      const recognition = await recognizeMemoryPhoto(uri);
      const recognizedItems = extractMemoryItems(recognition);
      setItems(recognizedItems.map(makeEditableItem));
      setQuickEditText(recognizedItems.map((item) => item.value).join('\n'));
      setReviewMode('quick');
      setPhase('review');
      if (!recognizedItems.length) setMessage(t('scanNoText'));
    } catch (error) {
      setPhase('choose');
      if (error instanceof OcrError) {
        setMessage(
          error.code === 'native-missing'
            ? t('scanNativeUnavailable')
            : error.code === 'unsupported'
              ? t('scanUnsupported')
              : t('scanFailed')
        );
      } else {
        setMessage(t('scanFailed'));
      }
    }
  };

  const choosePhoto = async (source: 'camera' | 'library') => {
    setMessage(null);
    try {
      const permission =
        source === 'camera'
          ? await ImagePicker.requestCameraPermissionsAsync()
          : await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        setMessage(t('scanPermission'));
        return;
      }

      const result =
        source === 'camera'
          ? await ImagePicker.launchCameraAsync({
              mediaTypes: ['images'],
              allowsEditing: true,
              quality: 0.85,
            })
          : await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ['images'],
              allowsEditing: true,
              quality: 0.85,
            });
      const asset = result.canceled ? null : result.assets?.[0];
      if (!asset?.uri) return;

      setImageUri(asset.uri);
      await runOcr(asset.uri);
    } catch {
      setPhase('choose');
      setMessage(t('scanFailed'));
    }
  };

  const updateItem = (index: number, value: string) => {
    setItems((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index ? { ...item, value, needsReview: false } : item
      )
    );
  };

  const removeItem = (index: number) => {
    setItems((current) => current.filter((_, itemIndex) => itemIndex !== index));
  };

  const addItem = () => {
    if (items.length >= MAX_OCR_ITEMS) {
      setMessage(t('maxItemsMessage'));
      return;
    }
    setItems((current) => [...current, makeEditableItem({ value: '', needsReview: true })]);
    setMessage(null);
  };

  const moveItem = (from: number, to: number) => {
    setItems((current) => reorderItems(current, from, to));
  };

  const useItems = () => {
    const cleanedItems = reviewMode === 'quick'
      ? parseOcrReviewText(quickEditText)
      : items.map((item) => item.value.trim()).filter(Boolean);
    if (!cleanedItems.length) {
      setMessage(t('scanNoItems'));
      return;
    }
    const existingItems = sourceDraft?.items ?? [];
    const seen = new Set<string>();
    const mergedItems = [...existingItems, ...cleanedItems]
      .map((item) => item.trim())
      .filter((item) => {
        const key = item.normalize('NFKC').toLocaleLowerCase();
        if (!key || seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .slice(0, MAX_OCR_ITEMS);
    const draftId = saveOcrDraft(mergedItems, {
      title: sourceDraft?.title,
      goalType: sourceDraft?.goalType,
    });
    router.replace(`/create-memory?ocrDraftId=${encodeURIComponent(draftId)}` as Href);
  };

  const handleBack = () => {
    if (phase === 'review') {
      setPhase('choose');
      return;
    }

    // A scan route can also be opened from a deep link or a notification,
    // where there is no previous screen in the navigation stack.
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/create-memory' as Href);
    }
  };

  const title =
    phase === 'choose'
      ? t('scanTitle')
      : phase === 'processing'
        ? t('scanProcessingTitle')
        : t('scanReviewTitle');
  const description =
    phase === 'choose'
      ? t('scanDescription')
      : phase === 'processing'
        ? t('scanProcessingBody')
        : t('scanReviewBody');

  return (
    <KeyboardAvoidingView
      style={styles.page}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <CommonHeader
        eyebrow={t('scanEyebrow')}
        title={title}
        description={description}
        backAction={handleBack}
      />
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        scrollEnabled={!isReordering}
        showsVerticalScrollIndicator={false}>
        {phase === 'choose' ? (
          <ChoosePhotoState
            imageUri={imageUri}
            message={message}
            onCamera={() => void choosePhoto('camera')}
            onLibrary={() => void choosePhoto('library')}
            onRetry={() => imageUri && void runOcr(imageUri)}
            t={t}
          />
        ) : phase === 'processing' ? (
          <ProcessingState imageUri={imageUri} t={t} />
        ) : (
          <ReviewState
            imageUri={imageUri}
            items={items}
            quickEditText={quickEditText}
            reviewMode={reviewMode}
            message={message}
            onChange={updateItem}
            onRemove={removeItem}
            onMove={moveItem}
            onDragStateChange={setIsReordering}
            onAdd={addItem}
            onQuickEditChange={setQuickEditText}
            onReviewModeChange={(mode) => {
              if (mode === 'items') {
                setItems(parseOcrReviewText(quickEditText).map((value, index) => {
                  const previous = items[index];
                  return previous
                    ? { ...previous, value, needsReview: previous.value === value && previous.needsReview }
                    : makeEditableItem({ value, needsReview: false });
                }));
              } else {
                setQuickEditText(items.map((item) => item.value).join('\n'));
              }
              setReviewMode(mode);
            }}
            onUse={useItems}
            onRetake={() => void choosePhoto('camera')}
            t={t}
          />
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

type Translation = (key: keyof typeof translations.en.memoryComposer) => string;

function ChoosePhotoState({
  imageUri,
  message,
  onCamera,
  onLibrary,
  onRetry,
  t,
}: {
  imageUri: string | null;
  message: string | null;
  onCamera: () => void;
  onLibrary: () => void;
  onRetry: () => void;
  t: Translation;
}) {
  return (
    <>
      <View style={styles.heroCard}>
        <View style={styles.heroIcon}>
          <ScanText size={27} color={theme.violetDeep} strokeWidth={2.2} />
        </View>
        <Text style={styles.heroTitle}>{t('scanCardTitle')}</Text>
        <Text style={styles.heroBody}>{t('scanCardBody')}</Text>
        <View style={styles.tipRow}>
          <Text style={styles.tipEmoji}>💡</Text>
          <Text style={styles.tipText}>{t('scanTip')}</Text>
        </View>
      </View>

      {imageUri ? (
        <View style={styles.previewCard}>
          <Image
            source={{ uri: imageUri }}
            contentFit="contain"
            style={styles.previewImage}
          />
          <View style={styles.previewActions}>
            <Text style={styles.previewLabel}>{t('scanTryAgain')}</Text>
            <AnimatedPressable onPress={onRetry} style={styles.smallAction}>
              <RefreshCcw size={15} color={theme.inkSoft} />
              <Text style={styles.smallActionText}>{t('scanRetry')}</Text>
            </AnimatedPressable>
          </View>
        </View>
      ) : null}

      {message ? <MessageCard message={message} /> : null}

      <AnimatedPressable onPress={onCamera} style={styles.primaryButton}>
        <Camera size={19} color={theme.ink} />
        <Text style={styles.primaryButtonText}>{t('scanTakePhoto')}</Text>
      </AnimatedPressable>
      <AnimatedPressable onPress={onLibrary} style={styles.secondaryButton}>
        <Images size={19} color={theme.inkSoft} strokeWidth={2.2} />
        <Text style={styles.secondaryButtonText}>{t('scanChoosePhoto')}</Text>
      </AnimatedPressable>
      <Text style={styles.privacyNote}>{t('scanPrivacy')}</Text>
    </>
  );
}

function ProcessingState({ imageUri, t }: { imageUri: string | null; t: Translation }) {
  return (
    <View style={styles.processingCard}>
      {imageUri ? (
        <Image source={{ uri: imageUri }} contentFit="contain" style={styles.processingImage} />
      ) : null}
      <View style={styles.processingSpinner}>
        <ActivityIndicator size="large" color={theme.violetDeep} />
      </View>
      <Text style={styles.processingTitle}>{t('scanProcessingTitle')}</Text>
      <Text style={styles.processingBody}>{t('scanProcessingBody')}</Text>
    </View>
  );
}

function ReviewState({
  imageUri,
  items,
  quickEditText,
  reviewMode,
  message,
  onChange,
  onRemove,
  onMove,
  onDragStateChange,
  onAdd,
  onQuickEditChange,
  onReviewModeChange,
  onUse,
  onRetake,
  t,
}: {
  imageUri: string | null;
  items: EditableOcrItem[];
  quickEditText: string;
  reviewMode: 'quick' | 'items';
  message: string | null;
  onChange: (index: number, value: string) => void;
  onRemove: (index: number) => void;
  onMove: (from: number, to: number) => void;
  onDragStateChange: (dragging: boolean) => void;
  onAdd: () => void;
  onQuickEditChange: (value: string) => void;
  onReviewModeChange: (mode: 'quick' | 'items') => void;
  onUse: () => void;
  onRetake: () => void;
  t: Translation;
}) {
  const visibleItemCount = reviewMode === 'quick'
    ? parseOcrReviewText(quickEditText).length
    : items.length;

  return (
    <>
      {imageUri ? (
        <ScanPhotoPreview
          imageUri={imageUri}
          openLabel={t('scanOpenPhoto')}
          closeLabel={t('scanClosePhoto')}
        />
      ) : null}
      <View style={styles.reviewIntro}>
        <View style={styles.reviewIcon}>
          <Check size={21} color={theme.grass} strokeWidth={3} />
        </View>
        <View style={styles.reviewCopy}>
          <Text style={styles.reviewTitle}>{t('scanReviewHeading')}</Text>
          <Text style={styles.reviewBody}>{reviewMode === 'quick' ? t('scanQuickEditHint') : t('scanReviewHint')}</Text>
        </View>
        <View style={styles.countBadge}>
          <Text style={styles.countBadgeText}>
            {t('scanReviewCount').replace('{count}', String(visibleItemCount)).replace('{max}', String(MAX_OCR_ITEMS))}
          </Text>
        </View>
      </View>

      {message ? <MessageCard message={message} /> : null}

      <View style={styles.reviewModeSwitch} accessibilityRole="tablist">
        <AnimatedPressable
          accessibilityRole="tab"
          accessibilityState={{ selected: reviewMode === 'quick' }}
          onPress={() => onReviewModeChange('quick')}
          style={[styles.reviewModeButton, reviewMode === 'quick' && styles.reviewModeButtonSelected]}>
          <Text style={[styles.reviewModeText, reviewMode === 'quick' && styles.reviewModeTextSelected]}>{t('scanQuickEdit')}</Text>
        </AnimatedPressable>
        <AnimatedPressable
          accessibilityRole="tab"
          accessibilityState={{ selected: reviewMode === 'items' }}
          onPress={() => onReviewModeChange('items')}
          style={[styles.reviewModeButton, reviewMode === 'items' && styles.reviewModeButtonSelected]}>
          <Text style={[styles.reviewModeText, reviewMode === 'items' && styles.reviewModeTextSelected]}>{t('scanItemEdit')}</Text>
        </AnimatedPressable>
      </View>

      {reviewMode === 'quick' ? (
        <View style={styles.quickEditCard}>
          <Text style={styles.quickEditCaption}>{t('scanQuickEditCaption')}</Text>
          <TextInput
            accessibilityLabel={t('scanQuickEdit')}
            value={quickEditText}
            onChangeText={onQuickEditChange}
            multiline
            maxLength={MAX_OCR_ITEMS * 501}
            placeholder={t('scanQuickEditPlaceholder')}
            placeholderTextColor={theme.inkSoft}
            selectionColor={theme.violetDeep}
            cursorColor={theme.violetDeep}
            textAlignVertical="top"
            style={styles.quickEditInput}
          />
          <Text style={styles.quickEditCount}>{visibleItemCount}/{MAX_OCR_ITEMS}</Text>
        </View>
      ) : (
        <>
          <MemoryItemReorderProvider>
            <View style={styles.itemList}>
              {items.map((item, index) => (
                <DraggableMemoryItemRow
                  key={item.id}
                  item={item}
                  index={index}
                  itemCount={items.length}
                  placeholder={t('scanItemPlaceholder')}
                  removeLabel={t('removeAccessibility')}
                  reorderLabel={t('scanReorderItem')}
                  reorderHint={t('scanReorderHint')}
                  onChange={(value) => onChange(index, value)}
                  onRemove={() => onRemove(index)}
                  onMove={onMove}
                  onDragStateChange={onDragStateChange}
                />
              ))}
              {!items.length ? <Text style={styles.emptyItems}>{t('scanNoText')}</Text> : null}
            </View>
          </MemoryItemReorderProvider>
          <AnimatedPressable onPress={onAdd} style={styles.addItemButton}>
            <Plus size={17} color={theme.berryDeep} />
            <Text style={styles.addItemText}>{t('scanAddItem')}</Text>
          </AnimatedPressable>
        </>
      )}
      <AnimatedPressable onPress={onUse} style={styles.primaryButton}>
        <Check size={19} color={theme.ink} strokeWidth={2.8} />
        <Text style={styles.primaryButtonText}>{t('scanUseItems')}</Text>
      </AnimatedPressable>
      <AnimatedPressable onPress={onRetake} style={styles.secondaryButton}>
        <RefreshCcw size={17} color={theme.inkSoft} strokeWidth={2.2} />
        <Text style={styles.secondaryButtonText}>{t('scanRetake')}</Text>
      </AnimatedPressable>
      <Text style={styles.privacyNote}>{t('scanReviewPrivacy')}</Text>
    </>
  );
}

function MessageCard({ message }: { message: string }) {
  return (
    <View style={styles.messageCard}>
      <Text style={styles.messageText}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: 'transparent' },
  content: { padding: 16, paddingBottom: 48 },
  heroCard: {
    borderRadius: 22,
    borderWidth: 2,
    borderColor: theme.line,
    backgroundColor: theme.paper,
    padding: 18,
  },
  heroIcon: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.skyTint,
    borderWidth: 1.5,
    borderColor: theme.skyLine,
  },
  heroTitle: {
    color: theme.ink,
    fontFamily: typography.displayExtraBold,
    fontSize: 19,
    marginTop: 12,
  },
  heroBody: {
    color: theme.inkSoft,
    fontFamily: typography.bodySemibold,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 5,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    borderRadius: 13,
    backgroundColor: theme.sunTint,
    marginTop: 15,
    padding: 11,
  },
  tipEmoji: { fontSize: 16 },
  tipText: {
    flex: 1,
    color: theme.inkSoft,
    fontFamily: typography.bodyBold,
    fontSize: 11,
    lineHeight: 16,
  },
  previewCard: {
    borderRadius: 18,
    borderWidth: 2,
    borderColor: theme.line,
    backgroundColor: theme.paper,
    marginTop: 13,
    overflow: 'hidden',
  },
  previewImage: { width: '100%', height: 170 },
  previewActions: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 13,
  },
  previewLabel: { color: theme.inkSoft, fontFamily: typography.bodyBold, fontSize: 11 },
  smallAction: {
    minHeight: 34,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 7,
  },
  smallActionText: { color: theme.inkSoft, fontFamily: typography.bodyExtraBold, fontSize: 11 },
  primaryButton: {
    minHeight: 53,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 15,
    backgroundColor: theme.sun,
    marginTop: 16,
    paddingHorizontal: 14,
    boxShadow: `0px 5px 0px ${theme.sunDeep}`,
  },
  primaryButtonText: { color: theme.ink, fontFamily: typography.bodyExtraBold, fontSize: 14 },
  secondaryButton: {
    minHeight: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: theme.line,
    backgroundColor: theme.canvas,
    marginTop: 13,
    paddingHorizontal: 14,
    boxShadow: '0px 2px 7px rgba(43, 42, 61, 0.05)',
  },
  secondaryButtonText: { color: theme.inkSoft, fontFamily: typography.bodyExtraBold, fontSize: 13 },
  privacyNote: {
    color: theme.inkSoft,
    fontFamily: typography.bodySemibold,
    fontSize: 10.5,
    lineHeight: 15,
    textAlign: 'center',
    marginTop: 14,
    paddingHorizontal: 12,
  },
  messageCard: {
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: theme.berryLine,
    backgroundColor: theme.berryTint,
    marginTop: 13,
    padding: 11,
  },
  messageText: {
    color: theme.berryDeep,
    fontFamily: typography.bodyBold,
    fontSize: 12,
    lineHeight: 17,
    textAlign: 'center',
  },
  processingCard: {
    borderRadius: 22,
    borderWidth: 2,
    borderColor: theme.line,
    backgroundColor: theme.paper,
    overflow: 'hidden',
    paddingBottom: 22,
  },
  processingImage: { width: '100%', height: 265, opacity: 0.78 },
  processingSpinner: { alignItems: 'center', justifyContent: 'center', marginTop: -25 },
  processingTitle: {
    color: theme.ink,
    fontFamily: typography.displayExtraBold,
    fontSize: 18,
    textAlign: 'center',
    marginTop: 14,
  },
  processingBody: {
    color: theme.inkSoft,
    fontFamily: typography.bodySemibold,
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    marginTop: 5,
    paddingHorizontal: 22,
  },
  reviewIntro: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#BCE8D4',
    backgroundColor: '#F1FBF6',
    marginTop: 14,
    padding: 13,
  },
  reviewIcon: {
    width: 39,
    height: 39,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#DDF6E9',
  },
  reviewCopy: { flex: 1 },
  reviewTitle: { color: theme.ink, fontFamily: typography.bodyExtraBold, fontSize: 14 },
  reviewBody: {
    color: theme.inkSoft,
    fontFamily: typography.bodySemibold,
    fontSize: 11,
    lineHeight: 16,
    marginTop: 2,
  },
  countBadge: {
    borderRadius: 999,
    backgroundColor: '#DDF6E9',
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  countBadgeText: { color: '#25865C', fontFamily: typography.bodyExtraBold, fontSize: 10 },
  reviewModeSwitch: { flexDirection: 'row', gap: 6, borderRadius: 14, backgroundColor: theme.violetTint, padding: 4, marginTop: 13 },
  reviewModeButton: { minHeight: 40, flex: 1, alignItems: 'center', justifyContent: 'center', borderRadius: 11, paddingHorizontal: 8 },
  reviewModeButtonSelected: { backgroundColor: theme.paper, boxShadow: '0px 2px 5px rgba(43, 42, 61, 0.1)' },
  reviewModeText: { color: theme.inkSoft, fontFamily: typography.bodyBold, fontSize: 12 },
  reviewModeTextSelected: { color: theme.violetDeep, fontFamily: typography.bodyExtraBold },
  quickEditCard: { borderRadius: 17, borderWidth: 1.5, borderColor: theme.line, backgroundColor: theme.paper, padding: 12, marginTop: 10 },
  quickEditCaption: { color: theme.inkSoft, fontFamily: typography.bodySemibold, fontSize: 11, marginBottom: 6 },
  quickEditInput: { minHeight: 210, maxHeight: 360, color: theme.ink, fontFamily: typography.bodySemibold, fontSize: 15, lineHeight: 24, padding: 10, borderRadius: 12, borderWidth: 1.5, borderColor: theme.line, backgroundColor: theme.canvas },
  quickEditCount: { alignSelf: 'flex-end', color: theme.inkSoft, fontFamily: typography.bodyBold, fontSize: 10, marginTop: 6 },
  itemList: { gap: 8, marginTop: 13 },
  emptyItems: {
    color: theme.inkSoft,
    fontFamily: typography.bodySemibold,
    fontSize: 12,
    textAlign: 'center',
    paddingVertical: 20,
  },
  addItemButton: {
    minHeight: 42,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 13,
    borderWidth: 1.5,
    borderColor: theme.berryLine,
    backgroundColor: theme.berryTint,
    marginTop: 12,
  },
  addItemText: { color: theme.berryDeep, fontFamily: typography.bodyExtraBold, fontSize: 12 },
});
