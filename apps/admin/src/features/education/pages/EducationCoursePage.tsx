import { Button, Card, Popconfirm, Space, Table, Tag } from 'antd';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../../../auth/AuthContext';
import { PortalPageContainer } from '../../../components/PortalPageContainer';
import { adminPaths } from '../../../navigation/adminPaths';
import { QueryState } from '../components/QueryState';
import { EducationResourceCreateButton } from '../components/EducationResourceCreateButton';
import { EducationObjectiveMemoryRecommendationEditor } from '../components/EducationObjectiveMemoryRecommendationEditor';
import { useEducationCourse, useEducationCourses } from '../hooks/useEducationAuthoring';

export default function EducationCoursePage() {
  const { courseId = '' } = useParams();
  const { user } = useAuth();
  const courses = useEducationCourses(user?.id ?? '');
  const data = useEducationCourse(user?.id ?? '', courseId);
  const course = courses.courses.data?.find(item => item.id === courseId);
  return <PortalPageContainer eyebrow="Course" title={course?.title ?? 'Course'} description="Define objectives and create versioned assessments." actions={<>
    <Popconfirm
      title={course?.isPublic ? 'Remove this course from public practice?' : 'Publish this course for public practice?'}
      description={course?.isPublic ? 'People will no longer be able to discover or open it.' : 'Anyone can discover and practice its published objective questions. Public content is not suitable for confidential assessments.'}
      okText={course?.isPublic ? 'Unpublish' : 'Publish'}
      cancelText="Cancel"
      onConfirm={() => courses.setCourseVisibility.mutate({ courseId, isPublic: !course?.isPublic })}
    >
      <Button loading={courses.setCourseVisibility.isPending} disabled={!course}>
        {course?.isPublic ? 'Unpublish public practice' : 'Publish for public practice'}
      </Button>
    </Popconfirm>
    <EducationResourceCreateButton label="Add objective" noun="Objective" loading={data.createObjective.isPending} memorySets={data.memorySets.data} onSubmit={(title, recommendedMemorySetId) => data.createObjective.mutate({ title, recommendedMemorySetId })} />
    <EducationResourceCreateButton label="Create assessment" noun="Assessment" loading={data.createAssessment.isPending} onSubmit={title => data.createAssessment.mutate(title)} />
  </>}>
    <Card title="Learning objectives" style={{ marginBottom: 20 }}><QueryState query={data.objectives} emptyText="Add objectives to organize evidence of learning.">{rows => <Table rowKey="id" pagination={false} dataSource={rows} columns={[
      { title: 'Objective', dataIndex: 'title' },
      { title: 'Recommended memory practice', dataIndex: 'recommendedMemorySetId', render: (id: string | null, row) => <EducationObjectiveMemoryRecommendationEditor
        objectiveId={row.id}
        currentId={id}
        memorySets={data.memorySets.data ?? []}
        loading={data.setMemoryRecommendation.isPending}
        onSave={(objectiveId, recommendedMemorySetId) => data.setMemoryRecommendation.mutate({ objectiveId, recommendedMemorySetId })}
      /> },
      { title: 'Created', dataIndex: 'createdAt', render: (date: string) => new Date(date).toLocaleDateString() },
    ]} />}</QueryState></Card>
    <Card title="Assessments"><QueryState query={data.assessments} emptyText="Create a draft assessment to add questions.">{rows => <Table rowKey="id" pagination={false} dataSource={rows} columns={[
      { title: 'Assessment', dataIndex: 'title', render: (title: string, row) => <Link to={adminPaths.educationAssessment(row.id)}>{title}</Link> },
      { title: 'Status', dataIndex: 'status', render: (status: string, row) => <Space>
        <Tag color={status === 'published' ? 'green' : 'gold'}>{status}</Tag>
        {row.isPublicPractice && <Tag color="blue">Public practice</Tag>}
      </Space> },
      { title: 'Questions', dataIndex: 'questions', render: (questions: unknown[]) => questions.length },
      { title: 'Version', dataIndex: 'version' },
      { title: '', key: 'action', render: (_: unknown, row) => <Link to={adminPaths.educationAssessment(row.id)}>{row.status === 'draft' ? 'Edit draft' : 'View'}</Link> },
    ]} />}</QueryState></Card>
  </PortalPageContainer>;
}
