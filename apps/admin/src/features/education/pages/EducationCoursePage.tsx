import { useEffect, useRef, useState } from 'react';
import { EducationCourseAudienceForm } from '../components/EducationCourseAudienceForm';
import { EducationBackLink } from '../components/EducationBackLink';
import { EducationCourseOutlineEditor } from '../components/EducationCourseOutlineEditor';
import { Alert, Button, Card, Input, Modal, Popconfirm, Space, Table, Tabs, Tag, Typography } from 'antd';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../../auth/AuthContext';
import { PortalPageContainer } from '../../../components/PortalPageContainer';
import { adminPaths } from '../../../navigation/adminPaths';
import { QueryState } from '../components/QueryState';
import { EducationResourceCreateButton } from '../components/EducationResourceCreateButton';
import { educationMemoryTypeLabel } from '../components/EducationObjectiveStudyEditor';
import { useEducationCourse, useEducationCourses } from '../hooks/useEducationAuthoring';
import { useCourseClassrooms } from '../hooks/useEducationStudyItems';
import { useEducationText } from '../i18n/useEducationText';

export default function EducationCoursePage() {
  const { courseId = '' } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t, language } = useEducationText();
  const courses = useEducationCourses(user?.id ?? '');
  const data = useEducationCourse(user?.id ?? '', courseId);
  const course = courses.courses.data?.find(item => item.id === courseId);
  const associations = useCourseClassrooms(user?.id ?? '', courseId, !!course);
  const [titleModalOpen, setTitleModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const revisionGate = useRef(false);
  const [creatingRevisionId, setCreatingRevisionId] = useState<string | null>(null);

  useEffect(() => setTitle(course?.title ?? ''), [course?.title]);

  const sections = [
    { key: 'outline', label: language === 'zh-Hans' ? '单元与路径' : 'Units & path', destroyOnHidden: false, children: data.objectives.isPending ? <Card loading /> : data.objectives.isError ? <Alert type="error" message={t('loadError')} action={<Button onClick={() => void data.objectives.refetch()}>{t('retry')}</Button>} /> : <EducationCourseOutlineEditor userId={user?.id ?? ''} courseId={courseId} objectives={data.objectives.data ?? []} /> },
    { key: 'objectives', label: t('objectives'), children: <Card className="education-course-objectives-card" title={t('objectives')} extra={<EducationResourceCreateButton label={t('addObjective')} noun={t('objectives')} loading={data.createObjective.isPending} memorySets={data.memorySets.data} onSubmit={(title, recommendedMemorySetId) => data.createObjective.mutate({ title, recommendedMemorySetId })} />}>
      <QueryState query={data.objectives} emptyText={t('objectiveEmpty')}>{rows => <Table rowKey="id" scroll={{ x: 'max-content' }} pagination={{ pageSize: 10 }} dataSource={rows} columns={[
        { title: t('objectives'), dataIndex: 'title', render: (title: string, row) => <Link to={adminPaths.educationObjective(courseId, row.id)}>{title}</Link> },
        { title: t('memoryType'), dataIndex: 'memoryContentType', render: (value: string | undefined) => t(educationMemoryTypeLabel(value)) },
        { title: t('review'), dataIndex: 'reviewStatus', render: (value?: string) => <Tag color={value === 'TeacherReviewed' ? 'green' : 'gold'}>{value === 'TeacherReviewed' ? t('teacherReviewed') : t('unreviewed')}</Tag> },
        { title: t('created'), dataIndex: 'createdAt', render: (date: string) => new Date(date).toLocaleDateString() },
        { title: '', key: 'action', render: (_: unknown, row) => <Link to={adminPaths.educationObjective(courseId, row.id)}>{t('manageContent')}</Link> },
      ]} />}</QueryState>
    </Card> },
    { key: 'assessments', label: t('assessment'), children: <Card className="education-course-assessment-card" title={t('assessment')} extra={<EducationResourceCreateButton label={t('createAssessment')} noun={t('assessment')} loading={data.createAssessment.isPending} onSubmit={title => data.createAssessment.mutate(title)} />}>
      <Alert type="info" showIcon message={t('publishedRevisionInfo')} description={t('revisionDraftInfo')} style={{ marginBottom: 16 }} />
      <QueryState query={data.assessments} emptyText={t('assessmentEmpty')}>{rows => <Table rowKey="id" scroll={{ x: 'max-content' }} pagination={false} dataSource={rows} columns={[
        { title: t('assessment'), dataIndex: 'title', render: (title: string, row) => <Link to={adminPaths.educationAssessment(row.id)}>{title}</Link> },
        { title: t('status'), dataIndex: 'status', render: (status: string, row) => <Space><Tag color={status === 'published' ? 'green' : 'gold'}>{status}</Tag>{row.status === 'published' && <Tag color={row.isPublicPractice ? 'blue' : 'default'}>{row.isPublicPractice ? t('practiceVisible') : t('practiceHidden')}</Tag>}</Space> },
        { title: t('questions'), dataIndex: 'questions', render: (questions: unknown[]) => questions.length },
        { title: t('version'), dataIndex: 'version' },
        { title: '', key: 'action', render: (_: unknown, row) => <Space wrap>
          <Link to={adminPaths.educationAssessment(row.id)}>{row.status === 'draft' ? t('editDraft') : t('view')}</Link>
          {row.status === 'published' && <>
            {!course?.isPlatformCourse && <Link to={`${adminPaths.educationFamilyAssignments}?courseId=${encodeURIComponent(courseId)}&assessmentId=${encodeURIComponent(row.id)}`}>
              {language === 'zh-Hans' ? '分配给孩子' : 'Assign to children'}
            </Link>}
            <Popconfirm title={row.isPublicPractice ? t('hidePractice') : t('showPracticeConfirm')}
              description={!row.isPublicPractice ? t('showPracticeConfirm') : undefined}
              okText={row.isPublicPractice ? t('unpublish') : t('showPractice')} cancelText={t('cancel')}
              onConfirm={() => data.setAssessmentPublicPractice.mutate({ assessmentId: row.id,
                isPublicPractice: !row.isPublicPractice, notConfidentialExamContent: !row.isPublicPractice })}>
              <Button size="small" loading={data.setAssessmentPublicPractice.isPending}>
                {row.isPublicPractice ? t('hidePractice') : t('showPractice')}
              </Button>
            </Popconfirm>
            <Button size="small" loading={creatingRevisionId === row.id}
              disabled={revisionGate.current || (!!creatingRevisionId && creatingRevisionId !== row.id)}
              onClick={() => void createRevision(row.id, row.version)}>{t('createRevisionDraft')}</Button>
          </>}
        </Space> },
      ]} />}</QueryState>
    </Card> },
    ...(course ? [{ key: 'classrooms', label: t('classrooms'), children: <Card className="education-course-classrooms-card" title={t('classrooms')} extra={<Link to={adminPaths.educationClassrooms}>{t('openClassrooms')}</Link>}>
      <Typography.Paragraph type="secondary">{t('classroomManagementHelp')}</Typography.Paragraph>
      <QueryState query={associations.classrooms} emptyText={t('noClassrooms')}>{rows => <Table size="small" rowKey="classroomId" scroll={{ x: 'max-content' }} pagination={false} dataSource={rows} columns={[
        { title: t('classroom'), dataIndex: 'classroomName' },
        { title: t('attachedOn'), dataIndex: 'attachedAtUtc', render: (date: string) => new Date(date).toLocaleDateString() },
        { title: '', render: (_: unknown, row) => <Popconfirm title={t('unlinkTitle')} description={t('unlinkDescription')} okText={t('unlink')} cancelText={t('cancel')} onConfirm={() => associations.detach.mutate(row.classroomId)}>
          <Button danger loading={associations.detach.isPending}>{t('unlink')}</Button>
        </Popconfirm> },
      ]} />}</QueryState>
    </Card> }, { key: 'settings', label: t('courseSettings'), children: <Space direction="vertical" size="middle" style={{ display: 'flex' }}>
      <Card title={t('editCourseTitle')} extra={<Button onClick={() => setTitleModalOpen(true)}>{t('editTitle')}</Button>}>
        <Typography.Text>{course.title}</Typography.Text>
      </Card>
      <EducationCourseAudienceForm course={course} saving={courses.updateCourseAudience.isPending} onSave={audience => courses.updateCourseAudience.mutateAsync({ courseId, audience })} />
      <Card title={t('publicVisibility')}>
        <Typography.Paragraph type="secondary">{t('publicVisibilityDescription')}</Typography.Paragraph>
        <Space wrap>
          <Tag color={course.isPublic ? 'green' : 'default'}>{course.isPublic ? t('publicStatus') : t('privateStatus')}</Tag>
          <Typography.Text type="secondary">{course.isPublic ? t('publicVisibilityOn') : t('publicVisibilityOff')}</Typography.Text>
        </Space>
        <div style={{ marginTop: 16 }}>
          <Popconfirm title={course.isPublic ? t('privateCourse') : t('publicCourse')} description={t('publishConfirm')}
            okText={course.isPublic ? t('unpublish') : t('publish')} cancelText={t('cancel')}
            onConfirm={() => courses.setCourseVisibility.mutate({ courseId, isPublic: !course.isPublic })}>
            <Button danger={course.isPublic} loading={courses.setCourseVisibility.isPending}>
              {course.isPublic ? t('unpublish') : t('publish')}
            </Button>
          </Popconfirm>
        </div>
      </Card>
    </Space> }] : []),
  ];

  return <PortalPageContainer className="education-course-page" eyebrow={t('courseEyebrow')} title={course?.title ?? t('courseEyebrow')} description={t('courseDescription')}
    navigation={<EducationBackLink to={adminPaths.educationCourses}>{language === 'zh-Hans' ? '返回课程列表' : 'Back to courses'}</EducationBackLink>}>
    <Modal title={t('editTitle')} open={titleModalOpen} okText={t('saveTitle')} cancelText={t('cancel')} confirmLoading={courses.updateCourseTitle.isPending}
      okButtonProps={{ disabled: !title.trim() || title.trim() === course?.title }} onCancel={() => setTitleModalOpen(false)}
      onOk={async () => { await courses.updateCourseTitle.mutateAsync({ courseId, title: title.trim() }); setTitleModalOpen(false); }}>
      <Input aria-label={t('updateTitle')} value={title} maxLength={200} onChange={event => setTitle(event.target.value)} />
    </Modal>
    {!courses.courses.isPending && !course && <Typography.Text role="alert" type="danger">{t('loadError')}</Typography.Text>}
    <Tabs className="education-course-tabs" items={sections} destroyOnHidden />
  </PortalPageContainer>;

  async function createRevision(assessmentId: string, expectedVersion: number) {
    if (revisionGate.current) return;
    revisionGate.current = true;
    setCreatingRevisionId(assessmentId);
    try {
      const draft = await data.createRevisionDraft.mutateAsync({ assessmentId, expectedVersion });
      navigate(adminPaths.educationAssessment(draft.id));
    } catch {
      revisionGate.current = false;
      setCreatingRevisionId(null);
    }
  }
}
