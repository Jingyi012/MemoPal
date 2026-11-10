import type { MemorySet } from '@/features/memory-sets';
import { AppImage } from '@/components/AppImage';
import { LearningLibraryCardSurface } from '@/features/education/components/LearningLibraryCard';
import { useLearningCopy } from '@/features/education/components/LearningUi';

export function MemoryLibraryItemCard({ memorySet, reviewAt, onOpen, onActions, layout, coverImageUrl, coverImageSource }: {
  memorySet: MemorySet; reviewAt?: string; onOpen: () => void; onActions: () => void;
  layout: 'row' | 'grid'; coverImageUrl?: string; coverImageSource?: number;
}) {
  const { zh } = useLearningCopy(); const palace = memorySet.techniqueKey === 'palace';
  const draft = memorySet.status === 'draft'; const archived = memorySet.status === 'archived';
  const validDate = reviewAt && Number.isFinite(Date.parse(reviewAt));
  const due = !!validDate && Date.parse(reviewAt!) <= Date.now();
  const status = archived ? (zh ? '已归档' : 'Archived') : draft ? (zh ? '待完善' : 'Finish setup') : due ? (zh ? '待复习' : 'Review due')
    : validDate ? (zh ? `${new Date(reviewAt!).toLocaleDateString('zh-CN')} 复习` : `Review ${new Date(reviewAt!).toLocaleDateString('en-MY')}`) : (zh ? '可以开始学' : 'Ready to learn');
  return <LearningLibraryCardSurface grid={layout === 'grid'} title={memorySet.title}
    source={`${palace ? (zh ? '记忆宫殿' : 'Memory palace') : (zh ? '数字挂钩' : 'Number pegs')} · ${memorySet.visibility === 'public' ? (zh ? '公开' : 'Public') : (zh ? '私人' : 'Private')}`}
    metadata={`${memorySet.items.length} ${zh ? '个记忆内容' : 'items'}`} mark={palace ? (zh ? '宫殿' : 'Palace') : (zh ? '挂钩' : 'Pegs')}
    status={status} draft={draft} complete={!draft && !archived && !due} action={archived ? (zh ? '查看内容' : 'View content') : draft ? (zh ? '继续编辑' : 'Continue setup') : (zh ? '打开练习' : 'Open practice')}
    onPress={onOpen} onRemove={onActions} removeLabel={`${zh ? '更多操作' : 'More actions'} · ${memorySet.title}`} menuIcon="ellipsis-horizontal" coverIcon={palace ? 'business-outline' : 'keypad-outline'}
    coverArtwork={palace && (coverImageUrl || coverImageSource) ? <AppImage imageUrl={coverImageUrl} imageSource={coverImageSource} style={{ width: '100%', height: '100%' }} /> : undefined} />;
}
