import { Card, Col, Row, Tag, Typography } from 'antd';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../auth/AuthContext';
import { PortalPageContainer } from '../../../components/PortalPageContainer';
import { adminPaths } from '../../../navigation/adminPaths';
import { CreateClassroomButton } from '../components/RelationshipForms';
import { QueryState } from '../components/QueryState';
import { useEducationRelationships } from '../hooks/useEducationRelationships';

export default function EducationClassroomsPage() {
  const { user } = useAuth();
  const relationships = useEducationRelationships(user?.id ?? '');

  return <PortalPageContainer
    className="education-classrooms-page"
    eyebrow="Learning Studio"
    title="Classrooms"
    description="Choose a classroom to manage its members, courses, classwork, and learning progress."
    actions={<CreateClassroomButton loading={relationships.createClassroom.isPending} onSubmit={input => relationships.createClassroom.mutate(input)} />}
  >
    <QueryState query={relationships.classrooms} emptyText="No classrooms yet. Create a classroom or accept an invitation to get started.">
      {classrooms => <Row gutter={[16, 16]}>
        {classrooms.map(classroom => <Col key={classroom.id} xs={24} sm={12} xl={8}>
          <Card className="education-classroom-card" title={<Link to={adminPaths.educationClassroom(classroom.id)}>{classroom.name}</Link>}>
            <Tag color={classroom.role === 'owner' ? 'blue' : classroom.role === 'teacher' ? 'green' : 'purple'}>{classroom.role}</Tag>
            <Typography.Text type="secondary" style={{ display: 'block', marginTop: 12 }}>
              Created {new Date(classroom.createdAt).toLocaleDateString()}
            </Typography.Text>
            <Link to={adminPaths.educationClassroom(classroom.id)} style={{ display: 'inline-block', marginTop: 20 }}>Open classroom →</Link>
          </Card>
        </Col>)}
      </Row>}
    </QueryState>
  </PortalPageContainer>;
}
