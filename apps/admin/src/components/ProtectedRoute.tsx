import { Flex, Spin, Typography } from 'antd';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { adminPaths } from '../navigation/adminPaths';

function LoadingState() {
  return (
    <Flex align='center' gap={12} style={{ padding: 24 }}>
      <Spin size='small' />
      <Typography.Text type='secondary'>Loading...</Typography.Text>
    </Flex>
  );
}

export function ProtectedRoute() {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingState />;
  }

  if (!user) {
    return <Navigate to={adminPaths.login} replace />;
  }

  return <Outlet />;
}

export function AdminRoute() {
  const { user, loading, isAdmin } = useAuth();

  if (loading) {
    return <LoadingState />;
  }

  if (!user) {
    return <Navigate to={adminPaths.login} replace />;
  }

  if (!isAdmin) {
    return <Navigate to={adminPaths.forbidden} replace />;
  }

  return <Outlet />;
}
