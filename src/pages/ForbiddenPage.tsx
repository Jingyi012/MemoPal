import { Button, Flex, Result } from 'antd';
import { useNavigate } from 'react-router-dom';
import { adminPaths } from '../navigation/adminPaths';

export default function ForbiddenPage() {
  const navigate = useNavigate();

  return (
    <Flex
      align='center'
      justify='center'
      style={{ minHeight: '100vh', padding: 16, background: '#f1f5f9' }}
    >
      <Result
        status='403'
        title='403'
        subTitle='You need elevated permissions to access this dashboard.'
        extra={
          <Button type='primary' onClick={() => navigate(adminPaths.login)}>
            Back to Login
          </Button>
        }
      />
    </Flex>
  );
}
