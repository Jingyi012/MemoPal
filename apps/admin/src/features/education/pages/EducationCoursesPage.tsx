import { Card, Space, Table, Tag } from 'antd';
import { EducationStudyCourseDraftButton } from '../components/EducationStudyCourseDraftButton';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../auth/AuthContext';
import { PortalPageContainer } from '../../../components/PortalPageContainer';
import { adminPaths } from '../../../navigation/adminPaths';
import { QueryState } from '../components/QueryState';
import { EducationResourceCreateButton } from '../components/EducationResourceCreateButton';
import { useEducationCourses } from '../hooks/useEducationAuthoring';
import { useEducationText } from '../i18n/useEducationText';

export default function EducationCoursesPage() {
  const { user } = useAuth();
  const { t } = useEducationText();
  const data = useEducationCourses(user?.id ?? '');
  return <PortalPageContainer eyebrow="Learning workspace" title="Courses" description="Create learning materials for yourself, your class, or public independent practice." actions={
    <Space wrap><EducationStudyCourseDraftButton /><EducationResourceCreateButton label="Create course" noun="Course" loading={data.createCourse.isPending} onSubmit={title => data.createCourse.mutate(title)} /></Space>
  }>
    <Card><QueryState query={data.courses} emptyText="Create your first course to get started.">{courses => <Table rowKey="id" dataSource={courses} pagination={{ pageSize: 10 }} columns={[
      { title: 'Course', dataIndex: 'title', render: (title: string, row) => <>{row.isPlatformCourse && <Tag color="purple">{t('platformCourse')}</Tag>} <Link to={adminPaths.educationCourse(row.id)}>{title}</Link></> },
      { title: 'Visibility', dataIndex: 'isPublic', render: (isPublic: boolean) => <Tag color={isPublic ? 'green' : 'default'}>{isPublic ? 'Public practice' : 'Private'}</Tag> },
      { title: 'Created', dataIndex: 'createdAt', render: (date: string) => new Date(date).toLocaleDateString() },
      { title: '', key: 'action', render: (_: unknown, row) => <Link to={adminPaths.educationCourse(row.id)}>Open</Link> },
    ]} />}</QueryState></Card>
  </PortalPageContainer>;
}
