import AnimatedPressable from '@/components/AnimatedPressable';
import { useTranslation } from '@/core/i18n/useTranslation';
import type { MemoryFolder } from '../types/memoryFolder.types';
import { createThemedStyles } from '@/theme/createThemedStyles';
import { typography } from '@/theme/typography';
import { ChevronRight, Folder, MoreVertical } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';

export function MemoryFolderCard({ folder, onOpen, onActions, variant = 'list' }: { folder: MemoryFolder; onOpen: () => void; onActions: () => void; variant?: 'card' | 'list' }) {
  const { styles, theme } = useStyles();
  const { t } = useTranslation('library');
  return (
    <AnimatedPressable accessibilityRole="button" accessibilityLabel={`${folder.name}, ${folder.memorySetCount} ${t('lists')}`} onPress={onOpen} style={[styles.card, variant === 'card' && styles.gridCard]}>
      {variant === 'card' ? (
        <>
          <View style={styles.gridCover}>
            <View style={styles.orbLarge} />
            <View style={styles.orbSmall} />
            <Folder size={48} color={theme.violetDeep} />
            <AnimatedPressable accessibilityLabel={t('folderActions')} containerStyle={styles.gridActionContainer} hitSlop={10} onPress={onActions} style={styles.gridAction}>
              <MoreVertical size={20} color={theme.violetDeep} />
            </AnimatedPressable>
          </View>
          <View style={styles.gridBody}>
            <Text style={styles.gridLabel}>{t('folder')}</Text>
            <Text numberOfLines={2} style={styles.gridTitle}>{folder.name}</Text>
            <Text numberOfLines={1} style={styles.gridMeta}>{folder.memorySetCount} {folder.memorySetCount === 1 ? t('list') : t('lists')} · {folder.itemCount} {folder.itemCount === 1 ? t('item') : t('items')}</Text>
            <View style={styles.openPill}><Folder size={12} color={theme.violetDeep} /><Text style={styles.openText}>{t('folder')}</Text></View>
          </View>
        </>
      ) : (
        <>
          <View style={styles.icon}><Folder size={24} color={theme.violetDeep} /></View>
          <View style={styles.copy}>
            <Text numberOfLines={1} style={styles.title}>{folder.name}</Text>
            <Text style={styles.meta}>{folder.memorySetCount} {folder.memorySetCount === 1 ? t('list') : t('lists')} · {folder.itemCount} {folder.itemCount === 1 ? t('item') : t('items')}</Text>
          </View>
          <AnimatedPressable accessibilityLabel={t('folderActions')} hitSlop={10} onPress={onActions} style={styles.action}><MoreVertical size={20} color={theme.inkSoft} /></AnimatedPressable>
          <ChevronRight size={18} color={theme.inkSoft} />
        </>
      )}
    </AnimatedPressable>
  );
}

const useStyles = createThemedStyles((theme) => StyleSheet.create({
  card: { alignItems: 'center', backgroundColor: theme.paper, borderColor: theme.line, borderRadius: 20, borderWidth: 1.5, flexDirection: 'row', minHeight: 78, padding: 13 },
  gridCard: { alignItems: 'stretch', borderRadius: 24, flexDirection: 'column', minHeight: 0, overflow: 'hidden', padding: 0, width: '100%', boxShadow: '0px 4px 14px rgba(122,104,224,0.10)' },
  gridCover: { alignItems: 'center', backgroundColor: theme.violetTint, height: 130, justifyContent: 'center', overflow: 'hidden', position: 'relative', width: '100%' },
  orbLarge: { backgroundColor: 'rgba(155,140,255,0.18)', borderRadius: 64, height: 128, position: 'absolute', right: -32, top: -38, width: 128 },
  orbSmall: { backgroundColor: 'rgba(255,255,255,0.38)', borderRadius: 35, bottom: -18, height: 70, left: -14, position: 'absolute', width: 70 },
  gridActionContainer: { position: 'absolute', right: 8, top: 7 },
  gridAction: { alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.86)', borderRadius: 11, height: 36, justifyContent: 'center', width: 36 },
  gridBody: { paddingBottom: 12, paddingHorizontal: 11, paddingTop: 11 },
  gridLabel: { color: theme.violetDeep, fontFamily: typography.bodyExtraBold, fontSize: 10, letterSpacing: 0.7, textTransform: 'uppercase' },
  gridTitle: { color: theme.ink, fontFamily: typography.displayExtraBold, fontSize: 16, lineHeight: 20, marginTop: 4 },
  gridMeta: { color: theme.inkSoft, fontFamily: typography.bodyBold, fontSize: 10, marginTop: 3 },
  openPill: { alignItems: 'center', alignSelf: 'flex-start', backgroundColor: theme.violetTint, borderRadius: 9, flexDirection: 'row', gap: 4, marginTop: 9, paddingHorizontal: 7, paddingVertical: 5 },
  openText: { color: theme.violetDeep, fontFamily: typography.bodyExtraBold, fontSize: 10 },
  icon: { alignItems: 'center', backgroundColor: theme.violetTint, borderRadius: 15, height: 46, justifyContent: 'center', width: 46 },
  copy: { flex: 1, marginHorizontal: 12, minWidth: 0 },
  title: { color: theme.ink, fontFamily: typography.bodyExtraBold, fontSize: 15 },
  meta: { color: theme.inkSoft, fontFamily: typography.bodyBold, fontSize: 11, marginTop: 4 },
  action: { alignItems: 'center', height: 44, justifyContent: 'center', width: 32 },
}));
