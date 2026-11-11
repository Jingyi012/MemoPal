import { AppText as Text } from '@/components/ui/AppText';
import { appRadii, appSpacing, appTextStyles } from '@/theme/designSystem';
import AnimatedPressable from '@/components/AnimatedPressable';
import { SceneEditorCard } from '@/features/memory-composer/components/SceneEditorCard';
import type { PalaceLocus } from '@/features/palace-scenes/types/palaceScene.types';
import { createThemedStyles } from '@/theme/createThemedStyles';
import { typography } from '@/theme/typography';
import { useTranslation } from '@/core/i18n/useTranslation';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { ArrowLeft, ArrowLeftRight, ArrowRight, MapPin, RefreshCw, Sparkles } from '@/core/icons';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { useLayoutEffect } from 'react';
import { getPalaceLocusDescription, getPalaceLocusName } from '@/features/palace-scenes/utils/palaceLocalization';

type PalaceAssociationEditorProps = {
  items: string[];
  loci: PalaceLocus[];
  associations: string[];
  activeIndex: number;
  onSelectIndex: (index: number) => void;
  onChangeAssociation: (value: string) => void;
  onGenerate?: () => void;
  isGenerating?: boolean;
  generationMessage?: string | null;
  onGenerateCurrent?: () => void;
  isGeneratingAny?: boolean;
  isGeneratingCurrent?: boolean;
};

/** The focused placement editor used while building a Palace route. */
export function PalaceAssociationEditor({
  items,
  loci,
  associations,
  activeIndex,
  onSelectIndex,
  onChangeAssociation,
  onGenerate,
  isGenerating = false,
  generationMessage,
  onGenerateCurrent,
  isGeneratingAny = false,
  isGeneratingCurrent = false,
}: PalaceAssociationEditorProps) {
  const { styles, theme } = useStyles();
  const { language, t } = useTranslation('palace');
  const { t: memoryT } = useTranslation('memoryComposer');
  const hasItems = items.length > 0;
  const safeIndex = hasItems ? Math.min(Math.max(activeIndex, 0), items.length - 1) : 0;
  const nextIndex = safeIndex < items.length - 1 ? safeIndex + 1 : -1;
  const previousIndex = safeIndex > 0 ? safeIndex - 1 : -1;
  const translateX = useSharedValue(0);
  const rotation = useSharedValue(0);
  const previewProgress = useSharedValue(0);
  const previewDirection = useSharedValue(nextIndex >= 0 ? -1 : 1);

  useLayoutEffect(() => {
    translateX.value = 0;
    rotation.value = 0;
    previewProgress.value = 0;
    previewDirection.value = nextIndex >= 0 ? -1 : 1;
  }, [nextIndex, previewDirection, previewProgress, rotation, safeIndex, translateX]);

  const animatedCardStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }, { rotate: `${rotation.value}deg` }],
  }));

  const animatedNextPreviewStyle = useAnimatedStyle(() => {
    const progress = previewDirection.value < 0 ? previewProgress.value : 0;
    return {
      opacity: previewDirection.value < 0 ? 0.86 + progress * 0.14 : 0,
      transform: [{ translateY: 5 - progress * 5 }, { scale: 0.95 + progress * 0.05 }],
    };
  });

  const animatedPreviousPreviewStyle = useAnimatedStyle(() => {
    const progress = previewDirection.value > 0 ? previewProgress.value : 0;
    return {
      opacity: previewDirection.value > 0 ? 0.86 + progress * 0.14 : 0,
      transform: [{ translateY: 5 - progress * 5 }, { scale: 0.95 + progress * 0.05 }],
    };
  });

  const swipeGesture = Gesture.Pan()
    .activeOffsetX([-12, 12])
    .failOffsetY([-18, 18])
    .onStart(() => {
      previewProgress.value = 0;
    })
    .onUpdate((event) => {
      translateX.value = event.translationX;
      rotation.value = event.translationX / 24;
      previewDirection.value = event.translationX < 0 ? -1 : 1;
      previewProgress.value = Math.min(Math.abs(event.translationX) / 140, 1);
    })
    .onEnd((event) => {
      const isForward = event.translationX < -72 && safeIndex < items.length - 1;
      const isBackward = event.translationX > 72 && safeIndex > 0;
      if (!isForward && !isBackward) {
        translateX.value = withSpring(0);
        rotation.value = withSpring(0);
        previewProgress.value = withSpring(0);
        return;
      }

      const nextIndex = isForward ? safeIndex + 1 : safeIndex - 1;
      const exitX = isForward ? -380 : 380;
      previewDirection.value = isForward ? -1 : 1;
      previewProgress.value = withTiming(1, { duration: 220 });
      translateX.value = withTiming(exitX, { duration: 220 }, (finished) => {
        if (finished) runOnJS(onSelectIndex)(nextIndex);
      });
      rotation.value = withTiming(isForward ? -10 : 10, { duration: 220 });
    });

  if (!hasItems) {
    return null;
  }

  const renderLocationVisual = (locus: PalaceLocus | undefined, fallbackIndex: number) => {
    const previewLocusName = locus
      ? getPalaceLocusName(locus, language)
      : `${t('loci')} ${fallbackIndex + 1}`;
    return (
      <View style={styles.locationVisual}>
        <View style={styles.locationIcon}>
          <MapPin size={17} color={theme.violetDeep} strokeWidth={2.5} />
        </View>
        <View style={styles.locationCopy}>
          <Text style={styles.locationLabel}>
            {t('placingAt')} <Text style={styles.locationName}>{previewLocusName}</Text>
          </Text>
          <Text style={styles.locationDescription}>
            {locus
              ? getPalaceLocusDescription(locus, language, t('locusDescriptionFallback'))
              : t('locusDescriptionFallback')}
          </Text>
        </View>
      </View>
    );
  };

  const renderEditorCard = (index: number, readOnly = false) => {
    const item = items[index] ?? '';
    const locus = index >= 0 && index < loci.length ? loci[index] : undefined;
    return (
      <SceneEditorCard
        index={index}
        total={items.length}
        anchorLabel={`${t('locusLabel')} ${index + 1}`}
        itemLabel={item}
        visual={renderLocationVisual(locus, index)}
        value={associations[index] ?? ''}
        onChangeText={readOnly ? () => undefined : onChangeAssociation}
        placeholder={memoryT('associationPlaceholder')}
        inputLabel={t('associationPrompt')}
        accessibilityLabel={`${t('associationPrompt')}: ${item}`}
        accent="palace"
        compact
        readOnly={readOnly}
        headerAction={!readOnly && onGenerateCurrent ? (
          <AnimatedPressable
            accessibilityRole="button"
            accessibilityLabel={isGeneratingCurrent ? t('aiRegenerating') : t('aiRegenerate')}
            disabled={isGeneratingAny}
            onPress={onGenerateCurrent}
            style={[styles.regenerateButton, isGeneratingAny && styles.regenerateButtonDisabled]}>
            {isGeneratingCurrent ? (
              <ActivityIndicator color={theme.violetDeep} size="small" />
            ) : (
              <RefreshCw color={theme.violetDeep} size={15} strokeWidth={2.5} />
            )}
          </AnimatedPressable>
        ) : undefined}
      />
    );
  };

  return (
    <View style={styles.section}>
      <View style={styles.headingRow}>
        <View style={styles.headingCopy}>
          <Text style={styles.title}>{t('placementTitle')}</Text>
        </View>
        <View style={styles.progressPill} accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: items.length, now: safeIndex + 1 }}>
          <Text style={styles.progressText}>{safeIndex + 1} / {items.length}</Text>
        </View>
        {onGenerate ? (
          <AnimatedPressable
            accessibilityRole="button"
            accessibilityLabel={isGenerating ? t('aiGeneratingAllLabel') : t('aiGenerateAllLabel')}
            disabled={isGenerating}
            onPress={onGenerate}
            style={[styles.compactGenerateButton, isGenerating && styles.generateButtonDisabled]}>
            {isGenerating ? (
              <ActivityIndicator color={theme.violetDeep} size="small" />
            ) : (
              <Sparkles size={14} color={theme.violetDeep} strokeWidth={2.4} />
            )}
            <Text numberOfLines={1} style={styles.compactGenerateText}>
              {isGenerating
                ? t('aiGeneratingAllShort')
                : t('aiGenerateAllShort')}
            </Text>
          </AnimatedPressable>
        ) : null}
      </View>
      <Text style={styles.helper}>{t('placementHelper')}</Text>
      <View style={styles.progressTrack} accessibilityElementsHidden>
        <View style={[styles.progressFill, { width: `${((safeIndex + 1) / items.length) * 100}%` }]} />
      </View>
      {generationMessage ? <Text numberOfLines={1} ellipsizeMode="tail" style={styles.generationMessage}>{generationMessage}</Text> : null}

      <View style={styles.cardStack}>
        {items.length > 1 ? <View pointerEvents="none" style={[styles.deckLayer, styles.deckLayerBack]} /> : null}
        {nextIndex >= 0 ? (
          <View pointerEvents="none" style={[styles.deckPreview, styles.deckPreviewNext]}>
            <Animated.View style={animatedNextPreviewStyle}>{renderEditorCard(nextIndex, true)}</Animated.View>
          </View>
        ) : null}
        {previousIndex >= 0 ? (
          <View pointerEvents="none" style={[styles.deckPreview, styles.deckPreviewPrevious]}>
            <Animated.View style={animatedPreviousPreviewStyle}>{renderEditorCard(previousIndex, true)}</Animated.View>
          </View>
        ) : null}
        <GestureDetector gesture={swipeGesture}>
          <Animated.View
            accessibilityHint={t('swipeHint')}
            style={[styles.swipeCard, animatedCardStyle]}>
            {renderEditorCard(safeIndex)}
          </Animated.View>
        </GestureDetector>
      </View>
      <View style={styles.swipeHint}>
        <ArrowLeftRight size={14} color={theme.violetDeep} />
        <Text style={styles.swipeHintText}>{t('swipeHint')}</Text>
      </View>

      <View style={styles.navigationRow}>
        <View style={styles.navigationSlot}>
          <AnimatedPressable
            accessibilityRole="button"
            accessibilityLabel={t('previousPlacement')}
            disabled={safeIndex === 0}
            onPress={() => onSelectIndex(Math.max(0, safeIndex - 1))}
            style={[styles.navigationButton, safeIndex === 0 && styles.navigationButtonDisabled]}>
            <ArrowLeft size={16} color={safeIndex === 0 ? theme.inkMuted : theme.violetDeep} />
            <Text style={[styles.navigationText, safeIndex === 0 && styles.navigationTextDisabled]}>
              {t('previousPlacement')}
            </Text>
          </AnimatedPressable>
        </View>
        <View style={styles.navigationSlot}>
          <AnimatedPressable
            accessibilityRole="button"
            accessibilityLabel={safeIndex === items.length - 1 ? t('finishPlacements') : t('nextLocus')}
            disabled={safeIndex === items.length - 1}
            onPress={() => onSelectIndex(Math.min(items.length - 1, safeIndex + 1))}
            style={[styles.navigationButton, styles.nextNavigationButton, safeIndex === items.length - 1 && styles.navigationButtonDisabled]}>
            <Text style={[styles.navigationText, styles.nextNavigationText, safeIndex === items.length - 1 && styles.navigationTextDisabled]}>
              {safeIndex === items.length - 1 ? t('finishPlacements') : t('nextLocus')}
            </Text>
            <ArrowRight size={16} color={safeIndex === items.length - 1 ? theme.inkMuted : theme.onAccent} />
          </AnimatedPressable>
        </View>
      </View>
    </View>
  );
}

const useStyles = createThemedStyles((theme) => StyleSheet.create({
  section: { marginTop: appSpacing.md },
  headingRow: { alignItems: 'center', flexDirection: 'row', gap: appSpacing.sm, justifyContent: 'space-between' },
  headingCopy: { flex: 1 },
  title: { color: theme.ink, fontFamily: typography.display, fontSize: appTextStyles.sectionTitle.fontSize },
  compactGenerateButton: { alignItems: 'center', backgroundColor: theme.violetTint, borderColor: theme.violetLine, borderRadius: 11, borderWidth: 1.5, flexDirection: 'row', gap: 5, justifyContent: 'center', maxWidth: 142, minHeight: 44, paddingHorizontal: appSpacing.sm },
  generateButtonDisabled: { opacity: 0.62 },
  compactGenerateText: { color: theme.violetDeep, flexShrink: 1, fontFamily: typography.bodyExtraBold, fontSize: appTextStyles.caption.fontSize },
  helper: { color: theme.inkSoft, fontFamily: typography.bodyBold, fontSize: appTextStyles.caption.fontSize, lineHeight: appTextStyles.caption.lineHeight, marginTop: appSpacing.xs, marginBottom: 5 },
  progressPill: { alignItems: 'center', backgroundColor: theme.violetTint, borderRadius: appRadii.pill, justifyContent: 'center', minHeight: 30, paddingHorizontal: 9 },
  progressText: { color: theme.violetDeep, fontFamily: typography.bodyExtraBold, fontSize: appTextStyles.caption.fontSize },
  progressTrack: { backgroundColor: theme.line, borderRadius: appRadii.pill, height: 5, marginBottom: appSpacing.sm, overflow: 'hidden' },
  progressFill: { backgroundColor: theme.violet, borderRadius: appRadii.pill, height: '100%' },
  generationMessage: { color: theme.inkSoft, fontFamily: typography.bodySemibold, fontSize: appTextStyles.caption.fontSize, lineHeight: appTextStyles.caption.lineHeight, marginBottom: appSpacing.xs, textAlign: 'center' },
  regenerateButton: { alignItems: 'center', backgroundColor: theme.violetTint, borderColor: theme.violetLine, borderRadius: 10, borderWidth: 1, height: 44, justifyContent: 'center', width: 44 },
  regenerateButtonDisabled: { opacity: 0.62 },
  cardStack: { position: 'relative' },
  deckLayer: { backgroundColor: theme.violetTint, borderColor: theme.violetLine, borderRadius: appRadii.card, borderWidth: 1.5, left: 0, position: 'absolute', right: 0 },
  deckLayerBack: { bottom: 11, left: 10, right: 10, top: 13, opacity: 0.65 },
  deckPreview: { left: 0, position: 'absolute', right: 0, top: 4, zIndex: 1 },
  deckPreviewNext: { zIndex: 1 },
  deckPreviewPrevious: { zIndex: 1 },
  swipeCard: { zIndex: 2 },
  locationVisual: { alignItems: 'center', flexDirection: 'row', gap: appSpacing.sm, width: '100%' },
  locationIcon: { alignItems: 'center', backgroundColor: theme.violetTint, borderRadius: 11, height: 32, justifyContent: 'center', width: 32 },
  locationCopy: { flex: 1, minWidth: 0 },
  locationLabel: { color: theme.inkSoft, fontFamily: typography.bodyBold, fontSize: appTextStyles.caption.fontSize },
  locationName: { color: theme.violetDeep, fontFamily: typography.bodyExtraBold },
  locationDescription: { color: theme.inkSoft, fontFamily: typography.bodySemibold, fontSize: appTextStyles.caption.fontSize, lineHeight: appTextStyles.caption.lineHeight, marginTop: 2 },
  swipeHint: { alignItems: 'center', flexDirection: 'row', gap: 5, justifyContent: 'center', marginBottom: appSpacing.sm, marginTop: appSpacing.xs },
  swipeHintText: { color: theme.violetDeep, fontFamily: typography.bodyBold, fontSize: appTextStyles.caption.fontSize },
  navigationRow: { flexDirection: 'row', gap: 9, marginTop: 2 },
  navigationSlot: { flex: 1, minWidth: 0 },
  navigationButton: { alignItems: 'center', backgroundColor: theme.violetTint, borderColor: theme.violetLine, borderRadius: appRadii.control, borderWidth: 1.5, flexDirection: 'row', gap: 6, justifyContent: 'center', minHeight: 46, paddingHorizontal: 10, width: '100%' },
  nextNavigationButton: { backgroundColor: theme.violetDeep, borderColor: theme.violetDeep },
  navigationButtonDisabled: { backgroundColor: theme.canvas, borderColor: theme.line, opacity: 0.9 },
  navigationText: { color: theme.violetDeep, fontFamily: typography.bodyExtraBold, fontSize: appTextStyles.caption.fontSize },
  nextNavigationText: { color: theme.onAccent },
  navigationTextDisabled: { color: theme.inkMuted },
}));
