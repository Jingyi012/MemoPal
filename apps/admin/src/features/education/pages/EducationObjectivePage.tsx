import { Card, Result, Spin } from 'antd';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../../../auth/AuthContext';
import { PortalPageContainer } from '../../../components/PortalPageContainer';
import { adminPaths } from '../../../navigation/adminPaths';
import { QueryState } from '../components/QueryState';
import { EducationObjectiveMemoryRecommendationEditor } from '../components/EducationObjectiveMemoryRecommendationEditor';
import { EducationObjectiveStudyEditor } from '../components/EducationObjectiveStudyEditor';
import { useEducationCourse, useEducationCourses } from '../hooks/useEducationAuthoring';
import { useEducationText } from '../i18n/useEducationText';

export default function EducationObjectivePage() {
  const { courseId = '', objectiveId = '' } = useParams();
  const { user } = useAuth();
  const { t } = useEducationText();
  const userId = user?.id ?? '';
  const courses = useEducationCourses(userId);
  const data = useEducationCourse(userId, courseId);
  const course = courses.courses.data?.find(item => item.id === courseId);

  return <PortalPageContainer
    eyebrow={course?.title ?? t('courseEyebrow')}
    title={t('objectivePageTitle')}
    description={t('objectivePageDescription')}
    navigation={<p><Link to={adminPaths.educationCourse(courseId)}>← {t('backToCourse')}</Link></p>}
  >
    <QueryState query={data.objectives} emptyText={t('objectiveEmpty')}>{objectives => {
      const objective = objectives.find(item => item.id === objectiveId);
      if (!objective) return <Result status="404" title="404" subTitle={t('loadError')} />;
      return <>
        <Card title={`${objective.title} · ${t('memoryRecommendation')}`} style={{ marginBottom: 20 }}>
          <EducationObjectiveMemoryRecommendationEditor
            objectiveId={objective.id}
            currentId={objective.recommendedMemorySetId}
            memorySets={data.memorySets.data ?? []}
            loading={data.setMemoryRecommendation.isPending}
            onSave={(id, recommendedMemorySetId) => data.setMemoryRecommendation.mutate({ objectiveId: id, recommendedMemorySetId })}
          />
        </Card>
        {course ? <EducationObjectiveStudyEditor courseId={courseId} objective={objective} isPublic={course.isPublic} />
          : courses.courses.isPending ? <Spin /> : <Result status="404" title="404" subTitle={t('loadError')} />}
      </>;
    }}</QueryState>
  </PortalPageContainer>;
}
