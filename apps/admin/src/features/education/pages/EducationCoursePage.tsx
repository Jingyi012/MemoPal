import { useState } from 'react';
import { Button, Card, Popconfirm, Space, Table, Tag, Typography } from 'antd';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../../../auth/AuthContext';
import { PortalPageContainer } from '../../../components/PortalPageContainer';
import { adminPaths } from '../../../navigation/adminPaths';
import { QueryState } from '../components/QueryState';
import { EducationResourceCreateButton } from '../components/EducationResourceCreateButton';
import { EducationObjectiveMemoryRecommendationEditor } from '../components/EducationObjectiveMemoryRecommendationEditor';
import { EducationObjectiveStudyEditor, educationMemoryTypeLabel, LanguageSwitch } from '../components/EducationObjectiveStudyEditor';
import { useEducationCourse, useEducationCourses } from '../hooks/useEducationAuthoring';
import { useCourseClassrooms } from '../hooks/useEducationStudyItems';
import { useEducationText } from '../i18n/useEducationText';

export default function EducationCoursePage() {
  const { courseId = '' } = useParams();
  const { user } = useAuth();
  const { t } = useEducationText();
  const courses = useEducationCourses(user?.id ?? '');
  const data = useEducationCourse(user?.id ?? '', courseId);
  const course = courses.courses.data?.find(item => item.id === courseId);
  const associations = useCourseClassrooms(user?.id ?? '', courseId, !!course);
  const [openObjective, setOpenObjective] = useState<string | string[]>();

  return <PortalPageContainer eyebrow={t('courseEyebrow')} title={course?.title ?? t('courseEyebrow')} description={t('courseDescription')} actions={<Space wrap>
    <LanguageSwitch />
    <Popconfirm title={course?.isPublic ? t('privateCourse') : t('publicCourse')} description={t('publishConfirm')}
      okText={course?.isPublic ? t('unpublish') : t('publish')} cancelText={t('cancel')}
      onConfirm={() => courses.setCourseVisibility.mutate({ courseId, isPublic: !course?.isPublic })}>
      <Button loading={courses.setCourseVisibility.isPending} disabled={!course}>{course?.isPublic ? t('unpublish') : t('publish')}</Button>
    </Popconfirm>
    <EducationResourceCreateButton label={t('addObjective')} noun={t('objectives')} loading={data.createObjective.isPending} memorySets={data.memorySets.data} onSubmit={(title, recommendedMemorySetId) => data.createObjective.mutate({ title, recommendedMemorySetId })} />
    <EducationResourceCreateButton label={t('createAssessment')} noun={t('assessment')} loading={data.createAssessment.isPending} onSubmit={title => data.createAssessment.mutate(title)} />
  </Space>}>
    {!courses.courses.isPending && !course && <Typography.Text role="alert" type="danger">{t('loadError')}</Typography.Text>}
    <Card title={t('objectives')} style={{ marginBottom: 20 }}>
      <QueryState query={data.objectives} emptyText={t('objectiveEmpty')}>{rows => <Table rowKey="id" pagination={false} expandable={{
        expandedRowKeys: Array.isArray(openObjective) ? openObjective : openObjective ? [openObjective] : [],
        onExpand: (expanded, row) => setOpenObjective(expanded ? row.id : undefined),
        expandedRowRender: row => <EducationObjectiveStudyEditor courseId={courseId} objective={row} isPublic={course?.isPublic ?? false} />,
      }} dataSource={rows} columns={[
        { title: t('objectives'), dataIndex: 'title' },
        { title: t('memoryType'), dataIndex: 'memoryContentType', render: (value: string | undefined) => t(educationMemoryTypeLabel(value)) },
        { title: t('memoryRecommendation'), dataIndex: 'recommendedMemorySetId', render: (id: string | null, row) => <EducationObjectiveMemoryRecommendationEditor
          objectiveId={row.id} currentId={id} memorySets={data.memorySets.data ?? []} loading={data.setMemoryRecommendation.isPending}
          onSave={(objectiveId, recommendedMemorySetId) => data.setMemoryRecommendation.mutate({ objectiveId, recommendedMemorySetId })}
        /> },
        { title: t('review'), dataIndex: 'reviewStatus', render: (value?: string) => <Tag color={value === 'TeacherReviewed' ? 'green' : 'gold'}>{value === 'TeacherReviewed' ? t('teacherReviewed') : t('unreviewed')}</Tag> },
        { title: t('assessment'), dataIndex: 'createdAt', render: (date: string) => new Date(date).toLocaleDateString() },
      ]} />}</QueryState>
    </Card>
    {course && <Card title={t('classrooms')} style={{ marginBottom: 20 }}>
      <QueryState query={associations.classrooms} emptyText={t('noClassrooms')}>{rows => <Table size="small" rowKey="classroomId" pagination={false} dataSource={rows} columns={[
        { title: t('classroom'), dataIndex: 'classroomName' },
        { title: t('classCourses'), dataIndex: 'attachedAtUtc', render: (date: string) => new Date(date).toLocaleDateString() },
        { title: '', render: (_: unknown, row) => <Popconfirm title={t('unlinkTitle')} description={t('unlinkDescription')} okText={t('unlink')} cancelText={t('cancel')} onConfirm={() => associations.detach.mutate(row.classroomId)}>
          <Button danger loading={associations.detach.isPending}>{t('unlink')}</Button>
        </Popconfirm> },
      ]} />}</QueryState>
    </Card>}
    <Card title={t('assessment')}>
      <QueryState query={data.assessments} emptyText={t('assessmentEmpty')}>{rows => <Table rowKey="id" pagination={false} dataSource={rows} columns={[
        { title: t('assessment'), dataIndex: 'title', render: (title: string, row) => <Link to={adminPaths.educationAssessment(row.id)}>{title}</Link> },
        { title: t('review'), dataIndex: 'status', render: (status: string, row) => <Space><Tag color={status === 'published' ? 'green' : 'gold'}>{status}</Tag>{row.isPublicPractice && <Tag color="blue">Public practice</Tag>}</Space> },
        { title: 'Questions', dataIndex: 'questions', render: (questions: unknown[]) => questions.length },
        { title: 'Version', dataIndex: 'version' },
        { title: '', key: 'action', render: (_: unknown, row) => <Link to={adminPaths.educationAssessment(row.id)}>{row.status === 'draft' ? 'Edit draft' : 'View'}</Link> },
      ]} />}</QueryState>
    </Card>
  </PortalPageContainer>;
}
