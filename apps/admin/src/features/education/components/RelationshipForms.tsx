import { Button, Form, Input, Modal, Select, Typography } from 'antd';
import { useState } from 'react';
import { useEducationText } from '../i18n/useEducationText';
import type { CreateClassroomRequest, CreateGuardianLinkRequest, InviteClassroomMemberRequest } from '../../../types/educationRelationships';

export function CreateClassroomButton({ onSubmit, loading }: { onSubmit: (value: CreateClassroomRequest) => void; loading: boolean }) {
  const [open, setOpen] = useState(false);
  return <><Button type="primary" onClick={() => setOpen(true)}>Create classroom</Button><Modal title="Create classroom" open={open} onCancel={() => setOpen(false)} footer={null} destroyOnClose>
    <Form layout="vertical" onFinish={value => { onSubmit(value); setOpen(false); }}><Form.Item name="name" label="Classroom name" rules={[{ required: true }, { max: 120 }]}><Input maxLength={120} /></Form.Item><Button type="primary" htmlType="submit" loading={loading}>Create</Button></Form>
  </Modal></>;
}

export function InviteMemberForm({ onSubmit, loading }: { onSubmit: (value: InviteClassroomMemberRequest) => void; loading: boolean }) {
  const [open, setOpen] = useState(false);
  return <>
    <Button type="primary" onClick={() => setOpen(true)}>Invite member</Button>
    <Modal title="Invite a classroom member" open={open} onCancel={() => !loading && setOpen(false)} footer={null} destroyOnClose>
      <Typography.Paragraph type="secondary">Ask them to copy their account ID from Education → Assignments.</Typography.Paragraph>
      <Form layout="vertical" onFinish={value => { onSubmit(value); setOpen(false); }} initialValues={{ role: 'student' }}>
        <Form.Item name="userId" label="MemoPal account ID" rules={[{ required: true, message: 'Enter a MemoPal account ID.' }]}><Input /></Form.Item>
        <Form.Item name="role" label="Invite as"><Select options={[{ value: 'student', label: 'Student' }, { value: 'teacher', label: 'Teacher' }]} /></Form.Item>
        <Button type="primary" htmlType="submit" loading={loading}>Send invitation</Button>
      </Form>
    </Modal>
  </>;
}

export function CreateGuardianLinkForm({ onSubmit, loading }: { onSubmit: (value: CreateGuardianLinkRequest) => Promise<unknown>; loading: boolean }) {
  const { t } = useEducationText();
  const [open, setOpen] = useState(false);
  const [form] = Form.useForm<CreateGuardianLinkRequest>();
  return <>
    <Button type="primary" onClick={() => setOpen(true)}>{t('guardianRequest')}</Button>
    <Modal title={t('guardianRequest')} open={open} footer={null} onCancel={() => !loading && setOpen(false)} destroyOnHidden>
      <Typography.Paragraph type="secondary">{t('guardianCreateDescription')}</Typography.Paragraph>
      <Form form={form} layout="vertical" onFinish={async values => {
        try {
          await onSubmit({ studentUserId: values.studentUserId.trim() });
          form.resetFields();
          setOpen(false);
        } catch { /* The mutation shows the error; preserve input for retry. */ }
      }}>
        <Form.Item name="studentUserId" label={t('guardianStudentId')} rules={[{ required: true, whitespace: true }]}>
          <Input autoComplete="off" disabled={loading} />
        </Form.Item>
        <Button type="primary" htmlType="submit" loading={loading}>{t('guardianRequest')}</Button>
      </Form>
    </Modal>
  </>;
}
