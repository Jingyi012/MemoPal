import { BookOutlined, LogoutOutlined, TeamOutlined, UsergroupAddOutlined } from '@ant-design/icons';
import { Button, Flex, Typography } from 'antd';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../auth/AuthContext';
import { adminPaths } from '../../../navigation/adminPaths';
import { useEducationRelationships } from '../hooks/useEducationRelationships';
import { getEducationWorkspaceCapabilities } from '../utils/educationWorkspaceCapabilities';

export default function EducationLayout() {
  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const relationships = useEducationRelationships(user?.id ?? '', isAdmin);
  const capabilities = getEducationWorkspaceCapabilities({
    userId: user?.id ?? '',
    classrooms: relationships.classrooms.data ?? [],
    memberships: relationships.memberships.data ?? [],
    guardianLinks: relationships.guardianLinks.data ?? [],
  });
  return <div style={{ minHeight: '100vh', background: '#f4f7f5' }}>
    <Flex align="center" justify="space-between" style={{ padding: '16px 28px', background: '#fff', borderBottom: '1px solid #e8eeeb' }}>
      <Link to={adminPaths.education} style={{ color: '#193c38' }}><Typography.Title level={4} style={{ margin: 0 }}><BookOutlined /> MemoPal Learning Studio</Typography.Title></Link>
      <Flex align="center" gap={20}><nav className="portal-section-nav" aria-label="Learning and teaching"><NavLink to={adminPaths.education} end>Home</NavLink>{capabilities.guardian && <NavLink to={adminPaths.educationFamilyAssignments}><UsergroupAddOutlined /> Family practice</NavLink>}<NavLink to={adminPaths.educationCourses}><BookOutlined /> Courses</NavLink><NavLink to={`${adminPaths.education}/guardians`}><TeamOutlined /> Guardian relationships</NavLink></nav><Typography.Text type="secondary">{user?.email}</Typography.Text><Button icon={<LogoutOutlined />} onClick={() => { logout(); navigate(adminPaths.login); }}>Logout</Button></Flex>
    </Flex>
    <main style={{ maxWidth: 1180, margin: '0 auto', padding: '28px 24px' }}><Outlet /></main>
  </div>;
}
