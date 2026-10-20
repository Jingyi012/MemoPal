import AnimatedPressable from '@/components/AnimatedPressable';
import { useTranslation } from '@/core/i18n/useTranslation';
import type { MemoryFolder } from '../types/memoryFolder.types';
import { createThemedStyles } from '@/theme/createThemedStyles';
import { typography } from '@/theme/typography';
import { ArrowRight, ChevronRight, Layers, MoreHorizontal } from '@/core/icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, View } from 'react-native';

const coverTones = [
  ['#E5DAFF', '#BBA9FF'],
  ['#FFD7E1', '#FFADC4'],
  ['#C8F1F5', '#8FDCE7'],
  ['#FFE8A8', '#FFD16D'],
] as const;

type MemoryFolderCardProps = {
  folder: MemoryFolder;
  onOpen: () => void;
  onLongPress: () => void;
  variant?: 'card' | 'list';
  tone?: number;
};

export function MemoryFolderCard({
  folder,
  onOpen,
  onLongPress,
  variant = 'list',
  tone = 0,
}: MemoryFolderCardProps) {
  const { styles, theme } = useStyles();
  const { t } = useTranslation('library');
  const colors = coverTones[tone % coverTones.length] ?? coverTones[0];

  return (
    <View style={[styles.cardWrap, variant === 'list' && styles.listCardSurface]}>
      <AnimatedPressable
        lively={variant === 'card'}
        accessibilityRole="button"
        accessibilityLabel={`${folder.name}, ${folder.memorySetCount} ${t('lists')}`}
        accessibilityHint={t('holdForCollectionActions')}
        delayLongPress={420}
        onLongPress={onLongPress}
        onPress={onOpen}
        style={variant === 'card' ? [styles.card, styles.featureCard] : styles.listCard}>
        {variant === 'card' ? (
          <LinearGradient colors={colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.featureCover}>
            <View pointerEvents="none" style={styles.coverOrb} />
            <Text style={styles.featureEmoji}>{folder.emoji ?? '📚'}</Text>
          </LinearGradient>
        ) : (
          <View style={styles.listIcon}><Text style={styles.listEmoji}>{folder.emoji ?? '📚'}</Text></View>
        )}

        <View style={[styles.copy, variant === 'card' && styles.featureCopy, variant === 'list' && styles.listCopy]}>
          <Text numberOfLines={variant === 'card' ? 2 : 1} style={[styles.title, variant === 'card' && styles.featureTitle, variant === 'list' && styles.listTitle]}>{folder.name}</Text>
          {folder.description || variant === 'card' ? (
            <Text numberOfLines={variant === 'card' ? 2 : 1} style={[styles.description, variant === 'card' && styles.featureDescription]}>
              {folder.description ?? ' '}
            </Text>
          ) : null}
          <View style={[styles.metaRow, variant === 'card' && styles.featureMetaRow]}>
            <Layers size={13} color={theme.violetDeep} />
            <Text numberOfLines={variant === 'card' ? 2 : 1} style={styles.metaText}>
              {folder.memorySetCount} {folder.memorySetCount === 1 ? t('list') : t('lists')} · {folder.itemCount} {folder.itemCount === 1 ? t('item') : t('items')}
            </Text>
          </View>
          {variant === 'card' ? (
            <View style={styles.openAction}>
              <Text style={styles.openActionText}>{t('communityOpenAction')}</Text>
              <ArrowRight size={13} color={theme.violetDeep} />
            </View>
          ) : null}
        </View>
        {variant === 'list' ? <ChevronRight size={18} color={theme.inkSoft} /> : null}
      </AnimatedPressable>
      <AnimatedPressable
        accessibilityRole="button"
        accessibilityLabel={`${t('openActions')}: ${folder.name}`}
        hitSlop={4}
        onPress={onLongPress}
        style={variant === 'list' ? styles.listMoreButton : styles.moreButton}>
        <MoreHorizontal size={19} color={theme.inkSoft} />
      </AnimatedPressable>
    </View>
  );
}

const useStyles = createThemedStyles((theme) => StyleSheet.create({
  cardWrap: { position: 'relative', width: '100%' },
  listCardSurface: { alignItems: 'center', backgroundColor: theme.paper, borderColor: theme.line, borderRadius: 20, borderWidth: 1, boxShadow: '0px 3px 10px rgba(73,55,154,0.06)', flexDirection: 'row', paddingRight: 8 },
  card: { backgroundColor: theme.paper, borderColor: theme.violetLine, borderRadius: 20, borderWidth: 1, boxShadow: '0px 4px 12px rgba(73,55,154,0.08)' },
  featureCard: { flexDirection: 'column', gap: 0, overflow: 'hidden', padding: 9 },
  featureCover: { alignItems: 'center', borderRadius: 14, height: 94, justifyContent: 'center', overflow: 'hidden', position: 'relative', width: '100%' },
  coverOrb: { backgroundColor: 'rgba(255,255,255,0.28)', borderRadius: 60, height: 120, position: 'absolute', right: -48, top: -35, width: 120 },
  featureEmoji: { fontSize: 40 },
  listCard: { alignItems: 'center', flex: 1, flexDirection: 'row', minHeight: 88, minWidth: 0, paddingHorizontal: 12, paddingVertical: 8 },
  listIcon: { alignItems: 'center', backgroundColor: theme.violetTint, borderColor: theme.line, borderRadius: 15, borderWidth: 1, height: 48, justifyContent: 'center', width: 48 },
  listEmoji: { fontSize: 25 },
  copy: { flex: 1, minWidth: 0 },
  featureCopy: { alignSelf: 'stretch', gap: 6, justifyContent: 'flex-start', paddingHorizontal: 2, paddingTop: 10, paddingBottom: 2 },
  listCopy: { marginLeft: 12 },
  title: { color: theme.ink, fontFamily: typography.bodyExtraBold, fontSize: 15 },
  featureTitle: { fontFamily: typography.displayExtraBold, fontSize: 14, lineHeight: 18, minHeight: 36 },
  listTitle: { fontFamily: typography.displayExtraBold, fontSize: 15, lineHeight: 19 },
  description: { color: theme.inkSoft, fontFamily: typography.bodySemibold, fontSize: 10.5, lineHeight: 14 },
  featureDescription: { minHeight: 28 },
  metaRow: { alignItems: 'center', flexDirection: 'row', gap: 5, marginTop: 1, minWidth: 0 },
  featureMetaRow: { minHeight: 28 },
  metaText: { color: theme.inkSoft, flex: 1, fontFamily: typography.bodyExtraBold, fontSize: 9.5 },
  openAction: { alignItems: 'center', alignSelf: 'flex-start', backgroundColor: theme.violetTint, borderRadius: 999, flexDirection: 'row', gap: 4, marginTop: 2, minHeight: 28, paddingHorizontal: 9 },
  openActionText: { color: theme.violetDeep, fontFamily: typography.bodyExtraBold, fontSize: 9.5 },
  moreButton: { alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.94)', borderColor: theme.line, borderRadius: 14, borderWidth: 1, height: 40, justifyContent: 'center', position: 'absolute', right: 8, top: 8, width: 40, zIndex: 2 },
  listMoreButton: { alignItems: 'center', backgroundColor: theme.canvas, borderRadius: 13, flexShrink: 0, height: 40, justifyContent: 'center', marginLeft: 2, width: 40 },
}));
