import { ModalForm, ProFormDigit, ProFormSelect, ProFormText } from '@ant-design/pro-components';
import type { ManagedUserDto, ManagedUserUpsertRequest } from '../../../types/user';

type Props = {
  title: string;
  open: boolean;
  initialValues?: ManagedUserDto | Record<string, unknown>;
  requirePassword?: boolean;
  onOpenChange: (open: boolean) => void;
  onFinish: (values: ManagedUserUpsertRequest) => Promise<boolean>;
};

export function UserFormModal({
  title,
  open,
  initialValues,
  requirePassword = false,
  onOpenChange,
  onFinish,
}: Props) {
  return (
    <ModalForm<ManagedUserUpsertRequest>
      title={title}
      open={open}
      initialValues={initialValues}
      onOpenChange={onOpenChange}
      onFinish={onFinish}
    >
      <ProFormText
        name="displayName"
        label="Display Name"
        rules={[{ required: true }]}
        fieldProps={{ placeholder: 'Enter display name' }}
      />
      <ProFormText
        name="email"
        label="Email"
        rules={[{ required: true }]}
        fieldProps={{ placeholder: 'Enter email address' }}
      />
      <ProFormText.Password
        name="password"
        label={requirePassword ? 'Password' : 'Password (optional)'}
        rules={requirePassword ? [{ required: true }] : undefined}
        fieldProps={{ placeholder: requirePassword ? 'Enter password' : 'Enter password (optional)' }}
      />
      <ProFormSelect
        name="role"
        label="Role"
        placeholder='Select role'
        initialValue="User"
        options={[
          { label: 'User', value: 'User' },
          { label: 'Admin', value: 'Admin' },
        ]}
      />
      <ProFormDigit
        name="level"
        label="Level"
        initialValue={1}
        min={1}
        fieldProps={{ placeholder: 'Enter current level' }}
      />
      <ProFormDigit
        name="totalXp"
        label="Total XP"
        initialValue={0}
        min={0}
        fieldProps={{ placeholder: 'Enter total XP' }}
      />
    </ModalForm>
  );
}
