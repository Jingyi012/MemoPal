import "../components/portal.css";
import { Button, Flex, Result } from 'antd';
import { useNavigate } from 'react-router-dom';
import { adminPaths } from '../navigation/adminPaths';

export default function ForbiddenPage() {
  const navigate = useNavigate();

  return (
    <Flex
      align='center'
      justify='center'
      className='portal-auth'
    >
      <Result
        status='403'
        title='Admin access required'
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
