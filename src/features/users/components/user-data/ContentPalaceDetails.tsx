import { Alert, Card, Spin } from 'antd';
import { useNavigate } from 'react-router-dom';
import { PalaceDetailsWorkspace } from '../../../content/components/palace-setup/PalaceDetailsWorkspace';
import { useUserPalaceContentData } from '../../hooks/useUserPalaceContentData';
import type { LessonDto } from '../../../../types/content';
import { adminPaths } from '../../../../navigation/adminPaths';

interface ContentPalaceDetailsProps {
  userId: string;
  palaceId: string;
  scope: 'custom' | 'predefined';
}

export function ContentPalaceDetails({ userId, palaceId, scope }: ContentPalaceDetailsProps) {
  const navigate = useNavigate();
  const { palaceQuery, locationsQuery, lessonsQuery, refreshAll } = useUserPalaceContentData({ userId, palaceId });

  const handleChanged = async () => {
    await refreshAll();
  };

  if (palaceQuery.isLoading) {
    return (
      <Card>
        <Spin />
      </Card>
    );
  }

  if (palaceQuery.isError || !palaceQuery.data) {
    return <Alert type='error' showIcon message='Failed to load palace details.' />;
  }

  const isCustomScope = scope === 'custom';
  const lessons: LessonDto[] = (lessonsQuery.data ?? []).map((lesson) => ({
    id: lesson.id,
    palaceId: lesson.palaceId,
    title: lesson.title,
    description: lesson.description ?? null,
    wordCount: lesson.wordCount,
    category: lesson.category ?? null,
    tag: lesson.tag ?? null,
    isCustom: lesson.isCustom ?? null,
    isLocked: lesson.isLocked ?? null,
    completed: lesson.completed ?? null,
    isPremium: lesson.isPremium ?? null,
    privacy: lesson.privacy,
    createdBy: lesson.createdBy ?? null,
    progress: null,
    words: null,
    createdAt: lesson.createdAt,
    updatedAt: lesson.updatedAt,
    isDeleted: lesson.isDeleted,
    deletedAt: lesson.deletedAt ?? null,
  }));

  return (
    <PalaceDetailsWorkspace
      palaceId={palaceId}
      palace={palaceQuery.data}
      locations={locationsQuery.data ?? []}
      lessons={lessons}
      locationsLoading={locationsQuery.isLoading}
      lessonsLoading={lessonsQuery.isLoading}
      onChanged={handleChanged}
      showBackButton={false}
      editablePalace={isCustomScope}
      editableLocations={isCustomScope}
      canCreateLesson={false}
      lessonsLabel={`User Lessons (${lessons.length})`}
      onConfigureLessonWords={(lessonId) => navigate(adminPaths.userDataLessonWords(userId, palaceId, lessonId))}
    />
  );
}
