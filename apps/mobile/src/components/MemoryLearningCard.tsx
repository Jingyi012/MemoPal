import type { ReactNode } from 'react';
import { View } from 'react-native';
import type { MemorySetVisibility } from '@/features/memory-sets';
import { useTranslation } from '@/core/i18n/useTranslation';
import { LearningLibraryCardSurface } from '@/features/education/components/LearningLibraryCard';

type MemoryLearningCardProps = {
  techniqueKey: 'palace' | 'number-peg';
  title: string;
  description?: string;
  metadata: string;
  secondaryMetadata?: string;
  visibility?: MemorySetVisibility;
  visibilityLabel?: string;
  artwork: ReactNode;
  accessibilityLabel: string;
  accessibilityHint?: string;
  reviewLabel?: string;
  reviewIsDue?: boolean;
  onActions?: () => void;
  layout?: 'grid' | 'library-grid';
  onPress: () => void;
  onLongPress?: () => void;
};

/** Catalogues and legacy memory grids use the same content-card surface. */
export function MemoryLearningCard({ techniqueKey, title, description, metadata, secondaryMetadata,
  visibilityLabel, artwork, accessibilityLabel, accessibilityHint, reviewLabel, onActions, onLongPress, onPress,
}: MemoryLearningCardProps) {
  const { t } = useTranslation('library');
  return <LearningLibraryCardSurface grid title={title} description={description}
    source={[techniqueKey === 'palace' ? t('techniquePalace') : t('techniqueNumberPeg'), visibilityLabel].filter(Boolean).join(' · ')}
    metadata={[metadata, secondaryMetadata].filter(Boolean).join(' · ')} mark="" status={reviewLabel}
    action={t('communityOpenAction')} removeLabel={t('openActions')} menuIcon="ellipsis-horizontal"
    accessibilityLabel={accessibilityLabel} accessibilityHint={accessibilityHint}
    onPress={onPress} onRemove={onActions} onLongPress={onLongPress}
    coverArtwork={<View style={{ width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' }}>{artwork}</View>} />;
}
