import { Alert } from 'antd';
import { useNavigate, useParams } from 'react-router-dom';
import { PortalPageContainer } from '../../../components/PortalPageContainer';
import { adminPaths } from '../../../navigation/adminPaths';
import { LessonWordsWorkspace } from '../../content/components/lesson-words/LessonWordsWorkspace';

export default function UserLessonWordsPage() {
  const { userId, palaceId, lessonId } = useParams<{ userId: string; palaceId: string; lessonId: string }>();
  const navigate = useNavigate();

  if (!userId || !palaceId || !lessonId) {
    return <Alert type='error' showIcon message='Missing user, palace, or lesson id.' />;
  }

  return (
    <PortalPageContainer>
      <LessonWordsWorkspace
        palaceId={palaceId}
        lessonId={lessonId}
        onBack={() => navigate(adminPaths.userData(userId))}
      />
    </PortalPageContainer>
  );
}
