import AnimatedPressable from '@/components/AnimatedPressable';
import { useTranslation } from '@/core/i18n/useTranslation';
import type { MemoryFolder } from '../types/memoryFolder.types';
import { createThemedStyles } from '@/theme/createThemedStyles';
import { typography } from '@/theme/typography';
import { ChevronRight, Sparkles } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';

export function MemoryFolderCard({ folder, onOpen, onLongPress, variant = 'list', tone = 0 }: { folder: MemoryFolder; onOpen: () => void; onLongPress: () => void; variant?: 'card' | 'list'; tone?: number }) {
  const { styles, theme } = useStyles();
  const { t } = useTranslation('library');
  const cardTone = tone % 4;
  return (
    <AnimatedPressable lively={variant === 'card'} accessibilityRole="button" accessibilityLabel={`${folder.name}, ${folder.memorySetCount} ${t('lists')}`} accessibilityHint={t('holdForCollectionActions')} delayLongPress={420} onLongPress={onLongPress} onPress={onOpen} style={[
      styles.card,
      variant === 'card' && styles.collectionCard,
      variant === 'card' && cardTone === 0 && styles.collectionCardViolet,
      variant === 'card' && cardTone === 1 && styles.collectionCardBerry,
      variant === 'card' && cardTone === 2 && styles.collectionCardSky,
      variant === 'card' && cardTone === 3 && styles.collectionCardSun,
    ]}>
      {variant === 'card' ? (
        <>
          <View style={styles.artworkRow}>
            <View style={styles.emojiHalo}><Text style={styles.emoji}>{folder.emoji ?? '📚'}</Text></View>
            <View style={styles.enterButton}><ChevronRight size={18} color={theme.violetDeep} /></View>
          </View>
          <Text numberOfLines={2} style={styles.collectionTitle}>{folder.name}</Text>
          {folder.description ? <Text numberOfLines={3} style={styles.collectionDescription}>{folder.description}</Text> : null}
          <View style={styles.collectionMeta}>
            <Sparkles size={13} color={theme.berryDeep} />
            <Text style={styles.collectionMetaText}>{folder.memorySetCount} {folder.memorySetCount === 1 ? t('list') : t('lists')} · {folder.itemCount} {folder.itemCount === 1 ? t('item') : t('items')}</Text>
          </View>
        </>
      ) : (
        <>
          <View style={styles.icon}><Text style={styles.listEmoji}>{folder.emoji ?? '📚'}</Text></View>
          <View style={styles.copy}>
            <Text numberOfLines={1} style={styles.title}>{folder.name}</Text>
            {folder.description ? <Text numberOfLines={2} style={styles.listDescription}>{folder.description}</Text> : null}
            <Text style={styles.meta}>{folder.memorySetCount} {folder.memorySetCount === 1 ? t('list') : t('lists')} · {folder.itemCount} {folder.itemCount === 1 ? t('item') : t('items')}</Text>
          </View>
          <ChevronRight size={18} color={theme.inkSoft} />
        </>
      )}
    </AnimatedPressable>
  );
}

const useStyles = createThemedStyles((theme) => StyleSheet.create({
  card: { alignItems: 'center', backgroundColor: theme.paper, borderColor: theme.line, borderRadius: 20, borderWidth: 1.5, flexDirection: 'row', minHeight: 78, padding: 13 },
  collectionCard: { alignItems: 'stretch', borderRadius: 26, borderWidth: 1.5, flexDirection: 'column', padding: 14, width: '100%', shadowColor: theme.violetDeep, shadowOpacity: 0.08, shadowRadius: 12, shadowOffset: { width: 0, height: 5 }, elevation: 2 },
  collectionCardViolet: { backgroundColor: theme.violetTint, borderColor: theme.violetLine },
  collectionCardBerry: { backgroundColor: theme.berryTint, borderColor: theme.berryLine },
  collectionCardSky: { backgroundColor: theme.skyTint, borderColor: theme.skyLine },
  collectionCardSun: { backgroundColor: theme.sunTint, borderColor: theme.sunLine },
  artworkRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  emojiHalo: { alignItems: 'center', backgroundColor: theme.paper, borderColor: theme.line, borderRadius: 21, borderWidth: 1.5, height: 58, justifyContent: 'center', transform: [{ rotate: '-3deg' }], width: 58 },
  emoji: { fontSize: 31 },
  enterButton: { alignItems: 'center', backgroundColor: theme.paper, borderRadius: 17, height: 34, justifyContent: 'center', width: 34 },
  collectionTitle: { color: theme.ink, fontFamily: typography.displayExtraBold, fontSize: 17, lineHeight: 22, marginTop: 15 },
  collectionDescription: { color: theme.inkSoft, fontFamily: typography.bodySemibold, fontSize: 11.5, lineHeight: 17, marginTop: 5 },
  collectionMeta: { alignItems: 'center', flexDirection: 'row', gap: 5, marginTop: 14 },
  collectionMetaText: { color: theme.inkSoft, fontFamily: typography.bodyExtraBold, fontSize: 10 },
  icon: { alignItems: 'center', backgroundColor: theme.paper, borderColor: theme.line, borderRadius: 15, borderWidth: 1.5, height: 46, justifyContent: 'center', width: 46 },
  listEmoji: { fontSize: 24 },
  copy: { flex: 1, marginHorizontal: 12, minWidth: 0 },
  title: { color: theme.ink, fontFamily: typography.bodyExtraBold, fontSize: 15 },
  listDescription: { color: theme.inkSoft, fontFamily: typography.bodySemibold, fontSize: 11, lineHeight: 15, marginTop: 3 },
  meta: { color: theme.inkSoft, fontFamily: typography.bodyBold, fontSize: 11, marginTop: 4 },
}));
