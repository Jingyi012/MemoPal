import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from '@/core/i18n/useTranslation';
import { LearningLibraryCardSurface } from '@/features/education/components/LearningLibraryCard';
import { createThemedStyles } from '@/theme/createThemedStyles';
import type { MemoryFolder } from '../types/memoryFolder.types';

export function MemoryFolderCard({ folder, onOpen, onLongPress, variant = 'list' }: {
  folder: MemoryFolder; onOpen: () => void; onLongPress: () => void; variant?: 'card' | 'list';
}) {
  const { styles } = useStyles();
  const { t, language } = useTranslation('library');
  const zh = language === 'zh';
  return <LearningLibraryCardSurface grid={variant === 'card'} title={folder.name}
    source={folder.description || (zh ? '记忆合集' : 'Memory collection')}
    metadata={`${folder.memorySetCount} ${folder.memorySetCount === 1 ? t('list') : t('lists')} · ${folder.itemCount} ${folder.itemCount === 1 ? t('item') : t('items')}`}
    mark="" action={t('communityOpenAction')} removeLabel={`${t('openActions')}: ${folder.name}`}
    onPress={onOpen} onRemove={onLongPress} menuIcon="ellipsis-horizontal"
    coverArtwork={<View style={styles.cover}><Text style={styles.emoji}>{folder.emoji || '📚'}</Text></View>} />;
}
const useStyles = createThemedStyles(theme => StyleSheet.create({
  cover: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center', backgroundColor: theme.paper },
  emoji: { fontSize: 28 },
}));
