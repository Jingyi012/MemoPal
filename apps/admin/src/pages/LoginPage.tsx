import { LockOutlined, UserOutlined } from '@ant-design/icons';
import { Alert, Button, Card, Flex, Form, Input, Typography } from 'antd';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { adminPaths } from '../navigation/adminPaths';

type LoginFormValues = {
  email: string;
  password: string;
};

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form] = Form.useForm<LoginFormValues>();

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async (values: LoginFormValues) => {
    setError('');
    setLoading(true);
    try {
      await login(values.email, values.password);
      navigate(adminPaths.users);
    } catch {
      setError('Login failed. Check credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Flex
      align='center'
      justify='center'
      style={{ minHeight: '100vh', padding: 16, background: '#f1f5f9' }}
    >
      <Card style={{ width: '100%', maxWidth: 420 }}>
        <Typography.Title level={3} style={{ marginBottom: 4 }}>
          MemoPal
        </Typography.Title>
        <Typography.Text type='secondary'>Sign in to continue.</Typography.Text>

        <Form<LoginFormValues>
          form={form}
          layout='vertical'
          onFinish={onSubmit}
          style={{ marginTop: 20 }}
          initialValues={{ email: '', password: '' }}
        >
          <Form.Item
            name='email'
            label='Email'
            rules={[
              { required: true, message: 'Email is required.' },
              { type: 'email', message: 'Please enter a valid email address.' },
            ]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder='admin@memopal.local'
              autoComplete='email'
            />
          </Form.Item>

          <Form.Item
            name='password'
            label='Password'
            rules={[{ required: true, message: 'Password is required.' }]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder='Enter password'
              autoComplete='current-password'
            />
          </Form.Item>

          {error ? <Alert type='error' showIcon message={error} style={{ marginBottom: 16 }} /> : null}

          <Form.Item style={{ marginBottom: 0 }}>
            <Button type='primary' htmlType='submit' block loading={loading}>
              Sign in
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </Flex>
  );
}
