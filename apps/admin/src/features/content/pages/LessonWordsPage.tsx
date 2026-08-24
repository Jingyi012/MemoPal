import { Alert } from 'antd';
import { useNavigate, useParams } from 'react-router-dom';
import { PortalPageContainer } from '../../../components/PortalPageContainer';
import { adminPaths } from '../../../navigation/adminPaths';
import { LessonWordsWorkspace } from '../components/lesson-words/LessonWordsWorkspace';

export default function LessonWordsPage() {
  const { palaceId, lessonId } = useParams<{ palaceId: string; lessonId: string }>();
  const navigate = useNavigate();

  if (!palaceId || !lessonId) {
    return <Alert type='error' showIcon message='Missing palace or lesson id.' />;
  }

  return (
    <PortalPageContainer>
      <LessonWordsWorkspace
        palaceId={palaceId}
        lessonId={lessonId}
        onBack={() => navigate(adminPaths.palaceDetails(palaceId))}
      />
    </PortalPageContainer>
  );
}
